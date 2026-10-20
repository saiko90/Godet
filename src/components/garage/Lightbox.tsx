'use client';

// Visionneuse des médias : photo, vidéo ou document, précédent / suivant (flèches, glisser sur téléphone),
// légende, date, taille, téléchargement et suppression si le rôle le permet.
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { MediaItem } from '@/lib/types';
import { useErrorText } from './errors';
import { MediaPreview } from './MediaPreview';
import { trapTab } from './ui';
import { Zoomable } from './Zoomable';

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
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const errorText = useErrorText();
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
      setError(errorText(err, 'deleteFile'));
    } finally {
      setBusy(false);
    }
  }

  const kind = t(`media.kind.${m.kind}`);
  const label = m.caption || t('lightbox.label', { kind, code });

  return (
    <div
      ref={root}
      className="g-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('lightbox.dialog', { kind, index: String(i + 1), total: String(n), label })}
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
        {m.kind === 'photo' && m.url ? (
          <Zoomable key={m.id}>
            <MediaPreview item={m} full alt={m.caption || t('lightbox.alt', { code, date: f.dateTime(m.taken_at) })} />
          </Zoomable>
        ) : m.kind !== 'document' ? (
          <MediaPreview key={m.id} item={m} full alt={m.caption || t('lightbox.alt', { code, date: f.dateTime(m.taken_at) })} />
        ) : !m.url ? (
          <div className="g-lb-doc">
            <Icon name="file" />
            <b>{t('media.unavailable')}</b>
            <span>{t('media.expired')}</span>
          </div>
        ) : (
          <div className="g-lb-doc">
            <Icon name="file" />
            <b>{m.caption || t('media.pdf')}</b>
            <span>
              {f.dateTime(m.taken_at)}
              {m.size_bytes != null ? ` · ${f.fileSize(m.size_bytes)}` : ''}
            </span>
            <a className="btn btn-primary" href={m.url} target="_blank" rel="noopener noreferrer">
              <Icon name="link" />
              {t('lightbox.openDoc')}
            </a>
          </div>
        )}
      </div>

      <div className="g-lb-bar">
        <div className="g-lb-info">
          <b>{label}</b>
          <span>
            {kind} · {f.dateTime(m.taken_at)}
            {m.size_bytes != null ? ` · ${f.fileSize(m.size_bytes)}` : ''}
          </span>
        </div>
        <div className="g-lb-actions">
          {m.url ? (
            <a className="icon-btn" href={m.url} target="_blank" rel="noopener noreferrer" download aria-label={t('lightbox.download')}>
              <Icon name="download" />
            </a>
          ) : null}
          {canDelete(m) ? (
            <button
              type="button"
              className="icon-btn"
              aria-label={t('lightbox.delete')}
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
          <b id="lb-cf">{t('lightbox.confirmTitle')}</b>
          <span id="lb-cf-d">{t('lightbox.confirmText', { code })}</span>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <div className="g-lb-confirm-btns">
            <button type="button" className="btn btn-ghost g-btn-sm" onClick={() => setConfirming(null)} disabled={busy} autoFocus>
              {tc('actions.cancel')}
            </button>
            <button type="button" className="btn g-btn-danger g-btn-sm" onClick={() => void remove()} disabled={busy}>
              {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="trash" />}
              {tc('actions.delete')}
            </button>
          </div>
        </div>
      ) : null}

      <button ref={closeBtn} type="button" className="icon-btn g-lb-close" aria-label={tc('actions.close')} onClick={onClose}>
        <Icon name="close" />
      </button>
      {n > 1 ? (
        <>
          <button type="button" className="icon-btn g-lb-prev" aria-label={t('lightbox.prev')} onClick={() => go(-1)}>
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="icon-btn g-lb-next" aria-label={t('lightbox.next')} onClick={() => go(1)}>
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
