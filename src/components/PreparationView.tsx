import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Cpu,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useWorldStore } from '../store/useWorldStore';
import { analyzeImageWithAgy } from '../services/imageAnalyzer';
import { audioService } from '../services/audioService';

export function PreparationView() {
  const uploadedImage = useWorldStore((s) => s.uploadedImage);
  const blueprint = useWorldStore((s) => s.blueprint);
  const setBlueprint = useWorldStore((s) => s.setBlueprint);
  const setBaseEnvironment = useWorldStore((s) => s.setBaseEnvironment);
  const progressSteps = useWorldStore((s) => s.progressSteps);
  const setProgressSteps = useWorldStore((s) => s.setProgressSteps);
  const updateProgressStep = useWorldStore((s) => s.updateProgressStep);
  const setStage = useWorldStore((s) => s.setStage);
  const resetAll = useWorldStore((s) => s.resetAll);

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const [userHint, setUserHint] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);

  const runAnalysis = async (hintText?: string) => {
    if (!uploadedImage) return;
    setAnalyzing(true);
    setBuildError(null);
    setProgressSteps([
      {
        id: 'agy',
        label: 'Gemini 4 Neon (High) inspecting image & answering 5 reasoning questions',
        status: 'active',
      },
      {
        id: 'space',
        label: 'Designing bespoke 3D architecture, hero subject & custom Three.js geometry',
        status: 'pending',
      },
    ]);

    try {
      const { blueprint: bp, recommendedEnv } = await analyzeImageWithAgy(
        uploadedImage,
        hintText
      );
      updateProgressStep(
        'agy',
        'done',
        bp.generatedBy === 'agy-gemini-4-neon-high' ? 'agy CLI · Gemini 4 Neon High' : 'Local Fallback'
      );
      updateProgressStep('space', 'done', `${bp.elements.length + 1} detailed 3D assemblies`);
      setBlueprint(bp);
      setBaseEnvironment(recommendedEnv);
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (uploadedImage && !blueprint && !analyzing) {
      void runAnalysis();
    }
  }, [uploadedImage]);

  if (!uploadedImage) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -ny * 9, ry: nx * 11 });
  };

  const handleEnterWorld = () => {
    if (!blueprint) return;
    audioService.start(
      useWorldStore.getState().environment.ambientVolume,
      useWorldStore.getState().environment.ambientMuted
    );
    audioService.playPortalWhoosh();
    setStage('transitioning');
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#090B10] px-6 py-6 text-[#F3F0E8]"
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 35% 45%, rgba(139,123,255,0.14), transparent 55%), radial-gradient(circle at 75% 25%, rgba(232,168,85,0.1), transparent 50%)',
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-[#D5D8E2] transition-colors hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Upload Another Image
        </button>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#A5A9B3]">
          <Cpu className="h-3.5 w-3.5 text-[#8B7BFF]" />
          Gemini 4 Neon (High) · 3D Space Synthesis
        </span>
      </header>

      <main className="relative z-10 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-start gap-8 py-6 lg:grid-cols-12">
        {/* Left: Floating Photographic Frame + Optional Steering Prompt */}
        <div className="flex flex-col items-center justify-center lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              transform: `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: 'transform 0.16s ease-out',
            }}
            className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-[#121622] p-3 shadow-[0_35px_90px_rgba(0,0,0,0.75)]"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={uploadedImage.dataUrl}
                alt={uploadedImage.filename}
                className="max-h-[340px] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/15" />
            </div>
            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-[#A5A9B3]">
              <span className="truncate font-mono">{uploadedImage.filename}</span>
              <span className="font-mono">
                {uploadedImage.width} × {uploadedImage.height}
              </span>
            </div>
          </motion.div>

          {/* Optional Custom Context / Re-generate with agy */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runAnalysis(userHint);
            }}
            className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#131720]/80 p-2"
          >
            <input
              type="text"
              value={userHint}
              onChange={(e) => setUserHint(e.target.value)}
              placeholder="Optional: steer the 3D space (e.g. 'place in a Kyoto garden at dusk')…"
              className="w-full bg-transparent px-2 text-xs text-[#F3F0E8] outline-none placeholder:text-[#6E7587]"
            />
            <button
              type="submit"
              disabled={analyzing}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#8B7BFF]/40 bg-[#8B7BFF]/15 px-3 py-1.5 text-xs font-medium text-[#C8BFFF] hover:bg-[#8B7BFF]/25 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
              Re-Analyze
            </button>
          </form>
        </div>

        {/* Right: 5-Question Scene Reasoning & 3D World Blueprint */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8B7BFF]">
                  5-Question World Reasoning
                </span>
                <h2 className="mt-0.5 font-serif text-2xl font-medium text-[#F3F0E8]">
                  {blueprint ? blueprint.sceneTitle : 'Inspecting Photograph…'}
                </h2>
              </div>

              {blueprint && (
                <span className="rounded-full border border-[#E8A855]/40 bg-[#E8A855]/15 px-3 py-1 text-[11px] font-medium text-[#F2C382]">
                  {blueprint.archetype.replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
            </div>

            {/* Live Progress Steps while agy CLI runs */}
            {progressSteps.length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-[#090B10]/65 p-3">
                {progressSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {step.status === 'done' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#8B7BFF]" />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-white/20" />
                      )}
                      <span
                        className={
                          step.status === 'pending' ? 'text-[#7D8394]' : 'text-[#F3F0E8]'
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                    {step.detail && (
                      <span className="font-mono text-[10px] text-[#A5A9B3]">{step.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* The 5 Deep Reasoning Answers */}
            {blueprint && (
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#B7ACFF]">
                    1. What It Is (Subject & Visual Details)
                  </div>
                  <p className="mt-1 leading-relaxed text-[#E6E3DC]">
                    {blueprint.reasoning.whatItIs}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E8A855]/30 bg-[#E8A855]/[0.06] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#F2C382]">
                    2. Where the 3D Space Should Be (Generated Environment)
                  </div>
                  <p className="mt-1 leading-relaxed text-[#F3F0E8]">
                    {blueprint.reasoning.whereItShouldBe}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#A5A9B3]">
                      3. The Mood & Lighting
                    </div>
                    <p className="mt-1 leading-relaxed text-[#D5D8E2]">
                      {blueprint.reasoning.mood}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#A5A9B3]">
                      4. The Theme & Style
                    </div>
                    <p className="mt-1 leading-relaxed text-[#D5D8E2]">
                      {blueprint.reasoning.theme}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#A5A9B3]">
                    5. Particular Relevance & Story
                  </div>
                  <p className="mt-1 leading-relaxed text-[#D5D8E2]">
                    {blueprint.reasoning.particularRelevance}
                  </p>
                </div>

                {/* Extracted Palette & Hero Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    {Object.values(blueprint.palette)
                      .slice(0, 6)
                      .map((hex, i) => (
                        <span
                          key={i}
                          title={hex}
                          style={{ backgroundColor: hex }}
                          className="h-4 w-4 rounded-full border border-white/25"
                        />
                      ))}
                  </div>
                  <div className="font-mono text-[11px] text-[#A5A9B3]">
                    Hero: <span className="text-[#F3F0E8]">{blueprint.heroSubject.label}</span> ·{' '}
                    {blueprint.elements.length} 3D structures
                  </div>
                </div>
              </div>
            )}

            {buildError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {buildError}
              </div>
            )}

            <button
              type="button"
              disabled={analyzing || !blueprint}
              onClick={handleEnterWorld}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B7BFF] to-[#6E5CE6] px-5 py-3.5 text-sm font-medium text-white shadow-[0_12px_32px_rgba(139,123,255,0.35)] transition-all hover:brightness-110 disabled:opacity-55"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synthesizing Bespoke 3D Space…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <Sparkles className="h-4 w-4" />
                  Enter This 3D World
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <div className="h-2" />
    </div>
  );
}
