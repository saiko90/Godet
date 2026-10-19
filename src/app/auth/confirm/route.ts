import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { linkErrorPath, safePath } from '@/components/site/nav';

/**
 * Vérification d'un lien d'e-mail personnalisé (modèles Supabase « token_hash »), valable dans n'importe quel
 * navigateur. Exemple de modèle « Confirm signup » :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&suite=/bienvenue
 * et « Reset password » :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&suite=/mot-de-passe
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
  // Adresse de retour prévue pour /auth/callback : on reprend la suite qu'elle contient.
  if (candidate.startsWith('/auth/callback')) {
    const inner = new URL(candidate, request.url).searchParams.get('suite');
    return safePath(inner, fallback);
  }
  return safePath(candidate, fallback);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const typeParam = params.get('type');
  const type = TYPES.find((t) => t === typeParam);
  const fallback = type ? DEFAULT_NEXT[type] : '/garage';
  const suite = resolveSuite(params.get('suite') ?? params.get('next') ?? params.get('redirect_to'), request, fallback);

  if (tokenHash && type) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
    console.warn('[auth/confirm] lien refusé :', error.code ?? error.message);
  }

  return NextResponse.redirect(new URL(linkErrorPath(suite), request.url));
}
