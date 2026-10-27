import React from 'react';
import { Orbit, Pause, Play, Rocket, Tag, Telescope } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT } from '../../system/i18n';

const SPEEDS = [0.25, 1, 4];

export const BottomBar: React.FC = () => {
  const t = useT();
  const paused = useSystemStore((s) => s.paused);
  const speed = useSystemStore((s) => s.speed);
  const togglePaused = useSystemStore((s) => s.togglePaused);
  const setSpeed = useSystemStore((s) => s.setSpeed);
  const showRockets = useSystemStore((s) => s.showRockets);
  const showLabels = useSystemStore((s) => s.showLabels);
  const showOrbits = useSystemStore((s) => s.showOrbits);
  const toggle = useSystemStore((s) => s.toggle);
  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);
  const overview = useSystemStore((s) => s.overview);
  const system = useSystemStore((s) => s.system);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      <div className="panel flex items-center h-11 px-1.5 gap-1">
        <button className="icon-btn" onClick={togglePaused} title={paused ? t('play') : t('pause')}>
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        {SPEEDS.map((s) => (
          <button key={s} className="btn mono text-[12px] !px-2" data-active={!paused && speed === s} onClick={() => setSpeed(s)}>
            {s}×
          </button>
        ))}
        <div className="w-px h-5 bg-[var(--line)] mx-0.5" />
        <button className="icon-btn" data-active={showRockets} onClick={() => toggle('showRockets')} title={t('rockets')}>
          <Rocket className="w-4 h-4" />
        </button>
        <button className="icon-btn" data-active={showOrbits} onClick={() => toggle('showOrbits')} title={t('orbits')}>
          <Orbit className="w-4 h-4" />
        </button>
        <button className="icon-btn" data-active={showLabels} onClick={() => toggle('showLabels')} title={t('labels')}>
          <Tag className="w-4 h-4" />
        </button>
        {focusedPlanetId && (
          <>
            <div className="w-px h-5 bg-[var(--line)] mx-0.5" />
            <button className="btn" onClick={overview}>
              <Telescope className="w-4 h-4" />
              <span className="hidden sm:inline">{t('overview')}</span>
            </button>
          </>
        )}
      </div>
      <div className="panel hidden lg:flex items-center h-11 px-3.5 gap-1.5 text-[12px] text-[var(--text-3)]">
        <Rocket className="w-3.5 h-3.5" />
        <span className="mono text-[var(--text-2)]">{system.crossDependencies.length}</span> {t('crossLinks')}
      </div>
    </div>
  );
};
