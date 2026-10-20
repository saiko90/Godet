-- Assistant IA et lecture du compteur d'heures sur photo : compteur d'usage mensuel par entreprise.
-- Les appels passent par la fonction Supabase « assistant » (clé de service) ; les membres lisent leur compteur.

create table if not exists public.ai_usage (
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- Premier jour du mois (heure suisse).
  month date not null,
  kind text not null check (kind in ('chat', 'photo')),
  count integer not null default 0,
  primary key (org_id, month, kind)
);

alter table public.ai_usage enable row level security;

create policy ai_usage_select on public.ai_usage
  for select to authenticated
  using ((select private.is_member(org_id)));

revoke all on public.ai_usage from anon;
revoke insert, update, delete on public.ai_usage from authenticated;
grant select on public.ai_usage to authenticated;

-- Consomme une unité si la limite du mois n'est pas atteinte. Renvoie le nouveau total, ou null si la limite est
-- atteinte. Réservée à la clé de service (fonction « assistant »).
create or replace function public.ai_consume(p_org uuid, p_kind text, p_limit integer)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage as u (org_id, month, kind, count)
  values (p_org, date_trunc('month', now() at time zone 'Europe/Zurich')::date, p_kind, 1)
  on conflict (org_id, month, kind) do update set count = u.count + 1 where u.count < p_limit
  returning u.count;
$$;

revoke execute on function public.ai_consume(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.ai_consume(uuid, text, integer) to service_role;
