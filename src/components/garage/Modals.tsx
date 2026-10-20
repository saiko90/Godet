'use client';

// Modales du garage : machine (ajout / modification), compteur d'heures, échéance, retrait d'une saisie,
// confirmations (archivage, suppression d'échéance).
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { AiError, readMeter } from '@/lib/ai';
import { useGeoFix } from '@/lib/geo';
import { can, PAINTS } from '@/lib/domain';
import { addDays } from '@/lib/format';
import { categoryOf, MACHINE_CATEGORIES, TYPICAL_WEIGHT, type MachineCategory } from '@/lib/machine-kinds';
import type { MachineKind, ScheduleBasis } from '@/lib/types';
import type { NewMachine } from '@/lib/repo/types';
import { useDomainText } from '@/lib/use-domain-text';
import { useGarage } from './context';
import { useErrorText } from './errors';
import { aria, Field, focusFirstError, type Errors } from './fields';
import { nextCode } from './helpers';
import { KindIcon } from './KindIcon';
import { FileButton } from './MediaTab';
import { GeoNote } from './GeoNote';
import { parseLocalNumber } from './numbers';
import { useGarageText } from './text';
import { isTouch, Modal } from './ui';

const THIS_YEAR = new Date().getFullYear();
const bold = (chunks: React.ReactNode) => <b className="num">{chunks}</b>;

/** Nom d'une peinture proposée (garage.paints.<hex>), sinon le code couleur. */
function paintKey(hex: string): 'f3b71b' | 'e8792b' | 'd8362f' | '2f6fd8' | '3c9a5f' | 'e9e4d8' | '5b6068' | '1d1f24' | null {
  const k = hex.replace('#', '').toLowerCase();
  return (PAINTS as readonly string[]).includes(`#${k}`) ? (k as ReturnType<typeof paintKey>) : null;
}

function Foot({
  busy,
  onClose,
  label,
  danger = false,
  icon = 'check',
}: {
  busy: boolean;
  onClose: () => void;
  label: string;
  danger?: boolean;
  icon?: 'check' | 'archive' | 'trash';
}) {
  const tc = useTranslations('common');
  return (
    <div className="dialog-foot">
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
        {tc('actions.cancel')}
      </button>
      <button type="submit" className={`btn ${danger ? 'g-btn-danger' : 'btn-primary'}`} disabled={busy}>
        {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name={icon} />}
        {label}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ machine

export function MachineModal({ machineId, onClose }: { machineId?: string; onClose: () => void }) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const errorText = useErrorText();
  const prefixes = useMessages().garage.codePrefix;
  const g = useGarage();
  const machine = machineId ? g.fleet.machines.find((m) => m.id === machineId) : undefined;
  const editing = Boolean(machine);
  const [kind, setKind] = useState<MachineKind>(machine?.kind ?? 'pelle');
  // Famille affichée dans le sélecteur (celle de la machine modifiée, sinon le terrassement).
  const [family, setFamily] = useState<MachineCategory>(categoryOf(machine?.kind ?? 'pelle'));
  const td = useTranslations('domain');
  const [code, setCode] = useState(machine?.code ?? nextCode('pelle', g.fleet.machines, prefixes));
  const [codeTouched, setCodeTouched] = useState(editing);
  const [brand, setBrand] = useState(machine?.brand ?? '');
  const [model, setModel] = useState(machine?.model ?? '');
  const [year, setYear] = useState(machine?.year ? String(machine.year) : '');
  const [serial, setSerial] = useState(machine?.serial ?? '');
  const [plate, setPlate] = useState(machine?.plate ?? '');
  const [weight, setWeight] = useState(machine?.weight_t != null ? String(Number(machine.weight_t)) : '');
  const [hours, setHours] = useState(machine ? String(Number(machine.hours)) : '0');
  const [color, setColor] = useState(machine?.color ?? PAINTS[0]);
  const [notes, setNotes] = useState(machine?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (machineId && !machine) return null;

  const current = machine ? Number(machine.hours) : 0;
  const h = parseLocalNumber(hours, f);
  const lowering = editing && h != null && h < current;
  const paints: readonly string[] = PAINTS.includes(color as (typeof PAINTS)[number]) ? PAINTS : [...PAINTS, color];

  function chooseKind(k: MachineKind) {
    setKind(k);
    if (!codeTouched) setCode(nextCode(k, g.fleet.machines, prefixes));
  }

  async function submit() {
    const errs: Errors = {};
    const c = code.trim().toUpperCase();
    const maxChars = (n: number) => t('form.maxChars', { n: f.num(n) });
    if (!c) errs['mc-code'] = t('machineForm.errCode');
    else if (c.length > 16) errs['mc-code'] = t('machineForm.errCodeLong');
    else if (g.fleet.machines.some((m) => m.id !== machine?.id && m.code.toLowerCase() === c.toLowerCase())) {
      errs['mc-code'] = t('machineForm.errCodeTaken', { code: c });
    }
    let y: number | null = null;
    if (year.trim()) {
      y = parseLocalNumber(year, f);
      if (y == null || !Number.isInteger(y) || y < 1950 || y > THIS_YEAR + 1) errs['mc-year'] = t('machineForm.errYear', { max: String(THIS_YEAR + 1) });
    }
    let w: number | null = null;
    if (weight.trim()) {
      w = parseLocalNumber(weight, f);
      if (w == null || w <= 0 || w >= 1000) errs['mc-weight'] = t('machineForm.errWeight', { example: f.num(2.7, 1) });
      else w = Math.round(w * 10) / 10;
    }
    if (h == null || h < 0) errs['mc-hours'] = t('machineForm.errHours');
    else if (h > 9_999_999) errs['mc-hours'] = t('form.hoursTooHigh');
    if (brand.trim().length > 40) errs['mc-brand'] = maxChars(40);
    if (model.trim().length > 40) errs['mc-model'] = maxChars(40);
    if (serial.trim().length > 40) errs['mc-serial'] = maxChars(40);
    if (plate.trim().length > 20) errs['mc-plate'] = maxChars(20);
    if (notes.length > 2000) errs['mc-notes'] = maxChars(2000);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError(t('form.checkFields'));
      focusFirstError(['mc-code', 'mc-brand', 'mc-model', 'mc-year', 'mc-serial', 'mc-plate', 'mc-weight', 'mc-hours', 'mc-notes'], errs);
      return;
    }
    const input: NewMachine = {
      code: c,
      kind,
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: y,
      serial: serial.trim() || null,
      plate: plate.trim() || null,
      weightT: w,
      color,
      hours: h ?? 0,
      notes: notes.trim() || null,
    };
    setError(null);
    setBusy(true);
    try {
      if (machine) {
        const patch: Partial<NewMachine> = { ...input };
        if (h === current) delete patch.hours;
        await g.repo().updateMachine(machine.id, patch);
        await g.refresh(machine.id);
        g.effect('save');
        onClose();
        g.toast(t('machineForm.updated', { code: c }));
      } else {
        const created = await g.repo().addMachine(input);
        await g.refresh();
        g.effect('save');
        onClose();
        g.toast(t('machineForm.added', { code: created.code }));
        g.openSheet(created.id);
      }
    } catch (e) {
      setError(errorText(e, editing ? 'updateMachine' : 'addMachine'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="mc-h" onClose={onClose} onSubmit={() => void submit()} busy={busy} className="g-dialog-wide">
      <p className="eyebrow">
        {editing && machine
          ? t('machineForm.eyebrowEdit', { code: machine.code, eyebrow: gt.eyebrow(machine) })
          : t('machineForm.eyebrowNew', { org: g.org.name })}
      </p>
      <h2 id="mc-h">{editing ? t('machineForm.titleEdit') : t('machineForm.titleNew')}</h2>

      <div className="field">
        <span className="label" id="mc-kind-l">
          {t('machineForm.type')}
          <span className="g-kind-chosen"> · {dt.kind(kind)}</span>
        </span>
        <div className="g-kind-cats" role="group" aria-label={t('machineForm.family')}>
          {MACHINE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="g-kind-cat"
              aria-pressed={family === c.id}
              aria-controls="mc-kind-grid"
              onClick={() => setFamily(c.id)}
              disabled={busy}
            >
              {td(`machineCategories.${c.id}`)}
              {categoryOf(kind) === c.id ? <span className="g-kind-cat-dot" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        <div id="mc-kind-grid" className="g-kind-grid" role="group" aria-labelledby="mc-kind-l">
          {(MACHINE_CATEGORIES.find((c) => c.id === family)?.kinds ?? []).map((k) => (
            <button key={k} type="button" className="g-kind" aria-pressed={kind === k} onClick={() => chooseKind(k)} disabled={busy}>
              <KindIcon kind={k} />
              {/* nom complet ; sur téléphone, le nom court (le nom complet reste affiché au-dessus de la grille) */}
              <span className="g-kind-long">{dt.kind(k)}</span>
              <span className="g-kind-short">{dt.kindShort(k)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid2">
        <Field id="mc-code" label={t('machineForm.code')} errors={errors} hint={t('machineForm.codeHint')}>
          <input
            {...aria('mc-code', errors, true)}
            type="text"
            maxLength={16}
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            required
            data-autofocus=""
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setCodeTouched(true);
            }}
          />
        </Field>
        <Field id="mc-weight" label={t('machineForm.weight')} errors={errors}>
          <input
            {...aria('mc-weight', errors)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            placeholder={f.num(TYPICAL_WEIGHT[kind], Number.isInteger(TYPICAL_WEIGHT[kind]) ? 0 : TYPICAL_WEIGHT[kind] < 1 ? 2 : 1)}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-brand" label={t('machineForm.brand')} errors={errors}>
          <input
            {...aria('mc-brand', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={brand}
            placeholder={t('machineForm.brandPlaceholder')}
            onChange={(e) => setBrand(e.target.value)}
          />
        </Field>
        <Field id="mc-model" label={t('machineForm.model')} errors={errors}>
          <input
            {...aria('mc-model', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={model}
            placeholder={t('machineForm.modelPlaceholder')}
            onChange={(e) => setModel(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-year" label={t('machineForm.year')} errors={errors}>
          <input
            {...aria('mc-year', errors)}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={year}
            placeholder={String(THIS_YEAR)}
            onChange={(e) => setYear(e.target.value)}
          />
        </Field>
        <Field id="mc-serial" label={t('machineForm.serial')} errors={errors}>
          <input
            {...aria('mc-serial', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={serial}
            placeholder={t('machineForm.serialPlaceholder')}
            onChange={(e) => setSerial(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-plate" label={t('machineForm.plate')} errors={errors} hint={t('machineForm.plateHint')}>
          <input
            {...aria('mc-plate', errors, true)}
            type="text"
            maxLength={20}
            autoComplete="off"
            value={plate}
            placeholder={t('machineForm.platePlaceholder')}
            onChange={(e) => setPlate(e.target.value)}
          />
        </Field>
        <Field
          id="mc-hours"
          label={t('machineForm.hours')}
          errors={errors}
          hint={editing ? t('form.currentHours', { hours: f.hours(current) }) : t('machineForm.hoursToday')}
          warn={lowering ? t('machineForm.hoursLower') : undefined}
        >
          <input
            {...aria('mc-hours', errors, true)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
      </div>

      <div className="field">
        <span className="label" id="mc-paint-l">
          {t('machineForm.paint')}
        </span>
        <div className="swatches" role="group" aria-labelledby="mc-paint-l">
          {paints.map((p) => {
            const key = paintKey(p);
            const name = key ? t(`paints.${key}`) : p;
            return (
            <button
              key={p}
              type="button"
              className="swatch"
              aria-pressed={color === p}
              aria-label={name}
              title={name}
              style={{ background: p }}
              onClick={() => setColor(p)}
              disabled={busy}
            >
              {color === p ? <Icon name="check" className="g-swatch-check" /> : null}
            </button>
            );
          })}
        </div>
      </div>

      <Field id="mc-notes" label={t('machineForm.notes')} errors={errors}>
        <textarea
          {...aria('mc-notes', errors)}
          maxLength={2000}
          value={notes}
          placeholder={t('machineForm.notesPlaceholder')}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      {!editing ? (
        <p className="g-hint">{t('machineForm.defaultsHint')}</p>
      ) : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dialog-foot g-foot-split">
        {editing && machine && can.manageFleet(g.role) ? (
          <button
            type="button"
            className="btn g-btn-quiet-danger"
            onClick={() => g.openModal({ type: 'archive', machineId: machine.id })}
            disabled={busy}
          >
            <Icon name="archive" />
            {t('machineForm.archive')}
          </button>
        ) : null}
        <span className="g-foot-gap" />
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {tc('actions.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name={editing ? 'check' : 'plus'} />}
          {editing ? tc('actions.save') : t('machineForm.add')}
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ compteur d'heures

/** Origine d'un relevé (garage.hoursForm.source.*). */
const SOURCES = ['saisie', 'intervention', 'creation', 'location'] as const;
const isSource = (s: string): s is (typeof SOURCES)[number] => (SOURCES as readonly string[]).includes(s);

export function HoursModal({ machineId, onClose }: { machineId: string; onClose: () => void }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const gt = useGarageText();
  const errorText = useErrorText();
  const g = useGarage();
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  const file = g.files[machineId];
  const [value, setValue] = useState(machine ? String(Number(machine.hours)) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  /** Photo du compteur lue par l'IA : jointe aux médias de la machine avec le relevé (preuve du chiffre). */
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoNote, setPhotoNote] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);
  const locale = useLocale();
  const geo = useGeoFix(g.mode === 'cloud' && g.org.track_location);
  const [withGeo, setWithGeo] = useState(true);
  if (!machine) return null;

  /** Lecture du compteur sur une photo : la valeur est proposée, la personne vérifie avant d'enregistrer. */
  async function fromPhoto(file: File | undefined) {
    if (!file || !machine) return;
    setError(null);
    setPhotoNote(null);
    if (g.mode === 'demo') {
      setPhotoNote({ text: t('hoursForm.photo.demo'), tone: 'warn' });
      return;
    }
    setReading(true);
    setPhotoFile(file);
    try {
      const r = await readMeter({ orgId: g.org.id, locale, file, machineId: machine.id });
      if (r.hours == null) {
        setPhotoNote({ text: r.note || t('hoursForm.photo.unreadable'), tone: 'warn' });
      } else {
        setValue(String(r.hours));
        const sure = r.confidence === 'high';
        setPhotoNote({
          text: `${sure ? t('hoursForm.photo.read', { hours: f.hours(r.hours) }) : t('hoursForm.photo.unsure', { hours: f.hours(r.hours) })}${r.note ? ` ${r.note}` : ''} ${t('hoursForm.photo.willAttach')}`,
          tone: sure ? 'ok' : 'warn',
        });
        if (!isTouch()) document.getElementById('hr-value')?.focus();
      }
    } catch (e) {
      setPhotoNote({ text: t(`hoursForm.photo.errors.${e instanceof AiError ? e.code : 'generic'}`), tone: 'warn' });
    } finally {
      setReading(false);
    }
  }

  const current = Number(machine.hours);
  const n = parseLocalNumber(value, f);
  const diff = n != null ? n - current : null;
  const lower = n != null && n < current;
  const recent = (file?.readings ?? g.fleet.readings.filter((r) => r.machine_id === machineId)).slice(-5).reverse();
  const invalid = n == null || n < 0;

  async function submit() {
    if (!machine) return;
    if (invalid) {
      setError(t('form.hoursDigits', { example: f.num(6866) }));
      document.getElementById('hr-value')?.focus();
      return;
    }
    if (lower) {
      setError(t('hoursForm.errBackwards', { hours: f.hours(current) }));
      document.getElementById('hr-value')?.focus();
      return;
    }
    if (n > 9_999_999) {
      setError(t('form.hoursTooHigh'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await g.repo().addReading(machine.id, n, withGeo ? geo.fix : null);
      let photoFailed = false;
      if (photoFile) {
        const out = await g.upload(machine.id, [photoFile], { caption: t('hoursForm.photo.caption', { hours: f.hours(n) }) });
        photoFailed = out.errors.length > 0;
      }
      await g.refresh(machine.id);
      g.effect('tick');
      onClose();
      const saved = diff
        ? t('hoursForm.savedDiff', { code: machine.code, hours: f.hours(n), diff: f.hours(diff) })
        : t('hoursForm.saved', { code: machine.code, hours: f.hours(n) });
      g.toast(photoFailed ? `${saved} ${t('hoursForm.photo.notAttached')}` : saved, photoFailed ? 'error' : 'ok');
    } catch (e) {
      setError(errorText(e, 'reading'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="hr-h" describedBy="hr-d" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {machine.code} · {gt.eyebrow(machine)}
      </p>
      <h2 id="hr-h">{t('hoursForm.title')}</h2>
      <p className="muted" id="hr-d">
        {t.rich('hoursForm.last', { hours: f.hours(current), date: f.date(machine.hours_at), b: bold })}
      </p>
      <div className="field">
        <label htmlFor="hr-value">{t('hoursForm.label')}</label>
        <div className="g-input-unit">
          <input
            id="hr-value"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            aria-invalid={lower || undefined}
            aria-describedby="hr-diff"
            data-autofocus=""
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <span aria-hidden="true">{t('hoursForm.unit')}</span>
        </div>
        <p className={`g-hint${lower ? ' is-bad' : diff && diff > 2000 ? ' is-warn' : ''}`} id="hr-diff" aria-live="polite">
          {n == null
            ? t('hoursForm.hintEmpty')
            : lower
              ? t('hoursForm.hintLower', { hours: f.hours(current - n) })
              : diff === 0
                ? t('hoursForm.hintSame')
                : diff && diff > 2000
                  ? t('hoursForm.hintBig', { hours: f.hours(diff) })
                  : t('hoursForm.hintDiff', { hours: f.hours(diff ?? 0) })}
        </p>
      </div>
      <div className="g-meter-photo">
        <p className="g-mini-title">{t('hoursForm.photo.button')}</p>
        {reading ? (
          <p className="g-hint" role="status">
            <span className="g-spinner" aria-hidden="true" /> {t('hoursForm.photo.reading')}
          </p>
        ) : (
          <div className="g-meter-photo-btns">
            {/* Deux boutons : certains téléphones n'offrent que la galerie quand l'appareil photo n'est pas demandé. */}
            <FileButton accept="image/*" capture="environment" className="btn btn-soft" disabled={busy} onFiles={(files) => void fromPhoto(files[0])}>
              <Icon name="camera" />
              {t('hoursForm.photo.camera')}
            </FileButton>
            <FileButton accept="image/*" className="btn btn-soft" disabled={busy} onFiles={(files) => void fromPhoto(files[0])}>
              <Icon name="upload" />
              {t('hoursForm.photo.gallery')}
            </FileButton>
          </div>
        )}
        {photoNote ? (
          <p className={`g-hint${photoNote.tone === 'warn' ? ' is-warn' : ''}`} role="status">
            {photoNote.text}
          </p>
        ) : (
          <p className="g-hint">{t('hoursForm.photo.hint')}</p>
        )}
      </div>
      <GeoNote state={geo.state} accuracy={geo.fix?.accuracy ?? null} on={withGeo} onToggle={setWithGeo} />
      {recent.length ? (
        <div>
          <p className="g-mini-title">{t('hoursForm.recent')}</p>
          <ul className="g-readings">
            {recent.map((r) => (
              <li key={r.id}>
                <span className="num">{f.hours(Number(r.hours))}</span>
                <span>{f.dateTime(r.read_at)}</span>
                <span className="g-reading-src">{isSource(r.source) ? t(`hoursForm.source.${r.source}`) : r.source}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      <Foot busy={busy} onClose={onClose} label={t('hoursForm.save')} />
    </Modal>
  );
}

// ------------------------------------------------------------------ échéance

type Unit = 'jours' | 'mois' | 'ans';
const UNIT_DAYS: Record<Unit, number> = { jours: 1, mois: 30.44, ans: 365 };

function splitDays(days: number | null): { value: string; unit: Unit } {
  if (!days) return { value: '', unit: 'ans' };
  if (days % 365 === 0) return { value: String(days / 365), unit: 'ans' };
  const m = Math.round(days / 30.44);
  if (m >= 1 && Math.abs(m * 30.44 - days) <= 2) return { value: String(m), unit: 'mois' };
  return { value: String(days), unit: 'jours' };
}

/** Échéances courantes (libellés : garage.schedules.presets.*). */
const PRESETS: { key: 'service' | 'safety' | 'extinguisher' | 'hydraulicOil' | 'undercarriage' | 'roadworthiness'; basis: ScheduleBasis; hours?: number; years?: number }[] = [
  { key: 'service', basis: 'heures', hours: 500 },
  { key: 'safety', basis: 'date', years: 1 },
  { key: 'extinguisher', basis: 'date', years: 1 },
  { key: 'hydraulicOil', basis: 'heures', hours: 2000 },
  { key: 'undercarriage', basis: 'heures', hours: 1000 },
  { key: 'roadworthiness', basis: 'date', years: 1 },
];

export function ScheduleModal({ machineId, scheduleId, onClose }: { machineId: string; scheduleId?: string; onClose: () => void }) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const gt = useGarageText();
  const errorText = useErrorText();
  const g = useGarage();
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  const schedule = scheduleId ? (g.files[machineId]?.schedules ?? g.fleet.schedules).find((s) => s.id === scheduleId) : undefined;
  const editing = Boolean(schedule);
  const base = machine ? Number(machine.hours) : 0;
  const initialDays = splitDays(schedule?.interval_days ?? (schedule ? null : 365));
  const [label, setLabel] = useState(schedule?.label ?? '');
  const [basis, setBasis] = useState<ScheduleBasis>(schedule?.basis ?? 'heures');
  const [everyH, setEveryH] = useState(schedule ? (schedule.interval_hours != null ? String(Number(schedule.interval_hours)) : '') : '500');
  const [dueH, setDueH] = useState(schedule?.due_hours != null ? String(Number(schedule.due_hours)) : String(Math.round(base + 500)));
  const [everyD, setEveryD] = useState(initialDays.value);
  const [unit, setUnit] = useState<Unit>(initialDays.unit);
  const [dueD, setDueD] = useState(schedule?.due_date ?? addDays(g.today, 365));
  const [dueTouched, setDueTouched] = useState(editing);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!machine || (scheduleId && !schedule)) return null;

  const days = () => {
    const v = parseLocalNumber(everyD, f);
    return v != null && v > 0 ? Math.round(v * UNIT_DAYS[unit]) : null;
  };

  function retarget(nextBasis: ScheduleBasis, hoursEvery: string, dEvery: string, dUnit: Unit) {
    if (dueTouched) return;
    if (nextBasis === 'heures') {
      const e = parseLocalNumber(hoursEvery, f);
      if (e != null && e > 0) setDueH(String(Math.round(base + e)));
    } else {
      const v = parseLocalNumber(dEvery, f);
      if (v != null && v > 0) setDueD(addDays(g.today, Math.round(v * UNIT_DAYS[dUnit])));
    }
  }

  const presets = PRESETS.map((p) => ({ ...p, label: t(`schedules.presets.${p.key}`) }));

  function preset(p: (typeof presets)[number]) {
    setLabel(p.label);
    setBasis(p.basis);
    if (p.basis === 'heures' && p.hours) {
      setEveryH(String(p.hours));
      retarget('heures', String(p.hours), everyD, unit);
    } else if (p.years) {
      setEveryD(String(p.years));
      setUnit('ans');
      retarget('date', everyH, String(p.years), 'ans');
    }
  }

  async function submit() {
    if (!machine) return;
    const errs: Errors = {};
    const l = label.trim();
    if (!l) errs['sc-label'] = t('scheduleForm.errLabel');
    else if (l.length > 80) errs['sc-label'] = t('form.maxChars', { n: f.num(80) });
    let intervalHours: number | null = null;
    let dueHours: number | null = null;
    let intervalDays: number | null = null;
    let dueDate: string | null = null;
    if (basis === 'heures') {
      if (everyH.trim()) {
        intervalHours = parseLocalNumber(everyH, f);
        if (intervalHours == null || intervalHours <= 0 || intervalHours > 100_000) errs['sc-every-h'] = t('scheduleForm.errEveryHours');
      }
      dueHours = parseLocalNumber(dueH, f);
      if (dueHours == null || dueHours < 0 || dueHours > 9_999_999) errs['sc-due-h'] = t('scheduleForm.errDueHours');
    } else {
      if (everyD.trim()) {
        intervalDays = days();
        if (intervalDays == null || intervalDays > 36_500) errs['sc-every-d'] = t('scheduleForm.errEvery');
      }
      dueDate = dueD || null;
      if (!dueDate) errs['sc-due-d'] = t('scheduleForm.errDueDate');
    }
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError(t('form.checkFields'));
      focusFirstError(['sc-label', 'sc-every-h', 'sc-due-h', 'sc-every-d', 'sc-due-d'], errs);
      return;
    }
    // Point de départ de la jauge : la fois précédente, déduite de l'intervalle.
    const lastHours =
      basis === 'heures' && intervalHours && dueHours != null && dueHours - intervalHours >= 0 ? dueHours - intervalHours : null;
    const lastDate = basis === 'date' && intervalDays && dueDate ? addDays(dueDate, -intervalDays) : null;
    setError(null);
    setBusy(true);
    try {
      let savedId: string;
      if (schedule) {
        const saved = await g.repo().updateSchedule(schedule.id, {
          label: l,
          basis,
          intervalHours: basis === 'heures' ? intervalHours : null,
          intervalDays: basis === 'date' ? intervalDays : null,
          dueHours: basis === 'heures' ? dueHours : null,
          dueDate: basis === 'date' ? dueDate : null,
          // Changement de base : le point de départ de la jauge repart de l'intervalle.
          ...(basis !== schedule.basis ? { lastHours, lastDate: lastDate && lastDate <= g.today ? lastDate : null } : {}),
        });
        savedId = saved.id;
      } else {
        const saved = await g.repo().addSchedule({
          machineId: machine.id,
          label: l,
          basis,
          intervalHours: basis === 'heures' ? intervalHours : null,
          intervalDays: basis === 'date' ? intervalDays : null,
          dueHours: basis === 'heures' ? dueHours : null,
          dueDate: basis === 'date' ? dueDate : null,
          lastHours,
          lastDate: lastDate && lastDate <= g.today ? lastDate : null,
        });
        savedId = saved.id;
      }
      await g.refresh(machine.id);
      g.setTab('echeances');
      g.setFlash(savedId);
      g.effect('save');
      onClose();
      g.toast(editing ? t('scheduleForm.updated', { label: l }) : t('scheduleForm.added', { label: l, code: machine.code }));
    } catch (e) {
      setError(errorText(e, 'schedule'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="sc-h" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {machine.code} · {gt.eyebrow(machine)}
      </p>
      <h2 id="sc-h">{editing ? t('scheduleForm.titleEdit') : t('scheduleForm.titleNew')}</h2>

      <Field id="sc-label" label={t('scheduleForm.label')} errors={errors}>
        <input
          {...aria('sc-label', errors)}
          type="text"
          maxLength={80}
          autoComplete="off"
          value={label}
          placeholder={t('scheduleForm.labelPlaceholder')}
          data-autofocus=""
          onChange={(e) => setLabel(e.target.value)}
        />
        {!editing ? (
          <div className="g-suggest" role="group" aria-label={t('scheduleForm.common')}>
            {presets.filter((p) => p.label !== label.trim()).map((p) => (
              <button key={p.key} type="button" onClick={() => preset(p)} disabled={busy}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <div className="field">
        <span className="label" id="sc-basis-l">
          {t('scheduleForm.basis')}
        </span>
        <div className="seg" role="group" aria-labelledby="sc-basis-l">
          <button
            type="button"
            aria-pressed={basis === 'heures'}
            onClick={() => {
              setBasis('heures');
              retarget('heures', everyH, everyD, unit);
            }}
            disabled={busy}
          >
            <Icon name="clock" />
            {t('scheduleForm.basisHours')}
          </button>
          <button
            type="button"
            aria-pressed={basis === 'date'}
            onClick={() => {
              setBasis('date');
              retarget('date', everyH, everyD, unit);
            }}
            disabled={busy}
          >
            <Icon name="calendar" />
            {t('scheduleForm.basisDate')}
          </button>
        </div>
      </div>

      {basis === 'heures' ? (
        <div className="grid2">
          <Field id="sc-every-h" label={t('scheduleForm.everyHours')} errors={errors} hint={t('scheduleForm.everyHint')}>
            <input
              {...aria('sc-every-h', errors, true)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={everyH}
              placeholder="500"
              onChange={(e) => {
                setEveryH(e.target.value);
                retarget('heures', e.target.value, everyD, unit);
              }}
            />
          </Field>
          <Field id="sc-due-h" label={t('scheduleForm.dueHours')} errors={errors} hint={t('scheduleForm.dueHoursHint', { hours: f.hours(base) })}>
            <input
              {...aria('sc-due-h', errors, true)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={dueH}
              onChange={(e) => {
                setDueH(e.target.value);
                setDueTouched(true);
              }}
            />
          </Field>
        </div>
      ) : (
        <div className="grid2">
          <Field id="sc-every-d" label={t('scheduleForm.every')} errors={errors} hint={t('scheduleForm.everyHint')}>
            <div className="g-input-unit">
              <input
                {...aria('sc-every-d', errors, true)}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={everyD}
                placeholder="1"
                onChange={(e) => {
                  setEveryD(e.target.value);
                  retarget('date', everyH, e.target.value, unit);
                }}
              />
              <select
                aria-label={t('scheduleForm.unit')}
                value={unit}
                onChange={(e) => {
                  const u = e.target.value as Unit;
                  setUnit(u);
                  retarget('date', everyH, everyD, u);
                }}
              >
                <option value="jours">{t('scheduleForm.units.jours')}</option>
                <option value="mois">{t('scheduleForm.units.mois')}</option>
                <option value="ans">{t('scheduleForm.units.ans')}</option>
              </select>
            </div>
          </Field>
          <Field id="sc-due-d" label={t('scheduleForm.dueDate')} errors={errors}>
            <input
              {...aria('sc-due-d', errors)}
              type="date"
              value={dueD}
              onChange={(e) => {
                setDueD(e.target.value);
                setDueTouched(true);
              }}
            />
          </Field>
        </div>
      )}

      {schedule?.last_date ? (
        <p className="g-hint">
          {schedule.last_hours != null && schedule.basis === 'heures'
            ? t('scheduleForm.lastHours', { date: f.date(schedule.last_date), hours: f.hours(Number(schedule.last_hours)) })
            : t('scheduleForm.last', { date: f.date(schedule.last_date) })}
        </p>
      ) : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      <div className="dialog-foot g-foot-split">
        {editing && schedule ? (
          <button
            type="button"
            className="btn g-btn-quiet-danger"
            onClick={() => g.openModal({ type: 'delete-schedule', machineId: machine.id, scheduleId: schedule.id })}
            disabled={busy}
          >
            <Icon name="trash" />
            {tc('actions.delete')}
          </button>
        ) : null}
        <span className="g-foot-gap" />
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {tc('actions.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="check" />}
          {editing ? tc('actions.save') : t('scheduleForm.add')}
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ retrait d'une saisie

export function RemoveEntryModal({ machineId, entryId, onClose }: { machineId: string; entryId: string; onClose: () => void }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const errorText = useErrorText();
  const g = useGarage();
  const reasons = [t('removeForm.reasons.duplicate'), t('removeForm.reasons.wrongMachine'), t('removeForm.reasons.wrongValue')];
  const entry = g.files[machineId]?.entries.find((e) => e.id === entryId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!entry) return null;

  async function submit() {
    if (!entry) return;
    const r = reason.trim();
    if (!r) {
      setError(t('removeForm.errReason'));
      document.getElementById('rm-reason')?.focus();
      return;
    }
    if (r.length > 300) {
      setError(t('removeForm.errReasonLong'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await g.repo().removeEntry(entry.id, r);
      await g.refresh(machineId);
      g.setFlash(entry.id);
      g.effect('tick');
      onClose();
      g.toast(t('removeForm.done'));
    } catch (e) {
      setError(errorText(e, 'removeEntry'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="rm-h" describedBy="rm-d" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {f.date(entry.date)} · {entry.title}
      </p>
      <h2 id="rm-h">{t('removeForm.title')}</h2>
      <p className="muted" id="rm-d">
        {t('removeForm.text')}
      </p>
      <div className={`field${error ? ' has-error' : ''}`}>
        <label htmlFor="rm-reason">{t('removeForm.reason')}</label>
        <textarea
          id="rm-reason"
          maxLength={300}
          value={reason}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'rm-err' : undefined}
          placeholder={t('removeForm.reasonPlaceholder')}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="g-suggest" role="group" aria-label={t('removeForm.common')}>
          {reasons.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} disabled={busy}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="err" role="alert" id="rm-err">
          {error}
        </p>
      ) : null}
      <Foot busy={busy} onClose={onClose} label={t('removeForm.submit')} danger icon="trash" />
    </Modal>
  );
}

// ------------------------------------------------------------------ confirmations

export function ConfirmModal({
  title,
  eyebrow,
  children,
  confirm,
  icon,
  onConfirm,
  onClose,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  confirm: string;
  icon: 'archive' | 'trash';
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const tc = useTranslations('common');
  const errorText = useErrorText();
  const g = useGarage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(errorText(e, 'action'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="cf-h" describedBy="cf-d" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id="cf-h">{title}</h2>
      <div className="muted g-confirm-text" id="cf-d">
        {children}
      </div>
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      <div className="dialog-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy} data-autofocus="">
          {tc('actions.cancel')}
        </button>
        <button type="submit" className="btn g-btn-danger" disabled={busy}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name={icon} />}
          {confirm}
        </button>
      </div>
    </Modal>
  );
}

export function ArchiveModal({ machineId, onClose, onArchived }: { machineId: string; onClose: () => void; onArchived: () => void }) {
  const t = useTranslations('garage.archiveForm');
  const f = useFormat();
  const gt = useGarageText();
  const g = useGarage();
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  if (!machine) return null;
  return (
    <ConfirmModal
      title={t('title', { code: machine.code })}
      eyebrow={gt.eyebrow(machine)}
      confirm={t('confirm')}
      icon="archive"
      onClose={onClose}
      onConfirm={async () => {
        await g.repo().archiveMachine(machine.id);
        onArchived();
        await g.refresh();
        g.effect('close');
        onClose();
        g.toast(t('done', { code: machine.code }));
      }}
    >
      <p>{t('text')}</p>
      <p>
        {machine.year
          ? t.rich('meterYear', { hours: f.hours(Number(machine.hours)), year: String(machine.year), b: bold })
          : t.rich('meter', { hours: f.hours(Number(machine.hours)), b: bold })}
      </p>
    </ConfirmModal>
  );
}

export function DeleteScheduleModal({ machineId, scheduleId, onClose }: { machineId: string; scheduleId: string; onClose: () => void }) {
  const t = useTranslations('garage.deleteScheduleForm');
  const g = useGarage();
  const schedule = (g.files[machineId]?.schedules ?? g.fleet.schedules).find((s) => s.id === scheduleId);
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  if (!schedule || !machine) return null;
  return (
    <ConfirmModal
      title={t('title', { label: schedule.label })}
      eyebrow={machine.code}
      confirm={t('confirm')}
      icon="trash"
      onClose={onClose}
      onConfirm={async () => {
        await g.repo().deleteSchedule(schedule.id);
        await g.refresh(machineId);
        g.effect('tick');
        onClose();
        g.toast(t('done', { label: schedule.label }));
      }}
    >
      <p>{t('text', { code: machine.code })}</p>
    </ConfirmModal>
  );
}
