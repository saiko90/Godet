'use client';

// Fiche machine : panneau à droite sur ordinateur, feuille du bas sur téléphone (poignée : réduite / agrandie,
// glisser vers le bas pour fermer). En-tête, pastilles d'état, actions rapides, onglets.
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type KeyboardEvent, type Ref } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { can, isOpenRepair } from '@/lib/domain';
import type { Machine } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';
import { useGarage } from './context';
import { GroupList } from './GroupList';
import type { FleetView } from './groups';
import { TABS, type SheetTab } from './helpers';
import { FileButton, MediaTab, UploadStatus, useSendFiles } from './MediaTab';
import { CostsTab, LogbookTab, OverviewTab, PartsTab, RepairsTab, SchedulesTab, tabCounts } from './SheetTabs';
import { useGarageText } from './text';
import { Menu, type MenuEntry } from './ui';

export function Sheet({
  machine,
  group,
  backGroup,
  onOpenMachine,
  onBackToGroup,
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
  /** Groupe du showroom affiché à la place d'une fiche (liste de ses machines). */
  group: FleetView | null;
  /** Groupe de la machine ouverte (lien de retour vers sa liste), ou null. */
  backGroup: FleetView | null;
  onOpenMachine: (machineId: string) => void;
  onBackToGroup: () => void;
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
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
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

  if (!machine && group) {
    const alerts = group.alerts;
    return (
      <aside
        className={`sheet g-sheet g-sheet-group${open ? ' open' : ''}${tall ? ' tall' : ''}`}
        ref={sheetRef}
        aria-labelledby="sheet-title"
        aria-hidden={open ? undefined : true}
        inert={!open}
      >
        <div className="g-grab-row">
          <button
            type="button"
            className="sheet-grab"
            aria-label={tall ? t('sheet.shrink') : t('sheet.expand')}
            aria-expanded={tall}
            onClick={() => onTall(!tall)}
          />
        </div>
        <div className="sheet-head">
          <div className="sheet-title">
            <p className="eyebrow">{t('groups.eyebrow', { count: group.machines.length, n: f.num(group.machines.length) })}</p>
            <h2 id="sheet-title" ref={titleRef} tabIndex={-1}>
              {dt.kind(group.kind)}
            </h2>
            <p className="sub">
              {alerts
                ? t('groups.alerts', { count: alerts, n: f.num(alerts) })
                : t('groups.allOk')}
            </p>
          </div>
          <div className="g-head-actions">
            <button type="button" className="icon-btn" aria-label={t('sheet.close')} onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="sheet-body" ref={body}>
          <GroupList group={group} onOpen={onOpenMachine} />
        </div>
      </aside>
    );
  }

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
            label: t('sheet.menuEdit'),
            icon: 'edit' as const,
            onSelect: () => g.openModal({ type: 'machine', machineId: machine.id }),
          },
        ]
      : []),
    {
      key: 'hours',
      label: t('sheet.menuHours'),
      icon: 'clock' as const,
      onSelect: () => g.openModal({ type: 'hours', machineId: machine.id }),
    },
    ...(g.mode === 'cloud'
      ? [
          {
            key: 'print',
            label: t('sheet.menuPrint'),
            icon: 'print' as const,
            href: `/carnet/${encodeURIComponent(machine.id)}`,
            newTab: true,
          },
          {
            key: 'label',
            label: t('sheet.menuLabel'),
            icon: 'qr' as const,
            href: `/etiquettes?ids=${encodeURIComponent(machine.id)}`,
            newTab: true,
          },
        ]
      : []),
    ...(manage
      ? [
          {
            key: 'archive',
            label: t('sheet.menuArchive'),
            icon: 'archive' as const,
            danger: true,
            onSelect: () => g.openModal({ type: 'archive', machineId: machine.id }),
          },
        ]
      : []),
  ];

  function onTabsKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.indexOf(tab);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = TABS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    e.stopPropagation();
    g.setTab(TABS[j]);
    const el = document.getElementById(`tab-${TABS[j]}`);
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
          <button type="button" className="icon-btn g-grab-nav" aria-label={t('sheet.prev')} onClick={onPrev}>
            <Icon name="chevron-left" />
          </button>
        ) : null}
        <button
          type="button"
          className="sheet-grab"
          aria-label={tall ? t('sheet.shrink') : t('sheet.expand')}
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
          <button type="button" className="icon-btn g-grab-nav" aria-label={t('sheet.next')} onClick={onNext}>
            <Icon name="chevron-right" />
          </button>
        ) : null}
      </div>

      <div className="sheet-head">
        <div className="sheet-title">
          <p className="eyebrow">{gt.eyebrow(machine)}</p>
          <h2 id="sheet-title" ref={titleRef} tabIndex={-1}>
            {machine.code}
          </h2>
          <p className="sub">{gt.details(machine) || t('sheet.noDetails')}</p>
          {backGroup ? (
            <button type="button" className="g-back-group" onClick={onBackToGroup}>
              <Icon name="chevron-left" />
              {t('groups.back', { n: f.num(backGroup.machines.length) })}
            </button>
          ) : null}
        </div>
        <div className="g-head-actions">
          {several ? (
            <>
              <button type="button" className="icon-btn g-hide-sm" aria-label={t('sheet.prev')} onClick={onPrev}>
                <Icon name="chevron-left" />
              </button>
              <button type="button" className="icon-btn g-hide-sm" aria-label={t('sheet.next')} onClick={onNext}>
                <Icon name="chevron-right" />
              </button>
            </>
          ) : null}
          <Menu label={t('sheet.actions', { code: machine.code })} icon="list" items={menu} className="g-menu-right" />
          <button type="button" className="icon-btn" aria-label={t('sheet.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </div>

      <div className="status-row" aria-label={t('sheet.status')}>
        {health?.state === 'bad' ? (
          <span className="pill bad">
            <Icon name="alert" className="g-pill-icon" />
            {dt.health('bad')}
          </span>
        ) : (
          <span className="pill">
            <Icon name="check" className="g-pill-icon" />
            {dt.health('ok')}
          </span>
        )}
        {late.map((d) => (
          <span key={d.schedule.id} className={`pill ${d.state}`}>
            {t('sheet.duePill', { label: d.schedule.label, text: dt.dueText(d) })}
          </span>
        ))}
        {open_.length === 1 ? (
          <span className="pill warn">{t('sheet.repairOne', { status: gt.repairInline(open_[0].repair_status ?? 'en_cours') })}</span>
        ) : open_.length > 1 ? (
          <span className="pill warn">{t('sheet.repairsOpen', { count: open_.length, n: f.num(open_.length) })}</span>
        ) : null}
        <span className="pill muted">
          <Icon name="clock" className="g-pill-icon" />
          {f.hours(Number(machine.hours))}
        </span>
      </div>

      <div className="quick g-quick">
        <button type="button" className="btn btn-primary" onClick={() => g.openModal({ type: 'entry', machineId: machine.id })}>
          <Icon name="plus" />
          {t('sheet.work')}
        </button>
        <FileButton accept="image/*" capture="environment" disabled={busy} label={t('sheet.photo')} onFiles={(list) => void send(machine.id, list)}>
          <Icon name="camera" />
          <span className="g-quick-lbl">{t('sheet.photo')}</span>
        </FileButton>
        <FileButton accept="video/*" disabled={busy} label={t('sheet.video')} onFiles={(list) => void send(machine.id, list)}>
          <Icon name="video" />
          <span className="g-quick-lbl">{t('sheet.video')}</span>
        </FileButton>
        <button
          type="button"
          className="btn btn-soft"
          aria-label={t('sheet.meterAria')}
          onClick={() => g.openModal({ type: 'hours', machineId: machine.id })}
        >
          <Icon name="clock" />
          <span className="g-quick-lbl">{t('sheet.meter')}</span>
        </button>
      </div>
      {tab !== 'medias' ? (
        <div className="g-quick-upload">
          <UploadStatus machineId={machine.id} />
        </div>
      ) : null}

      <div className="tabs" role="tablist" aria-label={t('sheet.sections')} data-own-arrows="" onKeyDown={onTabsKey}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            className="tab"
            aria-selected={tab === id}
            aria-controls="sheet-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => {
              if (tab !== id) g.effect('tick');
              g.setTab(id);
            }}
          >
            {t(`tabs.${id}`)}
            {counts[id] != null ? <span className="count">{counts[id]}</span> : null}
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
            <b>{t('sheet.loadFailed')}</b>
            <span>{fileError}</span>
            <button type="button" className="btn btn-soft g-btn-sm" onClick={onRetry}>
              {tc('actions.retry')}
            </button>
          </div>
        ) : (
          <div className="g-sheet-loading" role="status">
            <span className="g-spinner" aria-hidden="true" />
            {t('sheet.opening', { code: machine.code })}
          </div>
        )}
      </div>
    </aside>
  );
}
