-- Machine de démonstration : une pelle de 21 t avec douze mois de carnet, pour découvrir Godet
-- sans rien saisir. Les dates sont recalées sur le jour de l'appel (référence : 19.10.2026).

create or replace function public.create_demo_machine(p_org uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  mid uuid;
  v_code text := 'PE-01';
  n int := 1;
  ref constant date := date '2026-10-19';
begin
  if not private.has_role(p_org, array['owner', 'admin', 'mechanic']::public.member_role[]) then
    raise exception 'Action réservée aux responsables du parc';
  end if;
  while exists (
    select 1 from public.machines m where m.org_id = p_org and lower(m.code) = lower(v_code) and m.archived_at is null
  ) loop
    n := n + 1;
    v_code := 'DEMO-' || lpad(n::text, 2, '0');
  end loop;

  perform set_config('godet.skip_defaults', 'on', true);
  insert into public.machines (org_id, code, kind, brand, model, year, serial, weight_t, color, hours, notes)
  values (p_org, v_code, 'pelle', 'Démo', 'Pelle sur chenilles 21 t', 2019, 'EX21-004587', 21, '#f3b71b', 6842,
          'Machine de démonstration : modifiez-la, complétez son carnet ou archivez-la quand vous voulez.')
  returning id into mid;
  perform set_config('godet.skip_defaults', 'off', true);

  insert into public.entries (org_id, machine_id, kind, date, hours, title, details, performed_by,
                              cost_parts, cost_labour, downtime_hours, repair_status, part_ref, part_qty, warranty_until)
  select p_org, mid, v.kind::public.entry_kind, current_date - (ref - v.d::date), v.h, v.t, v.det, v.who,
         v.cp, v.cl, v.dt, v.rs::public.repair_status, v.pr, v.pq,
         case when v.w is null then null else current_date - (ref - v.w::date) end
  from (values
    ('service',    '2025-10-28', 5512, 'Service 5’500 h', 'Huile moteur et filtres, contrôle des flexibles.', 'Atelier interne', 380, 240, null, null, null, null, null),
    ('inspection', '2025-11-07', 5580, 'Contrôle après chantier en tranchée', 'Nettoyage du train de roulement, contrôle des chocs sur le godet.', 'Chef d’atelier', 0, 540, null, null, null, null, null),
    ('reparation', '2025-11-14', 5590, 'Pompe de graissage centralisée remplacée', 'Pompe hors service, remplacée et purgée.', 'Atelier interne', 980, 260, 4, 'fait', null, null, null),
    ('piece',      '2025-11-21', null, 'Filtre déshydrateur de climatisation', null, null, 320, 0, null, null, 'CL-03', 1, null),
    ('inspection', '2025-12-04', 5640, 'Graissage hivernal', 'Graisse grand froid sur la couronne et les axes.', 'Machiniste', 0, 380, null, null, null, null, null),
    ('piece',      '2025-12-05', null, 'Ampoules et fusibles', null, null, 90, 0, null, null, 'EL-KIT', 1, null),
    ('service',    '2026-01-09', 5760, 'Préparation au froid', 'Batterie testée, bougies de préchauffage contrôlées, antigel vérifié.', 'Atelier interne', 240, 370, null, null, null, null, null),
    ('piece',      '2026-01-13', null, 'Flexibles de rechange (stock atelier)', null, null, 760, 0, null, null, 'FX-ST', 4, null),
    ('reparation', '2026-01-27', 5790, 'Moteur de translation droit : fuite', 'Joint flottant remplacé, huile du réducteur renouvelée.', 'Atelier interne', 1260, 1120, 18, 'fait', null, null, null),
    ('piece',      '2026-02-10', null, 'Phare de travail LED', null, null, 140, 0, null, null, 'LED-24', 1, '2027-02-10'),
    ('inspection', '2026-02-15', 5860, 'Inspection et graissage', 'Tension des chenilles réglée, axes de godet graissés, usure des dents mesurée.', 'Machiniste', 0, 450, null, null, null, null, null),
    ('reparation', '2026-03-18', 5998, 'Dents de godet remplacées', 'Cinq dents usées remplacées.', 'Atelier interne', 450, 190, 2, 'fait', null, null, null),
    ('piece',      '2026-03-18', null, 'Lame d’usure de godet', null, null, 520, 0, null, null, 'LU-110', 1, null),
    ('service',    '2026-03-22', 6004, 'Service 6’000 h', 'Huile moteur et filtres, huile des réducteurs de translation, contrôle du jeu de la couronne d’orientation.', 'Atelier interne', 760, 480, null, null, null, null, null),
    ('piece',      '2026-04-09', null, 'Batterie 12 V 140 Ah', null, null, 210, 0, null, null, 'BAT-140', 1, '2028-04-09'),
    ('inspection', '2026-04-17', 6060, 'Contrôle du train de roulement', 'Usure des galets et des barbotins mesurée, tension des chenilles réglée.', 'Chef d’atelier', 0, 530, null, null, null, null, null),
    ('reparation', '2026-05-12', 6110, 'Vérin de godet réétanché', 'Suintement à la tige. Jeu de joints remplacé, tige contrôlée.', 'Atelier interne', 410, 570, 6, 'fait', null, null, null),
    ('piece',      '2026-05-20', null, 'Kit d’étanchéité du joint tournant', null, null, 430, 0, null, null, 'JT-08', 1, '2027-05-20'),
    ('inspection', '2026-05-29', 6150, 'Nettoyage et contrôle des flexibles', 'Nettoyage à la vapeur, contrôle visuel de tous les flexibles et raccords.', 'Garage partenaire', 0, 690, null, null, null, null, null),
    ('controle',   '2026-06-06', 6220, 'Contrôle annuel de sécurité', 'Frein de rotation, clapets de sécurité des vérins, avertisseur de surcharge, éclairage, extincteur. Aucun défaut.', 'Chef d’atelier', 0, 420, null, null, null, null, null),
    ('piece',      '2026-06-11', null, 'Filtres de cabine et balais d’essuie-glace', null, null, 160, 0, null, null, 'FC-12', 1, null),
    ('service',    '2026-07-08', 6350, 'Climatisation : entretien et recharge', 'Filtre déshydrateur, recharge de gaz, test d’étanchéité.', 'Garage partenaire', 240, 340, null, null, null, null, null),
    ('piece',      '2026-07-08', null, 'Couteaux latéraux de godet (paire)', null, null, 610, 0, null, null, 'CL-110', 2, null),
    ('reparation', '2026-07-21', 6380, 'Galet porteur gauche remplacé', 'Galet bruyant et grippé. Remplacé, tension de chenille réglée.', 'Atelier interne', 690, 350, 9, 'fait', null, null, null),
    ('service',    '2026-08-14', 6498, 'Service 6’500 h', 'Huile moteur, filtres à huile, à carburant et à air, filtre de retour hydraulique, graissage complet.', 'Atelier interne', 760, 480, null, null, null, null, null),
    ('piece',      '2026-08-30', null, 'Graisse EP2, cartouches', null, null, 380, 0, null, null, 'GR-EP2', 24, null),
    ('reparation', '2026-09-03', 6602, 'Flexible haute pression du balancier remplacé', 'Fuite sur le flexible du vérin de balancier. Flexible et joints remplacés, niveau d’huile complété.', 'Atelier interne', 380, 320, 5, 'fait', null, null, null),
    ('inspection', '2026-09-12', 6640, 'Contrôle des niveaux', 'Huile moteur, huile hydraulique et liquide de refroidissement contrôlés, graissage.', 'Machiniste', 0, 120, null, null, null, null, null),
    ('piece',      '2026-09-19', null, 'Kit de filtres pour le service 7’000 h', null, null, 440, 0, null, null, 'KF-7000', 1, null),
    ('inspection', '2026-10-06', 6770, 'Graissage et nettoyage du radiateur', 'Axes graissés, radiateur et refroidisseur d’huile soufflés.', 'Machiniste', 0, 260, null, null, null, null, null),
    ('reparation', '2026-10-15', 6830, 'Suspension du siège à remplacer', 'Amortisseur du siège affaissé. Pièce commandée, montage prévu au service 7’000 h.', 'Chef d’atelier', 520, 170, null, 'attente_piece', null, null, null)
  ) as v(kind, d, h, t, det, who, cp, cl, dt, rs, pr, pq, w);

  insert into public.hour_readings (org_id, machine_id, hours, read_at, source)
  values (p_org, mid, 6806, now() - interval '7 days', 'saisie');

  insert into public.schedules (org_id, machine_id, label, basis, interval_hours, interval_days, last_hours, last_date, due_hours, due_date)
  values
    (p_org, mid, 'Service', 'heures', 500, null, 6498, current_date - (ref - date '2026-08-14'), 7000, null),
    (p_org, mid, 'Inspection du train de roulement', 'heures', 1000, null, 6060, current_date - (ref - date '2026-04-17'), 7060, null),
    (p_org, mid, 'Vidange de l’huile hydraulique', 'heures', 2000, null, 6004, current_date - (ref - date '2026-03-22'), 8000, null),
    (p_org, mid, 'Contrôle de l’extincteur', 'date', null, 365, null, current_date - (ref - date '2026-02-15'), null, current_date - (ref - date '2027-02-15')),
    (p_org, mid, 'Contrôle annuel de sécurité', 'date', null, 365, null, current_date - (ref - date '2026-06-06'), null, current_date - (ref - date '2027-06-06'));

  return mid;
end;
$$;

revoke execute on function public.create_demo_machine(uuid) from public, anon;
grant execute on function public.create_demo_machine(uuid) to authenticated;
