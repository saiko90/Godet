-- Transport des locations livrées : aller (livraison) et retour (reprise sur le chantier), organisé ou non.
-- { "out": { "carrier": "...", "at": "...", "note": "...", "done": true }, "back": { ... } }
alter table public.rentals
  add column if not exists transport jsonb not null default '{}'::jsonb
  check (jsonb_typeof(transport) = 'object' and octet_length(transport::text) <= 4000);
