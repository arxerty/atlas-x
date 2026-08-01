import { create } from 'zustand';
import { TwinMode, BuildingNodeData, GitCommitData, SimulationScenario, DebuggerFrame } from '../types/atlas';
import { MOCK_BUILDINGS, MOCK_COMMITS, MOCK_SIMULATIONS, MOCK_DEBUGGER_FRAMES } from '../data/mockRepositoryTwin';
import { Language, TRANSLATIONS } from '../lib/i18n';

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
  
  // GitHub Integration
  isGithubModalOpen: boolean;
  setGithubModalOpen: (open: boolean) => void;
  connectedRepoName: string;
  connectRepo: (repoUrl: string) => void;

  // Mode setters
  setMode: (mode: TwinMode) => void;
  selectBuilding: (id: string | null) => void;
  hoverBuilding: (id: string | null) => void;

  // Live Telemetry
  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;

  // Replay
  activeCommitIndex: number;
  setActiveCommitIndex: (index: number) => void;
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

  // Spatial Search Query
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
  connectedRepoName: 'org-enterprise/core-monolith',

  connectRepo: (repoUrl: string) => {
    // Extract clean repo name from URL or slug
    const cleanName = repoUrl.replace('https://github.com/', '').replace('.git', '');
    
    // Dynamically adjust building LoC and latency to demonstrate live twin update
    const updatedBuildings = get().buildings.map((b) => ({
      ...b,
      linesOfCode: Math.floor(b.linesOfCode * (0.8 + Math.random() * 0.4)),
      dimensions: [
        b.dimensions[0],
        Math.max(5, b.dimensions[1] + Math.floor((Math.random() - 0.5) * 6)),
        b.dimensions[2],
      ] as [number, number, number],
    }));

    set({
      connectedRepoName: cleanName || 'custom/imported-repo',
      buildings: updatedBuildings,
      isGithubModalOpen: false,
    });
  },

  setMode: (mode) => set({ mode }),
  selectBuilding: (id) => set({ selectedBuildingId: id }),
  hoverBuilding: (id) => set({ hoveredBuildingId: id }),

  isLiveStreaming: true,
  toggleLiveStreaming: () => set((state) => ({ isLiveStreaming: !state.isLiveStreaming })),

  activeCommitIndex: 0,
  setActiveCommitIndex: (index) => {
    const commits = get().commits;
    const targetCommit = commits[index];

    // Evolve NYC buildings based on commit index (heights change, tiers expand)
    const updatedBuildings = get().buildings.map((b) => {
      const isModified = targetCommit?.modifiedNodeIds.includes(b.id);
      const heightFactor = 1 + (index * 0.25) * (isModified ? 1.5 : 0.8);
      
      return {
        ...b,
        dimensions: [
          b.dimensions[0],
          Math.max(4, Math.floor(b.dimensions[1] * (isModified ? 1.2 : 0.95))),
          b.dimensions[2],
        ] as [number, number, number],
        heatLevel: isModified ? 0.85 : b.heatLevel,
      };
    });

    set({ activeCommitIndex: index, buildings: updatedBuildings });
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
