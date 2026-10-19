import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { linkErrorPath, safePath } from '@/components/site/nav';

/**
 * Retour des liens d'e-mail de Supabase (confirmation d'inscription, mot de passe oublié) :
 * le code reçu est échangé contre une session, puis on continue vers `suite` (chemin interne uniquement).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const suite = safePath(params.get('suite') ?? params.get('next'), '/garage');
  const code = params.get('code');

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
    console.warn('[auth/callback] lien refusé :', error.code ?? error.message);
  } else if (params.get('error') || params.get('error_code')) {
    console.warn('[auth/callback] lien refusé par Supabase :', params.get('error_code') ?? params.get('error'));
  }

  return NextResponse.redirect(new URL(linkErrorPath(suite), request.url));
}
