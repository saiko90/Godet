-- Godet : schéma initial.
-- Une entreprise (organization) possède des machines. Chaque machine a un carnet (entries),
-- des échéances (schedules), des relevés d'heures (hour_readings) et des médias (media).
-- Accès : uniquement les membres de l'entreprise (RLS). Rien ne s'efface dans le carnet :
-- l'art. 32b OPA demande de consigner les résultats d'entretien, on archive au lieu de supprimer.
-- Les fonctions internes vivent dans le schéma « private », qui n'est pas exposé par l'API.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.member_role as enum ('owner', 'admin', 'mechanic', 'operator');
create type public.machine_kind as enum ('pelle', 'mini_pelle', 'chargeuse', 'dumper', 'camion', 'grue', 'rouleau', 'autre');
create type public.entry_kind as enum ('service', 'reparation', 'piece', 'controle', 'inspection', 'note');
create type public.repair_status as enum ('fait', 'en_cours', 'attente_piece');
create type public.schedule_basis as enum ('heures', 'date');
create type public.media_kind as enum ('photo', 'video', 'document');

-- ---------------------------------------------------------------- tables

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  canton text check (char_length(canton) <= 2),
  plan text not null default 'essai' check (plan in ('essai', 'actif', 'suspendu')),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index organizations_created_by_idx on public.organizations (created_by);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  email text check (char_length(email) <= 200),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'operator',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (position('@' in email) > 1 and char_length(email) <= 200),
  role public.member_role not null default 'operator' check (role <> 'owner'),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);
create index invitations_org_idx on public.invitations (org_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_accepted_by_idx on public.invitations (accepted_by);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  code text not null check (char_length(trim(code)) between 1 and 16),
  kind public.machine_kind not null default 'pelle',
  brand text check (char_length(brand) <= 40),
  model text check (char_length(model) <= 40),
  year int check (year between 1950 and 2100),
  serial text check (char_length(serial) <= 40),
  plate text check (char_length(plate) <= 20),
  weight_t numeric(5,1) check (weight_t > 0 and weight_t < 1000),
  color text not null default '#f3b71b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  hours numeric(8,1) not null default 0 check (hours >= 0),
  hours_at timestamptz not null default now(),
  position int not null default 0,
  notes text check (char_length(notes) <= 2000),
  archived_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index machines_org_idx on public.machines (org_id);
create index machines_created_by_idx on public.machines (created_by);
create unique index machines_code_unique on public.machines (org_id, lower(code)) where archived_at is null;

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  basis public.schedule_basis not null,
  interval_hours numeric(8,1) check (interval_hours > 0),
  interval_days int check (interval_days > 0),
  last_hours numeric(8,1),
  last_date date,
  due_hours numeric(8,1),
  due_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check ((basis = 'heures' and due_hours is not null) or (basis = 'date' and due_date is not null))
);
create index schedules_machine_idx on public.schedules (machine_id);
create index schedules_org_idx on public.schedules (org_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  kind public.entry_kind not null,
  date date not null default current_date,
  hours numeric(8,1) check (hours >= 0),
  title text not null check (char_length(trim(title)) between 1 and 120),
  details text check (char_length(details) <= 4000),
  performed_by text check (char_length(performed_by) <= 80),
  cost_parts numeric(10,2) not null default 0 check (cost_parts >= 0),
  cost_labour numeric(10,2) not null default 0 check (cost_labour >= 0),
  downtime_hours numeric(6,1) check (downtime_hours >= 0),
  repair_status public.repair_status,
  part_ref text check (char_length(part_ref) <= 40),
  part_qty numeric(8,2) check (part_qty > 0),
  supplier text check (char_length(supplier) <= 80),
  warranty_until date,
  schedule_id uuid references public.schedules (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  delete_reason text check (char_length(delete_reason) <= 300)
);
create index entries_machine_idx on public.entries (machine_id, date desc);
create index entries_org_idx on public.entries (org_id, date desc);
create index entries_schedule_idx on public.entries (schedule_id);
create index entries_created_by_idx on public.entries (created_by);
create index entries_deleted_by_idx on public.entries (deleted_by);

create table public.hour_readings (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  hours numeric(8,1) not null check (hours >= 0),
  read_at timestamptz not null default now(),
  source text not null default 'saisie' check (source in ('saisie', 'intervention', 'creation')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);
create index hour_readings_machine_idx on public.hour_readings (machine_id, read_at desc);
create index hour_readings_org_idx on public.hour_readings (org_id);
create index hour_readings_created_by_idx on public.hour_readings (created_by);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  machine_id uuid not null references public.machines (id) on delete cascade,
  entry_id uuid references public.entries (id) on delete set null,
  kind public.media_kind not null,
  path text not null unique,
  mime text check (char_length(mime) <= 100),
  size_bytes bigint check (size_bytes >= 0),
  caption text check (char_length(caption) <= 200),
  taken_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index media_machine_idx on public.media (machine_id, taken_at desc);
create index media_org_idx on public.media (org_id);
create index media_entry_idx on public.media (entry_id);
create index media_created_by_idx on public.media (created_by);

-- Pas de clé étrangère sur org_id : le journal doit survivre aux suppressions en cascade.
create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid,
  actor uuid default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log (org_id, at desc);

-- ---------------------------------------------------------------- fonctions d'accès (privées)

create or replace function private.is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = (select auth.uid()));
$$;

create or replace function private.has_role(p_org uuid, p_roles public.member_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid()) and m.role = any (p_roles)
  );
$$;

create or replace function private.member_org_texts()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(m.org_id::text), '{}') from public.memberships m where m.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------- déclencheurs

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger machines_touch before update on public.machines for each row execute function private.touch_updated_at();
create trigger entries_touch before update on public.entries for each row execute function private.touch_updated_at();

-- L'entreprise d'une saisie est toujours celle de sa machine (impossible de la falsifier).
create or replace function private.inherit_machine_org()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m_org uuid;
begin
  select m.org_id into m_org from public.machines m where m.id = new.machine_id;
  if m_org is null then
    raise exception 'Machine introuvable';
  end if;
  new.org_id := m_org;
  return new;
end;
$$;
create trigger entries_org before insert or update of machine_id, org_id on public.entries for each row execute function private.inherit_machine_org();
create trigger schedules_org before insert or update of machine_id, org_id on public.schedules for each row execute function private.inherit_machine_org();
create trigger readings_org before insert on public.hour_readings for each row execute function private.inherit_machine_org();
create trigger media_org before insert or update of machine_id, org_id on public.media for each row execute function private.inherit_machine_org();

-- Un relevé d'heures fait avancer le compteur de la machine (jamais reculer).
create or replace function private.bump_machine_hours()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.machines m
     set hours = new.hours,
         hours_at = greatest(m.hours_at, new.read_at)
   where m.id = new.machine_id
     and (new.hours > m.hours or (new.hours = m.hours and new.read_at > m.hours_at));
  return new;
end;
$$;
create trigger readings_bump after insert on public.hour_readings for each row execute function private.bump_machine_hours();

-- Une saisie avec compteur crée un relevé ; une saisie liée à une échéance la renouvelle.
create or replace function private.entry_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base numeric;
begin
  if new.hours is not null then
    insert into public.hour_readings (org_id, machine_id, hours, read_at, source, created_by)
    values (new.org_id, new.machine_id, new.hours, (new.date::timestamp + interval '12 hours') at time zone 'Europe/Zurich', 'intervention', new.created_by);
  end if;
  if new.schedule_id is not null then
    select coalesce(new.hours, m.hours) into base from public.machines m where m.id = new.machine_id;
    update public.schedules s
       set last_hours = coalesce(base, s.last_hours),
           last_date = new.date,
           due_hours = case
             when s.basis = 'heures' and s.interval_hours is not null then coalesce(base, s.due_hours) + s.interval_hours
             else s.due_hours end,
           due_date = case
             when s.basis = 'date' and s.interval_days is not null then new.date + s.interval_days
             else s.due_date end,
           active = case
             when (s.basis = 'heures' and s.interval_hours is null) or (s.basis = 'date' and s.interval_days is null) then false
             else s.active end
     where s.id = new.schedule_id and s.machine_id = new.machine_id;
  end if;
  return new;
end;
$$;
create trigger entries_after_insert after insert on public.entries for each row execute function private.entry_after_insert();

-- Nouvelle machine : relevé initial et échéances par défaut (service toutes les 500 h, contrôle annuel).
create or replace function private.machine_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base numeric := coalesce(new.hours, 0);
begin
  insert into public.hour_readings (org_id, machine_id, hours, read_at, source, created_by)
  values (new.org_id, new.id, base, now(), 'creation', new.created_by);
  if coalesce(current_setting('godet.skip_defaults', true), '') <> 'on' then
    insert into public.schedules (org_id, machine_id, label, basis, interval_hours, last_hours, due_hours)
    values (new.org_id, new.id, 'Service', 'heures', 500, floor(base / 500) * 500, (floor(base / 500) + 1) * 500);
    insert into public.schedules (org_id, machine_id, label, basis, interval_days, due_date)
    values (new.org_id, new.id, 'Contrôle annuel de sécurité', 'date', 365, current_date + 365);
  end if;
  return new;
end;
$$;
create trigger machines_after_insert after insert on public.machines for each row execute function private.machine_after_insert();

-- Journal : qui a changé quoi, et quand (sauf la simple avance du compteur d'heures).
create or replace function private.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and tg_table_name = 'machines'
     and (to_jsonb(new) - array['hours', 'hours_at', 'updated_at']) = (to_jsonb(old) - array['hours', 'hours_at', 'updated_at']) then
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
create trigger audit_machines after insert or update or delete on public.machines for each row execute function private.audit_row();
create trigger audit_entries after insert or update or delete on public.entries for each row execute function private.audit_row();
create trigger audit_schedules after insert or update or delete on public.schedules for each row execute function private.audit_row();

-- Profil créé à l'inscription (nom saisi dans le formulaire), e-mail tenu à jour.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.handle_user_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_email after update of email on auth.users for each row execute function private.handle_user_email();

revoke execute on all functions in schema private from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.member_org_texts() to authenticated;

-- ---------------------------------------------------------------- fonctions appelées par l'app

create or replace function public.create_organization(p_name text, p_canton text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  oid uuid;
begin
  if uid is null then
    raise exception 'Connexion requise';
  end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Le nom de l’entreprise est trop court';
  end if;
  insert into public.profiles (id, email) values (uid, (select auth.jwt()) ->> 'email') on conflict (id) do nothing;
  insert into public.organizations (name, canton, created_by)
  values (trim(p_name), nullif(upper(trim(coalesce(p_canton, ''))), ''), uid)
  returning id into oid;
  insert into public.memberships (org_id, user_id, role) values (oid, uid, 'owner');
  return oid;
end;
$$;

create or replace function public.invitation_info(p_token text)
returns table (org_name text, email text, role public.member_role, expired boolean, accepted boolean)
language sql stable security definer set search_path = '' as $$
  select o.name, i.email, i.role, i.expires_at < now(), i.accepted_at is not null
  from public.invitations i join public.organizations o on o.id = i.org_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  inv public.invitations;
  mail text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
begin
  if uid is null then
    raise exception 'Connexion requise';
  end if;
  select * into inv from public.invitations where token = p_token for update;
  if not found then
    raise exception 'Invitation introuvable';
  end if;
  if inv.accepted_at is not null then
    raise exception 'Cette invitation a déjà été utilisée';
  end if;
  if inv.expires_at < now() then
    raise exception 'Cette invitation a expiré, demandez-en une nouvelle';
  end if;
  if lower(inv.email) <> mail then
    raise exception 'Cette invitation est prévue pour %', inv.email;
  end if;
  insert into public.profiles (id, email) values (uid, mail) on conflict (id) do nothing;
  insert into public.memberships (org_id, user_id, role) values (inv.org_id, uid, inv.role)
  on conflict (org_id, user_id) do nothing;
  update public.invitations set accepted_at = now(), accepted_by = uid where id = inv.id;
  return inv.org_id;
end;
$$;

revoke execute on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.invitation_info(text) to anon, authenticated;

-- ---------------------------------------------------------------- sécurité au niveau des lignes

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.machines enable row level security;
alter table public.schedules enable row level security;
alter table public.entries enable row level security;
alter table public.hour_readings enable row level security;
alter table public.media enable row level security;
alter table public.audit_log enable row level security;

create policy org_select on public.organizations for select to authenticated
  using (private.is_member(id));
create policy org_update on public.organizations for update to authenticated
  using (private.has_role(id, array['owner', 'admin']::public.member_role[]))
  with check (private.has_role(id, array['owner', 'admin']::public.member_role[]));

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.memberships a join public.memberships b on a.org_id = b.org_id
      where a.user_id = (select auth.uid()) and b.user_id = profiles.id
    )
  );
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy memberships_select on public.memberships for select to authenticated
  using (private.is_member(org_id));
create policy memberships_update on public.memberships for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.member_role[]) and role <> 'owner')
  with check (private.has_role(org_id, array['owner', 'admin']::public.member_role[]) and role <> 'owner');
create policy memberships_delete on public.memberships for delete to authenticated
  using (role <> 'owner' and (private.has_role(org_id, array['owner', 'admin']::public.member_role[]) or user_id = (select auth.uid())));

create policy invitations_all on public.invitations for all to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.member_role[]))
  with check (private.has_role(org_id, array['owner', 'admin']::public.member_role[]));

create policy machines_select on public.machines for select to authenticated
  using (private.is_member(org_id));
create policy machines_insert on public.machines for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]));
create policy machines_update on public.machines for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]))
  with check (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]));

create policy schedules_select on public.schedules for select to authenticated
  using (private.is_member(org_id));
create policy schedules_insert on public.schedules for insert to authenticated
  with check (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]));
create policy schedules_update on public.schedules for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]))
  with check (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]));
create policy schedules_delete on public.schedules for delete to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]));

create policy entries_select on public.entries for select to authenticated
  using (private.is_member(org_id));
create policy entries_insert on public.entries for insert to authenticated
  with check (private.is_member(org_id) and created_by = (select auth.uid()));
create policy entries_update on public.entries for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]) or created_by = (select auth.uid()))
  with check (private.is_member(org_id));

create policy readings_select on public.hour_readings for select to authenticated
  using (private.is_member(org_id));
create policy readings_insert on public.hour_readings for insert to authenticated
  with check (private.is_member(org_id) and created_by = (select auth.uid()));

create policy media_select on public.media for select to authenticated
  using (private.is_member(org_id));
create policy media_insert on public.media for insert to authenticated
  with check (private.is_member(org_id) and created_by = (select auth.uid()));
create policy media_update on public.media for update to authenticated
  using (private.has_role(org_id, array['owner', 'admin', 'mechanic']::public.member_role[]) or created_by = (select auth.uid()))
  with check (private.is_member(org_id));
create policy media_delete on public.media for delete to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.member_role[]) or created_by = (select auth.uid()));

create policy audit_select on public.audit_log for select to authenticated
  using (private.has_role(org_id, array['owner', 'admin']::public.member_role[]));

-- ---------------------------------------------------------------- stockage des photos et vidéos
-- Chemin : <org_id>/<machine_id>/<fichier>. Lecture et dépôt réservés aux membres de l'entreprise.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medias', 'medias', false, 104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf']
)
on conflict (id) do nothing;

create policy medias_read on storage.objects for select to authenticated
  using (bucket_id = 'medias' and (storage.foldername(name))[1] = any (private.member_org_texts()));
create policy medias_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'medias' and (storage.foldername(name))[1] = any (private.member_org_texts()));
create policy medias_delete on storage.objects for delete to authenticated
  using (bucket_id = 'medias' and (storage.foldername(name))[1] = any (private.member_org_texts()) and owner_id = (select auth.uid())::text);
