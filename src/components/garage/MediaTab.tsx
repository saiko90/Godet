'use client';

// Médias d'une machine : photos (appareil photo sur téléphone), vidéos, documents PDF, envoi multiple avec
// progression, galerie et liste des documents. L'agrandissement (lightbox) est géré par le garage.
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { Machine, MachineFile } from '@/lib/types';
import { useGarage, type UploadOutcome } from './context';
import { MediaPreview } from './MediaPreview';
import { Progress } from './ui';

/** Bouton d'envoi de fichiers : un champ fichier transparent posé sur le bouton (fiable sur iPhone et Android). */
export function FileButton({
  accept,
  capture,
  multiple = true,
  className = 'btn btn-soft',
  disabled = false,
  label,
  children,
  onFiles,
}: {
  accept: string;
  capture?: 'environment' | 'user';
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  /** Nom accessible quand le bouton n'affiche qu'une icône. */
  label?: string;
  children: ReactNode;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className={`${className} file-btn g-file-btn${disabled ? ' is-disabled' : ''}`}>
      {children}
      <input
        type="file"
        accept={accept}
        capture={capture}
        multiple={multiple}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = '';
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

/** Envoie des fichiers pour une machine, puis recharge sa fiche et affiche le résultat. */
export function useSendFiles() {
  const t = useTranslations('garage.media');
  const f = useFormat();
  const { upload, refresh, toast, effect, setTab, fleet } = useGarage();

  function summary(out: UploadOutcome, code: string): string {
    if (out.sent === out.photos) return t('addedPhotos', { count: out.photos, n: f.num(out.photos), code });
    if (out.sent === out.videos) return t('addedVideos', { count: out.videos, n: f.num(out.videos), code });
    if (out.sent === out.documents) return t('addedDocs', { count: out.documents, n: f.num(out.documents), code });
    return t('addedFiles', { count: out.sent, n: f.num(out.sent), code });
  }

  return async function send(machineId: string, files: File[]) {
    const code = fleet.machines.find((m) => m.id === machineId)?.code ?? '';
    const out = await upload(machineId, files);
    if (out.sent) {
      await refresh(machineId);
      setTab('medias');
      effect('photo');
    }
    if (out.errors.length) {
      const others = out.errors.length - 1;
      const more = others > 0 ? ` ${t('andMore', { count: others, n: f.num(others) })}` : '';
      const done = out.sent ? `${summary(out, code)}. ` : '';
      toast(`${done}${out.errors[0]}${more}`, 'error');
      effect('alert');
    } else if (out.sent) {
      toast(summary(out, code));
    }
  };
}

export function UploadStatus({ machineId }: { machineId: string }) {
  const t = useTranslations('garage.media');
  const { uploads } = useGarage();
  if (!uploads || uploads.machineId !== machineId) return null;
  const overall = (uploads.index + (uploads.phase === 'send' ? uploads.progress : 0)) / uploads.total;
  const text =
    uploads.phase === 'prep'
      ? t('preparing', { name: uploads.name })
      : t('sending', { name: uploads.name, pct: String(Math.round(uploads.progress * 100)) });
  return (
    <div className="g-upload" role="status" aria-live="polite">
      <div className="g-upload-top">
        <span className="g-upload-name">{text}</span>
        {uploads.total > 1 ? (
          <span className="num">{t('position', { index: String(uploads.index + 1), total: String(uploads.total) })}</span>
        ) : null}
      </div>
      <Progress value={overall} label={t('progress')} />
    </div>
  );
}

export function MediaTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage.media');
  const f = useFormat();
  const { openLightbox, uploads, flash } = useGarage();
  const send = useSendFiles();
  const busy = Boolean(uploads);
  const visual = file.media.filter((m) => m.kind !== 'document');
  const docs = file.media.filter((m) => m.kind === 'document');
  const go = (files: File[]) => void send(machine.id, files);

  return (
    <div className="stack fade-in">
      <div className="media-actions g-media-actions">
        <FileButton accept="image/*" capture="environment" disabled={busy} onFiles={go}>
          <Icon name="camera" />
          {t('photo')}
        </FileButton>
        <FileButton accept="video/*" disabled={busy} onFiles={go}>
          <Icon name="video" />
          {t('video')}
        </FileButton>
        <FileButton accept="image/*,video/*" disabled={busy} onFiles={go}>
          <Icon name="upload" />
          {t('import')}
        </FileButton>
        <FileButton accept="application/pdf,.pdf" disabled={busy} onFiles={go}>
          <Icon name="file" />
          {t('pdf')}
        </FileButton>
      </div>
      <UploadStatus machineId={machine.id} />

      {visual.length ? (
        <section>
          <h3>{t('gallery', { count: String(visual.length) })}</h3>
          <ul className="gallery g-gallery">
            {visual.map((m) => {
              const open = m.kind === 'video' ? t('openVideo', { date: f.date(m.taken_at) }) : t('openPhoto', { date: f.date(m.taken_at) });
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`shot${flash === m.id ? ' g-flash' : ''}`}
                    onClick={() => openLightbox(machine.id, m.id)}
                    aria-label={m.caption ? t('withCaption', { label: open, caption: m.caption }) : open}
                  >
                    <MediaPreview item={m} />
                    <span className="badge">
                      {m.kind === 'video' ? (
                        <>
                          <Icon name="video" className="g-badge-icon" /> {f.date(m.taken_at)}
                        </>
                      ) : (
                        f.date(m.taken_at)
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {docs.length ? (
        <section>
          <h3>{t('docs', { count: String(docs.length) })}</h3>
          <ul className="g-docs">
            {docs.map((d) => (
              <li key={d.id}>
                <button type="button" className={`g-doc${flash === d.id ? ' g-flash' : ''}`} onClick={() => openLightbox(machine.id, d.id)}>
                  <span className="g-doc-icon" aria-hidden="true">
                    <Icon name="file" />
                  </span>
                  <span className="g-doc-main">
                    <b>{d.caption || t('pdf')}</b>
                    <span>
                      {f.date(d.taken_at)}
                      {d.size_bytes != null ? ` · ${f.fileSize(d.size_bytes)}` : ''}
                    </span>
                  </span>
                  <Icon name="chevron-right" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!file.media.length ? (
        <div className="empty">
          <b>{t('emptyTitle')}</b>
          <span>{t('emptyText')}</span>
        </div>
      ) : (
        <p className="g-note">{t('note')}</p>
      )}
    </div>
  );
}
