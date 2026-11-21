import {
  DetailedSceneElement,
  EnvironmentSettings,
  FiveQuestionsReasoning,
  HeroSubjectSpec,
  TerrainPeak,
  TerrainProfile,
  UploadedImage,
  WorldArchetype,
  WorldBlueprint,
  WorldPalette,
} from '../types/world';
import { DEFAULT_ENVIRONMENT } from '../store/useWorldStore';
import { sampleTerrainHeightWithProfile } from '../engine/terrainMath';

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 99991) + 1;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates a unique procedural TerrainProfile from a seed + archetype when not explicitly provided,
 * guaranteeing that no two scenic photos ever share the same ridge angles, peak layout, or warp.
 */
export function buildDefaultTerrainProfile(
  archetype: WorldArchetype,
  palette: WorldPalette,
  seed: number
): TerrainProfile {
  const rand = seededRand(seed + 991);
  const isFlat =
    archetype === 'aviation_tarmac' ||
    archetype === 'urban_city_canyon' ||
    archetype === 'courtyard_garden' ||
    archetype === 'open_market_plaza' ||
    archetype === 'highway_motorsport';

  if (isFlat) {
    return {
      terrainSize: 280,
      shape: 'flat_urban_pad',
      baseAmplitude: 0,
      baseFrequency: 0.01,
      ridgeSharpness: 0,
      valleyDirectionAngle: 0,
      warpStrength: 0,
      hasRiver: false,
      riverAngle: 0,
      hasHouses: false,
      hasBridge: false,
      snowColor: '#F4F8FF',
      rockColor: palette.structureSecondary,
      meadowColor: palette.groundPrimary,
      distantPeaks: [],
    };
  }

  const isGrandMountain = archetype === 'grand_mountain_range';
  const peakCount = isGrandMountain ? 5 + (seed % 3) : 3;
  const distantPeaks: TerrainPeak[] = [];

  for (let i = 0; i < peakCount; i++) {
    const spread = (i / Math.max(1, peakCount - 1) - 0.5) * 2; // -1..+1
    const x = spread * (isGrandMountain ? 220 : 110) + (rand() - 0.5) * 45;
    const z = isGrandMountain
      ? -175 - Math.abs(spread) * 65 - rand() * 125
      : -115 - rand() * 65;
    const height = isGrandMountain
      ? (i === Math.floor(peakCount / 2) ? 195 : 135) + rand() * 55
      : 45 + rand() * 35;
    const radius = isGrandMountain ? 115 + rand() * 65 : 70 + rand() * 35;

    distantPeaks.push({
      x,
      z,
      height,
      radius,
      sharpness: isGrandMountain ? 1.55 + rand() * 1.15 : 1.3 + rand() * 0.6,
      ridgeAngle: (rand() - 0.5) * 1.8,
      snowLine: isGrandMountain ? 0.48 + rand() * 0.22 : 0.78,
    });
  }

  const shapes: TerrainProfile['shape'][] = isGrandMountain
    ? ['colossal_mountain_vista', 'twin_peaks_gorge', 'jagged_ridge_amphitheater']
    : ['rolling_meadow_hills', 'jagged_ridge_amphitheater'];

  return {
    terrainSize: isGrandMountain ? 960 : 420,
    shape: shapes[seed % shapes.length],
    baseAmplitude: isGrandMountain ? 12 + rand() * 10 : 9 + rand() * 7,
    baseFrequency: 0.007 + rand() * 0.009,
    ridgeSharpness: isGrandMountain ? 0.65 + rand() * 0.3 : 0.35 + rand() * 0.35,
    valleyDirectionAngle: (rand() - 0.5) * Math.PI,
    warpStrength: 14 + rand() * 24,
    hasRiver: false,
    riverAngle: (rand() - 0.5) * 0.8,
    hasHouses: false,
    hasBridge: false,
    snowColor: '#F2F7FF',
    rockColor: palette.structurePrimary || '#4B5563',
    meadowColor: palette.groundPrimary || '#283D34',
    distantPeaks,
  };
}

/**
 * Generates dense, ultra-detailed 3D elements for the chosen WorldArchetype & TerrainProfile.
 * Respects terrainProfile.hasHouses / hasBridge / hasRiver so pure mountain vistas never get unwanted houses or rivers!
 */
export function populateDetailedElementsForArchetype(
  archetype: WorldArchetype,
  palette: WorldPalette,
  signageTexts: string[],
  seed: number,
  terrainProfile: TerrainProfile
): DetailedSceneElement[] {
  const rand = seededRand(seed);
  const elements: DetailedSceneElement[] = [];
  const sign = (idx: number, fallback: string) => signageTexts[idx % signageTexts.length] || fallback;
  const yAt = (x: number, z: number) =>
    sampleTerrainHeightWithProfile(x, z, seed, terrainProfile);

  if (archetype === 'grand_mountain_range') {
    // Pure majestic mountain wilderness: NO unwanted houses or village bridges unless explicitly present!
    // Keep the central sightline toward the colossal distant peaks (z < 0) wide open!
    // Place fractured granite rock outcrops and treeline alpine pines along the flanking ridges
    for (let i = 0; i < 34; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // Frame the left and right flanks (|x| > 11 in front, or behind the player)
      const isFrontVista = i < 24;
      const x = isFrontVista
        ? side * (12 + rand() * 85)
        : (rand() - 0.5) * 140;
      const z = isFrontVista
        ? 18 - rand() * 135
        : 24 + rand() * 75;
      const y = yAt(x, z);

      // Respect alpine treeline: rock outcrops on higher ground, pines in the lower alpine basin
      const isRock = y > 22 || i % 3 === 0;
      elements.push({
        id: `mtn-nature-${i}`,
        kind: isRock ? 'rock_outcrop' : 'pine_tree',
        position: [x, y, z],
        rotationY: rand() * Math.PI * 2,
        scale: isRock
          ? [1.2 + rand() * 2.2, 1.0 + rand() * 1.8, 1.2 + rand() * 2.0]
          : [0.95 + rand() * 0.75, 1.05 + rand() * 0.9, 0.95 + rand() * 0.75],
        primaryColor: isRock ? terrainProfile.rockColor : palette.foliageColor,
        secondaryColor: terrainProfile.rockColor,
        accentColor: palette.accentGlow,
      });
    }

    // Only add alpine huts/bridge if the photo actually contained buildings or a bridge
    if (terrainProfile.hasBridge) {
      elements.push({
        id: 'mtn-bridge',
        kind: 'arched_bridge',
        position: [-8, yAt(-8, -18) + 0.5, -18],
        rotationY: 0.35,
        scale: [1.1, 1.1, 1.1],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    }
    if (terrainProfile.hasHouses) {
      [-22, 24].forEach((hx, idx) => {
        const hz = -26 - idx * 8;
        elements.push({
          id: `mtn-hut-${idx}`,
          kind: 'timber_cottage',
          position: [hx, yAt(hx, hz), hz],
          rotationY: idx === 0 ? 0.5 : -0.5,
          scale: [0.9, 0.9, 0.9],
          primaryColor: palette.structurePrimary,
          secondaryColor: palette.structureSecondary,
          accentColor: palette.accentGlow,
        });
      });
    }
  } else if (archetype === 'aviation_tarmac') {
    elements.push({
      id: 'av-tower',
      kind: 'control_tower',
      position: [26, 0, -28],
      rotationY: -0.4,
      scale: [1, 1, 1],
      primaryColor: palette.structurePrimary,
      secondaryColor: palette.structureSecondary,
      accentColor: palette.accentGlow,
    });
    elements.push({
      id: 'av-jet-2',
      kind: 'airliner_jet',
      position: [-34, 0, -34],
      rotationY: 0.55,
      scale: [0.85, 0.85, 0.85],
      primaryColor: '#DCE4EE',
      secondaryColor: palette.structureSecondary,
      accentColor: palette.accentGlow,
    });
    elements.push({
      id: 'av-stairs',
      kind: 'boarding_stairs',
      position: [-3.4, 0, -4.5],
      rotationY: 0.15,
      scale: [1, 1, 1],
      primaryColor: '#E2E8F0',
      secondaryColor: '#FACC15',
      accentColor: palette.accentGlow,
    });
    [
      [7.5, -4, -0.5],
      [-10.5, -14, 0.8],
      [14, -18, -1.1],
    ].forEach(([x, z, rot], i) => {
      elements.push({
        id: `av-truck-${i}`,
        kind: 'service_truck',
        position: [x, 0, z],
        rotationY: rot,
        scale: [1, 1, 1],
        primaryColor: i === 0 ? '#F59E0B' : '#E2E8F0',
        secondaryColor: '#1E293B',
        accentColor: palette.accentGlow,
      });
    });
    [-18, 18].forEach((rx, i) => {
      elements.push({
        id: `av-runway-lights-${i}`,
        kind: 'runway_light_array',
        position: [rx, 0, -10],
        rotationY: 0,
        scale: [1, 1, 1],
        primaryColor: '#1E293B',
        secondaryColor: '#38BDF8',
        accentColor: i === 0 ? '#22C55E' : '#F59E0B',
      });
    });
    [-14, 0, 14].forEach((bx, i) => {
      elements.push({
        id: `av-terminal-${i}`,
        kind: 'city_shopfront_block',
        stories: 3,
        signText: sign(i, `GATE B${12 + i}`),
        position: [bx, 0, -44],
        rotationY: 0,
        scale: [1.8, 1, 1.4],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    });
    [-22, -8, 8, 22].forEach((lx, i) => {
      elements.push({
        id: `av-lamp-${i}`,
        kind: 'streetlamp',
        position: [lx, 0, -34],
        rotationY: Math.PI / 2,
        scale: [1.4, 1.5, 1.4],
        primaryColor: '#334155',
        secondaryColor: '#94A3B8',
        accentColor: '#FEF08A',
      });
    });
  } else if (archetype === 'urban_city_canyon') {
    for (let i = 0; i < 6; i++) {
      const z = 14 - i * 11;
      const storiesLeft = 4 + ((i * 3) % 6);
      const storiesRight = 5 + ((i * 2) % 6);

      elements.push({
        id: `city-left-${i}`,
        kind: i % 2 === 0 ? 'city_building_tower' : 'city_shopfront_block',
        stories: storiesLeft,
        signText: sign(i, 'METRO PLAZA'),
        position: [-12.5 - (i % 2) * 1.2, 0, z],
        rotationY: Math.PI / 2,
        scale: [1.2, 1, 1.15],
        primaryColor: i % 2 === 0 ? palette.structurePrimary : palette.structureSecondary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });

      elements.push({
        id: `city-right-${i}`,
        kind: i % 2 === 1 ? 'city_building_tower' : 'city_shopfront_block',
        stories: storiesRight,
        signText: sign(i + 2, 'CYBER DISTRICT'),
        position: [12.5 + (i % 2) * 1.2, 0, z],
        rotationY: -Math.PI / 2,
        scale: [1.2, 1, 1.15],
        primaryColor: i % 2 === 1 ? palette.structurePrimary : palette.structureSecondary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    }
    [-10, 0, 10].forEach((bx, i) => {
      elements.push({
        id: `city-vista-${i}`,
        kind: 'city_building_tower',
        stories: i === 1 ? 11 : 8,
        signText: sign(i + 1, 'CENTRAL TOWER'),
        position: [bx, 0, -48],
        rotationY: 0,
        scale: [1.35, 1, 1.3],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    });
    for (let i = 0; i < 6; i++) {
      const z = 12 - i * 10;
      elements.push({
        id: `city-lamp-l-${i}`,
        kind: 'streetlamp',
        position: [-7.2, 0, z],
        rotationY: 0,
        scale: [1, 1, 1],
        primaryColor: '#1E293B',
        secondaryColor: '#475569',
        accentColor: palette.accentGlow,
      });
      elements.push({
        id: `city-lamp-r-${i}`,
        kind: 'streetlamp',
        position: [7.2, 0, z],
        rotationY: Math.PI,
        scale: [1, 1, 1],
        primaryColor: '#1E293B',
        secondaryColor: '#475569',
        accentColor: palette.accentGlow,
      });
    }
    [
      [-3.2, -4, 0],
      [3.4, -16, Math.PI],
      [-3.2, -26, 0],
      [3.4, 4, Math.PI],
    ].forEach(([vx, vz, vrot], i) => {
      elements.push({
        id: `city-car-${i}`,
        kind: 'parked_vehicle',
        position: [vx, 0, vz],
        rotationY: vrot,
        scale: [1, 1, 1],
        primaryColor: i % 2 === 0 ? palette.accentGlow : '#334155',
        secondaryColor: '#0F172A',
        accentColor: palette.accentGlow,
      });
    });
    [-6, -18, -30].forEach((sz, i) => {
      elements.push({
        id: `city-span-${i}`,
        kind: 'string_light_span',
        position: [0, 1.2, sz],
        rotationY: 0,
        scale: [1, 1, 1],
        primaryColor: '#FFFBEB',
        secondaryColor: '#F59E0B',
        accentColor: palette.accentGlow,
      });
      elements.push({
        id: `city-tree-l-${i}`,
        kind: 'broadleaf_tree',
        position: [-8.2, 0, sz + 4],
        rotationY: i,
        scale: [0.85, 0.85, 0.85],
        primaryColor: palette.foliageColor,
        secondaryColor: '#3B2B22',
        accentColor: palette.accentGlow,
      });
      elements.push({
        id: `city-tree-r-${i}`,
        kind: 'broadleaf_tree',
        position: [8.2, 0, sz + 4],
        rotationY: i + 1.5,
        scale: [0.85, 0.85, 0.85],
        primaryColor: palette.foliageColor,
        secondaryColor: '#3B2B22',
        accentColor: palette.accentGlow,
      });
    });
  } else if (archetype === 'courtyard_garden' || archetype === 'open_market_plaza') {
    [
      [0, -20, 0],
      [-12, -18, 0.35],
      [12, -18, -0.35],
      [-18, -6, Math.PI / 2],
      [18, -6, -Math.PI / 2],
      [-18, 6, Math.PI / 2],
      [18, 6, -Math.PI / 2],
    ].forEach(([wx, wz, wrot], i) => {
      elements.push({
        id: `court-wall-${i}`,
        kind:
          archetype === 'open_market_plaza' && i < 3
            ? 'city_shopfront_block'
            : 'courtyard_arcade_wall',
        stories: 2,
        signText: sign(i, 'COURTYARD CAFE'),
        position: [wx, 0, wz],
        rotationY: wrot,
        scale: [1.15, 1.05, 1],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    });
    elements.push({
      id: 'court-fountain',
      kind: 'stone_fountain',
      position: [-7.5, 0, -11],
      rotationY: 0,
      scale: [1.05, 1.05, 1.05],
      primaryColor: '#94A3B8',
      secondaryColor: '#64748B',
      accentColor: '#38BDF8',
    });
    [
      [7.5, -10],
      [9.5, -2.5],
      [-9.5, -2],
      [6.5, 4.5],
      [-8.5, 5.5],
    ].forEach(([tx, tz], i) => {
      elements.push({
        id: `court-table-${i}`,
        kind: 'cafe_terrace_table',
        position: [tx, 0, tz],
        rotationY: i * 0.9,
        scale: [1, 1, 1],
        primaryColor: i % 2 === 0 ? palette.accentGlow : palette.structureSecondary,
        secondaryColor: '#F8FAFC',
        accentColor: palette.accentGlow,
      });
    });
    [
      [-4.2, -14.5],
      [4.2, -14.5],
      [-13.5, -11.5],
      [13.5, -11.5],
      [-13.5, 1.5],
      [13.5, 1.5],
      [-4.8, 2.5],
      [4.8, 2.5],
      [-11, -6.5],
      [11, -6.5],
    ].forEach(([px, pz], i) => {
      elements.push({
        id: `court-planter-${i}`,
        kind: 'terracotta_planter',
        position: [px, 0, pz],
        rotationY: i * 1.1,
        scale: [1, 1, 1],
        primaryColor: '#B45309',
        secondaryColor: palette.foliageColor,
        accentColor: palette.accentGlow,
      });
    });
    [-12, -5, 2, 9].forEach((sz, i) => {
      elements.push({
        id: `court-lights-${i}`,
        kind: 'string_light_span',
        position: [0, 0.4, sz],
        rotationY: 0,
        scale: [1.2, 1, 1],
        primaryColor: '#FFFBEB',
        secondaryColor: '#FBBF24',
        accentColor: palette.accentGlow,
      });
    });
    [
      [-15, -15],
      [15, -15],
      [-15.5, 10],
      [15.5, 10],
      [0, -24],
    ].forEach(([tx, tz], i) => {
      elements.push({
        id: `court-tree-${i}`,
        kind: i % 2 === 0 ? 'cypress_tree' : 'broadleaf_tree',
        position: [tx, 0, tz],
        rotationY: i,
        scale: [1.1, 1.15, 1.1],
        primaryColor: palette.foliageColor,
        secondaryColor: '#3B2B22',
        accentColor: palette.accentGlow,
      });
    });
  } else if (archetype === 'harbor_waterfront') {
    elements.push({
      id: 'harbor-lighthouse',
      kind: 'harbor_lighthouse',
      position: [22, 0, -32],
      rotationY: 0,
      scale: [1.1, 1.1, 1.1],
      primaryColor: '#F8FAFC',
      secondaryColor: '#DC2626',
      accentColor: '#FEF08A',
    });
    [
      [-12, -16, 0.25],
      [11, -18, -0.3],
      [-4, -34, 1.1],
    ].forEach(([sx, sz, srot], i) => {
      elements.push({
        id: `harbor-ship-${i}`,
        kind: 'sailing_vessel',
        position: [sx, -0.4, sz],
        rotationY: srot,
        scale: [1.05, 1.05, 1.05],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    });
    if (terrainProfile.hasHouses) {
      [-16, -5, 6].forEach((bx, i) => {
        elements.push({
          id: `harbor-quay-${i}`,
          kind: 'timber_cottage',
          signText: sign(i, 'HARBOR PIER'),
          position: [bx, 0, 22],
          rotationY: Math.PI,
          scale: [1.2, 1.15, 1.1],
          primaryColor: palette.structurePrimary,
          secondaryColor: palette.structureSecondary,
          accentColor: palette.accentGlow,
        });
      });
    }
    for (let i = 0; i < 6; i++) {
      elements.push({
        id: `harbor-lamp-${i}`,
        kind: 'streetlamp',
        position: [i % 2 === 0 ? -3.4 : 3.4, 0, 12 - i * 6],
        rotationY: i % 2 === 0 ? 0 : Math.PI,
        scale: [0.95, 0.95, 0.95],
        primaryColor: '#1E293B',
        secondaryColor: '#475569',
        accentColor: '#FBBF24',
      });
    }
  } else if (archetype === 'sacred_monument') {
    elements.push({
      id: 'sacred-pavilion',
      kind: 'temple_pavilion',
      position: [0, yAt(0, -24), -24],
      rotationY: 0,
      scale: [1.3, 1.25, 1.25],
      primaryColor: palette.structurePrimary,
      secondaryColor: palette.structureSecondary,
      accentColor: palette.accentGlow,
    });
    [6, -4, -13].forEach((az, i) => {
      elements.push({
        id: `sacred-arch-${i}`,
        kind: 'stone_torii_arch',
        position: [0, yAt(0, az), az],
        rotationY: 0,
        scale: [1.05, 1.05, 1.05],
        primaryColor: palette.accentGlow,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    });
    if (terrainProfile.hasBridge) {
      elements.push({
        id: 'sacred-bridge',
        kind: 'arched_bridge',
        position: [-14, yAt(-14, -10), -10],
        rotationY: 0.4,
        scale: [1, 1, 1],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    }
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 16 + (i % 3) * 7;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r - 8;
      if (Math.abs(tx) < 5.5) continue;
      elements.push({
        id: `sacred-tree-${i}`,
        kind: i % 2 === 0 ? 'pine_tree' : 'broadleaf_tree',
        position: [tx, yAt(tx, tz), tz],
        rotationY: rand() * Math.PI * 2,
        scale: [1.1, 1.15, 1.1],
        primaryColor: palette.foliageColor,
        secondaryColor: '#3B2B22',
        accentColor: palette.accentGlow,
      });
    }
  } else if (archetype === 'highway_motorsport') {
    [
      [-4.2, -16, 0.08],
      [4.5, -24, -0.05],
      [-3.8, -34, 0.12],
    ].forEach(([cx, cz, crot], i) => {
      elements.push({
        id: `hw-car-${i}`,
        kind: 'parked_vehicle',
        position: [cx, 0, cz],
        rotationY: crot,
        scale: [1.2, 1.2, 1.2],
        primaryColor: i === 0 ? '#38BDF8' : i === 1 ? '#FACC15' : '#F43F5E',
        secondaryColor: '#0F172A',
        accentColor: palette.accentGlow,
      });
    });
    [-8, -22, -36].forEach((gz, i) => {
      elements.push({
        id: `hw-sign-${i}`,
        kind: 'neon_sign_board',
        signText: sign(i, 'SECTOR 1 · APEX'),
        position: [0, 6.2, gz],
        rotationY: 0,
        scale: [1.5, 1.2, 1],
        primaryColor: '#0F172A',
        secondaryColor: '#334155',
        accentColor: palette.accentGlow,
      });
      elements.push({
        id: `hw-lamp-l-${i}`,
        kind: 'streetlamp',
        position: [-8.5, 0, gz],
        rotationY: 0,
        scale: [1.2, 1.2, 1.2],
        primaryColor: '#1E293B',
        secondaryColor: '#475569',
        accentColor: palette.accentGlow,
      });
      elements.push({
        id: `hw-lamp-r-${i}`,
        kind: 'streetlamp',
        position: [8.5, 0, gz],
        rotationY: Math.PI,
        scale: [1.2, 1.2, 1.2],
        primaryColor: '#1E293B',
        secondaryColor: '#475569',
        accentColor: palette.accentGlow,
      });
    });
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (14 + (i % 4) * 4);
      const z = 14 - i * 4;
      elements.push({
        id: `hw-tree-${i}`,
        kind: i % 3 === 0 ? 'rock_outcrop' : 'pine_tree',
        position: [x, 0, z],
        rotationY: i,
        scale: [1.2, 1.3, 1.2],
        primaryColor: i % 3 === 0 ? palette.structureSecondary : palette.foliageColor,
        secondaryColor: '#334155',
        accentColor: palette.accentGlow,
      });
    }
  } else {
    // alpine_painterly_valley — ONLY include bridge or houses if terrainProfile says they exist in the image!
    if (terrainProfile.hasBridge) {
      elements.push({
        id: 'val-bridge',
        kind: 'arched_bridge',
        position: [-6, yAt(-6, -12) + 0.5, -12],
        rotationY: 0.45,
        scale: [1.15, 1.15, 1.15],
        primaryColor: palette.structurePrimary,
        secondaryColor: palette.structureSecondary,
        accentColor: palette.accentGlow,
      });
    }
    if (terrainProfile.hasHouses) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 1.2 - Math.PI * 0.6;
        const dist = 18 + (i % 3) * 8;
        const x = Math.sin(angle) * dist;
        const z = -Math.cos(angle) * dist - 6;
        const y = yAt(x, z);
        elements.push({
          id: `val-cottage-${i}`,
          kind: 'timber_cottage',
          position: [x, y, z],
          rotationY: rand() * Math.PI * 2,
          scale: [0.95 + (i % 3) * 0.15, 1 + (i % 2) * 0.2, 0.95],
          primaryColor: palette.structurePrimary,
          secondaryColor: palette.structureSecondary,
          accentColor: palette.accentGlow,
        });
      }
    }
    // Natural trees & rock outcrops
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 14 + (i % 5) * 9;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 4;
      if (Math.abs(x) < 8 && z < 20) continue;
      elements.push({
        id: `val-tree-${i}`,
        kind: i % 3 === 0 ? 'rock_outcrop' : i % 2 === 0 ? 'cypress_tree' : 'pine_tree',
        position: [x, yAt(x, z), z],
        rotationY: rand() * Math.PI * 2,
        scale: [0.9 + (i % 4) * 0.25, 1 + (i % 3) * 0.3, 0.9 + (i % 4) * 0.25],
        primaryColor: i % 3 === 0 ? terrainProfile.rockColor : palette.foliageColor,
        secondaryColor: '#2B211A',
        accentColor: palette.accentGlow,
      });
    }
  }

  return elements;
}

/**
 * Local fallback blueprint builder for unit tests or offline fallback.
 */
export function buildLocalFallbackBlueprint(
  filename: string,
  demoId?: string,
  userHint?: string
): { blueprint: WorldBlueprint; recommendedEnv: EnvironmentSettings } {
  const lower = `${filename} ${demoId ?? ''} ${userHint ?? ''}`.toLowerCase();
  const seed = hashSeed(lower || 'framebreak');

  let archetype: WorldArchetype = 'courtyard_garden';
  let groundType: WorldBlueprint['groundType'] = 'cobblestone_courtyard';
  let sceneTitle = 'Sunlit Courtyard Sanctuary';
  let subtitle = 'Intimate cobblestone terrace with stucco arcades, fountain, and lush planters';
  let reasoning: FiveQuestionsReasoning = {
    whatItIs:
      'A focal subject captured with warm natural tones and expressive surface texture.',
    whereItShouldBe:
      'An intimate open-air Mediterranean cobblestone garden courtyard framed by arched villa walls, terracotta planters, a stone fountain, and bistro seating.',
    mood: 'Golden afternoon warmth with soft directional shadows and floating dust motes.',
    theme: 'Timeless Mediterranean courtyard architecture & botanical sanctuary.',
    particularRelevance:
      'Transforms an intimate captured moment into a living architectural enclosure where the subject naturally belongs.',
  };
  let palette: WorldPalette = {
    skyTop: '#16284C',
    skyHorizon: '#E89B58',
    groundPrimary: '#4E4942',
    groundSecondary: '#26231F',
    structurePrimary: '#C9B194',
    structureSecondary: '#5A3E2B',
    accentGlow: '#F59E0B',
    foliageColor: '#2E5A36',
  };
  let heroKind: HeroSubjectSpec['kind'] = 'botanical_bloom';
  let heroLabel = 'Botanical Sanctuary Centerpiece';
  let signageTexts = ['GIARDINO', 'ATELIER FLORA', 'VILLA SOL', 'TERRACE 4', 'CONSERVATORY'];

  if (/\b(cat|kitten|tabby|feline|meow)\b/.test(lower)) {
    heroKind = 'cat_creature';
    heroLabel = 'Courtyard Companion';
    signageTexts = ['CAFE LUMIERE', 'VILLA SOL', 'GIARDINO', 'TERRACE 4', 'ARTISAN'];
  } else if (/\b(dog|puppy|canine|hound|retriever)\b/.test(lower)) {
    heroKind = 'dog_creature';
    heroLabel = 'Courtyard Hound';
    signageTexts = ['CAFE LUMIERE', 'VILLA SOL', 'GIARDINO', 'TERRACE 4', 'ARTISAN'];
  } else if (/\b(flower|flowers|rose|tulip|bloom|blossom|sunflower|lily|orchid|petal|garden|botanical|bouquet|daisy|lotus|flora)\b/.test(lower)) {
    archetype = 'courtyard_garden';
    groundType = 'cobblestone_courtyard';
    sceneTitle = 'Sunlit Botanical Flower Sanctuary';
    subtitle = 'Lush sunlit stone conservatory courtyard centered on a vibrant blooming floral centerpiece';
    reasoning = {
      whatItIs:
        'A vibrant botanical blossom with layered petals, organic stems, foliage, and warm natural floral tones.',
      whereItShouldBe:
        'A sunlit open-air Mediterranean botanical garden courtyard with carved stone planters, climbing greenery, terracotta urns, a fountain, and warm golden afternoon light.',
      mood: 'Warm sunlit botanical serenity with gentle breeze and dappled garden shadows.',
      theme: 'Living botanical conservatory & sculptural garden sanctuary.',
      particularRelevance:
        'Expands an intimate floral study into a full open-air botanical courtyard where you can walk around the blooming centerpiece.',
    };
    heroKind = 'botanical_bloom';
    heroLabel = 'Sculpted Botanical Bloom';
    signageTexts = ['ORANGERIE', 'BOTANICA', 'ROSE GARDEN', 'CONSERVATORY', 'FLORA'];
  } else if (/\b(mountain|mountains|peak|peaks|alps|himalaya|summit|ridge|everest|matterhorn|fuji|glacier|cliff|highland|canyon)\b/.test(lower)) {
    archetype = 'grand_mountain_range';
    groundType = 'sculpted_valley';
    sceneTitle = 'Colossal Alpine Massif Vista';
    subtitle = 'Expansive high-altitude ridge overlooking towering distant snow-capped mountain peaks';
    reasoning = {
      whatItIs:
        'A monumental mountain massif with craggy granite faces, sharp ridgelines, and high-altitude snowfields rising into the sky.',
      whereItShouldBe:
        'An expansive, unobstructed high-altitude alpine overlook spanning nearly a kilometer, where you stand among glacial rock outcrops and treeline pines gazing at the towering mountain peaks from afar.',
      mood: 'Crisp, awe-inspiring high-mountain clarity with dramatic alpenglow and atmospheric distance.',
      theme: 'Pure untamed alpine geology and monumental vertical scale.',
      particularRelevance:
        'Preserves the raw wilderness grandeur of the mountain without artificial buildings or clutter, letting you experience its true colossal scale from afar.',
    };
    palette = {
      skyTop: '#0B1D3A',
      skyHorizon: '#8BA8C7',
      groundPrimary: '#2A3B32',
      groundSecondary: '#1C2621',
      structurePrimary: '#525E6E',
      structureSecondary: '#36404D',
      accentGlow: '#F59E0B',
      foliageColor: '#1E3A2F',
    };
    heroKind = 'mountain_cairn';
    heroLabel = 'Alpine Summit Cairn';
    signageTexts = ['SUMMIT RIDGE', 'NORTH FACE', 'ALPINE PASS', 'GLACIER VIEW', '2840M'];
  } else if (/\b(plane|airliner|aircraft|jet|airport|boeing|airbus|flight|runway|aviation)\b/.test(lower)) {
    archetype = 'aviation_tarmac';
    groundType = 'tarmac_runway';
    sceneTitle = 'International Twilight Apron';
    subtitle = 'Active airport tarmac with wide-body jetliner, taxiway lighting, and control tower';
    reasoning = {
      whatItIs:
        'A commercial wide-body turbofan airliner with illuminated passenger cabin windows, swept wings, and metallic fuselage livery.',
      whereItShouldBe:
        'An active international airport apron and runway threshold at dusk, complete with painted taxiway lines, approach strobes, mobile boarding stairs, ground support trucks, and an air traffic control tower.',
      mood: 'Cinematic aviation twilight with crisp metallic reflections, glowing sodium apron floodlights, and distant runway beacons.',
      theme: 'High-precision modern aerospace engineering & global transit architecture.',
      particularRelevance:
        'Airports are thresholds of departure and arrival—stepping into the frame lets you walk beneath the wings and inspect the aircraft at full scale.',
    };
    palette = {
      skyTop: '#0B152B',
      skyHorizon: '#D97B48',
      groundPrimary: '#1E232D',
      groundSecondary: '#101319',
      structurePrimary: '#94A3B8',
      structureSecondary: '#1E3A6E',
      accentGlow: '#F59E0B',
      foliageColor: '#2A4B3C',
    };
    heroKind = 'airliner';
    heroLabel = 'Wide-Body Jetliner';
    signageTexts = ['GATE B14', 'TERMINAL 2', 'RUNWAY 27L', 'TOWER CTRL', 'JET A-1'];
  } else if (/\b(city|street|urban|tokyo|neon|cyber|new york|london|building|alley|metropolis|night)\b/.test(lower)) {
    archetype = 'urban_city_canyon';
    groundType = 'wet_city_asphalt';
    sceneTitle = 'Luminous Metropolis Canyon';
    subtitle = 'Dense multi-story urban avenue with glowing neon signage, wet asphalt, and storefronts';
    reasoning = {
      whatItIs:
        'A dense urban streetscape defined by vertical architecture, illuminated windows, storefront signage, and atmospheric street reflections.',
      whereItShouldBe:
        'A high-density multi-story city street canyon lined with recessed window facades, awnings, glowing neon signboards, streetlamps, crosswalks, vehicles, and overhead cables.',
      mood: 'Electric nocturnal realism with warm interior window light contrasting against cool twilight asphalt reflections.',
      theme: 'Contemporary metropolitan architecture & nocturnal street culture.',
      particularRelevance:
        'Captures the vertical energy and layered visual rhythm of a living city block after dusk.',
    };
    palette = {
      skyTop: '#070D1D',
      skyHorizon: '#283E6B',
      groundPrimary: '#191D26',
      groundSecondary: '#0E1016',
      structurePrimary: '#3B4559',
      structureSecondary: '#222836',
      accentGlow: '#FF9E44',
      foliageColor: '#1E4638',
    };
    heroKind = 'sports_car';
    heroLabel = 'Avenue Cruiser';
    signageTexts = ['METRO HOTEL', 'RAMEN ICHIBAN', 'CAFE NOIR', 'STUDIO 88', 'ARCADE'];
  }

  const terrainProfile = buildDefaultTerrainProfile(archetype, palette, seed);
  const elements = populateDetailedElementsForArchetype(
    archetype,
    palette,
    signageTexts,
    seed,
    terrainProfile
  );

  const heroY = sampleTerrainHeightWithProfile(0, -4.5, seed, terrainProfile);

  const heroSubject: HeroSubjectSpec = {
    kind: heroKind,
    label: heroLabel,
    primaryColor:
      heroKind === 'airliner'
        ? '#E8EEF5'
        : heroKind === 'botanical_bloom'
          ? '#E11D48'
          : heroKind === 'cat_creature'
            ? '#E07A3C'
            : heroKind === 'mountain_cairn'
              ? terrainProfile.rockColor
              : palette.accentGlow,
    secondaryColor:
      heroKind === 'airliner'
        ? '#1E3A6E'
        : heroKind === 'botanical_bloom'
          ? '#2E6B3E'
          : heroKind === 'cat_creature'
            ? '#F8F1E9'
            : palette.structureSecondary,
    accentColor: palette.accentGlow,
    scale: 1,
    position:
      heroKind === 'airliner'
        ? [0, 0, -9]
        : heroKind === 'sports_car'
          ? [0, 0, -5]
          : [0, heroY, -4.5],
    rotationY: heroKind === 'airliner' ? 0.35 : 0.2,
    details: [reasoning.whatItIs, reasoning.whereItShouldBe],
  };

  const spawnY = sampleTerrainHeightWithProfile(0, 16, seed, terrainProfile) + 2.2;
  const portalY = sampleTerrainHeightWithProfile(-6.2, 11.5, seed, terrainProfile) + 3.0;

  const blueprint: WorldBlueprint = {
    sceneTitle,
    subtitle,
    generatedBy: 'local-vision-fallback',
    reasoning,
    archetype,
    groundType,
    worldRadius: archetype === 'grand_mountain_range' ? 240 : 56,
    hasWater: terrainProfile.hasRiver,
    waterLevel: terrainProfile.hasRiver ? -1.4 : null,
    terrainRelief: terrainProfile.baseAmplitude,
    terrainProfile,
    palette,
    signageTexts,
    heroSubject,
    elements,
    cameraSpawn: [0, spawnY, 16],
    portalPosition: [-6.2, portalY, 11.5],
    storyHotspots: [
      {
        id: 'spot-1',
        title: heroLabel,
        category: 'What It Is',
        description: reasoning.whatItIs,
        position: [0, heroY + 3.2, -4.5],
      },
      {
        id: 'spot-2',
        title: sceneTitle,
        category: 'Where It Belongs',
        description: reasoning.whereItShouldBe,
        position: [8, sampleTerrainHeightWithProfile(8, -10, seed, terrainProfile) + 3.2, -10],
      },
      {
        id: 'spot-3',
        title: 'Cultural & Geological Context',
        category: 'Particular Relevance',
        description: reasoning.particularRelevance,
        position: [-8, sampleTerrainHeightWithProfile(-8, -10, seed, terrainProfile) + 3.2, -10],
      },
    ],
    seed,
  };

  const recommendedEnv: EnvironmentSettings = {
    ...DEFAULT_ENVIRONMENT,
    timeOfDay: archetype === 'urban_city_canyon' ? 21.5 : 17.4,
    sunIntensity: archetype === 'urban_city_canyon' ? 0.7 : 1.65,
    fogDensity: archetype === 'grand_mountain_range' ? 0.12 : 0.24,
    weather: 'clear',
    windSpeed: 0.55,
    fireflies: archetype === 'grand_mountain_range' ? 0.15 : 0.45,
    dreamDust: 0.25,
    artStyle: 'cinematic',
    bloomIntensity: 0.82,
    swirlingSky: false,
    skyTopOverride: palette.skyTop,
    skyHorizonOverride: palette.skyHorizon,
  };

  return { blueprint, recommendedEnv };
}

/**
 * Primary entry point: sends the uploaded image to Vite's `/api/analyze-image` endpoint
 * which runs `/Applications/Gemini.app/Contents/Helpers/agy --model gemini-4-neon-high`.
 */
export async function analyzeImageWithAgy(
  image: UploadedImage,
  userHint?: string
): Promise<{ blueprint: WorldBlueprint; recommendedEnv: EnvironmentSettings }> {
  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: image.dataUrl,
        filename: image.filename,
        userHint,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend status ${res.status}`);
    }

    const payload = await res.json();
    if (!payload.ok || !payload.data) {
      throw new Error(payload.error || 'Invalid agy response');
    }

    const d = payload.data;
    const seed = hashSeed((d.sceneTitle || image.filename) + (d.reasoning?.whatItIs || ''));
    const archetype: WorldArchetype = d.archetype || 'courtyard_garden';
    const groundType: WorldBlueprint['groundType'] =
      archetype === 'grand_mountain_range'
        ? 'sculpted_valley'
        : d.groundType || 'cobblestone_courtyard';

    const palette: WorldPalette = {
      skyTop: d.palette?.skyTop || '#0E1938',
      skyHorizon: d.palette?.skyHorizon || '#D88B56',
      groundPrimary: d.palette?.groundPrimary || '#2B2E38',
      groundSecondary: d.palette?.groundSecondary || '#171920',
      structurePrimary: d.palette?.structurePrimary || '#7A8291',
      structureSecondary: d.palette?.structureSecondary || '#394152',
      accentGlow: d.palette?.accentGlow || '#F59E0B',
      foliageColor: d.palette?.foliageColor || '#264E3A',
    };

    const defaultProfile = buildDefaultTerrainProfile(archetype, palette, seed);
    const tp = d.terrainProfile || {};

    const rawPeaks: TerrainPeak[] =
      Array.isArray(tp.distantPeaks) && tp.distantPeaks.length > 0
        ? tp.distantPeaks.map((p: Record<string, unknown>, idx: number) => ({
            x: Number.isFinite(Number(p.x)) ? Number(p.x) : (idx - 1.5) * 110,
            z: Number.isFinite(Number(p.z)) ? Math.min(-95, Number(p.z)) : -180 - idx * 35,
            height: Number.isFinite(Number(p.height)) ? Math.max(40, Number(p.height)) : 165,
            radius: Number.isFinite(Number(p.radius)) ? Math.max(60, Number(p.radius)) : 135,
            sharpness: Number.isFinite(Number(p.sharpness)) ? Number(p.sharpness) : 1.9,
            ridgeAngle: Number.isFinite(Number(p.ridgeAngle)) ? Number(p.ridgeAngle) : 0.3,
            snowLine: Number.isFinite(Number(p.snowLine)) ? Number(p.snowLine) : 0.55,
          }))
        : defaultProfile.distantPeaks;

    const terrainProfile: TerrainProfile = {
      terrainSize:
        archetype === 'grand_mountain_range'
          ? Math.max(850, Number(tp.terrainSize) || 960)
          : Number(tp.terrainSize) || defaultProfile.terrainSize,
      shape: tp.shape || defaultProfile.shape,
      baseAmplitude: Number.isFinite(Number(tp.baseAmplitude))
        ? Number(tp.baseAmplitude)
        : defaultProfile.baseAmplitude,
      baseFrequency: Number.isFinite(Number(tp.baseFrequency))
        ? Number(tp.baseFrequency)
        : defaultProfile.baseFrequency,
      ridgeSharpness: Number.isFinite(Number(tp.ridgeSharpness))
        ? Number(tp.ridgeSharpness)
        : defaultProfile.ridgeSharpness,
      valleyDirectionAngle: Number.isFinite(Number(tp.valleyDirectionAngle))
        ? Number(tp.valleyDirectionAngle)
        : defaultProfile.valleyDirectionAngle,
      warpStrength: Number.isFinite(Number(tp.warpStrength))
        ? Number(tp.warpStrength)
        : defaultProfile.warpStrength,
      hasRiver: Boolean(tp.hasRiver),
      riverAngle: Number.isFinite(Number(tp.riverAngle)) ? Number(tp.riverAngle) : defaultProfile.riverAngle,
      hasHouses: Boolean(tp.hasHouses),
      hasBridge: Boolean(tp.hasBridge),
      snowColor: tp.snowColor || defaultProfile.snowColor,
      rockColor: tp.rockColor || defaultProfile.rockColor,
      meadowColor: tp.meadowColor || defaultProfile.meadowColor,
      distantPeaks: rawPeaks,
    };

    const signageTexts: string[] =
      Array.isArray(d.signageTexts) && d.signageTexts.length > 0
        ? d.signageTexts.map(String)
        : ['FRAMEBREAK', d.sceneTitle || 'SANCTUARY', 'PLAZA', 'SECTOR 1', 'ATELIER'];

    const elements = populateDetailedElementsForArchetype(
      archetype,
      palette,
      signageTexts,
      seed,
      terrainProfile
    );

    const heroKind: HeroSubjectSpec['kind'] =
      archetype === 'grand_mountain_range' && !d.heroSubject?.kind
        ? 'mountain_cairn'
        : d.heroSubject?.kind || 'botanical_bloom';

    const heroZ = heroKind === 'airliner' ? -9 : heroKind === 'sports_car' ? -5 : -4.5;
    const heroY = sampleTerrainHeightWithProfile(0, heroZ, seed, terrainProfile);

    const heroSubject: HeroSubjectSpec = {
      kind: heroKind,
      label: d.heroSubject?.label || d.sceneTitle || 'Focal Subject',
      primaryColor: d.heroSubject?.primaryColor || palette.accentGlow,
      secondaryColor: d.heroSubject?.secondaryColor || palette.structurePrimary,
      accentColor: d.heroSubject?.accentColor || palette.accentGlow,
      scale: Number(d.heroSubject?.scale) || 1,
      position: [0, heroY, heroZ],
      rotationY: heroKind === 'airliner' ? 0.35 : 0.2,
      details: Array.isArray(d.heroSubject?.details)
        ? d.heroSubject.details.map(String)
        : [d.reasoning?.whatItIs || ''],
    };

    const reasoning: FiveQuestionsReasoning = {
      whatItIs: d.reasoning?.whatItIs || 'Focal subject identified from the uploaded photograph.',
      whereItShouldBe:
        d.reasoning?.whereItShouldBe ||
        'Bespoke open-air 3D environment constructed around the subject.',
      mood: d.reasoning?.mood || 'Atmospheric directional illumination.',
      theme: d.reasoning?.theme || 'Detailed architectural and environmental synthesis.',
      particularRelevance:
        d.reasoning?.particularRelevance ||
        'Contextual world expansion connecting the subject to its surroundings.',
    };

    const rawHotspots: Array<{ title?: string; category?: string; description?: string }> =
      Array.isArray(d.storyHotspots) ? d.storyHotspots : [];

    const storyHotspots = [
      {
        id: 'spot-1',
        title: rawHotspots[0]?.title || heroSubject.label,
        category: rawHotspots[0]?.category || 'What It Is',
        description: rawHotspots[0]?.description || reasoning.whatItIs,
        position: [0, heroY + 3.2, -4.5] as [number, number, number],
      },
      {
        id: 'spot-2',
        title: rawHotspots[1]?.title || (d.sceneTitle ?? 'Spatial Setting'),
        category: rawHotspots[1]?.category || 'Where It Belongs',
        description: rawHotspots[1]?.description || reasoning.whereItShouldBe,
        position: [
          8.5,
          sampleTerrainHeightWithProfile(8.5, -10.5, seed, terrainProfile) + 3.2,
          -10.5,
        ] as [number, number, number],
      },
      {
        id: 'spot-3',
        title: rawHotspots[2]?.title || 'Theme & Relevance',
        category: rawHotspots[2]?.category || 'Particular Relevance',
        description: rawHotspots[2]?.description || reasoning.particularRelevance,
        position: [
          -8.5,
          sampleTerrainHeightWithProfile(-8.5, -10.5, seed, terrainProfile) + 3.2,
          -10.5,
        ] as [number, number, number],
      },
    ];

    const spawnY = sampleTerrainHeightWithProfile(0, 16, seed, terrainProfile) + 2.2;
    const portalY = sampleTerrainHeightWithProfile(-6.2, 11.5, seed, terrainProfile) + 3.0;
    const hasWater =
      archetype === 'harbor_waterfront' ||
      groundType === 'timber_pier_water' ||
      terrainProfile.hasRiver;

    const blueprint: WorldBlueprint = {
      sceneTitle: d.sceneTitle || 'Bespoke 3D World',
      subtitle: d.subtitle || reasoning.whereItShouldBe,
      generatedBy: 'agy-gemini-4-neon-high',
      reasoning,
      archetype,
      groundType,
      worldRadius: archetype === 'grand_mountain_range' ? 240 : 56,
      hasWater,
      waterLevel:
        archetype === 'harbor_waterfront'
          ? -0.35
          : terrainProfile.hasRiver
            ? -1.4
            : null,
      terrainRelief: terrainProfile.baseAmplitude,
      terrainProfile,
      palette,
      signageTexts,
      heroSubject,
      elements,
      customThreeJsCode: typeof d.customThreeJsCode === 'string' ? d.customThreeJsCode : undefined,
      cameraSpawn: [0, spawnY, 16],
      portalPosition: [-6.2, portalY, 11.5],
      storyHotspots,
      seed,
    };

    const recommendedEnv: EnvironmentSettings = {
      ...DEFAULT_ENVIRONMENT,
      timeOfDay: Number.isFinite(Number(d.environment?.timeOfDay))
        ? Number(d.environment.timeOfDay)
        : 17.5,
      sunIntensity: Number.isFinite(Number(d.environment?.sunIntensity))
        ? Number(d.environment.sunIntensity)
        : 1.6,
      fogDensity:
        archetype === 'grand_mountain_range'
          ? Math.min(0.14, Number(d.environment?.fogDensity) || 0.12)
          : Number.isFinite(Number(d.environment?.fogDensity))
            ? Number(d.environment.fogDensity)
            : 0.24,
      weather: d.environment?.weather || 'clear',
      windSpeed: Number.isFinite(Number(d.environment?.windSpeed))
        ? Number(d.environment.windSpeed)
        : 0.55,
      fireflies: Number.isFinite(Number(d.environment?.fireflies))
        ? Number(d.environment.fireflies)
        : 0.25,
      dreamDust: Number.isFinite(Number(d.environment?.dreamDust))
        ? Number(d.environment.dreamDust)
        : 0.25,
      artStyle: d.environment?.artStyle || 'cinematic',
      bloomIntensity: Number.isFinite(Number(d.environment?.bloomIntensity))
        ? Number(d.environment.bloomIntensity)
        : 0.78,
      swirlingSky: Boolean(d.environment?.swirlingSky),
      skyTopOverride: palette.skyTop,
      skyHorizonOverride: palette.skyHorizon,
    };

    return { blueprint, recommendedEnv };
  } catch {
    return buildLocalFallbackBlueprint(image.filename, image.demoId, userHint);
  }
}
