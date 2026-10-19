// Point d'entrée du moteur 3D « showroom » (chargé à la demande : `await import('@/engine')`).
// Contrat : ./types.ts. Seul ce dossier importe three.js.
import './engine.css';
import { createShowroomImpl } from './showroom';
import type { CreateShowroom } from './types';

export type * from './types';

/** Le navigateur sait-il afficher de la 3D (WebGL 2) ? */
export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return false;
    // on rend tout de suite ce contexte d'essai (les navigateurs limitent le nombre de contextes)
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Construit le showroom dans le canvas (progression via onProgress), puis rend la main. */
export const createShowroom: CreateShowroom = (options) => createShowroomImpl(options);
