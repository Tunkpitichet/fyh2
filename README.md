# FRAMEBREAK — Every Image Is a Doorway

**FRAMEBREAK** transforms any uploaded photograph or painting into a bespoke, extremely detailed 3D environment you can physically walk and fly through — powered by the **Antigravity CLI (`agy --model gemini-4-neon-high`)**.

## How It Works

1. **Upload Any Photograph** (`JPEG`, `PNG`, `WebP`, `TIFF`):
   - An airliner, a cat, a city street, a coastal harbor, a temple, a sports car, or a painting.
2. **5-Question Deep Visual Reasoning (`Gemini 4 Neon High` via `agy` CLI)**:
   - Vite's local server middleware invokes `/Applications/Gemini.app/Contents/Helpers/agy --model gemini-4-neon-high` to inspect the actual uploaded image and answer 5 core design questions:
     1. **What it is** — identifies the exact subject, species/model, materials, colors, and details.
     2. **Where it should be** — designs the outdoor/open-air 3D environment where that subject naturally belongs (e.g., a cat photo builds an intimate sunlit Mediterranean cobblestone courtyard with stucco villa arcades, louvered shutters, tiered stone fountain, café parasols, terracotta planters, and a 3D sculpted cat on a limestone garden plinth; a plane photo builds an airport tarmac with a full 45-part 3D wide-body airliner, spinning turbofan blades, boarding stairs, control tower, service trucks, and runway lighting; a city photo builds a dense multi-story urban street canyon with custom glowing neon signage, wet asphalt reflections, streetlamps, crosswalks, and vehicles).
     3. **The Mood** — lighting temperature, time of day, weather, and atmospheric haze.
     4. **The Theme** — architectural, environmental, and artistic style.
     5. **Particular Relevance** — cultural, situational, or artistic context and story.
3. **Bespoke Ultra-Detailed 3D World Synthesis**:
   - Combines `agy`'s custom scene blueprint, custom Three.js builder code (`customThreeJsCode`), dynamic glowing signage textures (`signageTexts`), procedural surface materials (cobblestone, wet asphalt, tarmac, brushed aircraft aluminum, timber decking, multi-story architectural window facades), and 25–45 multi-part 3D assemblies.

## Commands

```bash
npm install
npm run dev        # Starts Vite + agy (gemini-4-neon-high) middleware
npm run typecheck  # TypeScript check
npm run test       # Vitest unit tests
npm run build      # Production build
```
