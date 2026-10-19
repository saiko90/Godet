'use client';

// Le garage : showroom 3D, barre du haut, dock, fiche machine, modales, mode atelier.
// Mêmes composants pour /garage (dépôt Supabase) et /demo (dépôt en mémoire) : seul `makeRepo` change.
import './garage.css';
import Link from 'next/link';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { Loader } from '@/components/Loader';
import { can, costTotals, machineHealth, machineTitle, type MachineHealth } from '@/lib/domain';
import { todayISO } from '@/lib/format';
import { prepareUpload, UploadRejected, type UploadProgressOptions } from '@/lib/media';
import type { GarageRepo } from '@/lib/repo/types';
import type { FleetSnapshot, MachineFile, MediaItem } from '@/lib/types';
import type { Showroom, ShowroomEffect, ShowroomMachine } from '@/engine/types';
import { Atelier } from './Atelier';
import { GarageContext, type GarageApi, type ModalSpec, type UploadOutcome, type UploadProgress } from './context';
import { Dock } from './Dock';
import { EntryModal } from './EntryModal';
import { canDeleteMedia, errorText, type SheetTab } from './helpers';
import { Lightbox } from './Lightbox';
import { ArchiveModal, DeleteScheduleModal, HoursModal, MachineModal, RemoveEntryModal, ScheduleModal } from './Modals';
import { setPref, useMedia, usePageHidden, usePrefs, type QualityPref } from './prefs';
import { Sheet } from './Sheet';
import { QUALITY_LABEL, Topbar } from './Topbar';
import { Toast } from './ui';
import { useShowroom } from './useShowroom';
import { Welcome } from './Welcome';

export interface GarageAppProps {
  mode: 'cloud' | 'demo';
  /** Crée le dépôt de données (appelé une fois, dans le navigateur). */
  makeRepo: () => GarageRepo;
  /** Nom affiché avant le chargement du parc (démo) ; ensuite celui de l'entreprise. */
  orgName: string;
  /** Parc chargé côté serveur (cloud) ; null : chargé dans le navigateur (démo). */
  initialFleet: FleetSnapshot | null;
  /** Lien profond /garage?m=<id> : machine à ouvrir. */
  initialMachineId: string | null;
  person?: { name: string | null; email: string | null } | null;
  onSignOut?: () => void;
}

const QUALITY_ORDER: QualityPref[] = ['auto', 'high', 'medium', 'low'];
const REFRESH_AFTER_HIDDEN = 30 * 60 * 1000;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function takenAt(file: File): string | undefined {
  const t = file.lastModified;
  return t && t < Date.now() + 60_000 ? new Date(t).toISOString() : undefined;
}

export function GarageApp({ mode, makeRepo, orgName, initialFleet, initialMachineId, person, onSignOut }: GarageAppProps) {
  const repoRef = useRef<GarageRepo | null>(null);
  const getRepo = () => {
    if (!repoRef.current) repoRef.current = makeRepo();
    return repoRef.current;
  };

  const [today] = useState(todayISO);
  const [fleet, setFleet] = useState<FleetSnapshot | null>(initialFleet);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, MachineFile | undefined>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string | undefined>>({});
  const [shownId, setShownId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<SheetTab>('apercu');
  const [tall, setTall] = useState(false);
  const [atelier, setAtelier] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [clicked, setClicked] = useState(false);
  const [welcomeGone, setWelcomeGone] = useState(false);
  const [dockReady, setDockReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [selectedOnce, setSelectedOnce] = useState(false);
  const [modal, setModal] = useState<ModalSpec | null>(null);
  const [lightbox, setLightbox] = useState<{ machineId: string; mediaId: string } | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'ok' | 'error' } | null>(null);
  const [uploads, setUploads] = useState<UploadProgress | null>(null);
  const [flash, setFlashState] = useState<string | null>(null);

  const prefs = usePrefs();
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const coarse = useMedia('(pointer: coarse)');
  const hidden = usePageHidden();

  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const toastSeq = useRef(0);
  const flashTimer = useRef<number | undefined>(undefined);
  const lastFocus = useRef<string | null | undefined>(null);
  const introFor = useRef<Showroom | null>(null);
  const hiddenAt = useRef<number | null>(null);
  const lastInsets = useRef('');

  // ------------------------------------------------------------------ données dérivées

  const health = useMemo(() => {
    const map = new Map<string, MachineHealth>();
    if (!fleet) return map;
    for (const m of fleet.machines) map.set(m.id, machineHealth(m, fleet.schedules, fleet.openRepairs, fleet.readings, today));
    return map;
  }, [fleet, today]);

  const showroomMachines = useMemo<ShowroomMachine[]>(
    () =>
      (fleet?.machines ?? []).map((m) => {
        const h = health.get(m.id);
        return {
          id: m.id,
          code: m.code,
          kind: m.kind,
          color: m.color,
          label: machineTitle(m),
          state: h?.state ?? 'ok',
          alerts: h?.alerts ?? 0,
          weightT: m.weight_t != null ? Number(m.weight_t) : null,
        };
      }),
    [fleet, health],
  );

  const alerts = useMemo(() => [...health.values()].reduce((s, h) => s + h.alerts, 0), [health]);
  const cost12 = useMemo(() => (fleet ? costTotals(fleet.recentEntries, today).total : null), [fleet, today]);
  const machines = fleet?.machines ?? [];
  const shownMachine = machines.find((m) => m.id === shownId) ?? null;
  const sheetVisible = sheetOpen && Boolean(shownMachine);

  // ------------------------------------------------------------------ notifications

  function showToast(message: string, tone: 'ok' | 'error' = 'ok') {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, message, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), tone === 'error' ? 6500 : 3400);
  }

  function setFlash(id: string | null) {
    setFlashState(id);
    window.clearTimeout(flashTimer.current);
    if (id) flashTimer.current = window.setTimeout(() => setFlashState(null), 2400);
  }

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(flashTimer.current);
    },
    [],
  );

  // ------------------------------------------------------------------ moteur 3D

  const atelierRequested = atelier;
  const engine = useShowroom({
    host: stageRef,
    enabled: fleet !== null,
    machines: showroomMachines,
    signage: fleet?.org.name ?? orgName,
    quality: prefs.quality,
    sound: prefs.sound,
    reducedMotion,
    paused: atelierRequested || hidden,
    handlers: {
      onSelect: (id) => {
        if (modal || lightbox) return;
        if (id) {
          if (!entered) void enter();
          openSheet(id);
        } else if (sheetOpen) closeSheet();
      },
      onFocus: (id) => {
        if (id === lastFocus.current) return;
        // Le moteur s'est déplacé de lui-même : l'interface suit.
        lastFocus.current = id;
        setFocusedId(id);
        if (id && sheetOpen && id !== shownId) openSheet(id);
        else if (!id && sheetOpen) closeSheet({ silent: true });
      },
      onHover: () => {},
      onQualityChange: () => {
        if (prefs.quality === 'auto') showToast('Qualité de la 3D ajustée pour garder l’affichage fluide');
      },
      onContextLost: () => {
        showToast('La 3D s’est arrêtée : vous passez en mode atelier.', 'error');
      },
    },
  });
  const engineReady = engine.status === 'ready';
  const engineFailed = engine.status === 'failed';
  const atelierShown = atelier || engineFailed;
  const autoEnter = mode === 'cloud' && prefs.lit && !clicked;
  const entered = clicked || autoEnter;
  const showWelcome = Boolean(fleet) && engineReady && !atelierShown && !autoEnter && !welcomeGone;
  const showDock = Boolean(fleet) && engineReady && !atelierShown && entered && dockReady && machines.length > 0;
  const loaderDone = fleet !== null && engine.status !== 'loading';

  function effect(e: ShowroomEffect) {
    if (engine.status !== 'ready') return;
    try {
      engine.showroom.current?.play(e);
    } catch {
      // Effet facultatif.
    }
  }

  function animate(machineId: string, action: 'wake' | 'service' | 'repair') {
    if (engine.status !== 'ready' || atelierShown) return;
    try {
      engine.showroom.current?.animate(machineId, action);
    } catch {
      // Mise en scène facultative.
    }
  }

  /** « Allumer le garage » : le geste débloque le son, puis le hall s'allume néon après néon. */
  async function enter() {
    if (clicked) return;
    const sr = engine.showroom.current;
    setClicked(true);
    window.setTimeout(() => setWelcomeGone(true), 650);
    window.setTimeout(() => setDockReady(true), 900);
    if (mode === 'cloud') setPref('lit', true);
    if (!sr) {
      setIntroDone(true);
      return;
    }
    introFor.current = sr;
    try {
      sr.unlockAudio();
      sr.setSound(prefs.sound);
      await Promise.race([sr.intro(), sleep(8000)]);
    } catch {
      // L'allumage est une mise en scène : on continue.
    }
    setIntroDone(true);
  }

  // Entrée directe (garage déjà allumé sur cet appareil) : allumage sans son, le son se débloque au premier geste.
  const autoIntro = useEffectEvent((sr: Showroom) => {
    introFor.current = sr;
    window.setTimeout(() => setDockReady(true), 600);
    Promise.race([sr.intro(), sleep(8000)])
      .catch(() => undefined)
      .then(() => setIntroDone(true));
  });
  useEffect(() => {
    const sr = engine.showroom.current;
    if (!engineReady || !sr || !autoEnter || atelierShown || introFor.current === sr) return;
    autoIntro(sr);
    const unlock = () => engine.showroom.current?.unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
    };
  }, [engineReady, autoEnter, atelierShown, engine.showroom]);

  // Après une nouvelle tentative réussie, un garage déjà allumé se rallume.
  useEffect(() => {
    const sr = engine.showroom.current;
    if (!engineReady || !sr || !clicked || atelierShown || introFor.current === sr) return;
    introFor.current = sr;
    void Promise.race([sr.intro(), sleep(8000)]).catch(() => undefined);
  }, [engineReady, clicked, atelierShown, engine.showroom]);

  // Fiche ouverte : la machine reste centrée dans la partie visible de l'écran.
  useEffect(() => {
    const sr = engine.showroom.current;
    if (!engineReady || !sr) return;
    const compute = () => {
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const top = Math.round(document.querySelector<HTMLElement>('.g-topbar')?.getBoundingClientRect().bottom ?? 72);
      const dock = showDock ? (document.querySelector<HTMLElement>('.g-dock')?.offsetHeight ?? 0) : 0;
      const el = sheetRef.current;
      const next =
        sheetVisible && el
          ? mobile
            ? { top, right: 0, bottom: el.offsetHeight }
            : { top, right: el.offsetWidth + 32, bottom: dock }
          : { top, right: 0, bottom: dock };
      const key = `${next.top}/${next.right}/${next.bottom}`;
      if (key === lastInsets.current) return;
      lastInsets.current = key;
      try {
        sr.setInsets(next);
      } catch {
        // Moteur arrêté entre-temps.
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [engineReady, sheetVisible, tall, showDock, engine.showroom]);

  // La caméra suit la fiche ouverte (et revient à la vue d'ensemble à la fermeture).
  useEffect(() => {
    const sr = engine.showroom.current;
    if (!engineReady || !sr || atelierShown || !entered) return;
    const target = sheetVisible ? shownId : null;
    if (lastFocus.current === target) return;
    lastFocus.current = target;
    try {
      sr.focus(target);
    } catch {
      // Moteur arrêté entre-temps.
    }
  }, [engineReady, atelierShown, entered, sheetVisible, shownId, engine.showroom]);

  // ------------------------------------------------------------------ chargement des données

  // Démo : le parc d'exemple est créé dans le navigateur.
  useEffect(() => {
    if (initialFleet) return;
    let alive = true;
    (repoRef.current ??= makeRepo())
      .loadFleet()
      .then((f) => {
        if (alive) setFleet(f);
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(errorText(e, 'Le parc n’a pas pu être chargé.'));
      });
    return () => {
      alive = false;
    };
  }, [initialFleet, makeRepo]);

  async function loadFile(machineId: string) {
    try {
      const f = await getRepo().loadMachineFile(machineId);
      setFiles((prev) => ({ ...prev, [machineId]: f }));
      setFileErrors((prev) => ({ ...prev, [machineId]: undefined }));
    } catch (e) {
      setFileErrors((prev) => ({ ...prev, [machineId]: errorText(e, 'Vérifiez la connexion, puis réessayez.') }));
    }
  }

  async function refresh(machineId?: string | null) {
    const [fl, mf] = await Promise.allSettled([
      getRepo().loadFleet(),
      machineId ? getRepo().loadMachineFile(machineId) : Promise.resolve(null),
    ]);
    if (mf.status === 'fulfilled' && mf.value && machineId) {
      const file = mf.value;
      setFiles((prev) => ({ ...prev, [machineId]: file }));
    }
    if (fl.status === 'fulfilled') setFleet(fl.value);
    else showToast(errorText(fl.reason, 'Les données n’ont pas pu être actualisées.'), 'error');
  }

  // Retour sur l'onglet après une longue absence : liens des photos et données rafraîchis.
  const onVisible = useEffectEvent(() => {
    const since = hiddenAt.current;
    hiddenAt.current = null;
    if (since && Date.now() - since > REFRESH_AFTER_HIDDEN) void refresh(sheetVisible ? shownId : null);
  });
  useEffect(() => {
    if (hidden) hiddenAt.current = Date.now();
    else onVisible();
  }, [hidden]);

  // ------------------------------------------------------------------ fiche

  function syncUrl(id: string | null) {
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('m', id);
      else url.searchParams.delete('m');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Adresse non modifiable : sans conséquence.
    }
  }

  /** Ouvre la fiche d'une machine. L'identifiant peut venir d'être créé : il n'est pas vérifié ici
   *  (le parc affiché peut dater du rendu précédent) ; une machine absente laisse simplement la fiche fermée. */
  function openSheet(id: string, nextTab?: SheetTab) {
    const wasOpen = sheetVisible;
    const changed = id !== shownId;
    setShownId(id);
    setSheetOpen(true);
    setSelectedOnce(true);
    setFocusedId(id);
    if (nextTab) setTab(nextTab);
    else if (changed) setTab('apercu');
    if (!wasOpen || changed) effect('open');
    void loadFile(id);
    syncUrl(id);
    if (!wasOpen) window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 0);
  }

  function closeSheet(opts?: { silent?: boolean }) {
    const id = shownId;
    // Le focus était dans la fiche : il revient à la puce (ou à la carte du mode atelier) de la machine.
    const hadFocus = Boolean(sheetRef.current && document.activeElement && sheetRef.current.contains(document.activeElement));
    setSheetOpen(false);
    setTall(false);
    syncUrl(null);
    if (!opts?.silent) effect('close');
    if (id && hadFocus) {
      // Après la mise à jour de l'affichage (la fiche devient inerte), sans dépendre des images d'animation.
      window.setTimeout(() => {
        const sel = CSS.escape(id);
        const target =
          document.querySelector<HTMLElement>(`.g-dock [data-machine="${sel}"]`) ??
          document.querySelector<HTMLElement>(`.g-atelier [data-fiche="${sel}"]`);
        target?.focus({ preventScroll: true });
      }, 0);
    }
  }

  function step(dir: 1 | -1) {
    if (!machines.length) return;
    const cur = sheetVisible ? shownId : focusedId;
    const i = machines.findIndex((m) => m.id === cur);
    const j = i < 0 ? (dir > 0 ? 0 : machines.length - 1) : (i + dir + machines.length) % machines.length;
    openSheet(machines[j].id, sheetVisible ? tab : undefined);
  }

  // Lien profond : la machine s'ouvre une fois le garage allumé (ou tout de suite en mode atelier).
  const openDeepLink = useEffectEvent(() => {
    if (!initialMachineId || !fleet) return;
    if (fleet.machines.some((m) => m.id === initialMachineId)) openSheet(initialMachineId);
    else {
      syncUrl(null);
      showToast('Cette machine n’est plus dans le parc (archivée ou supprimée).', 'error');
    }
  });
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (deepLinkDone.current || !initialMachineId || !fleet) return;
    if (!(atelierShown || (engineReady && entered && introDone))) return;
    const t = window.setTimeout(() => {
      deepLinkDone.current = true;
      openDeepLink();
    }, 60);
    return () => window.clearTimeout(t);
  }, [initialMachineId, fleet, atelierShown, engineReady, entered, introDone]);

  // ------------------------------------------------------------------ envoi des fichiers

  async function upload(
    machineId: string,
    list: File[],
    opts?: { entryId?: string | null; caption?: string | null },
  ): Promise<UploadOutcome> {
    const out: UploadOutcome = { sent: 0, photos: 0, videos: 0, documents: 0, errors: [] };
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setUploads({ machineId, index: i, total: list.length, name: f.name || 'fichier', phase: 'prep', progress: 0 });
      let prepared;
      try {
        prepared = await prepareUpload(f);
      } catch (e) {
        out.errors.push(e instanceof UploadRejected ? e.message : `« ${f.name} » n’a pas pu être préparé sur cet appareil.`);
        continue;
      }
      setUploads((u) => (u ? { ...u, phase: 'send', progress: 0 } : u));
      const options: UploadProgressOptions = {
        kind: prepared.kind,
        fileName: prepared.name,
        entryId: opts?.entryId ?? null,
        caption:
          (prepared.kind === 'document' ? prepared.name.replace(/\.[a-z0-9]{1,5}$/i, '') : (opts?.caption ?? '')).slice(0, 200) || null,
        takenAt: takenAt(f),
        onProgress: (p) => setUploads((u) => (u && u.index === i ? { ...u, progress: p } : u)),
      };
      try {
        await getRepo().uploadMedia(machineId, prepared.blob, options);
        out.sent += 1;
        if (prepared.kind === 'photo') out.photos += 1;
        else if (prepared.kind === 'video') out.videos += 1;
        else out.documents += 1;
      } catch (e) {
        out.errors.push(`« ${f.name} » : ${errorText(e, 'l’envoi a échoué.')}`);
      }
    }
    setUploads(null);
    return out;
  }

  // ------------------------------------------------------------------ clavier

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    if (e.key === 'Escape') {
      if (lightbox) setLightbox(null);
      else if (modal) setModal(null);
      else if (sheetVisible) closeSheet();
      else return;
      e.preventDefault();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (modal || lightbox || !fleet || showWelcome || (atelierShown && !sheetVisible)) return;
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (t?.closest('input, textarea, select, video, audio, [contenteditable="true"], [data-own-arrows]')) return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ------------------------------------------------------------------ barre du haut

  function toggleSound() {
    const next = !prefs.sound;
    setPref('sound', next);
    const sr = engine.showroom.current;
    if (sr && engineReady) {
      try {
        if (next) sr.unlockAudio();
        sr.setSound(next);
      } catch {
        // Son indisponible.
      }
    }
    showToast(next ? 'Son activé' : 'Son coupé');
  }

  function cycleQuality() {
    const next = QUALITY_ORDER[(QUALITY_ORDER.indexOf(prefs.quality) + 1) % QUALITY_ORDER.length];
    setPref('quality', next);
    effect('tick');
    showToast(next === 'auto' ? 'Qualité automatique : la 3D s’adapte à l’appareil' : `${QUALITY_LABEL[next]} pour la 3D`);
  }

  function toggleAtelier() {
    const next = !atelierShown;
    if (!next && engineFailed) {
      showToast('La 3D n’est pas disponible sur cet appareil : le mode atelier reste affiché.');
      return;
    }
    setAtelier(next);
    lastFocus.current = undefined;
    effect('tick');
  }

  // ------------------------------------------------------------------ rendu

  const displayName = fleet?.org.name ?? orgName;
  const role = fleet?.role ?? 'operator';
  const lightboxItems: MediaItem[] = lightbox ? (files[lightbox.machineId]?.media ?? []) : [];
  const lightboxIndex = lightbox ? lightboxItems.findIndex((m) => m.id === lightbox.mediaId) : -1;
  const lightboxCode = lightbox ? (machines.find((m) => m.id === lightbox.machineId)?.code ?? '') : '';

  const api: GarageApi | null = fleet
    ? {
        mode,
        org: fleet.org,
        role: fleet.role,
        userId: fleet.userId,
        today,
        fleet,
        health,
        files,
        repo: getRepo,
        refresh,
        toast: showToast,
        effect,
        animate,
        openModal: (m) => setModal(m),
        closeModal: () => setModal(null),
        openSheet,
        setTab,
        openLightbox: (machineId, mediaId) => setLightbox({ machineId, mediaId }),
        upload,
        uploads,
        flash,
        setFlash,
      }
    : null;

  function renderModal(m: ModalSpec) {
    const close = () => setModal(null);
    switch (m.type) {
      case 'entry':
        return (
          <EntryModal
            key={`${m.machineId}-${m.entryId ?? ''}-${m.scheduleId ?? ''}`}
            machineId={m.machineId}
            entryId={m.entryId}
            kind={m.kind}
            scheduleId={m.scheduleId}
            onClose={close}
          />
        );
      case 'machine':
        return <MachineModal machineId={m.machineId} onClose={close} />;
      case 'hours':
        return <HoursModal machineId={m.machineId} onClose={close} />;
      case 'schedule':
        return <ScheduleModal machineId={m.machineId} scheduleId={m.scheduleId} onClose={close} />;
      case 'remove-entry':
        return <RemoveEntryModal machineId={m.machineId} entryId={m.entryId} onClose={close} />;
      case 'archive':
        return (
          <ArchiveModal
            machineId={m.machineId}
            onClose={close}
            onArchived={() => {
              if (shownId === m.machineId) closeSheet({ silent: true });
            }}
          />
        );
      case 'delete-schedule':
        return <DeleteScheduleModal machineId={m.machineId} scheduleId={m.scheduleId} onClose={close} />;
    }
  }

  const rootClass = [
    'garage-root',
    'g-root',
    mode === 'demo' ? 'is-demo' : '',
    atelierShown ? 'is-atelier' : '',
    sheetVisible ? 'has-sheet' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const covered = Boolean(modal || lightbox);

  return (
    <div className={rootClass}>
      {/* Tout ce qui est derrière une modale ou la visionneuse devient inerte (clavier, lecteurs d'écran). */}
      <div className="g-layer" inert={covered}>
        <h1 className="g-sr">Godet · garage de {displayName}</h1>
        {mode === 'demo' ? (
          <div className="g-demo-strip" role="note">
            <span>
              <b>Démo</b>
              <span className="g-demo-long"> — données d’exemple, rien n’est enregistré.</span>
              <span className="g-demo-short"> · rien n’est enregistré</span>
            </span>
            <Link href="/connexion?mode=inscription" className="g-demo-cta">
              Créer mon garage
              <Icon name="chevron-right" />
            </Link>
          </div>
        ) : null}

        <div ref={stageRef} className="g-stage" />

        <Topbar
          orgName={displayName}
          mode={mode}
          role={role}
          person={person ?? null}
          machines={fleet ? machines.length : null}
          alerts={fleet ? alerts : null}
          cost12={cost12}
          sound={prefs.sound}
          onSound={toggleSound}
          quality={prefs.quality}
          onQuality={cycleQuality}
          show3dControls={!engineFailed}
          atelier={atelierShown}
          onAtelier={toggleAtelier}
          onSignOut={() => onSignOut?.()}
        />

        {api ? (
          <GarageContext.Provider value={api}>
            {showWelcome ? (
              <Welcome mode={mode} orgName={displayName} machines={machines.length} leaving={clicked} onEnter={() => void enter()} />
            ) : null}

            {showDock && !sheetVisible && !selectedOnce ? (
              <p className="hint g-hint-float">
                {coarse ? 'Touchez une machine pour ouvrir sa fiche' : 'Cliquez sur une machine pour ouvrir sa fiche'}
              </p>
            ) : null}

            {engineReady && !atelierShown && entered && dockReady && machines.length === 0 ? (
              <section className="g-empty-fleet" aria-labelledby="empty-fleet-t">
                <p className="eyebrow">{displayName}</p>
                <h2 id="empty-fleet-t">Le garage est vide</h2>
                <p className="muted">
                  {can.manageFleet(role)
                    ? 'Ajoutez votre première machine : elle prendra place dans le hall, avec son carnet et ses échéances.'
                    : 'Aucune machine pour l’instant. Un responsable du parc peut les ajouter.'}
                </p>
                {can.manageFleet(role) ? (
                  <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'machine' })}>
                    <Icon name="plus" />
                    Ajouter une machine
                  </button>
                ) : null}
              </section>
            ) : null}

            {showDock ? (
              <Dock
                machines={machines}
                health={health}
                current={sheetVisible ? shownId : focusedId}
                canAdd={can.manageFleet(role)}
                reducedMotion={reducedMotion}
                onOpen={(id) => {
                  if (sheetVisible && id === shownId) closeSheet();
                  else openSheet(id);
                }}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
                onAdd={() => setModal({ type: 'machine' })}
              />
            ) : null}

            {atelierShown ? (
              <Atelier
                failure={engine.failure}
                canReturn={!engineFailed}
                withSheet={sheetVisible}
                onReturn={toggleAtelier}
                onRetry={() => {
                  introFor.current = null;
                  lastInsets.current = '';
                  lastFocus.current = null;
                  setAtelier(false);
                  engine.retry();
                }}
                onOpen={(id) => openSheet(id)}
                onAdd={() => setModal({ type: 'machine' })}
              />
            ) : null}

            <Sheet
              machine={shownMachine}
              open={sheetVisible}
              tall={tall}
              tab={tab}
              several={machines.length > 1}
              sheetRef={sheetRef}
              titleRef={titleRef}
              onClose={() => closeSheet()}
              onTall={setTall}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
              onRetry={() => {
                if (shownId) void loadFile(shownId);
              }}
              fileError={shownId ? (fileErrors[shownId] ?? null) : null}
            />
          </GarageContext.Provider>
        ) : null}
      </div>

      {api ? (
        <GarageContext.Provider value={api}>
          {modal ? renderModal(modal) : null}

          {lightbox && lightboxIndex >= 0 ? (
            <Lightbox
              items={lightboxItems}
              index={lightboxIndex}
              code={lightboxCode}
              canDelete={(m) => canDeleteMedia(api.role, api.userId, m)}
              onIndex={(i) => setLightbox({ machineId: lightbox.machineId, mediaId: lightboxItems[i].id })}
              onClose={() => setLightbox(null)}
              onDelete={async (m) => {
                const list = lightboxItems;
                const i = list.findIndex((x) => x.id === m.id);
                await getRepo().deleteMedia(m.id);
                const rest = list.filter((x) => x.id !== m.id);
                if (rest.length) setLightbox({ machineId: lightbox.machineId, mediaId: rest[Math.min(i, rest.length - 1)].id });
                else setLightbox(null);
                await refresh(lightbox.machineId);
                showToast('Fichier supprimé');
              }}
            />
          ) : null}
        </GarageContext.Provider>
      ) : null}

      {loadError ? (
        <div className="fallback g-fallback" role="alert">
          <div className="dialog">
            <h2>Le garage n’a pas pu s’ouvrir</h2>
            <p className="muted">{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        </div>
      ) : null}

      <Toast toast={toast} />
      <Loader progress={engine.progress} label={engine.label} done={loaderDone || Boolean(loadError)} />
    </div>
  );
}
