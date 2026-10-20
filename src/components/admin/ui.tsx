'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/Icons';
import type { AdminResult } from './types';

/** Résultat d'une action, annoncé aux lecteurs d'écran (zone toujours présente). */
export function ResultNote({ result, message }: { result: AdminResult | null; message: string | null }) {
  return (
    <p className={`adm-result${result ? (result.ok ? ' is-ok' : ' is-bad') : ''}`} role="status" aria-live="polite">
      {message}
    </p>
  );
}

/** Action délicate en deux temps : un premier clic demande confirmation, sans fenêtre modale. */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  pending = false,
  icon = 'trash',
  danger = true,
  disabled = false,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations('admin.common');
  const [asking, setAsking] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  // Le focus suit l'échange : « Annuler » à l'ouverture, retour sur le bouton à la fermeture.
  useEffect(() => {
    if (asking) cancelRef.current?.focus();
    else if (wasAsking.current) openRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <button
        ref={openRef}
        type="button"
        className={`btn ${danger ? 'adm-btn-danger' : 'btn-ghost'} adm-btn-sm`}
        onClick={() => setAsking(true)}
        disabled={pending || disabled}
      >
        <Icon name={icon} />
        {pending ? t('working') : label}
      </button>
    );
  }
  return (
    <span className="adm-confirm" role="group" aria-label={question}>
      <span>{question}</span>
      <button
        type="button"
        className={`btn ${danger ? 'adm-btn-danger' : 'btn-primary'} adm-btn-sm`}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button ref={cancelRef} type="button" className="btn btn-ghost adm-btn-sm" onClick={() => setAsking(false)}>
        {t('cancel')}
      </button>
    </span>
  );
}

/** Copie un texte dans le presse-papiers ; repli « à l'ancienne » si l'API n'est pas disponible. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** Bouton « Copier », avec confirmation visible et annoncée. */
export function CopyButton({ text, label, className = 'btn btn-soft adm-btn-sm' }: { text: string; label?: string; className?: string }) {
  const t = useTranslations('admin.common');
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    const ok = await copyText(text);
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2400);
  }

  return (
    <button type="button" className={className} onClick={copy}>
      <Icon name={state === 'copied' ? 'check' : 'copy'} />
      <span>{state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : (label ?? t('copy'))}</span>
      <span className="adm-sr" aria-live="polite">
        {state === 'copied' ? t('copiedAnnounce') : state === 'failed' ? t('copyFailedAnnounce') : ''}
      </span>
    </button>
  );
}

/** Lien prêt à copier : champ en lecture seule (sélection facile) + bouton. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const id = useId();
  return (
    <div className="adm-copy-label">
      <span id={`${id}-l`}>{label}</span>
      <div className="adm-copy">
        <input
          id={id}
          type="text"
          readOnly
          value={value}
          aria-labelledby={`${id}-l`}
          onFocus={(e) => e.currentTarget.select()}
          spellCheck={false}
        />
        <CopyButton text={value} />
      </div>
    </div>
  );
}

/** Ouvre la fenêtre d'impression du navigateur (on peut y choisir « Enregistrer au format PDF »). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-primary adm-btn-sm" onClick={() => window.print()}>
      <Icon name="print" />
      {label}
    </button>
  );
}
