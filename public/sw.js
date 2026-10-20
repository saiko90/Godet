/* Godet : service worker du garage hors ligne.
 * - Fichiers de l'application (/_next/static, polices, icônes) : gardés à la première lecture, servis depuis
 *   l'appareil ensuite (leurs noms changent à chaque version).
 * - Page du garage : réseau d'abord ; sans réseau, la dernière page reçue. Les données viennent ensuite de
 *   l'appareil (IndexedDB, src/lib/offline/repo.ts).
 * - Lien d'une étiquette QR (/m/<id>) sans réseau : ouvre le garage gardé sur cette machine.
 * - Autres pages sans réseau : courte page « hors ligne » avec un lien vers le garage.
 * Rien n'est gardé pour les requêtes vers Supabase ni pour les autres sites.
 */
const STATIC = 'godet-static-v1';
const PAGES = 'godet-pages-v1';
const MAX_STATIC = 400;
const LOCALES = ['de', 'it', 'en'];
const GARAGE = /^\/(?:(de|it|en)\/)?garage\/?$/;
const QR = /^\/(?:(de|it|en)\/)?m\/([0-9a-f-]{36})\/?$/i;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC, PAGES];
      for (const key of await caches.keys()) if (key.startsWith('godet-') && !keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

function localeOf(path) {
  const first = path.split('/')[1];
  return LOCALES.includes(first) ? first : 'fr';
}

function garagePath(locale) {
  return locale === 'fr' ? '/garage' : `/${locale}/garage`;
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]);
}

async function fromCacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') {
    await cache.put(request, res.clone());
    void trim(cache);
  }
  return res;
}

const OFFLINE_TEXT = {
  fr: ['Hors ligne', 'Cette page demande une connexion. Le garage, lui, reste disponible sur cet appareil.', 'Ouvrir le garage'],
  de: ['Offline', 'Diese Seite braucht eine Verbindung. Die Garage bleibt auf diesem Gerät verfügbar.', 'Garage öffnen'],
  it: ['Offline', 'Questa pagina richiede una connessione. Il garage resta disponibile su questo dispositivo.', 'Apri il garage'],
  en: ['Offline', 'This page needs a connection. The garage is still available on this device.', 'Open the garage'],
};

function offlinePage(locale) {
  const [title, text, link] = OFFLINE_TEXT[locale] || OFFLINE_TEXT.fr;
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090b"><title>Godet · ${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090b;color:#e9e4d8;font:16px/1.5 system-ui,sans-serif;padding:24px;box-sizing:border-box}main{max-width:420px;text-align:center}h1{font-size:22px;letter-spacing:.08em;margin:0 0 10px}p{color:#a7acb3;margin:0 0 22px}a{display:inline-block;background:#f3b71b;color:#0b0d10;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px}</style></head><body><main><h1>${title}</h1><p>${text}</p><a href="${garagePath(locale)}">${link}</a></main></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function navigate(event, url) {
  const garage = GARAGE.exec(url.pathname);
  const qr = QR.exec(url.pathname);
  const locale = localeOf(url.pathname);
  const pages = await caches.open(PAGES);
  try {
    const res = await fetch(event.request);
    // Page du garage reçue en entier (pas une redirection vers la connexion) : copie pour la prochaine coupure.
    if (garage && res.ok && res.type === 'basic' && !res.redirected) await pages.put(new URL(garagePath(locale), url.origin).href, res.clone());
    return res;
  } catch {
    if (garage) {
      const hit = await pages.match(new URL(garagePath(locale), url.origin).href);
      if (hit) return hit;
    }
    if (qr) {
      // Étiquette scannée sans réseau : le garage gardé, dans la langue du lien sinon dans celle qui est gardée.
      for (const l of [...new Set([qr[1] || 'fr', 'fr', ...LOCALES])]) {
        const target = garagePath(l);
        if (await pages.match(new URL(target, url.origin).href)) return Response.redirect(`${target}?m=${qr[2]}`, 302);
      }
    }
    return offlinePage(locale);
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event, url));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(?:woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(fromCacheFirst(request));
  }
});
