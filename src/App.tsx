import React from 'react';
import { SpatialCanvas } from './components/spatial/SpatialCanvas';
import { HeaderNavbar } from './components/ui/HeaderNavbar';
import { ModeSwitcherBar } from './components/ui/ModeSwitcherBar';
import { InspectorDrawer } from './components/ui/InspectorDrawer';
import { AICopilotDrawer } from './components/ui/AICopilotDrawer';
import { TimelineReplayBar } from './components/ui/TimelineReplayBar';
import { WhatIfSimulationModal } from './components/ui/WhatIfSimulationModal';
import { LiveDebuggerPanel } from './components/ui/LiveDebuggerPanel';
import { GitHubConnectModal } from './components/ui/GitHubConnectModal';
import { OnboardingScreen } from './components/ui/OnboardingScreen';
import { useAtlasStore } from './stores/useAtlasStore';

export function App() {
  const hasInitializedRepo = useAtlasStore((s) => s.hasInitializedRepo);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#08090C]">
      {/* Onboarding Landing Screen displayed before loading into 3D city */}
      {!hasInitializedRepo ? (
        <OnboardingScreen />
      ) : (
        <>
          {/* 3D WebGL Spatial NYC Canvas */}
          <SpatialCanvas />

          {/* Top Navbar */}
          <HeaderNavbar />

          {/* Top Mode Switcher Bar */}
          <ModeSwitcherBar />

          {/* Building & Code Inspector Drawer */}
          <InspectorDrawer />

          {/* AI Graph Copilot Drawer */}
          <AICopilotDrawer />

          {/* Git Commit Architecture Replay Timeline */}
          <TimelineReplayBar />

          {/* What-If Architecture Simulation Panel */}
          <WhatIfSimulationModal />

          {/* Live Spatial Debugger Panel */}
          <LiveDebuggerPanel />

          {/* GitHub Connection Modal */}
          <GitHubConnectModal />
        </>
      )}
    </main>
  );
}

export default App;
