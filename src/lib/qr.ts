// Codes QR des étiquettes de machines : un chemin SVG net (un carré par module), sans dépendance au DOM.
import qrcode from 'qrcode-generator';

export interface QrPath {
  /** Côté du code, en modules, marge comprise. */
  size: number;
  /** Chemin SVG des modules sombres (à remplir en noir sur fond blanc). */
  d: string;
}

/**
 * Code QR d'un texte court (une adresse). Correction « M » (≈15 % de perte tolérée : étiquette rayée, salie) et
 * marge de 4 modules exigée par la norme pour une lecture fiable.
 */
export function qrPath(text: string, margin = 4): QrPath {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) {
    // Modules sombres consécutifs d'une ligne regroupés en un seul rectangle : chemin plus court.
    let c = 0;
    while (c < n) {
      if (!qr.isDark(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < n && qr.isDark(r, c)) c++;
      d += `M${start + margin} ${r + margin}h${c - start}v1h${start - c}z`;
    }
  }
  return { size: n + 2 * margin, d };
}

/** Adresse courte imprimée dans le code QR d'une machine : /m/<id> ouvre sa fiche au garage. */
export function machineQrUrl(base: string, machineId: string): string {
  return `${base.replace(/\/$/, '')}/m/${machineId}`;
}
