import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  selectedBuildingId: string | null;
}

export interface DependencySplinePath {
  id: string;
  sourceId: string;
  targetId: string;
  curve: THREE.CubicBezierCurve3;
  color: string;
}

export const DependencyHighways: React.FC<Props> = ({ buildings, selectedBuildingId }) => {
  const buildingMap = useMemo(() => {
    const map = new Map<string, BuildingNodeData>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const splinePaths = useMemo(() => {
    const paths: DependencySplinePath[] = [];

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

        // Control points creating arc height highway
        const distance = start.distanceTo(end);
        const midY = Math.max(start.y, end.y) + Math.min(distance * 0.35, 12);
        
        const control1 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.25,
          midY,
          start.z + (end.z - start.z) * 0.25
        );
        const control2 = new THREE.Vector3(
          start.x + (end.x - start.x) * 0.75,
          midY,
          start.z + (end.z - start.z) * 0.75
        );

        const curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
        const isRelatedToSelected =
          selectedBuildingId === source.id || selectedBuildingId === targetId;

        paths.push({
          id: `${source.id}->${targetId}`,
          sourceId: source.id,
          targetId: targetId,
          curve,
          color: isRelatedToSelected ? '#00F0FF' : '#334155',
        });
      });
    });

    return paths;
  }, [buildings, buildingMap, selectedBuildingId]);

  return (
    <group>
      {splinePaths.map((path) => {
        const points = path.curve.getPoints(32);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const isHighlighted = path.color === '#00F0FF';

        return (
          <line key={path.id} geometry={geometry}>
            <lineBasicMaterial
              color={path.color}
              transparent
              opacity={isHighlighted ? 0.9 : 0.25}
              linewidth={isHighlighted ? 3 : 1}
            />
          </line>
        );
      })}
    </group>
  );
};
