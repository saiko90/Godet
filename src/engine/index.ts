// Point d'entrée du moteur 3D (chargé à la demande : `await import('@/engine')`).
// Implémentation provisoire : le moteur complet remplace ce fichier.
import type { CreateShowroom } from './types';

export type * from './types';

/** Le navigateur sait-il afficher de la 3D (WebGL 2) ? */
export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2'));
  } catch {
    return false;
  }
}

export const createShowroom: CreateShowroom = async () => {
  throw new Error('Moteur 3D en cours de construction');
};
