'use client';

// Fiche machine : panneau à droite sur ordinateur, feuille du bas sur téléphone (poignée : réduite / agrandie,
// glisser vers le bas pour fermer). En-tête, pastilles d'état, actions rapides, onglets.
import { useEffect, useRef, type KeyboardEvent, type Ref } from 'react';
import { Icon } from '@/components/Icons';
import { can, isOpenRepair, REPAIR_STATUS } from '@/lib/domain';
import { hrs } from '@/lib/format';
import type { Machine } from '@/lib/types';
import { useGarage } from './context';
import { machineDetails, machineEyebrow, TABS, type SheetTab } from './helpers';
import { FileButton, MediaTab, UploadStatus, useSendFiles } from './MediaTab';
import { CostsTab, LogbookTab, OverviewTab, PartsTab, RepairsTab, SchedulesTab, tabCounts } from './SheetTabs';
import { Menu, type MenuEntry } from './ui';

export function Sheet({
  machine,
  open,
  tall,
  tab,
  several,
  sheetRef,
  titleRef,
  onClose,
  onTall,
  onPrev,
  onNext,
  onRetry,
  fileError,
}: {
  machine: Machine | null;
  open: boolean;
  tall: boolean;
  tab: SheetTab;
  several: boolean;
  sheetRef: Ref<HTMLElement>;
  titleRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onTall: (next: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onRetry: () => void;
  fileError: string | null;
}) {
  const g = useGarage();
  const send = useSendFiles();
  const body = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const file = machine ? g.files[machine.id] : undefined;
  const health = machine ? g.health.get(machine.id) : undefined;
  const id = machine?.id ?? null;

  // Nouvel onglet ou autre machine : on repart du haut.
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [tab, id]);

  if (!machine) {
    return <aside className="sheet g-sheet" ref={sheetRef} aria-hidden="true" inert />;
  }

  const counts = tabCounts(file);
  const dues = health?.dues ?? [];
  const late = dues.filter((d) => d.state !== 'ok');
  const open_ = (file ? file.entries.filter(isOpenRepair) : health?.openRepairs) ?? [];
  const busy = Boolean(g.uploads);
  const manage = can.manageFleet(g.role);

  const menu: MenuEntry[] = [
    ...(manage
      ? [
          {
            key: 'edit',
            label: 'Modifier la machine',
            icon: 'edit' as const,
            onSelect: () => g.openModal({ type: 'machine', machineId: machine.id }),
          },
        ]
      : []),
    {
      key: 'hours',
      label: 'Relever le compteur',
      icon: 'clock' as const,
      onSelect: () => g.openModal({ type: 'hours', machineId: machine.id }),
    },
    ...(g.mode === 'cloud'
      ? [
          {
            key: 'print',
            label: 'Imprimer le carnet',
            icon: 'print' as const,
            href: `/carnet/${encodeURIComponent(machine.id)}`,
            newTab: true,
          },
        ]
      : []),
    ...(manage
      ? [
          {
            key: 'archive',
            label: 'Archiver la machine',
            icon: 'archive' as const,
            danger: true,
            onSelect: () => g.openModal({ type: 'archive', machineId: machine.id }),
          },
        ]
      : []),
  ];

  function onTabsKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.findIndex((t) => t.id === tab);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = TABS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    e.stopPropagation();
    g.setTab(TABS[j].id);
    const el = document.getElementById(`tab-${TABS[j].id}`);
    el?.focus();
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  const sheetEl = () => (body.current?.closest('.sheet') as HTMLElement | null) ?? null;

  return (
    <aside
      className={`sheet g-sheet${open ? ' open' : ''}${tall ? ' tall' : ''}`}
      ref={sheetRef}
      aria-labelledby="sheet-title"
      aria-hidden={open ? undefined : true}
      inert={!open}
    >
      <div className="g-grab-row">
        {several ? (
          <button type="button" className="icon-btn g-grab-nav" aria-label="Machine précédente" onClick={onPrev}>
            <Icon name="chevron-left" />
          </button>
        ) : null}
        <button
          type="button"
          className="sheet-grab"
          aria-label={tall ? 'Réduire la fiche' : 'Agrandir la fiche'}
          aria-expanded={tall}
          onPointerDown={(e) => {
            drag.current = { y: e.clientY, dy: 0, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            d.dy = e.clientY - d.y;
            if (Math.abs(d.dy) > 6) d.moved = true;
            const el = sheetEl();
            if (el && d.moved && d.dy > 0) {
              el.style.transition = 'none';
              el.style.transform = `translateY(${d.dy}px)`;
            }
          }}
          onPointerUp={() => {
            const d = drag.current;
            drag.current = null;
            const el = sheetEl();
            if (el) {
              el.style.transition = '';
              el.style.transform = '';
            }
            if (!d || !d.moved) return;
            skipClick.current = true;
            if (d.dy < -40) onTall(true);
            else if (d.dy > 60) {
              if (tall) onTall(false);
              else onClose();
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
            const el = sheetEl();
            if (el) {
              el.style.transition = '';
              el.style.transform = '';
            }
          }}
          onClick={() => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            onTall(!tall);
          }}
        />
        {several ? (
          <button type="button" className="icon-btn g-grab-nav" aria-label="Machine suivante" onClick={onNext}>
            <Icon name="chevron-right" />
          </button>
        ) : null}
      </div>

      <div className="sheet-head">
        <div className="sheet-title">
          <p className="eyebrow">{machineEyebrow(machine)}</p>
          <h2 id="sheet-title" ref={titleRef} tabIndex={-1}>
            {machine.code}
          </h2>
          <p className="sub">{machineDetails(machine) || 'Marque et modèle non renseignés'}</p>
        </div>
        <div className="g-head-actions">
          {several ? (
            <>
              <button type="button" className="icon-btn g-hide-sm" aria-label="Machine précédente" onClick={onPrev}>
                <Icon name="chevron-left" />
              </button>
              <button type="button" className="icon-btn g-hide-sm" aria-label="Machine suivante" onClick={onNext}>
                <Icon name="chevron-right" />
              </button>
            </>
          ) : null}
          <Menu label={`Actions sur ${machine.code}`} icon="list" items={menu} className="g-menu-right" />
          <button type="button" className="icon-btn" aria-label="Fermer la fiche" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </div>

      <div className="status-row" aria-label="État de la machine">
        {health?.state === 'bad' ? (
          <span className="pill bad">
            <Icon name="alert" className="g-pill-icon" />
            Échéance dépassée
          </span>
        ) : (
          <span className="pill">
            <Icon name="check" className="g-pill-icon" />
            Opérationnelle
          </span>
        )}
        {late.map((d) => (
          <span key={d.schedule.id} className={`pill ${d.state}`}>
            {d.schedule.label} : {d.text}
          </span>
        ))}
        {open_.length === 1 ? (
          <span className="pill warn">Réparation : {REPAIR_STATUS[open_[0].repair_status ?? 'en_cours'].label.toLowerCase()}</span>
        ) : open_.length > 1 ? (
          <span className="pill warn">{open_.length} réparations ouvertes</span>
        ) : null}
        <span className="pill muted">
          <Icon name="clock" className="g-pill-icon" />
          {hrs(Number(machine.hours))}
        </span>
      </div>

      <div className="quick g-quick">
        <button type="button" className="btn btn-primary" onClick={() => g.openModal({ type: 'entry', machineId: machine.id })}>
          <Icon name="plus" />
          Intervention
        </button>
        <FileButton accept="image/*" capture="environment" disabled={busy} label="Photo" onFiles={(f) => void send(machine.id, f)}>
          <Icon name="camera" />
          <span className="g-quick-lbl">Photo</span>
        </FileButton>
        <FileButton accept="video/*" disabled={busy} label="Vidéo" onFiles={(f) => void send(machine.id, f)}>
          <Icon name="video" />
          <span className="g-quick-lbl">Vidéo</span>
        </FileButton>
        <button
          type="button"
          className="btn btn-soft"
          aria-label="Compteur d’heures"
          onClick={() => g.openModal({ type: 'hours', machineId: machine.id })}
        >
          <Icon name="clock" />
          <span className="g-quick-lbl">Compteur</span>
        </button>
      </div>
      {tab !== 'medias' ? (
        <div className="g-quick-upload">
          <UploadStatus machineId={machine.id} />
        </div>
      ) : null}

      <div className="tabs" role="tablist" aria-label="Sections de la fiche" data-own-arrows="" onKeyDown={onTabsKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            className="tab"
            aria-selected={tab === t.id}
            aria-controls="sheet-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => {
              if (tab !== t.id) g.effect('tick');
              g.setTab(t.id);
            }}
          >
            {t.label}
            {counts[t.id] != null ? <span className="count">{counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      <div className="sheet-body" id="sheet-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} ref={body}>
        {file ? (
          tab === 'apercu' ? (
            <OverviewTab key={machine.id} machine={machine} file={file} health={health} />
          ) : tab === 'carnet' ? (
            <LogbookTab key={machine.id} machine={machine} file={file} />
          ) : tab === 'reparations' ? (
            <RepairsTab key={machine.id} machine={machine} file={file} />
          ) : tab === 'pieces' ? (
            <PartsTab key={machine.id} machine={machine} file={file} />
          ) : tab === 'couts' ? (
            <CostsTab key={machine.id} machine={machine} file={file} />
          ) : tab === 'medias' ? (
            <MediaTab key={machine.id} machine={machine} file={file} />
          ) : (
            <SchedulesTab key={machine.id} machine={machine} file={file} />
          )
        ) : fileError ? (
          <div className="empty" role="alert">
            <b>La fiche n’a pas pu être chargée</b>
            <span>{fileError}</span>
            <button type="button" className="btn btn-soft g-btn-sm" onClick={onRetry}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className="g-sheet-loading" role="status">
            <span className="g-spinner" aria-hidden="true" />
            Ouverture du carnet de {machine.code}…
          </div>
        )}
      </div>
    </aside>
  );
}
