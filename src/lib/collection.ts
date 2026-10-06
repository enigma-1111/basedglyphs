export const COLLECTION = {
  name: "Based Glyphs",
  chain: "Base",
  contract: "0xafc5a4fb9908d995be8de5e9a22cc7c4dd2c7124",
  opensea: "https://opensea.io/collection/basedglyphs",
  supply: 3333,
  slug: "basedglyphs",
} as const;

/** Flip later to accept any OpenSea collection. The paste flow stays unbuilt. */
export const OTHER_COLLECTIONS_ENABLED = false;

export const TRAIT_TYPES = ["Alchemy", "Glyph", "Hierarchy", "Time"] as const;
export type TraitType = (typeof TRAIT_TYPES)[number];

export type Glyph = {
  tokenId: string;
  name: string;
  imageUrl: string;
  remoteUrl?: string;
  traits: Record<string, string>;
};

export type MaterialId = "stone" | "bronze" | "gold" | "obsidian";
export type ShapeId = "tablet" | "shrine" | "lantern" | "seal" | "obelisk" | "block";
export type WorldRole = "statue" | "lantern" | "seal";

export const MATERIALS: { id: MaterialId; label: string }[] = [
  { id: "stone", label: "Stone" },
  { id: "bronze", label: "Bronze" },
  { id: "gold", label: "Gold" },
  { id: "obsidian", label: "Obsidian" },
];

export type BrowseQuery = {
  offset?: number;
  limit?: number;
  tokenId?: string;
  attributes?: { traitType: TraitType; value: string }[];
};

export type BrowseResult = {
  source: "live" | "sample";
  glyphs: Glyph[];
  hasMore: boolean;
};

export function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  return `/api/media?src=${encodeURIComponent(url)}`;
}

export function shapeFromPrompt(prompt: string): ShapeId {
  const p = prompt.toLowerCase();
  if (/(lantern|lamp|torch)/.test(p)) return "lantern";
  if (/(seal|medallion|floor)/.test(p)) return "seal";
  if (/(shrine|altar|chapel)/.test(p)) return "shrine";
  if (/(obelisk|pillar|column)/.test(p)) return "obelisk";
  return "block";
}

export function traitLine(traits: Record<string, string>): string {
  return TRAIT_TYPES.map((key) => traits[key]).filter(Boolean).join(" · ");
}
