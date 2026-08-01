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

  // Multi-tier NYC Skyscraper Setback Dimensions (Matching Photo 2)
  const baseHeight = Math.max(2.5, dimY * 0.25);
  const midHeight = Math.max(4.0, dimY * 0.55);
  const crownHeight = Math.max(2.0, dimY * 0.2);

  const baseWidth = dimX;
  const midWidth = dimX * 0.76;
  const crownWidth = dimX * 0.52;

  // Twilight / Warm Sunset Interior Window Light Color palette
  const getBuildingColor = () => {
    if (mode === 'LIVE_RUNTIME' && building.heatLevel) {
      if (building.heatLevel > 0.7) return '#FF0055';
      if (building.heatLevel > 0.4) return '#FFB800';
    }
    return building.color;
  };

  const buildingColor = getBuildingColor();

  // Glass & Metallic facade material (Matching NYC Photo 2)
  const windowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: buildingColor,
      roughness: 0.1,
      metalness: 0.9,
      emissive: isSelected ? '#00F0FF' : isHovered ? '#7000FF' : buildingColor,
      emissiveIntensity: isSelected ? 0.65 : isHovered ? 0.45 : 0.25,
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
      {/* Concrete Sidewalk Base Block */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[baseWidth + 1.4, 0.2, dimZ + 1.4]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Main NYC Skyscraper Structure */}
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
          // NYC Water Tank Tower / Industrial Cylinder
          <group position={[0, dimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.3, dimX / 1.3, dimY, 32]} />
              <meshStandardMaterial color={buildingColor} metalness={0.9} roughness={0.15} emissive={buildingColor} emissiveIntensity={0.25} />
            </mesh>
            {/* Top Roof Cap */}
            <mesh position={[0, dimY / 2 + 0.35, 0]}>
              <cylinderGeometry args={[dimX / 1.1, dimX / 1.1, 0.7, 32]} />
              <meshStandardMaterial color="#FFB800" emissive="#FFB800" emissiveIntensity={0.45} />
            </mesh>
          </group>
        ) : building.type === 'cache' ? (
          // Hexagonal Power Station
          <group position={[0, dimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.3, dimX / 1.3, dimY, 6]} />
              <meshStandardMaterial color={buildingColor} metalness={0.95} roughness={0.1} emissive="#00F0FF" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ) : (
          // MANHATTAN NYC SKYSCRAPER (Matching Photo 2)
          <group>
            {/* Tier 1: Wide Street Podium Base */}
            <mesh position={[0, baseHeight / 2, 0]}>
              <boxGeometry args={[baseWidth, baseHeight, dimZ]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* Tier 2: Stepped Mid Glass Tower */}
            <mesh position={[0, baseHeight + midHeight / 2, 0]}>
              <boxGeometry args={[midWidth, midHeight, dimZ * 0.76]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* Tier 3: Setback Crown */}
            <mesh position={[0, baseHeight + midHeight + crownHeight / 2, 0]}>
              <boxGeometry args={[crownWidth, crownHeight, dimZ * 0.52]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>

            {/* NYC Chrysler / Empire State Ornamental Spire */}
            <mesh position={[0, dimY + 2.5, 0]}>
              <cylinderGeometry args={[0.06, 0.45, 5, 16]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.9} />
            </mesh>

            {/* Rooftop Helipad Ring */}
            <mesh position={[-crownWidth * 0.2, dimY + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4, 0.6, 16]} />
              <meshBasicMaterial color="#FFB800" side={THREE.DoubleSide} />
            </mesh>

            {/* Rooftop HVAC Water Tank Unit */}
            <mesh position={[crownWidth * 0.25, dimY + 0.6, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 1.2, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* Selection Ring */}
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

      {/* Floating 3D Holographic Label */}
      <Html position={[0, dimY + 3.8, 0]} center distanceFactor={26}>
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
