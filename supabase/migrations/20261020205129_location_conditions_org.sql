-- Contrôle à l'insertion d'un état des lieux : étape, conditions acceptées (version gardée).
create or replace function private.rental_check_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
  v_terms text;
begin
  select r.status, o.rental_terms_path into v_status, v_terms
    from public.rentals r join public.organizations o on o.id = r.org_id
   where r.id = new.rental_id and r.machine_id = new.machine_id;
  if v_status is null then
    raise exception 'rental_not_found' using errcode = 'P0001';
  end if;
  if (new.kind = 'depart' and v_status <> 'reservee') or (new.kind = 'retour' and v_status <> 'en_cours') then
    raise exception 'rental_wrong_step' using errcode = 'P0001';
  end if;
  -- Conditions déposées : le client doit les accepter au départ ; la version acceptée est gardée.
  if new.kind = 'depart' and v_terms is not null and not new.terms_accepted then
    raise exception 'rental_terms_required' using errcode = 'P0001';
  end if;
  new.terms_path := case when new.terms_accepted then v_terms end;
  return new;
end;
$$;
