'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import {
  errorKind,
  latest,
  sameValues,
  validate,
  valuesFrom,
  type FieldErrors,
  type PrefsRow,
  type PrefsValues,
} from './prefs';

// Lecture et enregistrement de SA ligne notification_prefs (RLS : chacun ne voit et ne modifie que la sienne).

export type PrefsLoad =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'signedOut' }
  | {
      status: 'ready';
      userId: string;
      /** La personne a déjà enregistré ses réglages. */
      hasRow: boolean;
      /** Machiniste dans toutes ses entreprises. */
      operatorOnly: boolean;
      /** Machiniste dans au moins une entreprise. */
      operatorSomewhere: boolean;
      /** Dernier rappel réellement envoyé (préférence ou journal des envois). */
      lastSentAt: string | null;
    };

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; reason: 'invalid' | 'network' | 'session' | 'generic' };

const SELECT = 'email_enabled, frequency, lead_days, lead_hours, last_digest_at';
const REMINDER_KINDS = ['rappel_quotidien', 'rappel_hebdo'];

async function readPrefs(): Promise<{ load: PrefsLoad; values?: PrefsValues }> {
  try {
    const supabase = supabaseBrowser();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return { load: { status: 'signedOut' } };

    const [prefs, roles, sent] = await Promise.all([
      supabase.from('notification_prefs').select(SELECT).eq('user_id', user.id).maybeSingle(),
      supabase.from('memberships').select('role').eq('user_id', user.id),
      supabase
        .from('notification_log')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('status', 'envoye')
        .in('kind', REMINDER_KINDS)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (prefs.error || roles.error) {
      console.warn('[rappels] réglages illisibles :', prefs.error?.code ?? roles.error?.code ?? 'inconnu');
      return { load: { status: 'error' } };
    }
    const list = (roles.data ?? []).map((r) => r.role);
    const operatorOnly = list.length > 0 && list.every((r) => r === 'operator');
    const row = (prefs.data as PrefsRow | null) ?? null;
    return {
      load: {
        status: 'ready',
        userId: user.id,
        hasRow: row !== null,
        operatorOnly,
        operatorSomewhere: list.includes('operator'),
        // Le journal n'est qu'un complément : s'il est illisible, on s'en passe.
        lastSentAt: latest(row?.last_digest_at, sent.error ? null : sent.data?.created_at),
      },
      values: valuesFrom(row, operatorOnly),
    };
  } catch {
    return { load: { status: 'error' } };
  }
}

export function useNotificationPrefs() {
  const [load, setLoad] = useState<PrefsLoad>({ status: 'loading' });
  const [values, setValues] = useState<PrefsValues>(() => valuesFrom(null, false));
  const [saved, setSaved] = useState<PrefsValues | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const apply = useCallback((result: { load: PrefsLoad; values?: PrefsValues }) => {
    setLoad(result.load);
    if (result.values) {
      setValues(result.values);
      setSaved(result.values);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    readPrefs().then((result) => {
      if (alive) apply(result);
    });
    return () => {
      alive = false;
    };
  }, [apply]);

  const retry = useCallback(() => {
    setLoad({ status: 'loading' });
    readPrefs().then(apply);
  }, [apply]);

  /** Modifie la saisie (efface le message « enregistré » et l'erreur du champ modifié). */
  const update = useCallback((patch: Partial<PrefsValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      if ('leadDays' in patch) delete next.leadDays;
      if ('leadHours' in patch) delete next.leadHours;
      return next;
    });
    setStatus((s) => (s.kind === 'saved' || s.kind === 'error' ? { kind: 'idle' } : s));
  }, []);

  /** Enregistre (upsert de la ligne de la personne). Renvoie les champs en erreur, pour y placer le focus. */
  const save = useCallback(async (): Promise<FieldErrors> => {
    if (load.status !== 'ready') return {};
    const checked = validate(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus({ kind: 'error', reason: 'invalid' });
      return checked.errors;
    }
    setErrors({});
    setStatus({ kind: 'saving' });
    try {
      const { data, error } = await supabaseBrowser()
        .from('notification_prefs')
        .upsert({ user_id: load.userId, ...checked.row }, { onConflict: 'user_id' })
        .select(SELECT)
        .single();
      if (error || !data) {
        if (error) console.warn('[rappels] enregistrement refusé :', error.code || 'inconnu');
        setStatus({ kind: 'error', reason: errorKind(error) });
        return {};
      }
      const row = data as PrefsRow;
      const next = valuesFrom(row, false);
      setValues(next);
      setSaved(next);
      setLoad({ ...load, hasRow: true, lastSentAt: latest(load.lastSentAt, row.last_digest_at) });
      setStatus({ kind: 'saved' });
    } catch {
      setStatus({ kind: 'error', reason: 'network' });
    }
    return {};
  }, [load, values]);

  const dirty = useMemo(() => saved !== null && !sameValues(values, saved), [saved, values]);

  return { load, values, errors, status, dirty, update, save, retry };
}
