// Contenu de la machine de démonstration créée à l'inscription (« Ajouter une pelle de démonstration »).
// Envoyé tel quel à la fonction create_demo_machine_v2 (Supabase) : jours relatifs à aujourd'hui (négatif = passé).
// Une version par langue : le français fait foi ; les autres langues reprennent exactement les mêmes chiffres.
import type { AppLocale } from '@/i18n/routing';

export interface DemoEntry {
  kind: 'service' | 'reparation' | 'piece' | 'controle' | 'inspection' | 'note';
  day: number;
  hours?: number;
  title: string;
  details?: string;
  performed_by?: string;
  cost_parts?: number;
  cost_labour?: number;
  downtime_hours?: number;
  repair_status?: 'fait' | 'en_cours' | 'attente_piece';
  part_ref?: string;
  part_qty?: number;
  supplier?: string;
  warranty_day?: number;
}

export interface DemoSchedule {
  label: string;
  basis: 'heures' | 'date';
  interval_hours?: number;
  interval_days?: number;
  last_hours?: number;
  last_day?: number;
  due_hours?: number;
  due_day?: number;
}

export interface DemoMachinePayload {
  machine: {
    code: string;
    kind: 'pelle' | 'mini_pelle' | 'chargeuse' | 'dumper' | 'camion' | 'grue' | 'rouleau' | 'autre';
    brand: string;
    model: string;
    year: number;
    serial: string;
    weight_t: number;
    color: string;
    hours: number;
    notes: string;
  };
  entries: DemoEntry[];
  schedules: DemoSchedule[];
  readings: { hours: number; day: number }[];
}

const FR: DemoMachinePayload = {
  "machine": {
    "code": "PE-01",
    "kind": "pelle",
    "brand": "Démo",
    "model": "Pelle sur chenilles 21 t",
    "year": 2019,
    "serial": "EX21-004587",
    "weight_t": 21,
    "color": "#f3b71b",
    "hours": 6842,
    "notes": "Machine de démonstration : modifiez-la, complétez son carnet ou archivez-la quand vous voulez."
  },
  "entries": [
    {
      "kind": "service",
      "day": -356,
      "title": "Service 5’500 h",
      "hours": 5512,
      "details": "Huile moteur et filtres, contrôle des flexibles.",
      "performed_by": "Atelier interne",
      "cost_parts": 380,
      "cost_labour": 240
    },
    {
      "kind": "inspection",
      "day": -346,
      "title": "Contrôle après chantier en tranchée",
      "hours": 5580,
      "details": "Nettoyage du train de roulement, contrôle des chocs sur le godet.",
      "performed_by": "Chef d’atelier",
      "cost_labour": 540
    },
    {
      "kind": "reparation",
      "day": -339,
      "title": "Pompe de graissage centralisée remplacée",
      "hours": 5590,
      "details": "Pompe hors service, remplacée et purgée.",
      "performed_by": "Atelier interne",
      "cost_parts": 980,
      "cost_labour": 260,
      "downtime_hours": 4,
      "repair_status": "fait"
    },
    {
      "kind": "piece",
      "day": -332,
      "title": "Filtre déshydrateur de climatisation",
      "cost_parts": 320,
      "part_ref": "CL-03",
      "part_qty": 1
    },
    {
      "kind": "inspection",
      "day": -319,
      "title": "Graissage hivernal",
      "hours": 5640,
      "details": "Graisse grand froid sur la couronne et les axes.",
      "performed_by": "Machiniste",
      "cost_labour": 380
    },
    {
      "kind": "piece",
      "day": -318,
      "title": "Ampoules et fusibles",
      "cost_parts": 90,
      "part_ref": "EL-KIT",
      "part_qty": 1
    },
    {
      "kind": "service",
      "day": -283,
      "title": "Préparation au froid",
      "hours": 5760,
      "details": "Batterie testée, bougies de préchauffage contrôlées, antigel vérifié.",
      "performed_by": "Atelier interne",
      "cost_parts": 240,
      "cost_labour": 370
    },
    {
      "kind": "piece",
      "day": -279,
      "title": "Flexibles de rechange (stock atelier)",
      "cost_parts": 760,
      "part_ref": "FX-ST",
      "part_qty": 4
    },
    {
      "kind": "reparation",
      "day": -265,
      "title": "Moteur de translation droit : fuite",
      "hours": 5790,
      "details": "Joint flottant remplacé, huile du réducteur renouvelée.",
      "performed_by": "Atelier interne",
      "cost_parts": 1260,
      "cost_labour": 1120,
      "downtime_hours": 18,
      "repair_status": "fait"
    },
    {
      "kind": "piece",
      "day": -251,
      "title": "Phare de travail LED",
      "cost_parts": 140,
      "part_ref": "LED-24",
      "part_qty": 1,
      "warranty_day": 114
    },
    {
      "kind": "inspection",
      "day": -246,
      "title": "Inspection et graissage",
      "hours": 5860,
      "details": "Tension des chenilles réglée, axes de godet graissés, usure des dents mesurée.",
      "performed_by": "Machiniste",
      "cost_labour": 450
    },
    {
      "kind": "reparation",
      "day": -215,
      "title": "Dents de godet remplacées",
      "hours": 5998,
      "details": "Cinq dents usées remplacées.",
      "performed_by": "Atelier interne",
      "cost_parts": 450,
      "cost_labour": 190,
      "downtime_hours": 2,
      "repair_status": "fait"
    },
    {
      "kind": "piece",
      "day": -215,
      "title": "Lame d’usure de godet",
      "cost_parts": 520,
      "part_ref": "LU-110",
      "part_qty": 1
    },
    {
      "kind": "service",
      "day": -211,
      "title": "Service 6’000 h",
      "hours": 6004,
      "details": "Huile moteur et filtres, huile des réducteurs de translation, contrôle du jeu de la couronne d’orientation.",
      "performed_by": "Atelier interne",
      "cost_parts": 760,
      "cost_labour": 480
    },
    {
      "kind": "piece",
      "day": -193,
      "title": "Batterie 12 V 140 Ah",
      "cost_parts": 210,
      "part_ref": "BAT-140",
      "part_qty": 1,
      "warranty_day": 538
    },
    {
      "kind": "inspection",
      "day": -185,
      "title": "Contrôle du train de roulement",
      "hours": 6060,
      "details": "Usure des galets et des barbotins mesurée, tension des chenilles réglée.",
      "performed_by": "Chef d’atelier",
      "cost_labour": 530
    },
    {
      "kind": "reparation",
      "day": -160,
      "title": "Vérin de godet réétanché",
      "hours": 6110,
      "details": "Suintement à la tige. Jeu de joints remplacé, tige contrôlée.",
      "performed_by": "Atelier interne",
      "cost_parts": 410,
      "cost_labour": 570,
      "downtime_hours": 6,
      "repair_status": "fait"
    },
    {
      "kind": "piece",
      "day": -152,
      "title": "Kit d’étanchéité du joint tournant",
      "cost_parts": 430,
      "part_ref": "JT-08",
      "part_qty": 1,
      "warranty_day": 213
    },
    {
      "kind": "inspection",
      "day": -143,
      "title": "Nettoyage et contrôle des flexibles",
      "hours": 6150,
      "details": "Nettoyage à la vapeur, contrôle visuel de tous les flexibles et raccords.",
      "performed_by": "Garage partenaire",
      "cost_labour": 690
    },
    {
      "kind": "controle",
      "day": -135,
      "title": "Contrôle annuel de sécurité",
      "hours": 6220,
      "details": "Frein de rotation, clapets de sécurité des vérins, avertisseur de surcharge, éclairage, extincteur. Aucun défaut.",
      "performed_by": "Chef d’atelier",
      "cost_labour": 420
    },
    {
      "kind": "piece",
      "day": -130,
      "title": "Filtres de cabine et balais d’essuie-glace",
      "cost_parts": 160,
      "part_ref": "FC-12",
      "part_qty": 1
    },
    {
      "kind": "service",
      "day": -103,
      "title": "Climatisation : entretien et recharge",
      "hours": 6350,
      "details": "Filtre déshydrateur, recharge de gaz, test d’étanchéité.",
      "performed_by": "Garage partenaire",
      "cost_parts": 240,
      "cost_labour": 340
    },
    {
      "kind": "piece",
      "day": -103,
      "title": "Couteaux latéraux de godet (paire)",
      "cost_parts": 610,
      "part_ref": "CL-110",
      "part_qty": 2
    },
    {
      "kind": "reparation",
      "day": -90,
      "title": "Galet porteur gauche remplacé",
      "hours": 6380,
      "details": "Galet bruyant et grippé. Remplacé, tension de chenille réglée.",
      "performed_by": "Atelier interne",
      "cost_parts": 690,
      "cost_labour": 350,
      "downtime_hours": 9,
      "repair_status": "fait"
    },
    {
      "kind": "service",
      "day": -66,
      "title": "Service 6’500 h",
      "hours": 6498,
      "details": "Huile moteur, filtres à huile, à carburant et à air, filtre de retour hydraulique, graissage complet.",
      "performed_by": "Atelier interne",
      "cost_parts": 760,
      "cost_labour": 480
    },
    {
      "kind": "piece",
      "day": -50,
      "title": "Graisse EP2, cartouches",
      "cost_parts": 380,
      "part_ref": "GR-EP2",
      "part_qty": 24
    },
    {
      "kind": "reparation",
      "day": -46,
      "title": "Flexible haute pression du balancier remplacé",
      "hours": 6602,
      "details": "Fuite sur le flexible du vérin de balancier. Flexible et joints remplacés, niveau d’huile complété.",
      "performed_by": "Atelier interne",
      "cost_parts": 380,
      "cost_labour": 320,
      "downtime_hours": 5,
      "repair_status": "fait"
    },
    {
      "kind": "inspection",
      "day": -37,
      "title": "Contrôle des niveaux",
      "hours": 6640,
      "details": "Huile moteur, huile hydraulique et liquide de refroidissement contrôlés, graissage.",
      "performed_by": "Machiniste",
      "cost_labour": 120
    },
    {
      "kind": "piece",
      "day": -30,
      "title": "Kit de filtres pour le service 7’000 h",
      "cost_parts": 440,
      "part_ref": "KF-7000",
      "part_qty": 1
    },
    {
      "kind": "inspection",
      "day": -13,
      "title": "Graissage et nettoyage du radiateur",
      "hours": 6770,
      "details": "Axes graissés, radiateur et refroidisseur d’huile soufflés.",
      "performed_by": "Machiniste",
      "cost_labour": 260
    },
    {
      "kind": "reparation",
      "day": -4,
      "title": "Suspension du siège à remplacer",
      "hours": 6830,
      "details": "Amortisseur du siège affaissé. Pièce commandée, montage prévu au service 7’000 h.",
      "performed_by": "Chef d’atelier",
      "cost_parts": 520,
      "cost_labour": 170,
      "repair_status": "attente_piece"
    }
  ],
  "schedules": [
    {
      "label": "Service",
      "basis": "heures",
      "interval_hours": 500,
      "last_hours": 6498,
      "last_day": -66,
      "due_hours": 7000
    },
    {
      "label": "Inspection du train de roulement",
      "basis": "heures",
      "interval_hours": 1000,
      "last_hours": 6060,
      "last_day": -185,
      "due_hours": 7060
    },
    {
      "label": "Vidange de l’huile hydraulique",
      "basis": "heures",
      "interval_hours": 2000,
      "last_hours": 6004,
      "last_day": -211,
      "due_hours": 8000
    },
    {
      "label": "Contrôle de l’extincteur",
      "basis": "date",
      "interval_days": 365,
      "last_day": -246,
      "due_day": 119
    },
    {
      "label": "Contrôle annuel de sécurité",
      "basis": "date",
      "interval_days": 365,
      "last_day": -135,
      "due_day": 230
    }
  ],
  "readings": [
    {
      "hours": 6806,
      "day": -7
    }
  ]
};

// À traduire (même structure, mêmes chiffres) : tant qu'une langue manque, le français est utilisé.
const BY_LOCALE: Partial<Record<AppLocale, DemoMachinePayload>> = { fr: FR };

/** Machine de démonstration dans la langue demandée. */
export function buildDemoMachinePayload(locale: AppLocale): DemoMachinePayload {
  return BY_LOCALE[locale] ?? FR;
}
