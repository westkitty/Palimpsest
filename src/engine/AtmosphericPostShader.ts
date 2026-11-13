import * as THREE from 'three';

export interface AtmosphericPostUniforms {
  [uniform: string]: THREE.IUniform;
  tDiffuse: THREE.IUniform<THREE.Texture | null>;
  uTime: THREE.IUniform<number>;
  uResolution: THREE.IUniform<THREE.Vector2>;
  uSunScreenPos: THREE.IUniform<THREE.Vector2>;
  uSunVisible: THREE.IUniform<number>;
  uSunsetStrength: THREE.IUniform<number>;
  uHeatHaze: THREE.IUniform<number>;
  uSnowStrength: THREE.IUniform<number>;
  uWind: THREE.IUniform<number>;
  uDaylight: THREE.IUniform<number>;
  uLightning: THREE.IUniform<number>;
  uReducedMotion: THREE.IUniform<number>;
  uQuality: THREE.IUniform<number>;
}

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
    uSunScreenPos: { value: new THREE.Vector2(0.5, 0.78) },
    uSunVisible: { value: 0 },
    uSunsetStrength: { value: 0 },
    uHeatHaze: { value: 0 },
    uSnowStrength: { value: 0 },
    uWind: { value: -0.2 },
    uDaylight: { value: 1 },
    uLightning: { value: 0 },
    uReducedMotion: { value: 0 },
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
    uniform vec2 uSunScreenPos;
    uniform float uSunVisible;
    uniform float uSunsetStrength;
    uniform float uHeatHaze;
    uniform float uSnowStrength;
    uniform float uWind;
    uniform float uDaylight;
    uniform float uLightning;
    uniform float uReducedMotion;
    uniform float uQuality;

    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash12(i);
      float b = hash12(i + vec2(1.0, 0.0));
      float c = hash12(i + vec2(0.0, 1.0));
      float d = hash12(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Faceted origami / deckle-edged paper snowflake SDF with paper-grain shading
    vec2 paperFlakeLayer(
      vec2 uv,
      float aspect,
      float scale,
      float fallSpeed,
      float windBias,
      float t,
      float seedOffset
    ) {
      vec2 st = vec2(uv.x * aspect, uv.y) * scale;
      // Lateral wind drift + gentle leaf-like flutter
      st.x -= t * windBias * 0.9 + sin(st.y * 0.7 + t * 1.3 + seedOffset) * 0.24;
      st.y += t * fallSpeed;

      vec2 cell = floor(st);
      vec2 f = fract(st) - 0.5;

      vec2 rnd = hash22(cell + seedOffset);
      float rnd3 = hash12(cell * 1.73 + seedOffset + 9.1);

      // Sparsity per cell so snowflakes remain crisp cutouts
      if (rnd.x > 0.34) {
        return vec2(0.0);
      }

      vec2 center = (rnd - 0.5) * 0.52;
      vec2 p = f - center;

      // Rotate & tumble like a miniature cut-paper scrap
      float angle = t * (0.9 + rnd3 * 1.8) * (rnd.y > 0.5 ? 1.0 : -1.0) + rnd.y * 6.2831;
      float c = cos(angle);
      float s = sin(angle);
      vec2 rp = mat2(c, -s, s, c) * p;
      // Apparent 3D foreshortening tilt as paper turns in air
      float tilt = 0.58 + 0.42 * cos(t * (1.4 + rnd3) + rnd.x * 12.0);
      rp.x /= tilt;

      float size = mix(0.075, 0.145, rnd3);

      // Six-pointed origami star cutout: intersection of two hex diamonds
      vec2 ap = abs(rp);
      float hexA = max(ap.x * 0.866025 + ap.y * 0.5, ap.y);
      vec2 rpRot = mat2(0.866025, -0.5, 0.5, 0.866025) * rp;
      vec2 apB = abs(rpRot);
      float hexB = max(apB.x * 0.866025 + apB.y * 0.5, apB.y);
      float starDist = min(hexA, hexB);

      // Subtle deckle irregularity & crisp paper edge
      float edgeJitter = (valueNoise(rp * 34.0 + cell * 7.0) - 0.5) * 0.014;
      float alpha = 1.0 - smoothstep(size - 0.012, size + 0.008, starDist + edgeJitter);

      if (alpha <= 0.001) {
        return vec2(0.0);
      }

      // Internal origami crease + parchment fiber grain texture
      float fiber = valueNoise(rp * 65.0 + cell * 13.7);
      float crease = smoothstep(0.0, size * 0.9, abs(rp.x) + abs(rp.y) * 0.25);
      float paperShade = 0.72 + 0.18 * fiber + 0.1 * (1.0 - crease);
      return vec2(alpha, paperShade);
    }

    void main() {
      float motionScale = mix(1.0, 0.25, uReducedMotion);
      float animTime = uTime * motionScale;
      float aspect = uResolution.x / max(1.0, uResolution.y);

      // 1. Desert & Geothermal Heat Haze UV Refraction
      vec2 sampleUv = vUv;
      vec3 col;
      float haze = clamp(uHeatHaze, 0.0, 1.0);
      if (haze > 0.004) {
        vec2 plumeUv = vec2(vUv.x * aspect * 4.2, vUv.y * 6.5 - animTime * 1.85);
        float n1 = valueNoise(plumeUv);
        float n2 = valueNoise(plumeUv * 2.15 + vec2(3.7, -animTime * 1.1));
        float waveX = sin(vUv.y * 44.0 - animTime * 5.2 + n1 * 5.0);
        float waveY = cos(vUv.x * 36.0 + animTime * 3.8 + n2 * 4.5);

        // Concentrate shimmer across diorama table & rising air, fade smoothly at viewport edges
        float regionMask = smoothstep(0.02, 0.22, vUv.y) * (1.0 - smoothstep(0.55, 0.95, vUv.y));
        float edgeSafe = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float amp = haze * regionMask * edgeSafe * 0.0036;

        vec2 offset = vec2(waveX * 0.85 + (n1 - 0.5) * 0.7, waveY * 0.45 + (n2 - 0.5) * 0.4) * amp;
        sampleUv = clamp(vUv + offset, vec2(0.002), vec2(0.998));

        // Subtle optical dispersion along hot air ridges
        float disp = amp * 0.24;
        float r = texture2D(tDiffuse, clamp(sampleUv + vec2(disp, 0.0), vec2(0.002), vec2(0.998))).r;
        float g = texture2D(tDiffuse, sampleUv).g;
        float b = texture2D(tDiffuse, clamp(sampleUv - vec2(disp, 0.0), vec2(0.002), vec2(0.998))).b;
        col = vec3(r, g, b);
        // Gentle warm mirage sheen
        col += vec3(0.04, 0.022, 0.006) * haze * regionMask * (0.4 + 0.6 * n1);
      } else {
        col = texture2D(tDiffuse, sampleUv).rgb;
      }

      // 2. Volumetric Sunset / Sunrise Crepuscular Light Shafts
      float shaftPower = uSunsetStrength * uSunVisible;
      if (shaftPower > 0.004) {
        const int NUM_SAMPLES = 16;
        vec2 deltaUv = (sampleUv - uSunScreenPos) * (0.88 / float(NUM_SAMPLES));
        vec2 rayUv = sampleUv;
        float illuminationDecay = 1.0;
        vec3 accumRays = vec3(0.0);

        for (int i = 0; i < NUM_SAMPLES; i++) {
          rayUv -= deltaUv;
          vec2 clampedUv = clamp(rayUv, vec2(0.002), vec2(0.998));
          vec3 s = texture2D(tDiffuse, clampedUv).rgb;
          float luma = dot(s, vec3(0.299, 0.587, 0.114));
          // Keep bright celestial/sky energy while solid paper mountains/buildings cast shafts
          float mask = smoothstep(0.14, 0.78, luma);
          accumRays += s * mask * illuminationDecay;
          illuminationDecay *= 0.91;
        }

        accumRays /= float(NUM_SAMPLES);

        float distToSun = length((sampleUv - uSunScreenPos) * vec2(aspect, 1.0));
        float corona = exp(-distToSun * 2.1);
        float beamAngle = atan(sampleUv.y - uSunScreenPos.y, (sampleUv.x - uSunScreenPos.x) * aspect);
        float rayStriations = 0.84 + 0.16 * sin(beamAngle * 14.0 + animTime * 0.45);

        vec3 sunsetTint = mix(vec3(1.0, 0.62, 0.28), vec3(1.0, 0.84, 0.55), corona);
        vec3 shaftContribution =
          (accumRays * 0.62 + sunsetTint * corona * 0.22) *
          sunsetTint *
          shaftPower *
          rayStriations;

        col += shaftContribution * mix(0.65, 1.0, uQuality);
      }

      // 3. Falling Paper-Textured Snow (multi-layer origami flakes)
      float snow = clamp(uSnowStrength, 0.0, 1.0);
      if (snow > 0.004) {
        vec2 flakeA = paperFlakeLayer(vUv, aspect, 8.5, 0.42, uWind, animTime, 11.3);
        vec2 flakeB = paperFlakeLayer(vUv, aspect, 14.0, 0.30, uWind * 0.85, animTime, 37.9);
        vec2 flakeC = uQuality > 0.6
          ? paperFlakeLayer(vUv, aspect, 21.5, 0.21, uWind * 0.7, animTime, 73.1)
          : vec2(0.0);

        float snowEnv = snow;
        vec3 paperBright = mix(
          vec3(0.70, 0.82, 0.96),
          vec3(0.99, 0.96, 0.90),
          uDaylight * 0.7 + uLightning * 0.3
        );
        // Subtle sunset rose catchlight on falling paper flakes
        paperBright = mix(paperBright, vec3(1.0, 0.84, 0.68), clamp(uSunsetStrength * 0.45, 0.0, 0.45));

        float a1 = flakeA.x * snowEnv * 0.88;
        float a2 = flakeB.x * snowEnv * 0.65;
        float a3 = flakeC.x * snowEnv * 0.44;

        col = mix(col, paperBright * flakeA.y, a1);
        col = mix(col, paperBright * flakeB.y, a2);
        col = mix(col, paperBright * flakeC.y, a3);
      }

      // 4. Subtle thunderstorm flash wash
      if (uLightning > 0.01) {
        col += vec3(0.20, 0.26, 0.38) * uLightning * 0.32;
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
