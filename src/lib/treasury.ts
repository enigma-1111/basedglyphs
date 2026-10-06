import treasuryFile from "@/data/treasury.json";
import type { Glyph } from "@/lib/collection";

export const EXAMPLE_WALLET = "0xB203FAA6207Ce9384D46fa5B9f397D304F17943C";
export const EXAMPLE_LABEL = "glyph.base.eth";

export type Difficulty = "easy" | "medium" | "hard";
export type GlyphTier = Difficulty;

type TreasuryRow = {
  tokenId: string;
  name: string;
  imageUrl: string;
  traits: Record<string, string>;
};

export const TREASURY: Glyph[] = (treasuryFile as TreasuryRow[]).map((row) => ({
  tokenId: row.tokenId,
  name: row.name,
  imageUrl: row.imageUrl,
  traits: row.traits,
}));

const TIER: Record<string, GlyphTier> = {
  "2767": "easy",
  "68": "easy",
  "77": "easy",
  "67": "easy",
  "70": "medium",
  "59": "medium",
  "66": "medium",
  "64": "medium",
  "99": "hard",
  "63": "hard",
  "1": "hard",
};

export function tierOf(tokenId: string): GlyphTier {
  return TIER[tokenId] ?? "hard";
}

export function tiersFor(difficulty: Difficulty): GlyphTier[] {
  if (difficulty === "easy") return ["easy"];
  if (difficulty === "medium") return ["easy", "medium"];
  return ["easy", "medium", "hard"];
}

export function treasuryFor(difficulty: Difficulty): Glyph[] {
  const allowed = new Set(tiersFor(difficulty));
  return TREASURY.filter((glyph) => allowed.has(tierOf(glyph.tokenId)));
}

export function sameAddress(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
