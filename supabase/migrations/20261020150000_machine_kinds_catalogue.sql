-- Catalogue élargi : tous les engins de chantier (nacelles, bulldozer, pelle araignée, grues, routes, béton…).
-- Les nouvelles valeurs se placent avant « autre » (ordre d'affichage cohérent si l'on trie par type).
-- Textes et préfixes de code : messages/<langue>/domain.json et garage.json ; modèles 3D : src/engine/models.
alter type public.machine_kind add value if not exists 'pelle_pneus' before 'autre';
alter type public.machine_kind add value if not exists 'pelle_araignee' before 'autre';
alter type public.machine_kind add value if not exists 'chargeuse_compacte' before 'autre';
alter type public.machine_kind add value if not exists 'tractopelle' before 'autre';
alter type public.machine_kind add value if not exists 'bulldozer' before 'autre';
alter type public.machine_kind add value if not exists 'niveleuse' before 'autre';
alter type public.machine_kind add value if not exists 'mini_dumper' before 'autre';
alter type public.machine_kind add value if not exists 'camion_grue' before 'autre';
alter type public.machine_kind add value if not exists 'camion_malaxeur' before 'autre';
alter type public.machine_kind add value if not exists 'grue_tour' before 'autre';
alter type public.machine_kind add value if not exists 'chariot_telescopique' before 'autre';
alter type public.machine_kind add value if not exists 'chariot_elevateur' before 'autre';
alter type public.machine_kind add value if not exists 'nacelle_ciseaux' before 'autre';
alter type public.machine_kind add value if not exists 'nacelle_articulee' before 'autre';
alter type public.machine_kind add value if not exists 'nacelle_telescopique' before 'autre';
alter type public.machine_kind add value if not exists 'rouleau_tandem' before 'autre';
alter type public.machine_kind add value if not exists 'plaque_vibrante' before 'autre';
alter type public.machine_kind add value if not exists 'finisseur' before 'autre';
alter type public.machine_kind add value if not exists 'fraiseuse' before 'autre';
alter type public.machine_kind add value if not exists 'pompe_beton' before 'autre';
alter type public.machine_kind add value if not exists 'foreuse' before 'autre';
alter type public.machine_kind add value if not exists 'concasseur' before 'autre';
alter type public.machine_kind add value if not exists 'crible' before 'autre';
alter type public.machine_kind add value if not exists 'groupe_electrogene' before 'autre';
alter type public.machine_kind add value if not exists 'compresseur' before 'autre';
