'use client';

import { useTranslations } from 'next-intl';
import { unstable_rethrow } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ActionResult } from '../types';

/** Appelle une action serveur depuis un bouton : état « en cours » et message de résultat. */
export function useServerAction<A extends unknown[]>(action: (...args: A) => Promise<ActionResult>) {
  const t = useTranslations('settings.messages');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(...args: A) {
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await action(...args));
      } catch (error) {
        // Les redirections de Next (ex. départ de l'entreprise) doivent suivre leur cours.
        unstable_rethrow(error);
        setResult({ ok: false, message: t('offline') });
      }
    });
  }

  return { pending, result, run, clear: () => setResult(null) };
}
