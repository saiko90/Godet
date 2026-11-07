// Expéditeur des lettres de prospection imprimées depuis la console (/admin/prospects/<id>/lettre/<message>).
// À COMPLÉTER avant le premier envoi : une lettre commerciale doit porter l'adresse postale complète de
// l'expéditeur (c'est aussi l'adresse où l'on peut s'opposer à d'autres envois). Tant que la rue ou la localité
// manque, la console affiche un avertissement au-dessus de la lettre.

export const LETTER_SENDER = {
  /** Personne qui signe (nom affiché des e-mails de prospection). */
  name: 'Michaël Kaeser',
  /** Raison sociale telle qu'inscrite (registre du commerce le cas échéant). */
  company: 'Swiss Digital Studio',
  /** Rue et numéro. */
  street: 'Route de Derborence 28',
  /** Numéro postal. */
  postalCode: '1976',
  /** Localité (reprise dans la ligne de date : « Sion, le 19 octobre 2026 »). */
  city: 'Aven',
  /** Pays de l'expéditeur (ISO). */
  country: 'CH',
  phone: '078 711 64 11',
  email: 'contact@swissdigitalstudio.ch',
  website: 'swissdigitalstudio.ch',
} as const;

export function senderComplete(): boolean {
  return Boolean(LETTER_SENDER.street.trim() && LETTER_SENDER.postalCode.trim() && LETTER_SENDER.city.trim());
}

/** Nom du pays du destinataire sur la dernière ligne de l'adresse (courrier international), en capitales. */
export const COUNTRY_LINE: Record<string, string> = {
  DE: 'DEUTSCHLAND',
  AT: 'ÖSTERREICH',
  FR: 'FRANCE',
  IT: 'ITALIA',
  LI: 'LIECHTENSTEIN',
  BE: 'BELGIQUE',
  LU: 'LUXEMBOURG',
  GB: 'UNITED KINGDOM',
  CH: 'SUISSE',
};

/**
 * Position de l'adresse : fenêtre à gauche en Allemagne et en Autriche (DIN 5008, forme B, enveloppe DL),
 * à droite ailleurs (Suisse, France, Italie : enveloppe C5/6 ou DL à fenêtre droite).
 */
export function windowSide(country: string): 'left' | 'right' {
  return ['DE', 'AT'].includes(country.toUpperCase()) ? 'left' : 'right';
}
