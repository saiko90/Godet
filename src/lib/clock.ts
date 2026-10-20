// Heure courante pour les pages serveur (une requête = un instant ; hors des règles de pureté du rendu React).
export const nowMs = (): number => Date.now();
