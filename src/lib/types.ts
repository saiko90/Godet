// Types métier de Godet, dérivés du schéma Supabase (src/lib/database.types.ts).
import type { Enums, Tables } from '@/lib/database.types';

export type MachineKind = Enums<'machine_kind'>;
export type EntryKind = Enums<'entry_kind'>;
export type RepairStatus = Enums<'repair_status'>;
export type ScheduleBasis = Enums<'schedule_basis'>;
export type MediaKind = Enums<'media_kind'>;
export type MemberRole = Enums<'member_role'>;

export type Org = Tables<'organizations'>;
export type Machine = Tables<'machines'>;
export type Entry = Tables<'entries'>;
export type Schedule = Tables<'schedules'>;
export type HourReading = Tables<'hour_readings'>;
export type MediaRow = Tables<'media'>;
export type Invitation = Tables<'invitations'>;
export type Profile = Tables<'profiles'>;

/** Média avec son adresse de lecture temporaire (lien signé, ou URL locale en démo). */
export interface MediaItem extends MediaRow {
  url: string | null;
}

/** Membre d'une entreprise, tel qu'affiché dans les paramètres. */
export interface Member {
  userId: string;
  role: MemberRole;
  fullName: string | null;
  email: string | null;
  since: string;
}

/** Contexte de la personne connectée dans l'entreprise active. */
export interface SessionContext {
  userId: string;
  email: string;
  fullName: string | null;
  org: Org;
  role: MemberRole;
  /** Toutes les entreprises dont la personne est membre (pour changer d'entreprise). */
  orgs: { id: string; name: string; role: MemberRole }[];
}

/** Vue d'ensemble du parc : ce qu'il faut pour le showroom, le dock et les statistiques. */
export interface FleetSnapshot {
  org: Org;
  role: MemberRole;
  userId: string;
  /** Machines actives (non archivées), triées par position puis code. */
  machines: Machine[];
  /** Échéances actives des machines du parc. */
  schedules: Schedule[];
  /** Saisies non supprimées des 13 derniers mois (coûts, dernier service…). */
  recentEntries: Entry[];
  /** Réparations ouvertes (en cours ou en attente de pièce), quelle que soit leur date. */
  openRepairs: Entry[];
  /** Relevés d'heures des 120 derniers jours (rythme d'utilisation). */
  readings: HourReading[];
}

/** Dossier complet d'une machine (fiche ouverte). */
export interface MachineFile {
  machine: Machine;
  entries: Entry[];
  schedules: Schedule[];
  readings: HourReading[];
  media: MediaItem[];
}
