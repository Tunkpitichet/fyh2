import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useWorldStore } from '../store/useWorldStore';
import { createPainterlySkyMaterial } from './shaders';
import { getGlowParticleTexture } from './textures';
import { audioService } from '../services/audioService';

function computeSkyColors(timeOfDay: number, topOverride?: string, horizonOverride?: string) {
  let top = '#0B1633';
  let horizon = '#385C8A';
  let sunCol = '#FFD48F';
  let starStrength = 0.0;

  if (timeOfDay < 5.5 || timeOfDay >= 20.5) {
    top = '#050A18';
    horizon = '#16284F';
    sunCol = '#DCE6FF';
    starStrength = 0.95;
  } else if (timeOfDay < 7.5) {
    top = '#1C2E59';
    horizon = '#F0A475';
    sunCol = '#FFC785';
    starStrength = 0.25;
  } else if (timeOfDay < 16.5) {
    top = '#275CA8';
    horizon = '#9ECBF0';
    sunCol = '#FFF5DC';
    starStrength = 0.0;
  } else if (timeOfDay < 19.3) {
    top = '#182447';
    horizon = '#EB8C4E';
    sunCol = '#FFB562';
    starStrength = 0.22;
  } else {
    top = '#0C1430';
    horizon = '#4D3B6E';
    sunCol = '#E8A878';
    starStrength = 0.72;
  }

  return {
    top: topOverride ?? top,
    horizon: horizonOverride ?? horizon,
    sunCol,
    starStrength,
  };
}

export function AtmosphereEffects() {
  const { scene, camera } = useThree();
  const env = useWorldStore((s) => s.environment);
  const quality = useWorldStore((s) => s.quality);
  const blueprint = useWorldStore((s) => s.blueprint);

  const skyMat = useMemo(() => createPainterlySkyMaterial(), []);
  const glowTex = useMemo(() => getGlowParticleTexture(), []);

  useEffect(() => {
    return () => {
      skyMat.dispose();
    };
  }, [skyMat]);

  useEffect(() => {
    audioService.updateAtmosphere(env.weather, env.windSpeed, env.timeOfDay);
    audioService.setVolume(env.ambientVolume, env.ambientMuted);
  }, [env.weather, env.windSpeed, env.timeOfDay, env.ambientVolume, env.ambientMuted]);

  const skyPalette = useMemo(
    () => computeSkyColors(env.timeOfDay, env.skyTopOverride, env.skyHorizonOverride),
    [env.timeOfDay, env.skyTopOverride, env.skyHorizonOverride]
  );

  const sunPosition = useMemo<[number, number, number]>(() => {
    const angle = ((env.timeOfDay - 6) / 24) * Math.PI * 2;
    const y = Math.sin(angle) * 140;
    const x = Math.cos(angle) * 140;
    return [x, Math.max(48, Math.abs(y)), 135];
  }, [env.timeOfDay]);

  useEffect(() => {
    const fogColor = new THREE.Color(skyPalette.horizon).lerp(new THREE.Color('#0B0F1A'), 0.32);
    const isColossal = (blueprint?.terrainProfile?.terrainSize ?? 280) >= 600;
    const density = isColossal
      ? 0.00045 + env.fogDensity * (env.weather === 'mist' ? 0.0045 : 0.0028)
      : 0.002 + env.fogDensity * (env.weather === 'mist' ? 0.015 : 0.011);
    scene.fog = new THREE.FogExp2(fogColor, density);
    scene.background = fogColor;
  }, [scene, skyPalette.horizon, env.fogDensity, env.weather, blueprint]);

  const fireflyCount = quality === 'low' ? 120 : quality === 'medium' ? 240 : 420;
  const fireflyGeo = useMemo(() => {
    const positions = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 110;
      positions[i * 3 + 1] = 1.0 + Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 110;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [fireflyCount]);

  const precipCount = quality === 'low' ? 400 : 1100;
  const precipGeo = useMemo(() => {
    const positions = new Float32Array(precipCount * 3);
    for (let i = 0; i < precipCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 44;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [precipCount]);

  useEffect(() => {
    return () => {
      fireflyGeo.dispose();
      precipGeo.dispose();
    };
  }, [fireflyGeo, precipGeo]);

  const fireflyRef = useRef<THREE.Points>(null);
  const precipRef = useRef<THREE.Points>(null);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.getElapsedTime();

    skyMat.uniforms.uTime.value = t;
    skyMat.uniforms.uTopColor.value.set(skyPalette.top);
    skyMat.uniforms.uHorizonColor.value.set(skyPalette.horizon);
    skyMat.uniforms.uSunColor.value.set(skyPalette.sunCol);
    skyMat.uniforms.uSunDir.value.set(...sunPosition).normalize();
    skyMat.uniforms.uStarIntensity.value =
      env.artStyle === 'starry' ? Math.max(0.85, skyPalette.starStrength) : skyPalette.starStrength;
    skyMat.uniforms.uSwirlIntensity.value =
      env.artStyle === 'starry' || env.artStyle === 'dreamscape' || env.swirlingSky ? 0.9 : 0.0;

    if (fireflyRef.current && (env.fireflies > 0.02 || env.dreamDust > 0.02)) {
      fireflyRef.current.rotation.y = t * 0.015;
      fireflyRef.current.position.y = Math.sin(t * 0.65) * 0.45;
    }

    if (
      precipRef.current &&
      (env.weather === 'rain' || env.weather === 'storm' || env.weather === 'snow')
    ) {
      const posAttr = precipRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const isSnow = env.weather === 'snow';
      const fallSpeed = isSnow ? 3.5 : env.weather === 'storm' ? 32 : 22;
      const driftX = (isSnow ? 1.8 : 4.2) * env.windSpeed;

      for (let i = 0; i < precipCount; i++) {
        const i3 = i * 3;
        arr[i3] += driftX * dt;
        arr[i3 + 1] -= fallSpeed * dt;
        if (arr[i3 + 1] < 0) {
          arr[i3] = camera.position.x + (Math.random() - 0.5) * 90;
          arr[i3 + 1] = 34 + Math.random() * 14;
          arr[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 90;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  const isNight = env.timeOfDay < 6 || env.timeOfDay > 19.5;
  const particleOpacity = Math.min(1, Math.max(env.fireflies, env.dreamDust));
  const particleColor =
    env.artStyle === 'dreamscape' ? '#C79EFF' : env.fireflies >= env.dreamDust ? '#FFE38A' : '#A9D6FF';

  return (
    <>
      <mesh material={skyMat} scale={[1600, 1600, 1600]}>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>

      <hemisphereLight args={['#FFFFFF', '#3B4254', isNight ? 0.65 : 1.05]} />
      <ambientLight intensity={isNight ? 0.35 : 0.55} color={skyPalette.horizon} />
      <directionalLight
        position={sunPosition}
        intensity={env.sunIntensity * (env.weather === 'storm' ? 0.45 : 1)}
        color={skyPalette.sunCol}
        castShadow={quality !== 'low'}
        shadow-mapSize={quality === 'ultra' ? [2048, 2048] : [1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={240}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
        shadow-bias={-0.0005}
      />

      {particleOpacity > 0.02 && (
        <points ref={fireflyRef} geometry={fireflyGeo}>
          <pointsMaterial
            map={glowTex}
            color={particleColor}
            size={env.artStyle === 'dreamscape' ? 1.15 : 0.85}
            transparent
            opacity={particleOpacity * 0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}

      {(env.weather === 'rain' || env.weather === 'storm' || env.weather === 'snow') && (
        <points ref={precipRef} geometry={precipGeo}>
          <pointsMaterial
            map={glowTex}
            color={env.weather === 'snow' ? '#EEF5FF' : '#9CC4E8'}
            size={env.weather === 'snow' ? 0.65 : 0.35}
            transparent
            opacity={env.weather === 'snow' ? 0.82 : 0.55}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      )}

      {quality !== 'low' && (
        <EffectComposer multisampling={quality === 'ultra' ? 4 : 0}>
          <Bloom
            intensity={env.bloomIntensity * 0.72}
            luminanceThreshold={0.62}
            luminanceSmoothing={0.35}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.22} darkness={0.48} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}
