import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';
import { useAtlasStore } from '../../stores/useAtlasStore';

interface Props {
  building: BuildingNodeData;
}

// Procedural Canvas Facade Texture Generator
function createWindowGridTexture(baseColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = 8;
    const rows = 28;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW + 2;
        const y = r * cellH + 2;
        const w = cellW - 4;
        const h = cellH - 4;

        const isLit = (r * 11 + c * 17) % 3 === 0;
        ctx.fillStyle = isLit ? ((r + c) % 2 === 0 ? '#FEF08A' : '#38BDF8') : '#020617';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

export const BuildingMesh: React.FC<Props> = ({ building }) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const baseMeshRef = useRef<THREE.Mesh>(null);
  const midMeshRef = useRef<THREE.Mesh>(null);
  const crownMeshRef = useRef<THREE.Mesh>(null);

  const selectedBuildingId = useAtlasStore((s) => s.selectedBuildingId);
  const hoveredBuildingId = useAtlasStore((s) => s.hoveredBuildingId);
  const selectBuilding = useAtlasStore((s) => s.selectBuilding);
  const hoverBuilding = useAtlasStore((s) => s.hoverBuilding);
  const mode = useAtlasStore((s) => s.mode);

  const isSelected = selectedBuildingId === building.id;
  const isHovered = hoveredBuildingId === building.id;

  const [posX, posY, posZ] = building.position;
  const [dimX, targetDimY, dimZ] = building.dimensions;

  const currentHeightRef = useRef<number>(targetDimY);

  const archProfile = useMemo(() => {
    const hash = building.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const profiles = ['artdeco', 'sloped_glass', 'pyramid_crown', 'twin_tower', 'standard_block'];
    return profiles[hash % profiles.length];
  }, [building.name]);

  const facadeTexture = useMemo(() => {
    return createWindowGridTexture(building.color);
  }, [building.color]);

  // Outer Glass Shell (Highly Reflective & Refractive)
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: building.color,
      metalness: 0.95,
      roughness: 0.05,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.9, // Glass refraction
      ior: 1.5, // Index of refraction for standard glass
      thickness: 1.5,
      transparent: true,
      opacity: 1,
    });
  }, [building.color]);

  // Inner Core (Procedural Office Lights)
  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: facadeTexture,
      color: building.color,
      roughness: 0.8,
      emissive: isSelected ? '#00F0FF' : isHovered ? '#7000FF' : building.color,
      emissiveIntensity: isSelected ? 0.6 : isHovered ? 0.4 : 0.2,
    });
  }, [facadeTexture, building.color, isSelected, isHovered]);

  // Frame-by-Frame Lerp Smooth Height Morphing
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;
    currentHeightRef.current = THREE.MathUtils.lerp(currentHeightRef.current, targetDimY, 0.08);

    const h = currentHeightRef.current;
    const baseH = Math.max(2.0, h * 0.25);
    const midH = Math.max(3.0, h * 0.55);
    const crownH = Math.max(1.5, h * 0.2);

    if (baseMeshRef.current) {
      baseMeshRef.current.scale.set(1, baseH / 2.0, 1);
      baseMeshRef.current.position.y = baseH / 2;
    }
    if (midMeshRef.current) {
      midMeshRef.current.scale.set(1, midH / 3.0, 1);
      midMeshRef.current.position.y = baseH + midH / 2;
    }
    if (crownMeshRef.current) {
      crownMeshRef.current.scale.set(1, crownH / 1.5, 1);
      crownMeshRef.current.position.y = baseH + midH + crownH / 2;
    }
  });

  const baseWidth = dimX;
  const midWidth = dimX * 0.78;
  const crownWidth = dimX * 0.54;

  // Double Skin Geometry Helper
  const renderDoubleSkinBlock = (ref: any, posY: number, w: number, d: number, baseBoxArgs: [number, number, number]) => (
    <group ref={ref} position={[0, posY, 0]}>
      {/* Outer Refractive Glass Shell */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, baseBoxArgs[1], d]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      {/* Inner Emissive Core (slightly smaller) */}
      <mesh>
        <boxGeometry args={[w * 0.95, baseBoxArgs[1] * 0.98, d * 0.95]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>
    </group>
  );

  return (
    <group position={[posX, 0.1, posZ]}>
      {/* Concrete Sidewalk Pad (Strictly inside Urban Block) */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[baseWidth + 0.6, 0.16, dimZ + 0.6]} />
        <meshStandardMaterial color="#64748B" roughness={0.9} />
      </mesh>

      {/* Main Building Structure */}
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
        <group>
          {/* Base Podium Tier */}
          {renderDoubleSkinBlock(baseMeshRef, 1.0, baseWidth, dimZ, [baseWidth, 2.0, dimZ])}

          {/* Entrance Lobby Door Glass */}
          <mesh position={[0, 0.7, dimZ / 2 + 0.04]}>
            <planeGeometry args={[baseWidth * 0.45, 1.0]} />
            <meshBasicMaterial color="#FEF08A" />
          </mesh>

          {/* Mid Tier */}
          {renderDoubleSkinBlock(midMeshRef, 3.5, midWidth, dimZ * 0.78, [midWidth, 3.0, dimZ * 0.78])}

          {/* Crown Tier with Variety */}
          {archProfile === 'pyramid_crown' ? (
            <mesh position={[0, targetDimY + 1.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[crownWidth * 0.75, 2.2, 4]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
            </mesh>
          ) : archProfile === 'sloped_glass' ? (
            <mesh position={[0, targetDimY + 0.8, 0]} rotation={[0.35, 0, 0]} castShadow>
              <boxGeometry args={[crownWidth, 1.5, dimZ * 0.54]} />
              <primitive object={glassMaterial} attach="material" />
            </mesh>
          ) : (
            <group>
              {renderDoubleSkinBlock(crownMeshRef, 5.75, crownWidth, dimZ * 0.54, [crownWidth, 1.5, dimZ * 0.54])}
              {/* Spire Top */}
              <mesh position={[0, targetDimY + 2.0, 0]}>
                <cylinderGeometry args={[0.05, 0.35, 4, 16]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>

        {/* Selection Ring */}
        {(isSelected || isHovered) && (
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseWidth * 0.65, baseWidth * 0.9, 32]} />
            <meshBasicMaterial
              color={isSelected ? '#00F0FF' : '#7000FF'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}
      </group>

      {/* Floating 3D Holographic Label - ONLY VISIBLE ON HOVER/SELECT to prevent clutter */}
      {(isSelected || isHovered) && (
        <Html position={[0, targetDimY + 3.2, 0]} center distanceFactor={26}>
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap border ${
              isSelected
                ? 'bg-cyan-950/95 text-cyan-300 border-cyan-400 shadow-glow scale-110 z-20'
                : 'bg-purple-950/95 text-purple-200 border-purple-400 scale-105 z-10'
            }`}
            onClick={() => selectBuilding(building.id)}
          >
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0 shadow-sm"
              style={{ backgroundColor: building.color }}
            />
            <span className="font-bold">{building.name}</span>
            {building.rps && mode === 'LIVE_RUNTIME' && (
              <span className="ml-1 text-[10px] text-emerald-400 font-bold px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                {building.rps} req/s
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
