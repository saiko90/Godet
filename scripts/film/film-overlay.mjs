// Sous-titres et carton de fin du film « garage 3D », dans une langue, en images PNG transparentes (1920 × 1080),
// à superposer aux images du showroom (film-3d.mjs) : node film-overlay.mjs <fr|de|it|en> <dossier>
import { SITE, launch } from './common.mjs';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [locale = 'fr', out = `ov-${locale}`] = process.argv.slice(2);
const FPS = 30;
const here = (p) => new URL(p, import.meta.url);
const T = JSON.parse(readFileSync(here('./texts.json'), 'utf8'))[locale];
// Sous-titres calés sur la mise en scène de film-3d.mjs (allumage, pelle, nacelle, vue d'ensemble).
const CAPS = [
  [0.9, 6.0, 0],
  [7.6, 14.8, 1],
  [16.6, 22.6, 2],
  [26.8, 29.7, 3],
];
const END = 30.0;
const DURATION = 33.5;

mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, locale: 'fr-CH' });
const page = await ctx.newPage();
await page.goto(`${SITE}${locale === 'fr' ? '' : '/' + locale}/contact`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html, body { background: transparent !important; } body > *:not(#film-root) { display: none !important; }' });
await page.addScriptTag({ content: readFileSync(here('./overlay.js'), 'utf8') });
await page.evaluate(() => document.fonts.ready);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

function capState(t) {
  for (const [from, to, i] of CAPS) {
    if (t < from || t > to + 0.35) continue;
    const k = t <= to ? Math.min(1, (t - from) / 0.45) : 1 + (t - to) / 0.35;
    return { text: T.garage[i].text, eyebrow: T.garage[i].eyebrow, k: Math.round(k * 1000) / 1000 };
  }
  return null;
}

const total = Math.round(DURATION * FPS);
const cache = new Map();
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  const state = {
    cap: capState(t),
    cur: null,
    ring: null,
    end: t >= END ? { k: Math.min(2, Math.round((t - END) * 1000) / 1000), tagline: T.end.tagline, cta: T.end.cta, url: T.end.maker } : null,
  };
  const key = JSON.stringify(state);
  const file = `${out}/f${String(f).padStart(4, '0')}.png`;
  if (cache.has(key)) {
    copyFileSync(cache.get(key), file);
    continue;
  }
  await page.evaluate((s) => window.__film.render(s), state);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1.5 } });
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  cache.set(key, file);
}
console.log(locale, 'calque prêt :', total, 'images,', cache.size, 'différentes');
await browser.close();
