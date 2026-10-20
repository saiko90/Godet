// Tournage du « suivi des machines » dans la démo (mode atelier, fiche, intervention), dans une langue :
// node film-suivi.mjs <fr|de|it|en> <dossier> [une image sur N] [échelle]
// Horloge virtuelle (vt.js) : chaque image avance de 1/30 s ; curseur, clics, saisie et sous-titres sont réglés au
// centième près par la mise en scène ci-dessous, puis chaque image est capturée (PNG 1920 × 1080).
import { REPO, SITE, launch, noVisitLog } from './common.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [locale = 'fr', out = `suivi-${locale}`, every = '1', scale = '1.5'] = process.argv.slice(2);
const FPS = 30;
const here = (p) => new URL(p, import.meta.url);
const T = JSON.parse(readFileSync(here('./texts.json'), 'utf8'))[locale];
const G = JSON.parse(readFileSync(`${REPO}/messages/${locale}/garage.json`, 'utf8'));
const BROWSER_LOCALE = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH', en: 'en-GB' }[locale];
const POSIX = BROWSER_LOCALE.replace('-', '_');
const BASE = `${SITE}${locale === 'fr' ? '' : '/' + locale}/demo`;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

mkdirSync(out, { recursive: true });
// La langue du navigateur (variables d'environnement) règle l'affichage des champs date : 20.10.2026, 20/10/2026…
const browser = await launch({
  args: [`--lang=${BROWSER_LOCALE}`],
  env: { ...process.env, LANG: `${POSIX}.UTF-8`, LANGUAGE: `${POSIX}:${locale}`, LC_ALL: `${POSIX}.UTF-8` },
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +scale, locale: BROWSER_LOCALE, timezoneId: 'Europe/Zurich' });
await ctx.addInitScript(() => {
  try { localStorage.setItem('godet-qualite', 'auto'); localStorage.setItem('godet-son', 'false'); } catch {}
});
await ctx.addInitScript({ content: readFileSync(here('./vt.js'), 'utf8') });
const page = await ctx.newPage();
await noVisitLog(page);
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

// ------------------------------------------------------------------ préparation (temps réel, non filmée)
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.g-welcome button.btn-primary').first().waitFor({ timeout: 300000 });
await page.getByRole('button', { name: new RegExp(esc(G.topbar.atelier), 'i') }).first().click();
await page.locator('.g-atelier [data-fiche="demo-du-04"]').waitFor();
// Bandeau « démo » et boutons de pied de liste : hors sujet dans le film.
await page.addStyleTag({ content: '.g-demo-strip, .g-atelier-foot, nextjs-portal { display: none !important; }' });
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.addScriptTag({ content: readFileSync(here('./overlay.js'), 'utf8') });
const cdp = await ctx.newCDPSession(page);

// ------------------------------------------------------------------ outils de mise en scène
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const cur = { x: 1060, y: 610, on: true, down: false };
let move = null; // { from, to, t0, dur }
let ring = null; // { x, y, t0 }
let typing = null; // { text, t0, cps, done }
let scroll = null; // { axis, from, to, t0, dur }
const caps = []; // { from, to, eyebrow, text }
let endAt = Infinity;

async function centerOf(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('élément introuvable pour le curseur');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
/** Marque le conteneur défilant de l'élément (data-film-scroll) et renvoie le défilement visé (vertical ou horizontal). */
async function scrollTarget(locator, offset, axis) {
  return locator.evaluate(
    (el, [off, ax]) => {
      const scrollable = (p) =>
        ax === 'x'
          ? p.scrollWidth > p.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(p).overflowX)
          : p.scrollHeight > p.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(p).overflowY);
      let p = el.parentElement;
      while (p && !scrollable(p)) p = p.parentElement;
      document.querySelectorAll('[data-film-scroll]').forEach((x) => x.removeAttribute('data-film-scroll'));
      const box = p ?? document.scrollingElement;
      box.setAttribute('data-film-scroll', ax);
      const r = el.getBoundingClientRect();
      const b = p ? p.getBoundingClientRect() : { top: 0, right: innerWidth };
      if (ax === 'x') {
        const max = box.scrollWidth - box.clientWidth;
        return { from: box.scrollLeft, to: Math.max(0, Math.min(max, box.scrollLeft + (r.right - b.right) + off)) };
      }
      const max = box.scrollHeight - box.clientHeight;
      return { from: box.scrollTop, to: Math.max(0, Math.min(max, box.scrollTop + (r.top - b.top) - off)) };
    },
    [offset, axis],
  );
}

const tabRe = (label) => new RegExp('^' + esc(label));
const L = {
  overdue: () => page.locator('.g-atelier').getByRole('button', { name: new RegExp('^' + esc(G.state.bad)) }).first(),
  fiche: () => page.locator('.g-atelier [data-fiche="demo-du-04"]'),
  markDone: () => page.getByRole('button', { name: new RegExp(esc(G.due.markDone)) }).first(),
  hours: () => page.locator('#iv-hours'),
  details: () => page.locator('#iv-details'),
  parts: () => page.locator('#iv-parts'),
  labour: () => page.locator('#iv-labour'),
  save: () => page.locator('.modal button[type=submit]'),
  firstEntry: () => page.locator('.timeline > li').first(),
  tabDue: () => page.getByRole('tab', { name: tabRe(G.tabs.echeances) }),
  tabCosts: () => page.getByRole('tab', { name: tabRe(G.tabs.couts) }),
  chart: () => page.locator('figure.g-chart').first(),
};

// Mise en scène : [instant (s), action, …]. Sous-titres : rang dans texts.json (suivi).
const S = T.suivi;
const SCRIPT = [
  [0.0, 'cap', 0, 3.4],
  [0.9, 'move', L.overdue, 0.9],
  [2.0, 'click'],
  [3.6, 'cap', 1, 6.6],
  [4.0, 'move', L.fiche, 0.9],
  [5.1, 'click'],
  [6.9, 'cap', 2, 10.6],
  [7.5, 'movePoint', { x: 1050, y: 470 }, 0.8],
  [8.5, 'scroll', L.markDone, 250, 0.9],
  [9.7, 'move', L.markDone, 0.8],
  [10.6, 'click'],
  [11.0, 'cap', 3, 19.9],
  [11.7, 'move', L.hours, 0.7],
  [12.5, 'click'],
  [12.6, 'key', 'Control+A'],
  [12.7, 'type', '3546', 10],
  // La fenêtre défile d'abord : le champ « Détails » remonte, loin du sous-titre en bas de l'image.
  [13.2, 'scroll', L.details, 70, 0.7],
  [14.0, 'move', L.details, 0.7],
  [14.8, 'click'],
  [14.9, 'type', T.typing.details, 22],
  [16.6, 'move', L.parts, 0.6],
  [17.3, 'click'],
  [17.4, 'type', T.typing.parts, 10],
  [17.9, 'move', L.labour, 0.5],
  [18.5, 'click'],
  [18.6, 'type', T.typing.labour, 10],
  [19.2, 'move', L.save, 0.7],
  [20.0, 'click'],
  // Après l'enregistrement : la fiche montre le carnet, la nouvelle saisie en tête.
  [20.8, 'cap', 5, 24.6],
  [21.4, 'move', L.firstEntry, 0.9],
  [24.8, 'scrollX', L.tabDue, 16, 0.6],
  [25.5, 'move', L.tabDue, 0.7],
  [26.3, 'click'],
  [26.7, 'cap', 4, 30.8],
  [27.3, 'movePoint', { x: 1010, y: 528 }, 0.9],
  [31.0, 'move', L.tabCosts, 0.7],
  [31.8, 'click'],
  [32.2, 'cap', 6, 36.3],
  [32.6, 'movePoint', { x: 1000, y: 560 }, 0.8],
  [33.6, 'scroll', L.chart, 40, 1.0],
  [36.6, 'end'],
];
const DURATION = 40.1;

async function run(action, t) {
  const [, kind, a, b, c] = action;
  switch (kind) {
    case 'cap':
      caps.push({ from: t, to: b, eyebrow: S[a].eyebrow, text: S[a].text });
      break;
    case 'move': {
      const to = await centerOf(a());
      move = { from: { x: cur.x, y: cur.y }, to, t0: t, dur: b };
      break;
    }
    case 'movePoint':
      move = { from: { x: cur.x, y: cur.y }, to: a, t0: t, dur: b };
      break;
    case 'click':
      await page.mouse.move(cur.x, cur.y);
      await page.mouse.down();
      cur.down = true;
      ring = { x: cur.x, y: cur.y, t0: t };
      break;
    case 'key':
      await page.keyboard.press(a);
      break;
    case 'type':
      typing = { text: a, t0: t, cps: b, done: 0 };
      break;
    case 'scroll':
    case 'scrollX': {
      const axis = kind === 'scrollX' ? 'x' : 'y';
      const target = await scrollTarget(a(), b, axis);
      scroll = { ...target, axis, t0: t, dur: c };
      break;
    }
    case 'end':
      endAt = t;
      cur.on = false;
      break;
  }
}

function capState(t) {
  for (const c of caps) {
    if (t < c.from || t > c.to + 0.35) continue;
    const k = t <= c.to ? Math.min(1, (t - c.from) / 0.45) : 1 + (t - c.to) / 0.35;
    return { text: c.text, eyebrow: c.eyebrow, k };
  }
  return null;
}

// ------------------------------------------------------------------ tournage
await page.evaluate(() => window.__vt.start());
const total = Math.round(DURATION * FPS);
let next = 0;
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  if (cur.down && ring && t - ring.t0 >= 0.06) {
    await page.mouse.up();
    cur.down = false;
  }
  while (next < SCRIPT.length && SCRIPT[next][0] <= t + 1e-6) await run(SCRIPT[next++], t);
  if (move) {
    const k = Math.min(1, (t - move.t0) / move.dur);
    const e = easeInOut(k);
    const arc = Math.sin(Math.PI * e) * Math.min(40, Math.hypot(move.to.x - move.from.x, move.to.y - move.from.y) * 0.08);
    cur.x = move.from.x + (move.to.x - move.from.x) * e;
    cur.y = move.from.y + (move.to.y - move.from.y) * e - arc;
    await page.mouse.move(cur.x, cur.y);
    if (k >= 1) move = null;
  }
  if (typing) {
    const want = Math.min(typing.text.length, Math.floor((t - typing.t0) * typing.cps) + 1);
    if (want > typing.done) {
      await page.keyboard.type(typing.text.slice(typing.done, want));
      typing.done = want;
    }
    if (typing.done >= typing.text.length) typing = null;
  }
  if (scroll) {
    const k = Math.min(1, (t - scroll.t0) / scroll.dur);
    const v = scroll.from + (scroll.to - scroll.from) * easeInOut(k);
    await page.evaluate(([val, ax]) => {
      const el = document.querySelector('[data-film-scroll]');
      if (!el) return;
      if (ax === 'x') el.scrollLeft = val;
      else el.scrollTop = val;
    }, [v, scroll.axis]);
    if (k >= 1) scroll = null;
  }
  const state = {
    cap: capState(t),
    cur: { x: cur.x, y: cur.y, on: cur.on, down: cur.down },
    ring: ring && t - ring.t0 < 0.5 ? { x: ring.x, y: ring.y, k: (t - ring.t0) / 0.5 } : null,
    end: t >= endAt ? { k: t - endAt, tagline: T.end.tagline, cta: T.end.cta, url: T.end.maker } : null,
  };
  await page.evaluate((s) => window.__film.render(s), state);
  await page.evaluate(() => window.__vt.advance(1000 / 30));
  if (f % +every === 0) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1280, height: 720, scale: +scale } });
    writeFileSync(`${out}/f${String(f).padStart(4, '0')}.png`, Buffer.from(shot.data, 'base64'));
  }
  if (f % 60 === 0) {
    const per = (Date.now() - t0) / 1000 / (f + 1);
    console.log(`${locale} image ${f}/${total} — ${per.toFixed(2)} s/image — reste ~${Math.round(((total - f) * per) / 60)} min`);
  }
}
console.log(locale, 'fini en', Math.round((Date.now() - t0) / 60000), 'min', errs.length ? 'ERREURS: ' + errs.slice(0, 5).join(' | ') : 'sans erreur');
await browser.close();
