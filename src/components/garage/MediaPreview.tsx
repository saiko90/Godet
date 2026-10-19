'use client';

// Aperçu d'une photo ou d'une vidéo, avec repli quand le navigateur ne sait pas l'afficher
// (photo HEIC sur un ordinateur, lien expiré) : le fichier reste téléchargeable depuis la visionneuse.
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import type { MediaItem } from '@/lib/types';

export function MediaPreview({ item, full = false, alt = '' }: { item: MediaItem; full?: boolean; alt?: string }) {
  const [broken, setBroken] = useState(false);
  if (!item.url || broken) {
    const heic = /hei[cf]/i.test(item.mime ?? '');
    return (
      <span className={full ? 'g-lb-doc' : 'g-shot-missing'} role={full ? 'note' : undefined}>
        <Icon name={item.kind === 'video' ? 'video' : 'camera'} />
        {full ? (
          <>
            <b>Aperçu indisponible</b>
            <span>
              {heic
                ? 'Ce navigateur n’affiche pas les photos HEIC. Téléchargez le fichier pour l’ouvrir.'
                : 'Le lien de ce fichier a expiré ou n’a pas pu être créé. Rouvrez la fiche pour le recharger.'}
            </span>
          </>
        ) : heic ? (
          'Photo HEIC'
        ) : (
          'Aperçu indisponible'
        )}
      </span>
    );
  }
  if (item.kind === 'video') {
    return full ? (
      <video key={item.id} src={item.url} controls playsInline autoPlay muted onError={() => setBroken(true)} />
    ) : (
      <video src={item.url} muted playsInline preload="metadata" onError={() => setBroken(true)} />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire ou adresse locale : pas d'optimisation possible
  return <img key={item.id} src={item.url} alt={alt} loading={full ? undefined : 'lazy'} onError={() => setBroken(true)} />;
}
