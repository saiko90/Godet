import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-oops">
        <div className="s-oops-inner">
          <p className="s-oops-code" aria-hidden="true">
            404
          </p>
          <h1>Cette page n’existe pas</h1>
          <p>
            Le lien est peut-être incomplet, ou la page a changé d’adresse. Votre garage, lui, n’a pas bougé.
          </p>
          <div className="s-cta">
            <Link href="/" className="btn btn-primary">
              Retour à l’accueil
            </Link>
            <Link href="/garage" className="btn btn-ghost">
              <Icon name="garage" />
              Ouvrir mon garage
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
