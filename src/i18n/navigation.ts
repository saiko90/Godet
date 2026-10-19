import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Liens et redirections qui gardent la langue courante (à utiliser à la place de next/link et next/navigation).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
