import * as THREE from 'three';
import { PlanetData } from './types';

/**
 * Single source of truth for where everything is. Orbits are analytic functions of sim time,
 * spin is integrated (it slows down while a planet is focused). Scene components and rockets
 * all read from here so they never drift apart.
 */
export const sim = {
  time: 0,
  spin: new Map<string, number>(),
};

const tmpQ = new THREE.Quaternion();
const yAxis = new THREE.Vector3(0, 1, 0);
const zAxis = new THREE.Vector3(0, 0, 1);

export function planetPosition(p: PlanetData, out = new THREE.Vector3(), time = sim.time): THREE.Vector3 {
  const a = p.orbitPhase + time * p.orbitSpeed;
  out.set(Math.cos(a) * p.orbitRadius, 0, Math.sin(a) * p.orbitRadius);
  out.applyAxisAngle(zAxis, p.orbitTilt);
  return out;
}

export function planetQuaternion(p: PlanetData, out = new THREE.Quaternion()): THREE.Quaternion {
  out.setFromAxisAngle(zAxis, p.axialTilt);
  tmpQ.setFromAxisAngle(yAxis, sim.spin.get(p.id) || 0);
  return out.multiply(tmpQ);
}

const q = new THREE.Quaternion();
export function planetLocalToWorld(p: PlanetData, local: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
  planetQuaternion(p, q);
  out.copy(local).applyQuaternion(q);
  const x = out.x, y = out.y, z = out.z;
  planetPosition(p, out);
  return out.set(out.x + x, out.y + y, out.z + z);
}

export function planetDirToWorld(p: PlanetData, dir: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
  planetQuaternion(p, q);
  return out.copy(dir).applyQuaternion(q);
}
