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
  demo, notifications, emails, admin, legal, excel, help, rental). Le français fait foi ; `node scripts/check-messages.mjs` vérifie que
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
- Étiquettes QR : `/etiquettes` (privée, planches A4 Avery L7165 / L7160, `?ids=` pour une sélection) ; le code contient
  `<site>/m/<id>` (`src/app/[locale]/m/[id]`) qui ouvre `/garage?m=<id>`. Codes : `src/lib/qr.ts` (qrcode-generator).
- Excel : `src/components/garage/excel.ts` (chargé à la demande ; read-excel-file / write-excel-file) et `ExcelModal.tsx`.
  Export machines + carnet + échéances ; import machines (mise à jour par code) et historique (doublons ignorés), en-têtes
  reconnus dans les 4 langues (zone `excel`).
- Hors ligne : `public/sw.js` (service worker, enregistré par `CloudGarage` en production : page du garage gardée,
  fichiers statiques, page « hors ligne », lien QR sans réseau) et `src/lib/offline/` (copie du parc dans IndexedDB,
  file d'attente des saisies et relevés envoyée au retour du réseau ; une saisie garde son `id` → pas de doublon).
  Déconnexion = tout est effacé de l'appareil.
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
- Abonnement Stripe (migration `20261020170000_billing_stripe.sql`) : formules essentiel (5 machines, 29), pro (20, 59),
  parc (50, 99) CHF ou EUR par mois, l'année = 10 mois ; pack fondateur −30 % à vie (10 premières, coupon
  `godet-fondateur-30`, `public.founder_slots_left()`) ; essai 15 jours. Fonctions Supabase `facturation` (Checkout et
  portail, session de la personne, propriétaire/admin) et `stripe-webhook` (signature `STRIPE_WEBHOOK_SECRET`, seule à
  écrire les champs d'abonnement). Produits, prix, coupon et portail se créent seuls au premier appel
  (`supabase/functions/facturation/stripe.ts`, recopié dans `stripe-webhook/`). Hors essai/abonnement actif : lecture
  seule (déclencheurs `*_guard_writable`, erreur `subscription_inactive`) ; limite de machines (`plan_limit`).
  Interface : `AbonnementPanel` (paramètres), bandeau du garage (`CloudGarage`), grille sur l'accueil ; `src/lib/billing.ts`.
- Assistant IA (fonction Supabase `assistant`, Claude via `ANTHROPIC_API_KEY`, modèle `ANTHROPIC_MODEL` ou
  claude-haiku-5-5) : `chat` (mode d'emploi `assistant/aide.ts` + parc de l'entreprise lu avec la clé de service,
  lecture seule) et `meter` (compteur d'heures lu sur photo, valeur proposée puis vérifiée par la personne).
  Compteur mensuel `ai_usage` (rpc `ai_consume`, clé de service seulement) ; limites dans `LIMITS` (essai 30/50,
  essentiel 100, pro 300, parc 800 questions ; 500 photos). Interface : `AssistantPanel` (bouton « Assistant » de la
  barre du haut), bouton « Lire sur une photo » de `HoursModal` ; client `src/lib/ai.ts`. Garder `aide.ts` à jour.
- Position GPS (migration `20261020181710_positions.sql`) : `organizations.track_location` (désactivée par défaut,
  case dans Paramètres → Entreprise). Si active, `useGeoFix` (src/lib/geo.ts) prend la position à l'ouverture de la
  fenêtre d'intervention ou de relevé (jamais en arrière-plan) ; `lat`, `lng`, `loc_accuracy` sur `entries` et
  `hour_readings`, dernière position sur `machines.last_*` (déclencheurs `*_last_position`). Lien carte OpenStreetMap.
  `Permissions-Policy` : `geolocation=(self)`. Page publique `/securite` (textes `legal.securityPage`) : chaque
  garantie doit rester vraie (sauvegardes = plan Supabase Pro, 7 jours).
- Option Location (+29 CHF/mois, comprise dans l'essai ; migrations `*_location*.sql`) : `organizations.rental_addon`
  (écrit par Stripe : élément `godet_location_*` de l'abonnement, action `update` de `facturation`),
  `private.rental_enabled` / `rentalEnabled()` (`src/lib/billing.ts`). Tables `rentals` (réservée → en cours → terminée,
  annulée ; chevauchement refusé : contrainte d'exclusion, code 23P01) et `rental_checks` (état des lieux départ / retour,
  jamais modifié ; l'insertion fait avancer la location et crée un relevé `source = 'location'`). Conditions de location :
  `organizations.rental_terms_path` (PDF dans `medias`, acceptation obligatoire au départ, version gardée dans
  `rental_checks.terms_path`) ; copie des rapports : `rental_report_cc`. Médias rattachés : `media.rental_check_id`,
  `media.slot`. Pages : `/location` (agenda), `/location/[id]/depart|retour` (formulaire), `/location/[id]/rapport` ;
  Paramètres → Location (`LocationPanel`) ; pastilles du garage (`components/garage/rental.tsx`). Règles et points de
  contrôle : `src/lib/rental.ts`. Fonction Supabase `location` : PDF (pdf-lib, vignettes JPEG `<check>-pdf-NN-<slot>.jpg`
  faites par l'appareil), rangé en document de la machine, e-mail Resend au client ; textes copiés par
  `node scripts/sync-location-i18n.mjs` (à relancer après un changement de `rental.json`, puis redéployer).
  Panne au retour (`rental_checks.breakdown`) : le déclencheur ouvre une réparation « en cours » dans le carnet ; tant
  qu'une réparation est ouverte, les réservations à venir de la machine sont « à risque » (agenda, détail, formulaire,
  pastille du garage).
- Aide : page `/aide` (textes `help`, structure `src/components/site/aide/content.ts`, tutoriel d'installation par
  appareil), guide imprimable `/aide/guide` → PDF `public/guides/godet-guide-<langue>.pdf` à régénérer après un
  changement de texte : `BASE=http://localhost:3000 node scripts/guides/make-guides.mjs`.
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
