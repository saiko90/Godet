// Fonction « location » : rapport PDF d'un état des lieux de location (départ ou retour), rangé dans les documents
// de la machine et envoyé au client par e-mail (copie au loueur si une adresse est réglée, conditions de location
// acceptées jointes). Appelée avec la session de la personne juste après la signature, ou depuis le rapport.
//
// POST { checkId, locale, resend? } → { ok, pdf, emailed, email? }
// Erreurs : { error } parmi unauthorized, forbidden, bad_request, not_found, not_configured, disabled, pdf_error.
//
// Textes : ./i18n/<langue>.json, copiés de messages/<langue>/rental.json par `node scripts/sync-location-i18n.mjs`.
// Secrets : RESEND_API_KEY et EMAIL_FROM (sans eux, le PDF est fait mais aucun e-mail ne part), EMAIL_REPLY_TO.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'npm:pdf-lib@1.17.1';
import de from './i18n/de.json' with { type: 'json' };
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };
import it from './i18n/it.json' with { type: 'json' };

const TEXTS = { fr, de, it, en } as const;
type Locale = keyof typeof TEXTS;
const DEFAULT_SITE_URL = 'https://godet.app';

function env(name: string): string | null {
  const value = Deno.env.get(name)?.trim();
  return value ? value : null;
}

function serviceKey(): string | null {
  const keys = env('SUPABASE_SECRET_KEYS');
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, unknown>;
      const key = parsed.default ?? Object.values(parsed)[0];
      if (typeof key === 'string' && key) return key;
    } catch {
      // Format inattendu : clé historique.
    }
  }
  return env('SUPABASE_SERVICE_ROLE_KEY');
}

const SITE = (env('SITE_URL') ?? DEFAULT_SITE_URL).replace(/\/$/, '');
const ALLOWED_ORIGINS = new Set([SITE, SITE.replace('://', '://www.'), 'https://www.godet.app', 'https://godet.app', 'https://godet-kappa.vercel.app', 'http://localhost:3000']);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : SITE,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    Vary: 'Origin',
  };
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(req) } });
}

// ------------------------------------------------------------------ textes et formats

type Dict = Record<string, unknown>;

function translator(locale: Locale) {
  const root = TEXTS[locale] as unknown as Dict;
  return (path: string, vars: Record<string, string | number> = {}): string => {
    let cur: unknown = root;
    for (const part of path.split('.')) cur = cur && typeof cur === 'object' ? (cur as Dict)[part] : undefined;
    if (typeof cur !== 'string') return path;
    return cur.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  };
}

function formats(locale: Locale, country: string, currency: string) {
  const tag = `${locale}-${country || 'CH'}`;
  const dateTime = new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' });
  const date = new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeZone: 'Europe/Zurich' });
  const num = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  let money: Intl.NumberFormat;
  try {
    money = new Intl.NumberFormat(tag, { style: 'currency', currency: currency || 'CHF' });
  } catch {
    money = new Intl.NumberFormat(tag, { style: 'currency', currency: 'CHF' });
  }
  return {
    dateTime: (iso: string) => dateTime.format(new Date(iso)),
    date: (iso: string) => date.format(new Date(iso)),
    hours: (n: number) => `${num.format(n)} h`,
    money: (n: number) => money.format(n),
  };
}

// ------------------------------------------------------------------ PDF

const A4 = { w: 595.28, h: 841.89 };
const M = 42;
const INK = rgb(0.1, 0.1, 0.11);
const GREY = rgb(0.42, 0.43, 0.46);
const LINE = rgb(0.84, 0.84, 0.86);
const BAD = rgb(0.78, 0.16, 0.12);
const OK = rgb(0.1, 0.5, 0.27);
const PAINT = rgb(0.95, 0.72, 0.1);

class Writer {
  page!: PDFPage;
  y = 0;
  pages: PDFPage[] = [];
  private cache = new Map<string, boolean>();
  constructor(
    readonly doc: PDFDocument,
    readonly font: PDFFont,
    readonly bold: PDFFont,
  ) {
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.pages.push(this.page);
    this.y = A4.h - M;
  }
  ensure(h: number) {
    if (this.y - h < M + 26) this.newPage();
  }
  /** Caractères hors du jeu de la police standard remplacés (espaces fines, flèches…). */
  clean(text: string, font: PDFFont = this.font): string {
    const s = text.replace(/[   ]/g, ' ').replace(/→/g, '->').replace(/\r/g, '');
    let out = '';
    for (const ch of s) {
      const key = `${font === this.bold ? 'b' : 'r'}${ch}`;
      let ok = this.cache.get(key);
      if (ok === undefined) {
        try {
          font.encodeText(ch);
          ok = true;
        } catch {
          ok = false;
        }
        this.cache.set(key, ok);
      }
      out += ok || ch === '\n' ? ch : '?';
    }
    return out;
  }
  wrap(text: string, size: number, width: number, font: PDFFont = this.font): string[] {
    const lines: string[] = [];
    for (const para of this.clean(text, font).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/)) {
        if (!word) continue;
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= width) line = next;
        else {
          if (line) lines.push(line);
          // Mot trop long : coupé.
          let w = word;
          while (font.widthOfTextAtSize(w, size) > width && w.length > 1) {
            let cut = w.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
            lines.push(w.slice(0, cut));
            w = w.slice(cut);
          }
          line = w;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  text(text: string, opts: { x?: number; size?: number; width?: number; font?: PDFFont; color?: RGB; gap?: number } = {}) {
    const size = opts.size ?? 9.5;
    const font = opts.font ?? this.font;
    const x = opts.x ?? M;
    const lines = this.wrap(text, size, opts.width ?? A4.w - M - x, font);
    for (const l of lines) {
      this.ensure(size + 3);
      this.page.drawText(l, { x, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= size + 3;
    }
    this.y -= opts.gap ?? 0;
  }
  heading(text: string) {
    this.ensure(40);
    this.y -= 8;
    this.page.drawRectangle({ x: M, y: this.y - 14, width: 3, height: 14, color: PAINT });
    this.page.drawText(this.clean(text, this.bold), { x: M + 9, y: this.y - 11.5, size: 11.5, font: this.bold, color: INK });
    this.y -= 22;
  }
  rule() {
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4.w - M, y: this.y }, thickness: 0.6, color: LINE });
  }
  /** Lignes « libellé : valeur » sur deux colonnes de texte. */
  facts(rows: [string, string][]) {
    const lw = 130;
    for (const [label, value] of rows) {
      const lines = this.wrap(value, 9.5, A4.w - 2 * M - lw);
      const h = lines.length * 12.5 + 4;
      this.ensure(h);
      this.page.drawText(this.clean(label), { x: M, y: this.y - 9.5, size: 9, font: this.font, color: GREY });
      lines.forEach((l, i) => this.page.drawText(l, { x: M + lw, y: this.y - 9.5 - i * 12.5, size: 9.5, font: this.font, color: INK }));
      this.y -= h;
    }
  }
  /** Tableau simple : colonnes de largeurs données, couleurs par cellule. */
  table(widths: number[], head: string[] | null, rows: { cells: string[]; colors?: (RGB | undefined)[]; bold?: boolean }[]) {
    const size = 9;
    const draw = (cells: string[], font: PDFFont, colors: (RGB | undefined)[] = [], shade = false) => {
      const wrapped = cells.map((c, i) => this.wrap(c, size, widths[i] - 8, font));
      const h = Math.max(...wrapped.map((w) => w.length)) * 11.5 + 6;
      this.ensure(h);
      if (shade) this.page.drawRectangle({ x: M, y: this.y - h, width: A4.w - 2 * M, height: h, color: rgb(0.95, 0.95, 0.96) });
      let x = M;
      wrapped.forEach((lines, i) => {
        lines.forEach((l, j) => this.page.drawText(l, { x: x + 4, y: this.y - 3 - size - j * 11.5, size, font, color: colors[i] ?? INK }));
        x += widths[i];
      });
      this.y -= h;
      this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4.w - M, y: this.y }, thickness: 0.4, color: LINE });
    };
    if (head) draw(head, this.bold, head.map(() => GREY), true);
    for (const r of rows) draw(r.cells, r.bold ? this.bold : this.font, r.colors);
  }
}

async function download(db: SupabaseClient, path: string | null): Promise<Uint8Array | null> {
  if (!path) return null;
  const { data, error } = await db.storage.from('medias').download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

async function embed(doc: PDFDocument, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes || bytes.length < 8) return null;
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
  } catch {
    // Image illisible : ignorée.
  }
  return null;
}

interface CheckRow {
  id: string;
  org_id: string;
  rental_id: string;
  machine_id: string;
  kind: 'depart' | 'retour';
  items: Record<string, { state: string; comment?: string }> | null;
  fuel_level: string | null;
  hours: number | null;
  accessories: string | null;
  accident: boolean;
  accident_note: string | null;
  safety_valid: boolean | null;
  safety_until: string | null;
  keys_count: number | null;
  remarks: string | null;
  charges: { label: string; amount: number }[] | null;
  reserves: boolean | null;
  client_signer: string;
  client_signature: string | null;
  staff_signer: string | null;
  staff_signature: string | null;
  terms_accepted: boolean;
  terms_path: string | null;
  report_path: string | null;
  emailed_at: string | null;
  created_at: string;
  created_by: string | null;
}

// Mêmes rubriques que src/lib/rental.ts (checkGroups) : on suit les points réellement enregistrés.
const GROUPS: [string, string[]][] = [
  ['fonctionnement', ['demarre', 'voyants', 'signaux']],
  ['niveaux', ['niveaux', 'fuites']],
  ['entretien', ['graissee', 'lavee', 'graisse']],
  ['carrosserie', ['carrosserie', 'vitres', 'retroviseurs', 'eclairage', 'siege', 'cabine']],
  ['hydraulique', ['verins', 'flexibles', 'bras']],
  ['roulement', ['chenilles', 'roues']],
  ['equipement', ['attache', 'godet']],
  ['bord', ['documents']],
];

async function buildPdf(
  db: SupabaseClient,
  locale: Locale,
  ctx: {
    org: { name: string; country: string; currency: string };
    machine: { code: string; kind: string; brand: string | null; model: string | null; weight_t: number | null; serial: string | null; plate: string | null };
    rental: Dict & { client_company: string | null; client_name: string; client_phone: string | null; client_email: string | null; site: string | null; delivery: string; start_at: string; end_at: string };
    check: CheckRow;
    depart: CheckRow | null;
  },
): Promise<{ bytes: Uint8Array; title: string; machineLabel: string }> {
  const t = translator(locale);
  const f = formats(locale, ctx.org.country, ctx.org.currency);
  const { check: c, depart, machine: m, rental: r } = ctx;
  const retour = c.kind === 'retour';
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold);
  const title = t(retour ? 'check.titleIn' : 'check.titleOut');
  const kindLabel = t(`kinds.${m.kind}`);
  const machineLabel = `${m.code} · ${kindLabel}${m.brand || m.model ? ` ${[m.brand, m.model].filter(Boolean).join(' ')}` : ''}`;
  doc.setTitle(`${title} · ${machineLabel}`);
  doc.setAuthor(ctx.org.name);
  doc.setCreator('Godet');

  // En-tête
  w.text(ctx.org.name.toUpperCase(), { size: 8.5, font: bold, color: GREY, gap: 2 });
  w.text(title, { size: 19, font: bold, gap: 2 });
  w.text(machineLabel, { size: 11, color: GREY, gap: 8 });
  w.rule();
  w.y -= 8;
  const client = [r.client_company, r.client_name].filter(Boolean).join(' · ');
  const contact = [r.client_phone, r.client_email].filter(Boolean).join(' · ');
  w.facts([
    [t('pdf.client'), contact ? `${client}\n${contact}` : client],
    ...(r.site ? ([[t('pdf.site'), r.site]] as [string, string][]) : []),
    [t('pdf.period'), `${f.dateTime(r.start_at)} -> ${f.dateTime(r.end_at)}`],
    [t('pdf.delivery'), t(`form.deliveries.${r.delivery}`)],
    ...(m.serial ? ([[t('pdf.serial'), m.serial]] as [string, string][]) : []),
    ...(m.plate ? ([[t('pdf.plate'), m.plate]] as [string, string][]) : []),
    [retour ? t('pdf.return') : t('pdf.departure'), f.dateTime(c.created_at)],
  ]);

  // Points de contrôle
  const items = c.items ?? {};
  const before = retour && depart ? (depart.items ?? {}) : null;
  const stateColor = (s: string | undefined) => (s === 'defaut' ? BAD : s === 'ok' ? OK : GREY);
  for (const [g, keys] of GROUPS) {
    const present = keys.filter((k) => items[k]);
    if (!present.length) continue;
    w.heading(t(`check.groups.${g}`));
    const widths = before ? [200, 155, 156] : [230, 281];
    const head = before ? [t('report.item'), t('pdf.return'), t('pdf.departure')] : [t('report.item'), t('report.result')];
    w.table(
      widths,
      head,
      present.map((k) => {
        const v = items[k];
        const b = before?.[k];
        const now = `${t(`check.states.${v.state}`)}${v.comment ? ` : ${v.comment}` : ''}`;
        const worse = b && b.state !== 'defaut' && v.state === 'defaut';
        const cells = before
          ? [t(`items.${k}`), worse ? `${now} (${t('report.worse')})` : now, b ? `${t(`check.states.${b.state}`)}${b.comment ? ` : ${b.comment}` : ''}` : '—']
          : [t(`items.${k}`), now];
        return { cells, colors: [undefined, stateColor(v.state), b ? stateColor(b.state) : GREY] };
      }),
    );
  }

  // Relevés
  w.heading(t('check.groups.releves'));
  const rows: [string, string][] = [];
  const hoursDep = depart?.hours != null ? Number(depart.hours) : null;
  if (c.hours != null) rows.push([t('report.hours'), retour && hoursDep != null ? `${f.hours(Number(c.hours))} (${t('pdf.departure')} : ${f.hours(hoursDep)})` : f.hours(Number(c.hours))]);
  if (retour && hoursDep != null && c.hours != null) rows.push([t('report.worked'), f.hours(Number(c.hours) - hoursDep)]);
  if (c.fuel_level)
    rows.push([
      t('report.fuel'),
      retour && depart?.fuel_level ? `${t(`check.fuelLevels.${c.fuel_level}`)} (${t('pdf.departure')} : ${t(`check.fuelLevels.${depart.fuel_level}`)})` : t(`check.fuelLevels.${c.fuel_level}`),
    ]);
  rows.push([t('report.accident'), c.accident ? `${t('check.yes')}${c.accident_note ? ` : ${c.accident_note}` : ''}` : t('check.no')]);
  if (c.safety_valid != null) rows.push([t('report.safety'), `${c.safety_valid ? t('check.valid') : t('check.invalid')}${c.safety_until ? ` · ${f.date(c.safety_until)}` : ''}`]);
  if (c.accessories) rows.push([t('report.accessories'), c.accessories]);
  if (c.keys_count != null) rows.push([t('report.keys'), String(c.keys_count)]);
  if (c.remarks) rows.push([t('report.remarks'), c.remarks]);
  if (c.terms_accepted) rows.push([t('report.terms'), t('report.termsAccepted')]);
  w.facts(rows);

  // Frais et réserves (retour)
  const charges = (c.charges ?? []).filter((x) => x && x.label);
  let total = 0;
  if (retour) {
    w.heading(t('check.groups.frais'));
    if (charges.length) {
      total = charges.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      w.table(
        [391, 120],
        null,
        [...charges.map((x) => ({ cells: [x.label, f.money(Number(x.amount) || 0)] })), { cells: [t('report.total'), f.money(total)], bold: true }],
      );
      w.y -= 4;
    }
    w.facts([[t('report.reserves'), c.reserves ? t('check.withReserves') : t('check.noReserves')]]);
  }

  // Signatures
  w.heading(t('report.signatures'));
  w.text(t(retour ? 'check.agreeIn' : 'check.agreeOut'), { size: 9, color: GREY, gap: 6 });
  const [clientSig, staffSig] = await Promise.all([embed(doc, await download(db, c.client_signature)), embed(doc, await download(db, c.staff_signature))]);
  w.ensure(110);
  const boxW = (A4.w - 2 * M - 20) / 2;
  const sigs: [PDFImage | null, string][] = [
    [clientSig, `${c.client_signer}${r.client_company ? ` · ${r.client_company}` : ''}`],
    [staffSig, c.staff_signer ? `${c.staff_signer} · ${ctx.org.name}` : ctx.org.name],
  ];
  sigs.forEach(([img, name], i) => {
    const x = M + i * (boxW + 20);
    w.page.drawRectangle({ x, y: w.y - 80, width: boxW, height: 80, borderColor: LINE, borderWidth: 0.8 });
    if (img) {
      const s = Math.min((boxW - 10) / img.width, 70 / img.height);
      w.page.drawImage(img, { x: x + (boxW - img.width * s) / 2, y: w.y - 75, width: img.width * s, height: img.height * s });
    }
    w.page.drawText(w.clean(name).slice(0, 70), { x, y: w.y - 93, size: 8.5, font, color: GREY });
  });
  w.y -= 104;

  // Photos (copies allégées faites par l'appareil : <id>-pdf-<n>-<emplacement>.jpg)
  const folder = `${c.org_id}/${c.machine_id}/location`;
  const { data: listed } = await db.storage.from('medias').list(folder, { search: `${c.id}-pdf-`, limit: 40, sortBy: { column: 'name', order: 'asc' } });
  const thumbs = (listed ?? []).filter((o) => o.name.startsWith(`${c.id}-pdf-`)).sort((a, b) => a.name.localeCompare(b.name));
  if (thumbs.length) {
    w.heading(t('pdf.photos'));
    const cols = 3;
    const gap = 10;
    const cw = (A4.w - 2 * M - gap * (cols - 1)) / cols;
    const ch = cw * 0.75;
    let col = 0;
    for (const o of thumbs) {
      const img = await embed(doc, await download(db, `${folder}/${o.name}`));
      if (!img) continue;
      if (col === 0) w.ensure(ch + 18);
      const x = M + col * (cw + gap);
      const s = Math.min(cw / img.width, ch / img.height);
      const iw = img.width * s;
      const ih = img.height * s;
      w.page.drawRectangle({ x, y: w.y - ch, width: cw, height: ch, color: rgb(0.93, 0.93, 0.94) });
      w.page.drawImage(img, { x: x + (cw - iw) / 2, y: w.y - ch + (ch - ih) / 2, width: iw, height: ih });
      const slot = o.name.replace(/\.jpg$/, '').split('-').pop() ?? 'libre';
      w.page.drawText(w.clean(t(`check.slots.${slot}`)).slice(0, 40), { x, y: w.y - ch - 10, size: 8, font, color: GREY });
      col += 1;
      if (col === cols) {
        col = 0;
        w.y -= ch + 18;
      }
    }
    if (col) w.y -= ch + 18;
  }

  // Pied de page
  const stamp = f.dateTime(new Date().toISOString());
  w.pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M + 6 }, end: { x: A4.w - M, y: M + 6 }, thickness: 0.4, color: LINE });
    p.drawText(w.clean(t('pdf.footer', { org: ctx.org.name, date: stamp })).slice(0, 110), { x: M, y: M - 6, size: 7.5, font, color: GREY });
    const pg = t('pdf.page', { n: i + 1, total: w.pages.length });
    p.drawText(pg, { x: A4.w - M - font.widthOfTextAtSize(pg, 7.5), y: M - 6, size: 7.5, font, color: GREY });
  });
  return { bytes: await doc.save(), title, machineLabel };
}

// ------------------------------------------------------------------ e-mail

function base64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string);

async function sendMail(opts: {
  to: string;
  cc: string | null;
  replyTo: string | null;
  subject: string;
  paragraphs: string[];
  footer: string;
  attachments: { filename: string; content: string }[];
  idempotencyKey: string;
}): Promise<{ ok: boolean; code?: string }> {
  const apiKey = env('RESEND_API_KEY');
  const from = env('EMAIL_FROM');
  if (!apiKey || !from) return { ok: false, code: 'not_configured' };
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1c">${opts.paragraphs
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')}<p style="font-size:12px;color:#777">${esc(opts.footer)}</p></body></html>`;
  const payload: Record<string, unknown> = {
    from,
    to: [opts.to],
    subject: opts.subject,
    html,
    text: [...opts.paragraphs, '', opts.footer].join('\n\n'),
    attachments: opts.attachments,
    tags: [{ name: 'type', value: 'location' }],
  };
  if (opts.cc && opts.cc.toLowerCase() !== opts.to.toLowerCase()) payload.cc = [opts.cc];
  const replyTo = opts.replyTo ?? env('EMAIL_REPLY_TO');
  if (replyTo) payload.reply_to = replyTo;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': opts.idempotencyKey.slice(0, 256), 'User-Agent': 'godet-location/1.0' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { name?: string } | null;
    return { ok: false, code: typeof body?.name === 'string' ? body.name.slice(0, 40) : `http_${res.status}` };
  } catch {
    return { ok: false, code: 'network' };
  }
}

// ------------------------------------------------------------------ point d'entrée

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method' });

  const url = env('SUPABASE_URL');
  const key = serviceKey();
  if (!url || !key) return json(req, 500, { error: 'not_configured' });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json(req, 401, { error: 'unauthorized' });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  const user = auth?.user;
  if (authError || !user) return json(req, 401, { error: 'unauthorized' });

  let body: { checkId?: string; locale?: string; resend?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: 'bad_request' });
  }
  const checkId = body.checkId ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(checkId)) return json(req, 400, { error: 'bad_request' });
  const locale: Locale = body.locale && body.locale in TEXTS ? (body.locale as Locale) : 'fr';

  const { data: check } = await db.from('rental_checks').select('*').eq('id', checkId).maybeSingle<CheckRow>();
  if (!check) return json(req, 404, { error: 'not_found' });
  const { data: member } = await db.from('memberships').select('role').eq('org_id', check.org_id).eq('user_id', user.id).maybeSingle();
  if (!member) return json(req, 403, { error: 'forbidden' });

  const [{ data: org }, { data: rental }, { data: machine }, { data: depart }] = await Promise.all([
    db.from('organizations').select('*').eq('id', check.org_id).single(),
    db.from('rentals').select('*').eq('id', check.rental_id).single(),
    db.from('machines').select('code, kind, brand, model, weight_t, serial, plate').eq('id', check.machine_id).single(),
    check.kind === 'retour'
      ? db.from('rental_checks').select('*').eq('rental_id', check.rental_id).eq('kind', 'depart').maybeSingle<CheckRow>()
      : Promise.resolve({ data: null as CheckRow | null }),
  ]);
  if (!org || !rental || !machine) return json(req, 404, { error: 'not_found' });
  const now = Date.now();
  const enabled = (org.plan === 'essai' && Date.parse(org.trial_ends_at) > now) || (org.plan === 'actif' && org.rental_addon === true);
  if (!enabled) return json(req, 403, { error: 'disabled' });

  // Déjà fait et déjà envoyé : rien à refaire (un nouvel appel après la signature n'envoie pas deux fois).
  if (check.report_path && check.emailed_at && !body.resend) return json(req, 200, { ok: true, pdf: check.report_path, emailed: true });

  const t = translator(locale);
  const f = formats(locale, org.country, org.currency);
  let pdfBytes = !body.resend || !check.report_path ? null : await download(db, check.report_path);
  let title = t(check.kind === 'retour' ? 'check.titleIn' : 'check.titleOut');
  let machineLabel = `${machine.code} · ${t(`kinds.${machine.kind}`)}${machine.brand || machine.model ? ` ${[machine.brand, machine.model].filter(Boolean).join(' ')}` : ''}`;
  const pdfPath = `${check.org_id}/${check.machine_id}/location/${check.id}-rapport.pdf`;

  if (!pdfBytes) {
    try {
      const built = await buildPdf(db, locale, { org, machine, rental, check, depart: depart ?? null });
      pdfBytes = built.bytes;
      title = built.title;
      machineLabel = built.machineLabel;
    } catch (e) {
      console.error('[location] PDF :', e instanceof Error ? e.message : e);
      return json(req, 500, { error: 'pdf_error' });
    }
    const up = await db.storage.from('medias').upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (up.error) {
      console.error('[location] stockage :', up.error.message);
      return json(req, 500, { error: 'pdf_error' });
    }
    // Rangé dans les documents de la machine (une seule fois).
    const { data: existing } = await db.from('media').select('id').eq('rental_check_id', check.id).eq('slot', 'rapport').maybeSingle();
    if (!existing) {
      const { error: mediaError } = await db.from('media').insert({
        org_id: check.org_id,
        machine_id: check.machine_id,
        kind: 'document',
        path: pdfPath,
        mime: 'application/pdf',
        size_bytes: pdfBytes.length,
        caption: `${title} · ${[rental.client_company, rental.client_name].filter(Boolean).join(' · ')}`.slice(0, 200),
        rental_check_id: check.id,
        slot: 'rapport',
        created_by: check.created_by,
      });
      if (mediaError) console.error('[location] média :', mediaError.code, mediaError.message);
    }
    await db.from('rental_checks').update({ report_path: pdfPath }).eq('id', check.id);
  }

  // E-mail au client (copie au loueur), PDF et conditions acceptées en pièces jointes.
  let emailed = false;
  let emailCode: string | undefined;
  if (rental.client_email) {
    const attachments = [{ filename: `${title} ${machine.code}.pdf`.replace(/[^\p{L}\p{N} ._-]/gu, '_'), content: base64(pdfBytes) }];
    const terms = check.terms_accepted ? await download(db, check.terms_path) : null;
    if (terms && terms.length < 8_000_000) attachments.push({ filename: `${t('report.terms')}.pdf`.replace(/[^\p{L}\p{N} ._-]/gu, '_'), content: base64(terms) });
    const charges = (check.charges ?? []).reduce((s, x) => s + (Number(x?.amount) || 0), 0);
    const kind = check.kind;
    const sent = await sendMail({
      to: rental.client_email,
      cc: org.rental_report_cc ?? null,
      replyTo: org.rental_report_cc ?? null,
      subject: t(`mail.subject_${kind}`, { machine: machineLabel }),
      paragraphs: [
        t('mail.greeting', { name: check.client_signer || rental.client_name }),
        t(`mail.body_${kind}`, { machine: machineLabel, date: f.dateTime(check.created_at) }),
        ...(kind === 'retour' && charges > 0 ? [t('mail.charges', { total: f.money(charges) })] : []),
        ...(terms ? [t('mail.terms')] : []),
        t('mail.thanks'),
        `${t('mail.sign')}\n${check.staff_signer ? `${check.staff_signer}\n` : ''}${org.name}`,
      ],
      footer: t('mail.footer', { org: org.name }),
      attachments,
      idempotencyKey: `location-${check.id}-${body.resend ? Date.now() : 'first'}`,
    });
    emailed = sent.ok;
    emailCode = sent.code;
    if (sent.ok) await db.from('rental_checks').update({ emailed_at: new Date().toISOString() }).eq('id', check.id);
    else console.error('[location] e-mail :', sent.code);
  }
  return json(req, 200, { ok: true, pdf: pdfPath, emailed, email: emailCode });
});
