'use client';

// Boutons du rapport de location : imprimer, ouvrir le PDF, (re)préparer le PDF et le renvoyer au client.
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { useRouter } from '@/i18n/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

type Props =
  | {
      print: true;
      checkId?: undefined;
      kind?: undefined;
      pdfUrl?: undefined;
      canEmail?: undefined;
    }
  | {
      print?: false;
      checkId: string;
      kind: 'depart' | 'retour';
      pdfUrl: string | null;
      canEmail: boolean;
    };

export function ReportActions(props: Props) {
  const t = useTranslations('rental.report');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (props.print) {
    return (
      <button type="button" className="btn btn-soft s-btn-sm" onClick={() => window.print()}>
        <Icon name="print" />
        {t('print')}
      </button>
    );
  }

  async function send() {
    setBusy(true);
    setDone(null);
    const { error } = await supabaseBrowser().functions.invoke('location', {
      body: { checkId: props.checkId, locale, resend: true },
    });
    setBusy(false);
    setDone(error ? t('pdfFailed') : t('resent'));
    if (!error) router.refresh();
  }

  return (
    <div className="s-report-bar">
      {props.pdfUrl ? (
        <a href={props.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-soft s-btn-sm">
          <Icon name="file" />
          {t('pdfOf', { kind: t(`kind.${props.kind}`) })}
        </a>
      ) : null}
      {props.canEmail || !props.pdfUrl ? (
        <button type="button" className="btn btn-ghost s-btn-sm" onClick={() => void send()} disabled={busy}>
          <Icon name={props.canEmail ? 'mail' : 'file'} />
          {busy ? t('resending') : props.canEmail ? t('resend') : t('pdf')}
        </button>
      ) : null}
      {done ? (
        <span className="s-field-hint" role="status">
          {done}
        </span>
      ) : null}
    </div>
  );
}
