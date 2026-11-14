import * as THREE from 'three';

export interface AtmosphericPostUniforms {
  [uniform: string]: THREE.IUniform;
  tDiffuse: THREE.IUniform<THREE.Texture | null>;
  uTime: THREE.IUniform<number>;
  uResolution: THREE.IUniform<THREE.Vector2>;
  uBookOpen: THREE.IUniform<number>;
  uReducedMotion: THREE.IUniform<number>;
  uNoFlash: THREE.IUniform<number>;
  uQuality: THREE.IUniform<number>;
}

/**
 * Restrained 1954-61 classroom optical film finish:
 * subtle gate vignette, soft archival dust specks, and gentle projector registration stability.
 * Honors Reduced Motion and No-Flash settings by disabling all temporal shimmer cleanly.
 */
export const AtmosphericPostShader: {
  name: string;
  uniforms: AtmosphericPostUniforms;
  vertexShader: string;
  fragmentShader: string;
} = {
  name: 'AtmosphericPostShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uBookOpen: { value: 0 },
    uReducedMotion: { value: 0 },
    uNoFlash: { value: 0 },
    uQuality: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uBookOpen;
    uniform float uReducedMotion;
    uniform float uNoFlash;
    uniform float uQuality;

    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      float still = max(uReducedMotion, uNoFlash);
      float motionScale = mix(1.0, 0.0, still);

      // Microscopic film-gate steadiness drift (zeroed when Reduced Motion or No-Flash active)
      vec2 gateDrift = vec2(
        sin(uTime * 1.9) * 0.00025,
        cos(uTime * 2.7) * 0.0003
      ) * motionScale * uBookOpen;

      vec2 uv = clamp(vUv + gateDrift, vec2(0.001), vec2(0.999));
      vec3 col = texture2D(tDiffuse, uv).rgb;

      // Subtle warm classroom lamp falloff vignette (softly frames the slate desk)
      vec2 centered = (vUv - 0.5) * vec2(uResolution.x / max(1.0, uResolution.y), 1.0);
      float rad = length(centered);
      float vig = 1.0 - smoothstep(0.58, 1.18, rad) * 0.24;
      col *= vig;

      // Subtle static silver-halide emulsion grain (non-strobing when No-Flash enabled)
      float grainPhase = still > 0.5 ? 1.0 : floor(uTime * 12.0);
      float grain = (hash12(vUv * 620.0 + grainPhase) - 0.5) * 0.018 * mix(0.6, 1.0, uQuality);
      col += grain;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};
