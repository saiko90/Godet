'use client';

// Contexte du garage : données du parc, dépôt (cloud ou démo) et actions partagées par la fiche, les modales
// et le mode atelier. Le dépôt n'est lu que dans les gestionnaires d'événements (jamais pendant le rendu).
import { createContext, useContext } from 'react';
import type { MachineHealth } from '@/lib/domain';
import type { GarageRepo } from '@/lib/repo/types';
import type { EntryKind, FleetSnapshot, MachineFile, MemberRole, Org } from '@/lib/types';
import type { ShowroomEffect } from '@/engine/types';
import type { SheetTab } from './helpers';

export type ModalSpec =
  | { type: 'entry'; machineId: string; kind?: EntryKind; entryId?: string; scheduleId?: string }
  | { type: 'machine'; machineId?: string }
  | { type: 'hours'; machineId: string }
  | { type: 'schedule'; machineId: string; scheduleId?: string }
  | { type: 'remove-entry'; machineId: string; entryId: string }
  | { type: 'archive'; machineId: string }
  | { type: 'delete-schedule'; machineId: string; scheduleId: string }
  | { type: 'excel' };

export interface UploadProgress {
  machineId: string;
  /** Fichier en cours (0 à total − 1). */
  index: number;
  total: number;
  name: string;
  phase: 'prep' | 'send';
  /** Avancement du fichier en cours (0 à 1). */
  progress: number;
}

export interface UploadOutcome {
  sent: number;
  photos: number;
  videos: number;
  documents: number;
  errors: string[];
}

export interface GarageApi {
  mode: 'cloud' | 'demo';
  org: Org;
  role: MemberRole;
  userId: string;
  today: string;
  fleet: FleetSnapshot;
  health: Map<string, MachineHealth>;
  files: Record<string, MachineFile | undefined>;
  /** Dépôt de données (à appeler dans un gestionnaire d'événement ou un effet). */
  repo: () => GarageRepo;
  /** Recharge le parc et, si donné, le dossier d'une machine. */
  refresh: (machineId?: string | null) => Promise<void>;
  toast: (message: string, tone?: 'ok' | 'error') => void;
  effect: (effect: ShowroomEffect) => void;
  animate: (machineId: string, action: 'wake' | 'service' | 'repair') => void;
  openModal: (modal: ModalSpec) => void;
  closeModal: () => void;
  openSheet: (machineId: string, tab?: SheetTab) => void;
  setTab: (tab: SheetTab) => void;
  openLightbox: (machineId: string, mediaId: string) => void;
  /** Prépare et envoie des fichiers (compression des photos, contrôle des vidéos), avec progression. */
  upload: (machineId: string, files: File[], opts?: { entryId?: string | null; caption?: string | null }) => Promise<UploadOutcome>;
  uploads: UploadProgress | null;
  /** Élément à mettre en lumière après un enregistrement (id de saisie, d'échéance ou de média). */
  flash: string | null;
  setFlash: (id: string | null) => void;
}

export const GarageContext = createContext<GarageApi | null>(null);

export function useGarage(): GarageApi {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error('useGarage doit être utilisé dans le garage');
  return ctx;
}
