import { notFound } from 'next/navigation';

// Toute adresse inconnue affiche la page 404 dans la langue de la personne.
export default function CatchAll() {
  notFound();
}
