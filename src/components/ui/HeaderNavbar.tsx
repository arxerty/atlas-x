import React, { useState } from 'react';
import { Globe, GitBranch, Search, Bot, Bug, Sparkles, Zap, Github, ChevronDown, Check } from 'lucide-react';
import { useAtlasStore, POPULAR_REPOSITORIES } from '../../stores/useAtlasStore';

export const HeaderNavbar: React.FC = () => {
  const toggleAICopilot = useAtlasStore((s) => s.toggleAICopilot);
  const isAICopilotOpen = useAtlasStore((s) => s.isAICopilotOpen);
  const toggleDebugger = useAtlasStore((s) => s.toggleDebugger);
  const isDebuggerActive = useAtlasStore((s) => s.isDebuggerActive);
  const isLiveStreaming = useAtlasStore((s) => s.isLiveStreaming);
  const toggleLiveStreaming = useAtlasStore((s) => s.toggleLiveStreaming);
  const searchQuery = useAtlasStore((s) => s.searchQuery);
  const setSearchQuery = useAtlasStore((s) => s.setSearchQuery);

  const connectedRepoName = useAtlasStore((s) => s.connectedRepoName);
  const connectRepo = useAtlasStore((s) => s.connectRepo);
  const setGithubModalOpen = useAtlasStore((s) => s.setGithubModalOpen);

  const language = useAtlasStore((s) => s.language);
  const setLanguage = useAtlasStore((s) => s.setLanguage);
  const t = useAtlasStore((s) => s.t);

  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 h-16 glass-panel border-b border-border z-30 px-6 flex items-center justify-between">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-rose-500 flex items-center justify-center shadow-glow">
          <Globe className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-wider text-white">ATLAS X</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              {t('digitalTwinVersion')}
            </span>
          </div>
          <p className="text-xs text-slate-400">{t('brandTagline')}</p>
        </div>
      </div>

      {/* GitHub Repo Selector Dropdown & Search Bar */}
      <div className="flex items-center gap-4">
        {/* INTERACTIVE GITHUB REPOSITORY DROPDOWN PICKER */}
        <div className="relative">
          <button
            onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-slate-700 hover:border-cyan-500 text-xs text-slate-200 transition group"
          >
            <Github className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono font-bold text-white">{connectedRepoName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Repository Selection Dropdown Menu */}
          {isRepoDropdownOpen && (
            <div className="absolute top-10 left-0 w-72 glass-panel rounded-xl border border-cyan-500/40 p-2 shadow-2xl z-50 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                Select GitHub Repository
              </div>

              {POPULAR_REPOSITORIES.map((repo) => (
                <div
                  key={repo.slug}
                  onClick={() => {
                    connectRepo(repo.slug);
                    setIsRepoDropdownOpen(false);
                  }}
                  className={`p-2 rounded-lg flex items-center justify-between text-xs font-mono cursor-pointer transition ${
                    connectedRepoName === repo.slug
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{repo.name}</span>
                  </div>
                  <span className="text-[10px] text-amber-400">★ {repo.stars}</span>
                </div>
              ))}

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsRepoDropdownOpen(false);
                    setGithubModalOpen(true);
                  }}
                  className="w-full text-center py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-cyan-400 font-mono"
                >
                  + Custom Repo URL...
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface/80 border border-border text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>
      </div>

      {/* Action Buttons & Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Language Switcher (RU / EN) */}
        <div className="flex items-center rounded-lg bg-surface border border-border p-0.5 text-xs font-mono">
          <button
            onClick={() => setLanguage('ru')}
            className={`px-2 py-1 rounded-md transition ${
              language === 'ru' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            RU 🇷🇺
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md transition ${
              language === 'en' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN 🇬🇧
          </button>
        </div>

        {/* Live Telemetry Stream Indicator */}
        <button
          onClick={toggleLiveStreaming}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition border ${
            isLiveStreaming
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(0,255,102,0.2)]'
              : 'bg-surface text-slate-400 border-border hover:text-slate-200'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isLiveStreaming ? 'text-emerald-400 animate-bounce' : ''}`} />
          {isLiveStreaming ? t('liveTelemetryOn') : t('liveTelemetryPaused')}
        </button>

        {/* Live Spatial Debugger Toggle */}
        <button
          onClick={toggleDebugger}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition border ${
            isDebuggerActive
              ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-glow-rose'
              : 'bg-surface text-slate-300 border-border hover:bg-slate-800'
          }`}
        >
          <Bug className="w-3.5 h-3.5 text-rose-400" />
          {t('spatialDebugger')}
        </button>

        {/* AI Copilot Drawer Toggle */}
        <button
          onClick={toggleAICopilot}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition border ${
            isAICopilotOpen
              ? 'bg-purple-950/90 text-purple-200 border-purple-400 shadow-glow-purple'
              : 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <Sparkles className="w-3 h-3 text-purple-400" />
          {t('aiGraphCopilot')}
        </button>
      </div>
    </header>
  );
};
