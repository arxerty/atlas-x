import React from 'react';
import { ChevronRight, Github, Search, Star } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT } from '../../system/i18n';
import { Logo } from './Logo';

export const TopBar: React.FC = () => {
  const t = useT();
  const system = useSystemStore((s) => s.system);
  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);
  const selectedFileId = useSystemStore((s) => s.selectedFileId);
  const overview = useSystemStore((s) => s.overview);
  const focusPlanet = useSystemStore((s) => s.focusPlanet);
  const setPaletteOpen = useSystemStore((s) => s.setPaletteOpen);
  const lang = useSystemStore((s) => s.lang);
  const setLang = useSystemStore((s) => s.setLang);

  const repo = system.repo;
  const planet = system.planets.find((p) => p.id === focusedPlanetId);
  const file = selectedFileId ? system.files.get(selectedFileId) : null;

  return (
    <header className="absolute top-3 left-3 right-3 z-30 flex items-center gap-2 pointer-events-none">
      <div className="panel pointer-events-auto flex items-center h-11 pl-3 pr-1.5 gap-1 min-w-0">
        <Logo size={20} />
        <span className="font-semibold tracking-tight ml-1.5 mr-1 hidden sm:inline">Atlas X</span>
        <span className="text-[var(--text-3)] mx-1 hidden sm:inline">/</span>
        <button className="btn mono text-[12.5px] px-2 min-w-0" onClick={overview} title={repo.description}>
          <span className="truncate max-w-[220px]">{repo.slug}</span>
        </button>
        {repo.source === 'demo' ? (
          <span className="text-[11px] px-1.5 py-0.5 rounded border border-[var(--line-strong)] text-[var(--text-3)]">{t('demoBadge')}</span>
        ) : (
          <span className="hidden md:flex items-center gap-2 text-[12px] text-[var(--text-3)] mr-1">
            <span className="mono">{repo.branch}</span>
            {repo.stars !== null && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {Intl.NumberFormat(lang, { notation: 'compact' }).format(repo.stars)}
              </span>
            )}
          </span>
        )}
        {planet && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" />
            <button className="btn px-2 min-w-0" onClick={() => focusPlanet(planet.id)}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: planet.palette.atmosphere }} />
              <span className="truncate max-w-[140px]">{planet.name}</span>
            </button>
          </>
        )}
        {file && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0 hidden md:block" />
            <span className="mono text-[12.5px] text-[var(--text)] px-2 truncate max-w-[200px] hidden md:block">{file.name}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="panel pointer-events-auto flex items-center h-11 px-1.5 gap-1">
        <button className="btn text-[var(--text-3)] pr-1.5" onClick={() => setPaletteOpen(true)}>
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[var(--text-2)]">{t('search')}</span>
          <span className="kbd ml-2 hidden sm:inline-flex">Ctrl K</span>
        </button>
        <div className="w-px h-5 bg-[var(--line)]" />
        <button className="btn mono text-[12px] px-2" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
          {lang.toUpperCase()}
        </button>
        {repo.source === 'github' && (
          <a className="icon-btn" href={`https://github.com/${repo.slug}`} target="_blank" rel="noreferrer" title="GitHub">
            <Github className="w-4 h-4" />
          </a>
        )}
      </div>
    </header>
  );
};
