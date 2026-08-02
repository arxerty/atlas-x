import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BuildingNodeData } from '../../types/atlas';

interface Props {
  buildings: BuildingNodeData[];
  selectedBuildingId: string | null;
}

export interface GridRoadCorridor {
  id: string;
  isVertical: boolean; // True for N-S avenues, False for E-W streets
  coord: number; // Constant X or Z position
  start: number;
  end: number;
}

export const MultiLaneRoads: React.FC<Props> = ({ buildings, selectedBuildingId }) => {
  // STRICT GRID STREET CORRIDORS
  // Roads run strictly along X and Z grid corridor lines separating urban blocks!
  const roadCorridors = useMemo(() => {
    const corridors: GridRoadCorridor[] = [];
    const blockStride = 16; // 11m block + 5m corridor
    
    // We have a 6x6 grid. The grid spans from roughly -48 to +48
    // So the corridors are at -40, -24, -8, 8, 24, 40 (between blocks)
    // Actually, block centers are at (c - 3 + 0.5)*16 = -40, -24, -8, 8, 24, 40
    // The edges between blocks are at -32, -16, 0, 16, 32
    
    const roadBounds = 48; // Don't extend roads past the Island mesh (52)

    // Vertical Avenues (N-S)
    for (let c = -2; c <= 2; c++) {
      const x = c * blockStride; // -32, -16, 0, 16, 32
      corridors.push({
        id: `ave-${c}`,
        isVertical: true,
        coord: x,
        start: -roadBounds,
        end: roadBounds,
      });
    }

    // Horizontal Streets (E-W)
    for (let r = -2; r <= 2; r++) {
      const z = r * blockStride; // -32, -16, 0, 16, 32
      corridors.push({
        id: `st-${r}`,
        isVertical: false,
        coord: z,
        start: -roadBounds,
        end: roadBounds,
      });
    }

    return corridors;
  }, []);

  return (
    <group position={[0, 0.12, 0]}>
      {roadCorridors.map((c) => {
        const roadWidth = 4.2;
        const length = c.end - c.start;
        const midPos = (c.start + c.end) / 2;

        if (c.isVertical) {
          // N-S Vertical Avenue
          return (
            <group key={c.id} position={[c.coord, 0, midPos]}>
              {/* Solid Dark Asphalt Road Surface */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[roadWidth, length]} />
                <meshStandardMaterial color="#0F172A" roughness={0.85} />
              </mesh>

              {/* Left Solid White Boundary Line */}
              <mesh position={[-roadWidth / 2 + 0.1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, length]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>

              {/* Right Solid White Boundary Line */}
              <mesh position={[roadWidth / 2 - 0.1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, length]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>

              {/* Dashed White Center Line */}
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.18, length]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
              </mesh>
            </group>
          );
        } else {
          // E-W Horizontal Street
          return (
            <group key={c.id} position={[midPos, 0, c.coord]} rotation={[0, Math.PI / 2, 0]}>
              {/* Solid Dark Asphalt Road Surface */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[roadWidth, length]} />
                <meshStandardMaterial color="#0F172A" roughness={0.85} />
              </mesh>

              {/* Left Solid White Boundary Line */}
              <mesh position={[-roadWidth / 2 + 0.1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, length]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>

              {/* Right Solid White Boundary Line */}
              <mesh position={[roadWidth / 2 - 0.1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, length]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>

              {/* Dashed White Center Line */}
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.18, length]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
              </mesh>
            </group>
          );
        }
      })}
    </group>
  );
};
