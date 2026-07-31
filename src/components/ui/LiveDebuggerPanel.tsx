import React from 'react';
import { Bug, Pause, Play, CornerDownRight, Variable, Code2 } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const LiveDebuggerPanel: React.FC = () => {
  const isDebuggerActive = useAtlasStore((s) => s.isDebuggerActive);
  const debuggerFrames = useAtlasStore((s) => s.debuggerFrames);
  const activeDebuggerFrameIndex = useAtlasStore((s) => s.activeDebuggerFrameIndex);
  const setDebuggerFrame = useAtlasStore((s) => s.setDebuggerFrame);

  if (!isDebuggerActive) return null;

  const currentFrame = debuggerFrames[activeDebuggerFrameIndex];

  return (
    <div className="absolute top-20 left-6 w-96 glass-panel p-4 rounded-2xl border border-rose-500/50 z-30 shadow-2xl flex flex-col gap-4">
      {/* Debugger Header */}
      <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-xs text-white">Spatial Live Debugger</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
          <Pause className="w-2.5 h-2.5" /> BREAKPOINT HIT
        </span>
      </div>

      {/* Call Stack Frames List */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-mono text-slate-400">Call Stack Trace</span>
        {debuggerFrames.map((frame, idx) => {
          const isActive = idx === activeDebuggerFrameIndex;
          return (
            <div
              key={frame.id}
              onClick={() => setDebuggerFrame(idx)}
              className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition flex items-center justify-between ${
                isActive
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                  : 'bg-surface/60 border-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CornerDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold">{frame.functionName}</span>
              </div>
              <span className="text-[10px] text-slate-400">Line {frame.line}</span>
            </div>
          );
        })}
      </div>

      {/* Floating 3D Variable Inspector Table */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
          <Variable className="w-3 h-3 text-cyan-400" /> Active Scope Variables
        </span>
        <div className="rounded-xl border border-border bg-surface/80 overflow-hidden divide-y divide-border/60 text-xs font-mono">
          {currentFrame.variables.map((v, i) => (
            <div key={i} className="p-2 flex items-center justify-between">
              <span className="text-purple-300 font-medium">{v.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">({v.type})</span>
                <span className="text-cyan-300">{v.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
