// Gestes sur le canvas : toucher ou clic = sélection ; glisser = tourner autour de la machine ;
// balayage horizontal rapide = machine suivante / précédente ; molette ou pincement = zoom ; survol (souris).
// Le clavier est géré par l'interface React (elle appelle next / prev / focus).

export interface GestureHandlers {
  tap(x: number, y: number): void;
  hover(x: number | null, y: number | null): void;
  dragStart(): void;
  drag(dx: number, dy: number, dt: number): void;
  dragEnd(): void;
  swipe(dir: 1 | -1): void;
  zoom(factor: number): void;
  /** Toute interaction (réveille les animations de repos). */
  interact(): void;
}

interface Track {
  x: number;
  y: number;
  t: number;
  sx: number;
  sy: number;
  st: number;
  type: string;
  samples: { x: number; y: number; t: number }[];
}

export class Gestures {
  private pointers = new Map<number, Track>();
  private dragging = false;
  private pinch: { d: number } | null = null;
  private wasPinch = false;
  private disposed = false;

  constructor(
    private el: HTMLElement,
    private h: GestureHandlers,
  ) {
    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.cancel);
    el.addEventListener('pointerleave', this.leave);
    el.addEventListener('wheel', this.wheel, { passive: false });
    el.style.touchAction = 'none';
  }

  private local(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const { x, y } = this.local(e);
    const now = performance.now();
    this.pointers.set(e.pointerId, { x, y, t: now, sx: x, sy: y, st: now, type: e.pointerType, samples: [{ x, y, t: now }] });
    try {
      this.el.setPointerCapture(e.pointerId);
    } catch {
      /* capture indisponible */
    }
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
      this.wasPinch = true;
      if (this.dragging) {
        this.dragging = false;
        this.h.dragEnd();
      }
    }
    this.h.interact();
  };

  private move = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    const { x, y } = this.local(e);
    if (!p) {
      if (e.pointerType === 'mouse') this.h.hover(x, y);
      return;
    }
    const now = performance.now();
    const dx = x - p.x;
    const dy = y - p.y;
    const dt = Math.max(1e-3, (now - p.t) / 1000);
    p.x = x;
    p.y = y;
    p.t = now;
    p.samples.push({ x, y, t: now });
    while (p.samples.length > 2 && now - p.samples[0].t > 120) p.samples.shift();
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 10 && this.pinch.d > 10) this.h.zoom(this.pinch.d / d);
      this.pinch.d = d;
      this.h.interact();
      return;
    }
    const threshold = p.type === 'mouse' ? 5 : 9;
    if (!this.dragging && Math.hypot(x - p.sx, y - p.sy) > threshold && !this.wasPinch) {
      this.dragging = true;
      this.h.dragStart();
    }
    if (this.dragging) {
      this.h.drag(dx, dy, dt);
      this.h.interact();
    }
  };

  private up = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    this.pointers.delete(e.pointerId);
    try {
      this.el.releasePointerCapture(e.pointerId);
    } catch {
      /* déjà relâché */
    }
    const now = performance.now();
    const total = Math.hypot(p.x - p.sx, p.y - p.sy);
    const dur = now - p.st;
    if (this.pointers.size === 0) {
      this.pinch = null;
      const wasPinch = this.wasPinch;
      this.wasPinch = false;
      if (this.dragging) {
        this.dragging = false;
        // balayage rapide et horizontal : machine suivante / précédente
        const first = p.samples[0];
        const vx = first && now > first.t ? (p.x - first.x) / (now - first.t) : 0;
        const tdx = p.x - p.sx;
        const tdy = p.y - p.sy;
        this.h.dragEnd();
        if (!wasPinch && Math.abs(vx) > 0.5 && Math.abs(tdx) > 50 && Math.abs(tdx) > 1.4 * Math.abs(tdy) && dur < 480) {
          this.h.swipe(tdx < 0 ? 1 : -1);
        }
      } else if (!wasPinch && total < (p.type === 'mouse' ? 6 : 12) && dur < 650) {
        this.h.tap(p.x, p.y);
      }
    } else if (this.pointers.size === 1) {
      // fin du pincement : on repart d'un geste propre
      this.pinch = null;
      const rest = [...this.pointers.values()][0];
      rest.sx = rest.x;
      rest.sy = rest.y;
    }
  };

  private cancel = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) {
      this.pinch = null;
      this.wasPinch = false;
      if (this.dragging) {
        this.dragging = false;
        this.h.dragEnd();
      }
    }
  };

  private leave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !this.pointers.has(e.pointerId)) this.h.hover(null, null);
  };

  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= 400;
    const k = e.ctrlKey ? 0.01 : 0.0012;
    this.h.zoom(Math.exp(Math.max(-0.5, Math.min(0.5, dy * k))));
    this.h.interact();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const el = this.el;
    el.removeEventListener('pointerdown', this.down);
    el.removeEventListener('pointermove', this.move);
    el.removeEventListener('pointerup', this.up);
    el.removeEventListener('pointercancel', this.cancel);
    el.removeEventListener('pointerleave', this.leave);
    el.removeEventListener('wheel', this.wheel);
  }
}
