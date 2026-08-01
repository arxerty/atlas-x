import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  isLive: boolean;
}

export type VehicleModelType = 'sedan' | 'taxi' | 'van' | 'suv' | 'motorcycle';

interface RealisticVehicle {
  curve: THREE.CubicBezierCurve3;
  progress: number;
  speed: number; // Inversely proportional to network latencyMs!
  modelType: VehicleModelType;
  color: string;
  latencyMs: number;
}

export const TelemetryVehicles: React.FC<Props> = ({ buildings, isLive }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const vehicleGroupRef = useRef<THREE.Group>(null);

  // Generate Realistic Multi-Lane Vehicles (Matching Photo 1 Reference)
  const vehicles = useMemo(() => {
    const list: RealisticVehicle[] = [];
    const vehicleTypes: VehicleModelType[] = ['sedan', 'taxi', 'van', 'suv', 'motorcycle'];

    buildings.forEach((source) => {
      source.dependencies.forEach((targetId) => {
        const target = buildingMap.get(targetId);
        if (!target) return;

        const start = new THREE.Vector3(source.position[0], 0.25, source.position[2]);
        const end = new THREE.Vector3(target.position[0], 0.25, target.position[2]);

        const control1 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.33,
          0.25,
          start.z + (end.z - start.z) * 0.33
        );
        const control2 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.66,
          0.25,
          start.z + (end.z - start.z) * 0.66
        );

        const dir = end.clone().sub(start).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        // 4-Lane Avenue Curves
        const laneReq1 = new THREE.CubicBezierCurve3(
          start.clone().add(perp.clone().multiplyScalar(0.6)),
          control1.clone().add(perp.clone().multiplyScalar(0.6)),
          control2.clone().add(perp.clone().multiplyScalar(0.6)),
          end.clone().add(perp.clone().multiplyScalar(0.6))
        );
        const laneReq2 = new THREE.CubicBezierCurve3(
          start.clone().add(perp.clone().multiplyScalar(1.4)),
          control1.clone().add(perp.clone().multiplyScalar(1.4)),
          control2.clone().add(perp.clone().multiplyScalar(1.4)),
          end.clone().add(perp.clone().multiplyScalar(1.4))
        );
        const laneRes1 = new THREE.CubicBezierCurve3(
          end.clone().sub(perp.clone().multiplyScalar(0.6)),
          control2.clone().sub(perp.clone().multiplyScalar(0.6)),
          control1.clone().sub(perp.clone().multiplyScalar(0.6)),
          start.clone().sub(perp.clone().multiplyScalar(0.6))
        );
        const laneRes2 = new THREE.CubicBezierCurve3(
          end.clone().sub(perp.clone().multiplyScalar(1.4)),
          control2.clone().sub(perp.clone().multiplyScalar(1.4)),
          control1.clone().sub(perp.clone().multiplyScalar(1.4)),
          start.clone().sub(perp.clone().multiplyScalar(1.4))
        );

        const latency = source.latencyMs || 20;

        // SPEED CALCULATION: Low latency = Fast traffic, High latency = Traffic congestion!
        const speed = Math.max(0.04, Math.min(0.5, 28 / latency));

        const curves = [laneReq1, laneReq2, laneRes1, laneRes2];

        // Spawn multiple vehicles across 4 lanes to recreate Photo 1 traffic density
        curves.forEach((c, cIdx) => {
          for (let i = 0; i < 3; i++) {
            const vType = vehicleTypes[(cIdx + i) % vehicleTypes.length];
            let vColor = '#38BDF8'; // Blue sedan default
            if (vType === 'taxi') vColor = '#EAB308'; // NYC Yellow Taxi
            if (vType === 'van') vColor = '#F8FAFC'; // White delivery van
            if (vType === 'suv') vColor = '#0F172A'; // Black SUV
            if (vType === 'motorcycle') vColor = '#EF4444'; // Red motorcycle

            list.push({
              curve: c,
              progress: (i / 3) + Math.random() * 0.15,
              speed: speed * (0.85 + Math.random() * 0.3),
              modelType: vType,
              color: vColor,
              latencyMs: latency,
            });
          }
        });
      });
    });

    return list;
  }, [buildings, buildingMap]);

  const vehicleMeshRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    if (!isLive) return;

    vehicles.forEach((v, idx) => {
      v.progress = (v.progress + delta * v.speed) % 1;
      const group = vehicleMeshRefs.current[idx];
      if (group) {
        const pt = v.curve.getPoint(v.progress);
        const tangent = v.curve.getTangent(v.progress);

        group.position.set(pt.x, pt.y, pt.z);
        group.rotation.y = Math.atan2(-tangent.z, tangent.x);
      }
    });
  });

  return (
    <group ref={vehicleGroupRef}>
      {vehicles.map((v, idx) => {
        const isTaxi = v.modelType === 'taxi';
        const isVan = v.modelType === 'van';
        const isMotorcycle = v.modelType === 'motorcycle';
        const isSuv = v.modelType === 'suv';

        const length = isVan ? 1.4 : isMotorcycle ? 0.6 : isSuv ? 1.1 : 0.9;
        const height = isVan ? 0.6 : isMotorcycle ? 0.3 : isSuv ? 0.45 : 0.35;
        const width = isMotorcycle ? 0.2 : isVan ? 0.65 : 0.45;

        return (
          <group
            key={idx}
            ref={(el) => {
              vehicleMeshRefs.current[idx] = el;
            }}
          >
            {/* Main Vehicle Chassis Box */}
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[length, height, width]} />
              <meshStandardMaterial color={v.color} metalness={0.7} roughness={0.2} />
            </mesh>

            {/* Cabin Glass Windshield (for cars/taxis/suvs) */}
            {!isMotorcycle && (
              <mesh position={[0, height * 0.8, 0]}>
                <boxGeometry args={[length * 0.55, height * 0.5, width * 0.85]} />
                <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
              </mesh>
            )}

            {/* Yellow NYC Taxi Roof Sign Box (Matching Photo 1 Taxis) */}
            {isTaxi && (
              <mesh position={[0, height + 0.1, 0]}>
                <boxGeometry args={[0.25, 0.1, 0.15]} />
                <meshBasicMaterial color="#FFD700" />
              </mesh>
            )}

            {/* 4 Black Wheels */}
            {!isMotorcycle && (
              <>
                <mesh position={[length * 0.28, 0.08, width * 0.48]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} rotation={[Math.PI / 2, 0, 0]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[-length * 0.28, 0.08, width * 0.48]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} rotation={[Math.PI / 2, 0, 0]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[length * 0.28, 0.08, -width * 0.48]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} rotation={[Math.PI / 2, 0, 0]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[-length * 0.28, 0.08, -width * 0.48]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} rotation={[Math.PI / 2, 0, 0]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </>
            )}

            {/* Glowing White LED Headlights (Front - Photo 1) */}
            <mesh position={[length / 2 + 0.02, height * 0.4, width * 0.35]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[length / 2 + 0.02, height * 0.4, -width * 0.35]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>

            {/* BRIGHT RED LED TAILLIGHTS (Rear - Photo 1 Reference Stream) */}
            <mesh position={[-length / 2 - 0.02, height * 0.4, width * 0.35]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#FF0033" />
            </mesh>
            <mesh position={[-length / 2 - 0.02, height * 0.4, -width * 0.35]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#FF0033" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
