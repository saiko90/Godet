// Génère les guides de démarrage PDF (public/guides/godet-guide-<langue>.pdf) à partir de la page /aide/guide.
// Usage : site lancé (npm run dev), puis
//   BASE=http://localhost:3000 node scripts/guides/make-guides.mjs
// Playwright : PLAYWRIGHT=<chemin du module> si « playwright-core » n'est pas installé.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const OUT = fileURLToPath(new URL('../../public/guides/', import.meta.url));
const LOCALES = ['fr', 'de', 'it', 'en'];

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright-core');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const locale of LOCALES) {
  const path = locale === 'fr' ? '/aide/guide' : `/${locale}/aide/guide`;
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = `${OUT}godet-guide-${locale}.pdf`;
  await page.pdf({
    path: file,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#999;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  console.log('✓', file);
}
await browser.close();
