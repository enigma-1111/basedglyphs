import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  COLLECTION,
  TRAIT_TYPES,
  type BrowseQuery,
  type BrowseResult,
  type Glyph,
} from "@/lib/collection";
import { filterGlyphs, SAMPLE_GLYPHS } from "@/lib/sample";

const listSchema = z.object({
  offset: z.number().int().min(0).max(4000).optional(),
  limit: z.number().int().min(1).max(48).optional(),
  tokenId: z.string().regex(/^\d{1,4}$/).optional(),
  attributes: z
    .array(
      z.object({
        traitType: z.enum(TRAIT_TYPES),
        value: z.string().min(1).max(80),
      }),
    )
    .max(4)
    .optional(),
});

const GQL = "https://gql.opensea.io/graphql";
const cache = new Map<string, { at: number; value: BrowseResult }>();

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

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GQL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://opensea.io",
      "user-agent":
        "Mozilla/5.0 (compatible; GlyphStudio/1.0; +https://opensea.io/collection/basedglyphs)",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("The collection did not answer.");
  const payload = (await response.json()) as { data?: T; errors?: { message?: string }[] };
  if (payload.errors?.length || !payload.data) {
    throw new Error(payload.errors?.[0]?.message || "The collection did not answer.");
  }
  return payload.data;
}

function fromSample(query: BrowseQuery, limit: number, offset: number): BrowseResult {
  const matched = filterGlyphs(SAMPLE_GLYPHS, query);
  const glyphs = matched.slice(offset, offset + limit);
  return { source: "sample", glyphs, hasMore: offset + glyphs.length < matched.length };
}

async function fromLive(query: BrowseQuery, limit: number, offset: number): Promise<BrowseResult> {
  const attributes = query.attributes ?? [];
  if (query.tokenId) {
    const data = await gql<{ itemByIdentifier: RawItem | null }>(
      `query One($id: String!) {
        itemByIdentifier(identifier: {
          chain: "base",
          contractAddress: "${COLLECTION.contract}",
          tokenId: $id
        }) {
          __typename
          ... on Item {
            tokenId
            name
            imageUrl
            attributes { traitType value }
          }
        }
      }`,
      { id: query.tokenId },
    );
    const glyph = data.itemByIdentifier ? mapItem(data.itemByIdentifier) : null;
    const glyphs = glyph ? filterGlyphs([glyph], { attributes }) : [];
    return { source: "live", glyphs, hasMore: false };
  }

  const data = await gql<{ collectionItems: { items: RawItem[] } }>(
    `query List($offset: Int!, $limit: Int!, $filter: CollectionItemsFilter) {
      collectionItems(
        collectionSlug: "${COLLECTION.slug}"
        sort: { by: CREATED_DATE, direction: DESC }
        limit: $limit
        offset: $offset
        filter: $filter
      ) {
        items { tokenId name imageUrl attributes { traitType value } }
      }
    }`,
    {
      offset,
      limit,
      filter: attributes.length
        ? { attributes: attributes.map((attr) => ({ traitType: attr.traitType, values: [attr.value] })) }
        : {},
    },
  );
  const glyphs = (data.collectionItems?.items ?? [])
    .map(mapItem)
    .filter((glyph): glyph is Glyph => glyph !== null);
  return { source: "live", glyphs, hasMore: glyphs.length === limit };
}

export const browseGlyphs = createServerFn({ method: "GET" })
  .validator(listSchema)
  .handler(async ({ data }): Promise<BrowseResult> => {
    const limit = data.limit ?? 24;
    const offset = data.offset ?? 0;
    const query: BrowseQuery = {
      tokenId: data.tokenId,
      attributes: data.attributes,
      limit,
      offset,
    };
    const key = JSON.stringify({ ...query, limit, offset });
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 60_000) return hit.value;
    try {
      const value = await fromLive(query, limit, offset);
      cache.set(key, { at: Date.now(), value });
      return value;
    } catch {
      return fromSample(query, limit, offset);
    }
  });
