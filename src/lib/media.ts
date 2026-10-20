// Préparation des photos, vidéos et documents avant l'envoi : type, taille, compression des images.
// Utilisé par l'interface du garage ; les deux dépôts (cloud et démo) reçoivent un fichier déjà prêt.
// Un refus est un code (UploadRejected) : l'interface le traduit dans la langue de la personne.
import type { UploadOptions } from '@/lib/repo/types';
import type { MediaKind } from '@/lib/types';

/** Options d'envoi avec suivi de l'avancement (0 à 1). Compatible avec `GarageRepo.uploadMedia`. */
export interface UploadProgressOptions extends UploadOptions {
  onProgress?: (fraction: number) => void;
}

/** Limite d'envoi par fichier : 50 Mo (plafond global de Supabase sur l'offre gratuite ; le bucket accepte 100 Mo). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
/** Une image plus lourde (ou plus grande que IMAGE_MAX_SIDE) est recompressée avant l'envoi. */
export const IMAGE_COMPRESS_ABOVE = 1.5 * 1024 * 1024;
export const IMAGE_MAX_SIDE = 2560;
const JPEG_QUALITY = 0.85;

/** Types acceptés par le stockage (voir la migration du bucket « medias »). */
export const ACCEPTED_MIME: Record<MediaKind, readonly string[]> = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: ['application/pdf'],
};

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  pdf: 'application/pdf',
};

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

/** Extension en minuscules d'un nom de fichier (« IMG_2041.HEIC » → « heic »), ou chaîne vide. */
export function extOf(name: string | null | undefined): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name ?? '');
  return m ? m[1].toLowerCase() : '';
}

/** Type MIME d'un fichier : celui du navigateur, sinon déduit de l'extension (certains téléphones n'en donnent pas). */
export function mimeOf(file: Blob, name?: string): string {
  const t = (file.type || '').toLowerCase();
  if (t && t !== 'application/octet-stream') return t;
  return EXT_MIME[extOf(name ?? (file instanceof File ? file.name : ''))] ?? t;
}

/** Extension de stockage pour un type MIME donné (« image/jpeg » → « jpg »). */
export function extForMime(mime: string, fallbackName?: string): string {
  return MIME_EXT[mime] ?? (extOf(fallbackName) || 'bin');
}

/** Nature du média d'après son type MIME (null : type inconnu). */
export function kindOfMime(mime: string): MediaKind | null {
  if (mime.startsWith('image/')) return 'photo';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'document';
  return null;
}

/** Raison d'un refus : format vidéo, format d'image, ni photo ni vidéo ni PDF, trop lourd, préparation impossible. */
export type UploadRejectReason = 'videoFormat' | 'imageFormat' | 'notMedia' | 'tooBig' | 'prepareFailed';

/** Refus d'un fichier : une raison, le nom du fichier, et pour « tooBig » sa nature et son poids (octets). */
export class UploadRejected extends Error {
  readonly reason: UploadRejectReason;
  readonly fileName: string;
  readonly kind: MediaKind | null;
  readonly size: number | null;

  constructor(reason: UploadRejectReason, fileName: string, extra: { kind?: MediaKind; size?: number } = {}) {
    super(`${reason}: ${fileName}`);
    this.name = 'UploadRejected';
    this.reason = reason;
    this.fileName = fileName;
    this.kind = extra.kind ?? null;
    this.size = extra.size ?? null;
  }
}

export interface PreparedUpload {
  blob: Blob;
  /** Nom à garder (extension corrigée si l'image a été convertie en JPEG). */
  name: string;
  kind: MediaKind;
  mime: string;
  /** L'image a été réduite ou recompressée. */
  compressed: boolean;
}

function renameTo(name: string, ext: string): string {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, '') || 'photo';
  return `${base}.${ext}`;
}

function tooBig(kind: MediaKind, name: string, bytes: number): UploadRejected {
  return new UploadRejected('tooBig', name, { kind, size: bytes });
}

/** Décode une image en respectant l'orientation de l'appareil photo (null si le navigateur ne sait pas la lire, ex. HEIC). */
async function decode(file: Blob): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
}

function canvasToJpeg(bitmap: ImageBitmap, scale: number): Promise<Blob | null> {
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  // Fond blanc : une image transparente (PNG) ne devient pas noire en JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY));
}

/**
 * Vérifie un fichier et le prépare pour l'envoi :
 * - photos : réduites à 2560 px de côté et recompressées en JPEG 0.85 si elles dépassent 1,5 Mo ou 2560 px ;
 *   formats non acceptés par le stockage (GIF, BMP, AVIF…) convertis en JPEG ; HEIC illisible → envoyé tel quel ;
 * - vidéos : MP4, MOV ou WebM, 50 Mo au maximum ;
 * - documents : PDF, 50 Mo au maximum.
 * Lève `UploadRejected` (raison et nom du fichier) si le fichier ne peut pas être envoyé.
 * `fallbackName` : nom affiché d'un fichier sans nom (dans la langue de l'interface).
 */
export async function prepareUpload(file: File, opts: { fallbackName?: string } = {}): Promise<PreparedUpload> {
  const name = file.name || opts.fallbackName || 'file';
  const mime = mimeOf(file, name);
  const kind = kindOfMime(mime);

  if (kind === 'video') {
    if (!ACCEPTED_MIME.video.includes(mime)) {
      throw new UploadRejected('videoFormat', name);
    }
    if (file.size > MAX_UPLOAD_BYTES) throw tooBig('video', name, file.size);
    return { blob: retype(file, mime), name, kind, mime, compressed: false };
  }

  if (kind === 'document') {
    if (file.size > MAX_UPLOAD_BYTES) throw tooBig('document', name, file.size);
    return { blob: retype(file, mime), name, kind, mime, compressed: false };
  }

  if (kind !== 'photo') {
    throw new UploadRejected('notMedia', name);
  }

  const accepted = ACCEPTED_MIME.photo.includes(mime);
  const bitmap = await decode(file);
  if (!bitmap) {
    // HEIC sur un navigateur qui ne le décode pas : le stockage l'accepte tel quel.
    if (accepted) {
      if (file.size > MAX_UPLOAD_BYTES) throw tooBig('photo', name, file.size);
      return { blob: retype(file, mime), name, kind, mime, compressed: false };
    }
    throw new UploadRejected('imageFormat', name);
  }

  try {
    const side = Math.max(bitmap.width, bitmap.height);
    const scale = side > IMAGE_MAX_SIDE ? IMAGE_MAX_SIDE / side : 1;
    const needs = !accepted || scale < 1 || file.size > IMAGE_COMPRESS_ABOVE;
    if (!needs) return { blob: retype(file, mime), name, kind, mime, compressed: false };

    const jpeg = await canvasToJpeg(bitmap, scale);
    if (!jpeg) {
      if (accepted && file.size <= MAX_UPLOAD_BYTES) return { blob: retype(file, mime), name, kind, mime, compressed: false };
      throw new UploadRejected('prepareFailed', name, { kind: 'photo' });
    }
    // Recompresser sans réduire ne sert à rien si le résultat est plus lourd.
    if (accepted && scale === 1 && jpeg.size >= file.size) {
      return { blob: retype(file, mime), name, kind, mime, compressed: false };
    }
    return { blob: jpeg, name: renameTo(name, 'jpg'), kind, mime: 'image/jpeg', compressed: true };
  } finally {
    bitmap.close();
  }
}

/** Garantit que le Blob porte le bon type (sinon le stockage le refuse comme « application/octet-stream »). */
function retype(file: Blob, mime: string): Blob {
  if (!mime || file.type === mime) return file;
  return new Blob([file], { type: mime });
}
