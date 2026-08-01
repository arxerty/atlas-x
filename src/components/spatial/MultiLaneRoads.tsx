import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  selectedBuildingId: string | null;
}

export interface MultiLaneRoadSegment {
  id: string;
  sourceId: string;
  targetId: string;
  laneCurves: {
    forwardFast: THREE.CubicBezierCurve3;
    forwardSlow: THREE.CubicBezierCurve3;
    reverseFast: THREE.CubicBezierCurve3;
    reverseSlow: THREE.CubicBezierCurve3;
  };
  latencyMs: number;
}

export const MultiLaneRoads: React.FC<Props> = ({ buildings, selectedBuildingId }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const roadSegments = useMemo(() => {
    const segments: MultiLaneRoadSegment[] = [];

    buildings.forEach((source) => {
      source.dependencies.forEach((targetId) => {
        const target = buildingMap.get(targetId);
        if (!target) return;

        const start = new THREE.Vector3(source.position[0], 0.15, source.position[2]);
        const end = new THREE.Vector3(target.position[0], 0.15, target.position[2]);

        const control1 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.33,
          0.15,
          start.z + (end.z - start.z) * 0.33
        );
        const control2 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.66,
          0.15,
          start.z + (end.z - start.z) * 0.66
        );

        const dir = end.clone().sub(start).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        // 4-Lane Avenue Offsets (Matching Photo 1)
        const offsetInnerReq = perp.clone().multiplyScalar(0.6);
        const offsetOuterReq = perp.clone().multiplyScalar(1.4);
        const offsetInnerRes = perp.clone().multiplyScalar(-0.6);
        const offsetOuterRes = perp.clone().multiplyScalar(-1.4);

        segments.push({
          id: `${source.id}<->${targetId}`,
          sourceId: source.id,
          targetId,
          laneCurves: {
            forwardFast: new THREE.CubicBezierCurve3(
              start.clone().add(offsetInnerReq),
              control1.clone().add(offsetInnerReq),
              control2.clone().add(offsetInnerReq),
              end.clone().add(offsetInnerReq)
            ),
            forwardSlow: new THREE.CubicBezierCurve3(
              start.clone().add(offsetOuterReq),
              control1.clone().add(offsetOuterReq),
              control2.clone().add(offsetOuterReq),
              end.clone().add(offsetOuterReq)
            ),
            reverseFast: new THREE.CubicBezierCurve3(
              end.clone().add(offsetInnerRes),
              control2.clone().add(offsetInnerRes),
              control1.clone().add(offsetInnerRes),
              start.clone().add(offsetInnerRes)
            ),
            reverseSlow: new THREE.CubicBezierCurve3(
              end.clone().add(offsetOuterRes),
              control2.clone().add(offsetOuterRes),
              control1.clone().add(offsetOuterRes),
              start.clone().add(offsetOuterRes)
            ),
          },
          latencyMs: source.latencyMs || 20,
        });
      });
    });

    return segments;
  }, [buildings, buildingMap]);

  return (
    <group>
      {roadSegments.map((segment) => {
        const isHighlighted =
          selectedBuildingId === segment.sourceId || selectedBuildingId === segment.targetId;

        const innerPoints = segment.laneCurves.forwardFast.getPoints(40);
        const innerGeom = new THREE.BufferGeometry().setFromPoints(innerPoints);

        const outerPoints = segment.laneCurves.forwardSlow.getPoints(40);
        const outerGeom = new THREE.BufferGeometry().setFromPoints(outerPoints);

        return (
          <group key={segment.id}>
            {/* Inner Lane Marking */}
            <line geometry={innerGeom}>
              <lineBasicMaterial
                color={isHighlighted ? '#00F0FF' : '#475569'}
                linewidth={isHighlighted ? 4 : 2}
                transparent
                opacity={0.85}
              />
            </line>
            {/* Outer Lane Marking */}
            <line geometry={outerGeom}>
              <lineBasicMaterial
                color={isHighlighted ? '#00F0FF' : '#334155'}
                linewidth={1}
                transparent
                opacity={0.5}
              />
            </line>
          </group>
        );
      })}
    </group>
  );
};
