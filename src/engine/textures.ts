import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * High-detail painterly terrain / organic ground texture
 */
export function getPainterlyTerrainTexture(baseHex: string, accentHex: string): THREE.CanvasTexture {
  const key = `terrain:${baseHex}:${accentHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1800; i++) {
    const x = (i * 197) % 512;
    const y = (i * 313) % 512;
    const rw = 6 + (i % 16);
    const rh = 3 + (i % 6);
    const angle = ((i * 37) % 360) * (Math.PI / 180);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (i % 6 === 0) {
      ctx.fillStyle = accentHex;
      ctx.globalAlpha = 0.16;
    } else if (i % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.08;
    } else {
      ctx.fillStyle = '#05070c';
      ctx.globalAlpha = 0.14;
    }
    ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Wet Asphalt / Airport Tarmac texture with aggregate speckle and subtle seam joints
 */
export function getTarmacAsphaltTexture(baseHex = '#1E222B', seamHex = '#11141B'): THREE.CanvasTexture {
  const key = `tarmac:${baseHex}:${seamHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Concrete / asphalt expansion slabs
  ctx.strokeStyle = seamHex;
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Fine mineral aggregate speckle & wet sheen patches
  for (let i = 0; i < 3200; i++) {
    const x = (i * 173) % 512;
    const y = (i * 281) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 18);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Hand-laid European / Mediterranean cobblestone courtyard texture
 */
export function getCobblestoneTexture(stoneHex = '#4B4843', mortarHex = '#23211E'): THREE.CanvasTexture {
  const key = `cobble:${stoneHex}:${mortarHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = mortarHex;
  ctx.fillRect(0, 0, 512, 512);

  const rows = 14;
  const cols = 12;
  const cellH = 512 / rows;
  const cellW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + offset + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;

      ctx.fillStyle = stoneHex;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 7);
      ctx.fill();

      // Highlight top edge & shade bottom edge for 3D relief
      ctx.fillStyle =
        (r * 7 + c * 11) % 4 === 0 ? 'rgba(255,240,210,0.16)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h * 0.45, 5);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Weathered timber plank boardwalk texture
 */
export function getTimberDeckTexture(woodHex = '#5C4332'): THREE.CanvasTexture {
  const key = `timber:${woodHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = woodHex;
  ctx.fillRect(0, 0, 512, 512);

  const planks = 10;
  const plankH = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, 512, plankH - 3);
    ctx.fillStyle = 'rgba(10, 8, 6, 0.65)';
    ctx.fillRect(0, y + plankH - 3, 512, 3);
  }
  // Wood grain streaks
  for (let i = 0; i < 650; i++) {
    const x = (i * 139) % 512;
    const y = (i * 83) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,235,205,0.07)';
    ctx.fillRect(x, y, 36 + (i % 45), 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Brushed aircraft/industrial aluminum panel texture with rivet lines
 */
export function getBrushedMetalTexture(baseHex = '#D8DEE9'): THREE.CanvasTexture {
  const key = `metal:${baseHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(20, 28, 40, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * High-detail multi-story architectural facade with recessed window mullions & interior room glow
 */
export function getBuildingFacadeTextures(
  wallHex: string,
  litWindows = true
): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const key = `facade:${wallHex}:${litWindows ? 1 : 0}`;
  const cachedMap = textureCache.get(`${key}:map`);
  const cachedEmissive = textureCache.get(`${key}:emissive`);
  if (cachedMap && cachedEmissive) {
    return { map: cachedMap, emissiveMap: cachedEmissive };
  }

  const [diffCanvas, dCtx] = makeCanvas(256, 512);
  const [emCanvas, eCtx] = makeCanvas(256, 512);

  dCtx.fillStyle = wallHex;
  dCtx.fillRect(0, 0, 256, 512);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 512);

  // Cornice ledges and stone coursing
  for (let y = 0; y < 512; y += 16) {
    dCtx.fillStyle = y % 64 === 0 ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.05)';
    dCtx.fillRect(0, y, 256, y % 64 === 0 ? 4 : 1.5);
  }

  const cols = 4;
  const rows = 8;
  const padX = 14;
  const padY = 16;
  const cellW = (256 - padX * 2) / cols;
  const cellH = (512 - padY * 2) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = padX + c * cellW + 8;
      const wy = padY + r * cellH + 8;
      const ww = cellW - 16;
      const wh = cellH - 18;

      // Deep window lintel & sill
      dCtx.fillStyle = 'rgba(8, 11, 18, 0.85)';
      dCtx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

      const isLit = litWindows && (r * 7 + c * 13) % 4 !== 0;
      if (isLit) {
        const warmGrad = dCtx.createLinearGradient(wx, wy, wx, wy + wh);
        const coolTint = (r + c) % 5 === 0;
        warmGrad.addColorStop(0, coolTint ? '#C7EEFF' : '#FFF0B8');
        warmGrad.addColorStop(1, coolTint ? '#64A8E8' : '#F29D4B');
        dCtx.fillStyle = warmGrad;
        dCtx.fillRect(wx, wy, ww, wh);

        eCtx.fillStyle = coolTint ? '#82C8FF' : '#FFBE6B';
        eCtx.fillRect(wx, wy, ww, wh);
      } else {
        dCtx.fillStyle = '#151E2E';
        dCtx.fillRect(wx, wy, ww, wh);
      }

      // Window mullions & transoms
      dCtx.fillStyle = 'rgba(12, 16, 24, 0.78)';
      dCtx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      dCtx.fillRect(wx, wy + wh * 0.45, ww, 2);
      eCtx.fillStyle = '#000000';
      eCtx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      eCtx.fillRect(wx, wy + wh * 0.45, ww, 2);
    }
  }

  const map = new THREE.CanvasTexture(diffCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  textureCache.set(`${key}:map`, map);
  textureCache.set(`${key}:emissive`, emissiveMap);
  return { map, emissiveMap };
}

/**
 * Dynamic glowing neon / shopfront / airport gate signboard texture
 */
export function getNeonSignTexture(
  text: string,
  bgHex = '#0D111C',
  glowHex = '#FF9E44'
): THREE.CanvasTexture {
  const clean = (text || 'FRAMEBREAK').slice(0, 22).toUpperCase();
  const key = `sign:${clean}:${bgHex}:${glowHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 160);
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);

  // Double neon border
  ctx.strokeStyle = glowHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 140);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 128);

  // Glowing typography
  ctx.font = 'bold 46px "JetBrains Mono", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glowHex;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(clean, 256, 82, 460);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Soft glowing radial sprite for fireflies, stars, and dream dust.
 */
export function getGlowParticleTexture(): THREE.CanvasTexture {
  const key = 'particle:glow';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(64, 64);
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.28, 'rgba(255, 240, 195, 0.85)');
  grad.addColorStop(0.65, 'rgba(180, 160, 255, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set(key, tex);
  return tex;
}
