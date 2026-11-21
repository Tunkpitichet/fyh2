import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Cpu,
  FolderOpen,
  Layers,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorldStore } from '../store/useWorldStore';
import { processUploadedFile } from '../services/exifService';
import {
  createDemoUploadedImage,
  DEMO_SPECS,
  getDemoThumbnailDataUrl,
} from '../services/demoAssets';
import { deleteWorldProject, listWorldProjects } from '../services/storageService';
import { WorldProject } from '../types/world';

export function LandingView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const savedProjects = useWorldStore((s) => s.savedProjects);
  const setSavedProjects = useWorldStore((s) => s.setSavedProjects);
  const setUploadedImage = useWorldStore((s) => s.setUploadedImage);
  const setStage = useWorldStore((s) => s.setStage);
  const loadSavedProject = useWorldStore((s) => s.loadSavedProject);

  useEffect(() => {
    void listWorldProjects().then(setSavedProjects);
  }, [setSavedProjects]);

  const demoThumbs = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of DEMO_SPECS) {
      map[d.id] = getDemoThumbnailDataUrl(d.id);
    }
    return map;
  }, []);

  const handleFile = async (file: File) => {
    setLocalError(null);
    setLoadingLabel(`Reading ${file.name}…`);
    try {
      const uploaded = await processUploadedFile(file);
      setUploadedImage(uploaded);
      setStage('preparing');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setLoadingLabel(null);
    }
  };

  const handleDemo = async (demoId: string) => {
    setLocalError(null);
    setLoadingLabel('Preparing image…');
    try {
      const uploaded = await createDemoUploadedImage(demoId);
      setUploadedImage(uploaded);
      setStage('preparing');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load sample image.');
    } finally {
      setLoadingLabel(null);
    }
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteWorldProject(id);
    const updated = await listWorldProjects();
    setSavedProjects(updated);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#090B10] text-[#F3F0E8]">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(139,123,255,0.16), transparent 70%), radial-gradient(ellipse 45% 35% at 85% 85%, rgba(232,168,85,0.09), transparent 70%)',
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#8B7BFF]/40 bg-[#8B7BFF]/15">
            <Compass className="h-4 w-4 text-[#B7ACFF]" />
          </div>
          <div>
            <span className="font-mono text-xs font-medium tracking-[0.28em] text-[#F3F0E8]">
              FRAMEBREAK
            </span>
            <span className="ml-2.5 hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#A5A9B3] sm:inline">
              Bespoke 3D World Synthesizer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A5A9B3]">
          <Cpu className="h-3.5 w-3.5 text-[#8B7BFF]" />
          <span className="hidden sm:inline">
            Powered by Antigravity CLI · Gemini 4 Neon (High)
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#A5A9B3]">
            Beyond the Frame
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-[#F3F0E8] sm:text-6xl">
            Every image is a doorway.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#A5A9B3] sm:text-base">
            Upload any photograph—a plane, a cat, a city street, or a painting. FRAMEBREAK
            identifies what it is, where it belongs, its mood, theme, and relevance to construct an
            extremely detailed 3D space around it.
          </p>
        </motion.div>

        {/* Central Drag & Drop Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mx-auto mt-7 w-full max-w-3xl"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
              dragging
                ? 'border-[#8B7BFF] bg-[#8B7BFF]/12 shadow-[0_0_50px_rgba(139,123,255,0.22)]'
                : 'border-white/12 bg-[#131720]/75 hover:border-[#8B7BFF]/55 hover:bg-[#161B27]/85'
            } px-6 py-9 text-center backdrop-blur-xl`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:border-[#8B7BFF]/60">
              <Upload className="h-5 w-5 text-[#F3F0E8]" />
            </div>

            <p className="mt-4 text-base font-medium text-[#F3F0E8]">
              {loadingLabel ?? 'Drop any photograph or artwork here, or click to upload'}
            </p>
            <p className="mt-1.5 text-xs text-[#A5A9B3]">
              Analyzes What it is · Where it belongs · Mood · Theme · Relevance via Gemini 4 Neon (High)
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8B7BFF]/30 bg-[#8B7BFF]/10 px-3 py-1 text-[#C4BAFF]">
                <Sparkles className="h-3.5 w-3.5" />
                5-Question Deep Visual Reasoning
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8A855]/30 bg-[#E8A855]/10 px-3 py-1 text-[#F2C382]">
                <Layers className="h-3.5 w-3.5" />
                Bespoke Multi-Part 3D Architecture & Hero Subject
              </span>
            </div>
          </div>

          {localError && (
            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
              {localError}
            </div>
          )}
        </motion.div>

        {/* Sample Photographs Showcasing Distinct 3D Spaces */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
          className="mt-9"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#A5A9B3]">
              Sample Photographs · See How Differently Each 3D Space Builds
            </h2>
            <span className="text-[11px] text-[#7D8394]">Or upload your own photo above</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_SPECS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => void handleDemo(demo.id)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#131720]/85 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8B7BFF]/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={demoThumbs[demo.id]}
                    alt={demo.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131720] via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full border border-[#8B7BFF]/40 bg-[#090B10]/75 px-2.5 py-0.5 text-[10px] font-medium text-[#C6BDFF] backdrop-blur-md">
                    {demo.tag}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-xl font-medium text-[#F3F0E8]">{demo.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#A5A9B3]">
                    {demo.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {savedProjects.length > 0 && (
          <section className="mt-7">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#A5A9B3]">
              <FolderOpen className="h-3.5 w-3.5" />
              Saved Worlds ({savedProjects.length})
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {savedProjects.map((proj: WorldProject) => (
                <div
                  key={proj.id}
                  onClick={() => loadSavedProject(proj)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadSavedProject(proj);
                  }}
                  className="flex min-w-[230px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#131720]/75 p-2.5 transition-colors hover:border-[#8B7BFF]/45"
                >
                  <img
                    src={proj.image.dataUrl}
                    alt={proj.name}
                    className="h-12 w-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-[#F3F0E8]">{proj.name}</div>
                    <div className="truncate text-[10px] text-[#A5A9B3]">
                      {proj.blueprint.archetype.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${proj.name}`}
                    onClick={(e) => void handleDeleteSaved(e, proj.id)}
                    className="rounded-lg p-1.5 text-[#7E8596] hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-5 pt-2 text-[11px] text-[#7D8394]">
        <span>WASD + Mouse Look · Walk & Fly Modes · Bespoke Multi-Part 3D Worlds</span>
        <span>Antigravity CLI (Gemini 4 Neon High)</span>
      </footer>
    </div>
  );
}
