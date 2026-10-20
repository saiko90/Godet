# Godet — mémoire du projet

Godet (Swiss Digital Studio) : le carnet d'entretien numérique des machines de chantier, présenté comme
un showroom 3D de luxe. Une entreprise ajoute son parc ; chaque machine a son carnet (services, réparations,
pièces, contrôles, notes), ses échéances, ses relevés d'heures, ses coûts, ses photos, vidéos et documents.

## Langues (next-intl)
- 4 langues : français (défaut, sans préfixe : `/garage`), allemand `/de`, italien `/it`, anglais `/en`.
  Configuration : `src/i18n/routing.ts` ; liens et redirections avec `Link`, `redirect`, `useRouter`, `usePathname`
  de `@/i18n/navigation` (jamais `next/link` ni le `redirect` de `next/navigation` pour une page localisée).
- Toutes les pages sont sous `src/app/[locale]/` ; `params` est une Promise (`const { locale } = await params`) et
  chaque page/layout appelle `setRequestLocale(locale)`.
- Textes : `messages/<langue>/<zone>.json` (zones : common, domain, site, auth, settings, carnet, contact, ideas, garage,
  demo, notifications, emails, admin, legal). Le français fait foi ; `node scripts/check-messages.mjs` vérifie que
  chaque langue a les mêmes clés et les mêmes variables. Syntaxe ICU (`{count, plural, one {…} other {…}}`).
- Côté client : `useTranslations('zone')` ; le layout racine ne fournit que `common` et `domain` au navigateur :
  chaque zone pose son propre `NextIntlClientProvider` avec `pickMessages(messages, [...])`.
  Côté serveur : `getTranslations({ locale, namespace })`.
- Formats : `makeFormat({ locale, country, currency })` (serveur) ou `useFormat()` sous `FormatProvider` (client) :
  `6’842 h` et `CHF 1’240` en Suisse dans toutes les langues, `6.842 h` et `1.240 €` en Allemagne, etc.
  Les anciennes fonctions (`grp`, `hrs`, `chf`, `dateCH`…) sont en français suisse et à remplacer.
- Textes métier traduits (types de machines, saisies, rôles, échéances) : `useDomainText()` (client) ou
  `getDomainText(locale, format)` (serveur), à partir des règles de `src/lib/domain.ts`.
- Ton : vouvoiement en français, « Sie » en allemand (orthographe suisse : « ss », jamais « ß »), « Lei » en italien,
  anglais britannique sobre. Phrases courtes, pas de jargon. Vocabulaire du chantier : machiniste / Maschinist /
  operatore / operator ; service / Wartung / manutenzione / service ; compteur d'heures / Betriebsstunden /
  contaore / hour meter.
- Entreprise : pays (`organizations.country`, ISO) et devise (`currency`, CHF/EUR…) ; profil : `profiles.locale`
  (langue des e-mails).

## Pile
- Next.js 16 (App Router, `src/proxy.ts` remplace middleware), React 19, TypeScript strict.
- Supabase (projet « Godet », id `cluavztpktcmsynzvojf`, région eu-west-1) : Postgres + RLS, Auth, Storage.
- three.js 0.170 pour le showroom, chargé à la demande (`await import('@/engine')`).
- Hébergement Vercel, dépôt GitHub `saiko90/Godet`.

Commandes : `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`.
Navigateur de test : Chromium de Playwright dans `/opt/pw-browsers` (ne pas lancer `playwright install`).

## Organisation
- `src/app/[locale]` : pages. Public : `/` (accueil), `/demo` (garage d'exemple, sans compte), `/connexion`,
  `/invitation/[token]`, `/contact`, `/idees`. Privé (protégé par `src/proxy.ts`) : `/garage`, `/bienvenue`,
  `/parametres`, `/carnet/[id]` (impression), `/admin` (Swiss Digital Studio uniquement).
- `src/proxy.ts` : session Supabase + protection des pages privées + langues (next-intl).
- `src/engine` : moteur 3D. Contrat unique : `src/engine/types.ts` (`createShowroom`). Rien d'autre n'importe three.js.
  Un modèle procédural par type de machine dans `src/engine/models/<type>.ts` (boîte à outils `kit.ts`, pièces
  communes `parts.ts`, registre `index.ts`). Catalogue des types et familles : `src/lib/machine-kinds.ts` (33 types en
  5 familles) ; textes `domain.json` (`machineKinds`, `machineCategories`), préfixes de code `garage.json`
  (`codePrefix`), icônes `src/components/garage/KindIcon.tsx`. Ajouter un type = valeur de l'enum `machine_kind`
  (migration) + ces fichiers + resynchroniser la fonction `rappels`.
- `src/components/garage` : interface du garage (scène, fiche machine, saisies, mode atelier). Styles : `garage.css`.
- `src/components/site` : pages du site et des comptes. Styles : `site.css`.
- `src/components` : partagé (`Icons.tsx` sprite + `<Icon name>`, `Logo.tsx`, `Loader.tsx` écran de chargement).
- `src/lib` : `types.ts` (types métier), `domain.ts` (règles : échéances, santé, coûts, droits), `format.ts`,
  `session.ts` (serveur : qui est connecté, entreprise active), `supabase/` (clients), `repo/` (accès aux données :
  contrat `types.ts`, implémentations `supabase.ts` et `demo.ts`), `database.types.ts` (généré, ne pas éditer).
- `supabase/migrations` : schéma SQL (déjà appliqué sur le projet ; toute évolution = nouvelle migration).
- `supabase/functions/rappels` : fonction Supabase (Deno) des rappels par e-mail ; exclue du `tsconfig.json`.
- `docs/prospection` : prospection par pays (Suisse d'abord) et consignes des agents. Règle absolue : les agents
  cherchent et rédigent, une personne relit et envoie (aucun envoi automatique, cf. UWG/LCD, RGPD, AI Act art. 50).
- `docs/notifications.md` : rappels et e-mails (activation de Resend, tests).
- `scripts/film` : films de présentation (showroom 3D et suivi, 4 langues) tournés image par image, et images de
  l'accueil par langue ; mode d'emploi dans son README. Fichiers servis : `public/videos/godet-<film>-<langue>.mp4`
  (+ affiche `.webp`) et `public/images/showroom-hero-<langue>.webp` ; un fichier absent n'est pas proposé.

## Données et sécurité
- Tables : organizations, profiles, memberships (rôles owner/admin/mechanic/operator), invitations, machines,
  schedules (échéances en heures ou en date), entries (carnet), hour_readings, media, audit_log ;
  contact_messages, ideas (boîte à idées), notification_prefs, notification_log, job_runs ;
  prospects, outreach, demo_visits (prospection des agents, réservée à l'administration).
- Administration de la plateforme : `public.is_platform_admin()` (adresse e-mail confirmée inscrite dans
  `private.platform_admin_emails`). RPC publiques ajoutées : `create_org`, `create_demo_machine_v2` (contenu
  traduit fourni par `src/lib/demo-content/machine-payload.ts`), `submit_contact`, `submit_idea`, `log_demo_visit`.
  Leurs erreurs sont des codes (`invalid_email`, `rate_limited`, `busy`…) que l'interface traduit.
- Suivi des liens envoyés par les agents : paramètre `?ref=code` → cookie `godet-ref` (30 jours) → transmis à
  l'inscription (`options.data.ref` → `profiles.signup_ref`).
- RLS partout : on ne voit que les données des entreprises dont on est membre. Les fonctions d'accès vivent dans
  le schéma `private` (non exposé). RPC publiques d'origine : `invitation_info`, `accept_invitation`
  (`create_organization` et `create_demo_machine`, remplacées, ne sont plus appelables).
- Déclencheurs : l'entreprise d'une saisie suit toujours sa machine ; une saisie avec compteur crée un relevé et fait
  avancer le compteur ; une saisie liée à une échéance (`schedule_id`) la renouvelle ; une nouvelle machine reçoit
  « Service » toutes les 500 h et « Contrôle annuel de sécurité » (dans la langue du profil de la personne qui
  l'ajoute) ; tout changement est journalisé.
- Abonnement : `plan` et `trial_ends_at` d'une entreprise (et `created_by`, `created_at`) ne se modifient pas depuis
  l'application (déclencheur `organizations_guard_billing`, erreur `billing_locked`) : seulement la clé de service,
  une fonction SECURITY DEFINER ou l'administration de la plateforme.
- E-mails (Resend, serveur uniquement) : `src/lib/email` (invitations) et la fonction Supabase `rappels` (tâche
  planifiée `godet-rappels`, 05:15 UTC). Sans `RESEND_API_KEY` et `EMAIL_FROM`, rien ne part (simulation).
  Mode d'emploi : `docs/notifications.md`. WhatsApp : pas encore.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
