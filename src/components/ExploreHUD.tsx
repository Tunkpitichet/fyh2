import { useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  CloudRain,
  Compass,
  Eye,
  EyeOff,
  Feather,
  Footprints,
  Frame,
  Layers,
  LogOut,
  Maximize2,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Send,
  Settings,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useWorldStore } from '../store/useWorldStore';
import { ActiveTool, PlaceableCategory, QualityPreset, WeatherType } from '../types/world';
import { parseDirectorPrompt } from '../services/worldDirector';
import { listWorldProjects, saveWorldProject } from '../services/storageService';
import { audioService } from '../services/audioService';

const PLACEABLES: { id: PlaceableCategory; label: string }[] = [
  { id: 'lantern', label: 'Lantern' },
  { id: 'pine_tree', label: 'Pine Tree' },
  { id: 'cypress_tree', label: 'Cypress' },
  { id: 'campfire', label: 'Campfire' },
  { id: 'portal_arch', label: 'Stone Arch' },
  { id: 'crystal_monolith', label: 'Crystal' },
  { id: 'stone_bench', label: 'Bench' },
  { id: 'rock_cluster', label: 'Rocks' },
];

const QUICK_DIRECTIONS = [
  'Golden sunset with fireflies',
  'Rainy night',
  'Dreamy fantasy world',
  'Add floating lanterns',
  'Snowy midnight',
];

export function ExploreHUD() {
  const projectName = useWorldStore((s) => s.projectName);
  const uploadedImage = useWorldStore((s) => s.uploadedImage);
  const blueprint = useWorldStore((s) => s.blueprint);
  const env = useWorldStore((s) => s.environment);
  const cam = useWorldStore((s) => s.camera);
  const movementMode = useWorldStore((s) => s.movementMode);
  const pointerLocked = useWorldStore((s) => s.pointerLocked);
  const quality = useWorldStore((s) => s.quality);
  const hudVisible = useWorldStore((s) => s.hudVisible);
  const showOnboarding = useWorldStore((s) => s.showOnboarding);
  const showMinimap = useWorldStore((s) => s.showMinimap);
  const activeTool = useWorldStore((s) => s.activeTool);
  const selectedPlaceable = useWorldStore((s) => s.selectedPlaceable);
  const selectedObjectId = useWorldStore((s) => s.selectedObjectId);
  const objects = useWorldStore((s) => s.objects);
  const undoCount = useWorldStore((s) => s.undoStack.length);
  const redoCount = useWorldStore((s) => s.redoStack.length);
  const memories = useWorldStore((s) => s.memories);
  const calibration = useWorldStore((s) => s.calibration);
  const statusToast = useWorldStore((s) => s.statusToast);
  const playerPos = useWorldStore((s) => s.playerPosition);
  const playerYaw = useWorldStore((s) => s.playerYaw);

  const [directorInput, setDirectorInput] = useState('');
  const [memTitle, setMemTitle] = useState('');
  const [memDesc, setMemDesc] = useState('');

  const store = useWorldStore.getState();

  const requestPointerLock = () => {
    const canvas = document.querySelector('#framebreak-canvas canvas') as HTMLCanvasElement | null;
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
    audioService.start(env.ambientVolume, env.ambientMuted);
  };

  const handleDirectorSubmit = (promptText?: string) => {
    const text = (promptText ?? directorInput).trim();
    if (!text) return;

    const result = parseDirectorPrompt(text, playerPos, playerYaw);
    if (result.resetRequested) {
      store.resetEnvironment();
    } else if (Object.keys(result.envPatch).length > 0) {
      store.updateEnvironment(result.envPatch);
    }

    result.spawnedObjects.forEach((obj) => store.addObject(obj));
    store.addDirectorLog({
      id: crypto.randomUUID(),
      prompt: text,
      summary: result.summary,
      commands: result.commands,
      timestamp: Date.now(),
    });
    store.showToast(result.summary);
    setDirectorInput('');
  };

  const handleSaveProject = async () => {
    const proj = store.exportCurrentProject();
    if (!proj) return;
    try {
      await saveWorldProject(proj);
      const list = await listWorldProjects();
      store.setSavedProjects(list);
      store.showToast('World saved locally in browser storage');
    } catch {
      store.showToast('Could not save project to IndexedDB');
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle.trim()) return;
    const forwardX = -Math.sin(playerYaw);
    const forwardZ = -Math.cos(playerYaw);
    store.addMemory({
      title: memTitle.trim(),
      description: memDesc.trim() || 'A captured memory left inside this world.',
      position: [playerPos[0] + forwardX * 4, playerPos[1] - 0.3, playerPos[2] + forwardZ * 4],
    });
    setMemTitle('');
    setMemDesc('');
    store.showToast('Memory Anchor placed ahead of you');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  if (!hudVisible) {
    return (
      <div className="pointer-events-none fixed inset-0 z-30">
        <button
          type="button"
          onClick={() => store.toggleHud()}
          className="pointer-events-auto fixed right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#090B10]/70 px-3 py-1.5 text-xs text-[#F3F0E8] backdrop-blur-md hover:border-white/30"
        >
          <Eye className="h-3.5 w-3.5" />
          Show UI (H)
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {calibration.enabled && uploadedImage && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
          <img
            src={uploadedImage.dataUrl}
            alt="Original photo calibration"
            style={{
              opacity: calibration.opacity,
              transform: `translate(${calibration.offsetX}px, ${calibration.offsetY}px) scale(${calibration.scale})`,
            }}
            className="max-h-[82vh] max-w-[82vw] rounded-xl border border-white/30 object-contain shadow-2xl"
          />
        </div>
      )}

      {pointerLocked && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </div>
      )}

      {/* Top Bar */}
      <header className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="pointer-events-auto glass-panel flex items-center gap-3 rounded-xl px-3.5 py-2">
          <Compass className="h-4 w-4 text-[#8B7BFF]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[#A5A9B3]">
                FRAMEBREAK
              </span>
              <span className="rounded-full bg-[#8B7BFF]/20 px-2 py-0.5 text-[9px] font-medium text-[#C7BFFF]">
                {blueprint?.archetype.replace(/_/g, ' ') ?? 'Bespoke 3D'}
              </span>
            </div>
            <div className="max-w-[180px] truncate text-xs font-medium text-[#F3F0E8]">
              {projectName}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto hidden glass-subtle flex-col items-center rounded-xl px-4 py-2 text-center md:flex">
          <div className="font-serif text-lg font-medium leading-tight text-[#F3F0E8]">
            {blueprint?.sceneTitle ?? projectName}
          </div>
          <div className="mt-0.5 max-w-md truncate font-mono text-[10px] text-[#A5A9B3]">
            {blueprint?.subtitle ?? 'Explore the bespoke 3D environment'}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => store.triggerReturnToFrame()}
            title="Return to Original Frame Portal"
            className="glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-[#F3F0E8] hover:border-[#8B7BFF]/50"
          >
            <Frame className="h-3.5 w-3.5 text-[#8B7BFF]" />
            <span className="hidden sm:inline">Frame</span>
          </button>
          <button
            type="button"
            onClick={() => void handleSaveProject()}
            title="Save world locally"
            className="glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-[#F3F0E8] hover:border-white/25"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            type="button"
            onClick={() => {
              audioService.stop();
              if (document.pointerLockElement) document.exitPointerLock();
              store.resetAll();
            }}
            title="Exit world"
            className="glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-[#D5D8E2] hover:border-rose-400/40 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Left Floating Sandbox Toolbar */}
      <aside className="pointer-events-auto fixed left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 sm:left-5">
        {(
          [
            { id: 'explore', icon: Compass, label: 'Explore' },
            { id: 'environment', icon: CloudRain, label: 'Environment' },
            { id: 'create', icon: Plus, label: 'Create' },
            { id: 'discover', icon: BookmarkPlus, label: '5-Question Story & Memories' },
            { id: 'capture', icon: Camera, label: 'Capture' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ] as { id: ActiveTool; icon: typeof Compass; label: string }[]
        ).map((item) => {
          const Icon = item.icon;
          const active = activeTool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                store.setActiveTool(active && item.id !== 'explore' ? 'explore' : item.id)
              }
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                active
                  ? 'border-[#8B7BFF] bg-[#8B7BFF]/25 text-white shadow-[0_0_20px_rgba(139,123,255,0.3)]'
                  : 'glass-panel text-[#A5A9B3] hover:border-white/25 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </aside>

      {/* Contextual Side Panel */}
      {activeTool !== 'explore' && (
        <div className="pointer-events-auto glass-panel fixed left-16 top-1/2 max-h-[70vh] w-80 -translate-y-1/2 overflow-y-auto rounded-2xl p-4 sm:left-20">
          {activeTool === 'environment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#B7ACFF]">
                  Environment
                </h3>
                <button
                  type="button"
                  onClick={() => store.resetEnvironment()}
                  className="text-[10px] text-[#A5A9B3] hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['golden', 'midnight', 'dreamscape', 'rainy', 'cinematic', 'original'] as const).map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => store.applyEnvironmentPreset(preset)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] capitalize text-[#E5E2D9] hover:border-[#8B7BFF]/50 hover:bg-[#8B7BFF]/15"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>

              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#A5A9B3]">
                  Weather
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(['clear', 'mist', 'rain', 'snow', 'storm'] as WeatherType[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => store.updateEnvironment({ weather: w })}
                      className={`rounded-md py-1 text-[10px] capitalize ${
                        env.weather === w
                          ? 'bg-[#8B7BFF] text-white'
                          : 'bg-white/5 text-[#A5A9B3] hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                    <span>Time of Day</span>
                    <span className="font-mono">{env.timeOfDay.toFixed(1)}h</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={0.1}
                    value={env.timeOfDay}
                    onChange={(e) =>
                      store.updateEnvironment({
                        timeOfDay: Number(e.target.value),
                        skyTopOverride: undefined,
                        skyHorizonOverride: undefined,
                      })
                    }
                    className="w-full"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                    <span>Sun Intensity</span>
                    <span className="font-mono">{env.sunIntensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.6}
                    step={0.05}
                    value={env.sunIntensity}
                    onChange={(e) => store.updateEnvironment({ sunIntensity: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                    <span>Atmospheric Fog</span>
                    <span className="font-mono">{Math.round(env.fogDensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={env.fogDensity}
                    onChange={(e) => store.updateEnvironment({ fogDensity: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                    <span>Fireflies & Particles</span>
                    <span className="font-mono">{Math.round(env.fireflies * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={env.fireflies}
                    onChange={(e) => store.updateEnvironment({ fireflies: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#A5A9B3]">Ambient Soundscape</span>
                  <button
                    type="button"
                    onClick={() => store.updateEnvironment({ ambientMuted: !env.ambientMuted })}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]"
                  >
                    {env.ambientMuted ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-rose-300" /> Muted
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-300" /> On
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'create' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#B7ACFF]">
                  Create Mode
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={undoCount === 0}
                    onClick={() => store.undoObjects()}
                    title="Undo"
                    className="rounded-md border border-white/10 p-1 text-[#A5A9B3] hover:text-white disabled:opacity-35"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={redoCount === 0}
                    onClick={() => store.redoObjects()}
                    title="Redo"
                    className="rounded-md border border-white/10 p-1 text-[#A5A9B3] hover:text-white disabled:opacity-35"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-[#A5A9B3]">
                Unlock cursor (<kbd className="rounded bg-white/10 px-1">Esc</kbd>) and click anywhere
                on the ground to place a 3D object.
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {PLACEABLES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => store.setSelectedPlaceable(p.id)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                      selectedPlaceable === p.id
                        ? 'border-[#8B7BFF] bg-[#8B7BFF]/20 text-white'
                        : 'border-white/10 bg-white/5 text-[#C8CCD6] hover:border-white/25'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {selectedObjectId && (
                <button
                  type="button"
                  onClick={() => store.removeObject(selectedObjectId)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/35 bg-rose-500/15 py-2 text-xs text-rose-200 hover:bg-rose-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected Object
                </button>
              )}

              <div className="text-[10px] text-[#7D8394]">
                {objects.length} custom object{objects.length === 1 ? '' : 's'} in scene
              </div>
            </div>
          )}

          {activeTool === 'discover' && (
            <div className="space-y-3.5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E8A855]">
                5-Question Analysis & Memories
              </h3>

              {blueprint && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px]">
                  <div>
                    <span className="font-semibold text-[#B7ACFF]">What It Is: </span>
                    <span className="text-[#D8DCE6]">{blueprint.reasoning.whatItIs}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#F2C382]">Where It Belongs: </span>
                    <span className="text-[#D8DCE6]">{blueprint.reasoning.whereItShouldBe}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#A5A9B3]">Mood: </span>
                    <span className="text-[#D8DCE6]">{blueprint.reasoning.mood}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#A5A9B3]">Theme: </span>
                    <span className="text-[#D8DCE6]">{blueprint.reasoning.theme}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#A5A9B3]">Relevance: </span>
                    <span className="text-[#D8DCE6]">{blueprint.reasoning.particularRelevance}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Layers className="h-3.5 w-3.5 text-[#8B7BFF]" />
                    Compare Source Photo Overlay
                  </span>
                  <input
                    type="checkbox"
                    checked={calibration.enabled}
                    onChange={(e) => store.updateCalibration({ enabled: e.target.checked })}
                    className="accent-[#8B7BFF]"
                  />
                </div>
                {calibration.enabled && (
                  <label className="block text-[10px] text-[#A5A9B3]">
                    Overlay Opacity ({Math.round(calibration.opacity * 100)}%)
                    <input
                      type="range"
                      min={0.1}
                      max={0.85}
                      step={0.05}
                      value={calibration.opacity}
                      onChange={(e) =>
                        store.updateCalibration({ opacity: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </label>
                )}
              </div>

              <form onSubmit={handleAddMemory} className="space-y-2">
                <div className="text-[11px] font-medium text-[#F3F0E8]">
                  Drop a Memory Anchor Here
                </div>
                <input
                  type="text"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="Memory title…"
                  className="w-full rounded-lg border border-white/10 bg-[#090B10]/80 px-2.5 py-1.5 text-xs text-[#F3F0E8] placeholder:text-[#687082]"
                />
                <textarea
                  rows={2}
                  value={memDesc}
                  onChange={(e) => setMemDesc(e.target.value)}
                  placeholder="Write a note or story…"
                  className="w-full rounded-lg border border-white/10 bg-[#090B10]/80 px-2.5 py-1.5 text-xs text-[#F3F0E8] placeholder:text-[#687082]"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#E8A855]/20 py-1.5 text-xs font-medium text-[#F2C382] hover:bg-[#E8A855]/30"
                >
                  Place Memory Anchor ({memories.length})
                </button>
              </form>
            </div>
          )}

          {activeTool === 'capture' && (
            <div className="space-y-3.5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#B7ACFF]">
                Cinematic Capture
              </h3>
              <label className="block text-xs">
                <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                  <span>Camera FOV</span>
                  <span className="font-mono">{cam.fov}°</span>
                </div>
                <input
                  type="range"
                  min={42}
                  max={96}
                  step={1}
                  value={cam.fov}
                  onChange={(e) => store.updateCamera({ fov: Number(e.target.value) })}
                  className="w-full"
                />
              </label>

              <button
                type="button"
                onClick={() => store.triggerScreenshot()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B7BFF] py-2.5 text-xs font-medium text-white hover:brightness-110"
              >
                <Camera className="h-3.5 w-3.5" />
                Capture Screenshot (PNG)
              </button>

              <button
                type="button"
                onClick={() => store.toggleHud()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 py-2 text-xs text-[#D4D8E2] hover:bg-white/10"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide Interface (Press H to restore)
              </button>
            </div>
          )}

          {activeTool === 'settings' && (
            <div className="space-y-3.5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#B7ACFF]">
                Controls & Performance
              </h3>

              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#A5A9B3]">
                  Graphics Quality
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['low', 'medium', 'high', 'ultra'] as QualityPreset[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => store.setQuality(q)}
                      className={`rounded-md py-1 text-[10px] capitalize ${
                        quality === q
                          ? 'bg-[#8B7BFF] text-white'
                          : 'bg-white/5 text-[#A5A9B3] hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs">
                <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                  <span>Movement Speed</span>
                  <span className="font-mono">{cam.speed}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={28}
                  step={1}
                  value={cam.speed}
                  onChange={(e) => store.updateCamera({ speed: Number(e.target.value) })}
                  className="w-full"
                />
              </label>

              <label className="block text-xs">
                <div className="mb-1 flex justify-between text-[11px] text-[#A5A9B3]">
                  <span>Mouse Sensitivity</span>
                  <span className="font-mono">{cam.sensitivity.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.4}
                  step={0.1}
                  value={cam.sensitivity}
                  onChange={(e) => store.updateCamera({ sensitivity: Number(e.target.value) })}
                  className="w-full"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between text-xs text-[#C8CCD6]">
                <span>Invert Y-Axis</span>
                <input
                  type="checkbox"
                  checked={cam.invertY}
                  onChange={(e) => store.updateCamera({ invertY: e.target.checked })}
                  className="accent-[#8B7BFF]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between text-xs text-[#C8CCD6]">
                <span>Walk Head Bob</span>
                <input
                  type="checkbox"
                  checked={cam.headBob}
                  onChange={(e) => store.updateCamera({ headBob: e.target.checked })}
                  className="accent-[#8B7BFF]"
                />
              </label>

              <button
                type="button"
                onClick={() => store.triggerCameraReset()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-[#E5E2D9] hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Camera Position (R)
              </button>
            </div>
          )}
        </div>
      )}

      {showOnboarding && (
        <div className="pointer-events-auto fixed left-1/2 top-[92px] -translate-x-1/2">
          <div className="glass-panel flex flex-wrap items-center gap-3 rounded-full px-4 py-2 text-[11px] text-[#E5E2D9]">
            <span>
              <kbd className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[10px]">WASD</kbd>{' '}
              Move
            </span>
            <span>
              <kbd className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[10px]">Mouse</kbd>{' '}
              Look
            </span>
            <span>
              <kbd className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[10px]">Shift</kbd>{' '}
              Sprint
            </span>
            <span>
              <kbd className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[10px]">F</kbd>{' '}
              Walk / Fly
            </span>
            <button
              type="button"
              onClick={() => store.setShowOnboarding(false)}
              className="ml-1 text-[#A5A9B3] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {statusToast && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 -translate-x-1/2">
          <div className="rounded-full border border-[#8B7BFF]/40 bg-[#090B10]/88 px-4 py-1.5 text-xs text-[#F3F0E8] shadow-2xl backdrop-blur-md">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-[#8B7BFF]" />
            {statusToast}
          </div>
        </div>
      )}

      {/* Bottom Dock */}
      <footer className="fixed bottom-4 left-4 right-4 flex items-end justify-between gap-4 sm:bottom-5 sm:left-5 sm:right-5">
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestPointerLock}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium backdrop-blur-md transition-all ${
                pointerLocked
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                  : 'border-[#8B7BFF]/60 bg-[#8B7BFF]/25 text-white hover:bg-[#8B7BFF]/35'
              }`}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
              {pointerLocked ? 'Look Active (Esc)' : 'Enter Mouse-Look'}
            </button>

            <button
              type="button"
              onClick={() => store.toggleMovementMode()}
              className="glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-[#F3F0E8] hover:border-white/25"
            >
              {movementMode === 'fly' ? (
                <>
                  <Feather className="h-3.5 w-3.5 text-[#8B7BFF]" /> Fly
                </>
              ) : (
                <>
                  <Footprints className="h-3.5 w-3.5 text-[#E8A855]" /> Walk
                </>
              )}
            </button>
          </div>

          <div className="hidden font-mono text-[10px] text-[#8E94A6] sm:block">
            POS {playerPos[0].toFixed(0)}, {playerPos[1].toFixed(1)}, {playerPos[2].toFixed(0)} ·{' '}
            {movementMode === 'fly' ? 'Space/E ↑ · C/Q ↓' : 'Space Jump · Shift Sprint'}
          </div>
        </div>

        <div className="pointer-events-auto hidden w-full max-w-lg flex-col items-center gap-1.5 md:flex">
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_DIRECTIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleDirectorSubmit(chip)}
                className="rounded-full border border-white/10 bg-[#090B10]/65 px-2.5 py-0.5 text-[10px] text-[#B7BCC9] backdrop-blur-md transition-colors hover:border-[#8B7BFF]/50 hover:text-white"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDirectorSubmit();
            }}
            className="glass-panel flex w-full items-center gap-2 rounded-full px-3.5 py-2"
          >
            <Sliders className="h-3.5 w-3.5 shrink-0 text-[#8B7BFF]" />
            <input
              type="text"
              value={directorInput}
              onChange={(e) => setDirectorInput(e.target.value)}
              placeholder='Direct this world… e.g. "Turn this into a rainy night with floating lanterns"'
              className="w-full bg-transparent text-xs text-[#F3F0E8] outline-none placeholder:text-[#7D8394]"
            />
            <button
              type="submit"
              aria-label="Apply world direction"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8B7BFF] text-white hover:brightness-110"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {showMinimap && (
            <div className="glass-panel relative h-24 w-24 overflow-hidden rounded-full p-2">
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <div className="absolute inset-6 rounded-full border border-white/5" />
              <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[8px] text-[#8E94A6]">
                N
              </span>
              <div
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B7BFF]"
                style={{
                  left: `${50 + Math.max(-36, Math.min(36, -playerPos[0] * 0.45))}%`,
                  top: `${50 + Math.max(-36, Math.min(36, (11 - playerPos[2]) * 0.45))}%`,
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${-playerYaw}rad)` }}
              >
                <div className="mx-auto h-0 w-0 border-x-[4px] border-b-[9px] border-x-transparent border-b-[#F3F0E8]" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => store.triggerScreenshot()}
              title="Capture screenshot"
              className="glass-panel rounded-xl p-2 text-[#D4D8E2] hover:border-white/25 hover:text-white"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
              className="glass-panel rounded-xl p-2 text-[#D4D8E2] hover:border-white/25 hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => store.toggleHud()}
              title="Hide HUD (H)"
              className="glass-panel rounded-xl p-2 text-[#D4D8E2] hover:border-white/25 hover:text-white"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
