import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FastForward } from 'lucide-react';
import { useWorldStore } from '../store/useWorldStore';

export function PortalTransition() {
  const uploadedImage = useWorldStore((s) => s.uploadedImage);
  const blueprint = useWorldStore((s) => s.blueprint);
  const setStage = useWorldStore((s) => s.setStage);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStage('exploring');
    }, 1750);
    return () => window.clearTimeout(timer);
  }, [setStage]);

  if (!uploadedImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#090B10]">
      <motion.div
        initial={{ scale: 0.4, opacity: 0.85 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-72 w-72 rounded-full border-2 border-[#8B7BFF]/70 shadow-[0_0_120px_rgba(139,123,255,0.65)]"
      />

      <motion.div
        initial={{ scale: 0.86, opacity: 1, filter: 'blur(0px)' }}
        animate={{ scale: 2.35, opacity: 0, filter: 'blur(12px)' }}
        transition={{ duration: 1.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-2xl overflow-hidden rounded-2xl border border-white/20 shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
      >
        <img
          src={uploadedImage.dataUrl}
          alt={uploadedImage.filename}
          className="max-h-[65vh] w-auto object-cover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: [0, 1, 0], y: 0 }}
        transition={{ duration: 1.6 }}
        className="pointer-events-none absolute bottom-16 text-center"
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#B7ACFF]">
          Entering {blueprint?.sceneTitle ?? '3D Space'}
        </div>
      </motion.div>

      <button
        type="button"
        onClick={() => setStage('exploring')}
        className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#090B10]/70 px-3.5 py-1.5 text-xs text-[#D4D8E3] backdrop-blur-md hover:border-white/30 hover:text-white"
      >
        <FastForward className="h-3.5 w-3.5" />
        Skip animation
      </button>
    </div>
  );
}
