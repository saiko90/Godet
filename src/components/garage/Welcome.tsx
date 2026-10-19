'use client';

// Accueil « Allumer le garage » : le clic débloque le son puis lance l'allumage du hall.
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icons';

export function Welcome({
  mode,
  orgName,
  machines,
  leaving,
  onEnter,
}: {
  mode: 'cloud' | 'demo';
  orgName: string;
  machines: number;
  leaving: boolean;
  onEnter: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  // Seule action possible à ce moment : elle reçoit le focus (clavier et lecteurs d'écran).
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className={`welcome g-welcome${leaving ? ' leaving' : ''}`} aria-labelledby="welcome-title">
      <p className="eyebrow">{mode === 'demo' ? 'Démo · données d’exemple' : orgName}</p>
      <h2 id="welcome-title" className="g-welcome-title">
        GODET
      </h2>
      <p className="lead">{mode === 'demo' ? 'Le garage de votre parc d’engins.' : `Bienvenue dans le garage de ${orgName}.`}</p>
      <p className="copy">
        {mode === 'demo'
          ? 'Six machines d’une entreprise valaisanne, avec douze mois de carnet : services, réparations, pièces, coûts, photos et échéances. Essayez tout : rien n’est enregistré.'
          : machines
            ? 'Chaque machine a son carnet complet : services, réparations, pièces changées, coûts, photos, vidéos et prochaines échéances.'
            : 'Ajoutez votre première machine : son carnet, ses échéances et ses coûts se rempliront au fil des interventions.'}
      </p>
      <div className="row">
        <button ref={button} type="button" className="btn btn-primary" onClick={onEnter}>
          <Icon name="power" />
          Allumer le garage
        </button>
        <small>Le son démarre avec ce bouton. Vous pouvez le couper en haut à droite.</small>
      </div>
    </section>
  );
}
