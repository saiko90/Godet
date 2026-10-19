// Petits éléments de formulaire partagés : message d'erreur lié à un champ, bandeau d'alerte.
import { Icon, type IconName } from '@/components/Icons';

/** Message d'erreur d'un champ ; relier le champ avec aria-describedby={id}. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="s-field-msg">
      <Icon name="alert" />
      <span>{message}</span>
    </p>
  );
}

type Tone = 'bad' | 'ok' | 'warn' | 'info';

const TONE_ICON: Record<Tone, IconName> = { bad: 'alert', ok: 'check', warn: 'alert', info: 'mail' };

/** Bandeau de message. `live` : annoncé par les lecteurs d'écran à son apparition. */
export function Alert({
  tone = 'info',
  icon,
  live = false,
  children,
}: {
  tone?: Tone;
  icon?: IconName;
  live?: boolean;
  children: React.ReactNode;
}) {
  const role = live ? (tone === 'bad' ? 'alert' : 'status') : undefined;
  return (
    <div className={`s-alert s-alert-${tone}`} role={role}>
      <Icon name={icon ?? TONE_ICON[tone]} />
      <div>{children}</div>
    </div>
  );
}
