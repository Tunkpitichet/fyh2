import { describe, expect, it } from 'vitest';
import { isSupportedImageFile } from '../services/exifService';
import {
  buildDefaultTerrainProfile,
  buildLocalFallbackBlueprint,
  populateDetailedElementsForArchetype,
} from '../services/imageAnalyzer';
import { parseDirectorPrompt } from '../services/worldDirector';
import { sampleTerrainHeightWithProfile } from '../engine/terrainMath';

describe('Image upload validation', () => {
  it('accepts standard image formats and rejects non-images', () => {
    const jpg = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    const png = new File(['abc'], 'art.png', { type: 'image/png' });
    const txt = new File(['abc'], 'notes.txt', { type: 'text/plain' });

    expect(isSupportedImageFile(jpg)).toBe(true);
    expect(isSupportedImageFile(png)).toBe(true);
    expect(isSupportedImageFile(txt)).toBe(false);
  });
});

describe('5-Question Reasoning & Bespoke 3D Space Synthesizer', () => {
  it('generates a colossal 960m mountain terrain with towering distant peaks and NO houses or river for mountain photos', () => {
    const { blueprint } = buildLocalFallbackBlueprint('matterhorn-alps-mountain-peak.jpg');
    expect(blueprint.archetype).toBe('grand_mountain_range');
    expect(blueprint.terrainProfile.terrainSize).toBeGreaterThanOrEqual(900);
    expect(blueprint.terrainProfile.distantPeaks.length).toBeGreaterThanOrEqual(4);
    expect(blueprint.terrainProfile.hasHouses).toBe(false);
    expect(blueprint.terrainProfile.hasRiver).toBe(false);
    expect(blueprint.hasWater).toBe(false);
    expect(blueprint.heroSubject.kind).toBe('mountain_cairn');
    // Verify ZERO cottages/houses/bridges were spawned
    expect(blueprint.elements.some((e) => e.kind === 'timber_cottage')).toBe(false);
    expect(blueprint.elements.some((e) => e.kind === 'arched_bridge')).toBe(false);

    // Verify the distant peak height is dramatically taller than the foreground spawn plateau
    const spawnHeight = sampleTerrainHeightWithProfile(0, 16, blueprint.seed, blueprint.terrainProfile);
    const peak0 = blueprint.terrainProfile.distantPeaks[0];
    const peakHeight = sampleTerrainHeightWithProfile(
      peak0.x,
      peak0.z,
      blueprint.seed,
      blueprint.terrainProfile
    );
    expect(peakHeight).toBeGreaterThan(spawnHeight + 70);
  });

  it('never generates the same terrain topography for two different scenic photographs', () => {
    const { blueprint: bp1 } = buildLocalFallbackBlueprint('alps-summit-dawn.jpg');
    const { blueprint: bp2 } = buildLocalFallbackBlueprint('dolomites-ridge-sunset.jpg');

    expect(bp1.terrainProfile.valleyDirectionAngle).not.toBe(
      bp2.terrainProfile.valleyDirectionAngle
    );
    expect(bp1.terrainProfile.distantPeaks[0].x).not.toBe(
      bp2.terrainProfile.distantPeaks[0].x
    );

    const h1 = sampleTerrainHeightWithProfile(45, -140, bp1.seed, bp1.terrainProfile);
    const h2 = sampleTerrainHeightWithProfile(45, -140, bp2.seed, bp2.terrainProfile);
    expect(h1).not.toBe(h2);
  });

  it('generates an aviation tarmac 3D space with an airliner hero when given an aircraft photo', () => {
    const { blueprint } = buildLocalFallbackBlueprint('boeing-787-twilight-apron.jpg');
    expect(blueprint.archetype).toBe('aviation_tarmac');
    expect(blueprint.groundType).toBe('tarmac_runway');
    expect(blueprint.heroSubject.kind).toBe('airliner');
    expect(blueprint.elements.some((e) => e.kind === 'control_tower')).toBe(true);
    expect(blueprint.elements.some((e) => e.kind === 'boarding_stairs')).toBe(true);
  });

  it('places a cat inside a detailed Mediterranean cobblestone courtyard garden rather than a cat-shaped terrain', () => {
    const { blueprint } = buildLocalFallbackBlueprint('ginger-tabby-cat-courtyard.jpg');
    expect(blueprint.archetype).toBe('courtyard_garden');
    expect(blueprint.groundType).toBe('cobblestone_courtyard');
    expect(blueprint.heroSubject.kind).toBe('cat_creature');
    expect(blueprint.elements.some((e) => e.kind === 'courtyard_arcade_wall')).toBe(true);
    expect(blueprint.elements.some((e) => e.kind === 'stone_fountain')).toBe(true);
  });

  it('never turns a flower or unnamed photo into a cat', () => {
    const { blueprint: flowerBp } = buildLocalFallbackBlueprint('pink-rose-flower.jpg');
    expect(flowerBp.heroSubject.kind).toBe('botanical_bloom');
    expect(flowerBp.heroSubject.kind).not.toBe('cat_creature');

    const { blueprint: unnamedBp } = buildLocalFallbackBlueprint('IMG_4821.jpg');
    expect(unnamedBp.heroSubject.kind).not.toBe('cat_creature');
  });

  it('populates distinct element sets for each archetype', () => {
    const palette = {
      skyTop: '#0E1938',
      skyHorizon: '#D88B56',
      groundPrimary: '#2B2E38',
      groundSecondary: '#171920',
      structurePrimary: '#7A8291',
      structureSecondary: '#394152',
      accentGlow: '#F59E0B',
      foliageColor: '#264E3A',
    };
    const mtnProf = buildDefaultTerrainProfile('grand_mountain_range', palette, 42);
    const avProf = buildDefaultTerrainProfile('aviation_tarmac', palette, 42);
    const mtn = populateDetailedElementsForArchetype('grand_mountain_range', palette, ['PEAK'], 42, mtnProf);
    const av = populateDetailedElementsForArchetype('aviation_tarmac', palette, ['GATE 1'], 42, avProf);

    expect(mtn[0].kind).not.toBe(av[0].kind);
    expect(mtn.some((e) => e.kind === 'timber_cottage')).toBe(false);
  });
});

describe('AI World Director natural language command engine', () => {
  it('parses weather, lighting, and object spawning commands accurately', () => {
    const res = parseDirectorPrompt(
      'Make the sky look like a dramatic golden sunset with fireflies and floating lanterns',
      [0, 3, 18],
      0
    );
    expect(res.envPatch.timeOfDay).toBeCloseTo(18.25, 1);
    expect(res.envPatch.fireflies).toBe(1.0);
    expect(res.spawnedObjects.length).toBe(4);
    expect(res.spawnedObjects[0].category).toBe('lantern');
  });

  it('handles rainy night and reset commands', () => {
    const rainRes = parseDirectorPrompt('Turn this into a rainy night');
    expect(rainRes.envPatch.weather).toBe('rain');
    expect(rainRes.envPatch.timeOfDay).toBeGreaterThan(22);

    const resetRes = parseDirectorPrompt('Reset to original atmosphere');
    expect(resetRes.resetRequested).toBe(true);
  });
});
