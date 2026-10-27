import * as THREE from 'three';

export type FileKind = 'code' | 'style' | 'markup' | 'docs' | 'config' | 'asset' | 'test' | 'data';

export type PlanetBiome = 'terran' | 'ocean' | 'desert' | 'ice' | 'lava' | 'toxic' | 'rocky';

export interface RepoFile {
  id: string; // full path, unique
  path: string;
  name: string;
  ext: string;
  size: number; // bytes
  lines: number | null; // real line count when the file content was fetched
  kind: FileKind;
  language: string;
  planetId: string;
  districtId: string;
}

export interface Dependency {
  from: string; // file id
  to: string; // file id
}

export interface DistrictLayout {
  id: string;
  name: string;
  planetId: string;
  fileIds: string[];
  // tangent frame in planet-local space
  normal: THREE.Vector3;
  east: THREE.Vector3;
  north: THREE.Vector3;
  quaternion: THREE.Quaternion; // local +Y -> normal
  padRadius: number;
  padThickness: number;
  topHeight: number; // distance of pad top from planet centre
  hasPark: boolean;
  parkOffset: [number, number]; // tangent-plane offset of park centre
  parkSize: number;
  streets: { x: number; z: number; length: number; alongX: boolean }[];
}

export interface BuildingLayout {
  fileId: string;
  districtId: string;
  // tangent plane offset inside the district
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  shape: BuildingShape;
  color: THREE.Color;
  // planet-local position of the roof centre (rockets launch & land here)
  roof: THREE.Vector3;
  normal: THREE.Vector3;
}

export type BuildingShape = 'tower' | 'hex' | 'cylinder' | 'slab' | 'dome';

export interface RoadLayout {
  id: string;
  from: string; // district id
  to: string;
  points: THREE.Vector3[]; // planet-local polyline on the surface
  length: number;
}

export interface PlanetData {
  id: string;
  name: string; // folder name
  biome: PlanetBiome;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number; // rad / sim-second
  orbitPhase: number;
  orbitTilt: number; // inclination of the orbit plane
  axialTilt: number;
  spinSpeed: number;
  hasRings: boolean;
  totalFiles: number; // files in this folder in the repo, including hidden ones
  fileIds: string[]; // visualised files
  districts: DistrictLayout[];
  roads: RoadLayout[];
  palette: PlanetPalette;
}

export interface PlanetPalette {
  deep: string;
  shallow: string;
  low: string;
  high: string;
  peak: string;
  atmosphere: string;
  seaLevel: number;
  emissive: string; // lava glow / toxic glow, black if none
}

export interface SystemData {
  repo: RepoInfo;
  planets: PlanetData[];
  files: Map<string, RepoFile>;
  buildings: Map<string, BuildingLayout>;
  dependencies: Dependency[];
  crossDependencies: Dependency[];
  importsOf: Map<string, string[]>;
  importedBy: Map<string, string[]>;
  hiddenFiles: number;
}

export interface RepoInfo {
  slug: string;
  branch: string;
  description: string;
  stars: number | null;
  source: 'github' | 'demo';
  totalFiles: number;
  parsedFiles: number;
}

export interface RawTreeEntry {
  path: string;
  size: number;
}
