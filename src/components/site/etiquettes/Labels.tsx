'use client';

// Planches d'étiquettes QR (A4) : choix des machines, du format, du nombre d'exemplaires et de la première case
// (planche entamée). Aperçu à l'échelle sur l'écran ; à l'impression, les planches sont au millimètre près.
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { qrPath } from '@/lib/qr';
import '../site.css';

export interface LabelMachine {
  id: string;
  code: string;
  /** « Pelle sur chenilles 8 t ». */
  title: string;
  /** Marque et modèle, ou chaîne vide. */
  make: string;
  /** Adresse contenue dans le code QR. */
  url: string;
}

type Format = 'large' | 'small';
/** Grille de chaque format (planches Avery L7165 et L7160). */
const PER_PAGE: Record<Format, number> = { large: 8, small: 21 };
const PREFS = 'godet-etiquettes';

function storedPrefs(): string | null {
  try {
    return localStorage.getItem(PREFS);
  } catch {
    return null;
  }
}
const noSubscribe = () => () => {};

function parsePrefs(raw: string | null): { format: Format; outline: boolean } {
  try {
    const p = JSON.parse(raw ?? '{}') as { format?: string; outline?: boolean };
    return { format: p.format === 'small' ? 'small' : 'large', outline: p.outline !== false };
  } catch {
    return { format: 'large', outline: true };
  }
}

function QrCode({ url }: { url: string }) {
  const { size, d } = useMemo(() => qrPath(url), [url]);
  return (
    <svg className="s-label-qr" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

function Label({ m, orgName, scan }: { m: LabelMachine; orgName: string; scan: string }) {
  return (
    <div className="s-label">
      <QrCode url={m.url} />
      <div className="s-label-text">
        <b className={`s-label-code${m.code.length > 9 ? ' is-long' : ''}`}>{m.code}</b>
        <span className="s-label-title">{m.title}</span>
        {m.make ? <span className="s-label-make">{m.make}</span> : null}
        <span className="s-label-org">{orgName}</span>
        <span className="s-label-scan">
          <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
            <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="#f3b71b" />
            <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="#0b0d10" />
          </svg>
          {scan}
        </span>
      </div>
    </div>
  );
}

export function Labels({ machines, orgName, initialIds }: { machines: LabelMachine[]; orgName: string; initialIds: string[] }) {
  const t = useTranslations('garage.labels');
  // Réglages de l'appareil (format, traits) : lus du navigateur après l'hydratation, puis choix de la visite.
  const stored = parsePrefs(useSyncExternalStore(noSubscribe, storedPrefs, () => null));
  const [choice, setChoice] = useState<{ format?: Format; outline?: boolean }>({});
  const format = choice.format ?? stored.format;
  const outline = choice.outline ?? stored.outline;
  function remember(next: { format: Format; outline: boolean }) {
    setChoice(next);
    try {
      localStorage.setItem(PREFS, JSON.stringify(next));
    } catch {
      // Stockage indisponible : réglage gardé pour cette visite.
    }
  }
  const setFormat = (v: Format) => remember({ format: v, outline });
  const setOutline = (v: boolean) => remember({ format, outline: v });
  const [copies, setCopies] = useState(1);
  const [start, setStart] = useState(1);
  const [chosen, setChosen] = useState<Set<string>>(() => {
    const known = new Set(machines.map((m) => m.id));
    const asked = initialIds.filter((id) => known.has(id));
    return new Set(asked.length ? asked : machines.map((m) => m.id));
  });
  const pagesRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);


  // Aperçu : la page A4 (794 px à 96 ppp) réduite à la largeur disponible.
  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, el.clientWidth / 794));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const per = PER_PAGE[format];
  const first = Math.min(Math.max(1, start), per) - 1;
  const items = machines.filter((m) => chosen.has(m.id)).flatMap((m) => Array.from({ length: copies }, () => m));
  const cells: (LabelMachine | null)[] = [...Array.from({ length: first }, () => null), ...items];
  const pages: (LabelMachine | null)[][] = [];
  for (let i = 0; i < cells.length; i += per) pages.push(cells.slice(i, i + per));
  if (!items.length) pages.length = 0;

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="s-page s-labels-page">
      <style>{'@page { size: A4; margin: 0; }'}</style>
      <header className="s-carnet-bar s-noprint">
        <div className="s-wrap s-carnet-bar-row">
          <Link href="/garage" className="btn btn-ghost s-btn-sm">
            <Icon name="chevron-left" />
            {t('back')}
          </Link>
          <div className="s-carnet-bar-title">
            <b>{t('title')}</b>
            <span>{orgName}</span>
          </div>
          <button type="button" className="btn btn-primary s-btn-sm" disabled={!items.length} onClick={() => window.print()}>
            <Icon name="print" />
            {t('print')}
          </button>
        </div>
      </header>

      <main className="s-wrap s-labels" id="contenu">
        <aside className="s-labels-side s-noprint" aria-label={t('settings')}>
          <p className="s-labels-intro">{t('intro')}</p>

          <fieldset className="s-labels-box">
            <legend>{t('format')}</legend>
            {(['large', 'small'] as const).map((k) => (
              <label key={k} className="s-labels-choice">
                <input type="radio" name="format" checked={format === k} onChange={() => setFormat(k)} />
                <span>
                  <b>{t(k)}</b>
                  <small>{t(`${k}Sub`)}</small>
                </span>
              </label>
            ))}
            <label className="s-labels-choice">
              <input type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} />
              <span>
                <b>{t('outline')}</b>
                <small>{t('outlineSub')}</small>
              </span>
            </label>
            <div className="s-labels-nums">
              <label className="field">
                <span>{t('copies')}</span>
                <input type="number" inputMode="numeric" min={1} max={20} value={copies} onChange={(e) => setCopies(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
              </label>
              <label className="field">
                <span>{t('start')}</span>
                <input type="number" inputMode="numeric" min={1} max={per} value={Math.min(start, per)} onChange={(e) => setStart(Math.min(per, Math.max(1, Number(e.target.value) || 1)))} aria-describedby="s-labels-start" />
                <small id="s-labels-start" className="muted">{t('startSub')}</small>
              </label>
            </div>
          </fieldset>

          <fieldset className="s-labels-box">
            <legend>{t('machines')}</legend>
            {machines.length ? (
              <>
                <div className="s-labels-pick">
                  <span className="muted">{t('selected', { n: chosen.size, total: machines.length })}</span>
                  <button type="button" className="btn btn-ghost s-btn-sm" onClick={() => setChosen(new Set(machines.map((m) => m.id)))}>
                    {t('all')}
                  </button>
                  <button type="button" className="btn btn-ghost s-btn-sm" onClick={() => setChosen(new Set())}>
                    {t('none')}
                  </button>
                </div>
                <ul className="s-labels-list">
                  {machines.map((m) => (
                    <li key={m.id}>
                      <label>
                        <input type="checkbox" checked={chosen.has(m.id)} onChange={() => toggle(m.id)} />
                        <b className="mono">{m.code}</b>
                        <span>{m.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">{t('noMachines')}</p>
            )}
          </fieldset>

          <p className="s-labels-summary" aria-live="polite">
            {items.length ? t('summary', { labels: items.length, pages: pages.length }) : t('empty')}
          </p>
          <p className="muted s-labels-tip">{t('tip')}</p>
        </aside>

        <div className="s-labels-pages" ref={pagesRef} aria-label={t('pages')}>
          <div style={{ zoom }}>
            {pages.map((page, i) => (
              <section
                key={`${format}-${i}`}
                className={`s-label-sheet is-${format}${outline ? ' has-outline' : ''}`}
                aria-label={t('preview', { n: i + 1, total: pages.length })}
              >
                {page.map((m, j) => (m ? <Label key={j} m={m} orgName={orgName} scan={t('scan')} /> : <div key={j} className="s-label is-skip" />))}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
