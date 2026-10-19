import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { CarnetSheet, type CarnetData } from '@/components/site/carnet/CarnetSheet';
import { isUuid } from '@/components/site/nav';
import { todayISO } from '@/lib/format';
import { supabaseServer } from '@/lib/supabase/server';
import type { Entry } from '@/lib/types';

type Supabase = Awaited<ReturnType<typeof supabaseServer>>;
type Loaded = { kind: 'anon' } | { kind: 'missing' } | { kind: 'ok'; data: CarnetData };

const PAGE = 1000;

/** Toutes les saisies d'une machine, retirées comprises, par pages (l'API plafonne chaque réponse). */
async function allEntries(supabase: Supabase, machineId: string): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('machine_id', machineId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Carnet : saisies illisibles (${error.code})`);
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

async function mediaCount(supabase: Supabase, machineId: string, kind: 'photo' | 'video' | 'document'): Promise<number> {
  const { count, error } = await supabase
    .from('media')
    .select('id', { count: 'exact', head: true })
    .eq('machine_id', machineId)
    .eq('kind', kind);
  if (error) console.warn('[carnet] médias :', error.code, error.message);
  return count ?? 0;
}

/** Données du carnet, lues avec la session de la personne (la RLS ne laisse voir que son entreprise). */
const loadCarnet = cache(async (id: string): Promise<Loaded> => {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { kind: 'anon' };
  if (!isUuid(id)) return { kind: 'missing' };

  const { data: machine, error } = await supabase.from('machines').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Carnet : machine illisible (${error.code})`);
  if (!machine) return { kind: 'missing' };

  const since = new Date(Date.now() - 150 * 86_400_000).toISOString();
  const [orgRes, entries, schedulesRes, readingsRes, photo, video, document] = await Promise.all([
    supabase.from('organizations').select('name, canton').eq('id', machine.org_id).maybeSingle(),
    allEntries(supabase, machine.id),
    supabase.from('schedules').select('*').eq('machine_id', machine.id).eq('active', true),
    supabase.from('hour_readings').select('*').eq('machine_id', machine.id).gte('read_at', since).order('read_at'),
    mediaCount(supabase, machine.id, 'photo'),
    mediaCount(supabase, machine.id, 'video'),
    mediaCount(supabase, machine.id, 'document'),
  ]);
  if (schedulesRes.error) throw new Error(`Carnet : échéances illisibles (${schedulesRes.error.code})`);
  if (readingsRes.error) console.warn('[carnet] relevés :', readingsRes.error.code, readingsRes.error.message);

  // Noms des personnes qui ont saisi ou retiré des interventions (membres visibles par la RLS).
  const ids = [...new Set(entries.flatMap((e) => [e.created_by, e.deleted_by]).filter((v): v is string => Boolean(v)))];
  const people: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
    for (const p of profiles ?? []) people[p.id] = p.full_name?.trim() || p.email || '';
  }

  return {
    kind: 'ok',
    data: {
      orgName: orgRes.data?.name ?? '',
      orgCanton: orgRes.data?.canton ?? null,
      machine,
      entries,
      schedules: schedulesRes.data ?? [],
      readings: readingsRes.data ?? [],
      people,
      media: { photo, video, document },
      today: todayISO(),
    },
  };
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  let title = 'Carnet d’entretien';
  try {
    const loaded = await loadCarnet(id);
    if (loaded.kind === 'ok') title = `Carnet ${loaded.data.machine.code}`;
  } catch {
    // La page affichera l'erreur.
  }
  return { title, robots: { index: false, follow: false } };
}

export default async function CarnetPage({ params }: { params: Params }) {
  const { id } = await params;
  const loaded = await loadCarnet(id);
  if (loaded.kind === 'anon') redirect(`/connexion?suite=${encodeURIComponent(`/carnet/${id}`)}`);
  if (loaded.kind === 'missing') notFound();
  return <CarnetSheet data={loaded.data} />;
}
