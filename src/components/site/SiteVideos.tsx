import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import type { SiteVideo } from './videos';

/**
 * Section « en vidéo » de l'accueil : deux courts films sans son, sous-titrés dans la langue de la page.
 * Rien n'est chargé avant le clic sur lecture (preload="none") ; chaque film a sa description écrite.
 */
export async function SiteVideos({ locale, videos }: { locale: AppLocale; videos: SiteVideo[] }) {
  if (!videos.length) return null;
  const t = await getTranslations({ locale, namespace: 'site.home.videos' });
  return (
    <section className="s-section s-section-line" aria-labelledby="titre-videos" id="videos">
      <div className="s-wrap">
        <div className="s-head">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="s-h2" id="titre-videos">
            {t('title')}
          </h2>
          <p>{t('text')}</p>
        </div>
        <div className={`s-grid${videos.length > 1 ? ' s-grid-2' : ''} s-videos`}>
          {videos.map((v) => (
            <figure key={v.kind} className="s-video">
              <video
                controls
                muted
                playsInline
                preload="none"
                width={1920}
                height={1080}
                poster={v.poster ?? undefined}
                aria-label={t(`items.${v.kind}.title`)}
                aria-describedby={`video-${v.kind}`}
              >
                <source src={v.src} type="video/mp4" />
                <a href={v.src}>{t('download')}</a>
              </video>
              <figcaption>
                <h3>
                  {t(`items.${v.kind}.title`)} <span className="s-video-len">{v.length}</span>
                </h3>
                <p id={`video-${v.kind}`}>{t(`items.${v.kind}.text`)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
