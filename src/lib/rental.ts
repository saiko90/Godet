// Module Location : points de l'état des lieux (liste validée avec Michaël, loueur de machines), emplacements des
// photos, statut d'une machine (louée, réservée, disponible). Textes : messages/<langue>/rental.json.
import type { Tables } from '@/lib/database.types';
import type { MachineKind } from '@/lib/types';

export type Rental = Tables<'rentals'>;
export type RentalCheck = Tables<'rental_checks'>;
export type RentalStatus = 'reservee' | 'en_cours' | 'terminee' | 'annulee';
export type CheckKind = 'depart' | 'retour';
export type ItemState = 'ok' | 'defaut' | 'na';
export interface ItemValue {
  state: ItemState;
  comment?: string;
}
export type CheckItems = Record<string, ItemValue>;
export interface Charge {
  label: string;
  amount: number;
}

/** Rend un niveau connu (texte de la base) ou null. */
export const asFuel = (v: string | null | undefined): FuelLevel | null => ((FUEL_LEVELS as readonly string[]).includes(v ?? '') ? (v as FuelLevel) : null);

export const FUEL_LEVELS = ['vide', '1/4', '1/2', '3/4', 'plein'] as const;
export type FuelLevel = (typeof FUEL_LEVELS)[number];

// ------------------------------------------------------------------ familles de machines

const TRACKS = new Set<MachineKind>(['pelle', 'mini_pelle', 'bulldozer', 'concasseur', 'crible', 'foreuse', 'finisseur']);
/** Contrôle de sécurité périodique (nacelles, chariots, grues, télescopiques). */
const SAFETY = new Set<MachineKind>([
  'nacelle_ciseaux',
  'nacelle_articulee',
  'nacelle_telescopique',
  'chariot_telescopique',
  'chariot_elevateur',
  'grue',
  'grue_tour',
  'camion_grue',
]);
/** Bras hydraulique (vérins, flexibles, flèche) et équipement porté (attache rapide, godet). */
const ARM = new Set<MachineKind>([
  'pelle',
  'pelle_pneus',
  'mini_pelle',
  'pelle_araignee',
  'chargeuse',
  'chargeuse_compacte',
  'tractopelle',
  'chariot_telescopique',
  'bulldozer',
  'niveleuse',
  'camion_grue',
  'grue',
  'nacelle_articulee',
  'nacelle_telescopique',
  'nacelle_ciseaux',
  'foreuse',
]);
const BUCKET = new Set<MachineKind>(['pelle', 'pelle_pneus', 'mini_pelle', 'pelle_araignee', 'chargeuse', 'chargeuse_compacte', 'tractopelle']);
/** Sans train de roulement à contrôler (machines posées ou tirées). */
const NO_UNDERCARRIAGE = new Set<MachineKind>(['plaque_vibrante', 'groupe_electrogene', 'compresseur', 'grue_tour']);
/** Sans moteur thermique à plein (plaques, groupes et compresseurs ont un réservoir ; les grues à tour, non). */
const NO_FUEL = new Set<MachineKind>(['grue_tour']);

export const hasSafetyCheck = (kind: MachineKind) => SAFETY.has(kind);
export const hasArm = (kind: MachineKind) => ARM.has(kind);
export const hasFuel = (kind: MachineKind) => !NO_FUEL.has(kind);

// ------------------------------------------------------------------ points de contrôle

export type GroupKey = 'fonctionnement' | 'niveaux' | 'entretien' | 'carrosserie' | 'hydraulique' | 'roulement' | 'equipement' | 'bord';
export type ItemKey =
  | 'demarre'
  | 'voyants'
  | 'signaux'
  | 'niveaux'
  | 'fuites'
  | 'graissee'
  | 'lavee'
  | 'graisse'
  | 'carrosserie'
  | 'vitres'
  | 'retroviseurs'
  | 'eclairage'
  | 'siege'
  | 'cabine'
  | 'verins'
  | 'flexibles'
  | 'bras'
  | 'chenilles'
  | 'roues'
  | 'attache'
  | 'godet'
  | 'documents';
export type SlotKey = 'avant' | 'arriere' | 'gauche' | 'droite' | 'compteur' | 'carburant' | 'securite' | 'verins';
export type MediaSlot = SlotKey | 'libre' | 'video';

export interface CheckGroup {
  key: GroupKey;
  items: ItemKey[];
}

/** Points de contrôle par rubrique, adaptés au type de machine (« Sans objet » reste possible partout). */
export function checkGroups(kind: MachineKind): CheckGroup[] {
  const groups: CheckGroup[] = [
    { key: 'fonctionnement', items: ['demarre', 'voyants', 'signaux'] },
    { key: 'niveaux', items: ['niveaux', 'fuites'] },
    { key: 'entretien', items: ['graissee', 'lavee', 'graisse'] },
    {
      key: 'carrosserie',
      items: ['carrosserie', 'vitres', 'retroviseurs', 'eclairage', 'siege', 'cabine'],
    },
  ];
  if (ARM.has(kind)) groups.push({ key: 'hydraulique', items: ['verins', 'flexibles', 'bras'] });
  if (!NO_UNDERCARRIAGE.has(kind))
    groups.push({
      key: 'roulement',
      items: [TRACKS.has(kind) ? 'chenilles' : 'roues'],
    });
  if (BUCKET.has(kind)) groups.push({ key: 'equipement', items: ['attache', 'godet'] });
  groups.push({ key: 'bord', items: ['documents'] });
  return groups;
}

export const allItems = (kind: MachineKind) => checkGroups(kind).flatMap((g) => g.items);

// ------------------------------------------------------------------ photos

export const MAX_PHOTOS = 20;
export const MAX_VIDEOS = 2;

/** Emplacements de photo : obligatoires, puis selon la machine. Les photos libres ont l'emplacement « libre ». */
export function photoSlots(kind: MachineKind): { key: SlotKey; required: boolean }[] {
  const slots: { key: SlotKey; required: boolean }[] = [
    { key: 'avant', required: true },
    { key: 'arriere', required: true },
    { key: 'gauche', required: true },
    { key: 'droite', required: true },
    { key: 'compteur', required: true },
  ];
  if (hasFuel(kind)) slots.push({ key: 'carburant', required: true });
  if (SAFETY.has(kind)) slots.push({ key: 'securite', required: false });
  if (ARM.has(kind)) slots.push({ key: 'verins', required: false });
  return slots;
}

// ------------------------------------------------------------------ statut d'une machine

export type MachineRentalState =
  { state: 'louee'; rental: Rental; late: boolean } | { state: 'reservee'; rental: Rental } | { state: 'disponible'; next: Rental | null };

const DAY = 86_400_000;

/**
 * Louée (location en cours), réservée (réservation qui commence aujourd'hui ou a déjà commencé, départ pas encore fait)
 * ou disponible (avec la prochaine réservation, s'il y en a une).
 */
export function machineRentalState(rentals: readonly Rental[], machineId: string, now: number): MachineRentalState {
  const mine = rentals.filter((r) => r.machine_id === machineId && (r.status === 'en_cours' || r.status === 'reservee'));
  const out = mine.find((r) => r.status === 'en_cours');
  if (out) return { state: 'louee', rental: out, late: Date.parse(out.end_at) < now };
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const upcoming = mine.filter((r) => Date.parse(r.end_at) > now - DAY).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const due = upcoming.find((r) => Date.parse(r.start_at) <= endOfDay.getTime());
  if (due) return { state: 'reservee', rental: due };
  return { state: 'disponible', next: upcoming[0] ?? null };
}

/** Les champs du formulaire de réservation, normalisés (vides → null). */
export interface RentalInput {
  machineId: string;
  clientCompany: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  site: string;
  delivery: 'livraison' | 'enlevement';
  startAt: string;
  endAt: string;
  notes: string;
}

export const blank = (s: string) => (s.trim() ? s.trim() : null);

export function rentalRow(input: RentalInput) {
  return {
    machine_id: input.machineId,
    client_company: blank(input.clientCompany),
    client_name: input.clientName.trim(),
    client_phone: blank(input.clientPhone),
    client_email: blank(input.clientEmail),
    site: blank(input.site),
    delivery: input.delivery,
    start_at: new Date(input.startAt).toISOString(),
    end_at: new Date(input.endAt).toISOString(),
    notes: blank(input.notes),
  };
}

/** Code d'erreur lisible pour une écriture refusée par la base. */
export type RentalErrorCode = 'overlap' | 'disabled' | 'readOnly' | 'wrongStep' | 'dates' | 'terms' | 'generic';

export function rentalErrorCode(error: { code?: string; message?: string } | null | undefined): RentalErrorCode {
  if (!error) return 'generic';
  if (error.code === '23P01') return 'overlap';
  const m = error.message ?? '';
  if (m.includes('rental_disabled')) return 'disabled';
  if (m.includes('subscription_inactive')) return 'readOnly';
  if (m.includes('rental_wrong_step')) return 'wrongStep';
  if (m.includes('rental_terms_required')) return 'terms';
  if (m.includes('rentals_dates')) return 'dates';
  return 'generic';
}
