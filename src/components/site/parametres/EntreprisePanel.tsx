'use client';

import { useActionState, useId } from 'react';
import { Icon } from '@/components/Icons';
import { changerEntrepriseActive, enregistrerEntreprise } from '@/app/parametres/actions';
import { ROLES } from '@/lib/domain';
import type { MemberRole } from '@/lib/types';
import { CANTONS, cantonLabel } from '../cantons';
import { FieldError } from '../Form';
import { EMPTY_FORM } from '../types';
import { useServerAction } from './useServerAction';

interface Props {
  org: { id: string; name: string; canton: string | null };
  /** « Essai gratuit jusqu’au 18.11.2026 », « Abonnement actif »… (calculé côté serveur). */
  planLabel: string;
  createdLabel: string;
  canEdit: boolean;
  orgs: { id: string; name: string; role: MemberRole }[];
}

export function EntreprisePanel({ org, planLabel, createdLabel, canEdit, orgs }: Props) {
  const [state, action, pending] = useActionState(enregistrerEntreprise, EMPTY_FORM);
  const switcher = useServerAction(changerEntrepriseActive);
  const uid = useId();
  const ids = { nom: `${uid}-nom`, nomErr: `${uid}-nom-err`, canton: `${uid}-canton`, cantonErr: `${uid}-canton-err` };

  return (
    <section id="entreprise" className="s-panel" aria-labelledby={`${uid}-titre`}>
      <div className="s-panel-head">
        <h2 id={`${uid}-titre`}>
          <Icon name="garage" />
          Entreprise
        </h2>
        <p>
          {canEdit
            ? 'Le nom apparaît dans le garage et sur les carnets imprimés.'
            : 'Seuls le propriétaire et les administrateurs peuvent modifier ces informations.'}
        </p>
      </div>

      <dl className="s-facts">
        <div>
          <dt>Formule</dt>
          <dd>{planLabel}</dd>
        </div>
        <div>
          <dt>Garage ouvert le</dt>
          <dd>{createdLabel}</dd>
        </div>
        {!canEdit ? (
          <>
            <div>
              <dt>Nom</dt>
              <dd>{org.name}</dd>
            </div>
            <div>
              <dt>Canton</dt>
              <dd>{cantonLabel(org.canton) ?? 'Non précisé'}</dd>
            </div>
          </>
        ) : null}
      </dl>

      {canEdit ? (
        <form action={action} className="s-inline-form" noValidate>
          <div className="s-row">
            <div className="field">
              <label htmlFor={ids.nom}>Nom de l’entreprise</label>
              <input
                id={ids.nom}
                name="nom"
                type="text"
                autoComplete="organization"
                required
                minLength={2}
                maxLength={80}
                defaultValue={org.name}
                aria-invalid={state.errors.nom ? true : undefined}
                aria-describedby={state.errors.nom ? ids.nomErr : undefined}
              />
              <FieldError id={ids.nomErr} message={state.errors.nom} />
            </div>
            <div className="field">
              <label htmlFor={ids.canton}>Canton</label>
              <select
                id={ids.canton}
                name="canton"
                defaultValue={org.canton ?? ''}
                aria-invalid={state.errors.canton ? true : undefined}
                aria-describedby={state.errors.canton ? ids.cantonErr : undefined}
              >
                <option value="">Non précisé</option>
                {CANTONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <FieldError id={ids.cantonErr} message={state.errors.canton} />
            </div>
          </div>
          <div className="s-form-foot">
            <button type="submit" className="btn btn-primary s-btn-sm" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <p className={`s-status${state.ok === false ? ' s-is-bad' : ''}`} role="status">
              {state.message ?? ''}
            </p>
          </div>
        </form>
      ) : null}

      {orgs.length > 1 ? (
        <div className="s-sub">
          <h3>Vos entreprises</h3>
          <ul className="s-orgs">
            {orgs.map((o) => {
              const active = o.id === org.id;
              return (
                <li key={o.id} className="s-org" aria-current={active ? 'true' : undefined}>
                  <div className="s-org-main">
                    <b>{o.name}</b>
                    <span>{ROLES[o.role].label}</span>
                  </div>
                  {active ? (
                    <span className="pill">Entreprise active</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-soft s-btn-sm"
                      onClick={() => switcher.run(o.id)}
                      disabled={switcher.pending}
                    >
                      Travailler dans cette entreprise
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`s-status${switcher.result && !switcher.result.ok ? ' s-is-bad' : ''}`} role="status">
            {switcher.pending ? 'Changement d’entreprise…' : (switcher.result?.message ?? '')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
