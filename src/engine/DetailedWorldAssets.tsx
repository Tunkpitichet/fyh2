import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DetailedSceneElement,
  HeroSubjectSpec,
  WorldPalette,
} from '../types/world';
import {
  getBrushedMetalTexture,
  getBuildingFacadeTextures,
  getNeonSignTexture,
  getTimberDeckTexture,
} from './textures';

/**
 * Ultra-Detailed Commercial Airliner (45+ articulated sub-components)
 */
export function DetailedAirlinerMesh({
  primaryColor = '#E8EEF5',
  secondaryColor = '#1E3A6E',
  accentColor = '#F59E0B',
  scale = 1,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  scale?: number;
}) {
  const fanLeftRef = useRef<THREE.Mesh>(null);
  const fanRightRef = useRef<THREE.Mesh>(null);
  const metalTex = useMemo(() => getBrushedMetalTexture(primaryColor), [primaryColor]);

  useFrame((_, dt) => {
    if (fanLeftRef.current) fanLeftRef.current.rotation.z += dt * 14;
    if (fanRightRef.current) fanRightRef.current.rotation.z -= dt * 14;
  });

  const windows = useMemo(() => Array.from({ length: 18 }, (_, i) => -9.5 + i * 1.05), []);

  return (
    <group scale={scale}>
      {/* Main Cylindrical Fuselage */}
      <mesh position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.95, 1.95, 22, 28]} />
        <meshStandardMaterial map={metalTex} color={primaryColor} metalness={0.45} roughness={0.28} />
      </mesh>

      {/* Belly Livery Cheatline */}
      <mesh position={[0, 3.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.97, 1.97, 21.8, 28, 1, false, Math.PI * 0.6, Math.PI * 0.8]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.35} roughness={0.35} />
      </mesh>

      {/* Aerodynamic Nose Cone & Radome */}
      <mesh position={[0, 3.45, 12.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 1.95, 3.4, 28]} />
        <meshStandardMaterial color={primaryColor} metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[0, 3.42, 14.3]} castShadow>
        <sphereGeometry args={[0.36, 16, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.4} />
      </mesh>

      {/* Cockpit Windshield Visor */}
      <mesh position={[0, 4.18, 11.85]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[1.85, 0.58, 1.4]} />
        <meshStandardMaterial
          color="#0B1324"
          emissive="#38BDF8"
          emissiveIntensity={0.55}
          metalness={0.85}
          roughness={0.12}
        />
      </mesh>

      {/* Tapered Tail Cone & APU Exhaust */}
      <mesh position={[0, 3.85, -13.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.95, 0.35, 5.0, 24]} />
        <meshStandardMaterial color={primaryColor} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Illuminated Passenger Cabin Windows (Port & Starboard) */}
      {windows.map((z, idx) => (
        <group key={idx} position={[0, 3.85, z]}>
          <mesh position={[1.94, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.34, 0.46]} />
            <meshStandardMaterial
              color="#FFF3C4"
              emissive="#FFCA64"
              emissiveIntensity={2.1}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[-1.94, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.34, 0.46]} />
            <meshStandardMaterial
              color="#FFF3C4"
              emissive="#FFCA64"
              emissiveIntensity={2.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Swept Starboard & Port Main Wings */}
      <mesh position={[7.8, 3.1, -0.8]} rotation={[0, -0.32, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[14.5, 0.24, 3.4]} />
        <meshStandardMaterial map={metalTex} color="#D5DCE6" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[-7.8, 3.1, -0.8]} rotation={[0, 0.32, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[14.5, 0.24, 3.4]} />
        <meshStandardMaterial map={metalTex} color="#D5DCE6" metalness={0.55} roughness={0.28} />
      </mesh>

      {/* Angled Winglets + Navigation Strobes */}
      <mesh position={[14.6, 4.1, -3.1]} rotation={[0, -0.25, -0.22]} castShadow>
        <boxGeometry args={[0.18, 2.1, 1.3]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.4} roughness={0.3} />
      </mesh>
      <pointLight position={[15.0, 4.5, -3.1]} color="#22C55E" intensity={4} distance={14} />

      <mesh position={[-14.6, 4.1, -3.1]} rotation={[0, 0.25, 0.22]} castShadow>
        <boxGeometry args={[0.18, 2.1, 1.3]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.4} roughness={0.3} />
      </mesh>
      <pointLight position={[-15.0, 4.5, -3.1]} color="#EF4444" intensity={4} distance={14} />

      {/* Twin Under-Wing High-Bypass Turbofan Engines */}
      {[-5.4, 5.4].map((xPos, idx) => (
        <group key={idx} position={[xPos, 2.1, 1.1]}>
          {/* Nacelle Cowling */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.05, 0.92, 3.4, 24]} />
            <meshStandardMaterial color={secondaryColor} metalness={0.45} roughness={0.28} />
          </mesh>
          {/* Chrome Intake Lip Ring */}
          <mesh position={[0, 0, 1.72]}>
            <torusGeometry args={[0.98, 0.09, 12, 24]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.15} />
          </mesh>
          {/* Spinning Turbofan Blades */}
          <mesh
            ref={idx === 0 ? fanLeftRef : fanRightRef}
            position={[0, 0, 1.55]}
          >
            <circleGeometry args={[0.92, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.75} roughness={0.3} />
          </mesh>
          {/* Engine Pylon Strut */}
          <mesh position={[0, 0.85, -0.4]} castShadow>
            <boxGeometry args={[0.35, 1.1, 2.2]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Vertical Tail Stabilizer & Livery Fin */}
      <mesh position={[0, 7.6, -12.6]} rotation={[-0.38, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 6.4, 3.6]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0, 8.2, -12.8]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[0.32, 2.4, 1.8]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Horizontal Tail Stabilizers */}
      <mesh position={[3.2, 4.1, -13.2]} rotation={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[6.2, 0.16, 1.8]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-3.2, 4.1, -13.2]} rotation={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[6.2, 0.16, 1.8]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Nose & Main Landing Gear Assemblies */}
      <group position={[0, 0.9, 10.6]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.5, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
        {[-0.28, 0.28].map((wx, i) => (
          <mesh key={i} position={[wx, -0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.24, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.9} />
          </mesh>
        ))}
        {/* Nose Gear Taxi Spotlight */}
        <pointLight position={[0, 0.5, 0.6]} color="#FFFBEB" intensity={8} distance={26} />
      </group>

      {[-2.8, 2.8].map((gx, gi) => (
        <group key={gi} position={[gx, 0.9, -0.8]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 1.7, 10]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
          </mesh>
          {[-0.4, 0.4].map((wx) =>
            [-0.55, 0.55].map((wz, wi) => (
              <mesh
                key={`${wx}-${wi}`}
                position={[wx, -0.3, wz]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.58, 0.58, 0.32, 16]} />
                <meshStandardMaterial color="#111827" roughness={0.9} />
              </mesh>
            ))
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * Detailed 3D Cat / Pet Sanctuary Focal Piece on a Sunlit Courtyard Terrace Plinth
 * (So uploading a cat photo creates a charming, detailed cat living inside a rich garden courtyard!)
 */
export function DetailedCompanionSanctuaryMesh({
  primaryColor = '#E07A3C',
  secondaryColor = '#F5EBE1',
  accentColor = '#D97706',
  isDog = false,
  scale = 1,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  isDog?: boolean;
  scale?: number;
}) {
  const tailRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 2.4) * 0.24;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.9) * 0.14;
    }
  });

  return (
    <group scale={scale}>
      {/* Carved Octagonal Limestone Garden Plinth & Sun-warmed Terrace Step */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.6, 2.9, 0.5, 8]} />
        <meshStandardMaterial color="#8C8275" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.95, 0.35, 8]} />
        <meshStandardMaterial color="#A3988B" roughness={0.82} />
      </mesh>

      {/* Velvet Garden Cushion & Woven Rug */}
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.22, 24]} />
        <meshStandardMaterial color={accentColor} roughness={0.75} />
      </mesh>

      {/* Ceramic Water Bowl & Terracotta Herb Pot beside the Cat */}
      <group position={[1.1, 0.85, 0.55]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.2, 0.16, 18]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 18]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.1} metalness={0.2} />
        </mesh>
      </group>

      {/* Articulated 3D Cat / Companion Figure */}
      <group position={[0, 1.05, 0.05]} scale={1.25}>
        {/* Torso & Haunches */}
        <mesh position={[0, 0.42, -0.15]} castShadow>
          <capsuleGeometry args={[0.34, 0.52, 12, 16]} />
          <meshStandardMaterial color={primaryColor} roughness={0.72} />
        </mesh>
        {/* White Chest Bib */}
        <mesh position={[0, 0.45, 0.14]} castShadow>
          <sphereGeometry args={[0.27, 14, 14]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.78} />
        </mesh>

        {/* Four Paws */}
        {[-0.18, 0.18].map((px, i) => (
          <group key={i}>
            <mesh position={[px, 0.18, 0.22]} castShadow>
              <cylinderGeometry args={[0.08, 0.09, 0.36, 10]} />
              <meshStandardMaterial color={primaryColor} roughness={0.75} />
            </mesh>
            <mesh position={[px, 0.06, 0.28]} castShadow>
              <sphereGeometry args={[0.095, 10, 10]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Collar & Golden Bell */}
        <mesh position={[0, 0.72, 0.18]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.24, 0.035, 10, 20]} />
          <meshStandardMaterial color="#DC2626" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.65, 0.42]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshStandardMaterial
            color="#FBBF24"
            emissive="#F59E0B"
            emissiveIntensity={0.8}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>

        {/* Animated Head, Ears, Eyes, Snout & Whiskers */}
        <group ref={headRef} position={[0, 0.96, 0.24]}>
          <mesh castShadow>
            <sphereGeometry args={[0.31, 18, 18]} />
            <meshStandardMaterial color={primaryColor} roughness={0.7} />
          </mesh>
          {/* Muzzle / Cheeks */}
          <mesh position={[-0.09, -0.06, 0.26]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.75} />
          </mesh>
          <mesh position={[0.09, -0.06, 0.26]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.75} />
          </mesh>
          {/* Pink Nose */}
          <mesh position={[0, 0.0, 0.34]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#F472B6" roughness={0.4} />
          </mesh>
          {/* Luminous Eyes & Pupils */}
          {[-0.12, 0.12].map((ex, i) => (
            <group key={i} position={[ex, 0.07, 0.27]}>
              <mesh>
                <sphereGeometry args={[0.058, 12, 12]} />
                <meshStandardMaterial
                  color="#A3E635"
                  emissive="#84CC16"
                  emissiveIntensity={0.9}
                />
              </mesh>
              <mesh position={[0, 0, 0.042]}>
                <sphereGeometry args={[0.026, 8, 8]} />
                <meshBasicMaterial color="#090B10" />
              </mesh>
            </group>
          ))}
          {/* Pointed Ears */}
          {[-0.19, 0.19].map((earX, i) => (
            <group
              key={i}
              position={[earX, 0.28, -0.02]}
              rotation={[0.1, 0, earX < 0 ? 0.32 : -0.32]}
            >
              <mesh castShadow>
                <coneGeometry args={[0.13, isDog ? 0.22 : 0.28, 4]} />
                <meshStandardMaterial color={primaryColor} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.01, 0.04]}>
                <coneGeometry args={[0.075, 0.18, 4]} />
                <meshStandardMaterial color="#F9A8D4" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Swaying Curved Tail */}
        <mesh
          ref={tailRef}
          position={[0, 0.45, -0.52]}
          rotation={[-0.75, 0, 0]}
          castShadow
        >
          <capsuleGeometry args={[0.065, 0.65, 8, 12]} />
          <meshStandardMaterial color={primaryColor} roughness={0.75} />
        </mesh>
      </group>

      {/* Warm Garden Spotlight */}
      <pointLight position={[0, 2.8, 1.2]} color="#FFE4B5" intensity={4.5} distance={14} />
    </group>
  );
}

/**
 * Detailed 3D Sports / Grand Tourer Vehicle
 */
export function DetailedVehicleMesh({
  primaryColor = '#DC2626',
  secondaryColor = '#111827',
  scale = 1,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  scale?: number;
}) {
  return (
    <group scale={scale}>
      {/* Lower Sculpted Body */}
      <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.62, 4.6]} />
        <meshStandardMaterial color={primaryColor} metalness={0.65} roughness={0.22} />
      </mesh>
      {/* Cabin Greenhouse */}
      <mesh position={[0, 1.05, -0.25]} castShadow>
        <boxGeometry args={[1.76, 0.52, 2.3]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.8} roughness={0.15} />
      </mesh>
      {/* 4 Wheels with Alloy Rims */}
      {[
        [-1.06, 0.38, 1.4],
        [1.06, 0.38, 1.4],
        [-1.06, 0.38, -1.4],
        [1.06, 0.38, -1.4],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.28, 18]} />
            <meshStandardMaterial color="#0F172A" roughness={0.88} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.3, 12]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Glowing LED Headlights */}
      {[-0.72, 0.72].map((hx, i) => (
        <mesh key={i} position={[hx, 0.62, 2.31]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#E0F2FE"
            emissiveIntensity={2.8}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Full-width LED Taillight Bar */}
      <mesh position={[0, 0.66, -2.31]}>
        <boxGeometry args={[1.86, 0.14, 0.04]} />
        <meshStandardMaterial
          color="#FCA5A5"
          emissive="#EF4444"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Detailed High-Altitude Alpine Ridge Cairn, Glacial Boulder Outcrop & Weathered Trail Signpost
 * (Used as focal foreground anchor for pure mountain / wilderness vistas without adding unwanted houses!)
 */
export function DetailedMountainCairnOverlookMesh({
  primaryColor = '#64748B',
  secondaryColor = '#475569',
  accentColor = '#F59E0B',
  scale = 1,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  scale?: number;
}) {
  return (
    <group scale={scale}>
      {/* Fractured Granite Outcrop Base */}
      <mesh position={[0, 0.45, 0]} rotation={[0.1, 0.4, -0.05]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.65, 1]} />
        <meshStandardMaterial color={primaryColor} roughness={0.92} />
      </mesh>
      <mesh position={[-1.2, 0.32, 0.5]} rotation={[0.3, 1.1, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.95} />
      </mesh>
      <mesh position={[1.15, 0.28, -0.4]} rotation={[-0.2, 0.8, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.95} />
      </mesh>

      {/* Stacked Stone Summit / Ridge Wayfinder Cairn */}
      {[
        [0, 1.25, 0, 0.65, 0.28],
        [0.03, 1.52, -0.02, 0.52, 0.24],
        [-0.02, 1.75, 0.02, 0.4, 0.22],
        [0.01, 1.95, 0, 0.28, 0.18],
        [0, 2.12, 0, 0.18, 0.16],
      ].map(([x, y, z, r, h], idx) => (
        <mesh key={idx} position={[x, y, z]} rotation={[0, idx * 0.7, 0]} castShadow>
          <cylinderGeometry args={[r * 0.85, r, h, 7]} />
          <meshStandardMaterial color={idx % 2 === 0 ? primaryColor : secondaryColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Weathered Timber Alpine Ridge Signpost & Expedition Lantern */}
      <group position={[1.85, 0, 0.35]} rotation={[0, -0.35, 0]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 2.7, 7]} />
          <meshStandardMaterial color="#452C1E" roughness={0.92} />
        </mesh>
        <mesh position={[0.42, 2.35, 0]} castShadow>
          <boxGeometry args={[1.1, 0.24, 0.08]} />
          <meshStandardMaterial color="#5C3D28" roughness={0.88} />
        </mesh>
        <mesh position={[-0.38, 2.05, 0]} rotation={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.95, 0.22, 0.08]} />
          <meshStandardMaterial color="#5C3D28" roughness={0.88} />
        </mesh>
        <mesh position={[0.25, 1.75, 0.12]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial
            color="#FFFBEB"
            emissive={accentColor}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
        <pointLight position={[0.25, 1.75, 0.2]} color={accentColor} intensity={3.5} distance={14} />
      </group>
    </group>
  );
}

/**
 * Detailed 3D Botanical Flower Cluster & Garden Planter Centerpiece
 * Renders a living multi-petal 3D blossom bouquet matched to the uploaded flower photo's petal & stamen colors.
 */
function DetailedBotanicalBloomMesh({
  primaryColor = '#E11D48',
  secondaryColor = '#2E6B3E',
  accentColor = '#FACC15',
  scale = 1,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  scale?: number;
}) {
  const bloomGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bloomGroupRef.current) {
      bloomGroupRef.current.rotation.z = Math.sin(t * 1.1) * 0.035;
      bloomGroupRef.current.rotation.x = Math.cos(t * 0.85) * 0.025;
    }
  });

  const renderBlossomHead = (pos: [number, number, number], headScale: number, tilt: [number, number, number]) => (
    <group position={pos} scale={headScale} rotation={tilt}>
      {/* Sepal calyx cup */}
      <mesh position={[0, -0.14, 0]} castShadow>
        <coneGeometry args={[0.28, 0.34, 7]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.75} />
      </mesh>
      {/* Outer ring of 8 lush cupped petals */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={`outer-${i}`} rotation={[0, a, 0]}>
            <mesh position={[0.42, 0.08, 0]} rotation={[0, 0, -0.58]} scale={[1.15, 0.22, 0.65]} castShadow>
              <sphereGeometry args={[0.46, 14, 10]} />
              <meshStandardMaterial color={primaryColor} roughness={0.48} metalness={0.05} />
            </mesh>
          </group>
        );
      })}
      {/* Inner ring of 6 raised petals */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.25;
        return (
          <group key={`inner-${i}`} rotation={[0, a, 0]}>
            <mesh position={[0.24, 0.22, 0]} rotation={[0, 0, -0.95]} scale={[0.85, 0.18, 0.52]} castShadow>
              <sphereGeometry args={[0.38, 12, 10]} />
              <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.18} roughness={0.42} />
            </mesh>
          </group>
        );
      })}
      {/* Glowing golden stamen & pollen crown */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 14]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.75}
          roughness={0.5}
        />
      </mesh>
    </group>
  );

  return (
    <group scale={scale}>
      {/* Carved Botanical Limestone Planter Bed */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.1, 2.35, 0.64, 16]} />
        <meshStandardMaterial color="#8E867B" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.22, 2.15, 0.14, 16]} />
        <meshStandardMaterial color="#A69F95" roughness={0.8} />
      </mesh>
      {/* Rich Dark Garden Soil Mound */}
      <mesh position={[0, 0.65, 0]} receiveShadow>
        <cylinderGeometry args={[1.88, 1.95, 0.16, 16]} />
        <meshStandardMaterial color="#3B291E" roughness={0.95} />
      </mesh>

      {/* Gently Swaying 3D Botanical Flower Stems, Leaves & Multi-Petal Blooms */}
      <group ref={bloomGroupRef} position={[0, 0.72, 0]}>
        {/* Main Tall Center Stem */}
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.11, 2.7, 10]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} />
        </mesh>
        {/* Flanking Curved Stems */}
        <mesh position={[-0.62, 1.0, 0.32]} rotation={[0.18, 0, 0.28]} castShadow>
          <cylinderGeometry args={[0.055, 0.085, 2.05, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.64, 0.95, -0.25]} rotation={[-0.14, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.055, 0.085, 1.95, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.18, 0.82, 0.58]} rotation={[0.32, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 1.68, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} />
        </mesh>

        {/* Sculpted Botanical Leaves around Base */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={`leaf-${i}`} rotation={[0, a, 0]}>
              <mesh position={[0.68, 0.48 + (i % 2) * 0.3, 0]} rotation={[0, 0, -0.45]} scale={[1.4, 0.12, 0.55]} castShadow>
                <sphereGeometry args={[0.52, 12, 8]} />
                <meshStandardMaterial color={secondaryColor} roughness={0.72} />
              </mesh>
            </group>
          );
        })}

        {/* Primary Focal Bloom + 3 Companion Blooms */}
        {renderBlossomHead([0, 2.72, 0], 1.35, [0.22, 0, 0])}
        {renderBlossomHead([-0.92, 1.98, 0.52], 0.92, [0.35, 0.4, 0.28])}
        {renderBlossomHead([0.96, 1.88, -0.4], 0.88, [0.18, -0.5, -0.32])}
        {renderBlossomHead([0.28, 1.62, 0.88], 0.8, [0.48, 0.2, -0.15])}
      </group>

      <pointLight position={[0, 3.8, 1.4]} color="#FFF5DB" intensity={3.2} distance={14} />
    </group>
  );
}

/**
 * Renders the focal Hero Subject determined by agy
 */
export function HeroSubjectMesh({ hero }: { hero: HeroSubjectSpec }) {
  return (
    <group position={hero.position} rotation={[0, hero.rotationY, 0]}>
      {hero.kind === 'airliner' ? (
        <DetailedAirlinerMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          accentColor={hero.accentColor}
          scale={hero.scale}
        />
      ) : hero.kind === 'botanical_bloom' ? (
        <DetailedBotanicalBloomMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          accentColor={hero.accentColor}
          scale={hero.scale}
        />
      ) : hero.kind === 'cat_creature' || hero.kind === 'dog_creature' ? (
        <DetailedCompanionSanctuaryMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          accentColor={hero.accentColor}
          isDog={hero.kind === 'dog_creature'}
          scale={hero.scale}
        />
      ) : hero.kind === 'sports_car' ? (
        <DetailedVehicleMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          scale={hero.scale * 1.35}
        />
      ) : hero.kind === 'mountain_cairn' ? (
        <DetailedMountainCairnOverlookMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          accentColor={hero.accentColor}
          scale={hero.scale}
        />
      ) : (
        <DetailedBotanicalBloomMesh
          primaryColor={hero.primaryColor}
          secondaryColor={hero.secondaryColor}
          accentColor={hero.accentColor}
          scale={hero.scale * 0.9}
        />
      )}
    </group>
  );
}

/**
 * Renders any of the 25+ high-detail compound architectural/environmental elements
 */
export function DetailedElementMesh({
  el,
  palette,
  isNight,
}: {
  el: DetailedSceneElement;
  palette: WorldPalette;
  isNight: boolean;
}) {
  const radarRef = useRef<THREE.Mesh>(null);
  const beaconBeamRef = useRef<THREE.Group>(null);

  const facade = useMemo(
    () => getBuildingFacadeTextures(el.primaryColor || palette.structurePrimary, el.lit ?? true),
    [el.primaryColor, palette.structurePrimary, el.lit]
  );

  const signTex = useMemo(
    () =>
      el.signText
        ? getNeonSignTexture(el.signText, '#0D1322', el.accentColor || palette.accentGlow)
        : null,
    [el.signText, el.accentColor, palette.accentGlow]
  );

  const timberTex = useMemo(() => getTimberDeckTexture('#5A4231'), []);

  useFrame((_, dt) => {
    if (radarRef.current) radarRef.current.rotation.y += dt * 1.8;
    if (beaconBeamRef.current) beaconBeamRef.current.rotation.y += dt * 0.85;
  });

  const [sx, sy, sz] = el.scale;

  switch (el.kind) {
    case 'airliner_jet':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]}>
          <DetailedAirlinerMesh
            primaryColor={el.primaryColor}
            secondaryColor={el.secondaryColor}
            accentColor={el.accentColor}
            scale={sx}
          />
        </group>
      );

    case 'control_tower':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          {/* Concrete Shaft & Flared Ribs */}
          <mesh position={[0, 12, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.3, 3.2, 24, 8]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.78} />
          </mesh>
          {/* Service Gallery Deck */}
          <mesh position={[0, 24.4, 0]} castShadow>
            <cylinderGeometry args={[4.4, 3.4, 1.2, 8]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.6} />
          </mesh>
          {/* 360° Angled Observation Glass Cab */}
          <mesh position={[0, 26.4, 0]}>
            <cylinderGeometry args={[4.8, 4.1, 2.8, 12]} />
            <meshStandardMaterial
              color="#0F172A"
              emissive="#38BDF8"
              emissiveIntensity={1.1}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>
          {/* Roof Cap & Rotating Radar Dish */}
          <mesh position={[0, 28.1, 0]} castShadow>
            <cylinderGeometry args={[3.8, 4.9, 0.7, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.65} />
          </mesh>
          <mesh ref={radarRef} position={[0, 29.4, 0]} castShadow>
            <boxGeometry args={[3.4, 0.7, 0.35]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.65} roughness={0.3} />
          </mesh>
          <pointLight position={[0, 30.8, 0]} color="#EF4444" intensity={6} distance={36} />
        </group>
      );

    case 'boarding_stairs':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[2.2, 0.9, 5.2]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.2, -0.4]} rotation={[0.52, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 0.3, 4.8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Yellow Safety Rails */}
          <mesh position={[0.82, 2.6, -0.4]} rotation={[0.52, 0, 0]}>
            <boxGeometry args={[0.08, 0.75, 4.8]} />
            <meshStandardMaterial color="#FACC15" roughness={0.4} />
          </mesh>
          <mesh position={[-0.82, 2.6, -0.4]} rotation={[0.52, 0, 0]}>
            <boxGeometry args={[0.08, 0.75, 4.8]} />
            <meshStandardMaterial color="#FACC15" roughness={0.4} />
          </mesh>
        </group>
      );

    case 'service_truck':
    case 'parked_vehicle':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]}>
          <DetailedVehicleMesh
            primaryColor={el.primaryColor}
            secondaryColor={el.secondaryColor}
            scale={sx}
          />
        </group>
      );

    case 'runway_light_array':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]}>
          {Array.from({ length: 12 }, (_, i) => -28 + i * 5.2).map((zPos, idx) => (
            <group key={idx} position={[0, 0.18, zPos]}>
              <mesh>
                <sphereGeometry args={[0.2, 10, 10]} />
                <meshStandardMaterial
                  color={el.accentColor}
                  emissive={el.accentColor}
                  emissiveIntensity={3.2}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'city_building_tower':
    case 'city_shopfront_block': {
      const h = (el.stories ?? 5) * 3.4;
      const w = 7.2 * sx;
      const d = 6.8 * sz;
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]}>
          {/* Main Architectural Volume */}
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              map={facade.map}
              emissiveMap={facade.emissiveMap}
              emissive="#FFBE6B"
              emissiveIntensity={isNight ? 1.35 : 0.45}
              roughness={0.78}
            />
          </mesh>

          {/* Ground-Floor Illuminated Storefront & Awning */}
          <mesh position={[0, 1.5, d / 2 + 0.06]}>
            <planeGeometry args={[w * 0.78, 2.4]} />
            <meshStandardMaterial
              color="#FFF7D6"
              emissive={el.accentColor}
              emissiveIntensity={1.1}
            />
          </mesh>
          <mesh position={[0, 2.85, d / 2 + 0.65]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[w * 0.84, 0.14, 1.3]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.65} />
          </mesh>

          {/* Cornice Crown & Rooftop Mechanical HVAC Units */}
          <mesh position={[0, h + 0.25, 0]} castShadow>
            <boxGeometry args={[w + 0.45, 0.5, d + 0.45]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.7} />
          </mesh>
          <mesh position={[w * 0.2, h + 1.1, -d * 0.15]} castShadow>
            <boxGeometry args={[1.8, 1.3, 1.8]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
          </mesh>

          {/* Vertical Glowing Neon Sign attached to facade if signText provided */}
          {signTex && (
            <mesh position={[w / 2 + 0.45, Math.min(h - 2.5, 6.5), d * 0.25]}>
              <boxGeometry args={[0.85, 3.2, 0.22]} />
              <meshStandardMaterial
                map={signTex}
                emissiveMap={signTex}
                emissive="#FFFFFF"
                emissiveIntensity={1.8}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      );
    }

    case 'neon_sign_board':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh castShadow>
            <boxGeometry args={[4.4, 1.35, 0.24]} />
            <meshStandardMaterial
              map={signTex ?? undefined}
              emissiveMap={signTex ?? undefined}
              color="#FFFFFF"
              emissive={el.accentColor}
              emissiveIntensity={1.85}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0, 0, 0.8]} color={el.accentColor} intensity={3.5} distance={14} />
        </group>
      );

    case 'streetlamp':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 2.4, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 4.8, 8]} />
            <meshStandardMaterial color="#1E293B" metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[0.45, 4.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
            <meshStandardMaterial color="#1E293B" metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[0.9, 4.55, 0]}>
            <sphereGeometry args={[0.24, 12, 12]} />
            <meshStandardMaterial
              color="#FFFBEB"
              emissive={el.accentColor}
              emissiveIntensity={2.8}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0.9, 4.3, 0]} color={el.accentColor} intensity={4} distance={18} />
        </group>
      );

    case 'courtyard_arcade_wall':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          {/* Stucco Villa Facade Wall */}
          <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.5, 6.8, 0.85]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.86} />
          </mesh>
          {/* Terracotta Tiled Eave Cornice */}
          <mesh position={[0, 7.0, 0.25]} rotation={[0.22, 0, 0]} castShadow>
            <boxGeometry args={[10.9, 0.35, 1.4]} />
            <meshStandardMaterial color="#9A3412" roughness={0.75} />
          </mesh>
          {/* Louvered Wooden Shutters & Warm Windows */}
          {[-3.2, 0, 3.2].map((wx, idx) => (
            <group key={idx} position={[wx, 4.4, 0.45]}>
              <mesh>
                <planeGeometry args={[1.1, 1.65]} />
                <meshStandardMaterial
                  color="#FFF3C4"
                  emissive="#F59E0B"
                  emissiveIntensity={1.4}
                />
              </mesh>
              <mesh position={[-0.74, 0, 0.04]}>
                <boxGeometry args={[0.34, 1.68, 0.06]} />
                <meshStandardMaterial color={el.secondaryColor} roughness={0.75} />
              </mesh>
              <mesh position={[0.74, 0, 0.04]}>
                <boxGeometry args={[0.34, 1.68, 0.06]} />
                <meshStandardMaterial color={el.secondaryColor} roughness={0.75} />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'stone_fountain':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.8, 3.0, 0.9, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[2.45, 2.45, 0.1, 16]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive="#0284C7"
              emissiveIntensity={0.45}
              roughness={0.12}
              metalness={0.25}
            />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.65, 1.8, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.35, 0]} castShadow>
            <cylinderGeometry args={[1.35, 0.55, 0.35, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.8} />
          </mesh>
        </group>
      );

    case 'cafe_terrace_table':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          {/* Bistro Table */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.25, 1.1, 10]} />
            <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.12, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 0.95, 0.08, 20]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.35} />
          </mesh>
          {/* Café Umbrella Parasol */}
          <mesh position={[0, 2.1, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.1, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 3.15, 0]} castShadow>
            <coneGeometry args={[2.1, 0.85, 10]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.7} />
          </mesh>
          {/* Warm Table Lantern */}
          <mesh position={[0.2, 1.26, 0.1]}>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 10]} />
            <meshStandardMaterial
              color="#FFFBEB"
              emissive="#F59E0B"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
        </group>
      );

    case 'terracotta_planter':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.68, 0.46, 1.1, 14]} />
            <meshStandardMaterial color="#B45309" roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <dodecahedronGeometry args={[0.92, 1]} />
            <meshStandardMaterial color={palette.foliageColor} roughness={0.78} />
          </mesh>
          {[-0.35, 0.32, 0.05].map((bx, i) => (
            <mesh key={i} position={[bx, 1.95 + i * 0.1, (i - 1) * 0.28]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshStandardMaterial
                color={el.accentColor}
                emissive={el.accentColor}
                emissiveIntensity={0.4}
              />
            </mesh>
          ))}
        </group>
      );

    case 'string_light_span':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]}>
          {Array.from({ length: 9 }, (_, i) => -8 + i * 2).map((lx, idx) => {
            const sag = Math.cos((idx / 8 - 0.5) * Math.PI) * -0.85;
            return (
              <mesh key={idx} position={[lx, 5.4 + sag, 0]}>
                <sphereGeometry args={[0.14, 10, 10]} />
                <meshStandardMaterial
                  color="#FFFBEB"
                  emissive="#FBBF24"
                  emissiveIntensity={2.8}
                  toneMapped={false}
                />
              </mesh>
            );
          })}
          <pointLight position={[0, 4.6, 0]} color="#FBBF24" intensity={4} distance={20} />
        </group>
      );

    case 'temple_pavilion':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          {/* Stone Podium */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[9.2, 1.2, 7.6]} />
            <meshStandardMaterial color="#64748B" roughness={0.88} />
          </mesh>
          {/* Vermilion Timber Columns */}
          {[
            [-3.6, 3.1, 2.8],
            [3.6, 3.1, 2.8],
            [-3.6, 3.1, -2.8],
            [3.6, 3.1, -2.8],
          ].map((cPos, idx) => (
            <mesh key={idx} position={cPos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.28, 0.32, 3.8, 12]} />
              <meshStandardMaterial color={el.primaryColor} roughness={0.55} />
            </mesh>
          ))}
          {/* Sanctuary Inner Chamber */}
          <mesh position={[0, 3.1, 0]} castShadow>
            <boxGeometry args={[6.2, 3.6, 4.8]} />
            <meshStandardMaterial
              map={facade.map}
              emissiveMap={facade.emissiveMap}
              emissive="#FFBE6B"
              emissiveIntensity={1.2}
            />
          </mesh>
          {/* Double-Tiered Curved Pagoda Roofs */}
          <mesh position={[0, 5.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[7.4, 2.2, 4]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, 7.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[5.2, 2.1, 4]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.65} />
          </mesh>
        </group>
      );

    case 'stone_torii_arch':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[-2.4, 2.8, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 5.6, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.65} />
          </mesh>
          <mesh position={[2.4, 2.8, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 5.6, 12]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, 5.7, 0]} castShadow>
            <boxGeometry args={[7.2, 0.55, 0.75]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 4.65, 0]} castShadow>
            <boxGeometry args={[5.8, 0.36, 0.52]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.65} />
          </mesh>
        </group>
      );

    case 'harbor_lighthouse':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 8, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.6, 2.8, 16, 16]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, 16.5, 0]} castShadow>
            <cylinderGeometry args={[2.2, 1.8, 1.0, 16]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 18.2, 0]}>
            <cylinderGeometry args={[1.35, 1.35, 2.4, 12]} />
            <meshStandardMaterial
              color="#FFFBEB"
              emissive="#FDE047"
              emissiveIntensity={2.6}
              toneMapped={false}
            />
          </mesh>
          {/* Rotating Dual Searchlight Beams */}
          <group ref={beaconBeamRef} position={[0, 18.2, 0]}>
            <mesh position={[0, 0, 14]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[3.6, 28, 16, 1, true]} />
              <meshBasicMaterial
                color="#FEF08A"
                transparent
                opacity={0.14}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
          <pointLight position={[0, 18.5, 0]} color="#FEF08A" intensity={9} distance={55} />
        </group>
      );

    case 'sailing_vessel':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          {/* Hull */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[3.4, 1.4, 10.5]} />
            <meshStandardMaterial map={timberTex} color={el.primaryColor} roughness={0.78} />
          </mesh>
          {/* Cabin with Lit Portholes */}
          <mesh position={[0, 1.85, -0.8]} castShadow>
            <boxGeometry args={[2.4, 1.1, 4.2]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.65} />
          </mesh>
          {/* Twin Masts & Sails */}
          {[-2.2, 2.4].map((mz, idx) => (
            <group key={idx} position={[0, 5.2, mz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.1, 0.16, 8.6, 8]} />
                <meshStandardMaterial color="#78350F" roughness={0.85} />
              </mesh>
              <mesh position={[0, 1.1, 0.35]} castShadow>
                <boxGeometry args={[3.6, 4.4, 0.08]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
              </mesh>
            </group>
          ))}
          <pointLight position={[0, 2.5, 4.5]} color="#FBBF24" intensity={4} distance={16} />
        </group>
      );

    case 'arched_bridge':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.55, 13.5]} />
            <meshStandardMaterial map={timberTex} color={el.primaryColor} roughness={0.82} />
          </mesh>
          <mesh position={[-2.0, 2.45, 0]} castShadow>
            <boxGeometry args={[0.35, 0.9, 13.5]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.85} />
          </mesh>
          <mesh position={[2.0, 2.45, 0]} castShadow>
            <boxGeometry args={[0.35, 0.9, 13.5]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.85} />
          </mesh>
        </group>
      );

    case 'timber_cottage':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 4.6, 4.6]} />
            <meshStandardMaterial
              map={facade.map}
              emissiveMap={facade.emissiveMap}
              emissive="#FFBE6B"
              emissiveIntensity={isNight ? 1.4 : 0.45}
              roughness={0.82}
            />
          </mesh>
          <mesh position={[0, 5.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[4.2, 2.8, 4]} />
            <meshStandardMaterial color={el.secondaryColor} roughness={0.75} />
          </mesh>
        </group>
      );

    case 'cypress_tree':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.28, 2.4, 6]} />
            <meshStandardMaterial color="#2D231E" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.4, 0]} castShadow>
            <coneGeometry args={[0.92, 6.4, 8]} />
            <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.82} />
          </mesh>
        </group>
      );

    case 'pine_tree':
    case 'broadleaf_tree':
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.34, 2.6, 7]} />
            <meshStandardMaterial color="#3B2B22" roughness={0.92} />
          </mesh>
          {el.kind === 'pine_tree' ? (
            <>
              <mesh position={[0, 3.1, 0]} castShadow>
                <coneGeometry args={[1.7, 3.2, 8]} />
                <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.82} />
              </mesh>
              <mesh position={[0, 4.8, 0]} castShadow>
                <coneGeometry args={[1.2, 2.6, 8]} />
                <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.8} />
              </mesh>
            </>
          ) : (
            <group position={[0, 3.6, 0]}>
              <mesh castShadow>
                <dodecahedronGeometry args={[1.65, 1]} />
                <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.78} />
              </mesh>
              <mesh position={[0.85, -0.3, 0.4]} castShadow>
                <dodecahedronGeometry args={[1.1, 1]} />
                <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.8} />
              </mesh>
              <mesh position={[-0.75, 0.2, -0.35]} castShadow>
                <dodecahedronGeometry args={[1.15, 1]} />
                <meshStandardMaterial color={el.primaryColor || palette.foliageColor} roughness={0.8} />
              </mesh>
            </group>
          )}
        </group>
      );

    default:
      return (
        <group position={el.position} rotation={[0, el.rotationY, 0]} scale={[sx, sy, sz]}>
          <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.25, 0]} />
            <meshStandardMaterial color={el.primaryColor} roughness={0.92} />
          </mesh>
        </group>
      );
  }
}
