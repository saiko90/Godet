# Plan de prospection — France

Troisième marché. La France permet l’e-mail et l’appel entre professionnels, sous conditions : c’est le marché le
plus rapide à tester, mais aussi le plus sollicité. On reste sur des volumes modestes et des messages vraiment
personnalisés. Règles générales : [README.md](README.md). Consignes de l’agent : [agents/france.md](agents/france.md).

## En bref

| | |
|---|---|
| Langue | Français de France (vouvoiement, formules de politesse françaises) |
| Volume | 25 nouvelles entreprises par semaine |
| Premier contact | E-mail personnalisé à une adresse générique ou professionnelle liée à la fonction ; lettre si aucune adresse |
| Séquence | J0 e-mail (ou lettre) · J+7 appel · J+14 e-mail court · J+30 lettre |
| Conditions | Message lié au métier, identité de l’expéditeur, origine des données, désinscription simple (CNIL) |
| Exclus | Entreprises individuelles en « diffusion partielle » dans Sirene (opposition à la prospection) |
| Code de suivi | `fr-AAMM-NNNN` |
| Arguments légaux | Registre de sécurité (art. R4323-25) et carnet de maintenance des appareils de levage (art. R4323-19, arrêté du 2 mars 2004) |

## 1. Segments

| Segment (`segment`) | Qui | Codes NAF (rév. 2) | Priorité |
|---|---|---|---|
| `terrassement` | Terrassement | 43.12A, 43.12B | ★★★ |
| `genie_civil` | Travaux publics, réseaux, ouvrages d’art | 42.13A, 42.21Z, 42.22Z, 42.91Z, 42.99Z | ★★★ |
| `route` | Routes et voiries | 42.11Z | ★★★ |
| `demolition` | Démolition, désamiantage avec parc | 43.11Z | ★★ |
| `location` | Loueurs de matériel de BTP | 77.32Z | ★★ (et partenaires) |
| `gravier` | Carrières, gravières, sablières | 08.12Z | ★★ |
| `paysagiste` | Entreprises du paysage avec engins | 81.30Z | ★★ |
| `commune` | Services techniques des communes et intercommunalités | — | ★ (cycle long) |
| `forestier` | Exploitation forestière, travaux forestiers | 02.20Z | ★ |
| `batiment` | Gros œuvre avec parc propre | 43.99C, 41.20A, 41.20B | ★ |

Taille visée : tranches d’effectif de 10 à 99 salariés (parc de 5 à 50 machines, à confirmer sur le site).

## 2. Régions

Commencer près de la Suisse : Haute-Savoie (74), Savoie (73), Ain (01), Isère (38), Rhône (69), Doubs (25),
Jura (39), Haut-Rhin (68) ; puis le reste d’Auvergne-Rhône-Alpes, de Bourgogne-Franche-Comté et du Grand Est ;
puis les autres régions. `region` = nom du département (« Haute-Savoie »).

## 3. Sources publiques

| Source | Ce qu’on y trouve | Usage |
|---|---|---|
| [Annuaire des entreprises](https://annuaire-entreprises.data.gouv.fr) et l’API Recherche d’entreprises (data.gouv.fr) | SIREN, raison sociale, NAF, effectif, adresse, dirigeants, statut de diffusion | Recherche par code NAF et département ; respecter les limites de l’API ; **exclure les unités en diffusion partielle** |
| Site de l’entreprise | Parc, chantiers, e-mail générique, mentions légales | Source principale des signaux |
| [BOAMP](https://www.boamp.fr) et [TED](https://ted.europa.eu) | Avis d’attribution de marchés de travaux | Signal fort, à citer |
| Associations : FNTP et fédérations régionales des travaux publics, Routes de France, UNEP (paysage), SNED (démolition), UNICEM (carrières), DLR (distribution et location), FNEDT (entrepreneurs des territoires) | Membres, annuaires publics | Consultation manuelle |
| Annuaire de l’administration (service-public.fr) | Mairies et services techniques : adresse, e-mail générique | Consultation manuelle |

Données : adresse e-mail générique (contact@, accueil@, travaux@) ou professionnelle nominative **seulement si la
personne exerce une fonction liée au sujet** (gérant, directeur technique, responsable du parc) et que l’adresse
est publiée par l’entreprise. Jamais d’adresse « reconstituée » (prénom.nom@ deviné).

## 4. Canaux autorisés

| Canal | Règle (CNIL) | Usage |
|---|---|---|
| E-mail | Sans consentement préalable si le message est lié à l’activité professionnelle du destinataire ; informer de l’origine des données et de la finalité ; désinscription simple dans chaque message ; identité de l’expéditeur | Étapes 1 et 3 ; une vingtaine par semaine |
| Téléphone | Possible entre professionnels (intérêt légitime) si l’appel concerne la profession ; se présenter ; respecter tout refus ; le régime d’opt-in du 11 août 2026 vise les consommateurs | Étape 2 |
| Lettre | Permise | Étape 4, ou étape 1 sans adresse e-mail |
| LinkedIn | Message individuel, à la main | Variante de l’étape 3 |
| Partenaires, salons | — | En continu |

## 5. Séquence

| Étape | Jour | Canal | But |
|---|---|---|---|
| 1 | J0 | E-mail personnalisé (ou lettre si pas d’adresse) | Faire ouvrir la démo 3D |
| 2 | J+7 | Appel (script) | Trouver la bonne personne, proposer d’envoyer le guide PDF et le lien de la démo par e-mail |
| 3 | J+14 | E-mail court | Rappel avec le lien direct |
| 4 | J+30 | Lettre avec QR code | Dernier contact, sur un autre support |

Sans réponse 14 jours après l’étape 4 : « Refus ou écarté », note « sans réponse ». Toute demande de désinscription :
statut « Ne pas contacter », le jour même.

## 6. Modèles de messages

`{…}` remplacé par l’agent ; `[[…]]` pour un passage à compléter (bloque la validation). Pas de prix.

### 6.1 E-mail, étape 1

Objet : `{Entreprise} : le carnet d’entretien de vos engins, sans papier`

```text
Bonjour,

{Phrase personnelle tirée d’un signal public, par exemple : « J’ai vu sur votre site que votre parc compte une quinzaine de pelles et de chargeuses sur les chantiers de Haute-Savoie. »}

Entre les services, les réparations, les VGP et les factures, le suivi d’un parc d’engins se disperse vite : carnets dans les cabines, rapports dans un classeur, échéances dans la tête du chef d’atelier.

Godet réunit tout au même endroit, machine par machine : entretiens, réparations, pièces, heures, rapports de vérification, photos et factures. Les échéances (entretien des 500 heures, vérifications périodiques) sont suivies pour vous, et vous voyez enfin ce que coûte chaque engin.

La démo 3D s’ouvre sans compte : {lien démo}
L’essai est gratuit pendant 15 jours, sans carte bancaire. Le guide de démarrage en PDF est sur godet.app/aide, et je réponds volontiers à vos questions par e-mail.

Bien cordialement,
{Signature}

—
{Raison sociale de l’expéditeur, adresse}. Nous vous écrivons parce que votre entreprise figure dans {source} et que ce message concerne la gestion de votre parc de matériel. Pour ne plus recevoir de message de notre part, répondez « STOP » ou écrivez-nous via {lien contact} : nous effacerons vos coordonnées.
```

### 6.2 Script d’appel, étape 2

```text
Bonjour, {Prénom Nom}, de Swiss Digital Studio. Je vous ai écrit la semaine dernière au sujet de Godet, le carnet d’entretien numérique des engins de chantier. Je ne vous prends que deux minutes : est-ce que je parle à la personne qui gère l’entretien du parc ?
— Non : « Qui s’en occupe chez vous ? Quand puis-je la joindre ? »
— Oui : « Aujourd’hui, comment suivez-vous les entretiens, les réparations et les VGP de vos engins ? »
   Écouter. Rebondir sur le point faible : papier, rapports éparpillés, échéances oubliées, coûts flous.
Proposition : « Je vous envoie le guide PDF et le lien de la démo par e-mail ? Vous pourrez me poser vos questions en réponse. »
À défaut : « Je vous renvoie le lien de la démo 3D ? Elle s’ouvre sans compte. »
Refus : « Merci, c’est noté, vous ne serez plus sollicité. »
```

### 6.3 E-mail court, étape 3

Objet : `Re : le carnet d’entretien de vos engins`

```text
Bonjour,

Je me permets de revenir vers vous au sujet de Godet. En deux minutes, la démo 3D vous montre le carnet complet d’une machine, ses échéances et ses coûts : {lien démo}

Si le sujet n’est pas d’actualité, dites-le-moi simplement : je ne vous relancerai plus.

Bien cordialement,
{Signature}

—
{Raison sociale de l’expéditeur, adresse}. Pour ne plus recevoir de message, répondez « STOP ».
```

### 6.4 Lettre, étape 4 (ou étape 1 sans adresse e-mail)

Objet : `Le carnet d’entretien de vos engins, enfin complet`

```text
Madame, Monsieur,

{Phrase personnelle tirée d’un signal public.}

Les résultats des vérifications générales périodiques se consignent au registre de sécurité, et les appareils de levage ont leur carnet de maintenance. À côté, il y a les entretiens, les réparations et les factures, souvent éparpillés.

Godet réunit tout au même endroit, machine par machine, et suit les échéances pour vous. Vous voyez enfin ce que coûte chaque engin, et votre parc apparaît dans un showroom 3D : vert, orange ou rouge, d’un coup d’œil.

Le plus simple est d’essayer : scannez le code au bas de cette lettre, la démo s’ouvre sans compte. L’essai est gratuit pendant 15 jours, sans carte bancaire.

Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

{Signature}
```

### 6.5 Message LinkedIn (à la main)

`Bonjour {Prénom}, je développe Godet, un carnet d’entretien numérique pour les parcs d’engins de chantier (entretiens, réparations, VGP, coûts par machine). Je serais heureux d’avoir votre avis de professionnel des travaux publics. Michaël`

### 6.6 Partenaire (loueur, distributeur, fédération)

Objet : `Un carnet d’entretien numérique pour vos clients`

```text
Madame, Monsieur,

Vous vendez, louez ou entretenez des engins de chantier en {région}. Vos clients tiennent le suivi de leurs machines de manière très variable, et c’est souvent vous qui en payez le prix : historique incomplet à la reprise, entretiens oubliés, garanties difficiles à suivre.

Godet est un carnet d’entretien numérique, toutes marques : chaque machine garde son historique complet (entretiens, réparations, pièces, heures, rapports, factures), imprimable en PDF pour une expertise ou une revente.

Je cherche quelques partenaires en France pour le faire connaître à leurs clients, avec {avantage proposé, à définir} pour ceux qui viennent de votre part. Seriez-vous disponible pour un échange de 20 minutes ?

Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

{Signature}
```

## 7. Arguments

1. **Les preuves de vérification** : les résultats des VGP sont consignés au registre de sécurité (code du travail,
   art. R4323-25) ; les appareils de levage ont un carnet de maintenance tenu à jour par l’employeur
   (art. R4323-19 ; arrêté du 2 mars 2004) — à vérifier selon l’usage de chaque engin (une pelle équipée pour le
   levage, par exemple). Godet garde rapports, échéances et historique de chaque engin, et les sort en PDF.
2. **Les coûts par machine** : pièces, main-d’œuvre, immobilisation, mois par mois.
3. **Les échéances** : entretiens en heures, vérifications en dates ; rappels avant l’échéance.
4. **Toutes marques**, anciennes et petites machines comprises ; complète la télématique.
5. **L’équipe** : rôles (propriétaire, administrateur, mécanicien, conducteur d’engin), saisie rapide sur téléphone.
6. **Hébergement dans l’UE** (Irlande), accès réservé à l’entreprise, rien ne s’efface.
7. **Sans risque** : démo 3D sans compte, essai de 15 jours sans carte bancaire.

Godet ne remplace pas l’organisme de contrôle : il conserve et rappelle.

## 8. Objections fréquentes

| Objection | Réponse |
|---|---|
| « On a déjà une GMAO. » | « Godet est pensé pour les engins : prise en main en dix minutes, sans installation, sur téléphone. Si votre GMAO vous suffit, gardez-la. » |
| « Les VGP, c’est l’organisme de contrôle qui s’en occupe. » | « Oui, et Godet garde ses rapports à côté de l’historique de la machine et vous rappelle la prochaine échéance. » |
| « Pas le temps. » | « Une saisie prend trente secondes sur le téléphone, photo comprise. » |
| « C’est combien ? » | « L’essai est gratuit 15 jours, sans carte. Les tarifs, par entreprise, sont annoncés avant la fin de l’essai. » |
| « Un éditeur suisse ? » | « L’application est en français, en euros et aux formats français ; les données sont hébergées dans l’UE. » |
| « D’où vient notre adresse ? » | « De {source}. Je peux la supprimer tout de suite si vous le souhaitez. » |
| « Pas intéressé. » | « Merci, c’est noté, vous ne serez plus sollicité. » → statut « Refus » (ou « Ne pas contacter ») |

## 9. Partenaires et salons

**Partenaires** : distributeurs et loueurs (DLR), fédérations régionales des travaux publics (FNTP), Routes de
France, UNEP, SNED, UNICEM, FNEDT, organismes de formation des conducteurs d’engins.

**Salons** (vérifier les dates auprès de l’organisateur) :

| Salon | Lieu | Dates | Public |
|---|---|---|---|
| Salon des maires et des collectivités locales | Paris, Porte de Versailles | 24–26.11.2026 | Communes, services techniques |
| Intermat | Paris-Nord Villepinte | 21–24.04.2027 | Matériel de construction |
| Paysalia | Lyon, Eurexpo | fin 2027 (à confirmer) | Paysage |

## 10. Particularités

- Adresse : ville en capitales sur la dernière ligne (« 74000 ANNECY »), puis « FRANCE » pour un envoi depuis la
  Suisse. Fenêtre à droite.
- Formats : 6 842 h, 1 240 € (l’application s’adapte au pays de l’entreprise).
- Vocabulaire : « conducteur d’engins » plutôt que « machiniste » ; « VGP » ; « parc matériel ».
- Sources : [README.md, section 10](README.md#10-sources) ; art. R4323-19 :
  <https://code.travail.gouv.fr/code-du-travail/r4323-19> ; art. R4323-25 :
  <https://content.preventionbtp.fr/pdf/droit_de_la_prevention/article-r4323-25-du-code-du-travail.pdf> ;
  arrêté du 2 mars 2004 :
  <https://content.preventionbtp.fr/pdf/droit_de_la_prevention/article-3-de-l-arrete-du-2-mars-2004-relatif-au-carnet-de-maintenance-des-appareils-de-levage.pdf> ;
  Salon des maires : <https://www.ffbatiment.fr/actualites-batiment/Agenda/salon-des-maires-2026> ;
  Intermat 2027 : <https://www.faymonville.com/events/upcoming/intermat-fr-paris/>.
