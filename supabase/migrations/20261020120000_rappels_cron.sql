-- Rappels par e-mail : tâche planifiée quotidienne qui appelle la fonction Supabase « rappels ».
-- 05:15 UTC, soit 06:15 (hiver) ou 07:15 (été) à Zurich. La fonction décide elle-même qui reçoit quoi
-- (rappel quotidien ou résumé du lundi, seuils de chacun) et ignore les appels répétés (table job_runs :
-- une exécution réelle au plus toutes les 20 heures). Sans secrets Resend, elle fonctionne en simulation.
-- Aucune clé ici : la fonction est déployée sans vérification JWT, l'appel n'a pas d'en-tête d'autorisation.
-- Idempotente : relancée, elle remplace la tâche du même nom au lieu d'en créer une seconde.
-- Mode d'emploi : docs/notifications.md.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- cron.schedule avec un nom existant met la tâche à jour (pg_cron ≥ 1.3) : pas de doublon.
select cron.schedule(
  'godet-rappels',
  '15 5 * * *',
  $job$
  select net.http_post(
    url := 'https://cluavztpktcmsynzvojf.supabase.co/functions/v1/rappels',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 150000
  ) as request_id;
  $job$
);
