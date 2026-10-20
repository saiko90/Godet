// Modèles des e-mails d'authentification Supabase (Authentication › Emails › Templates), dans les 4 langues.
// Même gabarit que les e-mails de l'application (src/lib/email/layout.ts). La langue vient des métadonnées du
// compte (`locale`, enregistrée à l'inscription) ; sans langue connue : français.
//
// Usage : node --experimental-strip-types scripts/emails/supabase-templates.mjs
// Résultat : supabase/templates/<modèle>.html et supabase/templates/README.md (objets à recopier).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emailHeading, emailNote, emailParagraph, escapeHtml, renderEmailFrame, EMAIL_COLORS as C } from '../../src/lib/email/layout.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'supabase/templates');
const LANGS = ['fr', 'de', 'it', 'en'];
const HTML_LANG = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH', en: 'en' };
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

/** Langue du compte (texte vide si absente : « <nil> » n'est égal à aucune langue → français). */
const LANG_VAR = '{{ $l := printf "%v" .Data.locale }}';

/** Choix selon la langue, en syntaxe des modèles Go de Supabase. */
function pick(values) {
  return `{{ if eq $l "de" }}${values.de}{{ else if eq $l "it" }}${values.it}{{ else if eq $l "en" }}${values.en}{{ else }}${values.fr}{{ end }}`;
}

/** Lien de vérification de l'application (route src/app/auth/confirm) : valable dans n'importe quel navigateur. */
const confirmUrl = (type) => `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;suite={{ .RedirectTo }}`;

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 20px;">
<tr><td bgcolor="${C.paint}" style="background:${C.paint};border-radius:10px;">
<a class="g-btn" href="${href}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:15px;line-height:18px;font-weight:700;color:${C.night};text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

function linkText(href) {
  return `<p class="g-muted" style="margin:0 0 14px;font-family:${MONO};font-size:12px;line-height:18px;color:${C.muted};word-break:break-all;"><a href="${href}" style="color:${C.muted};text-decoration:underline;">${href}</a></p>`;
}

function code(token) {
  return `<p class="g-text" style="margin:20px 0 22px;font-family:${MONO};font-size:30px;line-height:36px;font-weight:700;letter-spacing:8px;color:${C.ink};">${token}</p>`;
}

const COMMON = {
  tagline: {
    fr: 'Le carnet d’entretien de vos machines',
    de: 'Das Serviceheft Ihrer Maschinen',
    it: 'Il libretto di manutenzione delle sue macchine',
    en: 'The maintenance logbook for your machines',
  },
  copy: {
    fr: 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :',
    de: 'Falls die Schaltfläche nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:',
    it: 'Se il pulsante non funziona, copi questo link nel browser:',
    en: 'If the button doesn’t work, copy this link into your browser:',
  },
  footer: {
    fr: 'Vous recevez cet e-mail parce qu’une action a été demandée sur Godet avec cette adresse.<br>Godet · Swiss Digital Studio · Valais, Suisse · <a href="https://godet.app" style="color:inherit;text-decoration:underline;">godet.app</a>',
    de: 'Sie erhalten diese E-Mail, weil auf Godet mit dieser Adresse eine Aktion angefordert wurde.<br>Godet · Swiss Digital Studio · Wallis, Schweiz · <a href="https://godet.app/de" style="color:inherit;text-decoration:underline;">godet.app</a>',
    it: 'Riceve questa e-mail perché su Godet è stata richiesta un’azione con questo indirizzo.<br>Godet · Swiss Digital Studio · Vallese, Svizzera · <a href="https://godet.app/it" style="color:inherit;text-decoration:underline;">godet.app</a>',
    en: 'You are receiving this email because an action was requested on Godet with this address.<br>Godet · Swiss Digital Studio · Valais, Switzerland · <a href="https://godet.app/en" style="color:inherit;text-decoration:underline;">godet.app</a>',
  },
};

/**
 * Modèles. Pour chacun : nom du modèle dans Supabase, objet, aperçu, titre, paragraphes, bouton (ou code),
 * note de sécurité. Les textes sont déjà sûrs (pas de saisie de l'utilisateur, sauf les variables Supabase).
 */
const TEMPLATES = [
  {
    file: 'confirmation',
    supabase: 'Confirm signup',
    url: confirmUrl('email'),
    subject: { fr: 'Confirmez votre adresse e-mail', de: 'Bestätigen Sie Ihre E-Mail-Adresse', it: 'Confermi il suo indirizzo e-mail', en: 'Confirm your email address' },
    preheader: {
      fr: 'Un clic pour activer votre compte Godet.',
      de: 'Ein Klick, um Ihr Godet-Konto zu aktivieren.',
      it: 'Un clic per attivare il suo account Godet.',
      en: 'One click to activate your Godet account.',
    },
    heading: { fr: 'Bienvenue sur Godet', de: 'Willkommen bei Godet', it: 'Benvenuto su Godet', en: 'Welcome to Godet' },
    body: {
      fr: ['Merci pour votre inscription. Confirmez votre adresse e-mail pour activer votre compte : vous pourrez ensuite créer votre entreprise et ouvrir votre garage.'],
      de: ['Danke für Ihre Anmeldung. Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren: Danach können Sie Ihr Unternehmen anlegen und Ihre Garage öffnen.'],
      it: ['Grazie per la registrazione. Confermi il suo indirizzo e-mail per attivare l’account: potrà poi creare la sua azienda e aprire il suo garage.'],
      en: ['Thank you for signing up. Confirm your email address to activate your account; you can then create your company and open your garage.'],
    },
    action: { fr: 'Confirmer mon adresse', de: 'Adresse bestätigen', it: 'Conferma l’indirizzo', en: 'Confirm my address' },
    note: {
      fr: 'Ce lien n’est valable que pour une durée limitée. Si vous n’avez pas créé de compte Godet, ignorez simplement cet e-mail.',
      de: 'Dieser Link ist nur begrenzte Zeit gültig. Falls Sie kein Godet-Konto erstellt haben, ignorieren Sie diese E-Mail einfach.',
      it: 'Questo link è valido solo per un tempo limitato. Se non ha creato un account Godet, ignori semplicemente questa e-mail.',
      en: 'This link is only valid for a limited time. If you didn’t create a Godet account, simply ignore this email.',
    },
  },
  {
    file: 'invite',
    supabase: 'Invite user',
    url: confirmUrl('invite'),
    subject: { fr: 'Vous êtes invité sur Godet', de: 'Sie sind zu Godet eingeladen', it: 'È stato invitato su Godet', en: 'You’ve been invited to Godet' },
    preheader: {
      fr: 'Acceptez l’invitation pour accéder au parc de machines.',
      de: 'Nehmen Sie die Einladung an, um auf den Maschinenpark zuzugreifen.',
      it: 'Accetti l’invito per accedere al parco macchine.',
      en: 'Accept the invitation to access the machine fleet.',
    },
    heading: { fr: 'Une invitation vous attend', de: 'Eine Einladung wartet auf Sie', it: 'Un invito la attende', en: 'An invitation is waiting for you' },
    body: {
      fr: ['Vous avez été invité à rejoindre Godet, le carnet d’entretien numérique des machines de chantier. Acceptez l’invitation pour créer votre accès.'],
      de: ['Sie wurden zu Godet eingeladen, dem digitalen Serviceheft für Baumaschinen. Nehmen Sie die Einladung an, um Ihren Zugang einzurichten.'],
      it: ['È stato invitato a Godet, il libretto di manutenzione digitale delle macchine da cantiere. Accetti l’invito per creare il suo accesso.'],
      en: ['You have been invited to Godet, the digital maintenance logbook for construction machinery. Accept the invitation to set up your access.'],
    },
    action: { fr: 'Accepter l’invitation', de: 'Einladung annehmen', it: 'Accetta l’invito', en: 'Accept the invitation' },
    note: {
      fr: 'Si vous ne vous attendiez pas à cette invitation, ignorez cet e-mail : aucun compte ne sera créé.',
      de: 'Falls Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail: Es wird kein Konto erstellt.',
      it: 'Se non si aspettava questo invito, ignori questa e-mail: non verrà creato alcun account.',
      en: 'If you weren’t expecting this invitation, ignore this email: no account will be created.',
    },
  },
  {
    file: 'magic_link',
    supabase: 'Magic Link',
    url: confirmUrl('magiclink'),
    subject: { fr: 'Votre lien de connexion à Godet', de: 'Ihr Anmeldelink für Godet', it: 'Il suo link di accesso a Godet', en: 'Your Godet sign-in link' },
    preheader: {
      fr: 'Connectez-vous en un clic, sans mot de passe.',
      de: 'Melden Sie sich mit einem Klick an, ohne Passwort.',
      it: 'Acceda con un clic, senza password.',
      en: 'Sign in with one click, no password needed.',
    },
    heading: { fr: 'Connexion à Godet', de: 'Anmeldung bei Godet', it: 'Accesso a Godet', en: 'Sign in to Godet' },
    body: {
      fr: ['Voici votre lien de connexion. Il ouvre directement votre garage.'],
      de: ['Hier ist Ihr Anmeldelink. Er öffnet direkt Ihre Garage.'],
      it: ['Ecco il suo link di accesso. Apre direttamente il suo garage.'],
      en: ['Here is your sign-in link. It opens your garage straight away.'],
    },
    action: { fr: 'Me connecter', de: 'Anmelden', it: 'Accedi', en: 'Sign in' },
    note: {
      fr: 'Ce lien ne fonctionne qu’une fois et pendant une durée limitée. Si vous n’avez rien demandé, ignorez cet e-mail.',
      de: 'Dieser Link funktioniert nur einmal und nur begrenzte Zeit. Falls Sie nichts angefordert haben, ignorieren Sie diese E-Mail.',
      it: 'Questo link funziona una sola volta e per un tempo limitato. Se non ha richiesto nulla, ignori questa e-mail.',
      en: 'This link works only once and for a limited time. If you didn’t request it, ignore this email.',
    },
  },
  {
    file: 'email_change',
    supabase: 'Change Email Address',
    url: confirmUrl('email_change'),
    subject: { fr: 'Confirmez votre nouvelle adresse e-mail', de: 'Bestätigen Sie Ihre neue E-Mail-Adresse', it: 'Confermi il suo nuovo indirizzo e-mail', en: 'Confirm your new email address' },
    preheader: {
      fr: 'Validez le changement d’adresse de votre compte Godet.',
      de: 'Bestätigen Sie die Adressänderung Ihres Godet-Kontos.',
      it: 'Confermi il cambio di indirizzo del suo account Godet.',
      en: 'Confirm the address change on your Godet account.',
    },
    heading: { fr: 'Changement d’adresse e-mail', de: 'Änderung der E-Mail-Adresse', it: 'Cambio dell’indirizzo e-mail', en: 'Email address change' },
    body: {
      fr: ['Vous avez demandé à remplacer l’adresse <strong>{{ .Email }}</strong> par <strong>{{ .NewEmail }}</strong> pour votre compte Godet. Confirmez ce changement :'],
      de: ['Sie haben beantragt, die Adresse <strong>{{ .Email }}</strong> Ihres Godet-Kontos durch <strong>{{ .NewEmail }}</strong> zu ersetzen. Bestätigen Sie die Änderung:'],
      it: ['Ha chiesto di sostituire l’indirizzo <strong>{{ .Email }}</strong> con <strong>{{ .NewEmail }}</strong> per il suo account Godet. Confermi la modifica:'],
      en: ['You asked to replace <strong>{{ .Email }}</strong> with <strong>{{ .NewEmail }}</strong> on your Godet account. Confirm the change:'],
    },
    action: { fr: 'Confirmer le changement', de: 'Änderung bestätigen', it: 'Conferma la modifica', en: 'Confirm the change' },
    note: {
      fr: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail et changez votre mot de passe.',
      de: 'Falls diese Anfrage nicht von Ihnen stammt, ignorieren Sie diese E-Mail und ändern Sie Ihr Passwort.',
      it: 'Se non è stato lei a fare questa richiesta, ignori questa e-mail e cambi la password.',
      en: 'If you didn’t make this request, ignore this email and change your password.',
    },
  },
  {
    file: 'recovery',
    supabase: 'Reset Password',
    url: confirmUrl('recovery'),
    subject: { fr: 'Réinitialisez votre mot de passe Godet', de: 'Setzen Sie Ihr Godet-Passwort zurück', it: 'Reimposti la password di Godet', en: 'Reset your Godet password' },
    preheader: {
      fr: 'Choisissez un nouveau mot de passe en un clic.',
      de: 'Wählen Sie mit einem Klick ein neues Passwort.',
      it: 'Scelga una nuova password con un clic.',
      en: 'Choose a new password in one click.',
    },
    heading: { fr: 'Nouveau mot de passe', de: 'Neues Passwort', it: 'Nuova password', en: 'New password' },
    body: {
      fr: ['Vous avez demandé à réinitialiser le mot de passe de votre compte Godet. Cliquez sur le bouton pour en choisir un nouveau.'],
      de: ['Sie haben beantragt, das Passwort Ihres Godet-Kontos zurückzusetzen. Klicken Sie auf die Schaltfläche, um ein neues zu wählen.'],
      it: ['Ha chiesto di reimpostare la password del suo account Godet. Clicchi sul pulsante per sceglierne una nuova.'],
      en: ['You asked to reset the password of your Godet account. Click the button to choose a new one.'],
    },
    action: { fr: 'Choisir un nouveau mot de passe', de: 'Neues Passwort wählen', it: 'Scegli una nuova password', en: 'Choose a new password' },
    note: {
      fr: 'Ce lien ne fonctionne qu’une fois et pendant une durée limitée. Si vous n’avez rien demandé, ignorez cet e-mail : votre mot de passe actuel reste valable.',
      de: 'Dieser Link funktioniert nur einmal und nur begrenzte Zeit. Falls Sie nichts angefordert haben, ignorieren Sie diese E-Mail: Ihr aktuelles Passwort bleibt gültig.',
      it: 'Questo link funziona una sola volta e per un tempo limitato. Se non ha richiesto nulla, ignori questa e-mail: la password attuale resta valida.',
      en: 'This link works only once and for a limited time. If you didn’t request it, ignore this email: your current password stays valid.',
    },
  },
  {
    file: 'reauthentication',
    supabase: 'Reauthentication',
    code: '{{ .Token }}',
    subject: { fr: 'Votre code de confirmation Godet', de: 'Ihr Bestätigungscode für Godet', it: 'Il suo codice di conferma Godet', en: 'Your Godet confirmation code' },
    preheader: {
      fr: 'Code à saisir pour confirmer votre action.',
      de: 'Code zur Bestätigung Ihrer Aktion.',
      it: 'Codice da inserire per confermare l’azione.',
      en: 'Code to enter to confirm your action.',
    },
    heading: { fr: 'Code de confirmation', de: 'Bestätigungscode', it: 'Codice di conferma', en: 'Confirmation code' },
    body: {
      fr: ['Saisissez ce code dans Godet pour confirmer votre action :'],
      de: ['Geben Sie diesen Code in Godet ein, um Ihre Aktion zu bestätigen:'],
      it: ['Inserisca questo codice in Godet per confermare l’azione:'],
      en: ['Enter this code in Godet to confirm your action:'],
    },
    note: {
      fr: 'Ne communiquez ce code à personne. Si vous n’avez rien demandé, changez votre mot de passe.',
      de: 'Geben Sie diesen Code an niemanden weiter. Falls Sie nichts angefordert haben, ändern Sie Ihr Passwort.',
      it: 'Non comunichi questo codice a nessuno. Se non ha richiesto nulla, cambi la password.',
      en: 'Don’t share this code with anyone. If you didn’t request it, change your password.',
    },
  },
  {
    file: 'password_changed_notification',
    supabase: 'Password changed (notification de sécurité)',
    subject: { fr: 'Votre mot de passe Godet a été modifié', de: 'Ihr Godet-Passwort wurde geändert', it: 'La password di Godet è stata modificata', en: 'Your Godet password was changed' },
    preheader: {
      fr: 'Si ce n’était pas vous, réagissez tout de suite.',
      de: 'Falls Sie das nicht waren, handeln Sie sofort.',
      it: 'Se non è stato lei, intervenga subito.',
      en: 'If this wasn’t you, act right away.',
    },
    heading: { fr: 'Mot de passe modifié', de: 'Passwort geändert', it: 'Password modificata', en: 'Password changed' },
    body: {
      fr: ['Le mot de passe du compte Godet <strong>{{ .Email }}</strong> vient d’être modifié.'],
      de: ['Das Passwort des Godet-Kontos <strong>{{ .Email }}</strong> wurde soeben geändert.'],
      it: ['La password dell’account Godet <strong>{{ .Email }}</strong> è appena stata modificata.'],
      en: ['The password of the Godet account <strong>{{ .Email }}</strong> has just been changed.'],
    },
    note: {
      fr: 'Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la page de connexion et écrivez-nous via godet.app/contact.',
      de: 'Falls Sie diese Änderung nicht vorgenommen haben, setzen Sie Ihr Passwort auf der Anmeldeseite zurück und schreiben Sie uns über godet.app/de/contact.',
      it: 'Se non è stato lei a fare questa modifica, reimposti la password dalla pagina di accesso e ci scriva tramite godet.app/it/contact.',
      en: 'If you didn’t make this change, reset your password from the sign-in page and contact us at godet.app/en/contact.',
    },
  },
  {
    file: 'email_changed_notification',
    supabase: 'Email address changed (notification de sécurité)',
    subject: { fr: 'L’adresse e-mail de votre compte Godet a changé', de: 'Die E-Mail-Adresse Ihres Godet-Kontos wurde geändert', it: 'L’indirizzo e-mail del suo account Godet è cambiato', en: 'The email address of your Godet account changed' },
    preheader: {
      fr: 'Si ce n’était pas vous, réagissez tout de suite.',
      de: 'Falls Sie das nicht waren, handeln Sie sofort.',
      it: 'Se non è stato lei, intervenga subito.',
      en: 'If this wasn’t you, act right away.',
    },
    heading: { fr: 'Adresse e-mail modifiée', de: 'E-Mail-Adresse geändert', it: 'Indirizzo e-mail modificato', en: 'Email address changed' },
    body: {
      fr: ['L’adresse de votre compte Godet est passée de <strong>{{ .OldEmail }}</strong> à <strong>{{ .Email }}</strong>.'],
      de: ['Die Adresse Ihres Godet-Kontos wurde von <strong>{{ .OldEmail }}</strong> auf <strong>{{ .Email }}</strong> geändert.'],
      it: ['L’indirizzo del suo account Godet è passato da <strong>{{ .OldEmail }}</strong> a <strong>{{ .Email }}</strong>.'],
      en: ['Your Godet account address changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>.'],
    },
    note: {
      fr: 'Si vous n’êtes pas à l’origine de ce changement, écrivez-nous tout de suite via godet.app/contact.',
      de: 'Falls Sie diese Änderung nicht vorgenommen haben, schreiben Sie uns sofort über godet.app/de/contact.',
      it: 'Se non è stato lei a fare questa modifica, ci scriva subito tramite godet.app/it/contact.',
      en: 'If you didn’t make this change, contact us right away at godet.app/en/contact.',
    },
  },
];

const esc = (lang, text) => escapeHtml(text);

function contentFor(t, lang) {
  const parts = [emailHeading(t.heading[lang])];
  // Les paragraphes peuvent contenir des variables Supabase entourées de <strong> : pas d'échappement ici.
  for (const p of t.body[lang]) parts.push(emailParagraph(p));
  if (t.code) parts.push(code(t.code));
  if (t.url) {
    parts.push(button(t.url, t.action[lang]));
    parts.push(emailNote(esc(lang, COMMON.copy[lang])));
    parts.push(linkText(t.url));
  }
  parts.push(emailNote(esc(lang, t.note[lang])));
  return parts.join('\n');
}

function render(t) {
  const marker = (k) => `@@${k}@@`;
  let html = renderEmailFrame({
    lang: marker('LANG'),
    title: marker('TITLE'),
    preheader: marker('PRE'),
    tagline: marker('TAG'),
    content: marker('CONTENT'),
    footer: marker('FOOT'),
  });
  const map = {
    LANG: pick(HTML_LANG),
    TITLE: pick(Object.fromEntries(LANGS.map((l) => [l, escapeHtml(t.subject[l])]))),
    PRE: pick(Object.fromEntries(LANGS.map((l) => [l, escapeHtml(t.preheader[l])]))),
    TAG: pick(Object.fromEntries(LANGS.map((l) => [l, escapeHtml(COMMON.tagline[l])]))),
    CONTENT: pick(Object.fromEntries(LANGS.map((l) => [l, `\n${contentFor(t, l)}\n`]))),
    FOOT: pick(COMMON.footer),
  };
  for (const [k, v] of Object.entries(map)) html = html.split(marker(k)).join(v);
  return `${LANG_VAR}${html}\n`;
}

mkdirSync(OUT, { recursive: true });
const rows = [];
for (const t of TEMPLATES) {
  writeFileSync(join(OUT, `${t.file}.html`), render(t));
  const subject = `${LANG_VAR}${pick(t.subject)}`;
  rows.push(`### ${t.supabase} — \`${t.file}.html\`\n\nObjet (Subject) :\n\n\`\`\`\n${subject}\n\`\`\`\n`);
}
writeFileSync(
  join(OUT, 'README.md'),
  `# Modèles des e-mails d'authentification (Supabase)

Générés par \`node --experimental-strip-types scripts/emails/supabase-templates.mjs\` — ne pas modifier à la main.
À coller dans Supabase › Authentication › Emails › Templates (un modèle par onglet) : l'objet ci-dessous dans
« Subject », le contenu du fichier HTML dans « Message body ».

La langue suit \`locale\` dans les métadonnées du compte (enregistrée à l'inscription) ; sinon français.
Les liens passent par \`/auth/confirm\` (token_hash) : ils fonctionnent dans n'importe quel navigateur.

${rows.join('\n')}`,
);
console.log(`${TEMPLATES.length} modèles écrits dans supabase/templates/`);
