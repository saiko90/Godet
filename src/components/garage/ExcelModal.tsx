'use client';

// Import et export Excel du parc. Export : machines, carnet complet et échéances (pour la fiduciaire, l'assurance
// ou une revente). Import : machines et historique d'un ancien carnet, avec un aperçu avant d'écrire quoi que ce soit.
import { useMessages, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { AppMessages } from '@/i18n/messages';
import { can } from '@/lib/domain';
import type { Entry } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';
import { useGarage } from './context';
import { useErrorText } from './errors';
import type { ImportPlan } from './excel';
import { Modal } from './ui';

type ImportState =
  | { step: 'idle' }
  | { step: 'reading'; name: string }
  | { step: 'plan'; name: string; plan: ImportPlan }
  | { step: 'running'; name: string; n: number; total: number }
  | { step: 'error'; message: string };

const SHOWN_PROBLEMS = 8;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Nom de fichier sûr : « godet-parc-rossier-sa-2026-10-20.xlsx ». */
function fileName(base: string, org: string, today: string): string {
  const slug = org
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${[base, slug, today].filter(Boolean).join('-')}.xlsx`;
}

export function ExcelModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('excel');
  const messages = useMessages() as unknown as AppMessages;
  const f = useFormat();
  const dt = useDomainText();
  const g = useGarage();
  const errorText = useErrorText();
  const input = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<{ n: number; total: number } | null>(null);
  const [state, setState] = useState<ImportState>({ step: 'idle' });
  const canImport = can.manageFleet(g.role);
  const machines = g.fleet.machines;
  const texts = { sheets: messages.excel.sheets, cols: messages.excel.cols, example: messages.excel.example };
  const busy = Boolean(exporting) || state.step === 'running' || state.step === 'reading';

  /** Saisies d'une machine : dossier déjà chargé, sinon lecture. */
  async function entriesOf(machineId: string): Promise<Entry[]> {
    return (g.files[machineId] ?? (await g.repo().loadMachineFile(machineId))).entries;
  }

  async function runExport() {
    setExporting({ n: 0, total: machines.length });
    try {
      const xl = await import('./excel');
      const entries: Entry[] = [];
      let done = 0;
      // Quatre dossiers à la fois : rapide sans saturer la connexion d'un téléphone sur le chantier.
      const queue = [...machines];
      await Promise.all(
        Array.from({ length: Math.min(4, queue.length) }, async () => {
          for (let m = queue.shift(); m; m = queue.shift()) {
            entries.push(...(await entriesOf(m.id)));
            setExporting({ n: ++done, total: machines.length });
          }
        }),
      );
      const blob = await xl.exportWorkbook({ machines, entries, health: g.health, f, dt, texts, country: g.org.country });
      download(blob, fileName(t('file'), g.org.name, g.today));
      g.toast(t('exported'));
    } catch (e) {
      g.toast(errorText(e, 'action'), 'error');
    } finally {
      setExporting(null);
    }
  }

  async function runTemplate() {
    const xl = await import('./excel');
    download(await xl.templateWorkbook({ f, dt, texts, country: g.org.country, today: g.today }), `${t('templateFile')}.xlsx`);
  }

  async function pick(file: File) {
    setState({ step: 'reading', name: file.name });
    try {
      const xl = await import('./excel');
      const plan = await xl.planImport(file, { machines, f, existingEntries: entriesOf });
      setState({ step: 'plan', name: file.name, plan });
    } catch (e) {
      console.warn('[excel] lecture :', e);
      setState({ step: 'error', message: t('errRead') });
    }
  }

  async function runImport(name: string, plan: ImportPlan) {
    const total = plan.creates.length + plan.updates.length + plan.entries.length;
    let n = 0;
    const tick = () => setState({ step: 'running', name, n: ++n, total });
    setState({ step: 'running', name, n, total });
    const repo = g.repo();
    const ids = new Map(machines.map((m) => [m.code, m.id]));
    let machinesDone = 0;
    let entriesDone = 0;
    try {
      for (const m of plan.creates) {
        const created = await repo.addMachine(m);
        ids.set(created.code, created.id);
        machinesDone++;
        tick();
      }
      for (const u of plan.updates) {
        if (Object.keys(u.patch).length) await repo.updateMachine(u.id, u.patch);
        if (u.hours != null) await repo.addReading(u.id, u.hours);
        machinesDone++;
        tick();
      }
      for (const e of plan.entries) {
        const machineId = ids.get(e.code);
        if (machineId) {
          await repo.addEntry({ ...e.input, machineId });
          entriesDone++;
        }
        tick();
      }
      await g.refresh();
      g.effect('tick');
      g.toast(t('done', { machines: machinesDone, entries: entriesDone }));
      onClose();
    } catch (e) {
      await g.refresh().catch(() => undefined);
      setState({ step: 'error', message: t('errPartial', { message: errorText(e, 'action') }) });
    }
  }

  const plan = state.step === 'plan' ? state.plan : null;
  const nothing = plan && !plan.creates.length && !plan.updates.length && !plan.entries.length;

  return (
    <Modal labelledBy="xl-h" describedBy="xl-d" onClose={onClose} busy={busy} className="g-excel">
      <h2 id="xl-h">{t('title')}</h2>
      <p className="muted" id="xl-d">
        {t('intro')}
      </p>

      <section className="g-excel-part" aria-labelledby="xl-exp">
        <h3 id="xl-exp">{t('exportTitle')}</h3>
        <p className="muted">{t('exportText')}</p>
        <div className="g-excel-actions">
          <button type="button" className="btn btn-primary" disabled={busy || !machines.length} onClick={() => void runExport()}>
            {exporting ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="download" />}
            {exporting ? t('exporting', { n: exporting.n, total: exporting.total }) : t('exportBtn')}
          </button>
        </div>
      </section>

      <section className="g-excel-part" aria-labelledby="xl-imp">
        <h3 id="xl-imp">{t('importTitle')}</h3>
        {canImport ? (
          <>
            <p className="muted">{t('importText')}</p>
            <div className="g-excel-actions">
              <button type="button" className="btn btn-soft" disabled={busy} onClick={() => input.current?.click()}>
                <Icon name="upload" />
                {t('chooseFile')}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void runTemplate()}>
                <Icon name="table" />
                {t('templateBtn')}
              </button>
              <input
                ref={input}
                type="file"
                hidden
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void pick(file);
                }}
              />
            </div>

            <div aria-live="polite" className="g-excel-status">
              {state.step === 'reading' ? (
                <p className="muted">
                  <span className="g-spinner" aria-hidden="true" /> {t('reading')}
                </p>
              ) : null}
              {state.step === 'error' ? (
                <p className="err" role="alert">
                  {state.message}
                </p>
              ) : null}
              {state.step === 'running' ? (
                <p>
                  <span className="g-spinner" aria-hidden="true" /> {t('importing', { n: state.n, total: state.total })}
                </p>
              ) : null}
              {plan && state.step === 'plan' ? (
                <div className="g-excel-plan">
                  <p className="g-mini-title">{t('fileName', { name: state.name })}</p>
                  {nothing ? (
                    <p>{t('summary.nothing')}</p>
                  ) : (
                    <ul>
                      {plan.creates.length ? <li>{t('summary.newMachines', { count: plan.creates.length })}</li> : null}
                      {plan.updates.length ? <li>{t('summary.updated', { count: plan.updates.length })}</li> : null}
                      {plan.entries.length ? <li>{t('summary.entries', { count: plan.entries.length })}</li> : null}
                    </ul>
                  )}
                  {plan.duplicates ? <p className="muted">{t('summary.duplicates', { count: plan.duplicates })}</p> : null}
                  {plan.problems.length ? (
                    <div className="g-excel-problems">
                      <p className="g-hint is-warn">{t('problems', { count: plan.problems.length })}</p>
                      <ul>
                        {plan.problems.slice(0, SHOWN_PROBLEMS).map((p, i) => (
                          <li key={i}>
                            {t('problemLine', {
                              sheet: p.sheet,
                              row: p.row,
                              reason: t(`reason.${p.reason}`, {
                                value: p.value ?? '',
                                column: p.column ? messages.excel.cols[p.column] : '',
                                max: p.value ?? '',
                              }),
                            })}
                          </li>
                        ))}
                      </ul>
                      {plan.problems.length > SHOWN_PROBLEMS ? <p className="muted">{t('moreProblems', { count: plan.problems.length - SHOWN_PROBLEMS })}</p> : null}
                    </div>
                  ) : null}
                  {!nothing ? (
                    <div className="g-excel-actions">
                      <button type="button" className="btn btn-primary" onClick={() => void runImport(state.name, plan)}>
                        <Icon name="check" />
                        {t('confirm')}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="muted">{t('noRights')}</p>
        )}
      </section>

      <div className="dialog-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {t('close')}
        </button>
      </div>
    </Modal>
  );
}
