import { create } from 'zustand';
import { SystemData } from '../system/types';
import { buildDemoSystem } from '../system/demoRepo';
import { loadGithubRepo, RepoLoadError } from '../system/loadRepo';
import type { Lang } from '../system/i18n';

export type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; slug: string; step: number; detail?: string }
  | { status: 'error'; slug: string; code: RepoLoadError['code'] };

interface SystemState {
  system: SystemData;
  load: LoadState;
  started: boolean;
  lang: Lang;

  focusedPlanetId: string | null;
  selectedFileId: string | null;
  hoveredFileId: string | null;
  viewNonce: number; // bumps when the camera should re-fly to the current focus

  paused: boolean;
  speed: number;
  showRockets: boolean;
  showLabels: boolean;
  showOrbits: boolean;
  paletteOpen: boolean;
  navigatorOpen: boolean;

  start: () => void;
  loadRepo: (slug: string) => Promise<boolean>;
  loadDemo: () => void;
  setLang: (lang: Lang) => void;
  focusPlanet: (id: string | null) => void;
  selectFile: (id: string | null) => void;
  hoverFile: (id: string | null) => void;
  overview: () => void;
  togglePaused: () => void;
  setSpeed: (speed: number) => void;
  toggle: (key: 'showRockets' | 'showLabels' | 'showOrbits' | 'navigatorOpen') => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  system: buildDemoSystem(),
  load: { status: 'idle' },
  started: false,
  lang: 'ru',

  focusedPlanetId: null,
  selectedFileId: null,
  hoveredFileId: null,
  viewNonce: 0,

  paused: false,
  speed: 1,
  showRockets: true,
  showLabels: true,
  showOrbits: true,
  paletteOpen: false,
  navigatorOpen: true,

  start: () => set({ started: true }),

  loadRepo: async (slug) => {
    set({ load: { status: 'loading', slug, step: 1 } });
    try {
      const system = await loadGithubRepo(slug, (step, detail) => set({ load: { status: 'loading', slug, step, detail } }));
      set((s) => ({
        system,
        load: { status: 'idle' },
        started: true,
        focusedPlanetId: null,
        selectedFileId: null,
        hoveredFileId: null,
        viewNonce: s.viewNonce + 1,
      }));
      return true;
    } catch (err) {
      const code = err instanceof RepoLoadError ? err.code : 'network';
      set({ load: { status: 'error', slug, code } });
      return false;
    }
  },

  loadDemo: () =>
    set((s) => ({
      system: s.system.repo.source === 'demo' ? s.system : buildDemoSystem(),
      load: { status: 'idle' },
      started: true,
      focusedPlanetId: null,
      selectedFileId: null,
      viewNonce: s.viewNonce + 1,
    })),

  setLang: (lang) => set({ lang }),

  focusPlanet: (id) => set((s) => ({ focusedPlanetId: id, selectedFileId: null, viewNonce: s.viewNonce + 1 })),

  selectFile: (id) => {
    if (!id) return set({ selectedFileId: null });
    const file = get().system.files.get(id);
    if (!file) return;
    set((s) => ({ selectedFileId: id, focusedPlanetId: file.planetId, viewNonce: s.viewNonce + 1 }));
  },

  hoverFile: (id) => {
    if (get().hoveredFileId !== id) set({ hoveredFileId: id });
  },

  overview: () => set((s) => ({ focusedPlanetId: null, selectedFileId: null, viewNonce: s.viewNonce + 1 })),

  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed, paused: false }),
  toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SystemState>),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
}));
