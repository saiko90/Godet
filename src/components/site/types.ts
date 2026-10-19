// Types partagés entre les actions serveur des pages de compte et leurs formulaires.
import type { MemberRole } from '@/lib/types';

/** Résultat d'une action simple (bouton) : message à afficher près du bouton. */
export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

/** État du formulaire de création de l'entreprise (/bienvenue). */
export interface BienvenueState {
  values: { nom: string; canton: string; demo: boolean };
  errors: { nom?: string; canton?: string };
  message: string | null;
}

/** État d'un formulaire des paramètres. */
export interface FormState {
  ok: boolean | null;
  message: string | null;
  errors: Record<string, string>;
  /** Incrémenté à chaque envoi réussi (permet de vider un formulaire). */
  done: number;
  /**
   * Valeurs envoyées, renvoyées en cas d'échec : React vide les champs d'un formulaire après chaque envoi,
   * le formulaire les réaffiche ainsi à côté du message d'erreur.
   */
  values?: Record<string, string>;
}

export const EMPTY_FORM: FormState = { ok: null, message: null, errors: {}, done: 0 };

/** Invitation en attente, telle qu'affichée dans les paramètres. */
export interface PendingInvitation {
  id: string;
  email: string;
  role: MemberRole;
  token: string;
  createdAt: string;
  expiresAt: string;
}

/** Résultat de la création d'une invitation. */
export interface InviteState extends FormState {
  invitation: PendingInvitation | null;
  /** L'invitation existait déjà (on renvoie son lien). */
  existing: boolean;
}

export const EMPTY_INVITE: InviteState = { ...EMPTY_FORM, invitation: null, existing: false };

/** Machine archivée, telle qu'affichée dans les paramètres. */
export interface ArchivedMachine {
  id: string;
  code: string;
  title: string;
  makeModel: string;
  archivedAt: string;
  /** Aucun engin actif ne porte le même code : la machine peut revenir au garage. */
  codeFree: boolean;
}

/** État d'un formulaire qui ne renvoie qu'un message d'erreur (sinon il redirige). */
export interface MessageState {
  message: string | null;
}
