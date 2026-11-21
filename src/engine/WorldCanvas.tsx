import { Component, ReactNode, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/useWorldStore';
import { FirstPersonController } from './FirstPersonController';
import { AtmosphereEffects } from './AtmosphereEffects';
import { ImaginationScene } from './ImaginationScene';
import { InteractiveObjects } from './InteractiveObjects';

function ScreenshotHandler() {
  const { gl, scene, camera } = useThree();
  const screenshotNonce = useWorldStore((s) => s.screenshotNonce);

  useEffect(() => {
    if (screenshotNonce === 0) return;
    gl.render(scene, camera);
    try {
      const dataUrl = gl.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const name = useWorldStore.getState().projectName.replace(/[^a-z0-9-_]/gi, '_');
      a.download = `framebreak-${name || 'world'}-${Date.now()}.png`;
      a.click();
      useWorldStore.getState().showToast('Screenshot saved as PNG');
    } catch {
      useWorldStore.getState().showToast('Unable to export screenshot');
    }
  }, [screenshotNonce, gl, scene, camera]);

  return null;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'WebGL renderer encountered an error.' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#090B10] p-8 text-center">
          <p className="font-serif text-2xl text-[#F3F0E8]">WebGL Context Unavailable</p>
          <p className="mt-2 max-w-md text-sm text-[#A5A9B3]">{this.state.message}</p>
          <button
            type="button"
            onClick={() => useWorldStore.getState().resetAll()}
            className="mt-5 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-medium text-[#F3F0E8] hover:bg-white/15"
          >
            Return to Upload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WorldCanvas() {
  const uploadedImage = useWorldStore((s) => s.uploadedImage);
  const blueprint = useWorldStore((s) => s.blueprint);
  const quality = useWorldStore((s) => s.quality);
  const fov = useWorldStore((s) => s.camera.fov);

  const dpr: [number, number] =
    quality === 'low'
      ? [0.75, 1]
      : quality === 'medium'
        ? [1, 1.25]
        : quality === 'high'
          ? [1, 1.5]
          : [1, 2];

  return (
    <CanvasErrorBoundary>
      <div className="relative h-full w-full bg-[#090B10]">
        <Canvas
          id="framebreak-canvas"
          shadows={quality !== 'low'}
          dpr={dpr}
          camera={{ fov, near: 0.15, far: 2200, position: [0, 2.2, 16] }}
          gl={{
            antialias: quality !== 'low',
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
            powerPreference: 'high-performance',
          }}
        >
          <AtmosphereEffects />
          <FirstPersonController />
          <ScreenshotHandler />

          {blueprint && uploadedImage && (
            <ImaginationScene blueprint={blueprint} image={uploadedImage} />
          )}

          <InteractiveObjects />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
