-- Rend l'unité consommée quand l'IA n'a pas pu répondre (erreur du fournisseur).
create or replace function public.ai_refund(p_org uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
     set count = greatest(count - 1, 0)
   where org_id = p_org
     and kind = p_kind
     and month = date_trunc('month', now() at time zone 'Europe/Zurich')::date;
$$;
revoke execute on function public.ai_refund(uuid, text) from public, anon, authenticated;
grant execute on function public.ai_refund(uuid, text) to service_role;
