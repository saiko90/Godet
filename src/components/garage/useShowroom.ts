'use client';

// Cycle de vie du showroom 3D, codé uniquement contre le contrat src/engine/types.ts.
// - le canvas et la couche d'étiquettes sont créés ici, une fois par tentative : aucun rendu React ne les recrée ;
// - le moteur est importé à la demande (`await import('@/engine')`), puis construit avec `createShowroom` ;
// - tout échec (pas de WebGL, import, démarrage, contexte perdu) est rapporté : l'interface passe en mode atelier.
// - textes : l'écran de chargement affiche une étape (clé de garage.loader.*) déduite de l'avancement ; l'enseigne et
//   l'infobulle des alertes reçoivent leurs textes par des attributs data-* du canvas et de la couche d'étiquettes.
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Showroom, ShowroomMachine, ShowroomQuality } from '@/engine/types';
import { hasWebGL2, type QualityPref } from './prefs';

export type EngineStatus = 'loading' | 'ready' | 'failed';
export type EngineFailure = 'no-webgl' | 'load' | 'start' | 'context-lost';
/** Étapes du chargement (libellés : garage.loader.*). */
export type EngineStep = 'opening' | 'engine' | 'building' | 'hall' | 'machines' | 'lights' | 'materials' | 'ready';

/** Textes que le moteur affiche, dans la langue de l'interface. */
export interface ShowroomTexts {
  /** Description du canvas pour les lecteurs d'écran. */
  canvas: string;
  /** Sous-titre de l'enseigne (« Parc d’engins · Godet ») et nom affiché sans entreprise. */
  signageSub: string;
  signageFallback: string;
  /** Infobulle du nombre d'alertes : « # alerte », « # alertes » (# = le nombre). */
  alertOne: string;
  alertOther: string;
}

/**
 * Étape affichée d'après l'avancement rapporté par le moteur (0 à 1) : mêmes paliers que la construction de la scène
 * (src/engine/showroom.ts : hall, machines, lumières, matériaux, prêt). Le libellé du moteur n'est pas affiché.
 */
export function engineStep(p: number): EngineStep {
  if (p >= 1) return 'ready';
  if (p >= 0.8) return 'materials';
  if (p >= 0.72) return 'lights';
  if (p >= 0.24) return 'machines';
  return 'hall';
}

/** Pose les textes du moteur sur le canvas et la couche d'étiquettes (lus par src/engine). */
export function applyShowroomTexts(canvas: HTMLCanvasElement, labels: HTMLElement | null, texts: ShowroomTexts) {
  canvas.setAttribute('aria-label', texts.canvas);
  canvas.dataset.signageSub = texts.signageSub;
  canvas.dataset.signageFallback = texts.signageFallback;
  if (labels) {
    labels.dataset.alertOne = texts.alertOne;
    labels.dataset.alertOther = texts.alertOther;
  }
}

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
  texts: ShowroomTexts;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export function useShowroom(opts: ShowroomOptionsIn) {
  const showroom = useRef<Showroom | null>(null);
  const elements = useRef<{ canvas: HTMLCanvasElement; labels: HTMLDivElement } | null>(null);
  const latest = useRef(opts);
  /** État de pause transmis au moteur en cours (un nouveau moteur démarre en marche). */
  const pausedRef = useRef(false);
  const [status, setStatus] = useState<EngineStatus>('loading');
  const [failure, setFailure] = useState<EngineFailure | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<EngineStep>('opening');
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
    const labels = document.createElement('div');
    labels.id = 'labels';
    labels.setAttribute('aria-hidden', 'true');
    applyShowroomTexts(canvas, labels, latest.current.texts);
    root.append(canvas, labels);
    elements.current = { canvas, labels };

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
      setStep('engine');
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
      setStep('building');
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
          onProgress: (p) => {
            if (cancelled) return;
            setProgress(0.15 + 0.85 * clamp01(p));
            setStep(engineStep(clamp01(p)));
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
      if (elements.current?.canvas === canvas) elements.current = null;
    };
  }, [enabled, attempt, host]);

  // Langue changée sans recréer la scène : description du canvas et infobulles suivent (l'enseigne garde son texte).
  const { texts } = opts;
  useEffect(() => {
    const el = elements.current;
    if (el) applyShowroomTexts(el.canvas, el.labels, texts);
  }, [texts]);

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
    setStep('opening');
    setAttempt((a) => a + 1);
  }

  return { showroom, status, failure, progress, step, retry };
}
