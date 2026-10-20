'use client';

// Paramètres → Location (option payante) : conditions de location en PDF (acceptées par le client à la signature
// de l'état des lieux) et copie des rapports au loueur. Sans l'option : présentation et lien vers l'abonnement.
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { Link, useRouter } from '@/i18n/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

const MAX_PDF = 10 * 1024 * 1024;

export function LocationPanel({
  orgId,
  enabled,
  canEdit,
  termsUrl,
  termsUpdatedLabel,
  reportCc,
}: {
  orgId: string;
  enabled: boolean;
  canEdit: boolean;
  termsUrl: string | null;
  termsUpdatedLabel: string | null;
  reportCc: string | null;
}) {
  const t = useTranslations('settings.rental');
  const router = useRouter();
  const uid = useId();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cc, setCc] = useState(reportCc ?? '');

  async function upload(f: File) {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return setMsg({ ok: false, text: t('errors.type') });
    if (f.size > MAX_PDF) return setMsg({ ok: false, text: t('errors.size') });
    setBusy(true);
    setMsg(null);
    const db = supabaseBrowser();
    // Nouveau fichier à chaque version : les états des lieux déjà signés gardent la version acceptée.
    const path = `${orgId}/location/conditions-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
    const up = await db.storage.from('medias').upload(path, f, { contentType: 'application/pdf' });
    if (up.error) {
      setBusy(false);
      return setMsg({ ok: false, text: t('errors.upload') });
    }
    const { error } = await db
      .from('organizations')
      .update({
        rental_terms_path: path,
        rental_terms_updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: t('errors.save') });
    setMsg({ ok: true, text: t('saved') });
    router.refresh();
  }

  async function removeTerms() {
    if (!window.confirm(t('confirmRemove'))) return;
    setBusy(true);
    const { error } = await supabaseBrowser().from('organizations').update({ rental_terms_path: null, rental_terms_updated_at: null }).eq('id', orgId);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: t('errors.save') });
    setMsg({ ok: true, text: t('removed') });
    router.refresh();
  }

  async function saveCc() {
    const v = cc.trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setMsg({ ok: false, text: t('errors.email') });
    setBusy(true);
    const { error } = await supabaseBrowser()
      .from('organizations')
      .update({ rental_report_cc: v || null })
      .eq('id', orgId);
    setBusy(false);
    setMsg(error ? { ok: false, text: t('errors.save') } : { ok: true, text: t('saved') });
    if (!error) router.refresh();
  }

  return (
    <section id="location" className="s-panel" aria-labelledby={`${uid}-h`}>
      <div className="s-panel-head">
        <h2 id={`${uid}-h`}>
          <Icon name="calendar" />
          {t('title')}
        </h2>
        <p>{enabled ? t('text') : t('offText')}</p>
      </div>

      {!enabled ? (
        <a href="#abonnement" className="btn btn-soft">
          {t('enable')}
        </a>
      ) : (
        <div className="s-rent-settings">
          <Link href="/location" className="btn btn-soft s-btn-sm">
            <Icon name="calendar" />
            {t('agenda')}
          </Link>

          <div className="s-rent-settings-block">
            <h3>{t('terms.title')}</h3>
            <p className="s-field-hint">{t('terms.hint')}</p>
            {termsUrl ? (
              <p className="s-rent-terms-file">
                <Icon name="file" />
                <a href={termsUrl} target="_blank" rel="noopener noreferrer">
                  {t('terms.current')}
                </a>
                {termsUpdatedLabel ? <span className="muted">{t('terms.updated', { date: termsUpdatedLabel })}</span> : null}
              </p>
            ) : (
              <p className="muted">{t('terms.none')}</p>
            )}
            {canEdit ? (
              <div className="s-report-bar">
                <input
                  ref={file}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void upload(f);
                  }}
                />
                <button type="button" className="btn btn-primary s-btn-sm" disabled={busy} onClick={() => file.current?.click()}>
                  <Icon name="upload" />
                  {busy ? t('saving') : termsUrl ? t('terms.replace') : t('terms.upload')}
                </button>
                {termsUrl ? (
                  <button type="button" className="btn btn-ghost s-btn-sm" disabled={busy} onClick={() => void removeTerms()}>
                    <Icon name="trash" />
                    {t('terms.remove')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="s-rent-settings-block">
            <h3>
              <label htmlFor={`${uid}-cc`}>{t('cc.title')}</label>
            </h3>
            <p className="s-field-hint">{t('cc.hint')}</p>
            <div className="s-report-bar">
              <input
                id={`${uid}-cc`}
                className="s-check-comment"
                type="email"
                autoComplete="email"
                maxLength={200}
                value={cc}
                disabled={!canEdit || busy}
                onChange={(e) => setCc(e.target.value)}
                placeholder={t('cc.placeholder')}
                style={{ flex: '1 1 240px', width: 'auto' }}
              />
              {canEdit ? (
                <button type="button" className="btn btn-soft s-btn-sm" disabled={busy || cc.trim() === (reportCc ?? '')} onClick={() => void saveCc()}>
                  {t('cc.save')}
                </button>
              ) : null}
            </div>
          </div>
          {!canEdit ? <p className="muted">{t('readOnly')}</p> : null}
        </div>
      )}
      {msg ? (
        <p className={msg.ok ? 's-field-hint' : 'err'} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </p>
      ) : null}
    </section>
  );
}
