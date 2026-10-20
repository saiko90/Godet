'use client';

// Laboratoire du showroom 3D : charge le moteur à la demande, puis donne accès à toutes ses fonctions.
// Paramètres d'URL (tests automatisés, rendu logiciel très lent) :
//   n=8          nombre de machines            kinds=pelle,grue  types imposés
//   q=high       qualité (auto, high, medium, low)
//   test=1       pas de temps sans plafond, qualité figée, coupes nettes, son coupé (état final rapidement)
//   focus=2      machine visée (rang)           sheet=1           fiche simulée ouverte
//   overview=1   vue d'ensemble allumée         intro=1           allumage animé
//   reduced=1    mouvement réduit               wake=1            réveil de la machine visée
//   standby=1    (avec test=1) hall laissé éteint, avant l'allumage
//   dt=0.066     (avec test=1) pas de temps fixe par image : filmer un vol image par image
//   signage=…    nom sur l'enseigne
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Loader } from '@/components/Loader';
import { weightText } from '@/components/garage/text';
import { applyShowroomTexts, engineStep, type EngineStep } from '@/components/garage/useShowroom';
import { MACHINE_KIND_ORDER } from '@/lib/machine-kinds';
import type { MachineKind } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';
import type { MachineState, Showroom, ShowroomEffect, ShowroomMachine, ShowroomQuality } from '@/engine/types';
import { demoFleet, isLaboModel, type LaboModel } from './fleet';
import './labo.css';

interface Params {
  n: number;
  q: ShowroomQuality | 'auto';
  test: boolean;
  intro: boolean;
  overview: boolean;
  focus: number | null;
  sheet: boolean;
  reduced: boolean;
  wake: boolean;
  standby: boolean;
  dt: number | null;
  kinds: MachineKind[] | undefined;
  signage: string;
}

const KINDS: readonly MachineKind[] = MACHINE_KIND_ORDER;
const QUALITIES: (ShowroomQuality | 'auto')[] = ['auto', 'high', 'medium', 'low'];
const EFFECTS: ShowroomEffect[] = ['save', 'open', 'close', 'alert', 'tick', 'photo', 'whoosh'];
const COUNTS = [1, 3, 8, 20];
const PAINTS = ['#f3b71b', '#f07c1a', '#e9e6df', '#3b4047', '#2f6f4e', '#a83a32'];
const STATES: MachineState[] = ['ok', 'warn', 'bad'];

function readParams(defaultSignage: string): Params {
  const sp = new URLSearchParams(window.location.search);
  const num = (k: string) => {
    const v = sp.get(k);
    return v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);
  };
  const q = sp.get('q');
  const kinds = (sp.get('kinds') ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k): k is MachineKind => (KINDS as string[]).includes(k));
  return {
    n: Math.max(1, Math.min(30, num('n') ?? 8)),
    q: q === 'high' || q === 'medium' || q === 'low' || q === 'auto' ? q : 'auto',
    test: sp.get('test') === '1',
    intro: sp.get('intro') === '1',
    overview: sp.get('overview') === '1',
    focus: num('focus'),
    sheet: sp.get('sheet') === '1',
    reduced: sp.get('reduced') === '1',
    wake: sp.get('wake') === '1',
    standby: sp.get('standby') === '1',
    dt: num('dt'),
    kinds: kinds.length ? kinds : undefined,
    signage: sp.get('signage') ?? defaultSignage,
  };
}

/** Zones couvertes par l'interface : la barre du labo en haut, la fiche à droite (ordinateur) ou en bas (téléphone). */
function sheetInsets(open: boolean): { top: number; right: number; bottom: number } {
  const bar = document.querySelector('.labo-bar') as HTMLElement | null;
  const top = Math.round((bar?.getBoundingClientRect().height ?? 100) * 0.8);
  if (!open) return { top, right: 0, bottom: 0 };
  if (window.innerWidth < 760) return { top, right: 0, bottom: Math.round(window.innerHeight * 0.5) };
  return { top, right: 420 + 16, bottom: 0 };
}

export function Labo() {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  // Modèles du labo nommés (garage.labo.models), sinon nom court du type de machine.
  const label = useCallback(
    (name: LaboModel | MachineKind, weight: number) =>
      t('labo.label', {
        name: isLaboModel(name) ? t(`labo.models.${name}`) : dt.kindShort(name),
        weight: weightText(f, weight),
      }),
    [t, f, dt],
  );
  const labelRef = useRef(label);
  const tRef = useRef(t);
  useEffect(() => {
    labelRef.current = label;
    tRef.current = t;
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const showroomRef = useRef<Showroom | null>(null);
  const fleetRef = useRef<ShowroomMachine[]>([]);
  const sheetRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<EngineStep>('engine');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fleet, setFleet] = useState<ShowroomMachine[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [quality, setQualityState] = useState<ShowroomQuality | 'auto'>('auto');
  const [autoLevel, setAutoLevel] = useState<ShowroomQuality | null>(null);
  const [sound, setSoundState] = useState(true);
  const [lit, setLit] = useState(false);
  const [paused, setPaused] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [tools, setTools] = useState(false);

  const openSheet = useCallback((open: boolean) => {
    sheetRef.current = open;
    setSheet(open);
    showroomRef.current?.setInsets(sheetInsets(open));
  }, []);

  useEffect(() => {
    let disposed = false;
    let instance: Showroom | null = null;
    const p = readParams(tRef.current('labo.signage'));
    const run = async () => {
      if (p.test) {
        const { setEngineDebug } = await import('@/engine/debug');
        setEngineDebug({ maxDt: p.dt ?? Infinity, fixedDt: p.dt ?? 0, noAutoQuality: true, verbose: true, noIdle: true });
      }
      const engine = await import('@/engine');
      if (disposed) return;
      if (!engine.webglAvailable()) {
        setError(tRef.current('labo.noWebgl'));
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const tt = tRef.current;
      applyShowroomTexts(canvas, labelsRef.current, {
        canvas: tt('labo.canvas'),
        signageSub: tt('engine.signage'),
        signageFallback: tt('engine.signageFallback'),
        alertOne: tt('engine.alertOne'),
        alertOther: tt('engine.alertOther'),
      });
      const machines = demoFleet(p.n, labelRef.current, p.kinds);
      fleetRef.current = machines;
      setFleet(machines);
      setQualityState(p.q);
      setSoundState(!p.test);
      const s = await engine.createShowroom({
        canvas,
        labels: labelsRef.current,
        machines,
        quality: p.q,
        reducedMotion: p.reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        sound: !p.test,
        signage: p.signage,
        onProgress: (v) => {
          if (disposed) return;
          setProgress(v);
          setStep(engineStep(v));
        },
        onSelect: (id) => {
          const sr = showroomRef.current;
          if (!sr) return;
          if (id) {
            sr.focus(id);
            sr.play('open');
          } else {
            sr.focus(null);
            if (sheetRef.current) openSheet(false);
          }
        },
        onFocus: (id) => setFocused(id),
        onHover: (id) => setHover(id),
        onQualityChange: (q) => setAutoLevel(q),
        onContextLost: () => setError(tRef.current('labo.contextLost')),
      });
      if (disposed) {
        s.dispose();
        return;
      }
      instance = s;
      showroomRef.current = s;
      // accès pour les tests automatisés (page de développement uniquement)
      (window as unknown as { __godetShowroom?: Showroom }).__godetShowroom = s;
      s.setInsets(sheetInsets(sheetRef.current));
      setReady(true);
      if (p.focus !== null) {
        const m = machines[Math.max(0, Math.min(machines.length - 1, p.focus))];
        if (p.sheet) openSheet(true);
        s.focus(m.id, { instant: p.test });
        setLit(true);
        if (p.wake) s.animate(m.id, 'wake');
      } else if (p.overview || (p.test && !p.standby)) {
        if (p.sheet) openSheet(true);
        s.focus(null, { instant: p.test });
        setLit(true);
      }
      if (p.intro) {
        setLit(true);
        await s.intro();
      }
    };
    run().catch((err: unknown) => {
      if (!disposed) setError(err instanceof Error ? err.message : String(err));
    });
    const onResize = () => showroomRef.current?.setInsets(sheetInsets(sheetRef.current));
    window.addEventListener('resize', onResize);
    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      instance?.dispose();
      showroomRef.current = null;
    };
  }, [openSheet]);

  // clavier : géré par l'interface (le moteur ne l'écoute pas)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = showroomRef.current;
      if (!s || (e.target as HTMLElement)?.closest?.('input, select, textarea')) return;
      if (e.key === 'ArrowRight') s.next();
      else if (e.key === 'ArrowLeft') s.prev();
      else if (e.key === 'Escape') {
        s.focus(null);
        openSheet(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSheet]);

  const s = () => showroomRef.current;
  const current = fleet.find((m) => m.id === focused) ?? null;

  const updateFleet = (next: ShowroomMachine[]) => {
    fleetRef.current = next;
    setFleet(next);
    s()?.setMachines(next);
  };

  const enter = () => {
    const sr = s();
    if (!sr) return;
    sr.unlockAudio();
    setLit(true);
    void sr.intro();
  };

  const capture = async () => {
    const sr = s();
    if (!sr) return;
    sr.play('photo');
    const blob = await sr.snapshot();
    if (!blob) return;
    setShot((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  };

  return (
    <div className="labo">
      <canvas ref={canvasRef} className="labo-canvas" aria-label={t('labo.canvas')} />
      <div ref={labelsRef} className="labo-labels" />

      <header className={`labo-bar${tools ? ' open' : ''}`}>
        <div className="labo-row labo-mobile">
          <button
            type="button"
            className="icon-btn"
            aria-expanded={tools}
            onClick={() => {
              setTools(!tools);
              requestAnimationFrame(() => showroomRef.current?.setInsets(sheetInsets(sheetRef.current)));
            }}
          >
            <Icon name="menu" />
            <span>{t('labo.tools')}</span>
          </button>
          <button type="button" className="icon-btn" onClick={() => s()?.prev()} aria-label={t('sheet.prev')}>
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="icon-btn" onClick={() => s()?.next()} aria-label={t('sheet.next')}>
            <Icon name="chevron-right" />
          </button>
          <button type="button" className="icon-btn" aria-pressed={sheet} onClick={() => openSheet(!sheet)} aria-label={t('labo.sheet')}>
            <Icon name="list" />
          </button>
        </div>
        <div className="labo-row labo-tools">
          {!lit ? (
            <button type="button" className="btn btn-primary" onClick={enter} disabled={!ready}>
              <Icon name="power" />
              {t('labo.enter')}
            </button>
          ) : null}
          <div className="seg" role="group" aria-label={t('labo.count')}>
            {COUNTS.map((n) => (
              <button key={n} type="button" aria-pressed={fleet.length === n} onClick={() => updateFleet(demoFleet(n, label))}>
                {n}
              </button>
            ))}
          </div>
          <button type="button" className="icon-btn" onClick={() => s()?.prev()} aria-label={t('sheet.prev')}>
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="icon-btn" onClick={() => s()?.next()} aria-label={t('sheet.next')}>
            <Icon name="chevron-right" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              s()?.focus(null);
              openSheet(false);
            }}
          >
            <Icon name="garage" />
            <span className="lbl">{t('labo.overview')}</span>
          </button>
          <button type="button" className="icon-btn" aria-pressed={sheet} onClick={() => openSheet(!sheet)}>
            <Icon name="list" />
            <span className="lbl">{t('labo.sheet')}</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              const q = QUALITIES[(QUALITIES.indexOf(quality) + 1) % QUALITIES.length];
              setQualityState(q);
              setAutoLevel(null);
              s()?.setQuality(q);
            }}
          >
            <Icon name="gauge" />
            <span className="lbl">
              {t(`quality.${quality}`)}
              {quality === 'auto' && autoLevel ? ` → ${autoLevel}` : ''}
            </span>
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={sound}
            aria-label={sound ? t('topbar.soundOff') : t('topbar.soundOn')}
            onClick={() => {
              s()?.unlockAudio();
              s()?.setSound(!sound);
              setSoundState(!sound);
            }}
          >
            <Icon name={sound ? 'sound' : 'mute'} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={paused}
            onClick={() => {
              if (paused) s()?.resume();
              else s()?.pause();
              setPaused(!paused);
            }}
          >
            <span className="lbl">{paused ? t('labo.resume') : t('labo.pause')}</span>
          </button>
          <button type="button" className="icon-btn" onClick={capture}>
            <Icon name="camera" />
            <span className="lbl">{t('labo.capture')}</span>
          </button>
        </div>
        <div className="labo-row labo-tools">
          <label className="labo-select">
            <span>{t('labo.effect')}</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as ShowroomEffect | '';
                if (v) s()?.play(v);
                e.target.value = '';
              }}
            >
              <option value="">{t('labo.choose')}</option>
              {EFFECTS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          {(['wake', 'service', 'repair'] as const).map((a) => (
            <button key={a} type="button" className="btn btn-soft labo-small" disabled={!focused} onClick={() => focused && s()?.animate(focused, a)}>
              {t(`labo.${a}`)}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-soft labo-small"
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const color = PAINTS[(PAINTS.indexOf(current.color) + 1) % PAINTS.length];
              updateFleet(fleetRef.current.map((m) => (m.id === current.id ? { ...m, color } : m)));
            }}
          >
            {t('labo.repaint')}
          </button>
          <button
            type="button"
            className="btn btn-soft labo-small"
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const state = STATES[(STATES.indexOf(current.state) + 1) % STATES.length];
              updateFleet(fleetRef.current.map((m) => (m.id === current.id ? { ...m, state, alerts: state === 'ok' ? 0 : state === 'warn' ? 1 : 3 } : m)));
            }}
          >
            {t('labo.state')}
          </button>
          <button
            type="button"
            className="btn btn-soft labo-small"
            disabled={fleet.length >= 30}
            onClick={() => updateFleet(demoFleet(fleet.length + 1, label))}
          >
            {t('labo.addMachine')}
          </button>
          <button
            type="button"
            className="btn btn-soft labo-small"
            disabled={fleet.length <= 1}
            onClick={() => updateFleet(fleetRef.current.slice(0, -1))}
          >
            {t('labo.removeMachine')}
          </button>
          <p className="labo-status" aria-live="polite">
            {[
              t('labo.machines', { count: fleet.length, n: f.num(fleet.length) }),
              current ? t('labo.aimed', { code: current.code }) : t('labo.overviewStatus'),
              hover ? t('labo.hover', { code: fleet.find((m) => m.id === hover)?.code ?? '' }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>

      {sheet ? (
        <aside className="labo-sheet" aria-label={t('labo.sheetTitle')}>
          <p className="eyebrow">{t('labo.sheetTitle')}</p>
          <h2>{current ? current.code : t('labo.noMachine')}</h2>
          <p className="muted">{current ? current.label : t('labo.touch')}</p>
          <p className="muted">{t('labo.centered')}</p>
        </aside>
      ) : null}

      {shot ? (
        <a className="labo-shot" href={shot} download="godet-showroom.png" title={t('labo.download')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt={t('labo.shotAlt')} />
        </a>
      ) : null}

      {error ? (
        <div className="labo-error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <Loader progress={progress} label={t(`loader.${step}`)} done={ready || !!error} />
    </div>
  );
}
