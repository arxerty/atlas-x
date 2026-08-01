import { create } from 'zustand';
import { TwinMode, BuildingNodeData, GitCommitData, SimulationScenario, DebuggerFrame } from '../types/atlas';
import { MOCK_BUILDINGS, MOCK_COMMITS, MOCK_SIMULATIONS, MOCK_DEBUGGER_FRAMES } from '../data/mockRepositoryTwin';
import { Language, TRANSLATIONS } from '../lib/i18n';

export interface RepositoryOption {
  slug: string;
  name: string;
  stars: string;
  description: string;
}

export const POPULAR_REPOSITORIES: RepositoryOption[] = [
  { slug: 'facebook/react', name: 'facebook/react', stars: '228k', description: 'React UI Library Core' },
  { slug: 'vercel/next.js', name: 'vercel/next.js', stars: '124k', description: 'Next.js App Router Framework' },
  { slug: 'expressjs/express', name: 'expressjs/express', stars: '65k', description: 'Express Node.js Gateway' },
  { slug: 'torvalds/linux', name: 'torvalds/linux', stars: '175k', description: 'Linux Kernel Monolith' },
  { slug: 'vuejs/core', name: 'vuejs/core', stars: '45k', description: 'Vue.js Core Engine' },
  { slug: 'tailwindlabs/tailwindcss', name: 'tailwindlabs/tailwindcss', stars: '82k', description: 'Tailwind CSS Engine' },
  { slug: 'denoland/deno', name: 'denoland/deno', stars: '94k', description: 'Deno TypeScript Runtime' },
];

interface AtlasState {
  // Language (i18n)
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;

  // Single-player mode & Twin State
  mode: TwinMode;
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  buildings: BuildingNodeData[];
  
  // GitHub Integration & Repositories
  isGithubModalOpen: boolean;
  setGithubModalOpen: (open: boolean) => void;
  connectedRepoName: string;
  connectRepo: (repoSlug: string) => void;

  // Replay Auto-Playback State
  isReplayPlaying: boolean;
  replaySpeed: number; // 1, 2, 5
  toggleReplayPlay: () => void;
  setReplaySpeed: (speed: number) => void;

  // Mode setters
  setMode: (mode: TwinMode) => void;
  selectBuilding: (id: string | null) => void;
  hoverBuilding: (id: string | null) => void;

  // Live Telemetry
  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;

  // Replay Timeline
  activeCommitIndex: number;
  setActiveCommitIndex: (index: number) => void;
  nextCommit: () => void;
  commits: GitCommitData[];

  // Simulation
  activeSimulation: SimulationScenario | null;
  setActiveSimulation: (sim: SimulationScenario | null) => void;

  // AI Assistant
  isAICopilotOpen: boolean;
  toggleAICopilot: () => void;

  // Live Debugger
  isDebuggerActive: boolean;
  activeDebuggerFrameIndex: number;
  toggleDebugger: () => void;
  setDebuggerFrame: (index: number) => void;
  debuggerFrames: DebuggerFrame[];

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAtlasStore = create<AtlasState>((set, get) => ({
  language: 'ru',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
  },

  mode: 'EXPLORE',
  selectedBuildingId: 'b-checkout-controller',
  hoveredBuildingId: null,
  buildings: MOCK_BUILDINGS,

  isGithubModalOpen: false,
  setGithubModalOpen: (open) => set({ isGithubModalOpen: open }),
  connectedRepoName: 'facebook/react',

  connectRepo: (repoSlug: string) => {
    const cleanName = repoSlug.replace('https://github.com/', '').replace('.git', '');
    
    // Generate repo-specific twin metrics
    const updatedBuildings = get().buildings.map((b) => ({
      ...b,
      linesOfCode: Math.floor(b.linesOfCode * (0.75 + Math.random() * 0.5)),
      dimensions: [
        b.dimensions[0],
        Math.max(6, b.dimensions[1] + Math.floor((Math.random() - 0.5) * 8)),
        b.dimensions[2],
      ] as [number, number, number],
    }));

    set({
      connectedRepoName: cleanName || 'custom/imported-repo',
      buildings: updatedBuildings,
      isGithubModalOpen: false,
    });
  },

  isReplayPlaying: false,
  replaySpeed: 1,
  toggleReplayPlay: () => set((state) => ({ isReplayPlaying: !state.isReplayPlaying })),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),

  setMode: (mode) => set({ mode }),
  selectBuilding: (id) => set({ selectedBuildingId: id }),
  hoverBuilding: (id) => set({ hoveredBuildingId: id }),

  isLiveStreaming: true,
  toggleLiveStreaming: () => set((state) => ({ isLiveStreaming: !state.isLiveStreaming })),

  activeCommitIndex: 0,
  setActiveCommitIndex: (index) => {
    const commits = get().commits;
    const targetCommit = commits[index];

    const updatedBuildings = get().buildings.map((b) => {
      const isModified = targetCommit?.modifiedNodeIds.includes(b.id);
      return {
        ...b,
        dimensions: [
          b.dimensions[0],
          Math.max(5, Math.floor(b.dimensions[1] * (isModified ? 1.25 : 0.96))),
          b.dimensions[2],
        ] as [number, number, number],
        heatLevel: isModified ? 0.9 : b.heatLevel,
      };
    });

    set({ activeCommitIndex: index, buildings: updatedBuildings });
  },

  nextCommit: () => {
    const { activeCommitIndex, commits, setActiveCommitIndex } = get();
    const nextIdx = (activeCommitIndex + 1) % commits.length;
    setActiveCommitIndex(nextIdx);
  },

  commits: MOCK_COMMITS,

  activeSimulation: null,
  setActiveSimulation: (sim) => set({ activeSimulation: sim }),

  isAICopilotOpen: false,
  toggleAICopilot: () => set((state) => ({ isAICopilotOpen: !state.isAICopilotOpen })),

  isDebuggerActive: false,
  activeDebuggerFrameIndex: 0,
  toggleDebugger: () => set((state) => ({ isDebuggerActive: !state.isDebuggerActive })),
  setDebuggerFrame: (index) => set({ activeDebuggerFrameIndex: index }),
  debuggerFrames: MOCK_DEBUGGER_FRAMES,

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
