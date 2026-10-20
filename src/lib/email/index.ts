import 'server-only';

// E-mails envoyés par l'application Next (côté serveur uniquement).
// - sendEmail : envoi via Resend si RESEND_API_KEY et EMAIL_FROM sont définis, sinon { sent: false, reason: 'not_configured' } ;
// - sendInvitationEmail / renderInvitationEmail : invitation à rejoindre une entreprise, dans les 4 langues.
// Les rappels d'échéances partent de la fonction Supabase « rappels » (supabase/functions/rappels), qui reprend
// le même gabarit (src/lib/email/layout.ts) et les mêmes textes (messages/<langue>/emails.json).
// Mode d'emploi : docs/notifications.md.

export { isEmailAddress, isEmailConfigured, sendEmail } from './send';
export type { EmailFailure, EmailInput, SendEmailResult } from './send';
export { renderInvitationEmail, sendInvitationEmail } from './invitation';
export type { InvitationEmailInput, RenderedEmail } from './invitation';
