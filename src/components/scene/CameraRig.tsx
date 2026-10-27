import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useSystemStore } from '../../stores/useSystemStore';
import { planetDirToWorld, planetLocalToWorld, planetPosition } from '../../system/sim';
import { SUN_RADIUS } from '../../system/layout';

const FLIGHT_SECONDS = 1.8;

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const CameraRig: React.FC = () => {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const viewNonce = useSystemStore((s) => s.viewNonce);

  const st = useMemo(
    () => ({
      lastFocus: new THREE.Vector3(),
      focus: new THREE.Vector3(),
      flying: false,
      t: 0,
      fromRel: new THREE.Vector3(),
      fromTarget: new THREE.Vector3(),
      toDir: new THREE.Vector3(),
      toDist: 0,
      dir: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
      tmp2: new THREE.Vector3(),
      initialised: false,
      key: '',
    }),
    [],
  );

  const computeFocus = (out: THREE.Vector3) => {
    const { system, focusedPlanetId, selectedFileId } = useSystemStore.getState();
    const planet = system.planets.find((p) => p.id === focusedPlanetId);
    if (!planet) return out.set(0, 0, 0);
    const b = selectedFileId ? system.buildings.get(selectedFileId) : null;
    if (b && system.files.get(selectedFileId!)?.planetId === planet.id) {
      return planetLocalToWorld(planet, st.tmp2.copy(b.roof).addScaledVector(b.normal, -b.height * 0.4), out);
    }
    return planetPosition(planet, out);
  };

  /** Where the camera wants to sit relative to the focus. Re-evaluated during flights since planets keep turning. */
  const computeView = () => {
    const { system, focusedPlanetId, selectedFileId } = useSystemStore.getState();
    const planet = system.planets.find((p) => p.id === focusedPlanetId);
    if (!planet) {
      const last = system.planets[system.planets.length - 1];
      const extent = last ? last.orbitRadius + last.radius : 200;
      st.toDir.set(0.15, 0.62, 1).normalize();
      st.toDist = Math.max(160, extent * 1.75);
      return;
    }
    const toSun = planetPosition(planet, st.tmp2).negate().normalize();
    const b = selectedFileId ? system.buildings.get(selectedFileId) : null;
    if (b) {
      // above the roof, leaning toward the sun so we see the lit facades
      const n = planetDirToWorld(planet, b.normal, st.tmp);
      const lean = toSun.clone().projectOnPlane(n);
      if (lean.lengthSq() < 1e-4) lean.set(1, 0, 0).projectOnPlane(n);
      st.toDir.copy(n).multiplyScalar(0.75).addScaledVector(lean.normalize(), 0.65).normalize();
      st.toDist = 3.4 + b.height * 1.6;
      return;
    }
    const city = planetDirToWorld(planet, planet.districts[0].normal, st.tmp);
    st.toDir.copy(city).addScaledVector(toSun, 0.3).normalize();
    st.toDist = planet.radius * 2.6 + 4;
  };

  const focusKey = () => {
    const { focusedPlanetId, selectedFileId } = useSystemStore.getState();
    return `${focusedPlanetId}|${focusedPlanetId ? selectedFileId : ''}`;
  };

  const startFlight = () => {
    computeFocus(st.focus);
    computeView();
    st.key = focusKey();
    const ctrl = controls.current;

    if (!st.initialised) {
      // first frame: jump straight to the overview
      st.initialised = true;
      camera.position.copy(st.focus).addScaledVector(st.toDir, st.toDist * 1.25);
      ctrl?.target.copy(st.focus);
      st.lastFocus.copy(st.focus);
      return;
    }
    st.fromRel.copy(camera.position).sub(st.focus);
    st.fromTarget.copy(ctrl ? ctrl.target : st.focus);
    st.lastFocus.copy(st.focus);
    st.t = 0;
    st.flying = true;
    if (ctrl) ctrl.minDistance = 0.5;
  };

  // start a flight whenever the focus changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(startFlight, [viewNonce]);

  useEffect(() => {
    const ctrl = controls.current;
    if (!ctrl) return;
    const stop = () => {
      if (st.flying && st.t > 0.25) st.flying = false;
    };
    ctrl.addEventListener('start', stop);
    return () => ctrl.removeEventListener('start', stop);
  }, [st]);

  useFrame((_, dt) => {
    const ctrl = controls.current;
    if (!ctrl) return;
    // focus moved to something else (e.g. a file was deselected): fly instead of jumping
    if (st.initialised && focusKey() !== st.key) startFlight();
    computeFocus(st.focus);

    if (st.flying) {
      computeView();
      st.t = Math.min(1, st.t + dt / FLIGHT_SECONDS);
      const e = ease(st.t);
      const fromLen = st.fromRel.length();
      st.dir.copy(st.fromRel).normalize();
      // slerp the direction around the focus so we never cut through the planet
      const angle = st.dir.angleTo(st.toDir);
      if (angle > 1e-4) {
        const axis = st.tmp.crossVectors(st.dir, st.toDir).normalize();
        if (axis.lengthSq() > 0.5) st.dir.applyAxisAngle(axis, angle * e);
        else st.dir.lerp(st.toDir, e).normalize();
      }
      const len = Math.exp(THREE.MathUtils.lerp(Math.log(Math.max(fromLen, 0.01)), Math.log(st.toDist), e));
      camera.position.copy(st.focus).addScaledVector(st.dir, len);
      ctrl.target.lerpVectors(st.fromTarget, st.focus, e);
      if (st.t >= 1) st.flying = false;
    } else {
      // ride along with the moving focus (planets orbit, buildings rotate with them)
      st.tmp.subVectors(st.focus, st.lastFocus);
      camera.position.add(st.tmp);
      ctrl.target.add(st.tmp);
      const { focusedPlanetId, system, selectedFileId } = useSystemStore.getState();
      const planet = system.planets.find((p) => p.id === focusedPlanetId);
      ctrl.minDistance = planet ? (selectedFileId ? 0.8 : planet.radius * 1.2) : SUN_RADIUS * 1.6;
    }
    st.lastFocus.copy(st.focus);
  }, -1);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.9}
      panSpeed={0.6}
      maxDistance={3000}
    />
  );
};
