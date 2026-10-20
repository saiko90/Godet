'use client';

import { useState } from 'react';
import { SiteIcon } from './SiteIcons';

interface Props {
  id: string;
  /** Libellé du bouton « afficher » (traduit par le formulaire). */
  showLabel: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}

/** Champ mot de passe avec bouton « afficher / masquer » (libellé fixe + aria-pressed). */
export function PasswordInput({
  id,
  showLabel,
  name,
  autoComplete,
  value,
  defaultValue,
  onChange,
  invalid = false,
  describedBy,
  required = true,
  minLength,
  disabled = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="s-password">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required={required}
        minLength={minLength}
        maxLength={72}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...(value !== undefined
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : { defaultValue })}
      />
      <button
        type="button"
        className="s-password-toggle"
        aria-label={showLabel}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
      >
        <SiteIcon name={visible ? 'eye-off' : 'eye'} />
      </button>
    </div>
  );
}
