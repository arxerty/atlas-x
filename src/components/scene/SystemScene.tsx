import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useSystemStore } from '../../stores/useSystemStore';
import { Planet } from './Planet';
import { AsteroidBelt, Backdrop, OrbitPaths, SimDriver, Sun } from './Space';
import { Rockets } from './Rockets';
import { CameraRig } from './CameraRig';

export const SystemScene: React.FC = () => {
  const system = useSystemStore((s) => s.system);
  const selectFile = useSystemStore((s) => s.selectFile);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      camera={{ fov: 42, near: 0.05, far: 9000, position: [0, 400, 700] }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onPointerMissed={(e) => {
        if (e.type === 'click' && useSystemStore.getState().selectedFileId) selectFile(null);
      }}
    >
      <color attach="background" args={['#020306']} />
      <SimDriver planets={system.planets} />
      <CameraRig />
      <Suspense fallback={null}>
        <Backdrop />
        <Sun />
        <OrbitPaths planets={system.planets} />
        <AsteroidBelt planets={system.planets} />
        {system.planets.map((p) => (
          <Planet key={`${system.repo.slug}:${p.id}`} planet={p} system={system} />
        ))}
        <Rockets key={system.repo.slug} system={system} />
      </Suspense>
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.9} luminanceSmoothing={0.2} radius={0.72} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
};
