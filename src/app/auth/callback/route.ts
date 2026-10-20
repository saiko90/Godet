import { NextResponse, type NextRequest } from 'next/server';
import { linkErrorPath, LOCALE_COOKIE, localeOr, localizePath, safePath } from '@/components/site/nav';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Retour des liens d'e-mail de Supabase (confirmation d'inscription, mot de passe oublié) :
 * le code reçu est échangé contre une session, puis on continue vers `suite` (chemin interne localisé uniquement,
 * par exemple « /de/bienvenue »). Sans suite valable : le garage, dans la langue mémorisée.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = localeOr(request.cookies.get(LOCALE_COOKIE)?.value);
  const suite = safePath(params.get('suite') ?? params.get('next'), localizePath('/garage', locale));
  const code = params.get('code');

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
    console.warn('[auth/callback] lien refusé :', error.code ?? error.message);
  } else if (params.get('error') || params.get('error_code')) {
    console.warn('[auth/callback] lien refusé par Supabase :', params.get('error_code') ?? params.get('error'));
  }

  return NextResponse.redirect(new URL(linkErrorPath(suite, locale), request.url));
}
