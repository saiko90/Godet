'use client';

import { Icon } from '@/components/Icons';

/** Ouvre la fenêtre d'impression du navigateur (on peut y choisir « Enregistrer au format PDF »). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-primary s-btn-sm" onClick={() => window.print()}>
      <Icon name="print" />
      {label}
    </button>
  );
}
