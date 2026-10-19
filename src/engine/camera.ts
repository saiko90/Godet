// Caméra : vols cinématographiques entre les machines (trajectoire courbe qui passe par l'allée, jamais à
// travers une machine ; accélération et décélération douces ; légère respiration de la focale ; durée selon
// la distance ; interruption sans à-coup), orbite limitée autour de la machine visée (glisser, molette,
// pincement) avec inertie, et décalage de vue quand l'interface couvre une partie de l'écran.
import * as THREE from 'three';
import { AISLE, DECK_Y, cameraFree, type HallDims, type Obstacle, type Slot } from './layout';
import { clamp, damp, launchEase, launchEaseSpeed, lerp, smoothstep, type Ease } from './tween';
import type { ShowroomInsets } from './types';

export interface CamPose {
  pos: THREE.Vector3;
  tgt: THREE.Vector3;
  fov: number;
}

export interface OrbitFrame {
  center: THREE.Vector3;
  az: number;
  el: number;
  dist: number;
  azRange: number;
  elMin: number;
  elMax: number;
  distMin: number;
  distMax: number;
}

export interface Viewport {
  w: number;
  h: number;
  insets: ShowroomInsets;
}

/** Focale verticale de base : plus ouverte en portrait. */
export function baseFov(vp: Viewport): number {
  const aspect = vp.w / Math.max(1, vp.h);
  return lerp(54, 40, smoothstep(0.55, 1.3, aspect));
}

/** Demi-angles disponibles (vertical, horizontal) dans la partie visible de l'écran. */
function visibleHalfAngles(vp: Viewport, fov: number): { v: number; h: number } {
  const t = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const vw = Math.max(80, vp.w - vp.insets.right);
  const vh = Math.max(80, vp.h - vp.insets.top - vp.insets.bottom);
  return { v: Math.atan((t * vh) / vp.h), h: Math.atan((t * vw) / vp.h) };
}

/** Distance pour cadrer une machine (rayon horizontal r, hauteur h) dans la partie visible. */
export function fitDistance(r: number, h: number, vp: Viewport, fov: number): number {
  const rs = Math.sqrt(r * r + (h * 0.5) * (h * 0.5));
  const a = visibleHalfAngles(vp, fov);
  // la sphère englobante doit tenir dans la partie visible, avec une marge (étiquette, respiration)
  const d = Math.max((rs * 0.9) / Math.sin(a.h * 0.86), (rs * 0.84) / Math.sin(a.v * 0.84));
  return clamp(d, 6, 34);
}

function orbitPos(f: { center: THREE.Vector3; az: number; el: number; dist: number }, out: THREE.Vector3): THREE.Vector3 {
  const ce = Math.cos(f.el);
  return out.set(f.center.x + f.dist * ce * Math.sin(f.az), f.center.y + f.dist * Math.sin(f.el), f.center.z + f.dist * ce * Math.cos(f.az));
}

/** Vue d'une machine : position devant elle (dans l'allée), orbite autorisée, orientation à donner au plateau. */
export function machineView(
  slot: Slot,
  radius: number,
  height: number,
  vp: Viewport,
  obstacles: Obstacle[],
  dims: HallDims,
): { pose: CamPose; frame: OrbitFrame; faceYaw: number } {
  const fov = baseFov(vp);
  const center = new THREE.Vector3(slot.x, DECK_Y + height * 0.42, slot.z);
  const d0 = fitDistance(radius, height, vp, fov);
  const el = 0.27;
  // θ : angle entre la perpendiculaire à l'allée et la direction de la caméra (vers l'entrée)
  const azFor = (theta: number) => (slot.hero ? 0.42 + (theta - 0.66) : Math.atan2(-slot.side * Math.cos(theta), Math.sin(theta)));
  const tmp = new THREE.Vector3();
  const free = (a: number, d: number) => {
    orbitPos({ center, az: a, el, dist: d }, tmp);
    return cameraFree(tmp, obstacles, dims, slot.index) && (slot.hero || Math.abs(tmp.x) < AISLE + 0.4);
  };
  // distance minimale pour que la caméra atteigne l'allée (baies latérales)
  const reach = (theta: number) => (slot.hero ? 0 : (Math.abs(slot.x) - (AISLE - 0.3)) / Math.max(0.2, Math.cos(theta) * Math.cos(el)));
  const thetas = [0.66, 0.56, 0.76, 0.46, 0.86, 0.36, 0.96, 1.06, 1.16, 1.26, 1.36];
  let best: { az: number; dist: number } | null = null;
  for (const th of thetas) {
    const d = Math.max(d0, reach(th));
    const a = azFor(th);
    if (!free(a, d)) continue;
    if (d <= d0 * 1.12) {
      best = { az: a, dist: d };
      break;
    }
    if (!best || d < best.dist) best = { az: a, dist: d };
  }
  const az = best ? best.az : azFor(1.1);
  const dist = best ? best.dist : Math.max(d0, reach(1.1));
  const frame: OrbitFrame = {
    center,
    az,
    el,
    dist,
    azRange: 1.0,
    elMin: 0.06,
    elMax: 0.85,
    distMin: Math.max(4.2, dist * 0.6),
    distMax: dist * 1.5,
  };
  const pos = orbitPos(frame, new THREE.Vector3());
  // le plateau tourne pour présenter l'avant de trois quarts (côté cabine) à la caméra
  const look = az - 0.62;
  const faceYaw = Math.atan2(-Math.cos(look), Math.sin(look));
  return { pose: { pos, tgt: center.clone(), fov }, frame, faceYaw };
}

/** Vue d'ensemble : depuis l'entrée, en hauteur, dans l'axe de l'allée ; tout le parc en perspective. */
export function overviewView(
  slots: Slot[],
  dims: HallDims,
  vp: Viewport,
  camera: THREE.PerspectiveCamera,
  sizes: { r: number; h: number }[] = [],
): { pose: CamPose; frame: OrbitFrame } {
  const fov = baseFov(vp) + 3;
  const n = slots.length;
  const span = dims.zFirst - dims.zLast;
  const cam = camera.clone();
  cam.clearViewOffset();
  cam.fov = fov;
  cam.aspect = vp.w / Math.max(1, vp.h);
  cam.updateProjectionMatrix();
  const insetsX = vp.insets.right / vp.w;
  const insetsTop = vp.insets.top / vp.h;
  const insetsBottom = vp.insets.bottom / vp.h;
  const p = new THREE.Vector3();
  const pts: THREE.Vector3[] = [];
  slots.forEach((s, i) => {
    const h = DECK_Y + (sizes[i]?.h ?? 3.4) + 0.5;
    if (slots.length === 1) {
      // une seule machine : tout le plateau et la machine entière
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        pts.push(new THREE.Vector3(s.x + Math.cos(a) * s.radius, 0.2, s.z + Math.sin(a) * s.radius));
      }
      pts.push(new THREE.Vector3(s.x, h, s.z));
    } else {
      pts.push(new THREE.Vector3(s.x - s.radius * 0.8, 0.2, s.z + s.radius * 0.5), new THREE.Vector3(s.x + s.radius * 0.8, 0.2, s.z + s.radius * 0.5), new THREE.Vector3(s.x, h, s.z));
    }
  });
  if (!pts.length) pts.push(new THREE.Vector3(0, 0, 0));
  const portrait = vp.w < vp.h;
  const fits = (pos: THREE.Vector3, tgt: THREE.Vector3) => {
    cam.position.copy(pos);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(true);
    for (const q of pts) {
      p.copy(q).project(cam);
      if (p.z > 1) return false;
      const x = (p.x + 1) / 2;
      const y = (1 - p.y) / 2;
      // portrait : on accepte de couper les baies latérales (l'allée reste lisible)
      const mx = portrait ? -0.8 : 0.0;
      // portrait : le bord avant des premiers plateaux peut sortir par le bas
      const below = portrait && q.y < 1 ? 0.2 : 0;
      if (x < mx || x > 1 - insetsX - mx || y < insetsTop + 0.12 || y > 1 - insetsBottom - 0.02 + below) return false;
    }
    return true;
  };
  let pos: THREE.Vector3;
  let tgt: THREE.Vector3;
  if (n <= 1) {
    // une seule machine : trois quarts avant, assez proche
    tgt = new THREE.Vector3(slots[0]?.x ?? 0, 1.4, slots[0]?.z ?? 0);
    const dir = new THREE.Vector3(Math.sin(0.42), 0.4, Math.cos(0.42)).normalize();
    let lo = 8;
    let hi = Math.min(30, (dims.zFront - 2 - tgt.z) / dir.z, (dims.height - 2 - tgt.y) / dir.y);
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (fits(tgt.clone().addScaledVector(dir, mid), tgt)) hi = mid;
      else lo = mid;
    }
    pos = tgt.clone().addScaledVector(dir, hi);
  } else {
    // depuis l'entrée : on recule et on monte jusqu'à ce que tout tienne (sans sortir du hall) ;
    // en portrait, regard plus plongeant le long de l'allée pour remplir la hauteur de l'écran
    tgt = portrait
      ? new THREE.Vector3(0, 0.4, dims.zFirst - clamp(span * 0.3 + 3, 3, 14))
      : new THREE.Vector3(0, 0.4, dims.zFirst - clamp(span * 0.42 + 5, 6, 24));
    const far = new THREE.Vector3(0, clamp(7 + span * 0.05, portrait ? 9.5 : 7.5, 10.6), dims.zFront - 2.2);
    const near = portrait ? new THREE.Vector3(0, 9.6, dims.zFirst + 9) : new THREE.Vector3(0, 6.5, Math.max(dims.zFirst + 9, tgt.z + 14));
    let lo = 0;
    let hi = 1;
    if (!fits(far, tgt)) lo = hi = 1;
    else
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        if (fits(near.clone().lerp(far, mid), tgt)) hi = mid;
        else lo = mid;
      }
    pos = near.clone().lerp(far, hi);
  }
  const off = pos.clone().sub(tgt);
  const dist = off.length();
  const frame: OrbitFrame = {
    center: tgt,
    az: Math.atan2(off.x, off.z),
    el: Math.asin(clamp(off.y / dist, -1, 1)),
    dist,
    azRange: 0.3,
    elMin: 0.08,
    elMax: 0.6,
    distMin: dist * 0.72,
    distMax: dist,
  };
  return { pose: { pos, tgt: tgt.clone(), fov }, frame };
}

/** Pose d'attente avant l'allumage : contre-plongée près de la première machine. */
export function standbyView(slot: Slot | undefined, vp: Viewport): { pose: CamPose; frame: OrbitFrame } {
  const s = slot ?? { x: 0, z: 0, side: 0, hero: true, radius: 5 };
  const center = new THREE.Vector3(s.x, 2.0, s.z);
  const az = s.hero ? -0.55 : Math.atan2(-s.side * 0.55, 0.84);
  const frame: OrbitFrame = { center, az, el: 0.06, dist: 14.5, azRange: 0.2, elMin: 0.02, elMax: 0.3, distMin: 12, distMax: 16 };
  return { pose: { pos: orbitPos(frame, new THREE.Vector3()), tgt: center.clone(), fov: baseFov(vp) - 2 }, frame };
}

// ------------------------------------------------------------------ trajectoire

/** Spline d'Hermite passant par des points, paramétrée par l'abscisse curviligne. */
class Path {
  private pts: THREE.Vector3[];
  private tans: THREE.Vector3[];
  private table: number[] = [];
  readonly length: number;
  private samplesPerSeg = 48;

  constructor(pts: THREE.Vector3[], startTangent: THREE.Vector3 | null, endTangent: THREE.Vector3 | null) {
    this.pts = pts;
    const n = pts.length;
    this.tans = pts.map((p, i) => {
      if (i === 0) return startTangent ? startTangent.clone() : pts[1].clone().sub(p).multiplyScalar(0.5);
      if (i === n - 1) return endTangent ? endTangent.clone() : p.clone().sub(pts[n - 2]).multiplyScalar(0.5);
      return pts[i + 1].clone().sub(pts[i - 1]).multiplyScalar(0.5);
    });
    // table des longueurs cumulées
    const tmp = new THREE.Vector3();
    const prev = pts[0].clone();
    let acc = 0;
    this.table.push(0);
    for (let s = 0; s < n - 1; s++) {
      for (let k = 1; k <= this.samplesPerSeg; k++) {
        this.raw(s, k / this.samplesPerSeg, tmp);
        acc += tmp.distanceTo(prev);
        prev.copy(tmp);
        this.table.push(acc);
      }
    }
    this.length = acc;
  }

  private raw(seg: number, t: number, out: THREE.Vector3): THREE.Vector3 {
    const p0 = this.pts[seg];
    const p1 = this.pts[seg + 1];
    const m0 = this.tans[seg];
    const m1 = this.tans[seg + 1];
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return out.set(
      h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
      h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
      h00 * p0.z + h10 * m0.z + h01 * p1.z + h11 * m1.z,
    );
  }

  /** Point à la fraction u (0..1) de la longueur. */
  at(u: number, out: THREE.Vector3): THREE.Vector3 {
    const target = clamp(u, 0, 1) * this.length;
    const tb = this.table;
    let lo = 0;
    let hi = tb.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tb[mid] < target) lo = mid;
      else hi = mid;
    }
    const span = tb[hi] - tb[lo];
    const f = span > 1e-9 ? (target - tb[lo]) / span : 0;
    const idx = lo + f;
    const seg = Math.min(this.pts.length - 2, Math.floor(idx / this.samplesPerSeg));
    const t = (idx - seg * this.samplesPerSeg) / this.samplesPerSeg;
    return this.raw(seg, clamp(t, 0, 1), out);
  }
}

function hermite(p0: THREE.Vector3, m0: THREE.Vector3, p1: THREE.Vector3, t: number, out: THREE.Vector3): THREE.Vector3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  return out.set(h00 * p0.x + h10 * m0.x + h01 * p1.x, h00 * p0.y + h10 * m0.y + h01 * p1.y, h00 * p0.z + h10 * m0.z + h01 * p1.z);
}

interface Flight {
  path: Path;
  T: number;
  t: number;
  v0: number;
  ease: Ease;
  tgt0: THREE.Vector3;
  tgt1: THREE.Vector3;
  tm0: THREE.Vector3;
  fov0: number;
  fov1: number;
  breath: number;
  ahead: number;
  arrive: OrbitFrame;
  resolve: (ok: boolean) => void;
}

export interface FlyOptions {
  instant?: boolean;
  reduced?: boolean;
  /** Durée imposée (sinon selon la distance). */
  duration?: number;
}

export class CameraDirector {
  readonly camera: THREE.PerspectiveCamera;
  readonly pos = new THREE.Vector3(0, 6, 30);
  readonly tgt = new THREE.Vector3(0, 1.5, 0);
  fov = 40;
  private vel = new THREE.Vector3();
  private tvel = new THREE.Vector3();
  private prevPos = new THREE.Vector3();
  private prevTgt = new THREE.Vector3();
  private flight: Flight | null = null;
  orbit: OrbitFrame | null = null;
  private az = 0;
  private el = 0;
  private dist = 10;
  private distTarget = 10;
  private vaz = 0;
  private vel_ = 0;
  private dragging = false;
  private vp: Viewport = { w: 1, h: 1, insets: { top: 0, right: 0, bottom: 0 } };
  private offset = new THREE.Vector2();
  private offsetTarget = new THREE.Vector2();
  /** Fondu au noir des coupes nettes (mouvement réduit) : 0..1, appliqué par le moteur à l'exposition. */
  fade = 0;
  private fadeDir = 0;
  private pendingCut: (() => void) | null = null;
  private pendingResolve: ((ok: boolean) => void) | null = null;
  private lastFov = -1;
  /** Durée du dernier vol lancé (s), pour caler le souffle et la rotation du plateau. */
  lastDuration = 0;

  constructor(
    private free: (p: THREE.Vector3) => boolean,
    private obstaclesFor: () => { obstacles: Obstacle[]; dims: HallDims },
  ) {
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.camera.layers.enable(2);
  }

  get flying(): boolean {
    return !!this.flight;
  }

  setViewport(vp: Viewport): void {
    this.vp = vp;
    this.camera.aspect = vp.w / Math.max(1, vp.h);
    this.offsetTarget.set(vp.insets.right / 2, (vp.insets.bottom - vp.insets.top) / 2);
    this.lastFov = -1;
  }

  /** Coupe nette vers une pose (sans vol). */
  jump(pose: CamPose, frame: OrbitFrame): void {
    this.cancelFlight();
    this.lastDuration = 0;
    this.pos.copy(pose.pos);
    this.tgt.copy(pose.tgt);
    this.fov = pose.fov;
    this.setOrbit(frame);
    this.vel.set(0, 0, 0);
    this.tvel.set(0, 0, 0);
    this.prevPos.copy(this.pos);
    this.prevTgt.copy(this.tgt);
  }

  /** Vol vers une pose ; arrivée en orbite autour de frame.center. Promesse : true si arrivé. */
  flyTo(pose: CamPose, frame: OrbitFrame, o: FlyOptions = {}): Promise<boolean> {
    if (o.instant) {
      this.jump(pose, frame);
      return Promise.resolve(true);
    }
    if (o.reduced) {
      // mouvement réduit : fondu au noir très court, coupe, retour
      this.cancelFlight();
      return new Promise((resolve) => {
        this.fadeDir = 1;
        this.pendingResolve = resolve;
        this.pendingCut = () => {
          this.pendingResolve = null;
          this.jump(pose, frame);
          resolve(true);
        };
      });
    }
    const from = this.pos.clone();
    const to = pose.pos.clone();
    const straight = from.distanceTo(to);
    // virage du regard (rad) : pour les vols courts mais qui tournent beaucoup
    const d0 = this.tgt.clone().sub(this.pos).normalize();
    const d1 = pose.tgt.clone().sub(pose.pos).normalize();
    const turn = Math.acos(clamp(d0.dot(d1), -1, 1));
    const { obstacles, dims } = this.obstaclesFor();

    // points de passage : on rejoint l'allée, on s'élève un peu (vol de grue) et on recule si le regard tourne fort
    const pts: THREE.Vector3[] = [from];
    if (straight > 3) {
      const mid = from.clone().lerp(to, 0.5);
      mid.x = clamp(mid.x, -(AISLE - 1.0), AISLE - 1.0);
      mid.y = Math.max(from.y, to.y) + clamp(0.035 * straight + 0.5 * turn, 0.3, 3.4);
      mid.z += clamp(turn * 2.6, 0, 6) * (straight < 18 ? 1 : 0.4);
      mid.y = Math.min(mid.y, dims.height - 1.6);
      mid.z = Math.min(mid.z, dims.zFront - 2);
      if (this.free(mid) || straight > 6) pts.push(mid);
    }
    pts.push(to);
    // vitesse actuelle (enchaînement sans à-coup)
    const speed = this.vel.length();
    let startTan: THREE.Vector3 | null = null;
    // tangente d'arrivée douce : on « se pose » dans l'axe du regard final
    const endTan = d1.clone().multiplyScalar(Math.min(straight * 0.35, 6));
    let path = new Path(pts, startTan, endTan);
    let L = Math.max(0.01, path.length);
    const T = o.duration ?? clamp(0.9 + 0.032 * L + 0.18 * turn, 0.9, 2.2);
    if (speed > 0.05) {
      startTan = this.vel.clone().multiplyScalar(T / (pts.length - 1));
      if (startTan.length() > L) startTan.setLength(L);
      path = new Path(pts, startTan, endTan);
      L = Math.max(0.01, path.length);
    }
    // vérification des collisions : on relève le point médian si besoin
    if (pts.length === 3) {
      const tmp = new THREE.Vector3();
      for (let tries = 0; tries < 4; tries++) {
        let hit = false;
        for (let k = 1; k < 24; k++) {
          path.at(k / 24, tmp);
          if (!cameraFree(tmp, obstacles, dims)) {
            hit = true;
            break;
          }
        }
        if (!hit) break;
        pts[1].y = Math.min(dims.height - 1.6, pts[1].y + 1.6);
        pts[1].x *= 0.5;
        path = new Path(pts, startTan, endTan);
      }
      L = Math.max(0.01, path.length);
    }
    const v0 = speed > 0.05 ? (speed * T) / L : 0;
    // la cible du regard garde aussi sa vitesse
    const tm0 = this.tvel.clone().multiplyScalar(T);
    if (tm0.length() > this.tgt.distanceTo(pose.tgt) * 1.2) tm0.setLength(this.tgt.distanceTo(pose.tgt) * 1.2);

    this.cancelFlight();
    this.orbit = null;
    this.dragging = false;
    this.vaz = 0;
    this.vel_ = 0;
    this.lastDuration = T;
    return new Promise((resolve) => {
      this.flight = {
        path,
        T,
        t: 0,
        v0,
        ease: launchEase(v0),
        tgt0: this.tgt.clone(),
        tgt1: pose.tgt.clone(),
        tm0,
        fov0: this.fov,
        fov1: pose.fov,
        breath: clamp(L / 22, 0.15, 1) * 4.5,
        ahead: clamp((L - 16) / 30, 0, 0.55),
        arrive: frame,
        resolve,
      };
    });
  }

  /** Vitesse de progression courante du vol (pour un éventuel enchaînement). */
  get flightProgressSpeed(): number {
    const f = this.flight;
    if (!f) return 0;
    return launchEaseSpeed(f.v0, f.t / f.T);
  }

  cancelFlight(): void {
    if (this.flight) {
      const f = this.flight;
      this.flight = null;
      f.resolve(false);
    }
    if (this.pendingCut) {
      this.pendingCut = null;
      this.fadeDir = -1;
      const r = this.pendingResolve;
      this.pendingResolve = null;
      r?.(false);
    }
  }

  private setOrbit(frame: OrbitFrame): void {
    this.orbit = frame;
    const d = this.pos.clone().sub(frame.center);
    this.dist = d.length();
    this.distTarget = this.dist;
    this.az = Math.atan2(d.x, d.z);
    this.el = Math.asin(clamp(d.y / Math.max(1e-4, this.dist), -1, 1));
    this.vaz = 0;
    this.vel_ = 0;
  }

  /** Recentre l'orbite (autre cadrage pour la même machine, ex. fiche ouverte) avec un petit vol. */
  refit(frame: OrbitFrame): void {
    if (this.flight || !this.orbit) return;
    const ratio = this.distTarget / Math.max(1e-3, this.orbit.dist);
    this.orbit = frame;
    this.distTarget = clamp(frame.dist * ratio, frame.distMin, frame.distMax);
  }

  // ---------------------------------------------------------------- gestes

  beginDrag(): void {
    if (this.flight || !this.orbit) return;
    this.dragging = true;
    this.vaz = 0;
    this.vel_ = 0;
  }

  /** Glisser : dx, dy en pixels CSS, dt en secondes depuis le dernier mouvement. */
  drag(dx: number, dy: number, dt: number): void {
    if (!this.orbit || this.flight) return;
    const k = 3.2 / Math.max(320, Math.min(this.vp.w, this.vp.h * 1.4));
    const daz = -dx * k;
    const del = dy * k * 0.8;
    this.applyOrbit(daz, del);
    if (dt > 0) {
      this.vaz = lerp(this.vaz, daz / dt, 0.5);
      this.vel_ = lerp(this.vel_, del / dt, 0.5);
    }
  }

  endDrag(): void {
    this.dragging = false;
    this.vaz = clamp(this.vaz, -3, 3);
    this.vel_ = clamp(this.vel_, -2, 2);
  }

  /** Zoom (facteur multiplicatif sur la distance). */
  zoom(factor: number): void {
    if (!this.orbit || this.flight) return;
    const o = this.orbit;
    const next = clamp(this.distTarget * factor, o.distMin, o.distMax);
    const test = orbitPos({ center: o.center, az: this.az, el: this.el, dist: next }, new THREE.Vector3());
    if (this.free(test)) this.distTarget = next;
  }

  private applyOrbit(daz: number, del: number): boolean {
    const o = this.orbit;
    if (!o) return false;
    const az = clamp(this.az + daz, o.az - o.azRange, o.az + o.azRange);
    const el = clamp(this.el + del, o.elMin, o.elMax);
    const test = orbitPos({ center: o.center, az, el, dist: this.dist }, new THREE.Vector3());
    if (this.free(test)) {
      const moved = az !== this.az || el !== this.el;
      this.az = az;
      this.el = el;
      return moved;
    }
    // on essaie de ne garder que la composante verticale
    const test2 = orbitPos({ center: o.center, az: this.az, el, dist: this.dist }, new THREE.Vector3());
    if (this.free(test2)) {
      this.el = el;
    }
    this.vaz = 0;
    return false;
  }

  // ---------------------------------------------------------------- image

  /** Avance la caméra ; renvoie true si elle bouge encore. */
  update(dt: number): boolean {
    let moving = false;
    const f = this.flight;
    if (f) {
      f.t += dt;
      const k = Math.min(1, f.t / f.T);
      const e = f.ease(k);
      f.path.at(e, this.pos);
      hermite(f.tgt0, f.tm0, f.tgt1, clamp(e, 0, 1), this.tgt);
      // regard porté vers l'avant au milieu des longs vols (travelling dans l'allée)
      if (f.ahead > 0) {
        const w = Math.pow(Math.sin(Math.PI * k), 2) * f.ahead;
        const ahead = f.path.at(Math.min(1, e + 0.18), new THREE.Vector3());
        ahead.y -= 1.4;
        this.tgt.lerp(ahead, w);
      }
      this.fov = lerp(f.fov0, f.fov1, e) + f.breath * Math.pow(Math.sin(Math.PI * k), 2);
      moving = true;
      if (k >= 1) {
        this.flight = null;
        this.fov = f.fov1;
        this.tgt.copy(f.tgt1);
        this.setOrbit(f.arrive);
        f.resolve(true);
      }
    } else if (this.orbit) {
      const o = this.orbit;
      if (!this.dragging && (Math.abs(this.vaz) > 1e-3 || Math.abs(this.vel_) > 1e-3)) {
        this.applyOrbit(this.vaz * dt, this.vel_ * dt);
        const decay = Math.exp(-4.2 * dt);
        this.vaz *= decay;
        this.vel_ *= decay;
        if (Math.abs(this.vaz) < 1e-3) this.vaz = 0;
        if (Math.abs(this.vel_) < 1e-3) this.vel_ = 0;
        moving = true;
      }
      if (Math.abs(this.dist - this.distTarget) > 1e-3) {
        this.dist = damp(this.dist, this.distTarget, 7, dt);
        if (Math.abs(this.dist - this.distTarget) <= 1e-3) this.dist = this.distTarget;
        moving = true;
      }
      orbitPos({ center: o.center, az: this.az, el: this.el, dist: this.dist }, this.pos);
      if (this.tgt.distanceToSquared(o.center) > 1e-6) {
        this.tgt.lerp(o.center, 1 - Math.exp(-8 * dt));
        moving = true;
      }
      if (this.dragging) moving = true;
    }
    // fondu des coupes nettes
    if (this.fadeDir !== 0) {
      this.fade = clamp(this.fade + this.fadeDir * dt * 7, 0, 1);
      if (this.fade >= 1 && this.fadeDir > 0) {
        const cut = this.pendingCut;
        this.pendingCut = null;
        cut?.();
        this.fadeDir = -1;
      } else if (this.fade <= 0 && this.fadeDir < 0) {
        this.fadeDir = 0;
      }
      moving = true;
    }
    // vitesses (pour enchaîner un nouveau vol)
    if (dt > 0) {
      const a = 1 - Math.exp(-14 * dt);
      this.vel.lerp(this.pos.clone().sub(this.prevPos).divideScalar(dt), a);
      this.tvel.lerp(this.tgt.clone().sub(this.prevTgt).divideScalar(dt), a);
      if (!moving) {
        this.vel.set(0, 0, 0);
        this.tvel.set(0, 0, 0);
      }
    }
    this.prevPos.copy(this.pos);
    this.prevTgt.copy(this.tgt);
    // décalage de vue (fiche ouverte)
    if (this.offset.distanceToSquared(this.offsetTarget) > 0.01) {
      this.offset.x = damp(this.offset.x, this.offsetTarget.x, 6, dt);
      this.offset.y = damp(this.offset.y, this.offsetTarget.y, 6, dt);
      if (this.offset.distanceToSquared(this.offsetTarget) <= 0.01) this.offset.copy(this.offsetTarget);
      moving = true;
    }
    this.apply();
    return moving;
  }

  /** Applique pose, focale et décalage à la caméra three.js. */
  apply(): void {
    const c = this.camera;
    c.position.copy(this.pos);
    c.lookAt(this.tgt);
    if (Math.abs(this.offset.x) < 0.5 && Math.abs(this.offset.y) < 0.5) {
      if (c.view && c.view.enabled) c.clearViewOffset();
    } else {
      c.setViewOffset(this.vp.w, this.vp.h, this.offset.x, this.offset.y, this.vp.w, this.vp.h);
    }
    if (this.fov !== this.lastFov || c.view?.enabled) {
      c.fov = this.fov;
      c.updateProjectionMatrix();
      this.lastFov = this.fov;
    }
    c.updateMatrixWorld();
  }

  /** Rendu sans décalage (photo centrée), puis retour. */
  withoutOffset<T>(fn: () => T): T {
    const c = this.camera;
    const had = c.view?.enabled;
    if (had) {
      c.clearViewOffset();
      c.updateProjectionMatrix();
    }
    try {
      return fn();
    } finally {
      if (had) this.apply();
    }
  }

  /** Distance horizontale actuelle à un point. */
  distanceTo(p: THREE.Vector3): number {
    return this.pos.distanceTo(p);
  }
}
