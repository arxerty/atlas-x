import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Rocket, X } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT, formatBytes } from '../../system/i18n';
import { KIND_LABELS, classifyFile } from '../../system/classify';
import { PlanetData, SystemData } from '../../system/types';

export const Inspector: React.FC = () => {
  const system = useSystemStore((s) => s.system);
  const selectedFileId = useSystemStore((s) => s.selectedFileId);
  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);

  if (selectedFileId && system.files.has(selectedFileId)) return <FileCard system={system} fileId={selectedFileId} />;
  const planet = system.planets.find((p) => p.id === focusedPlanetId);
  if (planet) return <PlanetCard system={system} planet={planet} />;
  return null;
};

const Shell: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <aside className="panel absolute right-3 top-[68px] z-30 w-[min(340px,calc(100vw-24px))] max-h-[calc(100vh-150px)] flex flex-col overflow-hidden">
    <button className="icon-btn !w-7 !h-7 absolute top-2.5 right-2.5" onClick={onClose}>
      <X className="w-3.5 h-3.5" />
    </button>
    <div className="overflow-y-auto p-4">{children}</div>
  </aside>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11.5px] text-[var(--text-3)]">{label}</span>
    <span className="text-[13px] text-[var(--text)]">{value}</span>
  </div>
);

const FileCard: React.FC<{ system: SystemData; fileId: string }> = ({ system, fileId }) => {
  const t = useT();
  const lang = useSystemStore((s) => s.lang);
  const selectFile = useSystemStore((s) => s.selectFile);
  const file = system.files.get(fileId)!;
  const planet = system.planets.find((p) => p.id === file.planetId)!;
  const district = planet.districts.find((d) => d.id === file.districtId);
  const imports = system.importsOf.get(fileId) || [];
  const importedBy = system.importedBy.get(fileId) || [];
  const color = classifyFile(file.path).color;
  const dir = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/') + 1) : '';

  return (
    <Shell onClose={() => selectFile(null)}>
      <div className="flex items-center gap-2 pr-8">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
        <h2 className="mono text-[14px] font-medium truncate">{file.name}</h2>
      </div>
      <div className="mono text-[11.5px] text-[var(--text-3)] mt-1 break-all">{dir || '/'}</div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        <Stat label={t('size')} value={formatBytes(file.size)} />
        <Stat label={t('lines')} value={file.lines !== null ? file.lines.toLocaleString(lang) : `${t('estimated')}${Math.max(1, Math.round(file.size / 32)).toLocaleString(lang)}`} />
        <Stat label={t('language')} value={file.language} />
        <Stat label={t('kind')} value={KIND_LABELS[file.kind][lang]} />
        <Stat
          label={t('planets')}
          value={
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: planet.palette.atmosphere }} />
              {planet.name}
            </span>
          }
        />
        <Stat label={t('district')} value={<span className="truncate block">{district?.name === '/' ? planet.name : district?.name.split('/').pop()}</span>} />
      </div>

      <LinkList title={t('imports')} icon={<ArrowUpRight className="w-3.5 h-3.5" />} ids={imports} system={system} from={file.planetId} />
      <LinkList title={t('importedBy')} icon={<ArrowDownLeft className="w-3.5 h-3.5" />} ids={importedBy} system={system} from={file.planetId} />

      {system.repo.source === 'github' && (
        <a
          className="btn -ml-2.5 mt-4"
          href={`https://github.com/${system.repo.slug}/blob/${system.repo.branch}/${file.path}`}
          target="_blank"
          rel="noreferrer"
        >
          {t('openOnGithub')} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </Shell>
  );
};

const LinkList: React.FC<{ title: string; icon: React.ReactNode; ids: string[]; system: SystemData; from: string }> = ({ title, icon, ids, system, from }) => {
  const t = useT();
  const selectFile = useSystemStore((s) => s.selectFile);
  return (
    <div className="mt-5">
      <div className="flex items-center gap-1.5 label mb-1.5">
        {icon}
        {title}
        <span className="ml-auto mono normal-case tracking-normal">{ids.length}</span>
      </div>
      {ids.length === 0 ? (
        <div className="text-[12px] text-[var(--text-3)] px-0.5">{t('noLinks')}</div>
      ) : (
        <div className="-mx-2.5">
          {ids.slice(0, 40).map((id) => {
            const f = system.files.get(id)!;
            const p = system.planets.find((pl) => pl.id === f.planetId)!;
            const cross = f.planetId !== from;
            return (
              <button key={id} className="row !h-7" onClick={() => selectFile(id)} title={f.path}>
                <span className="mono text-[12px] truncate flex-1 text-left">{f.name}</span>
                {cross && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--text-3)] shrink-0">
                    <Rocket className="w-3 h-3" />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.palette.atmosphere }} />
                    {p.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PlanetCard: React.FC<{ system: SystemData; planet: PlanetData }> = ({ system, planet }) => {
  const t = useT();
  const lang = useSystemStore((s) => s.lang);
  const overview = useSystemStore((s) => s.overview);
  const focusPlanet = useSystemStore((s) => s.focusPlanet);

  const { languages, routes, bytes } = useMemo(() => {
    const langs = new Map<string, { n: number; color: string }>();
    let total = 0;
    for (const id of planet.fileIds) {
      const f = system.files.get(id)!;
      total += f.size;
      const cur = langs.get(f.language) || { n: 0, color: classifyFile(f.path).color };
      cur.n += 1;
      langs.set(f.language, cur);
    }
    const routeMap = new Map<string, { out: number; in: number }>();
    for (const d of system.crossDependencies) {
      const a = system.files.get(d.from)!.planetId;
      const b = system.files.get(d.to)!.planetId;
      if (a === planet.id) {
        const r = routeMap.get(b) || { out: 0, in: 0 };
        r.out++;
        routeMap.set(b, r);
      } else if (b === planet.id) {
        const r = routeMap.get(a) || { out: 0, in: 0 };
        r.in++;
        routeMap.set(a, r);
      }
    }
    return {
      languages: [...langs.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 6),
      routes: [...routeMap.entries()].sort((a, b) => b[1].out + b[1].in - (a[1].out + a[1].in)),
      bytes: total,
    };
  }, [planet, system]);

  return (
    <Shell onClose={overview}>
      <div className="flex items-center gap-2 pr-8">
        <span className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ background: planet.palette.atmosphere, color: planet.palette.atmosphere }} />
        <h2 className="text-[15px] font-semibold truncate">{planet.name}</h2>
      </div>
      <div className="mono text-[11.5px] text-[var(--text-3)] mt-1">{planet.id === '/' ? '/' : `${planet.id}/`}</div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label={t('files')} value={planet.totalFiles.toLocaleString(lang)} />
        <Stat label={t('district')} value={planet.districts.length} />
        <Stat label={t('size')} value={formatBytes(bytes)} />
      </div>

      <div className="mt-5">
        <div className="label mb-2">{t('language')}</div>
        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
          {languages.map(([name, v]) => (
            <span key={name} style={{ flex: v.n, background: v.color }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {languages.map(([name, v]) => (
            <span key={name} className="flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.color }} />
              {name}
              <span className="text-[var(--text-3)] mono text-[11px]">{v.n}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-1.5 label mb-1.5">
          <Rocket className="w-3.5 h-3.5" />
          {t('flights')}
        </div>
        {routes.length === 0 ? (
          <div className="text-[12px] text-[var(--text-3)]">{t('noLinks')}</div>
        ) : (
          <div className="-mx-2.5">
            {routes.map(([pid, r]) => {
              const p = system.planets.find((pl) => pl.id === pid)!;
              return (
                <button key={pid} className="row !h-7" onClick={() => focusPlanet(pid)}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.palette.atmosphere }} />
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  <span className="mono text-[11px] text-[var(--text-3)] flex items-center gap-2">
                    <span className="flex items-center"><ArrowUpRight className="w-3 h-3" />{r.out}</span>
                    <span className="flex items-center"><ArrowDownLeft className="w-3 h-3" />{r.in}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
};
