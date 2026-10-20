-- Position GPS des saisies (intervention, relevé d'heures), seulement si l'entreprise l'a activée.
-- La position est prise au moment de la saisie, sur l'appareil, jamais en continu. La machine garde la dernière.

alter table public.organizations add column if not exists track_location boolean not null default false;

alter table public.entries
  add column if not exists lat double precision check (lat between -90 and 90),
  add column if not exists lng double precision check (lng between -180 and 180),
  add column if not exists loc_accuracy real check (loc_accuracy >= 0);

alter table public.hour_readings
  add column if not exists lat double precision check (lat between -90 and 90),
  add column if not exists lng double precision check (lng between -180 and 180),
  add column if not exists loc_accuracy real check (loc_accuracy >= 0);

alter table public.machines
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision,
  add column if not exists last_loc_accuracy real,
  add column if not exists last_located_at timestamptz;

-- Dernière position connue de la machine (la plus récente gagne).
create or replace function private.machine_last_position()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.lat is null or new.lng is null then
    return new;
  end if;
  update public.machines m
     set last_lat = new.lat,
         last_lng = new.lng,
         last_loc_accuracy = new.loc_accuracy,
         last_located_at = now()
   where m.id = new.machine_id;
  return new;
end;
$$;

create or replace trigger entries_last_position after insert on public.entries
  for each row execute function private.machine_last_position();
create or replace trigger readings_last_position after insert on public.hour_readings
  for each row execute function private.machine_last_position();
