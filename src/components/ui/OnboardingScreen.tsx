import React, { useState } from 'react';
import { Globe, Github, Sparkles, ArrowRight, Layers, Cpu, Database, Zap, CheckCircle2 } from 'lucide-react';
import { useAtlasStore, POPULAR_REPOSITORIES } from '../../stores/useAtlasStore';

export const OnboardingScreen: React.FC = () => {
  const isParsingRepo = useAtlasStore((s) => s.isParsingRepo);
  const parseProgressMessage = useAtlasStore((s) => s.parseProgressMessage);
  const fetchAndLoadGithubRepo = useAtlasStore((s) => s.fetchAndLoadGithubRepo);
  const t = useAtlasStore((s) => s.t);

  const [inputUrl, setInputUrl] = useState('');

  const handleStartIngestion = (repoSlug: string) => {
    if (!repoSlug.trim()) return;
    fetchAndLoadGithubRepo(repoSlug);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C] text-slate-100 overflow-hidden font-sans">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-600/20 via-purple-600/20 to-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-4xl px-6 py-10 flex flex-col items-center gap-8 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-rose-500 flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] animate-pulse">
            <Globe className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            ATLAS X <span className="text-cyan-400 text-2xl font-mono">v2.4</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl font-medium">
            {t('brandTagline')} — Import any GitHub repository to generate its living 3D spatial digital twin before entering the world.
          </p>
        </div>

        {/* PARSING LOADER STATE */}
        {isParsingRepo ? (
          <div className="w-full max-w-xl glass-panel p-8 rounded-3xl border border-cyan-500/50 shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <h3 className="font-bold text-lg text-white font-mono flex items-center gap-2">
                Generating Digital Twin...
                <Sparkles className="w-4 h-4 text-cyan-400 animate-bounce" />
              </h3>
              <p className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1.5 rounded-lg border border-cyan-800">
                {parseProgressMessage}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-pulse w-full" />
            </div>

            <div className="grid grid-cols-4 gap-2 w-full text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800 text-center">
              <span className="text-cyan-400">✓ GitHub REST</span>
              <span className="text-purple-400">✓ Tree-sitter AST</span>
              <span className="text-emerald-400">✓ Neo4j Graph</span>
              <span className="text-amber-400">✓ NYC 3D Twin</span>
            </div>
          </div>
        ) : (
          /* ONBOARDING REPOSITORY SELECTION FORM */
          <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-6">
            {/* Repo Input Box */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
                <Github className="w-4 h-4 text-cyan-400" />
                {t('githubModalTitle')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={t('repoUrlPlaceholder')}
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartIngestion(inputUrl)}
                  className="w-full pl-4 pr-36 py-3.5 rounded-2xl bg-surface border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <button
                  onClick={() => handleStartIngestion(inputUrl || 'facebook/react')}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold text-xs text-slate-950 hover:opacity-90 transition shadow-glow flex items-center gap-1.5"
                >
                  {t('btnConnect')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popular Catalog Grid */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>{t('popularPresets')}</span>
                <span className="text-[10px] font-mono text-cyan-400">Select to load 3D twin</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {POPULAR_REPOSITORIES.map((repo) => (
                  <div
                    key={repo.slug}
                    onClick={() => handleStartIngestion(repo.slug)}
                    className="p-3.5 rounded-2xl bg-surface/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {repo.name}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">★ {repo.stars}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{repo.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-footer Information */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero config required
              </span>
              <span>Supported: TS, JS, Py, Go, Rust, Java, C++</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
