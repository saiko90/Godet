// Guides du site (pages de contenu pour le référencement) : une page par sujet, dans les 4 langues, chacune avec
// son adresse traduite (/guides/<slug>, /de/guides/<slug>…). Texte simple ; liens internes en « [texte](/demo) ».
import type { AppLocale } from '@/i18n/routing';

export interface GuideSection {
  /** Intertitre (h2). */
  h2: string;
  /** Paragraphes ; un lien interne s'écrit [texte](/chemin-sans-langue), par ex. [la démo](/demo). */
  paragraphs: string[];
  /**
   * Tableau facultatif, affiché après les paragraphes et avant les puces. La première cellule de chaque ligne sert
   * d'en-tête de ligne ; les cellules acceptent les liens [texte](/chemin).
   */
  table?: GuideTable;
  /** Liste à puces facultative, affichée après les paragraphes. */
  bullets?: string[];
}

export interface GuideTable {
  /** Légende du tableau (ce qu'il montre, et ses limites). */
  caption: string;
  /** En-têtes de colonnes. */
  head: string[];
  /** Lignes : autant de cellules que d'en-têtes. */
  rows: string[][];
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
  /**
   * Date de première publication (AAAA-MM-JJ), qui ne change plus ensuite. Facultative pour rester compatible avec
   * les anciens guides : sans elle, la date de mise à jour sert de date de publication.
   */
  published?: string;
  /** Date de dernière mise à jour du contenu (AAAA-MM-JJ). */
  updated: string;
  /** Bloc de téléchargement affiché sous le chapeau : 'template' = modèle Excel vide du carnet (facultatif). */
  download?: 'template';
  content: Record<AppLocale, GuideContent>;
}
