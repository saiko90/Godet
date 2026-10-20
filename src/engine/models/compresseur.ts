// Motocompresseur de chantier tractable (≈ 1 t, 5 m³/min, classe Kaeser Mobilair M50 / Atlas Copco XAS 88) :
// capot arrondi d'une pièce qui se relève sur des vérins à gaz (charnière à l'arrière), tour arrière fixe
// portant le tableau de commande, les vannes de sortie d'air à raccords à griffes, l'anneau de levage et
// l'échappement ; châssis-réservoir sur remorque à un essieu (garde-boue, timon, anneau, roue jockey).
// Le réveil soulève le capot sur le moteur et le bloc compresseur qui tournent, puis le referme.
// Encombrement ≈ 3,5 × 1,6 × 1,45 m ; présenté agrandi dans le hall (échelle minimale > 1).
import * as THREE from 'three';
import { Kit, type MachineTemplate } from './kit';
import { exhaust } from './parts';
import { trailerGear } from './groupeElectrogene';

const R = 0.29; // rayon des roues (185/70 R 13)
const AX = -0.3; // essieu
// châssis-réservoir
const FY0 = 0.42;
const FY1 = 0.52;
const FX0 = -1.15;
const FX1 = 0.92;
const FZ = 0.5;
// tour arrière fixe et capot
const TX0 = FX0; // dos de la tour
const HX = -0.8; // charnière du capot (arête haute avant de la tour)
const TOP = 1.32; // dessus du capot
const W = 1.04; // largeur du capot
const LL = 1.72; // longueur du capot
const LH = TOP - FY1; // hauteur du capot
const B = 0.06; // arrondi des arêtes du capot

export function buildCompresseur(): MachineTemplate {
  const k = new Kit('compresseur');
  const body = k.part('body', 0, [0, 0, 0]);

  // ---------------------------------------------------------------- remorque et châssis-réservoir
  trailerGear(k, body, { axleX: AX, r: R, tire: 0.185, track: 0.68, frameY: FY0, frameZ: FZ, frontX: FX1, rearX: FX0, eyeX: 2.2 });
  k.rbox(body, 'trim', [FX1 - FX0, FY1 - FY0, 2 * FZ], 0.025, [(FX0 + FX1) / 2, (FY0 + FY1) / 2, 0], undefined, 2);
  for (const s of [-1, 1]) k.box(body, 'black', [0.28, 0.05, 0.012], [0.35, (FY0 + FY1) / 2, s * (FZ + 0.002)]);

  // ---------------------------------------------------------------- tour arrière : commande, sorties d'air, levage
  k.rbox(body, 'paint', [HX - TX0, LH, W], 0.05, [(TX0 + HX) / 2, (FY1 + TOP) / 2, 0], undefined, 3);
  k.box(body, 'trim', [HX - TX0 + 0.01, 0.06, W + 0.01], [(TX0 + HX) / 2, FY1 + 0.03, 0]);
  k.box(body, 'black', [0.01, LH - 0.1, W - 0.08], [HX + 0.004, (FY1 + TOP) / 2, 0]);
  for (const s of [-1, 1]) k.grille(body, [(TX0 + HX) / 2, 0.86, s * (W / 2 + 0.002)], 0.2, 0.3, 4, 'z', s);
  const rx = TX0 - 0.004;
  // tableau de commande : cadre, écran, voyants, arrêt d'urgence
  k.rbox(body, 'steelDark', [0.024, 0.26, 0.62], 0.012, [rx, 1.1, -0.06], undefined, 1);
  k.box(body, 'trim', [0.01, 0.2, 0.56], [rx - 0.012, 1.1, -0.06]);
  k.box(body, 'lamp', [0.006, 0.09, 0.16], [rx - 0.018, 1.12, -0.22]);
  for (let i = 0; i < 3; i++) k.cylX(body, i === 0 ? 'amber' : 'steel', 0.02, 0.02, [rx - 0.02, 1.12, -0.02 + i * 0.07], 10);
  k.box(body, 'paint', [0.03, 0.13, 0.13], [rx - 0.008, 1.1, 0.36]);
  k.cylX(body, 'tail', 0.042, 0.04, [rx - 0.035, 1.1, 0.36], 14);
  // collecteur d'air comprimé : trois vannes à boisseau, leviers rouges, raccords à griffes
  k.box(body, 'steelDark', [0.02, 0.2, 0.66], [rx - 0.006, 0.74, -0.02]);
  k.cylZ(body, 'steel', 0.035, 0.6, [rx - 0.05, 0.74, -0.02], 12);
  for (const z of [-0.24, -0.02, 0.2]) {
    k.cylX(body, 'steel', 0.04, 0.1, [rx - 0.1, 0.74, z], 12);
    k.box(body, 'tail', [0.025, 0.022, 0.13], [rx - 0.1, 0.79, z + 0.05]);
    k.cylX(body, 'steel', 0.045, 0.05, [rx - 0.175, 0.74, z], 12);
    k.box(body, 'steel', [0.03, 0.12, 0.02], [rx - 0.2, 0.74, z]);
  }
  // anneau de levage, échappement et gyrophare sur la tour
  const ex = (TX0 + HX) / 2;
  k.box(body, 'black', [0.24, 0.012, 0.22], [ex, TOP + 0.006, 0]);
  k.box(body, 'steel', [0.07, 0.07, 0.05], [ex, TOP + 0.035, 0]);
  k.torus(body, 'steel', 0.075, 0.02, [ex, TOP + 0.14, 0], undefined, [8, 20]);
  exhaust(k, body, [ex - 0.02, TOP, 0.33], 0.12, 0.04);
  k.beacon(body, [ex, TOP, -0.33], 0.065);

  // ---------------------------------------------------------------- moteur et bloc compresseur (vibrent au réveil)
  const engine = k.part('engine', body, [0, 0, 0]);
  k.rbox(engine, 'steel', [0.5, 0.36, 0.4], 0.035, [0.24, 0.76, 0], undefined, 2);
  k.rbox(engine, 'paint', [0.44, 0.07, 0.26], 0.025, [0.24, 0.975, 0], undefined, 2);
  k.cylX(engine, 'steelDark', 0.21, 0.05, [-0.03, 0.76, 0], 20);
  k.rbox(engine, 'steelDark', [0.32, 0.34, 0.36], 0.04, [-0.22, 0.76, 0], undefined, 2);
  k.cylZ(engine, 'steel', 0.13, 0.38, [-0.22, 0.8, 0], 18);
  k.cyl(engine, 'steel', 0.08, 0.1, [-0.22, 0.98, 0], undefined, 14);
  k.cylZ(engine, 'trim', 0.1, 0.3, [-0.08, 1.12, 0.15], 16);
  // séparateur d'huile, radiateur et ventilateur, batterie
  k.cyl(engine, 'paint', 0.15, 0.46, [-0.6, 0.8, 0.25], undefined, 18);
  k.sphere(engine, 'paint', 0.15, [-0.6, 1.03, 0.25], 18, true);
  k.cyl(engine, 'steel', 0.04, 0.06, [-0.6, 1.2, 0.25], undefined, 10);
  k.rbox(engine, 'trim', [0.06, 0.46, 0.84], 0.015, [0.8, 0.8, 0], undefined, 1);
  k.box(engine, 'black', [0.066, 0.38, 0.74], [0.8, 0.8, 0]);
  k.torus(engine, 'trim', 0.17, 0.025, [0.73, 0.8, 0], [0, Math.PI / 2, 0], [6, 24]);
  k.rbox(engine, 'black', [0.24, 0.18, 0.16], 0.015, [0.52, 0.62, -0.32], undefined, 1);
  k.hose(engine, 'rubber', [[-0.22, 0.93, -0.1], [-0.38, 1.06, -0.05], [-0.56, 1.08, 0.12], [-0.6, 1.1, 0.25]], 0.03, 16);
  k.hose(engine, 'rubber', [[0.5, 0.86, 0.18], [0.62, 0.95, 0.25], [0.74, 0.98, 0.25]], 0.025, 10);
  for (const x of [-0.3, 0.42]) {
    for (const s of [-1, 1]) k.cyl(engine, 'black', 0.035, 0.06, [x, FY1 + 0.03, s * 0.17], undefined, 10);
  }

  // ---------------------------------------------------------------- capot arrondi d'une pièce (charnière arrière)
  const hood = k.part('hood', body, [HX, TOP, 0]);
  k.joint('hood', hood, 'rz', 0);
  // profil latéral (repère du capot : origine sur la charnière, en haut à l'arrière), réduit de l'arrondi
  const prof = new THREE.Shape();
  prof.moveTo(B, -LH + B);
  prof.lineTo(LL - B, -LH + B);
  prof.lineTo(LL - B, -0.44);
  prof.quadraticCurveTo(LL - B, -B, LL - 0.46, -B);
  prof.lineTo(B, -B);
  prof.closePath();
  k.extrude(hood, 'paint', prof, W, [0, 0, 0], undefined, B, 16);
  // doublure insonorisante visible capot ouvert
  k.box(hood, 'black', [LL - 0.12, 0.008, W - 0.08], [LL / 2, -LH - 0.006, 0]);
  // bandeau graphite en pied de capot
  for (const s of [-1, 1]) k.box(hood, 'trim', [LL - 0.1, 0.06, 0.012], [LL / 2, -LH + 0.04, s * (W / 2 + 0.002)]);
  k.box(hood, 'trim', [0.012, 0.06, W - 0.1], [LL + 0.002, -LH + 0.04, 0]);
  // calandre d'entrée d'air, ouïes latérales, plaque du code, serrure
  k.grille(hood, [LL + 0.002, -0.46, 0], 0.8, 0.3, 5, 'x', 1);
  for (const s of [-1, 1]) {
    k.grille(hood, [1.3, -0.42, s * (W / 2 + 0.002)], 0.42, 0.28, 5, 'z', s);
    k.decal(hood, 0.56, 0.14, [0.62, -0.36, s * (W / 2 + 0.002)], s > 0 ? 0 : Math.PI);
  }
  k.rbox(hood, 'black', [0.03, 0.06, 0.14], 0.01, [LL + 0.005, -0.66, 0], undefined, 1);
  // vérins à gaz entre le châssis et les flancs du capot (cachés capot fermé)
  for (const s of [-1, 1]) {
    k.box(body, 'steelDark', [0.06, 0.06, 0.04], [HX + 0.05, FY1 + 0.05, s * 0.46]);
    k.piston(body, [body, [HX + 0.05, FY1 + 0.08, s * 0.46]], [hood, [0.15, -0.26, s * 0.46]], 0.018, 0.009, 'black', 'chrome');
  }

  return k.build({
    refWeight: 1.0,
    minScale: 1.8,
    maxScale: 2.2,
    vibrate: 'engine',
    wake: [
      { pose: { hood: 0.55 }, dur: 1.3 },
      { pose: { hood: 0.98 }, dur: 1.0 },
      { pose: { hood: 0.94 }, dur: 1.8 },
      { pose: { hood: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { hood: 0.12 }, dur: 0.45 },
      { pose: { hood: 0 }, dur: 0.5 },
    ],
  });
}
