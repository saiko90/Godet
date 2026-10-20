-- Module Location (option payante, incluse pendant l'essai) : réservations, locations en cours et états des lieux
-- départ / retour avec photos, vidéos et signatures.

create extension if not exists btree_gist with schema extensions;

-- Option souscrite (écrite par Stripe via la clé de service, comme les autres champs d'abonnement).
alter table public.organizations add column if not exists rental_addon boolean not null default false;

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
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.rental_addon is distinct from old.rental_addon then
      raise exception 'billing_locked' using errcode = '42501',
        hint = 'les champs d''abonnement ne se modifient pas depuis l''application';
    end if;
  end if;
  return new;
end;
$$;

-- Location disponible : pendant l'essai, ou avec l'option sur un abonnement actif.
create or replace function private.rental_enabled(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organizations o
    where o.id = p_org
      and ((o.plan = 'essai' and o.trial_ends_at > now()) or (o.plan = 'actif' and o.rental_addon))
  );
$$;
revoke execute on function private.rental_enabled(uuid) from public, anon;
grant execute on function private.rental_enabled(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- locations

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  status text not null default 'reservee' check (status in ('reservee', 'en_cours', 'terminee', 'annulee')),
  client_company text check (char_length(client_company) <= 120),
  client_name text not null check (char_length(client_name) between 1 and 120),
  client_phone text check (char_length(client_phone) <= 40),
  client_email text check (char_length(client_email) <= 200),
  site text check (char_length(site) <= 300),
  delivery text not null default 'enlevement' check (delivery in ('livraison', 'enlevement')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  out_at timestamptz,
  back_at timestamptz,
  notes text check (char_length(notes) <= 2000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rentals_dates check (end_at > start_at),
  -- Une machine ne peut pas être réservée ou louée deux fois sur la même période.
  constraint rentals_no_overlap exclude using gist (
    machine_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('reservee', 'en_cours'))
);
create index if not exists rentals_org_idx on public.rentals (org_id, start_at);
create index if not exists rentals_machine_idx on public.rentals (machine_id, start_at);
create index if not exists rentals_created_by_idx on public.rentals (created_by);

-- ---------------------------------------------------------------- états des lieux (départ, retour)

create table if not exists public.rental_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  rental_id uuid not null references public.rentals (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  kind text not null check (kind in ('depart', 'retour')),
  -- { "<point>": { "state": "ok" | "defaut" | "na", "comment": "…" } }
  items jsonb not null default '{}'::jsonb,
  fuel_level text check (fuel_level in ('vide', '1/4', '1/2', '3/4', 'plein')),
  hours numeric(10, 1) check (hours >= 0),
  accessories text check (char_length(accessories) <= 1000),
  accident boolean not null default false,
  accident_note text check (char_length(accident_note) <= 1000),
  safety_valid boolean,
  safety_until date,
  keys_count smallint check (keys_count between 0 and 20),
  remarks text check (char_length(remarks) <= 3000),
  -- [{ "label": "Plein", "amount": 85 }]
  charges jsonb not null default '[]'::jsonb,
  reserves boolean,
  client_signer text not null check (char_length(client_signer) between 1 and 120),
  client_signature text not null,
  staff_signer text check (char_length(staff_signer) <= 120),
  staff_signature text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  report_path text,
  emailed_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (rental_id, kind)
);
create index if not exists rental_checks_org_idx on public.rental_checks (org_id, created_at desc);
create index if not exists rental_checks_machine_idx on public.rental_checks (machine_id);
create index if not exists rental_checks_created_by_idx on public.rental_checks (created_by);

-- Photos et vidéos d'un état des lieux : des médias de la machine, avec leur emplacement (avant, arrière…).
alter table public.media
  add column if not exists rental_check_id uuid references public.rental_checks (id) on delete set null,
  add column if not exists slot text check (char_length(slot) <= 40);
create index if not exists media_rental_check_idx on public.media (rental_check_id);

-- ---------------------------------------------------------------- règles

-- Organisation et machine héritées (comme les saisies).
create or replace trigger rentals_org before insert or update of machine_id, org_id on public.rentals
  for each row execute function private.inherit_machine_org();
create or replace trigger rental_checks_org before insert on public.rental_checks
  for each row execute function private.inherit_machine_org();
create or replace trigger rentals_touch before update on public.rentals
  for each row execute function private.touch_updated_at();

-- Écriture : option Location active (pendant l'essai ou souscrite).
create or replace function private.guard_rental()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if current_user = 'authenticated' and not private.is_platform_admin() and not private.rental_enabled(new.org_id) then
    raise exception 'rental_disabled' using errcode = 'P0001',
      hint = 'option Location non active pour cette entreprise';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_rental() from public, anon, authenticated;
create or replace trigger rentals_guard before insert or update on public.rentals
  for each row execute function private.guard_rental();
create or replace trigger rental_checks_guard before insert on public.rental_checks
  for each row execute function private.guard_rental();

-- Un état des lieux fait avancer la location : départ → en cours, retour → terminée ; le compteur crée un relevé.
create or replace function private.rental_check_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'depart' then
    update public.rentals set status = 'en_cours', out_at = new.created_at where id = new.rental_id and status = 'reservee';
  else
    update public.rentals set status = 'terminee', back_at = new.created_at where id = new.rental_id and status = 'en_cours';
  end if;
  if new.hours is not null then
    insert into public.hour_readings (org_id, machine_id, hours, read_at, source, created_by, lat, lng)
    select new.org_id, new.machine_id, new.hours, new.created_at, 'location', new.created_by, new.lat, new.lng
    where new.hours >= (select m.hours from public.machines m where m.id = new.machine_id);
  end if;
  return new;
end;
$$;
create or replace trigger rental_checks_after_insert after insert on public.rental_checks
  for each row execute function private.rental_check_after_insert();

-- Ordre des étapes : départ sur une réservation, retour sur une location en cours.
create or replace function private.rental_check_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
begin
  select status into v_status from public.rentals where id = new.rental_id and machine_id = new.machine_id;
  if v_status is null then
    raise exception 'rental_not_found' using errcode = 'P0001';
  end if;
  if (new.kind = 'depart' and v_status <> 'reservee') or (new.kind = 'retour' and v_status <> 'en_cours') then
    raise exception 'rental_wrong_step' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create or replace trigger rental_checks_before_insert before insert on public.rental_checks
  for each row execute function private.rental_check_before_insert();

alter table public.rentals enable row level security;
alter table public.rental_checks enable row level security;

create policy rentals_select on public.rentals for select to authenticated
  using ((select private.is_member(org_id)));
create policy rentals_insert on public.rentals for insert to authenticated
  with check ((select private.is_member(org_id)) and created_by = (select auth.uid()));
create policy rentals_update on public.rentals for update to authenticated
  using ((select private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[])) or created_by = (select auth.uid()))
  with check ((select private.is_member(org_id)));

create policy rental_checks_select on public.rental_checks for select to authenticated
  using ((select private.is_member(org_id)));
create policy rental_checks_insert on public.rental_checks for insert to authenticated
  with check ((select private.is_member(org_id)) and created_by = (select auth.uid()));
-- Un état des lieux signé ne se modifie pas (pas de politique update / delete).

revoke all on public.rentals, public.rental_checks from anon;
grant select, insert, update on public.rentals to authenticated;
grant select, insert on public.rental_checks to authenticated;
grant all on public.rentals, public.rental_checks to service_role;

create or replace trigger audit_rentals after insert or update on public.rentals
  for each row execute function private.audit_row();
create or replace trigger audit_rental_checks after insert on public.rental_checks
  for each row execute function private.audit_row();

-- Journal : la mise à jour automatique de la dernière position d'une machine n'est pas un changement à tracer.
create or replace function private.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and tg_table_name = 'machines'
     and (to_jsonb(new) - array['hours', 'hours_at', 'updated_at', 'last_lat', 'last_lng', 'last_loc_accuracy', 'last_located_at'])
       = (to_jsonb(old) - array['hours', 'hours_at', 'updated_at', 'last_lat', 'last_lng', 'last_loc_accuracy', 'last_located_at']) then
    return new;
  end if;
  insert into public.audit_log (org_id, actor, action, entity, entity_id, details)
  values (
    case when tg_op = 'DELETE' then old.org_id else new.org_id end,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case
      when tg_op = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
      when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      else jsonb_build_object('new', to_jsonb(new))
    end
  );
  return coalesce(new, old);
end;
$$;
