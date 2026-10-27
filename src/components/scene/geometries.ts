import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function flat(g: THREE.BufferGeometry) {
  const n = g.toNonIndexed();
  n.computeVertexNormals();
  return n;
}

// unit shapes with their base at y = 0
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  hex: flat(new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1).translate(0, 0.5, 0)),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 1).translate(0, 0.5, 0),
  dome: new THREE.SphereGeometry(0.5, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1),
  pad: flat(new THREE.CylinderGeometry(1, 1, 1, 8, 1).translate(0, -0.5, 0)),
  padRim: new THREE.RingGeometry(0.965, 1.0, 8, 1).rotateX(-Math.PI / 2),
  antenna: new THREE.CylinderGeometry(0.5, 0.5, 1, 5).translate(0, 0.5, 0),
  beacon: new THREE.SphereGeometry(1, 8, 6),
  parkGround: new THREE.CylinderGeometry(1, 1, 1, 28).translate(0, 0.5, 0),
  tree: new THREE.ConeGeometry(0.5, 1, 7).translate(0, 0.5, 0),
  glassDome: new THREE.SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  geodesic: new THREE.IcosahedronGeometry(1, 2),
  carBody: buildCarBody(),
  carLight: new THREE.BoxGeometry(0.07, 0.014, 0.022),
  beam: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0),
};

function buildCarBody() {
  const hull = new THREE.CapsuleGeometry(0.03, 0.11, 3, 8).rotateX(Math.PI / 2).scale(1.15, 0.7, 1);
  const canopy = new THREE.SphereGeometry(0.026, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.012, 0.018);
  return mergeGeometries([hull.toNonIndexed(), canopy.toNonIndexed()])!;
}

/** Rocket body: lathe hull, fins and an engine bell, with baked vertex colours (+Y = forward). */
export function buildRocketGeometry(stripe: THREE.Color) {
  const white = new THREE.Color('#e9e9ec');
  const dark = new THREE.Color('#2b2e35');
  const metal = new THREE.Color('#8d939c');
  const paint = (g: THREE.BufferGeometry, c: THREE.Color) => {
    const n = g.index ? g.toNonIndexed() : g;
    const count = n.attributes.position.count;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) arr.set([c.r, c.g, c.b], i * 3);
    n.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    n.deleteAttribute('uv');
    return n;
  };
  const profile = [
    [0.0, -0.5], [0.1, -0.5], [0.125, -0.38], [0.13, 0.15], [0.115, 0.3], [0.08, 0.42], [0.04, 0.5], [0.0, 0.55],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const hull = new THREE.LatheGeometry(profile, 24);
  const band = new THREE.CylinderGeometry(0.133, 0.133, 0.08, 24, 1, true).translate(0, 0.05, 0);
  const window = new THREE.SphereGeometry(0.035, 10, 8).scale(0.6, 1, 1).translate(0.122, 0.24, 0);
  const bell = new THREE.CylinderGeometry(0.06, 0.1, 0.12, 16, 1, true).translate(0, -0.56, 0);
  const parts = [paint(hull, white), paint(band, stripe), paint(window, dark), paint(bell, metal)];
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.BoxGeometry(0.012, 0.22, 0.13).translate(0, -0.36, 0.17);
    fin.applyMatrix4(new THREE.Matrix4().makeRotationY((i / 4) * Math.PI * 2));
    parts.push(paint(fin, i % 2 ? stripe : dark));
  }
  return mergeGeometries(parts)!;
}

export const FLAME_GEO = new THREE.ConeGeometry(0.09, 0.6, 14, 1, true).rotateX(Math.PI).translate(0, -0.85, 0);
export const FLAME_CORE_GEO = new THREE.ConeGeometry(0.05, 0.35, 10, 1, true).rotateX(Math.PI).translate(0, -0.72, 0);

let glowTexture: THREE.Texture | null = null;
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.15, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}
