import React from 'react';
import { Eye, Activity, History, GitCompare, Bug } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { TwinMode } from '../../types/atlas';

export const ModeSwitcherBar: React.FC = () => {
  const mode = useAtlasStore((s) => s.mode);
  const setMode = useAtlasStore((s) => s.setMode);

  const modes: { id: TwinMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'EXPLORE', label: 'Static Twin', icon: Eye },
    { id: 'LIVE_RUNTIME', label: 'Live Telemetry', icon: Activity },
    { id: 'REPLAY', label: 'Architecture Replay', icon: History },
    { id: 'SIMULATION', label: 'What-If Sandbox', icon: GitCompare },
    { id: 'DEBUGGER', label: 'Live Debugger', icon: Bug },
  ];

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 glass-panel px-2 py-1.5 rounded-xl border border-border z-30 flex items-center gap-1 shadow-2xl">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 border border-cyan-500/50 shadow-glow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
};
