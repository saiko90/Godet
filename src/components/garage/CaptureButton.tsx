'use client';

// Bouton photo / vidéo : sur téléphone et tablette, propose « Appareil photo » ou « Galerie » (la photo est souvent
// déjà prise) ; sur ordinateur, ouvre directement le choix de fichiers.
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/Icons';
import { FileButton } from './MediaTab';
import { isTouch } from './ui';

export function CaptureButton({
  kind,
  multiple = true,
  className = 'btn btn-soft',
  disabled = false,
  label,
  children,
  onFiles,
}: {
  kind: 'photo' | 'video';
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  /** Nom accessible quand le bouton n'affiche qu'une icône. */
  label?: string;
  children: ReactNode;
  onFiles: (files: File[]) => void;
}) {
  const t = useTranslations('garage.picker');
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const accept = kind === 'photo' ? 'image/*' : 'video/*';

  useEffect(() => {
    queueMicrotask(() => setTouch(isTouch()));
  }, []);

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      opener.current?.focus();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!touch) {
    return (
      <FileButton accept={accept} multiple={multiple} className={className} disabled={disabled} label={label} onFiles={onFiles}>
        {children}
      </FileButton>
    );
  }

  const pick = (files: File[]) => {
    setOpen(false);
    onFiles(files);
  };

  return (
    <>
      <button
        ref={opener}
        type="button"
        className={className}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open
        ? createPortal(
            <div className="g-picker" onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
              <div ref={sheet} className="g-picker-sheet" role="dialog" aria-modal="true" aria-label={label ?? t(kind === 'photo' ? 'titlePhoto' : 'titleVideo')}>
                <FileButton accept={accept} capture="environment" multiple={false} className="btn btn-primary" onFiles={pick}>
                  <Icon name={kind === 'photo' ? 'camera' : 'video'} />
                  {t(kind === 'photo' ? 'camera' : 'record')}
                </FileButton>
                <FileButton accept={accept} multiple={multiple} className="btn btn-soft" onFiles={pick}>
                  <Icon name="upload" />
                  {t('gallery')}
                </FileButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  {t('cancel')}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
