import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../store/useWorldStore';
import { PlaceableCategory, SceneObject } from '../types/world';

function PlaceableAssetMesh({
  obj,
  selected,
  onSelect,
}: {
  obj: SceneObject;
  selected: boolean;
  onSelect: () => void;
}) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.position.y += Math.sin(clock.getElapsedTime() * 2.5) * 0.002;
    }
  });

  const renderCategory = (cat: PlaceableCategory) => {
    switch (cat) {
      case 'pine_tree':
        return (
          <group>
            <mesh position={[0, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.3, 2.2, 6]} />
              <meshStandardMaterial color="#3A281E" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.8, 0]} castShadow>
              <coneGeometry args={[1.6, 3.2, 7]} />
              <meshStandardMaterial color="#1E4237" roughness={0.82} />
            </mesh>
            <mesh position={[0, 4.4, 0]} castShadow>
              <coneGeometry args={[1.1, 2.4, 7]} />
              <meshStandardMaterial color="#275446" roughness={0.8} />
            </mesh>
          </group>
        );
      case 'cypress_tree':
        return (
          <group>
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.25, 2.4, 6]} />
              <meshStandardMaterial color="#251D1A" roughness={0.9} />
            </mesh>
            <mesh position={[0, 4.3, 0]} castShadow>
              <coneGeometry args={[0.85, 6.2, 8]} />
              <meshStandardMaterial color="#122B33" roughness={0.85} />
            </mesh>
          </group>
        );
      case 'lantern':
        return (
          <group>
            <mesh position={[0, 1.25, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.12, 2.5, 6]} />
              <meshStandardMaterial color="#1F2430" metalness={0.65} roughness={0.4} />
            </mesh>
            <mesh ref={glowRef} position={[0, 2.7, 0]}>
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial
                color="#FFF0B8"
                emissive="#FFB84D"
                emissiveIntensity={2.6}
                toneMapped={false}
              />
            </mesh>
            <pointLight position={[0, 2.8, 0]} color="#FFC66B" intensity={4.5} distance={18} />
          </group>
        );
      case 'rock_cluster':
        return (
          <group>
            <mesh position={[0, 0.65, 0]} rotation={[0.2, 0.4, 0.1]} castShadow receiveShadow>
              <dodecahedronGeometry args={[1.1, 0]} />
              <meshStandardMaterial color="#555C69" roughness={0.92} />
            </mesh>
            <mesh position={[0.95, 0.35, 0.4]} rotation={[0.5, 1.1, 0]} castShadow>
              <dodecahedronGeometry args={[0.65, 0]} />
              <meshStandardMaterial color="#4A515E" roughness={0.95} />
            </mesh>
          </group>
        );
      case 'stone_bench':
        return (
          <group>
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.18, 0.72]} />
              <meshStandardMaterial color="#7B7E85" roughness={0.85} />
            </mesh>
            <mesh position={[-0.85, 0.3, 0]} castShadow>
              <boxGeometry args={[0.28, 0.6, 0.6]} />
              <meshStandardMaterial color="#656970" roughness={0.9} />
            </mesh>
            <mesh position={[0.85, 0.3, 0]} castShadow>
              <boxGeometry args={[0.28, 0.6, 0.6]} />
              <meshStandardMaterial color="#656970" roughness={0.9} />
            </mesh>
          </group>
        );
      case 'crystal_monolith':
        return (
          <group>
            <mesh position={[0, 2.2, 0]} castShadow>
              <octahedronGeometry args={[0.95, 0]} />
              <meshStandardMaterial
                color="#A699FF"
                emissive="#7A6BFF"
                emissiveIntensity={1.6}
                roughness={0.18}
                metalness={0.3}
                toneMapped={false}
              />
            </mesh>
            <pointLight position={[0, 2.2, 0]} color="#9F8FFF" intensity={4} distance={16} />
          </group>
        );
      case 'portal_arch':
        return (
          <group>
            <mesh position={[-1.7, 2.3, 0]} castShadow>
              <boxGeometry args={[0.7, 4.6, 0.85]} />
              <meshStandardMaterial color="#373E4F" roughness={0.82} />
            </mesh>
            <mesh position={[1.7, 2.3, 0]} castShadow>
              <boxGeometry args={[0.7, 4.6, 0.85]} />
              <meshStandardMaterial color="#373E4F" roughness={0.82} />
            </mesh>
            <mesh position={[0, 4.8, 0]} castShadow>
              <boxGeometry args={[4.6, 0.75, 0.95]} />
              <meshStandardMaterial color="#2D3342" roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <planeGeometry args={[2.7, 4.2]} />
              <meshStandardMaterial
                color="#8B7BFF"
                emissive="#8B7BFF"
                emissiveIntensity={1.25}
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      case 'campfire':
        return (
          <group>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh
                key={i}
                position={[Math.cos((i / 6) * Math.PI * 2) * 0.75, 0.16, Math.sin((i / 6) * Math.PI * 2) * 0.75]}
              >
                <dodecahedronGeometry args={[0.24, 0]} />
                <meshStandardMaterial color="#4D5057" roughness={0.95} />
              </mesh>
            ))}
            <mesh ref={glowRef} position={[0, 0.55, 0]}>
              <coneGeometry args={[0.42, 1.1, 6]} />
              <meshStandardMaterial
                color="#FFD073"
                emissive="#FF7A29"
                emissiveIntensity={2.8}
                toneMapped={false}
              />
            </mesh>
            <pointLight position={[0, 1.2, 0]} color="#FF8C3A" intensity={6} distance={20} />
          </group>
        );
    }
  };

  return (
    <group
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {renderCategory(obj.category)}
      {selected && (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.55, 24]} />
          <meshBasicMaterial color="#8B7BFF" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function InteractiveObjects() {
  const { camera, scene, gl } = useThree();
  const objects = useWorldStore((s) => s.objects);
  const selectedObjectId = useWorldStore((s) => s.selectedObjectId);
  const memories = useWorldStore((s) => s.memories);
  const activeMemoryId = useWorldStore((s) => s.activeMemoryId);
  const hudVisible = useWorldStore((s) => s.hudVisible);

  // Click-to-place handler when activeTool === 'create'
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const store = useWorldStore.getState();
      if (store.activeTool !== 'create' || store.pointerLocked) return;

      const rect = dom.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const ground = scene.getObjectByName('ground-plane');
      if (!ground) return;

      const hits = raycaster.intersectObject(ground, false);
      if (hits.length > 0) {
        const pt = hits[0].point;
        store.addObject({
          category: store.selectedPlaceable,
          position: [pt.x, pt.y, pt.z],
          rotation: [0, Math.random() * Math.PI * 2, 0],
          scale: 1,
          source: 'user',
        });
        store.showToast(`Placed ${store.selectedPlaceable.replace('_', ' ')}`);
      }
    };

    dom.addEventListener('click', onClick);
    return () => dom.removeEventListener('click', onClick);
  }, [camera, scene, gl]);

  return (
    <group name="interactive-objects">
      {/* User & Director Placed 3D Objects */}
      {objects.map((obj) => (
        <PlaceableAssetMesh
          key={obj.id}
          obj={obj}
          selected={selectedObjectId === obj.id}
          onSelect={() => useWorldStore.getState().setSelectedObjectId(obj.id)}
        />
      ))}

      {/* Memory Anchors */}
      {memories.map((mem) => {
        const isOpen = activeMemoryId === mem.id;
        return (
          <group key={mem.id} position={mem.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                useWorldStore.getState().setActiveMemoryId(isOpen ? null : mem.id);
              }}
            >
              <sphereGeometry args={[0.38, 20, 20]} />
              <meshStandardMaterial
                color="#FFE29A"
                emissive="#E8A855"
                emissiveIntensity={2.4}
                toneMapped={false}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.62, 0.03, 12, 32]} />
              <meshBasicMaterial color="#E8A855" transparent opacity={0.75} />
            </mesh>
            <pointLight color="#E8A855" intensity={3} distance={12} />

            {hudVisible && (
              <Html position={[0, 1.05, 0]} center distanceFactor={18}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorldStore.getState().setActiveMemoryId(isOpen ? null : mem.id);
                  }}
                  className="cursor-pointer select-none rounded-xl border border-[#E8A855]/45 bg-[#090B10]/90 px-3 py-2 text-left shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-[#F3F0E8]">
                    <span className="h-2 w-2 rounded-full bg-[#E8A855]" />
                    {mem.title}
                  </div>
                  {isOpen && (
                    <div className="mt-1.5 max-w-[220px] space-y-1.5 border-t border-white/10 pt-1.5">
                      <p className="text-[11px] leading-relaxed text-[#D0D4DE]">
                        {mem.description}
                      </p>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          useWorldStore.getState().removeMemory(mem.id);
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        Delete memory
                      </button>
                    </div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
