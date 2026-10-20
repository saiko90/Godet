# Rappels par e-mail

Godet prévient par e-mail les responsables du parc quand une échéance approche ou est dépassée, et tant
qu'une réparation reste ouverte. Tout est prêt ; l'envoi réel attend un compte Resend et une adresse
d'expéditeur. D'ici là, la fonction tourne en **simulation** : rien ne part, le journal note ce qui serait parti.

WhatsApp n'est pas encore prévu (la table `notification_log` accepte déjà le canal `whatsapp`).

## Ce qui part, et quand

| Réglage de la personne | Ce qu'elle reçoit |
| --- | --- |
| Chaque jour | Un e-mail chaque matin, seulement s'il y a quelque chose à signaler. |
| Chaque semaine (par défaut) | Un résumé le lundi matin, au plus un tous les 7 jours, seulement s'il y a quelque chose à signaler. |
| Jamais, ou rappels désactivés | Rien. |

- **Qui** : propriétaires, administrateurs et mécaniciens par défaut. Les machinistes seulement s'ils ont
  activé **et enregistré** leurs rappels dans les paramètres.
- **Quoi** : un seul e-mail par personne, avec une partie par entreprise.
  - les échéances **dépassées** ou **proches** selon les seuils de la personne (par défaut 14 jours avant une
    échéance en date, 50 h avant une échéance au compteur ; une échéance au compteur apparaît aussi plus tôt si,
    au rythme d'utilisation des 90 derniers jours, elle tombe dans le délai en jours — mêmes règles que le garage,
    `src/lib/domain.ts`) ;
  - les **réparations ouvertes** (en cours, en attente de pièce).
  - Au plus 30 échéances et 20 réparations par entreprise ; au-delà, « Et N autres points à voir dans le garage ».
- **Heure** : la tâche planifiée appelle la fonction à 05:15 UTC (06:15 en hiver, 07:15 en été à Zurich).
- **Langue** : celle du profil (`profiles.locale`) ; **formats** (heures, dates, montants) : ceux du pays et de
  la devise de chaque entreprise (`6’842 h`, `CHF 1’240` en Suisse ; `6.842 h`, `1.240 €` en Allemagne).
- **Liens** : « Ouvrir le garage » (`SITE_URL` + préfixe de langue + `/garage`) et « Modifier ou désactiver les
  rappels » (`/parametres#rappels`, aussi dans l'en-tête `List-Unsubscribe`).
- Les entreprises au compte suspendu (`plan = 'suspendu'`) ne déclenchent pas de rappel.

## Les pièces

| Élément | Rôle |
| --- | --- |
| `src/components/notifications/NotificationsPanel.tsx` | Réglages dans les paramètres : activer, fréquence, anticipation en jours et en heures. Lit et enregistre (upsert) la ligne `notification_prefs` de la personne. |
| `supabase/functions/rappels/` | Fonction Supabase (Deno) qui calcule et envoie les rappels. |
| `supabase/migrations/20261020120000_rappels_cron.sql` | Tâche planifiée quotidienne (pg_cron + pg_net) qui appelle la fonction. |
| `src/lib/email/` | Envoi côté Next (`sendEmail`) et e-mail d'invitation (`sendInvitationEmail`). |
| `messages/<langue>/emails.json`, `notifications.json` | Textes des e-mails et du panneau, dans les 4 langues. |

### Fonction `rappels`

- Adresse : `https://cluavztpktcmsynzvojf.supabase.co/functions/v1/rappels`, appel `POST` sans corps
  (un corps éventuel est ignoré ; `GET` → 405). Vérification JWT désactivée : elle est appelée par la tâche
  planifiée, sans clé.
- **Garde-fou** : une exécution réelle au plus toutes les 20 heures (table `job_runs`, ligne `rappels`) ;
  un appel répété répond `{"status":"skipped","reason":"recent_run"}` sans rien faire.
- **En envoi réel**, rien ne part la nuit : en dehors de 5 h–20 h (heure de Zurich), l'appel répond
  `{"status":"skipped","reason":"outside_window"}` sans consommer le garde-fou.
- **Réponse** : uniquement des compteurs, par exemple
  `{"ok":true,"status":"done","mode":"simulation","day":"2026-10-19","counts":{"memberships":0,"people":0,"due":0,"nothing":0,"sent":0,"simulated":0,"errors":0,"noAddress":0,"deferred":0},"ms":1119}`.
- **Journal** (`notification_log`, une ligne par e-mail, sans adresse, nom ni contenu) :
  `kind` = `rappel_quotidien` ou `rappel_hebdo` ; `status` = `simulation`, `envoye` (avec l'identifiant Resend),
  `erreur` (statut HTTP et code Resend) ou `ignore` (profil sans adresse) ;
  `detail` = `echeances=3;depassees=1;reparations=2;entreprises=1;langue=fr…`.
- `last_digest_at` n'avance que si l'e-mail est réellement parti (la simulation ne le touche pas). Pour une
  personne qui n'a pas encore enregistré de réglages, le journal des envois sert de référence : la fonction ne crée
  jamais de ligne de réglages à la place de la personne (sinon un machiniste se retrouverait inscrit sans l'avoir
  choisi).
- Clé d'idempotence Resend `rappels-<jour>-<personne>` : un rappel relancé le même jour ne part qu'une fois.
- Secrets lus (aucune clé dans le code) :

| Secret | Obligatoire | Rôle |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` (ou l'ancien `SUPABASE_SERVICE_ROLE_KEY`) | fournis par Supabase | Accès à la base (clé de service). |
| `RESEND_API_KEY` | pour l'envoi réel | Clé d'API Resend. |
| `EMAIL_FROM` | pour l'envoi réel | Expéditeur, d'un domaine vérifié : `Godet <rappels@mail.exemple.ch>`. |
| `SITE_URL` | non | Adresse publique du site pour les liens (par défaut `https://godet.app`). |
| `EMAIL_REPLY_TO` | non | Adresse de réponse. |

## Activer l'envoi réel

1. **Compte Resend** : créer le compte sur resend.com (au nom de Swiss Digital Studio).
2. **Domaine d'envoi** : dans Resend › Domains, ajouter un sous-domaine dédié (recommandé), par exemple
   `mail.<domaine-de-godet>`, et la région Europe. Resend affiche les enregistrements DNS à créer chez le
   registraire, à recopier tels quels :
   - SPF : un enregistrement `MX` et un `TXT` sur le sous-domaine `send.` (chemin de retour) ;
   - DKIM : un `TXT` `resend._domainkey` ;
   - puis, une fois le domaine vérifié (souvent en 15 minutes, jusqu'à 72 h), un DMARC recommandé :
     `TXT _dmarc.<domaine>` → `v=DMARC1; p=none; rua=mailto:<adresse de suivi>`.
   Chez Cloudflare, désactiver le proxy (nuage orange) sur ces enregistrements.
3. **Clé d'API** : Resend › API Keys, permission « Sending access » limitée à ce domaine. Ne la copier que dans
   les deux endroits ci-dessous.
4. **Vercel** (projet `godet`, environnement Production, et Preview si besoin) : variables
   `RESEND_API_KEY` et `EMAIL_FROM` (facultatif `EMAIL_REPLY_TO`), puis redéployer. Elles servent à
   `sendEmail` et `sendInvitationEmail` (invitations).
5. **Supabase** (Edge Functions › Secrets, ou `supabase secrets set …`) : `RESEND_API_KEY`, `EMAIL_FROM`
   et, dès qu'un domaine public existe, `SITE_URL` (ex. `https://godet.ch`). Pas besoin de redéployer la fonction.
6. **Tâche planifiée** : déjà en place (migration `supabase/migrations/20261020120000_rappels_cron.sql`, appliquée
   le 20 octobre 2026) : tâche `godet-rappels`, chaque jour à 05:15 UTC. Relancer la migration met la tâche à jour
   sans la dupliquer.

Pour revenir à la simulation : supprimer `RESEND_API_KEY` (ou `EMAIL_FROM`) des secrets de la fonction.
Pour arrêter les rappels : `select cron.unschedule('godet-rappels');`.

## Tester

- **Appel manuel** (simulation tant que Resend n'est pas configuré) :
  `curl -X POST https://cluavztpktcmsynzvojf.supabase.co/functions/v1/rappels`
  Un second appel dans les 20 heures répond `skipped`. Pour relancer tout de suite (tests uniquement), dans
  l'éditeur SQL : `delete from public.job_runs where job = 'rappels';`
- **Ce qui serait parti** :
  `select created_at, kind, status, detail from public.notification_log order by created_at desc limit 20;`
- **Tâche planifiée** : `select jobname, schedule, active from cron.job;`,
  `select status, start_time from cron.job_run_details order by start_time desc limit 5;` et la réponse de la
  fonction : `select status_code, content from net._http_response order by created desc limit 5;`
- **Premier envoi réel** : avec un compte de test propriétaire d'une entreprise ayant une échéance proche,
  choisir « Chaque jour » dans les paramètres, vider `job_runs` (ci-dessus), puis appeler la fonction entre
  5 h et 20 h (heure de Zurich).
- **Tests automatiques de la fonction** (Deno 2) :
  `deno test --config supabase/functions/rappels/deno.json supabase/functions/rappels/` — règles d'échéance,
  destinataires, fréquence, contenu des e-mails, appels à Resend, garde-fou et exécution complète sur une base
  factice. Vérification des types : `deno check --config supabase/functions/rappels/deno.json supabase/functions/rappels/index.ts`.
- **Invitation** : branchée sur « Inviter une personne » (paramètres › Équipe). Tant que les variables Vercel
  manquent, rien ne part et l'écran donne le lien à copier (comme avant) ; une fois configuré, le bouton devient
  « Envoyer l'invitation », un champ « Langue de l'e-mail » apparaît, et l'e-mail part avec un lien dans cette
  langue (réponse adressée à la personne qui invite). `renderInvitationEmail(...)` donne l'objet, le HTML et le
  texte sans rien envoyer.

## Côté application

### Panneau des paramètres

```tsx
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

<section id="rappels">…<NotificationsPanel /></section>   // contenu seul : la page pose le titre et l'ancre
<NotificationsPanel standalone />                          // ou section autonome avec titre (ancre « rappels »)
```

Le panneau utilise la zone de messages `notifications` si la page la fournit (`pickMessages(…, ['notifications'])`),
sinon il pose son propre fournisseur avec ses textes. Les dates suivent le `FormatProvider` de la page.
Valeurs par défaut sans ligne enregistrée : rappel hebdomadaire, 14 jours, 50 h (interrupteur éteint pour une
personne qui n'est que machiniste).

### Envoi depuis Next (`src/lib/email`, serveur uniquement)

```ts
import { sendEmail, sendInvitationEmail } from '@/lib/email';

const res = await sendInvitationEmail({
  to: 'nouveau@exemple.ch',
  locale: 'de',                       // langue de l'e-mail
  orgName: 'Muster Bau AG',
  inviterName: 'Anna Keller',          // facultatif
  role: 'mechanic',
  link: 'https://…/de/invitation/<jeton>',
  expiresAt: invitation.expires_at,    // facultatif (sinon « valable 14 jours »)
  country: 'CH',                       // facultatif : format de la date
});
// res : { sent: true, id } | { sent: false, reason: 'not_configured' | 'invalid_recipient' | 'rejected' | … }
```

`sendEmail({ to, subject, html, text, replyTo? })` ne lève pas d'exception ; ses journaux ne contiennent que le
statut HTTP et le code d'erreur de Resend.

## Maintenance

- **Textes et gabarit partagés** : la fonction ne peut pas lire `messages/` ni `src/`. Après une modification de
  `messages/<langue>/emails.json`, de `messages/<langue>/domain.json` ou de `src/lib/email/layout.ts` :
  `node supabase/functions/rappels/sync.mjs` (régénère `messages.ts` et `layout.ts` ; `--check` vérifie qu'ils
  sont à jour), puis redéployer la fonction.
- **Redéployer** : `supabase functions deploy rappels --no-verify-jwt` (ou l'outil MCP `deploy_edge_function`
  avec `verify_jwt: false`).
- **Règles d'échéance** : `supabase/functions/rappels/dues.ts` reprend `weeklyRate` et `dueOf` de
  `src/lib/domain.ts` ; toute évolution de l'une doit être reportée dans l'autre.
- **TypeScript** : la fonction (Deno) est exclue du `tsconfig.json` de Next (`"exclude": ["supabase/functions"]`) ;
  on la vérifie avec `deno check` et `deno test`.
- **Volume** : une exécution traite quelques centaines de personnes (Resend : 10 requêtes par seconde, la fonction
  espace ses envois de 250 ms et s'arrête de commencer des envois après 110 s ; limites des fonctions : 150 s et 2 s
  de calcul). Au-delà : utiliser l'envoi groupé de Resend (`/emails/batch`) ou découper l'exécution par entreprise.
