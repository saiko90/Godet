// Les baies d'exposition, toutes instanciées (quelques appels de dessin pour 1 ou 30 baies) :
// socle et liseré lumineux, plateau tournant, flaque de lumière du projecteur, ombre de contact de la machine,
// plafonnier et faisceau, borne d'état (vert / orange / rouge), marquages et code peint au sol.
import * as THREE from 'three';
import { Batch, compose, instanced } from './batch';
import { AISLE, DECK_Y, type HallDims, type Slot } from './layout';
import type { MaterialBank } from './materials';
import type { MachineState } from './types';
import type { CodeAtlas } from './textures';
import { deckTexture, poolTexture, radialTexture, softRectTexture } from './textures';
import { damp } from './tween';

export const STATE_COLORS: Record<MachineState, THREE.Color> = {
  ok: new THREE.Color('#4fd18b'),
  warn: new THREE.Color('#ff9a3c'),
  bad: new THREE.Color('#ff5b4e'),
};
const RING = new THREE.Color(1, 0.6, 0.1);
const WARM = new THREE.Color(1, 0.92, 0.8);

/** Faisceau lumineux : cône additif plus intense près du plafonnier et face à la caméra (effet volumique). */
function beamMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(1, 0.9, 0.76) },
      uStrength: { value: 1 },
      uFog: { value: 0.011 },
    },
    vertexShader: /* glsl */ `
      varying float vH;
      varying vec3 vN;
      varying vec3 vV;
      varying float vS;
      varying float vD;
      void main() {
        vH = uv.y;
        vec4 wp = vec4( position, 1.0 );
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
          vN = normalize( normalMatrix * mat3( instanceMatrix ) * normal );
        #else
          vN = normalize( normalMatrix * normal );
        #endif
        vec4 mv = modelViewMatrix * wp;
        vV = normalize( -mv.xyz );
        vD = length( mv.xyz );
        #ifdef USE_INSTANCING_COLOR
          vS = instanceColor.r;
        #else
          vS = 1.0;
        #endif
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      uniform float uFog;
      varying float vH;
      varying vec3 vN;
      varying vec3 vV;
      varying float vS;
      varying float vD;
      void main() {
        // intense près du plafonnier, encore perceptible jusqu'au plateau, effacé au contact du sol
        float h = clamp( vH, 0.0, 1.0 );
        float fall = smoothstep( 0.0, 0.22, h ) * ( 0.3 + 0.7 * pow( h, 1.6 ) );
        float edge = pow( abs( dot( normalize( vN ), normalize( vV ) ) ), 2.4 );
        float fog = exp( - vD * vD * uFog * uFog );
        float a = clamp( fall * edge * uStrength * vS * fog, 0.0, 1.0 );
        gl_FragColor = vec4( uColor * a, a );
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    // couleur déjà multipliée par l'opacité : addition directe (ONE, ONE)
    premultipliedAlpha: true,
    side: THREE.DoubleSide,
  });
}

interface BayRec {
  slot: Slot;
  spin: number;
  level: number;
  glow: number;
  glowTarget: number;
  focus: number;
  focusTarget: number;
  real: number;
  state: MachineState;
  foot: { w: number; d: number };
  pulse: number;
  pulseColor: THREE.Color;
}

const _c = new THREE.Color();
const _m = new THREE.Matrix4();

export class BayField {
  readonly group = new THREE.Group();
  private bays: BayRec[] = [];
  private meshes: {
    plinth?: THREE.InstancedMesh;
    lip?: THREE.InstancedMesh;
    ring?: THREE.InstancedMesh;
    deck?: THREE.InstancedMesh;
    pool?: THREE.InstancedMesh;
    shadow?: THREE.InstancedMesh;
    fixture?: THREE.InstancedMesh;
    housing?: THREE.InstancedMesh;
    beam?: THREE.InstancedMesh;
    post?: THREE.InstancedMesh;
    led?: THREE.InstancedMesh;
    glowDisc?: THREE.InstancedMesh;
  } = {};
  private marks: THREE.Mesh[] = [];
  private mats: {
    plinth: THREE.MeshStandardMaterial;
    lip: THREE.MeshStandardMaterial;
    deck: THREE.MeshStandardMaterial;
    post: THREE.MeshStandardMaterial;
    ring: THREE.MeshBasicMaterial;
    pool: THREE.MeshBasicMaterial;
    shadow: THREE.MeshBasicMaterial;
    fixture: THREE.MeshBasicMaterial;
    beam: THREE.ShaderMaterial;
    led: THREE.MeshBasicMaterial;
    glowDisc: THREE.MeshBasicMaterial;
    mark: THREE.MeshBasicMaterial;
    code: THREE.MeshBasicMaterial;
  };
  private textures: THREE.Texture[] = [];
  /** Niveau général des baies (allumage du hall). */
  master = 0;
  /** Niveau des marquages au sol. */
  floorLevel = 0;
  private dirtyColors = true;
  private dirtySpin = true;
  private height = 12.5;

  constructor(
    bank: MaterialBank,
    private atlas: CodeAtlas,
  ) {
    const deck = deckTexture();
    const pool = poolTexture();
    const soft = softRectTexture();
    const dot = radialTexture(64);
    this.textures.push(deck, pool, soft, dot);
    this.mats = {
      plinth: bank.std({ color: 0x15171a, metalness: 0.82, roughness: 0.3 }, 1),
      lip: bank.std({ color: 0xb8bec6, metalness: 1, roughness: 0.18 }, 1.2),
      deck: bank.std({ color: 0xc4c8ce, map: deck, metalness: 0.3, roughness: 0.42 }, 0.8),
      post: bank.std({ color: 0x14161a, metalness: 0.7, roughness: 0.35 }, 0.9),
      ring: bank.keep(new THREE.MeshBasicMaterial({ color: 0xffffff })),
      pool: bank.keep(
        new THREE.MeshBasicMaterial({ map: pool, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
      ),
      shadow: bank.keep(
        new THREE.MeshBasicMaterial({ map: soft, color: 0x000000, transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      ),
      fixture: bank.keep(new THREE.MeshBasicMaterial({ color: 0xffffff })),
      beam: bank.keep(beamMaterial()),
      led: bank.keep(new THREE.MeshBasicMaterial({ color: 0xffffff })),
      glowDisc: bank.keep(new THREE.MeshBasicMaterial({ map: dot, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
      mark: bank.keep(new THREE.MeshBasicMaterial({ color: RING.clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })),
      code: bank.keep(
        new THREE.MeshBasicMaterial({ map: atlas.texture, color: 0xece8de, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
      ),
    };
    this.group.name = 'baies';
  }

  get count(): number {
    return this.bays.length;
  }

  setFog(density: number): void {
    this.mats.beam.uniforms.uFog.value = density;
  }

  /** (Re)construit les baies pour une disposition donnée. Les états visuels sont conservés par index. */
  layout(slots: Slot[], dims: HallDims, codes: string[], states: MachineState[], feet: { w: number; d: number }[]): void {
    const old = this.bays;
    this.bays = slots.map((slot, i) => ({
      slot,
      spin: old[i]?.spin ?? 0,
      level: old[i]?.level ?? 0,
      glow: old[i]?.glow ?? 0,
      glowTarget: old[i]?.glowTarget ?? 0,
      focus: old[i]?.focus ?? 0,
      focusTarget: old[i]?.focusTarget ?? 0,
      real: old[i]?.real ?? 0,
      state: states[i] ?? 'ok',
      foot: feet[i] ?? { w: 3, d: 2 },
      pulse: 0,
      pulseColor: new THREE.Color(1, 1, 1),
    }));
    this.height = dims.height;
    this.clearMeshes();
    const n = slots.length;
    if (!n) return;
    const R = slots[0].radius;
    const H = dims.height;
    const at = (s: Slot, y: number, rot?: [number, number, number], sc?: [number, number, number]) => compose([s.x, y, s.z], rot, sc);

    const g = this.group;
    const M = this.meshes;
    M.plinth = instanced(new THREE.CylinderGeometry(R + 0.1, R + 0.2, 0.18, 120), this.mats.plinth, slots.map((s) => at(s, 0.09)));
    M.plinth.receiveShadow = true;
    M.lip = instanced(new THREE.TorusGeometry(R + 0.105, 0.018, 6, 180), this.mats.lip, slots.map((s) => at(s, 0.182, [Math.PI / 2, 0, 0])));
    M.ring = instanced(
      new THREE.TorusGeometry(R + 0.16, 0.034, 8, 220),
      this.mats.ring,
      slots.map((s) => at(s, 0.11, [Math.PI / 2, 0, 0])),
      slots.map(() => new THREE.Color(0, 0, 0)),
    );
    M.deck = instanced(new THREE.CylinderGeometry(R - 0.1, R - 0.1, 0.03, 120), this.mats.deck, slots.map((s) => at(s, DECK_Y - 0.015)));
    M.deck.receiveShadow = true;
    const poolGeo = new THREE.CircleGeometry(R - 0.15, 64);
    poolGeo.rotateX(-Math.PI / 2);
    M.pool = instanced(poolGeo, this.mats.pool, slots.map((s) => at(s, DECK_Y + 0.004)), slots.map(() => new THREE.Color(0, 0, 0)));
    M.pool.renderOrder = 1;
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    shadowGeo.rotateX(-Math.PI / 2);
    M.shadow = instanced(shadowGeo, this.mats.shadow, slots.map((s) => at(s, DECK_Y + 0.006)));
    M.shadow.renderOrder = 2;
    // plafonnier : anneau et disque lumineux, boîtier sombre
    const fixGeo = (() => {
      const b = new Batch();
      const tmpMat = this.mats.fixture;
      b.add(tmpMat, new THREE.TorusGeometry(0.46, 0.06, 8, 48), [0, 0, 0], [Math.PI / 2, 0, 0]);
      const disc = new THREE.CircleGeometry(0.38, 32);
      disc.rotateX(Math.PI / 2);
      b.add(tmpMat, disc, [0, -0.02, 0]);
      const grp = new THREE.Group();
      const mesh = b.build(grp)[0];
      const geo = mesh.geometry;
      return geo;
    })();
    M.fixture = instanced(fixGeo, this.mats.fixture, slots.map((s) => compose([s.x, H - 1.05, s.z + 0.9])), slots.map(() => new THREE.Color(0, 0, 0)));
    M.housing = instanced(new THREE.CylinderGeometry(0.56, 0.5, 0.3, 32), this.mats.post, slots.map((s) => compose([s.x, H - 0.88, s.z + 0.9])));
    // faisceaux : cône unité orienté du plafonnier vers le plateau
    const beamGeo = new THREE.CylinderGeometry(0.34, R - 0.2, 1, 48, 1, true);
    M.beam = instanced(
      beamGeo,
      this.mats.beam,
      slots.map((s) => {
        const top = new THREE.Vector3(s.x, H - 1.1, s.z + 0.9);
        const bot = new THREE.Vector3(s.x, DECK_Y, s.z);
        const len = top.distanceTo(bot);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
        return new THREE.Matrix4().compose(top.clone().add(bot).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1));
      }),
      slots.map(() => new THREE.Color(0, 0, 0)),
    );
    M.beam.renderOrder = 4;
    M.beam.frustumCulled = false;
    // bornes d'état
    const postAt = (s: Slot) => {
      const dir = s.hero ? new THREE.Vector2(0.8, 0.6) : new THREE.Vector2(-s.side * 0.45, 0.89).normalize();
      return new THREE.Vector3(s.x + dir.x * (R + 0.85), 0, s.z + dir.y * (R + 0.85));
    };
    const posts = slots.map(postAt);
    M.post = instanced(new THREE.BoxGeometry(0.16, 1.05, 0.16), this.mats.post, posts.map((p) => compose([p.x, 0.525, p.z])));
    M.post.castShadow = false;
    M.led = instanced(
      new THREE.BoxGeometry(0.17, 0.62, 0.17),
      this.mats.led,
      posts.map((p) => compose([p.x, 0.62, p.z], undefined, [1, 1, 1])),
      slots.map(() => new THREE.Color(0, 0, 0)),
    );
    const discGeo = new THREE.PlaneGeometry(1.4, 1.4);
    discGeo.rotateX(-Math.PI / 2);
    M.glowDisc = instanced(discGeo, this.mats.glowDisc, posts.map((p) => compose([p.x, 0.008, p.z])), slots.map(() => new THREE.Color(0, 0, 0)));
    M.glowDisc.renderOrder = 1;
    for (const m of Object.values(M)) if (m) g.add(m);

    // marquages d'angle et codes peints au sol (une géométrie fusionnée chacun)
    const mb = new Batch();
    const half = R + 0.7;
    const L = 1.3;
    for (const s of slots) {
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const cx = s.x + sx * half;
          const cz = s.z + sz * half;
          mb.add(this.mats.mark, new THREE.PlaneGeometry(L, 0.06), [cx - (sx * L) / 2, 0.005, cz], [-Math.PI / 2, 0, 0]);
          mb.add(this.mats.mark, new THREE.PlaneGeometry(0.06, L), [cx, 0.005, cz - (sz * L) / 2], [-Math.PI / 2, 0, 0]);
        }
    }
    this.marks.push(...mb.build(g));
    this.atlas.draw(codes);
    const cb = new Batch();
    slots.forEach((s, i) => {
      if (i >= this.atlas.capacity) return;
      const geo = new THREE.PlaneGeometry(3.2, 0.8);
      const [u0, v0, u1, v1] = this.atlas.uv(i);
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) ? u1 : u0, uv.getY(k) ? v1 : v0);
      geo.rotateX(-Math.PI / 2);
      if (s.hero) {
        cb.add(this.mats.code, geo, [s.x, 0.006, s.z + R + 1.25]);
      } else {
        // texte parallèle à l'allée, lisible depuis l'allée (le haut des lettres vers le mur)
        cb.add(this.mats.code, geo, [s.side * (AISLE + 0.75), 0.006, s.z], [0, s.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]);
      }
    });
    this.marks.push(...cb.build(g));
    for (const m of this.marks) {
      m.renderOrder = 1;
      m.receiveShadow = false;
    }
    this.dirtyColors = true;
    this.dirtySpin = true;
  }

  private clearMeshes(): void {
    for (const m of Object.values(this.meshes)) {
      if (!m) continue;
      m.geometry.dispose();
      m.dispose();
      m.removeFromParent();
    }
    this.meshes = {};
    for (const m of this.marks) {
      m.geometry.dispose();
      m.removeFromParent();
    }
    this.marks = [];
  }

  /** Emprise de la machine (ombre de contact) et code au sol. */
  setFoot(i: number, foot: { w: number; d: number }): void {
    const b = this.bays[i];
    if (!b) return;
    b.foot = foot;
    this.dirtySpin = true;
  }

  setState(i: number, state: MachineState): void {
    const b = this.bays[i];
    if (!b || b.state === state) return;
    b.state = state;
    this.dirtyColors = true;
  }

  setSpin(i: number, angle: number): void {
    const b = this.bays[i];
    if (!b || b.spin === angle) return;
    b.spin = angle;
    this.dirtySpin = true;
  }

  spinOf(i: number): number {
    return this.bays[i]?.spin ?? 0;
  }

  /** Niveau de la baie (allumage en cascade). */
  setLevel(i: number, level: number): void {
    const b = this.bays[i];
    if (!b || b.level === level) return;
    b.level = level;
    this.dirtyColors = true;
  }

  level(i: number): number {
    return this.bays[i]?.level ?? 0;
  }

  setGlow(i: number, v: number): void {
    const b = this.bays[i];
    if (b) b.glowTarget = v;
  }

  setFocus(i: number, v: number): void {
    const b = this.bays[i];
    if (b) b.focusTarget = v;
  }

  /** Part d'éclairage réel (projecteur) de la baie : la flaque simulée s'efface d'autant. */
  setReal(i: number, v: number): void {
    const b = this.bays[i];
    if (!b || Math.abs(b.real - v) < 1e-3) return;
    b.real = v;
    this.dirtyColors = true;
  }

  /** Éclair du liseré (enregistrement, alerte…). */
  pulse(i: number, color: THREE.Color, strength = 1): void {
    const b = this.bays[i];
    if (!b) return;
    b.pulse = strength;
    b.pulseColor.copy(color);
  }

  /** Avance les lissages ; renvoie true tant que quelque chose bouge. */
  update(dt: number): boolean {
    let moving = false;
    for (const b of this.bays) {
      if (Math.abs(b.glow - b.glowTarget) > 1e-3 || Math.abs(b.focus - b.focusTarget) > 1e-3) {
        b.glow = damp(b.glow, b.glowTarget, 8, dt);
        b.focus = damp(b.focus, b.focusTarget, 4, dt);
        if (Math.abs(b.glow - b.glowTarget) <= 1e-3) b.glow = b.glowTarget;
        if (Math.abs(b.focus - b.focusTarget) <= 1e-3) b.focus = b.focusTarget;
        this.dirtyColors = true;
        moving = true;
      }
      if (b.pulse > 0) {
        b.pulse = Math.max(0, b.pulse - dt * 1.4);
        this.dirtyColors = true;
        moving = true;
      }
    }
    if (this.dirtySpin) this.applySpin();
    if (this.dirtyColors) this.applyColors();
    return moving;
  }

  private applySpin(): void {
    this.dirtySpin = false;
    const { deck, shadow } = this.meshes;
    if (!deck || !shadow) return;
    this.bays.forEach((b, i) => {
      const a = b.slot.yaw + b.spin;
      deck.setMatrixAt(i, compose([b.slot.x, DECK_Y - 0.015, b.slot.z], [0, a, 0], undefined, _m));
      shadow.setMatrixAt(i, compose([b.slot.x, DECK_Y + 0.006, b.slot.z], [0, a, 0], [b.foot.w * 1.05, 1, b.foot.d * 1.3], _m));
    });
    deck.instanceMatrix.needsUpdate = true;
    shadow.instanceMatrix.needsUpdate = true;
  }

  private applyColors(): void {
    this.dirtyColors = false;
    const M = this.meshes;
    if (!M.ring || !M.fixture || !M.beam || !M.pool || !M.led || !M.glowDisc) return;
    const master = this.master;
    this.bays.forEach((b, i) => {
      const lv = b.level * master;
      const st = STATE_COLORS[b.state];
      // liseré : ambre, plus vif au survol et pour la machine visée ; éclair coloré éventuel
      _c.copy(RING).multiplyScalar((1.25 + b.glow * 1.6 + b.focus * 0.7) * lv);
      if (b.pulse > 0) _c.lerp(b.pulseColor.clone().multiplyScalar(3 * lv), Math.min(1, b.pulse));
      M.ring!.setColorAt(i, _c);
      _c.copy(WARM).multiplyScalar(1.7 * lv);
      M.fixture!.setColorAt(i, _c);
      _c.setRGB(0.5 * lv * (1 + 0.9 * b.focus), 0, 0);
      M.beam!.setColorAt(i, _c);
      // flaque : blanc chaud légèrement teinté par l'état
      _c.copy(WARM).lerp(st, 0.16).multiplyScalar(0.24 * lv * (1 - 0.85 * b.real));
      M.pool!.setColorAt(i, _c);
      _c.copy(st).multiplyScalar(1.35 * Math.max(0.35, lv));
      if (b.pulse > 0) _c.multiplyScalar(1 + b.pulse * 1.5);
      M.led!.setColorAt(i, _c);
      _c.copy(st).multiplyScalar(0.45 * Math.max(0.3, lv));
      M.glowDisc!.setColorAt(i, _c);
    });
    for (const m of [M.ring, M.fixture, M.beam, M.pool, M.led, M.glowDisc]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
    const fl = this.floorLevel * master;
    this.mats.mark.color.copy(RING).multiplyScalar(0.95 * fl);
    this.mats.mark.opacity = Math.min(1, 0.25 + fl);
    this.mats.code.color.setRGB(0.93, 0.91, 0.87).multiplyScalar(0.18 + 0.55 * fl);
  }

  /** Le hall s'allume ou s'éteint : on recalcule les couleurs. */
  touch(): void {
    this.dirtyColors = true;
  }

  dispose(): void {
    this.clearMeshes();
    for (const t of this.textures) t.dispose();
    this.group.removeFromParent();
  }

  /** Hauteur du hall (plafonniers). */
  get ceiling(): number {
    return this.height;
  }
}
