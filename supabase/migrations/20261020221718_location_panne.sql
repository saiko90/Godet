-- Machine déclarée en panne à l'état des lieux de retour : une réparation « en cours » est ouverte dans son carnet.
-- Tant qu'elle est ouverte, l'agenda signale les réservations à venir de cette machine (risque de retard).
alter table public.rental_checks
  add column if not exists breakdown boolean not null default false,
  add column if not exists breakdown_note text check (char_length(breakdown_note) <= 1000);

create or replace function private.rental_check_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_locale text;
  v_client text;
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
  if new.kind = 'retour' and new.breakdown then
    select coalesce(p.locale, 'fr') into v_locale from public.profiles p where p.id = new.created_by;
    select concat_ws(' · ', r.client_company, r.client_name) into v_client from public.rentals r where r.id = new.rental_id;
    insert into public.entries (org_id, machine_id, kind, date, title, details, repair_status, created_by)
    values (
      new.org_id,
      new.machine_id,
      'reparation',
      (new.created_at at time zone 'Europe/Zurich')::date,
      case coalesce(v_locale, 'fr')
        when 'de' then 'Defekt bei der Rücknahme'
        when 'it' then 'Guasto alla riconsegna'
        when 'en' then 'Breakdown at check-in'
        else 'Panne au retour de location'
      end,
      left(concat_ws(E'\n', nullif(trim(new.breakdown_note), ''), v_client), 4000),
      'en_cours',
      new.created_by
    );
  end if;
  return new;
end;
$$;
