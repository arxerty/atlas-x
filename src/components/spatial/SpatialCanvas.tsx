import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { MOCK_DISTRICTS } from '../../data/mockRepositoryTwin';
import { BuildingMesh } from './BuildingMesh';
import { DistrictGrid } from './DistrictGrid';
import { TwoLaneRoads } from './TwoLaneRoads';
import { TelemetryVehicles } from './TelemetryVehicles';

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
      controlsRef.current.target.lerp(targetVec, 0.5);
      controlsRef.current.update();
    }
  }, [selectedBuildingId, buildings, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={10}
      maxDistance={150}
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
        <PerspectiveCamera makeDefault position={[0, 48, 65]} fov={50} />
        <CameraController />

        {/* Ambient & NYC Cyberpunk Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[45, 75, 25]}
          intensity={1.3}
          color="#F8FAFC"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 35, 0]} intensity={1.8} color="#00F0FF" distance={120} />
        <pointLight position={[15, 25, -15]} intensity={1.2} color="#7000FF" distance={90} />

        {/* Atmospheric Fog */}
        <fog attach="fog" args={['#08090C', 55, 170]} />

        {/* Cyber Grid Floor */}
        <gridHelper args={[220, 110, '#1E293B', '#0F172A']} position={[0, -0.1, 0]} />

        {/* District Ground Boundaries */}
        {MOCK_DISTRICTS.map((district) => (
          <DistrictGrid key={district.id} district={district} />
        ))}

        {/* NYC Skyscraper Buildings */}
        {buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))}

        {/* Two-Lane Asphalt Roads */}
        <TwoLaneRoads buildings={buildings} selectedBuildingId={selectedBuildingId} />

        {/* Telemetry Vehicles (Speed tied to Latency) */}
        <TelemetryVehicles buildings={buildings} isLive={isLive || mode === 'LIVE_RUNTIME'} />
      </Canvas>
    </div>
  );
};
