# Films de présentation de Godet

Deux films sans son, sous-titrés dans les quatre langues, servis par l'accueil (section « En vidéo ») :

| Fichier (public/videos) | Contenu | Durée |
|---|---|---|
| `godet-garage-<langue>.mp4` | Le showroom 3D : allumage du hall, réveil de PE-01 (pelle) et NA-07 (nacelle), vue d'ensemble | 0:34 |
| `godet-suivi-<langue>.mp4` | Le suivi : mode atelier, DU-04 en retard, service saisi, carnet, échéances, coûts | 0:40 |

Affiches : `godet-<film>-<langue>.webp` (1280 × 720). Images de l'accueil : `public/images/showroom-hero-<langue>.webp`.
Les fichiers absents ne sont simplement pas proposés (`src/components/site/videos.ts`, `hero-image.ts`).

## Principe

Chaque image est calculée puis capturée, sans dépendre de la vitesse de la machine : `vt.js` remplace l'horloge de la
page (minuteries, `requestAnimationFrame`, `performance.now`, animations CSS) et le script avance de 1/30 s par image.
Curseur, clics, saisie et sous-titres (`overlay.js`, textes dans `texts.json`) sont réglés par la mise en scène de
chaque script.

- `film-3d.mjs` : le showroom, sans aucun texte (commun aux langues), sur la page de développement `/labo`
  (`fleet=demo` : le parc de /demo ; enseigne « GODET »). Les sous-titres sont posés ensuite.
- `film-overlay.mjs <langue>` : sous-titres et carton de fin du film 3D, en PNG transparents.
- `film-suivi.mjs <langue>` : le film « suivi », tourné dans la démo (le texte de l'interface est déjà traduit).
- `hero-capture.mjs <langue>` : l'image de l'accueil (étiquettes et enseigne traduites).

## Tourner

Il faut le labo (`npx next dev -p 3200`) et le site (`next start -p 3100`, ou le même serveur de développement :
`GODET_SITE=http://localhost:3200`), puis `npm i --no-save playwright-core`.

- Avec une carte graphique (Windows, Edge installé) : `FILM_GPU=1`. Environ 0,3 s par image en 1080p.
- Sans carte graphique : `PLAYWRIGHT=<chemin du paquet playwright>` (Chromium de Playwright, rendu logiciel),
  environ 5 s par image de 3D : préférer la carte graphique.

```
node film-3d.mjs frames3d 1280 720 high 1 1.5          # 915 images 1920 × 1080
node film-overlay.mjs fr ov-fr                          # 1005 images transparentes
node film-suivi.mjs fr suivi-fr 1 1.5                   # 1203 images 1920 × 1080
node hero-capture.mjs fr hero-fr.png                    # 1600 × 900
```

## Encoder

```
ffmpeg -framerate 30 -i frames3d/f%04d.png -framerate 30 -i ov-fr/f%04d.png \
  -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=4[bg];[bg][1:v]overlay=0:0:format=auto,format=yuv420p[v]" \
  -map "[v]" -frames:v 1005 -c:v libx264 -preset slow -crf 22 -profile:v high -level 4.1 -movflags +faststart -an \
  godet-garage-fr.mp4
ffmpeg -framerate 30 -i suivi-fr/f%04d.png -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -profile:v high \
  -level 4.1 -movflags +faststart -an godet-suivi-fr.mp4
```

Si la démo ou le showroom changent (nouvel écran, autre parc), il suffit de retourner les films : les mises en scène
cherchent les boutons par leur texte dans `messages/<langue>/garage.json`.
