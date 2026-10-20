// Image du héros de l'accueil dans une langue (1600 × 900) : le parc d'exemple de /demo, étiquettes et enseigne
// traduites. node hero-capture.mjs <fr|de|it|en> <sortie.png>
import { LABO, launch } from './common.mjs';

const [locale = 'fr', out = `hero-${locale}.png`] = process.argv.slice(2);
const STATES = 'warn2,ok,warn1,bad2,ok,warn2,warn2,ok';
const url = `${LABO}${locale === 'fr' ? '' : '/' + locale}/labo?fleet=demo&states=${STATES}&q=high&test=1`;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__godetShowroom), null, { timeout: 300000, polling: 500 });
await page.addStyleTag({ content: '.labo-bar, .labo-row, .labo-status, .labo-shot, nextjs-portal, [data-nextjs-toast] { display: none !important; }' });
await page.evaluate(() => window.__godetShowroom.setInsets({ top: 0, right: 0, bottom: 0 }));
await page.waitForFunction(() => window.__godetIdle === true, null, { timeout: 300000, polling: 1000 }).catch(() => console.log('pas de repos signalé'));
await page.waitForTimeout(3000);
await page.screenshot({ path: out });
console.log('ok', locale, out);
await browser.close();
