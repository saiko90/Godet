// Fichier généré par sync.mjs à partir de messages/<langue>/emails.json, domain.json et garage.json : ne pas modifier ici.
// Les textes font foi dans messages/ (français de référence, vérifiés par scripts/check-messages.mjs).

import type { Locale } from './format.ts';

export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

export const MESSAGES: Readonly<Record<Locale, MessageTree>> = {
  "fr": {
    "emails": {
      "layout": {
        "tagline": "Le carnet d’entretien de vos machines de chantier",
        "signature": "Godet · une application de Swiss Digital Studio",
        "automatic": "Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre."
      },
      "rappels": {
        "subject": {
          "one": "Godet — {summary} chez {org}",
          "many": "Godet — {summary} dans {orgs, plural, one {# entreprise} other {# entreprises}}"
        },
        "summary": {
          "dues": "{count, plural, one {# échéance à prévoir} other {# échéances à prévoir}}",
          "duesOverdue": "{count, plural, one {# échéance à prévoir} other {# échéances à prévoir}} (dont {overdue, plural, one {# dépassée} other {# dépassées}})",
          "repairs": "{count, plural, one {# réparation ouverte} other {# réparations ouvertes}}",
          "both": "{dues} et {repairs}"
        },
        "title": "{frequency, select, quotidien {Votre rappel du jour} other {Votre rappel de la semaine}}",
        "greeting": "Bonjour {name},",
        "greetingAnonymous": "Bonjour,",
        "intro": "Voici ce qui demande votre attention\u00a0: {summary}.",
        "sections": {
          "dues": "Échéances",
          "repairs": "Réparations ouvertes"
        },
        "state": {
          "overdue": "En retard",
          "soon": "À prévoir"
        },
        "item": {
          "plannedOn": "prévue le {date}",
          "counter": "compteur\u00a0: {hours}",
          "reported": "signalée le {date}",
          "cost": "coût à ce jour\u00a0: {amount}"
        },
        "more": "{count, plural, one {Et # autre point à voir dans le garage.} other {Et # autres points à voir dans le garage.}}",
        "cta": "Ouvrir le garage",
        "why": "{frequency, select, quotidien {Vous recevez ce rappel chaque matin, seulement s’il y a quelque chose à signaler.} other {Vous recevez ce rappel le lundi matin, seulement s’il y a quelque chose à signaler.}}",
        "thresholds": "Échéances signalées {days, plural, one {# jour} other {# jours}} à l’avance pour les dates et {hours} à l’avance pour les compteurs d’heures.",
        "settings": "Modifier ou désactiver les rappels"
      }
    },
    "domain": {
      "machineKinds": {
        "pelle": {
          "label": "Pelle sur chenilles",
          "short": "Pelle"
        },
        "mini_pelle": {
          "label": "Mini-pelle",
          "short": "Mini-pelle"
        },
        "chargeuse": {
          "label": "Chargeuse sur pneus",
          "short": "Chargeuse"
        },
        "dumper": {
          "label": "Dumper",
          "short": "Dumper"
        },
        "camion": {
          "label": "Camion",
          "short": "Camion"
        },
        "grue": {
          "label": "Grue",
          "short": "Grue"
        },
        "rouleau": {
          "label": "Rouleau compresseur",
          "short": "Rouleau"
        },
        "autre": {
          "label": "Autre engin",
          "short": "Engin"
        }
      },
      "repairStatus": {
        "fait": "Réparée",
        "en_cours": "En cours",
        "attente_piece": "En attente de pièce"
      },
      "due": {
        "inHours": "dans {hours}",
        "overdueHours": "dépassé de {hours}",
        "onDate": "le {date}",
        "lateDays": "{days, plural, one {en retard de # jour} other {en retard de # jours}}",
        "hintEstimate": "Vers le {date} au rythme {rateKind, select, actual {actuel} other {moyen}} (≈ {rate} h par semaine)",
        "hintAsap": "À faire dès que possible",
        "hintLate": "En retard",
        "hintToday": "Aujourd’hui",
        "hintInDays": "{days, plural, one {Dans # jour} other {Dans # jours}}"
      },
      "machineTitle": "{kind} {weight} t"
    },
    "garage": {
      "schedules": {
        "defaults": {
          "service": "Service",
          "safety": "Contrôle annuel de sécurité"
        }
      }
    }
  },
  "de": {
    "emails": {
      "layout": {
        "tagline": "Das Wartungsheft Ihrer Baumaschinen",
        "signature": "Godet · eine Anwendung von Swiss Digital Studio",
        "automatic": "Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht darauf."
      },
      "rappels": {
        "subject": {
          "one": "Godet — {summary} bei {org}",
          "many": "Godet — {summary} in {orgs, plural, one {# Unternehmen} other {# Unternehmen}}"
        },
        "summary": {
          "dues": "{count, plural, one {# anstehender Termin} other {# anstehende Termine}}",
          "duesOverdue": "{count, plural, one {# anstehender Termin} other {# anstehende Termine}} (davon {overdue, plural, one {# überfällig} other {# überfällig}})",
          "repairs": "{count, plural, one {# offene Reparatur} other {# offene Reparaturen}}",
          "both": "{dues} und {repairs}"
        },
        "title": "{frequency, select, quotidien {Ihre tägliche Erinnerung} other {Ihre wöchentliche Erinnerung}}",
        "greeting": "Guten Tag {name}",
        "greetingAnonymous": "Guten Tag",
        "intro": "Folgendes braucht Ihre Aufmerksamkeit: {summary}.",
        "sections": {
          "dues": "Termine",
          "repairs": "Offene Reparaturen"
        },
        "state": {
          "overdue": "Überfällig",
          "soon": "Anstehend"
        },
        "item": {
          "plannedOn": "fällig am {date}",
          "counter": "Betriebsstunden: {hours}",
          "reported": "gemeldet am {date}",
          "cost": "bisherige Kosten: {amount}"
        },
        "more": "{count, plural, one {Und # weiterer Punkt in der Garage.} other {Und # weitere Punkte in der Garage.}}",
        "cta": "Garage öffnen",
        "why": "{frequency, select, quotidien {Sie erhalten diese Erinnerung jeden Morgen, aber nur, wenn es etwas zu melden gibt.} other {Sie erhalten diese Erinnerung am Montagmorgen, aber nur, wenn es etwas zu melden gibt.}}",
        "thresholds": "Termine werden {days, plural, one {# Tag} other {# Tage}} im Voraus gemeldet, Termine nach Betriebsstunden {hours} im Voraus.",
        "settings": "Erinnerungen ändern oder ausschalten"
      }
    },
    "domain": {
      "machineKinds": {
        "pelle": {
          "label": "Raupenbagger",
          "short": "Bagger"
        },
        "mini_pelle": {
          "label": "Minibagger",
          "short": "Minibagger"
        },
        "chargeuse": {
          "label": "Radlader",
          "short": "Radlader"
        },
        "dumper": {
          "label": "Dumper",
          "short": "Dumper"
        },
        "camion": {
          "label": "Lastwagen",
          "short": "Lastwagen"
        },
        "grue": {
          "label": "Kran",
          "short": "Kran"
        },
        "rouleau": {
          "label": "Walzenzug",
          "short": "Walze"
        },
        "autre": {
          "label": "Andere Maschine",
          "short": "Maschine"
        }
      },
      "repairStatus": {
        "fait": "Repariert",
        "en_cours": "In Arbeit",
        "attente_piece": "Wartet auf Ersatzteil"
      },
      "due": {
        "inHours": "in {hours}",
        "overdueHours": "{hours} überfällig",
        "onDate": "am {date}",
        "lateDays": "{days, plural, one {# Tag überfällig} other {# Tage überfällig}}",
        "hintEstimate": "Etwa am {date} beim {rateKind, select, actual {aktuellen} other {durchschnittlichen}} Tempo (≈ {rate} h pro Woche)",
        "hintAsap": "So bald wie möglich erledigen",
        "hintLate": "Überfällig",
        "hintToday": "Heute",
        "hintInDays": "{days, plural, one {In # Tag} other {In # Tagen}}"
      },
      "machineTitle": "{kind} {weight} t"
    },
    "garage": {
      "schedules": {
        "defaults": {
          "service": "Wartung",
          "safety": "Jährliche Sicherheitskontrolle"
        }
      }
    }
  },
  "it": {
    "emails": {
      "layout": {
        "tagline": "Il libretto di manutenzione delle Sue macchine edili",
        "signature": "Godet · un’applicazione di Swiss Digital Studio",
        "automatic": "Questa e-mail è stata inviata automaticamente. La preghiamo di non rispondere."
      },
      "rappels": {
        "subject": {
          "one": "Godet — {summary} presso {org}",
          "many": "Godet — {summary} in {orgs, plural, one {# impresa} other {# imprese}}"
        },
        "summary": {
          "dues": "{count, plural, one {# scadenza da pianificare} other {# scadenze da pianificare}}",
          "duesOverdue": "{count, plural, one {# scadenza da pianificare} other {# scadenze da pianificare}} (di cui {overdue, plural, one {# superata} other {# superate}})",
          "repairs": "{count, plural, one {# riparazione aperta} other {# riparazioni aperte}}",
          "both": "{dues} e {repairs}"
        },
        "title": "{frequency, select, quotidien {Il Suo promemoria del giorno} other {Il Suo promemoria della settimana}}",
        "greeting": "Buongiorno {name},",
        "greetingAnonymous": "Buongiorno,",
        "intro": "Ecco cosa richiede la Sua attenzione: {summary}.",
        "sections": {
          "dues": "Scadenze",
          "repairs": "Riparazioni aperte"
        },
        "state": {
          "overdue": "In ritardo",
          "soon": "Da pianificare"
        },
        "item": {
          "plannedOn": "prevista il {date}",
          "counter": "contaore: {hours}",
          "reported": "segnalata il {date}",
          "cost": "costo finora: {amount}"
        },
        "more": "{count, plural, one {E # altro punto da vedere nel garage.} other {E altri # punti da vedere nel garage.}}",
        "cta": "Apri il garage",
        "why": "{frequency, select, quotidien {Riceve questo promemoria ogni mattina, solo se c’è qualcosa da segnalare.} other {Riceve questo promemoria il lunedì mattina, solo se c’è qualcosa da segnalare.}}",
        "thresholds": "Le scadenze sono segnalate con {days, plural, one {# giorno} other {# giorni}} di anticipo per le date e con {hours} di anticipo per il contaore.",
        "settings": "Modificare o disattivare i promemoria"
      }
    },
    "domain": {
      "machineKinds": {
        "pelle": {
          "label": "Escavatore cingolato",
          "short": "Escavatore"
        },
        "mini_pelle": {
          "label": "Miniescavatore",
          "short": "Miniescavatore"
        },
        "chargeuse": {
          "label": "Pala gommata",
          "short": "Pala"
        },
        "dumper": {
          "label": "Dumper",
          "short": "Dumper"
        },
        "camion": {
          "label": "Camion",
          "short": "Camion"
        },
        "grue": {
          "label": "Gru",
          "short": "Gru"
        },
        "rouleau": {
          "label": "Rullo compattatore",
          "short": "Rullo"
        },
        "autre": {
          "label": "Altra macchina",
          "short": "Macchina"
        }
      },
      "repairStatus": {
        "fait": "Riparata",
        "en_cours": "In corso",
        "attente_piece": "In attesa del ricambio"
      },
      "due": {
        "inHours": "tra {hours}",
        "overdueHours": "superato di {hours}",
        "onDate": "il {date}",
        "lateDays": "{days, plural, one {in ritardo di # giorno} other {in ritardo di # giorni}}",
        "hintEstimate": "Verso il {date} al ritmo {rateKind, select, actual {attuale} other {medio}} (≈ {rate} h a settimana)",
        "hintAsap": "Da fare il prima possibile",
        "hintLate": "In ritardo",
        "hintToday": "Oggi",
        "hintInDays": "{days, plural, one {Tra # giorno} other {Tra # giorni}}"
      },
      "machineTitle": "{kind} {weight} t"
    },
    "garage": {
      "schedules": {
        "defaults": {
          "service": "Manutenzione",
          "safety": "Controllo annuale di sicurezza"
        }
      }
    }
  },
  "en": {
    "emails": {
      "layout": {
        "tagline": "The maintenance log for your construction machinery",
        "signature": "Godet · an application by Swiss Digital Studio",
        "automatic": "This email was sent automatically. Please do not reply to it."
      },
      "rappels": {
        "subject": {
          "one": "Godet — {summary} at {org}",
          "many": "Godet — {summary} across {orgs, plural, one {# company} other {# companies}}"
        },
        "summary": {
          "dues": "{count, plural, one {# due date to plan} other {# due dates to plan}}",
          "duesOverdue": "{count, plural, one {# due date to plan} other {# due dates to plan}} ({overdue, plural, one {# overdue} other {# overdue}})",
          "repairs": "{count, plural, one {# open repair} other {# open repairs}}",
          "both": "{dues} and {repairs}"
        },
        "title": "{frequency, select, quotidien {Your daily reminder} other {Your weekly reminder}}",
        "greeting": "Hello {name},",
        "greetingAnonymous": "Hello,",
        "intro": "Here is what needs your attention: {summary}.",
        "sections": {
          "dues": "Due dates",
          "repairs": "Open repairs"
        },
        "state": {
          "overdue": "Overdue",
          "soon": "Coming up"
        },
        "item": {
          "plannedOn": "due on {date}",
          "counter": "hour meter: {hours}",
          "reported": "reported on {date}",
          "cost": "cost so far: {amount}"
        },
        "more": "{count, plural, one {And # more item to check in the garage.} other {And # more items to check in the garage.}}",
        "cta": "Open the garage",
        "why": "{frequency, select, quotidien {You receive this reminder every morning, only when there is something to report.} other {You receive this reminder on Monday mornings, only when there is something to report.}}",
        "thresholds": "Due dates are flagged {days, plural, one {# day} other {# days}} ahead for calendar dates and {hours} ahead for hour meters.",
        "settings": "Change or turn off reminders"
      }
    },
    "domain": {
      "machineKinds": {
        "pelle": {
          "label": "Crawler excavator",
          "short": "Excavator"
        },
        "mini_pelle": {
          "label": "Mini excavator",
          "short": "Mini excavator"
        },
        "chargeuse": {
          "label": "Wheel loader",
          "short": "Loader"
        },
        "dumper": {
          "label": "Dumper",
          "short": "Dumper"
        },
        "camion": {
          "label": "Truck",
          "short": "Truck"
        },
        "grue": {
          "label": "Crane",
          "short": "Crane"
        },
        "rouleau": {
          "label": "Roller compactor",
          "short": "Roller"
        },
        "autre": {
          "label": "Other machine",
          "short": "Machine"
        }
      },
      "repairStatus": {
        "fait": "Repaired",
        "en_cours": "In progress",
        "attente_piece": "Waiting for parts"
      },
      "due": {
        "inHours": "in {hours}",
        "overdueHours": "{hours} overdue",
        "onDate": "on {date}",
        "lateDays": "{days, plural, one {# day late} other {# days late}}",
        "hintEstimate": "Around {date} at the {rateKind, select, actual {current} other {average}} pace (≈ {rate} h per week)",
        "hintAsap": "Do it as soon as possible",
        "hintLate": "Late",
        "hintToday": "Today",
        "hintInDays": "{days, plural, one {In # day} other {In # days}}"
      },
      "machineTitle": "{kind} {weight} t"
    },
    "garage": {
      "schedules": {
        "defaults": {
          "service": "Service",
          "safety": "Annual safety inspection"
        }
      }
    }
  }
};
