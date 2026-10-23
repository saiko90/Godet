// Texte des guides : liens internes écrits « [texte](/chemin) », rendus avec le lien localisé (préfixe de langue).
import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) parts.push(<Fragment key={`t${last}`}>{text.slice(last, m.index)}</Fragment>);
    parts.push(
      <Link key={`l${m.index}`} className="s-link" href={m[2]}>
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

/** Texte sans les marques de lien (pour les données structurées). */
export function plainText(text: string): string {
  return text.replace(LINK, '$1');
}
