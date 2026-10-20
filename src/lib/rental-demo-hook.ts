'use client';

// Locations de la démonstration, construites sur le parc d'exemple (même construction que le garage de démonstration).
import { useMessages } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { todayISO } from '@/lib/format';
import { initDemoRentals, useDemoRentals } from '@/lib/rental-demo';
import { buildDemoSeed } from '@/lib/repo/demo-data';

/** Parc d'exemple (même construction que le garage de démonstration) et locations de la visite. */
export function useDemoLocation() {
  const texts = useMessages().demo;
  const [seed] = useState(() => buildDemoSeed(todayISO(), texts));
  const machines = useMemo(() => seed.machines.filter((m) => !m.archived_at), [seed]);
  const inRepair = useMemo(
    () => new Set(seed.entries.filter((e) => e.kind === 'reparation' && (e.repair_status === 'en_cours' || e.repair_status === 'attente_piece') && !e.deleted_at).map((e) => e.machine_id)),
    [seed],
  );
  useEffect(() => {
    initDemoRentals(
      machines.map((m) => ({ id: m.id, code: m.code, kind: m.kind, hours: Number(m.hours) })),
      inRepair,
      seed.today,
    );
  }, [machines, inRepair, seed.today]);
  const state = useDemoRentals();
  const repairs = useMemo(() => {
    const map: Record<string, { title: string; date: string }> = {};
    for (const e of seed.entries)
      if (e.kind === 'reparation' && (e.repair_status === 'en_cours' || e.repair_status === 'attente_piece') && !e.deleted_at) map[e.machine_id] ??= { title: e.title, date: e.date };
    for (const b of state?.broken ?? []) map[b.machineId] ??= { title: b.note || '—', date: seed.today };
    return map;
  }, [seed, state]);
  return { seed, machines, state, repairs, orgName: texts.org };
}

