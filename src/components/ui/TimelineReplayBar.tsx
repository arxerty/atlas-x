import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, GitCommit, Sparkles, FastForward } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const TimelineReplayBar: React.FC = () => {
  const mode = useAtlasStore((s) => s.mode);
  const commits = useAtlasStore((s) => s.commits);
  const activeCommitIndex = useAtlasStore((s) => s.activeCommitIndex);
  const setActiveCommitIndex = useAtlasStore((s) => s.setActiveCommitIndex);
  const nextCommit = useAtlasStore((s) => s.nextCommit);

  const isReplayPlaying = useAtlasStore((s) => s.isReplayPlaying);
  const toggleReplayPlay = useAtlasStore((s) => s.toggleReplayPlay);
  const replaySpeed = useAtlasStore((s) => s.replaySpeed);
  const setReplaySpeed = useAtlasStore((s) => s.setReplaySpeed);
  const t = useAtlasStore((s) => s.t);

  // AUTOMATED CONTINUOUS REPLAY TIMER
  useEffect(() => {
    if (!isReplayPlaying || mode !== 'REPLAY') return;

    const intervalMs = Math.max(300, 2000 / replaySpeed);
    const timer = setInterval(() => {
      nextCommit();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isReplayPlaying, mode, replaySpeed, nextCommit]);

  if (mode !== 'REPLAY') return null;

  const currentCommit = commits[activeCommitIndex];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[720px] glass-panel p-4 rounded-2xl border border-cyan-500/40 z-30 shadow-2xl flex flex-col gap-3">
      {/* Title & AI Narration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white">{t('commitReplayTitle')}</span>
          {isReplayPlaying && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              AUTO PLAYING
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {t('commitCount').replace('{current}', String(activeCommitIndex + 1)).replace('{total}', String(commits.length))}
        </span>
      </div>

      {/* AI Architectural Decision Narration */}
      <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">{currentCommit.author}:</span> {currentCommit.aiNarration}
        </div>
      </div>

      {/* Controls & Speed Selectors */}
      <div className="flex items-center gap-4">
        {/* Navigation & Continuous Play Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveCommitIndex(Math.max(0, activeCommitIndex - 1))}
            className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 text-slate-300"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          {/* SINGLE CLICK CONTINUOUS PLAY / PAUSE BUTTON */}
          <button
            onClick={toggleReplayPlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition ${
              isReplayPlaying
                ? 'bg-amber-500 text-slate-950 shadow-glow-rose'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-glow'
            }`}
          >
            {isReplayPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isReplayPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <button
            onClick={() => setActiveCommitIndex((activeCommitIndex + 1) % commits.length)}
            className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 text-slate-300"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector (1x, 2x, 5x) */}
        <div className="flex items-center rounded-lg bg-surface border border-slate-800 p-0.5 text-xs font-mono">
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setReplaySpeed(speed)}
              className={`px-2 py-0.5 rounded transition ${
                replaySpeed === speed ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
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
