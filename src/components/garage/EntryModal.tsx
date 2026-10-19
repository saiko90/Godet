'use client';

// Modale « intervention » : ajout ou modification d'une saisie du carnet (service, réparation, pièce, contrôle,
// inspection, note), avec coûts, immobilisation, statut, pièce, échéance réglée et photos jointes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { ENTRY_KINDS, REPAIR_STATUS } from '@/lib/domain';
import { dateCH, grp, hrs, parseNumber } from '@/lib/format';
import type { EntryKind, RepairStatus } from '@/lib/types';
import type { NewEntry } from '@/lib/repo/types';
import { useGarage } from './context';
import { aria, Field, focusFirstError, type Errors } from './fields';
import { errorText, KINDS_WITH_HOURS, machineEyebrow, plural, scheduleTarget } from './helpers';
import { FileButton, UploadStatus } from './MediaTab';
import { Modal } from './ui';

const KIND_ORDER: EntryKind[] = ['service', 'reparation', 'piece', 'controle', 'inspection', 'note'];
const STATUS_ORDER: RepairStatus[] = ['fait', 'en_cours', 'attente_piece'];

const SUGGESTIONS: Record<EntryKind, string[]> = {
  service: ['Graissage complet', 'Vidange de l’huile hydraulique', 'Préparation à l’hiver'],
  reparation: ['Flexible hydraulique remplacé', 'Fuite réparée', 'Dents de godet remplacées', 'Batterie remplacée'],
  piece: ['Filtre à huile moteur', 'Kit de filtres', 'Dents de godet', 'Batterie 12 V'],
  controle: ['Contrôle annuel de sécurité', 'Contrôle de l’extincteur', 'Expertise périodique', 'Contrôle des freins'],
  inspection: ['Contrôle des niveaux', 'Graissage et nettoyage', 'Contrôle du train de roulement', 'Tour de la machine'],
  note: ['Bruit à surveiller', 'Fuite légère constatée', 'Machine déplacée sur un autre chantier'],
};

const PLACEHOLDER: Record<EntryKind, [string, string]> = {
  service: ['Service 7’000 h', 'Huile moteur, filtres, graissage…'],
  reparation: ['Flexible du godet remplacé', 'Cause, travail fait, pièces utilisées…'],
  piece: ['Filtre à huile moteur', 'Pour quel usage, remarque…'],
  controle: ['Contrôle de l’extincteur', 'Points vérifiés, défauts constatés…'],
  inspection: ['Contrôle des niveaux', 'Ce qui a été vérifié, nettoyé, graissé…'],
  note: ['Bruit à la rotation à surveiller', 'Ce que le machiniste a remarqué…'],
};

const WHO = ['Atelier interne', 'Chef d’atelier', 'Machiniste', 'Garage partenaire', 'Concessionnaire'];

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
  const g = useGarage();
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
      return linked.basis === 'heures' && /^service$/i.test(linked.label.trim())
        ? `Service ${grp(Number(linked.due_hours))} h`
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

  const whoOptions = useMemo(() => {
    const seen = new Set(WHO);
    for (const e of file?.entries ?? g.fleet.recentEntries) if (e.performed_by) seen.add(e.performed_by);
    return [...seen].slice(0, 12);
  }, [file, g.fleet.recentEntries]);

  if (!machine) return null;

  const current = Number(machine.hours);
  const editing = Boolean(entry);
  const serviceSchedule = schedules.find((s) => s.basis === 'heures' && /^service$/i.test(s.label.trim()));
  const suggestions = [
    ...(kind === 'service' && serviceSchedule ? [`Service ${grp(Number(serviceSchedule.due_hours))} h`] : []),
    ...(kind === 'service' || kind === 'controle' || kind === 'inspection'
      ? schedules.filter((s) => s !== serviceSchedule).map((s) => s.label)
      : []),
    ...SUGGESTIONS[kind],
  ]
    .filter((s, i, all) => all.indexOf(s) === i && s !== title.trim())
    .slice(0, 5);

  // Exemple de titre : le prochain service de cette machine plutôt qu'un exemple générique.
  const example = kind === 'service' && serviceSchedule ? `Service ${grp(Number(serviceSchedule.due_hours))} h` : PLACEHOLDER[kind][0];

  const hoursNum = parseNumber(hours);
  const hoursWarn =
    hoursNum != null && hoursNum > current + 2000
      ? `C’est ${hrs(hoursNum - current)} de plus que le compteur actuel (${hrs(current)}). Vérifiez la valeur.`
      : hoursNum != null && hoursNum < current && !editing && date === g.today
        ? `Inférieur au compteur actuel (${hrs(current)}) : la saisie est enregistrée, le compteur ne recule pas.`
        : undefined;

  function chooseKind(k: EntryKind) {
    if (k === kind) return;
    setKind(k);
    g.effect('tick');
    if (!hoursTouched) setHours(KINDS_WITH_HOURS.includes(k) ? String(current) : '');
  }

  function applySuggestion(s: string) {
    setTitle(s);
    const match = schedules.find((x) => x.label === s || (x === serviceSchedule && s.startsWith('Service ')));
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
    const t = title.trim();
    if (!t) errs['iv-title'] = `Donnez un titre à l’intervention, par exemple « ${example} ».`;
    else if (t.length > 120) errs['iv-title'] = 'Le titre fait 120 caractères au plus.';
    if (!date) errs['iv-date'] = 'Indiquez la date de l’intervention.';
    else if (date > g.today) errs['iv-date'] = 'La date ne peut pas être dans le futur.';
    else if (date < '1990-01-01') errs['iv-date'] = 'Vérifiez l’année de la date.';
    let h: number | null = null;
    if (hours.trim()) {
      h = parseNumber(hours);
      if (h == null || h < 0) errs['iv-hours'] = 'Indiquez le compteur en heures, avec des chiffres (par exemple 6’842).';
      else if (h > 9_999_999) errs['iv-hours'] = 'Ce compteur est trop élevé.';
    }
    const money = (v: string, key: string) => {
      if (!v.trim()) return 0;
      const n = parseNumber(v.replace(/^chf\s*/i, ''));
      if (n == null || n < 0) {
        errs[key] = 'Indiquez un montant en francs, par exemple 1’240.50.';
        return 0;
      }
      if (n > 99_999_999) {
        errs[key] = 'Ce montant est trop élevé.';
        return 0;
      }
      return Math.round(n * 100) / 100;
    };
    const cp = money(parts, 'iv-parts');
    const cl = money(labour, 'iv-labour');
    let dt: number | null = null;
    if (kind === 'reparation' && downtime.trim()) {
      dt = parseNumber(downtime);
      if (dt == null || dt < 0 || dt > 99_999) errs['iv-downtime'] = 'Indiquez les heures d’immobilisation, par exemple 6.';
    }
    let q: number | null = null;
    if (kind === 'piece' && qty.trim()) {
      q = parseNumber(qty);
      if (q == null || q <= 0 || q > 999_999) errs['iv-qty'] = 'La quantité doit être un nombre supérieur à zéro.';
    }
    if (kind === 'piece' && warranty && date && warranty < date) errs['iv-warranty'] = 'La garantie se termine avant la date de l’achat.';
    if (details.length > 4000) errs['iv-details'] = 'Les détails font 4’000 caractères au plus.';
    if (who.trim().length > 80) errs['iv-who'] = '80 caractères au plus.';
    if (ref.trim().length > 40) errs['iv-ref'] = '40 caractères au plus.';
    if (supplier.trim().length > 80) errs['iv-supplier'] = '80 caractères au plus.';
    if (Object.values(errs).some(Boolean)) return { errs, input: null };
    return {
      errs,
      input: {
        kind,
        date,
        hours: h,
        title: t,
        details: details.trim() || null,
        performedBy: who.trim() || null,
        costParts: cp,
        costLabour: cl,
        downtimeHours: kind === 'reparation' ? dt : null,
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
      setError('Vérifiez les champs signalés.');
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
    setStage(editing ? 'Enregistrement des modifications…' : 'Enregistrement de l’intervention…');
    try {
      const saved = entry
        ? await g.repo().updateEntry(entry.id, input)
        : await g.repo().addEntry({ machineId: machine.id, ...input, scheduleId: scheduleId || null });
      let photoErrors: string[] = [];
      if (photos.length) {
        setStage(photos.length > 1 ? 'Envoi des photos…' : 'Envoi de la photo…');
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
      if (photoErrors.length) g.toast(`Intervention enregistrée, mais une photo n’a pas pu être envoyée : ${photoErrors[0]}`, 'error');
      else if (entry) g.toast(`Saisie « ${input.title} » modifiée`);
      else {
        const linkedS = scheduleId ? schedules.find((s) => s.id === scheduleId) : null;
        g.toast(
          linkedS
            ? `Intervention consignée pour ${machine.code} : « ${linkedS.label} » repart pour un nouvel intervalle`
            : `Intervention consignée le ${dateCH(input.date)} pour ${machine.code}`,
        );
      }
    } catch (e) {
      setError(errorText(e, 'L’intervention n’a pas pu être enregistrée.'));
      g.effect('alert');
      setBusy(false);
      setStage(null);
    }
  }

  const ph = PLACEHOLDER[kind];

  return (
    <Modal labelledBy="iv-h" onClose={onClose} onSubmit={() => void submit()} busy={busy} className="g-dialog-wide">
      <p className="eyebrow">
        {machine.code} · {machineEyebrow(machine)}
      </p>
      <h2 id="iv-h">{editing ? 'Modifier la saisie' : linked ? `Marquer comme fait : ${linked.label}` : 'Nouvelle intervention'}</h2>

      <div className="field">
        <span className="label" id="iv-kind-l">
          Type
        </span>
        <div className="seg g-kinds" role="group" aria-labelledby="iv-kind-l">
          {KIND_ORDER.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => chooseKind(k)} disabled={busy}>
              <Icon name={ENTRY_KINDS[k].icon} />
              {ENTRY_KINDS[k].label}
            </button>
          ))}
        </div>
        <p className="g-hint">{ENTRY_KINDS[kind].hint}</p>
      </div>

      <div className="grid2">
        <Field id="iv-date" label="Date" errors={errors}>
          <input {...aria('iv-date', errors)} type="date" value={date} max={g.today} required onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field
          id="iv-hours"
          label={kind === 'piece' || kind === 'note' ? 'Compteur (h, facultatif)' : 'Compteur (h)'}
          errors={errors}
          warn={hoursWarn}
          hint={`Actuel : ${hrs(current)}`}
        >
          <input
            {...aria('iv-hours', errors, true)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={hours}
            placeholder={hrs(current)}
            onChange={(e) => {
              setHours(e.target.value);
              setHoursTouched(true);
            }}
          />
        </Field>
      </div>

      <Field id="iv-title" label="Titre" errors={errors}>
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
          <div className="g-suggest" role="group" aria-label="Suggestions de titre">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => applySuggestion(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <Field id="iv-details" label="Détails" errors={errors}>
        <textarea
          {...aria('iv-details', errors)}
          maxLength={4000}
          value={details}
          placeholder={ph[1]}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>

      <div className="grid2">
        <Field id="iv-who" label="Fait par" errors={errors}>
          <input
            {...aria('iv-who', errors)}
            type="text"
            maxLength={80}
            list="iv-who-list"
            autoComplete="off"
            value={who}
            placeholder="Atelier interne"
            onChange={(e) => setWho(e.target.value)}
          />
          <datalist id="iv-who-list">
            {whoOptions.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </Field>
        {kind === 'reparation' ? (
          <Field id="iv-downtime" label="Immobilisation (h)" errors={errors} hint="Heures où la machine n’a pas pu travailler.">
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
        <Field id="iv-parts" label="Pièces (CHF)" errors={errors}>
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
        <Field id="iv-labour" label="Main-d’œuvre (CHF)" errors={errors}>
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
            Statut de la réparation
          </span>
          <div className="seg" role="group" aria-labelledby="iv-status-l">
            {STATUS_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} disabled={busy}>
                {REPAIR_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {kind === 'piece' ? (
        <>
          <div className="grid2">
            <Field id="iv-ref" label="Référence" errors={errors}>
              <input
                {...aria('iv-ref', errors)}
                type="text"
                maxLength={40}
                autoComplete="off"
                value={ref}
                placeholder="ex. KF-7000"
                onChange={(e) => setRef(e.target.value)}
              />
            </Field>
            <Field id="iv-qty" label="Quantité" errors={errors}>
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
            <Field id="iv-supplier" label="Fournisseur" errors={errors}>
              <input
                {...aria('iv-supplier', errors)}
                type="text"
                maxLength={80}
                autoComplete="off"
                value={supplier}
                placeholder="Nom du fournisseur"
                onChange={(e) => setSupplier(e.target.value)}
              />
            </Field>
            <Field id="iv-warranty" label="Garantie jusqu’au" errors={errors}>
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
          label="Échéance réglée"
          errors={errors}
          hint={
            scheduleId
              ? 'Cette échéance repartira pour un nouvel intervalle à partir de cette intervention.'
              : 'Facultatif : choisissez l’échéance que cette intervention accomplit.'
          }
        >
          <select {...aria('iv-schedule', errors, true)} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            <option value="">Aucune</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({scheduleTarget(s)})
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="field">
        <span className="label" id="iv-photos-l">
          Photos jointes
        </span>
        <div className="photo-in g-photo-in">
          <FileButton
            accept="image/*"
            capture="environment"
            disabled={busy || photos.length >= 12}
            onFiles={addPhotos}
            label="Ajouter des photos à l’intervention"
          >
            <Icon name="camera" />
            {photos.length ? 'Ajouter' : 'Ajouter des photos'}
          </FileButton>
          {photos.map((p) => (
            <span key={p.key} className="g-photo-chip">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local */}
              <img src={p.url} alt={`Aperçu : ${p.file.name}`} />
              <button
                type="button"
                className="g-photo-x"
                aria-label={`Retirer ${p.file.name}`}
                onClick={() => removePhoto(p.key)}
                disabled={busy}
              >
                <Icon name="close" />
              </button>
            </span>
          ))}
        </div>
        {photos.length ? <p className="g-hint">{plural(photos.length, 'photo')} · allégées avant l’envoi</p> : null}
      </div>

      {editing && entry?.schedule_id ? (
        <p className="g-hint">Cette saisie a réglé une échéance lors de son enregistrement ; la modifier ne change pas l’échéance.</p>
      ) : null}

      {busy && photos.length ? <UploadStatus machineId={machine.id} /> : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dialog-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy} aria-describedby={stage ? 'iv-stage' : undefined}>
          {busy ? <span className="g-spinner" aria-hidden="true" /> : <Icon name="check" />}
          {editing ? 'Enregistrer les modifications' : 'Enregistrer l’intervention'}
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
