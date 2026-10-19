// Étiquettes flottantes au-dessus des machines (couche HTML posée sur le canvas) : code, libellé, pastille
// d'état et nombre d'alertes. Masquées hors champ, derrière la caméra ou trop loin ; plus petites au loin.
// Elles reprennent les classes communes .tag, .dot, .hot, .hide (globals.css) et celles d'engine.css.
import * as THREE from 'three';
import type { MachineState } from './types';

export interface LabelData {
  id: string;
  code: string;
  label: string;
  state: MachineState;
  alerts: number;
}

export interface LabelPlacement {
  id: string;
  world: THREE.Vector3;
  visible: boolean;
  hot: boolean;
}

interface Tag {
  el: HTMLDivElement;
  data: LabelData;
  shown: boolean;
  x: number;
  y: number;
  s: number;
  /** Largeur mesurée (px), pour éviter les chevauchements. */
  w: number;
}

const _p = new THREE.Vector3();
const _v = new THREE.Vector3();

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export class Labels {
  private tags = new Map<string, Tag>();

  constructor(
    private layer: HTMLElement | null,
    private onClick: (id: string) => void,
  ) {}

  /** Crée, met à jour ou retire les étiquettes. */
  sync(list: LabelData[]): void {
    if (!this.layer) return;
    const keep = new Set(list.map((d) => d.id));
    for (const [id, t] of this.tags) {
      if (!keep.has(id)) {
        t.el.remove();
        this.tags.delete(id);
      }
    }
    for (const d of list) {
      let t = this.tags.get(d.id);
      if (!t) {
        const el = document.createElement('div');
        el.className = 'tag gd-tag hide';
        el.setAttribute('aria-hidden', 'true');
        el.dataset.id = d.id;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onClick(d.id);
        });
        this.layer.appendChild(el);
        t = { el, data: d, shown: false, x: 0, y: 0, s: 1, w: 0 };
        this.tags.set(d.id, t);
        this.render(t);
      } else if (t.data.code !== d.code || t.data.label !== d.label || t.data.state !== d.state || t.data.alerts !== d.alerts) {
        t.data = d;
        this.render(t);
      }
    }
  }

  private render(t: Tag): void {
    const d = t.data;
    const alerts =
      d.alerts > 0 ? `<em class="gd-alerts ${d.state === 'bad' ? 'bad' : ''}" title="${d.alerts} alerte${d.alerts > 1 ? 's' : ''}">${d.alerts}</em>` : '';
    t.el.innerHTML = `<i class="dot ${d.state === 'ok' ? '' : d.state}"></i><b>${escapeHtml(d.code)}</b><span>${escapeHtml(d.label)}</span>${alerts}`;
    t.w = 0;
  }

  /** Place les étiquettes pour l'image courante. w, h : taille CSS du canvas. */
  update(camera: THREE.PerspectiveCamera, places: LabelPlacement[], w: number, h: number, enabled: boolean): void {
    if (!this.layer) return;
    camera.updateMatrixWorld();
    // 1. projection de chaque étiquette candidate
    const cand: { t: Tag; pl: LabelPlacement; x: number; y: number; s: number; dist: number }[] = [];
    for (const pl of places) {
      const t = this.tags.get(pl.id);
      if (!t) continue;
      if (!enabled || !pl.visible) {
        this.show(t, false, pl.hot);
        continue;
      }
      _v.copy(pl.world).applyMatrix4(camera.matrixWorldInverse);
      const dist = -_v.z;
      _p.copy(pl.world).project(camera);
      if (dist < 0.5 || _p.z > 1 || Math.abs(_p.x) > 1.08 || Math.abs(_p.y) > 1.08 || dist > 95) {
        this.show(t, false, pl.hot);
        continue;
      }
      cand.push({ t, pl, x: ((_p.x + 1) / 2) * w, y: ((1 - _p.y) / 2) * h, s: Math.max(0.72, Math.min(1, 18 / dist)), dist });
    }
    // 2. les plus proches d'abord (et la machine visée ou survolée en priorité) ; on masque celles qui se chevauchent
    cand.sort((a, b) => Number(b.pl.hot) - Number(a.pl.hot) || a.dist - b.dist);
    const taken: { x0: number; x1: number; y0: number; y1: number }[] = [];
    for (const c of cand) {
      const t = c.t;
      if (!t.w) t.w = t.el.offsetWidth || 150;
      const hw = (t.w * c.s) / 2 + 4;
      const r = { x0: c.x - hw, x1: c.x + hw, y0: c.y - 14 - 30 * c.s, y1: c.y - 10 };
      const overlap = taken.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0);
      if (overlap && !c.pl.hot) {
        this.show(t, false, false);
        continue;
      }
      taken.push(r);
      if (Math.abs(c.x - t.x) > 0.05 || Math.abs(c.y - t.y) > 0.05 || c.s !== t.s || !t.shown) {
        t.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 14px)) scale(${c.s.toFixed(3)})`;
        t.x = c.x;
        t.y = c.y;
        t.s = c.s;
      }
      t.el.style.zIndex = String(1000 - Math.round(c.dist * 4));
      t.el.style.opacity = c.dist > 60 ? String(Math.max(0, 1 - (c.dist - 60) / 35)) : '';
      this.show(t, true, c.pl.hot);
    }
  }

  private show(t: Tag, show: boolean, hot: boolean): void {
    if (show !== t.shown) {
      t.el.classList.toggle('hide', !show);
      t.shown = show;
      // l'opacité en ligne (étiquettes lointaines) l'emporterait sur .hide
      if (!show) t.el.style.opacity = '';
    }
    t.el.classList.toggle('hot', hot && show);
  }

  hideAll(): void {
    for (const t of this.tags.values()) {
      t.el.classList.add('hide');
      t.shown = false;
    }
  }

  dispose(): void {
    for (const t of this.tags.values()) t.el.remove();
    this.tags.clear();
  }
}
