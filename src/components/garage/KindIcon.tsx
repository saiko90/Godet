// Silhouettes des types de machines (sélecteur visuel de la modale « machine », cartes du mode atelier).
// Dessinées au trait comme le sprite de l'app ; taille et couleur héritées du texte.
import type { MachineKind } from '@/lib/types';

const PATHS: Record<MachineKind, string[]> = {
  pelle: [
    'M5 33.5h27a3.5 3.5 0 0 0 0-7H5a3.5 3.5 0 0 0 0 7z',
    'M8 26.5V19h17v7.5',
    'M10 19v-7h7l3.5 7',
    'M24 21.5 37 8.5l9.5 2.5',
    'M46.5 11l5.5 11',
    'M49.5 21.5l8 1.5-1.5 6.5h-7.5z',
  ],
  mini_pelle: [
    'M10 33.5h20a3 3 0 0 0 0-6H10a3 3 0 0 0 0 6z',
    'M12 27.5V21h14v6.5',
    'M14 21v-7h6l2.5 7',
    'M26 22.5l10-9 7 2',
    'M43 15.5l3.5 8',
    'M44.5 23l6 1-1 5h-5.5z',
    'M4 30.5h6v3.5H4z',
  ],
  chargeuse: [
    'M10 25.5h30V18H28l-2.5-7H16v14.5',
    'M40 21l9-5',
    'M48 10.5h9l-1.5 12-6.5 1.5z',
    'M20 31.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
    'M43 31.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
    'M20 31.5h13',
  ],
  dumper: [
    'M7 27h44',
    'M33 26l3.5-12H58l-4.5 12',
    'M12 27V14.5h8V27',
    'M10 14.5h12',
    'M19 32a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
    'M50 32a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
  ],
  camion: [
    'M5 27V12h35v15',
    'M42 29V14h9l7 8v7',
    'M44 16h6l4.5 6H44z',
    'M5 29h53',
    'M15 32.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M25 32.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M55 32.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  ],
  grue: [
    'M8 30h40',
    'M28 30V7',
    'M12 7h46',
    'M28 7l-12 0 12-4',
    'M50 7v11',
    'M47.5 18h5l-2.5 4z',
    'M18 33.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
    'M45 33.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
  ],
  rouleau: [
    'M57 28a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
    'M19 31a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
    'M12 26h29',
    'M18 26V12h11v14',
    'M16 12h15',
    'M41 22l-6 4',
  ],
  autre: [
    'M8 28V15h30l6 6v7',
    'M44 21h10v7',
    'M8 28h46',
    'M18 32a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M50 32a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M16 19h10',
  ],
};

export function KindIcon({ kind, className }: { kind: MachineKind; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 40" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {PATHS[kind].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
