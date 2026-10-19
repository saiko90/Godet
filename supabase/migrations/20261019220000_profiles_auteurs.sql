-- Traçabilité du carnet (art. 32b OPA) : le nom de la personne qui a fait ou retiré une saisie reste lisible
-- par l'entreprise, même après son départ de l'équipe.

create or replace function private.authored_in_my_orgs(p_profile uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.entries e
    where (e.created_by = p_profile or e.deleted_by = p_profile)
      and e.org_id = any (select m.org_id from public.memberships m where m.user_id = (select auth.uid()))
  );
$$;
revoke execute on function private.authored_in_my_orgs(uuid) from public;
grant execute on function private.authored_in_my_orgs(uuid) to authenticated;

alter policy profiles_select on public.profiles using (
  id = (select auth.uid())
  or exists (
    select 1 from public.memberships a join public.memberships b on a.org_id = b.org_id
    where a.user_id = (select auth.uid()) and b.user_id = profiles.id
  )
  or private.authored_in_my_orgs(id)
);
