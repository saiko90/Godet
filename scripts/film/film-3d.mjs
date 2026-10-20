// Tournage du showroom 3D, sans texte (commun aux quatre langues) : une image PNG par pas de 1/30 s.
// node film-3d.mjs <dossier> [largeur] [hauteur] [qualité] [une image sur N]
import { LABO, launch } from './common.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [out = 'frames3d', w = '1280', h = '720', q = 'high', every = '1', dsf = '1'] = process.argv.slice(2);
const FPS = 30;
// États et alertes du parc d'exemple tels que /demo les affiche (PE-01 … PA-08).
const STATES = 'warn2,ok,warn1,bad2,ok,warn2,warn2,ok';
const URL_LABO = `${LABO}/labo?fleet=demo&states=${STATES}&q=${q}&signage=GODET&sub=${encodeURIComponent('Swiss Digital Studio')}`;

// Mise en scène (secondes) : allumage, pelle qui se réveille, nacelle qui se déplie, vue d'ensemble.
// Le réveil de la nacelle part une fois la caméra arrivée : le moteur recule alors pour garder la flèche dans le cadre.
const ACTIONS = [
  [0.4, 'intro'],
  [6.6, 'focus', 'm1'],
  [7.5, 'animate', 'm1', 'wake'],
  [15.6, 'focus', 'm7'],
  [17.9, 'animate', 'm7', 'wake'],
  [26.2, 'focus', null],
];
const DURATION = 30.5;

mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dsf, locale: 'fr-CH', timezoneId: 'Europe/Zurich' });
await ctx.addInitScript({ content: readFileSync(new URL('./vt.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
await page.goto(URL_LABO, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__godetShowroom), null, { timeout: 300000, polling: 500 });
await page.addStyleTag({ content: '.labo-bar, .labo-row, .labo-status, .labo-labels, .labo-shot, nextjs-portal, [data-nextjs-toast] { display: none !important; }' });
await page.evaluate(() => window.__godetShowroom.setInsets({ top: 0, right: 0, bottom: 0 }));
await page.waitForTimeout(2500);
await page.evaluate(() => window.__vt.start());
const cdp = await ctx.newCDPSession(page);

const total = Math.round(DURATION * FPS);
let next = 0;
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  while (next < ACTIONS.length && ACTIONS[next][0] <= t + 1e-6) {
    const [, method, ...args] = ACTIONS[next];
    await page.evaluate(([m, a]) => { void window.__godetShowroom[m](...a); }, [method, args]);
    next++;
  }
  await page.evaluate(() => window.__vt.advance(1000 / 30));
  if (f % +every === 0) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: +w, height: +h, scale: +dsf } });
    writeFileSync(`${out}/f${String(f).padStart(4, '0')}.png`, Buffer.from(shot.data, 'base64'));
  }
  if (f % 30 === 0) {
    const el = (Date.now() - t0) / 1000;
    const per = el / (f + 1);
    console.log(`image ${f}/${total} — ${per.toFixed(2)} s/image — reste ~${Math.round(((total - f) * per) / 60)} min`);
  }
}
console.log('fini en', Math.round((Date.now() - t0) / 60000), 'min', errs.length ? 'ERREURS: ' + errs.slice(0, 5).join(' | ') : 'sans erreur');
await browser.close();
