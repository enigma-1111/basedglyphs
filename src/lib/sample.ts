import sampleFile from "@/data/sample-glyphs.json";
import traitsFile from "@/data/traits.json";
import type { BrowseQuery, Glyph, TraitType } from "@/lib/collection";
import { TRAIT_TYPES } from "@/lib/collection";

type SampleRow = {
  tokenId: string;
  name: string;
  imageUrl: string;
  remoteUrl?: string;
  traits: Record<string, string>;
};

type TraitFile = {
  traitType: TraitType;
  values: { value: string; count: number }[];
};

export const SAMPLE_GLYPHS: Glyph[] = (sampleFile as SampleRow[]).map((row) => ({
  tokenId: row.tokenId,
  name: row.name,
  imageUrl: row.imageUrl,
  remoteUrl: row.remoteUrl,
  traits: row.traits,
}));

export const TRAIT_CATALOG: { traitType: TraitType; values: { value: string; count: number }[] }[] =
  (traitsFile as TraitFile[]).filter((row) =>
    (TRAIT_TYPES as readonly string[]).includes(row.traitType),
  );

export function filterGlyphs(glyphs: Glyph[], query: BrowseQuery): Glyph[] {
  const tokenId = query.tokenId?.trim();
  const attributes = query.attributes ?? [];
  return glyphs.filter((glyph) => {
    if (tokenId && glyph.tokenId !== tokenId) return false;
    return attributes.every((attr) => glyph.traits[attr.traitType] === attr.value);
  });
}
