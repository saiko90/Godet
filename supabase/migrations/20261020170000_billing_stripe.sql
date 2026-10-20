-- Abonnements Stripe : formule, état, pack fondateur, limites de machines et lecture seule hors abonnement.
--
-- Formules (machines actives au plus) : essentiel 5, pro 20, parc 50. Pendant l'essai : pas de limite.
-- L'état est écrit uniquement par la fonction Supabase « stripe-webhook » (clé de service) ; jamais par l'application.
-- Essai : 15 jours pour les nouvelles entreprises (les essais en cours gardent leur date).

alter table public.organizations
  add column if not exists billing_tier text check (billing_tier in ('essentiel', 'pro', 'parc')),
  add column if not exists billing_interval text check (billing_interval in ('mois', 'annee')),
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists founder boolean not null default false,
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique;

alter table public.organizations alter column trial_ends_at set default (now() + interval '15 days');

comment on column public.organizations.billing_tier is 'Formule payée : essentiel (5 machines), pro (20), parc (50).';
comment on column public.organizations.founder is 'Pack fondateur : -30 % à vie (10 premières entreprises abonnées).';

-- Garde-fou : ces colonnes ne se modifient pas depuis l'application (seulement la clé de service).
create or replace function private.org_guard_billing()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not private.is_platform_admin() then
    if new.plan is distinct from old.plan
       or new.trial_ends_at is distinct from old.trial_ends_at
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at
       or new.id is distinct from old.id
       or new.billing_tier is distinct from old.billing_tier
       or new.billing_interval is distinct from old.billing_interval
       or new.subscription_status is distinct from old.subscription_status
       or new.current_period_end is distinct from old.current_period_end
       or new.cancel_at_period_end is distinct from old.cancel_at_period_end
       or new.founder is distinct from old.founder
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
      raise exception 'billing_locked' using errcode = '42501',
        hint = 'les champs d''abonnement ne se modifient pas depuis l''application';
    end if;
  end if;
  return new;
end;
$$;

-- Machines autorisées par formule (null : sans limite).
create or replace function private.tier_limit(p_tier text)
returns integer language sql immutable set search_path = '' as $$
  select case p_tier when 'essentiel' then 5 when 'pro' then 20 when 'parc' then 50 else null end;
$$;

-- L'entreprise peut-elle écrire ? Essai en cours, ou abonnement actif.
create or replace function private.org_writable(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organizations o
    where o.id = p_org
      and (o.plan = 'actif' or (o.plan = 'essai' and o.trial_ends_at > now()))
  );
$$;
revoke execute on function private.org_writable(uuid) from public, anon;
grant execute on function private.org_writable(uuid) to authenticated;

-- Lecture seule hors abonnement : les écritures des personnes (rôle authenticated) sont refusées.
-- Les déclencheurs internes (SECURITY DEFINER) et la clé de service ne sont pas concernés.
create or replace function private.guard_writable()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_org uuid := case when tg_op = 'DELETE' then old.org_id else new.org_id end;
begin
  if current_user = 'authenticated' and not private.is_platform_admin() and not private.org_writable(v_org) then
    raise exception 'subscription_inactive' using errcode = 'P0001',
      hint = 'essai terminé ou abonnement inactif : le garage est en lecture seule';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke execute on function private.guard_writable() from public, anon, authenticated;

-- Insertions et modifications (les suppressions ne servent qu'aux médias : laissées libres).
create or replace trigger machines_guard_writable before insert or update on public.machines
  for each row execute function private.guard_writable();
create or replace trigger entries_guard_writable before insert or update on public.entries
  for each row execute function private.guard_writable();
create or replace trigger schedules_guard_writable before insert or update on public.schedules
  for each row execute function private.guard_writable();
create or replace trigger hour_readings_guard_writable before insert or update on public.hour_readings
  for each row execute function private.guard_writable();
create or replace trigger media_guard_writable before insert or update on public.media
  for each row execute function private.guard_writable();

-- Limite de machines de la formule (nouvelle machine, ou machine sortie des archives).
create or replace function private.guard_machine_limit()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_tier text;
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if current_user <> 'authenticated' or private.is_platform_admin() then return new; end if;
  if new.archived_at is not null then return new; end if;
  if tg_op = 'UPDATE' and old.archived_at is null then return new; end if;
  select o.billing_tier, o.plan into v_tier, v_plan from public.organizations o where o.id = new.org_id;
  if v_plan <> 'actif' then return new; end if;
  v_limit := private.tier_limit(v_tier);
  if v_limit is null then return new; end if;
  select count(*) into v_count from public.machines m
    where m.org_id = new.org_id and m.archived_at is null and m.id <> new.id;
  if v_count >= v_limit then
    raise exception 'plan_limit' using errcode = 'P0001',
      hint = format('formule %s : %s machines au plus', v_tier, v_limit);
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_machine_limit() from public, anon, authenticated;

create or replace trigger machines_guard_limit
  before insert or update of archived_at on public.machines
  for each row execute function private.guard_machine_limit();

-- Places restantes du pack fondateur (affichées sur le site et dans les paramètres).
create or replace function public.founder_slots_left()
returns integer language sql stable security definer set search_path = '' as $$
  select greatest(0, 10 - (select count(*) from public.organizations where founder))::integer;
$$;
revoke execute on function public.founder_slots_left() from public;
grant execute on function public.founder_slots_left() to anon, authenticated;
