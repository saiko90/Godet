// Guides du site (pages de contenu pour le référencement) : une page par sujet, dans les 4 langues, chacune avec
// son adresse traduite (/guides/<slug>, /de/guides/<slug>…). Texte simple ; liens internes en « [texte](/demo) ».
import type { AppLocale } from '@/i18n/routing';

export interface GuideSection {
  /** Intertitre (h2). */
  h2: string;
  /** Paragraphes ; un lien interne s'écrit [texte](/chemin-sans-langue), par ex. [la démo](/demo). */
  paragraphs: string[];
  /** Liste à puces facultative, affichée après les paragraphes. */
  bullets?: string[];
}

export interface GuideContent {
  /** Adresse dans cette langue (minuscules, chiffres, tirets), sans /guides/. */
  slug: string;
  /**
   * Titre de l'onglet et de Google, 60 caractères au plus, espaces comprises (titre absolu : pas de « · Godet »
   * ajouté). Mettre le mot-clé exact au début.
   */
  metaTitle: string;
  /** Description Google (140 à 160 caractères). */
  description: string;
  /** Titre de la page (h1). */
  h1: string;
  /** Chapeau sous le titre (2 à 3 phrases). */
  lead: string;
  sections: GuideSection[];
  /** Questions fréquentes (affichées et balisées pour Google). */
  faq: { q: string; a: string }[];
}

export interface Guide {
  /** Identifiant stable (ne change jamais). */
  id: string;
  /** Date de dernière mise à jour du contenu (AAAA-MM-JJ). */
  updated: string;
  content: Record<AppLocale, GuideContent>;
}
