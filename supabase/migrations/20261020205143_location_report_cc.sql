-- Copie des rapports de location au loueur (adresse de l'entreprise, facultative).
alter table public.organizations add column if not exists rental_report_cc text
  check (rental_report_cc is null or (length(rental_report_cc) <= 200 and rental_report_cc ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'));
