# Godet

Le garage de votre parc d’engins : le carnet d’entretien de chaque machine de chantier (services, réparations,
pièces changées, coûts, photos, vidéos, échéances), présenté dans un showroom 3D.

Une application de [Swiss Digital Studio](https://www.swissdigitalstudio.ch).

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000. Le garage d’exemple est sur `/demo` (aucun compte nécessaire).

Les valeurs publiques du projet Supabase sont dans `src/lib/env.ts` ; on peut les remplacer par des variables
d’environnement (voir `.env.example`).

## Base de données

Le schéma est dans `supabase/migrations` (Postgres + RLS + stockage des médias). Il est déjà appliqué sur le
projet Supabase « Godet ». Toute évolution passe par une nouvelle migration, puis par la régénération de
`src/lib/database.types.ts`.

## Vérifier

```bash
npm run typecheck
npm run lint
npm run build
```
