-- 1) Organisations : le plan, la fin d'essai et l'origine de l'entreprise ne se modifient pas depuis l'application.
--    La politique org_update laisse le propriétaire et les administrateurs modifier la ligne (nom, pays, canton,
--    devise) ; sans ce garde-fou, ils pourraient aussi prolonger leur essai ou changer de formule.
--    Restent autorisés : la clé de service et les fonctions SECURITY DEFINER (current_user = propriétaire), ainsi
--    que l'administration de la plateforme (Swiss Digital Studio).
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
       or new.id is distinct from old.id then
      raise exception 'billing_locked' using errcode = '42501',
        hint = 'plan, trial_ends_at, created_by, created_at et id ne se modifient pas depuis l''application';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.org_guard_billing() from public, anon, authenticated;

create trigger organizations_guard_billing
  before update on public.organizations
  for each row execute function private.org_guard_billing();

-- 2) Échéances créées avec chaque machine : dans la langue de la personne qui l'ajoute (profiles.locale).
--    Mêmes libellés que messages/<langue>/garage.json (schedules.defaults).
create or replace function private.machine_after_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  base numeric := coalesce(new.hours, 0);
  lang text;
begin
  insert into public.hour_readings (org_id, machine_id, hours, read_at, source, created_by)
  values (new.org_id, new.id, base, now(), 'creation', new.created_by);
  if coalesce(current_setting('godet.skip_defaults', true), '') <> 'on' then
    select p.locale into lang from public.profiles p where p.id = new.created_by;
    insert into public.schedules (org_id, machine_id, label, basis, interval_hours, last_hours, due_hours)
    values (
      new.org_id, new.id,
      case lang when 'de' then 'Wartung' when 'it' then 'Manutenzione' else 'Service' end,
      'heures', 500, floor(base / 500) * 500, (floor(base / 500) + 1) * 500
    );
    insert into public.schedules (org_id, machine_id, label, basis, interval_days, due_date)
    values (
      new.org_id, new.id,
      case lang
        when 'de' then 'Jährliche Sicherheitskontrolle'
        when 'it' then 'Controllo annuale di sicurezza'
        when 'en' then 'Annual safety inspection'
        else 'Contrôle annuel de sécurité'
      end,
      'date', 365, current_date + 365
    );
  end if;
  return new;
end;
$function$;
