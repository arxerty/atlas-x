import React, { useMemo, useState } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Rocket } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT } from '../../system/i18n';

export const Navigator: React.FC = () => {
  const t = useT();
  const system = useSystemStore((s) => s.system);
  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);
  const selectedFileId = useSystemStore((s) => s.selectedFileId);
  const focusPlanet = useSystemStore((s) => s.focusPlanet);
  const selectFile = useSystemStore((s) => s.selectFile);
  const open = useSystemStore((s) => s.navigatorOpen);
  const toggle = useSystemStore((s) => s.toggle);
  const [legendOpen, setLegendOpen] = useState(false);

  const flights = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of system.crossDependencies) {
      const a = system.files.get(d.from)!.planetId;
      const b = system.files.get(d.to)!.planetId;
      m.set(a, (m.get(a) || 0) + 1);
      m.set(b, (m.get(b) || 0) + 1);
    }
    return m;
  }, [system]);

  const selectedDistrict = selectedFileId ? system.files.get(selectedFileId)?.districtId : null;

  if (!open) {
    return (
      <button className="panel icon-btn absolute left-3 top-[68px] z-30 !w-10 !h-10" onClick={() => toggle('navigatorOpen')} title={t('planets')}>
        <PanelLeftOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="panel absolute left-3 top-[68px] bottom-3 z-30 w-[248px] hidden sm:flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pl-3.5 pr-1.5 h-10 shrink-0">
        <span className="label">{t('planets')}</span>
        <button className="icon-btn !w-7 !h-7" onClick={() => toggle('navigatorOpen')}>
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {system.planets.map((p) => {
          const active = p.id === focusedPlanetId;
          return (
            <div key={p.id}>
              <button className="row" data-active={active} onClick={() => focusPlanet(p.id)}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background: p.palette.atmosphere, color: p.palette.atmosphere }} />
                <span className="flex-1 truncate">{p.name}</span>
                {flights.get(p.id) ? (
                  <span className="flex items-center gap-0.5 text-[11px] text-[var(--text-3)]" title={t('crossLinks')}>
                    <Rocket className="w-3 h-3" />
                    {flights.get(p.id)}
                  </span>
                ) : null}
                <span className="mono text-[11px] text-[var(--text-3)] w-9 text-right">{p.totalFiles}</span>
              </button>
              {active && (
                <div className="ml-[17px] pl-2 border-l border-[var(--line)] my-1">
                  {p.districts.map((d) => (
                    <button
                      key={d.id}
                      className="row !h-7 text-[12.5px]"
                      data-active={d.id === selectedDistrict}
                      onClick={() => selectFile(d.fileIds[0])}
                    >
                      <span className="flex-1 truncate">{d.name === '/' ? p.name : d.name.split('/').slice(1).join('/') || d.name}</span>
                      <span className="mono text-[11px] text-[var(--text-3)]">{d.fileIds.length}</span>
                    </button>
                  ))}
                  {p.totalFiles > p.fileIds.length && (
                    <div className="px-2.5 py-1 text-[11.5px] text-[var(--text-3)]">
                      {p.fileIds.length} {t('shown')} · {p.totalFiles - p.fileIds.length} {t('hidden')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--line)] shrink-0">
        <button className="flex items-center justify-between w-full px-3.5 h-9 label hover:text-[var(--text-2)]" onClick={() => setLegendOpen(!legendOpen)}>
          {t('legend')}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${legendOpen ? '' : '-rotate-90'}`} />
        </button>
        {legendOpen && (
          <ul className="px-3.5 pb-3 flex flex-col gap-1.5 text-[12px] text-[var(--text-2)]">
            {(['legendTower', 'legendHex', 'legendCyl', 'legendSlab', 'legendDome', 'legendPark', 'legendRocket', 'sun'] as const).map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};
