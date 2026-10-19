# Godet — mémoire du projet

Godet (Swiss Digital Studio) : le carnet d'entretien numérique des machines de chantier, présenté comme
un showroom 3D de luxe. Une entreprise ajoute son parc ; chaque machine a son carnet (services, réparations,
pièces, contrôles, notes), ses échéances, ses relevés d'heures, ses coûts, ses photos, vidéos et documents.

## Langue et ton
- Interface en français de Suisse romande, vouvoiement, phrases courtes, pas de jargon technique.
- Formats suisses (src/lib/format.ts) : `6’842 h`, `CHF 1’240`, `14.08.2026`. Apostrophe typographique `’`.
- Vocabulaire : machiniste, chef d'atelier, chantier, service 500 h, contrôle annuel de sécurité, compteur d'heures.

## Pile
- Next.js 16 (App Router, `src/proxy.ts` remplace middleware), React 19, TypeScript strict.
- Supabase (projet « Godet », id `cluavztpktcmsynzvojf`, région eu-west-1) : Postgres + RLS, Auth, Storage.
- three.js 0.170 pour le showroom, chargé à la demande (`await import('@/engine')`).
- Hébergement Vercel, dépôt GitHub `saiko90/Godet`.

Commandes : `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`.
Navigateur de test : Chromium de Playwright dans `/opt/pw-browsers` (ne pas lancer `playwright install`).

## Organisation
- `src/app` : pages. Public : `/` (accueil), `/demo` (garage d'exemple, sans compte), `/connexion`, `/invitation/[token]`.
  Privé (protégé par `src/proxy.ts`) : `/garage`, `/bienvenue` (création de l'entreprise), `/parametres`, `/carnet/[id]` (impression).
- `src/engine` : moteur 3D. Contrat unique : `src/engine/types.ts` (`createShowroom`). Rien d'autre n'importe three.js.
- `src/components/garage` : interface du garage (scène, fiche machine, saisies, mode atelier). Styles : `garage.css`.
- `src/components/site` : pages du site et des comptes. Styles : `site.css`.
- `src/components` : partagé (`Icons.tsx` sprite + `<Icon name>`, `Logo.tsx`, `Loader.tsx` écran de chargement).
- `src/lib` : `types.ts` (types métier), `domain.ts` (règles : échéances, santé, coûts, droits), `format.ts`,
  `session.ts` (serveur : qui est connecté, entreprise active), `supabase/` (clients), `repo/` (accès aux données :
  contrat `types.ts`, implémentations `supabase.ts` et `demo.ts`), `database.types.ts` (généré, ne pas éditer).
- `supabase/migrations` : schéma SQL (déjà appliqué sur le projet ; toute évolution = nouvelle migration).

## Données et sécurité
- Tables : organizations, profiles, memberships (rôles owner/admin/mechanic/operator), invitations, machines,
  schedules (échéances en heures ou en date), entries (carnet), hour_readings, media, audit_log.
- RLS partout : on ne voit que les données des entreprises dont on est membre. Les fonctions d'accès vivent dans
  le schéma `private` (non exposé). RPC publiques : `create_organization`, `create_demo_machine`,
  `invitation_info`, `accept_invitation`.
- Déclencheurs : l'entreprise d'une saisie suit toujours sa machine ; une saisie avec compteur crée un relevé et fait
  avancer le compteur ; une saisie liée à une échéance (`schedule_id`) la renouvelle ; une nouvelle machine reçoit
  « Service » toutes les 500 h et « Contrôle annuel de sécurité » ; tout changement est journalisé.
- Le carnet ne s'efface pas (art. 32b OPA : consigner les résultats d'entretien) : retrait = `deleted_at`,
  `deleted_by`, `delete_reason`. Les machines s'archivent (`archived_at`).
- Stockage : bucket privé `medias`, chemin `<org_id>/<machine_id>/<fichier>`, lecture par liens signés.
- Clé publishable seulement côté client (src/lib/env.ts). Jamais de clé service_role dans le dépôt.

## Interface
- Univers sombre unique (tokens dans `src/app/globals.css`) : nuit `--night`, craie `--chalk`, acier `--steel`,
  jaune engin `--paint` (seul accent), états `--ok` `--warn` `--bad`. Polices : Michroma (titres), Archivo (texte),
  IBM Plex Mono (chiffres et références).
- Classes communes : `.btn` (+ `-primary`, `-soft`, `-ghost`, `-block`), `.icon-btn`, `.field`, `.card`, `.pill`,
  `.eyebrow`, `.muted`, `.empty`, `.modal`, `.num`, `.mono`.
- Mobile d'abord : fiche machine en panneau à droite sur ordinateur, en feuille du bas sous 760 px. Cibles tactiles
  ≥ 44 px, focus visible, `prefers-reduced-motion` respecté, textes alternatifs.
- Chaque attente a son retour visuel : `<Loader>` (le godet qui se remplit) pour les chargements de page et de la 3D.
