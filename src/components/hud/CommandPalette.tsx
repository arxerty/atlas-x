import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, FileCode2, FolderGit2, Globe2, Orbit, Rocket, Tag, Telescope } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT, TKey } from '../../system/i18n';
import { classifyFile } from '../../system/classify';
import { normalizeSlug } from '../../system/loadRepo';
import { POPULAR } from './StartScreen';

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export const CommandPalette: React.FC = () => {
  const t = useT();
  const open = useSystemStore((s) => s.paletteOpen);
  const setOpen = useSystemStore((s) => s.setPaletteOpen);
  const system = useSystemStore((s) => s.system);
  const load = useSystemStore((s) => s.load);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const s = useSystemStore.getState();
    const q = query.trim().toLowerCase();
    const close = (fn: () => void) => () => {
      fn();
      setOpen(false);
    };
    const out: Item[] = [];

    const slug = normalizeSlug(query);
    if (/^[\w.-]+\/[\w.-]+$/.test(slug) && !system.files.has(query.trim())) {
      out.push({ id: 'load:' + slug, group: t('openRepo'), label: `${t('loadRepoX')} ${slug}`, icon: <FolderGit2 className="w-4 h-4" />, run: close(() => s.loadRepo(slug)) });
    }

    const planets = system.planets.filter((p) => !q || p.name.toLowerCase().includes(q));
    planets.slice(0, q ? 6 : 12).forEach((p) =>
      out.push({
        id: 'planet:' + p.id,
        group: t('planets'),
        label: p.name,
        hint: `${p.totalFiles} ${t('filesShort')}`,
        icon: <span className="w-2.5 h-2.5 rounded-full mx-[3px]" style={{ background: p.palette.atmosphere }} />,
        run: close(() => s.focusPlanet(p.id)),
      }),
    );

    if (q) {
      const files = [...system.files.values()]
        .map((f) => {
          const name = f.name.toLowerCase();
          const path = f.path.toLowerCase();
          const score = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : path.includes(q) ? 3 : -1;
          return { f, score };
        })
        .filter((x) => x.score >= 0)
        .sort((a, b) => a.score - b.score || a.f.path.length - b.f.path.length)
        .slice(0, 30);
      files.forEach(({ f }) =>
        out.push({
          id: 'file:' + f.id,
          group: t('files'),
          label: f.name,
          hint: f.path,
          icon: <FileCode2 className="w-4 h-4" style={{ color: classifyFile(f.path).color }} />,
          run: close(() => s.selectFile(f.id)),
        }),
      );
    }

    const actions: Item[] = [
      { id: 'a:overview', group: t('actions'), label: t('overview'), icon: <Telescope className="w-4 h-4" />, run: close(s.overview) },
      { id: 'a:rockets', group: t('actions'), label: t('rockets'), hint: s.showRockets ? 'on' : 'off', icon: <Rocket className="w-4 h-4" />, run: close(() => s.toggle('showRockets')) },
      { id: 'a:orbits', group: t('actions'), label: t('orbits'), hint: s.showOrbits ? 'on' : 'off', icon: <Orbit className="w-4 h-4" />, run: close(() => s.toggle('showOrbits')) },
      { id: 'a:labels', group: t('actions'), label: t('labels'), hint: s.showLabels ? 'on' : 'off', icon: <Tag className="w-4 h-4" />, run: close(() => s.toggle('showLabels')) },
      { id: 'a:demo', group: t('actions'), label: t('demo'), icon: <Globe2 className="w-4 h-4" />, run: close(s.loadDemo) },
    ];
    out.push(...actions.filter((a) => !q || a.label.toLowerCase().includes(q)));

    if (!q) {
      POPULAR.forEach((p) =>
        out.push({ id: 'pop:' + p, group: t('popular'), label: p, icon: <FolderGit2 className="w-4 h-4" />, run: close(() => s.loadRepo(p)) }),
      );
    }
    return out;
  }, [query, system, t, setOpen]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  let lastGroup = '';
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-black/40" onMouseDown={() => setOpen(false)}>
      <div className="panel !bg-[var(--panel-solid)]/95 w-full max-w-[560px] overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          spellCheck={false}
          className="w-full h-12 px-4 bg-transparent outline-none text-[14px] placeholder:text-[var(--text-3)] border-b border-[var(--line)]"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter') {
              items[active]?.run();
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {load.status === 'loading' && <div className="px-4 py-2 text-[12px] text-[var(--text-3)] border-b border-[var(--line)] mono">{load.slug}…</div>}
        {load.status === 'error' && <div className="px-4 py-2 text-[12px] text-[var(--danger)] border-b border-[var(--line)]">{load.slug}: {t(`err_${load.code}` as TKey)}</div>}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {items.length === 0 && <div className="px-3 py-6 text-center text-[var(--text-3)]">{t('nothingFound')}</div>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <React.Fragment key={item.id}>
                {header && <div className="label px-2.5 pt-2.5 pb-1">{header}</div>}
                <button
                  data-index={i}
                  className="row !h-9"
                  data-active={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={item.run}
                >
                  <span className="text-[var(--text-3)] flex items-center">{item.icon}</span>
                  <span className={`truncate ${item.group === t('files') ? 'mono text-[12.5px]' : ''}`}>{item.label}</span>
                  {item.hint && <span className="ml-auto pl-3 truncate text-[11.5px] text-[var(--text-3)] mono max-w-[55%]">{item.hint}</span>}
                  {i === active && !item.hint && <CornerDownLeft className="ml-auto w-3.5 h-3.5 text-[var(--text-3)]" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
