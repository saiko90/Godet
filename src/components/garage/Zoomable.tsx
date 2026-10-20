'use client';

// Zoom d'une photo dans la visionneuse : pincer (deux doigts), double-toucher ou double-clic, molette, boutons + / −,
// et déplacement de l'image agrandie. À l'échelle 1, le glisser horizontal reste au service de la visionneuse.
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const MAX = 6;
const STEP = 1.6;

interface Z {
  s: number;
  x: number;
  y: number;
}

export function Zoomable({ children }: { children: ReactNode }) {
  const t = useTranslations('garage.lightbox');
  const box = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState<Z>({ s: 1, x: 0, y: 0 });
  const zr = useRef(z);
  /** État courant, lu dans les gestionnaires d'événements sans attendre le rendu. */
  const apply = (next: Z) => {
    zr.current = next;
    setZ(next);
  };
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; mx: number; my: number; z: Z } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const moved = useRef(false);

  /** Garde l'image dans le cadre (pas de vide au-delà des bords une fois agrandie). */
  const clamp = (next: Z): Z => {
    const r = box.current?.getBoundingClientRect();
    if (!r || next.s <= 1.001) return { s: 1, x: 0, y: 0 };
    // Taille de la photo à l'échelle 1 (elle peut être plus petite que le cadre).
    const img = box.current?.querySelector('img')?.getBoundingClientRect();
    const w = img ? img.width / zr.current.s : r.width;
    const h = img ? img.height / zr.current.s : r.height;
    const mx = Math.max(0, (w * next.s - r.width) / 2);
    const my = Math.max(0, (h * next.s - r.height) / 2);
    return { s: next.s, x: Math.max(-mx, Math.min(mx, next.x)), y: Math.max(-my, Math.min(my, next.y)) };
  };

  /** Zoom vers `s` en gardant immobile le point (clientX, clientY) de l'écran. */
  const zoomAt = (s: number, clientX?: number, clientY?: number) => {
    const r = box.current?.getBoundingClientRect();
    const cur = zr.current;
    const next = Math.max(1, Math.min(MAX, s));
    if (!r) return apply({ s: next, x: 0, y: 0 });
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const px = clientX ?? cx;
    const py = clientY ?? cy;
    const ux = (px - cx - cur.x) / cur.s;
    const uy = (py - cy - cur.y) / cur.s;
    apply(clamp({ s: next, x: px - cx - ux * next, y: py - cy - uy * next }));
  };

  // Molette : écouteur non passif pour empêcher le défilement de la page.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(zr.current.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // zoomAt ne dépend que de références stables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomed = z.s > 1.001;

  return (
    <div
      ref={box}
      className={`g-zoom${zoomed ? ' is-zoomed' : ''}`}
      onPointerDown={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        e.currentTarget.setPointerCapture(e.pointerId);
        moved.current = false;
        if (pointers.current.size === 2) {
          const [a, b] = [...pointers.current.values()];
          pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, z: zr.current };
        }
        // Image agrandie (ou deux doigts) : le geste est pour le zoom, pas pour changer de photo.
        if (zoomed || pointers.current.size > 1) e.stopPropagation();
      }}
      onPointerMove={(e) => {
        const prev = pointers.current.get(e.pointerId);
        if (!prev) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2 && pinch.current) {
          const [a, b] = [...pointers.current.values()];
          const p = pinch.current;
          const s = Math.max(1, Math.min(MAX, (p.z.s * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(p.d, 1)));
          const r = box.current?.getBoundingClientRect();
          if (!r) return;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const ux = (p.mx - cx - p.z.x) / p.z.s;
          const uy = (p.my - cy - p.z.y) / p.z.s;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          moved.current = true;
          apply(clamp({ s, x: mx - cx - ux * s, y: my - cy - uy * s }));
        } else if (pointers.current.size === 1 && zr.current.s > 1.001) {
          const dx = e.clientX - prev.x;
          const dy = e.clientY - prev.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
          apply(clamp({ s: zr.current.s, x: zr.current.x + dx, y: zr.current.y + dy }));
        }
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (zoomed || moved.current) e.stopPropagation();
        // Double-toucher (doigt) : agrandir au point touché, ou revenir à l'image entière.
        if (e.pointerType !== 'mouse' && !moved.current && pointers.current.size === 0) {
          const now = Date.now();
          const last = lastTap.current;
          if (last && now - last.t < 320 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
            lastTap.current = null;
            if (zr.current.s > 1.001) apply({ s: 1, x: 0, y: 0 });
            else zoomAt(2.5, e.clientX, e.clientY);
          } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
        }
      }}
      onDragStart={(e) => e.preventDefault()}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        pinch.current = null;
      }}
      onDoubleClick={(e) => {
        if (zr.current.s > 1.001) apply({ s: 1, x: 0, y: 0 });
        else zoomAt(2.5, e.clientX, e.clientY);
      }}
    >
      <div className="g-zoom-inner" style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})` }}>
        {children}
      </div>
      <div className="g-zoom-btns" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn" aria-label={t('zoomOut')} disabled={!zoomed} onClick={() => zoomAt(zr.current.s / STEP)}>
          <span aria-hidden="true">−</span>
        </button>
        <button type="button" className="icon-btn" aria-label={t('zoomIn')} disabled={z.s >= MAX} onClick={() => zoomAt(zr.current.s * STEP)}>
          <span aria-hidden="true">+</span>
        </button>
        {zoomed ? (
          <button type="button" className="icon-btn g-zoom-reset" onClick={() => apply({ s: 1, x: 0, y: 0 })}>
            {t('zoomReset')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
