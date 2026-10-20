'use client';

// Fenêtre modale simple des pages Location : voile, Échap, focus sur la boîte (pas de clavier d'office sur téléphone).
import { useEffect, useRef, type ReactNode } from 'react';

export function Dialog({ labelledBy, onClose, children, wide = false }: { labelledBy: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    box.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="s-dlg-veil" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`s-dlg${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
