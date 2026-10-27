import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Dependency, SystemData } from '../../system/types';
import { planetDirToWorld, planetLocalToWorld } from '../../system/sim';
import { buildRocketGeometry, FLAME_CORE_GEO, FLAME_GEO, getGlowTexture } from './geometries';
import { useSystemStore } from '../../stores/useSystemStore';

const MAX_ROCKETS = 18;
const TRAIL = 64;

interface Flight {
  dep: Dependency | null;
  t: number;
  duration: number;
  wait: number;
  scale: number;
}

const tmp = {
  p0: new THREE.Vector3(),
  p1: new THREE.Vector3(),
  p2: new THREE.Vector3(),
  p3: new THREE.Vector3(),
  n0: new THREE.Vector3(),
  n3: new THREE.Vector3(),
  pos: new THREE.Vector3(),
  tan: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0),
};

function bezier(out: THREE.Vector3, t: number) {
  const u = 1 - t;
  return out
    .copy(tmp.p0)
    .multiplyScalar(u * u * u)
    .addScaledVector(tmp.p1, 3 * u * u * t)
    .addScaledVector(tmp.p2, 3 * u * t * t)
    .addScaledVector(tmp.p3, t * t * t);
}

function bezierTangent(out: THREE.Vector3, t: number) {
  const u = 1 - t;
  return out
    .copy(tmp.p1)
    .sub(tmp.p0)
    .multiplyScalar(3 * u * u)
    .addScaledVector(tmp.p2.clone().sub(tmp.p1), 6 * u * t)
    .addScaledVector(tmp.p3.clone().sub(tmp.p2), 3 * t * t)
    .normalize();
}

/** Launch → cruise → landing: slow off the pad, fast through space, gentle touchdown. */
function flightCurve(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export const Rockets: React.FC<{ system: SystemData }> = ({ system }) => {
  const showRockets = useSystemStore((s) => s.showRockets);
  const selectedFileId = useSystemStore((s) => s.selectedFileId);
  const deps = system.crossDependencies;
  const count = Math.min(MAX_ROCKETS, deps.length);

  const queue = useRef<Dependency[]>([]);
  const cursor = useRef(0);

  // selected file's flights jump the queue
  useEffect(() => {
    const mine = selectedFileId ? deps.filter((d) => d.from === selectedFileId || d.to === selectedFileId) : [];
    const rest = deps.filter((d) => !mine.includes(d));
    queue.current = [...mine, ...shuffle(rest)];
    cursor.current = 0;
  }, [deps, selectedFileId]);

  if (!showRockets || count === 0) return null;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Rocket key={i} index={i} system={system} next={() => {
          const q = queue.current;
          if (!q.length) return null;
          const d = q[cursor.current % q.length];
          cursor.current++;
          return d;
        }} />
      ))}
    </group>
  );
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Rocket: React.FC<{ index: number; system: SystemData; next: () => Dependency | null }> = ({ index, system, next }) => {
  const group = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const flight = useRef<Flight>({ dep: null, t: 0, duration: 1, wait: index * 0.6 + Math.random(), scale: 1 });

  const stripe = useMemo(() => new THREE.Color().setHSL((index * 0.137) % 1, 0.55, 0.5), [index]);
  const bodyGeo = useMemo(() => buildRocketGeometry(stripe), [stripe]);
  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.55 }),
      flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 1.4, 0.35), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      core: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.6, 4.0), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      glow: new THREE.SpriteMaterial({ map: getGlowTexture(), color: new THREE.Color(3.0, 1.5, 0.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
      trail: new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      puffs: new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: getGlowTexture(), toneMapped: false }),
    }),
    [],
  );
  useEffect(() => () => bodyGeo.dispose(), [bodyGeo]);

  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setDrawRange(0, 0);
    return { g, history: [] as THREE.Vector3[] };
  }, []);

  const trailLine = useMemo(() => {
    const line = new THREE.Line(trail.g, mats.trail);
    line.frustumCulled = false;
    line.raycast = () => {};
    return line;
  }, [trail, mats]);

  const endpoints = (dep: Dependency) => {
    const fa = system.files.get(dep.from)!;
    const fb = system.files.get(dep.to)!;
    const pa = system.planets.find((p) => p.id === fa.planetId)!;
    const pb = system.planets.find((p) => p.id === fb.planetId)!;
    const ba = system.buildings.get(dep.from)!;
    const bb = system.buildings.get(dep.to)!;
    planetLocalToWorld(pa, ba.roof, tmp.p0);
    planetLocalToWorld(pb, bb.roof, tmp.p3);
    planetDirToWorld(pa, ba.normal, tmp.n0);
    planetDirToWorld(pb, bb.normal, tmp.n3);
    const dist = tmp.p0.distanceTo(tmp.p3);
    const lift = Math.min(60, dist * 0.32 + 4);
    tmp.p1.copy(tmp.p0).addScaledVector(tmp.n0, lift);
    tmp.p2.copy(tmp.p3).addScaledVector(tmp.n3, lift);
    return dist;
  };

  useFrame(({ camera, clock }, rawDt) => {
    const g = group.current;
    if (!g) return;
    const { paused, speed } = useSystemStore.getState();
    const dt = paused ? 0 : Math.min(rawDt, 0.05) * speed;
    const f = flight.current;

    if (!f.dep) {
      g.visible = false;
      f.wait -= dt;
      if (f.wait <= 0) {
        f.dep = next();
        if (!f.dep) return;
        const dist = endpoints(f.dep);
        f.t = 0;
        f.duration = THREE.MathUtils.clamp(dist / 38, 4, 15);
        trail.history.length = 0;
      }
      return;
    }

    endpoints(f.dep);
    f.t += dt / f.duration;
    if (f.t >= 1) {
      f.dep = null;
      f.wait = 0.4 + Math.random() * 2.2;
      g.visible = false;
      trail.g.setDrawRange(0, 0);
      return;
    }

    const s = flightCurve(f.t);
    bezier(tmp.pos, s);
    bezierTangent(tmp.tan, s);
    g.visible = true;
    g.position.copy(tmp.pos);
    g.quaternion.setFromUnitVectors(tmp.up, tmp.tan);
    // grow in deep space so flights read from the system overview
    const camDist = camera.position.distanceTo(tmp.pos);
    const size = 0.9 + Math.sin(Math.PI * f.t) * THREE.MathUtils.clamp(camDist * 0.009, 0, 7);
    // touch down: shrink into the landing building
    const landing = THREE.MathUtils.smoothstep(f.t, 0.96, 1);
    g.scale.setScalar(size * (1 - landing * 0.9));

    if (flame.current) {
      const flicker = 0.85 + Math.sin(clock.elapsedTime * 40 + index) * 0.1 + Math.random() * 0.1;
      const thrust = 1 - landing;
      flame.current.scale.set(1, flicker * (0.8 + Math.sin(Math.PI * f.t) * 0.8) * thrust + 0.01, 1);
    }
    if (glow.current) glow.current.scale.setScalar(Math.max(0.9, camDist * 0.024) / Math.max(0.2, g.scale.x));

    // exhaust trail behind the nozzle
    const nozzle = tmp.pos.clone().addScaledVector(tmp.tan, -0.7 * g.scale.x);
    const h = trail.history;
    if (!h.length || h[0].distanceToSquared(nozzle) > 0.04) {
      h.unshift(nozzle);
      if (h.length > TRAIL) h.pop();
    }
    const pos = trail.g.attributes.position as THREE.BufferAttribute;
    const col = trail.g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < h.length; i++) {
      const fade = Math.pow(1 - i / TRAIL, 2);
      pos.setXYZ(i, h[i].x, h[i].y, h[i].z);
      col.setXYZ(i, 1.4 * fade, 0.75 * fade, 0.4 * fade);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    trail.g.setDrawRange(0, h.length);
    trail.g.computeBoundingSphere();
  });

  return (
    <>
      <group ref={group} visible={false}>
        <mesh geometry={bodyGeo} material={mats.body} raycast={() => null} />
        <group ref={flame}>
          <mesh geometry={FLAME_GEO} material={mats.flame} raycast={() => null} />
          <mesh geometry={FLAME_CORE_GEO} material={mats.core} raycast={() => null} />
        </group>
        <sprite ref={glow} material={mats.glow} position={[0, -0.75, 0]} raycast={() => null} />
      </group>
      <primitive object={trailLine} />
      <points geometry={trail.g} material={mats.puffs} frustumCulled={false} raycast={() => null} />
    </>
  );
};
