import { create } from 'zustand';
import {
  ActiveTool,
  AppStage,
  CameraState,
  DirectorLogEntry,
  EnvironmentSettings,
  MemoryAnchor,
  MovementMode,
  PhotoCalibration,
  PlaceableCategory,
  ProgressStep,
  QualityPreset,
  SceneObject,
  UploadedImage,
  WorldBlueprint,
  WorldProject,
} from '../types/world';

export const DEFAULT_ENVIRONMENT: EnvironmentSettings = {
  timeOfDay: 17.8,
  sunIntensity: 1.5,
  fogDensity: 0.24,
  weather: 'clear',
  windSpeed: 0.5,
  fireflies: 0.35,
  dreamDust: 0.25,
  ambientVolume: 0.45,
  ambientMuted: false,
  artStyle: 'cinematic',
  bloomIntensity: 0.8,
  swirlingSky: false,
};

export const DEFAULT_CAMERA: CameraState = {
  position: [0, 2.2, 16],
  yaw: 0,
  pitch: -0.03,
  fov: 66,
  speed: 9,
  sensitivity: 1.0,
  invertY: false,
  headBob: true,
  reducedMotion: false,
};

export const ENVIRONMENT_PRESETS: Record<string, Partial<EnvironmentSettings>> = {
  golden: {
    timeOfDay: 18.2,
    sunIntensity: 1.85,
    fogDensity: 0.25,
    weather: 'clear',
    fireflies: 0.45,
    dreamDust: 0.25,
    artStyle: 'golden',
    bloomIntensity: 0.9,
    swirlingSky: false,
    skyTopOverride: '#1B2848',
    skyHorizonOverride: '#F29B4B',
  },
  midnight: {
    timeOfDay: 23.2,
    sunIntensity: 0.4,
    fogDensity: 0.3,
    weather: 'clear',
    fireflies: 0.85,
    dreamDust: 0.35,
    artStyle: 'midnight',
    bloomIntensity: 1.05,
    swirlingSky: false,
    skyTopOverride: '#050814',
    skyHorizonOverride: '#162447',
  },
  dreamscape: {
    timeOfDay: 20.4,
    sunIntensity: 1.05,
    fogDensity: 0.36,
    weather: 'mist',
    fireflies: 0.9,
    dreamDust: 0.95,
    artStyle: 'dreamscape',
    bloomIntensity: 1.2,
    swirlingSky: true,
    skyTopOverride: '#1E1538',
    skyHorizonOverride: '#B67CFF',
  },
  rainy: {
    timeOfDay: 16.0,
    sunIntensity: 0.55,
    fogDensity: 0.52,
    weather: 'rain',
    windSpeed: 1.35,
    fireflies: 0.05,
    dreamDust: 0.1,
    artStyle: 'cinematic',
    bloomIntensity: 0.65,
    swirlingSky: false,
    skyTopOverride: '#131A26',
    skyHorizonOverride: '#364459',
  },
  cinematic: {
    timeOfDay: 19.0,
    sunIntensity: 1.3,
    fogDensity: 0.32,
    weather: 'mist',
    fireflies: 0.4,
    dreamDust: 0.3,
    artStyle: 'cinematic',
    bloomIntensity: 0.9,
    swirlingSky: false,
    skyTopOverride: '#0E1728',
    skyHorizonOverride: '#D17A54',
  },
  original: {
    skyTopOverride: undefined,
    skyHorizonOverride: undefined,
    artStyle: 'original',
    weather: 'clear',
    fogDensity: 0.24,
    bloomIntensity: 0.8,
  },
};

interface WorldStoreState {
  stage: AppStage;
  projectId: string;
  projectName: string;
  uploadedImage: UploadedImage | null;
  blueprint: WorldBlueprint | null;
  baseEnvironment: EnvironmentSettings;
  environment: EnvironmentSettings;
  camera: CameraState;
  movementMode: MovementMode;
  pointerLocked: boolean;
  quality: QualityPreset;
  hudVisible: boolean;
  showOnboarding: boolean;
  showMinimap: boolean;
  activeTool: ActiveTool;
  selectedPlaceable: PlaceableCategory;
  selectedObjectId: string | null;
  objects: SceneObject[];
  undoStack: SceneObject[][];
  redoStack: SceneObject[][];
  memories: MemoryAnchor[];
  activeMemoryId: string | null;
  calibration: PhotoCalibration;
  progressSteps: ProgressStep[];
  directorHistory: DirectorLogEntry[];
  savedProjects: WorldProject[];
  statusToast: string | null;
  resetCameraNonce: number;
  returnToFrameNonce: number;
  screenshotNonce: number;
  errorMessage: string | null;

  playerPosition: [number, number, number];
  playerYaw: number;

  setStage: (stage: AppStage) => void;
  setUploadedImage: (img: UploadedImage | null) => void;
  setBlueprint: (bp: WorldBlueprint | null) => void;
  setBaseEnvironment: (env: EnvironmentSettings) => void;
  updateEnvironment: (partial: Partial<EnvironmentSettings>) => void;
  applyEnvironmentPreset: (presetKey: string) => void;
  resetEnvironment: () => void;
  updateCamera: (partial: Partial<CameraState>) => void;
  setMovementMode: (mode: MovementMode) => void;
  toggleMovementMode: () => void;
  setPointerLocked: (locked: boolean) => void;
  setQuality: (q: QualityPreset) => void;
  toggleHud: () => void;
  setShowOnboarding: (show: boolean) => void;
  toggleMinimap: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSelectedPlaceable: (cat: PlaceableCategory) => void;
  setSelectedObjectId: (id: string | null) => void;
  addObject: (obj: Omit<SceneObject, 'id' | 'createdAt'>) => void;
  removeObject: (id: string) => void;
  undoObjects: () => void;
  redoObjects: () => void;
  addMemory: (mem: Omit<MemoryAnchor, 'id' | 'createdAt'>) => void;
  removeMemory: (id: string) => void;
  setActiveMemoryId: (id: string | null) => void;
  updateCalibration: (partial: Partial<PhotoCalibration>) => void;
  setProgressSteps: (steps: ProgressStep[]) => void;
  updateProgressStep: (id: string, status: ProgressStep['status'], detail?: string) => void;
  addDirectorLog: (entry: DirectorLogEntry) => void;
  setSavedProjects: (projects: WorldProject[]) => void;
  showToast: (msg: string) => void;
  triggerCameraReset: () => void;
  triggerReturnToFrame: () => void;
  triggerScreenshot: () => void;
  setErrorMessage: (msg: string | null) => void;
  setPlayerTelemetry: (pos: [number, number, number], yaw: number) => void;
  setProjectName: (name: string) => void;
  loadSavedProject: (project: WorldProject) => void;
  exportCurrentProject: () => WorldProject | null;
  resetAll: () => void;
}

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  stage: 'landing',
  projectId: crypto.randomUUID(),
  projectName: 'Untitled World',
  uploadedImage: null,
  blueprint: null,
  baseEnvironment: { ...DEFAULT_ENVIRONMENT },
  environment: { ...DEFAULT_ENVIRONMENT },
  camera: { ...DEFAULT_CAMERA },
  movementMode: 'walk',
  pointerLocked: false,
  quality: 'high',
  hudVisible: true,
  showOnboarding: true,
  showMinimap: true,
  activeTool: 'explore',
  selectedPlaceable: 'lantern',
  selectedObjectId: null,
  objects: [],
  undoStack: [],
  redoStack: [],
  memories: [],
  activeMemoryId: null,
  calibration: {
    enabled: false,
    opacity: 0.45,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  },
  progressSteps: [],
  directorHistory: [],
  savedProjects: [],
  statusToast: null,
  resetCameraNonce: 0,
  returnToFrameNonce: 0,
  screenshotNonce: 0,
  errorMessage: null,
  playerPosition: [0, 2.2, 16],
  playerYaw: 0,

  setStage: (stage) => set({ stage }),

  setUploadedImage: (img) =>
    set(() => ({
      uploadedImage: img,
      projectId: crypto.randomUUID(),
      projectName: img ? img.filename.replace(/\.[^.]+$/, '') : 'Untitled World',
      blueprint: null,
      objects: [],
      undoStack: [],
      redoStack: [],
      memories: [],
      directorHistory: [],
      errorMessage: null,
    })),

  setBlueprint: (blueprint) =>
    set((s) => ({
      blueprint,
      projectName: blueprint?.sceneTitle || s.projectName,
    })),

  setBaseEnvironment: (env) =>
    set({
      baseEnvironment: { ...env },
      environment: { ...env },
    }),

  updateEnvironment: (partial) =>
    set((s) => ({
      environment: { ...s.environment, ...partial },
    })),

  applyEnvironmentPreset: (presetKey) =>
    set((s) => {
      if (presetKey === 'original') {
        return { environment: { ...s.baseEnvironment } };
      }
      const preset = ENVIRONMENT_PRESETS[presetKey];
      if (!preset) return s;
      return { environment: { ...s.environment, ...preset } };
    }),

  resetEnvironment: () => set((s) => ({ environment: { ...s.baseEnvironment } })),

  updateCamera: (partial) =>
    set((s) => ({
      camera: { ...s.camera, ...partial },
    })),

  setMovementMode: (movementMode) => set({ movementMode }),
  toggleMovementMode: () =>
    set((s) => ({
      movementMode: s.movementMode === 'walk' ? 'fly' : 'walk',
    })),

  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setQuality: (quality) => set({ quality }),
  toggleHud: () => set((s) => ({ hudVisible: !s.hudVisible })),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedPlaceable: (selectedPlaceable) => set({ selectedPlaceable }),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),

  addObject: (obj) =>
    set((s) => {
      const next: SceneObject = {
        ...obj,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      return {
        undoStack: [...s.undoStack.slice(-24), s.objects],
        redoStack: [],
        objects: [...s.objects, next],
      };
    }),

  removeObject: (id) =>
    set((s) => ({
      undoStack: [...s.undoStack.slice(-24), s.objects],
      redoStack: [],
      objects: s.objects.filter((o) => o.id !== id),
      selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
    })),

  undoObjects: () =>
    set((s) => {
      if (s.undoStack.length === 0) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        objects: prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, s.objects],
      };
    }),

  redoObjects: () =>
    set((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        objects: next,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, s.objects],
      };
    }),

  addMemory: (mem) =>
    set((s) => ({
      memories: [
        ...s.memories,
        {
          ...mem,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        },
      ],
    })),

  removeMemory: (id) =>
    set((s) => ({
      memories: s.memories.filter((m) => m.id !== id),
      activeMemoryId: s.activeMemoryId === id ? null : s.activeMemoryId,
    })),

  setActiveMemoryId: (activeMemoryId) => set({ activeMemoryId }),
  updateCalibration: (partial) =>
    set((s) => ({
      calibration: { ...s.calibration, ...partial },
    })),

  setProgressSteps: (progressSteps) => set({ progressSteps }),
  updateProgressStep: (id, status, detail) =>
    set((s) => ({
      progressSteps: s.progressSteps.map((step) =>
        step.id === id ? { ...step, status, detail: detail ?? step.detail } : step
      ),
    })),

  addDirectorLog: (entry) =>
    set((s) => ({
      directorHistory: [entry, ...s.directorHistory.slice(0, 14)],
    })),

  setSavedProjects: (savedProjects) => set({ savedProjects }),

  showToast: (msg) => {
    set({ statusToast: msg });
    window.setTimeout(() => {
      if (get().statusToast === msg) {
        set({ statusToast: null });
      }
    }, 3200);
  },

  triggerCameraReset: () => set((s) => ({ resetCameraNonce: s.resetCameraNonce + 1 })),
  triggerReturnToFrame: () => set((s) => ({ returnToFrameNonce: s.returnToFrameNonce + 1 })),
  triggerScreenshot: () => set((s) => ({ screenshotNonce: s.screenshotNonce + 1 })),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setPlayerTelemetry: (playerPosition, playerYaw) => set({ playerPosition, playerYaw }),
  setProjectName: (projectName) => set({ projectName }),

  loadSavedProject: (project) =>
    set({
      projectId: project.id,
      projectName: project.name,
      uploadedImage: project.image,
      blueprint: project.blueprint,
      baseEnvironment: { ...project.environment },
      environment: { ...project.environment },
      camera: { ...project.camera },
      objects: project.objects ?? [],
      memories: project.memories ?? [],
      undoStack: [],
      redoStack: [],
      stage: 'exploring',
      showOnboarding: false,
      errorMessage: null,
    }),

  exportCurrentProject: () => {
    const s = get();
    if (!s.uploadedImage || !s.blueprint) return null;
    return {
      id: s.projectId,
      name: s.projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: s.uploadedImage,
      blueprint: s.blueprint,
      environment: s.environment,
      camera: {
        ...s.camera,
        position: s.playerPosition,
        yaw: s.playerYaw,
      },
      objects: s.objects,
      memories: s.memories,
    };
  },

  resetAll: () =>
    set({
      stage: 'landing',
      uploadedImage: null,
      blueprint: null,
      environment: { ...DEFAULT_ENVIRONMENT },
      baseEnvironment: { ...DEFAULT_ENVIRONMENT },
      camera: { ...DEFAULT_CAMERA },
      objects: [],
      memories: [],
      undoStack: [],
      redoStack: [],
      activeTool: 'explore',
      pointerLocked: false,
      errorMessage: null,
      calibration: {
        enabled: false,
        opacity: 0.45,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
      },
    }),
}));
