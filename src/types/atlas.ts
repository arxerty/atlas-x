export type TwinMode = 'EXPLORE' | 'LIVE_RUNTIME' | 'REPLAY' | 'SIMULATION' | 'DEBUGGER';

export interface FunctionRoom {
  id: string;
  name: string;
  linesOfCode: number;
  complexity: number;
  isAsync: boolean;
}

export interface BuildingNodeData {
  id: string;
  name: string;
  path: string;
  district: string;
  type: 'file' | 'database' | 'cache' | 'queue' | 'microservice';
  position: [number, number, number]; // [x, y, z]
  dimensions: [number, number, number]; // [width, height, depth]
  color: string;
  linesOfCode: number;
  complexity: number;
  functions: FunctionRoom[];
  dependencies: string[]; // Target Building IDs
  rps?: number;
  latencyMs?: number;
  errorRate?: number;
  cacheHitRatio?: number;
  heatLevel?: number; // 0 to 1
}

export interface DistrictData {
  id: string;
  name: string;
  color: string;
  bounds: { x: number; z: number; width: number; depth: number };
}

export interface GitCommitData {
  sha: string;
  author: string;
  message: string;
  date: string;
  changesCount: number;
  aiNarration: string;
  modifiedNodeIds: string[];
}

export interface TelemetryParticle {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  speed: number;
  isError: boolean;
  type: 'HTTP' | 'SQL' | 'CACHE' | 'QUEUE';
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  proposedChanges: string[];
  metricsDelta: {
    latencyPct: number;
    costUsd: number;
    complexityDelta: number;
    securityRiskScore: number;
  };
}

export interface DebuggerVariable {
  name: string;
  type: string;
  value: string;
}

export interface DebuggerFrame {
  id: string;
  functionName: string;
  buildingId: string;
  line: number;
  variables: DebuggerVariable[];
}
