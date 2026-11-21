import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { UploadedImage, WorldBlueprint } from '../types/world';
import { useWorldStore } from '../store/useWorldStore';
import { sampleTerrainHeightWithProfile } from './terrainMath';
import {
  getCobblestoneTexture,
  getPainterlyTerrainTexture,
  getTarmacAsphaltTexture,
  getTimberDeckTexture,
} from './textures';
import { createStylizedWaterMaterial } from './shaders';
import { FramePortal } from './FramePortal';
import { DetailedElementMesh, HeroSubjectMesh } from './DetailedWorldAssets';

interface ImaginationSceneProps {
  blueprint: WorldBlueprint;
  image: UploadedImage;
}

export function ImaginationScene({ blueprint, image }: ImaginationSceneProps) {
  const { palette, groundType, terrainProfile, waterLevel, elements, heroSubject } = blueprint;
  const env = useWorldStore((s) => s.environment);
  const hudVisible = useWorldStore((s) => s.hudVisible);
  const quality = useWorldStore((s) => s.quality);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  const customGroupRef = useRef<THREE.Group>(null);
  const isNight = env.timeOfDay < 6.5 || env.timeOfDay > 18.2;
  const isSculpted =
    terrainProfile.shape !== 'flat_urban_pad' &&
    (terrainProfile.baseAmplitude > 0 || terrainProfile.distantPeaks.length > 0);

  const groundTex = useMemo(() => {
    if (groundType === 'tarmac_runway' || groundType === 'wet_city_asphalt') {
      return getTarmacAsphaltTexture(palette.groundPrimary, palette.groundSecondary);
    }
    if (groundType === 'cobblestone_courtyard' || groundType === 'flagstone_sanctuary') {
      return getCobblestoneTexture(palette.groundPrimary, palette.groundSecondary);
    }
    if (groundType === 'timber_pier_water') {
      return getTimberDeckTexture(palette.groundPrimary);
    }
    // For vertex-colored sculpted mountain/valley terrain, use neutral high-albedo brushstroke detail
    // so snow caps stay bright white and granite cliffs retain their true vertex colors!
    if (isSculpted) {
      return getPainterlyTerrainTexture('#E8ECF4', '#FFFFFF');
    }
    return getPainterlyTerrainTexture(terrainProfile.meadowColor || palette.groundPrimary, palette.accentGlow);
  }, [groundType, palette, terrainProfile.meadowColor, isSculpted]);

  // High-resolution profile-driven terrain mesh with 4-zone slope & altitude biome vertex coloring
  const terrainGeo = useMemo(() => {
    const size = terrainProfile.terrainSize || 280;
    const segs = isSculpted
      ? quality === 'low'
        ? 96
        : size > 500
          ? 192
          : 128
      : 16;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    let maxHeight = Math.max(25, terrainProfile.baseAmplitude * 1.6);
    for (const pk of terrainProfile.distantPeaks) {
      maxHeight = Math.max(maxHeight, pk.height);
    }

    if (isSculpted) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = sampleTerrainHeightWithProfile(x, z, blueprint.seed, terrainProfile);
        pos.setY(i, y);
      }
      geo.computeVertexNormals();
    }

    // Compute slope & altitude vertex colors (Meadow -> Granite Rock -> Alpine Ridge -> Glacier Snow Cap)
    const normals = geo.attributes.normal as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    const meadowCol = new THREE.Color(terrainProfile.meadowColor || palette.groundPrimary);
    const rockCol = new THREE.Color(terrainProfile.rockColor || palette.structurePrimary);
    const snowCol = new THREE.Color(terrainProfile.snowColor || '#F4F8FF');
    const avgSnowLine =
      terrainProfile.distantPeaks.length > 0
        ? terrainProfile.distantPeaks.reduce((acc, p) => acc + p.snowLine, 0) /
          terrainProfile.distantPeaks.length
        : 0.65;
    const snowThresholdMeters = Math.max(22, maxHeight * avgSnowLine * 0.44);
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      if (!isSculpted) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
        continue;
      }
      const y = pos.getY(i);
      const ny = normals.getY(i); // 1 = flat, 0 = vertical cliff
      const slopeSteepness = THREE.MathUtils.clamp((0.88 - ny) / 0.48, 0, 1);
      const altFactor = THREE.MathUtils.clamp(y / Math.max(24, snowThresholdMeters), 0, 1.4);

      // Blend meadow to exposed cliff rock on steep faces or higher altitude
      const rockBlend = THREE.MathUtils.clamp(
        Math.max(slopeSteepness * 0.9, (altFactor - 0.18) * 0.9),
        0,
        1
      );
      tmp.copy(meadowCol).lerp(rockCol, rockBlend);

      // Apply gleaming white snow cap above snowThresholdMeters
      if (y > snowThresholdMeters * 0.65 && avgSnowLine < 0.98) {
        const snowHeightBlend = THREE.MathUtils.clamp(
          (y - snowThresholdMeters * 0.65) / (snowThresholdMeters * 0.35),
          0,
          1
        );
        const snowRetention = 1 - slopeSteepness * 0.25;
        tmp.lerp(snowCol, snowHeightBlend * snowRetention);
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [terrainProfile, blueprint.seed, quality, isSculpted, palette]);

  const waterMat = useMemo(
    () => createStylizedWaterMaterial('#0D233D', palette.skyHorizon),
    [palette.skyHorizon]
  );

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      waterMat.dispose();
    };
  }, [terrainGeo, waterMat]);

  useFrame(({ clock }) => {
    waterMat.uniforms.uTime.value = clock.getElapsedTime();
    waterMat.uniforms.uSkyColor.value.set(env.skyHorizonOverride ?? palette.skyHorizon);
  });

  // Execute optional custom Three.js builder code returned by agy (Gemini 4 Neon High)
  useEffect(() => {
    const group = customGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    if (!blueprint.customThreeJsCode || !blueprint.customThreeJsCode.trim()) return;

    try {
      const fn = new Function('THREE', 'group', 'palette', blueprint.customThreeJsCode);
      fn(THREE, group, palette);
    } catch {
      // Ignore malformed custom code gracefully
    }
  }, [blueprint.customThreeJsCode, palette]);

  return (
    <group name="bespoke-world">
      {/* Main Ground / Colossal Mountain Terrain Surface */}
      <mesh name="ground-plane" geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          vertexColors={isSculpted}
          map={isSculpted ? undefined : groundTex}
          color="#FFFFFF"
          roughness={groundType === 'wet_city_asphalt' ? 0.38 : 0.85}
          metalness={groundType === 'wet_city_asphalt' ? 0.25 : 0.05}
        />
      </mesh>

      {/* Tarmac Painted Taxiway Lines & Apron Threshold Markings */}
      {groundType === 'tarmac_runway' && (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
            <planeGeometry args={[0.35, 68]} />
            <meshBasicMaterial color="#FACC15" />
          </mesh>
          {[-11, 11].map((gx, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[gx, 0, -9]}>
              <planeGeometry args={[0.25, 28]} />
              <meshBasicMaterial color="#EF4444" />
            </mesh>
          ))}
        </group>
      )}

      {/* Urban Street Sidewalks, Curbs, Zebra Crosswalks & Lane Markings */}
      {groundType === 'wet_city_asphalt' && (
        <group position={[0, 0.02, 0]}>
          <mesh position={[-11.5, 0.1, -12]} receiveShadow>
            <boxGeometry args={[9, 0.2, 85]} />
            <meshStandardMaterial color="#334155" roughness={0.85} />
          </mesh>
          <mesh position={[11.5, 0.1, -12]} receiveShadow>
            <boxGeometry args={[9, 0.2, 85]} />
            <meshStandardMaterial color="#334155" roughness={0.85} />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => 16 - i * 6.5).map((lz, idx) => (
            <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, lz]}>
              <planeGeometry args={[0.22, 2.8]} />
              <meshBasicMaterial color="#FACC15" />
            </mesh>
          ))}
          {Array.from({ length: 7 }, (_, i) => -4.5 + i * 1.5).map((cx, idx) => (
            <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, 6.5]}>
              <planeGeometry args={[0.75, 3.2]} />
              <meshBasicMaterial color="#F8FAFC" />
            </mesh>
          ))}
        </group>
      )}

      {/* Courtyard Stone Inlaid Medallion Ring */}
      {groundType === 'cobblestone_courtyard' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -4.5]}>
          <ringGeometry args={[3.4, 3.85, 32]} />
          <meshStandardMaterial color={palette.structurePrimary} roughness={0.75} />
        </mesh>
      )}

      {/* Animated Water ONLY when waterLevel is explicitly present */}
      {waterLevel !== null && blueprint.hasWater && (
        <mesh
          position={[0, waterLevel, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={waterMat}
        >
          <planeGeometry args={[280, 280, 48, 48]} />
        </mesh>
      )}

      {/* Focal Hero Subject */}
      <HeroSubjectMesh hero={heroSubject} />

      {/* Detailed Compound Architectural & Environmental Elements */}
      {elements.map((el) => (
        <DetailedElementMesh
          key={el.id}
          el={el}
          palette={palette}
          isNight={isNight}
        />
      ))}

      {/* Custom Three.js Meshes Generated Dynamically by agy (Gemini 4 Neon High) */}
      <group ref={customGroupRef} name="agy-custom-meshes" />

      {/* Interactive 5-Question Reasoning Hotspots inside the 3D World */}
      {hudVisible &&
        blueprint.storyHotspots.map((spot) => {
          const isOpen = activeHotspotId === spot.id;
          return (
            <group key={spot.id} position={spot.position}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspotId(isOpen ? null : spot.id);
                }}
              >
                <octahedronGeometry args={[0.42, 0]} />
                <meshStandardMaterial
                  color="#E8A855"
                  emissive="#E8A855"
                  emissiveIntensity={2.1}
                  toneMapped={false}
                />
              </mesh>
              <Html position={[0, 0.95, 0]} center distanceFactor={20}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspotId(isOpen ? null : spot.id);
                  }}
                  className="cursor-pointer select-none rounded-xl border border-[#E8A855]/45 bg-[#090B10]/88 px-3 py-1.5 text-left shadow-2xl backdrop-blur-md transition-all hover:border-[#E8A855]"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold text-[#F3F0E8]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E8A855]" />
                    {spot.category}: {spot.title}
                  </div>
                  {isOpen && (
                    <p className="mt-1.5 max-w-[230px] border-t border-white/10 pt-1.5 text-[10px] leading-relaxed text-[#D0D5E0]">
                      {spot.description}
                    </p>
                  )}
                </div>
              </Html>
            </group>
          );
        })}

      {/* Persistent Original Photograph Frame Portal */}
      <FramePortal
        position={blueprint.portalPosition}
        rotationY={0.42}
        imageUrl={image.dataUrl}
        aspectRatio={image.width / Math.max(1, image.height)}
        label="Source Image Portal"
      />
    </group>
  );
}
