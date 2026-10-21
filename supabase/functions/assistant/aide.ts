// Mode d'emploi de Godet donné à l'assistant (rédigé en français ; l'assistant répond dans la langue de la personne).
// À tenir à jour quand une fonction change (même source que la page d'aide et le guide PDF).

export const AIDE = `
# Godet — mode d'emploi

Godet est le carnet d'entretien numérique des machines de chantier (pelles, chargeuses, dumpers, nacelles, camions,
grues, rouleaux, etc.), conçu en Valais par Swiss Digital Studio pour les entreprises suisses. Chaque machine a son
carnet : services, contrôles, inspections, réparations, pièces, notes, coûts, photos, vidéos, documents et échéances.
Adresse : https://godet.app. Langues : français, allemand, italien, anglais (chaque personne choisit la sienne).
Données hébergées dans l'UE (Irlande). Chaque entreprise ne voit que ses propres données (règles appliquées par la base).

## Installer Godet
Rien à installer : Godet s'ouvre dans le navigateur (ordinateur, tablette, téléphone). On peut l'ajouter à l'écran
d'accueil comme une application :
- iPhone / iPad (Safari) : bouton Partager → « Sur l'écran d'accueil ».
- Android (Chrome) : menu ⋮ → « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- Ordinateur (Chrome, Edge) : icône d'installation dans la barre d'adresse, ou menu → « Installer Godet ».

## Le garage (showroom 3D) et le mode atelier
- Le garage montre chaque machine sur son plateau, avec son état : vert (à jour), orange (échéance proche ou réparation
  ouverte), rouge (échéance dépassée).
- Le dock en bas liste les machines ; un clic ouvre la fiche. Les machines du même type peuvent être regroupées sur un
  plateau (menu → « Regrouper les machines du même type »).
- Le bouton « Atelier » (en haut) affiche le parc en liste, sans 3D : rapide sur tous les appareils, idéal pour saisir.
- Sur téléphone et tablette, la 3D est toujours en qualité légère.
- La barre du haut montre le nombre de machines, de points d'attention et le coût des 12 derniers mois.

## Ajouter une machine
« + Machine » dans le dock (ou dans le mode atelier). Champs : code (ex. PE-01), type, marque, modèle, année, numéro de
série, plaque, poids, compteur d'heures actuel, couleur. Deux échéances sont créées automatiquement (service et
contrôle de sécurité annuel), modifiables ensuite. Rôles autorisés : propriétaire, administrateur, mécanicien.

## La fiche d'une machine
Onglets : aperçu (état, échéances, réparations ouvertes), carnet (toutes les saisies), coûts (12 mois, mois par mois),
fichiers (photos, vidéos, documents), infos de la machine.

## Saisir une intervention
Dans la fiche : bouton « Intervention » (ou « Photo », « Vidéo »). Types : Service (vidanges, filtres, graissage), Contrôle (sécurité, expertise, contrôle
annuel), Inspection (tour de la machine, niveaux, usure), Réparation (panne, fuite, casse ; statut en cours, en attente
de pièce ou terminée), Pièce (référence, quantité, fournisseur, garantie), Note. Chaque saisie a sa date, le compteur
d'heures, qui l'a faite, les coûts pièces et main-d'œuvre, l'immobilisation, et peut être liée à une échéance (qui se
renouvelle alors automatiquement). On peut joindre photos, vidéos et documents.
Retirer une saisie : elle n'est jamais effacée, elle reste visible barrée avec son motif (valeur du carnet devant un
contrôle, art. 32b OPA). Chaque changement est journalisé.

## Compteur d'heures
Bouton « Compteur » dans la fiche, ou menu de la fiche → « Relever le compteur » (aussi dans le mode atelier). Le compteur n'avance que vers le haut (sauf correction).
Lecture sur photo : bouton « Lire sur une photo » dans la fenêtre du compteur ; l'IA lit le chiffre et le propose, la
personne vérifie avant d'enregistrer. Une saisie avec compteur crée aussi un relevé. Les relevés donnent le rythme
d'utilisation (heures par semaine) qui sert à estimer la date des prochaines échéances en heures.

## Échéances
En heures (ex. service toutes les 500 h) ou en date (ex. contrôle annuel). Godet calcule ce qui reste, prévient avant
l'échéance (orange) et signale le retard (rouge). Une échéance se règle en saisissant l'intervention liée.
Rôles autorisés pour les gérer : propriétaire, administrateur, mécanicien.

## Rappels par e-mail
Paramètres → Rappels : quotidien (le matin s'il y a quelque chose), hebdomadaire (lundi matin) ou jamais ; anticipation
en jours (échéances en date) et en heures (échéances en heures). Envoyés à l'adresse du compte, dans sa langue.

## Équipe et rôles
Paramètres → Équipe : inviter par e-mail ou lien. Rôles :
- Propriétaire : tous les droits, y compris l'entreprise et l'abonnement.
- Administrateur : gère le parc, les échéances et l'équipe.
- Mécanicien : ajoute et modifie les machines, les échéances et toutes les saisies.
- Machiniste : consulte le parc, saisit les heures, les interventions et les photos.
Utilisateurs illimités dans toutes les formules.

## Étiquettes QR
Menu → « Étiquettes QR » (ou menu de la fiche → « Étiquette QR ») : une étiquette QR par machine à coller dans la cabine. Scannée avec un téléphone, elle ouvre
directement la fiche de la machine.

## Excel
Menu → « Excel : importer / exporter ». Export : classeur à trois feuilles (machines, carnet, échéances). Import : mêmes
colonnes ; une machine déjà présente (même code) est mise à jour, une intervention déjà au carnet n'est pas doublée.
Un modèle vide est proposé.

## Carnet imprimé
Menu de la fiche → « Imprimer le carnet » : le carnet complet d'une machine en PDF (contrôle, expertise, revente).

## Sans réseau
Le garage fonctionne hors ligne sur un appareil déjà utilisé : les saisies sont gardées et envoyées au retour du
réseau (bandeau « Hors ligne » / « En attente d'envoi »).

## Machines archivées
Une machine vendue ou hors service s'archive : elle quitte le showroom, son carnet reste consultable et imprimable
(Paramètres → Machines archivées), et on peut la remettre au garage.

## Abonnement et tarifs
- Essai gratuit de 15 jours, sans carte de crédit, toutes les fonctions.
- Ensuite : Essentiel jusqu'à 5 machines 29 CHF / mois ; Pro jusqu'à 20 machines 59 CHF / mois ; Parc jusqu'à 50
  machines 99 CHF / mois (ou le même montant en euros). Paiement annuel : 2 mois offerts. Utilisateurs illimités,
  étiquettes QR, Excel, mode sans réseau compris. Sans engagement, résiliable en tout temps.
- Pack fondateur : −30 % à vie pour les 10 premières entreprises abonnées.
- Plus de 50 machines : offre sur mesure (page Contact).
- Après l'essai sans abonnement, le garage passe en lecture seule : rien n'est effacé ; tout redevient modifiable dès
  l'abonnement.
- Paramètres → Abonnement : choisir une formule (paiement par carte via Stripe), puis « Gérer l'abonnement » pour
  changer de formule, de carte, télécharger les factures ou résilier. Seuls le propriétaire et les administrateurs.
- Option Location : +29 CHF / mois (voir plus bas).
- Assistant IA compris : questions par mois selon la formule (essai 30, Essentiel 100, Pro 300, Parc 800) et lectures
  de compteur sur photo (essai 50, sinon 500 par mois).

## Option Location (loueurs de machines)
- Option payante : +29 CHF (ou 29 €) par mois, l'année = 10 mois, pack fondateur −30 % aussi ; comprise dans l'essai de
  15 jours. Paramètres → Abonnement → « Option Location » (ajout ou retrait au prorata). Sans l'option, rien ne
  s'affiche.
- Paramètres → Location : déposer les conditions générales de location (PDF, 10 Mo au plus ; chaque nouvelle version
  est gardée, les états des lieux signés gardent la leur) et une adresse qui reçoit une copie de chaque rapport.
- Agenda : menu du garage → « Location » (page /location). Une ligne par machine, une colonne par jour (14, 21 ou 42
  jours) ; barres : réservée (pointillés bleus), louée (jaune), retour en retard (rouge), rendue (grise). En haut :
  machines louées, réservées aujourd'hui, disponibles, retours en retard, et les départs et retours du jour.
- Réserver : « Nouvelle réservation » ou toucher une case vide : machine, départ, retour prévu, client (les clients déjà
  servis sont proposés), téléphone, e-mail (le rapport y est envoyé), chantier, livraison ou enlèvement, remarques.
  Une machine déjà réservée ou louée sur la période est refusée. Une réservation se modifie, se prolonge ou s'annule.
- Transport (locations en livraison) : un camion sur la barre de l'agenda, rouge tant que le transport n'est pas
  organisé, vert une fois confirmé (aller au départ, retour pendant la location). Toucher le camion de « Aujourd'hui »
  ou « Organiser » dans le détail de la réservation : pour la livraison et la reprise, transporteur ou chauffeur,
  passage prévu, remarque, case « Transport confirmé » (transporteur obligatoire).
- État des lieux de départ (bouton « État des lieux de départ ») : points de contrôle adaptés à la machine, chacun
  OK / Défaut (avec description) / Sans objet, bouton « Tout OK » par rubrique (fonctionnement, niveaux et fuites,
  entretien, carrosserie et cabine, hydraulique, train de roulement, équipement, documents) ; niveau de carburant ;
  compteur d'heures (lu sur la photo du compteur) ; accident ; contrôle de sécurité (nacelles, chariots, grues) ;
  accessoires ; clés ; photos imposées (avant, arrière, gauche, droite, compteur, jauge ; plaque de contrôle et vérins
  si la machine en a), jusqu'à 20 photos et 2 vidéos ; remarques. Si des conditions sont déposées, le client coche
  « a lu et accepte les conditions de location » ; puis signature du client et du loueur au doigt. La machine passe
  « Louée ».
- État des lieux de retour : même formulaire comparé au départ (nouveau défaut en rouge, heures de location
  calculées), frais (plein, nettoyage, dégâts) et réserves, signatures. La location est close, le compteur de la
  machine est mis à jour (relevé « État des lieux de location »).
- Retour : question « La machine est-elle en panne ? ». Si oui (avec la description), une réparation « en cours » est
  ouverte dans le carnet de la machine. Tant qu'elle n'est pas terminée (statut « fait » dans le carnet), les
  réservations à venir de cette machine sont hachurées rouge et jaune dans l'agenda, listées dans « Réservations à
  risque » en haut de l'agenda, signalées dans le détail et le formulaire de réservation, et la pastille du garage
  devient « Réservée · en réparation ».
- Un état des lieux signé ne se modifie plus. Après chaque signature : rapport PDF envoyé au client par e-mail (avec
  les conditions acceptées), copie à l'adresse réglée, rangé dans les documents de la machine ; photos et vidéos dans
  ses médias. Page « Rapport » d'une location : les deux états des lieux, imprimer, ouvrir le PDF, renvoyer au client.
- Dans le garage, la fiche (et le mode atelier) affiche une pastille Louée / Réservée / Disponible qui mène à l'état
  des lieux ou à l'agenda.

## Support
- Page Contact (https://godet.app/contact) : question, démonstration pour l'équipe, offre sur mesure.
- Boîte à idées (menu → « Boîte à idées », ou Paramètres) : proposer une fonction et suivre les réponses.
- Pas de mise en route sur place ; tout se fait en ligne.

## Position GPS des saisies
Désactivée par défaut. Paramètres → Entreprise → « Enregistrer la position GPS des saisies » (propriétaire,
administrateur). Ensuite, à chaque intervention ou relevé d'heures, l'appareil joint sa position (la personne peut la
retirer, case « Joindre la position »). Jamais de suivi en continu. La fiche montre la dernière position de la machine
avec un lien vers la carte ; chaque saisie localisée a un lien « Lieu de la saisie ». Il faut autoriser la position
dans le navigateur ou le téléphone.

## Sécurité des données
Page https://godet.app/securite : hébergement UE (Irlande), HTTPS et chiffrement au repos, cloisonnement par
entreprise appliqué par la base, sauvegarde quotidienne de la base conservée 7 jours, rien ne s'efface, export Excel
et PDF à tout moment, paiement chez Stripe (aucune donnée de carte chez Godet), IA (Anthropic) sans entraînement sur
les données, copie hors ligne effacée à la déconnexion.

## Conformité
Art. 32b OPA (RS 832.30) : les résultats des opérations d'entretien doivent être consignés. Godet facilite la tenue du
carnet ; l'entretien reste de la responsabilité de l'employeur.
`;
