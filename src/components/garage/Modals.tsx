'use client';

// Modales du garage : machine (ajout / modification), compteur d'heures, échéance, retrait d'une saisie,
// confirmations (archivage, suppression d'échéance).
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { can, MACHINE_KINDS, PAINTS } from '@/lib/domain';
import { addDays, dateCH, dateTimeCH, grp, hrs, parseNumber } from '@/lib/format';
import type { MachineKind, ScheduleBasis } from '@/lib/types';
import type { NewMachine } from '@/lib/repo/types';
import { useGarage } from './context';
import { aria, Field, focusFirstError, type Errors } from './fields';
import { errorText, machineEyebrow, nextCode, PAINT_NAMES } from './helpers';
import { KindIcon } from './KindIcon';
import { Modal } from './ui';

const KIND_ORDER: MachineKind[] = ['pelle', 'mini_pelle', 'chargeuse', 'dumper', 'camion', 'rouleau', 'grue', 'autre'];
const THIS_YEAR = new Date().getFullYear();

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
  return (
    <div className="dialog-foot">
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
        Annuler
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
  const g = useGarage();
  const machine = machineId ? g.fleet.machines.find((m) => m.id === machineId) : undefined;
  const editing = Boolean(machine);
  const [kind, setKind] = useState<MachineKind>(machine?.kind ?? 'pelle');
  const [code, setCode] = useState(machine?.code ?? nextCode('pelle', g.fleet.machines));
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
  const h = parseNumber(hours);
  const lowering = editing && h != null && h < current;
  const paints: readonly string[] = PAINTS.includes(color as (typeof PAINTS)[number]) ? PAINTS : [...PAINTS, color];

  function chooseKind(k: MachineKind) {
    setKind(k);
    if (!codeTouched) setCode(nextCode(k, g.fleet.machines));
  }

  async function submit() {
    const errs: Errors = {};
    const c = code.trim().toUpperCase();
    if (!c) errs['mc-code'] = 'Donnez un code interne à la machine, par exemple PE-02.';
    else if (c.length > 16) errs['mc-code'] = 'Le code fait 16 caractères au plus.';
    else if (g.fleet.machines.some((m) => m.id !== machine?.id && m.code.toLowerCase() === c.toLowerCase())) {
      errs['mc-code'] = `Le code ${c} est déjà utilisé dans le parc. Choisissez-en un autre.`;
    }
    let y: number | null = null;
    if (year.trim()) {
      y = parseNumber(year);
      if (y == null || !Number.isInteger(y) || y < 1950 || y > THIS_YEAR + 1)
        errs['mc-year'] = `Indiquez une année entre 1950 et ${THIS_YEAR + 1}.`;
    }
    let w: number | null = null;
    if (weight.trim()) {
      w = parseNumber(weight);
      if (w == null || w <= 0 || w >= 1000) errs['mc-weight'] = 'Indiquez le poids en tonnes, par exemple 21 ou 2.7.';
      else w = Math.round(w * 10) / 10;
    }
    if (h == null || h < 0) errs['mc-hours'] = 'Indiquez le compteur en heures, avec des chiffres (0 pour une machine neuve).';
    else if (h > 9_999_999) errs['mc-hours'] = 'Ce compteur est trop élevé.';
    if (brand.trim().length > 40) errs['mc-brand'] = '40 caractères au plus.';
    if (model.trim().length > 40) errs['mc-model'] = '40 caractères au plus.';
    if (serial.trim().length > 40) errs['mc-serial'] = '40 caractères au plus.';
    if (plate.trim().length > 20) errs['mc-plate'] = '20 caractères au plus.';
    if (notes.length > 2000) errs['mc-notes'] = '2’000 caractères au plus.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError('Vérifiez les champs signalés.');
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
        g.toast(`${c} mise à jour`);
      } else {
        const created = await g.repo().addMachine(input);
        await g.refresh();
        g.effect('save');
        onClose();
        g.toast(`${created.code} ajoutée au parc, avec ses échéances par défaut`);
        g.openSheet(created.id);
      }
    } catch (e) {
      setError(errorText(e, editing ? 'La machine n’a pas pu être modifiée.' : 'La machine n’a pas pu être ajoutée.'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="mc-h" onClose={onClose} onSubmit={() => void submit()} busy={busy} className="g-dialog-wide">
      <p className="eyebrow">{editing && machine ? `${machine.code} · ${machineEyebrow(machine)}` : `Parc · ${g.org.name}`}</p>
      <h2 id="mc-h">{editing ? 'Modifier la machine' : 'Ajouter une machine'}</h2>

      <div className="field">
        <span className="label" id="mc-kind-l">
          Type
        </span>
        <div className="g-kind-grid" role="group" aria-labelledby="mc-kind-l">
          {KIND_ORDER.map((k) => (
            <button key={k} type="button" className="g-kind" aria-pressed={kind === k} onClick={() => chooseKind(k)} disabled={busy}>
              <KindIcon kind={k} />
              <span>{MACHINE_KINDS[k].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid2">
        <Field id="mc-code" label="Code interne" errors={errors} hint="Marqué sur la machine et au sol de sa baie.">
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
        <Field id="mc-weight" label="Poids (t)" errors={errors}>
          <input
            {...aria('mc-weight', errors)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            placeholder="21"
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-brand" label="Marque" errors={errors}>
          <input
            {...aria('mc-brand', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={brand}
            placeholder="Constructeur"
            onChange={(e) => setBrand(e.target.value)}
          />
        </Field>
        <Field id="mc-model" label="Modèle" errors={errors}>
          <input
            {...aria('mc-model', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={model}
            placeholder="Modèle"
            onChange={(e) => setModel(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-year" label="Année" errors={errors}>
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
        <Field id="mc-serial" label="N° de série" errors={errors}>
          <input
            {...aria('mc-serial', errors)}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={serial}
            placeholder="Plaque du constructeur"
            onChange={(e) => setSerial(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid2">
        <Field id="mc-plate" label="Plaque" errors={errors} hint="Pour les engins immatriculés.">
          <input
            {...aria('mc-plate', errors, true)}
            type="text"
            maxLength={20}
            autoComplete="off"
            value={plate}
            placeholder="VS 123 456"
            onChange={(e) => setPlate(e.target.value)}
          />
        </Field>
        <Field
          id="mc-hours"
          label="Compteur (h)"
          errors={errors}
          hint={editing ? `Actuel : ${hrs(current)}` : 'Heures au compteur aujourd’hui.'}
          warn={lowering ? 'Correction à la baisse : à utiliser seulement pour corriger une erreur de saisie.' : undefined}
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
          Peinture
        </span>
        <div className="swatches" role="group" aria-labelledby="mc-paint-l">
          {paints.map((p) => (
            <button
              key={p}
              type="button"
              className="swatch"
              aria-pressed={color === p}
              aria-label={PAINT_NAMES[p] ?? p}
              title={PAINT_NAMES[p] ?? p}
              style={{ background: p }}
              onClick={() => setColor(p)}
              disabled={busy}
            >
              {color === p ? <Icon name="check" className="g-swatch-check" /> : null}
            </button>
          ))}
        </div>
      </div>

      <Field id="mc-notes" label="Remarques" errors={errors}>
        <textarea
          {...aria('mc-notes', errors)}
          maxLength={2000}
          value={notes}
          placeholder="Équipements, accessoires, particularités…"
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      {!editing ? (
        <p className="g-hint">
          Godet ajoute deux échéances par défaut : un service toutes les 500 h et le contrôle annuel de sécurité. Vous pourrez les adapter.
        </p>
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
            Archiver
          </button>
        ) : null}
        <span className="g-foot-gap" />
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name={editing ? 'check' : 'plus'} />}
          {editing ? 'Enregistrer' : 'Ajouter au parc'}
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ compteur d'heures

const SOURCE: Record<string, string> = { saisie: 'relevé', intervention: 'intervention', creation: 'création' };

export function HoursModal({ machineId, onClose }: { machineId: string; onClose: () => void }) {
  const g = useGarage();
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  const file = g.files[machineId];
  const [value, setValue] = useState(machine ? String(Number(machine.hours)) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!machine) return null;

  const current = Number(machine.hours);
  const n = parseNumber(value);
  const diff = n != null ? n - current : null;
  const lower = n != null && n < current;
  const recent = (file?.readings ?? g.fleet.readings.filter((r) => r.machine_id === machineId)).slice(-5).reverse();
  const invalid = n == null || n < 0;

  async function submit() {
    if (!machine) return;
    if (invalid) {
      setError('Indiquez le compteur en heures, avec des chiffres (par exemple 6’866).');
      document.getElementById('hr-value')?.focus();
      return;
    }
    if (lower) {
      setError(
        `Le compteur ne peut pas reculer : le dernier relevé est de ${hrs(current)}. En cas d’erreur de saisie, corrigez-le dans « Modifier la machine ».`,
      );
      document.getElementById('hr-value')?.focus();
      return;
    }
    if (n > 9_999_999) {
      setError('Ce compteur est trop élevé.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await g.repo().addReading(machine.id, n);
      await g.refresh(machine.id);
      g.effect('tick');
      onClose();
      g.toast(`Compteur de ${machine.code} : ${hrs(n)}${diff ? ` (+${hrs(diff)})` : ''}`);
    } catch (e) {
      setError(errorText(e, 'Le relevé n’a pas pu être enregistré.'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="hr-h" describedBy="hr-d" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {machine.code} · {machineEyebrow(machine)}
      </p>
      <h2 id="hr-h">Compteur d’heures</h2>
      <p className="muted" id="hr-d">
        Dernière valeur : <b className="num">{hrs(current)}</b>, le {dateCH(machine.hours_at)}. Le compteur ne peut qu’avancer.
      </p>
      <div className="field">
        <label htmlFor="hr-value">Compteur actuel (h)</label>
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
          <span aria-hidden="true">h</span>
        </div>
        <p className={`g-hint${lower ? ' is-bad' : diff && diff > 2000 ? ' is-warn' : ''}`} id="hr-diff" aria-live="polite">
          {n == null
            ? 'Saisissez les heures affichées au compteur de la machine.'
            : lower
              ? `${hrs(current - n)} de moins que le dernier relevé : le compteur ne peut pas reculer.`
              : diff === 0
                ? 'Même valeur que le dernier relevé.'
                : diff && diff > 2000
                  ? `+${hrs(diff)} depuis le dernier relevé : c’est beaucoup, vérifiez la valeur.`
                  : `+${hrs(diff ?? 0)} depuis le dernier relevé.`}
        </p>
      </div>
      {recent.length ? (
        <div>
          <p className="g-mini-title">Derniers relevés</p>
          <ul className="g-readings">
            {recent.map((r) => (
              <li key={r.id}>
                <span className="num">{hrs(Number(r.hours))}</span>
                <span>{dateTimeCH(r.read_at)}</span>
                <span className="g-reading-src">{SOURCE[r.source] ?? r.source}</span>
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
      <Foot busy={busy} onClose={onClose} label="Enregistrer le relevé" />
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

const PRESETS: { label: string; basis: ScheduleBasis; hours?: number; years?: number }[] = [
  { label: 'Service', basis: 'heures', hours: 500 },
  { label: 'Contrôle annuel de sécurité', basis: 'date', years: 1 },
  { label: 'Contrôle de l’extincteur', basis: 'date', years: 1 },
  { label: 'Vidange de l’huile hydraulique', basis: 'heures', hours: 2000 },
  { label: 'Inspection du train de roulement', basis: 'heures', hours: 1000 },
  { label: 'Expertise périodique', basis: 'date', years: 1 },
];

export function ScheduleModal({ machineId, scheduleId, onClose }: { machineId: string; scheduleId?: string; onClose: () => void }) {
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
    const v = parseNumber(everyD);
    return v != null && v > 0 ? Math.round(v * UNIT_DAYS[unit]) : null;
  };

  function retarget(nextBasis: ScheduleBasis, hoursEvery: string, dEvery: string, dUnit: Unit) {
    if (dueTouched) return;
    if (nextBasis === 'heures') {
      const e = parseNumber(hoursEvery);
      if (e != null && e > 0) setDueH(String(Math.round(base + e)));
    } else {
      const v = parseNumber(dEvery);
      if (v != null && v > 0) setDueD(addDays(g.today, Math.round(v * UNIT_DAYS[dUnit])));
    }
  }

  function preset(p: (typeof PRESETS)[number]) {
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
    if (!l) errs['sc-label'] = 'Donnez un nom à l’échéance, par exemple « Service ».';
    else if (l.length > 80) errs['sc-label'] = '80 caractères au plus.';
    let intervalHours: number | null = null;
    let dueHours: number | null = null;
    let intervalDays: number | null = null;
    let dueDate: string | null = null;
    if (basis === 'heures') {
      if (everyH.trim()) {
        intervalHours = parseNumber(everyH);
        if (intervalHours == null || intervalHours <= 0 || intervalHours > 100_000)
          errs['sc-every-h'] = 'Indiquez un intervalle en heures, par exemple 500.';
      }
      dueHours = parseNumber(dueH);
      if (dueHours == null || dueHours < 0 || dueHours > 9_999_999)
        errs['sc-due-h'] = 'Indiquez à combien d’heures tombe la prochaine échéance.';
    } else {
      if (everyD.trim()) {
        intervalDays = days();
        if (intervalDays == null || intervalDays > 36_500) errs['sc-every-d'] = 'Indiquez un intervalle, par exemple 1 an.';
      }
      dueDate = dueD || null;
      if (!dueDate) errs['sc-due-d'] = 'Indiquez la date de la prochaine échéance.';
    }
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError('Vérifiez les champs signalés.');
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
      g.toast(editing ? `Échéance « ${l} » modifiée` : `Échéance « ${l} » ajoutée à ${machine.code}`);
    } catch (e) {
      setError(errorText(e, 'L’échéance n’a pas pu être enregistrée.'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="sc-h" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {machine.code} · {machineEyebrow(machine)}
      </p>
      <h2 id="sc-h">{editing ? 'Modifier l’échéance' : 'Nouvelle échéance'}</h2>

      <Field id="sc-label" label="Libellé" errors={errors}>
        <input
          {...aria('sc-label', errors)}
          type="text"
          maxLength={80}
          autoComplete="off"
          value={label}
          placeholder="Service, contrôle annuel, expertise…"
          data-autofocus=""
          onChange={(e) => setLabel(e.target.value)}
        />
        {!editing ? (
          <div className="g-suggest" role="group" aria-label="Échéances courantes">
            {PRESETS.filter((p) => p.label !== label.trim()).map((p) => (
              <button key={p.label} type="button" onClick={() => preset(p)} disabled={busy}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <div className="field">
        <span className="label" id="sc-basis-l">
          Selon
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
            Les heures du compteur
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
            Une date
          </button>
        </div>
      </div>

      {basis === 'heures' ? (
        <div className="grid2">
          <Field id="sc-every-h" label="Intervalle (h)" errors={errors} hint="Laisser vide pour une échéance unique.">
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
          <Field id="sc-due-h" label="Prochaine échéance (h)" errors={errors} hint={`Compteur actuel : ${hrs(base)}`}>
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
          <Field id="sc-every-d" label="Intervalle" errors={errors} hint="Laisser vide pour une échéance unique.">
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
                aria-label="Unité de l’intervalle"
                value={unit}
                onChange={(e) => {
                  const u = e.target.value as Unit;
                  setUnit(u);
                  retarget('date', everyH, everyD, u);
                }}
              >
                <option value="jours">jour(s)</option>
                <option value="mois">mois</option>
                <option value="ans">an(s)</option>
              </select>
            </div>
          </Field>
          <Field id="sc-due-d" label="Prochaine échéance" errors={errors}>
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
          Dernière fois : le {dateCH(schedule.last_date)}
          {schedule.last_hours != null && schedule.basis === 'heures' ? ` à ${hrs(Number(schedule.last_hours))}` : ''}.
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
            Supprimer
          </button>
        ) : null}
        <span className="g-foot-gap" />
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="check" />}
          {editing ? 'Enregistrer' : 'Ajouter l’échéance'}
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ retrait d'une saisie

const REASONS = ['Saisie en double', 'Mauvaise machine', 'Erreur de date ou de montant'];

export function RemoveEntryModal({ machineId, entryId, onClose }: { machineId: string; entryId: string; onClose: () => void }) {
  const g = useGarage();
  const entry = g.files[machineId]?.entries.find((e) => e.id === entryId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!entry) return null;

  async function submit() {
    if (!entry) return;
    const r = reason.trim();
    if (!r) {
      setError('Indiquez pourquoi cette saisie est retirée : le motif reste visible dans le carnet.');
      document.getElementById('rm-reason')?.focus();
      return;
    }
    if (r.length > 300) {
      setError('Le motif fait 300 caractères au plus.');
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
      g.toast('Saisie retirée : elle reste dans le carnet, barrée, avec son motif');
    } catch (e) {
      setError(errorText(e, 'La saisie n’a pas pu être retirée.'));
      g.effect('alert');
      setBusy(false);
    }
  }

  return (
    <Modal labelledBy="rm-h" describedBy="rm-d" onClose={onClose} onSubmit={() => void submit()} busy={busy}>
      <p className="eyebrow">
        {dateCH(entry.date)} · {entry.title}
      </p>
      <h2 id="rm-h">Retirer la saisie</h2>
      <p className="muted" id="rm-d">
        Le carnet d’entretien garde une trace de tout (art. 32b OPA) : la saisie reste visible, barrée, avec le motif ci-dessous, la date et
        votre nom. Ses coûts ne sont plus comptés.
      </p>
      <div className={`field${error ? ' has-error' : ''}`}>
        <label htmlFor="rm-reason">Motif du retrait</label>
        <textarea
          id="rm-reason"
          maxLength={300}
          value={reason}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'rm-err' : undefined}
          placeholder="Pourquoi cette saisie est-elle retirée ?"
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="g-suggest" role="group" aria-label="Motifs courants">
          {REASONS.map((r) => (
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
      <Foot busy={busy} onClose={onClose} label="Retirer la saisie" danger icon="trash" />
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
  const g = useGarage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(errorText(e, 'L’action n’a pas pu être effectuée.'));
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
          Annuler
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
  const g = useGarage();
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  if (!machine) return null;
  return (
    <ConfirmModal
      title={`Archiver ${machine.code} ?`}
      eyebrow={machineEyebrow(machine)}
      confirm="Archiver la machine"
      icon="archive"
      onClose={onClose}
      onConfirm={async () => {
        await g.repo().archiveMachine(machine.id);
        onArchived();
        await g.refresh();
        g.effect('close');
        onClose();
        g.toast(`${machine.code} archivée : son carnet reste conservé`);
      }}
    >
      <p>La machine quitte le garage et la liste du parc. Son carnet, ses coûts, ses photos et ses documents restent conservés.</p>
      <p>
        Compteur à l’archivage : <b className="num">{hrs(Number(machine.hours))}</b>
        {machine.year ? ` · mise en service ${grp(machine.year)}` : ''}.
      </p>
    </ConfirmModal>
  );
}

export function DeleteScheduleModal({ machineId, scheduleId, onClose }: { machineId: string; scheduleId: string; onClose: () => void }) {
  const g = useGarage();
  const schedule = (g.files[machineId]?.schedules ?? g.fleet.schedules).find((s) => s.id === scheduleId);
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  if (!schedule || !machine) return null;
  return (
    <ConfirmModal
      title={`Supprimer « ${schedule.label} » ?`}
      eyebrow={machine.code}
      confirm="Supprimer l’échéance"
      icon="trash"
      onClose={onClose}
      onConfirm={async () => {
        await g.repo().deleteSchedule(schedule.id);
        await g.refresh(machineId);
        g.effect('tick');
        onClose();
        g.toast(`Échéance « ${schedule.label} » supprimée`);
      }}
    >
      <p>Godet ne rappellera plus cette échéance pour {machine.code}. Les interventions déjà saisies restent dans le carnet.</p>
    </ConfirmModal>
  );
}
