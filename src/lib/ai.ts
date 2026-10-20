// Assistant IA et lecture du compteur sur photo (fonction Supabase « assistant »).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

export type AiErrorCode = 'offline' | 'subscription_inactive' | 'limit_reached' | 'not_configured' | 'forbidden' | 'generic';

export class AiError extends Error {
  constructor(readonly code: AiErrorCode) {
    super(code);
  }
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface Usage {
  used: number;
  limit: number;
}

const KNOWN: AiErrorCode[] = ['subscription_inactive', 'limit_reached', 'not_configured', 'forbidden'];

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AiError('offline');
  const { data, error } = await supabaseBrowser().functions.invoke<T>('assistant', { body });
  if (error) {
    let code = '';
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => ({}))) as { error?: string };
      code = payload.error ?? '';
    }
    throw new AiError((KNOWN as string[]).includes(code) ? (code as AiErrorCode) : 'generic');
  }
  if (!data) throw new AiError('generic');
  return data;
}

export function askAssistant(p: { orgId: string; locale: string; messages: ChatTurn[]; machineId?: string | null }) {
  return call<{ reply: string } & Usage>({ action: 'chat', orgId: p.orgId, locale: p.locale, messages: p.messages, machineId: p.machineId ?? undefined });
}

export interface MeterReading extends Usage {
  hours: number | null;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export async function readMeter(p: { orgId: string; locale: string; file: File; machineId?: string | null }): Promise<MeterReading> {
  const image = await shrink(p.file);
  return call<MeterReading>({ action: 'meter', orgId: p.orgId, locale: p.locale, machineId: p.machineId ?? undefined, image, mediaType: 'image/jpeg' });
}

/** Photo réduite (1600 px au plus, JPEG) en base64 : assez nette pour les chiffres, légère à envoyer. */
async function shrink(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bitmap) throw new AiError('generic');
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) throw new AiError('generic');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
