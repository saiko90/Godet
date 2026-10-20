// Outils du garage sans texte : onglets, codes des machines, statistiques d'une machine, droits sur une saisie ou un média.
// (Textes composés : text.ts ; messages d'erreur : errors.ts.)
import { availability, can, costTotals, entryCost, hoursSince, monthlyCosts, type DueInfo } from '@/lib/domain';
import type { Entry, EntryKind, Machine, MachineFile, MachineKind, MediaItem, MemberRole } from '@/lib/types';

export type SheetTab = 'apercu' | 'carnet' | 'reparations' | 'pieces' | 'couts' | 'medias' | 'echeances';

/** Onglets de la fiche, dans l'ordre (libellés : garage.tabs.*). */
export const TABS: readonly SheetTab[] = ['apercu', 'carnet', 'reparations', 'pieces', 'couts', 'medias', 'echeances'];

/** Préfixe proposé pour le code d'une nouvelle machine (« PE-07 ») ; l'interface prend ceux de sa langue (garage.codePrefix). */
export const KIND_PREFIX: Record<MachineKind, string> = {
  pelle: 'PE',
  pelle_pneus: 'PP',
  mini_pelle: 'MP',
  pelle_araignee: 'PA',
  chargeuse: 'CH',
  chargeuse_compacte: 'CC',
  tractopelle: 'TP',
  bulldozer: 'BU',
  niveleuse: 'NI',
  dumper: 'DU',
  mini_dumper: 'MD',
  camion: 'CA',
  camion_grue: 'CG',
  camion_malaxeur: 'CM',
  grue: 'GR',
  grue_tour: 'GT',
  chariot_telescopique: 'TL',
  chariot_elevateur: 'CE',
  nacelle_ciseaux: 'NC',
  nacelle_articulee: 'NA',
  nacelle_telescopique: 'NT',
  rouleau: 'RO',
  rouleau_tandem: 'RT',
  plaque_vibrante: 'PV',
  finisseur: 'FI',
  fraiseuse: 'FR',
  pompe_beton: 'PB',
  foreuse: 'FO',
  concasseur: 'CO',
  crible: 'CB',
  groupe_electrogene: 'GE',
  compresseur: 'CP',
  autre: 'EN',
};

/** Prochain code libre pour un type de machine : PE-01, PE-02… (numéro suivant le plus grand du parc). */
export function nextCode(kind: MachineKind, machines: Pick<Machine, 'code'>[], prefixes: Record<MachineKind, string> = KIND_PREFIX): string {
  const prefix = prefixes[kind] || KIND_PREFIX[kind];
  const used = new Set(machines.map((m) => m.code.toUpperCase()));
  const highest = machines.reduce((max, m) => {
    const n = Number(/-(\d+)$/.exec(m.code)?.[1] ?? 0);
    return Math.max(max, n);
  }, 0);
  for (let n = highest + 1; n < highest + 200; n++) {
    const code = `${prefix}-${String(n).padStart(2, '0')}`;
    if (!used.has(code)) return code;
  }
  return `${prefix}-${String(highest + 1).padStart(2, '0')}`;
}

/**
 * Type de saisie le plus probable pour accomplir une échéance (« Contrôle annuel » → contrôle).
 * Les libellés sont saisis librement, dans n'importe laquelle des quatre langues : on reconnaît les quatre.
 */
export function kindForSchedule(label: string): EntryKind {
  if (
    /contr[ôo]le|expertise|tachygraphe|extincteur|s[ée]curit[ée]|kontrolle|pr[üu]fung|sicherheit|feuerl[öo]scher|fahrtschreiber|\bmfk\b|controllo|collaudo|revisione|sicurezza|estintore|tachigrafo|\bcheck|safety|extinguisher|tachograph|roadworth|vehicle inspection/i.test(
      label,
    )
  ) {
    return 'controle';
  }
  if (/inspection|usure|hivernage|nettoyage|inspektion|verschlei|einwinter|reinigung|ispezione|usura|rimessaggio|pulizia|wear|winteri[sz]|cleaning/i.test(label)) {
    return 'inspection';
  }
  return 'service';
}

/** L'échéance « Service » (toutes les N heures), quelle que soit la langue de son libellé. */
export function isServiceLabel(label: string): boolean {
  return /^(service|wartung|manutenzione)$/i.test(label.trim());
}

/** Premier jour de la fenêtre des coûts (12 mois, mois courant compris). */
export function costWindowStart(today: string): string {
  const [y, m] = today.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 12, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export interface MachineStats {
  months: ReturnType<typeof monthlyCosts>;
  totals: ReturnType<typeof costTotals>;
  /** Heures travaillées sur 12 mois d'après les relevés (null : inconnu). */
  worked: number | null;
  costPerHour: number | null;
  availability: number | null;
  downtime: number;
}

/** Coûts, heures travaillées et disponibilité d'une machine sur 12 mois (fenêtre des coûts). */
export function machineStats(machine: Machine, entries: Entry[], readings: MachineFile['readings'], today: string): MachineStats {
  const start = costWindowStart(today);
  const live = entries.filter((e) => !e.deleted_at && e.machine_id === machine.id);
  const inWindow = live.filter((e) => e.date >= start);
  const months = monthlyCosts(live, today);
  const totals = costTotals(live, today);
  const worked = hoursSince(readings, machine, start);
  const downtime = inWindow.reduce((s, e) => s + Number(e.downtime_hours || 0), 0);
  return {
    months,
    totals,
    worked,
    costPerHour: worked && totals.total ? totals.total / worked : null,
    availability: availability(inWindow, worked),
    downtime,
  };
}

/** Coûts des 12 derniers mois d'une machine, d'après les saisies récentes du parc. */
export function machineCost12(machineId: string, recent: Entry[], today: string): number {
  const start = costWindowStart(today);
  return recent.filter((e) => e.machine_id === machineId && !e.deleted_at && e.date >= start).reduce((s, e) => s + entryCost(e), 0);
}

export function canEditEntry(role: MemberRole, userId: string, e: Pick<Entry, 'created_by'>): boolean {
  return can.editAnyEntry(role) || e.created_by === userId;
}

export function canDeleteMedia(role: MemberRole, userId: string, m: Pick<MediaItem, 'created_by'>): boolean {
  return can.deleteAnyMedia(role) || m.created_by === userId;
}

/** La plus urgente des échéances non à jour, sinon la plus proche. */
export function nextDue(dues: DueInfo[]): DueInfo | null {
  return dues[0] ?? null;
}

/** Saisie avec un compteur au moment de l'intervention ? */
export const KINDS_WITH_HOURS: readonly EntryKind[] = ['service', 'reparation', 'controle', 'inspection'];
