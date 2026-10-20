import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { linkErrorPath, LOCALE_COOKIE, localeOr, localizePath, safePath } from '@/components/site/nav';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Vérification d'un lien d'e-mail personnalisé (modèles Supabase « token_hash »), valable dans n'importe quel
 * navigateur. Exemple de modèle « Confirm signup » (la suite garde la langue de l'inscription) :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&suite={{ .RedirectTo }}
 * et « Reset password » :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&suite={{ .RedirectTo }}
 */
const TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const satisfies readonly EmailOtpType[];
type OtpType = (typeof TYPES)[number];

const DEFAULT_NEXT: Record<OtpType, string> = {
  signup: '/bienvenue',
  invite: '/bienvenue',
  email: '/bienvenue',
  magiclink: '/garage',
  recovery: '/mot-de-passe',
  email_change: '/parametres',
};

/** `suite` peut être un chemin, ou l'adresse complète du site (« {{ .RedirectTo }} ») : on n'en garde que le chemin. */
function resolveSuite(raw: string | null, request: NextRequest, fallback: string): string {
  if (!raw) return fallback;
  let candidate = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.origin !== request.nextUrl.origin) return fallback;
      candidate = `${url.pathname}${url.search}`;
    } catch {
      return fallback;
    }
  }
  // Adresse de retour prévue pour /auth/callback : on reprend la suite (localisée) qu'elle contient.
  if (candidate.startsWith('/auth/callback')) {
    const inner = new URL(candidate, request.url).searchParams.get('suite');
    return safePath(inner, fallback);
  }
  return safePath(candidate, fallback);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = localeOr(request.cookies.get(LOCALE_COOKIE)?.value);
  const tokenHash = params.get('token_hash');
  const typeParam = params.get('type');
  const type = TYPES.find((t) => t === typeParam);
  const fallback = localizePath(type ? DEFAULT_NEXT[type] : '/garage', locale);
  const suite = resolveSuite(params.get('suite') ?? params.get('next') ?? params.get('redirect_to'), request, fallback);

  if (tokenHash && type) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
    console.warn('[auth/confirm] lien refusé :', error.code ?? error.message);
  }

  return NextResponse.redirect(new URL(linkErrorPath(suite, locale), request.url));
}
