// ──────────────────────────────────────────────────────────
// TorusKnotMath — pure functions for torus knot geometry.
// All functions take explicit parameters (no `this`).
// Used by TorusKnot.js, TorusKnotParticles.js, TorusKnotMarker.js.
// ──────────────────────────────────────────────────────────

import * as THREE from 'three';

/**
 * Compute a point on the torus knot centerline curve.
 * @returns {THREE.Vector3}
 */
export function knotCurvePoint(t, p, q, R, r) {
  const x = (R + r * Math.cos(q * t)) * Math.cos(p * t);
  const y = (R + r * Math.cos(q * t)) * Math.sin(p * t);
  const z = r * Math.sin(q * t);
  return new THREE.Vector3(x, y, z);
}

/**
 * Compute a point on the torus knot surface at parameters (t, s).
 * t = along the curve [0, 2π), s = around the tube [0, 2π).
 */
export function surfacePoint(t, s, p, q, R, r) {
  const eps = 0.0001;
  const c0 = knotCurvePoint(t, p, q, R, r);
  const c1 = knotCurvePoint(t + eps, p, q, R, r);
  const T = c1.clone().sub(c0).normalize();
  const up = new THREE.Vector3(0, 0, 1);
  let N = new THREE.Vector3().crossVectors(T, up).normalize();
  if (N.length() < 0.1) N = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
  const B = new THREE.Vector3().crossVectors(T, N).normalize();
  return new THREE.Vector3(c0.x, c0.y, c0.z)
    .add(N.clone().multiplyScalar(r * Math.cos(s)))
    .add(B.clone().multiplyScalar(r * Math.sin(s)));
}

/**
 * Compute the outward surface normal at parameters (t, s).
 */
export function surfaceNormal(t, s, p, q, R, r) {
  const eps = 0.0001;
  const p0 = surfacePoint(t, s, p, q, R, r);
  const p1 = surfacePoint(t + eps, s, p, q, R, r);
  const p2 = surfacePoint(t, s + eps, p, q, R, r);
  const n = new THREE.Vector3().crossVectors(
    p1.clone().sub(p0), p2.clone().sub(p0),
  ).normalize();
  if (n.dot(p0.clone().normalize().multiplyScalar(-1)) < 0) n.negate();
  return n;
}

/**
 * Sample the knot centerline into frames (point, tangent, normal, binormal).
 * @returns {{ samples: Array, cumLengths: number[], arcLength: number }}
 */
export function sampleKnotFrames(p, q, R, r, N = 400) {
  const samples = [];
  const cumLengths = [];
  let arcLength = 0;
  const eps = 0.0001;

  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const pt = knotCurvePoint(t, p, q, R, r);
    const ptF = knotCurvePoint(t + eps, p, q, R, r);
    const T = ptF.clone().sub(pt).normalize();
    const up = new THREE.Vector3(0, 0, 1);
    let Nv = new THREE.Vector3().crossVectors(T, up).normalize();
    if (Nv.length() < 0.1) Nv = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
    const B = new THREE.Vector3().crossVectors(T, Nv).normalize();
    samples.push({ point: pt.clone(), tangent: T, normal: Nv, binormal: B });
    if (i > 0) arcLength += pt.distanceTo(samples[i - 1].point);
    cumLengths.push(arcLength);
  }

  return { samples, cumLengths, arcLength };
}

/**
 * Interpolate a frame at normalized parameter u ∈ [0, 1] along the knot.
 * @returns {{ point, tangent, normal, binormal } | null}
 */
export function getFrame(u, samples, cumLengths, arcLength) {
  if (!samples.length) return null;
  const target = u * arcLength;
  let lo = 0, hi = cumLengths.length - 1;
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1;
    if (cumLengths[m] < target) lo = m;
    else hi = m;
  }
  const seg = cumLengths[hi] - cumLengths[lo];
  const f = seg > 0 ? (target - cumLengths[lo]) / seg : 0;
  const a = samples[lo], b = samples[hi];
  return {
    point: new THREE.Vector3().lerpVectors(a.point, b.point, f),
    tangent: new THREE.Vector3().lerpVectors(a.tangent, b.tangent, f).normalize(),
    normal: new THREE.Vector3().lerpVectors(a.normal, b.normal, f).normalize(),
    binormal: new THREE.Vector3().lerpVectors(a.binormal, b.binormal, f).normalize(),
  };
}

/**
 * Compute curvature samples along the knot centerline.
 * @returns {number[]} curvature values at N sample points
 */
export function computeCurvatureSamples(p, q, R, r, N = 400) {
  const samples = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const cq = Math.cos(q * t), sq = Math.sin(q * t);
    const cp = Math.cos(p * t), sp = Math.sin(p * t);
    const Rr = R + r * cq;
    const dx = -p * Rr * sp - r * q * sq * cp;
    const dy = p * Rr * cp - r * q * sq * sp;
    const dz = r * q * cq;
    const ddx = -p * p * Rr * cp + 2 * p * r * q * sq * sp - r * q * q * cq * cp;
    const ddy = -p * p * Rr * sp - 2 * p * r * q * sq * cp - r * q * q * cq * sp;
    const ddz = -r * q * q * sq;
    const cx = dy * ddz - dz * ddy;
    const cy = dz * ddx - dx * ddz;
    const cz = dx * ddy - dy * ddx;
    const crossMag = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
    samples.push(crossMag / (speed * speed * speed));
  }
  return samples;
}
