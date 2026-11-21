import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/useWorldStore';
import { sampleTerrainHeightWithProfile } from './terrainMath';

const EYE_HEIGHT = 2.15;
const GRAVITY = 24;
const JUMP_SPEED = 9.2;

export function FirstPersonController() {
  const { camera, gl } = useThree();

  const blueprint = useWorldStore((s) => s.blueprint);
  const movementMode = useWorldStore((s) => s.movementMode);
  const camSettings = useWorldStore((s) => s.camera);
  const resetCameraNonce = useWorldStore((s) => s.resetCameraNonce);
  const returnToFrameNonce = useWorldStore((s) => s.returnToFrameNonce);

  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.03);
  const velocityYRef = useRef(0);
  const groundedRef = useRef(true);
  const bobPhaseRef = useRef(0);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const telemetryTimerRef = useRef(0);

  const getSpawn = (): [number, number, number] => {
    if (blueprint) return [...blueprint.cameraSpawn];
    return [0, 2.2, 16];
  };

  const getGroundHeight = (x: number, z: number): number => {
    if (blueprint && blueprint.terrainProfile) {
      const h = sampleTerrainHeightWithProfile(x, z, blueprint.seed, blueprint.terrainProfile);
      return blueprint.waterLevel !== null && blueprint.hasWater
        ? Math.max(h, blueprint.waterLevel + 0.25)
        : h;
    }
    return 0;
  };

  useEffect(() => {
    const [sx, sy, sz] = getSpawn();
    camera.position.set(sx, sy, sz);
    yawRef.current = 0;
    pitchRef.current = -0.03;
    velocityYRef.current = 0;
    groundedRef.current = true;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitchRef.current, yawRef.current, 0);
    useWorldStore.getState().setPlayerTelemetry([sx, sy, sz], yawRef.current);
  }, [blueprint, resetCameraNonce, camera]);

  useEffect(() => {
    if (returnToFrameNonce === 0) return;
    const [sx, sy, sz] = getSpawn();
    camera.position.set(sx, sy, sz);
    yawRef.current = 0;
    pitchRef.current = -0.03;
    velocityYRef.current = 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitchRef.current, yawRef.current, 0);
    useWorldStore.getState().showToast('Returned to original frame viewpoint');
  }, [returnToFrameNonce, camera]);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = camSettings.fov;
      camera.updateProjectionMatrix();
    }
  }, [camSettings.fov, camera]);

  useEffect(() => {
    const dom = gl.domElement;

    const isTypingInInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;
      const code = e.code;
      keysRef.current.add(code);

      const store = useWorldStore.getState();
      if (store.showOnboarding && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
        store.setShowOnboarding(false);
      }

      if (code === 'KeyF') {
        store.toggleMovementMode();
        const next = useWorldStore.getState().movementMode;
        store.showToast(
          next === 'fly' ? 'Fly Mode enabled (Space/E ascend, C/Q descend)' : 'Walk Mode enabled'
        );
      } else if (code === 'KeyR') {
        store.triggerCameraReset();
        store.showToast('Camera reset to origin');
      } else if (code === 'KeyM') {
        store.toggleMinimap();
      } else if (code === 'KeyH') {
        store.toggleHud();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === dom;
      useWorldStore.getState().setPointerLocked(locked);
      if (locked) {
        useWorldStore.getState().setShowOnboarding(false);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const s = useWorldStore.getState().camera;
      const locked = document.pointerLockElement === dom;
      if (!locked && !draggingRef.current) return;

      const dx = locked ? e.movementX : e.clientX - lastPointerRef.current.x;
      const dy = locked ? e.movementY : e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const sens = 0.0022 * s.sensitivity;
      const ySign = s.invertY ? -1 : 1;
      yawRef.current -= dx * sens;
      pitchRef.current = Math.max(
        -Math.PI * 0.47,
        Math.min(Math.PI * 0.47, pitchRef.current - dy * sens * ySign)
      );
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement !== dom) {
        const activeTool = useWorldStore.getState().activeTool;
        if (activeTool !== 'create') {
          draggingRef.current = true;
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
      }
    };

    const onMouseUp = () => {
      draggingRef.current = false;
    };

    const onBlur = () => {
      keysRef.current.clear();
      draggingRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl]);

  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveVec = useRef(new THREE.Vector3());

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const keys = keysRef.current;
    const s = useWorldStore.getState();

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;
    camera.rotation.z = 0;

    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);

    if (s.movementMode === 'fly') {
      camera.getWorldDirection(forwardVec.current);
      rightVec.current.set(cosY, 0, -sinY).normalize();
    } else {
      forwardVec.current.set(-sinY, 0, -cosY).normalize();
      rightVec.current.set(cosY, 0, -sinY).normalize();
    }

    moveVec.current.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) moveVec.current.add(forwardVec.current);
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveVec.current.sub(forwardVec.current);
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveVec.current.add(rightVec.current);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveVec.current.sub(rightVec.current);

    const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const baseSpeed = s.camera.speed * (s.movementMode === 'fly' ? 1.85 : 1.0);
    const speed = baseSpeed * (sprinting ? 2.1 : 1.0);

    const isMovingHoriz = moveVec.current.lengthSq() > 0.0001;
    if (isMovingHoriz) {
      moveVec.current.normalize().multiplyScalar(speed * dt);
      camera.position.add(moveVec.current);
    }

    if (s.movementMode === 'fly') {
      if (keys.has('Space') || keys.has('KeyE')) {
        camera.position.y += speed * 0.85 * dt;
      }
      if (keys.has('KeyC') || keys.has('KeyQ') || keys.has('ControlLeft')) {
        camera.position.y -= speed * 0.85 * dt;
      }
      const floor = getGroundHeight(camera.position.x, camera.position.z) + 1.2;
      if (camera.position.y < floor) camera.position.y = floor;
      camera.position.y = Math.min(120, camera.position.y);
    } else {
      const crouch = keys.has('KeyC') || keys.has('ControlLeft');
      const eyeTarget = crouch ? EYE_HEIGHT * 0.6 : EYE_HEIGHT;
      const groundY = getGroundHeight(camera.position.x, camera.position.z) + eyeTarget;

      if (keys.has('Space') && groundedRef.current) {
        velocityYRef.current = JUMP_SPEED;
        groundedRef.current = false;
      }

      velocityYRef.current -= GRAVITY * dt;
      camera.position.y += velocityYRef.current * dt;

      if (camera.position.y <= groundY) {
        camera.position.y = groundY;
        velocityYRef.current = 0;
        groundedRef.current = true;
      }

      if (groundedRef.current && isMovingHoriz && s.camera.headBob && !s.camera.reducedMotion) {
        bobPhaseRef.current += dt * (sprinting ? 13 : 8.5);
        camera.position.y += Math.sin(bobPhaseRef.current) * 0.055;
      }
    }

    const maxRadius = blueprint?.worldRadius ?? 64;
    const dist = Math.hypot(camera.position.x, camera.position.z);
    if (dist > maxRadius) {
      const scale = maxRadius / dist;
      camera.position.x *= scale;
      camera.position.z *= scale;
    }

    telemetryTimerRef.current += dt;
    if (telemetryTimerRef.current > 0.1) {
      telemetryTimerRef.current = 0;
      s.setPlayerTelemetry(
        [camera.position.x, camera.position.y, camera.position.z],
        yawRef.current
      );
    }
  });

  return null;
}
