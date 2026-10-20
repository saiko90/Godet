'use client';

// Liens de démonstration envoyés par les agents de prospection : /demo?ref=CODE.
// Une fois par visite : la visite est comptée (fonction log_demo_visit, ouverte aux visiteurs anonymes) et le code est
// gardé 30 jours dans le cookie « godet-ref », que l'inscription transmet (profiles.signup_ref).
// Un code invalide est ignoré sans bruit.
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export const REF_COOKIE = 'godet-ref';
export const REF_PATTERN = /^[a-z0-9-]{4,40}$/;
const REF_MAX_AGE = 60 * 60 * 24 * 30;
/** Codes déjà comptés pendant cette visite (double rendu du mode strict, retour sur la page). */
const counted = new Set<string>();

export function useDemoRef() {
  const locale = useLocale();
  useEffect(() => {
    let url: URL;
    try {
      url = new URL(window.location.href);
    } catch {
      return;
    }
    const ref = url.searchParams.get('ref');
    if (ref === null || !REF_PATTERN.test(ref)) return;
    // Le code quitte l'adresse : un rechargement ou un changement de langue ne compte pas la visite une seconde fois.
    url.searchParams.delete('ref');
    try {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Adresse non modifiable : sans conséquence.
    }
    if (counted.has(ref)) return;
    counted.add(ref);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${REF_COOKIE}=${ref}; Max-Age=${REF_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    // Comptage facultatif : un échec (réseau, limite de la base) ne gêne pas la visite.
    supabaseBrowser()
      .rpc('log_demo_visit', { p_ref: ref, p_path: url.pathname, p_locale: locale })
      .then(
        () => undefined,
        () => undefined,
      );
  }, [locale]);
}
