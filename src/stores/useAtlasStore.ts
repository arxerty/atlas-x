import { create } from 'zustand';
import { TwinMode, BuildingNodeData, GitCommitData, SimulationScenario, DebuggerFrame } from '../types/atlas';
import { MOCK_BUILDINGS, MOCK_COMMITS, MOCK_SIMULATIONS, MOCK_DEBUGGER_FRAMES } from '../data/mockRepositoryTwin';

interface AtlasState {
  mode: TwinMode;
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  buildings: BuildingNodeData[];
  
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

export const useAtlasStore = create<AtlasState>((set) => ({
  mode: 'EXPLORE',
  selectedBuildingId: 'b-checkout-controller',
  hoveredBuildingId: null,
  buildings: MOCK_BUILDINGS,

  setMode: (mode) => set({ mode }),
  selectBuilding: (id) => set({ selectedBuildingId: id }),
  hoverBuilding: (id) => set({ hoveredBuildingId: id }),

  isLiveStreaming: true,
  toggleLiveStreaming: () => set((state) => ({ isLiveStreaming: !state.isLiveStreaming })),

  activeCommitIndex: 0,
  setActiveCommitIndex: (index) => set({ activeCommitIndex: index }),
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
