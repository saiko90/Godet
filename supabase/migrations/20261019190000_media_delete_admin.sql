-- Les propriétaires et administrateurs peuvent supprimer le fichier d'un média déposé par quelqu'un d'autre :
-- même règle que pour la ligne de la table media (sinon la ligne disparaît mais le fichier reste dans le bucket).
-- Politique ajoutée à côté de medias_delete (les politiques permissives s'additionnent).

create or replace function private.admin_org_texts()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(m.org_id::text), '{}') from public.memberships m
  where m.user_id = (select auth.uid()) and m.role in ('owner', 'admin');
$$;
revoke execute on function private.admin_org_texts() from public;
grant execute on function private.admin_org_texts() to authenticated;

create policy medias_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'medias' and (storage.foldername(name))[1] = any (private.admin_org_texts()));
