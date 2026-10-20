'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icon } from '@/components/Icons';

/** Copie un texte (lien d'invitation) dans le presse-papiers, avec confirmation visible et annoncée. */
export function CopyButton({ text, className = 'btn btn-soft s-btn-sm' }: { text: string; className?: string }) {
  const t = useTranslations('settings.copy');
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Navigateur sans accès au presse-papiers : sélection et copie à l'ancienne.
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
    }
    setState(ok ? 'copied' : 'failed');
    window.setTimeout(() => setState('idle'), 2400);
  }

  return (
    <button type="button" className={className} onClick={copy}>
      <Icon name={state === 'copied' ? 'check' : 'copy'} />
      <span>{state === 'copied' ? t('copied') : state === 'failed' ? t('failed') : t('label')}</span>
      <span className="s-sr" aria-live="polite">
        {state === 'copied' ? t('copiedSr') : state === 'failed' ? t('failedSr') : ''}
      </span>
    </button>
  );
}
