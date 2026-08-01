import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';
import { useAtlasStore } from '../../stores/useAtlasStore';

interface Props {
  building: BuildingNodeData;
}

export const BuildingMesh: React.FC<Props> = ({ building }) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const hoveredBuildingId = useAtlasStore((s) => s.hoveredBuildingId);
  const selectBuilding = useAtlasStore((s) => s.selectBuilding);
  const hoverBuilding = useAtlasStore((s) => s.hoverBuilding);
  const mode = useAtlasStore((s) => s.mode);
  const isLive = useAtlasStore((s) => s.isLiveStreaming);

  const isSelected = selectedBuildingId === building.id;
  const isHovered = hoveredBuildingId === building.id;

  const [posX, posY, posZ] = building.position;
  const [dimX, dimY, dimZ] = building.dimensions;

  // NYC Skyscraper Tier Heights & Setbacks Calculation
  const baseHeight = Math.max(2, dimY * 0.25);
  const midHeight = Math.max(3, dimY * 0.55);
  const crownHeight = Math.max(1.5, dimY * 0.2);

  const baseWidth = dimX;
  const midWidth = dimX * 0.78;
  const crownWidth = dimX * 0.52;

  // Determine material building color
  const getBuildingColor = () => {
    if (mode === 'LIVE_RUNTIME' && building.heatLevel) {
      if (building.heatLevel > 0.7) return '#FF0055';
      if (building.heatLevel > 0.4) return '#FFB800';
    }
    return building.color;
  };

  const buildingColor = getBuildingColor();

  // NYC Window Grid Material
  const windowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: buildingColor,
      roughness: 0.15,
      metalness: 0.85,
      emissive: isSelected ? '#00F0FF' : isHovered ? '#7000FF' : buildingColor,
      emissiveIntensity: isSelected ? 0.6 : isHovered ? 0.4 : 0.2,
    });
  }, [buildingColor, isSelected, isHovered]);

  // Pulse effect for live high-heat buildings
  useFrame(({ clock }) => {
    if (meshGroupRef.current && isLive && building.heatLevel && building.heatLevel > 0.5) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.02 * building.heatLevel;
      meshGroupRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group position={[posX, 0, posZ]}>
      {/* Street Block Sidewalk Base Curb */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[baseWidth + 1.2, 0.2, dimZ + 1.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>

      {/* Main NYC Skyscraper Group */}
      <group
        ref={meshGroupRef}
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
          // NYC Water Tower / Cylinder Industrial Hub
          <group position={[0, dimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.4, dimX / 1.4, dimY, 32]} />
              <meshStandardMaterial color={buildingColor} metalness={0.9} roughness={0.2} emissive={buildingColor} emissiveIntensity={0.2} />
            </mesh>
            {/* Top Ring Cap */}
            <mesh position={[0, dimY / 2 + 0.3, 0]}>
              <cylinderGeometry args={[dimX / 1.2, dimX / 1.2, 0.6, 32]} />
              <meshStandardMaterial color="#FFB800" emissive="#FFB800" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ) : building.type === 'cache' ? (
          // Hexagonal Power Station
          <group position={[0, dimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.4, dimX / 1.4, dimY, 6]} />
              <meshStandardMaterial color={buildingColor} metalness={0.9} roughness={0.1} emissive="#00F0FF" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ) : (
          // NYC Skyscraper (Multi-Tier Setbacks)
          <group>
            {/* Tier 1: Wide Podium Base */}
            <mesh position={[0, baseHeight / 2, 0]}>
              <boxGeometry args={[baseWidth, baseHeight, dimZ]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* Tier 2: Stepped Mid Tower */}
            <mesh position={[0, baseHeight + midHeight / 2, 0]}>
              <boxGeometry args={[midWidth, midHeight, dimZ * 0.78]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* Tier 3: NYC Crown / Top Spire */}
            <mesh position={[0, baseHeight + midHeight + crownHeight / 2, 0]}>
              <boxGeometry args={[crownWidth, crownHeight, dimZ * 0.52]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* NYC Rooftop Chrysler/Empire State Style Spire Antenna */}
            <mesh position={[0, dimY + 2, 0]}>
              <cylinderGeometry args={[0.08, 0.4, 4, 16]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.8} />
            </mesh>

            {/* Rooftop HVAC Water Tank Unit */}
            <mesh position={[crownWidth * 0.25, dimY + 0.5, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 1, 16]} />
              <meshStandardMaterial color="#64748B" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* Selection Glow Ring at base */}
        {(isSelected || isHovered) && (
          <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseWidth * 0.7, baseWidth * 0.95, 32]} />
            <meshBasicMaterial
              color={isSelected ? '#00F0FF' : '#7000FF'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}
      </group>

      {/* Spatial 3D Holographic Floating Label */}
      <Html position={[0, dimY + 3.2, 0]} center distanceFactor={26}>
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap border ${
            isSelected
              ? 'bg-cyan-950/95 text-cyan-300 border-cyan-400 shadow-glow scale-110 z-20'
              : isHovered
              ? 'bg-purple-950/95 text-purple-200 border-purple-400 scale-105 z-10'
              : 'bg-slate-950/90 text-slate-200 border-slate-700/80'
          }`}
          onClick={() => selectBuilding(building.id)}
        >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: building.color }}
          />
          <span className="font-bold tracking-wide">{building.name}</span>
          {building.rps && mode === 'LIVE_RUNTIME' && (
            <span className="ml-1.5 text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
              {building.rps} req/s
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
