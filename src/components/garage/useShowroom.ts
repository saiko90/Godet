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
export type EngineFailure = 'no-webgl' | 'load' | 'start' | 'context-lost' | 'memory';
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

// Garde-fou mémoire : un téléphone à court de mémoire tue l'onglet pendant la construction de la scène, sans
// aucun événement. Chaque démarrage est noté avant la construction et effacé une fois la 3D stable : un démarrage
// resté noté au chargement suivant veut dire que l'onglet a été tué. Après un échec, la 3D redémarre en qualité
// basse ; après deux, le garage s'ouvre en mode atelier (la 3D reste à un clic : « Réessayer la 3D »).
// v2 : compteur remis à zéro (les plantages d'avant venaient de la qualité haute, désormais exclue sur écran tactile).
const GUARD_KEY = 'godet-3d-demarrage-v2';
const GUARD_TTL = 24 * 60 * 60 * 1000;
const STABLE_AFTER = 15_000;

function readGuard(): number {
  try {
    const raw = window.localStorage.getItem(GUARD_KEY);
    if (!raw) return 0;
    const [n, at] = raw.split(':').map(Number);
    return Number.isFinite(n) && Number.isFinite(at) && Date.now() - at < GUARD_TTL ? n : 0;
  } catch {
    return 0;
  }
}

function writeGuard(n: number): void {
  try {
    if (n <= 0) window.localStorage.removeItem(GUARD_KEY);
    else window.localStorage.setItem(GUARD_KEY, `${n}:${Date.now()}`);
  } catch {
    // Stockage indisponible : pas de garde-fou, la 3D démarre normalement.
  }
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
  /** Qualité basse imposée après un démarrage interrompu (onglet tué faute de mémoire). */
  const [forcedLow, setForcedLow] = useState(false);
  const forcedLowRef = useRef(false);
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
    let stableTimer: number | undefined;
    const markStable = () => writeGuard(0);

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
      // Démarrages interrompus : deux de suite → mode atelier ; un → qualité basse.
      const crashed = attempt === 0 ? readGuard() : 0;
      if (crashed >= 2) {
        fail('memory');
        return;
      }
      // Écran tactile (téléphone, tablette) : qualité basse imposée, quel que soit le réglage enregistré.
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch) forcedLowRef.current = true;
      const low = crashed === 1 || forcedLowRef.current || latest.current.quality === 'low';
      if (crashed === 1) {
        forcedLowRef.current = true;
        setForcedLow(true);
      }
      writeGuard(crashed + 1);
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
          quality: low ? 'low' : o.quality,
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
        // La scène tourne : le démarrage est réussi au bout de quelques secondes (ou quand on quitte la page).
        stableTimer = window.setTimeout(markStable, STABLE_AFTER);
        window.addEventListener('pagehide', markStable);
      } catch {
        writeGuard(0);
        fail('start');
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(stableTimer);
      window.removeEventListener('pagehide', markStable);
      if (instance) writeGuard(0);
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
    // `attempt` relance la construction (bouton « Réessayer la 3D ») ; une relance ignore le garde-fou.
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
    // Qualité basse imposée (démarrage interrompu, écran tactile) : elle prime sur tout réglage, même « haute ».
    if (ready) showroom.current?.setQuality(forcedLow || forcedLowRef.current ? 'low' : quality);
  }, [ready, quality, forcedLow]);
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
    // Après un manque de mémoire, la nouvelle tentative démarre en qualité basse.
    if (failure === 'memory' || failure === 'context-lost') {
      forcedLowRef.current = true;
      setForcedLow(true);
    }
    setFailure(null);
    setStatus('loading');
    setProgress(0);
    setStep('opening');
    setAttempt((a) => a + 1);
  }

  return { showroom, status, failure, progress, step, retry };
}
