'use client';

// Signature au doigt (ou à la souris) : trait lissé, effacer, export PNG sur fond blanc.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface SignatureHandle {
  /** Image PNG de la signature, ou null si rien n'a été dessiné. */
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
}

export const SignaturePad = forwardRef<SignatureHandle, { label: string; clearLabel: string; onChange?: (signed: boolean) => void }>(function SignaturePad(
  { label, clearLabel, onChange },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [signed, setSigned] = useState(false);

  // Résolution réelle de l'écran (trait net), recalculée si la largeur change (rotation de la tablette).
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      if (!r.width || c.width === Math.round(r.width * ratio)) return;
      // Le trait déjà dessiné est gardé (barre de défilement, message affiché, rotation : la largeur change).
      const keep = c.width && c.height ? document.createElement('canvas') : null;
      if (keep) {
        keep.width = c.width;
        keep.height = c.height;
        keep.getContext('2d')?.drawImage(c, 0, 0);
      }
      c.width = Math.round(r.width * ratio);
      c.height = Math.round(r.height * ratio);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      if (keep) ctx.drawImage(keep, 0, 0, keep.width, keep.height, 0, 0, c.width, c.height);
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#111';
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  useImperativeHandle(ref, () => ({
    clear() {
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.restore();
      setSigned(false);
      onChange?.(false);
    },
    toBlob() {
      const c = canvas.current;
      if (!c || !signed) return Promise.resolve(null);
      // Fond blanc sous le trait (la signature reste lisible dans le PDF et sur fond sombre).
      const out = document.createElement('canvas');
      out.width = c.width;
      out.height = c.height;
      const ctx = out.getContext('2d');
      if (!ctx) return Promise.resolve(null);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(c, 0, 0);
      return new Promise((resolve) => out.toBlob((b) => resolve(b), 'image/png'));
    },
  }));

  return (
    <div className="s-sign">
      <canvas
        ref={canvas}
        className="s-sign-pad"
        aria-label={label}
        role="img"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          last.current = point(e);
          const ctx = e.currentTarget.getContext('2d');
          if (ctx && last.current) {
            ctx.beginPath();
            ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();
          }
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const p = point(e);
          const ctx = e.currentTarget.getContext('2d');
          if (!ctx) return;
          ctx.beginPath();
          ctx.moveTo(last.current.x, last.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          last.current = p;
          if (!signed) {
            setSigned(true);
            onChange?.(true);
          }
        }}
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
        }}
      />
      <div className="s-sign-foot">
        <span className="s-sign-line" aria-hidden="true">
          ✕
        </span>
        <button
          type="button"
          className="btn btn-ghost s-btn-sm"
          onClick={() => {
            const c = canvas.current;
            const ctx = c?.getContext('2d');
            if (!c || !ctx) return;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.restore();
            setSigned(false);
            onChange?.(false);
          }}
          disabled={!signed}
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
});
