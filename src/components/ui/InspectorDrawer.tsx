import React from 'react';
import { X, FileCode, Layers, Activity, AlertTriangle, ArrowUpRight, Cpu, HardDrive } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const InspectorDrawer: React.FC = () => {
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const buildings = useAtlasStore((s) => s.buildings);
  const selectBuilding = useAtlasStore((s) => s.selectBuilding);

  const building = buildings.find((b) => b.id === selectedBuildingId);
  if (!building) return null;

  return (
    <div className="absolute top-20 right-6 w-96 glass-panel rounded-2xl border border-border z-30 p-5 shadow-2xl flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Drawer Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 font-bold font-mono text-xs"
            style={{ backgroundColor: building.color }}
          >
            {building.type === 'file' ? 'AST' : building.type.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-sm text-white font-mono">{building.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">{building.path}</p>
          </div>
        </div>
        <button
          onClick={() => selectBuilding(null)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Lines of Code</span>
          <span className="font-mono text-base font-bold text-cyan-400">{building.linesOfCode || 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Complexity Index</span>
          <span className={`font-mono text-base font-bold ${building.complexity > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {building.complexity || '0'}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Telemetry Throughput</span>
          <span className="font-mono text-sm font-semibold text-emerald-300">{building.rps ? `${building.rps} req/s` : 'Idle'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-mono">P99 Latency</span>
          <span className="font-mono text-sm font-semibold text-purple-300">{building.latencyMs ? `${building.latencyMs} ms` : '0 ms'}</span>
        </div>
      </div>

      {/* AST Function Rooms List */}
      {building.functions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              AST Function Rooms ({building.functions.length})
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {building.functions.map((fn) => (
              <div
                key={fn.id}
                className="p-2 rounded-lg bg-surface/60 border border-border/80 flex items-center justify-between text-xs font-mono hover:border-cyan-500/50 transition cursor-pointer"
              >
                <span className="text-slate-200">{fn.name}</span>
                <span className="text-[10px] text-slate-400">{fn.linesOfCode} LoC</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependency Links */}
      {building.dependencies.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
            Outbound Highways ({building.dependencies.length})
          </span>
          <div className="flex flex-col gap-1.5">
            {building.dependencies.map((targetId) => {
              const targetNode = buildings.find((b) => b.id === targetId);
              return (
                <div
                  key={targetId}
                  onClick={() => selectBuilding(targetId)}
                  className="p-2 rounded-lg bg-surface/60 border border-border flex items-center justify-between text-xs font-mono text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <span>{targetNode?.name || targetId}</span>
                  <span className="text-[10px] text-slate-400">Highway</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
