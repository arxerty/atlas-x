import React from 'react';
import * as THREE from 'three';

interface Props {
  startPos: [number, number, number];
  endPos: [number, number, number];
}

export const SuspensionBridge: React.FC<Props> = ({ startPos, endPos }) => {
  const start = new THREE.Vector3(...startPos);
  const end = new THREE.Vector3(...endPos);

  const length = start.distanceTo(end);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const angle = Math.atan2(end.x - start.x, end.z - start.z);

  return (
    <group position={[mid.x, 0.15, mid.z]} rotation={[0, angle, 0]}>
      {/* Asphalt Bridge Roadway Deck */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4.2, 0.4, length]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* Bridge Road Lane Line */}
      <mesh position={[0, 0.72, 0]}>
        <planeGeometry args={[0.2, length]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Twin Steel Pylon Towers (Start & End) */}
      {[-length * 0.35, length * 0.35].map((posZ, idx) => (
        <group key={idx} position={[0, 4, posZ]}>
          {/* Left Pylon Leg */}
          <mesh position={[-1.8, 0, 0]}>
            <boxGeometry args={[0.5, 8, 0.5]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Right Pylon Leg */}
          <mesh position={[1.8, 0, 0]}>
            <boxGeometry args={[0.5, 8, 0.5]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Top Crossbar Arch */}
          <mesh position={[0, 3.5, 0]}>
            <boxGeometry args={[4.2, 0.6, 0.5]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Suspension Cable Main Support Lines */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            const pts = [];
            for (let i = 0; i <= 30; i++) {
              const t = (i / 30) - 0.5;
              const y = 0.8 + Math.pow(t * 2, 2) * 3.5;
              pts.push(new THREE.Vector3(-1.8, y, t * length));
            }
            geo.setFromPoints(pts);
          }}
        />
        <lineBasicMaterial color="#CBD5E1" linewidth={2} />
      </line>

      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            const pts = [];
            for (let i = 0; i <= 30; i++) {
              const t = (i / 30) - 0.5;
              const y = 0.8 + Math.pow(t * 2, 2) * 3.5;
              pts.push(new THREE.Vector3(1.8, y, t * length));
            }
            geo.setFromPoints(pts);
          }}
        />
        <lineBasicMaterial color="#CBD5E1" linewidth={2} />
      </line>
    </group>
  );
};
