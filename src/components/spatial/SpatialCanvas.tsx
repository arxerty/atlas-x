import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Environment } from '@react-three/drei';
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
      maxDistance={250}
    />
  );
};

export const SpatialCanvas: React.FC = () => {
  const buildings = useAtlasStore((s) => s.buildings);
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const isLive = useAtlasStore((s) => s.isLiveStreaming);
  const mode = useAtlasStore((s) => s.mode);

  return (
    <div className="w-full h-full relative bg-[#0F172A]">
      {/* High Performance Realistic Graphics Engine */}
      <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault position={[0, 85, 120]} fov={45} />
        <CameraController />

        {/* ATMOSPHERIC SKY & ENVIRONMENT MAP (HDRI Reflections) */}
        <Sky distance={450000} sunPosition={[120, 40, 80]} inclination={0.4} azimuth={0.25} />
        <Environment preset="city" />

        {/* Realistic Lighting setup matching the Sky sunPosition */}
        <ambientLight intensity={0.6} color="#F8FAFC" />
        <directionalLight
          position={[120, 160, 80]}
          intensity={1.5}
          color="#FFFAEB"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={80}
          shadow-camera-bottom={-80}
        />
        <directionalLight position={[-60, 60, -40]} intensity={0.3} color="#BAE6FD" />

        {/* Soft Fog to blend the horizon */}
        <fog attach="fog" args={['#87CEEB', 150, 450]} />

        {/* ISLAND GEOMETRY & WATER */}
        <group position={[0, -0.1, 0]}>
          {/* Infinite Ocean Water Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial 
              color="#023E8A" 
              roughness={0.05} 
              metalness={0.95} 
            />
          </mesh>

          {/* Unified Manhattan Island Base Plate */}
          {/* The grid is 6x6 blocks. Each block is 16. Total size ~ 96x96 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            {/* Box with rounded edges would be ideal, but standard box is fine for now */}
            <boxGeometry args={[104, 104, 0.4]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          
          {/* Central Park (Integrated directly in the center void of the grid) */}
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[32, 64]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>

          {/* Central Park Reservoir Lake */}
          <mesh position={[0, 0.24, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 24]} />
            <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>

        {/* District Boundaries */}
        {MOCK_DISTRICTS.map((district) => (
          <DistrictGrid key={district.id} district={district} />
        ))}

        {/* BUILDINGS SITTING STRICTLY INSIDE URBAN BLOCKS */}
        {buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))}

        {/* Straight Street Grid Corridors */}
        <MultiLaneRoads buildings={buildings} selectedBuildingId={selectedBuildingId} />

        {/* Vehicles */}
        <TelemetryVehicles buildings={buildings} isLive={isLive || mode === 'LIVE_RUNTIME'} />
      </Canvas>
    </div>
  );
};
