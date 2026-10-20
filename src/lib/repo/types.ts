// Contrat d'accès aux données du garage. Deux implémentations :
// - SupabaseRepo (src/lib/repo/supabase.ts) : les vraies données de l'entreprise ;
// - DemoRepo (src/lib/repo/demo.ts) : un parc d'exemple en mémoire, pour /demo (rien n'est envoyé).
import type {
  Entry,
  EntryKind,
  FleetSnapshot,
  Machine,
  MachineFile,
  MachineKind,
  MediaItem,
  MediaKind,
  RepairStatus,
  Schedule,
  ScheduleBasis,
} from '@/lib/types';

export interface NewMachine {
  code: string;
  kind: MachineKind;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  serial?: string | null;
  plate?: string | null;
  weightT?: number | null;
  color?: string;
  hours?: number;
  notes?: string | null;
}

export interface NewEntry {
  /** Identifiant choisi par l'appareil (saisie hors ligne renvoyée plus tard : pas de doublon). */
  id?: string;
  machineId: string;
  kind: EntryKind;
  /** AAAA-MM-JJ (par défaut : aujourd'hui). */
  date?: string;
  /** Compteur au moment de l'intervention (crée un relevé et peut faire avancer le compteur). */
  hours?: number | null;
  title: string;
  details?: string | null;
  performedBy?: string | null;
  costParts?: number;
  costLabour?: number;
  downtimeHours?: number | null;
  repairStatus?: RepairStatus | null;
  partRef?: string | null;
  partQty?: number | null;
  supplier?: string | null;
  warrantyUntil?: string | null;
  /** Échéance accomplie par cette intervention : elle est renouvelée automatiquement. */
  scheduleId?: string | null;
}

export interface NewSchedule {
  machineId: string;
  label: string;
  basis: ScheduleBasis;
  intervalHours?: number | null;
  intervalDays?: number | null;
  lastHours?: number | null;
  lastDate?: string | null;
  dueHours?: number | null;
  dueDate?: string | null;
}

export interface UploadOptions {
  kind: MediaKind;
  caption?: string | null;
  entryId?: string | null;
  /** Nom d'origine du fichier (sert à garder l'extension). */
  fileName?: string;
  /** Date de prise de vue (par défaut : maintenant). */
  takenAt?: string;
  /** Avancement de l'envoi (0 à 1), quand le transport le permet. */
  onProgress?: (fraction: number) => void;
}

export interface GarageRepo {
  /** « cloud » : données réelles ; « demo » : parc d'exemple local. */
  readonly mode: 'cloud' | 'demo';

  loadFleet(): Promise<FleetSnapshot>;
  loadMachineFile(machineId: string): Promise<MachineFile>;

  addMachine(input: NewMachine): Promise<Machine>;
  updateMachine(id: string, patch: Partial<NewMachine> & { position?: number }): Promise<Machine>;
  /** Archive (la machine quitte le showroom, son carnet est conservé). */
  archiveMachine(id: string): Promise<void>;

  addEntry(input: NewEntry): Promise<Entry>;
  updateEntry(id: string, patch: Partial<Omit<NewEntry, 'machineId'>>): Promise<Entry>;
  /** Retrait d'une saisie : elle reste dans l'historique, marquée retirée avec le motif (art. 32b OPA). */
  removeEntry(id: string, reason: string): Promise<void>;

  /** Nouveau relevé du compteur d'heures. */
  addReading(machineId: string, hours: number): Promise<void>;

  addSchedule(input: NewSchedule): Promise<Schedule>;
  updateSchedule(id: string, patch: Partial<Omit<NewSchedule, 'machineId'>> & { active?: boolean }): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;

  /** Dépose une photo, une vidéo ou un document pour une machine. */
  uploadMedia(machineId: string, file: Blob, opts: UploadOptions): Promise<MediaItem>;
  deleteMedia(id: string): Promise<void>;
  /** Adresse de lecture (lien signé d'une heure en mode cloud). */
  mediaUrl(path: string): Promise<string | null>;
}
