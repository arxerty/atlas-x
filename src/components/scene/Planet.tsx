import React, { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData, SystemData } from '../../system/types';
import { planetPosition, planetQuaternion } from '../../system/sim';
import { atmosphereRadius, createAtmosphereMaterial, createCloudMaterial, createRingMaterial, createSurfaceMaterial, cloudCoverage } from './planetMaterials';
import { createCityUniforms } from './cityMaterials';
import { City } from './City';
import { useSystemStore } from '../../stores/useSystemStore';

const sphere = new THREE.SphereGeometry(1, 160, 120);
const shell = new THREE.SphereGeometry(1, 96, 64);

export const Planet: React.FC<{ planet: PlanetData; system: SystemData }> = ({ planet, system }) => {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);

  const focusedPlanetId = useSystemStore((s) => s.focusedPlanetId);
  const focusPlanet = useSystemStore((s) => s.focusPlanet);
  const showLabels = useSystemStore((s) => s.showLabels && s.started);
  const focused = focusedPlanetId === planet.id;

  const surface = useMemo(() => createSurfaceMaterial(planet), [planet]);
  const cloudMat = useMemo(() => (cloudCoverage(planet) > 0 ? createCloudMaterial(planet) : null), [planet]);
  const atmo = useMemo(() => createAtmosphereMaterial(planet), [planet]);
  const ringInner = planet.radius * 1.55;
  const ringOuter = planet.radius * 2.35;
  const ringGeo = useMemo(() => new THREE.RingGeometry(ringInner, ringOuter, 160, 1), [ringInner, ringOuter]);
  const ringMat = useMemo(() => (planet.hasRings ? createRingMaterial(planet, ringInner, ringOuter) : null), [planet, ringInner, ringOuter]);
  const cityUniforms = useMemo(() => createCityUniforms(), []);

  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), m3: new THREE.Matrix3(), m4: new THREE.Matrix4(), cloudSpin: 0 }), []);

  useFrame(({ camera, clock }, dt) => {
    if (!outer.current || !inner.current) return;
    planetPosition(planet, tmp.p);
    planetQuaternion(planet, tmp.q);
    outer.current.position.copy(tmp.p);
    inner.current.quaternion.copy(tmp.q);

    tmp.m4.makeRotationFromQuaternion(tmp.q);
    tmp.m3.setFromMatrix4(tmp.m4);
    surface.uniforms.uRot.value.copy(tmp.m3);
    surface.uniforms.uCenter.value.copy(tmp.p);
    surface.uniforms.uTime.value = clock.elapsedTime;
    atmo.uniforms.uCenter.value.copy(tmp.p);
    cityUniforms.uPlanetCenter.value.copy(tmp.p);
    cityUniforms.uTime.value = clock.elapsedTime;

    const dist = camera.position.distanceTo(tmp.p);
    if (cloudMat && clouds.current) {
      tmp.cloudSpin += dt * 0.004;
      clouds.current.rotation.y = tmp.cloudSpin;
      clouds.current.updateMatrixWorld();
      cloudMat.uniforms.uCenter.value.copy(tmp.p);
      cloudMat.uniforms.uTime.value = clock.elapsedTime;
      cloudMat.uniforms.uFade.value = THREE.MathUtils.smoothstep(dist, planet.radius * 1.6, planet.radius * 4.5) * 0.85 + 0.15;
      // world -> planet-local, so cleared holes stay over the cities while clouds drift
      tmp.m3.transpose();
      cloudMat.uniforms.uInvRot.value.copy(tmp.m3);
    }
    if (ringMat) ringMat.uniforms.uCenter.value.copy(tmp.p);
    if (label.current) label.current.style.opacity = focused ? '0' : String(THREE.MathUtils.clamp((dist - planet.radius * 3) / (planet.radius * 4), 0, 1));
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return;
    e.stopPropagation();
    if (!focused) focusPlanet(planet.id);
  };

  const cloudRadius = planet.radius + 0.95;

  return (
    <group ref={outer}>
      <group ref={inner}>
        <mesh
          geometry={sphere}
          material={surface}
          scale={planet.radius}
          onClick={onClick}
          onPointerOver={() => !focused && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        />
        <City planet={planet} system={system} uniforms={cityUniforms} focused={focused} />
        {ringMat && <mesh geometry={ringGeo} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null} />}
      </group>
      {cloudMat && <mesh ref={clouds} geometry={shell} material={cloudMat} scale={cloudRadius} raycast={() => null} />}
      <mesh geometry={shell} material={atmo} scale={atmosphereRadius(planet)} raycast={() => null} />
      {showLabels && (
        <Html position={[0, planet.radius * 1.25 + 1.5, 0]} center zIndexRange={[15, 0]}>
          <div ref={label} className="planet-label" onClick={() => focusPlanet(planet.id)}>
            <span className="planet-label-dot" style={{ background: planet.palette.atmosphere }} />
            {planet.name}
          </div>
        </Html>
      )}
    </group>
  );
};
