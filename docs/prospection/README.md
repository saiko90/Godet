# Prospection de Godet par agents IA

Godet (Swiss Digital Studio, Valais) est le carnet d’entretien numérique des machines de chantier, présenté dans un
showroom 3D. Démo sans compte : `/demo` (`/de/demo`, `/it/demo`, `/en/demo`). Essai gratuit de 30 jours, sans carte
de crédit.

Ce dossier décrit comment des agents IA, un par marché, **recherchent** des entreprises et **préparent** des messages,
et comment Michaël les **relit, valide et envoie lui-même** depuis la console `/admin`.

| Document | Contenu |
|---|---|
| [README.md](README.md) | Stratégie, règles légales, cycle de vie d’un prospect, codes de suivi, indicateurs, volumes, hygiène des données |
| [suisse.md](suisse.md) | Plan Suisse (romande, alémanique, Tessin) |
| [allemagne-autriche.md](allemagne-autriche.md) | Plan Allemagne et Autriche |
| [france.md](france.md) | Plan France |
| [italie.md](italie.md) | Plan Italie |
| [agents/](agents/) | Consignes complètes des agents (une tâche planifiée hebdomadaire par marché) |

> Ces documents résument des règles publiques et citent leurs sources. **Ce n’est pas un avis juridique.** Avant
> d’augmenter les volumes dans un pays, faites valider la démarche par un juriste ou par l’association professionnelle
> concernée.

---

## 1. Le principe non négociable

**Les agents recherchent et préparent. Ils n’envoient jamais rien.**

- Un agent ne contacte personne : pas d’e-mail, pas d’appel, pas de message LinkedIn, pas de formulaire rempli,
  aucun compte créé. Il écrit uniquement dans les tables `prospects` et `outreach` de Supabase.
- Chaque message est un **brouillon**. Michaël le relit, le corrige si besoin, le **valide**, l’envoie lui-même
  (lettre imprimée, appel, e-mail ou message LinkedIn tapé à la main), puis clique sur **« Marquer comme envoyé »**.
- Un prospect au statut **« Ne pas contacter »** n’est plus jamais contacté ni repris par un agent.
- Les agents ne dialoguent avec personne. Si un jour un agent répondait lui-même à un prospect (chat, e-mail),
  il devrait dire qu’il est une IA (AI Act, art. 50, applicable depuis le 2 août 2026).

Ce principe découle du droit de la prospection (section 3) et de la qualité : un message relu par un humain,
personnalisé, peu nombreux, convertit mieux qu’un envoi de masse.

## 2. Comment ça tourne

```
Agent du marché (tâche planifiée, chaque semaine)
  1. lit la liste « ne pas contacter » et les prospects existants
  2. cherche N entreprises dans des sources publiques autorisées
  3. dédoublonne (SQL), attribue un code de suivi, insère au statut « À valider »
  4. rédige le brouillon de l’étape 1 (canal autorisé, langue locale, lien de démo avec le code)
  5. prépare les relances échues (étapes 2 et suivantes), toujours en brouillon
  6. termine par un bilan

Console /admin (Michaël)
  Tableau de bord → Prospects « À valider » / « Avec brouillon à relire »
  Fiche prospect → relire, corriger → Valider → imprimer la lettre / copier le texte → envoyer soi-même
  → « Marquer comme envoyé » (la prochaine action est planifiée selon la séquence du pays)
  → « Réponse reçue » (les relances prévues sont annulées) → Démo → Essai → Client, ou Refus / Ne pas contacter
```

La console :

- `/admin` : à traiter (messages, idées, prospects à valider, brouillons, actions dues, visites), prospects par pays
  et statut, indicateurs, visites de démo des 30 derniers jours par code.
- `/admin/prospects` : filtres pays, statut, segment, recherche, actions dues, brouillons à relire.
- `/admin/prospects/<id>` : fiche complète, messages préparés (valider, modifier, marquer comme envoyé, réponse,
  annuler), suivi (statut, prochaine action, notes), liens de démo prêts à copier, visites, effacement.
- `/admin/prospects/<id>/lettre/<message>` : lettre A4 prête à imprimer (adresse placée pour une enveloppe à
  fenêtre, date, objet, texte, QR code et adresse courte de la démo, mention d’opposition et origine des données).
- `/admin/messages`, `/admin/idees`, `/admin/visites`.

Avant le premier envoi postal, complétez l’adresse de l’expéditeur dans `src/components/admin/letter-config.ts`
et faites une impression test avec vos enveloppes.

## 3. Règles légales par pays

### Synthèse des canaux

| Canal (B2B, premier contact) | Suisse | Allemagne | Autriche | France | Italie |
|---|---|---|---|---|---|
| **Lettre postale** | Oui | Oui | Oui | Oui | Oui (adresse hors annuaires téléphoniques, sinon vérifier le RPO) |
| **E-mail** | Seulement individuel, pertinent, à l’adresse générique, peu nombreux, avec désinscription ; jamais de masse | **Non** sans consentement exprès | **Non** sans consentement préalable | Oui si lié au métier du destinataire, avec information et désinscription | **Non** sans consentement |
| **Téléphone** | Oui, sauf numéros avec astérisque ; numéro affiché | Seulement avec consentement au moins présumé (intérêt concret) | **Non** sans consentement préalable | Oui si lié au métier, avec droit d’opposition | Seulement après vérification du RPO (payant) ; à éviter au départ |
| **LinkedIn (à la main)** | Oui, message individuel | Invitation sobre ; pas de publicité sans consentement | Invitation sobre ; pas de publicité sans consentement | Oui, message individuel | Invitation sobre ; pas de publicité sans consentement |
| **Partenaires, salons** | Oui | Oui | Oui | Oui | Oui |

« Oui » signifie « permis sous conditions » : identité de l’expéditeur, message pertinent pour l’entreprise,
moyen simple de refuser, respect immédiat de tout refus.

### Suisse

- **E-mail.** Est déloyal celui qui envoie de la **publicité de masse** par télécommunication sans consentement
  préalable, sans indiquer correctement l’émetteur ou sans signaler le droit de s’y opposer gratuitement
  (LCD/UWG art. 3 al. 1 let. o). Un e-mail **individuel et pertinent**, adressé à l’adresse générique d’une
  entreprise (info@…), avec l’identité de l’expéditeur et un moyen de refuser, reste en dehors de la « masse » ;
  c’est la limite à ne pas franchir : quelques messages personnalisés par semaine, jamais un envoi en série.
  L’OFCOM rappelle que l’envoi de masse automatisé exige le consentement et un moyen gratuit de refuser.
- **Téléphone.** Ne pas appeler un numéro dont l’inscription à l’annuaire porte la mention (astérisque) refusant la
  publicité (art. 3 al. 1 let. u). Appeler avec un numéro affiché, inscrit dans l’annuaire et dont on a l’usage
  (let. v).
- **Lettre, partenaires, salons** : canaux à privilégier.
- **Données (nLPD).** La loi ne protège que les personnes physiques : les coordonnées d’une SA ou d’une Sàrl ne
  sont pas des données personnelles ; celles d’une entreprise individuelle (« Pierre Dupont Terrassements ») ou
  d’un dirigeant nommé, si. Traitement licite si transparent et proportionné ; ne pas traiter contre la volonté
  exprimée de la personne (art. 30 al. 2 let. b) ; informer (art. 19) : la lettre indique l’origine des
  coordonnées et comment s’opposer.

### Allemagne

- **E-mail** : toujours une « nuisance inacceptable » sans **consentement exprès préalable**, que le destinataire
  soit un consommateur ou une entreprise (UWG § 7 al. 2 ch. 2) ; seule exception, les clients existants (§ 7 al. 3).
- **Téléphone** : envers une entreprise (« sonstiger Marktteilnehmer »), il faut au moins un **consentement
  présumé** (§ 7 al. 2 ch. 1), c’est-à-dire un intérêt concret et reconnaissable de l’entreprise pour l’offre.
  Un appel à froid sur la seule base d’un registre est risqué : n’appelez qu’une entreprise qui l’a demandé.
- **Messages LinkedIn ou XING** : traités comme du courrier électronique (OLG Hamm, 17.05.2023, 18 U 154/22) ;
  pas de message publicitaire sans consentement. Une invitation sobre, sans argumentaire, reste possible.
- **LinkedIn** interdit de toute façon l’automatisation (robots, envois automatiques) : tout se fait à la main.
- **Lettre postale** : permise ; respecter toute opposition (RGPD art. 21).

### Autriche

- **Appels** publicitaires sans consentement préalable interdits (TKG 2021 § 174 al. 1) ; **e-mail** de prospection
  sans consentement préalable interdit (§ 174 al. 3). Le texte ne distingue pas consommateurs et entreprises :
  la règle vaut en B2B.
- Restent : **lettre**, partenaires, salons, invitation LinkedIn sobre.

### France

- **E-mail B2B** : le consentement préalable n’est pas exigé si le message est **en lien avec l’activité
  professionnelle** de la personne contactée, si elle est **informée de l’origine de ses données et de la
  finalité**, et si elle peut **s’opposer simplement** (CNIL). Chaque message identifie l’expéditeur et contient
  un lien de désinscription qui fonctionne. Volumes modestes et messages personnalisés.
- **Téléphone B2B** : possible sur la base de l’intérêt légitime si l’appel concerne la profession ; informer et
  respecter l’opposition (CNIL). Le nouveau régime d’opt-in du 11 août 2026 vise le démarchage des consommateurs.
- **Sources** : la base Sirene est ouverte, mais une personne physique peut demander que ses données ne servent pas
  à la prospection (« diffusion partielle », code de commerce art. A123-96) : ces entreprises sont exclues.

### Italie

- **E-mail** promotionnel : consentement préalable obligatoire (Codice privacy, art. 130), y compris pour une
  adresse professionnelle et même si elle provient d’un registre public, d’un annuaire ou d’un site web
  (Garante, lignes directrices du 4 juillet 2013, § 2.5 et § 6.1).
- **Messages privés sur les réseaux sociaux** à partir des données d’un profil : illicites sans consentement
  préalable (même lignes directrices, « spam social ») ; LinkedIn seulement pour une invitation sans publicité.
- **Téléphone et courrier** : le Registro pubblico delle opposizioni (RPO) couvre les numéros et les adresses
  postales des annuaires téléphoniques ; le « contraente » peut être une personne morale. Avant un appel ou un
  courrier à une adresse tirée d’un annuaire, il faut consulter le RPO (accès payant). Les agents utilisent donc
  des adresses du registre des entreprises ou du site de l’entreprise, et n’appellent pas.

### Union européenne et règles communes

- **RGPD** (Allemagne, Autriche, France, Italie) : base « intérêt légitime » (art. 6 § 1 f ; considérant 47) pour
  les données B2B nécessaires ; information des personnes au plus tard au premier contact (art. 14) ; droit
  d’opposition absolu à la prospection (art. 21 § 2-3) ; effacement (art. 17).
- **AI Act, art. 50 § 1** (applicable depuis le 2 août 2026, non reporté par l’Omnibus numérique) : une personne
  qui interagit directement avec un système d’IA doit en être informée. Les agents ne dialoguent pas ; les messages
  sont relus, adoptés et envoyés par Michaël sous son nom.
- **LinkedIn** : l’accord d’utilisation interdit les robots et méthodes automatisées pour ajouter des contacts ou
  envoyer des messages. Rien n’est automatisé.

## 4. Cycle de vie d’un prospect

### Statuts du prospect (`prospects.status`)

| Statut | Libellé | Qui le pose | Signification et suite |
|---|---|---|---|
| `nouveau` | Nouveau | ajout manuel | Fiche créée sans message ; à compléter |
| `a_valider` | À valider | agent | Trouvé par un agent, brouillon de l’étape 1 prêt : relire |
| `pret` | Prêt | console (premier message validé) | Le message validé attend l’envoi |
| `contacte` | Contacté | console (« Marquer comme envoyé ») | Premier message envoyé ; relance planifiée |
| `relance` | Relancé | console (envoi d’une étape 2 ou plus) | Séquence en cours |
| `demo` | Démo | Michaël | Démonstration planifiée ou faite |
| `essai` | Essai | Michaël | Essai gratuit de 30 jours ouvert |
| `client` | Client | Michaël | Abonnement ; fin de la prospection |
| `refus` | Refus ou écarté | Michaël | Pas intéressé, sans réponse en fin de séquence, ou hors cible |
| `ne_pas_contacter` | Ne pas contacter | Michaël | Opposition : plus aucun contact, jamais repris par un agent |

### Statuts d’un message (`outreach.status`)

`brouillon` (préparé, modifiable) → `valide` (approuvé par Michaël : `approved_by`, `approved_at`) → `envoye`
(envoyé à la main : `sent_at`) → `reponse` (le prospect a répondu). `annule` : message abandonné.

### Ce que la console fait automatiquement

| Action dans la console | Effet |
|---|---|
| Valider le premier brouillon | Prospect `nouveau`/`a_valider` → `pret` |
| Marquer comme envoyé | Message → `envoye` ; prospect → `contacte` (ou `relance` dès l’étape 2) ; canal enregistré ; prochaine action = étape suivante de la séquence du pays (dernière étape : +14 jours pour classer) |
| Réponse reçue | Message → `reponse` ; brouillons et messages validés restants annulés ; prochaine action = aujourd’hui |
| Client, Refus, Ne pas contacter | Messages encore ouverts annulés |
| Ne pas contacter | Prochaine action effacée ; validation, envoi et nouveaux messages bloqués |
| Effacer les coordonnées | Messages supprimés ; coordonnées, signaux et notes effacés ; nom, pays, NPA gardés au statut « Ne pas contacter » |

Un brouillon qui contient `[[…]]` (passage à compléter laissé par l’agent) ne peut pas être validé.

### Séquences (jours depuis le premier envoi)

| Marché | Étape 1 | Étape 2 | Étape 3 | Étape 4 |
|---|---|---|---|---|
| Suisse | J0 lettre | J+10 appel (ou lettre courte) | J+20 e-mail individuel à l’adresse générique (ou LinkedIn) | J+35 dernier message |
| Allemagne, Autriche | J0 lettre | J+14 lettre courte | J+35 invitation LinkedIn sans publicité | — |
| France | J0 e-mail (ou lettre) | J+7 appel | J+14 e-mail court | J+30 lettre |
| Italie | J0 lettre | J+15 lettre courte | J+35 invitation LinkedIn sans publicité | — |

Après la dernière étape sans réponse : statut « Refus ou écarté », note « sans réponse ». Une réponse, une
demande de contact ou une visite répétée de la démo font passer la suite à Michaël, en direct.

## 5. Codes de suivi

Chaque prospect reçoit un code unique : **`cc-AAMM-NNNN`**, par exemple `ch-2610-0042`.

- `cc` : pays en minuscules (`ch`, `de`, `at`, `fr`, `it`) ;
- `AAMM` : année et mois de création (`2610` = octobre 2026, fuseau Europe/Zurich) ;
- `NNNN` : numéro dans le mois et le pays, sur quatre chiffres, sans trou volontaire.

Règle technique : `^[a-z0-9-]{4,40}$`, unique (`prospects.ref_code`). Le code ne contient jamais de nom ni de donnée
personnelle.

Liens, selon la langue du prospect (français sans préfixe) :

| Langue | Démo 3D | Demande de démonstration |
|---|---|---|
| fr | `/demo?ref=ch-2610-0042` | `/contact?sujet=demo&ref=ch-2610-0042` |
| de | `/de/demo?ref=ch-2610-0042` | `/de/contact?sujet=demo&ref=ch-2610-0042` |
| it | `/it/demo?ref=ch-2610-0042` | `/it/contact?sujet=demo&ref=ch-2610-0042` |
| en | `/en/demo?ref=ch-2610-0042` | `/en/contact?sujet=demo&ref=ch-2610-0042` |

Ce qui est mesuré : chaque ouverture d’un lien avec code crée une ligne `demo_visits` (code, page, langue, heure ;
au plus une par minute et par code ; aucune donnée sur la personne). Le code est gardé 30 jours dans le cookie
`godet-ref` et transmis à l’inscription (`profiles.signup_ref`). La console relie visites, messages de contact et
prospects par ce code.

Prochain numéro (utilisé par les agents) :

```sql
select coalesce(max(substring(ref_code from '^ch-\d{4}-(\d{4})$')::int), 0) + 1 as prochain
from public.prospects
where ref_code like 'ch-' || to_char(now() at time zone 'Europe/Zurich', 'YYMM') || '-%';
```

## 6. Indicateurs

Calculés par marché sur le tableau de bord, sur les prospects **contactés** (au moins un message envoyé) :

| Indicateur | Définition | Repère de départ |
|---|---|---|
| Taux de réponse | Prospects avec au moins une « Réponse reçue » ÷ contactés | hypothèse : quelques pour cent ; à mesurer |
| Taux de visite | Prospects contactés dont le code a au moins une visite de démo ÷ contactés | à mesurer : c’est le meilleur signal précoce |
| Taux de démo | Prospects au statut Démo, Essai ou Client ÷ contactés | 0,6 % (prudent) à 1,5 % (ambitieux), 1 % réaliste |
| Conversion | Clients ÷ contactés ; et Clients ÷ Démos | 20 à 30 % des démos et essais |

Repères tirés du modèle financier du projet (scénarios prudent, réaliste, ambitieux) : à confirmer sur les
**300 à 500 premiers prospects** d’un marché avant de dupliquer l’agent. Suivez aussi, chaque semaine : nouveaux
prospects, brouillons validés, envois, actions dues non traitées, oppositions (un taux d’opposition qui monte
signale un ciblage ou un ton à revoir).

## 7. Volumes hebdomadaires raisonnables

Le facteur limitant n’est pas l’agent, c’est le temps de relecture, d’envoi et de suivi de Michaël.

| Phase | Agents actifs | Nouveaux prospects par semaine | Envois par semaine |
|---|---|---|---|
| Démarrage (4 semaines) | Suisse, phase romande | 25 | 25 lettres + relances |
| Suisse complète | Suisse (FR, DE, IT) | 25 à 40 | 25 à 40 lettres, 10 à 15 appels |
| Ouverture d’un 2e marché | + Allemagne-Autriche | +25 | +25 lettres |
| Régime de croisière | 4 agents | 25 par marché (100 au total) | au plus 100 premiers envois |

Plafonds de prudence : e-mails en Suisse, une dizaine par semaine, toujours individuels ; e-mails en France, une
vingtaine par semaine, personnalisés ; invitations LinkedIn, une quinzaine par semaine, à la main. On n’ouvre un
nouveau marché que lorsque le précédent tourne (brouillons relus chaque semaine, actions dues traitées).

## 8. Hygiène des données

- **Minimisation.** On ne collecte que des données d’entreprise utiles : raison sociale, identifiant légal, adresse,
  site, téléphone du standard, adresse e-mail **générique** (info@, contact@, office@), segment, estimation du parc,
  signaux publics. Jamais de numéro de portable privé, d’adresse personnelle, de date de naissance ni de donnée
  sensible. Un nom de dirigeant seulement s’il figure au registre du commerce ou sur le site de l’entreprise.
- **Source obligatoire.** `prospects.source` dit d’où viennent les données (« Registre du commerce (Zefix) —
  https://… »). La partie avant « — » est imprimée sur la lettre (origine des coordonnées).
- **Doublons.** Index unique pays + nom + NPA ; avant chaque insertion, les agents comparent aussi identifiant légal,
  domaine du site et téléphone (requête dans les consignes). Une entreprise déjà présente, quel que soit son statut,
  n’est jamais réinsérée.
- **Ne pas contacter.** Toute demande de ne plus être contacté, sous n’importe quelle forme (téléphone, lettre,
  e-mail, LinkedIn), est enregistrée le jour même : statut « Ne pas contacter ». La fiche reste (c’est elle qui
  empêche un agent de reprendre l’entreprise).
- **Effacement.** Sur demande : bouton « Effacer les coordonnées » (supprime messages, coordonnées, signaux, notes ;
  garde nom, pays et NPA en « Ne pas contacter »). « Supprimer la fiche » efface tout, mais l’entreprise pourrait
  alors être retrouvée par un agent : à réserver aux erreurs de saisie.
- **Durée.** Un prospect sans réponse en fin de séquence est classé « Refus ou écarté ». Revue annuelle : effacer
  les coordonnées des fiches écartées depuis plus de 24 mois.
- **Transparence.** Chaque lettre indique l’origine des coordonnées, la page de confidentialité et comment s’opposer.
  La politique de confidentialité du site devrait mentionner la prospection B2B et l’usage d’outils d’IA pour
  rechercher des entreprises et préparer les messages.
- **Accès.** Les tables de prospection sont réservées à l’administration de la plateforme
  (`private.is_platform_admin()`). Les agents écrivent avec l’outil Supabase `execute_sql` : jamais de clé dans
  un document ou un message.

## 9. Routine conseillée

| Quand | Quoi | Durée |
|---|---|---|
| Lundi 05:47 | L’agent Suisse tourne (tâche planifiée) ; Allemagne-Autriche le mardi, France le mercredi, Italie le jeudi | — |
| Lundi | Relire les prospects « À valider » et les brouillons ; corriger ; valider | 30 à 60 min par marché |
| Mardi | Imprimer et poster les lettres, marquer comme envoyé ; appels du jour | 1 h |
| Chaque jour | Messages de contact, réponses, actions dues | 15 min |
| Vendredi | Tableau de bord : indicateurs, visites, ajustements des modèles | 15 min |

Tâches planifiées (application Claude, liste des tâches planifiées) : « Godet — prospection Suisse (hebdo) » est
active ; « Allemagne-Autriche », « France » et « Italie » sont créées **en pause**, à activer une par une quand la
relecture suisse est devenue une routine. Chaque tâche relit sa consigne `agents/<pays>.md` sur la branche `main` :
une consigne modifiée et poussée sur `main` s’applique dès l’exécution suivante.

## 10. Sources

- LCD (RS 241), art. 3 al. 1 let. o, u et v : <https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/fr> ;
  texte consulté via <https://juriup.ch/lois/lcd/art-3/>
- OFCOM, quand l’envoi de masse est-il autorisé : <https://www.bakom.admin.ch/en/when-is-mass-sending-allowed>
- nLPD (RS 235.1) : <https://www.fedlex.admin.ch/eli/cc/2022/491/fr>
- UWG § 7 (Allemagne) : <https://www.gesetze-im-internet.de/uwg_2004/__7.html>
- OLG Hamm, 18 U 154/22 (messages via réseaux sociaux) :
  <https://www.it-recht-kanzlei.de/olg-hamm-werbenachrichten-internetportale-social-media-einwilligung-erforderlich.html>
- TKG 2021 § 174 (Autriche) : <https://www.ris.bka.gv.at/eli/bgbl/i/2021/190/P174/NOR40238632>
- CNIL, communication électronique, quelles règles : <https://www.cnil.fr/fr/communication-electronique-quelles-regles>
- CNIL, prospection par téléphone : <https://cnil.fr/fr/prospection-commerciale-par-telephone-hors-automate-dappel-quelles-sont-les-regles>
- Sirene, unités à diffusion partielle : <https://www.data.gouv.fr/dataservices/api-sirene-dont-unites-a-diffusion-partielle>
- Garante privacy, lignes directrices du 4 juillet 2013 (spam, spam social) :
  <https://www.garanteprivacy.it/home/docweb/-/docweb-display/print/2542348>
- Registro pubblico delle opposizioni (numéros et adresses postales) :
  <https://www.agendadigitale.eu/sicurezza/privacy/registro-pubblico-opposizioni-cosa-cambia-per-gli-operatori-guida-completa/>
- RGPD : <https://eur-lex.europa.eu/eli/reg/2016/679/oj>
- AI Act (règlement 2024/1689), art. 50 : <https://eur-lex.europa.eu/eli/reg/2024/1689/oj> ;
  <https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50> ; Omnibus numérique sans report de l’art. 50 :
  <https://alinajafzadeh.at/blog/eu-ai-act-article-50-transparency-august-2026.html>
- LinkedIn, logiciels et extensions interdits : <https://www.linkedin.com/help/linkedin/answer/a1341387> ;
  accord d’utilisation : <https://www.linkedin.com/legal/user-agreement>
- Repères de taux : `claude/godet-potentiel-2026-10-19.md` (projet Swiss Digital Studio)
