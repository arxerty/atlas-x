import React, { useEffect } from 'react';
import { SystemScene } from './components/scene/SystemScene';
import { StartScreen } from './components/hud/StartScreen';
import { TopBar } from './components/hud/TopBar';
import { Navigator } from './components/hud/Navigator';
import { Inspector } from './components/hud/Inspector';
import { BottomBar } from './components/hud/BottomBar';
import { CommandPalette } from './components/hud/CommandPalette';
import { useSystemStore } from './stores/useSystemStore';

export function App() {
  const started = useSystemStore((s) => s.started);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useSystemStore.getState();
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (s.started) s.setPaletteOpen(!s.paletteOpen);
        return;
      }
      if (typing || !s.started) return;
      if (e.key === 'Escape') {
        if (s.paletteOpen) s.setPaletteOpen(false);
        else if (s.selectedFileId) s.focusPlanet(s.focusedPlanetId);
        else if (s.focusedPlanetId) s.overview();
      } else if (e.key === ' ') {
        e.preventDefault();
        s.togglePaused();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[var(--bg)] select-none">
      <SystemScene />
      {started ? (
        <>
          <TopBar />
          <Navigator />
          <Inspector />
          <BottomBar />
          <CommandPalette />
        </>
      ) : (
        <StartScreen />
      )}
    </main>
  );
}

export default App;
