import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';
import { useAtlasStore } from '../../stores/useAtlasStore';

interface Props {
  building: BuildingNodeData;
}

// Procedural Canvas Window Grid Texture Generator (Photo 2 Photorealistic Window Facades)
function createWindowGridTexture(baseHexColor: string, style: 'artdeco' | 'glass' | 'granite'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base Wall Background
    ctx.fillStyle = style === 'glass' ? '#0F172A' : style === 'artdeco' ? '#334155' : '#1E293B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Window Grid Columns & Rows
    const cols = 8;
    const rows = 24;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    const paddingX = 4;
    const paddingY = 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW + paddingX;
        const y = r * cellH + paddingY;
        const w = cellW - paddingX * 2;
        const h = cellH - paddingY * 2;

        // Deterministic window lighting (lit vs unlit windows - Photo 2)
        const isLit = (r * 7 + c * 13) % 3 === 0;

        if (isLit) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#FEF08A' : '#38BDF8'; // Warm golden or cyan interior light
        } else {
          ctx.fillStyle = '#020617'; // Dark unlit window glass
        }
        ctx.fillRect(x, y, w, h);

        // Window Frame Mullion Border
        ctx.strokeStyle = '#475569';
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
  const isLive = useAtlasStore((s) => s.isLiveStreaming);

  const isSelected = selectedBuildingId === building.id;
  const isHovered = hoveredBuildingId === building.id;

  const [posX, posY, posZ] = building.position;
  const [dimX, targetDimY, dimZ] = building.dimensions;

  // LERP INTERPOLATION ANIMATION STATES FOR SILKY SMOOTH COMMIT TRANSITIONS
  const currentHeightRef = useRef<number>(targetDimY);

  // Architectural style assignment
  const archStyle = useMemo<'artdeco' | 'glass' | 'granite'>(() => {
    if (building.id.includes('auth')) return 'artdeco';
    if (building.id.includes('checkout') || building.id.includes('payment')) return 'glass';
    return 'granite';
  }, [building.id]);

  // Generate Procedural Skyscraper Window Facade Texture
  const facadeTexture = useMemo(() => {
    return createWindowGridTexture(building.color, archStyle);
  }, [building.color, archStyle]);

  // Photorealistic Skyscraper Facade Material
  const facadeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: facadeTexture,
      roughness: 0.15,
      metalness: archStyle === 'glass' ? 0.95 : 0.6,
      emissive: isSelected ? '#00F0FF' : isHovered ? '#7000FF' : building.color,
      emissiveIntensity: isSelected ? 0.6 : isHovered ? 0.4 : 0.2,
    });
  }, [facadeTexture, archStyle, building.color, isSelected, isHovered]);

  // FRAME-BY-FRAME LERP SMOOTH HEIGHT MORPHING (BUTTER-SMOOTH REPLAY)
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;

    // Smoothly interpolate current height toward targetDimY (lerp factor = 0.08)
    currentHeightRef.current = THREE.MathUtils.lerp(currentHeightRef.current, targetDimY, 0.08);

    const h = currentHeightRef.current;
    const baseH = Math.max(2.5, h * 0.25);
    const midH = Math.max(4.0, h * 0.55);
    const crownH = Math.max(2.0, h * 0.2);

    if (baseMeshRef.current) {
      baseMeshRef.current.scale.set(1, baseH / 2.5, 1);
      baseMeshRef.current.position.y = baseH / 2;
    }
    if (midMeshRef.current) {
      midMeshRef.current.scale.set(1, midH / 4.0, 1);
      midMeshRef.current.position.y = baseH + midH / 2;
    }
    if (crownMeshRef.current) {
      crownMeshRef.current.scale.set(1, crownH / 2.0, 1);
      crownMeshRef.current.position.y = baseH + midH + crownH / 2;
    }
  });

  const baseWidth = dimX;
  const midWidth = dimX * 0.76;
  const crownWidth = dimX * 0.52;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Concrete Sidewalk Base Curb Block */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[baseWidth + 1.4, 0.2, dimZ + 1.4]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Main NYC Skyscraper Structure with Frame-by-Frame Lerp */}
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
          <group position={[0, targetDimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.3, dimX / 1.3, targetDimY, 32]} />
              <meshStandardMaterial color={building.color} metalness={0.9} roughness={0.15} emissive={building.color} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, targetDimY / 2 + 0.35, 0]}>
              <cylinderGeometry args={[dimX / 1.1, dimX / 1.1, 0.7, 32]} />
              <meshStandardMaterial color="#FFB800" emissive="#FFB800" emissiveIntensity={0.45} />
            </mesh>
          </group>
        ) : building.type === 'cache' ? (
          // Hexagonal Power Station
          <group position={[0, targetDimY / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[dimX / 1.3, dimX / 1.3, targetDimY, 6]} />
              <meshStandardMaterial color={building.color} metalness={0.95} roughness={0.1} emissive="#00F0FF" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ) : (
          // REALISTIC MANHATTAN NYC SKYSCRAPER (Photo 2 Reference)
          <group>
            {/* Tier 1: Wide Ground Podium Base with Entrance Lobby */}
            <mesh ref={baseMeshRef} position={[0, 1.25, 0]}>
              <boxGeometry args={[baseWidth, 2.5, dimZ]} />
              <primitive object={facadeMaterial} attach="material" />
            </mesh>

            {/* Illuminated Entrance Lobby Glass Floor */}
            <mesh position={[0, 0.8, dimZ / 2 + 0.05]}>
              <planeGeometry args={[baseWidth * 0.5, 1.2]} />
              <meshBasicMaterial color="#FEF08A" />
            </mesh>

            {/* Tier 2: Stepped Mid Glass Tower */}
            <mesh ref={midMeshRef} position={[0, 4.5, 0]}>
              <boxGeometry args={[midWidth, 4.0, dimZ * 0.76]} />
              <primitive object={facadeMaterial} attach="material" />
            </mesh>

            {/* Tier 3: Setback Crown */}
            <mesh ref={crownMeshRef} position={[0, 7.5, 0]}>
              <boxGeometry args={[crownWidth, 2.0, dimZ * 0.52]} />
              <primitive object={facadeMaterial} attach="material" />
            </mesh>

            {/* Chrysler / Empire State Spire */}
            <mesh position={[0, targetDimY + 2.5, 0]}>
              <cylinderGeometry args={[0.06, 0.45, 5, 16]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.9} />
            </mesh>

            {/* Rooftop Helipad Ring */}
            <mesh position={[-crownWidth * 0.2, targetDimY + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4, 0.6, 16]} />
              <meshBasicMaterial color="#FFB800" side={THREE.DoubleSide} />
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
      <Html position={[0, targetDimY + 3.8, 0]} center distanceFactor={26}>
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
