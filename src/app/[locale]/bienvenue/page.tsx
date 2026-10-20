import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { seDeconnecter } from '@/app/auth/actions';
import { BienvenueForm } from '@/components/site/BienvenueForm';
import { cantonOptions } from '@/components/site/cantons';
import { countryOptions } from '@/components/site/countries';
import { Alert } from '@/components/site/Form';
import { localizePath } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX, type LocaleParams } from '@/components/site/seo';
import { AuthShell } from '@/components/site/SiteChrome';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { redirect } from '@/i18n/navigation';
import { htmlLang } from '@/i18n/routing';
import { getSession } from '@/lib/session';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'auth.meta' });
  return { title: t('welcomeTitle'), robots: NO_INDEX };
}

export default async function BienvenuePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({ href: { pathname: '/connexion', query: { suite: localizePath('/bienvenue', locale) } }, locale });
  }
  if (session.status === 'ok') return redirect({ href: '/garage', locale });

  const [t, tc, ts, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'auth.welcome' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'site' }),
    getMessages({ locale }),
  ]);
  const firstName = session.fullName?.trim().split(/\s+/)[0] ?? '';
  const countries = countryOptions(locale, (code) => tc(`countries.${code}`));
  const cantons = cantonOptions((code) => ts(`cantons.${code}`), htmlLang(locale));
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

  return (
    <AuthShell wide>
      <div className="s-auth-head">
        <p className="eyebrow">{firstName ? t('eyebrowNamed', { name: firstName }) : t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>{t('lead')}</p>
      </div>
      <NextIntlClientProvider locale={locale} messages={pickMessages(messages as unknown as AppMessages, ['common', 'auth'])}>
        <BienvenueForm countries={countries} cantons={cantons} />
      </NextIntlClientProvider>
      <Alert tone="info" icon="users">
        <p>{t.rich('invited', { b: bold })}</p>
      </Alert>
      <form action={seDeconnecter} className="s-auth-alt">
        <input type="hidden" name="suite" value={localizePath('/connexion', locale)} />
        {t.rich('signedInAs', { email: session.email, b: bold })}{' '}
        <button type="submit" className="s-linkbtn">
          {t('switchAccount')}
        </button>
      </form>
    </AuthShell>
  );
}
