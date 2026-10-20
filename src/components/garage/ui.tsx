'use client';

// Briques d'interface du garage : modale accessible (focus piégé et rendu), menu déroulant, notification.
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icons';
import { Link } from '@/i18n/navigation';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Garde la tabulation à l'intérieur de `root`. */
export function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== 'Tab' || !root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 || el === document.activeElement,
  );
  if (!items.length) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !root.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Fenêtre modale : voile, focus sur le premier champ (ou l'élément `data-autofocus`), tabulation piégée,
 * focus rendu à l'élément d'origine à la fermeture. Échap est géré par le garage (modale, puis fiche).
 * Avec `onSubmit`, la boîte est un formulaire.
 */
export function Modal({
  labelledBy,
  describedBy,
  onClose,
  onSubmit,
  busy = false,
  className,
  children,
}: {
  labelledBy: string;
  describedBy?: string;
  onClose: () => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    const first =
      root?.querySelector<HTMLElement>('[data-autofocus]') ??
      root?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]), select, textarea') ??
      root?.querySelector<HTMLElement>(FOCUSABLE);
    const t = window.setTimeout(() => first?.focus({ preventScroll: true }), 30);
    return () => {
      window.clearTimeout(t);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  const common = {
    className: `dialog g-dialog${className ? ` ${className}` : ''}`,
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-busy': busy || undefined,
    onKeyDown: (e: KeyboardEvent) => {
      // Pendant un envoi, Échap ne ferme pas la boîte (l'enregistrement irait à son terme sans retour visible).
      if (e.key === 'Escape' && busy) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      trapTab(e, ref.current);
    },
  };

  return (
    <div
      className="modal g-modal"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      {onSubmit ? (
        <form
          {...common}
          ref={(el) => {
            ref.current = el;
          }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) onSubmit(e);
          }}
        >
          {children}
        </form>
      ) : (
        <div
          {...common}
          ref={(el) => {
            ref.current = el;
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export type MenuEntry =
  | {
      key: string;
      label: string;
      icon?: IconName;
      onSelect?: () => void;
      href?: string;
      newTab?: boolean;
      danger?: boolean;
      disabled?: boolean;
    }
  | { key: string; heading: string; sub?: string };

/**
 * Bouton qui ouvre un menu (flèches haut/bas, Échap, clic à l'extérieur).
 * `footer` : réglages posés sous les entrées du menu (choix de la langue) ; la tabulation y mène, et le menu se
 * ferme quand le focus quitte l'ensemble.
 */
export function Menu({
  label,
  icon = 'menu',
  items,
  footer,
  className,
  buttonClassName = 'icon-btn',
  showLabel = false,
}: {
  label: string;
  icon?: IconName;
  items: MenuEntry[];
  footer?: ReactNode;
  className?: string;
  buttonClassName?: string;
  showLabel?: boolean;
}) {
  const t = useTranslations('garage.menu');
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const first = wrap.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
    first?.focus();
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    const items = Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      // Avec des réglages sous le menu, la tabulation y mène ; le menu se ferme quand le focus sort (onBlur).
      if (!footer) setOpen(false);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.stopPropagation();
    }
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!open || !footer) return;
    const next = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (!next || !wrap.current?.contains(next)) setOpen(false);
  }

  return (
    <div className={`g-menu${className ? ` ${className}` : ''}`} ref={wrap} onKeyDown={onKeyDown} onBlur={onBlur} data-own-arrows="">
      <button
        ref={button}
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={showLabel ? undefined : label}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={icon} />
        {showLabel ? <span className="lbl">{label}</span> : null}
      </button>
      {open ? (
        <div className="g-menu-list">
          <div className="g-menu-items" role="menu" id={id} aria-label={label}>
          {items.map((it) => {
            if ('heading' in it) {
              return (
                <div key={it.key} className="g-menu-head" role="presentation">
                  <b>{it.heading}</b>
                  {it.sub ? <span>{it.sub}</span> : null}
                </div>
              );
            }
            const content = (
              <>
                {it.icon ? <Icon name={it.icon} /> : null}
                <span>{it.label}</span>
              </>
            );
            const cls = `g-menu-item${it.danger ? ' is-danger' : ''}`;
            return it.href && !it.disabled ? (
              <Link
                key={it.key}
                role="menuitem"
                tabIndex={-1}
                className={cls}
                href={it.href}
                target={it.newTab ? '_blank' : undefined}
                rel={it.newTab ? 'noopener' : undefined}
                onClick={() => setOpen(false)}
              >
                {content}
                {it.newTab ? <span className="g-sr"> {t('newTab')}</span> : null}
              </Link>
            ) : (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={cls}
                aria-disabled={it.disabled || undefined}
                onClick={() => {
                  if (it.disabled) return;
                  setOpen(false);
                  it.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
          </div>
          {footer ? <div className="g-menu-foot">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Notification passagère (région vivante toujours présente pour les lecteurs d'écran). */
export function Toast({ toast }: { toast: { id: number; message: string; tone: 'ok' | 'error' } | null }) {
  return (
    <div
      className={`toast g-toast${toast ? ' show' : ''}${toast?.tone === 'error' ? ' is-error' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast ? (
        <span key={toast.id} className="g-toast-in">
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} />
          {toast.message}
        </span>
      ) : null}
    </div>
  );
}

/** Barre d'avancement accessible. */
export function Progress({ value, label }: { value: number | null; label: string }) {
  const pct = value == null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`g-progress${pct == null ? ' is-wait' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
    >
      <i style={pct == null ? undefined : { width: `${pct}%` }} />
    </div>
  );
}
