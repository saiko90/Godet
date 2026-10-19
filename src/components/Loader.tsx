'use client';

import { useId } from 'react';

/**
 * Écran de chargement Godet : le godet se remplit de jaune au rythme du chargement.
 * - progress entre 0 et 1 : remplissage proportionnel + pourcentage ;
 * - progress absent : remplissage qui ondule (attente sans durée connue).
 * `overlay` le pose en plein écran au-dessus de tout ; `done` déclenche le fondu de sortie.
 */
export function Loader({
  progress,
  label = 'Chargement…',
  overlay = true,
  done = false,
}: {
  progress?: number;
  label?: string;
  overlay?: boolean;
  done?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const known = typeof progress === 'number' && Number.isFinite(progress);
  const p = known ? Math.min(1, Math.max(0, progress as number)) : 0;
  // Zone utile du godet : de y = 9 (haut) à y = 34 (pointe des dents).
  const fillY = 34 - 25 * p;

  return (
    <div
      className={`loader${overlay ? ' loader-overlay' : ''}${done ? ' loader-done' : ''}${known ? '' : ' loader-wait'}`}
      role="status"
      aria-live="polite"
      aria-busy={!done}
    >
      <div className="loader-inner">
        <svg className="loader-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={`gd-${id}`}>
              <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" />
              <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" />
            </clipPath>
          </defs>
          <g opacity="0.18">
            <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint)" />
            <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint)" />
          </g>
          <g clipPath={`url(#gd-${id})`}>
            <rect
              className="loader-fill"
              x="0"
              y="9"
              width="40"
              height="40"
              fill="var(--paint)"
              style={known ? { transform: `translateY(${fillY - 9}px)` } : undefined}
            />
          </g>
          <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night)" />
        </svg>
        <div className="loader-word">GODET</div>
        <div className="loader-bar" aria-hidden="true">
          <i style={known ? { transform: `scaleX(${p})` } : undefined} />
        </div>
        <p className="loader-label">
          {label}
          {known ? <span className="num"> {Math.round(p * 100)} %</span> : null}
        </p>
      </div>
    </div>
  );
}
