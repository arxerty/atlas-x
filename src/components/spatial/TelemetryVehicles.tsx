import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  isLive: boolean;
}

interface TelemetryVehicle {
  curve: THREE.CubicBezierCurve3;
  progress: number;
  speed: number; // Inversely proportional to latencyMs!
  isRequestLane: boolean;
  vehicleType: 'car' | 'truck';
  color: string;
  latencyMs: number;
}

export const TelemetryVehicles: React.FC<Props> = ({ buildings, isLive }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const vehicleMeshGroup = useRef<THREE.Group>(null);

  // Generate Vehicles for two-lane telemetry highways
  const vehicles = useMemo(() => {
    const list: TelemetryVehicle[] = [];

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
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.7);

        // Lane A: Forward Request Lane (+perp)
        const reqCurve = new THREE.CubicBezierCurve3(
          start.clone().add(perp),
          control1.clone().add(perp),
          control2.clone().add(perp),
          end.clone().add(perp)
        );

        // Lane B: Reverse Response Lane (-perp)
        const resCurve = new THREE.CubicBezierCurve3(
          end.clone().sub(perp),
          control2.clone().sub(perp),
          control1.clone().sub(perp),
          start.clone().sub(perp)
        );

        const latency = source.latencyMs || 20;

        // SPEED CALCULATION BASED ON NETWORK LATENCY
        // Low latency (e.g. 5ms) -> speed ~ 0.5 (Fast sports car)
        // High latency (e.g. 290ms) -> speed ~ 0.05 (Slow heavy truck in congestion)
        const speed = Math.max(0.04, Math.min(0.55, 30 / latency));
        const isHighLatency = latency > 100;

        // Forward Request Vehicles
        for (let i = 0; i < 2; i++) {
          list.push({
            curve: reqCurve,
            progress: i * 0.5 + Math.random() * 0.1,
            speed,
            isRequestLane: true,
            vehicleType: isHighLatency ? 'truck' : 'car',
            color: isHighLatency ? '#FF0055' : '#00F0FF',
            latencyMs: latency,
          });
        }

        // Reverse Response Vehicles
        for (let i = 0; i < 2; i++) {
          list.push({
            curve: resCurve,
            progress: i * 0.5 + Math.random() * 0.1,
            speed,
            isRequestLane: false,
            vehicleType: isHighLatency ? 'truck' : 'car',
            color: isHighLatency ? '#FFB800' : '#00FF66',
            latencyMs: latency,
          });
        }
      });
    });

    return list;
  }, [buildings, buildingMap]);

  const vehicleMeshRefs = useRef<(THREE.Group | null)[]>([]);

  // Smoothly move vehicles along 2-lane curves at latency-based speed
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
    <group ref={vehicleMeshGroup}>
      {vehicles.map((v, idx) => {
        const isTruck = v.vehicleType === 'truck';
        return (
          <group
            key={idx}
            ref={(el) => {
              vehicleMeshRefs.current[idx] = el;
            }}
          >
            {/* Vehicle Chassis Box */}
            <mesh position={[0, isTruck ? 0.35 : 0.2, 0]}>
              <boxGeometry args={[isTruck ? 1.4 : 0.9, isTruck ? 0.6 : 0.3, isTruck ? 0.6 : 0.4]} />
              <meshStandardMaterial color={v.color} metalness={0.8} roughness={0.2} emissive={v.color} emissiveIntensity={0.3} />
            </mesh>

            {/* Glowing White LED Headlights (Front) */}
            <mesh position={[isTruck ? 0.72 : 0.47, isTruck ? 0.2 : 0.15, 0.15]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[isTruck ? 0.72 : 0.47, isTruck ? 0.2 : 0.15, -0.15]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>

            {/* Glowing Red Taillights (Rear) */}
            <mesh position={[isTruck ? -0.72 : -0.47, isTruck ? 0.2 : 0.15, 0.15]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#FF0055" />
            </mesh>
            <mesh position={[isTruck ? -0.72 : -0.47, isTruck ? 0.2 : 0.15, -0.15]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#FF0055" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
