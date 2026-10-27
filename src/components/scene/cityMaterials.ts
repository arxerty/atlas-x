import * as THREE from 'three';

export interface CityUniforms {
  uPlanetCenter: { value: THREE.Vector3 };
  uTime: { value: number };
}

export function createCityUniforms(): CityUniforms {
  return { uPlanetCenter: { value: new THREE.Vector3() }, uTime: { value: 0 } };
}

const WORLD_VARYINGS = /* glsl */ `
varying vec3 vWinPos;
varying vec3 vWinNormal;
varying vec3 vWorldPosC;
varying float vSeed;
`;

/**
 * Facade shader for instanced buildings: geometry is a unit shape with its base at y=0, so the
 * instance scale is recovered from the matrix to lay windows out in real units per floor.
 * Windows glow mostly on the night side of the planet.
 */
export function createFacadeMaterial(uniforms: CityUniforms, opts: { cylinder?: boolean; floor?: number; glow?: number; roughness?: number; metalness?: number }) {
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.35,
  });
  const floor = (opts.floor ?? 0.1).toFixed(4);
  const glow = (opts.glow ?? 2.0).toFixed(3);
  // the source is generated from opts, so the default (function text) cache key would mix variants up
  mat.customProgramCacheKey = () => `facade:${opts.cylinder ? 1 : 0}:${floor}:${glow}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPlanetCenter = uniforms.uPlanetCenter;
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = WORLD_VARYINGS + shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `#include <begin_vertex>
      vec3 instScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      vWinPos = position * instScale;
      vWinNormal = normal;
      vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vWorldPosC = wp.xyz;
      vSeed = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);`,
    );
    shader.fragmentShader =
      WORLD_VARYINGS +
      /* glsl */ `
      uniform vec3 uPlanetCenter;
      uniform float uTime;
      float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      ` +
      shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          /* glsl */ `#include <color_fragment>
          float vertical = 1.0 - smoothstep(0.6, 0.9, abs(vWinNormal.y));
          float horiz = ${opts.cylinder ? 'atan(vWinPos.z, vWinPos.x + 1e-4) * length(vWinPos.xz)' : 'dot(vWinPos.xz, normalize(vec2(vWinNormal.z, -vWinNormal.x) + 1e-5))'};
          vec2 cellSize = vec2(0.085, ${floor});
          vec2 cell = floor(vec2(horiz, vWinPos.y) / cellSize);
          vec2 f = fract(vec2(horiz, vWinPos.y) / cellSize);
          float win = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.78);
          win *=vertical * step(0.07, vWinPos.y);
          // whole floors tend to be on or off together, like real offices
          float floorOn = step(0.35, hash21(vec2(cell.y, vSeed * 53.0)));
          float lit = step(0.45, hash21(cell + vSeed * 91.0)) * floorOn * (0.55 + 0.45 * hash21(cell * 1.7 + 3.1));
          float warm = hash21(cell.yx + vSeed * 17.0);
          // ground-level ambient occlusion and darker glass
          diffuseColor.rgb *= mix(0.45, 1.0, smoothstep(0.0, 0.3, vWinPos.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.22 + vec3(0.015, 0.02, 0.03), win);`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.12, win);`,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          metalnessFactor = mix(metalnessFactor, 0.85, win);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
          vec3 sunDir = normalize(-uPlanetCenter);
          float nightSide = 1.0 - smoothstep(-0.22, 0.18, dot(normalize(vWorldPosC - uPlanetCenter), sunDir));
          vec3 winColor = mix(vec3(1.0, 0.7, 0.38), vec3(0.62, 0.82, 1.0), step(0.75, warm));
          totalEmissiveRadiance += winColor * win * lit * ${glow} * mix(0.08, 1.0, nightSide);`,
        );
  };
  return mat;
}

/** Pad top with engraved panel lines. */
export function createPadMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: '#30343b', roughness: 0.7, metalness: 0.45 });
  mat.customProgramCacheKey = () => 'pad';
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vPadPos;\nvarying vec3 vPadNormal;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec3 s = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      vPadPos = position * s;
      vPadNormal = normal;`,
    );
    shader.fragmentShader = 'varying vec3 vPadPos;\nvarying vec3 vPadNormal;\n' + shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 g = abs(fract(vPadPos.xz / 0.41) - 0.5);
      float line = 1.0 - smoothstep(0.46, 0.49, max(g.x, g.y));
      float topFace = step(0.9, vPadNormal.y);
      diffuseColor.rgb *= mix(1.0, 1.0 - line * 0.35, topFace);
      // cliff sides darker and rougher
      diffuseColor.rgb *= mix(0.55, 1.0, topFace);`,
    );
  };
  return mat;
}

export function createRoadMaterial(uniforms: CityUniforms) {
  const mat = new THREE.MeshStandardMaterial({ color: '#17191d', roughness: 0.8, metalness: 0.2 });
  mat.customProgramCacheKey = () => 'road';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = 'attribute vec2 aRoad;\nvarying vec2 vRoad;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vRoad = aRoad;`,
    );
    shader.fragmentShader = 'varying vec2 vRoad;\nuniform float uTime;\n' + shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      float across = vRoad.x;
      float edge = smoothstep(0.06, 0.0, abs(across - 0.06)) + smoothstep(0.06, 0.0, abs(across - 0.94));
      float dash = step(0.5, fract(vRoad.y * 2.2)) * smoothstep(0.03, 0.0, abs(across - 0.5));
      float pulse = smoothstep(0.92, 1.0, fract(vRoad.y * 0.12 - uTime * 0.35));
      totalEmissiveRadiance += vec3(0.25, 0.75, 1.0) * edge * (0.9 + pulse * 2.0) + vec3(1.0, 0.8, 0.45) * dash * 0.9;`,
    );
  };
  return mat;
}

/** Ribbon along a polyline on the sphere, with across/along coordinates for the shader. */
export function buildRoadGeometry(roads: { points: THREE.Vector3[] }[], width: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const road: number[] = [];
  const idx: number[] = [];
  let base = 0;
  for (const r of roads) {
    let along = 0;
    for (let i = 0; i < r.points.length; i++) {
      const p = r.points[i];
      const next = r.points[Math.min(i + 1, r.points.length - 1)];
      const prev = r.points[Math.max(i - 1, 0)];
      const fwd = next.clone().sub(prev).normalize();
      const up = p.clone().normalize();
      const side = new THREE.Vector3().crossVectors(fwd, up).normalize().multiplyScalar(width / 2);
      if (i > 0) along += p.distanceTo(r.points[i - 1]);
      for (const s of [-1, 1]) {
        pos.push(p.x + side.x * s, p.y + side.y * s, p.z + side.z * s);
        nor.push(up.x, up.y, up.z);
        road.push(s < 0 ? 0 : 1, along);
      }
      if (i > 0) {
        const a = base + (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    base += r.points.length * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aRoad', new THREE.Float32BufferAttribute(road, 2));
  g.setIndex(idx);
  return g;
}
