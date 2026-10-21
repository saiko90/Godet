# Plan de prospection — Suisse

Premier marché de Godet : la Suisse romande d’abord (proximité, langue), puis la Suisse alémanique
(l’essentiel du marché), puis le Tessin. Règles générales, statuts et indicateurs : [README.md](README.md).
Consignes de l’agent : [agents/suisse.md](agents/suisse.md).

## En bref

| | |
|---|---|
| Langues | Français, allemand (orthographe suisse : « ss »), italien |
| Phases | 1. Romandie (4 semaines) · 2. + Suisse alémanique · 3. + Tessin et Grisons italophones |
| Volume | 25 nouvelles entreprises par semaine au départ, puis 25 à 40 |
| Canal principal | Lettre personnalisée avec lien court vers la démo |
| Relances | Appel (J+10), e-mail individuel à l’adresse générique ou LinkedIn (J+20), dernier message (J+35) |
| Code de suivi | `ch-AAMM-NNNN` |
| Argument légal | Art. 32b OPA / VUV / OPI : entretien selon le fabricant, **consigné** |

## 1. Segments

| Segment (`segment`) | Qui | Parc typique | Signaux à chercher | Priorité |
|---|---|---|---|---|
| `terrassement`, `genie_civil` | Entreprises de terrassement et de génie civil, 10 à 150 personnes | 5 à 50 machines : pelles, mini-pelles, chargeuses, dumpers, camions | Page « Notre parc » / « Maschinenpark », photos de chantier, adjudications simap.ch | ★★★ |
| `route` | Construction et entretien de routes | finisseurs, rouleaux, fraiseuses, camions | Adjudications routières cantonales et communales | ★★★ |
| `demolition` | Démolition, déconstruction, recyclage | pelles lourdes, concasseurs, chargeuses | Membre de l’ARV, chantiers de déconstruction | ★★ |
| `batiment` | Gros œuvre avec parc propre | grues, mini-pelles, chariots | Parc visible sur le site | ★★ |
| `location` | Loueurs de machines | 20 à 300 machines | Catalogue de location en ligne | ★★ (et partenaires) |
| `gravier` | Gravières, carrières, centrales à béton | chargeuses, dumpers, pelles | Membre FSKB | ★★ |
| `commune` | Communes : voirie, service technique, Werkhof | 3 à 15 engins : chargeuses, balayeuses, camions, chasse-neige | Site de la commune, budgets publics | ★★ (cycle plus long) |
| `paysagiste` | Paysagistes avec mini-pelles et chargeuses | 3 à 15 machines | Membre JardinSuisse, parc sur le site | ★ |
| `forestier` | Entreprises de travaux forestiers | débardeuses, porteurs, abatteuses | Associations forestières, Agrama, Forstmesse | ★ |
| `agricole` | Entrepreneurs de travaux agricoles | tracteurs, ensileuses | — | hors cible principale |

Taille visée : **5 à 50 machines**. En dessous, l’intérêt existe mais le budget est faible ; au-dessus, les achats
passent souvent par un service central (à approcher plus tard, avec références).

Codes NOGA indicatifs pour reconnaître l’activité : 42.11 (routes), 42.21 à 42.99 (génie civil), 43.11
(démolition), 43.12 (terrassement, préparation des sites), 43.99 (gros œuvre), 77.32 (location de machines de
construction), 08.12 (gravières), 81.30 (aménagement paysager), 02.20 (exploitation forestière).

## 2. Régions et langue de contact

| Langue | Cantons et régions |
|---|---|
| Français | GE, VD, NE, JU ; FR (partie francophone) ; VS (Valais romand) ; BE (Jura bernois) ; Bienne si le site de l’entreprise est en français |
| Allemand | ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, SO, BS, BL, SH, AR, AI, SG, AG, TG, GR (majorité) ; Haut-Valais ; Singine et Lac (FR) |
| Italien | TI ; GR (Mesolcina, Calanca, Bregaglia, Poschiavo) |

Règle : la langue du prospect (`locale`) est celle de la commune du siège ; dans les communes bilingues, celle du
site web de l’entreprise. `region` reçoit le nom du canton (« Valais », « Zürich », « Ticino »).

Ordre conseillé dans la phase romande : Valais, Vaud, Fribourg, Genève, Neuchâtel, Jura, Jura bernois. Dans la
phase alémanique : Berne, Zurich, Argovie, Lucerne, Saint-Gall, Grisons, puis les autres.

## 3. Sources publiques

| Source | Ce qu’on y trouve | Usage |
|---|---|---|
| [Zefix](https://www.zefix.ch) (index central des raisons de commerce) | Raison sociale exacte, numéro IDE (`CHE-…`), siège, but, radiations | Recherche manuelle, fiche par fiche ; pas d’extraction en série |
| [Registre IDE](https://www.uid.admin.ch) | Vérifier le numéro IDE et que l’entreprise est active | Contrôle ponctuel |
| [FOSC / SHAB](https://www.shab.ch) | Inscriptions, changements de siège, de raison sociale | Signal (nouvelle entreprise, reprise) |
| [simap.ch](https://www.simap.ch) | Adjudications de marchés publics (génie civil, routes) | Signal fort : chantier gagné, à citer comme source |
| Site de l’entreprise | Parc de machines, chantiers, adresse, e-mail générique, langue | Source principale des signaux |
| Listes publiques des associations : SSE et sections cantonales, infra suisse, JardinSuisse, FSKB, ARV | Membres par région | Consultation manuelle ; ne pas copier une liste entière |
| Annuaires local.ch, search.ch | Téléphone du standard, adresse ; **astérisque = refus de publicité** | Consultation manuelle ; aucune extraction automatisée |
| Sites des communes | Service technique, voirie, Werkhof : adresse et e-mail générique | Consultation manuelle |

Règles d’usage : respecter les conditions d’utilisation et le fichier robots.txt de chaque site ; consulter page
par page, à rythme humain ; aucune aspiration massive ; toujours noter la source (`source`, avec l’adresse de la
page). Les données d’une entreprise individuelle sont des données personnelles : seulement ce qui sert à la
prospection (raison sociale, adresse professionnelle, standard).

## 4. Canaux autorisés en Suisse

| Canal | Règle | Usage dans la séquence |
|---|---|---|
| Lettre | Permise ; mention de l’expéditeur, de l’origine des coordonnées et du droit de s’opposer (imprimées automatiquement) | Étapes 1 et 4 |
| Téléphone | Pas de numéro marqué d’un astérisque dans l’annuaire (LCD art. 3 al. 1 let. u) ; numéro affiché et inscrit (let. v) ; un refus clôt le dossier | Étape 2 |
| E-mail | Individuel, pertinent, à l’**adresse générique** de l’entreprise, peu nombreux (une dizaine par semaine), avec identité et désinscription ; jamais de masse (LCD art. 3 al. 1 let. o) | Étape 3 |
| LinkedIn | Message écrit et envoyé à la main, personnalisé ; aucune automatisation | Étape 3 (variante) |
| Partenaires | Loueurs, concessionnaires, ateliers, associations, centres de formation | En continu |
| Salons | Voir section 9 | Selon le calendrier |

## 5. Séquence

| Étape | Jour | Canal | But |
|---|---|---|---|
| 1 | J0 | Lettre personnalisée + lien court de la démo | Faire ouvrir la démo 3D |
| 2 | J+10 | Appel (script) ; à défaut, lettre courte | Trouver la bonne personne, proposer d’envoyer le guide PDF et le lien de la démo par e-mail |
| 3 | J+20 | E-mail individuel à l’adresse générique, ou invitation LinkedIn | Donner le lien direct, rester simple |
| 4 | J+35 | Lettre courte ou e-mail : dernier message | Clore poliment ; garder la porte ouverte |

Sans réponse 14 jours après l’étape 4 : statut « Refus ou écarté », note « sans réponse ».
Une visite de la démo avec le code (tableau de bord) rend l’appel de l’étape 2 prioritaire. Une réponse arrête
la séquence : Michaël prend le relais (réponses par e-mail, guide PDF ; jamais de visite).

Si l’appel en allemand ou en italien n’est pas possible, l’étape 2 devient la lettre courte.

## 6. Modèles de messages

Les accolades `{…}` sont remplacées par l’agent. Ce qu’il ne sait pas, il l’écrit `[[à compléter : …]]` : la
console refuse de valider tant que ce passage existe. Pour une lettre, le texte va de la formule d’appel à la
signature : l’adresse, la date, l’objet, l’encadré avec le lien de la démo et la mention d’opposition sont ajoutés à
l’impression. Pas de prix dans les messages : l’essai est gratuit et les tarifs sont annoncés avant la fin de
l’essai.

### 6.1 Lettre, étape 1

**Français** — objet : `Le carnet d’entretien de vos machines, enfin complet`

```text
Madame, Monsieur,

{Phrase personnelle tirée d’un signal public, par exemple : « Vos pelles et vos dumpers travaillent toute l’année sur les chantiers du Valais central. »}

Pour chaque machine, l’OPA (art. 32b) demande un entretien conforme aux indications du fabricant et des résultats consignés. Dans beaucoup d’entreprises, ce suivi est éparpillé : carnets dans les cabines, factures dans un classeur, échéances dans la tête du chef d’atelier.

Godet réunit tout au même endroit : services, réparations, pièces, heures, photos et factures, machine par machine. Les échéances (service des 500 heures, contrôle annuel) sont suivies pour vous, et vous voyez enfin ce que coûte chaque engin. Votre parc apparaît dans un showroom 3D : vert, orange ou rouge, d’un coup d’œil.

Déjà un GPS sur vos machines ? Godet le complète : le GPS donne la position et les heures, Godet garde l’historique de l’entretien.

Le plus simple est d’essayer : ouvrez godet.app/demo/{code}, la démo s’ouvre sans compte. Si elle vous parle, l’essai est gratuit pendant 15 jours, sans carte de crédit. Le guide de démarrage en PDF est sur godet.app/aide, et je réponds volontiers à vos questions par e-mail.

Avec mes meilleures salutations

{Signature}
```

**Deutsch** — Betreff: `Das Wartungsheft Ihrer Baumaschinen, endlich vollständig`

```text
Sehr geehrte Damen und Herren

{Persönlicher Satz aus einem öffentlichen Hinweis, zum Beispiel: «Ihre Bagger und Dumper sind das ganze Jahr auf Baustellen im Berner Seeland unterwegs.»}

Nach Art. 32b VUV sind Arbeitsmittel gemäss den Angaben des Herstellers instand zu halten, und die Instandhaltung ist zu dokumentieren. In vielen Betrieben ist das verstreut: Servicehefte in der Kabine, Rechnungen im Ordner, Termine im Kopf des Werkstattchefs.

Godet bündelt alles an einem Ort: Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Fotos und Rechnungen, Maschine für Maschine. Fällige Termine (Service alle 500 Stunden, jährliche Kontrolle) werden für Sie verfolgt, und Sie sehen endlich, was jede Maschine kostet. Ihr Maschinenpark erscheint in einem 3D-Showroom: grün, orange oder rot, auf einen Blick.

Sie haben bereits GPS auf Ihren Maschinen? Godet ergänzt es: Das GPS liefert Standort und Stunden, Godet die Wartungsgeschichte.

Am einfachsten probieren Sie es aus: Öffnen Sie godet.app/de/demo/{code}, die Demo öffnet sich ohne Konto. Danach testen Sie Godet 15 Tage kostenlos, ohne Kreditkarte. Die Kurzanleitung als PDF finden Sie unter godet.app/de/aide, und Ihre Fragen beantworte ich gerne per E-Mail.

Freundliche Grüsse

{Signatur}
```

**Italiano** — oggetto: `Il libretto di manutenzione delle Sue macchine, finalmente completo`

```text
Gentili Signore e Signori,

{Frase personale basata su un segnale pubblico, ad esempio: «Le Sue macchine lavorano tutto l’anno nei cantieri del Sottoceneri.»}

L’art. 32b dell’OPI chiede che le attrezzature di lavoro siano mantenute secondo le indicazioni del fabbricante e che la manutenzione sia documentata. In molte imprese queste informazioni sono sparse: libretti in cabina, fatture in un raccoglitore, scadenze nella memoria del capo officina.

Godet riunisce tutto in un unico posto: manutenzioni, riparazioni, ricambi, ore di funzionamento, foto e fatture, macchina per macchina. Le scadenze (manutenzione ogni 500 ore, controllo annuale) sono seguite per Lei, e finalmente sa quanto costa ogni macchina. Il Suo parco macchine appare in uno showroom 3D: verde, arancione o rosso, a colpo d’occhio.

Ha già un GPS sulle Sue macchine? Godet lo completa: il GPS dà la posizione e le ore, Godet conserva la storia della manutenzione.

Il modo più semplice è provarlo: apra godet.app/it/demo/{code}, la demo si apre senza account. Se Le interessa, la prova è gratuita per 15 giorni, senza carta di credito. La guida introduttiva in PDF è su godet.app/it/aide e rispondo volentieri alle Sue domande per e-mail.

Cordiali saluti

{Firma}
```

### 6.2 Lettre courte (étape 2 sans appel, ou étape 4)

**Français** — objet (étape 2) : `Avez-vous pu ouvrir la démo ?` ; objet (étape 4) : `Un dernier mot sur Godet`

```text
Madame, Monsieur,

Je vous ai écrit il y a quelques semaines au sujet de Godet, le carnet d’entretien numérique des machines de chantier.

Si le suivi des services, des réparations et des coûts de vos machines vous prend du temps, la démo 3D vous montre en deux minutes comment Godet s’en charge. Elle s’ouvre sans compte avec le code ci-dessous.

{Étape 4 seulement : « C’est mon dernier courrier : si ce n’est pas le moment, vous ne recevrez plus rien de notre part. »}

Avec mes meilleures salutations

{Signature}
```

**Deutsch** — Betreff: `Konnten Sie die Demo schon öffnen?` / `Ein letztes Wort zu Godet`

```text
Sehr geehrte Damen und Herren

Vor einigen Wochen habe ich Ihnen Godet vorgestellt, das digitale Wartungsheft für Baumaschinen.

Wenn Sie das Nachführen von Wartungen, Reparaturen und Kosten Ihrer Maschinen viel Zeit kostet, zeigt Ihnen die 3D-Demo in zwei Minuten, wie Godet das übernimmt. Sie öffnet sich ohne Konto unter godet.app/de/demo/{code}.

{Nur Schritt 4: «Das ist mein letzter Brief: Wenn es gerade nicht passt, erhalten Sie keine weitere Post von uns.»}

Freundliche Grüsse

{Signatur}
```

**Italiano** — oggetto: `Ha potuto aprire la demo?` / `Un’ultima parola su Godet`

```text
Gentili Signore e Signori,

alcune settimane fa Le ho presentato Godet, il libretto di manutenzione digitale delle macchine edili.

Se seguire manutenzioni, riparazioni e costi delle Sue macchine Le porta via tempo, la demo 3D Le mostra in due minuti come Godet se ne occupa. Si apre senza account con il codice qui sotto.

{Solo passo 4: «È la mia ultima lettera: se non è il momento giusto, non riceverà altro da parte nostra.»}

Cordiali saluti

{Firma}
```

### 6.3 Script d’appel (étape 2)

Avant d’appeler : vérifier dans l’annuaire que le numéro ne porte pas d’astérisque ; appeler depuis un numéro
affiché ; noter le résultat dans la fiche. Si la personne demande à ne plus être contactée : statut « Ne pas
contacter », le jour même.

**Français**

```text
Bonjour, {Prénom Nom}, de Swiss Digital Studio, en Valais. Je vous appelle au sujet de la lettre que je vous ai envoyée sur Godet, le carnet d’entretien numérique des machines de chantier. Je ne vous prends que deux minutes : est-ce que je parle à la personne qui s’occupe de l’entretien du parc ?
— Non : « Qui s’en occupe chez vous ? Quand puis-je la joindre ? »
— Oui : « Aujourd’hui, comment suivez-vous les services et les réparations de vos machines ? »
   Écouter. Rebondir sur le point faible : papier, factures éparpillées, contrôles oubliés, coûts flous.
Proposition : « Je vous envoie le guide PDF et le lien de la démo par e-mail ? Vous pourrez me poser vos questions en réponse. »
À défaut : « Je vous envoie le lien de la démo 3D ? Elle s’ouvre sans compte. » (e-mail individuel à l’adresse qu’on vous donne)
Refus : « Merci, c’est noté, je ne vous relancerai pas. »
```

**Deutsch**

```text
Grüezi, hier ist {Vorname Name} von Swiss Digital Studio aus dem Wallis. Ich rufe wegen meines Briefs zu Godet an, dem digitalen Wartungsheft für Baumaschinen. Es dauert nur zwei Minuten: Spreche ich mit der Person, die sich um die Wartung des Maschinenparks kümmert?
— Nein: «Wer ist bei Ihnen dafür zuständig? Wann erreiche ich die Person am besten?»
— Ja: «Wie verfolgen Sie heute die Wartungen und Reparaturen Ihrer Maschinen?»
   Zuhören. Am Schwachpunkt anknüpfen: Papier, verstreute Rechnungen, vergessene Kontrollen, unklare Kosten.
Vorschlag: «Darf ich Ihnen die PDF-Anleitung und den Demo-Link per E-Mail schicken? Ihre Fragen beantworte ich gerne schriftlich.»
Sonst: «Darf ich Ihnen den Link zur 3D-Demo schicken? Sie öffnet sich ohne Konto.»
Absage: «Danke, ich habe es notiert und melde mich nicht mehr.»
```

**Italiano**

```text
Buongiorno, sono {Nome Cognome} di Swiss Digital Studio, in Vallese. La chiamo per la lettera su Godet, il libretto di manutenzione digitale delle macchine edili. Le rubo solo due minuti: parlo con la persona che si occupa della manutenzione del parco macchine?
— No: «Chi se ne occupa da voi? Quando posso raggiungere questa persona?»
— Sì: «Oggi come tenete traccia delle manutenzioni e delle riparazioni delle macchine?»
   Ascoltare. Riprendere il punto debole: carta, fatture sparse, controlli dimenticati, costi poco chiari.
Proposta: «Posso inviarLe per e-mail la guida PDF e il link della demo? Risponderò volentieri alle Sue domande per iscritto.»
Altrimenti: «Posso inviarLe il link della demo 3D? Si apre senza account.»
Rifiuto: «Grazie, ne prendo nota e non La ricontatterò.»
```

### 6.4 E-mail individuel (étape 3, adresse générique uniquement)

**Français** — objet : `Godet : la démo 3D de votre parc, sans compte`

```text
Bonjour,

Je vous ai écrit récemment au sujet de Godet, le carnet d’entretien numérique des machines de chantier. Voici le lien direct vers la démo 3D, sans compte : {lien démo}

En deux minutes, vous voyez comment chaque machine garde son carnet complet (services, réparations, pièces, heures, coûts) et comment les échéances sont suivies.

Une question ? Répondez simplement à ce message. Le guide de démarrage en PDF est sur godet.app/aide.

Meilleures salutations
{Signature}

—
{Raison sociale de l’expéditeur, adresse}. Vous recevez ce message parce que votre entreprise figure dans {source}. Pour ne plus recevoir de message de notre part, répondez « stop » : nous effacerons vos coordonnées.
```

**Deutsch** — Betreff: `Godet: die 3D-Demo für Ihren Maschinenpark, ohne Konto`

```text
Guten Tag

Kürzlich habe ich Ihnen Godet vorgestellt, das digitale Wartungsheft für Baumaschinen. Hier der direkte Link zur 3D-Demo, ohne Konto: {Link Demo}

In zwei Minuten sehen Sie, wie jede Maschine ihr vollständiges Wartungsheft behält (Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Kosten) und wie fällige Termine verfolgt werden.

Fragen? Antworten Sie einfach auf diese Nachricht. Die Kurzanleitung als PDF finden Sie unter godet.app/de/aide.

Freundliche Grüsse
{Signatur}

—
{Absender, Adresse}. Sie erhalten diese Nachricht, weil Ihr Unternehmen in {Quelle} aufgeführt ist. Wenn Sie keine Nachrichten mehr von uns wünschen, antworten Sie mit «Stopp»: Wir löschen Ihre Angaben.
```

**Italiano** — oggetto: `Godet: la demo 3D del Suo parco macchine, senza account`

```text
Buongiorno,

di recente Le ho scritto a proposito di Godet, il libretto di manutenzione digitale delle macchine edili. Ecco il link diretto alla demo 3D, senza account: {link demo}

In due minuti vede come ogni macchina conserva il suo libretto completo (manutenzioni, riparazioni, ricambi, ore, costi) e come vengono seguite le scadenze.

Domande? Risponda semplicemente a questo messaggio. La guida introduttiva in PDF è su godet.app/it/aide.

Cordiali saluti
{Firma}

—
{Mittente, indirizzo}. Riceve questo messaggio perché la Sua impresa figura in {fonte}. Se non desidera più ricevere nostri messaggi, risponda «stop»: cancelleremo i Suoi dati.
```

### 6.5 Invitation LinkedIn (300 caractères au plus, envoyée à la main)

- **FR** : `Bonjour {Prénom}, je développe Godet en Valais, un carnet d’entretien numérique pour les parcs de machines de chantier. Je serais heureux d’échanger avec vous sur l’entretien des engins dans le génie civil. Michaël`
- **DE** : `Guten Tag {Vorname} {Nachname}, ich entwickle im Wallis Godet, ein digitales Wartungsheft für Baumaschinenparks. Gerne vernetze ich mich mit Ihnen und tausche mich über die Instandhaltung im Tiefbau aus. Freundliche Grüsse, Michaël`
- **IT** : `Buongiorno {Nome}, sviluppo in Vallese Godet, un libretto di manutenzione digitale per i parchi macchine da cantiere. Sarei lieto di entrare in contatto con Lei e di scambiare qualche idea sulla manutenzione nel genio civile. Michaël`

### 6.6 Message à un partenaire (loueur, concessionnaire, atelier, association)

**Français** — objet : `Un carnet d’entretien numérique pour vos clients`

```text
Madame, Monsieur,

Vous vendez, louez ou entretenez des machines de chantier en {région}. Vos clients tiennent leur carnet d’entretien de manière très variable, et c’est souvent vous qui en payez le prix : historique incomplet à la reprise, services oubliés, garanties difficiles à suivre.

Godet est un carnet d’entretien numérique, toutes marques : chaque machine garde son historique complet (services, réparations, pièces, heures, factures), imprimable en PDF pour une expertise ou une revente.

Je cherche quelques partenaires en Suisse pour le faire connaître à leurs clients, avec {avantage proposé, à définir} pour ceux qui viennent de votre part. Si la proposition vous intéresse, répondez-moi simplement par e-mail : je vous envoie tous les détails.

Avec mes meilleures salutations

{Signature}
```

**Deutsch** — Betreff: `Ein digitales Wartungsheft für Ihre Kunden`

```text
Sehr geehrte Damen und Herren

Sie verkaufen, vermieten oder warten Baumaschinen in {Region}. Ihre Kunden führen ihre Wartungshefte sehr unterschiedlich, und oft zahlen Sie den Preis dafür: lückenhafte Historie bei der Rücknahme, vergessene Services, schwer nachvollziehbare Garantien.

Godet ist ein digitales Wartungsheft für alle Marken: Jede Maschine behält ihre vollständige Historie (Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Rechnungen), als PDF druckbar für eine Expertise oder einen Wiederverkauf.

Ich suche einige Partner in der Schweiz, die Godet ihren Kunden vorstellen, mit {vorgeschlagener Vorteil, noch festzulegen} für Kunden, die über Sie kommen. Wenn Sie das interessiert, antworten Sie einfach per E-Mail: Ich schicke Ihnen alle Details.

Freundliche Grüsse

{Signatur}
```

## 7. Arguments

1. **L’obligation** : art. 32b OPA / VUV / OPI (RS 832.30) : « Les équipements de travail doivent être entretenus
   conformément aux instructions du fabricant […]. Les résultats des opérations d’entretien doivent être consignés »
   (« Die Instandhaltung ist zu dokumentieren »). Godet tient ce registre : chaque saisie est datée, porte le nom
   de la personne qui l’a faite et n’est jamais effacée (une erreur se retire avec son motif) ; le carnet
   s’imprime en PDF lors d’un contrôle.
2. **Les coûts par machine** : pièces, main-d’œuvre et immobilisation sur douze mois ; on voit quelle machine coûte
   trop et quand la remplacer.
3. **Les échéances** en heures ou en dates : service des 500 heures, contrôle annuel de sécurité ; plus d’oubli.
4. **Tout au même endroit** : photos d’une fuite, vidéo d’un bruit, facture en PDF, rattachées à la machine.
5. **L’équipe** : propriétaire, administrateur, mécanicien, machiniste ; mode atelier rapide, sans 3D, sur téléphone.
6. **La valeur de revente** : un carnet complet et imprimable rassure l’acheteur.
7. **Suisse** : formats suisses (6’842 h, CHF 1’240), quatre langues, données hébergées dans l’UE (Irlande),
   accès réservé à l’entreprise.
8. **Sans risque** : démo 3D sans compte ; essai gratuit de 15 jours sans carte de crédit ; tarifs annoncés avant
   la fin de l’essai.

N’affirmez pas que Godet « rend conforme » : il aide à tenir et à prouver l’entretien.

## 8. Objections fréquentes

| Objection | Réponse |
|---|---|
| « On a déjà un classeur, un Excel. » | « Gardez-le si vous voulez : Godet reprend les mêmes informations, mais les échéances se calculent seules et chaque saisie garde sa date et son auteur. Le carnet s’imprime quand il faut. » |
| « Pas le temps de saisir. » | « Une saisie prend trente secondes sur le téléphone, photo comprise. Le machiniste peut saisir les heures lui-même. » |
| « On a déjà un GPS sur les machines. » | « Godet le complète : le GPS donne la position et les heures moteur, Godet garde l’entretien (services, réparations, pièces, coûts, contrôles OPA). » |
| « Notre concessionnaire a déjà un portail, la télématique. » | « Godet est toutes marques et garde aussi les petites et les anciennes machines. Il complète la télématique : coûts, réparations, factures, contrôles. » |
| « C’est combien ? » | « L’essai de 15 jours est gratuit, sans carte. Les tarifs, par entreprise, vous sont annoncés avant la fin de l’essai. » |
| « Nos données dans le nuage ? » | « Hébergées dans l’UE, en Irlande ; seule votre entreprise y a accès ; rien ne s’efface ; vous imprimez ou exportez votre carnet en PDF. » |
| « La 3D, c’est un gadget. » | « Elle sert à voir l’état du parc d’un coup d’œil : vert, orange, rouge. Pour saisir vite, il y a le mode atelier, sans 3D. » |
| « Nous sommes trop petits. » | « Dès trois ou quatre machines, un service oublié coûte plus cher que l’outil. » |
| « Les machinistes ne l’utiliseront pas. » | « Chacun a un rôle et ne voit que ce qu’il doit saisir. Commencez avec le chef d’atelier ; les autres suivent. » |
| « Comment avez-vous eu notre adresse ? » | « Par {source}. Si vous préférez ne plus être contacté, je l’enregistre tout de suite. » |
| « Pas intéressé. » | « Merci, c’est noté, je ne vous relancerai pas. Si vous connaissez quelqu’un que cela pourrait intéresser, n’hésitez pas à en parler autour de vous. » → statut « Refus » (ou « Ne pas contacter » si demandé). |

Réponses courtes en allemand : « Gerne behalten Sie Ihr Excel – Godet berechnet die Termine automatisch. » ·
« Eine Erfassung dauert dreissig Sekunden auf dem Handy, mit Foto. » · « Godet funktioniert für alle Marken und
ergänzt die Telematik. » · « Der Test ist 15 Tage kostenlos, ohne Kreditkarte; die Preise erfahren Sie vor Ende
des Tests. » · « Daten in der EU (Irland), nur Ihr Unternehmen hat Zugriff. » · « Danke, ich habe es notiert und
melde mich nicht mehr. »

Risposte brevi in italiano: « Può tenere il Suo Excel: Godet calcola le scadenze da solo. » · « Una registrazione
richiede trenta secondi dal telefono, foto compresa. » · « Godet funziona con tutte le marche e completa la
telematica. » · « La prova è gratuita per 15 giorni, senza carta; i prezzi Le vengono comunicati prima della
fine della prova. » · « Dati ospitati nell’UE (Irlanda), accesso riservato alla Sua impresa. » · « Grazie, ne
prendo nota e non La ricontatterò. »

## 9. Partenaires et salons

**Partenaires** (message 6.6) : loueurs régionaux, concessionnaires de marques (pelles, chargeuses, mini-pelles),
ateliers de réparation de machines, sections cantonales de la Société Suisse des Entrepreneurs (SSE, SBV, SSIC),
infra suisse, JardinSuisse, FSKB, ARV, associations forestières, associations cantonales de communes, centres de
formation des machinistes. Proposer : présentation lors d’une assemblée, article dans une lettre aux membres
(envoyée par l’association à ses membres), avantage réservé aux membres. Aucun partenariat n’est conclu par un
agent : il prépare le premier message, Michaël mène l’échange.

**Salons** (vérifier les dates sur le site de l’organisateur) :

| Salon | Lieu | Dates | Public |
|---|---|---|---|
| AGRAMA | Berne | 26–30.11.2026 | Machines agricoles et forestières |
| Baumag | Lucerne | 21–23.01.2027 | Machines de chantier |
| Forstmesse | Lucerne | 26–29.08.2027 | Forêt, travaux forestiers |
| transport-CH | Berne | 10–13.11.2027 | Véhicules utilitaires, communes |
| Swissbau | Bâle | 18–21.01.2028 | Construction |
| öga | Koppigen | juin 2028 (à confirmer) | Paysagistes, espaces verts |
| Suisse Public | Berne | juin 2029 | Collectivités publiques, voirie |

Sur un salon : visiter (pas besoin de stand au départ), noter les contacts qui ont accepté d’être recontactés
(c’est un consentement à consigner dans les notes), saisir la fiche avec le canal « Salon ».

## 10. Particularités suisses

- Adresse sans ligne de pays en Suisse : « Route de la Gravière 12 / 1950 Sion ». La lettre est mise en page pour
  une enveloppe C5/6 à fenêtre droite (pliage en trois, repères imprimés).
- Allemand de Suisse : « ss » (jamais « ß ») ; guillemets « » ; formule d’appel sans virgule (« Sehr geehrte
  Damen und Herren », puis le texte avec une majuscule) ; « Freundliche Grüsse ».
- Italien de Suisse : « Gentili Signore e Signori, » ; vouvoiement « Lei » ; « Cordiali saluti ».
- Liechtenstein : hors périmètre pour l’instant (pays de l’EEE, règles proches de l’Autriche ; à étudier à part).
- Sources : [README.md, section 10](README.md#10-sources) ; salons :
  [messen.de, Bern](https://www.messen.de/de/737/in/ch/kanton-bern/bern/uebersicht),
  [ZT Fachmessen](https://www.messen.de/de/2274/veranstalter/zt-fachmessen-ag/messen),
  [Suisse Public 2026](https://suissepublic.bernexpo.ch) ; art. 32b VUV (texte allemand) :
  <https://www.fedlex.admin.ch/eli/cc/1983/1968_1968_1968/de>.
