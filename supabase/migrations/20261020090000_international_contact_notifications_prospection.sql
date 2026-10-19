-- Godet international : pays, devise et langue ; formulaire de contact et boîte à idées ; préférences de rappels
-- par e-mail ; fichier de prospection des agents ; administration de la plateforme (Swiss Digital Studio).
-- Aucune suppression : les anciennes fonctions restent en place, les nouvelles portent un nom distinct.

-- ---------------------------------------------------------------- pays, devise, langue

alter table public.organizations add column if not exists country text not null default 'CH' check (country ~ '^[A-Z]{2}$');
alter table public.organizations add column if not exists currency text not null default 'CHF' check (currency in ('CHF', 'EUR', 'GBP', 'USD'));
alter table public.profiles add column if not exists locale text not null default 'fr' check (locale in ('fr', 'de', 'it', 'en'));
alter table public.profiles add column if not exists signup_ref text check (char_length(signup_ref) <= 40);

create or replace function private.currency_for(p_country text)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_country in ('CH', 'LI') then 'CHF'
    when p_country = 'GB' then 'GBP'
    when p_country = 'US' then 'USD'
    else 'EUR' end;
$$;

-- Inscription : nom, langue et code de suivi (lien de démo d'un agent) repris du formulaire.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
  v_ref text := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'ref', '')), 40), '');
begin
  if v_locale is null or v_locale not in ('fr', 'de', 'it', 'en') then
    v_locale := 'fr';
  end if;
  insert into public.profiles (id, full_name, email, locale, signup_ref)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email, v_locale, v_ref)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Création d'une entreprise avec son pays (la devise en découle) et la langue de la personne.
create or replace function public.create_org(p_name text, p_country text default 'CH', p_canton text default null, p_locale text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  oid uuid;
  v_country text := upper(coalesce(nullif(trim(p_country), ''), 'CH'));
begin
  if uid is null then
    raise exception 'auth_required';
  end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'org_name_too_short';
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country';
  end if;
  insert into public.profiles (id, email) values (uid, (select auth.jwt()) ->> 'email') on conflict (id) do nothing;
  if p_locale in ('fr', 'de', 'it', 'en') then
    update public.profiles set locale = p_locale where id = uid;
  end if;
  insert into public.organizations (name, canton, country, currency, created_by)
  values (
    trim(p_name),
    case when v_country = 'CH' then nullif(upper(trim(coalesce(p_canton, ''))), '') end,
    v_country,
    private.currency_for(v_country),
    uid
  )
  returning id into oid;
  insert into public.memberships (org_id, user_id, role) values (oid, uid, 'owner');
  return oid;
end;
$$;
revoke execute on function public.create_org(text, text, text, text) from public, anon;
grant execute on function public.create_org(text, text, text, text) to authenticated;

-- Machine de démonstration dans la langue de la personne : le contenu (traduit) est fourni par l'application.
-- Dates en jours relatifs à aujourd'hui (négatif = passé). Limites pour éviter les abus.
create or replace function public.create_demo_machine_v2(p_org uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  mid uuid;
  m jsonb := p_payload -> 'machine';
  v_code text := upper(left(coalesce(nullif(trim(p_payload -> 'machine' ->> 'code'), ''), 'PE-01'), 16));
  n int := 1;
  e jsonb;
begin
  if not private.has_role(p_org, array['owner', 'admin', 'mechanic']::public.member_role[]) then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(m) <> 'object'
     or jsonb_typeof(coalesce(p_payload -> 'entries', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_payload -> 'entries', '[]'::jsonb)) > 100
     or jsonb_array_length(coalesce(p_payload -> 'schedules', '[]'::jsonb)) > 20
     or jsonb_array_length(coalesce(p_payload -> 'readings', '[]'::jsonb)) > 50 then
    raise exception 'invalid_demo_payload';
  end if;
  while exists (
    select 1 from public.machines x where x.org_id = p_org and lower(x.code) = lower(v_code) and x.archived_at is null
  ) loop
    n := n + 1;
    v_code := 'DEMO-' || lpad(n::text, 2, '0');
  end loop;

  perform set_config('godet.skip_defaults', 'on', true);
  insert into public.machines (org_id, code, kind, brand, model, year, serial, weight_t, color, hours, notes)
  values (
    p_org, v_code,
    coalesce((m ->> 'kind')::public.machine_kind, 'pelle'),
    left(m ->> 'brand', 40), left(m ->> 'model', 40), (m ->> 'year')::int, left(m ->> 'serial', 40),
    (m ->> 'weight_t')::numeric, coalesce(m ->> 'color', '#f3b71b'), coalesce((m ->> 'hours')::numeric, 0), left(m ->> 'notes', 2000)
  )
  returning id into mid;
  perform set_config('godet.skip_defaults', 'off', true);

  for e in select * from jsonb_array_elements(coalesce(p_payload -> 'entries', '[]'::jsonb)) loop
    insert into public.entries (org_id, machine_id, kind, date, hours, title, details, performed_by,
                                cost_parts, cost_labour, downtime_hours, repair_status, part_ref, part_qty, supplier, warranty_until)
    values (
      p_org, mid, (e ->> 'kind')::public.entry_kind, current_date + coalesce((e ->> 'day')::int, 0), (e ->> 'hours')::numeric,
      left(e ->> 'title', 120), left(e ->> 'details', 4000), left(e ->> 'performed_by', 80),
      coalesce((e ->> 'cost_parts')::numeric, 0), coalesce((e ->> 'cost_labour')::numeric, 0), (e ->> 'downtime_hours')::numeric,
      (e ->> 'repair_status')::public.repair_status, left(e ->> 'part_ref', 40), (e ->> 'part_qty')::numeric, left(e ->> 'supplier', 80),
      case when e ? 'warranty_day' then current_date + (e ->> 'warranty_day')::int end
    );
  end loop;

  for e in select * from jsonb_array_elements(coalesce(p_payload -> 'readings', '[]'::jsonb)) loop
    insert into public.hour_readings (org_id, machine_id, hours, read_at, source)
    values (p_org, mid, (e ->> 'hours')::numeric, now() + make_interval(days => coalesce((e ->> 'day')::int, 0)), 'saisie');
  end loop;

  for e in select * from jsonb_array_elements(coalesce(p_payload -> 'schedules', '[]'::jsonb)) loop
    insert into public.schedules (org_id, machine_id, label, basis, interval_hours, interval_days, last_hours, last_date, due_hours, due_date)
    values (
      p_org, mid, left(e ->> 'label', 80), (e ->> 'basis')::public.schedule_basis,
      (e ->> 'interval_hours')::numeric, (e ->> 'interval_days')::int, (e ->> 'last_hours')::numeric,
      case when e ? 'last_day' then current_date + (e ->> 'last_day')::int end,
      (e ->> 'due_hours')::numeric,
      case when e ? 'due_day' then current_date + (e ->> 'due_day')::int end
    );
  end loop;

  return mid;
end;
$$;
revoke execute on function public.create_demo_machine_v2(uuid, jsonb) from public, anon;
grant execute on function public.create_demo_machine_v2(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------- administration de la plateforme

create table if not exists private.platform_admin_emails (
  email text primary key check (position('@' in email) > 1)
);

-- Administrateur de la plateforme = adresse inscrite ci-dessus ET confirmée (preuve d'accès à la boîte e-mail).
create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    join private.platform_admin_emails a on lower(a.email) = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;
revoke execute on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function public.is_platform_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_platform_admin();
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------- contact et boîte à idées

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact', 'demo', 'partenaire', 'support')),
  name text check (char_length(name) <= 120),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 200),
  company text check (char_length(company) <= 120),
  phone text check (char_length(phone) <= 40),
  country text check (country ~ '^[A-Z]{2}$'),
  locale text check (locale in ('fr', 'de', 'it', 'en')),
  fleet_size text check (char_length(fleet_size) <= 20),
  message text not null check (char_length(trim(message)) between 1 and 4000),
  source text check (char_length(source) <= 200),
  consent boolean not null default false,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'nouveau' check (status in ('nouveau', 'en_cours', 'traite', 'spam')),
  admin_note text check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);
create index contact_messages_email_idx on public.contact_messages (email, created_at desc);
create index contact_messages_user_idx on public.contact_messages (user_id);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  org_id uuid references public.organizations (id) on delete set null,
  email text check (position('@' in email) > 1 and char_length(email) <= 200),
  locale text check (locale in ('fr', 'de', 'it', 'en')),
  category text not null default 'autre' check (category in ('3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre')),
  title text not null check (char_length(trim(title)) between 3 and 120),
  details text check (char_length(details) <= 4000),
  status text not null default 'nouvelle' check (status in ('nouvelle', 'a_l_etude', 'prevue', 'faite', 'refusee')),
  admin_note text check (char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ideas_user_idx on public.ideas (user_id, created_at desc);
create index ideas_org_idx on public.ideas (org_id);
create index ideas_created_idx on public.ideas (created_at desc);
create trigger ideas_touch before update on public.ideas for each row execute function private.touch_updated_at();

-- Envoi d'un message de contact (sans compte). Champ « website » = piège à robots : rempli → ignoré sans erreur.
-- Les erreurs sont des codes que l'interface traduit.
create or replace function public.submit_contact(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_country text := upper(nullif(trim(coalesce(p ->> 'country', '')), ''));
  v_id uuid;
begin
  if coalesce(p ->> 'website', '') <> '' then
    return null;
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or char_length(v_email) > 200 then
    raise exception 'invalid_email';
  end if;
  if char_length(trim(coalesce(p ->> 'message', ''))) < 2 then
    raise exception 'empty_message';
  end if;
  if v_country is not null and v_country !~ '^[A-Z]{2}$' then
    v_country := null;
  end if;
  if (select count(*) from public.contact_messages c where c.email = v_email and c.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from public.contact_messages c where c.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'busy';
  end if;
  insert into public.contact_messages (kind, name, email, company, phone, country, locale, fleet_size, message, source, consent, user_id)
  values (
    case when p ->> 'kind' in ('contact', 'demo', 'partenaire', 'support') then p ->> 'kind' else 'contact' end,
    nullif(left(trim(coalesce(p ->> 'name', '')), 120), ''),
    v_email,
    nullif(left(trim(coalesce(p ->> 'company', '')), 120), ''),
    nullif(left(trim(coalesce(p ->> 'phone', '')), 40), ''),
    v_country,
    case when p ->> 'locale' in ('fr', 'de', 'it', 'en') then p ->> 'locale' end,
    nullif(left(trim(coalesce(p ->> 'fleet_size', '')), 20), ''),
    left(trim(p ->> 'message'), 4000),
    nullif(left(trim(coalesce(p ->> 'source', '')), 200), ''),
    coalesce((p ->> 'consent')::boolean, false),
    (select auth.uid())
  )
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_contact(jsonb) to anon, authenticated;

-- Dépôt d'une idée : connecté (liée à la personne et, si membre, à son entreprise) ou anonyme avec e-mail.
create or replace function public.submit_idea(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  v_org uuid := nullif(p ->> 'org_id', '')::uuid;
  v_email text := lower(nullif(trim(coalesce(p ->> 'email', '')), ''));
  v_id uuid;
begin
  if coalesce(p ->> 'website', '') <> '' then
    return null;
  end if;
  if char_length(trim(coalesce(p ->> 'title', ''))) < 3 then
    raise exception 'idea_title_too_short';
  end if;
  if uid is null and (v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$') then
    raise exception 'invalid_email';
  end if;
  if v_org is not null and (uid is null or not private.is_member(v_org)) then
    v_org := null;
  end if;
  if (select count(*) from public.ideas i
      where ((uid is not null and i.user_id = uid) or (uid is null and i.email = v_email))
        and i.created_at > now() - interval '1 day') >= 15 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from public.ideas i where i.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'busy';
  end if;
  insert into public.ideas (user_id, org_id, email, locale, category, title, details)
  values (
    uid, v_org,
    coalesce(v_email, (select pr.email from public.profiles pr where pr.id = uid)),
    case when p ->> 'locale' in ('fr', 'de', 'it', 'en') then p ->> 'locale' end,
    case when p ->> 'category' in ('3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre')
         then p ->> 'category' else 'autre' end,
    left(trim(p ->> 'title'), 120),
    nullif(left(trim(coalesce(p ->> 'details', '')), 4000), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_idea(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- rappels par e-mail

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  frequency text not null default 'hebdo' check (frequency in ('quotidien', 'hebdo', 'jamais')),
  lead_days int not null default 14 check (lead_days between 1 and 90),
  lead_hours int not null default 50 check (lead_hours between 5 and 500),
  last_digest_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger notification_prefs_touch before update on public.notification_prefs for each row execute function private.touch_updated_at();

-- Journal des envois (lu par l'administration ; écrit par la fonction d'envoi avec la clé de service).
create table public.notification_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  org_id uuid,
  channel text not null default 'email' check (channel in ('email', 'whatsapp')),
  kind text not null check (char_length(kind) <= 40),
  status text not null check (status in ('envoye', 'ignore', 'erreur', 'simulation')),
  detail text check (char_length(detail) <= 2000),
  created_at timestamptz not null default now()
);
create index notification_log_user_idx on public.notification_log (user_id, created_at desc);
create index notification_log_created_idx on public.notification_log (created_at desc);

-- Garde-fou des tâches planifiées : une exécution au plus par fenêtre (appel répété = sans effet).
-- Lu et écrit uniquement par la fonction d'envoi (clé de service) : RLS active, aucune politique.
create table public.job_runs (
  job text primary key check (char_length(job) <= 60),
  last_run_at timestamptz not null
);
alter table public.job_runs enable row level security;

-- ---------------------------------------------------------------- prospection (agents par pays)

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region text check (char_length(region) <= 60),
  locale text check (locale in ('fr', 'de', 'it', 'en')),
  company text not null check (char_length(trim(company)) between 2 and 160),
  legal_id text check (char_length(legal_id) <= 40),
  website text check (char_length(website) <= 300),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  address text check (char_length(address) <= 300),
  postal_code text check (char_length(postal_code) <= 12),
  city text check (char_length(city) <= 80),
  segment text not null default 'autre' check (segment in ('genie_civil', 'terrassement', 'batiment', 'route', 'demolition', 'paysagiste', 'location', 'commune', 'gravier', 'forestier', 'agricole', 'autre')),
  fleet_estimate text check (fleet_estimate in ('1-5', '6-20', '21-50', '50+')),
  signals text check (char_length(signals) <= 2000),
  source text not null check (char_length(source) <= 500),
  status text not null default 'nouveau' check (status in ('nouveau', 'a_valider', 'pret', 'contacte', 'relance', 'demo', 'essai', 'client', 'refus', 'ne_pas_contacter')),
  channel text check (channel in ('lettre', 'telephone', 'linkedin', 'email', 'partenaire', 'salon')),
  ref_code text unique check (ref_code ~ '^[a-z0-9-]{4,40}$'),
  next_action_at date,
  notes text check (char_length(notes) <= 4000),
  created_by text not null default 'agent' check (char_length(created_by) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index prospects_company_unique on public.prospects (country, lower(company), coalesce(postal_code, ''));
create index prospects_status_idx on public.prospects (country, status, next_action_at);
create trigger prospects_touch before update on public.prospects for each row execute function private.touch_updated_at();

create table public.outreach (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  step int not null default 1 check (step between 1 and 10),
  channel text not null check (channel in ('lettre', 'telephone', 'linkedin', 'email', 'partenaire', 'salon')),
  locale text not null check (locale in ('fr', 'de', 'it', 'en')),
  subject text check (char_length(subject) <= 200),
  body text not null check (char_length(body) between 1 and 8000),
  status text not null default 'brouillon' check (status in ('brouillon', 'valide', 'envoye', 'reponse', 'annule')),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index outreach_prospect_idx on public.outreach (prospect_id, step);
create index outreach_status_idx on public.outreach (status, created_at desc);
create index outreach_approved_by_idx on public.outreach (approved_by);

-- Visites des liens de démo envoyés par les agents (code de suivi « ref »).
create table public.demo_visits (
  id bigint generated always as identity primary key,
  ref_code text not null check (ref_code ~ '^[a-z0-9-]{4,40}$'),
  path text check (char_length(path) <= 200),
  locale text check (locale in ('fr', 'de', 'it', 'en')),
  created_at timestamptz not null default now()
);
create index demo_visits_ref_idx on public.demo_visits (ref_code, created_at desc);

create or replace function public.log_demo_visit(p_ref text, p_path text default null, p_locale text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_ref is null or p_ref !~ '^[a-z0-9-]{4,40}$' then
    return;
  end if;
  if (select count(*) from public.demo_visits d where d.created_at > now() - interval '10 minutes') >= 300 then
    return;
  end if;
  if exists (select 1 from public.demo_visits d where d.ref_code = p_ref and d.created_at > now() - interval '1 minute') then
    return;
  end if;
  insert into public.demo_visits (ref_code, path, locale)
  values (p_ref, left(p_path, 200), case when p_locale in ('fr', 'de', 'it', 'en') then p_locale end);
end;
$$;
grant execute on function public.log_demo_visit(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- sécurité au niveau des lignes

alter table public.contact_messages enable row level security;
alter table public.ideas enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.notification_log enable row level security;
alter table public.prospects enable row level security;
alter table public.outreach enable row level security;
alter table public.demo_visits enable row level security;

create policy contact_admin_select on public.contact_messages for select to authenticated
  using (private.is_platform_admin());
create policy contact_admin_update on public.contact_messages for update to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

create policy ideas_select on public.ideas for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_admin());
create policy ideas_admin_update on public.ideas for update to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

create policy notification_prefs_own on public.notification_prefs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy notification_log_select on public.notification_log for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_admin());

create policy prospects_admin on public.prospects for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy outreach_admin on public.outreach for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy demo_visits_admin on public.demo_visits for select to authenticated
  using (private.is_platform_admin());
