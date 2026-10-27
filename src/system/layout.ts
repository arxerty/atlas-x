import * as THREE from 'three';
import {
  BuildingLayout,
  BuildingShape,
  Dependency,
  DistrictLayout,
  PlanetBiome,
  PlanetData,
  RawTreeEntry,
  RepoFile,
  RepoInfo,
  RoadLayout,
  SystemData,
} from './types';
import { BIOME_PALETTES, classifyFile, getExt, hashString, pickBiome, seededRandom } from './classify';

export const SUN_RADIUS = 16;

const MAX_PLANET_FOLDERS = 8; // + root planet
const BUILDING_BUDGET = 760;
const MAX_PER_PLANET = 240;
const MIN_PER_PLANET = 10;
const MAX_DISTRICTS = 22;
const DISTRICT_CHUNK = 30;

const CELL = 0.82;
const STREET = 0.42;

export interface Selection {
  files: RepoFile[];
  planets: { id: string; name: string; totalFiles: number; fileIds: string[] }[];
  hiddenFiles: number;
  totalFiles: number;
}

const ROOT = '/';

function topFolder(path: string): string {
  const i = path.indexOf('/');
  return i === -1 ? ROOT : path.slice(0, i);
}

function districtName(path: string, planet: string): string {
  if (planet === ROOT) return ROOT;
  const parts = path.split('/');
  if (parts.length <= 2) return planet;
  return `${parts[0]}/${parts[1]}`;
}

/** Decides which folders become planets and which files get a building. */
export function selectFiles(entries: RawTreeEntry[]): Selection {
  const groups = new Map<string, RawTreeEntry[]>();
  for (const e of entries) {
    const top = topFolder(e.path);
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top)!.push(e);
  }

  const folders = [...groups.keys()].filter((k) => k !== ROOT).sort((a, b) => groups.get(b)!.length - groups.get(a)!.length);
  const planetFolders = folders.slice(0, MAX_PLANET_FOLDERS);
  const overflow = folders.slice(MAX_PLANET_FOLDERS);
  const planetGroups: { id: string; name: string; entries: RawTreeEntry[] }[] = [];
  if (groups.has(ROOT)) planetGroups.push({ id: ROOT, name: ROOT, entries: groups.get(ROOT)! });
  for (const f of planetFolders) planetGroups.push({ id: f, name: f, entries: groups.get(f)! });
  if (overflow.length) {
    planetGroups.push({ id: '…', name: overflow.length === 1 ? overflow[0] : `+${overflow.length}`, entries: overflow.flatMap((f) => groups.get(f)!) });
  }

  const weights = planetGroups.map((g) => Math.sqrt(g.entries.length));
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  const files: RepoFile[] = [];
  const planets: Selection['planets'] = [];
  let shown = 0;

  planetGroups.forEach((group, gi) => {
    const budget = Math.min(
      group.entries.length,
      MAX_PER_PLANET,
      Math.max(MIN_PER_PLANET, Math.round((BUILDING_BUDGET * weights[gi]) / weightSum)),
    );

    // round-robin across sub-folders so every district is represented
    const byDistrict = new Map<string, RawTreeEntry[]>();
    for (const e of group.entries) {
      const d = group.id === '…' ? topFolder(e.path) : districtName(e.path, group.id);
      if (!byDistrict.has(d)) byDistrict.set(d, []);
      byDistrict.get(d)!.push(e);
    }
    const queues = [...byDistrict.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_DISTRICTS)
      .map(([d, list]) => ({ d, list: [...list].sort((a, b) => priority(b) - priority(a)) }));

    const picked: { e: RawTreeEntry; d: string }[] = [];
    let round = 0;
    while (picked.length < budget) {
      let any = false;
      for (const q of queues) {
        if (round < q.list.length && picked.length < budget) {
          picked.push({ e: q.list[round], d: q.d });
          any = true;
        }
      }
      if (!any) break;
      round++;
    }

    const ids: string[] = [];
    for (const { e, d } of picked) {
      const info = classifyFile(e.path);
      const name = e.path.slice(e.path.lastIndexOf('/') + 1);
      files.push({
        id: e.path,
        path: e.path,
        name,
        ext: getExt(name),
        size: e.size,
        lines: null,
        kind: info.kind,
        language: info.language,
        planetId: group.id,
        districtId: `${group.id}::${d}`,
      });
      ids.push(e.path);
    }
    shown += ids.length;
    planets.push({ id: group.id, name: group.name, totalFiles: group.entries.length, fileIds: ids });
  });

  return { files, planets, hiddenFiles: entries.length - shown, totalFiles: entries.length };
}

function priority(e: RawTreeEntry): number {
  const k = classifyFile(e.path).kind;
  const kindBoost = k === 'code' ? 3 : k === 'test' || k === 'markup' || k === 'style' ? 2 : k === 'docs' ? 1.2 : 0.6;
  return kindBoost * Math.log10(e.size + 10);
}

/** Converts a file selection plus dependency edges into a full 3D solar system layout. */
export function layoutSystem(sel: Selection, deps: Dependency[], repo: RepoInfo): SystemData {
  const files = new Map<string, RepoFile>();
  for (const f of sel.files) files.set(f.id, f);

  const buildings = new Map<string, BuildingLayout>();
  const planets: PlanetData[] = [];
  let prevBiome: PlanetBiome | null = null;
  let orbit = SUN_RADIUS + 26;

  // roots first, then by size
  const ordered = [...sel.planets].sort((a, b) => (a.id === ROOT ? -1 : b.id === ROOT ? 1 : b.fileIds.length - a.fileIds.length));

  ordered.forEach((p, index) => {
    const rand = seededRandom(hashString(repo.slug + p.id));
    const biome = pickBiome(p.name, prevBiome);
    prevBiome = biome;

    // group files into districts, splitting very large ones
    const districtFiles = new Map<string, string[]>();
    for (const id of p.fileIds) {
      const d = files.get(id)!.districtId;
      if (!districtFiles.has(d)) districtFiles.set(d, []);
      districtFiles.get(d)!.push(id);
    }
    const chunks: { id: string; name: string; fileIds: string[] }[] = [];
    for (const [d, ids] of districtFiles) {
      const sorted = ids.sort((a, b) => files.get(b)!.size - files.get(a)!.size);
      const parts = Math.ceil(sorted.length / DISTRICT_CHUNK);
      const per = Math.ceil(sorted.length / parts);
      for (let i = 0; i < parts; i++) {
        const name = d.split('::')[1];
        const id = parts > 1 ? `${d}#${i + 1}` : d;
        const chunkIds = sorted.slice(i * per, (i + 1) * per);
        chunkIds.forEach((fid) => (files.get(fid)!.districtId = id));
        chunks.push({ id, name: parts > 1 ? `${name} · ${i + 1}` : name, fileIds: chunkIds });
      }
    }
    chunks.sort((a, b) => b.fileIds.length - a.fileIds.length);

    // footprint of every district grid
    const grids = chunks.map((c) => gridFor(c.fileIds.length));
    const maxPad = Math.max(...grids.map((g) => g.padRadius));
    const D = chunks.length;
    const areaR = Math.sqrt((grids.reduce((s, g) => s + (g.padRadius * 2 + 1.4) ** 2, 0) * 1.5) / (4 * Math.PI));
    const packR = D > 1 ? (2 * maxPad) / Math.max(0.35, 3.0 / Math.sqrt(D) - 0.1) : maxPad * 1.6;
    // keep plateaus small relative to the planet so they hug the curvature
    const radius = THREE.MathUtils.clamp(Math.max(7, areaR * 1.25, packR * 1.15, maxPad * 2.7), 7, 34);

    const districts: DistrictLayout[] = [];
    const points = fibonacciSphere(D, rand() * Math.PI * 2);
    chunks.forEach((chunk, ci) => {
      const g = grids[ci];
      const normal = points[ci];
      const helper = Math.abs(normal.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const east = new THREE.Vector3().crossVectors(helper, normal).normalize();
      const north = new THREE.Vector3().crossVectors(east, normal).normalize();
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, normal, north));
      const sag = radius - Math.sqrt(Math.max(0, radius * radius - g.padRadius * g.padRadius));
      const topHeight = radius + 0.12;

      const district: DistrictLayout = {
        id: chunk.id,
        name: chunk.name,
        planetId: p.id,
        fileIds: chunk.fileIds,
        normal,
        east,
        north,
        quaternion,
        padRadius: g.padRadius,
        padThickness: sag + 0.35,
        topHeight,
        hasPark: g.park !== null,
        parkOffset: g.park ? [g.park.x, g.park.z] : [0, 0],
        parkSize: g.park ? g.park.size : 0,
        streets: g.streets,
      };
      districts.push(district);

      chunk.fileIds.forEach((fid, i) => {
        const file = files.get(fid)!;
        const cell = g.cells[i];
        const b = buildingFor(file, cell.x, cell.z, chunk.id);
        const base = normal.clone().multiplyScalar(topHeight).addScaledVector(east, cell.x).addScaledVector(north, cell.z);
        b.roof = base.clone().addScaledVector(normal, b.height);
        b.normal = normal;
        buildings.set(fid, b);
      });
    });

    const roads = buildRoads(districts, radius);

    const orbitRadius = orbit + radius;
    orbit = orbitRadius + radius + 20 + rand() * 8;

    planets.push({
      id: p.id,
      name: p.name === ROOT ? repo.slug.split('/')[1] || 'root' : p.name,
      biome,
      radius,
      orbitRadius,
      orbitSpeed: 0.05 * Math.pow(60 / orbitRadius, 1.5),
      orbitPhase: index * 2.399 + rand() * 0.6,
      orbitTilt: (rand() - 0.5) * 0.06,
      axialTilt: (rand() - 0.5) * 0.5,
      spinSpeed: 0.03 + rand() * 0.03,
      hasRings: biome === 'ice' || biome === 'desert' ? rand() > 0.3 : rand() > 0.8,
      totalFiles: p.totalFiles,
      fileIds: p.fileIds,
      districts,
      roads,
      palette: BIOME_PALETTES[biome],
    });
  });

  const visibleDeps = dedupe(deps.filter((d) => files.has(d.from) && files.has(d.to) && d.from !== d.to));
  const importsOf = new Map<string, string[]>();
  const importedBy = new Map<string, string[]>();
  for (const d of visibleDeps) {
    if (!importsOf.has(d.from)) importsOf.set(d.from, []);
    importsOf.get(d.from)!.push(d.to);
    if (!importedBy.has(d.to)) importedBy.set(d.to, []);
    importedBy.get(d.to)!.push(d.from);
  }
  const crossDependencies = visibleDeps.filter((d) => files.get(d.from)!.planetId !== files.get(d.to)!.planetId);

  return {
    repo,
    planets,
    files,
    buildings,
    dependencies: visibleDeps,
    crossDependencies,
    importsOf,
    importedBy,
    hiddenFiles: sel.hiddenFiles,
  };
}

function dedupe(deps: Dependency[]): Dependency[] {
  const seen = new Set<string>();
  return deps.filter((d) => {
    const k = `${d.from}→${d.to}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

interface Grid {
  cells: { x: number; z: number }[];
  padRadius: number;
  park: { x: number; z: number; size: number } | null;
  streets: DistrictLayout['streets'];
}

function coord(i: number) {
  return i * CELL + Math.floor(i / 2) * STREET;
}

/** City grid: 2×2 blocks separated by streets, largest files in the centre around a park. */
function gridFor(n: number): Grid {
  const withPark = n >= 9;
  const cellsNeeded = n + (withPark ? 4 : 0);
  let g = Math.ceil(Math.sqrt(cellsNeeded));
  if (withPark && g % 2 === 1) g += 1;
  const width = coord(g - 1) + CELL;
  const offset = width / 2 - CELL / 2;

  const all: { i: number; j: number; x: number; z: number; d: number }[] = [];
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      const x = coord(i) - offset;
      const z = coord(j) - offset;
      all.push({ i, j, x, z, d: Math.hypot(x, z) });
    }
  }
  all.sort((a, b) => a.d - b.d);

  let park: Grid['park'] = null;
  let free = all;
  if (withPark) {
    const block = Math.max(0, Math.floor((g / 2 - 1) / 2) * 2);
    const isPark = (c: { i: number; j: number }) => c.i >= block && c.i < block + 2 && c.j >= block && c.j < block + 2;
    const parkCells = all.filter(isPark);
    park = {
      x: parkCells.reduce((s, c) => s + c.x, 0) / 4,
      z: parkCells.reduce((s, c) => s + c.z, 0) / 4,
      size: CELL * 2 - 0.08,
    };
    free = all.filter((c) => !isPark(c));
  }

  const streets: Grid['streets'] = [];
  for (let k = 1; k * 2 < g; k++) {
    const pos = coord(k * 2 - 1) + CELL / 2 + STREET / 2 - offset;
    streets.push({ x: pos, z: 0, length: width + 0.3, alongX: false });
    streets.push({ x: 0, z: pos, length: width + 0.3, alongX: true });
  }
  // ring road around the block
  const edge = width / 2 + 0.2;
  streets.push({ x: 0, z: edge, length: width + 0.7, alongX: true });
  streets.push({ x: 0, z: -edge, length: width + 0.7, alongX: true });
  streets.push({ x: edge, z: 0, length: width + 0.7, alongX: false });
  streets.push({ x: -edge, z: 0, length: width + 0.7, alongX: false });

  return { cells: free.slice(0, n), padRadius: width * 0.707 + 0.55, park, streets };
}

function buildingFor(file: RepoFile, x: number, z: number, districtId: string): BuildingLayout {
  const sz = THREE.MathUtils.clamp(Math.log10(file.size + 1) / 5.2, 0.08, 1);
  const h = hashString(file.id);
  let width = 0.3 + sz * 0.32;
  let depth = width * (0.85 + ((h >> 3) % 4) * 0.05);
  let height = 0.3 + sz * sz * 3.1;
  let shape: BuildingShape;

  switch (file.kind) {
    case 'code':
      shape = sz > 0.75 || h % 3 === 0 ? 'tower' : 'hex';
      break;
    case 'test':
      shape = 'hex';
      height *= 0.8;
      break;
    case 'style':
    case 'markup':
      shape = 'cylinder';
      depth = width;
      break;
    case 'docs':
    case 'data':
      shape = 'slab';
      width = Math.min(0.74, width * 1.3);
      depth = Math.min(0.7, depth * 1.2);
      height = 0.22 + height * 0.35;
      break;
    case 'config':
      shape = 'hex';
      height = 0.2 + height * 0.4;
      break;
    default:
      shape = 'dome';
      width = Math.min(0.7, width * 1.15);
      depth = width;
      height = width * 0.55;
  }

  return {
    fileId: file.id,
    districtId,
    x,
    z,
    width,
    depth,
    height,
    shape,
    color: new THREE.Color(classifyFile(file.path).color),
    roof: new THREE.Vector3(),
    normal: new THREE.Vector3(0, 1, 0),
  };
}

function fibonacciSphere(n: number, rotation: number): THREE.Vector3[] {
  if (n === 1) return [new THREE.Vector3(0, 0.25, 1).normalize()];
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i + rotation;
    pts.push(new THREE.Vector3(Math.cos(t) * r, y * 0.92, Math.sin(t) * r).normalize());
  }
  return pts;
}

/** Each district connects to its two nearest neighbours with a great-circle highway. */
function buildRoads(districts: DistrictLayout[], radius: number): RoadLayout[] {
  const roads: RoadLayout[] = [];
  const seen = new Set<string>();
  for (const a of districts) {
    const nearest = districts
      .filter((b) => b !== a)
      .map((b) => ({ b, ang: a.normal.angleTo(b.normal) }))
      .sort((x, y) => x.ang - y.ang)
      .slice(0, 2);
    for (const { b, ang } of nearest) {
      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key) || ang > 2.4) continue;
      seen.add(key);
      const segments = Math.max(12, Math.ceil(ang * 40));
      const pts: THREE.Vector3[] = [];
      const axis = new THREE.Vector3().crossVectors(a.normal, b.normal).normalize();
      for (let i = 0; i <= segments; i++) {
        const q = new THREE.Quaternion().setFromAxisAngle(axis, (ang * i) / segments);
        pts.push(a.normal.clone().applyQuaternion(q).multiplyScalar(radius + 0.035));
      }
      roads.push({ id: key, from: a.id, to: b.id, points: pts, length: ang * radius });
    }
  }
  return roads;
}
