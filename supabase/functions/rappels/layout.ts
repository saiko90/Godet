// Fichier généré par sync.mjs à partir de src/lib/email/layout.ts : ne pas modifier ici.

// Gabarit des e-mails de Godet : HTML sobre (tableaux, styles en ligne), lisible en clair comme en sombre.
// En-tête nuit avec le logo texte « GODET », carte claire, bouton jaune engin, pied discret.
//
// Module PUR, sans aucun import : il est recopié tel quel dans la fonction Supabase « rappels »
// (`node supabase/functions/rappels/sync.mjs`). Toute modification ici doit être suivie de cette commande
// puis d'un nouveau déploiement de la fonction.

/** Couleurs des e-mails (contrastes vérifiés sur fond blanc ; le mode sombre est géré par la feuille de style). */
export const EMAIL_COLORS = {
  night: '#08090b',
  chalk: '#ece8de',
  steel: '#a2a6ad',
  page: '#f4f2ec',
  card: '#ffffff',
  ink: '#1d1f24',
  muted: '#5b6068',
  line: '#e3dfd4',
  paint: '#f3b71b',
  bad: '#b42318',
  badSoft: '#fdeceb',
  warn: '#8a4500',
  warnSoft: '#fff1dc',
  neutralSoft: '#efede7',
} as const;

const C = EMAIL_COLORS;
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

/** Échappe un texte pour l'insérer dans du HTML (contenu ou attribut). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Adresse http(s) valide, sinon null (jamais de « javascript: » dans un lien d'e-mail). */
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Texte d'une ligne d'en-tête (objet) : sans retour à la ligne ni espaces superflus. */
export function oneLine(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export interface EmailFrame {
  /** Langue du document : « fr-CH », « de-CH », « it-CH », « en ». */
  lang: string;
  /** Titre du document (onglet d'un webmail, lecteurs d'écran). */
  title: string;
  /** Aperçu affiché à côté de l'objet dans la boîte de réception. */
  preheader: string;
  /** Phrase sous le logo. */
  tagline: string;
  /** Contenu de la carte (HTML déjà échappé, construit avec les fonctions ci-dessous). */
  content: string;
  /** Pied de l'e-mail (HTML déjà échappé). */
  footer: string;
}

/** Document HTML complet d'un e-mail. */
export function renderEmailFrame(f: EmailFrame): string {
  // Caractères invisibles après l'aperçu : la boîte de réception n'y ajoute pas le début du corps.
  const spacer = '&#847;&zwnj;&nbsp;'.repeat(60);
  return `<!doctype html>
<html lang="${escapeHtml(f.lang)}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(f.title)}</title>
<style>
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  a { color: ${C.ink}; }
  @media (max-width: 620px) {
    .g-pad { padding-left: 20px !important; padding-right: 20px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .g-page { background: ${C.night} !important; }
    .g-card { background: #121418 !important; border-color: #2a2d33 !important; }
    .g-text, .g-text a { color: ${C.chalk} !important; }
    .g-muted, .g-muted a { color: ${C.steel} !important; }
    .g-rule { border-color: #2a2d33 !important; }
    .g-text a.g-btn { color: ${C.night} !important; }
  }
</style>
</head>
<body class="g-page" style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${escapeHtml(f.preheader)}${spacer}</div>
<table role="presentation" class="g-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td align="center" style="padding:24px 12px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td class="g-pad" style="background:${C.night};border-radius:14px 14px 0 0;padding:22px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="width:8px;background:${C.paint};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
<td style="padding-left:14px;">
<div style="font-family:'Arial Black', Arial, Helvetica, sans-serif;font-size:20px;line-height:24px;font-weight:900;letter-spacing:6px;color:${C.chalk};">GODET</div>
<div style="font-family:${FONT};font-size:12px;line-height:16px;color:${C.steel};margin-top:4px;">${escapeHtml(f.tagline)}</div>
</td>
</tr></table>
</td></tr>
<tr><td style="height:4px;background:${C.paint};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="g-card g-pad g-text" style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 14px 14px;padding:28px 32px 32px;font-family:${FONT};font-size:15px;line-height:23px;color:${C.ink};">
${f.content}
</td></tr>
<tr><td class="g-pad g-muted" style="padding:20px 32px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
${f.footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Grand titre de la carte. */
export function emailHeading(text: string): string {
  return `<h1 class="g-text" style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${C.ink};">${escapeHtml(text)}</h1>`;
}

/** Titre d'une partie (nom d'une entreprise). */
export function emailSubheading(text: string): string {
  return `<h2 class="g-text" style="margin:28px 0 4px;font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${C.ink};">${escapeHtml(text)}</h2>`;
}

/** Petit intertitre en capitales (« Échéances », « Réparations ouvertes »). */
export function emailSectionTitle(text: string): string {
  return `<h3 class="g-muted" style="margin:20px 0 4px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">${escapeHtml(text)}</h3>`;
}

/** Paragraphe (HTML déjà échappé). */
export function emailParagraph(html: string): string {
  return `<p class="g-text" style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:23px;color:${C.ink};">${html}</p>`;
}

/** Paragraphe discret (HTML déjà échappé). */
export function emailNote(html: string): string {
  return `<p class="g-muted" style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">${html}</p>`;
}

/** Bouton d'action (lien http(s) uniquement ; sinon rien). */
export function emailButton(href: string, label: string): string {
  const url = safeUrl(href);
  if (!url) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 20px;">
<tr><td bgcolor="${C.paint}" style="background:${C.paint};border-radius:10px;">
<a class="g-btn" href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:15px;line-height:18px;font-weight:700;color:${C.night};text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

/** Lien en clair (pour le copier si le bouton ne fonctionne pas). */
export function emailLinkText(href: string): string {
  const url = safeUrl(href);
  if (!url) return '';
  return `<p class="g-muted" style="margin:0 0 14px;font-family:${MONO};font-size:12px;line-height:18px;color:${C.muted};word-break:break-all;"><a href="${escapeHtml(url)}" style="color:${C.muted};text-decoration:underline;">${escapeHtml(url)}</a></p>`;
}

/** Lien dans un texte (pied de page, etc.). */
export function emailLink(href: string, label: string): string {
  const url = safeUrl(href);
  if (!url) return escapeHtml(label);
  return `<a href="${escapeHtml(url)}" style="color:inherit;text-decoration:underline;">${escapeHtml(label)}</a>`;
}

export type EmailTone = 'bad' | 'warn' | 'neutral';

/** Pastille d'état : le texte porte l'information, la couleur ne fait que la souligner. */
export function emailChip(label: string, tone: EmailTone): string {
  const [bg, fg] = tone === 'bad' ? [C.badSoft, C.bad] : tone === 'warn' ? [C.warnSoft, C.warn] : [C.neutralSoft, C.muted];
  return `<span style="display:inline-block;margin:0 8px 2px 0;padding:2px 8px;border-radius:999px;background:${bg};color:${fg};font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;vertical-align:1px;">${escapeHtml(label)}</span>`;
}

export interface EmailListItem {
  /** Pastille d'état (déjà rendue par `emailChip`), facultative. */
  chip?: string;
  /** Ligne principale (HTML déjà échappé). */
  title: string;
  /** Ligne de détail (HTML déjà échappé). */
  detail?: string;
}

/** Liste d'éléments séparés par un filet. */
export function emailList(items: EmailListItem[]): string {
  if (!items.length) return '';
  const rows = items
    .map(
      (it) => `<tr><td class="g-rule" style="padding:12px 0;border-top:1px solid ${C.line};">
<div class="g-text" style="font-family:${FONT};font-size:15px;line-height:22px;color:${C.ink};">${it.chip ?? ''}${it.title}</div>${
        it.detail
          ? `\n<div class="g-muted" style="margin-top:2px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">${it.detail}</div>`
          : ''
      }
</td></tr>`,
    )
    .join('\n');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px;">
${rows}
</table>`;
}

/** Texte en gras (déjà échappé). */
export function emailStrong(text: string): string {
  return `<strong style="font-weight:700;">${escapeHtml(text)}</strong>`;
}
