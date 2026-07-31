import React from 'react';
import { Play, Pause, SkipBack, SkipForward, GitCommit, Sparkles } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const TimelineReplayBar: React.FC = () => {
  const mode = useAtlasStore((s) => s.mode);
  const commits = useAtlasStore((s) => s.commits);
  const activeCommitIndex = useAtlasStore((s) => s.activeCommitIndex);
  const setActiveCommitIndex = useAtlasStore((s) => s.setActiveCommitIndex);

  if (mode !== 'REPLAY') return null;

  const currentCommit = commits[activeCommitIndex];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[700px] glass-panel p-4 rounded-2xl border border-cyan-500/40 z-30 shadow-2xl flex flex-col gap-3">
      {/* Title & AI Narration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white">Git Commit Architecture Replay</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Commit {activeCommitIndex + 1} of {commits.length}
        </span>
      </div>

      {/* AI Architectural Decision Narration */}
      <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">{currentCommit.author}:</span> {currentCommit.aiNarration}
        </div>
      </div>

      {/* Timeline Slider & Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCommitIndex(Math.max(0, activeCommitIndex - 1))}
            className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 text-slate-300"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveCommitIndex((activeCommitIndex + 1) % commits.length)}
            className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={() => setActiveCommitIndex(Math.min(commits.length - 1, activeCommitIndex + 1))}
            className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 text-slate-300"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Commit Scrub Bar */}
        <input
          type="range"
          min={0}
          max={commits.length - 1}
          value={activeCommitIndex}
          onChange={(e) => setActiveCommitIndex(parseInt(e.target.value))}
          className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="text-right">
          <div className="font-mono text-xs text-cyan-300 font-bold">{currentCommit.sha}</div>
          <div className="text-[10px] text-slate-400">{currentCommit.date}</div>
        </div>
      </div>
    </div>
  );
};
