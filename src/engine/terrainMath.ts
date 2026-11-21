import { TerrainProfile } from '../types/world';

/**
 * Deterministic 2D value noise + domain-warped fBM + ridged multifractal + colossal distant peak synthesis.
 * Generates a unique terrain topography for every image based on its TerrainProfile & seed.
 */

function hash2D(ix: number, iz: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function valueNoise2D(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fz = smoothstep(z - iz);

  const a = hash2D(ix, iz, seed);
  const b = hash2D(ix + 1, iz, seed);
  const c = hash2D(ix, iz + 1, seed);
  const d = hash2D(ix + 1, iz + 1, seed);

  const ab = a + (b - a) * fx;
  const cd = c + (d - c) * fx;
  return ab + (cd - ab) * fz;
}

function fbm2D(x: number, z: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, z * freq, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.04;
  }
  return sum / norm;
}

function ridgedFbm2D(x: number, z: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let weight = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    let signal = 1 - Math.abs(valueNoise2D(x * freq, z * freq, seed + i * 47) * 2 - 1);
    signal = signal * signal * weight;
    weight = Math.max(0.2, Math.min(1, signal * 1.8));
    sum += signal * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.12;
  }
  return sum / norm;
}

/**
 * Full profile-driven terrain height sampler.
 * Supports colossal distant mountain peaks visible from afar, directional ridge strata,
 * domain warping, mesa plateaus, twin-peak gorges, and optional river carving (only when hasRiver=true).
 */
export function sampleTerrainHeightWithProfile(
  x: number,
  z: number,
  seed: number,
  profile: TerrainProfile
): number {
  if (profile.shape === 'flat_urban_pad' || (profile.baseAmplitude <= 0 && profile.distantPeaks.length === 0)) {
    return 0;
  }

  // Rotate coordinates by the image-specific valleyDirectionAngle so strata align uniquely
  const cosA = Math.cos(profile.valleyDirectionAngle);
  const sinA = Math.sin(profile.valleyDirectionAngle);
  const rx = x * cosA - z * sinA;
  const rz = x * sinA + z * cosA;

  // Domain warping so ridgelines curve organically and never repeat
  const freq = Math.max(0.004, profile.baseFrequency);
  const warp = profile.warpStrength;
  const wx = rx + (fbm2D(rx * freq * 0.6, rz * freq * 0.6, seed + 17, 3) - 0.5) * warp;
  const wz = rz + (fbm2D(rx * freq * 0.6 + 9.4, rz * freq * 0.6 - 5.2, seed + 53, 3) - 0.5) * warp;

  const smoothNoise = fbm2D(wx * freq, wz * freq, seed, 4);
  const ridgedNoise = ridgedFbm2D(wx * freq * 1.15, wz * freq * 1.15, seed + 113, 5);
  const blendedNoise =
    smoothNoise * (1 - profile.ridgeSharpness) + ridgedNoise * profile.ridgeSharpness;

  // Keep a walkable vantage plateau near the player spawn (0, 16) while letting terrain undulate naturally
  const distFromSpawn = Math.hypot(x, z - 12);
  const spawnFlatten = smoothstep(Math.min(1, distFromSpawn / 18));

  let h = (blendedNoise - 0.36) * profile.baseAmplitude * (0.22 + 0.78 * spawnFlatten);

  // Shape-specific macro topography
  if (profile.shape === 'twin_peaks_gorge') {
    // Deep dramatic gorge down the center axis, towering walls on left and right
    const gorgeWall = Math.pow(Math.min(1, Math.abs(rx) / 95), 1.6);
    h += gorgeWall * profile.baseAmplitude * 2.4 * (0.6 + 0.4 * ridgedNoise);
  } else if (profile.shape === 'arid_mesa_canyon') {
    // Terraced stepped canyon & flat-topped mesas
    const rawMesa = blendedNoise * profile.baseAmplitude * 1.8 * spawnFlatten;
    const steps = 4.5;
    h = (Math.floor(rawMesa / steps) + smoothstep((rawMesa % steps) / steps) * 0.35) * steps;
  } else if (profile.shape === 'coastal_cliff_bay') {
    // High headland cliff on one side sloping down into an open bay
    const cliffSlope = smoothstep((rx + 45) / 130);
    h += (cliffSlope * profile.baseAmplitude * 1.9 - 4.5) * spawnFlatten;
  }

  // Synthesize Colossal Distant Mountain Peaks (visible from afar!)
  for (let i = 0; i < profile.distantPeaks.length; i++) {
    const peak = profile.distantPeaks[i];
    const dx = x - peak.x;
    const dz = z - peak.z;
    const cosP = Math.cos(peak.ridgeAngle);
    const sinP = Math.sin(peak.ridgeAngle);
    // Anisotropic mountain base: elongated along ridgeAngle like real mountain massifs
    const alongRidge = dx * cosP - dz * sinP;
    const acrossRidge = dx * sinP + dz * cosP;
    const ellipDist = Math.hypot(alongRidge * 0.68, acrossRidge * 1.18);

    if (ellipDist < peak.radius) {
      const u = 1 - ellipDist / peak.radius;
      // Sharp spine crest along the mountain ridge axis
      const spineFactor = 1 - Math.min(1, Math.abs(acrossRidge) / (peak.radius * 0.45)) * 0.32;
      // Radial erosion gullies and craggy rock faces
      const gullyNoise = ridgedFbm2D(
        (x + i * 37) * 0.018,
        (z - i * 29) * 0.018,
        seed + 300 + i * 71,
        4
      );
      const envelope = Math.pow(u, Math.max(1.1, peak.sharpness));
      const peakContrib =
        peak.height * envelope * spineFactor * (0.62 + 0.52 * gullyNoise);
      h += peakContrib;
    }
  }

  // Optional River Channel ONLY if profile.hasRiver is explicitly true
  if (profile.hasRiver) {
    const rCos = Math.cos(profile.riverAngle);
    const rSin = Math.sin(profile.riverAngle);
    const riverCoord = x * rCos - z * rSin;
    const riverFlow = x * rSin + z * rCos;
    const meander = Math.sin(riverFlow * 0.022 + seed * 0.1) * 16 - 8;
    const riverDist = Math.abs(riverCoord - meander);
    if (riverDist < 13) {
      h -= (1 - smoothstep(riverDist / 13)) * 4.5;
    }
  }

  return h;
}

/**
 * Legacy helper for simple callers & unit tests.
 */
export function sampleTerrainHeight(
  x: number,
  z: number,
  seed: number,
  amplitude = 16,
  frequency = 0.015
): number {
  return sampleTerrainHeightWithProfile(x, z, seed, {
    terrainSize: 320,
    shape: 'rolling_meadow_hills',
    baseAmplitude: amplitude,
    baseFrequency: frequency,
    ridgeSharpness: 0.5,
    valleyDirectionAngle: (seed % 628) / 100,
    warpStrength: 18,
    hasRiver: false,
    riverAngle: 0,
    hasHouses: false,
    hasBridge: false,
    snowColor: '#F4F8FF',
    rockColor: '#4A5568',
    meadowColor: '#273B3A',
    distantPeaks: [],
  });
}
