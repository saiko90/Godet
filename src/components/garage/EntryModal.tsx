'use client';

// Modale « intervention » : ajout ou modification d'une saisie du carnet (service, réparation, pièce, contrôle,
// inspection, note), avec coûts, immobilisation, statut, pièce, échéance réglée et photos jointes.
import { useMessages, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { ENTRY_KINDS } from '@/lib/domain';
import type { EntryKind, RepairStatus } from '@/lib/types';
import type { NewEntry } from '@/lib/repo/types';
import { useDomainText } from '@/lib/use-domain-text';
import { useGeoFix } from '@/lib/geo';
import { useGarage } from './context';
import { GeoNote } from './GeoNote';
import { useErrorText } from './errors';
import { aria, Field, focusFirstError, type Errors } from './fields';
import { isServiceLabel, KINDS_WITH_HOURS } from './helpers';
import { CaptureButton } from './CaptureButton';
import { UploadStatus } from './MediaTab';
import { parseLocalNumber } from './numbers';
import { useGarageText } from './text';
import { Modal } from './ui';

const KIND_ORDER: EntryKind[] = ['service', 'reparation', 'piece', 'controle', 'inspection', 'note'];
const STATUS_ORDER: RepairStatus[] = ['fait', 'en_cours', 'attente_piece'];

/** Montant saisi avec sa devise devant ou derrière (« CHF 1’240.50 », « 1.240,50 € ») : la devise est ignorée. */
const CURRENCY_AFFIX = /^\s*(chf|eur|gbp|usd|fr\.?|€|£|\$)\s*|\s*(chf|eur|gbp|usd|fr\.?|€|£|\$)\s*$/gi;

interface Photo {
  key: string;
  file: File;
  url: string;
}

const numStr = (n: number | null | undefined) => (n == null ? '' : String(Number(n)));

export function EntryModal({
  machineId,
  entryId,
  kind: initialKind,
  scheduleId: initialSchedule,
  onClose,
}: {
  machineId: string;
  entryId?: string;
  kind?: EntryKind;
  scheduleId?: string;
  onClose: () => void;
}) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const errorText = useErrorText();
  const messages = useMessages();
  const g = useGarage();
  // Position jointe aux nouvelles saisies si l'entreprise l'a activée (jamais dans la démo, jamais en modification).
  const geo = useGeoFix(g.mode === 'cloud' && g.org.track_location && !entryId);
  const [withGeo, setWithGeo] = useState(true);
  const machine = g.fleet.machines.find((m) => m.id === machineId);
  const file = g.files[machineId];
  const entry = entryId ? file?.entries.find((e) => e.id === entryId) : undefined;
  const schedules = useMemo(() => g.fleet.schedules.filter((s) => s.machine_id === machineId && s.active), [g.fleet.schedules, machineId]);
  const linked = initialSchedule ? schedules.find((s) => s.id === initialSchedule) : undefined;

  const startKind: EntryKind = entry?.kind ?? initialKind ?? 'service';
  const [kind, setKind] = useState<EntryKind>(startKind);
  const [date, setDate] = useState(entry?.date ?? g.today);
  const [hours, setHours] = useState(() =>
    entry ? numStr(entry.hours) : machine && KINDS_WITH_HOURS.includes(startKind) ? String(Number(machine.hours)) : '',
  );
  const [hoursTouched, setHoursTouched] = useState(Boolean(entry));
  const [title, setTitle] = useState(() => {
    if (entry) return entry.title;
    if (linked)
      return linked.basis === 'heures' && isServiceLabel(linked.label)
        ? t('entryForm.serviceTitle', { hours: f.num(Number(linked.due_hours)) })
        : linked.label;
    return '';
  });
  const [details, setDetails] = useState(entry?.details ?? '');
  const [who, setWho] = useState(entry?.performed_by ?? '');
  const [parts, setParts] = useState(entry && Number(entry.cost_parts) ? numStr(entry.cost_parts) : '');
  const [labour, setLabour] = useState(entry && Number(entry.cost_labour) ? numStr(entry.cost_labour) : '');
  const [downtime, setDowntime] = useState(entry ? numStr(entry.downtime_hours) : '');
  const [status, setStatus] = useState<RepairStatus>(entry?.repair_status ?? 'fait');
  const [ref, setRef] = useState(entry?.part_ref ?? '');
  const [qty, setQty] = useState(entry ? numStr(entry.part_qty) : '1');
  const [supplier, setSupplier] = useState(entry?.supplier ?? '');
  const [warranty, setWarranty] = useState(entry?.warranty_until ?? '');
  const [scheduleId, setScheduleId] = useState(linked?.id ?? '');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const urls = useRef(new Set<string>());

  // Les aperçus des photos sont libérés à la fermeture.
  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      set.clear();
    };
  }, []);

  const who0 = messages.garage.entryForm.people;
  const whoOptions = useMemo(() => {
    const seen = new Set<string>(Object.values(who0));
    for (const e of file?.entries ?? g.fleet.recentEntries) if (e.performed_by) seen.add(e.performed_by);
    return [...seen].slice(0, 12);
  }, [file, g.fleet.recentEntries, who0]);

  if (!machine) return null;

  const current = Number(machine.hours);
  const editing = Boolean(entry);
  const serviceSchedule = schedules.find((s) => s.basis === 'heures' && isServiceLabel(s.label));
  const serviceTitle = serviceSchedule ? t('entryForm.serviceTitle', { hours: f.num(Number(serviceSchedule.due_hours)) }) : null;
  const suggestions = [
    ...(kind === 'service' && serviceTitle ? [serviceTitle] : []),
    ...(kind === 'service' || kind === 'controle' || kind === 'inspection'
      ? schedules.filter((s) => s !== serviceSchedule).map((s) => s.label)
      : []),
    ...Object.values(messages.garage.suggestions[kind]),
  ]
    .filter((s, i, all) => all.indexOf(s) === i && s !== title.trim())
    .slice(0, 5);

  // Exemple de titre : le prochain service de cette machine plutôt qu'un exemple générique.
  const example = kind === 'service' && serviceTitle ? serviceTitle : t(`entryForm.placeholders.${kind}.title`);

  const hoursNum = parseLocalNumber(hours, f);
  const hoursWarn =
    hoursNum != null && hoursNum > current + 2000
      ? t('entryForm.warnHigh', { diff: f.hours(hoursNum - current), current: f.hours(current) })
      : hoursNum != null && hoursNum < current && !editing && date === g.today
        ? t('entryForm.warnLower', { current: f.hours(current) })
        : undefined;

  function chooseKind(k: EntryKind) {
    if (k === kind) return;
    setKind(k);
    g.effect('tick');
    if (!hoursTouched) setHours(KINDS_WITH_HOURS.includes(k) ? String(current) : '');
  }

  function applySuggestion(s: string) {
    setTitle(s);
    const match = schedules.find((x) => x.label === s || (x === serviceSchedule && s === serviceTitle));
    if (match && !scheduleId && !editing) setScheduleId(match.id);
  }

  function addPhotos(files: File[]) {
    const next = files.map((f) => {
      const url = URL.createObjectURL(f);
      urls.current.add(url);
      return { key: url, file: f, url };
    });
    setPhotos((p) => [...p, ...next].slice(0, 12));
  }

  function removePhoto(key: string) {
    setPhotos((p) => p.filter((x) => x.key !== key));
    URL.revokeObjectURL(key);
    urls.current.delete(key);
  }

  function validate(): { errs: Errors; input: Omit<NewEntry, 'machineId'> | null } {
    const errs: Errors = {};
    const tt = title.trim();
    if (!tt) errs['iv-title'] = t('entryForm.errTitle', { example });
    else if (tt.length > 120) errs['iv-title'] = t('entryForm.errTitleLong');
    if (!date) errs['iv-date'] = t('entryForm.errDate');
    else if (date > g.today) errs['iv-date'] = t('entryForm.errDateFuture');
    else if (date < '1990-01-01') errs['iv-date'] = t('entryForm.errDateYear');
    let h: number | null = null;
    if (hours.trim()) {
      h = parseLocalNumber(hours, f);
      if (h == null || h < 0) errs['iv-hours'] = t('form.hoursDigits', { example: f.num(6842) });
      else if (h > 9_999_999) errs['iv-hours'] = t('form.hoursTooHigh');
    }
    const money = (v: string, key: string) => {
      if (!v.trim()) return 0;
      const n = parseLocalNumber(v.replace(CURRENCY_AFFIX, ''), f);
      if (n == null || n < 0) {
        errs[key] = t('entryForm.errMoney', { currency: f.currency, example: f.num(1240.5, 2) });
        return 0;
      }
      if (n > 99_999_999) {
        errs[key] = t('entryForm.errMoneyHigh');
        return 0;
      }
      return Math.round(n * 100) / 100;
    };
    const cp = money(parts, 'iv-parts');
    const cl = money(labour, 'iv-labour');
    let down: number | null = null;
    if (kind === 'reparation' && downtime.trim()) {
      down = parseLocalNumber(downtime, f);
      if (down == null || down < 0 || down > 99_999) errs['iv-downtime'] = t('entryForm.errDowntime');
    }
    let q: number | null = null;
    if (kind === 'piece' && qty.trim()) {
      q = parseLocalNumber(qty, f);
      if (q == null || q <= 0 || q > 999_999) errs['iv-qty'] = t('entryForm.errQty');
    }
    if (kind === 'piece' && warranty && date && warranty < date) errs['iv-warranty'] = t('entryForm.errWarranty');
    if (details.length > 4000) errs['iv-details'] = t('entryForm.errDetails', { n: f.num(4000) });
    if (who.trim().length > 80) errs['iv-who'] = t('form.maxChars', { n: f.num(80) });
    if (ref.trim().length > 40) errs['iv-ref'] = t('form.maxChars', { n: f.num(40) });
    if (supplier.trim().length > 80) errs['iv-supplier'] = t('form.maxChars', { n: f.num(80) });
    if (Object.values(errs).some(Boolean)) return { errs, input: null };
    return {
      errs,
      input: {
        kind,
        date,
        hours: h,
        title: tt,
        details: details.trim() || null,
        performedBy: who.trim() || null,
        costParts: cp,
        costLabour: cl,
        downtimeHours: kind === 'reparation' ? down : null,
        repairStatus: kind === 'reparation' ? status : null,
        partRef: kind === 'piece' ? ref.trim() || null : null,
        partQty: kind === 'piece' ? q : null,
        supplier: kind === 'piece' ? supplier.trim() || null : null,
        warrantyUntil: kind === 'piece' ? warranty || null : null,
      },
    };
  }

  async function submit() {
    if (!machine) return;
    const { errs, input } = validate();
    setErrors(errs);
    if (!input) {
      setError(t('form.checkFields'));
      focusFirstError(
        [
          'iv-date',
          'iv-hours',
          'iv-title',
          'iv-details',
          'iv-who',
          'iv-parts',
          'iv-labour',
          'iv-downtime',
          'iv-ref',
          'iv-qty',
          'iv-supplier',
          'iv-warranty',
        ],
        errs,
      );
      return;
    }
    setError(null);
    setBusy(true);
    setStage(editing ? t('entryForm.savingEdit') : t('entryForm.saving'));
    try {
      const saved = entry
        ? await g.repo().updateEntry(entry.id, input)
        : await g.repo().addEntry({ machineId: machine.id, ...input, scheduleId: scheduleId || null, location: withGeo ? geo.fix : null });
      let photoErrors: string[] = [];
      if (photos.length) {
        setStage(t('entryForm.sendingPhotos', { count: photos.length }));
        const out = await g.upload(
          machine.id,
          photos.map((p) => p.file),
          { entryId: saved.id, caption: input.title },
        );
        photoErrors = out.errors;
      }
      await g.refresh(machine.id);
      g.setTab(kind === 'reparation' ? 'reparations' : kind === 'piece' ? 'pieces' : 'carnet');
      g.setFlash(saved.id);
      g.effect('save');
      if (!entry) g.animate(machine.id, kind === 'service' ? 'service' : kind === 'reparation' ? 'repair' : 'wake');
      onClose();
      if (photoErrors.length) g.toast(t('entryForm.photoFailed', { error: photoErrors[0] }), 'error');
      else if (entry) g.toast(t('entryForm.edited', { title: input.title }));
      else {
        const linkedS = scheduleId ? schedules.find((s) => s.id === scheduleId) : null;
        g.toast(
          linkedS
            ? t('entryForm.loggedSchedule', { code: machine.code, label: linkedS.label })
            : t('entryForm.logged', { date: f.date(input.date), code: machine.code }),
        );
      }
    } catch (e) {
      setError(errorText(e, 'entry'));
      g.effect('alert');
      setBusy(false);
      setStage(null);
    }
  }


  return (
    <Modal labelledBy="iv-h" onClose={onClose} onSubmit={() => void submit()} busy={busy} className="g-dialog-wide">
      <p className="eyebrow">
        {machine.code} · {gt.eyebrow(machine)}
      </p>
      <h2 id="iv-h">
        {editing ? t('entryForm.titleEdit') : linked ? t('entryForm.titleDone', { label: linked.label }) : t('entryForm.titleNew')}
      </h2>

      <div className="field">
        <span className="label" id="iv-kind-l">
          {t('entryForm.type')}
        </span>
        <div className="seg g-kinds" role="group" aria-labelledby="iv-kind-l">
          {KIND_ORDER.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => chooseKind(k)} disabled={busy}>
              <Icon name={ENTRY_KINDS[k].icon} />
              {dt.entry(k)}
            </button>
          ))}
        </div>
        <p className="g-hint">{dt.entryHint(kind)}</p>
      </div>

      <div className="grid2">
        <Field id="iv-date" label={t('entryForm.date')} errors={errors}>
          <input {...aria('iv-date', errors)} type="date" value={date} max={g.today} required onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field
          id="iv-hours"
          label={kind === 'piece' || kind === 'note' ? t('entryForm.hoursOptional') : t('entryForm.hours')}
          errors={errors}
          warn={hoursWarn}
          hint={t('form.currentHours', { hours: f.hours(current) })}
        >
          <input
            {...aria('iv-hours', errors, true)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={hours}
            placeholder={f.hours(current)}
            onChange={(e) => {
              setHours(e.target.value);
              setHoursTouched(true);
            }}
          />
        </Field>
      </div>

      <Field id="iv-title" label={t('entryForm.title')} errors={errors}>
        <input
          {...aria('iv-title', errors)}
          type="text"
          maxLength={120}
          autoComplete="off"
          value={title}
          placeholder={example}
          required
          data-autofocus=""
          onChange={(e) => setTitle(e.target.value)}
        />
        {suggestions.length ? (
          <div className="g-suggest" role="group" aria-label={t('entryForm.suggestions')}>
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => applySuggestion(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <Field id="iv-details" label={t('entryForm.details')} errors={errors}>
        <textarea
          {...aria('iv-details', errors)}
          maxLength={4000}
          value={details}
          placeholder={t(`entryForm.placeholders.${kind}.details`)}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>

      <div className="grid2">
        <Field id="iv-who" label={t('entryForm.who')} errors={errors}>
          <input
            {...aria('iv-who', errors)}
            type="text"
            maxLength={80}
            list="iv-who-list"
            autoComplete="off"
            value={who}
            placeholder={who0.workshop}
            onChange={(e) => setWho(e.target.value)}
          />
          <datalist id="iv-who-list">
            {whoOptions.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </Field>
        {kind === 'reparation' ? (
          <Field id="iv-downtime" label={t('entryForm.downtime')} errors={errors} hint={t('entryForm.downtimeHint')}>
            <input
              {...aria('iv-downtime', errors, true)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={downtime}
              placeholder="0"
              onChange={(e) => setDowntime(e.target.value)}
            />
          </Field>
        ) : (
          <div className="g-grid-spacer" aria-hidden="true" />
        )}
      </div>

      <div className="grid2">
        <Field id="iv-parts" label={t('entryForm.costParts', { currency: f.currency })} errors={errors}>
          <input
            {...aria('iv-parts', errors)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={parts}
            placeholder="0"
            onChange={(e) => setParts(e.target.value)}
          />
        </Field>
        <Field id="iv-labour" label={t('entryForm.costLabour', { currency: f.currency })} errors={errors}>
          <input
            {...aria('iv-labour', errors)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={labour}
            placeholder="0"
            onChange={(e) => setLabour(e.target.value)}
          />
        </Field>
      </div>

      {kind === 'reparation' ? (
        <div className="field">
          <span className="label" id="iv-status-l">
            {t('entryForm.status')}
          </span>
          <div className="seg" role="group" aria-labelledby="iv-status-l">
            {STATUS_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} disabled={busy}>
                {dt.repair(s)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {kind === 'piece' ? (
        <>
          <div className="grid2">
            <Field id="iv-ref" label={t('entryForm.ref')} errors={errors}>
              <input
                {...aria('iv-ref', errors)}
                type="text"
                maxLength={40}
                autoComplete="off"
                value={ref}
                placeholder={t('entryForm.refPlaceholder')}
                onChange={(e) => setRef(e.target.value)}
              />
            </Field>
            <Field id="iv-qty" label={t('entryForm.qty')} errors={errors}>
              <input
                {...aria('iv-qty', errors)}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid2">
            <Field id="iv-supplier" label={t('entryForm.supplier')} errors={errors}>
              <input
                {...aria('iv-supplier', errors)}
                type="text"
                maxLength={80}
                autoComplete="off"
                value={supplier}
                placeholder={t('entryForm.supplierPlaceholder')}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </Field>
            <Field id="iv-warranty" label={t('entryForm.warranty')} errors={errors}>
              <input
                {...aria('iv-warranty', errors)}
                type="date"
                value={warranty}
                min={date || undefined}
                onChange={(e) => setWarranty(e.target.value)}
              />
            </Field>
          </div>
        </>
      ) : null}

      {!editing && schedules.length ? (
        <Field
          id="iv-schedule"
          label={t('entryForm.schedule')}
          errors={errors}
          hint={scheduleId ? t('entryForm.scheduleHintLinked') : t('entryForm.scheduleHint')}
        >
          <select {...aria('iv-schedule', errors, true)} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            <option value="">{t('entryForm.scheduleNone')}</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {t('entryForm.scheduleOption', { label: s.label, target: gt.target(s) })}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="field">
        <span className="label" id="iv-photos-l">
          {t('entryForm.photos')}
        </span>
        <div className="photo-in g-photo-in">
          <CaptureButton kind="photo" disabled={busy || photos.length >= 12} onFiles={addPhotos} label={t('entryForm.photosAdd')}>
            <Icon name="camera" />
            {photos.length ? t('entryForm.photosAddShort') : t('entryForm.photosAddLong')}
          </CaptureButton>
          {photos.map((p) => (
            <span key={p.key} className="g-photo-chip">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local */}
              <img src={p.url} alt={t('entryForm.photoPreview', { name: p.file.name })} />
              <button
                type="button"
                className="g-photo-x"
                aria-label={t('entryForm.photoRemove', { name: p.file.name })}
                onClick={() => removePhoto(p.key)}
                disabled={busy}
              >
                <Icon name="close" />
              </button>
            </span>
          ))}
        </div>
        {photos.length ? <p className="g-hint">{t('entryForm.photosCount', { count: photos.length, n: f.num(photos.length) })}</p> : null}
      </div>

      {editing && entry?.schedule_id ? (
        <p className="g-hint">{t('entryForm.linkedNote')}</p>
      ) : null}

      <GeoNote state={geo.state} accuracy={geo.fix?.accuracy ?? null} on={withGeo} onToggle={setWithGeo} />

      {busy && photos.length ? <UploadStatus machineId={machine.id} /> : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dialog-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {tc('actions.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy} aria-describedby={stage ? 'iv-stage' : undefined}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="check" />}
          {editing ? t('entryForm.saveEdit') : t('entryForm.save')}
        </button>
      </div>
      {stage ? (
        <p className="g-sr" id="iv-stage" role="status">
          {stage}
        </p>
      ) : null}
    </Modal>
  );
}
