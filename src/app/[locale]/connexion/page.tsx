import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { ConnexionForm } from '@/components/site/ConnexionForm';
import { firstParam, isRefCode, looksLikeEmail, REF_COOKIE, safePath, splitLocale } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX_FOLLOW, type LocaleParams } from '@/components/site/seo';
import { AuthShell } from '@/components/site/SiteChrome';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { localizedAlternates } from '@/i18n/metadata';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/session';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'auth.meta' });
  const signup = firstParam((await searchParams).mode) === 'inscription';
  return {
    title: signup ? t('signupTitle') : t('loginTitle'),
    description: signup ? t('signupDescription') : t('loginDescription'),
    alternates: localizedAlternates('/connexion', locale),
    robots: NO_INDEX_FOLLOW,
  };
}

export default async function ConnexionPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const query = await searchParams;
  const suite = safePath(firstParam(query.suite), '');

  // Déjà connecté : direction la suite prévue (dans sa langue), le garage, ou la création de l'entreprise.
  const session = await getSession();
  if (session.status !== 'anon') {
    const planned = suite ? splitLocale(suite) : null;
    const href = planned?.path ?? (session.status === 'ok' ? '/garage' : '/bienvenue');
    return redirect({ href, locale: planned?.locale ?? locale });
  }

  const mode = firstParam(query.mode) === 'inscription' ? 'inscription' : 'connexion';
  const email = (firstParam(query.email) ?? '').trim();
  const ref = (await cookies()).get(REF_COOKIE)?.value;
  const messages = (await getMessages({ locale })) as unknown as AppMessages;

  return (
    <AuthShell>
      <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'auth'])}>
        <ConnexionForm
          initialMode={mode}
          suite={suite}
          linkError={firstParam(query.erreur) === 'lien'}
          initialEmail={looksLikeEmail(email) ? email : ''}
          refCode={isRefCode(ref) ? ref : null}
        />
      </NextIntlClientProvider>
    </AuthShell>
  );
}
