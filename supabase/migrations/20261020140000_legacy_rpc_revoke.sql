-- Anciennes fonctions remplacées par create_org et create_demo_machine_v2 (multilingues) : plus appelées par
-- l'application depuis la version en quatre langues. On retire le droit de les appeler (elles restent en place,
-- sans effet, pour un éventuel retour arrière).
revoke execute on function public.create_organization(text, text) from public, anon, authenticated;
revoke execute on function public.create_demo_machine(uuid) from public, anon, authenticated;
