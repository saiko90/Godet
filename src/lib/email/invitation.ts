import 'server-only';

import { createTranslator } from 'next-intl';
import { loadMessages } from '@/i18n/messages';
import { htmlLang, isAppLocale, type AppLocale } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import type { MemberRole } from '@/lib/types';
import {
  emailButton,
  emailHeading,
  emailLinkText,
  emailNote,
  emailParagraph,
  escapeHtml,
  oneLine,
  renderEmailFrame,
  safeUrl,
} from './layout';
import { defaultReplyTo, sendEmail, type SendEmailResult } from './send';

// E-mail d'invitation à rejoindre une entreprise : entreprise, rôle, lien, expiration. Dans la langue choisie.

export interface InvitationEmailInput {
  /** Adresse de la personne invitée. */
  to: string;
  /** Langue de l'e-mail (« fr », « de », « it », « en ») ; autre valeur → français. */
  locale: string;
  orgName: string;
  /** Nom de la personne qui invite (facultatif : sinon formulation neutre). */
  inviterName?: string | null;
  role: MemberRole;
  /** Lien d'acceptation absolu (http(s)), avec le préfixe de langue : …/de/invitation/<jeton>. */
  link: string;
  /** Fin de validité du lien (sinon : « valable 14 jours », durée par défaut de la base). */
  expiresAt?: string | Date | null;
  /** Pays de l'entreprise, pour le format de la date (« CH » par défaut). */
  country?: string | null;
  /** Adresse de réponse (par exemple celle de la personne qui invite). */
  replyTo?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Objet, HTML et texte de l'invitation (sans l'envoyer : utile pour un aperçu ou un test). */
export async function renderInvitationEmail(input: InvitationEmailInput): Promise<RenderedEmail> {
  const locale: AppLocale = isAppLocale(input.locale) ? input.locale : 'fr';
  const messages = await loadMessages(locale);
  const t = createTranslator({ locale, messages, namespace: 'emails' });
  const d = createTranslator({ locale, messages, namespace: 'domain' });
  const f = makeFormat({ locale, country: input.country ?? 'CH' });

  const org = oneLine(input.orgName) || 'Godet';
  const inviter = oneLine(input.inviterName ?? '');
  const link = safeUrl(input.link);
  if (!link) throw new Error('Invitation : lien invalide');

  const expiresIso =
    input.expiresAt instanceof Date
      ? Number.isNaN(input.expiresAt.getTime())
        ? null
        : input.expiresAt.toISOString()
      : input.expiresAt || null;

  const subject = oneLine(
    inviter ? t('invitation.subject', { inviter, org }) : t('invitation.subjectAnonymous', { org }),
  );
  const title = t('invitation.title', { org });
  const intro = inviter ? t('invitation.intro', { inviter, org }) : t('invitation.introAnonymous', { org });
  const role = t('invitation.role', { role: d(`roles.${input.role}.label`), hint: d(`roles.${input.role}.hint`) });
  const expires = expiresIso ? t('invitation.expires', { date: f.date(expiresIso) }) : t('invitation.expiresDefault');
  const account = t('invitation.account');
  const cta = t('invitation.cta');
  const linkHelp = t('invitation.linkHelp');
  const ignore = t('invitation.ignore');
  const signature = t('layout.signature');
  // « Ne pas répondre » seulement si personne ne lira la réponse (ni adresse de l'appelant, ni EMAIL_REPLY_TO).
  const automatic = input.replyTo?.trim() || defaultReplyTo() ? null : t('layout.automatic');

  const content = [
    emailHeading(title),
    emailParagraph(escapeHtml(t('invitation.greeting'))),
    emailParagraph(escapeHtml(intro)),
    emailParagraph(escapeHtml(role)),
    emailButton(link, cta),
    emailNote(escapeHtml(`${expires} ${account}`)),
    emailNote(escapeHtml(linkHelp)),
    emailLinkText(link),
  ].join('\n');

  const footer = [ignore, signature, automatic]
    .filter((line): line is string => Boolean(line))
    .map(escapeHtml)
    .join('<br>\n');

  const html = renderEmailFrame({
    lang: htmlLang(locale),
    title: subject,
    preheader: intro,
    tagline: t('layout.tagline'),
    content,
    footer,
  });

  const text = [
    title,
    '',
    t('invitation.greeting'),
    '',
    intro,
    '',
    role,
    '',
    `${cta}${locale === 'fr' ? '\u00a0: ' : ': '}${link}`,
    '',
    expires,
    account,
    '',
    '—',
    ignore,
    signature,
    ...(automatic ? [automatic] : []),
  ].join('\n');

  return { subject, html, text };
}

/**
 * Envoie l'invitation par e-mail. Ne lève pas d'exception pour un échec d'envoi : le résultat dit si l'e-mail est
 * parti (`{ sent: false, reason: 'not_configured' }` tant que Resend n'est pas configuré).
 */
export async function sendInvitationEmail(input: InvitationEmailInput): Promise<SendEmailResult> {
  let email: RenderedEmail;
  try {
    email = await renderInvitationEmail(input);
  } catch (error) {
    console.error('[email] invitation impossible à préparer :', error instanceof Error ? error.message : 'erreur inconnue');
    return { sent: false, reason: 'invalid_content' };
  }
  return sendEmail({
    to: input.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: input.replyTo,
    tags: [{ name: 'type', value: 'invitation' }],
  });
}
