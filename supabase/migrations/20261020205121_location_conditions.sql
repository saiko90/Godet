-- Conditions de location du loueur (PDF) et acceptation par le client à la signature de l'état des lieux.
alter table public.organizations
  add column if not exists rental_terms_path text,
  add column if not exists rental_terms_updated_at timestamptz;

alter table public.rental_checks
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_path text;
