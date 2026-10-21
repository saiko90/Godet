import { LogoMark } from '@/components/Logo';

export interface LetterData {
  /** Côté de la fenêtre d'enveloppe (adresse du destinataire). */
  side: 'left' | 'right';
  /** Langue de la lettre (attribut lang). */
  lang: string;
  senderLines: string[];
  tagline: string;
  returnLine: string;
  recipientLines: string[];
  dateLine: string;
  subject: string | null;
  body: string;
  demo: { title: string; scan: string; url: string; short: string; guideLabel: string; guideShort: string } | null;
  legal: string[];
}

/** Repères de pliage (mm depuis le haut) : en trois pour C5/6, forme B de la DIN 5008 pour DL. */
const FOLDS: Record<LetterData['side'], number[]> = { right: [99, 198], left: [105, 210] };

/** Lettre A4 prête à imprimer pour une enveloppe à fenêtre (adresse, date, objet, texte, lien de la démo et du guide). */
export function LetterSheet({ data }: { data: LetterData }) {

  return (
    <article className={`adm-letter is-${data.side}`} lang={data.lang}>
      {FOLDS[data.side].map((top) => (
        <span key={top} className="adm-l-fold" style={{ top: `${top}mm` }} aria-hidden="true" />
      ))}
      {data.side === 'left' ? <span className="adm-l-punch" aria-hidden="true" /> : null}

      <header className="adm-l-head">
        <span className="adm-l-logo">
          <LogoMark size={34} />
          <span>GODET</span>
        </span>
        <span>{data.tagline}</span>
        {data.senderLines.map((l, i) => (i === 0 ? <b key={i}>{l}</b> : <span key={i}>{l}</span>))}
      </header>

      <div className="adm-l-window">
        <div className="adm-l-return">{data.returnLine}</div>
        <div className="adm-l-address">{data.recipientLines.join('\n')}</div>
      </div>

      <div className="adm-l-content">
        <p className="adm-l-date">{data.dateLine}</p>
        {data.subject ? <p className="adm-l-subject">{data.subject}</p> : null}
        <div className="adm-l-text">{data.body}</div>
        {data.demo ? (
          <aside className="adm-l-demo">
            <div>
              <p>
                <b>{data.demo.title}</b>
                {data.demo.scan}
              </p>
              <p className="adm-l-url">{data.demo.short}</p>
              <p className="adm-l-gap">{data.demo.guideLabel}</p>
              <p className="adm-l-url">{data.demo.guideShort}</p>
            </div>
          </aside>
        ) : null}
        <footer className="adm-l-legal">
          {data.legal.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </footer>
      </div>
    </article>
  );
}
