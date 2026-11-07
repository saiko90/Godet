import type { Guide } from './types';

export const carnet: Guide = {
  id: 'carnet',
  published: '2026-10-23',
  updated: '2026-10-23',
  content: {
    fr: {
      slug: 'carnet-entretien-machines-chantier',
      metaTitle: 'Carnet d’entretien machines de chantier : le guide pratique',
      description:
        'Carnet d’entretien des machines de chantier : quoi noter, papier, Excel ou numérique, et comment démarrer en une heure. Moins de pannes, revente facilitée.',
      h1: 'Le carnet d’entretien des machines de chantier',
      lead: 'Un carnet d’entretien, c’est l’historique écrit de chaque machine : services, réparations, pièces, contrôles et heures au compteur. Bien tenu, il évite des pannes, prouve que l’entretien a été fait et fait monter le prix à la revente. Voici ce qu’il doit contenir, comment le tenir et comment le mettre en place en une heure.',
      sections: [
        {
          h2: 'Qu’est-ce qu’un carnet d’entretien d’engin de chantier ?',
          paragraphs: [
            'C’est le dossier de vie d’une machine. Pour une pelle, une chargeuse, une mini-pelle, un dumper ou une nacelle, il réunit tout ce qui a été fait dessus depuis son arrivée dans l’entreprise. Chaque ligne dit quoi, quand, à combien d’heures, par qui et pour quel coût.',
            'Dans beaucoup d’entreprises, ce carnet existe déjà en morceaux : des factures du concessionnaire dans un classeur, un cahier à l’atelier, des notes dans la tête du mécanicien. Le problème n’est pas l’absence d’information, c’est qu’elle est dispersée. Le jour où il faut la retrouver (panne, contrôle, vente), personne ne sait où chercher.',
          ],
        },
        {
          h2: 'Pourquoi tenir un carnet d’entretien pour vos engins ?',
          paragraphs: [
            'La première raison est simple : les pannes coûtent plus cher que l’entretien. Un service oublié, un filtre à air jamais changé, une fuite hydraulique signalée mais pas suivie, et la machine s’arrête en plein chantier. Le carnet montre ce qui est dû et ce qui traîne.',
            'La deuxième raison, c’est la revente. Un acheteur paie plus volontiers une machine dont il voit l’historique complet, services faits à l’heure et réparations documentées. Sans papiers, il suppose le pire et négocie en conséquence.',
            'Troisième raison : les contrôles. Lors d’une visite de la Suva, d’une expertise après un sinistre ou d’un audit client, il faut pouvoir montrer ce qui a été fait. Un carnet imprimable répond en quelques minutes.',
            'Enfin, il y a la loi. En Suisse, l’art. 32b OPA demande d’entretenir les équipements de travail conformément aux indications du fabricant, en tenant compte de leur usage et du lieu d’exploitation, et de consigner les résultats de l’entretien. La responsabilité reste celle de l’employeur ; les détails sont dans notre [guide sur l’obligation d’entretien](/guides/obligation-entretien-art-32b-opa).',
          ],
        },
        {
          h2: 'Que doit contenir le carnet d’entretien d’une machine ?',
          paragraphs: [
            'Un bon carnet n’est pas un roman. Il doit permettre à quelqu’un qui ne connaît pas la machine de comprendre son état en deux minutes. Voici une liste concrète, à adapter à votre parc :',
          ],
          bullets: [
            'Identification : marque, modèle, numéro de série, année, numéro interne.',
            'Compteur d’heures relevé à chaque intervention, et régulièrement entre deux.',
            'Services faits : date, heures au compteur, travaux, huiles et filtres remplacés, qui l’a fait.',
            'Échéances : prochain service en heures, contrôles et inspections en date.',
            'Réparations : panne constatée, cause, travaux, statut (en cours, attente de pièce, terminée), durée d’immobilisation.',
            'Pièces : référence, fournisseur, date de montage, garantie.',
            'Contrôles : résultat, défauts relevés, mesures prises.',
            'Coûts : pièces et main-d’œuvre, pour savoir ce que coûte vraiment chaque machine.',
            'Documents : factures, rapports de contrôle, photos des dégâts, notice du constructeur.',
          ],
        },
        {
          h2: 'Carnet papier, Excel ou logiciel de suivi : que choisir ?',
          paragraphs: [
            'Le cahier papier a de vrais avantages. Il reste dans la cabine, ne demande ni batterie ni réseau, et tout le monde sait s’en servir. Mais il se salit, se perd, et ne donne aucune vue d’ensemble : pour savoir quelles machines arrivent au service, il faut ouvrir chaque cahier.',
            'Le tableau Excel est gratuit et souple. Pour deux ou trois machines suivies par une seule personne, il suffit souvent. Les limites arrivent vite ensuite : un fichier sur un seul ordinateur, plusieurs versions qui circulent, pas de rappel, pas de photos, et une ligne effacée par erreur disparaît sans trace. Surtout, le machiniste sur le chantier n’y a pas accès.',
            'Un logiciel de suivi de l’entretien coûte un abonnement et demande un peu de mise en place. En échange, tout le monde écrit au même endroit, depuis le chantier comme depuis l’atelier, les échéances sont calculées et les rappels partent seuls. Il ne remplace pas le bon sens du mécanicien : il évite seulement que l’information se perde.',
            'Notre avis honnête : si vous avez moins de trois machines et une seule personne qui s’en occupe, un tableau bien tenu peut suffire. Au-delà, ou dès que plusieurs personnes interviennent, un carnet numérique comme Godet fait gagner du temps chaque semaine.',
          ],
        },
        {
          h2: 'Démarrer en une heure avec Godet',
          paragraphs: [
            'Godet est un carnet d’entretien numérique conçu en Valais par un ancien mécanicien d’engins de chantier. Il fonctionne dans le navigateur, sur ordinateur, tablette ou téléphone, sans rien installer. Voici comment mettre votre parc en place en une heure environ :',
          ],
          bullets: [
            'Ajoutez vos machines une par une, ou importez votre liste Excel existante. Chaque machine apparaît dans un garage 3D, en vert, orange ou rouge selon son état.',
            'Vérifiez les échéances. Chaque nouvelle machine reçoit un service toutes les 500 heures et un contrôle annuel de sécurité ; adaptez-les au manuel du constructeur.',
            'Notez le dernier service connu et le compteur actuel. Les échéances suivantes se calculent seules.',
            'Imprimez les étiquettes QR et collez-les dans les cabines. Un scan avec le téléphone ouvre la fiche de la machine, même sans réseau : la saisie part au retour de la connexion.',
            'Invitez vos machinistes et mécaniciens, chacun avec son rôle. Le machiniste relève les heures (ou photographie le compteur, la lecture est proposée puis vérifiée) et signale un défaut.',
            'Activez les rappels par e-mail, quotidiens ou hebdomadaires.',
          ],
        },
        {
          h2: 'Qui remplit le carnet, et quand ?',
          paragraphs: [
            'Un carnet ne vaut que s’il est rempli. La règle qui marche : celui qui fait le travail l’écrit, tout de suite, en deux lignes. Le mécanicien note le service à la fin de l’intervention, pas le vendredi soir de mémoire. Le machiniste relève le compteur une fois par semaine et signale ce qu’il voit : fuite, bruit, voyant allumé.',
            'Le chef d’atelier, lui, regarde la vue d’ensemble : ce qui arrive à échéance, ce qui est en retard, ce qui attend une pièce. Une saisie ne doit jamais être effacée ; si elle est fausse, on la barre avec un motif. C’est ce qui donne de la valeur au carnet lors d’un contrôle.',
            'Pour savoir à quel rythme planifier les services, lisez notre guide sur les [intervalles d’entretien des engins](/guides/intervalles-entretien-engins-chantier).',
          ],
        },
      ],
      faq: [
        {
          q: 'Le carnet d’entretien des machines de chantier est-il obligatoire en Suisse ?',
          a: 'L’art. 32b OPA demande d’entretenir les équipements de travail selon les indications du fabricant et de consigner les résultats. La forme n’est pas imposée : papier, tableau ou logiciel. Pour les détails, renseignez-vous auprès de la Suva et du constructeur.',
        },
        {
          q: 'Un tableau Excel suffit-il comme carnet d’entretien ?',
          a: 'Pour quelques machines suivies par une seule personne, souvent oui. Dès que plusieurs personnes interviennent ou que le parc grandit, les versions multiples, l’absence de rappels et l’accès impossible depuis le chantier deviennent un problème. Pour démarrer, notre [modèle de carnet d’entretien en Excel](/guides/modele-carnet-entretien-engins-excel) est gratuit.',
        },
        {
          q: 'Combien de temps garder l’historique d’une machine ?',
          a: 'Le plus simple est de le garder pendant toute la vie de la machine dans l’entreprise, puis de le remettre à l’acheteur. Un historique complet rassure lors de la revente et lors d’une expertise.',
        },
        {
          q: 'Un logiciel d’entretien remplace-t-il la télématique de mes machines ?',
          a: 'Non, les deux se complètent. La télématique donne la position et les heures. Le carnet garde ce qui a été fait sur la machine, par qui, avec quelles pièces et à quel coût.',
        },
        {
          q: 'Peut-on essayer sans engagement ?',
          a: 'Oui. La [démo 3D](/demo) se visite sans compte, et l’essai de Godet dure 15 jours, sans carte de crédit. Le mode d’emploi complet est dans l’[aide](/aide).',
        },
      ],
    },
    de: {
      slug: 'wartungsheft-baumaschinen',
      metaTitle: 'Wartungsheft Baumaschinen: Inhalt, Pflicht und Praxis',
      description:
        'Wartungsheft für Baumaschinen: was hineingehört, Papier, Excel oder Software, und wie Sie Ihren Maschinenpark in einer Stunde erfassen. Jetzt gratis testen.',
      h1: 'Das Wartungsheft für Baumaschinen',
      lead: 'Ein Wartungsheft ist die schriftliche Geschichte jeder Maschine: Service, Reparaturen, Ersatzteile, Kontrollen und Betriebsstunden. Sauber geführt, verhindert es Ausfälle, belegt die Wartung und bringt beim Wiederverkauf einen besseren Preis. Hier steht, was hineingehört, wie Sie es führen und wie Sie in einer Stunde starten.',
      sections: [
        {
          h2: 'Was ist ein Wartungsheft für Baumaschinen?',
          paragraphs: [
            'Es ist der Lebenslauf einer Maschine. Ob Bagger, Radlader, Minibagger, Dumper oder Hebebühne: Das Wartungsheft sammelt alles, was seit dem Kauf an der Maschine gemacht wurde. Jeder Eintrag sagt, was gemacht wurde, wann, bei wie vielen Betriebsstunden, von wem und zu welchen Kosten.',
            'In vielen Betrieben gibt es diese Informationen schon, aber verstreut: Rechnungen vom Händler im Ordner, ein Heft in der Werkstatt, der Rest im Kopf des Mechanikers. Das Problem ist nicht fehlendes Wissen, sondern dass es niemand findet, wenn es darauf ankommt.',
          ],
        },
        {
          h2: 'Warum ein Wartungsheft für jede Baumaschine?',
          paragraphs: [
            'Erstens: Ausfälle kosten mehr als Wartung. Ein vergessener Service, ein nie gewechselter Luftfilter, ein gemeldetes Hydraulikleck, das niemand weiterverfolgt hat, und die Maschine steht mitten auf der Baustelle still. Das Wartungsheft zeigt, was fällig ist und was liegen bleibt.',
            'Zweitens: der Wiederverkauf. Käufer zahlen mehr für eine Maschine mit lückenloser Geschichte, Service pünktlich gemacht, Reparaturen belegt. Ohne Unterlagen rechnen sie mit dem Schlimmsten und drücken den Preis.',
            'Drittens: Kontrollen. Bei einem Besuch der Suva, einer Expertise nach einem Schaden oder einem Audit des Kunden müssen Sie zeigen können, was gemacht wurde. Ein druckbares Wartungsheft liefert das in wenigen Minuten.',
            'Und schliesslich das Gesetz. In der Schweiz verlangt Art. 32b VUV, dass Arbeitsmittel gemäss den Angaben des Herstellers instand gehalten werden, unter Berücksichtigung von Verwendungszweck und Einsatzort, und dass die Ergebnisse der Instandhaltung festgehalten werden. Die Verantwortung bleibt beim Arbeitgeber; mehr dazu in unserem [Leitfaden zur Instandhaltungspflicht](/guides/instandhaltungspflicht-art-32b-vuv).',
          ],
        },
        {
          h2: 'Was gehört in das Wartungsheft einer Baumaschine?',
          paragraphs: [
            'Ein gutes Wartungsheft ist kurz und vollständig. Wer die Maschine nicht kennt, soll ihren Zustand in zwei Minuten verstehen. Diese Liste können Sie an Ihren Maschinenpark anpassen:',
          ],
          bullets: [
            'Identifikation: Marke, Modell, Seriennummer, Baujahr, interne Nummer.',
            'Betriebsstunden bei jedem Eingriff und regelmässig dazwischen abgelesen.',
            'Service: Datum, Betriebsstunden, Arbeiten, gewechselte Öle und Filter, wer ihn gemacht hat.',
            'Fälligkeiten: nächster Service nach Stunden, Kontrollen und Prüfungen nach Datum.',
            'Reparaturen: Schaden, Ursache, Arbeiten, Status (in Arbeit, wartet auf Teil, erledigt), Stillstandszeit.',
            'Ersatzteile: Referenz, Lieferant, Einbaudatum, Garantie.',
            'Kontrollen: Ergebnis, festgestellte Mängel, getroffene Massnahmen.',
            'Kosten: Teile und Arbeitszeit, damit Sie wissen, was jede Maschine wirklich kostet.',
            'Dokumente: Rechnungen, Prüfberichte, Fotos von Schäden, Betriebsanleitung des Herstellers.',
          ],
        },
        {
          h2: 'Papier, Excel oder Software: Wie den Maschinenpark verwalten?',
          paragraphs: [
            'Das Papierheft hat echte Vorteile. Es liegt in der Kabine, braucht weder Akku noch Netz, und alle können es bedienen. Aber es wird schmutzig, geht verloren und gibt keinen Überblick: Wer wissen will, welche Maschinen zum Service müssen, blättert jedes Heft durch.',
            'Eine Excel-Tabelle ist gratis und flexibel. Für zwei, drei Maschinen und eine verantwortliche Person reicht sie oft. Danach zeigen sich die Grenzen: eine Datei auf einem Computer, mehrere Versionen im Umlauf, keine Erinnerungen, keine Fotos, und eine versehentlich gelöschte Zeile ist spurlos weg. Vor allem hat der Maschinist auf der Baustelle keinen Zugriff.',
            'Eine Software für die Instandhaltung von Baumaschinen kostet ein Abonnement und etwas Einführungszeit. Dafür schreiben alle am selben Ort, auf der Baustelle wie in der Werkstatt, die Fälligkeiten werden berechnet und die Erinnerungen gehen von selbst raus. Sie ersetzt nicht die Erfahrung des Mechanikers, sie sorgt nur dafür, dass nichts verloren geht.',
            'Ehrlich gesagt: Mit weniger als drei Maschinen und einer Person, die sich darum kümmert, kann eine gut geführte Tabelle genügen. Ab mehr Maschinen oder mehreren Beteiligten spart ein digitales Wartungsheft wie Godet jede Woche Zeit.',
          ],
        },
        {
          h2: 'In einer Stunde startklar mit Godet',
          paragraphs: [
            'Godet ist ein digitales Wartungsheft, entwickelt im Wallis von einem ehemaligen Baumaschinenmechaniker. Es läuft im Browser auf Computer, Tablet oder Handy, ohne Installation. So erfassen Sie Ihren Maschinenpark in rund einer Stunde:',
          ],
          bullets: [
            'Maschinen einzeln erfassen oder die bestehende Excel-Liste importieren. Jede Maschine steht in einer 3D-Garage, grün, orange oder rot je nach Zustand.',
            'Fälligkeiten prüfen. Jede neue Maschine erhält einen Service alle 500 Betriebsstunden und eine jährliche Sicherheitskontrolle; passen Sie beides an die Herstellerangaben an.',
            'Letzten bekannten Service und aktuellen Stundenstand eintragen. Die nächsten Fälligkeiten rechnen sich selbst.',
            'QR-Etiketten drucken und in die Kabinen kleben. Ein Scan mit dem Handy öffnet die Maschine, auch ohne Netz: Der Eintrag wird gesendet, sobald wieder Empfang da ist.',
            'Maschinisten und Mechaniker einladen, jeder mit seiner Rolle. Der Maschinist trägt die Betriebsstunden ein (oder fotografiert den Stundenzähler, der Wert wird vorgeschlagen und geprüft) und meldet Mängel.',
            'E-Mail-Erinnerungen einschalten, täglich oder wöchentlich.',
          ],
        },
        {
          h2: 'Wer führt das Wartungsheft, und wann?',
          paragraphs: [
            'Ein Wartungsheft nützt nur, wenn es geführt wird. Was funktioniert: Wer die Arbeit macht, schreibt sie auf, sofort, in zwei Zeilen. Der Mechaniker trägt den Service am Ende des Eingriffs ein, nicht am Freitagabend aus dem Gedächtnis. Der Maschinist liest einmal pro Woche den Stundenzähler ab und meldet, was ihm auffällt: Leck, Geräusch, Warnlampe.',
            'Der Werkstattchef behält den Überblick: was fällig wird, was überfällig ist, was auf ein Teil wartet. Ein Eintrag wird nie gelöscht; ist er falsch, wird er mit Begründung durchgestrichen. Genau das gibt dem Wartungsheft bei einer Kontrolle seinen Wert.',
            'Wie oft welcher Service fällig ist, lesen Sie in unserem Beitrag zu den [Wartungsintervallen von Baumaschinen](/guides/wartungsintervalle-baumaschinen).',
          ],
        },
      ],
      faq: [
        {
          q: 'Ist ein Wartungsheft für Baumaschinen in der Schweiz Pflicht?',
          a: 'Art. 32b VUV verlangt, Arbeitsmittel gemäss Herstellerangaben instand zu halten und die Ergebnisse festzuhalten. Die Form ist nicht vorgeschrieben: Papier, Tabelle oder Software. Für Einzelheiten wenden Sie sich an die Suva und an den Hersteller.',
        },
        {
          q: 'Reicht eine Excel-Tabelle als Wartungsplaner?',
          a: 'Für wenige Maschinen und eine verantwortliche Person oft schon. Sobald mehrere Personen eintragen oder der Maschinenpark wächst, werden doppelte Versionen, fehlende Erinnerungen und der fehlende Zugriff von der Baustelle zum Problem. Für den Einstieg gibt es unsere kostenlose [Wartungsplan-Vorlage für Excel](/guides/wartungsplan-vorlage-baumaschinen-excel).',
        },
        {
          q: 'Wie lange soll die Geschichte einer Maschine aufbewahrt werden?',
          a: 'Am einfachsten während der ganzen Zeit, in der die Maschine im Betrieb ist, und danach an den Käufer übergeben. Eine lückenlose Geschichte hilft beim Verkauf und bei einer Expertise.',
        },
        {
          q: 'Ersetzt eine Wartungssoftware die Telematik meiner Maschinen?',
          a: 'Nein, beides ergänzt sich. Die Telematik liefert Standort und Betriebsstunden. Das Wartungsheft hält fest, was an der Maschine gemacht wurde, von wem, mit welchen Teilen und zu welchen Kosten.',
        },
        {
          q: 'Kann ich unverbindlich testen?',
          a: 'Ja. Die [3D-Demo](/demo) funktioniert ohne Konto, und Godet können Sie 15 Tage gratis testen, ohne Kreditkarte. Die vollständige Anleitung finden Sie in der [Hilfe](/aide).',
        },
      ],
    },
    it: {
      slug: 'libretto-manutenzione-macchine-cantiere',
      metaTitle: 'Libretto di manutenzione macchine da cantiere: guida pratica',
      description:
        'Libretto di manutenzione delle macchine da cantiere: cosa annotare, carta, Excel o software, e come partire in un’ora. Meno guasti, rivendita più facile.',
      h1: 'Il libretto di manutenzione delle macchine da cantiere',
      lead: 'Il libretto di manutenzione è la storia scritta di ogni macchina: tagliandi, riparazioni, ricambi, controlli e ore al contaore. Tenuto bene, evita guasti, dimostra che la manutenzione è stata fatta e aumenta il prezzo alla rivendita. Ecco cosa deve contenere, come tenerlo e come metterlo in piedi in un’ora.',
      sections: [
        {
          h2: 'Che cos’è il libretto di manutenzione di una macchina da cantiere?',
          paragraphs: [
            'È la cartella clinica della macchina. Per un escavatore, una pala gommata, un miniescavatore, un dumper o una piattaforma aerea raccoglie tutto ciò che è stato fatto dal giorno in cui è entrata in azienda. Ogni riga dice cosa, quando, a quante ore, chi e con quale costo.',
            'In molte imprese queste informazioni esistono già, ma sparse: le fatture del concessionario in un raccoglitore, un quaderno in officina, il resto nella testa del meccanico. Il problema non è la mancanza di dati, è che nessuno li trova quando servono, per un guasto, un controllo o una vendita.',
          ],
        },
        {
          h2: 'Perché tenere un libretto di manutenzione per ogni macchina?',
          paragraphs: [
            'Primo: un guasto costa più della manutenzione. Un tagliando dimenticato, un filtro dell’aria mai cambiato, una perdita idraulica segnalata e poi lasciata lì, e la macchina si ferma in pieno cantiere. Il libretto mostra cosa è in scadenza e cosa è rimasto indietro.',
            'Secondo: la rivendita. Un acquirente paga volentieri di più per una macchina con una storia completa, tagliandi fatti in tempo e riparazioni documentate. Senza documenti pensa al peggio e tratta sul prezzo.',
            'Terzo: i controlli. Durante una visita della Suva, una perizia dopo un sinistro o un audit del cliente bisogna poter mostrare cosa è stato fatto. Un libretto stampabile risponde in pochi minuti.',
            'Infine la legge. In Svizzera l’art. 32b OPI chiede di mantenere le attrezzature di lavoro secondo le indicazioni del fabbricante, tenendo conto dell’uso e del luogo d’impiego, e di registrare i risultati della manutenzione. La responsabilità resta del datore di lavoro; i dettagli sono nella nostra [guida all’obbligo di manutenzione](/guides/obbligo-manutenzione-art-32b-opi).',
          ],
        },
        {
          h2: 'Cosa deve contenere il libretto di manutenzione?',
          paragraphs: [
            'Un buon libretto è breve ma completo. Chi non conosce la macchina deve capirne lo stato in due minuti. Ecco una lista concreta da adattare al suo parco macchine:',
          ],
          bullets: [
            'Identificazione: marca, modello, numero di serie, anno, numero interno.',
            'Ore al contaore a ogni intervento e regolarmente tra un intervento e l’altro.',
            'Tagliandi: data, ore, lavori eseguiti, oli e filtri sostituiti, chi li ha fatti.',
            'Scadenze: prossimo tagliando in ore, controlli e ispezioni in data.',
            'Riparazioni: guasto, causa, lavori, stato (in corso, in attesa del pezzo, terminata), durata del fermo macchina.',
            'Ricambi: codice, fornitore, data di montaggio, garanzia.',
            'Controlli: esito, difetti rilevati, misure prese.',
            'Costi: ricambi e manodopera, per sapere quanto costa davvero ogni macchina.',
            'Documenti: fatture, rapporti di controllo, foto dei danni, manuale del costruttore.',
          ],
        },
        {
          h2: 'Carta, Excel o software per la gestione della manutenzione del parco macchine?',
          paragraphs: [
            'Il quaderno di carta ha veri vantaggi. Resta in cabina, non ha bisogno di batteria né di rete e tutti sanno usarlo. Però si sporca, si perde e non dà una visione d’insieme: per sapere quali macchine vanno al tagliando bisogna aprire ogni quaderno.',
            'Il foglio Excel è gratuito e flessibile. Per due o tre macchine seguite da una sola persona spesso basta. Poi arrivano i limiti: un file su un solo computer, più versioni in giro, nessun promemoria, niente foto, e una riga cancellata per errore sparisce senza traccia. Soprattutto, l’operatore in cantiere non ci arriva.',
            'Un software di manutenzione costa un abbonamento e chiede un po’ di avvio. In cambio tutti scrivono nello stesso posto, dal cantiere come dall’officina, le scadenze si calcolano da sole e i promemoria partono in automatico. Non sostituisce l’esperienza del meccanico: evita solo che le informazioni vadano perse.',
            'Il nostro parere onesto: con meno di tre macchine e una sola persona che se ne occupa, un foglio ben tenuto può bastare. Oltre, o quando intervengono più persone, un libretto digitale come Godet fa risparmiare tempo ogni settimana.',
          ],
        },
        {
          h2: 'Partire in un’ora con Godet',
          paragraphs: [
            'Godet è un libretto di manutenzione digitale nato in Vallese, ideato da un ex meccanico di macchine da cantiere. Funziona nel browser, su computer, tablet o telefono, senza installare nulla. Ecco come caricare il suo parco in circa un’ora:',
          ],
          bullets: [
            'Aggiunga le macchine una per una o importi la sua lista Excel. Ogni macchina appare in un garage 3D, verde, arancione o rossa secondo il suo stato.',
            'Controlli le scadenze. Ogni nuova macchina riceve un tagliando ogni 500 ore e un controllo annuale di sicurezza; li adatti al manuale del costruttore.',
            'Inserisca l’ultimo tagliando noto e le ore attuali. Le scadenze successive si calcolano da sole.',
            'Stampi le etichette QR e le incolli in cabina. Una scansione con il telefono apre la scheda della macchina, anche senza rete: l’inserimento parte quando torna la connessione.',
            'Inviti operatori e meccanici, ognuno con il suo ruolo. L’operatore registra le ore (o fotografa il contaore: il valore viene proposto e poi verificato) e segnala un difetto.',
            'Attivi i promemoria via e-mail, giornalieri o settimanali.',
          ],
        },
        {
          h2: 'Chi compila il libretto, e quando?',
          paragraphs: [
            'Un libretto vale solo se viene compilato. La regola che funziona: chi fa il lavoro lo scrive, subito, in due righe. Il meccanico registra il tagliando a fine intervento, non il venerdì sera a memoria. L’operatore legge il contaore una volta alla settimana e segnala quello che vede: perdita, rumore, spia accesa.',
            'Il capo officina tiene la visione d’insieme: cosa scade, cosa è in ritardo, cosa aspetta un pezzo. Una registrazione non si cancella mai; se è sbagliata, si barra indicando il motivo. È proprio questo che dà valore al libretto durante un controllo.',
            'Per sapere ogni quanto pianificare i tagliandi, legga la nostra guida sugli [intervalli di manutenzione delle macchine da cantiere](/guides/intervalli-manutenzione-macchine-cantiere).',
          ],
        },
      ],
      faq: [
        {
          q: 'Il libretto di manutenzione delle macchine da cantiere è obbligatorio in Svizzera?',
          a: 'L’art. 32b OPI chiede di mantenere le attrezzature di lavoro secondo le indicazioni del fabbricante e di registrare i risultati. La forma non è imposta: carta, foglio di calcolo o software. Per i dettagli si rivolga alla Suva e al costruttore.',
        },
        {
          q: 'Un foglio Excel basta come libretto di manutenzione?',
          a: 'Per poche macchine seguite da una sola persona spesso sì. Quando a compilarlo sono in più persone o il parco cresce, versioni doppie, promemoria assenti e accesso impossibile dal cantiere diventano un problema. Per iniziare, il nostro [modello di libretto di manutenzione in Excel](/guides/modello-libretto-manutenzione-macchine-edili-excel) è gratuito.',
        },
        {
          q: 'Per quanto tempo conservare la storia di una macchina?',
          a: 'La cosa più semplice è conservarla per tutta la vita della macchina in azienda e poi consegnarla all’acquirente. Una storia completa rassicura alla rivendita e durante una perizia.',
        },
        {
          q: 'Un software di manutenzione sostituisce la telematica delle macchine?',
          a: 'No, le due cose si completano. La telematica dà posizione e ore. Il libretto conserva cosa è stato fatto sulla macchina, da chi, con quali ricambi e a quale costo.',
        },
        {
          q: 'Posso provare senza impegno?',
          a: 'Sì. La [demo 3D](/demo) si visita senza account e la prova di Godet dura 15 giorni, senza carta di credito. Le istruzioni complete sono nell’[aiuto](/aide).',
        },
      ],
    },
    en: {
      slug: 'construction-equipment-maintenance-log',
      metaTitle: 'Construction equipment maintenance log: a practical guide',
      description:
        'Construction equipment maintenance log: what to record, paper, Excel or software, and how to set up your fleet in an hour. Fewer breakdowns, better resale.',
      h1: 'The construction equipment maintenance log',
      lead: 'A maintenance log is the written history of each machine: services, repairs, parts, inspections and hour meter readings. Kept properly, it prevents breakdowns, proves the maintenance was done and raises the resale price. Here is what it should contain, how to keep it and how to set one up in an hour.',
      sections: [
        {
          h2: 'What is a maintenance log for construction plant?',
          paragraphs: [
            'It is the life record of a machine. For an excavator, wheel loader, mini excavator, dumper or aerial work platform, it holds everything done to the machine since it joined the company. Each entry says what, when, at how many hours, by whom and at what cost.',
            'Most firms already have this information, but scattered: dealer invoices in a binder, a notebook in the workshop, the rest in the mechanic’s head. The problem is not missing data. It is that nobody can find it when it matters: a breakdown, an inspection, a sale.',
          ],
        },
        {
          h2: 'Why keep a maintenance log for your plant?',
          paragraphs: [
            'First, breakdowns cost more than maintenance. A missed service, an air filter never changed, a hydraulic leak reported and then forgotten, and the machine stops in the middle of a job. The log shows what is due and what has been left.',
            'Second, resale. Buyers pay more for a machine with a full history, services on time and repairs documented. Without records, they assume the worst and negotiate accordingly.',
            'Third, inspections. During a Suva visit, an assessment after a claim or a customer audit, you need to show what was done. A printable log answers in minutes.',
            'Finally, the law. In Switzerland, Article 32b of the Ordinance on Accident Prevention (OPA/VUV) requires work equipment to be maintained according to the manufacturer’s instructions, taking into account its use and place of operation, and the results of maintenance to be recorded. Responsibility stays with the employer; see our [guide to the maintenance obligation](/guides/maintenance-obligation-switzerland-article-32b) for details.',
          ],
        },
        {
          h2: 'What should a plant maintenance record contain?',
          paragraphs: [
            'A good log is short and complete. Someone who does not know the machine should understand its condition in two minutes. Here is a practical list to adapt to your fleet:',
          ],
          bullets: [
            'Identification: make, model, serial number, year, internal fleet number.',
            'Hour meter reading at every job, and regularly in between.',
            'Services: date, hours, work done, oils and filters replaced, who did it.',
            'Due dates: next service in hours, inspections and checks by date.',
            'Repairs: fault, cause, work done, status (in progress, awaiting parts, completed), downtime.',
            'Parts: part number, supplier, fitting date, warranty.',
            'Inspections: result, defects found, action taken.',
            'Costs: parts and labour, so you know what each machine really costs.',
            'Documents: invoices, inspection reports, photos of damage, the manufacturer’s manual.',
          ],
        },
        {
          h2: 'Paper, Excel or plant maintenance records software?',
          paragraphs: [
            'A paper logbook has real advantages. It stays in the cab, needs no battery or signal, and everyone can use it. But it gets dirty, goes missing and gives no overview: to see which machines are due for a service, you have to open every book.',
            'An Excel sheet is free and flexible. For two or three machines looked after by one person, it is often enough. The limits come quickly after that: one file on one computer, several versions going round, no reminders, no photos, and a row deleted by mistake is gone without trace. Above all, the operator on site cannot reach it.',
            'Maintenance software costs a subscription and a little setting up. In return, everyone writes in the same place, on site or in the workshop, due dates are calculated and reminders go out on their own. It does not replace the mechanic’s judgement; it simply stops information getting lost.',
            'Our honest view: with fewer than three machines and one person in charge, a well-kept spreadsheet can do the job. Beyond that, or once several people are involved, a digital log such as Godet saves time every week.',
          ],
        },
        {
          h2: 'Get started in an hour with Godet',
          paragraphs: [
            'Godet is a digital maintenance log built in Valais, Switzerland, by a former construction plant mechanic. It runs in the browser on a computer, tablet or phone, with nothing to install. Here is how to set up your fleet in about an hour:',
          ],
          bullets: [
            'Add your machines one by one, or import your existing Excel list. Each machine appears in a 3D garage, green, orange or red depending on its condition.',
            'Check the due dates. Each new machine gets a service every 500 hours and an annual safety inspection; adjust both to the manufacturer’s manual.',
            'Enter the last known service and the current hour meter reading. The next due dates are worked out for you.',
            'Print the QR labels and stick them in the cabs. A scan with a phone opens the machine record, even without signal: the entry is sent once the connection returns.',
            'Invite your operators and mechanics, each with their own role. Operators log hours (or photograph the hour meter: the reading is suggested, then checked) and report defects.',
            'Turn on email reminders, daily or weekly.',
          ],
        },
        {
          h2: 'Who fills in the log, and when?',
          paragraphs: [
            'A log is only worth something if it is filled in. The rule that works: whoever does the job writes it down, straight away, in two lines. The mechanic records the service at the end of the job, not on Friday evening from memory. The operator reads the hour meter once a week and reports what they notice: a leak, a noise, a warning light.',
            'The workshop manager keeps the overview: what is coming due, what is overdue, what is waiting for parts. An entry is never deleted; if it is wrong, it is struck through with a reason. That is what gives the log its value during an inspection.',
            'To plan how often each machine needs a service, read our guide to [construction equipment service intervals](/guides/construction-equipment-service-intervals).',
          ],
        },
      ],
      faq: [
        {
          q: 'Is a maintenance log for construction equipment mandatory in Switzerland?',
          a: 'Article 32b OPA/VUV requires work equipment to be maintained according to the manufacturer’s instructions and the results to be recorded. The format is not prescribed: paper, spreadsheet or software. For details, ask Suva and the manufacturer.',
        },
        {
          q: 'Is an Excel spreadsheet enough as a maintenance log?',
          a: 'For a few machines and one person in charge, often yes. Once several people write in it or the fleet grows, duplicate versions, missing reminders and no access from site become a problem. To get started, our [maintenance log template for Excel](/guides/plant-maintenance-log-template-excel) is free.',
        },
        {
          q: 'How long should a machine’s history be kept?',
          a: 'The simplest approach is to keep it for the machine’s whole life in the company, then hand it to the buyer. A complete history helps at resale and during an assessment.',
        },
        {
          q: 'Does maintenance software replace telematics?',
          a: 'No, the two work together. Telematics gives location and hours. The log keeps what was done to the machine, by whom, with which parts and at what cost.',
        },
        {
          q: 'Can I try it without commitment?',
          a: 'Yes. The [3D demo](/demo) works without an account, and the Godet trial lasts 15 days, with no credit card. The full user guide is in [Help](/aide).',
        },
      ],
    },
  },
};
