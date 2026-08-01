import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  selectedBuildingId: string | null;
}

export interface RoadSegment {
  id: string;
  sourceId: string;
  targetId: string;
  curve: THREE.CubicBezierCurve3;
  requestCurve: THREE.CubicBezierCurve3;  // Forward Lane (+Offset)
  responseCurve: THREE.CubicBezierCurve3; // Reverse Lane (-Offset)
  latencyMs: number;
}

export const TwoLaneRoads: React.FC<Props> = ({ buildings, selectedBuildingId }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const roadSegments = useMemo(() => {
    const segments: RoadSegment[] = [];

    buildings.forEach((source) => {
      source.dependencies.forEach((targetId) => {
        const target = buildingMap.get(targetId);
        if (!target) return;

        // Ground-level road endpoints
        const start = new THREE.Vector3(source.position[0], 0.15, source.position[2]);
        const end = new THREE.Vector3(target.position[0], 0.15, target.position[2]);

        const distance = start.distanceTo(end);
        const midY = 0.15; // Low ground road level

        // Control points for smooth road curvature
        const control1 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.33,
          midY,
          start.z + (end.z - start.z) * 0.33
        );
        const control2 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.66,
          midY,
          start.z + (end.z - start.z) * 0.66
        );

        const mainCurve = new THREE.CubicBezierCurve3(start, control1, control2, end);

        // Compute perpendicular offset vectors for 2-lane separation
        const dir = end.clone().sub(start).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.7); // Lane offset = 0.7 units

        const reqStart = start.clone().add(perp);
        const reqEnd = end.clone().add(perp);
        const reqC1 = control1.clone().add(perp);
        const reqC2 = control2.clone().add(perp);
        const requestCurve = new THREE.CubicBezierCurve3(reqStart, reqC1, reqC2, reqEnd);

        const resStart = end.clone().sub(perp);
        const resEnd = start.clone().sub(perp);
        const resC1 = control2.clone().sub(perp);
        const resC2 = control1.clone().sub(perp);
        const responseCurve = new THREE.CubicBezierCurve3(resStart, resC1, resC2, resEnd);

        segments.push({
          id: `${source.id}<->${targetId}`,
          sourceId: source.id,
          targetId: targetId,
          curve: mainCurve,
          requestCurve,
          responseCurve,
          latencyMs: source.latencyMs || 10,
        });
      });
    });

    return segments;
  }, [buildings, buildingMap]);

  return (
    <group>
      {roadSegments.map((segment) => {
        const points = segment.curve.getPoints(40);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const isHighlighted =
          selectedBuildingId === segment.sourceId || selectedBuildingId === segment.targetId;

        return (
          <group key={segment.id}>
            {/* Asphalt Road Base Line */}
            <line geometry={geometry}>
              <lineBasicMaterial
                color={isHighlighted ? '#00F0FF' : '#334155'}
                linewidth={isHighlighted ? 4 : 2}
                transparent
                opacity={0.85}
              />
            </line>
          </group>
        );
      })}
    </group>
  );
};
