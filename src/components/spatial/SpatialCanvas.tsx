import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { MOCK_DISTRICTS } from '../../data/mockRepositoryTwin';
import { BuildingMesh } from './BuildingMesh';
import { DistrictGrid } from './DistrictGrid';
import { DependencyHighways } from './DependencyHighways';
import { RuntimeParticleStream } from './RuntimeParticleStream';

// Camera Interpolator Component
const CameraController: React.FC = () => {
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const buildings = useAtlasStore((s) => s.buildings);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!selectedBuildingId) return;
    const targetBuilding = buildings.find((b) => b.id === selectedBuildingId);
    if (!targetBuilding) return;

    const [tx, ty, tz] = targetBuilding.position;
    const targetVec = new THREE.Vector3(tx, ty + 2, tz);

    if (controlsRef.current) {
      // Smooth camera pan target update
      controlsRef.current.target.lerp(targetVec, 0.5);
      controlsRef.current.update();
    }
  }, [selectedBuildingId, buildings, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera clipping below floor
      minDistance={10}
      maxDistance={140}
    />
  );
};

export const SpatialCanvas: React.FC = () => {
  const buildings = useAtlasStore((s) => s.buildings);
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const isLive = useAtlasStore((s) => s.isLiveStreaming);
  const mode = useAtlasStore((s) => s.mode);

  return (
    <div className="w-full h-full relative bg-[#08090C]">
      <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault position={[0, 45, 60]} fov={50} />
        <CameraController />

        {/* Ambient & Directional Cyberpunk Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[40, 60, 20]}
          intensity={1.2}
          color="#E2E8F0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 30, 0]} intensity={1.5} color="#00F0FF" distance={100} />
        <pointLight position={[10, 20, -10]} intensity={1.0} color="#7000FF" distance={80} />

        {/* Atmospheric Volumetric Fog */}
        <fog attach="fog" args={['#08090C', 50, 160]} />

        {/* Infinite Cyber Grid Floor */}
        <gridHelper
          args={[200, 100, '#1E293B', '#0F172A']}
          position={[0, -0.1, 0]}
        />

        {/* Render District Boundaries */}
        {MOCK_DISTRICTS.map((district) => (
          <DistrictGrid key={district.id} district={district} />
        ))}

        {/* Render Building Towers */}
        {buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))}

        {/* Dependency Highway Splines */}
        <DependencyHighways buildings={buildings} selectedBuildingId={selectedBuildingId} />

        {/* Live Runtime Dynamic Telemetry Particles */}
        <RuntimeParticleStream buildings={buildings} isLive={isLive || mode === 'LIVE_RUNTIME'} />
      </Canvas>
    </div>
  );
};
