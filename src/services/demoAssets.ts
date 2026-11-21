import { UploadedImage } from '../types/world';

export interface DemoSpec {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  filename: string;
}

export const DEMO_SPECS: DemoSpec[] = [
  {
    id: 'colossal-alpine-mountain',
    title: 'Colossal Alpine Massif',
    subtitle: 'Builds a massive 960m mountain terrain with towering distant snow-capped peaks & zero houses',
    tag: 'Grand Mountain Range',
    filename: 'matterhorn-alps-mountain-peak.jpg',
  },
  {
    id: 'boeing-airliner-dusk',
    title: 'Wide-Body Jetliner at Dusk',
    subtitle: 'Builds a 3D airliner, tarmac apron, boarding stairs, control tower & runway strobes',
    tag: 'Aviation Tarmac',
    filename: 'boeing-787-twilight-apron.jpg',
  },
  {
    id: 'courtyard-ginger-cat',
    title: 'Ginger Cat on a Stone Step',
    subtitle: 'Places a 3D cat inside a sunlit Mediterranean cobblestone courtyard, fountain & café',
    tag: 'Subject → Courtyard',
    filename: 'ginger-tabby-cat-courtyard.jpg',
  },
  {
    id: 'neon-tokyo-city',
    title: 'Neon Metropolis Avenue',
    subtitle: 'Constructs a dense multi-story city street canyon with glowing signs, vehicles & rain',
    tag: 'Urban Street Canyon',
    filename: 'neon-tokyo-night-city.jpg',
  },
];

function drawAlpineMountainDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Crisp high-altitude cobalt sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, '#0B1D3F');
  sky.addColorStop(0.55, '#27538C');
  sky.addColorStop(1, '#98B9DC');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Distant left & right flanking mountain ridges
  ctx.fillStyle = '#38465B';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.66);
  ctx.lineTo(w * 0.19, h * 0.32);
  ctx.lineTo(w * 0.38, h * 0.54);
  ctx.lineTo(w * 0.52, h * 0.14);
  ctx.lineTo(w * 0.68, h * 0.52);
  ctx.lineTo(w * 0.84, h * 0.28);
  ctx.lineTo(w, h * 0.58);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Sunlit snow caps on the left faces of the 3 peaks
  ctx.fillStyle = '#F4F8FF';
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.14);
  ctx.lineTo(w * 0.41, h * 0.42);
  ctx.lineTo(w * 0.48, h * 0.38);
  ctx.lineTo(w * 0.52, h * 0.44);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.19, h * 0.32);
  ctx.lineTo(w * 0.11, h * 0.49);
  ctx.lineTo(w * 0.19, h * 0.47);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.84, h * 0.28);
  ctx.lineTo(w * 0.76, h * 0.46);
  ctx.lineTo(w * 0.84, h * 0.44);
  ctx.closePath();
  ctx.fill();

  // Alpine tundra foreground plateau
  const meadow = ctx.createLinearGradient(0, h * 0.68, 0, h);
  meadow.addColorStop(0, '#2B4236');
  meadow.addColorStop(1, '#192922');
  ctx.fillStyle = meadow;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
}

function drawAirlinerDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Twilight airport sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#09132B');
  sky.addColorStop(0.55, '#253D6E');
  sky.addColorStop(0.85, '#C46D45');
  sky.addColorStop(1, '#F2A359');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Tarmac apron ground
  const tarmac = ctx.createLinearGradient(0, h * 0.62, 0, h);
  tarmac.addColorStop(0, '#1D222E');
  tarmac.addColorStop(1, '#0F1219');
  ctx.fillStyle = tarmac;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // Yellow taxiway lead-in line
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h);
  ctx.lineTo(w * 0.52, h * 0.64);
  ctx.stroke();

  // Control tower silhouette in background
  ctx.fillStyle = '#151B28';
  ctx.fillRect(w * 0.8, h * 0.32, 20, h * 0.3);
  ctx.fillRect(w * 0.785, h * 0.27, 38, 22);

  // Commercial Airliner Fuselage & Tail Fin
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.ellipse(w * 0.48, h * 0.52, w * 0.26, h * 0.065, -0.02, 0, Math.PI * 2);
  ctx.fill();

  // Tail Fin
  ctx.fillStyle = '#1E3A6E';
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.48);
  ctx.lineTo(w * 0.17, h * 0.26);
  ctx.lineTo(w * 0.23, h * 0.26);
  ctx.lineTo(w * 0.31, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // Swept Wing & Under-wing Turbofan Engine
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.54);
  ctx.lineTo(w * 0.24, h * 0.63);
  ctx.lineTo(w * 0.31, h * 0.64);
  ctx.lineTo(w * 0.54, h * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1E3A6E';
  ctx.beginPath();
  ctx.ellipse(w * 0.43, h * 0.61, 24, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Illuminated Cabin Windows
  ctx.fillStyle = '#FFF0B3';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(w * 0.32 + i * 16, h * 0.5, 7, 9);
  }
}

function drawGingerCatDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Warm Mediterranean sunlit stucco courtyard backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#D9A066');
  bg.addColorStop(0.55, '#B87D4B');
  bg.addColorStop(1, '#5E5347');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Stone courtyard step
  ctx.fillStyle = '#8C8173';
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  // Ginger Tabby Cat Silhouette & Face in center
  ctx.fillStyle = '#E07232';
  // Body
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, 86, 68, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, 58, 0, Math.PI * 2);
  ctx.fill();
  // Pointed Ears
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.34);
  ctx.lineTo(w * 0.4, h * 0.2);
  ctx.lineTo(w * 0.48, h * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.58, h * 0.34);
  ctx.lineTo(w * 0.6, h * 0.2);
  ctx.lineTo(w * 0.52, h * 0.3);
  ctx.fill();

  // White chest & muzzle
  ctx.fillStyle = '#F7EFE6';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.58, 42, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.48, h * 0.45, 16, 0, Math.PI * 2);
  ctx.arc(w * 0.52, h * 0.45, 16, 0, Math.PI * 2);
  ctx.fill();

  // Green Eyes
  ctx.fillStyle = '#84CC16';
  ctx.beginPath();
  ctx.arc(w * 0.46, h * 0.4, 10, 0, Math.PI * 2);
  ctx.arc(w * 0.54, h * 0.4, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#090B10';
  ctx.beginPath();
  ctx.arc(w * 0.46, h * 0.4, 4, 0, Math.PI * 2);
  ctx.arc(w * 0.54, h * 0.4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawNeonCityDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Deep night sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#050814');
  sky.addColorStop(0.6, '#14203D');
  sky.addColorStop(1, '#101420');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Left & Right Towering Street Canyon Buildings
  ctx.fillStyle = '#121828';
  ctx.fillRect(0, 0, w * 0.32, h * 0.78);
  ctx.fillRect(w * 0.68, 0, w * 0.32, h * 0.78);
  ctx.fillRect(w * 0.38, h * 0.16, w * 0.24, h * 0.52);

  // Glowing Building Windows & Neon Signboards
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = (r + c) % 3 === 0 ? '#38BDF8' : '#FBBF24';
      ctx.fillRect(24 + c * 32, 35 + r * 26, 16, 14);
      ctx.fillRect(w - 180 + c * 32, 35 + r * 26, 16, 14);
    }
  }

  // Vertical Neon Signs
  ctx.fillStyle = '#F43F5E';
  ctx.fillRect(w * 0.28, h * 0.22, 22, 95);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(w * 0.68, h * 0.18, 22, 110);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(w * 0.73, h * 0.38, 20, 80);

  // Wet Reflective Street Asphalt
  const road = ctx.createLinearGradient(0, h * 0.68, 0, h);
  road.addColorStop(0, '#131926');
  road.addColorStop(1, '#090C14');
  ctx.fillStyle = road;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  // Crosswalk & Neon Puddle Reflections
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.fillRect(w * 0.24, h * 0.76, 90, 12);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.fillRect(w * 0.6, h * 0.8, 100, 14);
}

const demoThumbnailCache = new Map<string, string>();

export function getDemoThumbnailDataUrl(demoId: string): string {
  const cached = demoThumbnailCache.get(demoId);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (demoId === 'colossal-alpine-mountain') drawAlpineMountainDemo(ctx, 640, 400);
    else if (demoId === 'boeing-airliner-dusk') drawAirlinerDemo(ctx, 640, 400);
    else if (demoId === 'courtyard-ginger-cat') drawGingerCatDemo(ctx, 640, 400);
    else drawNeonCityDemo(ctx, 640, 400);
  }
  const url = canvas.toDataURL('image/jpeg', 0.9);
  demoThumbnailCache.set(demoId, url);
  return url;
}

export async function createDemoUploadedImage(demoId: string): Promise<UploadedImage> {
  const spec = DEMO_SPECS.find((d) => d.id === demoId) ?? DEMO_SPECS[0];
  const w = 960;
  const h = 600;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (spec.id === 'colossal-alpine-mountain') drawAlpineMountainDemo(ctx, w, h);
    else if (spec.id === 'boeing-airliner-dusk') drawAirlinerDemo(ctx, w, h);
    else if (spec.id === 'courtyard-ginger-cat') drawGingerCatDemo(ctx, w, h);
    else drawNeonCityDemo(ctx, w, h);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return {
    id: crypto.randomUUID(),
    filename: spec.filename,
    mimeType: 'image/jpeg',
    sizeBytes: Math.round(dataUrl.length * 0.75),
    dataUrl,
    width: w,
    height: h,
    demoId: spec.id,
  };
}
