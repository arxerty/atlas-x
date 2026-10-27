import { FileKind, PlanetBiome, PlanetPalette } from './types';

interface ExtInfo {
  kind: FileKind;
  language: string;
  color: string;
}

const EXT: Record<string, ExtInfo> = {
  ts: { kind: 'code', language: 'TypeScript', color: '#7f9cc4' },
  tsx: { kind: 'code', language: 'TypeScript', color: '#86a8d6' },
  mts: { kind: 'code', language: 'TypeScript', color: '#7f9cc4' },
  cts: { kind: 'code', language: 'TypeScript', color: '#7f9cc4' },
  js: { kind: 'code', language: 'JavaScript', color: '#c9b37a' },
  jsx: { kind: 'code', language: 'JavaScript', color: '#d1bd86' },
  mjs: { kind: 'code', language: 'JavaScript', color: '#c9b37a' },
  cjs: { kind: 'code', language: 'JavaScript', color: '#c9b37a' },
  py: { kind: 'code', language: 'Python', color: '#8fb39a' },
  go: { kind: 'code', language: 'Go', color: '#7fc1c9' },
  rs: { kind: 'code', language: 'Rust', color: '#c49a85' },
  c: { kind: 'code', language: 'C', color: '#9fa8b5' },
  h: { kind: 'code', language: 'C', color: '#aab2bd' },
  cc: { kind: 'code', language: 'C++', color: '#a39fb5' },
  cpp: { kind: 'code', language: 'C++', color: '#a39fb5' },
  hpp: { kind: 'code', language: 'C++', color: '#ada9be' },
  java: { kind: 'code', language: 'Java', color: '#c4a37f' },
  kt: { kind: 'code', language: 'Kotlin', color: '#b39fd0' },
  swift: { kind: 'code', language: 'Swift', color: '#d49a7f' },
  rb: { kind: 'code', language: 'Ruby', color: '#c48585' },
  php: { kind: 'code', language: 'PHP', color: '#9a9fc9' },
  cs: { kind: 'code', language: 'C#', color: '#8fb38f' },
  lua: { kind: 'code', language: 'Lua', color: '#8590c4' },
  sh: { kind: 'code', language: 'Shell', color: '#9ab38f' },
  ps1: { kind: 'code', language: 'PowerShell', color: '#8f9ab3' },
  css: { kind: 'style', language: 'CSS', color: '#c48fb5' },
  scss: { kind: 'style', language: 'SCSS', color: '#c98fae' },
  sass: { kind: 'style', language: 'Sass', color: '#c98fae' },
  less: { kind: 'style', language: 'Less', color: '#b58fc4' },
  html: { kind: 'markup', language: 'HTML', color: '#c9a07a' },
  vue: { kind: 'markup', language: 'Vue', color: '#8fc4a3' },
  svelte: { kind: 'markup', language: 'Svelte', color: '#d49077' },
  astro: { kind: 'markup', language: 'Astro', color: '#c48fa8' },
  md: { kind: 'docs', language: 'Markdown', color: '#d9d6cf' },
  mdx: { kind: 'docs', language: 'MDX', color: '#d9d6cf' },
  txt: { kind: 'docs', language: 'Text', color: '#cfccc4' },
  rst: { kind: 'docs', language: 'reST', color: '#d9d6cf' },
  json: { kind: 'config', language: 'JSON', color: '#8a8f98' },
  yaml: { kind: 'config', language: 'YAML', color: '#959aa3' },
  yml: { kind: 'config', language: 'YAML', color: '#959aa3' },
  toml: { kind: 'config', language: 'TOML', color: '#959aa3' },
  ini: { kind: 'config', language: 'INI', color: '#959aa3' },
  lock: { kind: 'config', language: 'Lockfile', color: '#7a7f88' },
  xml: { kind: 'data', language: 'XML', color: '#a89fc4' },
  csv: { kind: 'data', language: 'CSV', color: '#b0a1d0' },
  sql: { kind: 'data', language: 'SQL', color: '#b0a1d0' },
  graphql: { kind: 'data', language: 'GraphQL', color: '#c48fc0' },
  proto: { kind: 'data', language: 'Protobuf', color: '#a1b0d0' },
  png: { kind: 'asset', language: 'Image', color: '#9aa7b8' },
  jpg: { kind: 'asset', language: 'Image', color: '#9aa7b8' },
  jpeg: { kind: 'asset', language: 'Image', color: '#9aa7b8' },
  gif: { kind: 'asset', language: 'Image', color: '#9aa7b8' },
  webp: { kind: 'asset', language: 'Image', color: '#9aa7b8' },
  svg: { kind: 'asset', language: 'SVG', color: '#a7b8b0' },
  ico: { kind: 'asset', language: 'Icon', color: '#9aa7b8' },
  woff: { kind: 'asset', language: 'Font', color: '#a0a0b0' },
  woff2: { kind: 'asset', language: 'Font', color: '#a0a0b0' },
  ttf: { kind: 'asset', language: 'Font', color: '#a0a0b0' },
  mp4: { kind: 'asset', language: 'Video', color: '#9aa7b8' },
  wasm: { kind: 'asset', language: 'WebAssembly', color: '#9a8fc4' },
};

const FALLBACK: ExtInfo = { kind: 'data', language: 'Other', color: '#8f949c' };

export function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function classifyFile(path: string): ExtInfo {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const ext = getExt(name);
  const info = EXT[ext] || FALLBACK;
  if (info.kind === 'code' && /(\.|_)(test|spec)\.|__tests__\/|(^|\/)tests?\//.test(path)) {
    return { ...info, kind: 'test', color: '#a3c48f' };
  }
  if (!ext && /^(Dockerfile|Makefile|LICENSE|\.\w+)$/.test(name)) {
    return { kind: 'config', language: name.startsWith('.') ? 'Dotfile' : name, color: '#8a8f98' };
  }
  return info;
}

export const PARSABLE_EXTS = new Set([
  'ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs', 'vue', 'svelte', 'astro',
  'py', 'go', 'rs', 'c', 'h', 'cc', 'cpp', 'hpp', 'css', 'scss', 'sass', 'less',
]);

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const BIOME_ORDER: PlanetBiome[] = ['terran', 'desert', 'ocean', 'lava', 'ice', 'toxic', 'rocky'];

export function pickBiome(folder: string, previous: PlanetBiome | null): PlanetBiome {
  const f = folder.toLowerCase();
  let biome: PlanetBiome;
  if (f === '/') biome = 'terran';
  else if (/^(tests?|__tests__|spec|e2e|fixtures|benchmarks?)$/.test(f)) biome = 'ice';
  else if (/^(docs?|website|site|examples?|guides?|blog)$/.test(f)) biome = 'ocean';
  else if (/^(scripts?|tools?|bin|build|\.github|ci|config|infra|deploy|\.circleci)$/.test(f)) biome = 'desert';
  else if (/^(assets|public|static|images|media|fonts|resources)$/.test(f)) biome = 'rocky';
  else if (/^(kernel|core|engine|runtime|native|arch|drivers)$/.test(f)) biome = 'lava';
  else biome = BIOME_ORDER[hashString(f) % BIOME_ORDER.length];
  if (biome === previous) biome = BIOME_ORDER[(BIOME_ORDER.indexOf(biome) + 2) % BIOME_ORDER.length];
  return biome;
}

export const BIOME_PALETTES: Record<PlanetBiome, PlanetPalette> = {
  terran: { deep: '#071d38', shallow: '#17506e', low: '#34502a', high: '#6b6646', peak: '#dcdcd4', atmosphere: '#6fa8ff', seaLevel: 0.5, emissive: '#000000' },
  ocean: { deep: '#041a33', shallow: '#136585', low: '#4a6a3a', high: '#7d7a5a', peak: '#ececec', atmosphere: '#5cc8ff', seaLevel: 0.64, emissive: '#000000' },
  desert: { deep: '#4f321d', shallow: '#74502f', low: '#b0814d', high: '#d4aa72', peak: '#efdcb4', atmosphere: '#ffb878', seaLevel: 0.18, emissive: '#000000' },
  ice: { deep: '#1d3b58', shallow: '#5d88ad', low: '#c2d6e6', high: '#e4eef6', peak: '#ffffff', atmosphere: '#bfe3ff', seaLevel: 0.36, emissive: '#000000' },
  lava: { deep: '#2a0d04', shallow: '#3a1a10', low: '#2e2622', high: '#4a3f39', peak: '#6a5f58', atmosphere: '#ff7a45', seaLevel: 0.42, emissive: '#ff4d12' },
  toxic: { deep: '#18240c', shallow: '#3a5512', low: '#4a4a2a', high: '#6b603b', peak: '#a0a676', atmosphere: '#b6ff6a', seaLevel: 0.46, emissive: '#5fd61f' },
  rocky: { deep: '#2a2725', shallow: '#3f3a36', low: '#625c55', high: '#857e75', peak: '#b3aba1', atmosphere: '#c9c0b5', seaLevel: 0.0, emissive: '#000000' },
};

export const KIND_LABELS: Record<FileKind, { ru: string; en: string }> = {
  code: { ru: 'Код', en: 'Code' },
  test: { ru: 'Тест', en: 'Test' },
  style: { ru: 'Стили', en: 'Styles' },
  markup: { ru: 'Разметка', en: 'Markup' },
  docs: { ru: 'Документация', en: 'Docs' },
  config: { ru: 'Конфиг', en: 'Config' },
  data: { ru: 'Данные', en: 'Data' },
  asset: { ru: 'Ассет', en: 'Asset' },
};
