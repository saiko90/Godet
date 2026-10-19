'use client';

// Médias d'une machine : photos (appareil photo sur téléphone), vidéos, documents PDF, envoi multiple avec
// progression, galerie et liste des documents. L'agrandissement (lightbox) est géré par le garage.
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icons';
import { dateCH, fileSize } from '@/lib/format';
import type { Machine, MachineFile } from '@/lib/types';
import { useGarage, type UploadOutcome } from './context';
import { MediaPreview } from './MediaPreview';
import { plural } from './helpers';
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

function summary(out: UploadOutcome, code: string): string {
  const where = `aux médias de ${code}`;
  if (out.sent === out.photos) return out.photos > 1 ? `${out.photos} photos ajoutées ${where}` : `Photo ajoutée ${where}`;
  if (out.sent === out.videos) return out.videos > 1 ? `${out.videos} vidéos ajoutées ${where}` : `Vidéo ajoutée ${where}`;
  if (out.sent === out.documents) return out.documents > 1 ? `${out.documents} documents ajoutés ${where}` : `Document ajouté ${where}`;
  return `${out.sent} fichiers ajoutés ${where}`;
}

/** Envoie des fichiers pour une machine, puis recharge sa fiche et affiche le résultat. */
export function useSendFiles() {
  const { upload, refresh, toast, effect, setTab, fleet } = useGarage();
  return async function send(machineId: string, files: File[]) {
    const code = fleet.machines.find((m) => m.id === machineId)?.code ?? '';
    const out = await upload(machineId, files);
    if (out.sent) {
      await refresh(machineId);
      setTab('medias');
      effect('photo');
    }
    if (out.errors.length) {
      const more = out.errors.length > 1 ? ` (et ${plural(out.errors.length - 1, 'autre fichier', 'autres fichiers')})` : '';
      const done = out.sent ? `${summary(out, code)}. ` : '';
      toast(`${done}${out.errors[0]}${more}`, 'error');
      effect('alert');
    } else if (out.sent) {
      toast(summary(out, code));
    }
  };
}

export function UploadStatus({ machineId }: { machineId: string }) {
  const { uploads } = useGarage();
  if (!uploads || uploads.machineId !== machineId) return null;
  const overall = (uploads.index + (uploads.phase === 'send' ? uploads.progress : 0)) / uploads.total;
  const text =
    uploads.phase === 'prep'
      ? `Préparation de « ${uploads.name} »`
      : `Envoi de « ${uploads.name} » · ${Math.round(uploads.progress * 100)} %`;
  return (
    <div className="g-upload" role="status" aria-live="polite">
      <div className="g-upload-top">
        <span className="g-upload-name">{text}</span>
        {uploads.total > 1 ? (
          <span className="num">
            {uploads.index + 1} sur {uploads.total}
          </span>
        ) : null}
      </div>
      <Progress value={overall} label="Avancement de l’envoi" />
    </div>
  );
}

export function MediaTab({ machine, file }: { machine: Machine; file: MachineFile }) {
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
          Photo
        </FileButton>
        <FileButton accept="video/*" disabled={busy} onFiles={go}>
          <Icon name="video" />
          Vidéo
        </FileButton>
        <FileButton accept="image/*,video/*" disabled={busy} onFiles={go}>
          <Icon name="upload" />
          Importer
        </FileButton>
        <FileButton accept="application/pdf,.pdf" disabled={busy} onFiles={go}>
          <Icon name="file" />
          Document PDF
        </FileButton>
      </div>
      <UploadStatus machineId={machine.id} />

      {visual.length ? (
        <section>
          <h3>Photos et vidéos · {visual.length}</h3>
          <ul className="gallery g-gallery">
            {visual.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`shot${flash === m.id ? ' g-flash' : ''}`}
                  onClick={() => openLightbox(machine.id, m.id)}
                  aria-label={`Agrandir ${m.kind === 'video' ? 'la vidéo' : 'la photo'} du ${dateCH(m.taken_at)}${m.caption ? ` : ${m.caption}` : ''}`}
                >
                  <MediaPreview item={m} />
                  <span className="badge">
                    {m.kind === 'video' ? (
                      <>
                        <Icon name="video" className="g-badge-icon" /> {dateCH(m.taken_at)}
                      </>
                    ) : (
                      dateCH(m.taken_at)
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {docs.length ? (
        <section>
          <h3>Documents · {docs.length}</h3>
          <ul className="g-docs">
            {docs.map((d) => (
              <li key={d.id}>
                <button type="button" className={`g-doc${flash === d.id ? ' g-flash' : ''}`} onClick={() => openLightbox(machine.id, d.id)}>
                  <span className="g-doc-icon" aria-hidden="true">
                    <Icon name="file" />
                  </span>
                  <span className="g-doc-main">
                    <b>{d.caption || 'Document PDF'}</b>
                    <span>
                      {dateCH(d.taken_at)}
                      {d.size_bytes != null ? ` · ${fileSize(d.size_bytes)}` : ''}
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
          <b>Aucun média pour cette machine</b>
          <span>
            Photographiez la machine, un dégât ou une plaque signalétique, filmez un bruit suspect, ou joignez une facture en PDF. Les
            photos lourdes sont allégées avant l’envoi.
          </span>
        </div>
      ) : (
        <p className="g-note">Photos allégées avant l’envoi · vidéos et documents jusqu’à 50 Mo.</p>
      )}
    </div>
  );
}
