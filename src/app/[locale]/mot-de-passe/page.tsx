import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { NouveauMotDePasseForm } from '@/components/site/NouveauMotDePasseForm';
import { checkLocale, metaLocale, NO_INDEX, type LocaleParams } from '@/components/site/seo';
import { AuthShell } from '@/components/site/SiteChrome';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { Link } from '@/i18n/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'auth.meta' });
  return { title: t('passwordTitle'), robots: NO_INDEX };
}

export default async function MotDePassePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth.password' });
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <AuthShell>
        <span className="s-big-icon" aria-hidden="true">
          <Icon name="clock" />
        </span>
        <div className="s-auth-head">
          <h1>{t('expiredTitle')}</h1>
          <p>{t('expiredText')}</p>
        </div>
        <Link href="/connexion" className="btn btn-primary btn-block">
          {t('goToLogin')}
        </Link>
      </AuthShell>
    );
  }

  const messages = (await getMessages({ locale })) as unknown as AppMessages;
  return (
    <AuthShell>
      <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'auth'])}>
        <NouveauMotDePasseForm email={user.email ?? ''} />
      </NextIntlClientProvider>
    </AuthShell>
  );
}
