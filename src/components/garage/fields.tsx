'use client';

// Champs de formulaire du garage : libellé, aide, erreur reliée au champ (aria-describedby).
import type { ReactNode } from 'react';

export type Errors = Record<string, string | undefined>;

/** Attributs d'accessibilité d'un champ : état invalide et texte d'aide ou d'erreur associé. */
export function aria(id: string, errors: Errors, hasHint = false) {
  const err = errors[id];
  return {
    id,
    'aria-invalid': err ? true : undefined,
    'aria-describedby': err ? `${id}-err` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

export function Field({
  id,
  label,
  errors,
  hint,
  warn,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  errors: Errors;
  hint?: ReactNode;
  /** Avertissement non bloquant (affiché à la place de l'aide). */
  warn?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const err = errors[id];
  return (
    <div className={`field${err ? ' has-error' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {err ? (
        <p className="g-field-err" id={`${id}-err`}>
          {err}
        </p>
      ) : warn ? (
        <p className="g-hint is-warn" id={`${id}-hint`}>
          {warn}
        </p>
      ) : hint ? (
        <p className="g-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Ordre d'affichage des champs : le premier en erreur reçoit le focus. */
export function focusFirstError(order: string[], errors: Errors) {
  const first = order.find((k) => errors[k]);
  if (first) document.getElementById(first)?.focus();
}
