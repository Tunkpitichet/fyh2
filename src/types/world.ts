export type AppStage = 'landing' | 'preparing' | 'transitioning' | 'exploring';

export type MovementMode = 'walk' | 'fly';

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export type ActiveTool =
  | 'explore'
  | 'create'
  | 'environment'
  | 'discover'
  | 'capture'
  | 'settings';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'mist' | 'storm';

export type ArtStyleType =
  | 'original'
  | 'painterly'
  | 'starry'
  | 'dreamscape'
  | 'cinematic'
  | 'golden'
  | 'midnight';

export type WorldArchetype =
  | 'grand_mountain_range'
  | 'aviation_tarmac'
  | 'urban_city_canyon'
  | 'courtyard_garden'
  | 'harbor_waterfront'
  | 'sacred_monument'
  | 'highway_motorsport'
  | 'open_market_plaza'
  | 'alpine_painterly_valley';

export type GroundSurfaceType =
  | 'tarmac_runway'
  | 'wet_city_asphalt'
  | 'cobblestone_courtyard'
  | 'timber_pier_water'
  | 'flagstone_sanctuary'
  | 'sculpted_valley';

export type TerrainShapeType =
  | 'colossal_mountain_vista'
  | 'twin_peaks_gorge'
  | 'jagged_ridge_amphitheater'
  | 'rolling_meadow_hills'
  | 'arid_mesa_canyon'
  | 'coastal_cliff_bay'
  | 'flat_urban_pad';

export interface TerrainPeak {
  x: number;
  z: number;
  height: number;
  radius: number;
  sharpness: number;
  ridgeAngle: number;
  snowLine: number; // 0..1 fraction of height where snow starts (1.0 = no snow)
}

export interface TerrainProfile {
  terrainSize: number; // e.g. 960 for colossal mountains, 240 for compact spaces
  shape: TerrainShapeType;
  baseAmplitude: number;
  baseFrequency: number;
  ridgeSharpness: number; // 0..1
  valleyDirectionAngle: number; // radians
  warpStrength: number; // 0..45
  hasRiver: boolean;
  riverAngle: number;
  hasHouses: boolean;
  hasBridge: boolean;
  snowColor: string;
  rockColor: string;
  meadowColor: string;
  distantPeaks: TerrainPeak[];
}

export type DetailedElementKind =
  | 'airliner_jet'
  | 'control_tower'
  | 'boarding_stairs'
  | 'service_truck'
  | 'runway_light_array'
  | 'city_building_tower'
  | 'city_shopfront_block'
  | 'neon_sign_board'
  | 'streetlamp'
  | 'traffic_gantry'
  | 'parked_vehicle'
  | 'bus_shelter'
  | 'overhead_cables'
  | 'courtyard_arcade_wall'
  | 'stone_fountain'
  | 'cafe_terrace_table'
  | 'terracotta_planter'
  | 'string_light_span'
  | 'temple_pavilion'
  | 'stone_torii_arch'
  | 'stone_lantern'
  | 'arched_bridge'
  | 'harbor_lighthouse'
  | 'sailing_vessel'
  | 'pier_bollard_cluster'
  | 'timber_cottage'
  | 'cypress_tree'
  | 'pine_tree'
  | 'broadleaf_tree'
  | 'rock_outcrop';

export type HeroSubjectKind =
  | 'airliner'
  | 'botanical_bloom'
  | 'cat_creature'
  | 'dog_creature'
  | 'sports_car'
  | 'sailing_ship'
  | 'fountain_monument'
  | 'temple_shrine'
  | 'market_pavilion'
  | 'mountain_cairn'
  | 'custom_sculpture';

export type PlaceableCategory =
  | 'pine_tree'
  | 'cypress_tree'
  | 'lantern'
  | 'rock_cluster'
  | 'stone_bench'
  | 'crystal_monolith'
  | 'portal_arch'
  | 'campfire';

export interface UploadedImage {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  width: number;
  height: number;
  demoId?: string;
}

export interface FiveQuestionsReasoning {
  whatItIs: string;
  whereItShouldBe: string;
  mood: string;
  theme: string;
  particularRelevance: string;
}

export interface WorldPalette {
  skyTop: string;
  skyHorizon: string;
  groundPrimary: string;
  groundSecondary: string;
  structurePrimary: string;
  structureSecondary: string;
  accentGlow: string;
  foliageColor: string;
}

export interface HeroSubjectSpec {
  kind: HeroSubjectKind;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  scale: number;
  position: [number, number, number];
  rotationY: number;
  details: string[];
}

export interface DetailedSceneElement {
  id: string;
  kind: DetailedElementKind;
  label?: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  signText?: string;
  stories?: number;
  lit?: boolean;
}

export interface WorldBlueprint {
  sceneTitle: string;
  subtitle: string;
  generatedBy: 'agy-gemini-4-neon-high' | 'local-vision-fallback';
  reasoning: FiveQuestionsReasoning;
  archetype: WorldArchetype;
  groundType: GroundSurfaceType;
  worldRadius: number;
  hasWater: boolean;
  waterLevel: number | null;
  terrainRelief: number;
  terrainProfile: TerrainProfile;
  palette: WorldPalette;
  signageTexts: string[];
  heroSubject: HeroSubjectSpec;
  elements: DetailedSceneElement[];
  customThreeJsCode?: string;
  cameraSpawn: [number, number, number];
  portalPosition: [number, number, number];
  storyHotspots: {
    id: string;
    title: string;
    category: string;
    description: string;
    position: [number, number, number];
  }[];
  seed: number;
}

export interface SceneObject {
  id: string;
  category: PlaceableCategory;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color?: string;
  createdAt: number;
  source: 'user' | 'director';
}

export interface MemoryAnchor {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  createdAt: number;
}

export interface EnvironmentSettings {
  timeOfDay: number;
  sunIntensity: number;
  fogDensity: number;
  weather: WeatherType;
  windSpeed: number;
  fireflies: number;
  dreamDust: number;
  ambientVolume: number;
  ambientMuted: boolean;
  artStyle: ArtStyleType;
  bloomIntensity: number;
  swirlingSky: boolean;
  skyTopOverride?: string;
  skyHorizonOverride?: string;
}

export interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
  fov: number;
  speed: number;
  sensitivity: number;
  invertY: boolean;
  headBob: boolean;
  reducedMotion: boolean;
}

export interface PhotoCalibration {
  enabled: boolean;
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface DirectorCommand {
  type:
    | 'setTimeOfDay'
    | 'setWeather'
    | 'setFogDensity'
    | 'setLighting'
    | 'setSkyPalette'
    | 'setArtStyle'
    | 'createParticleEffect'
    | 'spawnObject'
    | 'setWind'
    | 'resetEnvironment';
  payload: Record<string, unknown>;
  description: string;
}

export interface DirectorLogEntry {
  id: string;
  prompt: string;
  summary: string;
  commands: DirectorCommand[];
  timestamp: number;
}

export interface WorldProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  image: UploadedImage;
  blueprint: WorldBlueprint;
  environment: EnvironmentSettings;
  camera: CameraState;
  objects: SceneObject[];
  memories: MemoryAnchor[];
}

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}
