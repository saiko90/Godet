// Post-traitement : rendu de la scène en demi-flottant, nettoyage de l'image, halo lumineux, sortie
// (tonalité ACES et sRGB).
//
// CORRECTIF À CONSERVER (« grands blocs noirs » sur le Chrome du client) : une valeur infinie ou invalide (NaN)
// dans la cible demi-flottante se propageait dans le flou du halo (UnrealBloomPass) et noircissait de grands
// blocs de l'écran. La passe SanitizeShader, placée entre RenderPass et UnrealBloomPass, borne chaque canal et
// remplace les NaN par 0. Les matériaux gardent aussi une rugosité minimale et les lumières ne touchent jamais
// les surfaces (voir materials.ts et lights.ts).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export const SanitizeShader = {
  name: 'SanitizeShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uMax: { value: 24.0 },
    uVignette: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uMax;
    uniform float uVignette;
    varying vec2 vUv;
    // NaN → 0 ; +Inf et valeurs extrêmes → uMax ; négatifs → 0.
    float safe( float x ) {
      return ( isnan( x ) || !( x == x ) ) ? 0.0 : clamp( x, 0.0, uMax );
    }
    void main() {
      vec4 c = texture2D( tDiffuse, vUv );
      vec3 col = vec3( safe( c.r ), safe( c.g ), safe( c.b ) );
      vec2 d = vUv - 0.5;
      col *= clamp( 1.0 - uVignette * dot( d, d ) * 2.2, 0.0, 1.0 );
      gl_FragColor = vec4( col, 1.0 );
    }`,
};

export class Post {
  readonly composer: EffectComposer;
  private renderPass: RenderPass;
  private sanitize: ShaderPass;
  readonly bloom: UnrealBloomPass;
  private output: OutputPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    w: number,
    h: number,
    pr: number,
    samples: number,
    strength: number,
  ) {
    const rt = new THREE.WebGLRenderTarget(Math.max(1, Math.round(w * pr)), Math.max(1, Math.round(h * pr)), {
      type: THREE.HalfFloatType,
    });
    rt.texture.name = 'Godet.post';
    this.composer = new EffectComposer(renderer, rt);
    // la scène est rendue dans la seconde cible (readBuffer) : elle seule a besoin de l'anticrénelage
    this.composer.renderTarget2.samples = samples;
    this.composer.renderTarget2.texture.name = 'Godet.scene';
    this.renderPass = new RenderPass(scene, camera);
    this.sanitize = new ShaderPass(SanitizeShader);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), strength, 0.55, 0.9);
    this.output = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.sanitize);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.output);
    this.setSize(w, h, pr);
  }

  setSize(w: number, h: number, pr: number): void {
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
  }

  setBloom(strength: number): void {
    this.bloom.strength = strength;
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    this.renderPass.dispose();
    this.sanitize.dispose();
    this.bloom.dispose();
    this.output.dispose();
    this.composer.dispose();
    this.composer.renderTarget1.dispose();
    this.composer.renderTarget2.dispose();
  }
}
