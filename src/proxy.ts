import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';

// Pages réservées aux personnes connectées.
const PRIVATE = ['/garage', '/bienvenue', '/parametres', '/carnet'];

/** Rafraîchit la session Supabase à chaque requête et protège les pages privées. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;
  // Seules les pages (GET) sont redirigées. Une action serveur (POST) arrivée sans session suit son cours : elle
  // revérifie la session et renvoie elle-même vers /connexion, ce que le navigateur sait suivre. Rediriger le POST
  // ici renverrait une page HTML à l'action : « Une erreur est survenue » au lieu de la page de connexion.
  const isPage = request.method === 'GET' || request.method === 'HEAD';

  if (!signedIn && isPage && PRIVATE.some((p) => path === p || path.startsWith(p + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    url.searchParams.set('suite', path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|sounds/|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|woff2?)$).*)'],
};
