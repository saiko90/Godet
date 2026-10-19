// Contrat du moteur 3D « showroom ». L'interface React (src/components/garage) ne connaît que ce fichier ;
// three.js reste enfermé dans src/engine et n'est chargé qu'à l'ouverture du garage (import dynamique).
import type { MachineKind } from '@/lib/types';

export type MachineState = 'ok' | 'warn' | 'bad';
export type ShowroomQuality = 'high' | 'medium' | 'low';

/** Une machine telle que le showroom l'affiche. */
export interface ShowroomMachine {
  id: string;
  /** « PE-01 » : marquage au sol de la baie et étiquette flottante. */
  code: string;
  kind: MachineKind;
  /** Peinture de la carrosserie, « #f3b71b ». */
  color: string;
  /** « Pelle 21 t » : sous-titre de l'étiquette. */
  label: string;
  /** Pastille d'état et teinte de l'éclairage de la baie. */
  state: MachineState;
  alerts: number;
  /** Sert à l'échelle du modèle (une pelle de 40 t est plus grande qu'une de 14 t). */
  weightT?: number | null;
}

/** Parties de l'écran couvertes par l'interface, en pixels CSS. */
export interface ShowroomInsets {
  top: number;
  right: number;
  bottom: number;
}

export interface ShowroomOptions {
  canvas: HTMLCanvasElement;
  /** Couche HTML posée sur le canvas, pour les étiquettes flottantes (le moteur y crée ses éléments). */
  labels?: HTMLElement | null;
  machines: ShowroomMachine[];
  quality?: ShowroomQuality | 'auto';
  reducedMotion?: boolean;
  sound?: boolean;
  /** Nom de l'entreprise, affiché sur l'enseigne lumineuse du hall. */
  signage?: string;
  /** Avancement de la construction de la scène (0 à 1) et étape en cours, pour l'écran de chargement. */
  onProgress?: (progress: number, label: string) => void;
  /** Clic ou toucher sur une machine (null : clic dans le vide). */
  onSelect?: (id: string | null) => void;
  /** La caméra est arrivée devant une machine (null : vue d'ensemble). */
  onFocus?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  /** Le moteur a baissé (ou monté) la qualité tout seul pour garder la fluidité. */
  onQualityChange?: (quality: ShowroomQuality) => void;
  /** Le contexte WebGL a été perdu (pilote, mémoire) : l'interface peut proposer le mode atelier. */
  onContextLost?: () => void;
}

export type ShowroomEffect = 'save' | 'open' | 'close' | 'alert' | 'tick' | 'photo' | 'whoosh';

export interface Showroom {
  /** Met à jour le parc : ajout, retrait, peinture ou état modifiés, avec transition. */
  setMachines(machines: ShowroomMachine[]): void;
  /** Vol de caméra jusque devant une machine ; null : vue d'ensemble du hall. */
  focus(id: string | null, opts?: { instant?: boolean }): void;
  /** Machine suivante / précédente dans l'allée (en boucle). */
  next(): void;
  prev(): void;
  /** Machine devant laquelle se trouve la caméra. */
  focused(): string | null;
  /** Zones masquées par l'interface (fiche à droite ou en bas) : la machine reste centrée dans la partie visible. */
  setInsets(insets: Partial<ShowroomInsets>): void;
  /** Allumage du hall, néon après néon. Appeler après un geste (clic) pour que le son puisse démarrer. */
  intro(): Promise<void>;
  /** À appeler dans un gestionnaire de clic : les navigateurs n'autorisent le son qu'après un geste. */
  unlockAudio(): void;
  setSound(on: boolean): void;
  /** Effet sonore et lumineux ponctuel (enregistrement, ouverture de fiche, alerte…). */
  play(effect: ShowroomEffect): void;
  /** Petite mise en scène sur une machine : réveil (bras qui bouge, gyrophare), service, réparation. */
  animate(id: string, action: 'wake' | 'service' | 'repair'): void;
  setQuality(quality: ShowroomQuality | 'auto'): void;
  /** Suspend le rendu (mode atelier, onglet masqué) puis le reprend. */
  pause(): void;
  resume(): void;
  /** Image PNG de la vue actuelle. */
  snapshot(): Promise<Blob | null>;
  dispose(): void;
}

export type CreateShowroom = (options: ShowroomOptions) => Promise<Showroom>;
