'use client';

import { createContext, useContext, useMemo } from 'react';
import { makeFormat, type Format, type FormatLocale } from '@/lib/format';

const FormatContext = createContext<Format>(makeFormat({ locale: 'fr', country: 'CH', currency: 'CHF' }));

/**
 * Formats (nombres, montants, dates) selon la langue de l'interface et le pays/devise de l'entreprise.
 * À poser une fois par zone (garage : entreprise active ; site : pays par défaut de la langue).
 */
export function FormatProvider({
  locale,
  country,
  currency,
  children,
}: {
  locale: FormatLocale;
  country?: string | null;
  currency?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => makeFormat({ locale, country, currency }), [locale, country, currency]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}

export function useFormat(): Format {
  return useContext(FormatContext);
}
