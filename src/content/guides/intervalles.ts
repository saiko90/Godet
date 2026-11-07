import type { Guide } from './types';

export const intervalles: Guide = {
  id: 'intervalles',
  published: '2026-10-23',
  updated: '2026-11-07',
  content: {
    fr: {
      slug: 'intervalles-entretien-engins-chantier',
      metaTitle: 'Intervalle d’entretien pelle et engins\u00a0: 250, 500, 1000 h',
      description:
        'Intervalle d’entretien des engins de chantier\u00a0: graissage quotidien, services 250, 500 et 1000 h, vidange, filtres. Repères pour pelle et mini-pelle.',
      h1: 'Intervalles d’entretien des engins de chantier\u00a0: toutes les combien d’heures\u00a0?',
      lead: 'La plupart des pelles, mini-pelles et chargeuses suivent un rythme en heures moteur\u00a0: contrôles et graissage chaque jour, petit service vers 250 h, service complet vers 500 h, filtres et huile hydraulique entre 1000 et 5000 h selon le modèle. Les chiffres exacts sont dans le manuel du constructeur, et ils raccourcissent en conditions sévères. Ce guide donne des repères typiques et une méthode simple pour ne rater aucune échéance.',
      sections: [
        {
          h2: 'Pourquoi l’entretien d’un engin se compte en heures et pas en kilomètres\u00a0?',
          paragraphs: [
            'Une pelle mécanique peut tourner huit heures dans la même fouille sans parcourir un kilomètre. Le moteur, la pompe hydraulique et les articulations s’usent pourtant à chaque minute de travail. C’est pour cela que les constructeurs d’engins expriment leurs intervalles en heures de fonctionnement, lues au compteur d’heures de la cabine.',
            'Une heure de chantier n’est pas une heure de route. Forte charge, poussière, longs ralentis\u00a0: seul le compteur d’heures en rend compte.',
            'Pour les machines qui tournent peu ou restent longtemps au dépôt, beaucoup de manuels ajoutent une limite en temps\u00a0: «\u00a0toutes les 500 heures ou tous les 12 mois, au premier des deux termes\u00a0». Une mini-pelle de location qui ne fait que 300 h par an a donc quand même besoin de sa vidange annuelle.',
          ],
        },
        {
          h2: 'Le quotidien du machiniste\u00a0: contrôles et graissage avant de démarrer',
          paragraphs: [
            'Le premier intervalle d’entretien, c’est la prise de poste. Les manuels l’indiquent «\u00a0toutes les 10 heures ou chaque jour\u00a0». Dix minutes suffisent pour éviter beaucoup de casses bêtes.',
          ],
          bullets: [
            'Niveaux\u00a0: huile moteur, liquide de refroidissement, huile hydraulique, carburant.',
            'Purge du séparateur d’eau du gasoil, surtout après une nuit froide.',
            'Indicateur de colmatage du filtre à air.',
            'Tour de la machine\u00a0: fuites, flexibles, vérins, dents du godet, chenilles ou pneus, éclairage.',
            'Graissage des articulations du godet, du balancier et de la flèche selon le plan du manuel (souvent toutes les 10 h, certains points toutes les 50 h).',
            'Relevé du compteur d’heures.',
          ],
        },
        {
          h2: 'Vidange de pelle toutes les combien d’heures\u00a0? Les intervalles typiques',
          paragraphs: [
            'Voici les ordres de grandeur que l’on retrouve dans les documents publics de constructeurs comme Caterpillar, Komatsu, Volvo, Liebherr, John Deere ou Kubota. Ce sont des repères typiques pour une pelle ou une chargeuse en conditions normales, pas des valeurs officielles\u00a0: chaque modèle a son propre tableau, à suivre selon le manuel du constructeur.',
          ],
          bullets: [
            'Quotidien (10 h)\u00a0: niveaux, purge d’eau, filtre à air, tour de la machine, graissage des articulations.',
            'Premier service (50 à 100 h, machine neuve)\u00a0: selon le modèle, première vidange moteur ou premiers filtres hydrauliques, resserrage de la visserie.',
            '250 h\u00a0: vidange moteur et filtre sur beaucoup de mini-pelles et de machines plus anciennes\u00a0; contrôle des courroies, de la batterie et des réducteurs\u00a0; graissage de la couronne d’orientation.',
            '500 h\u00a0: le «\u00a0service 500 heures\u00a0» des pelles récentes, avec vidange moteur et filtre à huile, filtres à gasoil, filtre de cabine et souvent un échantillon d’huile.',
            '1000 h\u00a0: filtre hydraulique principal (Komatsu l’indique à 1000 h avec ses filtres d’origine), huile des réducteurs de translation et d’orientation, reniflard du réservoir. Certains constructeurs admettent la vidange moteur à 1000 h avec leur huile et leurs filtres, comme Volvo sur des modèles récents.',
            '2000 h\u00a0: vidange de l’huile hydraulique sur beaucoup de pelles moyennes, jeu aux soupapes, huiles de transmission. Avec filtres d’origine et analyses d’huile, certains manuels vont jusqu’à 4000 ou 5000 h.',
            'Annuel\u00a0: contrôle de sécurité, liquide de refroidissement et antigel, extincteur, et toutes les opérations prévues «\u00a0au plus tard tous les 12 mois\u00a0», même si les heures ne sont pas atteintes.',
          ],
        },
        {
          h2: 'Poussière, froid, marteau hydraulique\u00a0: quand raccourcir les intervalles',
          paragraphs: [
            'Les intervalles du manuel valent pour des conditions normales. La plupart des constructeurs précisent qu’en conditions sévères, il faut les raccourcir. Trois situations reviennent souvent sur les chantiers suisses.',
            'L’analyse d’huile (usure, eau, poussière) permet d’ajuster l’intervalle avec votre concessionnaire plutôt qu’au feeling.',
          ],
          bullets: [
            'Poussière\u00a0: démolition, gravière, terrassement sec. Le filtre à air se colmate vite\u00a0; on le contrôle plus souvent et on change plus tôt les filtres à huile et hydrauliques.',
            'Froid\u00a0: chantiers d’altitude et hiver en montagne. Huiles et gasoil adaptés, antigel contrôlé, batterie testée, préchauffage respecté. Les démarrages à froid et les longs ralentis fatiguent l’huile moteur.',
            'Marteau hydraulique (BRH)\u00a0: il chauffe et pollue l’huile hydraulique. Beaucoup de manuels de pelles prévoient un tableau spécifique, avec des changements d’huile et de filtres hydrauliques nettement plus fréquents. Le marteau lui-même se graisse souvent toutes les deux heures environ, selon son fabricant.',
          ],
        },
        {
          h2: 'Garantie constructeur\u00a0: pourquoi les preuves d’entretien comptent',
          paragraphs: [
            'Pendant la garantie, le constructeur ou le concessionnaire peut demander la preuve que la machine a été entretenue selon le manuel\u00a0: dates, heures au compteur, huiles et filtres utilisés. Sans trace du dernier service, une casse moteur devient difficile à défendre.',
            'Une bonne preuve contient la date, le relevé du compteur, le détail de l’intervention, les références des pièces et, idéalement, une photo du compteur et les factures. En Suisse, l’art. 32b de l’OPA demande en plus que les équipements de travail soient entretenus selon les indications du fabricant et que les résultats soient consignés\u00a0; le détail est dans notre guide sur [l’obligation d’entretien](/guides/obligation-entretien-art-32b-opa). La responsabilité reste celle de l’employeur\u00a0; pour les questions précises, la Suva et le fabricant sont les bons interlocuteurs.',
          ],
        },
        {
          h2: 'Comment ne rien oublier sur tout le parc de machines',
          paragraphs: [
            'Avec trois machines, un tableau au bureau suffit parfois. Avec dix pelles, chargeuses, dumpers, rouleaux et nacelles répartis sur plusieurs chantiers, les échéances se perdent. C’est le problème que [Godet](/demo) règle\u00a0: un carnet d’entretien numérique pour engins de chantier, conçu en Valais par un ancien mécanicien d’engins.',
            'Vous pouvez essayer le garage 3D sans compte dans la [démo](/demo), ou lire le guide sur le [carnet d’entretien des machines de chantier](/guides/carnet-entretien-machines-chantier). L’essai est gratuit 15 jours, sans carte de crédit.',
          ],
          bullets: [
            'Échéances en heures ou en date\u00a0: un service toutes les 500 h et un contrôle annuel de sécurité sont proposés à la création de chaque machine, et vous les adaptez au manuel (250 h, 1000 h, 2000 h…).',
            'Relevé du compteur sur photo\u00a0: le machiniste photographie le compteur, l’IA lit la valeur, la personne vérifie.',
            'Rythme en heures par semaine\u00a0: Godet le calcule à partir des relevés et estime la date à laquelle tombera la prochaine échéance.',
            'Garage 3D en couleurs\u00a0: vert à jour, orange échéance proche, rouge échéance dépassée. Rappels par e-mail quotidiens ou hebdomadaires.',
            'Chaque service noté avec date, heures, pièces, coûts et photos, imprimable en PDF pour la garantie, un contrôle ou la revente.',
          ],
        },
      ],
      faq: [
        {
          q: 'Toutes les combien d’heures faut-il vidanger une pelle mécanique\u00a0?',
          a: 'Pour l’huile moteur, la plupart des pelles récentes demandent une vidange vers 500 h, beaucoup de mini-pelles et de machines plus anciennes vers 250 h, et quelques modèles récents jusqu’à 1000 h avec l’huile et les filtres du constructeur. Le chiffre exact est dans le manuel de votre machine, avec en général une limite de 12 mois.',
        },
        {
          q: 'Que contient un service 500 heures\u00a0?',
          a: 'En général\u00a0: vidange moteur et filtre à huile, filtres à gasoil, contrôle ou remplacement du filtre à air, filtre de cabine, niveaux des réducteurs, graissage complet et souvent un échantillon d’huile. Sur certaines machines, des filtres hydrauliques s’ajoutent. Suivez la liste du manuel du constructeur.',
        },
        {
          q: 'Quand changer l’huile hydraulique d’une pelle\u00a0?',
          a: 'Les repères typiques vont de 2000 à 5000 h selon le constructeur, le type d’huile et les filtres. Avec un marteau hydraulique ou en milieu très poussiéreux, l’intervalle est souvent nettement plus court. Une analyse d’huile aide à décider.',
        },
        {
          q: 'Une mini-pelle s’entretient-elle comme une grosse pelle\u00a0?',
          a: 'Le principe est le même\u00a0: contrôles quotidiens, graissage, services en heures. Les intervalles sont parfois plus courts, avec une vidange moteur vers 250 h sur beaucoup de mini-pelles, et un premier service après environ 50 h est fréquent sur les machines neuves.',
        },
        {
          q: 'Godet connaît-il les intervalles de ma machine\u00a0?',
          a: 'Non, l’application ne contient pas les manuels des constructeurs. Elle propose par défaut un service toutes les 500 h et un contrôle annuel de sécurité, que vous modifiez et complétez selon le manuel de chaque machine. Ensuite, elle suit les heures, calcule le rythme et vous prévient avant l’échéance.',
        },
      ],
    },
    de: {
      slug: 'wartungsintervalle-baumaschinen',
      metaTitle: 'Wartungsplan Baumaschinen: Wartungsintervalle Bagger, Lader',
      description:
        'Wartungsplan für Baumaschinen: tägliches Abschmieren, Service nach 250, 500 und 1000 h, Ölwechsel, Filter. Richtwerte für Bagger, Radlader und Minibagger.',
      h1: 'Wartungsplan und Wartungsintervalle für Baumaschinen: wann welcher Service fällig ist',
      lead: 'Bagger, Minibagger und Radlader werden nach Betriebsstunden gewartet: täglich kontrollieren und abschmieren, kleiner Service um 250 h, grosser Service um 500 h, Hydraulikfilter und Hydrauliköl je nach Modell zwischen 1000 und 5000 h. Massgebend ist immer die Betriebsanleitung des Herstellers, und unter harten Bedingungen werden die Abstände kürzer. Hier finden Sie typische Richtwerte und eine einfache Methode, damit kein Termin untergeht.',
      sections: [
        {
          h2: 'Warum Betriebsstunden statt Kilometer?',
          paragraphs: [
            'Ein Bagger kann einen ganzen Tag in derselben Baugrube arbeiten, ohne einen Kilometer zu fahren. Motor, Hydraulikpumpe und Bolzen verschleissen trotzdem. Deshalb geben die Hersteller ihre Wartungsintervalle in Betriebsstunden an, abgelesen am Betriebsstundenzähler in der Kabine.',
            'Eine Stunde auf der Baustelle ist ausserdem nicht dasselbe wie eine Stunde auf der Strasse: hohe Last, Staub, lange Leerlaufphasen zwischen zwei Lastwagen. Der Kilometerstand sagt darüber nichts aus, der Stundenzähler schon.',
            'Für Maschinen, die wenig laufen oder lange im Werkhof stehen, setzen viele Anleitungen zusätzlich eine Zeitgrenze: «alle 500 Stunden oder alle 12 Monate, je nachdem, was zuerst eintritt». Ein Mietbagger mit nur 300 Stunden im Jahr braucht also trotzdem seinen jährlichen Ölwechsel.',
          ],
        },
        {
          h2: 'Tägliche Kontrolle: was der Maschinist vor Arbeitsbeginn prüft',
          paragraphs: [
            'Das erste Wartungsintervall ist der Arbeitsbeginn. In den Anleitungen steht es als «alle 10 Stunden oder täglich». Zehn Minuten reichen, und viele unnötige Schäden fallen weg: ein scheuernder Schlauch, ein sinkender Ölstand, ein trockener Bolzen.',
            'Das Abschmieren wird am häufigsten ausgelassen, wenn es pressiert. Ein trocken laufender Schaufelbolzen frisst Buchse und Bolzen in wenigen Wochen, und die Reparatur kostet ein Vielfaches einer Fettkartusche. Bei Dumper, Walze und Hebebühne gilt dasselbe.',
          ],
          bullets: [
            'Füllstände: Motoröl, Kühlmittel, Hydrauliköl, Diesel.',
            'Wasserabscheider entleeren, besonders nach kalten Nächten.',
            'Verschmutzungsanzeige des Luftfilters prüfen.',
            'Rundgang: Lecks, Schläuche, Zylinder, Schaufelzähne, Laufwerk oder Reifen, Beleuchtung.',
            'Schmierstellen an Ausleger, Stiel und Schaufel nach Schmierplan abschmieren (oft alle 10 h, einzelne Stellen alle 50 h).',
            'Betriebsstunden notieren.',
          ],
        },
        {
          h2: 'Wartungsplan Bagger: Service 500 Stunden, Ölwechsel und Filter',
          paragraphs: [
            'Die folgenden Werte sind Grössenordnungen aus öffentlich zugänglichen Unterlagen von Herstellern wie Caterpillar, Komatsu, Volvo, Liebherr, John Deere oder Kubota. Es sind typische Richtwerte für Bagger und Lader unter normalen Bedingungen, keine offiziellen Zahlen. Verbindlich ist der Wartungsplan in der Betriebsanleitung des Herstellers.',
            'Die Unterschiede zwischen Modellen sind gross. Zwei Bagger derselben Gewichtsklasse können den Motorölwechsel nach 250 h beziehungsweise nach 500 h verlangen. Übernehmen Sie deshalb den Wartungsplan jeder Maschine direkt aus ihrer Anleitung.',
          ],
          bullets: [
            'Täglich (10 h): Füllstände, Wasserabscheider, Luftfilter, Rundgang, Abschmieren.',
            'Erster Service (50 bis 100 h, neue Maschine): je nach Modell erster Motorölwechsel oder erste Hydraulikfilter, Schrauben nachziehen.',
            '250 h: Ölwechsel Motor mit Filter bei vielen Minibaggern und älteren Maschinen; Keilriemen, Batterie und Fahrantriebe prüfen; Drehkranz schmieren.',
            '500 h: der klassische 500-Stunden-Service moderner Bagger mit Motoröl und Ölfilter, Dieselfiltern, Kabinenfilter und oft einer Ölprobe.',
            '1000 h: Hydraulik-Hauptfilter (Komatsu nennt 1000 h mit Originalfiltern), Öl in Fahr- und Schwenkgetriebe, Tankentlüfter. Einige Hersteller erlauben mit eigenem Öl und Filter den Motorölwechsel erst nach 1000 h, etwa Volvo bei neueren Modellen.',
            '2000 h: Hydraulikölwechsel bei vielen mittleren Baggern, Ventilspiel, Getriebeöle. Mit Originalfiltern und Ölanalysen nennen manche Anleitungen 4000 oder 5000 h.',
            'Jährlich: Sicherheitskontrolle, Kühlmittel und Frostschutz, Feuerlöscher und alle Arbeiten mit dem Vermerk «spätestens alle 12 Monate», auch wenn die Stunden nicht erreicht sind.',
          ],
        },
        {
          h2: 'Staub, Kälte, Abbauhammer: wann die Intervalle kürzer werden',
          paragraphs: [
            'Die Intervalle in der Anleitung gelten für normale Bedingungen. Die meisten Hersteller schreiben, dass sie unter harten Bedingungen zu verkürzen sind. Drei Fälle sind auf Schweizer Baustellen häufig.',
            'Am zuverlässigsten zeigt eine Ölanalyse, wo Sie stehen: Das Labor erkennt Verschleiss, Wasser oder Staub im Öl. So passen Sie das Intervall zusammen mit Ihrem Händler an, statt nach Gefühl.',
          ],
          bullets: [
            'Staub: Rückbau, Kiesgrube, trockener Aushub. Der Luftfilter setzt sich schnell zu; er wird öfter kontrolliert, und Öl- und Hydraulikfilter werden früher gewechselt.',
            'Kälte: Baustellen in den Bergen und im Winter. Passende Öle und Winterdiesel, Frostschutz kontrollieren, Batterie testen, Vorglühen abwarten. Kaltstarts und langer Leerlauf belasten das Motoröl.',
            'Hydraulikhammer: Er erhitzt und verschmutzt das Hydrauliköl. Viele Baggeranleitungen enthalten dafür eine eigene Tabelle mit deutlich häufigeren Wechseln von Hydrauliköl und Hydraulikfilter. Den Hammer selbst schmiert man je nach Hersteller oft etwa alle zwei Stunden.',
          ],
        },
        {
          h2: 'Herstellergarantie: warum der Wartungsnachweis zählt',
          paragraphs: [
            'Während der Garantie kann der Hersteller oder Händler verlangen, dass die Wartung nach Anleitung belegt wird: Datum, Betriebsstunden, verwendete Öle und Filter. Fällt ein Motor oder eine Pumpe aus und der letzte Service ist nirgends festgehalten, wird die Diskussion schwierig, auch wenn die Arbeit gemacht wurde.',
            'Ein guter Nachweis enthält Datum, Zählerstand, die ausgeführten Arbeiten, Teilenummern und idealerweise ein Foto des Zählers und die Rechnungen. In der Schweiz verlangt Art. 32b VUV zudem, dass Arbeitsmittel nach den Angaben des Herstellers instand gehalten und die Ergebnisse festgehalten werden. Mehr dazu im Ratgeber zur [Instandhaltungspflicht](/guides/instandhaltungspflicht-art-32b-vuv). Die Verantwortung bleibt beim Arbeitgeber; für Detailfragen sind die Suva und der Hersteller die richtigen Ansprechpartner.',
            'Dieselben Belege helfen beim Wiederverkauf: Ein lückenloses Wartungsheft mit Stunden und Rechnungen schafft Vertrauen beim Käufer und stärkt Ihre Position beim Preis.',
          ],
        },
        {
          h2: 'Wie Sie im ganzen Maschinenpark keinen Termin verpassen',
          paragraphs: [
            'Bei drei Maschinen reicht vielleicht eine Liste im Büro. Bei zehn Baggern, Ladern, Dumpern, Walzen und Hebebühnen auf mehreren Baustellen gehen Termine verloren. Dafür gibt es [Godet](/demo): ein digitales Wartungsheft für Baumaschinen, entwickelt im Wallis von einem ehemaligen Baumaschinenmechaniker.',
            'Die 3D-Garage können Sie ohne Konto in der [Demo](/demo) ansehen. Wie ein vollständiges Wartungsheft aussieht, zeigt der Ratgeber [Wartungsheft für Baumaschinen](/guides/wartungsheft-baumaschinen). Der Test ist 15 Tage gratis, ohne Kreditkarte.',
          ],
          bullets: [
            'Fälligkeiten in Stunden oder nach Datum: Beim Erfassen einer Maschine sind ein Service alle 500 h und eine jährliche Sicherheitskontrolle vorgeschlagen; Sie passen beides an die Anleitung an (250 h, 1000 h, 2000 h …).',
            'Zählerstand per Foto: Der Maschinist fotografiert den Stundenzähler, die KI liest den Wert, die Person bestätigt ihn.',
            'Stunden pro Woche: Godet berechnet den Rhythmus aus den Ablesungen und schätzt das Datum, an dem der nächste Service fällig wird.',
            'Garage in 3D: grün aktuell, orange bald fällig, rot überfällig. Erinnerungen per E-Mail täglich oder wöchentlich.',
            'Jeder Service mit Datum, Stunden, Teilen, Kosten und Fotos, als PDF druckbar für Garantie, Kontrolle oder Verkauf.',
          ],
        },
      ],
      faq: [
        {
          q: 'Wie oft braucht ein Bagger einen Ölwechsel?',
          a: 'Beim Motoröl verlangen die meisten neueren Bagger einen Wechsel um 500 h, viele Minibagger und ältere Maschinen um 250 h, einige neue Modelle mit Herstelleröl und -filter erst nach 1000 h. Die genaue Zahl steht in der Betriebsanleitung, meist mit einer Grenze von zwölf Monaten.',
        },
        {
          q: 'Was gehört zum Bagger Service nach 500 Stunden?',
          a: 'In der Regel Motoröl und Ölfilter, Dieselfilter, Luftfilter prüfen oder wechseln, Kabinenfilter, Füllstände der Getriebe, komplettes Abschmieren und oft eine Ölprobe. Bei manchen Maschinen kommen Hydraulikfilter dazu. Massgebend ist die Liste des Herstellers.',
        },
        {
          q: 'Wann wird das Hydrauliköl gewechselt?',
          a: 'Typische Richtwerte liegen zwischen 2000 und 5000 h, je nach Hersteller, Öl und Filtern. Mit Hydraulikhammer oder bei viel Staub ist das Intervall oft deutlich kürzer. Eine Ölanalyse hilft beim Entscheid.',
        },
        {
          q: 'Wird ein Minibagger gleich gewartet wie ein grosser Bagger?',
          a: 'Das Prinzip ist gleich: tägliche Kontrolle, Abschmieren, Service nach Stunden. Die Abstände sind teils kürzer, mit einem Motorölwechsel um 250 h bei vielen Minibaggern, und bei neuen Maschinen ist ein erster Service nach etwa 50 h häufig.',
        },
        {
          q: 'Kennt Godet die Intervalle meiner Maschine?',
          a: 'Nein, die Anwendung enthält keine Herstelleranleitungen. Sie schlägt einen Service alle 500 h und eine jährliche Sicherheitskontrolle vor; diese passen Sie pro Maschine an die Anleitung an. Danach verfolgt sie die Stunden, berechnet den Rhythmus und erinnert Sie vor dem Termin.',
        },
      ],
    },
    it: {
      slug: 'intervalli-manutenzione-macchine-cantiere',
      metaTitle: 'Intervalli di manutenzione escavatore e macchine da cantiere',
      description:
        'Intervalli di manutenzione per escavatori e macchine edili: ingrassaggio, tagliando 250 e 500 ore, cambio olio, filtri. Valori tipici e un metodo semplice.',
      h1: 'Intervalli di manutenzione delle macchine da cantiere: ogni quante ore?',
      lead: 'Escavatori, miniescavatori e pale gommate si mantengono in base alle ore di funzionamento: controlli e ingrassaggio ogni giorno, piccolo tagliando verso le 250 ore, tagliando completo verso le 500 ore, filtri e olio idraulico tra 1000 e 5000 ore secondo il modello. I valori esatti sono nel manuale del costruttore e si accorciano in condizioni gravose. Qui trova i valori tipici e un metodo semplice per non perdere nessuna scadenza.',
      sections: [
        {
          h2: 'Perché la manutenzione si conta in ore e non in chilometri?',
          paragraphs: [
            'Un escavatore può lavorare otto ore nello stesso scavo senza percorrere un chilometro. Motore, pompa idraulica e perni però si consumano a ogni minuto di lavoro. Per questo i costruttori indicano gli intervalli di manutenzione in ore di funzionamento, lette sul contaore in cabina.',
            'Un’ora di cantiere non è un’ora di strada: carico elevato, polvere, lunghi minimi tra un camion e l’altro. Il chilometraggio non dice nulla di tutto questo, il contaore sì.',
            'Per le macchine che lavorano poco o restano a lungo in deposito, molti manuali aggiungono un limite di tempo: «ogni 500 ore o ogni 12 mesi, alla prima delle due scadenze». Un miniescavatore a noleggio che fa solo 300 ore l’anno ha quindi comunque bisogno del cambio olio annuale.',
          ],
        },
        {
          h2: 'Il controllo quotidiano dell’operatore prima di partire',
          paragraphs: [
            'Il primo intervallo di manutenzione è l’inizio del turno. Nei manuali è indicato come «ogni 10 ore o ogni giorno». Bastano dieci minuti per evitare molti guasti banali: un tubo che sfrega, un livello che cala, un perno a secco.',
            'L’ingrassaggio è il controllo che salta più spesso quando il lavoro preme. Un perno della benna che gira a secco consuma boccola e perno in poche settimane, e la riparazione costa molto più di una cartuccia di grasso. Vale lo stesso per dumper, rulli e piattaforme aeree.',
          ],
          bullets: [
            'Livelli: olio motore, liquido di raffreddamento, olio idraulico, gasolio.',
            'Spurgo del separatore d’acqua del gasolio, soprattutto dopo una notte fredda.',
            'Indicatore di intasamento del filtro aria.',
            'Giro della macchina: perdite, tubi flessibili, cilindri, denti della benna, cingoli o pneumatici, luci.',
            'Ingrassaggio dei perni di benna, braccio e avambraccio secondo lo schema del manuale (spesso ogni 10 ore, alcuni punti ogni 50 ore).',
            'Lettura del contaore.',
          ],
        },
        {
          h2: 'Cambio olio dell’escavatore ogni quante ore? Gli intervalli tipici',
          paragraphs: [
            'Questi sono ordini di grandezza ricavati da documenti pubblici di costruttori come Caterpillar, Komatsu, Volvo, Liebherr, John Deere o Kubota. Sono valori tipici per escavatori e pale in condizioni normali, non dati ufficiali: ogni modello ha la propria tabella, da seguire secondo il manuale del costruttore.',
            'Le differenze tra modelli sono reali: due escavatori della stessa classe possono chiedere il cambio olio motore uno a 250 ore, l’altro a 500. Riporti quindi la tabella di manutenzione di ogni macchina così com’è nel suo manuale.',
          ],
          bullets: [
            'Ogni giorno (10 ore): livelli, spurgo acqua, filtro aria, giro della macchina, ingrassaggio.',
            'Primo tagliando (50-100 ore, macchina nuova): a seconda del modello, primo cambio olio motore o primi filtri idraulici, serraggio delle viti.',
            '250 ore: cambio olio motore e filtro su molti miniescavatori e macchine meno recenti; controllo di cinghie, batteria e riduttori; ingrassaggio della ralla.',
            '500 ore: il classico tagliando delle 500 ore degli escavatori recenti, con olio motore e filtro, filtri gasolio, filtro cabina e spesso un campione d’olio.',
            '1000 ore: filtro idraulico principale (Komatsu indica 1000 ore con filtri originali), olio dei riduttori di traslazione e rotazione, sfiato del serbatoio. Alcuni costruttori consentono il cambio olio motore a 1000 ore con olio e filtri propri, come Volvo su modelli recenti.',
            '2000 ore: cambio dell’olio idraulico su molti escavatori medi, gioco valvole, oli della trasmissione. Con filtri originali e analisi dell’olio alcuni manuali arrivano a 4000 o 5000 ore.',
            'Ogni anno: controllo di sicurezza, liquido di raffreddamento e antigelo, estintore e tutte le operazioni indicate «al più tardi ogni 12 mesi», anche se le ore non sono state raggiunte.',
          ],
        },
        {
          h2: 'Polvere, freddo, martello demolitore: quando accorciare gli intervalli',
          paragraphs: [
            'Gli intervalli del manuale valgono per condizioni normali. La maggior parte dei costruttori precisa che in condizioni gravose vanno accorciati. Tre casi sono frequenti nei cantieri svizzeri.',
            'Lo strumento più affidabile è l’analisi dell’olio: il laboratorio rileva usura, acqua o polvere e permette di adattare l’intervallo con il concessionario, invece che a sensazione.',
          ],
          bullets: [
            'Polvere: demolizioni, cave, scavi asciutti. Il filtro aria si intasa in fretta; va controllato più spesso e i filtri olio e idraulici si cambiano prima.',
            'Freddo: cantieri in quota e inverno in montagna. Oli e gasolio adatti, antigelo verificato, batteria testata, preriscaldamento rispettato. Avviamenti a freddo e lunghi minimi affaticano l’olio motore.',
            'Martello demolitore: scalda e sporca l’olio idraulico. Molti manuali di escavatori prevedono una tabella apposita, con cambi di olio e filtri idraulici molto più frequenti. Il martello stesso si ingrassa spesso circa ogni due ore, secondo il suo fabbricante.',
          ],
        },
        {
          h2: 'Garanzia del costruttore: perché le prove di manutenzione contano',
          paragraphs: [
            'Durante la garanzia il costruttore o il concessionario può chiedere la prova che la macchina è stata mantenuta secondo il manuale: date, ore al contaore, oli e filtri usati. Se si rompe un motore o una pompa e l’ultimo tagliando non è registrato da nessuna parte, la discussione diventa difficile, anche se il lavoro era stato fatto.',
            'Una buona prova contiene data, lettura del contaore, dettaglio dell’intervento, codici dei ricambi e, idealmente, una foto del contaore e le fatture. In Svizzera l’art. 32b OPI chiede inoltre che le attrezzature di lavoro siano mantenute secondo le indicazioni del fabbricante e che i risultati siano registrati: i dettagli sono nella guida sull’[obbligo di manutenzione](/guides/obbligo-manutenzione-art-32b-opi). La responsabilità resta del datore di lavoro; per le domande specifiche gli interlocutori giusti sono la Suva e il fabbricante.',
            'Le stesse prove servono alla rivendita: un libretto completo con ore e fatture rassicura l’acquirente e sostiene il prezzo nella trattativa.',
          ],
        },
        {
          h2: 'Come non dimenticare nulla in tutto il parco macchine',
          paragraphs: [
            'Con tre macchine basta forse una tabella in ufficio. Con dieci escavatori, pale, dumper, rulli e piattaforme su più cantieri, le scadenze si perdono. Per questo esiste [Godet](/demo): un libretto di manutenzione digitale per macchine edili, ideato in Vallese da un ex meccanico di macchine da cantiere.',
            'Può provare il garage 3D senza account nella [demo](/demo), oppure leggere la guida sul [libretto di manutenzione delle macchine da cantiere](/guides/libretto-manutenzione-macchine-cantiere). La prova è gratuita per 15 giorni, senza carta di credito.',
          ],
          bullets: [
            'Scadenze in ore o per data: alla creazione di una macchina sono proposti un tagliando ogni 500 ore e un controllo annuale di sicurezza, che Lei adatta al manuale (250, 1000, 2000 ore…).',
            'Contaore da foto: l’operatore fotografa il contaore, l’IA legge il valore, la persona lo conferma.',
            'Ritmo in ore alla settimana: Godet lo calcola dalle letture e stima la data della prossima scadenza.',
            'Garage 3D a colori: verde in regola, arancione scadenza vicina, rosso scadenza superata. Promemoria via e-mail giornalieri o settimanali.',
            'Ogni intervento registrato con data, ore, ricambi, costi e foto, stampabile in PDF per garanzia, controlli o vendita.',
          ],
        },
      ],
      faq: [
        {
          q: 'Ogni quante ore si cambia l’olio di un escavatore?',
          a: 'Per l’olio motore la maggior parte degli escavatori recenti chiede un cambio verso le 500 ore, molti miniescavatori e macchine meno recenti verso le 250 ore, alcuni modelli nuovi fino a 1000 ore con olio e filtri del costruttore. Il valore esatto è nel manuale della macchina, di solito con un limite di 12 mesi.',
        },
        {
          q: 'Cosa comprende il tagliando delle 500 ore?',
          a: 'Di solito olio motore e filtro, filtri gasolio, controllo o sostituzione del filtro aria, filtro cabina, livelli dei riduttori, ingrassaggio completo e spesso un campione d’olio. Su alcune macchine si aggiungono filtri idraulici. Fa fede l’elenco del manuale del costruttore.',
        },
        {
          q: 'Quando si cambia l’olio idraulico?',
          a: 'I valori tipici vanno da 2000 a 5000 ore secondo il costruttore, il tipo di olio e i filtri. Con un martello demolitore o molta polvere l’intervallo è spesso molto più corto. Un’analisi dell’olio aiuta a decidere.',
        },
        {
          q: 'Un miniescavatore si mantiene come un escavatore grande?',
          a: 'Il principio è lo stesso: controlli quotidiani, ingrassaggio, tagliandi in ore. Gli intervalli sono a volte più corti, con il cambio olio motore verso le 250 ore su molti miniescavatori, e sulle macchine nuove un primo tagliando dopo circa 50 ore è frequente.',
        },
        {
          q: 'Godet conosce gli intervalli della mia macchina?',
          a: 'No, l’applicazione non contiene i manuali dei costruttori. Propone di base un tagliando ogni 500 ore e un controllo annuale di sicurezza, che Lei modifica e completa secondo il manuale di ogni macchina. Poi segue le ore, calcola il ritmo e La avvisa prima della scadenza.',
        },
      ],
    },
    en: {
      slug: 'construction-equipment-service-intervals',
      metaTitle: 'Excavator service intervals: construction equipment schedule',
      description:
        'Excavator service intervals explained: daily checks, 250 and 500-hour services, oil and filter changes, greasing. Typical figures and how to track them.',
      h1: 'Excavator and construction equipment service intervals',
      lead: 'Excavators, mini diggers and wheel loaders are serviced by engine hours: daily checks and greasing, a minor service around 250 hours, a full service around 500 hours, and hydraulic filters and oil somewhere between 1,000 and 5,000 hours depending on the model. The exact figures are in the manufacturer’s manual, and they get shorter in severe conditions. This guide gives typical reference points and a simple way to never miss a due date.',
      sections: [
        {
          h2: 'Why is plant serviced by hours, not miles?',
          paragraphs: [
            'An excavator can work a full shift in the same trench without travelling a single mile. The engine, hydraulic pump and pins still wear with every minute of work. That is why manufacturers set service intervals in operating hours, read from the hour meter in the cab.',
            'An hour on site is also not the same as an hour on the road: heavy load, dust, long idling between lorries. Mileage tells you nothing about that; the hour meter does.',
            'For machines that run little or stand in the yard for long periods, many manuals add a time limit: ‘every 500 hours or every 12 months, whichever comes first’. A hire mini digger that only does 300 hours a year still needs its annual oil change.',
          ],
        },
        {
          h2: 'Daily checks: what the operator does before starting',
          paragraphs: [
            'The first service interval is the start of the shift. Manuals list it as ‘every 10 hours or daily’. Ten minutes is enough to prevent many avoidable failures: a chafing hose, a falling level, a dry pin.',
            'Greasing is the check most often skipped when the programme is tight. A bucket pin running dry wears out both bush and pin within weeks, and the repair costs far more than a cartridge of grease. The same applies to dumpers, rollers and access platforms.',
          ],
          bullets: [
            'Levels: engine oil, coolant, hydraulic oil, fuel.',
            'Drain the fuel water separator, especially after a cold night.',
            'Check the air filter restriction indicator.',
            'Walk-round: leaks, hoses, rams, bucket teeth, tracks or tyres, lights.',
            'Grease the boom, dipper and bucket pins according to the lubrication chart (often every 10 hours, some points every 50 hours).',
            'Record the hour meter reading.',
          ],
        },
        {
          h2: 'Construction equipment service schedule: typical intervals',
          paragraphs: [
            'The figures below are orders of magnitude taken from publicly available material from manufacturers such as Caterpillar, Komatsu, Volvo, Liebherr, John Deere and Kubota. They are typical reference points for excavators and loaders in normal conditions, not official values. Every model has its own chart, and the manufacturer’s manual always takes precedence.',
            'Differences between models are real. Two excavators in the same weight class can call for an engine oil change at 250 hours and 500 hours respectively. Copy each machine’s service chart from its own manual rather than applying one rule to the whole fleet.',
          ],
          bullets: [
            'Daily (10 hours): levels, water separator, air filter, walk-round, greasing.',
            'First service (50 to 100 hours, new machine): depending on the model, first engine oil change or first hydraulic filters, re-torque fasteners.',
            '250 hours: engine oil and filter on many mini diggers and older machines; check belts, battery and final drives; grease the slew ring.',
            '500 hours: the standard 500-hour service on current excavators, with engine oil and filter, fuel filters, cab filter and often an oil sample.',
            '1,000 hours: main hydraulic filter (Komatsu states 1,000 hours with genuine filters), travel and swing gearbox oil, tank breather. Some manufacturers allow engine oil changes at 1,000 hours with their own oil and filters, Volvo on recent models for example.',
            '2,000 hours: hydraulic oil change on many mid-size excavators, valve clearances, transmission oils. With genuine filters and oil analysis, some manuals extend this to 4,000 or 5,000 hours.',
            'Annual: safety inspection, coolant and antifreeze, fire extinguisher, and every task marked ‘at least every 12 months’, even if the hours have not been reached.',
          ],
        },
        {
          h2: 'Dust, cold and hydraulic breakers: when to shorten intervals',
          paragraphs: [
            'Manual intervals assume normal conditions. Most manufacturers state that they should be shortened in severe conditions. Three situations come up often on Swiss sites.',
            'Oil analysis is the most reliable way to know where you stand. The laboratory picks up wear metals, water or dust, so you can adjust the interval with your dealer instead of guessing.',
          ],
          bullets: [
            'Dust: demolition, quarries, dry earthworks. The air filter clogs quickly; check it more often and change oil and hydraulic filters earlier.',
            'Cold: high-altitude sites and mountain winters. Suitable oils and winter diesel, antifreeze checked, battery tested, glow plugs given time. Cold starts and long idling are hard on engine oil.',
            'Hydraulic breaker: it heats and contaminates the hydraulic oil. Many excavator manuals include a separate chart with much more frequent hydraulic oil and filter changes. The breaker itself is often greased roughly every two hours, depending on its manufacturer.',
          ],
        },
        {
          h2: 'Manufacturer warranty: why service records matter',
          paragraphs: [
            'During the warranty period, the manufacturer or dealer may ask for proof that the machine was serviced according to the manual: dates, hour meter readings, oils and filters used. If an engine or pump fails and the last service is not recorded anywhere, the discussion becomes difficult, even if the work was done.',
            'A good record holds the date, the hour meter reading, the work carried out, part numbers and, ideally, a photo of the hour meter and the invoices. In Switzerland, Article 32b of the OPA (accident prevention ordinance) also requires work equipment to be maintained according to the manufacturer’s instructions and the results to be recorded; see our guide to the [maintenance obligation](/guides/maintenance-obligation-switzerland-article-32b). Responsibility stays with the employer; for specific questions, Suva and the manufacturer are the right contacts.',
            'The same records pay off at resale: a complete log with hours and invoices reassures the buyer and supports your asking price.',
          ],
        },
        {
          h2: 'How to keep track across the whole plant fleet',
          paragraphs: [
            'With three machines, a sheet on the office wall may be enough. With ten excavators, loaders, dumpers, rollers and access platforms spread over several sites, due dates get lost. That is what [Godet](/demo) is for: a digital maintenance log for construction equipment, designed in Valais by a former plant mechanic.',
            'You can explore the 3D garage without an account in the [demo](/demo), or read the guide to keeping a [construction equipment maintenance log](/guides/construction-equipment-maintenance-log). The trial is free for 15 days, with no credit card.',
          ],
          bullets: [
            'Due dates by hours or by date: a service every 500 hours and an annual safety inspection are suggested when you add a machine, and you adjust them to the manual (250, 1,000, 2,000 hours…).',
            'Hour meter from a photo: the operator photographs the hour meter, the AI reads the value, the person confirms it.',
            'Hours per week: Godet works out each machine’s rate from the readings and estimates the date the next service will fall due.',
            '3D garage in colour: green up to date, orange due soon, red overdue. Email reminders daily or weekly.',
            'Every service recorded with date, hours, parts, costs and photos, printable as a PDF for warranty, inspection or resale.',
          ],
        },
      ],
      faq: [
        {
          q: 'How often should excavator engine oil be changed?',
          a: 'Most current excavators call for an engine oil change around 500 hours, many mini diggers and older machines around 250 hours, and some recent models up to 1,000 hours with the manufacturer’s own oil and filters. The exact figure is in your machine’s manual, usually with a 12-month limit as well.',
        },
        {
          q: 'What does a 500-hour service include?',
          a: 'Usually engine oil and filter, fuel filters, air filter check or replacement, cab filter, gearbox levels, a full grease and often an oil sample. Some machines add hydraulic filters. Follow the list in the manufacturer’s manual.',
        },
        {
          q: 'When should the hydraulic oil be changed?',
          a: 'Typical reference points range from 2,000 to 5,000 hours depending on the manufacturer, the oil and the filters. With a hydraulic breaker or in very dusty work, the interval is often much shorter. Oil analysis helps you decide.',
        },
        {
          q: 'Is a mini digger serviced like a large excavator?',
          a: 'The principle is the same: daily checks, greasing, services by hours. Intervals are sometimes shorter, with engine oil around 250 hours on many mini diggers, and a first service after about 50 hours is common on new machines.',
        },
        {
          q: 'Does Godet know my machine’s service intervals?',
          a: 'No, the application does not contain manufacturers’ manuals. It suggests a service every 500 hours and an annual safety inspection by default, which you change and add to according to each machine’s manual. It then follows the hours, works out the rate and reminds you before the due date.',
        },
      ],
    },
  },
};
