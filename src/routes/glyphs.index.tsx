import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlyphFace } from "@/components/glyph-face";
import { WalletStrip } from "@/components/wallet-strip";
import {
  COLLECTION,
  OTHER_COLLECTIONS_ENABLED,
  TRAIT_TYPES,
  traitLine,
  type BrowseResult,
  type Glyph,
  type TraitType,
} from "@/lib/collection";
import { browseGlyphs } from "@/lib/glyphs.functions";
import { TRAIT_CATALOG } from "@/lib/sample";

export const Route = createFileRoute("/glyphs/")({ component: GlyphsPage });

function GlyphsPage() {
  const [draft, setDraft] = useState("");
  const [tokenId, setTokenId] = useState<string | undefined>();
  const [filters, setFilters] = useState<Partial<Record<TraitType, string>>>({});
  const [glyphs, setGlyphs] = useState<Glyph[]>([]);
  const [source, setSource] = useState<BrowseResult["source"] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchNote, setSearchNote] = useState("");

  const attributes = TRAIT_TYPES.flatMap((traitType) => {
    const value = filters[traitType];
    return value ? [{ traitType, value }] : [];
  });
  const filterKey = attributes.map((item) => `${item.traitType}:${item.value}`).join("|");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    void browseGlyphs({
      data: { offset: 0, limit: 24, tokenId, attributes },
    })
      .then((result) => {
        if (!live) return;
        setGlyphs(result.glyphs);
        setSource(result.source);
        setHasMore(result.hasMore);
      })
      .catch((reason: unknown) => {
        if (!live) return;
        setError(reason instanceof Error ? reason.message : "Could not load glyphs.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
    // attributes is derived from filterKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, filterKey]);

  async function more() {
    setLoading(true);
    try {
      const result = await browseGlyphs({
        data: { offset: glyphs.length, limit: 24, tokenId, attributes },
      });
      setGlyphs((current) => [...current, ...result.glyphs]);
      setSource(result.source);
      setHasMore(result.hasMore);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load more glyphs.");
    } finally {
      setLoading(false);
    }
  }

  function find(event: React.FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) {
      setTokenId(undefined);
      setSearchNote("");
      return;
    }
    if (!/^\d{1,4}$/.test(value) || Number(value) < 1 || Number(value) > COLLECTION.supply) {
      setSearchNote(`Enter a token number from 1 to ${COLLECTION.supply.toLocaleString("en-US")}.`);
      return;
    }
    setSearchNote("");
    setTokenId(value);
  }

  return (
    <main>
      <h1 className="font-display text-3xl text-ink">My glyphs</h1>
      <p className="mt-2 text-sm text-muted">
        {COLLECTION.name} · {COLLECTION.chain} · {COLLECTION.supply.toLocaleString("en-US")}
      </p>
      <WalletStrip />
      {source === "sample" ? (
        <p className="mt-4 rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted">
          The live collection did not answer. Showing 12 saved glyphs so you can keep working.
        </p>
      ) : null}
      <form onSubmit={find} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="token-search">
          Search by token id
        </label>
        <input
          id="token-search"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search by token id"
          className="min-h-11 flex-1 rounded-control border border-line bg-surface px-3 text-ink placeholder:text-faint"
        />
        <button type="submit" className="min-h-11 rounded-control bg-gold px-5 font-medium text-gold-ink">
          Find
        </button>
        {tokenId ? (
          <button
            type="button"
            className="min-h-11 rounded-control border border-line px-4 text-ink"
            onClick={() => {
              setDraft("");
              setTokenId(undefined);
              setSearchNote("");
            }}
          >
            Clear
          </button>
        ) : null}
      </form>
      {searchNote ? <p className="mt-2 text-sm text-gold">{searchNote}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRAIT_CATALOG.map((group) => (
          <label key={group.traitType} className="text-sm text-muted">
            {group.traitType}
            <select
              className="mt-2 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-ink"
              value={filters[group.traitType] ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [group.traitType]: event.target.value || undefined,
                }))
              }
            >
              <option value="">Any</option>
              {group.values.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="mt-4 block max-w-md text-sm text-muted" htmlFor="other-collections">
        Other collections
        <input
          id="other-collections"
          disabled={!OTHER_COLLECTIONS_ENABLED}
          placeholder="Coming later"
          className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3 text-faint"
        />
        <span className="mt-2 block text-sm text-faint">
          A later expedition can bury other collections from this wallet. Not in this version.
        </span>
      </label>
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {loading && glyphs.length === 0 ? <p className="mt-8 text-sm text-muted">Opening the collection…</p> : null}
      {!loading && glyphs.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No glyph matches that search.</p>
      ) : null}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {glyphs.map((glyph) => (
          <li key={glyph.tokenId}>
            <Link
              to="/glyphs/$tokenId"
              params={{ tokenId: glyph.tokenId }}
              className="block overflow-hidden rounded-card border border-line bg-surface"
            >
              <div className="aspect-square bg-bg">
                <GlyphFace glyph={glyph} />
              </div>
              <div className="space-y-1 p-3">
                <p className="font-display text-lg tabular-nums text-ink">#{glyph.tokenId}</p>
                <p className="text-sm leading-snug text-muted">{traitLine(glyph.traits)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => void more()}
          disabled={loading}
          className="mt-6 min-h-11 rounded-control border border-line px-5 text-ink disabled:opacity-50"
        >
          {loading ? "Loading…" : "More glyphs"}
        </button>
      ) : null}
    </main>
  );
}
