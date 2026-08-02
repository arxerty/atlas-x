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

  // Generate Realistic Multi-Lane Vehicles (Grid-Aligned Manhattan Pathing)
  const vehicles = useMemo(() => {
    const list: RealisticVehicle[] = [];
    const vehicleTypes: VehicleModelType[] = ['sedan', 'taxi', 'van', 'suv', 'motorcycle'];

    buildings.forEach((source) => {
      source.dependencies.forEach((targetId) => {
        const target = buildingMap.get(targetId);
        if (!target) return;

        // Manhattan Grid Pathfinding Logic
        const start = new THREE.Vector3(source.position[0], 0.25, source.position[2]);
        const end = new THREE.Vector3(target.position[0], 0.25, target.position[2]);

        // Snap to nearest avenue (X) and street (Z)
        // Corridors are at multiples of 16 (-32, -16, 0, 16, 32)
        const snap = (val: number) => Math.round(val / 16) * 16;
        
        const roadStartX = snap(start.x);
        const roadEndZ = snap(end.z);

        // Path: Driveway -> Nearest Avenue -> Nearest Street -> Driveway
        const p0 = start.clone();
        const p1 = new THREE.Vector3(roadStartX, 0.25, start.z);
        const p2 = new THREE.Vector3(roadStartX, 0.25, roadEndZ);
        const p3 = new THREE.Vector3(end.x, 0.25, roadEndZ);
        const p4 = end.clone();

        // Base curve
        const baseCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, 'catmullrom', 0.1);

        const latency = source.latencyMs || 20;
        const speed = Math.max(0.04, Math.min(0.5, 28 / latency));

        // Create 2 lanes of traffic (offset from center)
        for (let lane = 0; lane < 2; lane++) {
          for (let i = 0; i < 3; i++) {
            const vType = vehicleTypes[(lane + i) % vehicleTypes.length];
            let vColor = '#38BDF8';
            if (vType === 'taxi') vColor = '#EAB308';
            if (vType === 'van') vColor = '#F8FAFC';
            if (vType === 'suv') vColor = '#0F172A';
            if (vType === 'motorcycle') vColor = '#EF4444';

            // We generate offset curves by sampling the base curve.
            // A precise parallel curve requires sampling and calculating normals.
            const offsetDist = lane === 0 ? 0.8 : 2.0; // Lane 1 and Lane 2
            const numPts = 40;
            const pts = baseCurve.getSpacedPoints(numPts);
            const offsetPts: THREE.Vector3[] = [];
            
            for (let j = 0; j <= numPts; j++) {
              const t = j / numPts;
              const pt = baseCurve.getPoint(t);
              const tangent = baseCurve.getTangent(t);
              // Perpendicular vector for offset (Y is up, so normal is (-tangent.z, 0, tangent.x))
              const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
              offsetPts.push(pt.clone().add(normal.multiplyScalar(offsetDist)));
            }
            
            const finalCurve = new THREE.CatmullRomCurve3(offsetPts, false, 'catmullrom', 0.1);

            list.push({
              curve: finalCurve,
              progress: (i / 3) + Math.random() * 0.15,
              speed: speed * (0.85 + Math.random() * 0.3),
              modelType: vType,
              color: vColor,
              latencyMs: latency,
            });
          }
        }
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
