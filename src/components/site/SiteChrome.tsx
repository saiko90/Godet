import 'server-only';

import { getTranslations } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Wordmark } from '@/components/Logo';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import './site.css';

export const STUDIO_URL = 'https://swissdigitalstudio.ch/';
/** Identifiant JSON-LD de l'éditeur (le même sur le site du studio). */
export const STUDIO_ORG_ID = 'https://swissdigitalstudio.ch/#org';

/** Pages publiques reliées depuis l'en-tête et le pied de page (lien marqué « page actuelle »). */
export type PublicPage = 'contact' | 'idees' | 'confidentialite' | 'securite' | 'aide';

const currentIf = (current: PublicPage | undefined, page: PublicPage): 'page' | undefined =>
  current === page ? 'page' : undefined;

/** Lien d'évitement vers le contenu principal (clavier, lecteurs d'écran). */
export async function SkipLink({ label }: { label?: string } = {}) {
  const t = await getTranslations('site.chrome');
  return (
    <a className="s-skip" href="#contenu">
      {label ?? t('skip')}
    </a>
  );
}

/** En-tête des pages publiques (accueil, contact, idées, confidentialité, 404). */
export async function SiteHeader({
  anchors = false,
  current,
  paths,
}: {
  anchors?: boolean;
  current?: PublicPage;
  /** Adresse traduite de la page dans chaque langue (guides), pour le choix de la langue. */
  paths?: Partial<Record<AppLocale, string>>;
}) {
  const t = await getTranslations('site.chrome');
  return (
    <header className="s-header">
      <div className="s-wrap s-header-row">
        <Link href="/" className="s-logo" aria-label={t('logoHome')}>
          <Wordmark />
        </Link>
        <nav className="s-nav" aria-label={t('mainNav')}>
          {anchors ? (
            <div className="s-nav-anchors">
              <a className="s-nav-link" href="#fonctions">
                {t('anchors.features')}
              </a>
              <a className="s-nav-link" href="#conformite">
                {t('anchors.compliance')}
              </a>
              <a className="s-nav-link" href="#tarif">
                {t('anchors.pricing')}
              </a>
              <a className="s-nav-link" href="#questions">
                {t('anchors.questions')}
              </a>
            </div>
          ) : null}
          <Link href="/demo" className="s-nav-link s-hide-sm">
            <Icon name="cube" />
            <span className="s-nav-label">{t('demo')}</span>
          </Link>
          <Link href="/contact" className="s-nav-link s-hide-md" aria-current={currentIf(current, 'contact')}>
            {t('contact')}
          </Link>
          <Link href="/connexion" className="s-nav-link">
            {t('login')}
          </Link>
          <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }} className="btn btn-primary s-btn-sm s-hide-sm">
            {t('signup')}
          </Link>
        </nav>
        <LanguageSwitcher className="s-lang" paths={paths} />
      </div>
    </header>
  );
}

/** Pied de page des pages publiques. */
export async function SiteFooter({ current }: { current?: PublicPage } = {}) {
  const t = await getTranslations('site.chrome.footer');
  const ts = await getTranslations('legal.securityPage');
  const th = await getTranslations('help.nav');
  const tg = await getTranslations('site.guides');
  // Chaîne (et non nombre) : un nombre serait mis en forme (« 2 026 »).
  const year = String(new Date().getFullYear());
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-grid">
          <div className="s-footer-brand">
            <Wordmark />
            <p>{t('tagline')}</p>
            <p>
              {t.rich('studio', {
                link: (chunks) => (
                  <a className="s-link" href={STUDIO_URL}>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <nav aria-labelledby="pied-godet">
            <h2 id="pied-godet">{t('godet')}</h2>
            <ul>
              <li>
                <Link href="/demo">{t('demo')}</Link>
              </li>
              <li>
                <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }}>{t('signup')}</Link>
              </li>
              <li>
                <Link href="/connexion">{t('login')}</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="pied-infos">
            <h2 id="pied-infos">{t('info')}</h2>
            <ul>
              <li>
                <Link href="/aide" aria-current={currentIf(current, 'aide')}>
                  {th('footer')}
                </Link>
              </li>
              <li>
                <Link href="/guides">{tg('footer')}</Link>
              </li>
              <li>
                <Link href="/contact" aria-current={currentIf(current, 'contact')}>
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/idees" aria-current={currentIf(current, 'idees')}>
                  {t('ideas')}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" aria-current={currentIf(current, 'confidentialite')}>
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/securite" aria-current={currentIf(current, 'securite')}>
                  {ts('footer')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="s-footer-base">
          <span>{t('copyright', { year })}</span>
          <span>{t('hosting')}</span>
        </div>
      </div>
    </footer>
  );
}

/** Coque des pages de compte : logo, langue, carte centrée, liens discrets. */
export async function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const t = await getTranslations('site.chrome');
  return (
    <div className="s-page s-auth">
      <SkipLink label={t('skip')} />
      <header className="s-wrap s-auth-top">
        <Link href="/" className="s-logo" aria-label={t('logoBack')}>
          <Wordmark />
        </Link>
        <div className="s-auth-tools">
          <LanguageSwitcher className="s-lang" />
          <Link href="/demo" className="s-nav-link s-hide-sm">
            <Icon name="cube" />
            <span>{t('auth.demo')}</span>
          </Link>
        </div>
      </header>
      <main id="contenu" className="s-auth-main">
        <div className={`s-auth-card${wide ? ' s-wide' : ''}`}>{children}</div>
      </main>
      <footer className="s-auth-foot">
        <Link href="/">{t('auth.home')}</Link>
        <Link href="/contact">{t('auth.contact')}</Link>
        <Link href="/confidentialite">{t('auth.privacy')}</Link>
        <a href={STUDIO_URL}>Swiss Digital Studio</a>
      </footer>
    </div>
  );
}

/** Barre du haut des pages de l'application (paramètres) : retour au garage bien visible. */
export async function AppHeader({ orgName }: { orgName: string }) {
  const t = await getTranslations('site.chrome.app');
  return (
    <header className="s-appbar">
      <div className="s-wrap s-appbar-row">
        <Link href="/garage" className="s-logo" aria-label={t('garageOf', { org: orgName })}>
          <Wordmark sub={orgName} />
        </Link>
        <Link href="/garage" className="btn btn-primary s-btn-sm">
          <Icon name="garage" />
          <span>{t('backToGarage')}</span>
        </Link>
      </div>
    </header>
  );
}
