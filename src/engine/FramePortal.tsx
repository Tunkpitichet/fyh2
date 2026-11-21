import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../store/useWorldStore';

interface FramePortalProps {
  position: [number, number, number];
  rotationY?: number;
  imageUrl: string;
  aspectRatio: number;
  label: string;
}

/**
 * The signature FRAMEBREAK Frame Portal:
 * Displays the original uploaded photograph/artwork floating in 3D space at the origin viewpoint.
 * Responds to proximity and allows inspecting the source or returning to the original frame.
 */
export function FramePortal({
  position,
  rotationY = 0,
  imageUrl,
  aspectRatio,
  label,
}: FramePortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [nearby, setNearby] = useState(false);
  const hudVisible = useWorldStore((s) => s.hudVisible);

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imageUrl]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  const width = 4.6;
  const height = Math.max(2.4, Math.min(4.2, width / Math.max(0.6, aspectRatio)));

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.1) * 0.16;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
    }
    const d = camera.position.distanceTo(new THREE.Vector3(...position));
    const isNear = d < 12;
    if (isNear !== nearby) setNearby(isNear);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        useWorldStore.getState().triggerReturnToFrame();
      }}
    >
      {/* Sleek obsidian gallery bevel frame */}
      <mesh castShadow>
        <boxGeometry args={[width + 0.34, height + 0.34, 0.14]} />
        <meshStandardMaterial color="#121622" roughness={0.35} metalness={0.72} />
      </mesh>

      {/* Luminous portal energy trim */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[width + 0.42, height + 0.42, 0.06]} />
        <meshStandardMaterial
          color="#8B7BFF"
          emissive="#8B7BFF"
          emissiveIntensity={hovered || nearby ? 2.2 : 1.15}
          toneMapped={false}
        />
      </mesh>

      {/* Front original artwork plane */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.4}
          metalness={0.08}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* Back face so user can walk behind the canvas and still see the artwork */}
      <mesh position={[0, 0, -0.085]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.5}
          metalness={0.1}
          emissiveMap={texture}
          emissive="#8B7BFF"
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* Subtle orbiting light ring behind portal */}
      <mesh ref={ringRef} position={[0, 0, -0.15]}>
        <ringGeometry args={[Math.max(width, height) * 0.56, Math.max(width, height) * 0.585, 48]} />
        <meshBasicMaterial
          color="#E8A855"
          transparent
          opacity={hovered || nearby ? 0.55 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft gallery spotlight */}
      <pointLight position={[0, 0.6, 2.2]} intensity={3.5} distance={14} color="#EEDBBF" />

      {hudVisible && (nearby || hovered) && (
        <Html position={[0, height / 2 + 0.72, 0]} center distanceFactor={14}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-[#8B7BFF]/40 bg-[#0B0E17]/85 px-3 py-1 text-[11px] font-medium tracking-wide text-[#F3F0E8] shadow-xl backdrop-blur-md">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#8B7BFF]" />
            FRAME PORTAL · {label}
          </div>
        </Html>
      )}
    </group>
  );
}
