import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';
import { useAtlasStore } from '../../stores/useAtlasStore';

interface Props {
  building: BuildingNodeData;
}

export const BuildingMesh: React.FC<Props> = ({ building }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const hoveredBuildingId = useAtlasStore((s) => s.hoveredBuildingId);
  const selectBuilding = useAtlasStore((s) => s.selectBuilding);
  const hoverBuilding = useAtlasStore((s) => s.hoverBuilding);
  const mode = useAtlasStore((s) => s.mode);
  const isLive = useAtlasStore((s) => s.isLiveStreaming);

  const isSelected = selectedBuildingId === building.id;
  const isHovered = hoveredBuildingId === building.id;

  // Pulse effect for live runtime high-heat buildings
  useFrame(({ clock }) => {
    if (meshRef.current && isLive && building.heatLevel && building.heatLevel > 0.5) {
      const scalePulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.02 * building.heatLevel;
      meshRef.current.scale.set(
        building.dimensions[0] * scalePulse,
        building.dimensions[1],
        building.dimensions[2] * scalePulse
      );
    }
  });

  const [posX, posY, posZ] = building.position;
  const [dimX, dimY, dimZ] = building.dimensions;

  // Calculate building height elevation so base rests on ground y=0
  const actualY = posY + dimY / 2;

  // Determine material color
  const getBuildingColor = () => {
    if (mode === 'LIVE_RUNTIME' && building.heatLevel) {
      if (building.heatLevel > 0.7) return '#FF0055'; // High alert / Error heat
      if (building.heatLevel > 0.4) return '#FFB800'; // Moderate latency
    }
    return building.color;
  };

  return (
    <group position={[posX, 0, posZ]}>
      {/* Main Building Structure */}
      <mesh
        ref={meshRef}
        position={[0, actualY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectBuilding(building.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoverBuilding(building.id);
        }}
        onPointerOut={() => hoverBuilding(null)}
      >
        {building.type === 'database' ? (
          <cylinderGeometry args={[dimX / 1.5, dimX / 1.5, dimY, 32]} />
        ) : building.type === 'cache' ? (
          <cylinderGeometry args={[dimX / 1.5, dimX / 1.5, dimY, 6]} />
        ) : (
          <boxGeometry args={[dimX, dimY, dimZ]} />
        )}

        <meshStandardMaterial
          color={getBuildingColor()}
          roughness={0.2}
          metalness={0.8}
          emissive={isSelected ? '#00F0FF' : isHovered ? '#7000FF' : getBuildingColor()}
          emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.4 : 0.15}
          wireframe={mode === 'SIMULATION' && isSelected}
        />
      </mesh>

      {/* Selection Glow Ring at base */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[dimX * 0.7, dimX * 0.9, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#00F0FF' : '#7000FF'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Function Rooms Tiers stacked inside building */}
      {building.functions.map((fn, idx) => {
        const roomY = 1 + idx * 1.8;
        if (roomY >= dimY) return null;
        return (
          <mesh key={fn.id} position={[0, roomY, 0]}>
            <boxGeometry args={[dimX + 0.1, 0.25, dimZ + 0.1]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* Spatial 3D Holographic Floating Label */}
      <Html position={[0, dimY + 1.8, 0]} center distanceFactor={25}>
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap border ${
            isSelected
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-glow scale-110 z-20'
              : isHovered
              ? 'bg-purple-950/90 text-purple-200 border-purple-400 scale-105 z-10'
              : 'bg-slate-900/80 text-slate-300 border-slate-700/60'
          }`}
          onClick={() => selectBuilding(building.id)}
        >
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ backgroundColor: building.color }}
          />
          <span className="font-semibold">{building.name}</span>
          {building.rps && mode === 'LIVE_RUNTIME' && (
            <span className="ml-1 text-[10px] text-emerald-400 font-bold">
              {building.rps} req/s
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
