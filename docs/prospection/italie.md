# Plan de prospection — Italie

Quatrième marché. L’Italie est la plus stricte pour les canaux électroniques : la prospection passe par la lettre,
les partenaires et les salons. Règles générales : [README.md](README.md).
Consignes de l’agent : [agents/italie.md](agents/italie.md).

## En bref

| | |
|---|---|
| Langue | Italien, vouvoiement « Lei » ; allemand pour le Haut-Adige si le site de l’entreprise est en allemand |
| Volume | 25 nouvelles entreprises par semaine |
| Premier contact | **Lettre uniquement**, à une adresse tirée du registre des entreprises ou du site de l’entreprise |
| Interdit sans consentement | E-mail (art. 130 Codice privacy), message privé publicitaire sur les réseaux sociaux ; téléphone seulement après vérification du RPO (payant) : non utilisé |
| Séquence | J0 lettre · J+15 lettre courte · J+35 invitation LinkedIn sans publicité |
| Code de suivi | `it-AAMM-NNNN` |
| Argument légal | D.Lgs. 81/2008, art. 71 : entretien adapté, contrôles périodiques, résultats écrits et conservés au moins trois ans |

## 1. Segments

| Segment (`segment`) | Italien | Codes ATECO indicatifs | Priorité |
|---|---|---|---|
| `terrassement` | Movimento terra, scavi | 43.12 | ★★★ |
| `genie_civil` | Opere di genio civile, reti | 42.21 à 42.99 | ★★★ |
| `route` | Costruzione di strade | 42.11 | ★★★ |
| `demolition` | Demolizioni | 43.11 | ★★ |
| `location` | Noleggio macchine movimento terra | 77.32 | ★★ (et partenaires) |
| `gravier` | Cave di ghiaia e sabbia | 08.12 | ★★ |
| `paysagiste` | Manutenzione del verde, paesaggio | 81.30 | ★ |
| `commune` | Comuni, ufficio tecnico, cantiere comunale | — | ★ (cycle long) |
| `forestier` | Imprese boschive | 02.20 | ★ |

Vérifier les codes dans la classification ATECO 2025 en vigueur. Taille visée : 5 à 50 machines.

## 2. Régions

D’abord le Nord, proche du Tessin : Lombardie (provinces de Côme, Lecco, Sondrio, Varèse, Milan, Bergame,
Brescia), Piémont (Verbano-Cusio-Ossola, Novare, Turin), Vallée d’Aoste, Trentin-Haut-Adige, Vénétie,
Émilie-Romagne ; puis le Centre et le Sud. `region` = nom de la région en italien (« Lombardia »).
Haut-Adige (Südtirol) : langue de contact selon le site de l’entreprise (`de` ou `it`).

## 3. Sources publiques

| Source | Ce qu’on y trouve | Usage |
|---|---|---|
| [Registro Imprese](https://www.registroimprese.it) | Raison sociale, siège, numéro REA, code fiscal / partita IVA | Recherche manuelle gratuite ; les extraits (visure) sont payants et inutiles ici |
| Site de l’entreprise | Parc, chantiers, adresse, « dati societari » (P. IVA) | Source principale des signaux et de l’adresse |
| [TED](https://ted.europa.eu) et publications des marchés publics | Attributions de marchés de travaux | Signal fort, à citer |
| Associations : ANCE (sections territoriales), CNA Costruzioni, Confartigianato Edilizia, Assodimi/Assonolo (location), ANEPLA (carrières), Assoverde (espaces verts), ANCI (communes) | Membres, annuaires publics | Consultation manuelle |

Ne pas utiliser d’adresse tirée des annuaires téléphoniques (Pagine Gialle, Pagine Bianche) : elle relève du
Registro pubblico delle opposizioni. Pas de collecte d’adresse e-mail ni de numéro de portable.

## 4. Canaux autorisés

| Canal | Règle | Usage |
|---|---|---|
| Lettre | Permise à une adresse du registre des entreprises ou du site de l’entreprise (RGPD, intérêt légitime, information et opposition) ; une adresse d’annuaire téléphonique impose de consulter le RPO | Étapes 1 et 2 |
| E-mail | **Non** sans consentement préalable, même à une adresse professionnelle trouvée en ligne (Codice privacy art. 130 ; Garante, 4 juillet 2013) | Seulement en réponse à une demande |
| Téléphone | Seulement après vérification du RPO (accès payant) ; non utilisé au démarrage | Seulement si le prospect demande à être rappelé |
| LinkedIn | Message privé promotionnel interdit sans consentement (Garante 2013, « spam social ») ; invitation sobre possible | Étape 3 |
| Partenaires, salons | — | En continu |

## 5. Séquence

| Étape | Jour | Canal | But |
|---|---|---|---|
| 1 | J0 | Lettre personnalisée + lien court de la démo | Faire ouvrir la démo 3D |
| 2 | J+15 | Lettre courte | Rappel bref, autre angle (costi per macchina) |
| 3 | J+35 | Invitation LinkedIn sans publicité | Créer un lien ; Godet seulement sur demande |

Sans réponse 14 jours après la dernière étape : « Refus ou écarté », note « sans réponse ».

## 6. Modèles de messages

`{…}` remplacé par l’agent ; `[[…]]` pour un passage à compléter (bloque la validation). L’objet est imprimé
précédé de « Oggetto: ». Pas de prix.

### 6.1 Lettera, passo 1

Oggetto : `Il libretto di manutenzione delle Sue macchine edili, sempre aggiornato`

```text
Gentili Signore e Signori,

{frase personale basata su un segnale pubblico, ad esempio: «Il Suo parco macchine, tra escavatori, pale e dumper, lavora ogni giorno nei cantieri della provincia di Lecco.»}

Il D.Lgs. 81/2008 (art. 71) chiede che le attrezzature di lavoro siano oggetto di idonea manutenzione e che i risultati dei controlli siano riportati per iscritto e conservati almeno per gli ultimi tre anni. In molte imprese queste informazioni sono sparse: libretti in cabina, fatture in un raccoglitore, scadenze nella memoria del capo officina.

Godet riunisce tutto in un unico posto: manutenzioni, riparazioni, ricambi, ore di funzionamento, verbali dei controlli, foto e fatture, macchina per macchina. Le scadenze (manutenzione ogni 500 ore, controlli periodici) sono seguite per Lei, e finalmente sa quanto costa ogni macchina. Il Suo parco macchine appare in uno showroom 3D: verde, arancione o rosso, a colpo d’occhio.

Ha già un GPS sulle Sue macchine? Godet lo completa: il GPS dà la posizione e le ore, Godet conserva la storia della manutenzione.

Il modo più semplice è provarlo: apra godet.app/it/demo/{code}, la demo si apre senza account. La prova è gratuita per 15 giorni, senza carta di credito. La guida introduttiva in PDF è su godet.app/it/aide e rispondo volentieri alle Sue domande per e-mail.

Cordiali saluti

{Firma}
```

### 6.2 Lettera breve, passo 2

Oggetto : `Quanto Le costa davvero ogni macchina?`

```text
Gentili Signore e Signori,

due settimane fa Le ho presentato Godet, il libretto di manutenzione digitale delle macchine edili.

Una domanda che molte imprese si pongono: quanto è costata davvero ogni macchina nell’ultimo anno, tra ricambi, manodopera e fermi? Godet lo mostra mese per mese e ricorda ogni controllo in scadenza.

La demo 3D si apre senza account con il codice qui sotto. Se non è il momento giusto, non riceverà altre lettere da parte nostra.

Cordiali saluti

{Firma}
```

### 6.3 Invito LinkedIn, passo 3 (senza promozione, 300 caratteri al massimo)

`Buongiorno {Nome}, mi occupo di manutenzione dei parchi macchine da cantiere e mi farebbe piacere entrare in contatto con professionisti del movimento terra in {regione}. Cordiali saluti dalla Svizzera, Michaël`

Ne parler de Godet que si la personne le demande.

### 6.4 Risposta a una richiesta (e-mail, seulement après une prise de contact du prospect)

Oggetto : `La Sua richiesta su Godet`

```text
Buongiorno,

grazie per il Suo messaggio. Ecco il link diretto alla demo 3D, senza account: {link demo}

Le invio volentieri la guida PDF (godet.app/it/aide) e rispondo per e-mail a tutte le Sue domande.

Cordiali saluti
{Firma}
```

### 6.5 Richiamata richiesta (téléphone, seulement si l’entreprise l’a demandé)

```text
Buongiorno, sono {Nome Cognome} di Swiss Digital Studio. Aveva chiesto di essere richiamato a proposito di Godet, il libretto di manutenzione digitale delle macchine edili. Ha un momento?
— Oggi come tenete traccia di manutenzioni, controlli e riparazioni delle macchine?
— Proposta: «Posso inviarLe per e-mail la guida PDF e il link della demo? Risponderò volentieri alle Sue domande per iscritto.»
— Nessun interesse: «Grazie, ne prendo nota e non La ricontatterò.»
```

### 6.6 Partner (concessionario, noleggiatore, associazione)

Oggetto : `Un libretto di manutenzione digitale per i Suoi clienti`

```text
Gentili Signore e Signori,

vendete, noleggiate o riparate macchine edili in {regione}. I Vostri clienti tengono il libretto di manutenzione in modi molto diversi, e spesso il prezzo lo pagate Voi: storico incompleto al ritiro dell’usato, tagliandi dimenticati, garanzie difficili da seguire.

Godet è un libretto di manutenzione digitale per tutte le marche: ogni macchina conserva il suo storico completo (manutenzioni, riparazioni, ricambi, ore, verbali, fatture), stampabile in PDF per una perizia o una rivendita.

Cerco alcuni partner in Italia che lo facciano conoscere ai propri clienti, con {vantaggio proposto, da definire} per chi arriva da parte Vostra. Se la proposta Vi interessa, mi risponda semplicemente per e-mail: Le invio tutti i dettagli.

Cordiali saluti

{Firma}
```

## 7. Arguments

1. **L’obligation** : D.Lgs. 81/2008, art. 71 : manutention adaptée des équipements de travail (al. 4) ; contrôles
   périodiques par une personne compétente (al. 8) ; résultats écrits et conservés au moins pour les trois
   dernières années, à disposition des organes de contrôle (al. 9) ; vérifications périodiques des équipements de
   l’annexe VII, notamment de levage (al. 11). Godet garde verbaux, échéances et historique, et les sort en PDF.
2. **Les coûts par machine** : ricambi, manodopera, fermi macchina, mois par mois.
3. **Les échéances** en heures ou en dates.
4. **Toutes marques**, anciennes et petites machines comprises.
5. **L’équipe** : rôles (propriétaire, administrateur, mécanicien, opérateur) ; saisie rapide sur téléphone.
6. **Formats italiens** (6.842 h, 1.240 €), interface en italien, données dans l’UE (Irlande).
7. **Sans risque** : démo 3D sans compte, essai de 15 jours sans carte de crédit.

## 8. Objections fréquentes

| Objection (traduction) | Réponse en italien |
|---|---|
| Nous avons déjà un logiciel. | « Godet non sostituisce il gestionale: è il libretto di ogni macchina, con manutenzioni, controlli, riparazioni e costi, per l’officina e il cantiere. » |
| Nos machines ont la télématique. | « La telematica dà ore e posizione; Godet aggiunge riparazioni, verbali, fatture e costi, anche per le macchine più vecchie e di altre marche. » |
| Pas le temps. | « Una registrazione richiede trenta secondi dal telefono, foto compresa. » |
| Combien ça coûte ? | « La prova è gratuita per 15 giorni, senza carta. I prezzi per impresa Le vengono comunicati prima della fine della prova. » |
| Données, cloud ? | « Dati ospitati nell’UE (Irlanda), accesso riservato alla Sua impresa, nulla viene cancellato, ogni libretto si stampa in PDF. » |
| Un fournisseur suisse ? | « L’applicazione è interamente in italiano, in euro e con i formati italiani. Rispondiamo per iscritto in italiano. » |
| D’où vient notre adresse ? | « Dal {fonte}. Se preferisce non ricevere altro, lo annoto subito. » |
| Pas intéressé. | « Grazie, ne prendo nota e non La ricontatterò. » → statut « Refus » (ou « Ne pas contacter ») |

## 9. Partenaires et salons

**Partenaires** : noleggiatori (Assodimi/Assonolo), concessionnaires de marques, sections territoriales de l’ANCE,
CNA Costruzioni, Confartigianato Edilizia, ANEPLA, écoles de conducteurs d’engins.

**Salons** (dates à confirmer auprès de l’organisateur) :

| Salon | Lieu | Rythme | Public |
|---|---|---|---|
| Samoter | Vérone | édition 2026 du 6 au 9 mai ; prochaine à confirmer | Machines de construction |
| GIS — Giornate Italiane del Sollevamento | Plaisance | biennal, à confirmer | Levage, transport, location |
| EIMA International | Bologne | novembre 2026, à confirmer | Machinisme agricole et forestier |
| Myplant & Garden | Milan | février, à confirmer | Paysage, espaces verts |

## 10. Particularités

- Adresse : « Spett.le » devant la raison sociale est d’usage ; ligne « ITALIA » en capitales pour un envoi depuis la
  Suisse ; code postal (CAP) avant la ville, sigle de la province après (« 23900 Lecco LC »). Fenêtre à droite.
- Vouvoiement « Lei » envers la personne ; « Voi » ou « Vostra impresa » est aussi courant pour s’adresser à
  l’entreprise : rester cohérent dans un même message.
- Sources : [README.md, section 10](README.md#10-sources) ; art. 71 D.Lgs. 81/2008 :
  <https://www.brocardi.it/testo-unico-sicurezza-sul-lavoro/titolo-iii/capo-i/art71.html> ; Garante, lignes
  directrices 2013 : <https://www.garanteprivacy.it/home/docweb/-/docweb-display/print/2542348> ; Samoter 2026 :
  <https://ance.it/2026/04/formedil-circolare-n-34-2026-samoter-2026-salone-internazionale-macchine-per-costruzioni-dal-6-al-9-maggio-2026-a-verona-informazioni-per-la-visita/?print=pdf>.
