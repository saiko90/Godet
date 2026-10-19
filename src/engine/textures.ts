// Textures dessinées au canvas : textes (enseigne, codes au sol, plaques), dégradés (halos, flaques de lumière,
// ombres de contact), motifs (plateau tournant, dalles du sol) et paysage nocturne derrière les vitrages.
import * as THREE from 'three';

/** Famille de police exposée par next/font dans une variable CSS (avec repli). */
export function cssFontFamily(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v ? `${v}, ${fallback}` : fallback;
  } catch {
    return fallback;
  }
}

export const FONT_DISPLAY = () => cssFontFamily('--font-michroma', 'Michroma, "Eurostile", "Arial Black", Arial, sans-serif');
export const FONT_BODY = () => cssFontFamily('--font-archivo', 'Archivo, "Helvetica Neue", Arial, sans-serif');
export const FONT_MONO = () => cssFontFamily('--font-plex-mono', '"IBM Plex Mono", ui-monospace, Menlo, monospace');

/** Attend (au plus `timeoutMs`) que les polices de l'interface soient prêtes, pour dessiner les textes juste. */
export async function fontsReady(timeoutMs = 900): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = [
    document.fonts.load(`400 64px ${FONT_DISPLAY()}`),
    document.fonts.load(`600 64px ${FONT_BODY()}`),
    document.fonts.load(`700 44px ${FONT_BODY()}`),
    document.fonts.load(`500 64px ${FONT_MONO()}`),
  ];
  await Promise.race([Promise.all(loads).catch(() => undefined), new Promise((r) => setTimeout(r, timeoutMs))]);
}

function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas 2D indisponible');
  return { c, g };
}

function canvasTexture(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Texte espacé lettre par lettre (letterSpacing n'est pas disponible partout). */
export function spacedText(
  g: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  spacing: number,
  align: 'center' | 'left' = 'center',
): number {
  const letters = [...text];
  const widths = letters.map((l) => g.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, letters.length - 1);
  let x = align === 'center' ? cx - total / 2 : cx;
  letters.forEach((l, i) => {
    g.fillText(l, x, cy);
    x += widths[i] + spacing;
  });
  return total;
}

function measureSpaced(g: CanvasRenderingContext2D, text: string, spacing: number): number {
  const letters = [...text];
  return letters.reduce((a, l) => a + g.measureText(l).width, 0) + spacing * Math.max(0, letters.length - 1);
}

// ------------------------------------------------------------------ dégradés et motifs

/** Disque lumineux doux (centre blanc, bord transparent). */
export function radialTexture(size = 128, inner = 0.0, mid = 0.38): THREE.CanvasTexture {
  const { c, g } = makeCanvas(size, size);
  const r = g.createRadialGradient(size / 2, size / 2, size * inner * 0.5, size / 2, size / 2, size / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(mid, 'rgba(255,255,255,0.42)');
  r.addColorStop(0.75, 'rgba(255,255,255,0.08)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  return canvasTexture(c, false);
}

/** Dégradé vertical (opaque en bas, transparent en haut) : lueur rasante au pied des murs. */
export function gradientTexture(): THREE.CanvasTexture {
  const { c, g } = makeCanvas(4, 128);
  const grd = g.createLinearGradient(0, 128, 0, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.45)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 128);
  return canvasTexture(c, false);
}

/** Flaque de lumière d'un projecteur sur le plateau : plateau assez uniforme, bord adouci. */
export function poolTexture(size = 256): THREE.CanvasTexture {
  const { c, g } = makeCanvas(size, size);
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.45, 'rgba(255,255,255,0.75)');
  r.addColorStop(0.78, 'rgba(255,255,255,0.22)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  return canvasTexture(c, false);
}

/** Ombre de contact : rectangle arrondi très flou (alpha), étirée à l'emprise de chaque machine. */
export function softRectTexture(size = 128): THREE.CanvasTexture {
  const { c, g } = makeCanvas(size, size);
  // Astuce : on dessine la forme hors du canvas et on ne garde que son ombre floue (shadowBlur marche partout).
  const off = size * 4;
  g.shadowColor = 'rgba(0,0,0,1)';
  g.shadowBlur = size * 0.16;
  g.shadowOffsetX = off;
  g.fillStyle = '#000';
  const m = size * 0.2;
  const w = size - 2 * m;
  const rr = size * 0.12;
  g.beginPath();
  g.moveTo(m + rr - off, m);
  g.arcTo(m + w - off, m, m + w - off, m + w, rr);
  g.arcTo(m + w - off, m + w, m - off, m + w, rr);
  g.arcTo(m - off, m + w, m - off, m, rr);
  g.arcTo(m - off, m, m + w - off, m, rr);
  g.closePath();
  g.fill();
  const t = canvasTexture(c, false);
  return t;
}

/** Plateau tournant : rainures concentriques et rayons fins, métal sombre brossé. */
export function deckTexture(size = 1024): THREE.CanvasTexture {
  const { c, g } = makeCanvas(size, size);
  const cx = size / 2;
  const grd = g.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grd.addColorStop(0, '#2a2d33');
  grd.addColorStop(0.7, '#202328');
  grd.addColorStop(1, '#17191d');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  // brossage circulaire léger
  g.globalAlpha = 0.05;
  for (let i = 0; i < 260; i++) {
    const r = Math.random() * cx;
    g.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cx, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(8,9,11,0.9)';
  for (const k of [0.16, 0.34, 0.62, 0.9]) {
    g.lineWidth = k > 0.85 ? 4 : 2.5;
    g.beginPath();
    g.arc(cx, cx, cx * k, 0, Math.PI * 2);
    g.stroke();
  }
  g.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * cx * 0.34, cx + Math.sin(a) * cx * 0.34);
    g.lineTo(cx + Math.cos(a) * cx * 0.9, cx + Math.sin(a) * cx * 0.9);
    g.stroke();
  }
  // liseré clair au bord des rainures (reflet)
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  g.lineWidth = 1;
  for (const k of [0.165, 0.345, 0.625, 0.905]) {
    g.beginPath();
    g.arc(cx, cx, cx * k, 0, Math.PI * 2);
    g.stroke();
  }
  const t = canvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/** Dalles du sol (résine polie) : légère marbrure et joints fins. Une tuile = 4 m. */
export function floorTexture(size = 512): THREE.CanvasTexture {
  const { c, g } = makeCanvas(size, size);
  g.fillStyle = '#16181b';
  g.fillRect(0, 0, size, size);
  // marbrure : taches très douces
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 20 + Math.random() * 90;
    const v = Math.random() > 0.5 ? 255 : 0;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${v},${v},${v},0.035)`);
    grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fines particules
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // joints
  g.fillStyle = 'rgba(0,0,0,0.75)';
  g.fillRect(0, 0, size, 2);
  g.fillRect(0, 0, 2, size);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.fillRect(0, 2, size, 1);
  g.fillRect(2, 0, 1, size);
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Paysage nocturne vu à travers les vitrages : ciel bleu nuit et crêtes alpines. */
export function nightTexture(w = 1024, h = 256, seed = 1): THREE.CanvasTexture {
  const { c, g } = makeCanvas(w, h);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05070b');
  sky.addColorStop(0.55, '#0a1019');
  sky.addColorStop(1, '#101a26');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  // étoiles discrètes
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(220,230,255,${0.15 + rnd() * 0.35})`;
    g.fillRect(rnd() * w, rnd() * h * 0.5, 1, 1);
  }
  // deux plans de crêtes
  const ridge = (base: number, amp: number, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, h);
    let y = base;
    for (let x = 0; x <= w; x += 8) {
      y += (rnd() - 0.5) * amp * 0.5;
      y = Math.min(base + amp, Math.max(base - amp, y + Math.sin(x * 0.006 + seed) * amp * 0.08));
      g.lineTo(x, y);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fill();
  };
  ridge(h * 0.52, h * 0.16, '#0b1018');
  ridge(h * 0.7, h * 0.1, '#06080c');
  // quelques lumières de village au loin
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(255,200,120,${0.25 + rnd() * 0.3})`;
    g.fillRect(rnd() * w, h * (0.78 + rnd() * 0.15), 2, 1);
  }
  return canvasTexture(c);
}

// ------------------------------------------------------------------ textes

/** Enseigne lumineuse : nom de l'entreprise (grand) et sous-titre. Le canvas s'adapte à la longueur. */
export function signageTexture(name: string, sub: string): { texture: THREE.CanvasTexture; aspect: number; draw: () => void } {
  const H = 256;
  const { c, g } = makeCanvas(2048, H);
  const display = FONT_DISPLAY();
  const body = FONT_BODY();
  const text = name.toUpperCase();
  const draw = () => {
    g.clearRect(0, 0, c.width, c.height);
    // taille de police ajustée pour que le nom tienne
    let size = 112;
    let spacing = size * 0.28;
    g.font = `400 ${size}px ${display}`;
    let width = measureSpaced(g, text, spacing);
    const maxW = c.width - 80;
    if (width > maxW) {
      const k = maxW / width;
      size = Math.max(40, Math.floor(size * k));
      spacing = size * (k < 0.6 ? 0.16 : 0.24);
      g.font = `400 ${size}px ${display}`;
      width = measureSpaced(g, text, spacing);
    }
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    spacedText(g, text, c.width / 2, H * 0.4, spacing);
    g.font = `500 30px ${body}`;
    g.fillStyle = 'rgba(255,255,255,0.72)';
    spacedText(g, sub.toUpperCase(), c.width / 2, H * 0.83, 30 * 0.42);
  };
  draw();
  const t = canvasTexture(c);
  t.anisotropy = 8;
  return { texture: t, aspect: c.width / H, draw };
}

/** Plaque de code peinte sur la carrosserie (texte sombre ou clair selon la peinture). */
export function codeTexture(code: string, dark: boolean): THREE.CanvasTexture {
  const { c, g } = makeCanvas(256, 64);
  const draw = () => {
    g.clearRect(0, 0, 256, 64);
    g.font = `700 44px ${FONT_BODY()}`;
    g.textBaseline = 'middle';
    g.fillStyle = dark ? '#111214' : '#ece8de';
    spacedText(g, code.toUpperCase(), 128, 34, 3);
  };
  draw();
  const t = canvasTexture(c);
  return t;
}

/**
 * Atlas des codes peints au sol devant les baies (4 × 8 cases de 512 × 128) : un seul matériau et une seule
 * géométrie pour tous les marquages, quel que soit le nombre de machines.
 */
export class CodeAtlas {
  readonly cols = 4;
  readonly rows = 8;
  readonly texture: THREE.CanvasTexture;
  private c: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;

  constructor() {
    const { c, g } = makeCanvas(2048, 1024);
    this.c = c;
    this.g = g;
    this.texture = canvasTexture(c);
    this.texture.anisotropy = 8;
  }

  get capacity(): number {
    return this.cols * this.rows;
  }

  draw(codes: string[]): void {
    const g = this.g;
    g.clearRect(0, 0, this.c.width, this.c.height);
    const cw = this.c.width / this.cols;
    const ch = this.c.height / this.rows;
    g.textBaseline = 'middle';
    codes.slice(0, this.capacity).forEach((code, i) => {
      const cx = (i % this.cols) * cw;
      const cy = Math.floor(i / this.cols) * ch;
      let size = 86;
      g.font = `400 ${size}px ${FONT_DISPLAY()}`;
      const text = code.toUpperCase();
      let w = measureSpaced(g, text, size * 0.16);
      if (w > cw - 40) {
        size = Math.floor(size * ((cw - 40) / w));
        g.font = `400 ${size}px ${FONT_DISPLAY()}`;
        w = measureSpaced(g, text, size * 0.16);
      }
      g.fillStyle = '#ffffff';
      spacedText(g, text, cx + cw / 2, cy + ch / 2 + 4, size * 0.16);
    });
    this.texture.needsUpdate = true;
  }

  /** Coordonnées de texture de la case i : [u0, v0, u1, v1] (v vers le haut). */
  uv(i: number): [number, number, number, number] {
    const col = i % this.cols;
    const row = Math.floor(i / this.cols);
    const u0 = col / this.cols;
    const u1 = (col + 1) / this.cols;
    const v1 = 1 - row / this.rows;
    const v0 = 1 - (row + 1) / this.rows;
    return [u0, v0, u1, v1];
  }

  dispose(): void {
    this.texture.dispose();
  }
}
