// Guide « modèle de carnet d’entretien » : explique le modèle Excel gratuit (bouton de téléchargement : download).
import type { Guide } from './types';

export const modele: Guide = {
  id: 'modele',
  published: '2026-11-07',
  updated: '2026-11-07',
  download: 'template',
  content: {
    fr: {
      slug: 'modele-carnet-entretien-engins-excel',
      metaTitle: 'Modèle carnet d’entretien engins de chantier\u00a0: Excel gratuit',
      description: 'Modèle gratuit de carnet d’entretien pour engins de chantier, en Excel\u00a0: machines, interventions, heures, coûts. À remplir ou à importer dans Godet.',
      h1: 'Modèle de carnet d’entretien pour engins de chantier (Excel gratuit)',
      lead: 'Ce modèle Excel gratuit sert de carnet d’entretien pour un parc d’engins de chantier\u00a0: une feuille pour la liste des machines, une autre pour chaque intervention, avec le compteur d’heures et les coûts. Téléchargez-le sans inscription, remplissez-le à la main, puis importez-le tel quel dans Godet le jour où un fichier ne suffit plus.',
      sections: [
        {
          h2: 'Ce que contient le modèle Excel',
          paragraphs: [
            'Le fichier .xlsx compte deux feuilles. La feuille «\u00a0Machines\u00a0» liste le parc, une ligne par engin. La feuille «\u00a0Carnet\u00a0» reçoit l’historique, une ligne par intervention\u00a0: service, réparation, contrôle, pièce changée ou simple remarque. Le code de la machine relie les deux feuilles.',
            'La première ligne de chaque feuille contient les en-têtes, sur fond jaune. La deuxième est un exemple à remplacer par vos données. Le fichier s’ouvre dans Excel, LibreOffice Calc, Numbers ou Google Sheets. Les en-têtes sont dans la langue de cette page, et Godet les reconnaît en français, en allemand, en italien et en anglais.',
          ],
        },
        {
          h2: 'Feuille «\u00a0Machines\u00a0»\u00a0: une ligne par engin',
          paragraphs: [
            'Seuls le code et le type sont obligatoires. Complétez le reste quand vous avez l’information sous la main\u00a0: la plaque signalétique de la machine donne en général le numéro de série, l’année et le poids.',
          ],
          bullets: [
            'Code\u00a0: un repère court et unique, comme PE-01 ou MP-03. C’est lui qui relie chaque intervention à la bonne machine.',
            'Type\u00a0: le genre d’engin, par exemple Pelle sur chenilles, Mini-pelle, Chargeuse sur pneus, Tractopelle ou Nacelle à ciseaux.',
            'Poids (t), Marque, Modèle et Année\u00a0: de quoi identifier la machine sans hésiter.',
            'N° de série et Plaque\u00a0: utiles pour l’assurance, en cas de vol et à la revente.',
            'Heures\u00a0: le compteur d’heures le jour où vous remplissez la ligne.',
            'Remarques\u00a0: tout le reste, comme les équipements, les accessoires ou le lieu de stationnement.',
          ],
        },
        {
          h2: 'Feuille «\u00a0Carnet\u00a0»\u00a0: une ligne par intervention',
          paragraphs: [
            'Chaque intervention a sa ligne, même la plus courte. Quatre colonnes sont obligatoires\u00a0: la date, la machine (son code), le genre d’intervention et le titre. Les autres rendent le carnet vraiment utile le jour où il faut chiffrer une machine ou retrouver une pièce.',
          ],
          bullets: [
            'Date\u00a0: le jour de l’intervention, par exemple 14.03.2026.',
            'Machine (code)\u00a0: le code de la feuille Machines, écrit de la même façon.',
            'Intervention\u00a0: Service, Contrôle, Inspection, Réparation, Pièce ou Note.',
            'Titre et Détails\u00a0: ce qui a été fait en quelques mots, puis le détail (huiles, filtres, pièces, observations).',
            'Compteur (h)\u00a0: les heures au moment de l’intervention. C’est la colonne la plus utile pour planifier la suite.',
            'Effectué par\u00a0: le mécanicien, l’atelier ou le garage externe.',
            'Pièces (montant) et Main-d’œuvre (montant)\u00a0: les deux montants de la facture, séparés.',
            'Immobilisation (h)\u00a0: le temps pendant lequel la machine n’a pas pu travailler.',
            'État de la réparation\u00a0: Réparée, En cours ou En attente de pièce, pour les réparations seulement.',
            'Réf. pièce, Quantité et Fournisseur\u00a0: pour retrouver une pièce et la recommander sans chercher.',
          ],
        },
        {
          h2: 'Exemple rempli\u00a0: une pelle de 14 t',
          paragraphs: [
            'Prenons une pelle sur chenilles de 14 tonnes, notée PE-02. Dans la feuille Machines, sa ligne indique PE-02, Pelle sur chenilles, 14, sa marque, son modèle, son année, son numéro de série et le compteur du jour, par exemple 4520 h.',
            'Dans la feuille Carnet, deux lignes racontent son dernier mois. En notant chaque fois le compteur et l’immobilisation, vous voyez combien d’heures séparent les services et ce que coûtent les pannes\u00a0: c’est la base du [coût horaire d’une machine](/guides/cout-horaire-machine-chantier).',
          ],
          bullets: [
            'Le service 500 h\u00a0: la date, PE-02, Service, le titre «\u00a0Service 500 h\u00a0», les détails «\u00a0Vidange moteur, filtre à huile, filtres à gasoil, filtre de cabine\u00a0», le compteur 4500, l’atelier dans Effectué par, puis les montants des pièces et de la main-d’œuvre repris de la facture.',
            'La réparation d’un flexible\u00a0: la date, PE-02, Réparation, le titre «\u00a0Flexible du vérin de godet remplacé\u00a0», le compteur 4512, une immobilisation de 3 h, l’état Réparée, la référence du flexible, la quantité 1 et le fournisseur.',
          ],
        },
        {
          h2: 'Tenir le carnet au quotidien',
          paragraphs: [
            'Un modèle ne vaut que par sa tenue. Quelques règles simples évitent la plupart des trous dans l’historique.',
          ],
          bullets: [
            'Notez l’intervention le jour même, quand la facture ou le bon de travail est encore sur le bureau.',
            'Relevez toujours le compteur d’heures, même pour une petite réparation.',
            'Ne supprimez jamais une ligne\u00a0: pour corriger une erreur, ajoutez une ligne Note qui l’explique.',
            'Gardez un seul fichier de référence, tenu par une personne, et faites-en une copie de sauvegarde chaque semaine.',
            'Indiquez le numéro de facture dans Détails, pour retrouver le justificatif.',
            'Planifiez les prochains services à partir des [intervalles d’entretien des engins](/guides/intervalles-entretien-engins-chantier) et du manuel du constructeur.',
          ],
        },
        {
          h2: 'Les limites d’un carnet d’entretien en Excel',
          paragraphs: [
            'Pour quelques machines et une seule personne responsable, ce modèle suffit. Il bute sur trois points que le fichier ne peut pas régler seul\u00a0: il ne prévient personne quand un service approche, il reste sur un ordinateur alors que les informations naissent sur le chantier, et il ne garde aucune trace d’une cellule modifiée ou d’une ligne effacée.',
            'Notre guide du [carnet d’entretien des machines de chantier](/guides/carnet-entretien-machines-chantier) détaille quoi noter et compare papier, tableur et logiciel. Celui sur l’[obligation d’entretien](/guides/obligation-entretien-art-32b-opa) explique ce que demande l’art. 32b OPA.',
          ],
        },
        {
          h2: 'Importer le modèle dans Godet',
          paragraphs: [
            'Le modèle a exactement les colonnes que Godet sait lire. Le jour où vous passez au carnet numérique, rien n’est à ressaisir\u00a0: dans le garage, ouvrez le menu Excel, choisissez Importer, puis votre fichier.',
            'Godet montre un aperçu avant d’écrire quoi que ce soit\u00a0: machines à créer ou à mettre à jour, interventions à ajouter, et lignes ignorées avec leur numéro et la raison. Une machine déjà présente avec le même code est mise à jour, et une intervention déjà au carnet n’est pas ajoutée deux fois. Vous pouvez essayer l’import dans [la démo](/demo), sans compte\u00a0: rien n’y est enregistré.',
          ],
        },
      ],
      faq: [
        {
          q: 'Le modèle est-il vraiment gratuit\u00a0?',
          a: 'Oui. Il se télécharge sans inscription et sans adresse e-mail. Vous pouvez l’utiliser, le modifier et le partager librement.',
        },
        {
          q: 'Puis-je ajouter mes propres colonnes\u00a0?',
          a: 'Oui, où vous voulez, tant que vous ne renommez pas les colonnes existantes. À l’import, Godet lit les colonnes qu’il reconnaît et ignore les autres.',
        },
        {
          q: 'Un carnet d’entretien en Excel suffit-il pour l’art. 32b OPA\u00a0?',
          a: 'L’ordonnance demande d’entretenir les équipements de travail selon les instructions du fabricant et de consigner les résultats de l’entretien\u00a0; elle n’impose pas de logiciel. Un tableur complet, daté et tenu à jour peut servir de trace. Sa faiblesse\u00a0: une ligne peut être modifiée ou effacée sans laisser de trace, ce qui affaiblit la preuve en cas de litige.',
        },
        {
          q: 'Quels formats de date et de nombre utiliser\u00a0?',
          a: 'Une vraie date Excel est le plus sûr. À l’import, Godet lit aussi 14.03.2026, 14/03/2026 et 2026-03-14. Les nombres peuvent avoir une apostrophe (6’842) et les montants une devise (CHF 420).',
        },
      ],
    },
    de: {
      slug: 'wartungsplan-vorlage-baumaschinen-excel',
      metaTitle: 'Wartungsplan Vorlage Baumaschinen: Excel gratis',
      description: 'Kostenlose Wartungsplan-Vorlage für Baumaschinen als Excel: Maschinen, Wartungen, Betriebsstunden, Kosten. Ausfüllen oder direkt in Godet importieren.',
      h1: 'Wartungsplan-Vorlage für Baumaschinen (Excel, kostenlos)',
      lead: 'Diese kostenlose Excel-Vorlage dient als Wartungsheft und Wartungsplan für einen Baumaschinenpark: ein Blatt für die Maschinenliste, ein zweites für jeden Eintrag, mit Betriebsstunden und Kosten. Laden Sie sie ohne Anmeldung herunter, füllen Sie sie von Hand aus und importieren Sie sie unverändert in Godet, sobald eine Datei nicht mehr reicht.',
      sections: [
        {
          h2: 'Was die Excel-Vorlage enthält',
          paragraphs: [
            'Die .xlsx-Datei hat zwei Blätter. Das Blatt «Maschinen» listet den Maschinenpark, eine Zeile pro Maschine. Das Blatt «Serviceheft» nimmt die Historie auf, eine Zeile pro Eintrag: Wartung, Reparatur, Prüfung, ersetztes Teil oder einfache Notiz. Der Maschinencode verbindet die beiden Blätter.',
            'Die erste Zeile jedes Blatts enthält die Spaltenköpfe, gelb hinterlegt. Die zweite ist ein Beispiel, das Sie mit Ihren Daten überschreiben. Die Datei öffnet sich in Excel, LibreOffice Calc, Numbers oder Google Sheets. Die Spaltenköpfe sind in der Sprache dieser Seite, und Godet erkennt sie auf Deutsch, Französisch, Italienisch und Englisch.',
          ],
        },
        {
          h2: 'Blatt «Maschinen»: eine Zeile pro Maschine',
          paragraphs: [
            'Pflicht sind nur Code und Typ. Den Rest ergänzen Sie, wenn Sie die Angaben zur Hand haben: Auf dem Typenschild der Maschine stehen meist Seriennummer, Baujahr und Gewicht.',
          ],
          bullets: [
            'Code: ein kurzes, eindeutiges Kürzel wie BA-01 oder MB-03. Er ordnet jeden Eintrag der richtigen Maschine zu.',
            'Typ: die Maschinenart, zum Beispiel Raupenbagger, Minibagger, Radlader, Baggerlader oder Scherenarbeitsbühne.',
            'Gewicht (t), Marke, Modell und Baujahr: damit die Maschine eindeutig erkennbar ist.',
            'Seriennummer und Kennzeichen: nützlich für die Versicherung, bei Diebstahl und beim Verkauf.',
            'Betriebsstunden: der Zählerstand an dem Tag, an dem Sie die Zeile ausfüllen.',
            'Bemerkungen: alles Weitere, etwa Ausrüstung, Anbaugeräte oder Standort.',
          ],
        },
        {
          h2: 'Blatt «Serviceheft»: eine Zeile pro Eintrag',
          paragraphs: [
            'Jeder Eintrag erhält eine eigene Zeile, auch der kürzeste. Vier Spalten sind Pflicht: Datum, Maschine (Code), Art des Eintrags und Titel. Die übrigen machen das Wartungsheft erst richtig nützlich, wenn Sie die Kosten einer Maschine berechnen oder ein Teil wiederfinden müssen.',
          ],
          bullets: [
            'Datum: der Tag des Eintrags, zum Beispiel 14.03.2026.',
            'Maschine (Code): der Code aus dem Blatt Maschinen, gleich geschrieben.',
            'Eintrag: Wartung, Prüfung, Inspektion, Reparatur, Ersatzteil oder Notiz.',
            'Titel und Details: was gemacht wurde, in wenigen Worten, dann die Einzelheiten (Öle, Filter, Teile, Beobachtungen).',
            'Zählerstand (h): die Betriebsstunden beim Eintrag. Das ist die wichtigste Spalte für die nächste Planung.',
            'Ausgeführt von: der Mechaniker, die Werkstatt oder die externe Garage.',
            'Teile (Betrag) und Arbeit (Betrag): die beiden Beträge der Rechnung, getrennt.',
            'Ausfall (h): die Zeit, in der die Maschine nicht arbeiten konnte.',
            'Reparaturstatus: Repariert, In Arbeit oder Wartet auf Ersatzteil, nur bei Reparaturen.',
            'Teilenummer, Menge und Lieferant: damit Sie ein Teil ohne Suchen nachbestellen.',
          ],
        },
        {
          h2: 'Ausgefülltes Beispiel: ein 14-t-Bagger',
          paragraphs: [
            'Nehmen wir einen Raupenbagger mit 14 Tonnen, Code BA-02. Im Blatt Maschinen steht in seiner Zeile BA-02, Raupenbagger, 14, Marke, Modell, Baujahr, Seriennummer und der aktuelle Zählerstand, zum Beispiel 4520 h.',
            'Im Blatt Serviceheft erzählen zwei Zeilen seinen letzten Monat. Wenn Sie jedes Mal Zählerstand und Ausfall notieren, sehen Sie, wie viele Stunden zwischen den Wartungen liegen und was Pannen kosten: die Grundlage der [Baumaschinen-Kosten pro Stunde](/guides/baumaschinen-kosten-pro-stunde).',
          ],
          bullets: [
            'Die 500-Stunden-Wartung: Datum, BA-02, Wartung, Titel «Wartung 500 h», Details «Motoröl, Ölfilter, Dieselfilter, Kabinenfilter», Zählerstand 4500, die Werkstatt unter Ausgeführt von, dann die Beträge für Teile und Arbeit aus der Rechnung.',
            'Die Reparatur eines Schlauchs: Datum, BA-02, Reparatur, Titel «Schlauch am Löffelzylinder ersetzt», Zählerstand 4512, Ausfall 3 h, Status Repariert, Teilenummer des Schlauchs, Menge 1 und Lieferant.',
          ],
        },
        {
          h2: 'Das Wartungsheft im Alltag führen',
          paragraphs: [
            'Eine Vorlage ist nur so gut wie ihre Pflege. Ein paar einfache Regeln verhindern die meisten Lücken in der Historie.',
          ],
          bullets: [
            'Tragen Sie den Eintrag am selben Tag ein, solange Rechnung oder Arbeitsrapport noch auf dem Tisch liegen.',
            'Notieren Sie immer den Zählerstand, auch bei einer kleinen Reparatur.',
            'Löschen Sie nie eine Zeile: Einen Fehler korrigieren Sie mit einer Notiz-Zeile, die ihn erklärt.',
            'Führen Sie eine einzige Referenzdatei, gepflegt von einer Person, und sichern Sie jede Woche eine Kopie.',
            'Schreiben Sie die Rechnungsnummer in die Details, damit der Beleg auffindbar bleibt.',
            'Planen Sie die nächsten Wartungen anhand der [Wartungsintervalle für Baumaschinen](/guides/wartungsintervalle-baumaschinen) und der Betriebsanleitung des Herstellers.',
          ],
        },
        {
          h2: 'Die Grenzen eines Wartungsplans in Excel',
          paragraphs: [
            'Für wenige Maschinen und eine verantwortliche Person reicht diese Vorlage. An drei Stellen stösst sie an Grenzen, die eine Datei allein nicht lösen kann: Sie meldet sich nicht, wenn eine Wartung fällig wird, sie liegt auf einem Computer, während die Informationen auf der Baustelle entstehen, und sie hält nicht fest, wenn eine Zelle geändert oder eine Zeile gelöscht wurde.',
            'Unser Ratgeber zum [Wartungsheft für Baumaschinen](/guides/wartungsheft-baumaschinen) zeigt, was hineingehört, und vergleicht Papier, Tabelle und Software. Der Ratgeber zur [Instandhaltungspflicht](/guides/instandhaltungspflicht-art-32b-vuv) erklärt, was Art. 32b VUV verlangt.',
          ],
        },
        {
          h2: 'Die Vorlage in Godet importieren',
          paragraphs: [
            'Die Vorlage hat genau die Spalten, die Godet lesen kann. Wenn Sie zum digitalen Wartungsheft wechseln, müssen Sie nichts neu erfassen: Öffnen Sie in der Garage das Menü Excel, wählen Sie Importieren und dann Ihre Datei.',
            'Godet zeigt eine Vorschau, bevor etwas gespeichert wird: neue und geänderte Maschinen, neue Einträge sowie übersprungene Zeilen mit Nummer und Grund. Eine Maschine mit demselben Code wird aktualisiert, und ein Eintrag, der schon im Wartungsheft steht, wird nicht doppelt angelegt. Sie können den Import in der [Demo](/demo) ohne Konto ausprobieren: Dort wird nichts gespeichert.',
          ],
        },
      ],
      faq: [
        {
          q: 'Ist die Vorlage wirklich kostenlos?',
          a: 'Ja. Sie laden sie ohne Anmeldung und ohne E-Mail-Adresse herunter. Sie dürfen sie frei nutzen, anpassen und weitergeben.',
        },
        {
          q: 'Kann ich eigene Spalten hinzufügen?',
          a: 'Ja, wo Sie möchten, solange Sie die bestehenden Spalten nicht umbenennen. Beim Import liest Godet die Spalten, die es kennt, und ignoriert die übrigen.',
        },
        {
          q: 'Genügt ein Wartungsheft in Excel für Art. 32b VUV?',
          a: 'Die Verordnung verlangt, Arbeitsmittel nach den Angaben des Herstellers instand zu halten und die Ergebnisse der Instandhaltung festzuhalten; eine bestimmte Software schreibt sie nicht vor. Eine vollständige, datierte und aktuelle Tabelle kann als Nachweis dienen. Ihre Schwäche: Eine Zeile lässt sich spurlos ändern oder löschen, was den Nachweis im Streitfall schwächt.',
        },
        {
          q: 'Welche Datums- und Zahlenformate funktionieren?',
          a: 'Am sichersten ist ein echtes Excel-Datum. Beim Import liest Godet auch 14.03.2026, 14/03/2026 und 2026-03-14. Zahlen dürfen einen Apostroph haben (6’842) und Beträge eine Währung (CHF 420).',
        },
      ],
    },
    it: {
      slug: 'modello-libretto-manutenzione-macchine-edili-excel',
      metaTitle: 'Modello libretto manutenzione macchine edili: Excel gratis',
      description: 'Modello gratuito di libretto di manutenzione per macchine edili in Excel: macchine, interventi, ore, costi. Da compilare o da importare in Godet.',
      h1: 'Modello di libretto di manutenzione per macchine edili (Excel gratuito)',
      lead: 'Questo modello Excel gratuito funziona come libretto di manutenzione per un parco di macchine edili: un foglio per l’elenco delle macchine, un altro per ogni intervento, con contaore e costi. Lo scarichi senza registrarsi, lo compili a mano e lo importi così com’è in Godet il giorno in cui un file non basta più.',
      sections: [
        {
          h2: 'Cosa contiene il modello Excel',
          paragraphs: [
            'Il file .xlsx ha due fogli. Il foglio «Macchine» elenca il parco, una riga per macchina. Il foglio «Libretto» raccoglie lo storico, una riga per intervento: manutenzione, riparazione, controllo, ricambio sostituito o semplice nota. Il codice della macchina collega i due fogli.',
            'La prima riga di ogni foglio contiene le intestazioni, su sfondo giallo. La seconda è un esempio da sostituire con i Suoi dati. Il file si apre con Excel, LibreOffice Calc, Numbers o Google Sheets. Le intestazioni sono nella lingua di questa pagina, e Godet le riconosce in italiano, francese, tedesco e inglese.',
          ],
        },
        {
          h2: 'Foglio «Macchine»: una riga per macchina',
          paragraphs: [
            'Sono obbligatori solo il codice e il tipo. Completi il resto quando ha le informazioni a portata di mano: la targhetta della macchina riporta di solito numero di serie, anno e peso.',
          ],
          bullets: [
            'Codice: una sigla breve e unica, come ES-01 o MI-03. È il codice che collega ogni intervento alla macchina giusta.',
            'Tipo: il genere di macchina, per esempio Escavatore cingolato, Miniescavatore, Pala gommata, Terna o Piattaforma a pantografo.',
            'Peso (t), Marca, Modello e Anno: per identificare la macchina senza dubbi.',
            'N. di serie e Targa: utili per l’assicurazione, in caso di furto e alla rivendita.',
            'Ore: il contaore nel giorno in cui compila la riga.',
            'Note: tutto il resto, come equipaggiamenti, attrezzature o luogo di rimessaggio.',
          ],
        },
        {
          h2: 'Foglio «Libretto»: una riga per intervento',
          paragraphs: [
            'Ogni intervento ha la sua riga, anche il più breve. Quattro colonne sono obbligatorie: data, macchina (il suo codice), tipo di intervento e titolo. Le altre rendono il libretto davvero utile quando bisogna calcolare i costi di una macchina o ritrovare un ricambio.',
          ],
          bullets: [
            'Data: il giorno dell’intervento, per esempio 14.03.2026.',
            'Macchina (codice): il codice del foglio Macchine, scritto allo stesso modo.',
            'Intervento: Manutenzione, Controllo, Ispezione, Riparazione, Ricambio o Nota.',
            'Titolo e Dettagli: cosa è stato fatto in poche parole, poi il dettaglio (oli, filtri, ricambi, osservazioni).',
            'Contaore (h): le ore al momento dell’intervento. È la colonna più utile per pianificare il seguito.',
            'Eseguito da: il meccanico, l’officina o il garage esterno.',
            'Ricambi (importo) e Manodopera (importo): i due importi della fattura, separati.',
            'Fermo (h): il tempo in cui la macchina non ha potuto lavorare.',
            'Stato della riparazione: Riparata, In corso o In attesa del ricambio, solo per le riparazioni.',
            'Rif. ricambio, Quantità e Fornitore: per ritrovare un ricambio e riordinarlo senza cercare.',
          ],
        },
        {
          h2: 'Esempio compilato: un escavatore da 14 t',
          paragraphs: [
            'Prendiamo un escavatore cingolato da 14 tonnellate, codice ES-02. Nel foglio Macchine la sua riga indica ES-02, Escavatore cingolato, 14, marca, modello, anno, numero di serie e il contaore del giorno, per esempio 4520 h.',
            'Nel foglio Libretto due righe raccontano il suo ultimo mese. Annotando ogni volta contaore e fermo, vede quante ore separano le manutenzioni e quanto costano i guasti: è la base del [costo orario di una macchina](/guides/costo-orario-macchine-cantiere).',
          ],
          bullets: [
            'Il tagliando delle 500 ore: data, ES-02, Manutenzione, titolo «Manutenzione 500 h», dettagli «Olio motore, filtro olio, filtri gasolio, filtro cabina», contaore 4500, l’officina in Eseguito da, poi gli importi di ricambi e manodopera ripresi dalla fattura.',
            'La riparazione di un tubo flessibile: data, ES-02, Riparazione, titolo «Flessibile del cilindro benna sostituito», contaore 4512, fermo di 3 h, stato Riparata, riferimento del flessibile, quantità 1 e fornitore.',
          ],
        },
        {
          h2: 'Tenere il libretto ogni giorno',
          paragraphs: [
            'Un modello vale quanto la cura con cui viene tenuto. Poche regole semplici evitano la maggior parte dei buchi nello storico.',
          ],
          bullets: [
            'Annoti l’intervento il giorno stesso, quando la fattura o il rapporto di lavoro sono ancora sulla scrivania.',
            'Rilevi sempre il contaore, anche per una piccola riparazione.',
            'Non cancelli mai una riga: per correggere un errore aggiunga una riga Nota che lo spiega.',
            'Tenga un solo file di riferimento, curato da una persona, e ne faccia una copia di sicurezza ogni settimana.',
            'Indichi il numero di fattura nei Dettagli, per ritrovare il giustificativo.',
            'Pianifichi le prossime manutenzioni partendo dagli [intervalli di manutenzione delle macchine da cantiere](/guides/intervalli-manutenzione-macchine-cantiere) e dal manuale del costruttore.',
          ],
        },
        {
          h2: 'I limiti di un libretto di manutenzione in Excel',
          paragraphs: [
            'Per poche macchine e una sola persona responsabile questo modello basta. Si ferma su tre punti che un file da solo non può risolvere: non avvisa nessuno quando una manutenzione si avvicina, resta su un computer mentre le informazioni nascono in cantiere, e non conserva traccia di una cella modificata o di una riga cancellata.',
            'La nostra guida al [libretto di manutenzione delle macchine da cantiere](/guides/libretto-manutenzione-macchine-cantiere) spiega cosa annotare e confronta carta, foglio di calcolo e software. Quella sull’[obbligo di manutenzione](/guides/obbligo-manutenzione-art-32b-opi) spiega cosa chiede l’art. 32b OPI.',
          ],
        },
        {
          h2: 'Importare il modello in Godet',
          paragraphs: [
            'Il modello ha esattamente le colonne che Godet sa leggere. Il giorno in cui passa al libretto digitale non c’è nulla da ridigitare: nel garage apra il menu Excel, scelga Importa e poi il Suo file.',
            'Godet mostra un’anteprima prima di salvare qualsiasi cosa: macchine da creare o da aggiornare, interventi da aggiungere e righe ignorate con numero e motivo. Una macchina già presente con lo stesso codice viene aggiornata, e un intervento già nel libretto non viene aggiunto due volte. Può provare l’importazione nella [demo](/demo), senza account: non viene salvato nulla.',
          ],
        },
      ],
      faq: [
        {
          q: 'Il modello è davvero gratuito?',
          a: 'Sì. Si scarica senza registrazione e senza indirizzo e-mail. Può usarlo, modificarlo e condividerlo liberamente.',
        },
        {
          q: 'Posso aggiungere colonne mie?',
          a: 'Sì, dove vuole, purché non rinomini le colonne esistenti. All’importazione Godet legge le colonne che riconosce e ignora le altre.',
        },
        {
          q: 'Un libretto di manutenzione in Excel basta per l’art. 32b OPI?',
          a: 'L’ordinanza chiede di mantenere le attrezzature di lavoro secondo le istruzioni del fabbricante e di registrare i risultati della manutenzione; non impone un software. Un foglio completo, datato e aggiornato può servire come traccia. Il suo punto debole: una riga può essere modificata o cancellata senza lasciare traccia, il che indebolisce la prova in caso di contestazione.',
        },
        {
          q: 'Quali formati di data e di numero usare?',
          a: 'Una vera data Excel è la scelta più sicura. All’importazione Godet legge anche 14.03.2026, 14/03/2026 e 2026-03-14. I numeri possono avere un apostrofo (6’842) e gli importi una valuta (CHF 420).',
        },
      ],
    },
    en: {
      slug: 'plant-maintenance-log-template-excel',
      metaTitle: 'Free plant maintenance log template (Excel)',
      description: 'Free maintenance log template for construction equipment in Excel: machines, services, hours, costs. Fill it in by hand or import it straight into Godet.',
      h1: 'Free plant maintenance log template for construction equipment (Excel)',
      lead: 'This free Excel template works as a maintenance log for a construction equipment fleet: one sheet for the list of machines, another for every job, with hour meter readings and costs. Download it without signing up, fill it in by hand, and import it as it is into Godet when a spreadsheet is no longer enough.',
      sections: [
        {
          h2: 'What the Excel template contains',
          paragraphs: [
            'The .xlsx file has two sheets. The ‘Machines’ sheet lists the fleet, one row per machine. The ‘Logbook’ sheet holds the history, one row per job: service, repair, safety check, part replaced or a simple note. The machine code links the two sheets.',
            'The first row of each sheet holds the column headings, on a yellow background. The second is an example to overwrite with your own data. The file opens in Excel, LibreOffice Calc, Numbers or Google Sheets. The headings are in the language of this page, and Godet recognises them in English, French, German and Italian.',
          ],
        },
        {
          h2: 'The ‘Machines’ sheet: one row per machine',
          paragraphs: [
            'Only the code and the type are required. Fill in the rest when you have the details to hand: the machine’s rating plate usually shows the serial number, year and weight.',
          ],
          bullets: [
            'Code: a short, unique reference such as EX-01 or MX-03. It is what links each job to the right machine.',
            'Type: the kind of machine, for example Crawler excavator, Mini excavator, Wheel loader, Backhoe loader or Scissor lift.',
            'Weight (t), Make, Model and Year: enough to identify the machine without any doubt.',
            'Serial number and Number plate: useful for insurance, in case of theft and when you sell.',
            'Hours: the hour meter reading on the day you fill in the row.',
            'Notes: everything else, such as equipment, attachments or where the machine is kept.',
          ],
        },
        {
          h2: 'The ‘Logbook’ sheet: one row per job',
          paragraphs: [
            'Every job gets its own row, however short. Four columns are required: the date, the machine (its code), the type of entry and the title. The others are what make the log genuinely useful when you need to cost a machine or track down a part.',
          ],
          bullets: [
            'Date: the day of the job, for example 14.03.2026.',
            'Machine (code): the code from the Machines sheet, written the same way.',
            'Entry: Service, Safety check, Walk-around, Repair, Part or Note.',
            'Title and Details: what was done in a few words, then the detail (oils, filters, parts, observations).',
            'Hour meter (h): the hours at the time of the job. This is the most useful column for planning what comes next.',
            'Done by: the fitter, the workshop or the outside garage.',
            'Parts (cost) and Labour (cost): the two amounts on the invoice, kept separate.',
            'Downtime (h): the time during which the machine could not work.',
            'Repair status: Repaired, In progress or Waiting for parts, for repairs only.',
            'Part ref., Quantity and Supplier: so you can find a part and reorder it without searching.',
          ],
        },
        {
          h2: 'A worked example: a 14-tonne excavator',
          paragraphs: [
            'Take a 14-tonne crawler excavator, coded EX-02. In the Machines sheet, its row reads EX-02, Crawler excavator, 14, its make, model, year, serial number and today’s hour meter reading, for example 4,520 h.',
            'In the Logbook sheet, two rows tell the story of its last month. By recording the hour meter and the downtime every time, you can see how many hours separate services and what breakdowns cost: the basis of the [construction equipment cost per hour](/guides/construction-equipment-cost-per-hour).',
          ],
          bullets: [
            'The 500-hour service: the date, EX-02, Service, the title ‘500 h service’, the details ‘Engine oil, oil filter, fuel filters, cab filter’, hour meter 4,500, the workshop under Done by, then the parts and labour amounts from the invoice.',
            'A hose repair: the date, EX-02, Repair, the title ‘Bucket cylinder hose replaced’, hour meter 4,512, 3 h of downtime, status Repaired, the hose part number, quantity 1 and the supplier.',
          ],
        },
        {
          h2: 'Keeping the log up to date',
          paragraphs: [
            'A template is only as good as the way it is kept. A few simple rules prevent most gaps in the history.',
          ],
          bullets: [
            'Log the job on the same day, while the invoice or job sheet is still on the desk.',
            'Always record the hour meter, even for a small repair.',
            'Never delete a row: to correct a mistake, add a Note row that explains it.',
            'Keep a single master file, looked after by one person, and back up a copy every week.',
            'Put the invoice number in Details so the paperwork can be found again.',
            'Plan the next services from the [construction equipment service intervals](/guides/construction-equipment-service-intervals) and the manufacturer’s manual.',
          ],
        },
        {
          h2: 'The limits of a maintenance log in Excel',
          paragraphs: [
            'For a few machines and one person in charge, this template is enough. It falls short on three points that a file cannot fix on its own: it warns no one when a service is coming up, it sits on one computer while the information comes from site, and it keeps no record of a changed cell or a deleted row.',
            'Our guide to the [construction equipment maintenance log](/guides/construction-equipment-maintenance-log) covers what to record and compares paper, spreadsheets and software. The one on the [maintenance obligation](/guides/maintenance-obligation-switzerland-article-32b) explains what Art. 32b of the Swiss ordinance requires.',
          ],
        },
        {
          h2: 'Importing the template into Godet',
          paragraphs: [
            'The template has exactly the columns Godet can read. When you move to a digital log, nothing needs retyping: in the garage, open the Excel menu, choose Import, then your file.',
            'Godet shows a preview before writing anything: machines to create or update, jobs to add, and skipped rows with their number and the reason. A machine that already exists with the same code is updated, and a job already in the log is not added twice. You can try the import in the [demo](/demo) without an account: nothing is saved there.',
          ],
        },
      ],
      faq: [
        {
          q: 'Is the template really free?',
          a: 'Yes. You download it without signing up and without giving an email address. You are free to use it, change it and share it.',
        },
        {
          q: 'Can I add my own columns?',
          a: 'Yes, wherever you like, as long as you do not rename the existing columns. On import, Godet reads the columns it recognises and ignores the rest.',
        },
        {
          q: 'Is an Excel maintenance log enough for Art. 32b of the Swiss ordinance?',
          a: 'The ordinance requires work equipment to be maintained according to the manufacturer’s instructions and the results of maintenance to be recorded; it does not prescribe any particular software. A complete, dated and up-to-date spreadsheet can serve as a record. Its weak point: a row can be changed or deleted without trace, which weakens the evidence in a dispute.',
        },
        {
          q: 'Which date and number formats work?',
          a: 'A proper Excel date is the safest choice. On import, Godet also reads 14.03.2026, 14/03/2026 and 2026-03-14. Numbers may include an apostrophe (6’842) and amounts a currency (CHF 420).',
        },
      ],
    },
  },
};
