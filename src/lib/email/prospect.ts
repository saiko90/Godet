import 'server-only';

import { escapeHtml } from './layout';

// E-mail de prospection envoyé depuis la console (/admin), sur clic de Michaël : le texte validé tel quel, sans
// gabarit publicitaire (un message personnel), suivi de l'identité de l'expéditeur, de l'origine des coordonnées
// et d'un moyen simple de refuser (LCD art. 3 al. 1 let. o ; nLPD art. 19 ; RGPD art. 14 et 21).

export interface ProspectEmailInput {
  subject: string;
  body: string;
  /** Lignes de pied : expéditeur, origine des coordonnées, refus, protection des données. */
  footer: string[];
}

export interface RenderedProspectEmail {
  subject: string;
  text: string;
  html: string;
}

/** Adresses « godet.app/… » et liens http(s) du texte rendus cliquables (le texte est déjà échappé). */
function linkify(escaped: string): string {
  return escaped.replace(/\b(https?:\/\/[^\s<]+|godet\.app\/[^\s<]*[^\s<.,;:!?)])/g, (m) => {
    const href = m.startsWith('http') ? m : `https://${m}`;
    return `<a href="${href}" style="color:#1a56db">${m}</a>`;
  });
}

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${linkify(escapeHtml(p)).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function renderProspectEmail({ subject, body, footer }: ProspectEmailInput): RenderedProspectEmail {
  const text = `${body.trim()}\n\n--\n${footer.join('\n')}\n`;
  const html =
    '<!doctype html><html><body style="margin:0;padding:16px;background:#ffffff">' +
    '<div style="max-width:620px;font:15px/1.55 Arial,Helvetica,sans-serif;color:#1c1c1c">' +
    paragraphs(body) +
    '<hr style="border:0;border-top:1px solid #ddd;margin:22px 0 12px">' +
    footer.map((l) => `<p style="margin:0 0 6px;font-size:12px;line-height:1.45;color:#666">${linkify(escapeHtml(l))}</p>`).join('') +
    '</div></body></html>';
  return { subject: subject.trim(), text, html };
}
