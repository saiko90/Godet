'use client';

// Visionneuse des médias : photo, vidéo ou document, précédent / suivant (flèches, glisser sur téléphone),
// légende, date, taille, téléchargement et suppression si le rôle le permet.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/Icons';
import { dateTimeCH, fileSize } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { MEDIA_LABEL } from '@/lib/media';
import { MediaPreview } from './MediaPreview';
import { trapTab } from './ui';

export function Lightbox({
  items,
  index,
  code,
  canDelete,
  onIndex,
  onClose,
  onDelete,
}: {
  items: MediaItem[];
  index: number;
  code: string;
  canDelete: (m: MediaItem) => boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (m: MediaItem) => Promise<void>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = items.length;
  const i = Math.min(Math.max(0, index), n - 1);
  const m = items[i];
  const isConfirming = confirming === m?.id;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  if (!m) return null;

  const go = (d: number) => {
    if (n < 2) return;
    setConfirming(null);
    setError(null);
    onIndex((i + d + n) % n);
  };

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    trapTab(e, root.current);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (isConfirming && !busy) setConfirming(null);
      else if (!busy) onClose();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target instanceof HTMLVideoElement)) {
      e.preventDefault();
      e.stopPropagation();
      go(e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  async function remove() {
    if (!m) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(m);
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le fichier n’a pas pu être supprimé.');
    } finally {
      setBusy(false);
    }
  }

  const label = m.caption || `${MEDIA_LABEL[m.kind]} de ${code}`;

  return (
    <div
      ref={root}
      className="g-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${MEDIA_LABEL[m.kind]} ${i + 1} sur ${n} : ${label}`}
      onKeyDown={onKey}
      data-own-arrows=""
    >
      <div
        className="g-lb-stage"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {m.kind !== 'document' ? (
          <MediaPreview key={m.id} item={m} full alt={m.caption || `Photo de ${code} du ${dateTimeCH(m.taken_at)}`} />
        ) : !m.url ? (
          <div className="g-lb-doc">
            <Icon name="file" />
            <b>Aperçu indisponible</b>
            <span>Le lien de ce fichier a expiré ou n’a pas pu être créé. Rouvrez la fiche pour le recharger.</span>
          </div>
        ) : (
          <div className="g-lb-doc">
            <Icon name="file" />
            <b>{m.caption || 'Document PDF'}</b>
            <span>
              {dateTimeCH(m.taken_at)}
              {m.size_bytes != null ? ` · ${fileSize(m.size_bytes)}` : ''}
            </span>
            <a className="btn btn-primary" href={m.url} target="_blank" rel="noopener noreferrer">
              <Icon name="link" />
              Ouvrir le document
            </a>
          </div>
        )}
      </div>

      <div className="g-lb-bar">
        <div className="g-lb-info">
          <b>{label}</b>
          <span>
            {MEDIA_LABEL[m.kind]} · {dateTimeCH(m.taken_at)}
            {m.size_bytes != null ? ` · ${fileSize(m.size_bytes)}` : ''}
          </span>
        </div>
        <div className="g-lb-actions">
          {m.url ? (
            <a className="icon-btn" href={m.url} target="_blank" rel="noopener noreferrer" download aria-label="Télécharger le fichier">
              <Icon name="download" />
            </a>
          ) : null}
          {canDelete(m) ? (
            <button
              type="button"
              className="icon-btn"
              aria-label="Supprimer le fichier"
              onClick={() => setConfirming(m.id)}
              disabled={busy}
            >
              <Icon name="trash" />
            </button>
          ) : null}
        </div>
      </div>

      {isConfirming ? (
        <div className="g-lb-confirm" role="alertdialog" aria-labelledby="lb-cf" aria-describedby="lb-cf-d">
          <b id="lb-cf">Supprimer ce fichier ?</b>
          <span id="lb-cf-d">Il disparaît de la fiche de {code}. Cette suppression est définitive.</span>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <div className="g-lb-confirm-btns">
            <button type="button" className="btn btn-ghost g-btn-sm" onClick={() => setConfirming(null)} disabled={busy} autoFocus>
              Annuler
            </button>
            <button type="button" className="btn g-btn-danger g-btn-sm" onClick={() => void remove()} disabled={busy}>
              {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="trash" />}
              Supprimer
            </button>
          </div>
        </div>
      ) : null}

      <button ref={closeBtn} type="button" className="icon-btn g-lb-close" aria-label="Fermer" onClick={onClose}>
        <Icon name="close" />
      </button>
      {n > 1 ? (
        <>
          <button type="button" className="icon-btn g-lb-prev" aria-label="Média précédent" onClick={() => go(-1)}>
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="icon-btn g-lb-next" aria-label="Média suivant" onClick={() => go(1)}>
            <Icon name="chevron-right" />
          </button>
          <p className="g-lb-count num" aria-hidden="true">
            {i + 1} / {n}
          </p>
        </>
      ) : null}
    </div>
  );
}
