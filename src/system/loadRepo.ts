import { Dependency, RawTreeEntry, RepoFile, RepoInfo, SystemData } from './types';
import { layoutSystem, selectFiles } from './layout';
import { ImportResolver, resolveDependencies } from './imports';
import { PARSABLE_EXTS } from './classify';

const MAX_PARSED = 260;
const MAX_PARSE_SIZE = 160_000;
const CONCURRENCY = 10;

export class RepoLoadError extends Error {
  constructor(public code: 'not_found' | 'rate_limit' | 'network' | 'empty', message: string) {
    super(message);
  }
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/(tree|blob)\/.*$/, '')
    .replace(/^\/+|\/+$/g, '');
}

async function getJson(url: string) {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  } catch {
    throw new RepoLoadError('network', 'network');
  }
  if (res.status === 404) throw new RepoLoadError('not_found', 'not_found');
  if (res.status === 403 || res.status === 429) throw new RepoLoadError('rate_limit', 'rate_limit');
  if (!res.ok) throw new RepoLoadError('network', `HTTP ${res.status}`);
  return res.json();
}

export async function loadGithubRepo(input: string, onProgress: (step: number, detail?: string) => void): Promise<SystemData> {
  const slug = normalizeSlug(input);
  if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) throw new RepoLoadError('not_found', 'bad_slug');

  onProgress(1);
  const meta = await getJson(`https://api.github.com/repos/${slug}`);
  const branch: string = meta.default_branch || 'main';

  onProgress(2);
  const tree = await getJson(`https://api.github.com/repos/${slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const entries: RawTreeEntry[] = (tree.tree || [])
    .filter((e: any) => e.type === 'blob' && !/(^|\/)(node_modules|\.git)\//.test(e.path))
    .map((e: any) => ({ path: e.path as string, size: (e.size as number) || 0 }));
  if (!entries.length) throw new RepoLoadError('empty', 'empty');

  const selection = selectFiles(entries);

  // pick source files to read, spread evenly over planets
  const perPlanet = selection.planets.map((p) =>
    p.fileIds
      .map((id) => selection.files.find((f) => f.id === id)!)
      .filter((f) => PARSABLE_EXTS.has(f.ext) && f.size > 0 && f.size < MAX_PARSE_SIZE),
  );
  const toParse: RepoFile[] = [];
  for (let round = 0; toParse.length < MAX_PARSED; round++) {
    let any = false;
    for (const list of perPlanet) {
      if (round < list.length && toParse.length < MAX_PARSED) {
        toParse.push(list[round]);
        any = true;
      }
    }
    if (!any) break;
  }

  const resolver = new ImportResolver(entries.map((e) => e.path), slug);
  const deps: Dependency[] = [];
  let done = 0;
  let cursor = 0;
  onProgress(3, `0 / ${toParse.length}`);

  const worker = async () => {
    while (cursor < toParse.length) {
      const file = toParse[cursor++];
      try {
        const res = await fetch(`https://raw.githubusercontent.com/${slug}/${branch}/${file.path.split('/').map(encodeURIComponent).join('/')}`);
        if (res.ok) {
          const text = await res.text();
          file.lines = text.split('\n').length;
          deps.push(...resolveDependencies(file, text, resolver));
        }
      } catch {
        // a single unreadable file should not break the whole system
      }
      done++;
      if (done % 8 === 0 || done === toParse.length) onProgress(3, `${done} / ${toParse.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  onProgress(4);
  const repo: RepoInfo = {
    slug: meta.full_name || slug,
    branch,
    description: meta.description || '',
    stars: typeof meta.stargazers_count === 'number' ? meta.stargazers_count : null,
    source: 'github',
    totalFiles: entries.length,
    parsedFiles: toParse.length,
  };
  return layoutSystem(selection, deps, repo);
}
