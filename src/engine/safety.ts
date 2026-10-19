// Garde-fou global contre les « blocs noirs » (bug vu sur le Chrome du client).
// Une lumière très proche d'une surface ou une addition de halos peut dépasser la limite des cibles HalfFloat
// (65’504) : la valeur devient infinie, puis invalide (NaN) une fois moyennée dans les mipmaps du reflet ou
// dans le flou du bloom. On borne donc la sortie de tous les matériaux three.js avant qu'elle soit écrite.
// La passe SanitizeShader (post.ts) reste en place pour l'image finale.
import * as THREE from 'three';

const MARKER = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );';
let patched = false;

/** À appeler avant la première compilation de matériau (idempotent). */
export function patchShaderChunks(): void {
  if (patched) return;
  patched = true;
  const chunk = THREE.ShaderChunk.opaque_fragment;
  if (!chunk.includes(MARKER)) return;
  THREE.ShaderChunk.opaque_fragment = chunk.replace(
    MARKER,
    [
      '// Godet : jamais de NaN ni d’infini dans les cibles de rendu',
      'outgoingLight = ( any( isnan( outgoingLight ) ) || any( isinf( outgoingLight ) ) ) ? vec3( 0.0 ) : outgoingLight;',
      'outgoingLight = min( max( outgoingLight, vec3( 0.0 ) ), vec3( 256.0 ) );',
      MARKER,
    ].join('\n'),
  );
}
