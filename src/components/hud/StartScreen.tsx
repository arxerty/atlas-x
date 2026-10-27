import React, { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { useT, TKey } from '../../system/i18n';
import { Logo } from './Logo';

export const POPULAR = ['facebook/react', 'vercel/next.js', 'vuejs/core', 'sveltejs/svelte', 'expressjs/express', 'fastapi/fastapi', 'denoland/deno', 'tailwindlabs/tailwindcss'];

export const StartScreen: React.FC = () => {
  const t = useT();
  const load = useSystemStore((s) => s.load);
  const loadRepo = useSystemStore((s) => s.loadRepo);
  const loadDemo = useSystemStore((s) => s.loadDemo);
  const lang = useSystemStore((s) => s.lang);
  const setLang = useSystemStore((s) => s.setLang);
  const [value, setValue] = useState('');

  const loading = load.status === 'loading';
  const submit = (slug: string) => {
    if (!slug.trim() || loading) return;
    loadRepo(slug.trim());
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_center,rgba(5,6,8,0.35)_0%,rgba(5,6,8,0.85)_70%)]">
      <button className="btn absolute top-4 right-4 mono text-[12px]" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
        {lang === 'ru' ? 'EN' : 'RU'}
      </button>

      <div className="w-full max-w-[460px]">
        <div className="flex items-center gap-2.5 mb-8">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Atlas X</span>
          <span className="text-[13px] text-[var(--text-3)]">· {t('tagline')}</span>
        </div>

        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{t('startTitle')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-2)]">{t('startSubtitle')}</p>

        <form
          className="mt-7 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('placeholder')}
            disabled={loading}
            spellCheck={false}
            className="flex-1 h-9 rounded-lg px-3 bg-white/[0.04] border border-[var(--line-strong)] outline-none text-[13px] mono placeholder:text-[var(--text-3)] placeholder:font-sans focus:border-[var(--accent)] transition-colors"
          />
          <button type="submit" className="btn-primary" disabled={loading || !value.trim()}>
            {t('open')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {loading ? (
          <Progress step={load.step} detail={load.detail} />
        ) : (
          <>
            {load.status === 'error' && (
              <div className="mt-3 text-[13px] text-[var(--danger)]">
                <span className="mono">{load.slug}</span>: {t(`err_${load.code}` as TKey)}
              </div>
            )}
            <div className="mt-6">
              <div className="label mb-2">{t('popular')}</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR.map((slug) => (
                  <button
                    key={slug}
                    onClick={() => {
                      setValue(slug);
                      submit(slug);
                    }}
                    className="h-7 px-2.5 rounded-md mono text-[12px] text-[var(--text-2)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--text)] transition-colors"
                  >
                    {slug}
                  </button>
                ))}
              </div>
            </div>
            <div className="divider my-6" />
            <button className="btn -ml-2.5" onClick={loadDemo}>
              {t('demo')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Progress: React.FC<{ step: number; detail?: string }> = ({ step, detail }) => {
  const t = useT();
  const steps: TKey[] = ['step1', 'step2', 'step3', 'step4'];
  return (
    <ul className="mt-6 flex flex-col gap-2">
      {steps.map((k, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'active' : 'todo';
        return (
          <li key={k} className={`flex items-center gap-2.5 text-[13px] ${state === 'todo' ? 'text-[var(--text-3)]' : 'text-[var(--text)]'}`}>
            <span className="w-4 h-4 flex items-center justify-center">
              {state === 'done' ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : state === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="w-1 h-1 rounded-full bg-current" />}
            </span>
            {t(k)}
            {state === 'active' && detail && <span className="mono text-[12px] text-[var(--text-3)]">{detail}</span>}
          </li>
        );
      })}
    </ul>
  );
};
