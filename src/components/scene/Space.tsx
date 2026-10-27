import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { NOISE_GLSL } from './shaders';
import { getGlowTexture } from './geometries';
import { SUN_RADIUS } from '../../system/layout';
import { PlanetData } from '../../system/types';
import { planetPosition, sim } from '../../system/sim';
import { useSystemStore } from '../../stores/useSystemStore';
import { seededRandom } from '../../system/classify';

const sunVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vObj = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const sunFragment = /* glsl */ `
uniform float uTime;
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vWorld;
${NOISE_GLSL}
void main() {
  vec3 p = normalize(vObj);
  float gran = fbm(p * 7.0 + vec3(0.0, uTime * 0.03, 0.0), 5) * 0.5 + 0.5;
  float flow = fbm(p * 2.2 - vec3(uTime * 0.01), 3) * 0.5 + 0.5;
  float spots = smoothstep(0.72, 0.8, fbm(p * 3.0 + 13.0, 3) * 0.5 + 0.5);
  vec3 V = normalize(cameraPosition - vWorld);
  float mu = max(dot(normalize(vNormalW), V), 0.0);
  float limb = pow(mu, 0.45);
  vec3 hot = vec3(1.0, 0.92, 0.75);
  vec3 warm = vec3(1.0, 0.55, 0.18);
  vec3 col = mix(warm, hot, gran * 0.7 + flow * 0.3);
  col *= mix(0.55, 1.0, limb);
  col *= 1.0 - spots * 0.55;
  gl_FragColor = vec4(col * 3.2, 1.0);
}
`;

export const Sun: React.FC = () => {
  const overview = useSystemStore((s) => s.overview);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: sunVertex, fragmentShader: sunFragment, uniforms: { uTime: { value: 0 } }, toneMapped: false }),
    [],
  );
  const corona = useMemo(
    () => new THREE.SpriteMaterial({ map: getGlowTexture(), color: new THREE.Color(2.2, 1.2, 0.55), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
    [],
  );
  const halo = useMemo(
    () => new THREE.SpriteMaterial({ map: getGlowTexture(), color: new THREE.Color(0.7, 0.32, 0.12), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, toneMapped: false }),
    [],
  );
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <group>
      <mesh
        material={mat}
        onClick={(e) => {
          if (e.delta > 4) return;
          e.stopPropagation();
          overview();
        }}
      >
        <sphereGeometry args={[SUN_RADIUS, 96, 64]} />
      </mesh>
      <sprite material={corona} scale={SUN_RADIUS * 4.2} raycast={() => null} />
      <sprite material={halo} scale={SUN_RADIUS * 11} raycast={() => null} />
      <pointLight position={[0, 0, 0]} intensity={3.2} decay={0} distance={0} color="#fff3e0" />
      <ambientLight intensity={0.05} color="#8aa0c8" />
    </group>
  );
};

const nebulaFragment = /* glsl */ `
varying vec3 vObj;
${NOISE_GLSL}
void main() {
  vec3 p = normalize(vObj);
  float band = exp(-pow(p.y * 3.2 + snoise(p * 2.0) * 0.4, 2.0));
  float n = fbm(p * 3.0 + 7.0, 5) * 0.5 + 0.5;
  float n2 = fbm(p * 6.0 - 3.0, 4) * 0.5 + 0.5;
  vec3 a = vec3(0.10, 0.06, 0.16);
  vec3 b = vec3(0.04, 0.09, 0.14);
  vec3 c = vec3(0.16, 0.08, 0.05);
  vec3 col = mix(a, b, n) * smoothstep(0.35, 0.85, n) * band;
  col += c * smoothstep(0.6, 0.9, n2) * band * 0.6;
  col += vec3(0.012, 0.014, 0.022);
  gl_FragColor = vec4(col * 0.9, 1.0);
}
`;

export const Backdrop: React.FC = () => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vObj; void main(){ vObj = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: nebulaFragment,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );
  return (
    <group>
      <mesh material={mat} rotation={[0.35, 0, 0.2]} raycast={() => null} renderOrder={-10}>
        <sphereGeometry args={[4000, 64, 32]} />
      </mesh>
      <Stars radius={1800} depth={1200} count={9000} factor={7} saturation={0.15} fade speed={0.3} />
    </group>
  );
};

export const AsteroidBelt: React.FC<{ planets: PlanetData[] }> = ({ planets }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const { count, inner, outer } = useMemo(() => {
    const last = planets[planets.length - 1];
    const r = last ? last.orbitRadius + last.radius + 40 : 200;
    return { count: 1400, inner: r, outer: r + 34 };
  }, [planets]);
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position;
    const rand = seededRandom(9);
    for (let i = 0; i < pos.count; i++) {
      const s = 0.75 + rand() * 0.5;
      pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * 0.8, pos.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = seededRandom(1234);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = inner + Math.pow(rand(), 0.8) * (outer - inner);
      p.set(Math.cos(a) * r, (rand() - 0.5) * 6, Math.sin(a) * r);
      const size = 0.25 + Math.pow(rand(), 4) * 2.6;
      s.set(size, size * (0.6 + rand() * 0.6), size * (0.7 + rand() * 0.5));
      q.setFromEuler(e.set(rand() * 6, rand() * 6, rand() * 6));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.setHSL(0.07 + rand() * 0.05, 0.12 + rand() * 0.1, 0.22 + rand() * 0.2));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, inner, outer]);
  useFrame(() => {
    if (group.current) group.current.rotation.y = sim.time * 0.004;
  });
  return (
    <group ref={group}>
      <instancedMesh ref={ref} args={[geo, undefined, count]} raycast={() => null}>
        <meshStandardMaterial roughness={0.95} metalness={0.05} flatShading />
      </instancedMesh>
    </group>
  );
};

export const OrbitPaths: React.FC<{ planets: PlanetData[] }> = ({ planets }) => {
  const showOrbits = useSystemStore((s) => s.showOrbits);
  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);
  const lines = useMemo(
    () =>
      planets.map((p) => {
        const pts: THREE.Vector3[] = [];
        const period = (Math.PI * 2) / p.orbitSpeed;
        for (let i = 0; i <= 256; i++) pts.push(planetPosition(p, new THREE.Vector3(), (period * i) / 256 - p.orbitPhase / p.orbitSpeed));
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        return { id: p.id, g };
      }),
    [planets],
  );
  if (!showOrbits) return null;
  return (
    <group>
      {lines.map(({ id, g }) => (
        <lineLoop key={id} geometry={g} raycast={() => null}>
          <lineBasicMaterial color="#9fb4d8" transparent opacity={focusedPlanetId === id ? 0.35 : 0.09} depthWrite={false} />
        </lineLoop>
      ))}
    </group>
  );
};

/** Azimuth of a direction around the planet's spin axis (matches rotation about +Y). */
function azimuth(v: THREE.Vector3) {
  return Math.atan2(v.x, v.z);
}

/** Spin angle that turns `localNormal` toward the sun, a little past noon so relief casts light and shade. */
export function litSpinAngle(p: PlanetData, localNormal: THREE.Vector3) {
  const toSun = planetPosition(p, new THREE.Vector3()).negate();
  toSun.applyAxisAngle(new THREE.Vector3(0, 0, 1), -p.axialTilt);
  return azimuth(toSun) - azimuth(localNormal) - 0.55;
}

/** Advances sim time and planet spin before anything else reads them. */
export const SimDriver: React.FC<{ planets: PlanetData[] }> = ({ planets }) => {
  useFrame((_, rawDt) => {
    const { paused, speed, focusedPlanetId, selectedFileId, system } = useSystemStore.getState();
    const dt = paused ? 0 : Math.min(rawDt, 0.05) * speed;
    sim.time += dt;
    for (const p of planets) {
      const current = sim.spin.get(p.id) || 0;
      if (p.id !== focusedPlanetId) {
        sim.spin.set(p.id, current + p.spinSpeed * dt);
        continue;
      }
      // focused: steer the city we look at onto the day side, then hold still
      const districtId = selectedFileId ? system.files.get(selectedFileId)?.districtId : null;
      const district = p.districts.find((d) => d.id === districtId) || p.districts[0];
      const target = litSpinAngle(p, district.normal);
      const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
      sim.spin.set(p.id, current + delta * (1 - Math.exp(-rawDt * 3.2)));
    }
  }, -2);
  return null;
};
