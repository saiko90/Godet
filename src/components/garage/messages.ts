// Textes envoyés au navigateur par les pages du garage (/garage, /demo) : les zones demandées, sans les textes du
// labo 3D (garage.labo, page de développement).
import { pickMessages, type AppMessages, type Namespace } from '@/i18n/messages';

export function garageClientMessages(messages: AppMessages, namespaces: readonly Namespace[]): Partial<AppMessages> {
  const picked = pickMessages(messages, namespaces);
  if (!picked.garage) return picked;
  const garage: Partial<AppMessages['garage']> = { ...picked.garage };
  delete garage.labo;
  return { ...picked, garage: garage as AppMessages['garage'] };
}
