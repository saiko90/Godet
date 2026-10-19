import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';

const handleI18n = createIntlMiddleware(routing);

// Pages réservées aux personnes connectées (chemins sans la langue).
const PRIVATE = ['/garage', '/bienvenue', '/parametres', '/carnet', '/admin'];

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] };

/** Sépare la langue du chemin : « /de/garage » → { locale: 'de', path: '/garage' }. */
function splitLocale(pathname: string): { locale: string | null; path: string } {
  const first = pathname.split('/')[1] ?? '';
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: pathname.slice(first.length + 1) || '/' };
  }
  return { locale: null, path: pathname };
}

/**
 * 1. Rafraîchit la session Supabase (les cookies mis à jour sont transmis à la page et au navigateur).
 * 2. Protège les pages privées (redirection vers la connexion, dans la bonne langue).
 * 3. Gère les langues : français sans préfixe, /de, /it, /en ; détection par cookie puis par le navigateur.
 */
export async function proxy(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.push(...list);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { locale, path } = splitLocale(request.nextUrl.pathname);
  // Seules les pages (GET) sont redirigées : une action serveur (POST) sans session revérifie elle-même.
  const isPage = request.method === 'GET' || request.method === 'HEAD';

  if (!signedIn && isPage && PRIVATE.some((p) => path === p || path.startsWith(p + '/'))) {
    const cookieLocale = request.cookies.get('godet-lang')?.value;
    const target = locale ?? (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale) ? cookieLocale : null);
    const url = request.nextUrl.clone();
    url.pathname = (target && target !== routing.defaultLocale ? `/${target}` : '') + '/connexion';
    url.search = '';
    url.searchParams.set('suite', request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    cookiesToSet.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options));
    return redirect;
  }

  const response = handleI18n(request);
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  // Tout sauf les routes d'API et d'authentification, les fichiers internes et les fichiers statiques (avec un point).
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
