// Chariot télescopique (≈ 11 t, classe Manitou MT 1440 / JCB 540-140 / Merlo P40.14 : levée 14 m, 4 t).
// Quatre roues égales 400/80-24, châssis bas, cabine étroite à gauche (z−), moteur latéral à droite, flèche
// télescopique à trois éléments articulée à l'arrière et couchée le long de la cabine, tablier à fourches au
// bout de la flèche, deux stabilisateurs à l'avant.
// Gabarit : 5,8 m jusqu'au tablier (7,2 m fourches comprises) × 2,36 m × 2,45 m, empattement 3,07 m.
import { Kit, softPolygon, type MachineTemplate, type Pose } from './kit';
import { cabin, exhaust, fender, ladder, wheel } from './parts';

const R = 0.625; // rayon des pneus 400/80-24
const TW = 0.4; // largeur des pneus
const ZW = 0.98; // demi-voie (centre des pneus)
const XF = 1.535; // essieu avant
const XR = -1.535; // essieu arrière
const ZB = 0.05; // plan médian de la flèche
const PIVOT: [number, number] = [-2.25, 1.9]; // axe de la flèche
const BOOM_REST = -0.218; // flèche couchée, nez vers le bas (≈ −12,5°)
const HEAD: [number, number] = [5.08, -0.1]; // axe du tablier au bout du dernier élément
const STAB_Z = 0.32; // axe des stabilisateurs (z)
const STAB_Y = 0.42;
const STAB_X = 2.3;
const STAB_L = 1.15; // longueur d'un bras de stabilisateur
const STAB_UP = 1.047; // bras relevés : 60° au-dessus de l'horizontale
const STAB_DOWN = -0.332; // bras posés : 19° sous l'horizontale

/** Bras de stabilisateur (côté s) et son patin articulé qui reste à plat ; renvoie le bras. */
function stabilizer(k: Kit, chassis: number, s: number): number {
  const arm = k.part(s > 0 ? 'stabR' : 'stabL', chassis, [STAB_X, STAB_Y, s * STAB_Z]);
  // le bras est dessiné horizontal vers l'extérieur (±z) ; la liaison rx l'incline
  k.joint(s > 0 ? 'stabR' : 'stabL', arm, 'rx', -s * STAB_UP);
  k.rbox(arm, 'paint', [0.17, 0.16, STAB_L + 0.1], 0.04, [0, 0, s * (STAB_L / 2 - 0.02)], undefined, 2);
  k.cylX(arm, 'steelDark', 0.1, 0.26, [0, 0, 0], 14);
  k.cylX(arm, 'steel', 0.045, 0.32, [0, 0, 0], 10);
  // patte du vérin sur le dessus du bras
  k.box(arm, 'paint', [0.12, 0.1, 0.16], [0, 0.11, s * STAB_L * 0.42]);
  k.cylX(arm, 'steelDark', 0.07, 0.2, [0, 0, s * STAB_L], 12);
  const pad = k.part(s > 0 ? 'padR' : 'padL', arm, [0, 0, s * STAB_L]);
  k.joint(s > 0 ? 'padR' : 'padL', pad, 'rx', s * STAB_UP);
  k.sphere(pad, 'steel', 0.065, [0, -0.05, 0], 12);
  k.cyl(pad, 'steelDark', [0.15, 0.17], 0.06, [0, -0.11, 0], undefined, 20);
  k.cyl(pad, 'rubber', 0.17, 0.02, [0, -0.15, 0], undefined, 20);
  return arm;
}

export function buildChariotTelescopique(): MachineTemplate {
  const k = new Kit('chariot_telescopique');

  // ---------------------------------------------------------------- châssis, ponts et roues
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  k.rbox(chassis, 'trim', [4.45, 0.36, 0.56], 0.05, [0.0, 0.6, 0], undefined, 2);
  for (const x of [XF, XR]) {
    k.cylZ(chassis, 'steelDark', 0.11, 2 * ZW - 0.32, [x, R, 0], 14);
    k.rbox(chassis, 'steelDark', [0.42, 0.34, 0.5], 0.06, [x, R - 0.02, 0], undefined, 2);
    for (const s of [-1, 1]) {
      k.cylZ(chassis, 'steelDark', 0.19, 0.2, [x, R, s * (ZW - 0.32)], 18);
      wheel(k, chassis, [x, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
      fender(k, chassis, [x, R, s * ZW], R + 0.06, TW + 0.1, 0.42, Math.PI - 0.42, 'black', 0.04);
      // jambe de garde-boue
      k.box(chassis, 'black', [0.07, 0.42, 0.05], [x, R + 0.42, s * (ZW - TW / 2 - 0.08)]);
    }
  }
  // boîte de transfert et arbres de transmission
  k.rbox(chassis, 'steelDark', [0.6, 0.32, 0.4], 0.05, [0.1, 0.52, 0.12], undefined, 2);
  k.cylX(chassis, 'steelDark', 0.05, 2.7, [0.0, 0.52, 0.12], 10);

  // contrepoids arrière, pare-chocs, attelage et feux
  const cw = softPolygon(
    [
      [-2.84, 0.42],
      [-2.24, 0.42],
      [-2.24, 1.3],
      [-2.54, 1.3],
      [-2.84, 1.06],
    ],
    0.12,
  );
  k.extrude(chassis, 'paint', cw, 1.96, [0, 0, 0], undefined, 0.04, 10);
  k.rbox(chassis, 'trim', [0.1, 0.16, 1.9], 0.03, [-2.86, 0.56, 0], undefined, 2);
  k.rbox(chassis, 'trim', [0.03, 0.26, 0.9], 0.02, [-2.85, 0.86, 0], undefined, 1);
  k.rbox(chassis, 'steelDark', [0.24, 0.12, 0.3], 0.03, [-2.94, 0.62, 0], undefined, 2);
  k.cyl(chassis, 'steel', 0.035, 0.24, [-3.0, 0.66, 0], undefined, 10);
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'trim', [0.06, 0.2, 0.36], 0.03, [-2.83, 0.98, s * 0.72], undefined, 2);
    k.rbox(chassis, 'tail', [0.03, 0.12, 0.16], 0.015, [-2.86, 0.98, s * 0.8], undefined, 1);
    k.rbox(chassis, 'amber', [0.03, 0.12, 0.1], 0.015, [-2.86, 0.98, s * 0.63], undefined, 1);
  }
  // tour de pied de flèche (deux flasques) et axe
  const tower = softPolygon(
    [
      [-2.62, 0.62],
      [-1.72, 0.62],
      [-1.86, 1.36],
      [-2.08, 2.12],
      [-2.44, 2.12],
      [-2.62, 1.62],
    ],
    0.12,
  );
  for (const s of [-1, 1]) k.extrude(chassis, 'paint', tower, 0.06, [0, 0, ZB + s * 0.29], undefined, 0.012, 8);
  k.cylZ(chassis, 'steel', 0.07, 0.74, [PIVOT[0], PIVOT[1], ZB], 12);
  k.cylZ(chassis, 'steel', 0.06, 0.66, [-2.0, 0.92, ZB], 12);
  // butée de flèche (caoutchouc) sur le châssis, devant la cabine
  k.box(chassis, 'trim', [0.14, 0.12, 0.2], [1.0, 0.84, ZB]);
  k.box(chassis, 'rubber', [0.2, 0.04, 0.26], [1.0, 0.92, ZB]);

  // ---------------------------------------------------------------- moteur latéral (droite, z+)
  const pod = softPolygon(
    [
      [-0.86, 0.48],
      [0.84, 0.48],
      [0.84, 1.28],
      [0.66, 1.5],
      [-0.86, 1.5],
    ],
    0.1,
  );
  k.extrude(chassis, 'paint', pod, 0.78, [0, 0, 0.75], undefined, 0.035, 10);
  k.grille(chassis, [-0.05, 1.02, 1.141], 1.1, 0.56, 7, 'z', 1);
  k.box(chassis, 'trim', [1.62, 0.05, 0.8], [-0.02, 0.48, 0.75]);
  for (let i = 0; i < 5; i++) k.box(chassis, 'black', [0.05, 0.015, 0.46], [-0.6 + i * 0.13, 1.508, 0.78]);
  exhaust(k, chassis, [-0.72, 1.5, 1.0], 0.26, 0.05);
  // carter de refroidissement derrière le moteur, entre la flèche et la roue arrière
  k.rbox(chassis, 'paint', [1.34, 0.86, 0.38], 0.06, [-1.55, 1.1, 0.56], undefined, 2);
  k.grille(chassis, [-1.55, 1.22, 0.751], 0.9, 0.36, 4, 'z', 1);
  // réservoir hydraulique derrière la cabine (gauche)
  k.rbox(chassis, 'paint', [1.24, 0.7, 0.38], 0.06, [-1.58, 0.98, -0.56], undefined, 2);
  k.cyl(chassis, 'steel', 0.05, 0.05, [-1.3, 1.35, -0.56], undefined, 12);

  // ---------------------------------------------------------------- cabine (gauche, z−)
  k.rbox(chassis, 'trim', [1.72, 0.44, 0.82], 0.04, [-0.03, 0.74, -0.7], undefined, 2);
  cabin(k, chassis, {
    x0: -0.92,
    x1: 0.86,
    y0: 0.95,
    h: 1.37,
    w: 0.88,
    zc: -0.69,
    lean: 0.05,
    leanBack: 0.02,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 1,
  });
  ladder(k, chassis, 0.06, 0.5, 0.36, 0.94, -1.13, 2);
  k.rail(chassis, 'trim', [[0.8, 1.15, -1.13], [0.84, 1.19, -1.18], [0.84, 2.0, -1.18], [0.8, 2.04, -1.13]], 0.018);
  k.mirror(chassis, [0.86, 1.95, -1.13], -1, 0.24);
  k.mirror(chassis, [0.6, 1.54, 1.08], 1, 0.24);
  // phares de route sur les garde-boue avant
  for (const s of [-1, 1]) {
    k.lamp(chassis, [XF + 0.32, 1.33, s * ZW], 0.13);
    k.rbox(chassis, 'amber', [0.05, 0.06, 0.1], 0.015, [XF + 0.36, 1.33, s * (ZW + 0.13)], undefined, 1);
  }

  // ---------------------------------------------------------------- stabilisateurs avant
  k.rbox(chassis, 'trim', [0.3, 0.3, 0.92], 0.04, [STAB_X, 0.47, 0], undefined, 2);
  for (const s of [-1, 1]) {
    const arm = stabilizer(k, chassis, s);
    k.piston(chassis, [chassis, [STAB_X, 0.6, s * 0.12]], [arm, [0, 0.13, s * STAB_L * 0.42]], 0.065, 0.04);
  }

  // ---------------------------------------------------------------- flèche télescopique (3 éléments)
  const boom = k.part('boom', chassis, [PIVOT[0], PIVOT[1], ZB]);
  k.joint('boom', boom, 'rz', BOOM_REST);
  const outer = softPolygon(
    [
      [-0.42, -0.3],
      [4.38, -0.24],
      [4.38, 0.25],
      [-0.42, 0.31],
    ],
    0.1,
  );
  k.extrude(boom, 'paint', outer, 0.46, [0, 0, 0], undefined, 0.03, 8);
  k.cylZ(boom, 'trim', 0.2, 0.52, [0, 0, 0], 18);
  k.box(boom, 'trim', [0.06, 0.48, 0.47], [4.36, 0.005, 0]);
  // patte du vérin de levage sous la flèche
  k.rbox(boom, 'trim', [0.36, 0.14, 0.24], 0.03, [2.2, -0.3, 0], undefined, 2);
  // flexibles sur le flanc droit, guide de flexibles
  for (const dy of [0.1, 0.17]) k.hose(boom, 'rubber', [[0.3, dy, 0.25], [1.4, dy - 0.01, 0.255], [2.8, dy - 0.03, 0.255], [4.2, dy - 0.05, 0.25]], 0.022, 24);
  for (const x of [1.2, 2.6, 3.9]) k.box(boom, 'black', [0.05, 0.14, 0.04], [x, 0.12, 0.25]);
  for (const s of [-1, 1]) k.decal(boom, 0.82, 0.205, [1.0, 0.02, s * 0.232], s > 0 ? 0 : Math.PI);

  const tele1 = k.part('tele1', boom, [0, 0, 0]);
  k.joint('tele1', tele1, 'tx', 0);
  k.rbox(tele1, 'paint', [3.42, 0.4, 0.36], 0.04, [2.91, 0.0, 0], undefined, 2);
  k.box(tele1, 'trim', [0.05, 0.42, 0.38], [4.6, 0.0, 0]);
  for (const s of [-1, 1]) k.box(tele1, 'black', [0.12, 0.08, 0.02], [4.5, 0.08, s * 0.185]);

  const tele2 = k.part('tele2', tele1, [0, 0, 0]);
  k.joint('tele2', tele2, 'tx', 0);
  k.rbox(tele2, 'paint', [3.5, 0.32, 0.28], 0.035, [3.23, -0.01, 0], undefined, 2);
  // tête de flèche : flasques, axes du tablier, patte du vérin de cavage
  for (const s of [-1, 1]) {
    const lug = softPolygon(
      [
        [4.86, -0.17],
        [5.2, -0.17],
        [5.2, 0.02],
        [4.86, 0.15],
      ],
      0.06,
    );
    k.extrude(tele2, 'trim', lug, 0.04, [0, 0, s * 0.16], undefined, 0.008, 6);
  }
  k.cylZ(tele2, 'steel', 0.05, 0.42, [HEAD[0], HEAD[1], 0], 12);
  k.rbox(tele2, 'trim', [0.3, 0.12, 0.16], 0.03, [4.3, 0.2, 0], undefined, 2);

  // ---------------------------------------------------------------- tablier et fourches
  const carriage = k.part('carriage', tele2, [HEAD[0], HEAD[1], 0]);
  k.joint('tilt', carriage, 'rz', -BOOM_REST);
  // plaque d'attache et flasques
  k.rbox(carriage, 'paint', [0.1, 0.62, 0.3], 0.03, [0.08, 0.1, 0], undefined, 2);
  k.cylZ(carriage, 'steel', 0.045, 0.36, [-0.02, 0.4, 0], 10);
  for (const s of [-1, 1]) k.box(carriage, 'trim', [0.12, 0.8, 0.05], [0.16, -0.22, s * 0.6]);
  k.rbox(carriage, 'trim', [0.12, 0.12, 1.26], 0.02, [0.17, 0.12, 0], undefined, 1);
  k.rbox(carriage, 'trim', [0.1, 0.1, 1.26], 0.02, [0.17, -0.54, 0], undefined, 1);
  // dosseret de protection (grille) au-dessus du tablier
  for (const s of [-1, 1]) k.box(carriage, 'trim', [0.05, 0.5, 0.05], [0.18, 0.42, s * 0.58]);
  k.box(carriage, 'trim', [0.05, 0.05, 1.21], [0.18, 0.67, 0]);
  for (let i = 0; i < 4; i++) k.box(carriage, 'trim', [0.03, 0.5, 0.025], [0.18, 0.42, -0.36 + i * 0.24]);
  // fourches 1200 × 125 × 45
  for (const s of [-1, 1]) {
    const z = s * 0.36;
    k.box(carriage, 'steelDark', [0.045, 0.78, 0.125], [0.245, -0.25, z]);
    k.box(carriage, 'steelDark', [0.08, 0.06, 0.125], [0.2, 0.15, z]);
    const blade = softPolygon(
      [
        [0.222, -0.65],
        [1.445, -0.65],
        [1.445, -0.635],
        [1.2, -0.605],
        [0.3, -0.605],
        [0.267, -0.56],
        [0.222, -0.56],
      ],
      0.01,
    );
    k.extrude(carriage, 'steelDark', blade, 0.125, [0, 0, z], undefined, 0, 4);
  }

  // ---------------------------------------------------------------- vérins
  k.piston(chassis, [chassis, [-2.0, 0.92, ZB]], [boom, [2.2, -0.33, 0]], 0.11, 0.065);
  k.piston(tele2, [tele2, [4.3, 0.2, 0]], [carriage, [-0.02, 0.4, 0]], 0.065, 0.04);

  // fourches horizontales : le tablier compense l'angle de la flèche (correcteur d'assiette)
  const level = (boomAngle: number) => -boomAngle;
  // côté gauche, la liaison rx vaut l'élévation du bras ; côté droit son opposé ; les patins compensent
  const stabDown: Pose = { stabL: STAB_DOWN, stabR: -STAB_DOWN, padL: -STAB_DOWN, padR: STAB_DOWN };
  const stabUp: Pose = { stabL: STAB_UP, stabR: -STAB_UP, padL: -STAB_UP, padR: STAB_UP };
  return k.build({
    refWeight: 11,
    minScale: 0.85,
    maxScale: 1.2,
    wake: [
      { pose: stabDown, dur: 1.2 },
      { pose: { boom: 0.62, tilt: level(0.62) }, dur: 1.6 },
      { pose: { tele1: 1.6, tele2: 1.6, tilt: level(0.62) + 0.3 }, dur: 1.6 },
      { pose: { boom: 0.0, tele1: 0, tele2: 0, tilt: level(0) - 0.2 }, dur: 1.8 },
      { pose: { ...stabUp, boom: BOOM_REST, tilt: level(BOOM_REST) }, dur: 1.4 },
    ],
    nod: [
      { pose: { tilt: level(BOOM_REST) + 0.2 }, dur: 0.45 },
      { pose: { tilt: level(BOOM_REST) }, dur: 0.5 },
    ],
    breathe: { boom: 0.004, tilt: -0.004 },
  });
}
