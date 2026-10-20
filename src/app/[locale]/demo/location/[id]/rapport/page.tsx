// Démonstration : rapport d'une location d'exemple (états des lieux, photos, signatures).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoReport } from '@/components/site/location/demo';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { SiteHeader, SkipLink } from '@/components/site/SiteChrome';

type Params = Promise<{ locale: string; id: string }>;
type Search = Promise<{ ok?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: metaLocale(locale), namespace: 'rental' });
  return { title: `${t('report.title')} · ${t('demo.label')}`, robots: NO_INDEX };
}

export default async function DemoReportPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale: raw, id } = await params;
  const { ok } = await searchParams;
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  if (!/^demo-loc-[\w-]{1,40}$/.test(id)) notFound();
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-wrap s-rent">
        <FormatProvider locale={locale} country="CH" currency="CHF">
          <DemoReport id={id} ok={ok === 'depart' || ok === 'retour' ? ok : null} />
        </FormatProvider>
      </main>
    </div>
  );
}
