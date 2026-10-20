'use client';

// Accueil « Allumer le garage » : le clic débloque le son puis lance l'allumage du hall.
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('garage.welcome');
  const button = useRef<HTMLButtonElement>(null);
  // Seule action possible à ce moment : elle reçoit le focus (clavier et lecteurs d'écran).
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className={`welcome g-welcome${leaving ? ' leaving' : ''}`} aria-labelledby="welcome-title">
      <p className="eyebrow">{mode === 'demo' ? t('demoEyebrow') : orgName}</p>
      <h2 id="welcome-title" className="g-welcome-title">
        GODET
      </h2>
      <p className="lead">{mode === 'demo' ? t('demoLead') : t('lead', { org: orgName })}</p>
      <p className="copy">{mode === 'demo' ? t('demoCopy') : machines ? t('copy') : t('copyEmpty')}</p>
      <div className="row">
        <button ref={button} type="button" className="btn btn-primary" onClick={onEnter}>
          <Icon name="power" />
          {t('enter')}
        </button>
        <small>{t('sound')}</small>
      </div>
    </section>
  );
}
