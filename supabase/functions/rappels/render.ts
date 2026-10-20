// Contenu du rappel : objet, HTML et texte, dans la langue de la personne et aux formats de chaque entreprise.

import type { DigestSection, Frequency, MachineRow, RepairRow } from './digest.ts';
import { totalsOf } from './digest.ts';
import { isOverdue, type Due } from './dues.ts';
import { htmlLang, makeFormat, type Format, type Locale } from './format.ts';
import { translator, type Translate } from './i18n.ts';
import { MESSAGES, type MessageTree } from './messages.ts';
import {
  emailButton,
  emailChip,
  emailHeading,
  emailLink,
  emailList,
  emailNote,
  emailParagraph,
  emailSectionTitle,
  emailStrong,
  emailSubheading,
  escapeHtml,
  oneLine,
  renderEmailFrame,
  type EmailListItem,
} from './layout.ts';

/** Au-delà, l'e-mail renvoie au garage (« Et 12 autres points… »). */
export const MAX_DUES_PER_ORG = 30;
export const MAX_REPAIRS_PER_ORG = 20;

export interface DigestInput {
  locale: Locale;
  /** Nom de la personne (profil), ou null. */
  name: string | null;
  frequency: Frequency;
  leadDays: number;
  leadHours: number;
  sections: DigestSection[];
  links: { garage: string; settings: string };
  /** Une adresse de réponse est configurée (EMAIL_REPLY_TO) : pas de mention « ne pas répondre ». */
  replyAllowed?: boolean;
}

export interface RenderedDigest {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

/** Types de machines connus : ceux du catalogue (textes recopiés de messages/<langue>/domain.json par sync.mjs). */
const KINDS = new Set(Object.keys((MESSAGES.fr.domain as MessageTree).machineKinds as MessageTree));

const formats = new Map<string, Format>();

/** Formats d'une langue et d'une entreprise, créés une seule fois par exécution (les objets Intl coûtent cher). */
function formatFor(locale: Locale, country: string | null | undefined, currency: string | null | undefined): Format {
  const key = `${locale}|${country ?? ''}|${currency ?? ''}`;
  let f = formats.get(key);
  if (!f) {
    f = makeFormat({ locale, country, currency });
    formats.set(key, f);
  }
  return f;
}

function capitalize(value: string, locale: Locale): string {
  return value ? value.charAt(0).toLocaleUpperCase(locale) + value.slice(1) : value;
}

/** « Pelle 21 t », « Bagger 21 t » (comme `machineTitle` de l'application). */
function machineTitle(t: Translate, f: Format, m: MachineRow | undefined): string {
  const kind = m && KINDS.has(m.kind) ? m.kind : 'autre';
  const short = t(`domain.machineKinds.${kind}.short`);
  if (!m?.weight_t) return short;
  const w = Number(m.weight_t);
  if (!Number.isFinite(w) || w <= 0) return short;
  return t('domain.machineTitle', { kind: short, weight: f.num(w, Number.isInteger(w) ? 0 : 1) });
}

/** Détail d'une échéance : « Dépassé de 40 h · À faire dès que possible · compteur : 6’842 h ». */
function dueDetail(t: Translate, f: Format, d: Due, machine: MachineRow | undefined, locale: Locale): string[] {
  if (d.unit === 'h') {
    if (isOverdue(d)) {
      const parts = [capitalize(t('domain.due.overdueHours', { hours: f.hours(-d.left) }), locale), t('domain.due.hintAsap')];
      if (machine) parts.push(t('emails.rappels.item.counter', { hours: f.hours(Number(machine.hours)) }));
      return parts;
    }
    return [
      capitalize(t('domain.due.inHours', { hours: f.hours(d.left) }), locale),
      t('domain.due.hintEstimate', {
        date: f.date(d.dueDate),
        rateKind: d.rateKnown ? 'actual' : 'average',
        rate: f.num(d.rate, Number.isInteger(d.rate) ? 0 : 1),
      }),
    ];
  }
  if (isOverdue(d)) {
    return [
      capitalize(t('domain.due.lateDays', { days: -d.left }), locale),
      t('emails.rappels.item.plannedOn', { date: f.date(d.dueDate) }),
    ];
  }
  return [
    capitalize(t('domain.due.onDate', { date: f.date(d.dueDate) }), locale),
    d.left === 0 ? t('domain.due.hintToday') : t('domain.due.hintInDays', { days: d.left }),
  ];
}

const LOCALE_LIST: readonly Locale[] = ['fr', 'de', 'it', 'en'];

/**
 * Échéance créée avec chaque machine (« Service », « Contrôle annuel de sécurité »…, dans la langue de la personne
 * qui l'a ajoutée) : libellé dans la langue du destinataire, comme au garage. Libellé choisi par l'entreprise : tel quel.
 */
export function scheduleLabel(label: string, locale: Locale): string {
  const l = label.trim();
  for (const key of ['service', 'safety'] as const) {
    const all = LOCALE_LIST.map((x) => translator(x)(`garage.schedules.defaults.${key}`));
    if (all.includes(l)) return translator(locale)(`garage.schedules.defaults.${key}`);
  }
  return label;
}

interface Line {
  chip: { label: string; tone: 'bad' | 'warn' | 'neutral' };
  code: string;
  title: string;
  detail: string;
}

function dueLines(t: Translate, f: Format, s: DigestSection, locale: Locale): Line[] {
  return s.dues.slice(0, MAX_DUES_PER_ORG).map((d) => {
    const m = s.machines.get(d.machineId);
    const overdue = isOverdue(d);
    return {
      chip: { label: t(overdue ? 'emails.rappels.state.overdue' : 'emails.rappels.state.soon'), tone: overdue ? 'bad' : 'warn' },
      code: m?.code ?? '—',
      title: scheduleLabel(d.label, locale),
      detail: [machineTitle(t, f, m), ...dueDetail(t, f, d, m, locale)].join(' · '),
    };
  });
}

function repairLines(t: Translate, f: Format, s: DigestSection): Line[] {
  return s.repairs.slice(0, MAX_REPAIRS_PER_ORG).map((r: RepairRow) => {
    const m = s.machines.get(r.machine_id);
    const cost = Number(r.cost_parts || 0) + Number(r.cost_labour || 0);
    const detail = [machineTitle(t, f, m), t('emails.rappels.item.reported', { date: f.date(r.date) })];
    if (cost > 0) detail.push(t('emails.rappels.item.cost', { amount: f.money(cost) }));
    const status = r.repair_status === 'attente_piece' ? 'attente_piece' : 'en_cours';
    return {
      chip: { label: t(`domain.repairStatus.${status}`), tone: status === 'attente_piece' ? 'warn' : 'neutral' },
      code: m?.code ?? '—',
      title: r.title,
      detail: detail.join(' · '),
    };
  });
}

function hiddenCount(s: DigestSection): number {
  return Math.max(0, s.dues.length - MAX_DUES_PER_ORG) + Math.max(0, s.repairs.length - MAX_REPAIRS_PER_ORG);
}

function htmlItems(lines: Line[]): EmailListItem[] {
  return lines.map((l) => ({
    chip: emailChip(l.chip.label, l.chip.tone),
    title: `${emailStrong(l.code)} — ${escapeHtml(l.title)}`,
    detail: escapeHtml(l.detail),
  }));
}

function textItems(lines: Line[]): string[] {
  return lines.map((l) => `- [${l.chip.label}] ${l.code} — ${l.title}\n  ${l.detail}`);
}

/** Résumé : « 3 échéances à prévoir (dont 1 dépassée) et 2 réparations ouvertes ». */
export function summaryOf(t: Translate, sections: DigestSection[]): string {
  const tot = totalsOf(sections);
  const dues = tot.dues
    ? tot.overdue
      ? t('emails.rappels.summary.duesOverdue', { count: tot.dues, overdue: tot.overdue })
      : t('emails.rappels.summary.dues', { count: tot.dues })
    : null;
  const repairs = tot.repairs ? t('emails.rappels.summary.repairs', { count: tot.repairs }) : null;
  if (dues && repairs) return t('emails.rappels.summary.both', { dues, repairs });
  return dues ?? repairs ?? '';
}

/** Objet, aperçu, HTML et texte du rappel. `sections` ne doit pas être vide. */
export function renderDigest(input: DigestInput): RenderedDigest {
  const { locale, sections } = input;
  const t = translator(locale);
  const sep = locale === 'fr' ? '\u00a0: ' : ': ';
  const summary = summaryOf(t, sections);
  const subject = oneLine(
    sections.length === 1
      ? t('emails.rappels.subject.one', { summary, org: oneLine(sections[0].org.name) })
      : t('emails.rappels.subject.many', { summary, orgs: sections.length }),
  );
  const title = t('emails.rappels.title', { frequency: input.frequency });
  const name = oneLine(input.name ?? '');
  const greeting = name ? t('emails.rappels.greeting', { name }) : t('emails.rappels.greetingAnonymous');
  const intro = t('emails.rappels.intro', { summary });
  const base = formatFor(locale, sections[0]?.org.country, sections[0]?.org.currency);

  const html: string[] = [emailHeading(title), emailParagraph(escapeHtml(greeting)), emailParagraph(escapeHtml(intro))];
  const text: string[] = [title, '', greeting, '', intro];

  for (const s of sections) {
    const f = formatFor(locale, s.org.country, s.org.currency);
    const orgName = oneLine(s.org.name);
    html.push(emailSubheading(orgName));
    text.push('', orgName, '='.repeat(Math.min(60, Math.max(3, orgName.length))));
    if (s.dues.length) {
      const lines = dueLines(t, f, s, locale);
      html.push(emailSectionTitle(t('emails.rappels.sections.dues')), emailList(htmlItems(lines)));
      text.push('', t('emails.rappels.sections.dues'), ...textItems(lines));
    }
    if (s.repairs.length) {
      const lines = repairLines(t, f, s);
      html.push(emailSectionTitle(t('emails.rappels.sections.repairs')), emailList(htmlItems(lines)));
      text.push('', t('emails.rappels.sections.repairs'), ...textItems(lines));
    }
    const hidden = hiddenCount(s);
    if (hidden) {
      const more = t('emails.rappels.more', { count: hidden });
      html.push(emailNote(escapeHtml(more)));
      text.push('', more);
    }
  }

  const cta = t('emails.rappels.cta');
  html.push(emailButton(input.links.garage, cta));
  text.push('', `${cta}${sep}${input.links.garage}`);

  const why = t('emails.rappels.why', { frequency: input.frequency });
  const thresholds = t('emails.rappels.thresholds', { days: input.leadDays, hours: base.hours(input.leadHours) });
  const settings = t('emails.rappels.settings');
  const signature = t('emails.layout.signature');
  const automatic = input.replyAllowed ? null : t('emails.layout.automatic');

  const footer = [
    escapeHtml(why),
    escapeHtml(thresholds),
    emailLink(input.links.settings, settings),
    escapeHtml(signature),
    ...(automatic ? [escapeHtml(automatic)] : []),
  ].join('<br>\n');
  text.push('', '—', why, thresholds, `${settings}${sep}${input.links.settings}`, signature, ...(automatic ? [automatic] : []));

  return {
    subject,
    preheader: intro,
    html: renderEmailFrame({
      lang: htmlLang(locale),
      title: subject,
      preheader: intro,
      tagline: t('emails.layout.tagline'),
      content: html.join('\n'),
      footer,
    }),
    text: text.join('\n'),
  };
}
