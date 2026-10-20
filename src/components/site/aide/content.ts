// Structure commune de la page d'aide et du guide PDF (textes : messages/<langue>/help.json).
export const START_STEPS = ['account', 'machine', 'dues', 'entry', 'team'] as const;
export const DEVICES = ['iphone', 'android', 'computer'] as const;
export type Device = (typeof DEVICES)[number];
export const TASKS = ['hours', 'workshop', 'offline', 'remove', 'costs', 'print', 'reminders', 'assistant', 'gps', 'archive', 'billing', 'rental'] as const;
export const RENTAL_STEPS = ['enable', 'settings', 'book', 'out', 'in', 'report'] as const;

/** Guide PDF d'une langue (fichiers générés par scripts/guides/make-guides.mjs). */
export const guidePdf = (locale: string) => `/guides/godet-guide-${locale}.pdf`;
