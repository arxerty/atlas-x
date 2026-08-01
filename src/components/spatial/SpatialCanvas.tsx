import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { MOCK_DISTRICTS } from '../../data/mockRepositoryTwin';
import { BuildingMesh } from './BuildingMesh';
import { DistrictGrid } from './DistrictGrid';
import { MultiLaneRoads } from './MultiLaneRoads';
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
      maxDistance={155}
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
        <PerspectiveCamera makeDefault position={[0, 50, 70]} fov={50} />
        <CameraController />

        {/* Ambient & Manhattan Twilight Lighting (Matching Photo 2) */}
        <ambientLight intensity={0.5} color="#F1F5F9" />
        <directionalLight
          position={[50, 80, 30]}
          intensity={1.4}
          color="#FEF08A" // Warm sunset golden light
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 40, 0]} intensity={2.0} color="#00F0FF" distance={130} />
        <pointLight position={[20, 30, -20]} intensity={1.4} color="#7000FF" distance={100} />

        {/* Twilight Atmosphere Fog */}
        <fog attach="fog" args={['#08090C', 60, 180]} />

        {/* Ground Grid */}
        <gridHelper args={[240, 120, '#1E293B', '#0F172A']} position={[0, -0.1, 0]} />

        {/* Districts */}
        {MOCK_DISTRICTS.map((district) => (
          <DistrictGrid key={district.id} district={district} />
        ))}

        {/* Manhattan NYC Skyscrapers */}
        {buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))}

        {/* 4-Lane Avenue Highways */}
        <MultiLaneRoads buildings={buildings} selectedBuildingId={selectedBuildingId} />

        {/* Realistic Traffic Vehicles (Sedans, Yellow Taxis, Vans, SUVs, Motorcycles - Photo 1) */}
        <TelemetryVehicles buildings={buildings} isLive={isLive || mode === 'LIVE_RUNTIME'} />
      </Canvas>
    </div>
  );
};
