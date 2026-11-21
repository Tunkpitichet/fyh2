import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const AGY_BIN = '/Applications/Gemini.app/Contents/Helpers/agy';
const AGY_MODEL_CASCADE = [
  'gemini-4-neon-high',
  'gemini-3.8-flash-high',
  'gemini-4-hydrogen-high',
  'gemini-4-argon-high',
];

function runSingleAgyModel(model: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      AGY_BIN,
      [
        '--model',
        model,
        '--disable-slash-commands',
        '--dangerously-skip-permissions',
        '-p',
        prompt,
        '--output-format',
        'text',
      ],
      {
        cwd: process.cwd(),
        env: process.env,
      }
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`agy (${model}) timed out after 75s`));
    }, 75000);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const combined = `${stdout}\n${stderr}`;
      if (combined.includes('RESOURCE_EXHAUSTED') || combined.includes('Individual quota reached')) {
        reject(new Error(`QUOTA_EXHAUSTED:${model}`));
        return;
      }
      if (code !== 0 && !stdout.includes('{')) {
        reject(new Error(`agy (${model}) exited with code ${code}: ${stderr.slice(0, 300)}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function runAgyVisionAnalysis(
  imageAbsPath: string,
  filename: string,
  userHint?: string
): Promise<{ rawOut: string; model: string }> {
  if (!fs.existsSync(AGY_BIN)) {
    throw new Error(`Antigravity CLI not found at ${AGY_BIN}`);
  }

  const prompt = [
    `Read the uploaded image file at "${imageAbsPath}" (original filename: "${filename}") using read_file.`,
    userHint ? `User context/hint: "${userHint}".` : '',
    `You are the FRAMEBREAK 3D World Architect. Inspect the actual image carefully and design an EXTREMELY DETAILED, bespoke outdoor/open-air 3D space around it.`,
    `CRITICAL SUBJECT MATCHING RULES:`,
    `- Look closely at what is ACTUALLY in the photograph! NEVER invent a cat or animal that is not in the photo.`,
    `- ONLY use heroSubject.kind = "cat_creature" if there is literally a CAT in the image (and "dog_creature" only if there is literally a DOG).`,
    `- If the image depicts a FLOWER, ROSE, TULIP, SUNFLOWER, ORCHID, LOTUS, BOUQUET, or BOTANICAL PLANT: choose heroSubject.kind = "botanical_bloom" with primaryColor matching the EXACT flower petal color from the photo, secondaryColor matching the green stem/leaves, and accentColor matching the center pollen/stamen, set archetype = "courtyard_garden", and write customThreeJsCode to build additional matching 3D flowers, petals, or garden arbors!`,
    `- NEVER reuse a generic terrain! Design a unique "terrainProfile" specifically matching the topography, peak silhouettes, ridge angles, and colors of THIS photograph.`,
    `- If the image depicts a MOUNTAIN or MOUNTAIN RANGE: choose archetype "grand_mountain_range", set terrainProfile.terrainSize = 960, set terrainProfile.shape to "colossal_mountain_vista" (or "twin_peaks_gorge" / "jagged_ridge_amphitheater" / "arid_mesa_canyon" matching the image), and populate 4 to 7 colossal "distantPeaks" positioned AFAR (e.g. z between -130 and -380, x between -260 and +260 matching where the tall peaks sit left/center/right in the photo, height between 110 and 230, radius between 85 and 180, sharpness between 1.3 and 2.8, snowLine between 0.45 and 1.0) so the player can gaze at the massive mountain peaks rising from afar!`,
    `- NEVER add houses, cottages, villages, or bridges to a mountain or nature scene unless houses or a bridge are visibly present in the photograph! Set terrainProfile.hasHouses = false, terrainProfile.hasBridge = false, and terrainProfile.hasRiver = false unless a river or houses actually appear in the image! For pure mountain scenes, set heroSubject.kind = "mountain_cairn".`,
    `Answer these 5 core questions:`,
    `1. whatItIs: What exactly is in the picture? (Identify the main subject, geological/architectural/botanical formations, materials, colors, and fine visual details).`,
    `2. whereItShouldBe: Where should the 3D space be? Match the actual photo subject (e.g., botanical garden sanctuary for a flower, expansive alpine vantage for a mountain, sunlit courtyard for a cat, airport tarmac for a plane, dense urban canyon for a city).`,
    `3. mood: What is the mood, lighting temperature, time of day, and weather atmosphere?`,
    `4. theme: What is the architectural, botanical, geological, or artistic theme and design language?`,
    `5. particularRelevance: What is its particular cultural, geographical, or artistic relevance and story?`,
    `Return ONLY a single valid JSON object (no markdown fences, no commentary) matching this exact structure:`,
    `{`,
    `  "sceneTitle": "Evocative 2-5 word title",`,
    `  "subtitle": "1-sentence summary of the 3D environment",`,
    `  "reasoning": {`,
    `    "whatItIs": "2-3 sentences",`,
    `    "whereItShouldBe": "2-3 sentences describing the detailed 3D space",`,
    `    "mood": "1-2 sentences",`,
    `    "theme": "1-2 sentences",`,
    `    "particularRelevance": "2 sentences"`,
    `  },`,
    `  "archetype": "grand_mountain_range" | "aviation_tarmac" | "urban_city_canyon" | "courtyard_garden" | "harbor_waterfront" | "sacred_monument" | "highway_motorsport" | "open_market_plaza" | "alpine_painterly_valley",`,
    `  "groundType": "sculpted_valley" | "tarmac_runway" | "wet_city_asphalt" | "cobblestone_courtyard" | "timber_pier_water" | "flagstone_sanctuary",`,
    `  "terrainProfile": {`,
    `    "terrainSize": 960,`,
    `    "shape": "colossal_mountain_vista" | "twin_peaks_gorge" | "jagged_ridge_amphitheater" | "rolling_meadow_hills" | "arid_mesa_canyon" | "coastal_cliff_bay" | "flat_urban_pad",`,
    `    "baseAmplitude": 14,`,
    `    "baseFrequency": 0.011,`,
    `    "ridgeSharpness": 0.72,`,
    `    "valleyDirectionAngle": 0.45,`,
    `    "warpStrength": 24,`,
    `    "hasRiver": false,`,
    `    "riverAngle": 0.2,`,
    `    "hasHouses": false,`,
    `    "hasBridge": false,`,
    `    "snowColor": "#F4F8FF",`,
    `    "rockColor": "#4A5568",`,
    `    "meadowColor": "#2D4238",`,
    `    "distantPeaks": [`,
    `      { "x": -110, "z": -220, "height": 175, "radius": 135, "sharpness": 1.9, "ridgeAngle": 0.35, "snowLine": 0.55 },`,
    `      { "x": 15, "z": -260, "height": 215, "radius": 155, "sharpness": 2.2, "ridgeAngle": -0.2, "snowLine": 0.5 },`,
    `      { "x": 145, "z": -210, "height": 160, "radius": 125, "sharpness": 1.7, "ridgeAngle": 0.6, "snowLine": 0.6 }`,
    `    ]`,
    `  },`,
    `  "palette": {`,
    `    "skyTop": "#hex",`,
    `    "skyHorizon": "#hex",`,
    `    "groundPrimary": "#hex",`,
    `    "groundSecondary": "#hex",`,
    `    "structurePrimary": "#hex",`,
    `    "structureSecondary": "#hex",`,
    `    "accentGlow": "#hex",`,
    `    "foliageColor": "#hex"`,
    `  },`,
    `  "environment": {`,
    `    "timeOfDay": 17.5,`,
    `    "sunIntensity": 1.6,`,
    `    "fogDensity": 0.16,`,
    `    "weather": "clear" | "rain" | "snow" | "mist" | "storm",`,
    `    "windSpeed": 0.6,`,
    `    "fireflies": 0.2,`,
    `    "dreamDust": 0.2,`,
    `    "artStyle": "cinematic" | "painterly" | "starry" | "dreamscape" | "golden" | "midnight",`,
    `    "bloomIntensity": 0.75,`,
    `    "swirlingSky": false`,
    `  },`,
    `  "signageTexts": ["SIGN 1", "SIGN 2", "SIGN 3", "SIGN 4", "SIGN 5"],`,
    `  "heroSubject": {`,
    `    "kind": "botanical_bloom" | "mountain_cairn" | "airliner" | "cat_creature" | "dog_creature" | "sports_car" | "sailing_ship" | "fountain_monument" | "temple_shrine" | "market_pavilion" | "custom_sculpture",`,
    `    "label": "Short name of hero subject",`,
    `    "primaryColor": "#hex",`,
    `    "secondaryColor": "#hex",`,
    `    "accentColor": "#hex",`,
    `    "scale": 1.0,`,
    `    "details": ["detail 1", "detail 2", "detail 3"]`,
    `  },`,
    `  "storyHotspots": [`,
    `    { "title": "Hotspot 1", "category": "What It Is", "description": "1-2 sentences" },`,
    `    { "title": "Hotspot 2", "category": "Where It Belongs", "description": "1-2 sentences" },`,
    `    { "title": "Hotspot 3", "category": "Particular Relevance", "description": "1-2 sentences" }`,
    `  ],`,
    `  "customThreeJsCode": "// Optional clean JS statements using THREE, group, palette to add bespoke 3D meshes matching the image. For grand_mountain_range, ONLY add natural geological formations (rock spires, boulders, stone cairns, pine trees)—NEVER add buildings, huts, tents, or houses!"`,
    `}`,
  ]
    .filter(Boolean)
    .join('\n');

  let lastError: Error = new Error('No agy model succeeded');
  for (const model of AGY_MODEL_CASCADE) {
    try {
      const rawOut = await runSingleAgyModel(model, prompt);
      return { rawOut, model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[FRAMEBREAK agy] ${model} failed: ${lastError.message} — trying next model...`);
    }
  }
  throw lastError;
}

function framebreakAgyPlugin(): Plugin {
  return {
    name: 'framebreak-agy-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze-image', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += String(chunk);
        });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body) as {
              dataUrl: string;
              filename?: string;
              userHint?: string;
            };
            const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(parsed.dataUrl || '');
            if (!match) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid image dataUrl' }));
              return;
            }

            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const buffer = Buffer.from(match[2], 'base64');
            const uploadDir = path.join(process.cwd(), '.cache', 'uploads');
            fs.mkdirSync(uploadDir, { recursive: true });
            const tempFile = path.join(
              uploadDir,
              `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
            );
            fs.writeFileSync(tempFile, buffer);

            try {
              const { rawOut, model } = await runAgyVisionAnalysis(
                tempFile,
                parsed.filename || `image.${ext}`,
                parsed.userHint
              );

              const firstBrace = rawOut.indexOf('{');
              const lastBrace = rawOut.lastIndexOf('}');
              if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                throw new Error('agy output did not contain valid JSON');
              }
              const jsonSlice = rawOut.slice(firstBrace, lastBrace + 1);
              const data = JSON.parse(jsonSlice);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, model, data }));
            } finally {
              try {
                fs.unlinkSync(tempFile);
              } catch {
                // ignore cleanup error
              }
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                error: err instanceof Error ? err.message : 'agy analysis failed',
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), framebreakAgyPlugin()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: [
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/postprocessing',
            'postprocessing',
          ],
          vendor: ['react', 'react-dom', 'framer-motion', 'zustand', 'lucide-react'],
        },
      },
    },
  },
});
