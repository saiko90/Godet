'use client';

// Réglages des rappels par e-mail (page des paramètres) : activer ou non, fréquence (chaque jour, chaque semaine,
// jamais), anticipation en jours (échéances en date) et en heures de compteur. Lit et enregistre la ligne
// notification_prefs de la personne connectée (supabaseBrowser, RLS).
//
// Textes : zone « notifications ». Si la page ne la fournit pas (NextIntlClientProvider avec pickMessages), le
// panneau pose son propre fournisseur avec les textes intégrés des 4 langues. Dates : useFormat() (FormatProvider
// de la page, sinon formats suisses).
// Par défaut, seul le contenu est rendu (la page pose la section, son titre et l'ancre #rappels, cible du lien
// « Modifier ou désactiver les rappels » des e-mails) ; `standalone` ajoute la section, le titre et l'introduction.

import { NextIntlClientProvider, useLocale, useMessages, useTimeZone, useTranslations } from 'next-intl';
import { useId } from 'react';
import { Icon } from '@/components/Icons';
import de from '../../../messages/de/notifications.json';
import en from '../../../messages/en/notifications.json';
import fr from '../../../messages/fr/notifications.json';
import it from '../../../messages/it/notifications.json';
import { NotificationsForm } from './NotificationsForm';
import { useNotificationPrefs } from './useNotificationPrefs';
import './notifications.css';

const BUNDLED: Record<string, typeof fr> = { fr, de, it, en };

export interface NotificationsPanelProps {
  /** Section autonome avec titre et introduction (hors de la page des paramètres). */
  standalone?: boolean;
  /** Ancre de la section autonome : « rappels » par défaut. */
  id?: string;
}

export function NotificationsPanel(props: NotificationsPanelProps) {
  const messages = useMessages() as Record<string, unknown>;
  const locale = useLocale();
  const timeZone = useTimeZone();
  const zone = messages.notifications;
  if (zone && typeof zone === 'object' && Object.keys(zone).length > 0) return <PanelContent {...props} />;
  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone={timeZone}
      messages={{ ...messages, notifications: BUNDLED[locale] ?? BUNDLED.fr }}
    >
      <PanelContent {...props} />
    </NextIntlClientProvider>
  );
}

function PanelContent({ standalone = false, id = 'rappels' }: NotificationsPanelProps) {
  const t = useTranslations('notifications');
  const titleId = useId();
  const prefs = useNotificationPrefs();
  const form = (
    <NotificationsForm
      load={prefs.load}
      values={prefs.values}
      errors={prefs.errors}
      status={prefs.status}
      dirty={prefs.dirty}
      onChange={prefs.update}
      onSave={prefs.save}
      onRetry={prefs.retry}
    />
  );
  if (!standalone) return form;
  return (
    <section id={id} className="n-panel" aria-labelledby={titleId}>
      <div className="n-head">
        <h2 id={titleId}>
          <Icon name="mail" />
          {t('title')}
        </h2>
        <p>{t('intro')}</p>
      </div>
      {form}
    </section>
  );
}
