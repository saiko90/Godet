'use client';

// État des lieux de départ ou de retour : points de contrôle (OK / Défaut / Sans objet), carburant, compteur (lu sur
// la photo par l'IA), accident, contrôle de sécurité, accessoires, clés, photos par emplacement + photos libres,
// vidéos, frais et réserves (retour), signatures du client et du loueur. Au retour, le départ sert de comparaison.
// Enregistrement : signatures → état des lieux (non modifiable) → photos et vidéos → PDF envoyé au client.
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { CaptureButton } from '@/components/garage/CaptureButton';
import { useRouter } from '@/i18n/navigation';
import { AiError, readMeter } from '@/lib/ai';
import { useGeoFix } from '@/lib/geo';
import { prepareUpload } from '@/lib/media';
import {
  checkGroups,
  FUEL_LEVELS,
  hasFuel,
  hasSafetyCheck,
  MAX_PHOTOS,
  MAX_VIDEOS,
  photoSlots,
  rentalErrorCode,
  type Charge,
  type CheckItems,
  type CheckKind,
  type FuelLevel,
  type ItemState,
  type Rental,
} from '@/lib/rental';
import { createSupabaseRepo } from '@/lib/repo/supabase';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { MachineKind, MemberRole, Org } from '@/lib/types';
import { SignaturePad, type SignatureHandle } from './SignaturePad';

export interface PreviousCheck {
  items: CheckItems;
  hours: number | null;
  fuel: FuelLevel | null;
  accessories: string | null;
  keys: number | null;
  at: string;
  photos: { slot: string; url: string | null }[];
}

interface CheckMachine {
  id: string;
  code: string;
  kind: MachineKind;
  title: string;
  brand: string | null;
  model: string | null;
  hours: number;
  serial: string | null;
  plate: string | null;
}

interface Shot {
  key: string;
  file: File;
  url: string;
}

const STATES: ItemState[] = ['ok', 'defaut', 'na'];

/** Photo réduite (1280 px, JPEG) pour le rapport PDF ; null si le navigateur ne sait pas la lire (HEIC…). */
async function pdfThumb(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.72));
  } catch {
    return null;
  }
}

export function RentalCheckForm({
  kind,
  org,
  role,
  userId,
  staffName,
  rental,
  machine,
  previous,
}: {
  kind: CheckKind;
  org: {
    id: string;
    name: string;
    trackLocation: boolean;
    termsUrl: string | null;
  };
  role: MemberRole;
  userId: string;
  staffName: string;
  rental: Rental;
  machine: CheckMachine;
  previous: PreviousCheck | null;
}) {
  const t = useTranslations('rental.check');
  const ti = useTranslations('rental.items');
  const f = useFormat();
  const locale = useLocale();
  const router = useRouter();
  const groups = useMemo(() => checkGroups(machine.kind), [machine.kind]);
  const slots = useMemo(() => photoSlots(machine.kind), [machine.kind]);
  const safety = hasSafetyCheck(machine.kind);
  const fuelApplies = hasFuel(machine.kind);
  const retour = kind === 'retour';

  const [items, setItems] = useState<CheckItems>({});
  const [fuel, setFuel] = useState<FuelLevel | null>(null);
  const [hours, setHours] = useState('');
  const [reading, setReading] = useState<string | null>(null);
  const [accident, setAccident] = useState<boolean | null>(null);
  const [accidentNote, setAccidentNote] = useState('');
  const [safetyValid, setSafetyValid] = useState<boolean | null>(null);
  const [safetyUntil, setSafetyUntil] = useState('');
  const [accessories, setAccessories] = useState(previous?.accessories ?? '');
  const [keys, setKeys] = useState(previous?.keys != null ? String(previous.keys) : '1');
  const [remarks, setRemarks] = useState('');
  const [charges, setCharges] = useState<Charge[]>([]);
  const [reserves, setReserves] = useState<boolean | null>(retour ? null : false);
  const [breakdown, setBreakdown] = useState<boolean | null>(retour ? null : false);
  const [breakdownNote, setBreakdownNote] = useState('');
  const [slotPhotos, setSlotPhotos] = useState<Record<string, Shot>>({});
  const [freePhotos, setFreePhotos] = useState<Shot[]>([]);
  const [videos, setVideos] = useState<Shot[]>([]);
  const [clientSigner, setClientSigner] = useState(rental.client_name);
  const [staffSigner, setStaffSigner] = useState(staffName);
  const [clientSigned, setClientSigned] = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const needTerms = !retour && Boolean(org.termsUrl);
  const clientPad = useRef<SignatureHandle>(null);
  const staffPad = useRef<SignatureHandle>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const geo = useGeoFix(org.trackLocation);

  const seq = useRef(0);
  const shot = (file: File): Shot => ({
    key: `${file.name}-${file.size}-${(seq.current += 1)}`,
    file,
    url: URL.createObjectURL(file),
  });
  const photoCount = Object.keys(slotPhotos).length + freePhotos.length;
  const prevPhoto = (slot: string) => previous?.photos.find((p) => p.slot === slot)?.url ?? null;
  const n = Number(hours.replace(',', '.').replace(/[’'\s]/g, ''));
  const hoursValid = hours.trim() !== '' && Number.isFinite(n) && n >= 0;
  const worked = retour && previous?.hours != null && hoursValid ? n - previous.hours : null;

  function setItem(key: string, state: ItemState) {
    setItems((cur) => ({
      ...cur,
      [key]: {
        state,
        comment: state === 'defaut' ? (cur[key]?.comment ?? '') : undefined,
      },
    }));
    setMissing((m) => m.filter((x) => x !== key));
  }
  function setComment(key: string, comment: string) {
    setItems((cur) => ({
      ...cur,
      [key]: { ...(cur[key] ?? { state: 'defaut' }), comment },
    }));
  }

  /** Lecture du compteur sur la photo de l'emplacement « compteur ». */
  async function readFromPhoto(file: File) {
    setReading(t('meter.reading'));
    try {
      const r = await readMeter({
        orgId: org.id,
        locale,
        file,
        machineId: machine.id,
      });
      if (r.hours == null) setReading(r.note || t('meter.unreadable'));
      else {
        setHours(String(r.hours));
        setReading(r.confidence === 'high' ? t('meter.read', { hours: f.hours(r.hours) }) : t('meter.unsure', { hours: f.hours(r.hours) }));
      }
    } catch (e) {
      setReading(t(`meter.errors.${e instanceof AiError ? e.code : 'generic'}`));
    }
  }

  /** Contrôle avant signature : ce qui manque est listé et mis en évidence. */
  function check(): string | null {
    const unanswered = groups.flatMap((g) => g.items).filter((k) => !items[k]);
    setMissing(unanswered);
    if (unanswered.length) {
      document.getElementById(`item-${unanswered[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return t('errors.items', { count: unanswered.length });
    }
    if (groups.flatMap((g) => g.items).some((k) => items[k]?.state === 'defaut' && !items[k]?.comment?.trim())) return t('errors.comment');
    if (fuelApplies && !fuel) return t('errors.fuel');
    if (!hoursValid) return t('errors.hours');
    if (hoursValid && n < Number(machine.hours) - 0.05 && !retour) return t('errors.hoursLower', { hours: f.hours(machine.hours) });
    if (accident === null) return t('errors.accident');
    if (accident && !accidentNote.trim()) return t('errors.accidentNote');
    if (safety && safetyValid === null) return t('errors.safety');
    if (retour && reserves === null) return t('errors.reserves');
    if (retour && breakdown === null) return t('errors.breakdown');
    if (breakdown && !breakdownNote.trim()) return t('errors.breakdownNote');
    if (needTerms && !termsOk) return t('errors.terms');
    if (!clientSigner.trim()) return t('errors.signer');
    if (!clientSigned) return t('errors.signature');
    return null;
  }

  async function submit() {
    const problem = check();
    if (problem) return setError(problem);
    const missingPhotos = slots.filter((s) => s.required && !slotPhotos[s.key]).map((s) => t(`slots.${s.key}`));
    if (missingPhotos.length && !window.confirm(t('confirmMissingPhotos', { list: missingPhotos.join(', ') }))) return;
    setError(null);
    setBusy(true);
    const db = supabaseBrowser();
    const checkId = crypto.randomUUID();
    const base = `${org.id}/${machine.id}/location/${checkId}`;
    try {
      // 1. Signatures (images PNG dans le stockage de l'entreprise).
      setStage(t('stages.signatures'));
      const clientBlob = await clientPad.current?.toBlob();
      if (!clientBlob) throw new Error(t('errors.signature'));
      const up1 = await db.storage.from('medias').upload(`${base}-client.png`, clientBlob, { contentType: 'image/png' });
      if (up1.error) throw new Error(t('errors.upload'));
      const staffBlob = await staffPad.current?.toBlob();
      let staffPath: string | null = null;
      if (staffBlob) {
        const up2 = await db.storage.from('medias').upload(`${base}-loueur.png`, staffBlob, {
          contentType: 'image/png',
        });
        if (!up2.error) staffPath = `${base}-loueur.png`;
      }

      // 2. L'état des lieux (signé : il ne se modifie plus).
      setStage(t('stages.saving'));
      const clean = (s: string) => (s.trim() ? s.trim() : null);
      const { error: insertError } = await db.from('rental_checks').insert({
        id: checkId,
        org_id: org.id,
        rental_id: rental.id,
        machine_id: machine.id,
        kind,
        items: Object.fromEntries(
          Object.entries(items).map(([k, v]) => [k, v.state === 'defaut' ? { state: v.state, comment: v.comment?.trim() } : { state: v.state }]),
        ),
        fuel_level: fuelApplies ? fuel : null,
        hours: hoursValid ? Math.round(n * 10) / 10 : null,
        accessories: clean(accessories),
        accident: Boolean(accident),
        accident_note: accident ? clean(accidentNote) : null,
        safety_valid: safety ? safetyValid : null,
        safety_until: safety && safetyUntil ? safetyUntil : null,
        keys_count: keys.trim() ? Math.max(0, Math.min(20, Math.round(Number(keys)))) : null,
        remarks: clean(remarks),
        charges: charges.filter((c) => c.label.trim() && Number.isFinite(c.amount)).map((c) => ({ label: c.label.trim(), amount: c.amount })),
        reserves: retour ? reserves : null,
        breakdown: retour && Boolean(breakdown),
        breakdown_note: retour && breakdown ? clean(breakdownNote) : null,
        terms_accepted: needTerms && termsOk,
        client_signer: clientSigner.trim(),
        client_signature: `${base}-client.png`,
        staff_signer: clean(staffSigner),
        staff_signature: staffPath,
        lat: geo.fix?.lat ?? null,
        lng: geo.fix?.lng ?? null,
      });
      if (insertError) {
        console.error('[location] état des lieux :', insertError.code, insertError.message);
        throw new Error(t(`errors.db.${rentalErrorCode(insertError)}`));
      }

      // 3. Photos et vidéos : médias de la machine, rattachés à l'état des lieux.
      const repo = createSupabaseRepo(db, {
        org: { id: org.id } as Org,
        role,
        userId,
      });
      const queue: { file: File; slot: string; caption: string }[] = [
        ...slots
          .filter((s) => slotPhotos[s.key])
          .map((s) => ({
            file: slotPhotos[s.key].file,
            slot: s.key,
            caption: t(`slots.${s.key}`),
          })),
        ...freePhotos.map((p) => ({
          file: p.file,
          slot: 'libre',
          caption: t('slots.libre'),
        })),
        ...videos.map((v) => ({
          file: v.file,
          slot: 'video',
          caption: t('slots.video'),
        })),
      ];
      const failed: string[] = [];
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        setStage(t('stages.media', { n: i + 1, total: queue.length }));
        try {
          const prepared = await prepareUpload(q.file);
          await repo.uploadMedia(machine.id, prepared.blob, {
            kind: prepared.kind,
            fileName: prepared.name,
            caption: `${t(retour ? 'captionIn' : 'captionOut')} · ${q.caption}`.slice(0, 200),
            rentalCheckId: checkId,
            slot: q.slot,
          });
          // Copie allégée pour le rapport PDF (la fonction « location » ne lit que des JPEG légers).
          if (q.slot !== 'video') {
            const small = await pdfThumb(q.file);
            if (small) {
              await db.storage
                .from('medias')
                .upload(`${base}-pdf-${String(i).padStart(2, '0')}-${q.slot}.jpg`, small, { contentType: 'image/jpeg' })
                .catch(() => null);
            }
          }
        } catch (e) {
          console.error('[location] média :', e);
          failed.push(q.caption);
        }
      }

      // 4. Rapport PDF dans le carnet de la machine, envoyé au client par e-mail.
      setStage(t('stages.report'));
      const { error: fnError } = await db.functions.invoke('location', {
        body: { checkId, locale },
      });
      if (fnError) console.error('[location] rapport :', fnError);

      const params = new URLSearchParams({ ok: kind });
      if (failed.length) params.set('missing', String(failed.length));
      if (fnError) params.set('pdf', '0');
      router.replace(`/location/${rental.id}/rapport?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('errors.generic'));
      setBusy(false);
      setStage(null);
    }
  }

  const prevState = (key: string) => previous?.items[key]?.state;

  return (
    <form
      className="s-insp"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void submit();
      }}
    >
      <header className="s-check-head">
        <p className="eyebrow">
          {machine.code} · {machine.title}
          {machine.brand || machine.model ? ` · ${[machine.brand, machine.model].filter(Boolean).join(' ')}` : ''}
        </p>
        <h1>{retour ? t('titleIn') : t('titleOut')}</h1>
        <p className="muted">
          {[rental.client_company, rental.client_name].filter(Boolean).join(' · ')} · {f.dateTime(rental.start_at)} → {f.dateTime(rental.end_at)}
          {rental.site ? ` · ${rental.site}` : ''}
        </p>
        {retour && previous ? <p className="s-check-prev-note">{t('compareNote', { date: f.dateTime(previous.at) })}</p> : null}
      </header>

      {/* ------------------------------------------------ points de contrôle */}
      {groups.map((g) => (
        <section key={g.key} className="s-check-group" aria-labelledby={`grp-${g.key}`}>
          <div className="s-check-group-head">
            <h2 id={`grp-${g.key}`}>{t(`groups.${g.key}`)}</h2>
            <button
              type="button"
              className="btn btn-ghost s-btn-sm"
              onClick={() => {
                for (const k of g.items) if (!items[k] || items[k].state !== 'defaut') setItem(k, 'ok');
              }}
            >
              <Icon name="check" />
              {t('allOk')}
            </button>
          </div>
          <ul>
            {g.items.map((k) => {
              const v = items[k];
              const before = prevState(k);
              const worse = retour && before && before !== 'defaut' && v?.state === 'defaut';
              return (
                <li key={k} id={`item-${k}`} className={`s-check-item${missing.includes(k) ? ' is-missing' : ''}${worse ? ' is-worse' : ''}`}>
                  <div className="s-check-item-row">
                    <span className="s-check-label">
                      {ti(k)}
                      {retour && before ? <span className={`s-check-before is-${before}`}>{t('before', { state: t(`states.${before}`) })}</span> : null}
                    </span>
                    <div className="s-check-states" role="radiogroup" aria-label={ti(k)}>
                      {STATES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={v?.state === s}
                          className={`is-${s}${v?.state === s ? ' is-on' : ''}`}
                          onClick={() => setItem(k, s)}
                        >
                          {t(`states.${s}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {v?.state === 'defaut' ? (
                    <input
                      className="s-check-comment"
                      aria-label={t('defectComment', { item: ti(k) })}
                      placeholder={t('defectPlaceholder')}
                      maxLength={300}
                      value={v.comment ?? ''}
                      onChange={(e) => setComment(k, e.target.value)}
                    />
                  ) : null}
                  {retour && previous?.items[k]?.comment ? (
                    <p className="s-check-prev">
                      {t('beforeComment', {
                        comment: previous.items[k].comment ?? '',
                      })}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* ------------------------------------------------ carburant, compteur, accident, sécurité */}
      <section className="s-check-group" aria-labelledby="grp-releves">
        <h2 id="grp-releves">{t('groups.releves')}</h2>
        {fuelApplies ? (
          <div className="field">
            <span className="label" id="fuel-l">
              {t('fuel')}
              {retour && previous?.fuel ? (
                <span className="s-check-before is-ok">
                  {t('beforeValue', {
                    value: t(`fuelLevels.${previous.fuel}`),
                  })}
                </span>
              ) : null}
            </span>
            <div className="s-check-fuel" role="radiogroup" aria-labelledby="fuel-l">
              {FUEL_LEVELS.map((lvl) => (
                <button key={lvl} type="button" role="radio" aria-checked={fuel === lvl} className={fuel === lvl ? 'is-on' : ''} onClick={() => setFuel(lvl)}>
                  {t(`fuelLevels.${lvl}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="ck-hours">
            {t('meter.label')}
            {retour && previous?.hours != null ? <span className="s-check-before is-ok">{t('beforeValue', { value: f.hours(previous.hours) })}</span> : null}
          </label>
          <div className="s-check-hours">
            <input
              id="ck-hours"
              inputMode="decimal"
              autoComplete="off"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder={String(machine.hours)}
            />
            <span aria-hidden="true">h</span>
          </div>
          <p className="s-field-hint" role="status">
            {reading ?? (worked != null ? t('meter.worked', { hours: f.hours(worked) }) : t('meter.hint', { hours: f.hours(machine.hours) }))}
          </p>
        </div>
        <div className="field">
          <span className="label" id="acc-l">
            {t('accident')}
          </span>
          <div className="s-check-yn" role="radiogroup" aria-labelledby="acc-l">
            {[false, true].map((b) => (
              <button
                key={String(b)}
                type="button"
                role="radio"
                aria-checked={accident === b}
                className={accident === b ? (b ? 'is-on is-bad' : 'is-on') : ''}
                onClick={() => setAccident(b)}
              >
                {b ? t('yes') : t('no')}
              </button>
            ))}
          </div>
          {accident ? (
            <textarea
              aria-label={t('accidentNote')}
              placeholder={t('accidentNote')}
              rows={2}
              maxLength={1000}
              value={accidentNote}
              onChange={(e) => setAccidentNote(e.target.value)}
            />
          ) : null}
        </div>
        {safety ? (
          <div className="field">
            <span className="label" id="saf-l">
              {t('safety')}
            </span>
            <div className="s-check-yn" role="radiogroup" aria-labelledby="saf-l">
              {[true, false].map((b) => (
                <button
                  key={String(b)}
                  type="button"
                  role="radio"
                  aria-checked={safetyValid === b}
                  className={safetyValid === b ? (b ? 'is-on' : 'is-on is-bad') : ''}
                  onClick={() => setSafetyValid(b)}
                >
                  {b ? t('valid') : t('invalid')}
                </button>
              ))}
            </div>
            <label className="s-check-inline" htmlFor="ck-safety">
              {t('safetyUntil')}
              <input id="ck-safety" type="date" value={safetyUntil} onChange={(e) => setSafetyUntil(e.target.value)} />
            </label>
          </div>
        ) : null}
        <div className="s-row">
          <div className="field">
            <label htmlFor="ck-acc">{t('accessories')}</label>
            <textarea
              id="ck-acc"
              rows={2}
              maxLength={1000}
              placeholder={t('accessoriesPlaceholder')}
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ck-keys">{t('keys')}</label>
            <input id="ck-keys" inputMode="numeric" value={keys} onChange={(e) => setKeys(e.target.value.replace(/\D/g, '').slice(0, 2))} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ photos et vidéos */}
      <section className="s-check-group" aria-labelledby="grp-photos">
        <h2 id="grp-photos">{t('groups.photos')}</h2>
        <p className="s-field-hint">{t('photosHint', { max: MAX_PHOTOS })}</p>
        <ul className="s-check-slots">
          {slots.map((s) => {
            const p = slotPhotos[s.key];
            const before = retour ? prevPhoto(s.key) : null;
            return (
              <li key={s.key} className={`s-check-slot${p ? ' has-photo' : ''}`}>
                <span className="s-check-slot-name">
                  {t(`slots.${s.key}`)}
                  {s.required ? <span aria-hidden="true"> *</span> : null}
                </span>
                {p ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local
                  <img src={p.url} alt={t(`slots.${s.key}`)} />
                ) : before ? (
                  // eslint-disable-next-line @next/next/no-img-element -- photo du départ (lien signé)
                  <img src={before} alt={t('beforePhoto', { slot: t(`slots.${s.key}`) })} className="is-before" />
                ) : (
                  <span className="s-check-slot-empty" aria-hidden="true">
                    <Icon name="camera" />
                  </span>
                )}
                {before && !p ? <span className="s-check-slot-tag">{t('beforeShort')}</span> : null}
                <div className="s-check-slot-btns">
                  <CaptureButton
                    kind="photo"
                    multiple={false}
                    className="btn btn-soft s-btn-sm"
                    label={t('takeSlot', { slot: t(`slots.${s.key}`) })}
                    disabled={busy}
                    onFiles={(files) => {
                      const file = files[0];
                      if (!file) return;
                      setSlotPhotos((cur) => ({ ...cur, [s.key]: shot(file) }));
                      if (s.key === 'compteur') void readFromPhoto(file);
                    }}
                  >
                    <Icon name="camera" />
                    {p ? t('replace') : t('take')}
                  </CaptureButton>
                  {p ? (
                    <button
                      type="button"
                      className="btn btn-ghost s-btn-sm"
                      aria-label={t('removePhoto', {
                        slot: t(`slots.${s.key}`),
                      })}
                      onClick={() =>
                        setSlotPhotos((cur) => {
                          const next = { ...cur };
                          delete next[s.key];
                          return next;
                        })
                      }
                    >
                      <Icon name="trash" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <h3>
          {t('freePhotos', {
            n: freePhotos.length,
            max: Math.max(0, MAX_PHOTOS - Object.keys(slotPhotos).length),
          })}
        </h3>
        <div className="s-check-free">
          {freePhotos.map((p) => (
            <span key={p.key} className="s-check-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local */}
              <img src={p.url} alt={t('slots.libre')} />
              <button type="button" aria-label={t('removeFree')} onClick={() => setFreePhotos((cur) => cur.filter((x) => x.key !== p.key))}>
                <Icon name="close" />
              </button>
            </span>
          ))}
          {photoCount < MAX_PHOTOS ? (
            <CaptureButton
              kind="photo"
              className="btn btn-soft s-check-add"
              disabled={busy}
              label={t('addFree')}
              onFiles={(files) => setFreePhotos((cur) => [...cur, ...files.slice(0, MAX_PHOTOS - photoCount).map(shot)])}
            >
              <Icon name="plus" />
              {t('addFree')}
            </CaptureButton>
          ) : null}
        </div>
        <h3>{t('videos', { n: videos.length, max: MAX_VIDEOS })}</h3>
        <div className="s-check-free">
          {videos.map((v) => (
            <span key={v.key} className="s-check-thumb is-video">
              <video src={v.url} muted playsInline preload="metadata" />
              <button type="button" aria-label={t('removeVideo')} onClick={() => setVideos((cur) => cur.filter((x) => x.key !== v.key))}>
                <Icon name="close" />
              </button>
            </span>
          ))}
          {videos.length < MAX_VIDEOS ? (
            <CaptureButton
              kind="video"
              multiple={false}
              className="btn btn-soft s-check-add"
              disabled={busy}
              label={t('addVideo')}
              onFiles={(files) => setVideos((cur) => [...cur, ...files.slice(0, MAX_VIDEOS - cur.length).map(shot)])}
            >
              <Icon name="video" />
              {t('addVideo')}
            </CaptureButton>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------ retour : frais et réserves */}
      {retour ? (
        <section className="s-check-group" aria-labelledby="grp-frais">
          <h2 id="grp-frais">{t('groups.frais')}</h2>
          <ul className="s-check-charges">
            {charges.map((c, i) => (
              <li key={i}>
                <input
                  aria-label={t('chargeLabel')}
                  placeholder={t('chargePlaceholder')}
                  maxLength={80}
                  value={c.label}
                  onChange={(e) => setCharges((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <input
                  aria-label={t('chargeAmount')}
                  inputMode="decimal"
                  value={Number.isFinite(c.amount) && c.amount !== 0 ? String(c.amount) : ''}
                  placeholder={f.currency}
                  onChange={(e) => {
                    const amount = Number(e.target.value.replace(',', '.'));
                    setCharges((cur) =>
                      cur.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              amount: Number.isFinite(amount) ? amount : 0,
                            }
                          : x,
                      ),
                    );
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost s-btn-sm"
                  aria-label={t('removeCharge')}
                  onClick={() => setCharges((cur) => cur.filter((_, j) => j !== i))}
                >
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
          <div className="s-check-presets">
            {(['plein', 'nettoyage', 'degats'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className="btn btn-soft s-btn-sm"
                onClick={() => setCharges((cur) => [...cur, { label: t(`chargePresets.${p}`), amount: 0 }])}
              >
                <Icon name="plus" />
                {t(`chargePresets.${p}`)}
              </button>
            ))}
          </div>
          {charges.length ? (
            <p className="s-check-total">
              {t('chargesTotal', {
                total: f.money2(charges.reduce((s, c) => s + (Number.isFinite(c.amount) ? c.amount : 0), 0)),
              })}
            </p>
          ) : null}
          <p className="s-field-hint">{t('chargesHint')}</p>
          <div className="s-check-yn" role="radiogroup" aria-label={t('reserves')}>
            {[false, true].map((b) => (
              <button
                key={String(b)}
                type="button"
                role="radio"
                aria-checked={reserves === b}
                className={reserves === b ? (b ? 'is-on is-bad' : 'is-on') : ''}
                onClick={() => setReserves(b)}
              >
                {b ? t('withReserves') : t('noReserves')}
              </button>
            ))}
          </div>
          <div className="s-check-breakdown">
            <span className="label" id="brk-l">
              {t('breakdown')}
            </span>
            <div className="s-check-yn" role="radiogroup" aria-labelledby="brk-l">
              {[false, true].map((b) => (
                <button
                  key={String(b)}
                  type="button"
                  role="radio"
                  aria-checked={breakdown === b}
                  className={breakdown === b ? (b ? 'is-on is-bad' : 'is-on') : ''}
                  onClick={() => setBreakdown(b)}
                >
                  {b ? t('breakdownYes') : t('breakdownNo')}
                </button>
              ))}
            </div>
            {breakdown ? (
              <>
                <textarea
                  aria-label={t('breakdownNote')}
                  placeholder={t('breakdownNote')}
                  rows={2}
                  maxLength={1000}
                  value={breakdownNote}
                  onChange={(e) => setBreakdownNote(e.target.value)}
                />
                <p className="s-field-hint">{t('breakdownHint')}</p>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ remarques et signatures */}
      <section className="s-check-group" aria-labelledby="grp-sign">
        <h2 id="grp-sign">{t('groups.signatures')}</h2>
        <div className="field">
          <label htmlFor="ck-rem">{t('remarks')}</label>
          <textarea id="ck-rem" rows={3} maxLength={3000} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        {needTerms && org.termsUrl ? (
          <div className="s-check-terms">
            <a href={org.termsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-soft s-btn-sm">
              <Icon name="file" />
              {t('termsRead')}
            </a>
            <label className={`s-check-terms-box${error && !termsOk ? ' is-missing' : ''}`}>
              <input
                type="checkbox"
                checked={termsOk}
                onChange={(e) => {
                  setTermsOk(e.target.checked);
                  setError(null);
                }}
              />
              <span>{t('termsAccept')}</span>
            </label>
          </div>
        ) : null}
        <p className="s-check-agree">{retour ? t('agreeIn') : t('agreeOut')}</p>
        <div className="s-check-signs">
          <div>
            <label htmlFor="ck-cs">{t('clientSigner')}</label>
            <input id="ck-cs" autoComplete="off" maxLength={120} value={clientSigner} onChange={(e) => setClientSigner(e.target.value)} />
            <SignaturePad ref={clientPad} label={t('clientSignature')} clearLabel={t('clearSignature')} onChange={setClientSigned} />
          </div>
          <div>
            <label htmlFor="ck-ss">{t('staffSigner', { org: org.name })}</label>
            <input id="ck-ss" autoComplete="off" maxLength={120} value={staffSigner} onChange={(e) => setStaffSigner(e.target.value)} />
            <SignaturePad ref={staffPad} label={t('staffSignature')} clearLabel={t('clearSignature')} />
          </div>
        </div>
        {org.trackLocation && geo.state === 'ok' ? <p className="s-field-hint">{t('geoAttached')}</p> : null}
      </section>

      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      <div className="s-check-submit">
        {stage ? (
          <p className="s-field-hint" role="status">
            <span className="g-spinner" aria-hidden="true" /> {stage}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Icon name="check" />
          {busy ? t('signing') : retour ? t('submitIn') : t('submitOut')}
        </button>
        <p className="s-field-hint">{rental.client_email ? t('emailNote', { email: rental.client_email }) : t('noEmailNote')}</p>
      </div>
    </form>
  );
}
