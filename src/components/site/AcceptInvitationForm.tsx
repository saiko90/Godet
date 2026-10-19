'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/Icons';
import { accepterInvitation } from '@/app/invitation/actions';
import { Alert } from './Form';
import type { MessageState } from './types';

const INITIAL: MessageState = { message: null };

/** Bouton « Rejoindre l'entreprise » (la personne est connectée avec la bonne adresse). */
export function AcceptInvitationForm({ token, orgName }: { token: string; orgName: string }) {
  const [state, action, pending] = useActionState(accepterInvitation, INITIAL);
  return (
    <form action={action} className="s-form">
      <input type="hidden" name="token" value={token} />
      {state.message ? (
        <Alert tone="bad" live>
          <p>{state.message}</p>
        </Alert>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
        <Icon name="garage" />
        {pending ? 'Ouverture du garage…' : `Rejoindre ${orgName}`}
      </button>
    </form>
  );
}
