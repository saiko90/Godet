'use client';

import { useTranslations } from 'next-intl';
import { unstable_rethrow } from 'next/navigation';
import { useActionState, useId, useOptimistic, useState, useTransition } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { changerRole, inviterMembre, retirerMembre, revoquerInvitation } from '@/app/[locale]/parametres/actions';
import { isAppLocale, routing, type AppLocale } from '@/i18n/routing';
import { useDomainText } from '@/lib/use-domain-text';
import type { Member, MemberRole } from '@/lib/types';
import { CopyButton } from '../CopyButton';
import { Alert, FieldError } from '../Form';
import { EMPTY_INVITE, type ActionResult, type PendingInvitation } from '../types';
import { ConfirmButton } from './ConfirmButton';
import { useServerAction } from './useServerAction';

const ASSIGNABLE: MemberRole[] = ['admin', 'mechanic', 'operator'];
const ALL_ROLES: MemberRole[] = ['owner', 'admin', 'mechanic', 'operator'];

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
  /** L'envoi d'e-mails est configuré : l'invitation part par e-mail (sinon, lien à transmettre). */
  emailEnabled: boolean;
  /** Langue de la page (langue proposée pour l'e-mail d'invitation). */
  locale: AppLocale;
}

function initials(name: string | null, email: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').split('@')[0] || '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

// Lien sans langue : la personne invitée arrive dans la langue de son navigateur.
function inviteLink(origin: string, token: string): string {
  return `${origin}/invitation/${token}`;
}

/** Lien mailto: prérempli (dans la langue de la personne qui invite), envoyé depuis sa propre messagerie. */
function useMailto() {
  const t = useTranslations('settings.team.mail');
  const f = useFormat();
  return (inv: PendingInvitation, link: string, orgName: string, myName: string): string => {
    const subject = t('subject', { org: orgName });
    const body = [
      t('greeting'),
      '',
      t('intro', { org: orgName, role: inv.role }),
      '',
      t('open', { date: f.date(inv.expiresAt) }),
      link,
      '',
      t('account', { email: inv.email }),
      '',
      myName,
    ]
      .join('\r\n')
      .trimEnd();
    return `mailto:${inv.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
}

function MemberRow({ member, me, canManage }: { member: Member; me: boolean; canManage: boolean }) {
  const t = useTranslations('settings');
  const dt = useDomainText();
  const f = useFormat();
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
        setRoleResult({ ok: false, message: t('messages.offline') });
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
          {member.fullName || member.email || t('team.member')}
          {me ? <span className="pill muted">{t('team.you')}</span> : null}
        </span>
        <span className="s-member-meta">
          {member.fullName && member.email ? `${member.email} · ` : ''}
          {t('team.since', { date: f.date(member.since) })}
        </span>
      </div>
      <div className="s-member-actions">
        {editable ? (
          <>
            <label className="s-sr" htmlFor={selectId}>
              {t('team.roleOf', { name: member.fullName || member.email || t('team.thisMember') })}
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
                  {dt.role(r)}
                </option>
              ))}
            </select>
            <ConfirmButton
              label={t('team.remove')}
              question={t('team.removeQuestion')}
              confirmLabel={t('team.removeConfirm')}
              onConfirm={() => removal.run(member.userId)}
              pending={removal.pending}
            />
          </>
        ) : (
          <span className={`pill${member.role === 'owner' ? '' : ' muted'}`}>{dt.role(member.role)}</span>
        )}
        {rolePending || result ? (
          <p className={`s-status${result && !result.ok ? ' s-is-bad' : ''}`} role="status">
            {rolePending ? t('team.saving') : (result?.message ?? '')}
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
  const t = useTranslations('settings.team');
  const dt = useDomainText();
  const f = useFormat();
  const mailto = useMailto();
  const revoke = useServerAction(revoquerInvitation);
  const link = inviteLink(origin, inv.token);
  const date = f.date(inv.expiresAt);
  return (
    <li className="s-invite">
      <div className="s-invite-main">
        <b>{inv.email}</b>
        <span>{expired ? t('expiredOn', { role: dt.role(inv.role), date }) : t('validUntil', { role: dt.role(inv.role), date })}</span>
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
            <a className="btn btn-soft s-btn-sm" href={mailto(inv, link, orgName, myName)}>
              <Icon name="mail" />
              {t('send')}
            </a>
          </>
        ) : null}
        <ConfirmButton
          label={expired ? t('delete') : t('revoke')}
          question={expired ? t('deleteQuestion') : t('revokeQuestion')}
          confirmLabel={expired ? t('deleteConfirm') : t('revokeConfirm')}
          onConfirm={() => revoke.run(inv.id)}
          pending={revoke.pending}
          icon="close"
        />
      </div>
    </li>
  );
}

export function EquipePanel({
  members,
  membersError,
  invitations,
  meId,
  canManage,
  orgName,
  myName,
  origin,
  nowIso,
  emailEnabled,
  locale,
}: Props) {
  const t = useTranslations('settings.team');
  const tl = useTranslations('common.languages');
  const dt = useDomainText();
  const f = useFormat();
  const mailto = useMailto();
  const [state, action, pending] = useActionState(inviterMembre, EMPTY_INVITE);
  const uid = useId();
  const ids = {
    title: `${uid}-titre`,
    email: `${uid}-email`,
    emailErr: `${uid}-email-err`,
    role: `${uid}-role`,
    roleErr: `${uid}-role-err`,
    lang: `${uid}-langue`,
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
  const langShown = failed?.langue && isAppLocale(failed.langue) ? failed.langue : locale;

  return (
    <section id="equipe" className="s-panel" aria-labelledby={ids.title}>
      <div className="s-panel-head">
        <h2 id={ids.title}>
          <Icon name="users" />
          {t('title')}
        </h2>
        <p>{canManage ? t('manageText') : t('readText')}</p>
      </div>

      {membersError ? (
        <Alert tone="bad">
          <p>{t('loadError')}</p>
        </Alert>
      ) : (
        <ul className="s-members" aria-label={t('members')}>
          {members.map((m) => (
            <MemberRow key={m.userId} member={m} me={m.userId === meId} canManage={canManage} />
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="s-sub">
          <h3>{t('invite')}</h3>
          <form action={action} className="s-inline-form" noValidate>
            <div className={`s-row ${emailEnabled ? 's-row-4' : 's-row-3'}`}>
              <div className="field">
                <label htmlFor={ids.email}>{t('email')}</label>
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
                <label htmlFor={ids.role}>{t('role')}</label>
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
                      {dt.role(r)}
                    </option>
                  ))}
                </select>
              </div>
              {emailEnabled ? (
                <div className="field">
                  <label htmlFor={ids.lang}>{t('emailLanguage')}</label>
                  <select key={`${state.done}-${langShown}`} id={ids.lang} name="langue" defaultValue={langShown}>
                    {routing.locales.map((l) => (
                      <option key={l} value={l} lang={l}>
                        {tl(l)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <button type="submit" className="btn btn-primary" disabled={pending}>
                <Icon name={emailEnabled ? 'mail' : 'link'} />
                {pending ? (emailEnabled ? t('sending') : t('creating')) : emailEnabled ? t('createAndSend') : t('create')}
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
                {t.rich(state.emailed ? 'linkSent' : 'linkReady', {
                  message: state.message ?? '',
                  email: created.email,
                  date: f.date(created.expiresAt),
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </p>
              <label className="s-sr" htmlFor={ids.link}>
                {t('link')}
              </label>
              <input id={ids.link} type="text" readOnly value={createdLink} onFocus={(e) => e.currentTarget.select()} />
              <div className="s-linkbox-actions">
                <CopyButton text={createdLink} className="btn btn-primary s-btn-sm" />
                <a className="btn btn-soft s-btn-sm" href={mailto(created, createdLink, orgName, myName)}>
                  <Icon name="mail" />
                  {t('sendEmail')}
                </a>
              </div>
            </div>
          ) : null}

          <h3>{t('pending')}</h3>
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
            <p className="s-muted">{t('noPending')}</p>
          )}
        </div>
      ) : null}

      <div className="s-sub">
        <h3>{t('roles')}</h3>
        <dl className="s-roles">
          {ALL_ROLES.map((r) => (
            <div key={r}>
              <dt>{dt.role(r)}</dt>
              <dd>{dt.roleHint(r)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
