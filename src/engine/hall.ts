// Le hall d'exposition : sol en résine polie (reflets flous), mur du fond à lames et néons ambrés avec
// l'enseigne de l'entreprise et le logo Godet, façades vitrées sur la nuit valaisanne, piliers lumineux,
// plafond à bandeaux et néons, quelques éléments d'atelier sobres. Tout le statique est fusionné par matériau,
// les éléments répétés sont instanciés.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Batch, compose, disposeTree, instanced, type V3 } from './batch';
import { AISLE, ROW, type HallDims, type Slot } from './layout';
import type { MaterialBank } from './materials';
import type { Rig } from './rig';
import { floorTexture, gradientTexture, radialTexture, signageTexture } from './textures';

const CHALK = new THREE.Color('#ece8de');
const AMBER = new THREE.Color(1, 0.62, 0.16);
const WARM = new THREE.Color(1, 0.93, 0.82);
const PAINT = new THREE.Color('#f3b71b');

/** Néon : matériau non éclairé dont la couleur (au-delà de 1 : halo) suit un canal lumineux. */
function neon(
  bank: MaterialBank,
  rig: Rig,
  owner: object,
  channel: string,
  color: THREE.Color,
  k: number,
  extra: Partial<THREE.MeshBasicMaterialParameters> = {},
): THREE.MeshBasicMaterial {
  const m = bank.keep(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(k), ...extra }));
  rig.bind(channel, (l) => m.color.copy(color).multiplyScalar(k * l), owner);
  return m;
}

// ------------------------------------------------------------------ sol réfléchissant

/** Sol : matériau standard (éclairé, ombres reçues) auquel on ajoute le reflet plan, flouté et modulé par Fresnel. */
function floorMaterial(bank: MaterialBank, tex: THREE.Texture, reflTex: THREE.Texture, reflMatrix: THREE.Matrix4) {
  const uniforms = {
    uReflTex: { value: reflTex },
    uReflMatrix: { value: reflMatrix },
    uReflStrength: { value: 0 },
    uReflTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) },
  };
  const m = bank.std({ color: 0xffffff, map: tex, roughness: 0.34, metalness: 0.0 }, 0.22);
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix;\nvarying vec4 vReflUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvReflUv = uReflMatrix * vec4( position, 1.0 );');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D uReflTex;\nuniform float uReflStrength;\nuniform vec2 uReflTexel;\nvarying vec4 vReflUv;',
      )
      .replace(
        '#include <opaque_fragment>',
        `
        if ( uReflStrength > 0.0 ) {
          vec2 ruv = vReflUv.xy / max( vReflUv.w, 1e-4 );
          // flou lisse par niveaux de mipmap, étiré verticalement : reflet « brossé » d'une résine polie
          vec2 o = uReflTexel * vec2( 0.0, 3.0 );
          vec3 r = textureLod( uReflTex, ruv, 1.4 ).rgb * 0.34;
          r += textureLod( uReflTex, ruv + o, 1.8 ).rgb * 0.22;
          r += textureLod( uReflTex, ruv - o, 1.8 ).rgb * 0.22;
          r += textureLod( uReflTex, ruv + o * 2.4, 2.4 ).rgb * 0.11;
          r += textureLod( uReflTex, ruv - o * 2.4, 2.4 ).rgb * 0.11;
          // un texel invalide dans les mipmaps ne doit jamais devenir un rectangle noir au sol
          r = ( any( isnan( r ) ) || any( isinf( r ) ) ) ? vec3( 0.0 ) : min( max( r, vec3( 0.0 ) ), vec3( 24.0 ) );
          float ndv = clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 );
          float fres = 0.16 + 0.84 * pow( 1.0 - ndv, 3.0 );
          // la texture module un peu le reflet (marbrure de la résine)
          float tint = 0.75 + 0.5 * diffuseColor.r * 6.0;
          outgoingLight += r * uReflStrength * fres * clamp( tint, 0.6, 1.3 );
        }
        #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'godet-floor';
  return { material: m, uniforms };
}

export interface Floor {
  mesh: Reflector;
  setReflection(scale: number, w: number, h: number): void;
}

function buildFloor(bank: MaterialBank, dims: HallDims, group: THREE.Group, tex: THREE.Texture): Floor {
  const W = dims.halfWidth * 2 + 30;
  const L = dims.zFront - dims.zBack + 30;
  const geo = new THREE.PlaneGeometry(W, L);
  const refl = new Reflector(geo, { textureWidth: 512, textureHeight: 512, clipBias: 0.003, multisample: 0 });
  const original = refl.material as THREE.ShaderMaterial;
  const reflMatrix = original.uniforms.textureMatrix.value as THREE.Matrix4;
  const rt = refl.getRenderTarget();
  // mipmaps de la cible de réflexion : flou lisse et bon marché dans le shader du sol
  rt.texture.generateMipmaps = true;
  rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  original.dispose();
  tex.repeat.set(W / 4, L / 4);
  const { material, uniforms } = floorMaterial(bank, tex, rt.texture, reflMatrix);
  refl.material = material;
  refl.rotation.x = -Math.PI / 2;
  refl.position.set(0, 0, (dims.zFront + dims.zBack) / 2);
  refl.receiveShadow = true;
  // Rendu du reflet seulement si la qualité le prévoit (sinon simple sol éclairé).
  const renderReflection = refl.onBeforeRender;
  let enabled = false;
  refl.onBeforeRender = (...args) => {
    if (enabled) renderReflection.apply(refl, args);
  };
  group.add(refl);
  return {
    mesh: refl,
    setReflection(scale, w, h) {
      enabled = scale > 0;
      uniforms.uReflStrength.value = enabled ? 0.7 : 0;
      if (enabled) {
        const tw = Math.max(64, Math.round(w * scale));
        const th = Math.max(64, Math.round(h * scale));
        rt.setSize(tw, th);
        uniforms.uReflTexel.value.set(1 / tw, 1 / th);
      } else {
        rt.setSize(1, 1);
      }
    },
  };
}

// ------------------------------------------------------------------ logo Godet (godet stylisé, d'après logo.svg)

function logoShapes(): THREE.Shape[] {
  const s = new THREE.Shape();
  s.moveTo(7, -9);
  s.lineTo(22, -9);
  s.bezierCurveTo(28.6, -9, 33, -13.4, 33, -20);
  s.lineTo(33, -22.5);
  s.lineTo(27.5, -30);
  s.lineTo(17, -30);
  s.bezierCurveTo(11.5, -30, 7, -25.5, 7, -20);
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(13, -15);
  h.lineTo(21.5, -15);
  h.bezierCurveTo(25.1, -15, 27, -17.1, 27, -20.5);
  h.lineTo(27, -21);
  h.lineTo(24, -25);
  h.lineTo(17.5, -25);
  h.bezierCurveTo(15, -25, 13, -23, 13, -20.5);
  h.closePath();
  s.holes.push(h);
  const teeth = [17, 21.6, 26.2].map((x) => {
    const t = new THREE.Shape();
    t.moveTo(x, -30);
    t.lineTo(x + 1.6, -34);
    t.lineTo(x + 3.2, -30);
    t.closePath();
    return t;
  });
  return [s, ...teeth];
}

function logoGeometry(size: number): THREE.BufferGeometry {
  const k = size / 26;
  const geo = new THREE.ExtrudeGeometry(logoShapes(), {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.22,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.translate(-20, 21.5, 0);
  geo.scale(k, k, k);
  return geo;
}

// ------------------------------------------------------------------ hall

export interface HallOptions {
  dims: HallDims;
  slots: Slot[];
  signage: string;
}

export class Hall {
  readonly group = new THREE.Group();
  floor: Floor;
  private signDraw: (() => void) | null = null;
  private signTex: THREE.Texture | null = null;
  private textures: THREE.Texture[] = [];
  /** Matériaux propres au hall, rendus à la banque quand le hall est reconstruit. */
  private mats: THREE.Material[] = [];

  constructor(
    private bank: MaterialBank,
    private rig: Rig,
    o: HallOptions,
  ) {
    const { dims } = o;
    const g = this.group;
    const W = dims.halfWidth;
    const H = dims.height;
    const zF = dims.zFront;
    const zB = dims.zBack;
    const Lh = zF - zB;
    const zMid = (zF + zB) / 2;

    const ftex = floorTexture();
    this.textures.push(ftex);
    this.floor = buildFloor(bank, dims, g, ftex);

    // ------------------------------------------------------------ matériaux du décor
    const wallMat = bank.std({ color: 0x0b0c0f, roughness: 0.86, metalness: 0.1 }, 0.4);
    const slatMat = bank.std({ color: 0x15171b, metalness: 0.72, roughness: 0.36 }, 0.9);
    const pillarMat = bank.std({ color: 0x111317, metalness: 0.6, roughness: 0.42 }, 0.8);
    const ceilMat = bank.std({ color: 0x07080a, roughness: 1, metalness: 0 }, 0.2);
    const girderMat = bank.std({ color: 0x0e1013, metalness: 0.5, roughness: 0.6 }, 0.4);
    const glassMat = bank.phys(
      { color: 0x05070a, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.5, clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false },
      0.55,
    );
    const graphite = bank.std({ color: 0x1b1e23, metalness: 0.45, roughness: 0.48 }, 0.8);
    const steel = bank.std({ color: 0x9aa0a8, metalness: 0.9, roughness: 0.3 }, 1);
    const chrome = bank.std({ color: 0xe5e8ec, metalness: 1, roughness: 0.16 }, 1.3);
    const rubber = bank.std({ color: 0x121315, metalness: 0, roughness: 0.84 }, 0.5);
    const black = bank.std({ color: 0x08090a, metalness: 0.2, roughness: 0.7 }, 0.4);
    const accent = bank.std({ color: PAINT, metalness: 0.2, roughness: 0.4 }, 0.9);
    const palletMat = bank.std({ color: 0x24272c, metalness: 0.05, roughness: 0.8 }, 0.5);

    const wallLed = neon(bank, rig, this, 'wall', AMBER, 1.6);
    const wallLine = neon(bank, rig, this, 'wall', AMBER, 2.6);
    const band = neon(bank, rig, this, 'ceiling', WARM, 1.35);
    const bandSoft = neon(bank, rig, this, 'ceiling', WARM, 0.6);
    const tube = neon(bank, rig, this, 'ceiling', WARM, 1.4);
    const aisleLine = neon(bank, rig, this, 'floor', CHALK, 0.55);
    this.mats.push(wallMat, slatMat, pillarMat, ceilMat, girderMat, glassMat, graphite, steel, chrome, rubber, black, accent, palletMat);
    this.mats.push(wallLed, wallLine, band, bandSoft, tube, aisleLine, this.floor.mesh.material as THREE.Material);

    const b = new Batch();

    // ------------------------------------------------------------ murs, plafond
    b.add(wallMat, new THREE.PlaneGeometry(W * 2, H), [0, H / 2, zB]);
    b.add(ceilMat, new THREE.PlaneGeometry(W * 2, Lh), [0, H, zMid], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) b.add(wallMat, new THREE.PlaneGeometry(Lh, H), [s * W, H / 2, zMid], [0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0]);
    // façade d'entrée : soubassement et linteau
    b.box(wallMat, [W * 2, 0.62, 0.4], [0, 0.31, zF]);
    b.box(wallMat, [W * 2, 1.0, 0.3], [0, H - 0.5, zF]);
    b.build(g);

    // ------------------------------------------------------------ piliers (aux limites des rangées)
    const zs: number[] = [];
    for (let z = dims.zFirst + ROW / 2; z > zB + 2; z -= ROW) zs.push(z);
    zs.push(zB + 0.45);
    if (zF - 0.45 - (dims.zFirst + ROW / 2) > 6) zs.push(dims.zFirst + ROW * 1.5);
    zs.push(zF - 0.45);
    const pillarsM: THREE.Matrix4[] = [];
    for (const s of [-1, 1]) for (const z of zs) pillarsM.push(compose([s * (W - 0.45), H / 2, z]));
    g.add(instanced(new THREE.BoxGeometry(0.9, H, 0.9), pillarMat, pillarsM));

    // ------------------------------------------------------------ murs à lames verticales et néons ambrés (fond et côtés)
    const slatsM: THREE.Matrix4[] = [];
    const ledM: THREE.Matrix4[] = [];
    const nSlats = Math.floor((W * 2 - 1) / 0.5);
    for (let i = 0; i < nSlats; i++) {
      const x = -W + 0.75 + i * 0.5;
      slatsM.push(compose([x, H / 2 - 0.3, zB + 0.3]));
      if (i % 8 === 4) ledM.push(compose([x + 0.25, H / 2 - 0.3, zB + 0.12]));
    }
    for (const s of [-1, 1]) {
      let k = 0;
      for (let z = zF - 1.2; z > zB + 0.9; z -= 0.5, k++) {
        if (zs.some((pz) => Math.abs(pz - z) < 0.62)) continue;
        slatsM.push(compose([s * (W - 0.3), H / 2 - 0.3, z], [0, Math.PI / 2, 0]));
        if (k % 8 === 4) ledM.push(compose([s * (W - 0.12), H / 2 - 0.3, z - 0.25]));
      }
    }
    g.add(instanced(new THREE.BoxGeometry(0.16, H - 2.2, 0.3), slatMat, slatsM));
    g.add(instanced(new THREE.BoxGeometry(0.05, H - 3.0, 0.05), wallLed, ledM));
    const lines = new Batch();
    for (const y of [0.45, H - 1.75]) {
      lines.box(wallLine, [W * 2 - 1.5, 0.05, 0.06], [0, y, zB + 0.5]);
      for (const s of [-1, 1]) lines.box(wallLine, [0.06, 0.05, Lh - 2.4], [s * (W - 0.5), y, zMid - 0.2]);
    }
    lines.build(g);
    // lueur rasante chaude au pied des murs
    const washTex = gradientTexture();
    this.textures.push(washTex);
    const washMat = neon(bank, rig, this, 'wall', AMBER, 0.15, { map: washTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mats.push(washMat);
    const wash = new Batch();
    wash.add(washMat, new THREE.PlaneGeometry(W * 2 - 1, 4.2), [0, 2.1, zB + 0.48]);
    for (const s of [-1, 1]) wash.add(washMat, new THREE.PlaneGeometry(Lh - 2.4, 4.2), [s * (W - 0.48), 2.1, zMid - 0.2], [0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0]);
    wash.build(g).forEach((m) => {
      m.renderOrder = 2;
      m.receiveShadow = false;
    });

    // ------------------------------------------------------------ enseigne et logo
    this.buildSign(o.signage, dims);

    // ------------------------------------------------------------ façade d'entrée vitrée
    {
      const glassM: THREE.Matrix4[] = [];
      const mullM: THREE.Matrix4[] = [];
      const n = Math.round((W * 2) / 3.6);
      const w = (W * 2 - 0.9) / n;
      glassM.push(compose([0, 0.62 + (H - 1.62) / 2, zF - 0.15], [0, Math.PI, 0], [W * 2 - 0.9, 1, 1]));
      for (let k = 1; k < n; k++) mullM.push(compose([-W + 0.45 + k * w, H / 2, zF - 0.15], [0, Math.PI / 2, 0]));
      const glassMesh = instanced(new THREE.PlaneGeometry(1, H - 1.62), glassMat, glassM);
      glassMesh.renderOrder = 3;
      g.add(glassMesh);
      g.add(instanced(new THREE.BoxGeometry(0.1, H - 1.6, 0.12), graphite, mullM));
    }

    // ------------------------------------------------------------ bureau vitré du chef d'atelier (angle arrière gauche)
    {
      const ox0 = -W + 0.5;
      const ox1 = ox0 + 6.6;
      const oz0 = zB + 0.5;
      const oz1 = zB + 4.4;
      const oh = 3.4;
      const cx = (ox0 + ox1) / 2;
      const cz = (oz0 + oz1) / 2;
      const ob = new Batch();
      const glass = new Batch();
      glass.add(glassMat, new THREE.PlaneGeometry(ox1 - ox0, oh), [cx, oh / 2, oz1]);
      glass.add(glassMat, new THREE.PlaneGeometry(oz1 - oz0, oh), [ox1, oh / 2, cz], [0, Math.PI / 2, 0]);
      glass.build(g).forEach((m) => (m.renderOrder = 3));
      // menuiseries fines
      for (let x = ox0 + 1.65; x < ox1 - 0.2; x += 1.65) ob.box(graphite, [0.06, oh, 0.08], [x, oh / 2, oz1]);
      for (const z of [oz0 + 1.3, oz0 + 2.6]) ob.box(graphite, [0.08, oh, 0.06], [ox1, oh / 2, z]);
      ob.box(graphite, [0.1, oh, 0.1], [ox1, oh / 2, oz1]);
      ob.box(graphite, [ox1 - ox0, 0.08, 0.1], [cx, oh, oz1]);
      ob.box(graphite, [0.1, 0.08, oz1 - oz0], [ox1, oh, cz]);
      ob.box(graphite, [ox1 - ox0, 0.06, 0.1], [cx, 0.03, oz1]);
      ob.box(graphite, [0.1, 0.06, oz1 - oz0], [ox1, 0.03, cz]);
      ob.box(graphite, [ox1 - ox0 + 0.12, 0.14, oz1 - oz0 + 0.12], [cx, oh + 0.07, cz]);
      // poste de travail : bureau, écran, fauteuil, étagère de classeurs
      ob.box(graphite, [2.2, 0.04, 0.8], [cx - 0.6, 0.76, cz - 0.6]);
      ob.box(steel, [2.2, 0.01, 0.8], [cx - 0.6, 0.785, cz - 0.6]);
      for (const dx of [-1.6, 0.4]) ob.box(graphite, [0.06, 0.74, 0.7], [cx + dx, 0.37, cz - 0.6]);
      ob.box(black, [0.62, 0.38, 0.03], [cx - 0.6, 1.12, cz - 0.86]);
      ob.box(black, [0.05, 0.3, 0.05], [cx - 0.6, 0.92, cz - 0.86]);
      ob.box(black, [0.5, 0.08, 0.5], [cx - 0.6, 0.48, cz + 0.05]);
      ob.box(black, [0.5, 0.55, 0.08], [cx - 0.6, 0.8, cz + 0.3]);
      ob.box(graphite, [3.0, 0.03, 0.34], [cx + 0.9, 1.6, oz0 + 0.2]);
      ob.box(graphite, [3.0, 0.03, 0.34], [cx + 0.9, 2.1, oz0 + 0.2]);
      for (let i = 0; i < 14; i++) ob.box(i % 5 === 0 ? accent : i % 2 ? steel : graphite, [0.07, 0.32, 0.26], [cx - 0.5 + i * 0.1, 1.78, oz0 + 0.2]);
      ob.build(g).forEach((m) => (m.castShadow = false));
      // plafonnier chaud et écran allumé
      const office = neon(bank, rig, this, 'side', WARM, 1.1);
      const screen = neon(bank, rig, this, 'side', new THREE.Color(0.55, 0.7, 1), 0.7);
      this.mats.push(office, screen);
      const ol = new Batch();
      ol.add(office, new THREE.PlaneGeometry(ox1 - ox0 - 1.2, oz1 - oz0 - 1.2), [cx, oh - 0.02, cz], [Math.PI / 2, 0, 0]);
      ol.add(screen, new THREE.PlaneGeometry(0.58, 0.34), [cx - 0.6, 1.12, cz - 0.844]);
      ol.build(g);
    }

    // ------------------------------------------------------------ plafond : poutres, bandeaux, néons
    const girdM: THREE.Matrix4[] = [];
    for (let z = zF - 3; z > zB + 1; z -= 6.4) girdM.push(compose([0, H - 0.3, z]));
    g.add(instanced(new THREE.BoxGeometry(W * 2, 0.55, 0.32), girderMat, girdM));
    // bandeaux lumineux continus : deux au-dessus des bords de l'allée, deux plus discrets au-dessus des baies
    const bands = new Batch();
    for (const s of [-1, 1]) {
      bands.box(band, [0.22, 0.06, Lh - 6], [s * (AISLE - 0.4), H - 0.72, zMid + 1]);
      bands.box(girderMat, [0.42, 0.14, Lh - 6], [s * (AISLE - 0.4), H - 0.62, zMid + 1]);
      bands.box(bandSoft, [0.12, 0.05, Lh - 6], [s * (W - 3.2), H - 0.62, zMid + 1]);
    }
    bands.build(g);
    // néons de corniche tout autour du plafond
    const neons = new Batch();
    for (const s of [-1, 1]) neons.add(tube, new THREE.CylinderGeometry(0.035, 0.035, Lh - 1.4, 8), [s * (W - 0.55), H - 1.05, zMid], [Math.PI / 2, 0, 0]);
    neons.add(tube, new THREE.CylinderGeometry(0.035, 0.035, W * 2 - 1.4, 8), [0, H - 1.05, zB + 0.75], [0, 0, Math.PI / 2]);
    neons.build(g);

    // ------------------------------------------------------------ lignes lumineuses au sol le long de l'allée
    const fl = new Batch();
    for (const s of [-1, 1]) fl.add(aisleLine, new THREE.PlaneGeometry(0.06, zF - zB - 6), [s * AISLE, 0.006, zMid + 1.5], [-Math.PI / 2, 0, 0]);
    fl.build(g).forEach((m) => {
      m.renderOrder = 1;
      m.receiveShadow = false;
    });

    // ------------------------------------------------------------ décor d'atelier (sobre, dans les angles)
    const d = new Batch();
    const cab = (x: number, z: number, ry: number, w = 1.6) => {
      // servante d'atelier : caisse graphite, tiroirs, poignées acier, plateau
      const c = Math.cos(ry);
      const sn = Math.sin(ry);
      const P = (lx: number, ly: number, lz: number): V3 => [x + lx * c + lz * sn, ly, z - lx * sn + lz * c];
      d.box(graphite, [w, 1.0, 0.62], P(0, 0.56, 0), [0, ry, 0]);
      d.box(steel, [w + 0.04, 0.04, 0.66], P(0, 1.08, 0), [0, ry, 0]);
      d.box(black, [w - 0.02, 0.06, 0.6], P(0, 0.05, 0), [0, ry, 0]);
      for (let i = 0; i < 5; i++) {
        d.box(black, [w - 0.1, 0.012, 0.01], P(0, 0.22 + i * 0.17, 0.315), [0, ry, 0]);
        d.box(steel, [w * 0.4, 0.018, 0.03], P(0, 0.29 + i * 0.17, 0.33), [0, ry, 0]);
      }
      d.box(accent, [w, 0.02, 0.01], P(0, 1.035, 0.315), [0, ry, 0]);
    };
    const tireRack = (x: number, z: number, ry: number) => {
      const c = Math.cos(ry);
      const sn = Math.sin(ry);
      const P = (lx: number, ly: number, lz: number): V3 => [x + lx * c + lz * sn, ly, z - lx * sn + lz * c];
      for (const lx of [-1.3, 1.3]) d.box(graphite, [0.08, 1.9, 0.6], P(lx, 0.95, 0), [0, ry, 0]);
      for (const ly of [0.18, 1.0]) for (const lz of [-0.25, 0.25]) d.box(steel, [2.7, 0.05, 0.05], P(0, ly, lz), [0, ry, 0]);
      for (let k = 0; k < 4; k++) {
        for (const ly of [0.62, 1.44]) {
          const tire = new THREE.TorusGeometry(0.33, 0.13, 10, 28);
          d.add(rubber, tire, P(-0.95 + k * 0.63, ly, 0), [0, ry + Math.PI / 2, 0]);
        }
      }
    };
    const pallet = (x: number, z: number, ry: number, drums: number) => {
      const c = Math.cos(ry);
      const sn = Math.sin(ry);
      const P = (lx: number, ly: number, lz: number): V3 => [x + lx * c + lz * sn, ly, z - lx * sn + lz * c];
      d.box(palletMat, [1.2, 0.03, 1.0], P(0, 0.14, 0), [0, ry, 0]);
      for (const lz of [-0.42, 0, 0.42]) d.box(palletMat, [1.2, 0.11, 0.12], P(0, 0.065, lz), [0, ry, 0]);
      for (let i = 0; i < drums; i++) {
        const lx = i % 2 === 0 ? -0.29 : 0.29;
        const lz = i < 2 ? -0.24 : 0.24;
        d.add(i === 0 ? accent : graphite, new THREE.CylinderGeometry(0.28, 0.28, 0.88, 20), P(lx, 0.6, lz));
        d.add(steel, new THREE.TorusGeometry(0.28, 0.012, 6, 24), P(lx, 0.45, lz), [Math.PI / 2, 0, 0]);
        d.add(steel, new THREE.TorusGeometry(0.28, 0.012, 6, 24), P(lx, 0.78, lz), [Math.PI / 2, 0, 0]);
      }
    };
    const ox = W - 1.6;
    cab(ox - 0.4, zB + 0.75, 0);
    cab(ox - 2.15, zB + 0.75, 0, 1.2);
    tireRack(-(W - 0.9), zB + 7.6, Math.PI / 2);
    pallet(ox - 0.6, zB + 2.8, 0.2, 3);
    pallet(ox - 2.2, zB + 3.0, -0.15, 2);
    if (Lh > 60) {
      tireRack(W - 0.9, (dims.zFirst + zB) / 2 - ROW / 2, -Math.PI / 2);
      pallet(-(W - 1.8), (dims.zFirst + zB) / 2 + 2, 0.3, 2);
    }
    // potelets chromés à l'entrée de l'allée (cordon noir entre deux)
    const postsZ = dims.zFirst + 9.5;
    for (const s of [-1, 1]) {
      const xs = [s * (AISLE + 0.2), s * (AISLE + 2.4)];
      for (const x of xs) {
        d.add(chrome, new THREE.CylinderGeometry(0.028, 0.028, 0.92, 12), [x, 0.48, postsZ]);
        d.add(chrome, new THREE.CylinderGeometry(0.17, 0.19, 0.04, 24), [x, 0.02, postsZ]);
        d.add(chrome, new THREE.SphereGeometry(0.045, 12, 8), [x, 0.96, postsZ]);
      }
      d.box(black, [2.2, 0.05, 0.012], [(xs[0] + xs[1]) / 2, 0.86, postsZ]);
    }
    d.build(g).forEach((m) => {
      m.castShadow = false;
    });

    // ------------------------------------------------------------ lumières non directionnelles du hall
    g.traverse((o) => {
      o.matrixAutoUpdate = false;
      o.updateMatrix();
    });
  }

  /** Enseigne : logo en relief lumineux, nom de l'entreprise, sous-titre et halo, au centre du mur du fond. */
  private buildSign(signage: string, dims: HallDims): void {
    const g = this.group;
    const zB = dims.zBack;
    // l'enseigne grandit avec la longueur du hall pour rester lisible au bout de l'allée
    const k = Math.min(1.8, Math.max(1, (dims.zFront - dims.zBack) / 70));
    const y0 = 6.6 + (k - 1) * 1.6;
    const logoMat = this.bank.std({ color: PAINT, emissive: PAINT, emissiveIntensity: 0, roughness: 0.38, metalness: 0.25, fog: false }, 0.9);
    this.rig.bind('sign', (l) => (logoMat.emissiveIntensity = 1.25 * l), this);
    const logo = new THREE.Mesh(logoGeometry(2.3 * k), logoMat);
    logo.position.set(0, y0 + 2.15 * k, zB + 0.62);
    g.add(logo);
    // halo derrière le logo et derrière le nom
    const halo = radialTexture(128);
    this.textures.push(halo);
    const haloMat = this.bank.keep(
      new THREE.MeshBasicMaterial({ map: halo, color: PAINT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    this.rig.bind('sign', (l) => (haloMat.opacity = 0.22 * l), this);
    const hm = new THREE.Mesh(new THREE.PlaneGeometry(7 * k, 5 * k), haloMat);
    hm.position.set(0, y0 + 2.1 * k, zB + 0.48);
    g.add(hm);
    const sign = signageTexture(signage || 'Votre entreprise', 'Parc d’engins · Godet');
    this.textures.push(sign.texture);
    this.signDraw = sign.draw;
    this.signTex = sign.texture;
    const textMat = this.bank.keep(
      new THREE.MeshBasicMaterial({ map: sign.texture, color: CHALK.clone(), transparent: true, depthWrite: false, fog: false }),
    );
    this.rig.bind('sign', (l) => textMat.color.copy(CHALK).multiplyScalar(0.22 + 1.6 * l), this);
    const tw = 12.5 * k;
    const text = new THREE.Mesh(new THREE.PlaneGeometry(tw, tw / sign.aspect), textMat);
    text.position.set(0, y0, zB + 0.62);
    text.renderOrder = 2;
    g.add(text);
    const lineMat = neon(this.bank, this.rig, this, 'sign', AMBER, 2.2);
    this.mats.push(logoMat, haloMat, textMat, lineMat);
    const line = new THREE.Mesh(new THREE.BoxGeometry(5.5 * k, 0.03, 0.03), lineMat);
    line.position.set(0, y0 - 0.95 * k, zB + 0.6);
    g.add(line);
  }

  /** Redessine les textes (police chargée entre-temps). */
  redrawTexts(): void {
    if (this.signDraw && this.signTex) {
      this.signDraw();
      this.signTex.needsUpdate = true;
    }
  }

  dispose(): void {
    this.rig.unbind(this);
    disposeTree(this.group);
    // le reflecteur libère sa cible de rendu (et son matériau, rendu aussi à la banque ci-dessous)
    this.floor.mesh.dispose();
    for (const m of this.mats) this.bank.release(m);
    this.mats = [];
    for (const t of this.textures) t.dispose();
    this.group.removeFromParent();
  }
}
