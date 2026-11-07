import type { Guide } from './types';

export const location: Guide = {
  id: 'location',
  updated: '2026-11-07',
  content: {
    fr: {
      slug: 'logiciel-location-machines-chantier',
      metaTitle: 'Logiciel location matériel TP : planning et état des lieux',
      description:
        'Logiciel de location de matériel TP et BTP : planning sans double réservation, état des lieux photo signé, rapport PDF au client. Essai gratuit de 15 jours.',
      h1: 'Logiciel de location de machines de chantier : planning, états des lieux et litiges',
      lead: 'Un logiciel de location de machines de chantier et de matériel TP sert à trois choses : savoir quelle machine est libre et quand, documenter son état au départ et au retour, puis facturer sans discussion ce qui a changé entre les deux. Des photos imposées, un relevé du compteur et deux signatures règlent la plupart des litiges sur les dégâts. Voici comment organiser vos locations, avec une check-list d’état des lieux prête à l’emploi.',
      sections: [
        {
          h2: 'Location d’engins de chantier : les problèmes qui reviennent toujours',
          paragraphs: [
            'Loueur ou entreprise qui loue son parc inutilisé, vous connaissez les mêmes ennuis. Ils viennent rarement de la machine, presque toujours d’une information non notée au bon moment.',
            'Une réservation prise au téléphone et oubliée dans un carnet, une rayure qui « était déjà là », un compteur d’heures que personne n’a relevé au départ : chaque fois, c’est votre parole contre celle du client. Et sans preuve, c’est souvent le loueur qui paie.',
          ],
          bullets: [
            'Double réservation : la même mini-pelle promise à deux clients pour le même lundi.',
            'Dégâts contestés : un godet fissuré, une vitre étoilée ou un pneu entaillé que le client dit avoir trouvés ainsi.',
            'Compteur d’heures non relevé : impossible de facturer les heures réelles ou de prouver une utilisation intensive.',
            'Plein non fait : la machine revient à un quart de réservoir, sans trace du niveau au départ.',
            'Transport oublié : la chargeuse est prête, mais personne n’a commandé le camion pour la livrer.',
            'Accessoires manquants : clé, attache rapide, godet de curage ou rallonge qui ne reviennent pas.',
          ],
        },
        {
          h2: 'Planning de location de matériel BTP : éviter la double réservation',
          paragraphs: [
            'Le planning de location le plus lisible tient en une ligne par machine et une colonne par jour. Chaque réservation y apparaît comme une barre avec le nom du client, le chantier, les dates et le mode de remise (livraison par vos soins ou enlèvement par le client). Si deux barres se chevauchent, le conflit saute aux yeux avant de dire oui au client.',
            'Bloquez aussi les jours où la machine n’est pas louable : service prévu, réparation en cours, contrôle annuel. Une pelle qui atteint son service des 500 heures pendant une location de trois semaines doit être entretenue avant le départ, pas au milieu du chantier du client. Pour cela, le planning et le carnet d’entretien doivent se parler.',
            'Notez aussi le transport dès la réservation. Sinon, la livraison sans camion se découvre le matin même.',
          ],
        },
        {
          h2: 'État des lieux de location d’engin : la check-list de départ et de retour',
          paragraphs: [
            'Un bon état des lieux se fait machine sous les yeux, avec le client présent, et suit toujours le même ordre. Utilisez la même liste au départ et au retour : c’est ce qui permet de comparer point par point. Adaptez-la au type d’engin (pelle, chargeuse, dumper, nacelle), mais gardez une base commune.',
          ],
          bullets: [
            'Identification : machine, numéro de série ou de parc, client, chantier, date et heure.',
            'Compteur d’heures : valeur exacte, avec une photo du compteur.',
            'Carburant : niveau de la jauge (plein, 3/4, 1/2…), avec une photo ; AdBlue si la machine en a.',
            'Carrosserie et cabine : rayures, bosses, vitres, rétroviseurs, siège, propreté.',
            'Train de roulement : chenilles ou pneus (entailles, usure), galets, barbotins.',
            'Équipement : bras, vérins, flexibles (fuites), dents et lame du godet, attache rapide.',
            'Fonctionnement : démarrage, voyants au tableau de bord, éclairage, gyrophare, avertisseur de recul.',
            'Accessoires remis : godets supplémentaires, marteau, clés (nombre), documents de bord.',
            'Conditions générales acceptées et signatures du client et du loueur.',
          ],
        },
        {
          h2: 'Photos et signatures : ce qui fait foi en cas de litige',
          paragraphs: [
            'Imposez toujours les mêmes vues : avant, arrière, côté gauche, côté droit, compteur et jauge. Ajoutez des gros plans de chaque défaut déjà présent. Une courte vidéo du moteur qui tourne et des mouvements hydrauliques complète bien le dossier.',
            'La signature du client sur l’état des lieux de départ montre qu’il a vu la machine et accepté son état. Faites aussi signer le retour, même si le client conteste un point : il peut signer en notant son désaccord. Envoyez-lui une copie le jour même. Un document reçu par e-mail le soir de la remise est bien plus difficile à contester trois semaines plus tard.',
          ],
        },
        {
          h2: 'Check-list retour location pelle : comparer départ et retour',
          paragraphs: [
            'Au retour, reprenez la check-list de départ, ligne par ligne, et les mêmes angles de photo. Toute différence entre les deux documents est soit une usure normale, soit un dégât à discuter. Les heures de location se calculent par différence entre les deux relevés du compteur, et le carburant par différence entre les deux jauges.',
            'Distinguez clairement l’usure normale (dents de godet, petites rayures d’utilisation) des dégâts (vitre cassée, flexible arraché, vérin tordu). Fixez ces règles dans vos conditions générales, avant la location. Notez aussi les frais simples à facturer : plein à refaire, nettoyage d’une machine rendue pleine de boue.',
            'Faites ce contrôle avec le client si possible. Sinon, photographiez la machine dès votre arrivée et prévenez-le.',
          ],
        },
        {
          h2: 'Machine rendue en panne : que faire ?',
          paragraphs: [
            'Une machine qui revient en panne doit être immobilisée immédiatement, même si la panne semble légère. Documentez ce que vous constatez (photos, vidéo, codes d’erreur affichés), notez le compteur et ouvrez une réparation. Ne la relouez pas tant que la cause n’est pas connue.',
            'Regardez ensuite les réservations suivantes. Si la machine doit repartir dans deux jours, prévenez le prochain client ou prévoyez une machine de remplacement.',
            'Pour savoir qui paie, la question est souvent : usure ou mauvaise utilisation ? Un historique d’entretien à jour montre que la machine a été suivie selon les indications du constructeur. C’est tout l’intérêt d’un [carnet d’entretien des machines de chantier](/guides/carnet-entretien-machines-chantier) tenu sans trou.',
          ],
        },
        {
          h2: 'Comment l’option Location de Godet gère tout ça',
          paragraphs: [
            'L’option Location de Godet reprend exactement ce déroulement. L’agenda des locations affiche une ligne par machine. Chaque réservation porte le client, le chantier et le mode de remise (livraison ou enlèvement). Un petit camion rouge ou vert indique si le transport de chaque livraison est organisé.',
            'L’état des lieux se fait sur tablette : points de contrôle adaptés à la machine (OK, Défaut ou Sans objet), carburant, compteur, photos imposées (avant, arrière, gauche, droite, compteur, jauge), jusqu’à 20 photos et 2 vidéos, accessoires, clés, conditions générales acceptées, puis signature du client et du loueur au doigt. Au retour, la comparaison avec le départ affiche les nouveaux défauts en rouge et calcule les heures de location. Vous ajoutez les frais (plein, nettoyage, dégâts) et le rapport PDF part au client par e-mail.',
            'Si la machine revient en panne, une réparation est ouverte dans son carnet et les réservations suivantes sont signalées « à risque ». L’option coûte 29 CHF par mois en plus de votre abonnement et elle est comprise dans l’essai gratuit de 15 jours, sans carte de crédit. Le plus simple est de [parcourir la démo de l’option Location](/demo/location), sans créer de compte.',
          ],
        },
      ],
      faq: [
        {
          q: 'Faut-il un logiciel spécifique pour louer seulement quelques machines ?',
          a: 'Pas forcément. Mais à plusieurs, un tableau papier ou un fichier partagé montre vite ses limites. Ce qui compte, c’est un planning unique, consultable par tous, et des états des lieux faits toujours de la même façon.',
        },
        {
          q: 'Que doit contenir un état des lieux de location d’engin ?',
          a: 'Au minimum : l’identification de la machine et du client, le compteur d’heures, le niveau de carburant, l’état de la carrosserie, du train de roulement et de l’équipement, les accessoires remis, des photos sous des angles fixes et les signatures des deux parties.',
        },
        {
          q: 'Comment prouver qu’un dégât date de la location ?',
          a: 'En comparant deux documents identiques : l’état des lieux de départ signé par le client et celui du retour, avec des photos prises sous les mêmes angles. Si le défaut n’apparaît pas au départ et apparaît au retour, la discussion est beaucoup plus courte.',
        },
        {
          q: 'Comment calculer les heures de location d’une pelle ?',
          a: 'Par différence entre le compteur d’heures relevé au retour et celui relevé au départ. D’où l’importance d’une photo du compteur dans les deux états des lieux : un chiffre noté à la main est facile à contester.',
        },
        {
          q: 'Combien coûte l’option Location de Godet ?',
          a: 'Elle coûte 29 CHF par mois en plus de l’abonnement (Essentiel 29 CHF, Pro 59 CHF ou Parc 99 CHF par mois), sans engagement. Elle est comprise dans l’essai gratuit de 15 jours. Pour une question précise, [écrivez-nous](/contact).',
        },
      ],
    },
    de: {
      slug: 'software-baumaschinenvermietung',
      metaTitle: 'Software Baumaschinenvermietung: Mietplanung und Übergabe',
      description:
        'Software für die Baumaschinenvermietung: Mietplanung ohne Doppelbuchung, Übergabeprotokoll mit Fotos und Unterschrift. 15 Tage kostenlos testen.',
      h1: 'Software für die Baumaschinenvermietung: Planung, Übergabe und Rückgabe',
      lead: 'Eine Software für die Baumaschinenvermietung muss drei Dinge können: zeigen, welche Maschine wann frei ist, den Zustand bei Übergabe und Rückgabe festhalten und die Unterschiede zwischen beiden sauber belegen. Pflichtfotos, ein abgelesener Betriebsstundenzähler und zwei Unterschriften erledigen die meisten Streitfälle um Schäden. Hier steht, wie Sie das organisieren, inklusive Checkliste für das Übergabeprotokoll.',
      sections: [
        {
          h2: 'Baumaschinen vermieten: die typischen Probleme',
          paragraphs: [
            'Ob Sie Vermieter sind oder als Bauunternehmen einen Teil Ihres Maschinenparks vermieten, wenn er gerade steht: Die Ärgernisse sind immer dieselben. Sie liegen selten an der Maschine. Meistens fehlt eine Information, die im richtigen Moment nicht aufgeschrieben wurde.',
            'Eine Reservation am Telefon, die nur im Kopf des Disponenten existiert. Ein Kratzer, der «schon da war». Betriebsstunden, die bei der Übergabe niemand notiert hat. Am Ende steht Aussage gegen Aussage, und ohne Beweis zahlt meistens der Vermieter.',
          ],
          bullets: [
            'Doppelbuchung: derselbe Minibagger ist zwei Kunden für denselben Montag versprochen.',
            'Bestrittene Schäden: gerissene Schaufel, gesprungene Scheibe oder aufgeschlitzter Reifen, angeblich schon bei der Übernahme.',
            'Betriebsstunden nicht abgelesen: Die tatsächliche Nutzung lässt sich weder verrechnen noch belegen.',
            'Tank nicht aufgefüllt: Die Maschine kommt mit einem Viertel Tank zurück, der Stand bei der Übergabe ist unbekannt.',
            'Transport vergessen: Der Radlader ist bereit, aber niemand hat den Tieflader bestellt.',
            'Fehlendes Zubehör: Schlüssel, Schnellwechsler, Grabenräumlöffel oder Verlängerungskabel kommen nicht zurück.',
          ],
        },
        {
          h2: 'Mietplanung für Baumaschinen: Doppelbuchungen vermeiden',
          paragraphs: [
            'Die übersichtlichste Mietplanung hat eine Zeile pro Maschine und eine Spalte pro Tag. Jede Miete erscheint als Balken mit Kunde, Baustelle, Daten und Übergabeart (Lieferung durch Sie oder Abholung durch den Kunden). Überschneiden sich zwei Balken, sehen Sie den Konflikt, bevor Sie dem Kunden zusagen.',
            'Sperren Sie auch die Tage, an denen die Maschine nicht vermietbar ist: geplanter Service, offene Reparatur, jährliche Kontrolle. Ein Bagger, der während einer dreiwöchigen Miete seinen 500-Stunden-Service erreicht, gehört vor der Übergabe in die Werkstatt und nicht mitten auf die Baustelle des Kunden. Dafür müssen Mietplanung und Wartungsheft zusammenspielen.',
            'Planen Sie den Transport gleich bei der Reservation ein. Eine Lieferung ohne reservierten Lastwagen und Chauffeur fällt sonst erst am Morgen selbst auf.',
          ],
        },
        {
          h2: 'Übergabeprotokoll Baumaschine: Checkliste für Übergabe und Rückgabe',
          paragraphs: [
            'Ein gutes Übergabeprotokoll entsteht an der Maschine, mit dem Kunden oder seinem Maschinisten daneben, und folgt immer derselben Reihenfolge. Verwenden Sie für Übergabe und Rückgabe dieselbe Liste, nur so lassen sich beide Punkt für Punkt vergleichen. Passen Sie sie an den Maschinentyp an (Bagger, Radlader, Dumper, Hebebühne), aber behalten Sie eine gemeinsame Basis.',
          ],
          bullets: [
            'Identifikation: Maschine, Serien- oder Inventarnummer, Kunde, Baustelle, Datum und Uhrzeit.',
            'Betriebsstundenzähler: genauer Stand, mit Foto des Zählers.',
            'Treibstoff: Stand der Tankanzeige (voll, 3/4, 1/2 …) mit Foto; AdBlue, falls vorhanden.',
            'Aufbau und Kabine: Kratzer, Beulen, Scheiben, Spiegel, Sitz, Sauberkeit.',
            'Fahrwerk: Ketten oder Reifen (Schnitte, Verschleiss), Laufrollen, Turasse.',
            'Ausrüstung: Ausleger, Zylinder, Schläuche (Leckagen), Zähne und Schneide der Schaufel, Schnellwechsler.',
            'Funktion: Start, Warnleuchten im Display, Beleuchtung, Rundumleuchte, Rückfahrwarner.',
            'Übergebenes Zubehör: zusätzliche Löffel, Hydraulikhammer, Anzahl Schlüssel, Bordunterlagen.',
            'Akzeptierte AGB sowie Unterschrift von Kunde und Vermieter.',
          ],
        },
        {
          h2: 'Fotos und Unterschriften: was bei einem Streit zählt',
          paragraphs: [
            'Ein Foto ist besser als jede Beschreibung, wenn es am richtigen Ort und zum richtigen Zeitpunkt gemacht wird. Verlangen Sie immer dieselben Ansichten: vorne, hinten, links, rechts, Zähler und Tankanzeige. Dazu Nahaufnahmen jedes bereits vorhandenen Mangels. Ein kurzes Video mit laufendem Motor und den Hydraulikbewegungen ergänzt das Dossier gut.',
            'Die Unterschrift des Kunden auf dem Übergabeprotokoll zeigt, dass er die Maschine gesehen und ihren Zustand akzeptiert hat. Lassen Sie auch das Rückgabeprotokoll unterschreiben, selbst wenn der Kunde einen Punkt bestreitet: Er kann unterschreiben und seinen Einwand notieren. Schicken Sie ihm am selben Tag eine Kopie. Ein Dokument, das am Abend der Rückgabe per E-Mail kam, ist drei Wochen später schwer zu bestreiten.',
          ],
        },
        {
          h2: 'Rückgabeprotokoll: Übergabe und Rückgabe vergleichen',
          paragraphs: [
            'Bei der Rückgabe gehen Sie die Liste der Übergabe Zeile für Zeile durch und fotografieren aus denselben Winkeln. Jeder Unterschied ist entweder normaler Verschleiss oder ein Schaden, über den man reden muss. Die Mietstunden ergeben sich aus der Differenz der beiden Zählerstände, der Treibstoff aus der Differenz der beiden Tankanzeigen.',
            'Trennen Sie klar zwischen normalem Verschleiss (Schaufelzähne, kleine Gebrauchsspuren) und Schäden (gebrochene Scheibe, abgerissener Schlauch, verbogener Zylinder). Halten Sie diese Regeln vor der Miete in den AGB fest. Notieren Sie auch die einfachen Zusatzkosten: Tank auffüllen, Reinigung einer Maschine, die voller Schlamm zurückkommt.',
            'Machen Sie die Kontrolle wenn immer möglich zusammen mit dem Kunden. Wird die Maschine ausserhalb der Öffnungszeiten abgestellt, fotografieren Sie sie bei Arbeitsbeginn und informieren Sie den Kunden sofort.',
          ],
        },
        {
          h2: 'Maschine defekt zurückgegeben: was tun?',
          paragraphs: [
            'Eine Maschine, die defekt zurückkommt, wird sofort stillgelegt, auch wenn der Schaden klein aussieht. Halten Sie fest, was Sie sehen (Fotos, Video, angezeigte Fehlercodes), notieren Sie die Betriebsstunden und eröffnen Sie eine Reparatur. Vermieten Sie sie nicht weiter, solange die Ursache unklar ist.',
            'Prüfen Sie dann die nächsten Reservationen. Soll die Maschine in zwei Tagen wieder raus, informieren Sie den nächsten Kunden oder planen Sie eine Ersatzmaschine ein. Ein früh erkannter Defekt bleibt ein Werkstattthema. Am Morgen der Lieferung entdeckt, wird er zum Problem mit dem Kunden.',
            'Bei der Frage, wer zahlt, geht es oft um Verschleiss oder Fehlbedienung. Ein lückenloses Wartungsheft zeigt, dass die Maschine nach den Vorgaben des Herstellers gewartet wurde. Mehr dazu im Leitfaden zum [Wartungsheft für Baumaschinen](/guides/wartungsheft-baumaschinen).',
          ],
        },
        {
          h2: 'So erledigt die Option Vermietung von Godet das alles',
          paragraphs: [
            'Die Option Vermietung von Godet bildet genau diesen Ablauf ab. Der Mietkalender zeigt eine Zeile pro Maschine. Jede Reservation enthält Kunde, Baustelle und Übergabeart (Lieferung oder Abholung). Ein kleiner roter oder grüner Lastwagen zeigt, ob der Transport jeder Lieferung organisiert ist.',
            'Das Protokoll füllen Sie auf dem Tablet aus: auf die Maschine abgestimmte Kontrollpunkte (OK, Mangel oder Entfällt), Treibstoff, Zähler, Pflichtfotos (vorne, hinten, links, rechts, Zähler, Tankanzeige), bis zu 20 Fotos und 2 Videos, Zubehör, Schlüssel, akzeptierte AGB und am Schluss die Unterschrift von Kunde und Vermieter mit dem Finger. Bei der Rückgabe markiert der Vergleich mit der Übergabe neue Mängel rot und berechnet die Mietstunden. Sie erfassen die Zusatzkosten (Tanken, Reinigung, Schäden), und der PDF-Bericht geht per E-Mail an den Kunden.',
            'Kommt die Maschine defekt zurück, wird in ihrem Wartungsheft eine Reparatur eröffnet und die folgenden Reservationen werden als «gefährdet» markiert. Die Option kostet 29 CHF pro Monat zusätzlich zum Abo und ist im kostenlosen 15-Tage-Test enthalten, ohne Kreditkarte. Am schnellsten verstehen Sie sie in der [Demo der Option Vermietung](/demo/location), ganz ohne Konto.',
          ],
        },
      ],
      faq: [
        {
          q: 'Brauche ich eine eigene Software, wenn ich nur wenige Maschinen vermiete?',
          a: 'Nicht unbedingt. Sobald aber mehrere Personen Reservationen annehmen, stossen Wandtafel und geteilte Excel-Liste schnell an ihre Grenzen. Entscheidend sind eine einzige Mietplanung, die alle sehen, und Protokolle, die immer gleich gemacht werden.',
        },
        {
          q: 'Was gehört in ein Übergabeprotokoll für eine Baumaschine?',
          a: 'Mindestens: Maschine und Kunde, Betriebsstundenzähler, Tankstand, Zustand von Aufbau, Fahrwerk und Ausrüstung, übergebenes Zubehör, Fotos aus festen Winkeln und die Unterschriften beider Parteien.',
        },
        {
          q: 'Wie beweise ich, dass ein Schaden während der Miete entstanden ist?',
          a: 'Mit zwei gleich aufgebauten Dokumenten: dem vom Kunden unterschriebenen Übergabeprotokoll und dem Rückgabeprotokoll, beide mit Fotos aus denselben Winkeln. Fehlt der Mangel bei der Übergabe und ist er bei der Rückgabe da, ist die Diskussion meist kurz.',
        },
        {
          q: 'Wie berechne ich die Mietstunden eines Baggers?',
          a: 'Aus der Differenz zwischen dem Betriebsstundenzähler bei der Rückgabe und bei der Übergabe. Deshalb gehört in beide Protokolle ein Foto des Zählers: Eine von Hand notierte Zahl lässt sich leicht bestreiten.',
        },
        {
          q: 'Was kostet die Option Vermietung von Godet?',
          a: '29 CHF pro Monat zusätzlich zum Abo (Essentiel 29 CHF, Pro 59 CHF oder Parc 99 CHF pro Monat), ohne Vertragsbindung. Im kostenlosen 15-Tage-Test ist sie enthalten. Bei konkreten Fragen [schreiben Sie uns](/contact).',
        },
      ],
    },
    it: {
      slug: 'software-noleggio-macchine-cantiere',
      metaTitle: 'Software noleggio macchine da cantiere: planning e verbali',
      description:
        'Software noleggio macchine da cantiere: planning senza doppie prenotazioni, verbale di consegna con foto e firma, meno contestazioni. Prova gratis 15 giorni.',
      h1: 'Software per il noleggio di macchine da cantiere: planning, consegna e riconsegna',
      lead: 'Un software per il noleggio di macchine da cantiere serve a tre cose: sapere quale macchina è libera e quando, documentarne lo stato alla consegna e alla riconsegna, e far valere senza discussioni ciò che è cambiato nel frattempo. Foto obbligatorie, la lettura del contaore e due firme risolvono la maggior parte delle contestazioni sui danni. Ecco come organizzarsi, con una check-list pronta per il verbale di consegna.',
      sections: [
        {
          h2: 'Noleggio di macchine edili: i problemi di sempre',
          paragraphs: [
            'Che Lei sia un noleggiatore o un’impresa che noleggia una parte del proprio parco macchine quando è ferma, i grattacapi sono sempre gli stessi. Raramente dipendono dalla macchina. Quasi sempre manca un’informazione che non è stata annotata al momento giusto.',
            'Una prenotazione presa al telefono e rimasta in testa a qualcuno, un graffio che «c’era già», un contaore che nessuno ha letto alla partenza: alla fine è la parola del noleggiatore contro quella del cliente. E senza prove, spesso paga il noleggiatore.',
          ],
          bullets: [
            'Doppia prenotazione: lo stesso miniescavatore promesso a due clienti per lo stesso lunedì.',
            'Danni contestati: benna crepata, vetro scheggiato o pneumatico tagliato che il cliente dice di aver trovato così.',
            'Contaore non letto: impossibile fatturare le ore reali o dimostrare un uso intensivo.',
            'Pieno non fatto: la macchina torna con un quarto di serbatoio, senza traccia del livello alla partenza.',
            'Trasporto dimenticato: la pala gommata è pronta, ma nessuno ha prenotato il carrellone.',
            'Accessori mancanti: chiavi, attacco rapido, benna pulizia fossi o prolunghe che non rientrano.',
          ],
        },
        {
          h2: 'Planning del noleggio: evitare le doppie prenotazioni',
          paragraphs: [
            'Il planning più leggibile ha una riga per macchina e una colonna per giorno. Ogni noleggio compare come una barra con cliente, cantiere, date e modalità di consegna (consegna da parte Sua o ritiro da parte del cliente). Se due barre si sovrappongono, il conflitto si vede prima di confermare al cliente.',
            'Bloccate anche i giorni in cui la macchina non è noleggiabile: tagliando previsto, riparazione in corso, controllo annuale. Un escavatore che arriva al tagliando delle 500 ore durante un noleggio di tre settimane va in officina prima della partenza, non a metà del cantiere del cliente. Per questo planning e libretto di manutenzione devono parlarsi.',
            'Annotate il trasporto insieme alla prenotazione. Una consegna senza camion né autista prenotati è un problema che si scopre troppo tardi, la mattina stessa.',
          ],
        },
        {
          h2: 'Verbale di consegna e check-list noleggio escavatore',
          paragraphs: [
            'Un buon verbale di consegna si compila davanti alla macchina, con il cliente o il suo macchinista presente, e segue sempre lo stesso ordine. Usi la stessa lista alla consegna e alla riconsegna: è l’unico modo per confrontarle punto per punto. La adatti al tipo di macchina (escavatore, pala, dumper, piattaforma aerea), ma mantenga una base comune.',
          ],
          bullets: [
            'Identificazione: macchina, numero di serie o di parco, cliente, cantiere, data e ora.',
            'Contaore: valore esatto, con una foto del contaore.',
            'Carburante: livello indicato (pieno, 3/4, 1/2…) con foto; AdBlue se presente.',
            'Carrozzeria e cabina: graffi, ammaccature, vetri, specchietti, sedile, pulizia.',
            'Carro: cingoli o pneumatici (tagli, usura), rulli, ruote motrici.',
            'Attrezzatura: braccio, cilindri, tubi flessibili (perdite), denti e lama della benna, attacco rapido.',
            'Funzionamento: avviamento, spie sul cruscotto, luci, lampeggiante, cicalino di retromarcia.',
            'Accessori consegnati: benne supplementari, martello demolitore, numero di chiavi, documenti di bordo.',
            'Condizioni generali accettate e firma del cliente e del noleggiatore.',
          ],
        },
        {
          h2: 'Foto e firme: cosa conta in caso di contestazione',
          paragraphs: [
            'Una foto vale più di qualsiasi descrizione, se è scattata nel posto giusto e al momento giusto. Chieda sempre le stesse inquadrature: davanti, dietro, lato sinistro, lato destro, contaore e indicatore del carburante. Aggiunga primi piani di ogni difetto già presente. Un breve video con il motore acceso e i movimenti idraulici completa bene il dossier.',
            'La firma del cliente sul verbale di consegna dimostra che ha visto la macchina e ne ha accettato lo stato. Faccia firmare anche il verbale di riconsegna, anche se il cliente contesta un punto: può firmare annotando il suo disaccordo. Gli invii una copia il giorno stesso. Un documento ricevuto per e-mail la sera della riconsegna è molto più difficile da contestare tre settimane dopo.',
          ],
        },
        {
          h2: 'Verbale di riconsegna: confrontare partenza e rientro',
          paragraphs: [
            'Al rientro riprenda la lista della consegna, riga per riga, con le stesse inquadrature. Ogni differenza tra i due documenti è usura normale oppure un danno da discutere. Le ore di noleggio si calcolano dalla differenza tra le due letture del contaore, il carburante dalla differenza tra i due livelli.',
            'Distingua chiaramente l’usura normale (denti della benna, piccoli segni d’uso) dai danni (vetro rotto, tubo strappato, cilindro piegato). Fissi queste regole nelle condizioni generali, prima del noleggio. Annoti anche i costi semplici da addebitare: pieno da rifare, pulizia di una macchina riconsegnata piena di fango.',
            'Quando possibile, faccia il controllo insieme al cliente. Se la macchina viene lasciata fuori orario, scatti le foto appena arriva e lo avvisi subito.',
          ],
        },
        {
          h2: 'Macchina riconsegnata guasta: cosa fare?',
          paragraphs: [
            'Una macchina che rientra guasta va fermata subito, anche se il guasto sembra leggero. Documenti quello che vede (foto, video, codici di errore), annoti il contaore e apra una riparazione. Non la noleggi di nuovo finché la causa non è chiara.',
            'Guardi poi le prenotazioni successive. Se la macchina deve ripartire fra due giorni, avvisi il prossimo cliente o preveda una macchina sostitutiva. Un guasto gestito presto resta una questione d’officina; scoperto la mattina della consegna, diventa un problema con il cliente.',
            'Per decidere chi paga, la domanda è spesso: usura o uso scorretto? Uno storico di manutenzione completo dimostra che la macchina è stata seguita secondo le indicazioni del costruttore. È lo scopo di un [libretto di manutenzione delle macchine da cantiere](/guides/libretto-manutenzione-macchine-cantiere) tenuto senza buchi.',
          ],
        },
        {
          h2: 'Come l’opzione Noleggio di Godet gestisce tutto questo',
          paragraphs: [
            'L’opzione Noleggio di Godet segue esattamente questo percorso. L’agenda dei noleggi mostra una riga per macchina. Ogni prenotazione riporta cliente, cantiere e modalità (consegna o ritiro). Un piccolo camion rosso o verde indica se il trasporto di ogni consegna è organizzato.',
            'Il verbale si compila su tablet: punti di controllo adatti alla macchina (OK, Difetto o Non pertinente), carburante, contaore, foto obbligatorie (davanti, dietro, sinistra, destra, contaore, indicatore), fino a 20 foto e 2 video, accessori, chiavi, condizioni generali accettate e infine la firma del cliente e del noleggiatore con il dito. Alla riconsegna, il confronto con la partenza segna in rosso i nuovi difetti e calcola le ore di noleggio. Lei aggiunge i costi (pieno, pulizia, danni) e il rapporto PDF parte per e-mail al cliente.',
            'Se la macchina rientra guasta, nel suo libretto viene aperta una riparazione e le prenotazioni successive sono segnalate «a rischio». L’opzione costa 29 CHF al mese in più dell’abbonamento ed è compresa nella prova gratuita di 15 giorni, senza carta di credito. Il modo più semplice per capirla è [provare la demo dell’opzione Noleggio](/demo/location), senza creare un account.',
          ],
        },
      ],
      faq: [
        {
          q: 'Serve un software apposito se noleggio solo poche macchine?',
          a: 'Non per forza. Ma appena più persone prendono prenotazioni, la lavagna o il file Excel condiviso mostrano presto i loro limiti. Contano un planning unico, visibile a tutti, e verbali compilati sempre allo stesso modo.',
        },
        {
          q: 'Cosa deve contenere un verbale di consegna di una macchina da cantiere?',
          a: 'Almeno: identificazione di macchina e cliente, contaore, livello del carburante, stato di carrozzeria, carro e attrezzatura, accessori consegnati, foto da inquadrature fisse e le firme di entrambe le parti.',
        },
        {
          q: 'Come dimostro che un danno è avvenuto durante il noleggio?',
          a: 'Con due documenti uguali: il verbale di consegna firmato dal cliente e quello di riconsegna, con foto dalle stesse inquadrature. Se il difetto manca alla partenza e compare al rientro, la discussione è molto più breve.',
        },
        {
          q: 'Come si calcolano le ore di noleggio di un escavatore?',
          a: 'Dalla differenza tra il contaore letto alla riconsegna e quello letto alla consegna. Per questo serve una foto del contaore in entrambi i verbali: un numero scritto a mano è facile da contestare.',
        },
        {
          q: 'Quanto costa l’opzione Noleggio di Godet?',
          a: '29 CHF al mese in più dell’abbonamento (Essentiel 29 CHF, Pro 59 CHF o Parc 99 CHF al mese), senza vincoli. È compresa nella prova gratuita di 15 giorni. Per una domanda precisa, [ci scriva](/contact).',
        },
      ],
    },
    en: {
      slug: 'equipment-rental-software',
      metaTitle: 'Construction equipment hire and rental software: bookings',
      description:
        'Construction equipment hire software: no double bookings, photo check-out and check-in signed on a tablet, fewer damage disputes. Free 15-day trial.',
      h1: 'Construction equipment rental software: bookings, check-out and check-in',
      lead: 'Construction equipment rental software does three jobs: shows which machine is free and when, records its condition at check-out and check-in, and backs up any charge for what changed in between. Required photos, an hour meter reading and two signatures settle most damage disputes. Here is how to organise it, with a ready-to-use check-out checklist.',
      sections: [
        {
          h2: 'Plant hire: the problems that keep coming back',
          paragraphs: [
            'Whether you run a hire business or a contractor who hires out part of the fleet when it is standing idle, the same headaches come back. They rarely come from the machine. They come from information nobody wrote down at the right moment.',
            'A booking taken over the phone and kept in someone’s head. A scratch that was «already there». An hour meter nobody read at check-out. In the end it is your word against the customer’s, and without evidence the hire company often pays.',
          ],
          bullets: [
            'Double booking: the same mini digger promised to two customers for the same Monday.',
            'Disputed damage: a cracked bucket, a chipped window or a cut tyre the customer says was already there.',
            'Hour meter not read: you can neither charge the real hours nor show heavy use.',
            'Fuel not topped up: the machine comes back a quarter full, with no record of the level at check-out.',
            'Transport forgotten: the wheel loader is ready, but nobody booked the low-loader.',
            'Missing attachments: keys, quick coupler, ditching bucket or extension leads that never come back.',
          ],
        },
        {
          h2: 'Hire planning: how to avoid double bookings',
          paragraphs: [
            'The clearest hire planner has one row per machine and one column per day. Each hire shows as a bar with the customer, the site, the dates and how the machine changes hands (delivered by you or collected by the customer). If two bars overlap, you see the clash before you say yes.',
            'Block out the days a machine cannot go out: planned service, open repair, annual inspection. An excavator that reaches its 500-hour service during a three-week hire should be serviced before it leaves, not halfway through the customer’s job. That means the hire planner and the maintenance log need to talk to each other.',
            'Book the transport at the same time as the hire. A delivery with no lorry or driver booked is a problem you otherwise find out about on the morning itself.',
          ],
        },
        {
          h2: 'Equipment hire check-out and check-in: the checklist',
          paragraphs: [
            'A good check-out is done at the machine, with the customer or their operator present, and always follows the same order. Use the same list at check-out and check-in: that is what lets you compare them line by line. Adapt it to the type of plant (excavator, loader, dumper, access platform), but keep a common core.',
          ],
          bullets: [
            'Identification: machine, serial or fleet number, customer, site, date and time.',
            'Hour meter: exact reading, with a photo of the meter.',
            'Fuel: gauge level (full, 3/4, 1/2…) with a photo; AdBlue if fitted.',
            'Bodywork and cab: scratches, dents, glass, mirrors, seat, cleanliness.',
            'Undercarriage: tracks or tyres (cuts, wear), rollers, sprockets.',
            'Equipment: boom, rams, hoses (leaks), bucket teeth and cutting edge, quick coupler.',
            'Function: start-up, warning lights on the dash, work lights, beacon, reversing alarm.',
            'Attachments handed over: extra buckets, breaker, number of keys, on-board documents.',
            'Terms and conditions accepted, signed by both the customer and the hire company.',
          ],
        },
        {
          h2: 'Photos and signatures: what counts in a damage dispute',
          paragraphs: [
            'A photo beats any description, as long as it is taken in the right place at the right time. Always require the same views: front, rear, left side, right side, hour meter and fuel gauge. Add close-ups of every existing defect. A short video with the engine running and the hydraulics moving rounds off the record nicely.',
            'The customer’s signature on the check-out sheet shows they saw the machine and accepted its condition. Have the check-in signed too, even if the customer disputes a point: they can sign and note their objection. Send them a copy the same day. A damage report that arrived by e-mail on the evening of the return is much harder to dispute three weeks later.',
          ],
        },
        {
          h2: 'Off-hire inspection: compare check-out and check-in',
          paragraphs: [
            'At check-in, go through the check-out list line by line and take photos from the same angles. Every difference is either fair wear and tear or damage to discuss. Hire hours come from the difference between the two hour meter readings, and fuel from the difference between the two gauge readings.',
            'Draw a clear line between fair wear and tear (bucket teeth, light working marks) and damage (broken glass, torn hose, bent ram). Put those rules in your terms and conditions before the hire starts. Note the simple extra charges as well: refuelling, or cleaning a machine that comes back caked in mud.',
            'Do the inspection with the customer whenever you can. If the machine is dropped off out of hours, photograph it as soon as you arrive and let the customer know straight away.',
          ],
        },
        {
          h2: 'Machine returned broken down: what to do',
          paragraphs: [
            'A machine that comes back broken down should be taken out of service at once, even if the fault looks minor. Record what you find (photos, video, fault codes on the display), note the hour meter and open a repair. Do not hire it out again until you know the cause.',
            'Then check the next bookings. If the machine is due out again in two days, warn the next customer or line up a replacement. A breakdown handled early stays a workshop matter; found on the morning of delivery, it becomes a customer problem.',
            'Who pays often comes down to one question: wear or misuse? A complete service history shows the machine was maintained according to the manufacturer’s instructions. That is the whole point of a [construction equipment maintenance log](/guides/construction-equipment-maintenance-log) kept without gaps.',
          ],
        },
        {
          h2: 'How the Godet Rental option handles all this',
          paragraphs: [
            'The Rental option in Godet follows exactly this workflow. The hire calendar shows one row per machine. Each booking holds the customer, the site and the handover type (delivery or collection). A small red or green lorry shows whether the transport for each delivery is organised.',
            'Check-out is done on a tablet: inspection points suited to the machine (OK, Defect or Not applicable), fuel, hour meter, required photos (front, rear, left, right, meter, gauge), up to 20 photos and 2 videos, attachments, keys, terms accepted, then the customer and the hire company sign with a finger. At check-in, the comparison with check-out shows new defects in red and works out the hire hours. You add the charges (fuel, cleaning, damage) and the PDF report goes to the customer by e-mail.',
            'If the machine comes back broken down, a repair is opened in its log and the following bookings are flagged «at risk». The option costs CHF 29 a month on top of your plan and is included in the 15-day free trial, no credit card needed. The quickest way to see it is the [Rental option demo](/demo/location), with no account required.',
          ],
        },
      ],
      faq: [
        {
          q: 'Do I need dedicated software if I only hire out a few machines?',
          a: 'Not necessarily. But once more than one person takes bookings, a whiteboard or a shared spreadsheet soon shows its limits. What matters is a single hire planner everyone can see, and check-outs done the same way every time.',
        },
        {
          q: 'What should an equipment hire check-out sheet include?',
          a: 'At least: machine and customer details, hour meter reading, fuel level, condition of bodywork, undercarriage and equipment, attachments handed over, photos from fixed angles and the signatures of both parties.',
        },
        {
          q: 'How do I prove damage happened during the hire?',
          a: 'With two matching documents: the check-out sheet signed by the customer and the check-in sheet, both with photos from the same angles. If the defect is missing at check-out and present at check-in, the conversation is much shorter.',
        },
        {
          q: 'How are hire hours on an excavator worked out?',
          a: 'From the difference between the hour meter at check-in and at check-out. That is why both sheets need a photo of the meter: a figure written by hand is easy to dispute.',
        },
        {
          q: 'How much does the Godet Rental option cost?',
          a: 'CHF 29 a month on top of your plan (Essentiel CHF 29, Pro CHF 59 or Parc CHF 99 a month, same amounts in euros), with no commitment. It is included in the 15-day free trial. For a specific question, [get in touch](/contact).',
        },
      ],
    },
  },
};
