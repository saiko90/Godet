'use client';

// Cycle de vie du showroom 3D, codé uniquement contre le contrat src/engine/types.ts.
// - le canvas et la couche d'étiquettes sont créés ici, une fois par tentative : aucun rendu React ne les recrée ;
// - le moteur est importé à la demande (`await import('@/engine')`), puis construit avec `createShowroom` ;
// - tout échec (pas de WebGL, import, démarrage, contexte perdu) est rapporté : l'interface passe en mode atelier.
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Showroom, ShowroomMachine, ShowroomQuality } from '@/engine/types';
import { hasWebGL2, type QualityPref } from './prefs';

export type EngineStatus = 'loading' | 'ready' | 'failed';
export type EngineFailure = 'no-webgl' | 'load' | 'start' | 'context-lost';

export interface ShowroomHandlers {
  onSelect: (id: string | null) => void;
  onFocus: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onQualityChange: (quality: ShowroomQuality) => void;
  onContextLost: () => void;
}

export interface ShowroomOptionsIn {
  host: RefObject<HTMLDivElement | null>;
  /** Le parc est chargé : la scène peut se construire. */
  enabled: boolean;
  machines: ShowroomMachine[];
  signage: string;
  quality: QualityPref;
  sound: boolean;
  reducedMotion: boolean;
  /** Mode atelier affiché ou onglet masqué : le rendu est suspendu. */
  paused: boolean;
  handlers: ShowroomHandlers;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export function useShowroom(opts: ShowroomOptionsIn) {
  const showroom = useRef<Showroom | null>(null);
  const latest = useRef(opts);
  /** État de pause transmis au moteur en cours (un nouveau moteur démarre en marche). */
  const pausedRef = useRef(false);
  const [status, setStatus] = useState<EngineStatus>('loading');
  const [failure, setFailure] = useState<EngineFailure | null>(null);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Ouverture du garage…');
  const [attempt, setAttempt] = useState(0);
  const { host, enabled } = opts;

  useEffect(() => {
    latest.current = opts;
  });

  useEffect(() => {
    if (!enabled) return;
    const root = host.current;
    if (!root) return;
    let cancelled = false;
    let instance: Showroom | null = null;

    const canvas = document.createElement('canvas');
    canvas.id = 'scene';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      'Garage 3D du parc d’engins. Les machines sont aussi accessibles depuis la liste en bas de l’écran et en mode atelier.',
    );
    const labels = document.createElement('div');
    labels.id = 'labels';
    labels.setAttribute('aria-hidden', 'true');
    root.append(canvas, labels);

    const fail = (kind: EngineFailure) => {
      if (cancelled) return;
      setFailure(kind);
      setStatus('failed');
    };

    (async () => {
      // Laisse l'écran de chargement s'afficher avant le travail lourd.
      await nextFrame();
      if (cancelled) return;
      if (!hasWebGL2()) {
        fail('no-webgl');
        return;
      }
      setLabel('Chargement du moteur 3D…');
      setProgress(0.05);
      let engine: typeof import('@/engine');
      try {
        engine = await import('@/engine');
      } catch {
        fail('load');
        return;
      }
      if (cancelled) return;
      setProgress(0.15);
      setLabel('Construction du hall…');
      const o = latest.current;
      try {
        const sr = await engine.createShowroom({
          canvas,
          labels,
          machines: o.machines,
          quality: o.quality,
          reducedMotion: o.reducedMotion,
          sound: o.sound,
          signage: o.signage,
          onProgress: (p, step) => {
            if (cancelled) return;
            setProgress(0.15 + 0.85 * clamp01(p));
            if (step) setLabel(step);
          },
          onSelect: (id) => {
            if (!cancelled) latest.current.handlers.onSelect(id);
          },
          onFocus: (id) => {
            if (!cancelled) latest.current.handlers.onFocus(id);
          },
          onHover: (id) => {
            if (!cancelled) latest.current.handlers.onHover(id);
          },
          onQualityChange: (q) => {
            if (!cancelled) latest.current.handlers.onQualityChange(q);
          },
          onContextLost: () => {
            if (cancelled) return;
            latest.current.handlers.onContextLost();
            fail('context-lost');
            if (showroom.current === instance) showroom.current = null;
          },
        });
        if (cancelled) {
          sr.dispose();
          return;
        }
        instance = sr;
        showroom.current = sr;
        pausedRef.current = false;
        // Parc, qualité, son et pause sont synchronisés par les effets ci-dessous dès l'état « prêt ».
        setProgress(1);
        setStatus('ready');
      } catch {
        fail('start');
      }
    })();

    return () => {
      cancelled = true;
      if (showroom.current === instance) showroom.current = null;
      if (instance) {
        try {
          instance.dispose();
        } catch {
          // Le moteur est déjà arrêté.
        }
      }
      canvas.remove();
      labels.remove();
    };
  }, [enabled, attempt, host]);

  // Parc, qualité, son et pause suivent l'interface.
  const ready = status === 'ready';
  const { machines, quality, sound, paused } = opts;
  useEffect(() => {
    if (ready) showroom.current?.setMachines(machines);
  }, [ready, machines]);
  useEffect(() => {
    if (ready) showroom.current?.setQuality(quality);
  }, [ready, quality]);
  useEffect(() => {
    if (ready) showroom.current?.setSound(sound);
  }, [ready, sound]);
  useEffect(() => {
    const sr = showroom.current;
    if (!ready || !sr) return;
    if (paused === pausedRef.current) return;
    pausedRef.current = paused;
    if (paused) sr.pause();
    else sr.resume();
  }, [ready, paused]);

  /** Nouvelle tentative (bouton « Réessayer la 3D ») : nouveau canvas, nouveau contexte. */
  function retry() {
    setFailure(null);
    setStatus('loading');
    setProgress(0);
    setLabel('Ouverture du garage…');
    setAttempt((a) => a + 1);
  }

  return { showroom, status, failure, progress, label, retry };
}
