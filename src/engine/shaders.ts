import * as THREE from 'three';

/**
 * Custom GLSL Painterly & Atmospheric Sky Dome Shader
 * Supports Rayleigh-inspired horizon glow, twinkling starfield, drifting cloud wisps,
 * and animated Van Gogh-style luminous swirls.
 */
export function createPainterlySkyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color('#09142E') },
      uHorizonColor: { value: new THREE.Color('#2B568A') },
      uSunDir: { value: new THREE.Vector3(0.4, 0.25, -0.85).normalize() },
      uSunColor: { value: new THREE.Color('#FFD082') },
      uStarIntensity: { value: 0.7 },
      uSwirlIntensity: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uStarIntensity;
      uniform float uSwirlIntensity;
      varying vec3 vWorldDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.04 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);

        // Smooth atmospheric gradient
        vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.58));

        // Spherical UV for painterly clouds & swirls
        vec2 skyUv = vec2(atan(dir.x, dir.z) * 1.4, dir.y * 3.8);

        // Soft drifting clouds
        float cloud = fbm(skyUv * 1.8 + vec2(uTime * 0.015, 0.0));
        col += mix(uHorizonColor, vec3(0.92, 0.94, 1.0), 0.35) * smoothstep(0.45, 0.85, cloud) * 0.22 * smoothstep(0.02, 0.35, h);

        // Van Gogh-inspired swirling luminous currents
        if (uSwirlIntensity > 0.01 && h > 0.03) {
          vec2 p = skyUv * 1.4;
          float angle = fbm(p + uTime * 0.025) * 6.2831;
          vec2 warped = p + vec2(cos(angle), sin(angle)) * 0.42;
          float bands = sin((warped.x * 7.0 + warped.y * 4.5) + uTime * 0.18);
          float swirlMask = smoothstep(0.25, 0.92, bands * 0.5 + 0.5) * smoothstep(0.03, 0.25, h) * (1.0 - smoothstep(0.75, 1.0, h));
          vec3 swirlTint = mix(uHorizonColor * 1.45, vec3(0.55, 0.82, 1.0), 0.45);
          col = mix(col, swirlTint, swirlMask * 0.32 * uSwirlIntensity);
        }

        // Sun / Moon disc and halo
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float halo = pow(sunDot, 14.0) * 0.42 + pow(sunDot, 180.0) * 1.35;
        col += uSunColor * halo;

        // Crisp twinkling stars & painterly star halos
        if (uStarIntensity > 0.02 && h > 0.06) {
          vec2 starGrid = floor(vec2(atan(dir.x, dir.z) * 42.0, asin(clamp(dir.y, -1.0, 1.0)) * 42.0));
          float rnd = hash(starGrid);
          if (rnd > 0.972) {
            vec2 cellUv = fract(vec2(atan(dir.x, dir.z) * 42.0, asin(clamp(dir.y, -1.0, 1.0)) * 42.0)) - 0.5;
            float d = length(cellUv);
            float twinkle = 0.65 + 0.35 * sin(uTime * (2.0 + rnd * 4.0) + rnd * 50.0);
            float core = smoothstep(0.18, 0.0, d) * twinkle;
            float starHalo = smoothstep(0.45, 0.05, d) * 0.35 * uSwirlIntensity;
            vec3 starColor = mix(vec3(1.0, 0.94, 0.72), vec3(0.78, 0.88, 1.0), fract(rnd * 19.7));
            col += starColor * (core + starHalo) * uStarIntensity * smoothstep(0.06, 0.24, h);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/**
 * Custom GLSL Animated Reflective Water Shader
 */
export function createStylizedWaterMaterial(deepHex = '#112945', shallowHex = '#32729E'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(deepHex) },
      uShallowColor: { value: new THREE.Color(shallowHex) },
      uSkyColor: { value: new THREE.Color('#6FA4D8') },
      uSunDir: { value: new THREE.Vector3(0.4, 0.35, -0.85).normalize() },
      uSunColor: { value: new THREE.Color('#FFD28A') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 0.22 + uTime * 1.4) * 0.12 + cos(pos.y * 0.18 - uTime * 1.1) * 0.1;
        pos.z += wave;
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSkyColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vec2 p = vWorldPos.xz * 0.28;
        float r1 = sin(p.x * 1.7 + uTime * 1.2) * cos(p.y * 1.4 - uTime * 0.9);
        float r2 = sin((p.x - p.y) * 2.5 - uTime * 1.7) * 0.5;
        vec3 normal = normalize(vec3((r1 + r2) * 0.16, 1.0, (r1 - r2) * 0.16));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        vec3 waterCol = mix(uDeepColor, uShallowColor, 0.35 + 0.25 * r1);
        waterCol = mix(waterCol, uSkyColor, clamp(fresnel * 0.72, 0.0, 0.82));

        vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 96.0);
        waterCol += uSunColor * spec * 1.45;

        gl_FragColor = vec4(waterCol, 0.86);
      }
    `,
  });
}
