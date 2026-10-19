'use client';

// Le parc n'a pas pu être chargé côté serveur (réseau, base indisponible) : message clair et nouvel essai.
import Link from 'next/link';
import { useEffect } from 'react';
import { LogoMark } from '@/components/Logo';

export default function GarageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fallback" role="alert">
      <div className="dialog">
        <LogoMark size={44} />
        <h1 style={{ margin: 0, fontSize: 'var(--t-xl)' }}>Le garage n’a pas pu s’ouvrir</h1>
        <p className="muted">Les données du parc ne sont pas arrivées. Vérifiez la connexion, puis réessayez.</p>
        <div className="dialog-foot" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn btn-primary" onClick={() => retry()}>
            Réessayer
          </button>
          <Link className="btn btn-ghost" href="/">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
