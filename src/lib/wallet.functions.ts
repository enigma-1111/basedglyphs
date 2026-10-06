import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COLLECTION, type Glyph } from "@/lib/collection";
import { EXAMPLE_WALLET, sameAddress, TREASURY } from "@/lib/treasury";

const GQL = "https://gql.opensea.io/graphql";
const cache = new Map<string, { at: number; glyphs: Glyph[] }>();

type RawItem = {
  tokenId?: string;
  name?: string;
  imageUrl?: string;
  attributes?: { traitType?: string; value?: string }[];
};

function mapItem(item: RawItem): Glyph | null {
  if (!item.tokenId || !item.imageUrl) return null;
  const traits: Record<string, string> = {};
  for (const attr of item.attributes ?? []) {
    if (attr.traitType && attr.value) traits[attr.traitType] = attr.value;
  }
  return {
    tokenId: String(item.tokenId),
    name: item.name || `Glyph #${item.tokenId}`,
    imageUrl: item.imageUrl,
    traits,
  };
}

export type WalletGlyphs = {
  source: "live" | "saved";
  glyphs: Glyph[];
  capped: boolean;
};

export const ownedGlyphs = createServerFn({ method: "GET" })
  .validator(z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) }))
  .handler(async ({ data }): Promise<WalletGlyphs> => {
    const address = data.address.toLowerCase();
    const hit = cache.get(address);
    if (hit && Date.now() - hit.at < 60_000) {
      return { source: "live", glyphs: hit.glyphs, capped: hit.glyphs.length >= 24 };
    }
    try {
      const response = await fetch(GQL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://opensea.io",
          "user-agent": "Mozilla/5.0 (compatible; GlyphSands/1.0)",
        },
        body: JSON.stringify({
          query: `query($addr:[Address!]!){
            profileItems(
              addresses:$addr
              limit:24
              sort:{by:RECEIVED_DATE, direction:DESC}
              filter:{collectionSlugs:["${COLLECTION.slug}"]}
            ){ items { tokenId name imageUrl attributes { traitType value } } }
          }`,
          variables: { addr: [data.address] },
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("Wallet lookup failed.");
      const payload = (await response.json()) as {
        data?: { profileItems?: { items?: RawItem[] } };
        errors?: { message?: string }[];
      };
      if (payload.errors?.length) throw new Error(payload.errors[0]?.message || "Wallet lookup failed.");
      const glyphs = (payload.data?.profileItems?.items ?? [])
        .map(mapItem)
        .filter((glyph): glyph is Glyph => glyph !== null);
      cache.set(address, { at: Date.now(), glyphs });
      return { source: "live", glyphs, capped: glyphs.length >= 24 };
    } catch (error) {
      if (sameAddress(data.address, EXAMPLE_WALLET)) {
        return { source: "saved", glyphs: TREASURY, capped: false };
      }
      throw error instanceof Error ? error : new Error("Wallet lookup failed.");
    }
  });
