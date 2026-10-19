'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/Icons';
import { Wordmark } from '@/components/Logo';
import { SkipLink } from '@/components/site/SiteChrome';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="s-page">
      <SkipLink />
      <title>Erreur · Godet</title>
      <header className="s-wrap s-auth-top">
        <Link href="/" className="s-logo" aria-label="Godet, retour à l’accueil">
          <Wordmark />
        </Link>
      </header>
      <main id="contenu" className="s-oops">
        <div className="s-oops-inner" role="alert">
          <span className="s-big-icon s-bad" aria-hidden="true">
            <Icon name="alert" />
          </span>
          <h1>Une erreur est survenue</h1>
          <p>
            La page n’a pas pu s’afficher. Ce qui était déjà enregistré n’est pas perdu&nbsp;: réessayez, ou revenez
            dans un instant.
          </p>
          <div className="s-cta">
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              Réessayer
            </button>
            <Link href="/" className="btn btn-ghost">
              Retour à l’accueil
            </Link>
          </div>
          {error.digest ? <small>Référence de l’erreur&nbsp;: {error.digest}</small> : null}
        </div>
      </main>
    </div>
  );
}
