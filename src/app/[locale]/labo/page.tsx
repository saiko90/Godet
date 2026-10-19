// Laboratoire du moteur 3D (développement uniquement) : parc de test, navigation, fiche simulée, qualité, son,
// effets et captures. En production, cette page n'existe pas.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Labo } from './Labo';

export const metadata: Metadata = {
  title: 'Labo 3D',
  robots: { index: false, follow: false },
};

export default function LaboPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Labo />;
}
