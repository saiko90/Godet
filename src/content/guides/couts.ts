import type { Guide } from './types';

export const couts: Guide = {
  id: 'couts',
  published: '2026-10-23',
  updated: '2026-10-23',
  content: {
    fr: {
      slug: 'cout-horaire-machine-chantier',
      metaTitle: 'Coût horaire machine de chantier\u00a0: calcul et exemple chiffré',
      description:
        'Coût horaire machine de chantier\u00a0: la méthode (possession, entretien, réparations, immobilisation), un exemple chiffré et quand remplacer un engin.',
      h1: 'Coût horaire d’une machine de chantier\u00a0: le calcul complet',
      lead: 'Le coût horaire d’une machine de chantier se calcule en additionnant ses coûts de possession (amortissement, intérêts, assurance) et ses coûts d’exploitation (carburant, entretien, réparations, pièces d’usure), puis en divisant par les heures réellement travaillées. Ajoutez le prix des immobilisations, et vous savez quelles machines rapportent et lesquelles coûtent. Voici la méthode, un exemple sur une mini-pelle et quand remplacer un engin.',
      sections: [
        {
          h2: 'Comment calculer le coût horaire d’une machine de chantier\u00a0?',
          paragraphs: [
            'La formule tient en une ligne\u00a0: coût horaire = (coûts de possession annuels + coûts d’exploitation annuels) ÷ heures travaillées dans l’année. Tout le travail consiste à obtenir des chiffres justes pour chaque terme.',
            'Les coûts de possession tombent même si la machine reste au dépôt. Les coûts d’exploitation n’apparaissent que lorsqu’elle tourne. Les séparer montre tout de suite l’effet de l’utilisation\u00a0: une pelle qui travaille peu coûte cher à l’heure, même si elle ne tombe jamais en panne.',
            'Le salaire du machiniste se traite en général à part, avec vos frais généraux, pour un prix de régie avec chauffeur.',
            'En Suisse, la Société Suisse des Entrepreneurs (SSE) publie chaque année des données d’inventaire pour les machines de chantier, avec des taux de calcul internes. Elles reposent sur la même logique\u00a0: des frais fixes (amortissement, intérêts, assurance, stationnement) et des frais variables (réparations et révisions, énergie, lubrifiants). Bonne base de comparaison, elles ne remplacent pas les chiffres de votre parc.',
          ],
        },
        {
          h2: 'Coûts de possession\u00a0: amortissement, intérêts, assurance',
          paragraphs: ['Ce sont les coûts fixes d’un engin. On les calcule sur une année, puis on les répartit sur les heures de travail.'],
          bullets: [
            'Amortissement\u00a0: (prix d’achat − valeur de revente estimée) ÷ durée d’utilisation en années. Basez-la sur des annonces réelles, pas sur un espoir.',
            'Intérêts\u00a0: même si vous avez payé comptant, cet argent est bloqué dans la machine. Méthode courante\u00a0: capital moyen, soit (prix d’achat + valeur de revente) ÷ 2, multiplié par un taux d’intérêt annuel.',
            'Assurance, taxes et plaques\u00a0: primes annuelles, impôt sur les véhicules pour les machines immatriculées, expertises périodiques.',
            'Stationnement\u00a0: place au dépôt, hangar, part de l’atelier.',
          ],
        },
        {
          h2: 'Coûts d’exploitation\u00a0: carburant, entretien des engins, réparations, usure',
          paragraphs: [
            'Ces coûts suivent les heures. Ce sont les moins bien connus, car ils arrivent par petites factures toute l’année.',
            'La main-d’œuvre de votre propre atelier est un vrai coût. Un mécanicien qui passe une journée sur un dumper, c’est une journée payée. Notez les heures d’atelier avec un taux horaire interne, sinon vos machines paraissent moins chères qu’elles ne le sont.',
          ],
          bullets: [
            'Carburant\u00a0: consommation horaire × prix du litre. La télématique ou les bons de carburant donnent la valeur réelle.',
            'Entretien\u00a0: services périodiques, huiles, filtres, graissage, contrôles. Pièces et main-d’œuvre de l’atelier, interne ou externe.',
            'Réparations\u00a0: pannes, casse, remise en état. Elles augmentent avec l’âge et les heures de la machine.',
            'Pièces d’usure\u00a0: pneus, chenilles, dents de godet, lames, flexibles. Divisez le prix d’un jeu par sa durée de vie en heures.',
          ],
        },
        {
          h2: 'L’immobilisation, le coût qu’on oublie',
          paragraphs: [
            'Une machine en panne coûte plus que sa réparation\u00a0: le chantier attend, vous louez un remplaçant ou perdez une journée facturable. Pour un loueur, chaque jour d’arrêt est un jour de location perdu.',
            'Pour en tenir compte, notez pour chaque panne le nombre de jours ou d’heures d’arrêt et ce que l’arrêt a coûté\u00a0: location de remplacement, transport, heures perdues. Additionné sur l’année, ce montant change souvent le classement de vos machines. Une vieille nacelle bon marché peut devenir la plus chère du parc.',
          ],
        },
        {
          h2: 'Exemple\u00a0: le coût horaire d’une mini-pelle, pas à pas',
          paragraphs: [
            'Chiffres fictifs et arrondis, pour montrer le calcul, pas pour servir de référence.',
            'Mini-pelle de 3,5 tonnes achetée 60’000 CHF, gardée 6 ans, revendue environ 18’000 CHF, 800 heures de travail par an.',
          ],
          bullets: [
            'Amortissement\u00a0: (60’000 − 18’000) ÷ 6 = 7’000 CHF par an.',
            'Intérêts\u00a0: (60’000 + 18’000) ÷ 2 = 39’000 CHF de capital moyen, × 4\u00a0% = 1’560 CHF par an.',
            'Assurance et taxes\u00a0: 1’200 CHF par an.',
            'Possession\u00a0: 7’000 + 1’560 + 1’200 = 9’760 CHF par an, soit 9’760 ÷ 800 = 12.20 CHF/h.',
            'Carburant\u00a0: 4 litres/h × 2.00 CHF = 8.00 CHF/h.',
            'Entretien (pièces et main-d’œuvre)\u00a0: 2’400 CHF par an ÷ 800 h = 3.00 CHF/h.',
            'Réparations\u00a0: 3’200 CHF par an ÷ 800 h = 4.00 CHF/h.',
            'Chenilles\u00a0: un jeu à 2’400 CHF qui dure 2’000 h = 1.20 CHF/h.',
            'Exploitation\u00a0: 8.00 + 3.00 + 4.00 + 1.20 = 16.20 CHF/h.',
            'Total machine, sans machiniste\u00a0: 12.20 + 16.20 = 28.40 CHF/h.',
          ],
        },
        {
          h2: 'Pourquoi la plupart des entreprises ne connaissent pas ce coût',
          paragraphs: [
            'Ajoutons d’abord l’immobilisation à l’exemple\u00a0: 6 jours de panne dans l’année, compensés par une location à 400 CHF par jour, soit 2’400 CHF. Réparti sur 800 heures, cela ajoute 3.00 CHF/h. Le coût réel passe à 31.40 CHF/h. Et si la même mini-pelle ne travaille que 500 heures par an, ses coûts de possession passent de 12.20 à 19.52 CHF/h (9’760 ÷ 500). Une machine sous-utilisée coûte souvent plus qu’une machine qui tombe en panne.',
            'Ces chiffres, peu d’entreprises les ont. Le problème n’est pas la formule, ce sont les données. Les factures de pièces arrivent au bureau, les heures d’atelier sont sur des fiches papier, le compteur d’heures n’est relevé qu’au service. La comptabilité connaît le total des réparations de l’entreprise, rarement le total par machine. Et presque jamais les jours d’arrêt. Résultat\u00a0: on garde des engins qui coûtent plus qu’ils ne rapportent, et on facture certaines machines en dessous de leur coût réel.',
            'Godet règle ce point à la source. Chaque saisie du carnet d’entretien (service, réparation, pièce) porte la date, le compteur d’heures, les coûts pièces et main-d’œuvre et l’immobilisation. Le compteur se relève à la main ou en photographiant le compteur\u00a0: l’IA lit la valeur et la personne vérifie. Les coûts des 12 derniers mois s’affichent mois par mois pour chaque machine, et l’export Excel vous donne les chiffres pour calculer le coût horaire avec vos coûts de possession.',
            'Godet n’est pas une comptabilité\u00a0: il garde les coûts d’entretien et de réparation là où ils servent, sur la fiche de la machine. Vous pouvez le voir sur la [démo 3D sans compte](/demo), et lire comment organiser le [carnet d’entretien de vos machines](/guides/carnet-entretien-machines-chantier).',
          ],
        },
        {
          h2: 'Quand remplacer une machine de chantier\u00a0?',
          paragraphs: [
            'Une machine neuve coûte cher à posséder et peu à réparer. Une machine ancienne, c’est l’inverse. Le bon moment pour remplacer se situe en général là où le coût total moyen par heure, calculé depuis l’achat, cesse de baisser et commence à remonter. Pour le voir, il faut suivre les coûts de chaque machine sur plusieurs années.',
            'À la revente, un carnet complet imprimable en PDF rassure l’acheteur. Respecter les [intervalles d’entretien](/guides/intervalles-entretien-engins-chantier) du constructeur aide aussi à garder une bonne valeur de revente.',
          ],
          bullets: [
            'Les réparations par heure augmentent d’une année à l’autre, alors que les heures de travail restent stables.',
            'Les jours d’immobilisation se multiplient et désorganisent les chantiers.',
            'Une grosse réparation (moteur, transmission, hydraulique) approche la valeur de revente de la machine.',
            'Les pièces deviennent difficiles à trouver ou les délais s’allongent.',
          ],
        },
      ],
      faq: [
        {
          q: 'Quel est le coût horaire d’une mini-pelle\u00a0?',
          a: 'Il dépend du prix d’achat, des heures travaillées par an, du carburant et de l’état de la machine. Dans notre exemple fictif, on arrive à environ 28 CHF/h sans machiniste et 31 CHF/h avec l’immobilisation. Vos chiffres peuvent être très différents\u00a0: seul votre historique donne la vraie valeur.',
        },
        {
          q: 'Faut-il inclure le salaire du machiniste dans le coût horaire\u00a0?',
          a: 'Pour comparer des machines entre elles, non\u00a0: gardez le coût de la machine seule. Pour établir un prix de régie avec chauffeur, ajoutez le salaire chargé du machiniste et vos frais généraux.',
        },
        {
          q: 'Combien de temps garder une machine de chantier\u00a0?',
          a: 'Il n’y a pas de durée unique. Cela dépend du type d’engin, des heures par an et des conditions de travail. Suivez le coût total moyen par heure\u00a0: quand il remonte nettement, il est temps d’étudier le remplacement.',
        },
        {
          q: 'Combien coûte le suivi des coûts avec Godet\u00a0?',
          a: 'L’essai est gratuit pendant 15 jours, sans carte de crédit. Ensuite, la formule Essentiel coûte 29 CHF par mois jusqu’à 5 machines, Pro 59 CHF jusqu’à 20 machines et Parc 99 CHF jusqu’à 50 machines, sans engagement. Les détails sont dans l’[aide](/aide).',
        },
      ],
    },
    de: {
      slug: 'baumaschinen-kosten-pro-stunde',
      metaTitle: 'Baumaschinen Kosten pro Stunde: Berechnung mit Beispiel',
      description:
        'Baumaschinen Kosten pro Stunde berechnen: fixe und variable Kosten, Ausfallzeiten, ein Rechenbeispiel und wann sich der Ersatz lohnt. Jetzt lesen.',
      h1: 'Baumaschinen: Kosten pro Stunde richtig berechnen',
      lead: 'Die Kosten pro Stunde einer Baumaschine ergeben sich aus den fixen Kosten (Abschreibung, Verzinsung, Versicherung) plus den variablen Kosten (Treibstoff, Wartung, Reparaturen, Verschleissteile), geteilt durch die tatsächlichen Betriebsstunden. Rechnen Sie die Ausfallzeiten dazu, sehen Sie, welche Maschinen Geld verdienen und welche nur kosten. Hier finden Sie die Methode, ein durchgerechnetes Beispiel für einen Minibagger und die Zeichen für den richtigen Ersatzzeitpunkt.',
      sections: [
        {
          h2: 'Wie berechnet man den Maschinenkostensatz einer Baumaschine?',
          paragraphs: [
            'Die Grundformel ist einfach: Kosten pro Stunde = (fixe Jahreskosten + variable Jahreskosten) ÷ Betriebsstunden pro Jahr. Die eigentliche Arbeit liegt darin, für jeden Posten verlässliche Zahlen zu haben.',
            'Fixe Kosten fallen an, auch wenn die Maschine im Werkhof steht. Variable Kosten entstehen nur, wenn sie läuft. Wer beides trennt, sieht sofort den Einfluss der Auslastung: Ein Bagger mit wenig Stunden ist pro Stunde teuer, auch wenn er nie ausfällt.',
            'Der Lohn des Maschinisten wird meist separat gerechnet. Er hängt an der Person, nicht an der Maschine. Für einen Regieansatz mit Maschinist schlagen Sie ihn am Schluss zusammen mit den Gemeinkosten auf.',
            'In der Schweiz veröffentlicht der Schweizerische Baumeisterverband (SBV) jährlich Inventardaten für Baumaschinen, darunter betriebsinterne Verrechnungsansätze. Sie folgen derselben Logik: fixe Kosten (Amortisation, Verzinsung, Versicherung, Stationierung) und variable Kosten (Reparatur und Revision, Energie, Schmiermittel). Das ist ein guter Vergleichswert. Die Zahlen Ihres eigenen Maschinenparks ersetzt er aber nicht.',
          ],
        },
        {
          h2: 'Fixe Kosten: Abschreibung, Verzinsung, Versicherung',
          paragraphs: ['Die fixen Kosten einer Maschine rechnet man pro Jahr und verteilt sie dann auf die Betriebsstunden.'],
          bullets: [
            'Abschreibung: (Kaufpreis − geschätzter Wiederverkaufswert) ÷ Nutzungsdauer in Jahren. Den Restwert stützen Sie auf echte Inserate oder die Einschätzung Ihres Händlers, nicht auf Hoffnung.',
            'Verzinsung: Auch bei Barkauf ist das Geld in der Maschine gebunden. Üblich ist, das durchschnittlich gebundene Kapital zu verzinsen: (Kaufpreis + Restwert) ÷ 2 × Zinssatz.',
            'Versicherung, Verkehrssteuer, Kontrollschilder: jährliche Prämien und Gebühren, bei immatrikulierten Maschinen auch die periodische Prüfung.',
            'Stationierung: Platz im Werkhof, Halle, Anteil an der Werkstatt. Wird oft vergessen, zählt aber bei grösseren Maschinenparks.',
          ],
        },
        {
          h2: 'Betriebsstundenkosten: Treibstoff, Wartung, Reparaturen, Verschleiss',
          paragraphs: [
            'Diese Kosten steigen mit den Stunden. Gleichzeitig kennt man sie am schlechtesten, weil sie in vielen kleinen Rechnungen übers Jahr verteilt kommen.',
            'Die Stunden Ihrer eigenen Werkstatt sind echte Kosten. Wenn ein Mechaniker einen Tag an einem Dumper arbeitet, ist das ein bezahlter Tag. Der Werkstattchef sollte die Stunden mit einem internen Stundensatz erfassen, sonst wirken Ihre Maschinen günstiger, als sie sind.',
          ],
          bullets: [
            'Treibstoff: Verbrauch pro Stunde × Literpreis. Der Verbrauch schwankt stark mit Last, Leerlauf und Untergrund; Telematik oder Tankbelege zeigen den echten Wert.',
            'Wartung und Service: Öle, Filter, Abschmieren, Kontrollen. Teile und Arbeitszeit der Werkstatt, intern oder extern.',
            'Reparaturen: Pannen, Schäden, Instandstellung. Sie nehmen mit Alter und Betriebsstunden zu.',
            'Verschleissteile: Pneus, Raupen, Zähne, Schneiden, Schläuche. Preis eines Satzes geteilt durch seine Lebensdauer in Stunden.',
          ],
        },
        {
          h2: 'Ausfallzeiten: die vergessenen Kosten',
          paragraphs: [
            'Eine defekte Maschine kostet mehr als die Reparatur. Die Baustelle wartet, die Equipe ist schlecht ausgelastet, Sie mieten Ersatz oder verlieren einen verrechenbaren Tag. Für einen Vermieter ist jeder Ausfalltag ein verlorener Miettag.',
            'Notieren Sie deshalb bei jeder Panne, wie lange die Maschine stand und was das gekostet hat: Ersatzmiete, Transport, verlorene Stunden. Übers Jahr summiert verändert dieser Betrag oft die Rangliste Ihrer Maschinen. Eine alte Hebebühne, die günstig wirkt, kann so zur teuersten Maschine im Park werden.',
          ],
        },
        {
          h2: 'Beispiel: Betriebsstundenkosten eines Minibaggers Schritt für Schritt',
          paragraphs: [
            'Die folgenden Zahlen sind erfunden und gerundet. Sie zeigen den Rechenweg, keinen Richtwert. Verwenden Sie Ihre eigenen Rechnungen und die Angaben des Herstellers.',
            'Minibagger 3,5 t, Kaufpreis 60’000 CHF, Nutzung 6 Jahre, Wiederverkauf rund 18’000 CHF, 800 Betriebsstunden pro Jahr.',
          ],
          bullets: [
            'Abschreibung: (60’000 − 18’000) ÷ 6 = 7’000 CHF pro Jahr.',
            'Verzinsung: (60’000 + 18’000) ÷ 2 = 39’000 CHF durchschnittliches Kapital, × 4 % = 1’560 CHF pro Jahr.',
            'Versicherung und Abgaben: 1’200 CHF pro Jahr.',
            'Fixe Kosten: 7’000 + 1’560 + 1’200 = 9’760 CHF pro Jahr, also 9’760 ÷ 800 = 12.20 CHF/h.',
            'Treibstoff: 4 Liter/h × 2.00 CHF = 8.00 CHF/h.',
            'Wartung (Teile und Arbeit): 2’400 CHF pro Jahr ÷ 800 h = 3.00 CHF/h.',
            'Reparaturen: 3’200 CHF pro Jahr ÷ 800 h = 4.00 CHF/h.',
            'Raupen: ein Satz zu 2’400 CHF hält 2’000 h = 1.20 CHF/h.',
            'Variable Kosten: 8.00 + 3.00 + 4.00 + 1.20 = 16.20 CHF/h.',
            'Total Maschine ohne Maschinist: 12.20 + 16.20 = 28.40 CHF/h.',
          ],
        },
        {
          h2: 'Warum die meisten Betriebe ihre Maschinenkosten nicht kennen',
          paragraphs: [
            'Zum Beispiel kommen noch die Ausfallzeiten dazu: 6 Tage Panne im Jahr, überbrückt mit einer Ersatzmiete zu 400 CHF pro Tag, also 2’400 CHF. Auf 800 Stunden verteilt sind das 3.00 CHF/h mehr, die echten Kosten liegen bei 31.40 CHF/h. Arbeitet derselbe Minibagger nur 500 Stunden im Jahr, steigen die fixen Kosten von 12.20 auf 19.52 CHF/h (9’760 ÷ 500). Eine schlecht ausgelastete Maschine ist oft teurer als eine, die ab und zu ausfällt.',
            'Diese Zahlen haben die wenigsten Betriebe. Das Problem ist nicht die Formel, sondern die Daten. Ersatzteilrechnungen landen im Büro, Werkstattstunden stehen auf Rapportzetteln, der Betriebsstundenzähler wird nur beim Service abgelesen, Pannen werden am Telefon erledigt. Die Buchhaltung kennt die Reparaturkosten des ganzen Betriebs, selten aber die Kosten pro Maschine. Und fast nie die Ausfalltage. Die Folge: Man behält Maschinen, die mehr kosten als sie einbringen, und verrechnet andere unter ihren echten Kosten.',
            'Godet löst das dort, wo die Daten entstehen. Jeder Eintrag im Wartungsheft (Service, Reparatur, Ersatzteil) hat Datum, Betriebsstunden, Kosten für Teile und Arbeit sowie die Ausfallzeit. Den Zählerstand tippt der Maschinist ein oder fotografiert den Zähler: Die KI liest den Wert, die Person prüft ihn. Die Kosten der letzten 12 Monate erscheinen Monat für Monat pro Maschine, und der Excel-Export liefert die Zahlen, um zusammen mit Ihren fixen Kosten den Stundensatz zu rechnen.',
            'Godet ist keine Buchhaltung. Es hält die Wartungs- und Reparaturkosten dort fest, wo sie gebraucht werden: bei der Maschine. Probieren Sie die [3D-Demo ohne Konto](/demo) aus, oder lesen Sie, wie Sie ein [Wartungsheft für Baumaschinen](/guides/wartungsheft-baumaschinen) aufbauen.',
          ],
        },
        {
          h2: 'Wann lohnt sich der Ersatz einer Baumaschine?',
          paragraphs: [
            'Eine neue Maschine hat hohe fixe Kosten und tiefe Reparaturkosten. Bei einer alten ist es umgekehrt. Der richtige Zeitpunkt liegt meist dort, wo die durchschnittlichen Gesamtkosten pro Stunde, gerechnet seit dem Kauf, nicht mehr sinken und wieder steigen. Das sieht nur, wer die Kosten pro Maschine über mehrere Jahre verfolgt.',
            'Beim Verkauf schafft eine lückenlose Geschichte Vertrauen. Ein als PDF druckbares Wartungsheft mit allen Arbeiten und Stunden überzeugt mehr als ein halb leerer Ordner. Wer die [Wartungsintervalle](/guides/wartungsintervalle-baumaschinen) des Herstellers einhält, schützt auch den Wiederverkaufswert.',
          ],
          bullets: [
            'Die Reparaturkosten pro Stunde steigen von Jahr zu Jahr, bei gleich vielen Betriebsstunden.',
            'Die Ausfalltage häufen sich und bringen die Baustellenplanung durcheinander.',
            'Eine grosse Reparatur (Motor, Getriebe, Hydraulik) kommt in die Nähe des Wiederverkaufswerts.',
            'Ersatzteile werden schwer erhältlich oder die Lieferfristen werden länger.',
            'Die Maschine passt nicht mehr: Abgasvorschriften auf gewissen Baustellen, Anforderungen Ihrer Kunden.',
          ],
        },
      ],
      faq: [
        {
          q: 'Was kostet ein Minibagger pro Stunde?',
          a: 'Das hängt vom Kaufpreis, den Betriebsstunden pro Jahr, dem Treibstoff und dem Zustand der Maschine ab. Im erfundenen Beispiel oben sind es rund 28 CHF/h ohne Maschinist und 31 CHF/h mit Ausfallzeiten. Ihre Zahlen können ganz anders aussehen. Nur Ihre eigene Historie zeigt den echten Wert.',
        },
        {
          q: 'Gehört der Lohn des Maschinisten in den Maschinenkostensatz?',
          a: 'Für den Vergleich von Maschinen untereinander nicht: Rechnen Sie die Maschine allein. Für einen Regieansatz mit Maschinist kommen der Lohn inklusive Lohnnebenkosten und die Gemeinkosten dazu.',
        },
        {
          q: 'Wie lange sollte man eine Baumaschine behalten?',
          a: 'Eine feste Dauer gibt es nicht. Sie hängt vom Maschinentyp, den Stunden pro Jahr und den Einsatzbedingungen ab. Verfolgen Sie die durchschnittlichen Gesamtkosten pro Stunde: Steigen sie deutlich, ist es Zeit, den Ersatz zu prüfen.',
        },
        {
          q: 'Was kostet die Kostenerfassung mit Godet?',
          a: 'Sie testen 15 Tage gratis, ohne Kreditkarte. Danach kostet das Abo Essentiel 29 CHF pro Monat für bis zu 5 Maschinen, Pro 59 CHF für bis zu 20 und Parc 99 CHF für bis zu 50 Maschinen, ohne Vertragsbindung. Details finden Sie in der [Hilfe](/aide).',
        },
      ],
    },
    it: {
      slug: 'costo-orario-macchine-cantiere',
      metaTitle: 'Costo orario macchine da cantiere: calcolo ed esempio',
      description:
        'Costo orario macchine da cantiere: il metodo (possesso, manutenzione, riparazioni, fermi), un esempio numerico e quando sostituire. Scopra come.',
      h1: 'Costo orario delle macchine da cantiere: il calcolo completo',
      lead: 'Il costo orario di una macchina da cantiere si ottiene sommando i costi di possesso (ammortamento, interessi, assicurazione) e i costi di esercizio (carburante, manutenzione, riparazioni, parti soggette a usura), divisi per le ore effettivamente lavorate. Aggiungendo il costo dei fermi macchina, scopre quali macchine rendono e quali pesano sui conti. Ecco il metodo, un esempio numerico su un miniescavatore e i segnali che indicano quando sostituire una macchina.',
      sections: [
        {
          h2: 'Come si calcola il costo orario di una macchina da cantiere?',
          paragraphs: [
            'La formula sta in una riga: costo orario = (costi di possesso annui + costi di esercizio annui) ÷ ore lavorate nell’anno. Il vero lavoro è avere cifre affidabili per ogni voce.',
            'I costi di possesso ci sono anche quando la macchina resta in deposito. I costi di esercizio nascono solo quando lavora. Separarli mostra subito il peso dell’utilizzo: un escavatore che lavora poco costa caro all’ora, anche se non si guasta mai.',
            'Lo stipendio del macchinista si calcola di solito a parte, perché dipende dalla persona e non dalla macchina. Per una tariffa a regia con conducente lo si aggiunge alla fine, con le spese generali.',
            'In Svizzera la Società Svizzera degli Impresari-Costruttori (SSIC) pubblica ogni anno dati d’inventario per le macchine da cantiere, con tariffe di calcolo interne. Seguono la stessa logica: costi fissi (ammortamento, interessi, assicurazione, stazionamento) e costi variabili (riparazioni e revisioni, energia, lubrificanti). Sono un buon termine di paragone, ma non sostituiscono le cifre del Suo parco macchine.',
          ],
        },
        {
          h2: 'Costi di possesso: ammortamento, interessi, assicurazione',
          paragraphs: ['Sono i costi fissi della macchina. Si calcolano sull’anno e poi si ripartiscono sulle ore di lavoro.'],
          bullets: [
            'Ammortamento: (prezzo d’acquisto − valore di rivendita stimato) ÷ anni di utilizzo. Basi il valore residuo su annunci reali o sul parere del concessionario, non su una speranza.',
            'Interessi: anche pagando in contanti, quel capitale resta bloccato nella macchina. Metodo diffuso: capitale medio, cioè (prezzo d’acquisto + valore residuo) ÷ 2, moltiplicato per un tasso annuo.',
            'Assicurazione, tasse e targhe: premi annui, imposta di circolazione per le macchine immatricolate, collaudi periodici.',
            'Stazionamento: posto in deposito, capannone, quota dell’officina. Spesso dimenticato, pesa nei parchi macchine più grandi.',
          ],
        },
        {
          h2: 'Costi di esercizio: carburante, manutenzione, riparazioni, usura',
          paragraphs: [
            'Questi costi crescono con le ore. Sono anche quelli che si conoscono peggio, perché arrivano in tante piccole fatture durante l’anno.',
            'Anche la manodopera della Sua officina è un costo reale. Se un meccanico passa una giornata su un dumper, è una giornata pagata. Il capo officina dovrebbe registrare le ore con una tariffa interna, altrimenti le macchine sembrano più economiche di quanto siano.',
          ],
          bullets: [
            'Carburante: consumo orario × prezzo al litro. Il consumo varia molto con carico, minimo e terreno; telematica o buoni di rifornimento danno il valore reale.',
            'Manutenzione: tagliandi, oli, filtri, ingrassaggio, controlli. Ricambi e manodopera dell’officina, interna o esterna.',
            'Riparazioni: guasti, rotture, ripristini. Aumentano con l’età e le ore della macchina.',
            'Parti soggette a usura: pneumatici, cingoli, denti della benna, lame, tubi flessibili. Divida il prezzo di un set per la sua durata in ore.',
          ],
        },
        {
          h2: 'Il fermo macchina, il costo dimenticato',
          paragraphs: [
            'Una macchina guasta non costa solo la riparazione. Il cantiere aspetta, la squadra lavora a metà, si noleggia una macchina sostitutiva o si perde una giornata fatturabile. Per un noleggiatore ogni giorno di fermo è un giorno di noleggio perso.',
            'Per questo, a ogni guasto annoti quanti giorni o ore è rimasta ferma la macchina e quanto è costato: noleggio sostitutivo, trasporto, ore perse. Sommato sull’anno, questo importo cambia spesso la classifica delle macchine. Una vecchia piattaforma aerea che sembra economica può diventare la più cara del parco.',
          ],
        },
        {
          h2: 'Esempio: il costo orario di un miniescavatore, passo per passo',
          paragraphs: [
            'Le cifre seguenti sono fittizie e arrotondate. Mostrano il calcolo, non un valore di riferimento. Usi le Sue fatture e i dati del costruttore.',
            'Miniescavatore da 3,5 t acquistato a 60’000 CHF, tenuto 6 anni, rivenduto a circa 18’000 CHF, 800 ore di lavoro all’anno.',
          ],
          bullets: [
            'Ammortamento: (60’000 − 18’000) ÷ 6 = 7’000 CHF all’anno.',
            'Interessi: (60’000 + 18’000) ÷ 2 = 39’000 CHF di capitale medio, × 4 % = 1’560 CHF all’anno.',
            'Assicurazione e tasse: 1’200 CHF all’anno.',
            'Possesso: 7’000 + 1’560 + 1’200 = 9’760 CHF all’anno, cioè 9’760 ÷ 800 = 12.20 CHF/h.',
            'Carburante: 4 litri/h × 2.00 CHF = 8.00 CHF/h.',
            'Manutenzione (ricambi e manodopera): 2’400 CHF all’anno ÷ 800 h = 3.00 CHF/h.',
            'Riparazioni: 3’200 CHF all’anno ÷ 800 h = 4.00 CHF/h.',
            'Cingoli: un set da 2’400 CHF che dura 2’000 h = 1.20 CHF/h.',
            'Esercizio: 8.00 + 3.00 + 4.00 + 1.20 = 16.20 CHF/h.',
            'Totale macchina senza macchinista: 12.20 + 16.20 = 28.40 CHF/h.',
          ],
        },
        {
          h2: 'Perché la maggior parte delle imprese non conosce questo costo',
          paragraphs: [
            'All’esempio va aggiunto il fermo: 6 giorni di guasto nell’anno, coperti con un noleggio a 400 CHF al giorno, cioè 2’400 CHF. Ripartiti su 800 ore fanno 3.00 CHF/h in più, e il costo reale sale a 31.40 CHF/h. Se lo stesso miniescavatore lavora solo 500 ore all’anno, i costi di possesso passano da 12.20 a 19.52 CHF/h (9’760 ÷ 500). Una macchina poco usata costa spesso più di una che ogni tanto si guasta.',
            'Poche imprese hanno queste cifre. Il problema non è la formula, sono i dati. Le fatture dei ricambi arrivano in ufficio, le ore d’officina sono su fogli di carta, il contaore si legge solo al tagliando, i guasti si risolvono al telefono. La contabilità conosce il totale delle riparazioni dell’impresa, raramente il totale per macchina. E quasi mai i giorni di fermo. Risultato: si tengono macchine che costano più di quanto rendono e se ne fatturano altre sotto il loro costo reale.',
            'Godet risolve il problema alla fonte. Ogni registrazione del libretto di manutenzione (tagliando, riparazione, ricambio) riporta data, contaore, costi di ricambi e manodopera e fermo macchina. Il contaore si inserisce a mano o con una foto: l’IA legge il valore e la persona lo verifica. I costi degli ultimi 12 mesi appaiono mese per mese per ogni macchina, e l’esportazione Excel fornisce le cifre per calcolare il costo orario insieme ai Suoi costi di possesso.',
            'Godet non è una contabilità: tiene i costi di manutenzione e riparazione dove servono, sulla scheda della macchina. Può provarlo con la [demo 3D senza account](/demo) e leggere come organizzare il [libretto di manutenzione delle macchine](/guides/libretto-manutenzione-macchine-cantiere).',
          ],
        },
        {
          h2: 'Quando sostituire una macchina da cantiere?',
          paragraphs: [
            'Una macchina nuova costa molto da possedere e poco da riparare. Una vecchia, il contrario. Il momento giusto si trova in genere dove il costo totale medio all’ora, calcolato dall’acquisto, smette di scendere e comincia a risalire. Per vederlo bisogna seguire i costi macchina per macchina per diversi anni.',
            'Alla vendita, uno storico completo dà fiducia all’acquirente. Un libretto stampabile in PDF con tutti gli interventi e le ore convince più di un raccoglitore mezzo vuoto. Rispettare gli [intervalli di manutenzione](/guides/intervalli-manutenzione-macchine-cantiere) del costruttore aiuta anche a mantenere il valore di rivendita.',
          ],
          bullets: [
            'Le riparazioni all’ora aumentano di anno in anno, a parità di ore lavorate.',
            'I giorni di fermo si moltiplicano e scombussolano i cantieri.',
            'Una grossa riparazione (motore, trasmissione, idraulica) si avvicina al valore di rivendita.',
            'I ricambi diventano difficili da trovare o i tempi di consegna si allungano.',
            'La macchina non è più adatta: norme sulle emissioni in certi cantieri, esigenze dei clienti.',
          ],
        },
      ],
      faq: [
        {
          q: 'Quanto costa all’ora un miniescavatore?',
          a: 'Dipende dal prezzo d’acquisto, dalle ore annue, dal carburante e dallo stato della macchina. Nell’esempio fittizio sopra si arriva a circa 28 CHF/h senza macchinista e 31 CHF/h con il fermo. Le Sue cifre possono essere molto diverse: solo il Suo storico dà il valore vero.',
        },
        {
          q: 'Lo stipendio del macchinista va nel costo orario?',
          a: 'Per confrontare le macchine tra loro no: consideri la macchina da sola. Per una tariffa a regia con conducente aggiunga lo stipendio con gli oneri sociali e le spese generali.',
        },
        {
          q: 'Per quanto tempo tenere una macchina da cantiere?',
          a: 'Non esiste una durata unica. Dipende dal tipo di macchina, dalle ore annue e dalle condizioni di lavoro. Segua il costo totale medio all’ora: quando risale in modo netto, è il momento di valutare la sostituzione.',
        },
        {
          q: 'Quanto costa seguire i costi con Godet?',
          a: 'La prova è gratuita per 15 giorni, senza carta di credito. Poi il piano Essentiel costa 29 CHF al mese fino a 5 macchine, Pro 59 CHF fino a 20 e Parc 99 CHF fino a 50, senza vincoli. Trova i dettagli nell’[aiuto](/aide).',
        },
      ],
    },
    en: {
      slug: 'construction-equipment-cost-per-hour',
      metaTitle: 'Construction equipment cost per hour: method and example',
      description:
        'Construction equipment cost per hour: owning and operating costs, downtime, a worked example and when to replace a machine. Read the full guide.',
      h1: 'Construction equipment cost per hour: how to work it out',
      lead: 'The cost per hour of a construction machine is its owning costs (depreciation, interest, insurance) plus its operating costs (fuel, maintenance, repairs, wear parts), divided by the hours it actually works. Add the cost of downtime and you can see which machines earn their keep and which ones drain money. Below: the method, a worked example for a mini excavator and the signs that it is time to replace a machine.',
      sections: [
        {
          h2: 'How do you calculate construction equipment cost per hour?',
          paragraphs: [
            'The formula fits on one line: cost per hour = (annual owning costs + annual operating costs) ÷ hours worked in the year. The hard part is reliable figures.',
            'Owning costs arrive whether the machine works or sits in the yard. Operating costs only appear when it runs. Keeping them apart shows the effect of utilisation straight away: an excavator that works few hours is expensive per hour, even if it never breaks down.',
            'The operator’s wage is usually handled separately, because it belongs to the person, not the machine. If you need a hire rate with operator, add the wage and your overheads at the end.',
            'In Switzerland, the Swiss Contractors’ Association (Schweizerischer Baumeisterverband, SBV) publishes inventory data for construction plant every year, including internal charge-out rates. They follow the same logic: fixed costs (depreciation, interest, insurance, yard costs) and variable costs (repairs and overhauls, energy, lubricants). They are a useful benchmark, but they do not replace the figures from your own fleet.',
          ],
        },
        {
          h2: 'Owning costs: depreciation, interest, insurance',
          paragraphs: ['These are the fixed costs of a machine. Work them out per year, then spread them over the working hours.'],
          bullets: [
            'Depreciation: (purchase price − estimated resale value) ÷ years of use. Base the resale value on real adverts or your dealer’s view, not on hope.',
            'Interest: even if you paid cash, that money is tied up in the machine. A common method uses the average capital: (purchase price + resale value) ÷ 2, multiplied by an annual interest rate.',
            'Insurance, road tax and registration: annual premiums and fees, plus periodic inspections for registered machines.',
            'Yard and storage: space in the yard, sheds, a share of the workshop.',
          ],
        },
        {
          h2: 'Operating costs: fuel, maintenance, repairs, tyres and tracks',
          paragraphs: [
            'These costs rise with the hours. They are the least known, because they arrive as small invoices all year.',
            'Labour in your own workshop is a real cost. A fitter who spends a day on a dumper is a paid day. Record workshop hours at an internal rate, or your plant will look cheaper than it is.',
          ],
          bullets: [
            'Fuel: litres per hour × price per litre. Telematics or fuel records give the real figure.',
            'Maintenance: scheduled services, oils, filters, greasing, inspections. Parts and labour from the workshop, in-house or external.',
            'Repairs: breakdowns, damage, rebuilds. They increase with the machine’s age and hours.',
            'Wear parts: tyres, tracks, bucket teeth, cutting edges, hoses. Divide the price of a set by its life in hours.',
          ],
        },
        {
          h2: 'Downtime: the cost people forget',
          paragraphs: [
            'A broken machine costs more than its repair. The site waits, the crew is underused, you hire in a replacement or lose a chargeable day. For a hire company, each day off hire is lost revenue.',
            'So for every breakdown, note how long the machine was out of action and what it cost: replacement hire, transport, lost hours. Added up over the year, this figure often changes the ranking of your machines. An old access platform that looks cheap can become the costliest unit in the fleet.',
          ],
        },
        {
          h2: 'Worked example: mini excavator cost per hour, step by step',
          paragraphs: [
            'The figures below are invented and rounded. They show the calculation, not a reference rate.',
            'A 3.5-tonne mini excavator bought for CHF 60,000, kept for 6 years, sold for about CHF 18,000, working 800 hours a year.',
          ],
          bullets: [
            'Depreciation: (60,000 − 18,000) ÷ 6 = CHF 7,000 a year.',
            'Interest: (60,000 + 18,000) ÷ 2 = CHF 39,000 average capital, × 4% = CHF 1,560 a year.',
            'Insurance and tax: CHF 1,200 a year.',
            'Owning costs: 7,000 + 1,560 + 1,200 = CHF 9,760 a year, so 9,760 ÷ 800 = CHF 12.20 per hour.',
            'Fuel: 4 litres per hour × CHF 2.00 = CHF 8.00 per hour.',
            'Maintenance (parts and labour): CHF 2,400 a year ÷ 800 h = CHF 3.00 per hour.',
            'Repairs: CHF 3,200 a year ÷ 800 h = CHF 4.00 per hour.',
            'Tracks: a CHF 2,400 set lasting 2,000 h = CHF 1.20 per hour.',
            'Operating costs: 8.00 + 3.00 + 4.00 + 1.20 = CHF 16.20 per hour.',
            'Machine total, without operator: 12.20 + 16.20 = CHF 28.40 per hour.',
          ],
        },
        {
          h2: 'Why most contractors do not know their machine costs',
          paragraphs: [
            'The example still needs downtime: 6 days of breakdown in the year, covered by hiring in at CHF 400 a day, so CHF 2,400. Spread over 800 hours, that adds CHF 3.00 per hour, and the real cost rises to CHF 31.40 per hour. If the same mini excavator only works 500 hours a year, its owning costs climb from CHF 12.20 to CHF 19.52 per hour (9,760 ÷ 500). An underused machine often costs more than one that breaks down now and then.',
            'Few firms have these figures. The problem is not the formula, it is the data. Parts invoices go to the office, workshop hours sit on paper job sheets, the hour meter is only read at service time, and breakdowns are sorted out over the phone. The accounts know the company’s total repair bill, rarely the total per machine. And almost never the days of downtime. The result: firms keep machines that cost more than they earn, and charge out others below their real cost.',
            'Godet fixes this at the source. Every entry in the maintenance log (service, repair, part) carries the date, the hour meter reading, parts and labour costs, and downtime. The hour meter is entered by hand or read from a photo by the AI, and the person checks the value. Costs for the last 12 months are shown month by month for each machine, and the Excel export gives you the figures to work out the hourly rate alongside your owning costs.',
            'Godet is not an accounting package. It keeps maintenance and repair costs where they are useful: on the machine’s record. Try the [3D demo, no account needed](/demo), or read how to set up a [construction equipment maintenance log](/guides/construction-equipment-maintenance-log).',
          ],
        },
        {
          h2: 'When should you replace a construction machine?',
          paragraphs: [
            'A new machine is expensive to own and cheap to repair. An old one is the reverse. The right moment is usually where the average total cost per hour, counted from purchase, stops falling and starts to rise again. You only see it if you track costs machine by machine over several years.',
            'When you sell, a complete log printed to PDF reassures the buyer. Sticking to the manufacturer’s [service intervals](/guides/construction-equipment-service-intervals) also helps protect resale value.',
          ],
          bullets: [
            'Repair costs per hour rise from year to year while working hours stay steady.',
            'Days of downtime pile up and disrupt site planning.',
            'A major repair (engine, transmission, hydraulics) approaches the machine’s resale value.',
            'Parts become hard to find or lead times get longer.',
            'The machine no longer fits: emissions rules on some sites, or what your clients require.',
          ],
        },
      ],
      faq: [
        {
          q: 'What is the hourly cost of a mini excavator?',
          a: 'It depends on purchase price, hours per year, fuel and the machine’s condition. In the invented example above, it comes to about CHF 28 per hour without operator and CHF 31 with downtime. Your own figures may be very different: only your history gives the true value.',
        },
        {
          q: 'Should the operator’s wage be included in the cost per hour?',
          a: 'To compare machines with each other, no: keep the machine cost on its own. For a hire rate with operator, add the operator’s wage with on-costs and your overheads.',
        },
        {
          q: 'How long should you keep a construction machine?',
          a: 'There is no single answer. It depends on the type of machine, the hours per year and working conditions. Track the average total cost per hour: when it climbs clearly, it is time to look at replacing it.',
        },
        {
          q: 'How much does cost tracking with Godet cost?',
          a: 'There is a free 15-day trial, no credit card needed. After that, Essentiel is CHF 29 a month for up to 5 machines, Pro CHF 59 for up to 20 and Parc CHF 99 for up to 50, with no commitment. Details are in the [help section](/aide).',
        },
      ],
    },
  },
};
