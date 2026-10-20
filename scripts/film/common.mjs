// Réglages communs des tournages : dépôt, adresses du labo (next dev) et du site, navigateur.
// Par défaut : Chromium de Playwright en rendu logiciel (SwiftShader, lent). FILM_GPU=1 : Edge installé et carte
// graphique (Windows), environ quinze fois plus rapide.
import { fileURLToPath } from 'node:url';

export const REPO = process.env.GODET_REPO ?? fileURLToPath(new URL('../..', import.meta.url));
export const LABO = process.env.GODET_LABO ?? 'http://localhost:3200';
export const SITE = process.env.GODET_SITE ?? 'http://localhost:3100';
export const GPU = process.env.FILM_GPU === '1';

export async function launch({ args = [], env } = {}) {
  const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright-core');
  if (GPU) return chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...args], env });
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...args], env });
}

/** Les visites filmées ne comptent pas dans les statistiques de la démo. */
export async function noVisitLog(page) {
  await page.route('**/rest/v1/rpc/log_demo_visit', (route) => route.fulfill({ status: 204, body: '' }));
}
