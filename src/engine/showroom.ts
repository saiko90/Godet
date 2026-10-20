// Le showroom 3D : assemble le hall, les baies, les machines, la caméra, les étiquettes et le son, et
// implémente le contrat de src/engine/types.ts.
// Rendu à la demande : la boucle s'endort quand rien ne bouge (économie de batterie) ; les animations de repos
// (plateaux tournants, respiration hydraulique, poussière) ne durent que quelques secondes après la dernière
// interaction.
import * as THREE from 'three';
import { Sfx } from './audio';
import { BayField, STATE_COLORS } from './bays';
import { CameraDirector, machineView, overviewView, standbyView, type Viewport } from './camera';
import { engineDebug, markIdle } from './debug';
import { Dust } from './dust';
import { Gestures } from './gestures';
import { Hall } from './hall';
import { Labels, type LabelPlacement } from './labels';
import { DECK_Y, PLATFORM_R, cameraFree, computeLayout, type HallDims, type Obstacle, type Slot } from './layout';
import { Lights, buildEnvironment } from './lights';
import { MaterialBank, isLightPaint, ownMachineMaterials, releaseOwn, sharedMachineMaterials, type OwnMachineMats, type SharedMachineMats } from './materials';
import { TemplateCache, templateKey } from './models';
import { UNIT, type MatKey } from './models/kit';
import { MachineView, machineScale } from './models/machine';
import { Post } from './post';
import { FpsWatch, QUALITY, initialQuality, lowerQuality, pixelRatioFor } from './quality';
import { Rig, flickerTo } from './rig';
import { patchShaderChunks } from './safety';
import { CodeAtlas, codeTexture, fontsReady } from './textures';
import { Timeline, clamp, damp, easeIn, easeInOut, easeOut, lerp, nextFrame, type Tween } from './tween';
import type { Showroom, ShowroomEffect, ShowroomInsets, ShowroomMachine, ShowroomOptions, ShowroomQuality } from './types';

const PAINT = new THREE.Color('#f3b71b');
const CHALK = new THREE.Color('#ece8de');

interface Entry {
  data: ShowroomMachine;
  key: string;
  view: MachineView;
  own: OwnMachineMats;
  holder: THREE.Group;
  index: number;
  /** Rotation du plateau (ajoutée à l'orientation de repos de la baie). */
  spin: number;
  spinTween: Tween | null;
  spinDir: number;
  /** Jeton d'animation : une nouvelle animation annule la précédente. */
  token: number;
  /** 0 : sous le plateau, 1 : en place. */
  rise: number;
  /** Boîte de sélection (repère du plateau). */
  box: THREE.Box3;
  colorTween: Tween | null;
}

class Superseded extends Error {
  constructor() {
    super('showroom remplacé');
  }
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _ray = new THREE.Ray();
const _ndc = new THREE.Vector2();

function sameMachines(a: ShowroomMachine, b: ShowroomMachine): boolean {
  return (
    a.code === b.code &&
    a.kind === b.kind &&
    a.color === b.color &&
    a.label === b.label &&
    a.state === b.state &&
    a.alerts === b.alerts &&
    (a.weightT ?? null) === (b.weightT ?? null)
  );
}

/** Couleur sûre (hexadécimale ou rgb/hsl) ; sinon jaune engin. Évite les avertissements de THREE.Color. */
function safeColor(c: string): string {
  const v = (c ?? '').trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  if (/^(rgb|hsl)\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)$/i.test(v)) return v;
  return '#f3b71b';
}

export class Engine implements Showroom {
  private o: ShowroomOptions;
  private canvas: HTMLCanvasElement;
  private reduced: boolean;
  private qualityMode: ShowroomQuality | 'auto';
  private quality: ShowroomQuality;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private envTex: THREE.Texture | null = null;
  private post: Post | null = null;
  private postSamples = -1;
  private tl = new Timeline();
  private rig = new Rig(this.tl);
  private bank = new MaterialBank();
  private shared: SharedMachineMats | null = null;
  private templates = new TemplateCache();
  private atlas: CodeAtlas | null = null;
  private hall: Hall | null = null;
  private bays: BayField | null = null;
  private lights = new Lights();
  private cam: CameraDirector;
  private labels: Labels;
  private sfx: Sfx;
  private gestures: Gestures | null = null;
  private dust: Dust | null = null;
  private scan: { group: THREE.Group; ring: THREE.MeshBasicMaterial; disc: THREE.MeshBasicMaterial; tex: THREE.Texture } | null = null;
  private entries: Entry[] = [];
  private slots: Slot[] = [];
  private dims: HallDims = computeLayout(0).dims;
  private obstacles: Obstacle[] = [];
  private insets: ShowroomInsets = { top: 0, right: 0, bottom: 0 };
  private vp: Viewport = { w: 1, h: 1, insets: { top: 0, right: 0, bottom: 0 } };
  private target: string | null = null;
  private hovered: string | null = null;
  private lit = false;
  /** Les étiquettes n'apparaissent qu'une fois les baies allumées. */
  private labelsOn = false;
  private introPromise: Promise<void> | null = null;
  private lastActive = 0;
  private idle = 0;
  private idleWindow: number;
  private flash = 0;
  private shadowsDirty = true;
  private dirty = true;
  private raf = 0;
  private lastNow = 0;
  private paused = false;
  private disposed = false;
  superseded = false;
  private contextLost = false;
  private built = false;
  private fps = new FpsWatch();
  private pointer: { x: number; y: number } | null = null;
  private pointerDirty = false;
  private dragging = false;
  private queue: Promise<void> = Promise.resolve();
  private queueBusy = false;
  private cleanups: (() => void)[] = [];
  private resolveDisposed: () => void = () => {};
  readonly disposedPromise = new Promise<void>((r) => (this.resolveDisposed = r));
  private flightToken = 0;
  private cssW = 1;
  private cssH = 1;
  private pr = 1;
  private needsResize = true;
  private raycaster = new THREE.Raycaster();
  private beaconPos = new THREE.Vector3();

  constructor(o: ShowroomOptions) {
    this.o = o;
    this.canvas = o.canvas;
    this.reduced = !!o.reducedMotion;
    this.qualityMode = o.quality ?? 'auto';
    this.quality = this.qualityMode === 'auto' ? initialQuality() : this.qualityMode;
    this.sfx = new Sfx(o.sound !== false);
    this.labels = new Labels(o.labels ?? null, (id) => {
      this.touch();
      this.o.onSelect?.(id);
    });
    this.cam = new CameraDirector(
      (p) => cameraFree(p, this.obstacles, this.dims),
      () => ({ obstacles: this.obstacles, dims: this.dims }),
    );
    const coarse = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false);
    this.idleWindow = coarse ? 12 : 24;
  }

  // ================================================================== construction

  private check(): void {
    if (this.superseded || this.disposed) throw new Superseded();
  }

  private async yieldFrame(): Promise<void> {
    await nextFrame();
    this.check();
  }

  async build(): Promise<void> {
    const progress = (p: number, label: string) => {
      if (!this.disposed && !this.superseded) this.o.onProgress?.(clamp(p, 0, 1), label);
    };
    const t0 = performance.now();
    progress(0.02, 'Préparation du hall');
    await this.yieldFrame();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });
    } catch {
      throw new Error('WebGL 2 n’est pas disponible sur cet appareil.');
    }
    this.renderer = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x07080a, 1);
    this.listenContext();

    await fontsReady(900);
    this.check();
    progress(0.07, 'Préparation du hall');

    this.envTex = buildEnvironment(renderer);
    this.bank.setEnvMap(this.envTex);
    this.shared = sharedMachineMaterials(this.bank);
    this.atlas = new CodeAtlas();
    this.bays = new BayField(this.bank, this.atlas);
    this.scene.background = new THREE.Color(0x07080a);
    this.scene.fog = new THREE.FogExp2(0x07080a, 0.011);
    this.scene.add(this.bays.group, this.lights.group);
    this.bindChannels();
    this.measure();
    await this.yieldFrame();
    progress(0.16, 'Préparation du hall');

    // parc initial (sans animation), avec progression machine par machine
    const list = this.cleanList(this.o.machines);
    progress(0.24, 'Mise en place des machines');
    await this.applyMachines(list, false, async (k) => {
      progress(0.24 + 0.46 * k, 'Mise en place des machines');
      await this.yieldFrame();
    });
    this.check();

    progress(0.72, 'Réglage des lumières');
    this.applyQuality(this.quality, false);
    this.standby();
    await this.yieldFrame();

    progress(0.8, 'Compilation des matériaux');
    await this.compile();
    this.check();
    progress(0.96, 'Compilation des matériaux');
    this.update(0);
    this.render();
    await this.yieldFrame();

    this.listen();
    this.built = true;
    progress(1, 'Prêt');
    if (engineDebug.verbose) {
      const info = renderer.info;
      const st = (window as unknown as { __godetStats?: { calls: number; triangles: number } }).__godetStats;
      console.info(`[godet] showroom prêt en ${Math.round(performance.now() - t0)} ms — ${st?.calls ?? info.render.calls} appels, ${st?.triangles ?? info.render.triangles} triangles, ${info.programs?.length ?? 0} programmes`);
    }
    this.invalidate();
  }

  /**
   * Compilation des shaders avant la première image. Avec l'extension de compilation parallèle, sans bloquer
   * (compileAsync) ; sinon par morceaux (hall, baies, chaque machine) en rendant la main entre chaque.
   */
  private async compile(): Promise<void> {
    const r = this.renderer;
    if (!r) return;
    this.scene.updateMatrixWorld(true);
    const cam = this.cam.camera;
    if (r.extensions.has('KHR_parallel_shader_compile')) {
      const timeout = new Promise((resolve) => setTimeout(resolve, 12000));
      await Promise.race([r.compileAsync(this.scene, cam), timeout]);
      return;
    }
    const chunks: THREE.Object3D[] = [];
    if (this.hall) chunks.push(this.hall.group);
    if (this.bays) chunks.push(this.bays.group);
    for (const e of this.entries) chunks.push(e.holder);
    if (this.dust) chunks.push(this.dust.points);
    for (const c of chunks) {
      r.compile(c, cam, this.scene);
      await this.yieldFrame();
    }
  }

  private bindChannels(): void {
    const bays = this.bays as BayField;
    this.rig.bind('ambient', (l) => {
      this.lights.ambient = l;
      this.bank.setEnvLevel(0.32 + 0.68 * l);
    });
    this.rig.bind('spots', (l) => (this.lights.spotsLevel = l));
    this.rig.bind('bays', (l) => {
      bays.master = l;
      bays.touch();
    });
    this.rig.bind('floor', (l) => {
      bays.floorLevel = l;
      bays.touch();
    });
  }

  /** Hall éteint, première machine sous un projecteur, caméra en contre-plongée. */
  private standby(): void {
    this.rig.set('ambient', 0.3);
    this.rig.set('ceiling', 0);
    this.rig.set('wall', 0.28);
    this.rig.set('sign', 0.32);
    this.rig.set('side', 0);
    this.rig.set('floor', 0.3);
    this.rig.set('bays', 1);
    this.rig.set('spots', 0.62);
    this.entries.forEach((e) => this.bays?.setLevel(e.index, e.index === 0 ? 0.5 : 0.1));
    this.lights.assign(this.entries.length ? [0] : []);
    const v = standbyView(this.slots[0], this.vp);
    this.cam.jump(v.pose, v.frame);
    this.labels.hideAll();
  }

  // ================================================================== parc

  private cleanList(list: ShowroomMachine[]): ShowroomMachine[] {
    const seen = new Set<string>();
    const out: ShowroomMachine[] = [];
    for (const m of list ?? []) {
      if (!m || !m.id || seen.has(m.id)) continue;
      seen.add(m.id);
      out.push({ ...m, color: safeColor(m.color || '#f3b71b'), alerts: Math.max(0, Math.round(m.alerts || 0)) });
      if (out.length >= 32) break;
    }
    return out;
  }

  private matFor(own: OwnMachineMats, k: MatKey): THREE.Material {
    switch (k) {
      case 'paint':
        return own.paint;
      case 'lamp':
        return own.lamp;
      case 'beacon':
        return own.beacon;
      case 'decal':
        return own.decal;
      default:
        return (this.shared as SharedMachineMats)[k];
    }
  }

  private makeView(m: ShowroomMachine, own: OwnMachineMats): { view: MachineView; key: string; box: THREE.Box3 } {
    const tpl = this.templates.get(m.kind, m.weightT);
    const view = new MachineView(tpl, (k) => this.matFor(own, k), machineScale(tpl, m.weightT, PLATFORM_R));
    const box = tpl.bounds.clone();
    box.min.multiplyScalar(view.scale);
    box.max.multiplyScalar(view.scale);
    box.expandByScalar(0.15);
    return { view, key: templateKey(m.kind, m.weightT), box };
  }

  private createEntry(m: ShowroomMachine, index: number): Entry {
    const own = ownMachineMaterials(this.bank, m.color, m.code);
    const { view, key, box } = this.makeView(m, own);
    const holder = new THREE.Group();
    holder.add(view.root);
    this.scene.add(holder);
    return {
      data: m,
      key,
      view,
      own,
      holder,
      index,
      spin: 0,
      spinTween: null,
      spinDir: index % 2 === 0 ? 1 : -1,
      token: 0,
      rise: 1,
      box,
      colorTween: null,
    };
  }

  private disposeEntry(e: Entry): void {
    e.token++;
    e.spinTween?.cancel();
    e.colorTween?.cancel();
    e.view.dispose();
    e.holder.removeFromParent();
    releaseOwn(this.bank, e.own);
  }

  /** Applique un nouveau parc : ajouts (montée sur le plateau), retraits (descente), modifications. */
  private async applyMachines(list: ShowroomMachine[], animate: boolean, progress?: (k: number) => Promise<void>): Promise<void> {
    const bays = this.bays as BayField;
    const ids = new Set(list.map((m) => m.id));
    const removed = this.entries.filter((e) => !ids.has(e.data.id));
    const { slots, dims } = computeLayout(list.length);
    // machines qui changent de baie : elles redescendent puis remontent à leur nouvelle place
    const newIndex = new Map(list.map((m, i) => [m.id, i]));
    const moving = new Set(
      this.entries.filter((e) => {
        const ni = newIndex.get(e.data.id);
        if (ni === undefined) return false;
        const a = this.slots[e.index];
        const b = slots[ni];
        return !a || a.x !== b.x || a.z !== b.z;
      }),
    );
    if (animate && (removed.length || moving.size)) {
      await Promise.all([...removed, ...moving].map((e) => this.sink(e)));
      if (this.disposed) return;
    }
    for (const e of removed) this.disposeEntry(e);
    const old = new Map(this.entries.filter((e) => ids.has(e.data.id)).map((e) => [e.data.id, e]));

    const hallChanged = !this.hall || dims.zBack !== this.dims.zBack || dims.zFront !== this.dims.zFront;
    this.slots = slots;
    this.dims = dims;
    if (hallChanged) {
      this.hall?.dispose();
      // Textes de l'enseigne dans la langue de l'interface : attributs data-signage-sub et data-signage-fallback du
      // canvas (posés par l'interface, le contrat types.ts reste inchangé) ; à défaut, le français.
      const text = this.canvas.dataset;
      this.hall = new Hall(this.bank, this.rig, {
        dims,
        slots,
        signage: this.o.signage ?? '',
        signageSub: text.signageSub,
        signageFallback: text.signageFallback,
      });
      this.scene.add(this.hall.group);
      this.hall.floor.setReflection(QUALITY[this.quality].reflection, this.cssW * this.pr, this.cssH * this.pr);
      const length = dims.zFront - dims.zBack;
      const density = 0.0105 * clamp(70 / length, 0.62, 1);
      (this.scene.fog as THREE.FogExp2).density = density;
      bays.setFog(density);
      this.dust?.dispose();
      this.dust = new Dust(dims.height, PLATFORM_R * 0.9);
      this.scene.add(this.dust.points);
    }
    this.lights.setLayout(slots, dims.height);

    const next: Entry[] = [];
    const pulses: [number, THREE.Color][] = [];
    const rising: Entry[] = [];
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      let e = old.get(m.id);
      const fresh = !e;
      if (!e) {
        e = this.createEntry(m, i);
      } else {
        const prev = e.data;
        const key = templateKey(m.kind, m.weightT);
        if (key !== e.key || (prev.weightT ?? null) !== (m.weightT ?? null)) {
          // autre type ou autre poids : nouveau modèle, mêmes matériaux
          e.token++;
          e.view.dispose();
          const v = this.makeView(m, e.own);
          e.view = v.view;
          e.key = v.key;
          e.box = v.box;
          e.holder.add(e.view.root);
        }
        if (prev.color !== m.color) this.repaint(e, m.color, animate);
        if (prev.code !== m.code || isLightPaint(prev.color) !== isLightPaint(m.color)) {
          const tex = codeTexture(m.code, isLightPaint(m.color));
          e.own.decal.map?.dispose();
          e.own.decal.map = tex;
          e.own.decal.needsUpdate = true;
        }
        if (prev.state !== m.state && animate) pulses.push([i, STATE_COLORS[m.state]]);
      }
      e.data = m;
      e.index = i;
      e.spinDir = i % 2 === 0 ? 1 : -1;
      e.holder.position.set(slots[i].x, DECK_Y, slots[i].z);
      e.holder.userData.yawBase = slots[i].yaw;
      if (animate && (fresh || moving.has(e))) {
        e.rise = 0;
        e.view.root.position.y = -(e.view.height + 0.6);
        rising.push(e);
      }
      next.push(e);
      if (progress) await progress((i + 1) / list.length);
    }
    this.entries = next;

    // baies, étiquettes, obstacles pour la caméra
    bays.layout(
      slots,
      dims,
      next.map((e) => e.data.code),
      next.map((e) => e.data.state),
      next.map((e) => ({ w: e.view.tpl.footprint.w * e.view.scale, d: e.view.tpl.footprint.d * e.view.scale })),
    );
    next.forEach((e) => {
      bays.setSpin(e.index, e.spin);
      const level = this.lit ? 1 : e.index === 0 ? 0.5 : 0.1;
      bays.setLevel(e.index, e.rise < 1 ? 0 : level);
      bays.setFocus(e.index, e.data.id === this.target ? 1 : 0);
    });
    this.obstacles = next.map((e) => ({
      x: slots[e.index].x,
      z: slots[e.index].z,
      r: PLATFORM_R + 0.6,
      top: DECK_Y + e.view.height + 1.1,
    }));
    this.labels.sync(next.map((e) => ({ id: e.data.id, code: e.data.code, label: e.data.label, state: e.data.state, alerts: e.data.alerts })));
    this.templates.prune(new Set(next.map((e) => e.key)));
    for (const [i, c] of pulses) bays.pulse(i, c, 0.9);
    for (const e of rising) void this.rise(e);
    this.shadowsDirty = true;
    if (this.target && !ids.has(this.target)) this.focus(null);
    else if (this.built) this.reassignLights();
    this.invalidate();
  }

  private repaint(e: Entry, color: string, animate: boolean): void {
    e.colorTween?.cancel();
    const from = e.own.paint.color.clone();
    const to = new THREE.Color(color);
    if (!animate || this.reduced) {
      e.own.paint.color.copy(to);
      return;
    }
    e.colorTween = this.tl.tween(0.9, (k) => e.own.paint.color.copy(from).lerp(to, k), easeInOut);
  }

  /** Arrivée d'une machine : elle monte du sous-sol sur son plateau, sous le projecteur. */
  private async rise(e: Entry): Promise<void> {
    const bays = this.bays as BayField;
    const h = e.view.height + 0.6;
    e.view.root.position.y = -h;
    e.rise = 0;
    this.sfx.lift();
    const level = this.lit ? 1 : 0.1;
    void flickerTo(this.tl, (v) => bays.setLevel(e.index, v), level * 1.4, this.reduced);
    await this.tl.tween(
      this.reduced ? 0.25 : 2.0,
      (k) => {
        e.view.root.position.y = -h * (1 - k);
        e.rise = k;
      },
      easeOut,
    ).done;
    e.view.root.position.y = 0;
    e.rise = 1;
    bays.setFoot(e.index, { w: e.view.tpl.footprint.w * e.view.scale, d: e.view.tpl.footprint.d * e.view.scale });
    if (!this.reduced) this.sfx.clack(0.7);
    void this.tl.tween(0.8, (k) => bays.setLevel(e.index, lerp(level * 1.4, level, k)), easeOut).done;
    this.shadowsDirty = true;
  }

  /** Départ d'une machine : elle redescend sous le plateau. */
  private async sink(e: Entry): Promise<void> {
    const bays = this.bays as BayField;
    e.token++;
    const h = e.view.height + 0.6;
    this.sfx.whoosh(0.9, 0.6);
    const lv = bays.level(e.index);
    await this.tl.tween(
      this.reduced ? 0.2 : 0.8,
      (k) => {
        e.view.root.position.y = -h * k;
        e.rise = 1 - k;
        bays.setLevel(e.index, lv * (1 - k));
      },
      easeIn,
    ).done;
  }

  // ================================================================== API

  setMachines(machines: ShowroomMachine[]): void {
    if (this.disposed) return;
    this.touch();
    const list = this.cleanList(machines);
    // rien n'a changé : on ne reconstruit rien
    if (list.length === this.entries.length && list.every((m, i) => this.entries[i].data.id === m.id && sameMachines(this.entries[i].data, m))) return;
    this.queueBusy = true;
    this.queue = this.queue
      .then(() => (this.disposed ? undefined : this.applyMachines(list, this.built && !this.reduced)))
      .catch((err) => {
        if (!(err instanceof Superseded) && engineDebug.verbose) console.warn('[godet] setMachines', err);
      })
      .finally(() => {
        this.queueBusy = false;
        this.invalidate();
      });
  }

  focus(id: string | null, opts?: { instant?: boolean }): void {
    if (this.disposed) return;
    this.touch();
    if (!this.lit) this.lightsOnNow();
    const e = id ? this.entries.find((x) => x.data.id === id) : null;
    if (id && !e) return;
    const prev = this.target;
    this.target = e ? e.data.id : null;
    if (prev && prev !== this.target) this.restMachine(prev);
    this.entries.forEach((x) => this.bays?.setFocus(x.index, x === e ? 1 : 0));
    this.reassignLights();
    this.fly(!!opts?.instant, false);
  }

  /** Vol vers la cible courante (machine ou vue d'ensemble). */
  private fly(instant: boolean, silent: boolean): void {
    const token = ++this.flightToken;
    const e = this.target ? this.entries.find((x) => x.data.id === this.target) : null;
    let promise: Promise<boolean>;
    if (e) {
      const v = machineView(this.slots[e.index], e.view.radius, e.view.height, this.vp, this.obstacles, this.dims);
      promise = this.cam.flyTo(v.pose, v.frame, { instant, reduced: this.reduced });
      const dur = instant || this.reduced ? 0 : Math.max(1.0, this.cam.lastDuration * 1.05);
      this.turnTable(e, v.faceYaw, dur);
      if (!this.reduced) e.view.articulate(true);
    } else {
      const v = overviewView(this.slots, this.dims, this.vp, this.cam.camera, this.sizes());
      if (engineDebug.verbose) console.info('[godet] vue d’ensemble', v.pose.pos.toArray().map((x) => x.toFixed(2)).join(' '), '→', v.pose.tgt.toArray().map((x) => x.toFixed(2)).join(' '), JSON.stringify(this.vp));
      promise = this.cam.flyTo(v.pose, v.frame, { instant, reduced: this.reduced });
    }
    if (!instant && !silent && !this.reduced && this.cam.flying) this.sfx.whoosh(this.cam.lastDuration, 0.9);
    const id = this.target;
    void promise.then((ok) => {
      if (ok && token === this.flightToken && !this.disposed) this.o.onFocus?.(id);
    });
    this.invalidate();
  }

  /** Le plateau tourne pour présenter la machine de trois quarts. */
  private turnTable(e: Entry, faceYaw: number, dur: number): void {
    const base = this.slots[e.index].yaw;
    let want = faceYaw - base;
    // angle équivalent le plus proche de la rotation actuelle
    want += Math.round((e.spin - want) / (Math.PI * 2)) * Math.PI * 2;
    e.spinTween?.cancel();
    if (dur <= 0) {
      e.spin = want;
      e.spinTween = null;
      return;
    }
    const from = e.spin;
    e.spinTween = this.tl.tween(dur, (k) => (e.spin = lerp(from, want, k)), easeInOut);
    this.shadowsDirty = true;
  }

  next(): void {
    this.step(1);
  }

  prev(): void {
    this.step(-1);
  }

  private step(d: 1 | -1): void {
    const n = this.entries.length;
    if (!n || this.disposed) return;
    const cur = this.target ? this.entries.findIndex((e) => e.data.id === this.target) : -1;
    const i = cur < 0 ? (d > 0 ? 0 : n - 1) : (cur + d + n) % n;
    this.focus(this.entries[i].data.id);
  }

  focused(): string | null {
    return this.target;
  }

  setInsets(insets: Partial<ShowroomInsets>): void {
    if (this.disposed) return;
    const next = { ...this.insets, ...insets };
    for (const k of ['top', 'right', 'bottom'] as const) next[k] = Math.max(0, Math.round(Number(next[k]) || 0));
    if (next.top === this.insets.top && next.right === this.insets.right && next.bottom === this.insets.bottom) return;
    this.insets = next;
    this.updateViewport();
    this.refit();
    this.touch();
  }

  intro(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (!this.introPromise) this.introPromise = this.runIntro().catch(() => undefined);
    return this.introPromise;
  }

  unlockAudio(): void {
    if (this.disposed) return;
    this.sfx.unlock();
  }

  setSound(on: boolean): void {
    this.sfx.setEnabled(on);
  }

  play(effect: ShowroomEffect): void {
    if (this.disposed) return;
    this.touch();
    const e = this.target ? this.entries.find((x) => x.data.id === this.target) : null;
    const bays = this.bays;
    switch (effect) {
      case 'save':
        this.sfx.chime();
        if (e && bays) bays.pulse(e.index, PAINT, 1);
        break;
      case 'open':
        this.sfx.open();
        if (e && bays) bays.pulse(e.index, CHALK, 0.5);
        break;
      case 'close':
        this.sfx.close();
        break;
      case 'alert':
        this.sfx.alert();
        if (bays) {
          if (e) bays.pulse(e.index, STATE_COLORS.bad, 1);
          else this.entries.forEach((x) => x.data.state !== 'ok' && bays.pulse(x.index, STATE_COLORS[x.data.state], 0.9));
        }
        break;
      case 'tick':
        this.sfx.tick();
        break;
      case 'photo':
        this.sfx.shutter();
        this.flash = 1;
        break;
      case 'whoosh':
        this.sfx.whoosh(1.2);
        break;
    }
    this.invalidate();
  }

  animate(id: string, action: 'wake' | 'service' | 'repair'): void {
    if (this.disposed) return;
    const e = this.entries.find((x) => x.data.id === id);
    if (!e) return;
    this.touch();
    const token = ++e.token;
    e.view.articulate(true);
    const run = action === 'wake' ? this.runWake(e, token) : action === 'service' ? this.runService(e, token) : this.runRepair(e, token);
    void run.catch(() => undefined);
    this.invalidate();
  }

  setQuality(q: ShowroomQuality | 'auto'): void {
    if (this.disposed) return;
    this.qualityMode = q;
    const level = q === 'auto' ? initialQuality() : q;
    if (q === 'auto') this.fps.arm(performance.now(), 900);
    else this.fps.disarm();
    this.applyQuality(level, false);
  }

  pause(): void {
    if (this.paused || this.disposed) return;
    this.paused = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.sfx.suspend();
  }

  resume(): void {
    if (!this.paused || this.disposed) return;
    this.paused = false;
    this.lastNow = 0;
    this.sfx.resume();
    this.touch();
    this.invalidate();
  }

  async snapshot(): Promise<Blob | null> {
    const r = this.renderer;
    if (!r || this.disposed || this.contextLost) return null;
    try {
      // photo centrée sur la machine (sans le décalage dû à la fiche)
      this.cam.apply();
      const blob = await new Promise<Blob | null>((resolve) => {
        this.cam.withoutOffset(() => {
          this.renderNow(false, false);
          this.canvas.toBlob((b) => resolve(b), 'image/png');
        });
      });
      this.renderNow(true, true);
      return blob;
    } catch {
      return null;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.tl.clear();
    for (const c of this.cleanups) {
      try {
        c();
      } catch {
        /* déjà retiré */
      }
    }
    this.cleanups = [];
    this.gestures?.dispose();
    this.labels.dispose();
    this.sfx.dispose();
    for (const e of this.entries) this.disposeEntry(e);
    this.entries = [];
    this.templates.dispose();
    // géométries unitaires partagées (vérins, biellettes) : réenvoyées au besoin par un futur moteur
    for (const g of Object.values(UNIT)) g.dispose();
    this.hall?.dispose();
    this.bays?.dispose();
    this.lights.dispose();
    this.dust?.dispose();
    if (this.scan) {
      disposeGroup(this.scan.group);
      this.scan.ring.dispose();
      this.scan.disc.dispose();
      this.scan.tex.dispose();
    }
    this.post?.dispose();
    this.post = null;
    this.atlas?.dispose();
    this.envTex?.dispose();
    this.bank.dispose();
    this.scene.clear();
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      this.renderer.dispose();
    }
    this.canvas.style.cursor = '';
    this.resolveDisposed();
  }

  /** Abandon pendant la construction (un autre showroom prend le même canvas). */
  supersede(): void {
    this.superseded = true;
    if (!this.built) return;
    this.dispose();
  }

  // ================================================================== intro et lumières

  private lightsOnNow(): void {
    this.lit = true;
    this.labelsOn = true;
    this.introPromise = this.introPromise ?? Promise.resolve();
    for (const [c, v] of [
      ['ambient', 1],
      ['ceiling', 1],
      ['wall', 1],
      ['sign', 1],
      ['side', 1],
      ['floor', 1],
      ['bays', 1],
      ['spots', 1],
    ] as const)
      this.rig.set(c, v);
    this.entries.forEach((e) => this.bays?.setLevel(e.index, 1));
    if (this.qualityMode === 'auto') this.fps.arm(performance.now(), 1500);
  }

  private async runIntro(): Promise<void> {
    if (this.lit) return;
    this.sfx.unlock();
    this.lit = true;
    this.touch();
    if (this.qualityMode === 'auto') this.fps.arm(performance.now(), 1200);
    const reduced = this.reduced;
    const bays = this.bays as BayField;
    const tl = this.tl;
    let flight: Promise<boolean> = Promise.resolve(true);
    if (!this.target) {
      const v = overviewView(this.slots, this.dims, this.vp, this.cam.camera, this.sizes());
      flight = this.cam.flyTo(v.pose, v.frame, { reduced, duration: reduced ? undefined : 2.9 });
      if (!reduced) this.sfx.whoosh(2.6, 0.7);
    }
    void this.rig.ramp('ambient', 1, reduced ? 0.3 : 2.4);
    const gap = reduced ? 0.03 : 0.24;
    this.sfx.clack();
    await this.rig.flicker('ceiling', 1, reduced, 0.31);
    if (!(await tl.delay(gap * 0.6))) return;
    // baies allumées rangée après rangée, de l'entrée vers le fond
    const rows = new Map<number, Entry[]>();
    for (const e of this.entries) {
      const z = Math.round(this.slots[e.index].z * 10);
      rows.set(z, [...(rows.get(z) ?? []), e]);
    }
    const order = [...rows.keys()].sort((a, b) => b - a);
    const perRow = reduced ? 0.02 : Math.min(0.24, 1.6 / Math.max(1, order.length));
    for (const z of order) {
      this.sfx.clack(0.55);
      for (const e of rows.get(z) ?? []) void flickerTo(tl, (v) => bays.setLevel(e.index, v), 1, reduced, (e.index * 0.37) % 1);
      if (!(await tl.delay(perRow))) return;
    }
    this.lights.assign(this.spotTargets());
    void this.rig.ramp('spots', 1, 0.8);
    this.labelsOn = true;
    this.sfx.clack(1.1);
    void this.rig.flicker('sign', 1, reduced, 0.77);
    void this.rig.ramp('wall', 1, reduced ? 0.2 : 0.7);
    if (!(await tl.delay(gap))) return;
    this.sfx.clack(0.8);
    void this.rig.flicker('side', 1, reduced, 0.53);
    if (!(await tl.delay(gap))) return;
    await this.rig.ramp('floor', 1, reduced ? 0.2 : 0.8);
    await flight;
    this.labelsOn = true;
    this.touch();
  }

  /** Dimensions réelles des machines (pour cadrer la vue d'ensemble). */
  private sizes(): { r: number; h: number }[] {
    return this.entries.map((e) => ({ r: e.view.radius, h: e.view.height }));
  }

  /** Baies éclairées par les vrais projecteurs : la machine visée puis ses deux voisines les plus proches. */
  private spotTargets(): number[] {
    const n = this.entries.length;
    if (!n) return [];
    const e = this.target ? this.entries.find((x) => x.data.id === this.target) : null;
    if (e) {
      const s0 = this.slots[e.index];
      const others = this.slots
        .filter((s) => s.index !== e.index)
        .sort((a, b) => Math.hypot(a.x - s0.x, a.z - s0.z) - Math.hypot(b.x - s0.x, b.z - s0.z))
        .slice(0, 2)
        .map((s) => s.index);
      return [e.index, ...others];
    }
    // vue d'ensemble : les baies les plus proches de l'entrée
    return [...this.slots]
      .sort((a, b) => b.z - a.z || Math.abs(a.x) - Math.abs(b.x))
      .slice(0, 3)
      .map((s) => s.index);
  }

  private reassignLights(): void {
    if (!this.lit) return;
    this.lights.assign(this.spotTargets());
    this.shadowsDirty = true;
  }

  // ================================================================== animations des machines

  private lampsTo(e: Entry, v: number, dur: number): Promise<boolean> {
    const from = e.view.lamps;
    return this.tl.tween(dur, (k) => (e.view.lamps = lerp(from, v, k)), easeOut).done;
  }

  private async playSteps(e: Entry, token: number, steps: { pose: Record<string, number>; dur: number }[], sound = true): Promise<boolean> {
    for (const s of steps) {
      if (token !== e.token || this.disposed) return false;
      if (sound) this.sfx.hydraulic(s.dur);
      const ok = await e.view.poseTo(this.tl, s.pose, this.reduced ? Math.min(0.5, s.dur) : s.dur);
      if (!ok) return false;
    }
    return token === e.token;
  }

  private async runWake(e: Entry, token: number): Promise<void> {
    const v = e.view;
    v.busy++;
    try {
      void this.lampsTo(e, 1, 0.5);
      v.beacon = 1;
      this.sfx.engineOn();
      if (!(await this.tl.delay(this.reduced ? 0.05 : 0.65)) || token !== e.token) return;
      if (v.tpl.vibrate && !this.reduced) {
        v.vibration = 1;
        this.sfx.rumble(2.6);
      }
      await this.playSteps(e, token, v.tpl.wake);
      v.vibration = 0;
      if (token !== e.token) return;
      if (!(await this.tl.delay(3.2)) || token !== e.token) return;
      this.sleepMachine(e);
    } finally {
      v.busy--;
      v.vibration = 0;
    }
  }

  private async runService(e: Entry, token: number): Promise<void> {
    const v = e.view;
    v.busy++;
    try {
      this.sfx.scan(1.6);
      if (this.bays) this.bays.pulse(e.index, STATE_COLORS.ok, 1);
      void this.scanSweep(e);
      for (let i = 0; i < 2; i++) {
        await this.lampsTo(e, 1, 0.12);
        await this.lampsTo(e, 0.1, 0.2);
      }
      if (token !== e.token) return;
      await this.playSteps(e, token, v.tpl.nod);
      this.sfx.chime();
      await this.lampsTo(e, 0, 0.4);
      this.settle(e, token);
    } finally {
      v.busy--;
    }
  }

  private async runRepair(e: Entry, token: number): Promise<void> {
    const v = e.view;
    v.busy++;
    try {
      v.beacon = 1;
      this.sfx.wrench();
      if (this.bays) this.bays.pulse(e.index, STATE_COLORS.warn, 1);
      if (!(await this.tl.delay(0.6)) || token !== e.token) return;
      await this.playSteps(e, token, v.tpl.nod);
      this.sfx.wrench();
      if (!(await this.tl.delay(2.2)) || token !== e.token) return;
      v.beacon = 0;
      this.settle(e, token);
    } finally {
      v.busy--;
    }
  }

  /** Balayage lumineux qui monte le long de la machine (service). */
  private async scanSweep(e: Entry): Promise<void> {
    if (!this.scan) {
      const group = new THREE.Group();
      const ring = new THREE.MeshBasicMaterial({ color: CHALK.clone().multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      if (g) {
        const r = g.createRadialGradient(64, 64, 20, 64, 64, 64);
        r.addColorStop(0, 'rgba(255,255,255,0)');
        r.addColorStop(0.8, 'rgba(255,255,255,0.25)');
        r.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = r;
        g.fillRect(0, 0, 128, 128);
      }
      const tex = new THREE.CanvasTexture(c);
      const disc = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.6, 1, 0.75), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 120), ring);
      torus.rotation.x = Math.PI / 2;
      const plane = new THREE.Mesh(new THREE.CircleGeometry(1.02, 64), disc);
      plane.rotation.x = -Math.PI / 2;
      group.add(torus, plane);
      group.visible = false;
      group.layers.set(2);
      torus.layers.set(2);
      plane.layers.set(2);
      this.scene.add(group);
      this.scan = { group, ring, disc, tex };
    }
    const s = this.scan;
    const slot = this.slots[e.index];
    const r = e.view.radius + 0.3;
    const h = e.view.height + 0.4;
    s.group.position.set(slot.x, DECK_Y, slot.z);
    s.group.scale.set(r, 1, r);
    s.group.visible = true;
    await this.tl.tween(
      this.reduced ? 0.4 : 1.6,
      (k) => {
        s.group.position.y = DECK_Y + 0.05 + h * k;
        const a = Math.sin(Math.PI * k);
        s.ring.opacity = a;
        s.disc.opacity = a * 0.8;
      },
      easeInOut,
    ).done;
    s.group.visible = false;
  }

  /** Fin d'une animation : retour à la pose de repos puis version figée (sauf machine visée). */
  private settle(e: Entry, token: number): void {
    void e.view.poseTo(this.tl, e.view.tpl.rest, 0.8).then(() => {
      if (token !== e.token || this.disposed) return;
      if (e.data.id !== this.target && e.view.atRest(0.002)) e.view.articulate(false);
    });
  }

  /** La machine s'endort : phares et gyrophare éteints, moteur coupé. */
  private sleepMachine(e: Entry): void {
    e.view.beacon = 0;
    void this.lampsTo(e, 0, 0.8);
    this.sfx.engineOff();
    this.settle(e, e.token);
  }

  /** Une machine n'est plus visée : on arrête son animation et on la remet au repos. */
  private restMachine(id: string): void {
    const e = this.entries.find((x) => x.data.id === id);
    if (!e) return;
    const token = ++e.token;
    e.view.beacon = 0;
    e.view.vibration = 0;
    void this.lampsTo(e, 0, 0.6);
    this.sfx.engineOff();
    this.settle(e, token);
  }

  // ================================================================== qualité, taille

  private applyQuality(level: ShowroomQuality, automatic: boolean): void {
    const r = this.renderer;
    if (!r) return;
    const changed = level !== this.quality;
    this.quality = level;
    const q = QUALITY[level];
    this.measure();
    this.pr = pixelRatioFor(q, this.cssW, this.cssH);
    r.setPixelRatio(this.pr);
    r.setSize(this.cssW, this.cssH, false);
    if (q.post) {
      // écrans très denses : 2 échantillons suffisent (les pixels sont déjà fins)
      const samples = this.pr >= 1.5 ? Math.min(2, q.samples) : q.samples;
      if (!this.post || this.postSamples !== samples) {
        this.post?.dispose();
        this.post = new Post(r, this.scene, this.cam.camera, this.cssW, this.cssH, this.pr, samples, q.bloom);
        this.postSamples = samples;
      } else {
        this.post.setSize(this.cssW, this.cssH, this.pr);
      }
      this.post.setBloom(q.bloom);
    } else if (this.post) {
      this.post.dispose();
      this.post = null;
      this.postSamples = -1;
    }
    this.hall?.floor.setReflection(q.reflection, this.cssW * this.pr, this.cssH * this.pr);
    this.lights.setQuality(q);
    this.bank.setClearcoat(q.clearcoat);
    this.shadowsDirty = true;
    this.needsResize = false;
    this.updateViewport();
    if (automatic && changed) this.o.onQualityChange?.(level);
    this.invalidate();
  }

  private measure(): void {
    const w = this.canvas.clientWidth || this.canvas.width || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = this.canvas.clientHeight || this.canvas.height || (typeof window !== 'undefined' ? window.innerHeight : 800);
    this.cssW = Math.max(1, Math.round(w));
    this.cssH = Math.max(1, Math.round(h));
  }

  private resize(): void {
    const r = this.renderer;
    if (!r) return;
    this.needsResize = false;
    const pw = this.cssW;
    const ph = this.cssH;
    const ppr = this.pr;
    this.measure();
    this.pr = pixelRatioFor(QUALITY[this.quality], this.cssW, this.cssH);
    if (pw === this.cssW && ph === this.cssH && ppr === this.pr) return;
    r.setPixelRatio(this.pr);
    r.setSize(this.cssW, this.cssH, false);
    this.post?.setSize(this.cssW, this.cssH, this.pr);
    this.hall?.floor.setReflection(QUALITY[this.quality].reflection, this.cssW * this.pr, this.cssH * this.pr);
    this.updateViewport();
    this.refit();
  }

  private updateViewport(): void {
    // les zones masquées ne peuvent pas dépasser l'écran
    const ins = {
      top: Math.min(this.insets.top, this.cssH * 0.5),
      right: Math.min(this.insets.right, this.cssW * 0.7),
      bottom: Math.min(this.insets.bottom, this.cssH * 0.7),
    };
    this.vp = { w: this.cssW, h: this.cssH, insets: ins };
    this.cam.setViewport(this.vp);
  }

  /** Recadre la vue courante (taille d'écran ou zones masquées changées). */
  private refit(): void {
    if (!this.built || !this.lit) return;
    if (this.cam.flying) {
      this.fly(false, true);
      return;
    }
    const e = this.target ? this.entries.find((x) => x.data.id === this.target) : null;
    if (e) {
      const v = machineView(this.slots[e.index], e.view.radius, e.view.height, this.vp, this.obstacles, this.dims);
      this.cam.refit(v.frame);
    } else {
      const v = overviewView(this.slots, this.dims, this.vp, this.cam.camera, this.sizes());
      this.cam.refit(v.frame);
    }
    this.invalidate();
  }

  // ================================================================== évènements

  private listenContext(): void {
    const lost = (ev: Event) => {
      ev.preventDefault();
      this.contextLost = true;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.o.onContextLost?.();
    };
    const restored = () => {
      if (this.disposed || !this.renderer) return;
      this.contextLost = false;
      // l'environnement (cible de rendu) est perdu avec le contexte : on le refait
      const old = this.envTex;
      this.envTex = buildEnvironment(this.renderer);
      this.bank.setEnvMap(this.envTex);
      old?.dispose();
      this.shadowsDirty = true;
      this.lastNow = 0;
      this.invalidate();
    };
    this.canvas.addEventListener('webglcontextlost', lost);
    this.canvas.addEventListener('webglcontextrestored', restored);
    this.cleanups.push(() => {
      this.canvas.removeEventListener('webglcontextlost', lost);
      this.canvas.removeEventListener('webglcontextrestored', restored);
    });
  }

  private listen(): void {
    this.gestures = new Gestures(this.canvas, {
      tap: (x, y) => {
        this.touch();
        const id = this.lit ? this.pick(x, y) : null;
        this.o.onSelect?.(id);
      },
      hover: (x, y) => {
        this.pointer = x === null || y === null ? null : { x, y };
        this.pointerDirty = true;
        this.invalidate();
      },
      dragStart: () => {
        this.dragging = true;
        this.cam.beginDrag();
        this.canvas.style.cursor = 'grabbing';
      },
      drag: (dx, dy, dt) => {
        this.cam.drag(dx, dy, dt);
        this.invalidate();
      },
      dragEnd: () => {
        this.dragging = false;
        this.cam.endDrag();
        this.canvas.style.cursor = this.hovered ? 'pointer' : '';
        this.invalidate();
      },
      swipe: (dir) => (dir > 0 ? this.next() : this.prev()),
      zoom: (f) => {
        this.cam.zoom(f);
        this.invalidate();
      },
      interact: () => this.touch(),
    });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        this.needsResize = true;
        this.invalidate();
      });
      ro.observe(this.canvas);
      this.cleanups.push(() => ro.disconnect());
    }
    const onResize = () => {
      this.needsResize = true;
      this.invalidate();
    };
    window.addEventListener('resize', onResize);
    this.cleanups.push(() => window.removeEventListener('resize', onResize));
    // changement de densité de pixels (écran externe, zoom du navigateur)
    let mq: MediaQueryList | null = null;
    const watchDpr = () => {
      mq?.removeEventListener('change', onDpr);
      if (!window.matchMedia) return;
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      mq.addEventListener('change', onDpr);
    };
    const onDpr = () => {
      onResize();
      watchDpr();
    };
    watchDpr();
    this.cleanups.push(() => mq?.removeEventListener('change', onDpr));
    const onVis = () => {
      if (!document.hidden) {
        this.lastNow = 0;
        this.invalidate();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVis));
    // polices chargées après la construction : on redessine les textes
    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (this.disposed) return;
        this.hall?.redrawTexts();
        this.atlas?.draw(this.entries.map((e) => e.data.code));
        this.invalidate();
      });
    }
  }

  /** Une interaction ou un appel : les animations de repos reprennent. */
  private touch(): void {
    this.lastActive = this.tl.time;
    this.invalidate();
  }

  /** Demande une image (et relance la boucle si elle dormait). */
  private invalidate(): void {
    this.dirty = true;
    markIdle(false);
    if (this.raf || this.paused || this.disposed || this.contextLost || !this.built) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed || this.paused || this.contextLost) return;
    let dt = this.lastNow ? (now - this.lastNow) / 1000 : 1 / 60;
    this.lastNow = now;
    dt = engineDebug.fixedDt > 0 ? engineDebug.fixedDt : Math.min(Math.max(dt, 0), engineDebug.maxDt);
    if (this.needsResize) this.resize();
    const active = this.update(dt);
    if (active || this.dirty) {
      this.render();
      this.dirty = false;
      if (active) this.watchFps(now);
    }
    if (active) this.raf = requestAnimationFrame(this.frame);
    else this.lastNow = 0;
    markIdle(!active && !this.queueBusy);
  };

  private watchFps(now: number): void {
    if (this.qualityMode !== 'auto' || engineDebug.noAutoQuality || !this.fps.armed) return;
    if (this.fps.frame(now, this.quality) === 'down') {
      this.applyQuality(lowerQuality(this.quality), true);
      this.fps.arm(now, 900);
    }
  }

  // ================================================================== image

  /** Avance tout d'un pas de temps ; renvoie true si quelque chose bouge encore. */
  private update(dt: number): boolean {
    const bays = this.bays;
    if (!bays) return false;
    this.tl.step(dt);
    const t = this.tl.time;
    let active = this.tl.busy;
    let machinesMoved = false;

    // animations de repos pendant quelques secondes après la dernière interaction
    const idleOn = this.lit && !this.reduced && !engineDebug.noIdle && t - this.lastActive < this.idleWindow;
    const idle0 = this.idle;
    this.idle = damp(this.idle, idleOn ? 1 : 0, idleOn ? 1.2 : 0.7, dt);
    if (!idleOn && this.idle < 0.004) this.idle = 0;
    if (idleOn && this.idle > 0.996) this.idle = 1;
    if (this.idle > 0 || this.idle !== idle0) active = true;

    if (this.cam.update(dt)) active = true;

    // machines : plateaux, poses, phares
    let beaconBest = 0;
    let beaconEntry: Entry | null = null;
    for (const e of this.entries) {
      const focused = e.data.id === this.target;
      const prevSpin = e.spin;
      if (!e.spinTween?.running && !focused && this.idle > 0) e.spin += dt * 0.05 * this.idle * e.spinDir;
      const yawBase = (e.holder.userData.yawBase as number | undefined) ?? this.slots[e.index]?.yaw ?? 0;
      e.holder.rotation.y = yawBase + e.spin;
      bays.setSpin(e.index, e.holder.rotation.y - (this.slots[e.index]?.yaw ?? 0));
      if (e.spin !== prevSpin) machinesMoved = true;
      e.view.breath = focused && e.view.articulated && !this.reduced ? this.idle : 0;
      if (e.view.articulated) {
        e.view.update(t);
        if (e.view.animating) machinesMoved = true;
      }
      // machines lointaines : pas de reflet au sol (le brouillard les estompe de toute façon)
      e.view.setReflected(e.holder.position.distanceToSquared(this.cam.pos) < 52 * 52);
      const flash = e.view.applyLights(t, e.own.lamp, e.own.beacon);
      if (e.view.animating || e.rise < 1) active = true;
      if (flash > beaconBest || (e.view.beacon > 0 && !beaconEntry)) {
        beaconBest = flash;
        beaconEntry = e;
      }
      // contact : l'ombre suit la montée de la machine
      if (e.rise < 1) bays.setFoot(e.index, { w: e.view.tpl.footprint.w * e.view.scale * e.rise, d: e.view.tpl.footprint.d * e.view.scale * e.rise });
    }
    if (beaconEntry && beaconEntry.view.beacon > 0 && beaconEntry.view.beaconWorld(this.beaconPos)) this.lights.setBeacon(this.beaconPos, beaconBest);
    else this.lights.setBeacon(null, 0);

    // projecteurs et baies
    const lr = this.lights.update(dt, (i) => {
      const e = this.entries[i];
      return e ? _tint.copy(WARM_SPOT).lerp(STATE_COLORS[e.data.state], 0.12) : WARM_SPOT;
    });
    if (lr.moving) active = true;
    if (lr.shadowsDirty || machinesMoved) this.shadowsDirty = true;
    for (const e of this.entries) bays.setReal(e.index, this.lights.realOf(e.index));
    if (bays.update(dt)) active = true;

    // poussière dans le faisceau vedette
    if (this.dust) {
      const q = QUALITY[this.quality];
      const show = q.dust && !this.reduced && this.lit;
      const heroBay = this.target ? this.entries.find((x) => x.data.id === this.target)?.index : undefined;
      if (show && heroBay !== undefined) {
        const s = this.slots[heroBay];
        this.dust.place(s.x, s.z);
        this.dust.step(dt, t, 0.55 * (engineDebug.noIdle ? 1 : this.idle) * this.lights.realOf(heroBay));
        if (this.idle > 0) active = true;
      } else this.dust.step(0, t, 0);
    }

    // survol (souris)
    if (this.pointerDirty && !this.dragging) {
      this.pointerDirty = false;
      const id = this.pointer && this.lit ? this.pick(this.pointer.x, this.pointer.y) : null;
      if (id !== this.hovered) {
        const prev = this.hovered ? this.entries.find((x) => x.data.id === this.hovered) : null;
        if (prev) bays.setGlow(prev.index, 0);
        this.hovered = id;
        const cur = id ? this.entries.find((x) => x.data.id === id) : null;
        if (cur) {
          bays.setGlow(cur.index, 1);
          this.sfx.tick();
        }
        this.canvas.style.cursor = id ? 'pointer' : '';
        this.o.onHover?.(id);
        active = true;
      }
    }

    // éclair de la photo
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 3.5);
      active = true;
    }
    return active;
  }

  private render(): void {
    this.renderNow(true, true);
  }

  private renderNow(withLabels: boolean, applyCamera: boolean): void {
    const r = this.renderer;
    if (!r || this.contextLost || this.disposed) return;
    if (this.shadowsDirty) {
      r.shadowMap.needsUpdate = true;
      this.shadowsDirty = false;
    }
    r.toneMappingExposure = (1 - 0.96 * this.cam.fade) * (1 + 0.9 * this.flash * this.flash);
    if (applyCamera) this.cam.apply();
    const stats = engineDebug.verbose;
    if (stats) {
      r.info.autoReset = false;
      r.info.reset();
    }
    if (this.post) this.post.render();
    else r.render(this.scene, this.cam.camera);
    if (stats) {
      (window as unknown as { __godetStats?: object }).__godetStats = {
        calls: r.info.render.calls,
        triangles: r.info.render.triangles,
        programs: r.info.programs?.length ?? 0,
        geometries: r.info.memory.geometries,
        textures: r.info.memory.textures,
        quality: this.quality,
        pixelRatio: this.pr,
      };
    }
    if (withLabels) this.updateLabels();
  }

  private updateLabels(): void {
    const sheet = this.insets.right > 0 || this.insets.bottom > 0;
    const places: LabelPlacement[] = this.entries.map((e) => {
      _w.set(0, e.view.height + 0.35, 0);
      return {
        id: e.data.id,
        world: _w.clone().add(e.holder.position),
        visible: e.rise > 0.95 && !(sheet && e.data.id === this.target) && this.cam.fade < 0.5,
        hot: e.data.id === this.hovered || e.data.id === this.target,
      };
    });
    this.labels.update(this.cam.camera, places, this.cssW, this.cssH, this.lit && this.labelsOn);
  }

  /** Machine sous le pointeur (boîtes englobantes orientées avec le plateau). */
  private pick(x: number, y: number): string | null {
    _ndc.set((x / this.cssW) * 2 - 1, -(y / this.cssH) * 2 + 1);
    this.cam.apply();
    this.raycaster.setFromCamera(_ndc, this.cam.camera);
    let best: string | null = null;
    let bestD = Infinity;
    for (const e of this.entries) {
      if (e.rise < 0.5) continue;
      e.holder.updateMatrixWorld();
      _inv.copy(e.holder.matrixWorld).invert();
      _ray.copy(this.raycaster.ray).applyMatrix4(_inv);
      if (_ray.intersectBox(e.box, _v)) {
        _v.applyMatrix4(e.holder.matrixWorld);
        const d = _v.distanceTo(this.raycaster.ray.origin);
        if (d < bestD) {
          bestD = d;
          best = e.data.id;
        }
      }
    }
    return best;
  }
}

const WARM_SPOT = new THREE.Color(1, 0.94, 0.86);
const _tint = new THREE.Color();

function disposeGroup(g: THREE.Group): void {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
  g.removeFromParent();
}

// ================================================================== point d'entrée

const live = new WeakMap<HTMLCanvasElement, Engine>();

/** Showroom inerte, rendu quand une construction a été remplacée (double montage React en développement). */
function inertShowroom(): Showroom {
  return {
    setMachines: () => {},
    focus: () => {},
    next: () => {},
    prev: () => {},
    focused: () => null,
    setInsets: () => {},
    intro: () => Promise.resolve(),
    unlockAudio: () => {},
    setSound: () => {},
    play: () => {},
    animate: () => {},
    setQuality: () => {},
    pause: () => {},
    resume: () => {},
    snapshot: () => Promise.resolve(null),
    dispose: () => {},
  };
}

export async function createShowroomImpl(options: ShowroomOptions): Promise<Showroom> {
  patchShaderChunks();
  // Un seul moteur par canvas : le précédent (montage React annulé) se retire avant que le suivant ne prenne
  // le contexte WebGL, pour ne jamais partager l'état du contexte entre deux moteurs.
  const prev = live.get(options.canvas);
  if (prev) {
    prev.supersede();
    await Promise.race([prev.disposedPromise, new Promise((r) => setTimeout(r, 4000))]);
  }
  const engine = new Engine(options);
  live.set(options.canvas, engine);
  try {
    await engine.build();
  } catch (err) {
    engine.dispose();
    if (live.get(options.canvas) === engine) live.delete(options.canvas);
    if (err instanceof Superseded || engine.superseded) return inertShowroom();
    throw err;
  }
  const api: Showroom = engine;
  const dispose = engine.dispose.bind(engine);
  engine.dispose = () => {
    dispose();
    if (live.get(options.canvas) === engine) live.delete(options.canvas);
  };
  return api;
}
