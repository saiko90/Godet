-- Relevé venant d'un état des lieux.
alter table public.hour_readings drop constraint if exists hour_readings_source_check;
alter table public.hour_readings add constraint hour_readings_source_check
  check (source in ('saisie', 'intervention', 'creation', 'location'));
