'use client';

import { unstable_rethrow } from 'next/navigation';
import { useActionState, useId, useOptimistic, useState, useTransition } from 'react';
import { Icon } from '@/components/Icons';
import { changerRole, inviterMembre, retirerMembre, revoquerInvitation } from '@/app/parametres/actions';
import { ROLES } from '@/lib/domain';
import { dateCH } from '@/lib/format';
import type { Member, MemberRole } from '@/lib/types';
import { CopyButton } from '../CopyButton';
import { Alert, FieldError } from '../Form';
import { EMPTY_INVITE, type ActionResult, type PendingInvitation } from '../types';
import { ConfirmButton } from './ConfirmButton';
import { useServerAction } from './useServerAction';

const NB = '\u00a0';
const ASSIGNABLE: MemberRole[] = ['admin', 'mechanic', 'operator'];

interface Props {
  members: Member[];
  membersError: boolean;
  invitations: PendingInvitation[];
  meId: string;
  canManage: boolean;
  orgName: string;
  myName: string;
  /** Adresse publique du site (liens d'invitation). */
  origin: string;
  /** Instant du rendu côté serveur (invitations expirées). */
  nowIso: string;
}

function initials(name: string | null, email: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').split('@')[0] || '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

function inviteLink(origin: string, token: string): string {
  return `${origin}/invitation/${token}`;
}

/** Lien mailto: prérempli, envoyé depuis la messagerie de la personne qui invite. */
function mailtoHref(inv: PendingInvitation, link: string, orgName: string, myName: string): string {
  const subject = `Invitation à rejoindre ${orgName} sur Godet`;
  const body = [
    'Bonjour,',
    '',
    `Je vous invite à rejoindre «${NB}${orgName}${NB}» sur Godet, le carnet d’entretien de notre parc d’engins. Votre rôle${NB}: ${ROLES[inv.role].label.toLowerCase()}.`,
    '',
    `Ouvrez ce lien pour accepter l’invitation (valable jusqu’au ${dateCH(inv.expiresAt)})${NB}:`,
    link,
    '',
    `Créez votre compte avec cette adresse e-mail${NB}: ${inv.email}.`,
    '',
    myName,
  ]
    .join('\r\n')
    .trimEnd();
  return `mailto:${inv.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function MemberRow({ member, me, canManage }: { member: Member; me: boolean; canManage: boolean }) {
  const removal = useServerAction(retirerMembre);
  const [rolePending, startRole] = useTransition();
  const [shownRole, setShownRole] = useOptimistic(member.role);
  const [roleResult, setRoleResult] = useState<ActionResult | null>(null);
  const selectId = useId();
  const editable = canManage && !me && member.role !== 'owner';
  const result = removal.result ?? roleResult;

  function changeRole(next: MemberRole) {
    setRoleResult(null);
    startRole(async () => {
      setShownRole(next);
      try {
        setRoleResult(await changerRole(member.userId, next));
      } catch (error) {
        unstable_rethrow(error);
        setRoleResult({ ok: false, message: 'Connexion au serveur impossible. Réessayez.' });
      }
    });
  }

  return (
    <li className="s-member">
      <span className={`s-avatar${member.role === 'owner' ? '' : ' s-avatar-dim'}`} aria-hidden="true">
        {initials(member.fullName, member.email)}
      </span>
      <div className="s-member-main">
        <span className="s-member-name">
          {member.fullName || member.email || 'Membre'}
          {me ? <span className="pill muted">Vous</span> : null}
        </span>
        <span className="s-member-meta">
          {member.fullName && member.email ? `${member.email} · ` : ''}
          membre depuis le {dateCH(member.since)}
        </span>
      </div>
      <div className="s-member-actions">
        {editable ? (
          <>
            <label className="s-sr" htmlFor={selectId}>
              Rôle de {member.fullName || member.email || 'ce membre'}
            </label>
            <select
              id={selectId}
              className="s-select"
              value={shownRole}
              onChange={(e) => changeRole(e.target.value as MemberRole)}
              disabled={rolePending || removal.pending}
            >
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {ROLES[r].label}
                </option>
              ))}
            </select>
            <ConfirmButton
              label="Retirer"
              question={'Retirer ce membre\u00a0?'}
              confirmLabel="Oui, retirer"
              onConfirm={() => removal.run(member.userId)}
              pending={removal.pending}
            />
          </>
        ) : (
          <span className={`pill${member.role === 'owner' ? '' : ' muted'}`}>{ROLES[member.role].label}</span>
        )}
        {rolePending || result ? (
          <p className={`s-status${result && !result.ok ? ' s-is-bad' : ''}`} role="status">
            {rolePending ? 'Enregistrement…' : (result?.message ?? '')}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function InvitationRow({
  inv,
  origin,
  orgName,
  myName,
  expired,
}: {
  inv: PendingInvitation;
  origin: string;
  orgName: string;
  myName: string;
  expired: boolean;
}) {
  const revoke = useServerAction(revoquerInvitation);
  const link = inviteLink(origin, inv.token);
  return (
    <li className="s-invite">
      <div className="s-invite-main">
        <b>{inv.email}</b>
        <span>
          {ROLES[inv.role].label} · {expired ? `expirée le ${dateCH(inv.expiresAt)}` : `valable jusqu’au ${dateCH(inv.expiresAt)}`}
        </span>
        {revoke.result && !revoke.result.ok ? (
          <span className="s-status s-is-bad" role="status">
            {revoke.result.message}
          </span>
        ) : null}
      </div>
      <div className="s-invite-actions">
        {!expired ? (
          <>
            <CopyButton text={link} />
            <a className="btn btn-soft s-btn-sm" href={mailtoHref(inv, link, orgName, myName)}>
              <Icon name="mail" />
              Envoyer
            </a>
          </>
        ) : null}
        <ConfirmButton
          label={expired ? 'Supprimer' : 'Révoquer'}
          question={expired ? 'Supprimer l’invitation\u00a0?' : 'Révoquer l’invitation\u00a0?'}
          confirmLabel={expired ? 'Oui, supprimer' : 'Oui, révoquer'}
          onConfirm={() => revoke.run(inv.id)}
          pending={revoke.pending}
          icon="close"
        />
      </div>
    </li>
  );
}

export function EquipePanel({ members, membersError, invitations, meId, canManage, orgName, myName, origin, nowIso }: Props) {
  const [state, action, pending] = useActionState(inviterMembre, EMPTY_INVITE);
  const uid = useId();
  const ids = {
    title: `${uid}-titre`,
    email: `${uid}-email`,
    emailErr: `${uid}-email-err`,
    role: `${uid}-role`,
    roleErr: `${uid}-role-err`,
    link: `${uid}-lien`,
  };
  const created = state.invitation;
  const createdLink = created ? inviteLink(origin, created.token) : '';
  const now = Date.parse(nowIso);
  // Après un refus, la saisie est réaffichée (React vide le formulaire après chaque envoi) ;
  // après une invitation créée, le formulaire repart à zéro.
  const failed = state.ok === false ? state.values : undefined;
  const emailShown = failed?.email ?? '';
  const roleShown = failed?.role && ASSIGNABLE.includes(failed.role as MemberRole) ? failed.role : 'operator';

  return (
    <section id="equipe" className="s-panel" aria-labelledby={ids.title}>
      <div className="s-panel-head">
        <h2 id={ids.title}>
          <Icon name="users" />
          Équipe
        </h2>
        <p>
          {canManage
            ? 'Invitez vos mécaniciens et machinistes. Chacun accède au parc selon son rôle.'
            : 'Les personnes qui ont accès au garage. Seuls le propriétaire et les administrateurs gèrent l’équipe.'}
        </p>
      </div>

      {membersError ? (
        <Alert tone="bad">
          <p>L’équipe n’a pas pu être chargée. Rechargez la page.</p>
        </Alert>
      ) : (
        <ul className="s-members" aria-label="Membres de l’entreprise">
          {members.map((m) => (
            <MemberRow key={m.userId} member={m} me={m.userId === meId} canManage={canManage} />
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="s-sub">
          <h3>Inviter une personne</h3>
          <form action={action} className="s-inline-form" noValidate>
            <div className="s-row s-row-3">
              <div className="field">
                <label htmlFor={ids.email}>Adresse e-mail</label>
                <input
                  id={ids.email}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={200}
                  key={state.done}
                  defaultValue={emailShown}
                  aria-invalid={state.errors.email ? true : undefined}
                  aria-describedby={state.errors.email ? ids.emailErr : undefined}
                />
              </div>
              <div className="field">
                <label htmlFor={ids.role}>Rôle</label>
                <select
                  key={`${state.done}-${roleShown}`}
                  id={ids.role}
                  name="role"
                  defaultValue={roleShown}
                  aria-invalid={state.errors.role ? true : undefined}
                  aria-describedby={state.errors.role ? ids.roleErr : undefined}
                >
                  {ASSIGNABLE.map((r) => (
                    <option key={r} value={r}>
                      {ROLES[r].label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                <Icon name="link" />
                {pending ? 'Création…' : 'Créer l’invitation'}
              </button>
            </div>
            <FieldError id={ids.emailErr} message={state.errors.email} />
            <FieldError id={ids.roleErr} message={state.errors.role} />
            {state.ok === false && !state.errors.email && !state.errors.role && state.message ? (
              <Alert tone="bad" live>
                <p>{state.message}</p>
              </Alert>
            ) : null}
          </form>

          {state.ok && created ? (
            <div className="s-linkbox" role="status">
              <p>
                <b>{state.message}</b> Transmettez ce lien à {created.email}&nbsp;: il est valable jusqu’au{' '}
                {dateCH(created.expiresAt)} et ne sert qu’une fois.
              </p>
              <label className="s-sr" htmlFor={ids.link}>
                Lien d’invitation
              </label>
              <input id={ids.link} type="text" readOnly value={createdLink} onFocus={(e) => e.currentTarget.select()} />
              <div className="s-linkbox-actions">
                <CopyButton text={createdLink} className="btn btn-primary s-btn-sm" />
                <a className="btn btn-soft s-btn-sm" href={mailtoHref(created, createdLink, orgName, myName)}>
                  <Icon name="mail" />
                  Envoyer par e-mail
                </a>
              </div>
            </div>
          ) : null}

          <h3>Invitations en attente</h3>
          {invitations.length ? (
            <ul className="s-invites">
              {invitations.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  inv={inv}
                  origin={origin}
                  orgName={orgName}
                  myName={myName}
                  expired={Date.parse(inv.expiresAt) < now}
                />
              ))}
            </ul>
          ) : (
            <p className="s-muted">Aucune invitation en attente.</p>
          )}
        </div>
      ) : null}

      <div className="s-sub">
        <h3>Les rôles</h3>
        <dl className="s-roles">
          {(Object.keys(ROLES) as MemberRole[]).map((r) => (
            <div key={r}>
              <dt>{ROLES[r].label}</dt>
              <dd>{ROLES[r].hint}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
