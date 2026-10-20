// Pictogrammes des gestes d'installation : bouton Partager (iPhone), menu ⋮ (Android), installation (ordinateur).
import type { Device } from './content';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function DeviceGlyph({ device }: { device: Device }) {
  if (device === 'iphone') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g {...stroke}>
          <path d="M8 9.5H6.5v10h11v-10H16" />
          <path d="M12 14V3.5M8.5 7L12 3.5 15.5 7" />
        </g>
      </svg>
    );
  }
  if (device === 'android') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5.5" r="1.7" fill="currentColor" />
        <circle cx="12" cy="12" r="1.7" fill="currentColor" />
        <circle cx="12" cy="18.5" r="1.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g {...stroke}>
        <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
        <path d="M9 20h6M12 7.5v5.5M9.5 10.5L12 13l2.5-2.5" />
      </g>
    </svg>
  );
}
