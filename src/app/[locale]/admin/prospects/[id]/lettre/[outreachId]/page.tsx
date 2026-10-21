import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { COUNTRY_LINE, LETTER_SENDER, senderComplete, windowSide } from '@/components/admin/letter-config';
import { LetterSheet, type LetterData } from '@/components/admin/LetterSheet';
import { demoPath, localePrefix, prospectLocale, readableSource, shortUrl } from '@/components/admin/links';
import { isOneOf, isUuid, LOCALES } from '@/components/admin/types';
import { PrintButton } from '@/components/admin/ui';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { navCounts } from '../../../../data';
import { adminPageTitle, publicBaseUrl, requireAdmin } from '../../../../guard';

type Params = Promise<{ locale: string; id: string; outreachId: string }>;

/** Au-delà, le texte risque de ne pas tenir sur une page A4 avec l'en-tête et le bloc de démo. */
const LONG_BODY = 2300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'letter') };
}

export default async function AdminLetterPage({ params }: { params: Params }) {
  const { locale, id, outreachId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  if (!isUuid(id) || !isUuid(outreachId)) notFound();

  const [counts, prospectRes, outreachRes] = await Promise.all([
    navCounts(supabase),
    supabase.from('prospects').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('outreach')
      .select('id, prospect_id, channel, locale, subject, body, status')
      .eq('id', outreachId)
      .eq('prospect_id', id)
      .maybeSingle(),
  ]);
  if (prospectRes.error) throw new Error(`Administration : prospect illisible (${prospectRes.error.code})`);
  if (outreachRes.error) throw new Error(`Administration : message illisible (${outreachRes.error.code})`);
  const p = prospectRes.data;
  const o = outreachRes.data;
  if (!p || !o) notFound();

  const t = await getTranslations({ locale, namespace: 'admin' });
  const letterLocale = isOneOf(LOCALES, o.locale) ? o.locale : prospectLocale(p.locale, p.country);
  const tl = await getTranslations({ locale: letterLocale, namespace: 'admin.letter' });
  const base = await publicBaseUrl();
  const side = windowSide(p.country);
  const abroad = p.country.toUpperCase() !== LETTER_SENDER.country;

  const senderCity = [LETTER_SENDER.postalCode, LETTER_SENDER.city].filter(Boolean).join(' ');
  const senderLines = [
    LETTER_SENDER.company,
    LETTER_SENDER.street,
    abroad && senderCity ? `${LETTER_SENDER.country}-${senderCity}` : senderCity,
    abroad ? tl('senderCountry') : '',
    LETTER_SENDER.phone,
    LETTER_SENDER.email,
    LETTER_SENDER.website,
  ].filter((l): l is string => Boolean(l && l.trim()));
  const returnLine = [LETTER_SENDER.company, LETTER_SENDER.street, abroad && senderCity ? `${LETTER_SENDER.country}-${senderCity}` : senderCity]
    .filter(Boolean)
    .join(' · ');

  const cityLine = [p.postal_code, p.country === 'FR' && p.city ? p.city.toUpperCase() : p.city].filter(Boolean).join(' ');
  const recipientLines = [p.company, tl('attention'), p.address ?? '', cityLine, abroad ? (COUNTRY_LINE[p.country] ?? p.country) : ''].filter(
    (l) => l.trim(),
  );

  const date = new Intl.DateTimeFormat(`${letterLocale}-${p.country}`, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Zurich',
  }).format(new Date());
  const dateLine = LETTER_SENDER.city ? tl('datePlace', { place: LETTER_SENDER.city, date }) : date;

  const demo: LetterData['demo'] = p.ref_code
    ? {
        title: tl('demoTitle'),
        scan: tl('demoType'),
        url: `${base}${demoPath(letterLocale, p.ref_code, p.segment)}`,
        short: shortUrl(base, demoPath(letterLocale, p.ref_code, p.segment)),
        guideLabel: tl('guideLine'),
        guideShort: shortUrl(base, `${localePrefix(letterLocale)}/aide`),
      }
    : null;

  const data: LetterData = {
    side,
    lang: letterLocale,
    senderLines,
    tagline: tl('tagline'),
    returnLine,
    recipientLines,
    dateLine,
    subject: o.subject ? tl('subject', { subject: o.subject }) : null,
    body: o.body,
    demo,
    legal: [
      tl('optOut'),
      tl('source', { source: readableSource(p.source) }),
      tl('privacy', { url: shortUrl(base, `${localePrefix(letterLocale)}/confidentialite`) }),
    ],
  };

  const warnings: string[] = [];
  if (o.channel !== 'lettre') warnings.push(t('letterPage.notLetter'));
  if (o.status === 'brouillon') warnings.push(t('letterPage.notValidated'));
  if (o.status === 'annule') warnings.push(t('letterPage.cancelled'));
  if (p.status === 'ne_pas_contacter') warnings.push(t('letterPage.blocked'));
  if (!senderComplete()) warnings.push(t('letterPage.senderIncomplete'));
  if (!p.address || !p.postal_code || !p.city) warnings.push(t('letterPage.addressIncomplete'));
  if (!p.ref_code) warnings.push(t('letterPage.noRef'));
  if (o.body.length > LONG_BODY) warnings.push(t('letterPage.tooLong'));

  const messages = (await getMessages()) as unknown as AppMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="prospects" counts={counts}>
        <div className="adm-head adm-noprint">
          <Link className="adm-back" href={`/admin/prospects/${p.id}`}>
            <Icon name="chevron-left" />
            {t('letterPage.back', { company: p.company })}
          </Link>
          <h1>{t('letterPage.title')}</h1>
          <p>{t(side === 'left' ? 'letterPage.windowLeft' : 'letterPage.windowRight')}</p>
        </div>

        <div className="adm-letter-tools adm-noprint">
          <div className="adm-stack">
            {warnings.map((w) => (
              <p key={w} className="adm-alert is-warn">
                <Icon name="alert" />
                <span>{w}</span>
              </p>
            ))}
            <p className="adm-hint">{t('letterPage.afterPrint')}</p>
          </div>
          <PrintButton label={t('letterPage.print')} />
        </div>

        <div className="adm-letter-frame">
          <LetterSheet data={data} />
        </div>
      </AdminChrome>
    </NextIntlClientProvider>
  );
}
