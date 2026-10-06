import { traitLine, type Glyph } from "@/lib/collection";
import { treasuryFor, type Difficulty, type GlyphTier } from "@/lib/treasury";

export const SPAN = 96;

export const SPAWN = { x: 48, z: 78, yaw: 0 };

export type DigMaterial = "sand" | "earth" | "pot" | "rubble";
export type ToolId = "hands" | "brush" | "trowel" | "mallet";

export type BuriedGlyph = {
  tokenId: string;
  name: string;
  imageUrl: string;
  traitLine: string;
  tier: GlyphTier;
  x: number;
  z: number;
  layers: DigMaterial[];
};

export type LandmarkKind = "camp" | "pyramid" | "oasis" | "obelisk" | "ruin" | "grove";

export type Landmark = {
  id: string;
  kind: LandmarkKind;
  name: string;
  blurb: string;
  x: number;
  z: number;
};

export type ChartGlyph = {
  tokenId: string;
  name: string;
  tier: GlyphTier;
  x: number;
  z: number;
  sealed: boolean;
};

export type WorldSurvey = {
  mapUrl: string;
  glyphs: ChartGlyph[];
  spawn: { x: number; z: number };
};

export type Walker = { x: number; z: number; yaw: number };

type Pyramid = { x: number; z: number; radius: number; height: number };

export const PYRAMIDS: Pyramid[] = [
  { x: 48, z: 14, radius: 7.6, height: 11 },
  { x: 30, z: 20, radius: 4.6, height: 6.2 },
  { x: 67, z: 18, radius: 5.2, height: 7.4 },
];

export const PLACES: Landmark[] = [
  {
    id: "camp",
    kind: "camp",
    name: "Camp",
    blurb: "Mudbrick houses where the walk starts, on the south sand.",
    x: 48,
    z: 78,
  },
  {
    id: "house",
    kind: "pyramid",
    name: "Great house",
    blurb: "A limestone pyramid on the north rise. Walk around the stone.",
    x: 48,
    z: 14,
  },
  {
    id: "basin",
    kind: "oasis",
    name: "Sun basin",
    blurb: "A gold ring set into the sand. It is a landmark, not a seal.",
    x: 28,
    z: 58,
  },
  {
    id: "west-needle",
    kind: "obelisk",
    name: "West needle",
    blurb: "A tapered stone needle. Use it to keep a bearing.",
    x: 18,
    z: 44,
  },
  {
    id: "east-needle",
    kind: "obelisk",
    name: "East needle",
    blurb: "The matching needle on the east dune.",
    x: 78,
    z: 42,
  },
  {
    id: "court",
    kind: "ruin",
    name: "Column court",
    blurb: "A short row of standing columns.",
    x: 74,
    z: 58,
  },
  {
    id: "palms",
    kind: "grove",
    name: "Palm shade",
    blurb: "A small stand of palms west of camp.",
    x: 22,
    z: 70,
  },
];

export const PALMS: [number, number][] = [
  [20, 68],
  [24, 73],
  [18, 74],
  [26, 66],
  [17, 56],
  [19, 46],
  [16, 34],
  [72, 30],
  [76, 34],
];

export const COLUMNS: [number, number][] = [
  [70, 56],
  [72.2, 57.2],
  [74.4, 58.4],
  [76.6, 59.6],
  [78.8, 60.8],
];

export const DIG_SPOTS: [number, number][] = [
  [40, 72],
  [56, 70],
  [30, 68],
  [44, 64],
  [30, 54],
  [70, 60],
  [18, 40],
  [76, 38],
  [42, 24],
  [56, 24],
  [28, 28],
  [70, 26],
];

export const TOOL_PICKUPS: { id: Exclude<ToolId, "hands">; name: string; x: number; z: number }[] = [
  { id: "brush", name: "Brush", x: 51.5, z: 76 },
  { id: "trowel", name: "Trowel", x: 71, z: 54 },
  { id: "mallet", name: "Mallet", x: 40, z: 27 },
];

const PACE: Record<DigMaterial, Record<ToolId, number>> = {
  sand: { hands: 4.2, brush: 1.45, trowel: 2.1, mallet: 3.2 },
  earth: { hands: 0, brush: 0, trowel: 2.3, mallet: 3.4 },
  pot: { hands: 0, brush: 0, trowel: 2.5, mallet: 0 },
  rubble: { hands: 0, brush: 0, trowel: 0, mallet: 2.15 },
};

export function layerSeconds(material: DigMaterial, tool: ToolId): number {
  return PACE[material][tool];
}

export function needTool(material: DigMaterial): string {
  if (material === "earth") return "Packed earth. It needs a trowel.";
  if (material === "pot") return "A clay pot. Free it with the trowel.";
  if (material === "rubble") return "Fallen stone. The mallet will shift it.";
  return "Loose sand.";
}

function layersFor(index: number): DigMaterial[] {
  if (index < 4) return ["sand"];
  if (index < 8) return index % 2 === 0 ? ["sand", "earth"] : ["sand", "pot"];
  return index % 2 === 0 ? ["sand", "earth", "rubble"] : ["sand", "pot", "rubble"];
}

export function rosterFor(difficulty: Difficulty): Glyph[] {
  const cap = difficulty === "easy" ? 4 : difficulty === "medium" ? 8 : 12;
  return treasuryFor("hard").slice(0, cap);
}

export function heightAt(x: number, z: number): number {
  let h =
    0.85 +
    Math.sin(x * 0.085) * 0.7 +
    Math.cos(z * 0.07 + 1.3) * 0.55 +
    Math.sin((x + z) * 0.04) * 0.35;
  const north = Math.max(0, (52 - z) / 52);
  h += north * north * 1.1;
  if (x < 26) {
    const bank = Math.min(1, (26 - x) / 12);
    const floor = x < 13 ? 0.18 : 0.42;
    h = h * (1 - bank * 0.85) + floor * bank * 0.85;
  }
  const camp = Math.hypot(x - SPAWN.x, z - SPAWN.z);
  if (camp < 6) {
    const t = camp / 6;
    h = h * t + 0.9 * (1 - t);
  }
  return h;
}

function shadeRelief(ctx: CanvasRenderingContext2D, size: number) {
  const cell = 192;
  const small = document.createElement("canvas");
  small.width = cell;
  small.height = cell;
  const g = small.getContext("2d");
  if (!g) return;
  const img = g.createImageData(cell, cell);
  const data = img.data;
  for (let py = 0; py < cell; py += 1) {
    const z = ((py + 0.5) / cell) * SPAN;
    for (let px = 0; px < cell; px += 1) {
      const x = ((px + 0.5) / cell) * SPAN;
      const h = heightAt(x, z);
      let r: number;
      let gv: number;
      let b: number;
      if (x < 13) {
        const shimmer = 0.9 + Math.sin(z * 0.35 + x) * 0.08;
        r = 18 * shimmer;
        gv = 78 * shimmer;
        b = 92 * shimmer;
      } else if (x < 24) {
        const bank = (x - 13) / 11;
        r = 64 + bank * 30 + h * 6;
        gv = 46 + bank * 14;
        b = 24 + bank * 8;
      } else {
        const t = Math.min(1, Math.max(0, (h - 0.15) / 2.3));
        r = 136 + t * 90;
        gv = 96 + t * 64;
        b = 50 + t * 50;
      }
      const i = (py * cell + px) * 4;
      data[i] = r;
      data[i + 1] = gv;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, size, size);
}

export function pushOut(x: number, z: number): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const pyramid of PYRAMIDS) {
    const dx = px - pyramid.x;
    const dz = pz - pyramid.z;
    const dist = Math.hypot(dx, dz);
    if (dist < pyramid.radius && dist > 0.001) {
      px = pyramid.x + (dx / dist) * pyramid.radius;
      pz = pyramid.z + (dz / dist) * pyramid.radius;
    }
  }
  return { x: px, z: pz };
}

export function nearestPlace(x: number, z: number): Landmark {
  let best = PLACES[0];
  let bestD = Infinity;
  for (const place of PLACES) {
    const dist = Math.hypot(place.x - x, place.z - z);
    if (dist < bestD) {
      best = place;
      bestD = dist;
    }
  }
  return best;
}

export function buildField(glyphs: Glyph[]): { glyphs: BuriedGlyph[]; spawn: typeof SPAWN } {
  return {
    spawn: SPAWN,
    glyphs: glyphs.slice(0, DIG_SPOTS.length).map((glyph, index) => {
      const spot = DIG_SPOTS[index] ?? [SPAWN.x, SPAWN.z - 6];
      const tier: GlyphTier = index < 4 ? "easy" : index < 8 ? "medium" : "hard";
      return {
        tokenId: glyph.tokenId,
        name: glyph.name,
        imageUrl: glyph.imageUrl,
        traitLine: traitLine(glyph.traits),
        tier,
        x: spot[0],
        z: spot[1],
        layers: layersFor(index),
      };
    }),
  };
}

export function paintChart(glyphs: BuriedGlyph[]): WorldSurvey {
  const size = 640;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { mapUrl: "", glyphs: [], spawn: { x: SPAWN.x, z: SPAWN.z } };
  const plot = (x: number, z: number) => ({ px: (x / SPAN) * size, py: (z / SPAN) * size });
  shadeRelief(ctx, size);
  const river = (13 / SPAN) * size;
  const field = (24 / SPAN) * size;
  ctx.strokeStyle = "rgba(28, 18, 10, 0.22)";
  ctx.lineWidth = 1;
  for (let z = 0; z < SPAN; z += 2.4) {
    const y = (z / SPAN) * size;
    ctx.beginPath();
    ctx.moveTo(river + 2, y);
    ctx.lineTo(field - 2, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(90, 58, 28, 0.28)";
  ctx.lineWidth = 1.1;
  for (let z = 4; z < SPAN; z += 6) {
    ctx.beginPath();
    for (let x = 26; x < SPAN; x += 2) {
      const y = heightAt(x, z);
      const point = plot(x, z + Math.sin(x * 0.17 + z * 0.05) * y * 0.22);
      if (x === 26) ctx.moveTo(point.px, point.py);
      else ctx.lineTo(point.px, point.py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#2c6b3c";
  for (const [x, z] of PALMS) {
    const point = plot(x, z);
    ctx.beginPath();
    ctx.arc(point.px, point.py, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 2;
  for (const pyramid of PYRAMIDS) {
    const point = plot(pyramid.x, pyramid.z);
    const radius = (pyramid.radius / SPAN) * size;
    ctx.fillStyle = "#f0e2c6";
    ctx.strokeStyle = "#6a4b2c";
    ctx.beginPath();
    ctx.moveTo(point.px, point.py - radius);
    ctx.lineTo(point.px + radius * 0.82, point.py + radius * 0.62);
    ctx.lineTo(point.px - radius * 0.82, point.py + radius * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#3b2918";
  ctx.font = "600 15px Cinzel, serif";
  const labels: [string, number, number][] = [
    ["Camp", 48, 78],
    ["Pyramid", 48, 14],
    ["Basin", 28, 58],
    ["West", 18, 44],
    ["East", 78, 42],
    ["Court", 74, 58],
    ["Palms", 22, 70],
  ];
  for (const [label, x, z] of labels) {
    const point = plot(x, z);
    ctx.fillText(label, point.px + 7, point.py - 4);
  }
  ctx.fillStyle = "#c6a15b";
  for (const tool of TOOL_PICKUPS) {
    const point = plot(tool.x, tool.z);
    ctx.beginPath();
    ctx.moveTo(point.px, point.py - 8);
    ctx.lineTo(point.px + 7, point.py);
    ctx.lineTo(point.px, point.py + 8);
    ctx.lineTo(point.px - 7, point.py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3b2918";
    ctx.font = "600 13px Cinzel, serif";
    ctx.fillText(tool.name, point.px + 10, point.py + 4);
    ctx.fillStyle = "#c6a15b";
  }
  ctx.strokeStyle = "#5c4030";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.fillStyle = "#3b2918";
  ctx.font = "700 20px Cinzel, serif";
  ctx.fillText("N", size / 2 - 7, 28);
  ctx.font = "500 13px Outfit, sans-serif";
  ctx.fillText("River", 10, size - 18);
  return {
    mapUrl: canvas.toDataURL("image/png"),
    glyphs: glyphs.map((glyph) => ({
      tokenId: glyph.tokenId,
      name: glyph.name,
      tier: glyph.tier,
      x: glyph.x,
      z: glyph.z,
      sealed: true,
    })),
    spawn: { x: SPAWN.x, z: SPAWN.z },
  };
}
