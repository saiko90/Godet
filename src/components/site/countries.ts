// Pays et devises des entreprises (organizations.country : code ISO à deux lettres ; currency : CHF, EUR, GBP, USD).
import { htmlLang, type AppLocale } from '@/i18n/routing';

/** Pays proposés en premier (marchés de Godet). Les autres suivent, triés par nom. */
export const MAIN_COUNTRIES = ['CH', 'DE', 'AT', 'IT', 'FR', 'LI'] as const;
export type MainCountry = (typeof MAIN_COUNTRIES)[number];

/** Devises acceptées par la base. */
export const CURRENCIES = ['CHF', 'EUR', 'GBP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

// Codes ISO 3166-1 alpha-2 des pays et territoires habités (+ XK, Kosovo).
const ISO_CODES = (
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO ' +
  'FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR ' +
  'MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE ' +
  'RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT ' +
  'TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'
).split(' ');
const ISO_SET = new Set(ISO_CODES);

/** Code pays accepté (ISO à deux lettres connu). */
export function isCountryCode(value: unknown): value is string {
  return typeof value === 'string' && ISO_SET.has(value);
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

/** Devise par défaut d'un pays (même règle que private.currency_for dans la base). */
export function currencyFor(country: string | null | undefined): Currency {
  switch ((country ?? '').toUpperCase()) {
    case 'CH':
    case 'LI':
      return 'CHF';
    case 'GB':
      return 'GBP';
    case 'US':
      return 'USD';
    default:
      return 'EUR';
  }
}

export interface Option {
  code: string;
  name: string;
}

/** Listes de pays pour un champ de formulaire : les marchés principaux, puis tous les autres pays triés par nom. */
export function countryOptions(locale: AppLocale, mainName: (code: MainCountry) => string): { main: Option[]; others: Option[] } {
  const names = new Intl.DisplayNames([htmlLang(locale), locale], { type: 'region' });
  const collator = new Intl.Collator(htmlLang(locale));
  const main = MAIN_COUNTRIES.map((code) => ({ code, name: mainName(code) }));
  const others = ISO_CODES.filter((code) => !(MAIN_COUNTRIES as readonly string[]).includes(code))
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => collator.compare(a.name, b.name));
  return { main, others };
}

/** Nom d'un pays dans une langue (« Suisse », « Schweiz »…). */
export function countryName(locale: AppLocale, code: string | null | undefined, mainName: (code: MainCountry) => string): string | null {
  if (!code) return null;
  if ((MAIN_COUNTRIES as readonly string[]).includes(code)) return mainName(code as MainCountry);
  try {
    return new Intl.DisplayNames([htmlLang(locale), locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
