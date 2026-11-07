'use client';

// Téléchargement du modèle Excel vide (guide « modèle de carnet d’entretien ») : le même classeur que le bouton
// « Modèle vide à remplir » du garage, donc réimportable tel quel. Le module Excel n'est chargé qu'au clic.
import { useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { ExportTexts } from '@/components/garage/excel';
import { useDomainText } from '@/lib/use-domain-text';

export interface TemplateDownloadLabels {
  button: string;
  preparing: string;
  error: string;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function TemplateDownload({ texts, fileName, labels }: { texts: ExportTexts; fileName: string; labels: TemplateDownloadLabels }) {
  const f = useFormat();
  const dt = useDomainText();
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  async function run() {
    setState('busy');
    try {
      const xl = await import('@/components/garage/excel');
      const today = new Date().toISOString().slice(0, 10);
      save(await xl.templateWorkbook({ f, dt, texts, country: 'CH', today }), fileName);
      setState('idle');
    } catch (e) {
      console.warn('[modèle excel]', e);
      setState('error');
    }
  }

  return (
    <div className="s-guide-cta-row">
      <button type="button" className="btn btn-primary" onClick={run} disabled={state === 'busy'} aria-busy={state === 'busy'}>
        <Icon name="download" />
        {state === 'busy' ? labels.preparing : labels.button}
      </button>
      {state === 'error' ? (
        <p className="err" role="alert">
          {labels.error}
        </p>
      ) : null}
    </div>
  );
}
