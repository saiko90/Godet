// Encodeur de QR code minimal (ISO/IEC 18004), sans dépendance : mode octet, correction d'erreur M (≈ 15 %),
// versions 1 à 10 (jusqu'à 213 octets, largement assez pour un lien de démo). Utilisé pour la lettre imprimable.
// Le choix du masque suit les règles de pénalité de la norme ; tout masque donne un code lisible.

/** [codes de correction par bloc, blocs du groupe 1, octets de données par bloc 1, blocs du groupe 2, octets par bloc 2] */
const LEVEL_M: readonly (readonly [number, number, number, number, number])[] = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
];

/** Centres des motifs d'alignement, par version. */
const ALIGNMENT: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// ---------------------------------------------------------------- corps de Galois GF(256), polynôme 0x11D

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

/** Polynôme générateur de Reed-Solomon de degré `degree` (coefficient dominant omis). */
function rsGenerator(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

/** Codes de correction d'un bloc de données. */
function rsRemainder(data: readonly number[], generator: readonly number[]): number[] {
  const result = new Array<number>(generator.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < generator.length; i++) result[i] ^= gfMul(generator[i], factor);
  }
  return result;
}

// ---------------------------------------------------------------- encodage

function bit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

/** Données + correction, entrelacées dans l'ordre de placement. */
function codewords(bytes: Uint8Array, version: number): number[] {
  const [ecLen, b1, d1, b2, d2] = LEVEL_M[version - 1];
  const capacity = b1 * d1 + b2 * d2;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // mode octet
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity * 8 - bits.length)); // terminateur
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity * 8; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }

  const generator = rsGenerator(ecLen);
  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  for (let i = 0; i < b1 + b2; i++) {
    const len = i < b1 ? d1 : d2;
    const chunk = data.slice(offset, offset + len);
    offset += len;
    blocks.push({ data: chunk, ec: rsRemainder(chunk, generator) });
  }
  const out: number[] = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data.length) out.push(b.data[i]);
  for (let i = 0; i < ecLen; i++) for (const b of blocks) out.push(b.ec[i]);
  return out;
}

// ---------------------------------------------------------------- matrice

class Matrix {
  readonly size: number;
  readonly dark: boolean[][];
  readonly fixed: boolean[][];

  constructor(readonly version: number) {
    this.size = version * 4 + 17;
    this.dark = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.fixed = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  /** Module de structure (x = colonne, y = ligne). */
  set(x: number, y: number, isDark: boolean) {
    this.dark[y][x] = isDark;
    this.fixed[y][x] = true;
  }

  drawPatterns() {
    const n = this.size;
    for (let i = 0; i < n; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    for (const [cx, cy] of [
      [3, 3],
      [n - 4, 3],
      [3, n - 4],
    ]) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= n || y >= n) continue;
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          this.set(x, y, d !== 2 && d !== 4);
        }
      }
    }
    const pos = ALIGNMENT[this.version - 1];
    const last = pos.length - 1;
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) this.set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
    this.drawFormat(0);
    if (this.version >= 7) {
      let rem = this.version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits = (this.version << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const a = n - 11 + (i % 3);
        const b = Math.floor(i / 3);
        this.set(a, b, bit(bits, i));
        this.set(b, a, bit(bits, i));
      }
    }
  }

  /** Informations de format (niveau M = 00, puis le masque), en deux exemplaires. */
  drawFormat(mask: number) {
    const n = this.size;
    const data = mask; // niveau M : bits 00
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(n - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, n - 15 + i, bit(bits, i));
    this.set(8, n - 8, true);
  }

  drawData(words: readonly number[]) {
    const n = this.size;
    let i = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < n; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? n - 1 - vert : vert;
          if (!this.fixed[y][x] && i < words.length * 8) {
            this.dark[y][x] = bit(words[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    const n = this.size;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (this.fixed[y][x]) continue;
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }
        if (invert) this.dark[y][x] = !this.dark[y][x];
      }
    }
  }

  /** Pénalités N1 à N4 de la norme (plus bas = plus facile à lire). */
  penalty(): number {
    const n = this.size;
    const at = (x: number, y: number) => this.dark[y][x];
    let score = 0;
    const lines: boolean[][] = [];
    for (let y = 0; y < n; y++) lines.push(this.dark[y]);
    for (let x = 0; x < n; x++) lines.push(this.dark.map((row) => row[x]));
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i <= n; i++) {
        if (i < n && line[i] === line[i - 1]) run++;
        else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      // Motifs qui imitent un repère (1:1:3:1:1 bordé de clair) ; la zone de silence compte comme claire.
      const padded = `0000${line.map((v) => (v ? '1' : '0')).join('')}0000`;
      for (let i = 0; i + 11 <= padded.length; i++) {
        const s = padded.slice(i, i + 11);
        if (s === '10111010000' || s === '00001011101') score += 40;
      }
    }
    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const c = at(x, y);
        if (c === at(x + 1, y) && c === at(x, y + 1) && c === at(x + 1, y + 1)) score += 3;
      }
    }
    let darkCount = 0;
    for (const row of this.dark) for (const v of row) if (v) darkCount++;
    const total = n * n;
    score += (Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1) * 10;
    return score;
  }
}

/**
 * Matrice du QR code d'un texte (true = module sombre), sans zone de silence.
 * null si le texte dépasse la capacité prise en charge (213 octets).
 */
export function qrMatrix(text: string): boolean[][] | null {
  const bytes = new TextEncoder().encode(text);
  let version = 0;
  for (let v = 1; v <= LEVEL_M.length; v++) {
    const [, b1, d1, b2, d2] = LEVEL_M[v - 1];
    if (4 + (v <= 9 ? 8 : 16) + bytes.length * 8 <= (b1 * d1 + b2 * d2) * 8) {
      version = v;
      break;
    }
  }
  if (!version) return null;

  const m = new Matrix(version);
  m.drawPatterns();
  m.drawData(codewords(bytes, version));
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    m.applyMask(mask);
    m.drawFormat(mask);
    const score = m.penalty();
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    m.applyMask(mask);
  }
  m.applyMask(best);
  m.drawFormat(best);
  return m.dark.map((row) => row.slice());
}

/** Tracé SVG (chemin) des modules sombres, avec une zone de silence de 4 modules. */
export function qrPath(matrix: boolean[][], quiet = 4): { d: string; size: number } {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end++;
      parts.push(`M${x + quiet} ${y + quiet}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  return { d: parts.join(''), size: matrix.length + quiet * 2 };
}
