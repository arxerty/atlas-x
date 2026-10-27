import React, { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingShape, DistrictLayout, PlanetData, SystemData } from '../../system/types';
import { GEO } from './geometries';
import { CityUniforms, buildRoadGeometry, createFacadeMaterial, createPadMaterial, createRoadMaterial } from './cityMaterials';
import { useSystemStore } from '../../stores/useSystemStore';
import { seededRandom, hashString } from '../../system/classify';
import { formatBytes } from '../../system/i18n';

interface Props {
  planet: PlanetData;
  system: SystemData;
  uniforms: CityUniforms;
  focused: boolean;
}

const m4 = new THREE.Matrix4();
const v3 = new THREE.Vector3();
const s3 = new THREE.Vector3();
const yaw = new THREE.Quaternion();
const q4 = new THREE.Quaternion();

function place(d: DistrictLayout, x: number, z: number, y: number, sx: number, sy: number, sz: number, rotY = 0) {
  v3.copy(d.normal).multiplyScalar(d.topHeight + y).addScaledVector(d.east, x).addScaledVector(d.north, z);
  q4.copy(d.quaternion);
  if (rotY) q4.multiply(yaw.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotY));
  s3.set(sx, sy, sz);
  return m4.compose(v3, q4, s3);
}

type MeshKey = BuildingShape | 'crown' | 'antenna' | 'beacon' | 'hexCap' | 'cylCap' | 'solar';

interface InstanceList {
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
  ids: string[]; // file id per instance (pickable meshes)
}

const SHAPE_KEYS: BuildingShape[] = ['tower', 'hex', 'cylinder', 'slab', 'dome'];

export const City: React.FC<Props> = ({ planet, system, uniforms, focused }) => {
  const selectFile = useSystemStore((s) => s.selectFile);
  const hoverFile = useSystemStore((s) => s.hoverFile);
  const selectedFileId = useSystemStore((s) => s.selectedFileId);
  const hoveredFileId = useSystemStore((s) => s.hoveredFileId);
  const showLabels = useSystemStore((s) => s.showLabels);

  const materials = useMemo(
    () => ({
      tower: createFacadeMaterial(uniforms, { roughness: 0.45, metalness: 0.5 }),
      hex: createFacadeMaterial(uniforms, { floor: 0.09, roughness: 0.5, metalness: 0.4 }),
      cylinder: createFacadeMaterial(uniforms, { cylinder: true, roughness: 0.35, metalness: 0.6 }),
      slab: createFacadeMaterial(uniforms, { floor: 0.075, glow: 1.4, roughness: 0.65, metalness: 0.2 }),
      dome: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0.55, emissive: '#1d3346', emissiveIntensity: 0.4 }),
      crown: createFacadeMaterial(uniforms, { floor: 0.06, glow: 1.0, roughness: 0.3, metalness: 0.75 }),
      metal: new THREE.MeshStandardMaterial({ color: '#4a4f58', roughness: 0.35, metalness: 0.8 }),
      solar: new THREE.MeshStandardMaterial({ color: '#16233a', roughness: 0.15, metalness: 0.9, emissive: '#0b1830', emissiveIntensity: 0.6 }),
      beacon: new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.4, 0.3), toneMapped: false }),
      pad: createPadMaterial(),
      rim: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.1, 1.6), toneMapped: false, side: THREE.DoubleSide }),
      street: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.4), toneMapped: false }),
      grass: new THREE.MeshStandardMaterial({ color: '#2f5a2c', roughness: 0.95 }),
      tree: new THREE.MeshStandardMaterial({ color: '#2c5e2e', roughness: 0.85, flatShading: true }),
      glass: new THREE.MeshStandardMaterial({ color: '#bfe6ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, emissive: '#2a6c8a', emissiveIntensity: 0.25 }),
      frame: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 1.0), wireframe: true, transparent: true, opacity: 0.22 }),
      road: createRoadMaterial(uniforms),
    }),
    [uniforms],
  );

  // ---------- static instance data ----------
  const data = useMemo(() => {
    const lists = {} as Record<MeshKey, InstanceList>;
    const add = (k: MeshKey, m: THREE.Matrix4, c: THREE.Color, id = '') => {
      if (!lists[k]) lists[k] = { matrices: [], colors: [], ids: [] };
      lists[k].matrices.push(m.clone());
      lists[k].colors.push(c);
      lists[k].ids.push(id);
    };
    const white = new THREE.Color('#ffffff');
    const pads: THREE.Matrix4[] = [];
    const rims: THREE.Matrix4[] = [];
    const streets: THREE.Matrix4[] = [];
    const parks: THREE.Matrix4[] = [];
    const domes: THREE.Matrix4[] = [];
    const trees: THREE.Matrix4[] = [];

    for (const d of planet.districts) {
      pads.push(place(d, 0, 0, 0, d.padRadius, d.padThickness, d.padRadius, Math.PI / 8).clone());
      rims.push(place(d, 0, 0, 0.004, d.padRadius, 1, d.padRadius, Math.PI / 8).clone());
      for (const s of d.streets) {
        streets.push(place(d, s.x, s.z, 0.001, s.alongX ? s.length : 0.035, 0.006, s.alongX ? 0.035 : s.length).clone());
      }
      if (d.hasPark) {
        const [px, pz] = d.parkOffset;
        const r = d.parkSize / 2;
        parks.push(place(d, px, pz, 0, r, 0.03, r).clone());
        domes.push(place(d, px, pz, 0.02, r * 1.02, r * 0.78, r * 1.02).clone());
        const rand = seededRandom(hashString(d.id));
        for (let i = 0; i < 22; i++) {
          const a = rand() * Math.PI * 2;
          const rr = Math.sqrt(rand()) * r * 0.82;
          const s = 0.07 + rand() * 0.06;
          trees.push(place(d, px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 0.03, s, s * (2.2 + rand() * 1.4), s, rand() * 6).clone());
        }
      }

      for (const fid of d.fileIds) {
        const b = system.buildings.get(fid)!;
        const c = b.color;
        switch (b.shape) {
          case 'tower': {
            const body = b.height * 0.86;
            add('tower', place(d, b.x, b.z, 0, b.width, body, b.depth), c, fid);
            add('crown', place(d, b.x, b.z, body, b.width * 0.72, b.height * 0.14, b.depth * 0.72), c.clone().multiplyScalar(0.8));
            if (b.height > 1.5) {
              const len = 0.18 + b.height * 0.14;
              add('antenna', place(d, b.x, b.z, b.height, 0.022, len, 0.022), white);
              add('beacon', place(d, b.x, b.z, b.height + len, 0.035, 0.035, 0.035), white);
            }
            break;
          }
          case 'hex':
            add('hex', place(d, b.x, b.z, 0, b.width, b.height, b.depth), c, fid);
            add('hexCap', place(d, b.x, b.z, b.height, b.width * 1.08, 0.04, b.depth * 1.08), white);
            break;
          case 'cylinder':
            add('cylinder', place(d, b.x, b.z, 0, b.width, b.height, b.depth), c, fid);
            add('cylCap', place(d, b.x, b.z, b.height * 0.62, b.width * 1.12, 0.035, b.depth * 1.12), white);
            add('cylCap', place(d, b.x, b.z, b.height, b.width * 1.06, 0.03, b.depth * 1.06), white);
            break;
          case 'slab':
            add('slab', place(d, b.x, b.z, 0, b.width, b.height, b.depth), c, fid);
            add('solar', place(d, b.x, b.z, b.height, b.width * 0.82, 0.018, b.depth * 0.78), white);
            break;
          case 'dome':
            add('dome', place(d, b.x, b.z, 0, b.width, b.height, b.depth), c, fid);
            break;
        }
      }
    }
    return { lists, pads, rims, streets, parks, domes, trees };
  }, [planet, system]);

  const roadGeo = useMemo(() => buildRoadGeometry(planet.roads, 0.3), [planet]);

  // ---------- instanced meshes ----------
  const refs = useRef<Partial<Record<MeshKey, THREE.InstancedMesh | null>>>({});
  const baseColors = useRef<Partial<Record<BuildingShape, THREE.Color[]>>>({});

  useLayoutEffect(() => {
    for (const [key, list] of Object.entries(data.lists) as [MeshKey, InstanceList][]) {
      const mesh = refs.current[key];
      if (!mesh) continue;
      list.matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, list.colors[i]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      if ((SHAPE_KEYS as string[]).includes(key)) baseColors.current[key as BuildingShape] = list.colors;
    }
  }, [data]);

  // highlight selected file and what it imports / is imported by
  useEffect(() => {
    const related = new Set<string>();
    if (selectedFileId) {
      (system.importsOf.get(selectedFileId) || []).forEach((id) => related.add(id));
      (system.importedBy.get(selectedFileId) || []).forEach((id) => related.add(id));
    }
    const accent = new THREE.Color('#8ab4ff');
    const tmp = new THREE.Color();
    for (const shape of SHAPE_KEYS) {
      const mesh = refs.current[shape];
      const list = data.lists[shape];
      if (!mesh || !list) continue;
      list.ids.forEach((id, i) => {
        tmp.copy(list.colors[i]);
        if (id === selectedFileId) tmp.lerp(accent, 0.55).multiplyScalar(1.5);
        else if (related.has(id)) tmp.lerp(accent, 0.35);
        else if (selectedFileId && planet.id === system.files.get(selectedFileId)?.planetId) tmp.multiplyScalar(0.7);
        mesh.setColorAt(i, tmp);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [selectedFileId, data, system, planet.id]);

  const onMove = (shape: BuildingShape) => (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();
    hoverFile(data.lists[shape].ids[e.instanceId]);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hoverFile(null);
    document.body.style.cursor = '';
  };
  const onClick = (shape: BuildingShape) => (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined || e.delta > 4) return;
    e.stopPropagation();
    selectFile(data.lists[shape].ids[e.instanceId]);
  };

  const meshFor = (key: MeshKey, geo: THREE.BufferGeometry, mat: THREE.Material, pickable?: BuildingShape) => {
    const list = data.lists[key];
    if (!list) return null;
    return (
      <instancedMesh
        key={key}
        ref={(m) => {
          refs.current[key] = m;
        }}
        args={[geo, mat, list.matrices.length]}
        onPointerMove={pickable ? onMove(pickable) : undefined}
        onPointerOut={pickable ? onOut : undefined}
        onClick={pickable ? onClick(pickable) : undefined}
        raycast={pickable ? undefined : () => null}
      />
    );
  };

  useFrame(() => {
    // aircraft warning lights blink in sync
    const t = uniforms.uTime.value;
    materials.beacon.color.setRGB(4, 0.4, 0.3).multiplyScalar(Math.sin(t * 3.2) > 0.2 ? 1 : 0.08);
  });

  const hovered = hoveredFileId ? system.buildings.get(hoveredFileId) : null;
  const hoveredFile = hoveredFileId ? system.files.get(hoveredFileId) : null;
  const selected = selectedFileId ? system.buildings.get(selectedFileId) : null;

  return (
    <group>
      <StaticInstances geo={GEO.pad} mat={materials.pad} matrices={data.pads} />
      <StaticInstances geo={GEO.padRim} mat={materials.rim} matrices={data.rims} />
      <StaticInstances geo={GEO.box} mat={materials.street} matrices={data.streets} />
      <StaticInstances geo={GEO.parkGround} mat={materials.grass} matrices={data.parks} />
      <StaticInstances geo={GEO.tree} mat={materials.tree} matrices={data.trees} />
      <StaticInstances geo={GEO.glassDome} mat={materials.glass} matrices={data.domes} />
      <StaticInstances geo={GEO.geodesic} mat={materials.frame} matrices={data.domes} />

      {meshFor('tower', GEO.box, materials.tower, 'tower')}
      {meshFor('hex', GEO.hex, materials.hex, 'hex')}
      {meshFor('cylinder', GEO.cylinder, materials.cylinder, 'cylinder')}
      {meshFor('slab', GEO.box, materials.slab, 'slab')}
      {meshFor('dome', GEO.dome, materials.dome, 'dome')}
      {meshFor('crown', GEO.box, materials.crown)}
      {meshFor('antenna', GEO.antenna, materials.metal)}
      {meshFor('beacon', GEO.beacon, materials.beacon)}
      {meshFor('hexCap', GEO.hex, materials.metal)}
      {meshFor('cylCap', GEO.cylinder, materials.metal)}
      {meshFor('solar', GEO.box, materials.solar)}

      <mesh geometry={roadGeo} material={materials.road} raycast={() => null} />
      <Traffic planet={planet} />

      {selected && <Beam district={planet.districts.find((d) => d.id === selected.districtId)} b={selected} color="#8ab4ff" />}
      {hovered && hovered !== selected && <Beam district={planet.districts.find((d) => d.id === hovered.districtId)} b={hovered} color="#ffffff" />}

      {hovered && hoveredFile && (
        <Html position={hovered.roof.clone().addScaledVector(hovered.normal, 0.35)} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="scene-tip">
            <span className="scene-tip-name">{hoveredFile.name}</span>
            <span className="scene-tip-meta">{formatBytes(hoveredFile.size)}</span>
          </div>
        </Html>
      )}

      {focused && showLabels && <DistrictLabels planet={planet} />}
    </group>
  );
};

const StaticInstances: React.FC<{ geo: THREE.BufferGeometry; mat: THREE.Material; matrices: THREE.Matrix4[] }> = ({ geo, mat, matrices }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  if (!matrices.length) return null;
  return <instancedMesh ref={ref} args={[geo, mat, matrices.length]} raycast={() => null} />;
};

const beamVertex = /* glsl */ `
varying float vH;
void main() { vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const beamFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying float vH;
void main() {
  float a = pow(1.0 - vH, 3.0) * (0.28 + 0.08 * sin(uTime * 4.0 - vH * 12.0));
  gl_FragColor = vec4(uColor * 1.3, a);
}
`;

const Beam: React.FC<{ district?: DistrictLayout; b: { x: number; z: number; width: number; depth: number; height: number }; color: string }> = ({ district, b, color }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 } },
      }),
    [color],
  );
  useFrame((_, dt) => (mat.uniforms.uTime.value += dt));
  if (!district) return null;
  const r = Math.max(b.width, b.depth) * 0.6;
  const m = place(district, b.x, b.z, 0, r, b.height + 3.5, r);
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  m.decompose(pos, quat, scale);
  return <mesh geometry={GEO.beam} material={mat} position={pos} quaternion={quat} scale={scale} raycast={() => null} />;
};

/** Hover-cars running both ways along the planet highways. */
const Traffic: React.FC<{ planet: PlanetData }> = ({ planet }) => {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const paused = useSystemStore((s) => s.paused);
  const speed = useSystemStore((s) => s.speed);

  const cars = useMemo(() => {
    const rand = seededRandom(hashString(planet.id + 'traffic'));
    const list: { road: number; s: number; dir: 1 | -1; v: number; color: THREE.Color }[] = [];
    const palette = ['#d9dde3', '#2f3540', '#8a96a8', '#a33a2e', '#c9a35a', '#3c5f8a'];
    planet.roads.forEach((r, ri) => {
      const n = Math.max(2, Math.min(9, Math.round(r.length * 0.7)));
      for (let i = 0; i < n; i++) {
        list.push({ road: ri, s: rand() * r.length, dir: rand() > 0.5 ? 1 : -1, v: 0.5 + rand() * 0.6, color: new THREE.Color(palette[Math.floor(rand() * palette.length)]) });
      }
    });
    return list.slice(0, 220);
  }, [planet]);

  const roadData = useMemo(
    () =>
      planet.roads.map((r) => {
        const cum = [0];
        for (let i = 1; i < r.points.length; i++) cum.push(cum[i - 1] + r.points[i].distanceTo(r.points[i - 1]));
        return { pts: r.points, cum, len: cum[cum.length - 1] };
      }),
    [planet],
  );

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const light = lightRef.current;
    if (!body || !light) return;
    cars.forEach((c, i) => {
      body.setColorAt(i, c.color);
      light.setColorAt(i, c.dir > 0 ? new THREE.Color(3.0, 0.25, 0.15) : new THREE.Color(0.4, 1.6, 3.0));
    });
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (light.instanceColor) light.instanceColor.needsUpdate = true;
  }, [cars]);

  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), f: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), one: new THREE.Vector3(1, 1, 1), lp: new THREE.Vector3() }),
    [],
  );

  useFrame((_, rawDt) => {
    const body = bodyRef.current;
    const light = lightRef.current;
    if (!body || !light) return;
    const dt = paused ? 0 : Math.min(rawDt, 0.05) * speed;
    cars.forEach((c, i) => {
      const r = roadData[c.road];
      c.s = (c.s + c.dir * c.v * dt + r.len) % r.len;
      let k = 1;
      while (k < r.cum.length - 1 && r.cum[k] < c.s) k++;
      const a = r.pts[k - 1];
      const b = r.pts[k];
      const t = (c.s - r.cum[k - 1]) / Math.max(1e-6, r.cum[k] - r.cum[k - 1]);
      tmp.p.lerpVectors(a, b, t);
      tmp.up.copy(tmp.p).normalize();
      tmp.f.subVectors(b, a).normalize().multiplyScalar(c.dir);
      tmp.right.crossVectors(tmp.up, tmp.f).normalize();
      tmp.p.addScaledVector(tmp.up, 0.11 + Math.sin(c.s * 3 + i) * 0.01).addScaledVector(tmp.right, -0.075);
      tmp.m.makeBasis(tmp.right, tmp.up, tmp.f);
      tmp.q.setFromRotationMatrix(tmp.m);
      tmp.m.compose(tmp.p, tmp.q, tmp.one);
      body.setMatrixAt(i, tmp.m);
      tmp.lp.copy(tmp.p).addScaledVector(tmp.f, -0.085);
      tmp.m.compose(tmp.lp, tmp.q, tmp.one);
      light.setMatrixAt(i, tmp.m);
    });
    body.instanceMatrix.needsUpdate = true;
    light.instanceMatrix.needsUpdate = true;
  });

  if (!cars.length) return null;
  return (
    <>
      <instancedMesh ref={bodyRef} args={[GEO.carBody, undefined, cars.length]} frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.3} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[GEO.carLight, undefined, cars.length]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
};

/** District names float above each city while the planet is focused; hidden on the far side. */
const DistrictLabels: React.FC<{ planet: PlanetData }> = ({ planet }) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const tmp = useMemo(() => ({ n: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion(), p: new THREE.Vector3() }), []);
  useFrame(({ camera }) => {
    if (!group.current) return;
    group.current.getWorldQuaternion(tmp.q);
    group.current.getWorldPosition(tmp.c);
    planet.districts.forEach((d, i) => {
      const el = refs.current[i];
      if (!el) return;
      tmp.n.copy(d.normal).applyQuaternion(tmp.q);
      tmp.p.copy(tmp.c).addScaledVector(tmp.n, planet.radius);
      const toCam = camera.position.clone().sub(tmp.p).normalize();
      const facing = tmp.n.dot(toCam);
      el.style.opacity = String(THREE.MathUtils.clamp((facing - 0.15) * 3, 0, 1));
    });
  });
  return (
    <group ref={group}>
      {planet.districts.map((d, i) => (
        <Html key={d.id} position={d.normal.clone().multiplyScalar(d.topHeight + 0.15).addScaledVector(d.north, d.padRadius * 0.95)} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="district-label"
          >
            {d.name === '/' ? planet.name : d.name.split('/').pop()}
            <span>{d.fileIds.length}</span>
          </div>
        </Html>
      ))}
    </group>
  );
};
