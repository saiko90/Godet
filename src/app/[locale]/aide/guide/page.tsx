import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LogoMark } from '@/components/Logo';
import { DeviceGlyph } from '@/components/site/aide/DeviceGlyph';
import { DEVICES, RENTAL_STEPS, START_STEPS, TASKS } from '@/components/site/aide/content';
import { checkLocale, NO_INDEX, type LocaleParams } from '@/components/site/seo';

// Guide de démarrage, mis en page pour l'impression A4 : source des PDF de public/guides
// (scripts/guides/make-guides.mjs). Pas de lien depuis le site, pas d'indexation.
export const metadata: Metadata = { robots: NO_INDEX };

export default async function GuidePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'help' });
  const plain = { contact: (c: React.ReactNode) => <b>{c} (godet.app/contact)</b>, ideas: (c: React.ReactNode) => <b>{c}</b> };

  return (
    <main className="s-guide">
      <section className="s-guide-cover">
        <LogoMark size={64} />
        <p className="s-guide-brand">GODET</p>
        <h1>{t('guide.title')}</h1>
        <p className="s-guide-sub">{t('guide.subtitle')}</p>
        <p className="s-guide-intro">{t('intro')}</p>
      </section>

      <section>
        <h2>{t('start.title')}</h2>
        <ol className="s-guide-steps">
          {START_STEPS.map((key, i) => (
            <li key={key}>
              <span className="s-guide-num">{i + 1}</span>
              <div>
                <h3>{t(`start.steps.${key}.title`)}</h3>
                <p>{t(`start.steps.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="s-guide-break">
        <h2>{t('install.title')}</h2>
        <p>{t('install.intro')}</p>
        <div className="s-guide-devices">
          {DEVICES.map((d) => (
            <div key={d} className="s-guide-device">
              <h3>
                <span className="s-guide-glyph">
                  <DeviceGlyph device={d} />
                </span>
                {t(`install.devices.${d}.name`)}
              </h3>
              <p className="s-guide-muted">{t(`install.devices.${d}.browser`)}</p>
              <ol>
                {(t.raw(`install.devices.${d}.steps`) as string[]).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="s-guide-muted">{t('install.note')}</p>
      </section>

      <section>
        <h2>{t('tasks.title')}</h2>
        <dl className="s-guide-tasks">
          {TASKS.map((key) => (
            <div key={key}>
              <dt>{t(`tasks.items.${key}.q`)}</dt>
              <dd>{t(`tasks.items.${key}.a`)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>{t('rental.title')}</h2>
        <p>{t('rental.intro')}</p>
        <dl className="s-guide-tasks">
          {RENTAL_STEPS.map((key, i) => (
            <div key={key}>
              <dt>
                {i + 1}. {t(`rental.steps.${key}.title`)}
              </dt>
              <dd>{t(`rental.steps.${key}.text`)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="s-guide-keep">
        <h2>{t('contact.title')}</h2>
        <p>{t.rich('contact.text', plain)}</p>
      </section>
      <p className="s-guide-foot">{t('guide.footer')}</p>
    </main>
  );
}
