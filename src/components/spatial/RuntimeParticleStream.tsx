import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  isLive: boolean;
}

interface AnimatedParticle {
  curve: THREE.CubicBezierCurve3;
  progress: number;
  speed: number;
  color: string;
}

export const RuntimeParticleStream: React.FC<Props> = ({ buildings, isLive }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const particleGroupRef = useRef<THREE.Group>(null);

  // Generate particle tracks along dependency curves
  const particles = useMemo(() => {
    const list: AnimatedParticle[] = [];

    buildings.forEach((source) => {
      source.dependencies.forEach((targetId) => {
        const target = buildingMap.get(targetId);
        if (!target) return;

        const start = new THREE.Vector3(
          source.position[0],
          source.dimensions[1] * 0.5,
          source.position[2]
        );
        const end = new THREE.Vector3(
          target.position[0],
          target.dimensions[1] * 0.5,
          target.position[2]
        );

        const distance = start.distanceTo(end);
        const midY = Math.max(start.y, end.y) + Math.min(distance * 0.35, 12);
        const curve = new THREE.CubicBezierCurve3(
          start,
          new THREE.Vector3(start.x + (end.x - start.x) * 0.25, midY, start.z + (end.z - start.z) * 0.25),
          new THREE.Vector3(start.x + (end.x - start.x) * 0.75, midY, start.z + (end.z - start.z) * 0.75),
          end
        );

        // Spawn multiple offset particles per highway track
        const count = 3;
        for (let i = 0; i < count; i++) {
          const isErrorParticle = (source.errorRate || 0) > 0.05 && Math.random() < 0.3;
          list.push({
            curve,
            progress: (i / count) + Math.random() * 0.2,
            speed: 0.15 + Math.random() * 0.25,
            color: isErrorParticle ? '#FF0055' : target.type === 'cache' ? '#00F0FF' : '#00FF66',
          });
        }
      });
    });

    return list;
  }, [buildings, buildingMap]);

  // Animate particle progress smoothly along curves
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (!isLive) return;

    particles.forEach((p, idx) => {
      p.progress = (p.progress + delta * p.speed) % 1;
      const mesh = meshRefs.current[idx];
      if (mesh) {
        const pt = p.curve.getPoint(p.progress);
        mesh.position.set(pt.x, pt.y, pt.z);
      }
    });
  });

  return (
    <group ref={particleGroupRef}>
      {particles.map((p, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
};
