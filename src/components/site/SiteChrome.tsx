import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { Wordmark } from '@/components/Logo';
import './site.css';

export const STUDIO_URL = 'https://www.swissdigitalstudio.ch';

/** Lien d'évitement vers le contenu principal (clavier, lecteurs d'écran). */
export function SkipLink() {
  return (
    <a className="s-skip" href="#contenu">
      Aller au contenu
    </a>
  );
}

/** En-tête des pages publiques (accueil, confidentialité, 404). */
export function SiteHeader({ anchors = false }: { anchors?: boolean }) {
  return (
    <header className="s-header">
      <div className="s-wrap s-header-row">
        <Link href="/" className="s-logo" aria-label="Godet, accueil">
          <Wordmark />
        </Link>
        <nav className="s-nav" aria-label="Navigation principale">
          {anchors ? (
            <div className="s-nav-anchors">
              <a className="s-nav-link" href="#fonctions">
                Fonctions
              </a>
              <a className="s-nav-link" href="#conformite">
                Conformité
              </a>
              <a className="s-nav-link" href="#tarif">
                Tarif
              </a>
              <a className="s-nav-link" href="#questions">
                Questions
              </a>
            </div>
          ) : null}
          <Link href="/demo" className="s-nav-link">
            <Icon name="cube" />
            <span className="s-nav-label">Démo 3D</span>
          </Link>
          <Link href="/connexion" className="s-nav-link">
            Se connecter
          </Link>
          <Link href="/connexion?mode=inscription" className="btn btn-primary s-btn-sm s-hide-sm">
            Créer mon garage
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Pied de page des pages publiques. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-grid">
          <div className="s-footer-brand">
            <Wordmark />
            <p>Le carnet d’entretien numérique des machines de chantier, pensé pour les entreprises suisses.</p>
            <p>
              Une application de{' '}
              <a className="s-link" href={STUDIO_URL}>
                Swiss Digital Studio
              </a>
              , en Valais.
            </p>
          </div>
          <nav aria-labelledby="pied-godet">
            <h2 id="pied-godet">Godet</h2>
            <ul>
              <li>
                <Link href="/demo">Démo 3D sans compte</Link>
              </li>
              <li>
                <Link href="/connexion?mode=inscription">Créer mon garage</Link>
              </li>
              <li>
                <Link href="/connexion">Se connecter</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="pied-infos">
            <h2 id="pied-infos">Informations</h2>
            <ul>
              <li>
                <Link href="/confidentialite">Politique de confidentialité</Link>
              </li>
              <li>
                <a href={STUDIO_URL}>swissdigitalstudio.ch</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="s-footer-base">
          <span>© {year} Swiss Digital Studio · Valais, Suisse</span>
          <span>Données hébergées dans l’UE (Irlande)</span>
        </div>
      </div>
    </footer>
  );
}

/** Coque des pages de compte : logo, carte centrée, liens discrets. */
export function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="s-page s-auth">
      <SkipLink />
      <header className="s-wrap s-auth-top">
        <Link href="/" className="s-logo" aria-label="Godet, retour à l’accueil">
          <Wordmark />
        </Link>
        <Link href="/demo" className="s-nav-link">
          <Icon name="cube" />
          <span>Démo 3D</span>
        </Link>
      </header>
      <main id="contenu" className="s-auth-main">
        <div className={`s-auth-card${wide ? ' s-wide' : ''}`}>{children}</div>
      </main>
      <footer className="s-auth-foot">
        <Link href="/">Accueil</Link>
        <Link href="/confidentialite">Confidentialité</Link>
        <a href={STUDIO_URL}>Swiss Digital Studio</a>
      </footer>
    </div>
  );
}

/** Barre du haut des pages de l'application (paramètres) : retour au garage bien visible. */
export function AppHeader({ orgName }: { orgName: string }) {
  return (
    <header className="s-appbar">
      <div className="s-wrap s-appbar-row">
        <Link href="/garage" className="s-logo" aria-label={`Garage de ${orgName}`}>
          <Wordmark sub={orgName} />
        </Link>
        <Link href="/garage" className="btn btn-primary s-btn-sm">
          <Icon name="garage" />
          <span>Retour au garage</span>
        </Link>
      </div>
    </header>
  );
}
