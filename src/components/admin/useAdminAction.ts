'use client';

import { useTranslations } from 'next-intl';
import { unstable_rethrow } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { AdminResult } from './types';

/**
 * Appelle une action serveur de la console : état « en cours », résultat traduit (admin.results.<code>).
 * `onDone` reçoit le résultat (pour vider un formulaire, naviguer…).
 */
export function useAdminAction() {
  const t = useTranslations('admin.results');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminResult | null>(null);

  function run(action: () => Promise<AdminResult>, onDone?: (r: AdminResult) => void) {
    setResult(null);
    startTransition(async () => {
      let r: AdminResult;
      try {
        r = await action();
      } catch (error) {
        unstable_rethrow(error);
        r = { ok: false, code: 'offline' };
      }
      setResult(r);
      onDone?.(r);
    });
  }

  return {
    pending,
    result,
    message: result ? t(result.code) : null,
    run,
    clear: () => setResult(null),
  };
}
