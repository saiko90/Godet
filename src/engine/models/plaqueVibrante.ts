// Plaque vibrante réversible (≈ 450 kg, classe Wacker Neuson DPU 5045 / Ammann APR 49/60 / Bomag BPR 45/55) :
// semelle 0,90 × 0,60 m aux deux bords relevés, excitateur à deux arbres, masse supérieure suspendue sur tampons
// (moteur diesel sous capot, cadre de protection tubulaire et anneau de levage central), timon de guidage
// amorti avec poignée, tableau de commande et levier de marche avant / arrière.
// Gabarit : 1,85 × 0,66 × 1,05 m (timon en position de travail). Petit engin : présenté agrandi dans le hall.
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';

const PL = 0.9; // longueur de la semelle
const PW = 0.6; // largeur de la semelle
const PR = 0.13; // rayon des bords relevés
const PT = 0.03; // épaisseur de la semelle
const LIP = 0.16; // hauteur des bords relevés
const BUF = 0.28; // dessus des tampons : plan de la masse supérieure
/** Articulation du timon (repère de la masse supérieure) et position de la poignée par rapport à elle. */
const HP: V3 = [-0.42, 0.4, 0];
const GRIP: [number, number] = [-0.9, 0.52];

/** Profil latéral de la semelle : fond plat, bords relevés en arc à l'avant et à l'arrière (plaque réversible). */
function soleShape(): THREE.Shape {
  const xb = PL / 2 - PR;
  const s = new THREE.Shape();
  s.moveTo(-xb, 0);
  s.lineTo(xb, 0);
  s.absarc(xb, PR, PR, -Math.PI / 2, 0, false);
  s.lineTo(PL / 2, LIP);
  s.lineTo(PL / 2 - PT, LIP);
  s.lineTo(PL / 2 - PT, PR);
  s.absarc(xb, PR, PR - PT, 0, -Math.PI / 2, true);
  s.lineTo(-xb, PT);
  s.absarc(-xb, PR, PR - PT, -Math.PI / 2, -Math.PI, true);
  s.lineTo(-PL / 2 + PT, LIP);
  s.lineTo(-PL / 2, LIP);
  s.lineTo(-PL / 2, PR);
  s.absarc(-xb, PR, PR, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Carter d'excitateur à deux arbres : section en stade (deux balourds côte à côte), axe z. */
function stadiumShape(r: number, half: number, cy: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-half, cy - r);
  s.lineTo(half, cy - r);
  s.absarc(half, cy, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-half, cy + r);
  s.absarc(-half, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}

export function buildPlaqueVibrante(): MachineTemplate {
  const k = new Kit('plaque_vibrante');

  // ---------------------------------------------------------------- masse inférieure (vibre au réveil)
  const plate = k.part('plate', 0, [0, 0, 0]);
  k.extrude(plate, 'steelDark', soleShape(), PW, [0, 0, 0], undefined, 0.008, 12);
  // raidisseurs transversaux et longitudinaux sur la semelle
  for (const x of [-0.27, 0.27]) k.box(plate, 'steelDark', [0.025, 0.06, PW - 0.04], [x, PT + 0.03, 0]);
  for (const z of [-0.22, 0.22]) k.box(plate, 'steelDark', [0.5, 0.05, 0.025], [0, PT + 0.025, z]);
  // excitateur : carter en stade, couvercles boulonnés, bouchon de vidange
  const ex = stadiumShape(0.115, 0.1, PT + 0.115);
  k.extrude(plate, 'trim', ex, 0.5, [0, 0, 0], undefined, 0.012, 14);
  for (const s of [-1, 1]) {
    k.extrude(plate, 'steelDark', stadiumShape(0.125, 0.1, PT + 0.115), 0.03, [0, 0, s * 0.26], undefined, 0.006, 14);
    for (const [x, y] of [[-0.2, 0.145], [0.2, 0.145], [-0.1, 0.255], [0.1, 0.255], [-0.1, 0.035], [0.1, 0.035]] as [number, number][]) {
      k.cylZ(plate, 'steel', 0.012, 0.012, [x, y, s * 0.28], 6);
    }
  }
  k.cyl(plate, 'steel', 0.022, 0.03, [0, PT + 0.24, 0.12], undefined, 8);
  // consoles des tampons et tampons caoutchouc portant la masse supérieure
  for (const x of [-0.3, 0.3]) {
    for (const s of [-1, 1]) {
      k.box(plate, 'steelDark', [0.1, 0.17, 0.05], [x, PT + 0.085, s * 0.255]);
      k.cyl(plate, 'rubber', 0.045, 0.08, [x, BUF - 0.04, s * 0.255], undefined, 14);
    }
  }

  // ---------------------------------------------------------------- masse supérieure : moteur sous capot
  const upper = k.part('upper', 0, [0, 0, 0]);
  k.rbox(upper, 'trim', [0.82, 0.04, 0.6], 0.012, [-0.01, BUF + 0.02, 0], undefined, 1);
  // capot moteur : profil incliné à l'avant, bandeau graphite à la base
  const hood = softPolygon(
    [
      [-0.32, BUF + 0.05],
      [0.34, BUF + 0.05],
      [0.36, 0.5],
      [0.24, 0.69],
      [-0.26, 0.71],
      [-0.33, 0.6],
    ],
    0.07,
  );
  k.extrude(upper, 'paint', hood, 0.52, [0, 0, 0], undefined, 0.035, 10);
  k.rbox(upper, 'trim', [0.74, 0.05, 0.56], 0.015, [0.01, BUF + 0.065, 0], undefined, 1);
  k.grille(upper, [0.395, 0.43, 0], 0.36, 0.12, 3, 'x', 1);
  for (const s of [-1, 1]) {
    k.grille(upper, [0.17, 0.5, s * 0.26], 0.26, 0.16, 4, 'z', s);
    k.decal(upper, 0.26, 0.065, [-0.15, 0.5, s * 0.262], s > 0 ? 0 : Math.PI);
  }
  // bouchon de réservoir, filtre à air, sortie d'échappement
  k.cyl(upper, 'black', 0.04, 0.035, [-0.12, 0.752, -0.12], undefined, 14);
  k.cyl(upper, 'black', 0.06, 0.07, [0.02, 0.765, 0.12], undefined, 16);
  k.cyl(upper, 'trim', 0.066, 0.014, [0.02, 0.806, 0.12], undefined, 16);
  k.cyl(upper, 'trim', 0.024, 0.1, [0.24, 0.74, 0.17], [0, 0, -0.45], 10);
  k.cyl(upper, 'black', 0.028, 0.03, [0.265, 0.785, 0.17], [0, 0, -0.45], 10);
  // carter de courroie (côté droit) jusqu'à la poulie de l'excitateur
  k.rbox(upper, 'black', [0.3, 0.2, 0.05], 0.03, [0.02, BUF - 0.04, 0.315], undefined, 1);
  // cadre de protection tubulaire, traverse et anneau de levage au centre de gravité
  for (const s of [-1, 1]) {
    k.rail(upper, 'trim', [[0.38, BUF + 0.03, s * 0.31], [0.36, 0.78, s * 0.31], [-0.3, 0.8, s * 0.31], [-0.36, BUF + 0.03, s * 0.31]], 0.022);
  }
  for (const x of [0.36, -0.3]) k.cylZ(upper, 'trim', 0.02, 0.62, [x, x > 0 ? 0.78 : 0.8, 0], 10);
  k.rbox(upper, 'trim', [0.09, 0.05, 0.64], 0.015, [0.03, 0.81, 0], undefined, 1);
  k.box(upper, 'steelDark', [0.05, 0.08, 0.04], [0.03, 0.865, 0]);
  k.torus(upper, 'steel', 0.06, 0.016, [0.03, 0.95, 0], [0, 0, 0], [8, 20]);
  // supports amortis du timon
  for (const s of [-1, 1]) {
    k.box(upper, 'trim', [0.12, 0.14, 0.05], [HP[0] + 0.03, HP[1] - 0.04, s * 0.22]);
    k.cylZ(upper, 'rubber', 0.045, 0.05, [HP[0], HP[1], s * 0.27], 12);
  }
  // flexible de commande vers l'excitateur
  k.hose(upper, 'rubber', [[HP[0] - 0.01, HP[1] - 0.03, -0.14], [-0.47, 0.26, -0.16], [-0.36, 0.17, -0.18], [-0.21, 0.15, -0.19]], 0.014, 16);

  // ---------------------------------------------------------------- timon de guidage
  const handle = k.part('handle', upper, HP);
  k.joint('handle', handle, 'rz', 0);
  k.cylZ(handle, 'steel', 0.02, 0.6, [0, 0, 0], 10);
  for (const s of [-1, 1]) {
    k.rail(
      handle,
      'trim',
      [
        [0, 0, s * 0.22],
        [GRIP[0] + 0.06, GRIP[1] - 0.03, s * 0.22],
        [GRIP[0], GRIP[1], s * 0.27],
      ],
      0.02,
    );
    k.cylZ(handle, 'rubber', 0.03, 0.14, [GRIP[0], GRIP[1], s * 0.2], 12);
  }
  k.cylZ(handle, 'trim', 0.02, 0.54, [GRIP[0], GRIP[1], 0], 10);
  // tableau de commande : compteur d'heures, contacteur, accélérateur
  k.rbox(handle, 'trim', [0.12, 0.09, 0.2], 0.02, [GRIP[0] - 0.03, GRIP[1] + 0.06, 0], [0, 0, 0.5], 1);
  k.box(handle, 'glass', [0.05, 0.004, 0.08], [GRIP[0] - 0.05, GRIP[1] + 0.11, 0.03], [0, 0, 0.5]);
  k.cyl(handle, 'steel', 0.012, 0.03, [GRIP[0] - 0.01, GRIP[1] + 0.1, -0.05], [0, 0, 0.5], 8);
  k.rbox(handle, 'black', [0.06, 0.02, 0.025], 0.008, [GRIP[0], GRIP[1] + 0.1, -0.12], [0, 0, 0.3], 1);
  k.hose(handle, 'rubber', [[GRIP[0] + 0.08, GRIP[1], 0.06], [GRIP[0] * 0.6, GRIP[1] * 0.55, 0.12], [-0.05, 0, 0.12]], 0.012, 16);

  // levier de marche avant / arrière : arceau parallèle à la poignée
  const lever = k.part('lever', handle, [GRIP[0] + 0.07, GRIP[1] - 0.02, 0]);
  k.joint('lever', lever, 'rz', 0);
  k.cylZ(lever, 'steel', 0.018, 0.34, [0, 0, 0], 10);
  for (const s of [-1, 1]) k.rail(lever, 'black', [[0, 0, s * 0.15], [0.03, 0.09, s * 0.15]], 0.012);
  k.cylZ(lever, 'black', 0.016, 0.32, [0.03, 0.09, 0], 10);

  return k.build({
    refWeight: 0.45,
    minScale: 2.2,
    maxScale: 2.5,
    vibrate: 'plate',
    wake: [
      { pose: { handle: -0.07, lever: 0.32 }, dur: 1.4 },
      { pose: { handle: 0.04, lever: -0.32 }, dur: 1.8 },
      { pose: { handle: -0.04, lever: 0.3 }, dur: 1.5 },
      { pose: { handle: 0, lever: 0 }, dur: 1.2 },
    ],
    nod: [
      { pose: { handle: -0.06 }, dur: 0.4 },
      { pose: { handle: 0 }, dur: 0.45 },
    ],
    breathe: { handle: 0.006 },
  });
}
