import React from 'react';
import { GitCompare, TrendingDown, DollarSign, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { MOCK_SIMULATIONS } from '../../data/mockRepositoryTwin';

export const WhatIfSimulationModal: React.FC = () => {
  const mode = useAtlasStore((s) => s.mode);
  const activeSimulation = useAtlasStore((s) => s.activeSimulation);
  const setActiveSimulation = useAtlasStore((s) => s.setActiveSimulation);
  const t = useAtlasStore((s) => s.t);

  if (mode !== 'SIMULATION') return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[850px] glass-panel p-5 rounded-2xl border border-purple-500/40 z-30 shadow-2xl flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-purple-400" />
          <h2 className="font-bold text-sm text-white">{t('simulationTitle')}</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{t('simulationSubtitle')}</span>
      </div>

      {/* Preset Scenarios Tabs */}
      <div className="grid grid-cols-2 gap-3">
        {MOCK_SIMULATIONS.map((sim) => {
          const isSelected = activeSimulation?.id === sim.id;
          return (
            <div
              key={sim.id}
              onClick={() => setActiveSimulation(sim)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-950/50 border-purple-500 shadow-glow-purple'
                  : 'bg-surface/70 border-border hover:border-slate-600'
              }`}
            >
              <div>
                <h3 className="font-bold text-xs text-white mb-1">{sim.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{sim.description}</p>
              </div>

              {/* Quick Metrics Delta Badge */}
              <div className="mt-3 flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {sim.metricsDelta.latencyPct}% Latency
                </span>
                <span className="text-amber-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />+${sim.metricsDelta.costUsd}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Selected Simulation Impact Comparison */}
      {activeSimulation && (
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{t('estLatency')}</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {activeSimulation.metricsDelta.latencyPct}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{t('costDelta')}</span>
              <div className="text-lg font-bold text-amber-400 font-mono">
                +${activeSimulation.metricsDelta.costUsd} / mo
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{t('complexityReduction')}</span>
              <div className="text-lg font-bold text-cyan-400 font-mono">
                {activeSimulation.metricsDelta.complexityDelta} Index
              </div>
            </div>
          </div>

          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold text-xs text-white hover:opacity-90 transition shadow-glow flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t('applyPlan')}
          </button>
        </div>
      )}
    </div>
  );
};
