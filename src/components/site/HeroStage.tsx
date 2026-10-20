import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';

/** Le godet du logo, cadré au plus près (posé sur le plateau tant que la capture du showroom manque). */
function Bucket({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="6 8 28 26" aria-hidden="true" focusable="false">
      <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint)" />
      <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night)" />
      <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint)" />
    </svg>
  );
}

/**
 * Grand visuel de l'accueil, au ratio fixe : la capture du showroom 3D (1600 × 900) posée sur un plateau lumineux
 * dessiné en CSS, qui reste seul tant que l'image manque. Le tout mène à la démo 3D.
 */
export async function HeroStage({ image }: { image: string | null }) {
  const t = await getTranslations('site.home.stage');
  return (
    <div className="s-stage-wrap">
      <Link href="/demo" className="s-stage">
        <span className="s-stage-wall" aria-hidden="true" />
        <span className="s-stage-beam" aria-hidden="true" />
        <span className="s-stage-sign" aria-hidden="true">
          GODET
        </span>
        <span className="s-stage-line" aria-hidden="true">
          {t('line')}
        </span>
        <span className="s-stage-floor" aria-hidden="true" />
        <span className="s-stage-horizon" aria-hidden="true" />
        <span className="s-stage-ring" aria-hidden="true" />
        <span className="s-stage-obj" aria-hidden="true">
          <Bucket className="s-stage-bucket" />
          <Bucket className="s-stage-reflect" />
        </span>
        {image ? (
          <Image
            className="s-stage-img"
            src={image}
            alt={t('alt')}
            fill
            sizes="(max-width: 1192px) calc(100vw - 32px), 1160px"
            loading="eager"
            fetchPriority="high"
          />
        ) : null}
        <span className="s-stage-cta">
          <Icon name="cube" />
          {t('cta')}
        </span>
      </Link>
    </div>
  );
}
