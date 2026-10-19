'use client';

// Préférences du garage gardées dans le navigateur (son, qualité 3D, première visite) et états de l'appareil
// (mouvement réduit, pointeur tactile, onglet masqué). Lues avec useSyncExternalStore : pas d'écart d'hydratation.
import { useCallback, useSyncExternalStore } from 'react';

export type QualityPref = 'auto' | 'high' | 'medium' | 'low';

export interface GaragePrefs {
  sound: boolean;
  quality: QualityPref;
  /** Le garage a déjà été allumé une fois sur cet appareil (/garage). */
  lit: boolean;
}

const KEYS: Record<keyof GaragePrefs, string> = {
  sound: 'godet-son',
  quality: 'godet-qualite',
  lit: 'godet-garage-allume',
};

const DEFAULTS: GaragePrefs = { sound: true, quality: 'auto', lit: false };
const QUALITIES: readonly QualityPref[] = ['auto', 'high', 'medium', 'low'];

let cache: GaragePrefs | null = null;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée, données bloquées) : la préférence vaut pour cette visite.
  }
}

function load(): GaragePrefs {
  const sound = read(KEYS.sound);
  const quality = read(KEYS.quality);
  return {
    sound: sound === null ? DEFAULTS.sound : sound !== 'false',
    quality: QUALITIES.includes(quality as QualityPref) ? (quality as QualityPref) : DEFAULTS.quality,
    lit: read(KEYS.lit) === '1',
  };
}

export function getPrefs(): GaragePrefs {
  if (!cache) cache = load();
  return cache;
}

export function setPref<K extends keyof GaragePrefs>(key: K, value: GaragePrefs[K]) {
  cache = { ...getPrefs(), [key]: value };
  write(KEYS[key], key === 'lit' ? (value ? '1' : '0') : String(value));
  listeners.forEach((l) => l());
}

function subscribePrefs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverPrefs = () => DEFAULTS;

export function usePrefs(): GaragePrefs {
  return useSyncExternalStore(subscribePrefs, getPrefs, serverPrefs);
}

/** Requête média suivie en direct (« (prefers-reduced-motion: reduce) », « (pointer: coarse) »…). */
export function useMedia(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const server = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(subscribe, snapshot, server);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}
const pageHidden = () => document.hidden;
const notHidden = () => false;

/** L'onglet est-il masqué (la 3D se met alors en pause) ? */
export function usePageHidden(): boolean {
  return useSyncExternalStore(subscribeVisibility, pageHidden, notHidden);
}

let webgl: boolean | null = null;

/** Le navigateur sait-il afficher de la 3D (WebGL 2) ? Le contexte d'essai est libéré aussitôt. */
export function hasWebGL2(): boolean {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    webgl = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}
