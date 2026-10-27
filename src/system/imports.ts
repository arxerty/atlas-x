import { Dependency, RepoFile } from './types';

const JS_EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.vue', '.svelte', '.d.ts', '.json', '.css', '.scss'];
const JS_INDEX = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/index.mjs', '/src/index.ts', '/src/index.js'];

function dirname(p: string) {
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
}

function normalize(p: string): string {
  const out: string[] = [];
  for (const part of p.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

function join(a: string, b: string) {
  return normalize(a ? `${a}/${b}` : b);
}

export class ImportResolver {
  private paths: Set<string>;
  private dirs = new Set<string>();
  private byBasename = new Map<string, string[]>();
  private slug: string;

  constructor(allPaths: string[], slug: string) {
    this.paths = new Set(allPaths);
    this.slug = slug;
    for (const p of allPaths) {
      let d = dirname(p);
      while (d && !this.dirs.has(d)) {
        this.dirs.add(d);
        d = dirname(d);
      }
      const base = p.slice(p.lastIndexOf('/') + 1);
      if (!this.byBasename.has(base)) this.byBasename.set(base, []);
      this.byBasename.get(base)!.push(p);
    }
  }

  private tryJs(base: string): string | null {
    for (const ext of JS_EXTS) if (this.paths.has(base + ext)) return base + ext;
    for (const idx of JS_INDEX) if (this.paths.has(base + idx)) return base + idx;
    return null;
  }

  private firstFileIn(dir: string, ext: string): string | null {
    for (const p of this.paths) if (dirname(p) === dir && p.endsWith(ext)) return p;
    return null;
  }

  resolve(file: RepoFile, spec: string): string | null {
    const dir = dirname(file.path);
    switch (file.ext) {
      case 'py':
        return this.resolvePython(dir, spec);
      case 'c':
      case 'h':
      case 'cc':
      case 'cpp':
      case 'hpp':
        return this.resolveC(dir, spec);
      case 'go':
        return this.resolveGo(spec);
      case 'rs':
        return this.resolveRust(file.path, spec);
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return this.resolveCss(dir, spec);
      default:
        return this.resolveJs(dir, spec);
    }
  }

  private resolveJs(dir: string, spec: string): string | null {
    if (spec.startsWith('.')) return this.tryJs(join(dir, spec));
    if (spec.startsWith('@/') || spec.startsWith('~/')) return this.tryJs(join('src', spec.slice(2))) || this.tryJs(spec.slice(2));
    if (spec.startsWith('/')) return this.tryJs(normalize(spec));

    const parts = spec.split('/');
    const scoped = spec.startsWith('@');
    const pkg = scoped ? parts[1] : parts[0];
    const rest = parts.slice(scoped ? 2 : 1).join('/');
    if (!pkg) return null;
    const candidates = [
      `packages/${pkg}`,
      scoped ? `packages/${parts[0]}/${pkg}` : '',
      `packages/${pkg.replace(/^.*?-/, '')}`,
      `src/${pkg}`,
      pkg,
    ].filter(Boolean);
    for (const c of candidates) {
      if (!this.dirs.has(c) && !this.tryJs(c)) continue;
      const hit = rest ? this.tryJs(`${c}/${rest}`) || this.tryJs(`${c}/src/${rest}`) : this.tryJs(c) || this.tryJs(`${c}/src/index`);
      if (hit) return hit;
    }
    return null;
  }

  private resolveCss(dir: string, spec: string): string | null {
    const clean = spec.replace(/^~/, '');
    const base = join(dir, clean);
    const tries = [base, `${base}.css`, `${base}.scss`, join(dirname(base), `_${base.slice(base.lastIndexOf('/') + 1)}.scss`)];
    for (const t of tries) if (this.paths.has(t)) return t;
    return null;
  }

  private resolvePython(dir: string, spec: string): string | null {
    const m = /^(\.*)(.*)$/.exec(spec)!;
    const dots = m[1].length;
    const mod = m[2].replace(/\./g, '/');
    let base: string;
    if (dots > 0) {
      let d = dir;
      for (let i = 1; i < dots; i++) d = dirname(d);
      base = mod ? join(d, mod) : d;
    } else base = mod;
    const roots = dots > 0 ? [''] : ['', 'src/', 'lib/'];
    for (const r of roots) {
      const b = r + base;
      if (this.paths.has(`${b}.py`)) return `${b}.py`;
      if (this.paths.has(`${b}/__init__.py`)) return `${b}/__init__.py`;
      // `from pkg.module import name` where name is a symbol
      const parent = dirname(b);
      if (parent && this.paths.has(`${parent}.py`)) return `${parent}.py`;
    }
    return null;
  }

  private resolveC(dir: string, spec: string): string | null {
    const tries = [join(dir, spec), `include/${spec}`, spec, `src/${spec}`];
    for (const t of tries) if (this.paths.has(t)) return t;
    if (spec.includes('/')) {
      const base = spec.slice(spec.lastIndexOf('/') + 1);
      const hit = (this.byBasename.get(base) || []).find((p) => p.endsWith('/' + spec));
      if (hit) return hit;
    }
    return null;
  }

  private resolveGo(spec: string): string | null {
    const marker = `/${this.slug.split('/')[1]}/`;
    const idx = spec.indexOf(marker);
    if (idx === -1) return null;
    const dir = spec.slice(idx + marker.length);
    return this.dirs.has(dir) ? this.firstFileIn(dir, '.go') : null;
  }

  private resolveRust(path: string, spec: string): string | null {
    const srcIdx = path.lastIndexOf('src/');
    const crateRoot = srcIdx === -1 ? '' : path.slice(0, srcIdx + 3);
    let base: string;
    if (spec.startsWith('mod:')) base = join(dirname(path), spec.slice(4));
    else if (spec.startsWith('crate::')) base = join(crateRoot, spec.slice(7).split('::').slice(0, -1).join('/') || spec.slice(7));
    else if (spec.startsWith('super::')) base = join(dirname(dirname(path)), spec.slice(7).split('::')[0]);
    else return null;
    for (const t of [`${base}.rs`, `${base}/mod.rs`]) if (this.paths.has(t)) return t;
    return null;
  }
}

const JS_PATTERNS = [
  /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/g,
  /import\s*['"]([^'"]+)['"]/g,
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
];

export function extractSpecifiers(file: RepoFile, content: string): string[] {
  const out: string[] = [];
  const grab = (re: RegExp, group = 1) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) out.push(m[group]);
  };
  switch (file.ext) {
    case 'py':
      grab(/^\s*from\s+([.\w]+)\s+import/gm);
      grab(/^\s*import\s+([\w.]+)/gm);
      break;
    case 'c':
    case 'h':
    case 'cc':
    case 'cpp':
    case 'hpp':
      grab(/^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm);
      break;
    case 'go': {
      const block = /import\s*\(([\s\S]*?)\)/m.exec(content);
      if (block) {
        const re = /"([^"]+)"/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(block[1]))) out.push(m[1]);
      }
      grab(/^import\s+(?:\w+\s+)?"([^"]+)"/gm);
      break;
    }
    case 'rs':
      grab(/^\s*use\s+((?:crate|super)::[\w:]+)/gm);
      {
        const re = /^\s*(?:pub\s+)?mod\s+(\w+)\s*;/gm;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) out.push(`mod:${m[1]}`);
      }
      break;
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      grab(/@(?:import|use|forward)\s+(?:url\()?['"]([^'"]+)['"]/g);
      break;
    default:
      for (const re of JS_PATTERNS) grab(re);
  }
  return out.slice(0, 80);
}

export function resolveDependencies(file: RepoFile, content: string, resolver: ImportResolver): Dependency[] {
  const deps: Dependency[] = [];
  for (const spec of extractSpecifiers(file, content)) {
    const target = resolver.resolve(file, spec);
    if (target && target !== file.path) deps.push({ from: file.path, to: target });
  }
  return deps;
}
