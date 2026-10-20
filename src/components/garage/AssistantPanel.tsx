'use client';

// Assistant IA du garage : questions sur l'utilisation de Godet et sur le parc (lecture seule).
// Tiroir à droite (plein écran sur téléphone). Conversation gardée tant que le garage reste ouvert.
import { useLocale, useTranslations } from 'next-intl';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { AiError, askAssistant, type AiErrorCode, type ChatTurn, type Usage } from '@/lib/ai';
import { useGarage } from './context';

/** Gras (**…**) et listes (« - », « * », « 1. ») : le reste en texte simple, sans HTML. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
  );
}

function Rich({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    list = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const num = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || num) {
      const ordered = Boolean(num);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? num)![1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ''))}</p>);
  }
  flush();
  return <>{blocks}</>;
}

export function AssistantPanel({ open, onClose, machineId }: { open: boolean; onClose: () => void; machineId: string | null }) {
  const t = useTranslations('garage.assistant');
  const f = useFormat();
  const locale = useLocale();
  const g = useGarage();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiErrorCode | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const demo = g.mode === 'demo';

  // Pas de clavier d'office sur téléphone et tablette : il cacherait les réponses.
  const focusInput = () => {
    if (!window.matchMedia('(pointer: coarse)').matches) inputRef.current?.focus();
  };
  useEffect(() => {
    if (open) focusInput();
  }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy]);

  const focus = machineId ? g.fleet.machines.find((m) => m.id === machineId) : null;
  const sample = focus ?? g.fleet.machines[0] ?? null;
  const suggestions = [
    t('suggest.late'),
    ...(sample ? [t('suggest.cost', { code: sample.code })] : []),
    focus ? t('suggest.next', { code: focus.code }) : t('suggest.invite'),
  ];

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy || demo) return;
    const next: ChatTurn[] = [...turns, { role: 'user', content: question }];
    setTurns(next);
    setInput('');
    setError(null);
    setBusy(true);
    // Téléphone : le clavier se ferme pour laisser voir la réponse.
    if (window.matchMedia('(pointer: coarse)').matches) inputRef.current?.blur();
    try {
      const r = await askAssistant({ orgId: g.org.id, locale, messages: next, machineId });
      setTurns([...next, { role: 'assistant', content: r.reply }]);
      setUsage({ used: r.used, limit: r.limit });
    } catch (e) {
      setError(e instanceof AiError ? e.code : 'generic');
      // La question reste dans le champ pour la renvoyer.
      setTurns(turns);
      setInput(question);
    } finally {
      setBusy(false);
      focusInput();
    }
  }

  if (!open) return null;

  return (
    <aside className="g-ai" role="dialog" aria-modal="false" aria-labelledby="g-ai-h">
      <header className="g-ai-head">
        <span className="g-ai-mark" aria-hidden="true">
          <Icon name="spark" />
        </span>
        <div>
          <h2 id="g-ai-h">{t('title')}</h2>
          <p>{focus ? t('subMachine', { code: focus.code }) : t('sub')}</p>
        </div>
        {turns.length ? (
          <button type="button" className="icon-btn" onClick={() => setTurns([])} aria-label={t('reset')} title={t('reset')} disabled={busy}>
            <Icon name="note" />
          </button>
        ) : null}
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
          <Icon name="close" />
        </button>
      </header>

      <div className="g-ai-log" ref={logRef} aria-live="polite">
        {turns.length === 0 ? (
          <div className="g-ai-intro">
            <p>{demo ? t('introDemo') : t('intro')}</p>
            {demo ? (
              <Link href="/connexion?mode=inscription" className="btn btn-primary">
                {t('demoCta')}
              </Link>
            ) : (
              <div className="g-ai-chips">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {turns.map((turn, i) => (
          <div key={i} className={`g-ai-msg is-${turn.role}`}>
            {turn.role === 'assistant' ? <Rich text={turn.content} /> : <p>{turn.content}</p>}
          </div>
        ))}
        {busy ? (
          <div className="g-ai-msg is-assistant is-busy">
            <span className="g-spinner" aria-hidden="true" />
            <span>{t('thinking')}</span>
          </div>
        ) : null}
        {error ? (
          <p className="err" role="alert">
            {t(`errors.${error}`)}
            {error === 'subscription_inactive' || error === 'limit_reached' ? (
              <>
                {' '}
                <Link href="/parametres#abonnement">{t('seePlans')}</Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <form
        className="g-ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="g-ai-input" className="g-sr">
          {t('label')}
        </label>
        <textarea
          id="g-ai-input"
          ref={inputRef}
          rows={2}
          value={input}
          maxLength={2000}
          disabled={demo}
          placeholder={demo ? t('placeholderDemo') : t('placeholder')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={demo || busy || !input.trim()} aria-label={t('send')}>
          <Icon name="chevron-right" />
        </button>
      </form>
      <p className="g-ai-foot">
        {t('disclaimer')}
        {usage ? ` · ${t('usage', { used: f.num(usage.used), limit: f.num(usage.limit) })}` : ''}
      </p>
    </aside>
  );
}
