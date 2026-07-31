import React from 'react';
import { Html } from '@react-three/drei';
import { DistrictData } from '../../types/atlas';

interface Props {
  district: DistrictData;
}

export const DistrictGrid: React.FC<Props> = ({ district }) => {
  const { x, z, width, depth } = district.bounds;

  return (
    <group position={[x, 0.01, z]}>
      {/* District Base Ground Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={district.color}
          transparent
          opacity={0.08}
          roughness={0.9}
        />
      </mesh>

      {/* District Glowing Wireframe Border */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, depth)]} />
        <lineBasicMaterial color={district.color} transparent opacity={0.4} linewidth={2} />
      </lineSegments>

      {/* Spatial District Label */}
      <Html position={[-width / 2 + 1, 0.2, -depth / 2 + 1]} center={false} distanceFactor={35}>
        <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none select-none">
          {district.name}
        </div>
      </Html>
    </group>
  );
};
import * as THREE from 'three';
