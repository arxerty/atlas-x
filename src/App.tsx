import React from 'react';
import { SpatialCanvas } from './components/spatial/SpatialCanvas';
import { HeaderNavbar } from './components/ui/HeaderNavbar';
import { ModeSwitcherBar } from './components/ui/ModeSwitcherBar';
import { InspectorDrawer } from './components/ui/InspectorDrawer';
import { AICopilotDrawer } from './components/ui/AICopilotDrawer';
import { TimelineReplayBar } from './components/ui/TimelineReplayBar';
import { WhatIfSimulationModal } from './components/ui/WhatIfSimulationModal';
import { LiveDebuggerPanel } from './components/ui/LiveDebuggerPanel';
import { MultiplayerHUD } from './components/ui/MultiplayerHUD';

export function App() {
  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#08090C]">
      {/* 3D WebGL / R3F Spatial Canvas */}
      <SpatialCanvas />

      {/* Top Navbar */}
      <HeaderNavbar />

      {/* Top Mode Switcher Bar */}
      <ModeSwitcherBar />

      {/* Building & Code AST Inspector Drawer */}
      <InspectorDrawer />

      {/* AI Graph Copilot Drawer */}
      <AICopilotDrawer />

      {/* Git Commit Architecture Replay Timeline */}
      <TimelineReplayBar />

      {/* What-If Architecture Simulation Panel */}
      <WhatIfSimulationModal />

      {/* Live Spatial Debugger Panel */}
      <LiveDebuggerPanel />

      {/* Real-time Multiplayer HUD */}
      <MultiplayerHUD />
    </main>
  );
}

export default App;
