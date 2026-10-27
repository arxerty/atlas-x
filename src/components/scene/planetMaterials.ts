import * as THREE from 'three';
import { NOISE_GLSL } from './shaders';
import { PlanetData } from '../../system/types';
import { hashString } from '../../system/classify';

const BIOME_PARAMS: Record<PlanetData['biome'], { ice: number; emissive: number; freq: number; craters: number; clouds: number }> = {
  terran: { ice: 1, emissive: 0, freq: 1.5, craters: 0, clouds: 0.55 },
  ocean: { ice: 0.7, emissive: 0, freq: 1.3, craters: 0, clouds: 0.62 },
  desert: { ice: 0.25, emissive: 0, freq: 1.9, craters: 0.3, clouds: 0.12 },
  ice: { ice: 1, emissive: 0, freq: 1.7, craters: 0, clouds: 0.3 },
  lava: { ice: 0, emissive: 1.6, freq: 2.0, craters: 0.2, clouds: 0.0 },
  toxic: { ice: 0, emissive: 0.35, freq: 1.6, craters: 0, clouds: 0.5 },
  rocky: { ice: 0.15, emissive: 0, freq: 2.2, craters: 1, clouds: 0.0 },
};

export function cloudCoverage(p: PlanetData) {
  return BIOME_PARAMS[p.biome].clouds;
}

const surfaceVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vWorld;
void main() {
  vObj = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const surfaceFragment = /* glsl */ `
uniform vec3 uDeep, uShallow, uLow, uHigh, uPeak, uAtmo, uEmissive;
uniform float uSea, uSeed, uIce, uEmissiveStrength, uFreq, uCraters, uTime;
uniform mat3 uRot;
uniform vec3 uCenter;
varying vec3 vObj;
varying vec3 vWorld;
${NOISE_GLSL}

float heightAt(vec3 p) {
  float h = fbm(p * uFreq + uSeed, 6) * 0.5 + 0.5;
  h = clamp(h * 1.3 - 0.15, 0.0, 1.0);
  if (uCraters > 0.0) {
    // round basins with raised rims
    float c = snoise(p * 4.5 + uSeed * 1.7) * 0.7 + snoise(p * 11.0 - uSeed) * 0.3;
    float bowl = smoothstep(0.42, 0.62, c);
    float rim = smoothstep(0.32, 0.42, c) * (1.0 - smoothstep(0.42, 0.5, c));
    h += (rim * 0.05 - bowl * 0.09) * uCraters;
  }
  return h;
}

void main() {
  vec3 p = normalize(vObj);
  float h = heightAt(p);
  float detail = fbm(p * 11.0 + uSeed * 3.1, 4);

  vec3 col;
  float spec = 0.0;
  bool water = h < uSea;
  if (water) {
    float t = h / max(uSea, 0.001);
    col = mix(uDeep, uShallow, smoothstep(0.45, 1.0, t));
    spec = 1.0;
  } else {
    float t = (h - uSea) / max(1.0 - uSea, 0.001);
    col = mix(uLow, uHigh, smoothstep(0.0, 0.55, t + detail * 0.18));
    col = mix(col, uPeak, smoothstep(0.55, 0.92, t + detail * 0.12));
    col *= 0.88 + detail * 0.22;
  }

  float lat = abs(p.y);
  float cap = smoothstep(0.8, 0.9, lat + detail * 0.06) * uIce;
  col = mix(col, vec3(0.9, 0.94, 0.98), cap);
  if (water && cap > 0.5) spec = 0.3;

  // bump from height gradient (land only)
  vec3 n = p;
  if (!water) {
    vec3 t1 = normalize(cross(abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0), p));
    vec3 t2 = cross(p, t1);
    float e = 0.004;
    float hx = heightAt(normalize(p + t1 * e)) - h;
    float hy = heightAt(normalize(p + t2 * e)) - h;
    n = normalize(p - (t1 * hx + t2 * hy) * 32.0);
  }

  vec3 N = normalize(uRot * n);
  vec3 Ngeo = normalize(vWorld - uCenter);
  vec3 L = normalize(-vWorld);
  vec3 V = normalize(cameraPosition - vWorld);
  float ndl = dot(N, L);
  float geoNdl = dot(Ngeo, L);
  float diff = clamp(ndl, 0.0, 1.0) * smoothstep(-0.05, 0.12, geoNdl);

  vec3 H = normalize(L + V);
  float sp = pow(max(dot(Ngeo, H), 0.0), 70.0) * spec * 0.9 * smoothstep(0.0, 0.1, geoNdl);

  vec3 lit = col * (diff * 1.35 + 0.018) + sp * vec3(1.0, 0.94, 0.82);
  float term = smoothstep(-0.05, 0.12, geoNdl) * (1.0 - smoothstep(0.12, 0.35, geoNdl));
  lit += col * term * vec3(0.35, 0.12, 0.02) * 0.35;

  float fres = pow(1.0 - max(dot(Ngeo, V), 0.0), 3.0);
  lit += uAtmo * fres * 0.45 * smoothstep(-0.2, 0.4, geoNdl);

  if (uEmissiveStrength > 0.0) {
    float cracks = smoothstep(0.82, 0.97, ridged(p * 3.5 + uSeed));
    float pulse = 0.85 + 0.15 * sin(uTime * 1.3 + detail * 6.0);
    float sea = water ? 1.0 : 0.0;
    vec3 glow = uEmissive * (sea * 0.8 + cracks * (1.0 - sea) * 0.7) * pulse * uEmissiveStrength;
    lit += glow * (1.0 - diff * 0.55);
  }

  gl_FragColor = vec4(lit, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createSurfaceMaterial(p: PlanetData) {
  const params = BIOME_PARAMS[p.biome];
  const pal = p.palette;
  return new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    uniforms: {
      uDeep: { value: new THREE.Color(pal.deep) },
      uShallow: { value: new THREE.Color(pal.shallow) },
      uLow: { value: new THREE.Color(pal.low) },
      uHigh: { value: new THREE.Color(pal.high) },
      uPeak: { value: new THREE.Color(pal.peak) },
      uAtmo: { value: new THREE.Color(pal.atmosphere) },
      uEmissive: { value: new THREE.Color(pal.emissive) },
      uSea: { value: pal.seaLevel },
      uSeed: { value: (hashString(p.id) % 1000) / 37 },
      uIce: { value: params.ice },
      uEmissiveStrength: { value: params.emissive },
      uFreq: { value: params.freq },
      uCraters: { value: params.craters },
      uTime: { value: 0 },
      uRot: { value: new THREE.Matrix3() },
      uCenter: { value: new THREE.Vector3() },
    },
  });
}

const shellVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vWorld;
void main() {
  vObj = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const cloudFragment = /* glsl */ `
uniform float uSeed, uTime, uCoverage, uFade;
uniform vec3 uCenter;
uniform vec4 uClear[24];
uniform int uClearCount;
uniform mat3 uInvRot;
varying vec3 vObj;
varying vec3 vWorld;
${NOISE_GLSL}
void main() {
  vec3 p = normalize(vObj);
  vec3 q = p * 2.2 + vec3(uSeed, uSeed * 0.5, uTime * 0.01);
  vec3 warp = vec3(fbm(q, 3), fbm(q + 4.7, 3), fbm(q + 9.1, 3));
  float c = fbm(q * 1.6 + warp * 1.4, 5) * 0.5 + 0.5;
  float d = smoothstep(1.0 - uCoverage, 1.0 - uCoverage + 0.28, c);

  // keep the sky above every city clear
  vec3 lp = normalize(uInvRot * (vWorld - uCenter));
  for (int i = 0; i < 24; i++) {
    if (i >= uClearCount) break;
    float k = dot(lp, uClear[i].xyz);
    d *= 1.0 - smoothstep(uClear[i].w - 0.04, uClear[i].w + 0.02, k);
  }

  vec3 N = normalize(vWorld - uCenter);
  vec3 L = normalize(-vWorld);
  float ndl = dot(N, L);
  float light = smoothstep(-0.12, 0.35, ndl);
  vec3 col = mix(vec3(0.015, 0.02, 0.03), vec3(1.0, 0.98, 0.95), light);
  col = mix(col, vec3(1.0, 0.6, 0.4), smoothstep(-0.1, 0.12, ndl) * (1.0 - smoothstep(0.12, 0.3, ndl)) * 0.5);
  gl_FragColor = vec4(col * 1.1, d * 0.9 * uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createCloudMaterial(p: PlanetData) {
  const clear = p.districts.slice(0, 24).map((d) => {
    const ang = Math.min(1.2, (d.padRadius + 0.9) / p.radius);
    return new THREE.Vector4(d.normal.x, d.normal.y, d.normal.z, Math.cos(ang));
  });
  while (clear.length < 24) clear.push(new THREE.Vector4(0, 0, 0, 2));
  return new THREE.ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: cloudFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSeed: { value: (hashString(p.id + 'c') % 1000) / 53 },
      uTime: { value: 0 },
      uCoverage: { value: cloudCoverage(p) },
      uFade: { value: 1 },
      uCenter: { value: new THREE.Vector3() },
      uClear: { value: clear },
      uClearCount: { value: Math.min(24, p.districts.length) },
      uInvRot: { value: new THREE.Matrix3() },
    },
  });
}

const atmoFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uCenter;
uniform float uStrength;
uniform float uRadius;
uniform float uOuter;
varying vec3 vWorld;
void main() {
  // closest approach of the view ray to the planet centre decides the optical depth
  vec3 rd = normalize(vWorld - cameraPosition);
  vec3 oc = uCenter - cameraPosition;
  float tca = max(dot(oc, rd), 0.0);
  vec3 closest = cameraPosition + rd * tca;
  float d = length(closest - uCenter);
  float h = clamp((d - uRadius) / (uOuter - uRadius), 0.0, 1.0);
  float glow = exp(-h * 6.0) * (1.0 - h);
  vec3 N = normalize(closest - uCenter + 1e-4);
  vec3 L = normalize(-uCenter);
  float day = smoothstep(-0.25, 0.5, dot(N, L));
  float forward = pow(max(dot(rd, L), 0.0), 8.0);
  vec3 col = uColor * glow * (day * 1.5 + forward * 0.8 + 0.02);
  gl_FragColor = vec4(col * uStrength, 1.0);
}
`;

export function atmosphereRadius(p: PlanetData) {
  return p.radius * 1.12 + 0.8;
}

export function createAtmosphereMaterial(p: PlanetData) {
  return new THREE.ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: atmoFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(p.palette.atmosphere) },
      uCenter: { value: new THREE.Vector3() },
      uRadius: { value: p.radius },
      uOuter: { value: atmosphereRadius(p) },
      uStrength: { value: p.biome === 'rocky' ? 0.35 : p.biome === 'desert' ? 0.7 : 1.0 },
    },
  });
}

const ringVertex = /* glsl */ `
varying float vR;
varying vec3 vWorld;
void main() {
  vR = length(position.xy);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const ringFragment = /* glsl */ `
uniform float uInner, uOuter, uSeed;
uniform vec3 uColor;
uniform vec3 uCenter;
uniform float uPlanetRadius;
varying float vR;
varying vec3 vWorld;
${NOISE_GLSL}
void main() {
  float t = (vR - uInner) / (uOuter - uInner);
  float bands = snoise(vec3(t * 18.0, uSeed, 0.0)) * 0.5 + 0.5;
  bands = mix(bands, snoise(vec3(t * 70.0, uSeed * 2.0, 1.0)) * 0.5 + 0.5, 0.35);
  float edge = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.85, t);
  float a = edge * (0.25 + bands * 0.6);
  a *= 1.0 - smoothstep(0.42, 0.46, t) * smoothstep(0.52, 0.48, t) * 0.85; // gap

  // planet shadow on the ring
  vec3 L = normalize(-uCenter);
  vec3 rel = vWorld - uCenter;
  float along = dot(rel, -L);
  float perp = length(rel + L * along);
  float shadow = (along > 0.0 && perp < uPlanetRadius) ? 0.12 : 1.0;

  vec3 col = uColor * (0.55 + bands * 0.6) * shadow;
  gl_FragColor = vec4(col, a * 0.75);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createRingMaterial(p: PlanetData, inner: number, outer: number) {
  const tint = new THREE.Color(p.palette.peak).lerp(new THREE.Color(p.palette.high), 0.5);
  return new THREE.ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uSeed: { value: (hashString(p.id + 'r') % 1000) / 71 },
      uColor: { value: tint },
      uCenter: { value: new THREE.Vector3() },
      uPlanetRadius: { value: p.radius },
    },
  });
}
