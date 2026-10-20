// Tests de la fonction « rappels » (aucun accès réseau ni base réelle : base factice en mémoire, fetch simulé).
// Lancer : deno test --config supabase/functions/rappels/deno.json supabase/functions/rappels/

import { deepStrictEqual, ok } from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { claimRun } from './data.ts';
import {
  buildOrgFleet,
  buildSections,
  isDueToday,
  lastDigestDay,
  selectRecipients,
  type MembershipRow,
  type PrefsRow,
} from './digest.ts';
import { dueOf, isWithinLead, weeklyRate, type ScheduleRow } from './dues.ts';
import { isoWeekday, makeFormat, zurichDay } from './format.ts';
import { renderDigest, scheduleLabel } from './render.ts';
import { sendWithResend } from './resend.ts';
import { linksFor, runReminders, type RunConfig } from './run.ts';

const assertEquals = (actual: unknown, expected: unknown) => deepStrictEqual(actual, expected);
const assert = (value: unknown, message?: string) => ok(value, message);
const assertFalse = (value: unknown) => ok(!value);
const assertStringIncludes = (text: string, part: string) => ok(text.includes(part), `« ${part} » absent de :\n${text}`);

const NB = '\u00a0';
const MONDAY = '2026-10-19';

// ------------------------------------------------------------------ formats et échéances

Deno.test('formats : Suisse dans toutes les langues, Allemagne en euros', () => {
  const ch = makeFormat({ locale: 'de', country: 'CH', currency: 'CHF' });
  assertEquals(ch.hours(6842), `6’842${NB}h`);
  assertEquals(ch.money(1240.4), `CHF${NB}1’240`);
  assertEquals(ch.date('2026-11-02'), '02.11.2026');
  const de = makeFormat({ locale: 'de', country: 'DE', currency: 'EUR' });
  assertEquals(de.hours(6842), `6.842${NB}h`);
  assertStringIncludes(de.money(1240), '1.240');
  assertEquals(isoWeekday(MONDAY), 1);
  // 00:30 à Zurich (heure d'été) = la veille 22:30 en UTC.
  assertEquals(zurichDay(new Date('2026-10-18T22:30:00Z')), MONDAY);
});

Deno.test('échéances par défaut : libellé dans la langue du destinataire', () => {
  deepStrictEqual(scheduleLabel('Contrôle annuel de sécurité', 'de'), 'Jährliche Sicherheitskontrolle');
  deepStrictEqual(scheduleLabel('Wartung', 'fr'), 'Service');
  deepStrictEqual(scheduleLabel('Service', 'it'), 'Manutenzione');
  deepStrictEqual(scheduleLabel('Vidange huile moteur', 'de'), 'Vidange huile moteur');
});

Deno.test('rythme d’utilisation : comme domain.ts', () => {
  const r = (h: number, at: string) => ({ machine_id: 'm', hours: h, read_at: at });
  assertEquals(weeklyRate([r(100, '2026-10-01T10:00:00Z')]), null);
  assertEquals(weeklyRate([r(100, '2026-10-10T10:00:00Z'), r(120, '2026-10-14T10:00:00Z')]), null); // moins de 7 jours
  assertEquals(weeklyRate([r(1000, '2026-09-01T00:00:00Z'), r(1360, '2026-10-01T00:00:00Z')]), 84); // 360 h en 30 j
});

const schedule = (over: Partial<ScheduleRow>): ScheduleRow => ({
  id: 's',
  machine_id: 'm',
  label: 'Service',
  basis: 'heures',
  interval_hours: 500,
  last_hours: 6500,
  due_hours: 7000,
  due_date: null,
  ...over,
});

Deno.test('échéances : seuils en heures, en jours et estimation au rythme', () => {
  const close = dueOf(schedule({ due_hours: 6880 }), 6842, null, MONDAY);
  assertEquals(close.left, 38);
  assert(isWithinLead(close, 14, 50));

  // 120 h restantes à 100 h par semaine : environ 8 jours → signalée par le délai en jours.
  const fast = dueOf(schedule({ due_hours: 6962 }), 6842, 100, MONDAY);
  assertEquals(fast.daysLeft, 8);
  assert(isWithinLead(fast, 14, 50));

  // 158 h restantes au rythme moyen (30 h/sem.) : 37 jours → pas encore.
  const far = dueOf(schedule({}), 6842, null, MONDAY);
  assertEquals(far.daysLeft, 37);
  assertFalse(isWithinLead(far, 14, 50));

  const overdue = dueOf(schedule({ due_hours: 6800 }), 6842, null, MONDAY);
  assert(overdue.left < 0 && isWithinLead(overdue, 1, 5));

  const date = dueOf(schedule({ basis: 'date', due_hours: null, due_date: '2026-10-29' }), 0, null, MONDAY);
  assertEquals(date.daysLeft, 10);
  assert(isWithinLead(date, 14, 50));
  assertFalse(isWithinLead(date, 7, 50));
});

// ------------------------------------------------------------------ destinataires et fréquence

const prefs = (user: string, over: Partial<PrefsRow> = {}): PrefsRow => ({
  user_id: user,
  email_enabled: true,
  frequency: 'hebdo',
  lead_days: 14,
  lead_hours: 50,
  last_digest_at: null,
  ...over,
});

Deno.test('destinataires : responsables par défaut, machinistes seulement sur demande', () => {
  const memberships: MembershipRow[] = [
    { org_id: 'A', user_id: 'owner', role: 'owner' },
    { org_id: 'B', user_id: 'owner', role: 'operator' },
    { org_id: 'A', user_id: 'op', role: 'operator' },
    { org_id: 'A', user_id: 'op-on', role: 'operator' },
    { org_id: 'A', user_id: 'admin-off', role: 'admin' },
    { org_id: 'A', user_id: 'meca-never', role: 'mechanic' },
    { org_id: 'A', user_id: 'meca-daily', role: 'mechanic' },
  ];
  const p = new Map<string, PrefsRow>([
    ['op-on', prefs('op-on', { frequency: 'quotidien', lead_days: 30 })],
    ['admin-off', prefs('admin-off', { email_enabled: false })],
    ['meca-never', prefs('meca-never', { frequency: 'jamais' })],
    ['meca-daily', prefs('meca-daily', { frequency: 'quotidien' })],
  ]);
  const out = selectRecipients(memberships, p);
  assertEquals(out.map((r) => r.userId), ['meca-daily', 'op-on', 'owner']);
  const owner = out.find((r) => r.userId === 'owner')!;
  // Sans réglages enregistrés, l'entreprise où la personne est machiniste n'est pas incluse.
  assertEquals(owner.orgs, [{ orgId: 'A', role: 'owner' }]);
  assertEquals(owner.settings, { frequency: 'hebdo', leadDays: 14, leadHours: 50, hasRow: false });
  assertEquals(out.find((r) => r.userId === 'op-on')!.settings.leadDays, 30);
});

Deno.test('fréquence : chaque jour une fois, chaque semaine le lundi, au plus tous les 7 jours', () => {
  assert(isDueToday('quotidien', null, MONDAY));
  assert(isDueToday('quotidien', '2026-10-18', MONDAY));
  assertFalse(isDueToday('quotidien', MONDAY, MONDAY));
  assert(isDueToday('hebdo', null, MONDAY));
  assert(isDueToday('hebdo', '2026-10-12', MONDAY));
  assertFalse(isDueToday('hebdo', '2026-10-13', MONDAY));
  assertFalse(isDueToday('hebdo', null, '2026-10-20'));
  assertEquals(lastDigestDay(null, '2026-10-12T05:20:00Z', '2026-10-05T05:20:00Z'), '2026-10-12');
  assertEquals(lastDigestDay(null, undefined), null);
});

// ------------------------------------------------------------------ contenu de l'e-mail

const ORG_CH = { id: 'A', name: 'Entreprise <Démo> SA', country: 'CH', currency: 'CHF', plan: 'essai' };
const ORG_DE = { id: 'B', name: 'Muster Bau GmbH', country: 'DE', currency: 'EUR', plan: 'actif' };

function fleetFixture(org: typeof ORG_CH) {
  const id = org.id;
  return buildOrgFleet(
    org,
    [
      { id: `${id}-m1`, org_id: id, code: 'PE-01', kind: 'pelle', weight_t: 21, hours: 6842 },
      { id: `${id}-m2`, org_id: id, code: 'CH-02', kind: 'chargeuse', weight_t: null, hours: 1200 },
    ],
    [
      schedule({ id: `${id}-s1`, machine_id: `${id}-m1`, due_hours: 6800 }),
      schedule({ id: `${id}-s2`, machine_id: `${id}-m2`, label: 'Contrôle annuel', basis: 'date', due_date: '2026-10-29' }),
      schedule({ id: `${id}-s3`, machine_id: `${id}-m2`, label: 'Service', due_hours: 1600 }),
    ],
    [
      {
        id: `${id}-r1`,
        org_id: id,
        machine_id: `${id}-m1`,
        title: 'Fuite <vérin>',
        date: '2026-10-05',
        repair_status: 'attente_piece',
        cost_parts: 1000,
        cost_labour: 240,
      },
    ],
    [],
    MONDAY,
  );
}

Deno.test('rendu : objet, échappement, formats et liens dans la langue de la personne', () => {
  const fleets = new Map([
    ['A', fleetFixture(ORG_CH)],
    ['B', fleetFixture(ORG_DE)],
  ]);
  const recipient = {
    userId: 'u',
    settings: { frequency: 'hebdo' as const, leadDays: 14, leadHours: 50, hasRow: false },
    orgs: [{ orgId: 'A', role: 'owner' as const }],
  };
  const sections = buildSections(recipient, fleets);
  assertEquals(sections.length, 1);
  assertEquals(sections[0].dues.length, 2); // dépassée + contrôle dans 10 jours ; le service à 400 h est trop loin

  const fr = renderDigest({
    locale: 'fr',
    name: 'Marc',
    frequency: 'hebdo',
    leadDays: 14,
    leadHours: 50,
    sections,
    links: linksFor('https://godet.example', 'fr'),
  });
  assertEquals(
    fr.subject,
    'Godet — 2 échéances à prévoir (dont 1 dépassée) et 1 réparation ouverte chez Entreprise <Démo> SA',
  );
  assertStringIncludes(fr.html, 'Entreprise &lt;Démo&gt; SA');
  assertFalse(fr.html.includes('<vérin>'));
  assertStringIncludes(fr.html, 'href="https://godet.example/garage"');
  assertStringIncludes(fr.html, 'https://godet.example/parametres#rappels');
  assertStringIncludes(fr.text, `Dépassé de 42${NB}h`);
  assertStringIncludes(fr.text, `compteur${NB}: 6’842${NB}h`);
  assertStringIncludes(fr.text, `coût à ce jour${NB}: CHF${NB}1’240`);
  assertStringIncludes(fr.text, 'Bonjour Marc,');
  assertStringIncludes(fr.html, 'lang="fr-CH"');
  assertStringIncludes(fr.text, 'merci de ne pas y répondre');
  const withReply = renderDigest({
    locale: 'fr',
    name: 'Marc',
    frequency: 'hebdo',
    leadDays: 14,
    leadHours: 50,
    sections,
    links: linksFor('https://godet.example', 'fr'),
    replyAllowed: true,
  });
  assertFalse(withReply.text.includes('ne pas y répondre') || withReply.html.includes('ne pas y répondre'));

  const de = renderDigest({
    locale: 'de',
    name: null,
    frequency: 'quotidien',
    leadDays: 14,
    leadHours: 50,
    sections: buildSections({ ...recipient, orgs: [{ orgId: 'A', role: 'owner' }, { orgId: 'B', role: 'operator' }] }, fleets),
    links: linksFor('https://godet.example', 'de'),
  });
  assertEquals(de.subject, 'Godet — 4 anstehende Termine (davon 2 überfällig) und 2 offene Reparaturen in 2 Unternehmen');
  assertStringIncludes(de.text, `42${NB}h überfällig`);
  assertStringIncludes(de.text, `Betriebsstunden: 6.842${NB}h`); // entreprise allemande : format allemand
  assertStringIncludes(de.text, 'https://godet.example/de/garage');
  assertStringIncludes(de.text, 'Guten Tag');
  assertStringIncludes(de.text, 'jeden Morgen');
});

// ------------------------------------------------------------------ Resend

Deno.test('Resend : requête, succès, refus et panne réseau', async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const ok = ((url: string, init: RequestInit) => {
    seen = { url, init };
    return Promise.resolve(new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 }));
  }) as unknown as typeof fetch;
  const cfg = { apiKey: 're_test', from: 'Godet <rappels@exemple.ch>', replyTo: 'support@exemple.ch' };
  const email = { to: 'a@exemple.ch', subject: 'S', html: '<p>h</p>', text: 't', idempotencyKey: 'k' };
  assertEquals(await sendWithResend(cfg, email, ok), { ok: true, id: 'abc-123' });
  const sent = seen as unknown as { url: string; init: RequestInit };
  assertEquals(sent.url, 'https://api.resend.com/emails');
  const headers = sent.init.headers as Record<string, string>;
  assertEquals(headers.Authorization, 'Bearer re_test');
  assertEquals(headers['Idempotency-Key'], 'k');
  assert(headers['User-Agent']);
  const body = JSON.parse(String(sent.init.body));
  assertEquals(body.to, ['a@exemple.ch']);
  assertEquals(body.reply_to, 'support@exemple.ch');

  const refused = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ statusCode: 422, name: 'validation_error', message: 'a@exemple.ch invalide' }), { status: 422 }),
    )) as unknown as typeof fetch;
  assertEquals(await sendWithResend(cfg, email, refused), { ok: false, status: 422, code: 'validation_error', retryAfterMs: null });

  const down = (() => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch;
  assertEquals(await sendWithResend(cfg, email, down), { ok: false, status: 0, code: 'network', retryAfterMs: null });
});

// ------------------------------------------------------------------ base factice (sous-ensemble de PostgREST)

type Row = Record<string, unknown>;

class FakeDb {
  tables: Record<string, Row[]> = {};
  from(table: string) {
    return new FakeQuery(this, table);
  }
}

class FakeQuery implements PromiseLike<{ data: unknown; error: { code: string; message: string } | null }> {
  private filters: ((r: Row) => boolean)[] = [];
  private op: 'select' | 'update' | 'insert' = 'select';
  private values: Row | Row[] = {};
  private from_ = 0;
  private to_ = Infinity;
  private single = false;
  constructor(
    private db: FakeDb,
    private table: string,
  ) {}
  select() {
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.values = values;
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = 'insert';
    this.values = values;
    return this;
  }
  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  is(col: string, v: unknown) {
    this.filters.push((r) => (r[col] ?? null) === v);
    return this;
  }
  in(col: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[col]));
    return this;
  }
  gte(col: string, v: string) {
    this.filters.push((r) => String(r[col]) >= v);
    return this;
  }
  lt(col: string, v: string) {
    this.filters.push((r) => String(r[col]) < v);
    return this;
  }
  order() {
    return this;
  }
  range(a: number, b: number) {
    this.from_ = a;
    this.to_ = b;
    return this;
  }
  maybeSingle() {
    this.single = true;
    return this;
  }
  private run() {
    const rows = (this.db.tables[this.table] ??= []);
    if (this.op === 'insert') {
      const list = Array.isArray(this.values) ? this.values : [this.values];
      if (this.table === 'job_runs' && list.some((v) => rows.some((r) => r.job === v.job))) {
        return { data: null, error: { code: '23505', message: 'duplicate key' } };
      }
      rows.push(...list.map((v) => ({ created_at: new Date().toISOString(), ...v })));
      return { data: null, error: null };
    }
    const hit = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.op === 'update') {
      for (const r of hit) Object.assign(r, this.values);
      return { data: hit.map((r) => ({ ...r })), error: null };
    }
    const page = hit.slice(this.from_, this.to_ + 1).map((r) => ({ ...r }));
    return { data: this.single ? (page[0] ?? null) : page, error: null };
  }
  then<A = { data: unknown; error: { code: string; message: string } | null }, B = never>(
    ok?: ((v: { data: unknown; error: { code: string; message: string } | null }) => A | PromiseLike<A>) | null,
    ko?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve(this.run()).then(ok, ko);
  }
}

const asClient = (db: FakeDb) => db as unknown as SupabaseClient;

Deno.test('garde-fou : une exécution réelle au plus toutes les 20 heures', async () => {
  const db = new FakeDb();
  const t0 = new Date('2026-10-19T05:15:00Z');
  assertEquals(await claimRun(asClient(db), 'rappels', t0, 20), { claimed: true });
  assertEquals(await claimRun(asClient(db), 'rappels', new Date('2026-10-19T05:16:00Z'), 20), {
    claimed: false,
    lastRunAt: t0.toISOString(),
  });
  assertEquals(await claimRun(asClient(db), 'rappels', new Date('2026-10-20T05:15:00Z'), 20), { claimed: true });
});

function seed(): FakeDb {
  const db = new FakeDb();
  db.tables = {
    notification_prefs: [
      { ...prefs('u-op', { frequency: 'quotidien' }) },
      { ...prefs('u-meca', { frequency: 'quotidien', last_digest_at: '2026-10-19T04:00:00Z' }) },
    ],
    memberships: [
      { org_id: 'A', user_id: 'u-owner', role: 'owner' },
      { org_id: 'A', user_id: 'u-op', role: 'operator' },
      { org_id: 'A', user_id: 'u-silent', role: 'operator' },
      { org_id: 'A', user_id: 'u-meca', role: 'mechanic' },
      { org_id: 'S', user_id: 'u-susp', role: 'owner' },
    ],
    profiles: [
      { id: 'u-owner', full_name: 'Anne Propriétaire', email: 'anne@exemple.ch', locale: 'fr' },
      { id: 'u-op', full_name: null, email: 'op@exemple.ch', locale: 'de' },
      { id: 'u-meca', full_name: 'Méca', email: 'meca@exemple.ch', locale: 'it' },
      { id: 'u-susp', full_name: 'Suspendu', email: 'susp@exemple.ch', locale: 'fr' },
    ],
    organizations: [
      { id: 'A', name: 'Entreprise Démo SA', country: 'CH', currency: 'CHF', plan: 'essai' },
      { id: 'S', name: 'Suspendue SA', country: 'CH', currency: 'CHF', plan: 'suspendu' },
    ],
    machines: [{ id: 'm1', org_id: 'A', code: 'PE-01', kind: 'pelle', weight_t: 21, hours: 6842, archived_at: null }],
    schedules: [{ ...schedule({ id: 's1', machine_id: 'm1', due_hours: 6800 }), org_id: 'A', active: true }],
    entries: [],
    hour_readings: [],
    notification_log: [],
    job_runs: [],
  };
  return db;
}

const CONFIG: RunConfig = { mode: 'simulation', resend: null, siteUrl: 'https://godet.example', timeBudgetMs: 60_000, pauseMs: 0 };
const NOW = new Date('2026-10-19T05:15:00Z'); // lundi matin

Deno.test('exécution simulée : rien ne part, le journal ne contient que des compteurs', async () => {
  const db = seed();
  const counts = await runReminders(asClient(db), CONFIG, NOW);
  assertEquals(counts, {
    memberships: 5,
    people: 4, // owner, op (activé), meca, propriétaire de l'entreprise suspendue ; pas le machiniste silencieux
    due: 3, // meca a déjà reçu son rappel quotidien aujourd'hui
    nothing: 1, // l'entreprise suspendue est ignorée
    sent: 0,
    simulated: 2,
    errors: 0,
    noAddress: 0,
    deferred: 0,
  });
  const log = db.tables.notification_log;
  assertEquals(log.map((l) => [l.user_id, l.status, l.kind]), [
    ['u-op', 'simulation', 'rappel_quotidien'],
    ['u-owner', 'simulation', 'rappel_hebdo'],
  ]);
  for (const l of log) {
    assertEquals(l.detail, 'echeances=1;depassees=1;reparations=0;entreprises=1;langue=' + (l.user_id === 'u-op' ? 'de' : 'fr'));
    assertFalse(String(l.detail).includes('@'));
  }
  // La simulation ne fait pas avancer last_digest_at.
  assertEquals(db.tables.notification_prefs.find((p) => p.user_id === 'u-op')!.last_digest_at, null);
});

Deno.test('envoi réel (Resend simulé) : last_digest_at n’avance que si l’e-mail est parti', async () => {
  const db = seed();
  const calls: { to: string; key: string | null }[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = ((_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const headers = init.headers as Record<string, string>;
    calls.push({ to: body.to[0], key: headers['Idempotency-Key'] ?? null });
    const refused = body.to[0] === 'anne@exemple.ch';
    return Promise.resolve(
      refused
        ? new Response(JSON.stringify({ name: 'validation_error' }), { status: 403 })
        : new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 }),
    );
  }) as typeof fetch;
  try {
    const counts = await runReminders(
      asClient(db),
      { ...CONFIG, mode: 'resend', resend: { apiKey: 're_x', from: 'Godet <r@exemple.ch>', replyTo: null } },
      NOW,
    );
    assertEquals([counts.sent, counts.errors, counts.simulated], [1, 1, 0]);
  } finally {
    globalThis.fetch = realFetch;
  }
  assertEquals(calls.length, 2);
  assertEquals(calls[0].key, 'rappels-2026-10-19-u-op');
  assertEquals(db.tables.notification_prefs.find((p) => p.user_id === 'u-op')!.last_digest_at !== null, true);
  const log = db.tables.notification_log.map((l) => [l.user_id, l.status, String(l.detail).split(';').slice(-2).join(';')]);
  assertEquals(log, [
    ['u-op', 'envoye', 'langue=de;id=msg-1'],
    ['u-owner', 'erreur', 'http=403;code=validation_error'],
  ]);
  // Rappel du jour déjà parti : un second passage ne renvoie rien à cette personne.
  const again = await runReminders(asClient(db), { ...CONFIG }, new Date('2026-10-19T09:00:00Z'));
  assertEquals(again.simulated, 1); // seul le propriétaire (dont l'envoi avait échoué) reste à prévenir
});

Deno.test('envoi réel : un second essai après une panne passagère de Resend', async () => {
  const db = seed();
  db.tables.memberships = db.tables.memberships.filter((m) => m.user_id === 'u-op');
  let calls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    calls++;
    return Promise.resolve(
      calls === 1
        ? new Response(JSON.stringify({ name: 'application_error' }), { status: 500 })
        : new Response(JSON.stringify({ id: 'msg-2' }), { status: 200 }),
    );
  }) as typeof fetch;
  try {
    const counts = await runReminders(
      asClient(db),
      { ...CONFIG, mode: 'resend', resend: { apiKey: 're_x', from: 'Godet <r@exemple.ch>', replyTo: null } },
      NOW,
    );
    assertEquals([counts.sent, counts.errors, calls], [1, 0, 2]);
  } finally {
    globalThis.fetch = realFetch;
  }
});
