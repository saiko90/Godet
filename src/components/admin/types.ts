// Console d'administration de Godet (Swiss Digital Studio) : valeurs admises par la base et petites aides partagées
// entre les pages serveur, les actions et les composants client. Les listes reprennent les contraintes « check » de la
// migration 20261020090000_international_contact_notifications_prospection.sql.

export const PROSPECT_STATUSES = [
  'nouveau',
  'a_valider',
  'pret',
  'contacte',
  'relance',
  'demo',
  'essai',
  'client',
  'refus',
  'ne_pas_contacter',
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

/** Statuts qui terminent le cycle : plus de relance, plus de prochaine action automatique. */
export const CLOSED_STATUSES: readonly ProspectStatus[] = ['client', 'refus', 'ne_pas_contacter'];

export const SEGMENTS = [
  'genie_civil',
  'terrassement',
  'batiment',
  'route',
  'demolition',
  'paysagiste',
  'location',
  'commune',
  'gravier',
  'forestier',
  'agricole',
  'autre',
] as const;
export type Segment = (typeof SEGMENTS)[number];

export const CHANNELS = ['lettre', 'telephone', 'linkedin', 'email', 'partenaire', 'salon'] as const;
export type Channel = (typeof CHANNELS)[number];

export const FLEET_SIZES = ['1-5', '6-20', '21-50', '50+'] as const;
export type FleetSize = (typeof FLEET_SIZES)[number];

export const OUTREACH_STATUSES = ['brouillon', 'valide', 'envoye', 'reponse', 'annule'] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const CONTACT_STATUSES = ['nouveau', 'en_cours', 'traite', 'spam'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_KINDS = ['contact', 'demo', 'partenaire', 'support'] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const IDEA_STATUSES = ['nouvelle', 'a_l_etude', 'prevue', 'faite', 'refusee'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_CATEGORIES = ['3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre'] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const LOCALES = ['fr', 'de', 'it', 'en'] as const;
export type ProspectLocale = (typeof LOCALES)[number];

/** Marchés prospectés, dans l'ordre d'ouverture (les autres pays restent possibles). */
export const MARKETS = ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'] as const;

/**
 * Séquences de prospection par pays (docs/prospection/<marché>.md) : étape, canal, jour depuis le premier envoi.
 * Les agents préparent l'étape suivante quand la prochaine action est échue ; la console planifie cette date.
 */
export const SEQUENCES: Record<string, readonly { channel: Channel; day: number }[]> = {
  CH: [
    { channel: 'lettre', day: 0 },
    { channel: 'telephone', day: 10 },
    { channel: 'email', day: 20 },
    { channel: 'lettre', day: 35 },
  ],
  DE: [
    { channel: 'lettre', day: 0 },
    { channel: 'lettre', day: 14 },
    { channel: 'linkedin', day: 35 },
  ],
  AT: [
    { channel: 'lettre', day: 0 },
    { channel: 'lettre', day: 14 },
    { channel: 'linkedin', day: 35 },
  ],
  FR: [
    { channel: 'email', day: 0 },
    { channel: 'telephone', day: 7 },
    { channel: 'email', day: 14 },
    { channel: 'lettre', day: 30 },
  ],
  IT: [
    { channel: 'lettre', day: 0 },
    { channel: 'lettre', day: 15 },
    { channel: 'linkedin', day: 35 },
  ],
};

/** Délai par défaut selon le canal, hors séquence (message ajouté à la main, pays sans séquence). */
export const FOLLOW_UP_DAYS: Record<Channel, number> = {
  lettre: 10,
  telephone: 7,
  linkedin: 7,
  email: 7,
  partenaire: 14,
  salon: 5,
};

/** Après la dernière étape : temps laissé pour une réponse avant de classer le prospect. */
export const LAST_STEP_WAIT_DAYS = 14;

/** Jours jusqu'à la prochaine action après l'envoi de l'étape `step` (1 = premier message). */
export function nextActionDays(country: string, step: number, channel: string): number {
  const seq = SEQUENCES[country.toUpperCase()];
  if (seq && step >= 1 && step <= seq.length) {
    const next = seq[step];
    return next ? next.day - seq[step - 1].day : LAST_STEP_WAIT_DAYS;
  }
  return isOneOf(CHANNELS, channel) ? FOLLOW_UP_DAYS[channel] : 7;
}

/**
 * Canaux à surveiller selon le pays (résumé de docs/prospection/README.md, pas un avis juridique) :
 * « no » = interdit sans consentement préalable du destinataire ; « care » = permis sous conditions.
 * La console affiche la règle à côté du message avant tout envoi.
 */
export const CHANNEL_RULES = {
  CH: { email: 'care', telephone: 'care', linkedin: 'care' },
  DE: { email: 'no', telephone: 'care', linkedin: 'care' },
  AT: { email: 'no', telephone: 'no', linkedin: 'care' },
  IT: { email: 'no', telephone: 'care', linkedin: 'care', lettre: 'care' },
  FR: { email: 'care', telephone: 'care' },
} as const satisfies Record<string, Partial<Record<Channel, 'no' | 'care'>>>;

type Rules = typeof CHANNEL_RULES;
/** Clés des textes de règles (admin.rules.<pays>.<canal>) : exactement celles définies ci-dessus. */
export type RuleKey = { [C in keyof Rules]: `rules.${C}.${keyof Rules[C] & string}` }[keyof Rules];

export function channelRule(country: string, channel: string): { level: 'no' | 'care'; key: RuleKey } | null {
  const c = country.toUpperCase();
  if (!(c in CHANNEL_RULES) || !isOneOf(CHANNELS, channel)) return null;
  const level = (CHANNEL_RULES[c as keyof Rules] as Partial<Record<Channel, 'no' | 'care'>>)[channel];
  return level ? { level, key: `rules.${c}.${channel}` as RuleKey } : null;
}

/** Pays dont le nom est traduit dans common.countries. */
export const COUNTRY_KEYS = ['CH', 'DE', 'AT', 'IT', 'FR', 'LI', 'BE', 'LU', 'GB', 'OTHER'] as const;

/** Limites de longueur imposées par la base (contraintes « check »). */
export const LIMITS = {
  contactNote: 2000,
  ideaNote: 1000,
  prospectNotes: 4000,
  signals: 2000,
  subject: 200,
  body: 8000,
  company: 160,
  legalId: 40,
  website: 300,
  email: 200,
  phone: 40,
  address: 300,
  postalCode: 12,
  city: 80,
  region: 60,
  source: 500,
} as const;

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Identifiant UUID (lignes de la base). */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Code de suivi des liens de démo (même règle que la base : minuscules, chiffres, tirets, 4 à 40 caractères). */
export function isRefCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{4,40}$/.test(value);
}

/** Date ISO « AAAA-MM-JJ » valable. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Passage à compléter laissé par un agent : [[…]]. Un brouillon qui en contient ne peut pas être validé
 * (on n'envoie jamais un message avec un trou).
 */
export function hasPlaceholder(text: string | null | undefined): boolean {
  return typeof text === 'string' && /\[\[[^\]]*\]\]/.test(text);
}

/** Coordonnées d'un prospect telles que saisies dans le formulaire de la fiche (chaînes, vides permis). */
export interface ProspectDetailsInput {
  company: string;
  country: string;
  region: string;
  locale: string;
  legalId: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  segment: string;
  fleet: string;
  channel: string;
  signals: string;
  source: string;
}

/** Résultat d'une action de la console : un code, traduit par l'interface (admin.results.<code>). */
export type AdminResultCode =
  | 'saved'
  | 'statusSaved'
  | 'validated'
  | 'reopened'
  | 'sent'
  | 'mailSent'
  | 'reply'
  | 'cancelled'
  | 'created'
  | 'refCreated'
  | 'erased'
  | 'deleted'
  | 'invalid'
  | 'placeholder'
  | 'notFound'
  | 'conflict'
  | 'locked'
  | 'forbidden'
  | 'failed'
  | 'offline'
  | 'noEmail'
  | 'noReplyTo'
  | 'emailOff'
  | 'emailBanned'
  | 'emailFailed';

export type AdminResult = { ok: boolean; code: AdminResultCode; field?: string };

// ---------------------------------------------------------------- tons des pastilles

export type Tone = 'ok' | 'warn' | 'bad' | 'muted' | 'accent';

export const PROSPECT_TONE: Record<ProspectStatus, Tone> = {
  nouveau: 'muted',
  a_valider: 'warn',
  pret: 'accent',
  contacte: 'muted',
  relance: 'muted',
  demo: 'ok',
  essai: 'ok',
  client: 'ok',
  refus: 'bad',
  ne_pas_contacter: 'bad',
};

export const OUTREACH_TONE: Record<OutreachStatus, Tone> = {
  brouillon: 'warn',
  valide: 'accent',
  envoye: 'muted',
  reponse: 'ok',
  annule: 'muted',
};

export const CONTACT_TONE: Record<ContactStatus, Tone> = {
  nouveau: 'warn',
  en_cours: 'accent',
  traite: 'ok',
  spam: 'muted',
};

export const IDEA_TONE: Record<IdeaStatus, Tone> = {
  nouvelle: 'warn',
  a_l_etude: 'accent',
  prevue: 'accent',
  faite: 'ok',
  refusee: 'muted',
};

/** Classe CSS d'une pastille (`.pill` de globals.css + variante). */
export function pillClass(tone: Tone): string {
  if (tone === 'ok') return 'pill';
  if (tone === 'accent') return 'pill adm-pill-accent';
  return `pill ${tone}`;
}
