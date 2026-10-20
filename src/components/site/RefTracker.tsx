'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { isRefCode, REF_COOKIE, REF_MAX_AGE } from './nav';

/**
 * Lien envoyé par un agent (?ref=code) : la visite est comptée (log_demo_visit) et le code est gardé 30 jours
 * dans le cookie « godet-ref », transmis ensuite à l'inscription. Traité dans le navigateur : la page reste statique.
 * Le client Supabase n'est chargé que si un code est présent.
 */
export function RefTracker({ path }: { path: string }) {
  const locale = useLocale();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toLowerCase();
    if (!isRefCode(ref)) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${REF_COOKIE}=${ref}; Max-Age=${REF_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    let cancelled = false;
    void import('@/lib/supabase/client')
      .then(async ({ supabaseBrowser }) => {
        if (cancelled) return;
        const { error } = await supabaseBrowser().rpc('log_demo_visit', { p_ref: ref, p_path: path, p_locale: locale });
        if (error) console.warn('[ref] visite non comptée :', error.code ?? error.message);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale, path]);

  return null;
}
