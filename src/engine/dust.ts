// Poussière en suspension dans le faisceau de la machine visée (qualité haute, sans mouvement réduit).
import * as THREE from 'three';
import { radialTexture } from './textures';

export class Dust {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private speed: Float32Array;
  private geo: THREE.BufferGeometry;
  private mat: THREE.PointsMaterial;
  private tex: THREE.Texture;
  private n = 380;
  private height: number;

  constructor(height: number, radius: number) {
    this.height = height - 1.4;
    this.pos = new Float32Array(this.n * 3);
    this.speed = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const r = Math.sqrt(Math.random()) * radius;
      const a = Math.random() * Math.PI * 2;
      this.pos[i * 3] = Math.cos(a) * r;
      this.pos[i * 3 + 1] = 0.3 + Math.random() * this.height;
      this.pos[i * 3 + 2] = Math.sin(a) * r;
      this.speed[i] = 0.04 + Math.random() * 0.1;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.tex = radialTexture(64);
    this.mat = new THREE.PointsMaterial({
      size: 0.05,
      map: this.tex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(1, 0.86, 0.62),
      opacity: 0,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.layers.set(2);
  }

  /** Place la poussière dans le faisceau d'une baie (le cône s'élargit vers le sol). */
  place(x: number, z: number): void {
    this.points.position.set(x, 0, z);
  }

  step(dt: number, t: number, opacity: number): void {
    this.mat.opacity = opacity;
    this.points.visible = opacity > 0.01;
    if (!this.points.visible) return;
    const p = this.pos;
    for (let i = 0; i < this.n; i++) {
      p[i * 3 + 1] += this.speed[i] * dt;
      p[i * 3] += Math.sin(t * 0.3 + i) * 0.0015;
      if (p[i * 3 + 1] > this.height) p[i * 3 + 1] = 0.3;
    }
    (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.tex.dispose();
    this.points.removeFromParent();
  }
}
