'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/Icons';

/** Action délicate en deux temps : un premier clic demande confirmation, sans fenêtre modale. */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  pending = false,
  icon = 'trash',
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  icon?: IconName;
}) {
  const [asking, setAsking] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  // Le focus suit l'échange : sur « Annuler » à l'ouverture, de retour sur le bouton à la fermeture.
  useEffect(() => {
    if (asking) cancelRef.current?.focus();
    else if (wasAsking.current) openRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <button ref={openRef} type="button" className="btn btn-ghost s-btn-sm" onClick={() => setAsking(true)} disabled={pending}>
        <Icon name={icon} />
        {pending ? 'Un instant…' : label}
      </button>
    );
  }
  return (
    <span className="s-confirm" role="group" aria-label={question}>
      <span>{question}</span>
      <button
        type="button"
        className="btn s-btn-danger s-btn-sm"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button ref={cancelRef} type="button" className="btn btn-ghost s-btn-sm" onClick={() => setAsking(false)}>
        Annuler
      </button>
    </span>
  );
}
