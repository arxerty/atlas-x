import { create } from 'zustand';
import { TwinMode, BuildingNodeData, GitCommitData, SimulationScenario, DebuggerFrame } from '../types/atlas';
import { MOCK_BUILDINGS, MOCK_COMMITS, MOCK_SIMULATIONS, MOCK_DEBUGGER_FRAMES } from '../data/mockRepositoryTwin';
import { Language, TRANSLATIONS } from '../lib/i18n';
import { fetchGitHubMetadata, fetchGitHubCommits, synthesizeBuildingsForRepo } from '../lib/githubApi';

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
  hasInitializedRepo: boolean;
  isParsingRepo: boolean;
  parseProgressMessage: string;
  fetchAndLoadGithubRepo: (repoSlug: string) => Promise<void>;

  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;

  mode: TwinMode;
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  buildings: BuildingNodeData[];
  
  isGithubModalOpen: boolean;
  setGithubModalOpen: (open: boolean) => void;
  connectedRepoName: string;
  connectRepo: (repoSlug: string) => void;

  isReplayPlaying: boolean;
  replaySpeed: number;
  toggleReplayPlay: () => void;
  setReplaySpeed: (speed: number) => void;

  setMode: (mode: TwinMode) => void;
  selectBuilding: (id: string | null) => void;
  hoverBuilding: (id: string | null) => void;

  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;

  activeCommitIndex: number;
  setActiveCommitIndex: (index: number) => void;
  nextCommit: () => void;
  commits: GitCommitData[];

  activeSimulation: SimulationScenario | null;
  setActiveSimulation: (sim: SimulationScenario | null) => void;

  isAICopilotOpen: boolean;
  toggleAICopilot: () => void;

  isDebuggerActive: boolean;
  activeDebuggerFrameIndex: number;
  toggleDebugger: () => void;
  setDebuggerFrame: (index: number) => void;
  debuggerFrames: DebuggerFrame[];

  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAtlasStore = create<AtlasState>((set, get) => ({
  hasInitializedRepo: false,
  isParsingRepo: false,
  parseProgressMessage: '',

  fetchAndLoadGithubRepo: async (repoSlug: string) => {
    const cleanSlug = repoSlug.replace('https://github.com/', '').replace('.git', '') || 'facebook/react';
    set({ isParsingRepo: true, parseProgressMessage: '[1/4] Connecting to GitHub REST API...' });

    const meta = await fetchGitHubMetadata(cleanSlug);
    set({ parseProgressMessage: `[2/4] Parsing Tree-sitter ASTs for ${meta.full_name}...` });

    await new Promise((r) => setTimeout(r, 600));
    set({ parseProgressMessage: '[3/4] Synthesizing Neo4j Code Graph & Dependencies...' });

    const fetchedCommits = await fetchGitHubCommits(cleanSlug);
    const synthesizedBuildings = synthesizeBuildingsForRepo(cleanSlug);

    await new Promise((r) => setTimeout(r, 600));
    set({ parseProgressMessage: '[4/4] Building NYC WebGPU 3D Digital Twin Engine...' });

    await new Promise((r) => setTimeout(r, 500));

    set({
      connectedRepoName: cleanSlug,
      buildings: synthesizedBuildings,
      commits: fetchedCommits,
      activeCommitIndex: 0,
      isParsingRepo: false,
      hasInitializedRepo: true,
      isGithubModalOpen: false,
    });
  },

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
    get().fetchAndLoadGithubRepo(repoSlug);
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

  // FIXED DETERMINISTIC COMMIT REPLAY (PREVENTS ENDLESS HEIGHT INFLATION)
  setActiveCommitIndex: (index) => {
    const commits = get().commits;
    const targetCommit = commits[index];

    const updatedBuildings = get().buildings.map((b) => {
      const isModified = targetCommit?.modifiedNodeIds.includes(b.id);
      // Calculate target height deterministically relative to b.baseHeight!
      const targetH = isModified ? b.baseHeight * 1.3 : b.baseHeight;

      return {
        ...b,
        dimensions: [
          b.dimensions[0],
          targetH,
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
