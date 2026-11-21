import {
  DirectorCommand,
  EnvironmentSettings,
  PlaceableCategory,
  SceneObject,
  WeatherType,
} from '../types/world';

export interface DirectorResult {
  commands: DirectorCommand[];
  summary: string;
  envPatch: Partial<EnvironmentSettings>;
  spawnedObjects: Omit<SceneObject, 'id' | 'createdAt'>[];
  resetRequested: boolean;
}

/**
 * Parses natural-language creative direction into validated, typed 3D scene commands.
 * Runs 100% locally with zero API keys required.
 */
export function parseDirectorPrompt(
  rawPrompt: string,
  playerPos: [number, number, number] = [0, 3, 18],
  playerYaw = 0
): DirectorResult {
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  const commands: DirectorCommand[] = [];
  const envPatch: Partial<EnvironmentSettings> = {};
  const spawnedObjects: Omit<SceneObject, 'id' | 'createdAt'>[] = [];
  let resetRequested = false;

  if (!lower) {
    return {
      commands: [],
      summary: 'Enter a direction such as "golden sunset with fireflies" or "rainy night".',
      envPatch,
      spawnedObjects,
      resetRequested,
    };
  }

  // Reset
  if (/\b(reset|original|restore|default)\b/.test(lower)) {
    resetRequested = true;
    commands.push({
      type: 'resetEnvironment',
      payload: {},
      description: 'Restore original world atmosphere',
    });
  }

  // Time of Day & Lighting
  if (/\b(sunset|golden\s*hour|dusk|twilight|amber\s*sky)\b/.test(lower)) {
    envPatch.timeOfDay = 18.25;
    envPatch.sunIntensity = 1.85;
    envPatch.skyTopOverride = '#1B254B';
    envPatch.skyHorizonOverride = '#F3984A';
    envPatch.bloomIntensity = 0.9;
    commands.push({
      type: 'setTimeOfDay',
      payload: { hour: 18.25, label: 'Golden Sunset' },
      description: 'Shift sun to golden sunset horizon',
    });
  } else if (/\b(sunrise|dawn|morning)\b/.test(lower)) {
    envPatch.timeOfDay = 6.5;
    envPatch.sunIntensity = 1.55;
    envPatch.skyTopOverride = '#233663';
    envPatch.skyHorizonOverride = '#F4B084';
    commands.push({
      type: 'setTimeOfDay',
      payload: { hour: 6.5, label: 'Early Dawn' },
      description: 'Transition sky to early morning dawn',
    });
  } else if (/\b(midnight|night|nocturnal|starry|moonlit|dark)\b/.test(lower)) {
    envPatch.timeOfDay = 23.2;
    envPatch.sunIntensity = 0.4;
    envPatch.skyTopOverride = '#050916';
    envPatch.skyHorizonOverride = '#16284F';
    envPatch.bloomIntensity = 1.05;
    commands.push({
      type: 'setTimeOfDay',
      payload: { hour: 23.2, label: 'Midnight' },
      description: 'Set nocturnal starlit sky and moonlight',
    });
  } else if (/\b(noon|midday|daylight|sunny|bright\s*day)\b/.test(lower)) {
    envPatch.timeOfDay = 13.0;
    envPatch.sunIntensity = 2.0;
    envPatch.skyTopOverride = '#2A63B8';
    envPatch.skyHorizonOverride = '#A8D0F5';
    commands.push({
      type: 'setTimeOfDay',
      payload: { hour: 13.0, label: 'Midday' },
      description: 'Illuminate world with bright midday sunlight',
    });
  }

  // Weather
  const setWeather = (weather: WeatherType, fog: number, wind: number, desc: string) => {
    envPatch.weather = weather;
    envPatch.fogDensity = fog;
    envPatch.windSpeed = wind;
    commands.push({
      type: 'setWeather',
      payload: { weather, fogDensity: fog, windSpeed: wind },
      description: desc,
    });
  };

  if (/\b(storm|thunder|tempest|lightning)\b/.test(lower)) {
    setWeather('storm', 0.65, 1.85, 'Summon dramatic storm with heavy rain and wind');
    if (envPatch.sunIntensity === undefined) envPatch.sunIntensity = 0.45;
  } else if (/\b(rain|rainy|drizzle|shower|wet)\b/.test(lower)) {
    setWeather('rain', 0.52, 1.25, 'Enable rainfall and misty atmosphere');
  } else if (/\b(snow|snowy|blizzard|winter|frost)\b/.test(lower)) {
    setWeather('snow', 0.46, 0.9, 'Activate falling snow and crisp winter haze');
  } else if (/\b(fog|foggy|mist|misty|haze|ethereal)\b/.test(lower)) {
    setWeather('mist', 0.68, 0.45, 'Deepen atmospheric mist and distance fog');
  } else if (/\b(clear\s*sky|clear\s*weather|stop\s*rain|no\s*rain)\b/.test(lower)) {
    setWeather('clear', 0.2, 0.4, 'Clear weather precipitation');
  }

  // Art Style / Mood
  if (/\b(dream|dreamy|dreamscape|surreal|fantasy|magical|enchanted|ethereal|aurora)\b/.test(lower)) {
    envPatch.artStyle = 'dreamscape';
    envPatch.dreamDust = 0.95;
    envPatch.fireflies = Math.max(envPatch.fireflies ?? 0, 0.85);
    envPatch.bloomIntensity = 1.25;
    if (!envPatch.skyTopOverride) envPatch.skyTopOverride = '#1D143B';
    if (!envPatch.skyHorizonOverride) envPatch.skyHorizonOverride = '#B072FF';
    commands.push({
      type: 'setArtStyle',
      payload: { artStyle: 'dreamscape', dreamDust: 0.95 },
      description: 'Apply dreamscape palette, bloom, and luminous dust',
    });
  } else if (/\b(van\s*gogh|starry|swirl|painterly|painting)\b/.test(lower)) {
    envPatch.artStyle = 'starry';
    envPatch.bloomIntensity = 1.05;
    commands.push({
      type: 'setArtStyle',
      payload: { artStyle: 'starry' },
      description: 'Activate swirling painterly sky shader',
    });
  } else if (/\b(cinematic|dramatic|film|moody)\b/.test(lower)) {
    envPatch.artStyle = 'cinematic';
    envPatch.bloomIntensity = 0.9;
    envPatch.fogDensity = Math.max(envPatch.fogDensity ?? 0, 0.36);
    commands.push({
      type: 'setArtStyle',
      payload: { artStyle: 'cinematic' },
      description: 'Enhance cinematic lighting contrast and haze',
    });
  }

  // Particles
  if (/\b(firefl\w*|glowing\s*particles?|sparks|glowing\s*orbs|luminous)\b/.test(lower)) {
    envPatch.fireflies = 1.0;
    envPatch.bloomIntensity = Math.max(envPatch.bloomIntensity ?? 0.7, 1.1);
    commands.push({
      type: 'createParticleEffect',
      payload: { effect: 'fireflies', intensity: 1.0 },
      description: 'Release glowing firefly swarm',
    });
  }

  // Object Spawning in front of camera
  const spawnFront = (category: PlaceableCategory, count: number, spread: number, label: string) => {
    const forwardX = -Math.sin(playerYaw);
    const forwardZ = -Math.cos(playerYaw);
    const rightX = Math.cos(playerYaw);
    const rightZ = -Math.sin(playerYaw);

    for (let i = 0; i < count; i++) {
      const dist = 7 + i * 3.4;
      const side = (i - (count - 1) / 2) * spread;
      const x = playerPos[0] + forwardX * dist + rightX * side;
      const z = playerPos[2] + forwardZ * dist + rightZ * side;
      const y = Math.max(0, playerPos[1] - 1.8);
      spawnedObjects.push({
        category,
        position: [x, y, z],
        rotation: [0, playerYaw + i * 0.6, 0],
        scale: 0.95 + (i % 3) * 0.15,
        source: 'director',
      });
    }
    commands.push({
      type: 'spawnObject',
      payload: { category, count },
      description: `Place ${count} ${label} ahead of camera`,
    });
  };

  if (/\b(lanterns?|floating\s*lanterns?|lamps?)\b/.test(lower)) {
    spawnFront('lantern', 4, 2.8, 'glowing lanterns');
  }
  if (/\b(trees?|forest|pines?|cypress\w*|woods)\b/.test(lower)) {
    const cat: PlaceableCategory = /\bcypress/.test(lower) ? 'cypress_tree' : 'pine_tree';
    spawnFront(cat, 5, 3.8, cat === 'cypress_tree' ? 'cypress trees' : 'pine trees');
  }
  if (/\b(portals?|arch\w*|gateways?|doorways?)\b/.test(lower)) {
    spawnFront('portal_arch', 1, 0, 'ancient portal arch');
  }
  if (/\b(crystals?|monoliths?|obelisks?|sculptures?)\b/.test(lower)) {
    spawnFront('crystal_monolith', 2, 4.0, 'luminous crystal monoliths');
  }
  if (/\b(campfires?|fires?|bonfires?)\b/.test(lower)) {
    spawnFront('campfire', 1, 0, 'warm campfire');
  }
  if (/\b(bench\w*|seats?)\b/.test(lower)) {
    spawnFront('stone_bench', 1, 0, 'stone bench');
  }
  if (/\b(rocks?|boulders?|stones?)\b/.test(lower) && !/\b(bench|arch)/.test(lower)) {
    spawnFront('rock_cluster', 3, 3.2, 'mossy rock clusters');
  }

  if (commands.length === 0) {
    // Graceful atmospheric fallback when user enters poetic/freeform text
    envPatch.dreamDust = 0.7;
    envPatch.fireflies = 0.65;
    envPatch.bloomIntensity = 0.95;
    commands.push({
      type: 'createParticleEffect',
      payload: { effect: 'atmosphere', prompt },
      description: 'Infused subtle atmospheric particles and luminous bloom',
    });
  }

  return {
    commands,
    summary: commands.map((c) => c.description).join(' · '),
    envPatch,
    spawnedObjects,
    resetRequested,
  };
}
