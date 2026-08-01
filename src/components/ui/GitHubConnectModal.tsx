import React, { useState } from 'react';
import { GitBranch, Github, X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const GitHubConnectModal: React.FC = () => {
  const isOpen = useAtlasStore((s) => s.isGithubModalOpen);
  const setOpen = useAtlasStore((s) => s.setGithubModalOpen);
  const connectRepo = useAtlasStore((s) => s.connectRepo);
  const t = useAtlasStore((s) => s.t);

  const [inputUrl, setInputUrl] = useState('');

  if (!isOpen) return null;

  const handleConnect = (url: string) => {
    if (!url.trim()) return;
    connectRepo(url);
    setInputUrl('');
  };

  const presetRepos = [
    { name: 'facebook/react', label: 'React Framework Core', stars: '228k' },
    { name: 'vercel/next.js', label: 'Next.js App Router Engine', stars: '124k' },
    { name: 'expressjs/express', label: 'Express Node.js Gateway', stars: '65k' },
    { name: 'torvalds/linux', label: 'Linux Kernel Subsystems', stars: '175k' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/40 p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{t('githubModalTitle')}</h2>
              <p className="text-xs text-slate-400">{t('githubModalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-slate-300 font-semibold">{t('repoUrlLabel')}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={t('repoUrlPlaceholder')}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect(inputUrl)}
              className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-surface border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleConnect(inputUrl)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition flex items-center gap-1"
            >
              {t('btnConnect')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Popular Preset Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-400 font-medium">{t('popularPresets')}</span>
          <div className="grid grid-cols-2 gap-2">
            {presetRepos.map((repo) => (
              <div
                key={repo.name}
                onClick={() => handleConnect(repo.name)}
                className="p-3 rounded-xl bg-surface/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-800/60 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white truncate">{repo.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[120px]">{repo.label}</span>
                  <span className="text-amber-400 font-mono">★ {repo.stars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl bg-surface text-slate-300 hover:text-white border border-slate-700 text-xs"
          >
            {t('btnCancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
