# Plan de prospection — Allemagne et Autriche

Deuxième marché, ouvert quand la Suisse tourne (brouillons relus chaque semaine, 300 à 500 prospects suisses
mesurés). Un seul agent pour les deux pays, en allemand. Règles générales : [README.md](README.md).
Consignes de l’agent : [agents/allemagne-autriche.md](agents/allemagne-autriche.md).

## En bref

| | |
|---|---|
| Langue | Allemand ; orthographe suisse (« ss ») assumée : c’est la signature d’un expéditeur suisse, comme dans l’application |
| Volume | 25 nouvelles entreprises par semaine : 20 en Allemagne, 5 en Autriche |
| Premier contact | **Lettre uniquement** |
| Interdit sans consentement | E-mail (DE et AT), téléphone (AT ; DE sauf consentement au moins présumé), message publicitaire sur LinkedIn |
| Séquence | J0 lettre · J+14 lettre courte · J+35 invitation LinkedIn sans publicité |
| Codes de suivi | `de-AAMM-NNNN`, `at-AAMM-NNNN` |
| Arguments légaux | DE : BetrSichV § 14 (résultats des contrôles consignés), DGUV Vorschrift 70 § 57 (véhicules) · AT : AM-VO § 11 (rapports de contrôle conservés) |

## 1. Segments

| Segment (`segment`) | Allemand | Parc typique | Signaux | Priorité |
|---|---|---|---|---|
| `terrassement`, `genie_civil` | Tiefbau, Erdbau, Kanalbau | 5 à 50 machines | « Unser Maschinenpark », « Fuhrpark », photos | ★★★ |
| `route` | Straßenbau (écrit « Strassenbau ») | finisseurs, rouleaux, fraiseuses | Adjudications publiques | ★★★ |
| `demolition` | Abbruch, Rückbau, Recycling | pelles lourdes, concasseurs | Membre du Deutscher Abbruchverband | ★★ |
| `location` | Baumaschinenvermietung | 20 à 300 machines | Catalogue en ligne | ★★ (et partenaires) |
| `gravier` | Kies- und Sandgruben, Steinbrüche | chargeuses, dumpers | Membre MIRO (DE), Forum mineralische Rohstoffe (AT) | ★★ |
| `commune` | Bauhof (commune), Stadtwerke | 3 à 20 engins | Site de la commune | ★★ |
| `paysagiste` | Garten- und Landschaftsbau (GaLaBau) | 3 à 20 machines | Membre BGL ou fédération régionale | ★★ |
| `batiment` | Hochbau avec parc propre | grues, mini-pelles | Parc visible | ★ |
| `forestier` | Forstunternehmen | débardeuses, porteurs | Associations forestières | ★ |

Codes WZ 2008 / ÖNACE indicatifs : 42.11 (routes), 42.21 à 42.99 (génie civil), 43.11 (démolition), 43.12
(terrassement), 77.32 (location de machines de construction), 08.12 (gravières), 81.30 (paysagisme), 02.20 (forêt).

## 2. Régions

- **Allemagne** : d’abord le Sud, proche de la Suisse : Bade-Wurtemberg, Bavière ; puis Hesse, Rhénanie-Palatinat,
  Rhénanie-du-Nord-Westphalie, Saxe, Basse-Saxe, puis les autres Länder. `region` = nom du Land en allemand
  (« Bayern », « Baden-Württemberg »).
- **Autriche** : d’abord l’Ouest : Vorarlberg, Tyrol, Salzbourg, Haute-Autriche ; puis Styrie, Carinthie,
  Basse-Autriche, Vienne, Burgenland. `region` = nom du Land (« Tirol », « Oberösterreich »).

## 3. Sources publiques

| Source | Ce qu’on y trouve | Usage |
|---|---|---|
| [Handelsregister](https://www.handelsregister.de) (DE) | Raison sociale, forme, siège, numéro HRB/HRA | Recherche manuelle ; le règlement d’utilisation limite à 60 consultations par heure ; aucune extraction automatisée |
| [WKO Firmen A-Z](https://firmen.wko.at) (AT) | Entreprises membres de la Chambre économique, par métier et par Land | Recherche manuelle, fiche par fiche |
| Firmenbuch (AT) | Numéro FN, forme juridique | Seulement si l’information est visible gratuitement (site de l’entreprise, WKO) |
| [TED](https://ted.europa.eu) | Avis d’attribution de marchés publics de travaux (routes, génie civil) | Signal fort : marché gagné, à citer comme source |
| Site de l’entreprise | Parc, chantiers, « Impressum » (adresse, forme, registre) | Source principale ; l’Impressum donne l’adresse exacte |
| Associations : Bauindustrie (fédérations régionales), ZDB et Bauinnungen, BGL et fédérations GaLaBau régionales, Deutscher Abbruchverband, MIRO ; en Autriche Bundesinnung Bau, Fachverband der Bauindustrie | Listes publiques de membres, recherches de « Fachbetriebe » | Consultation manuelle ; ne pas copier une liste entière |
| Sites des communes | Bauhof : adresse | Consultation manuelle |

Pas de collecte d’adresses e-mail ni de numéros de portable : ils ne servent pas (pas d’e-mail ni d’appel sans
consentement). Le téléphone du standard peut figurer dans la fiche pour un rappel demandé par le prospect.

## 4. Canaux autorisés

| Canal | Allemagne | Autriche |
|---|---|---|
| Lettre | Oui | Oui |
| E-mail | **Non** sans consentement exprès préalable (UWG § 7 al. 2 ch. 2) | **Non** sans consentement préalable (TKG 2021 § 174 al. 3) |
| Téléphone | Seulement avec consentement au moins présumé (UWG § 7 al. 2 ch. 1) : en pratique, quand l’entreprise l’a demandé | **Non** sans consentement préalable (TKG 2021 § 174 al. 1) |
| LinkedIn / XING | Invitation sobre, sans argumentaire ; un message publicitaire vaut un e-mail (OLG Hamm, 18 U 154/22) | Invitation sobre, sans publicité |
| Partenaires, salons | Oui | Oui |

Dès qu’une personne demande des informations (réponse à la lettre, formulaire de contact, salon), l’échange
direct devient possible dans le canal qu’elle a choisi : noter ce consentement dans la fiche (date, forme).

## 5. Séquence

| Étape | Jour | Canal | But |
|---|---|---|---|
| 1 | J0 | Lettre personnalisée + lien court de la démo | Faire ouvrir la démo 3D |
| 2 | J+14 | Lettre courte, autre angle (coûts par machine, contrôles) | Rappel bref |
| 3 | J+35 | Invitation LinkedIn au dirigeant, sans publicité (s’il est identifiable) | Créer un lien ; Godet seulement si la personne le demande |

Sans réponse 14 jours après la dernière étape : « Refus ou écarté », note « sans réponse ».

## 6. Modèles de messages

Mêmes conventions que pour la Suisse : `{…}` remplacé par l’agent, `[[…]]` pour un passage à compléter (bloque
la validation), texte de la formule d’appel à la signature. En Allemagne et en Autriche, la formule d’appel prend
une virgule et le texte continue en minuscule. Pas de prix.

### 6.1 Lettre, étape 1 — Allemagne

Betreff : `Prüfungen und Wartungen Ihrer Baumaschinen, lückenlos dokumentiert`

```text
Sehr geehrte Damen und Herren,

{persönlicher Satz aus einem öffentlichen Hinweis, zum Beispiel: «Ihr Maschinenpark mit Kettenbaggern, Radladern und Dumpern ist im Raum Augsburg täglich im Einsatz.»}

Nach § 14 BetrSichV sind die Ergebnisse der Prüfungen Ihrer Arbeitsmittel aufzuzeichnen und mindestens bis zur nächsten Prüfung aufzubewahren. In vielen Betrieben liegen diese Nachweise verstreut: Prüfbücher in der Kabine, Rechnungen im Ordner, Termine im Kopf des Werkstattleiters.

Godet ist das digitale Wartungsheft für Baumaschinen: Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Prüfberichte, Fotos und Rechnungen, Maschine für Maschine. Fällige Termine (Service alle 500 Stunden, jährliche Prüfung) werden für Sie verfolgt, und Sie sehen, was jede Maschine kostet. Ihr Maschinenpark erscheint in einem 3D-Showroom: grün, orange oder rot, auf einen Blick.

Sie haben bereits GPS auf Ihren Maschinen? Godet ergänzt es: Das GPS liefert Standort und Stunden, Godet die Wartungsgeschichte.

Am einfachsten probieren Sie es aus: Öffnen Sie godet.app/de/demo/{code}, die Demo öffnet sich ohne Konto. Danach testen Sie Godet 15 Tage kostenlos, ohne Kreditkarte. Die Kurzanleitung als PDF finden Sie unter godet.app/de/aide, und Ihre Fragen beantworte ich gerne per E-Mail.

Mit freundlichen Grüssen

{Signatur}
```

### 6.2 Lettre, étape 1 — Autriche

Betreff : `Prüfbefunde und Wartungen Ihrer Baumaschinen, jederzeit griffbereit`

```text
Sehr geehrte Damen und Herren,

{persönlicher Satz aus einem öffentlichen Hinweis, zum Beispiel: «Ihre Bagger und Radlader sind auf Baustellen im ganzen Tiroler Oberland unterwegs.»}

Die Arbeitsmittelverordnung verlangt, dass Prüfbefunde bis zum Ausscheiden des Arbeitsmittels aufbewahrt werden und am Einsatzort verfügbar sind (§ 11 AM-VO). Dazu kommen Wartungen, Reparaturen und Rechnungen, die oft an verschiedenen Orten liegen.

Godet ist das digitale Wartungsheft für Baumaschinen: Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Prüfbefunde, Fotos und Rechnungen, Maschine für Maschine, auf der Baustelle am Handy abrufbar. Fällige Termine werden für Sie verfolgt, und Sie sehen, was jede Maschine kostet. Ihr Maschinenpark erscheint in einem 3D-Showroom: grün, orange oder rot, auf einen Blick.

Sie haben bereits GPS auf Ihren Maschinen? Godet ergänzt es: Das GPS liefert Standort und Stunden, Godet die Wartungsgeschichte.

Am einfachsten probieren Sie es aus: Öffnen Sie godet.app/de/demo/{code}, die Demo öffnet sich ohne Konto. Danach testen Sie Godet 15 Tage kostenlos, ohne Kreditkarte. Die Kurzanleitung als PDF finden Sie unter godet.app/de/aide, und Ihre Fragen beantworte ich gerne per E-Mail.

Mit freundlichen Grüssen

{Signatur}
```

### 6.3 Lettre courte, étape 2 (DE et AT)

Betreff : `Was kostet Sie eigentlich jede Maschine?`

```text
Sehr geehrte Damen und Herren,

vor zwei Wochen habe ich Ihnen Godet vorgestellt, das digitale Wartungsheft für Baumaschinen.

Eine Frage, die uns viele Betriebe stellen: Was hat jede Maschine im letzten Jahr wirklich gekostet, mit Ersatzteilen, Arbeitszeit und Stillstand? Godet zeigt es Ihnen Monat für Monat und erinnert Sie an jede fällige Prüfung.

Die 3D-Demo öffnet sich ohne Konto unter godet.app/de/demo/{code}. Wenn es gerade nicht passt, erhalten Sie keine weitere Post von uns.

Mit freundlichen Grüssen

{Signatur}
```

### 6.4 Invitation LinkedIn, étape 3 (sans publicité, 300 caractères au plus)

`Guten Tag {Anrede} {Nachname}, ich beschäftige mich mit der Instandhaltung von Baumaschinenparks und vernetze mich gerne mit Fachleuten aus dem Tief- und Strassenbau in {Region}. Beste Grüsse aus der Schweiz, Michaël`

Ne parler de Godet que si la personne pose la question ou répond avec intérêt.

### 6.5 Réponse à une demande (e-mail, seulement après une prise de contact du prospect)

Betreff : `Ihre Anfrage zu Godet`

```text
Guten Tag {Anrede} {Nachname},

vielen Dank für Ihre Nachricht. Hier der direkte Link zur 3D-Demo, ohne Konto: {Link Demo}

Gerne schicke ich Ihnen die PDF-Anleitung (godet.app/de/aide) und beantworte alle Ihre Fragen per E-Mail.

Mit freundlichen Grüssen
{Signatur}
```

### 6.6 Rappel demandé (téléphone, seulement si l’entreprise l’a demandé)

```text
Guten Tag, hier ist {Vorname Name} von Swiss Digital Studio. Sie hatten um einen Rückruf zu Godet gebeten, dem digitalen Wartungsheft für Baumaschinen. Passt es Ihnen gerade?
— Wie verfolgen Sie heute Wartungen, Prüfungen und Reparaturen Ihrer Maschinen?
— Vorschlag: «Darf ich Ihnen die PDF-Anleitung und den Demo-Link per E-Mail schicken? Ihre Fragen beantworte ich gerne schriftlich.»
— Kein Interesse: «Danke, ich habe es notiert und melde mich nicht mehr.»
```

### 6.7 Partenaire (lettre à un concessionnaire, un loueur ou une fédération)

Betreff : `Ein digitales Wartungsheft für Ihre Kunden`

```text
Sehr geehrte Damen und Herren,

Sie verkaufen, vermieten oder warten Baumaschinen in {Region}. Ihre Kunden führen ihre Wartungs- und Prüfnachweise sehr unterschiedlich, und oft zahlen Sie den Preis dafür: lückenhafte Historie bei der Rücknahme, vergessene Services, schwer nachvollziehbare Garantien.

Godet ist ein digitales Wartungsheft für alle Marken: Jede Maschine behält ihre vollständige Historie (Wartungen, Reparaturen, Ersatzteile, Betriebsstunden, Prüfberichte, Rechnungen), als PDF druckbar für eine Bewertung oder einen Wiederverkauf.

Ich suche einige Partner in Deutschland und Österreich, die Godet ihren Kunden vorstellen, mit {vorgeschlagener Vorteil, noch festzulegen} für Kunden, die über Sie kommen. Wenn Sie das interessiert, antworten Sie einfach per E-Mail: Ich schicke Ihnen alle Details.

Mit freundlichen Grüssen

{Signatur}
```

## 7. Arguments

1. **Allemagne** : le résultat de chaque contrôle d’un équipement de travail doit être consigné et conservé au moins
   jusqu’au contrôle suivant (BetrSichV § 14 al. 7) ; les véhicules sont contrôlés au moins une fois par an par une
   personne compétente, résultats écrits (DGUV Vorschrift 70 § 57) ; les engins de terrassement sont contrôlés
   régulièrement par une personne habilitée (DGUV Regel 100-500, chap. 2.12). Godet garde rapports, échéances
   et historique au même endroit.
2. **Autriche** : les rapports de contrôle (Prüfbefunde) se conservent jusqu’à la mise hors service et doivent être
   disponibles sur le lieu d’utilisation (AM-VO § 11) : dans Godet, ils sont sur le téléphone, sur le chantier.
3. **Coûts par machine** : pièces, main-d’œuvre, immobilisation, mois par mois.
4. **Échéances** en heures ou en dates ; rappels avant l’échéance.
5. **Toutes marques**, anciennes et petites machines comprises ; complète la télématique des constructeurs.
6. **Formats et monnaie** : 6.842 h, 1.240 € ; interface en allemand ; données dans l’UE (Irlande).
7. **Sans risque** : démo 3D sans compte, essai de 15 jours sans carte de crédit.

Ne jamais promettre la « conformité » : Godet aide à tenir et à présenter les preuves.

## 8. Objections fréquentes

| Objection (traduction) | Réponse en allemand |
|---|---|
| Nous avons déjà un logiciel (ERP, atelier). | « Godet ersetzt Ihre Buchhaltung nicht. Es ist das Wartungsheft jeder Maschine: Wartungen, Prüfungen, Reparaturen und Kosten, für die Werkstatt und die Baustelle. » |
| Nos machines ont la télématique. | « Die Telematik liefert Betriebsstunden und Standorte. Godet ergänzt, was dort fehlt: Reparaturen, Prüfberichte, Rechnungen, Kosten, auch für ältere Maschinen und andere Marken. » |
| Pas le temps. | « Eine Erfassung dauert dreissig Sekunden am Handy, mit Foto. Der Maschinist trägt die Betriebsstunden selbst ein. » |
| Combien ça coûte ? | « Der Test ist 15 Tage kostenlos, ohne Kreditkarte. Die Preise pro Betrieb erfahren Sie vor Ende des Tests. » |
| Données, nuage, RGPD ? | « Die Daten liegen in der EU (Irland), nur Ihr Betrieb hat Zugriff, nichts wird gelöscht, und Sie können jedes Wartungsheft als PDF ausdrucken. » |
| Un fournisseur suisse ? | « Die Anwendung ist vollständig auf Deutsch, rechnet in Euro und mit deutschen Formaten. Fragen beantworten wir schriftlich auf Deutsch. » |
| D’où vient notre adresse ? | « Aus {Quelle}. Wenn Sie keine Post mehr wünschen, vermerke ich das sofort. » |
| Pas intéressé. | « Danke, ich habe es notiert und melde mich nicht mehr. » → statut « Refus » (ou « Ne pas contacter » si demandé) |

## 9. Partenaires et salons

**Partenaires** : concessionnaires et loueurs (fédération bbi, Bundesverband der Baumaschinen-, Baugeräte- und
Industriemaschinen-Firmen), fédérations régionales de la Bauindustrie, Bauinnungen, fédérations GaLaBau, Deutscher
Abbruchverband, MIRO ; en Autriche, Bundesinnung Bau et Landesinnungen, Fachverband der Bauindustrie. Approche
par lettre (6.7), puis échange mené par Michaël.

**Salons** (vérifier les dates auprès de l’organisateur) :

| Salon | Lieu | Dates | Public |
|---|---|---|---|
| USEDMA | Kalkar (DE) | 17–18.11.2026 | Machines neuves et d’occasion : concessionnaires |
| SaaleBAU | Halle (DE) | mars 2027 (à confirmer) | Construction, régional |
| MAWEV Show | Sankt Pölten (AT) | 14–17.04.2027 | Démonstration de machines de chantier |
| NordBau | Neumünster (DE) | 08–12.09.2027 | Construction, Nord |
| OstBau | Bernau près de Berlin (DE) | 23–25.09.2027 | Construction, Est |
| bauma | Munich (DE) | 03–09.04.2028 | Salon mondial des machines de chantier |
| GaLaBau | Nuremberg (DE) | 12–15.09.2028 | Paysagistes |
| steinexpo | Homberg (Ohm) (DE) | septembre 2029 (à confirmer) | Carrières, gravières |

## 10. Particularités

- Lettre au format DIN 5008, forme B : adresse à gauche pour enveloppe DL à fenêtre ; dernière ligne
  « DEUTSCHLAND » ou « ÖSTERREICH » ; affranchissement international depuis la Suisse.
- Formule d’appel avec virgule ; « Mit freundlichen Grüssen ». Titre « Herr / Frau » + nom seulement si la personne
  figure à l’Impressum ou au registre ; sinon « Sehr geehrte Damen und Herren ».
- Sources : [README.md, section 10](README.md#10-sources) ; BetrSichV § 14 :
  <https://lxgesetze.de/betrsichv/14> ; DGUV Vorschrift 70 § 57 :
  <https://vorschriften.bgn-branchenwissen.de/daten/dguv/70/57.htm> ; DGUV Regel 100-500 chap. 2.12 (cité par
  TÜV) : <https://akademie.tuv.com/weiterbildungen/befaehigte-person-sachkundiger-fuer-erdbaumaschinen-518428> ;
  AM-VO § 11 : <https://www.forum-media.at/arbeitssicherheit/Vorschriften/Arbeitsmittelverordnung/1.-Abschnitt/11.-Pruefbefund-Pruefplan?print=1> ;
  limite de consultation du Handelsregister : <https://github.com/bundesAPI/handelsregister> ;
  salons : <https://www.messen.de/de/1016/branche/baumaschinen>.
