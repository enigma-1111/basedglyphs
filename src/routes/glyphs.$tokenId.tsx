import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GlyphFace } from "@/components/glyph-face";
import { MaterialControls } from "@/components/material-controls";
import type { ViewerApi } from "@/components/view-spec";
import { ViewerHost } from "@/components/viewer-host";
import { mediaUrl, traitLine, type Glyph, type MaterialId } from "@/lib/collection";
import { browseGlyphs } from "@/lib/glyphs.functions";
import { useStudio } from "@/lib/store";

export const Route = createFileRoute("/glyphs/$tokenId")({ component: PiecePage });

function PiecePage() {
  const { tokenId } = Route.useParams();
  const [glyph, setGlyph] = useState<Glyph | null>(null);
  const [source, setSource] = useState<"live" | "sample" | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [made, setMade] = useState(false);
  const [material, setMaterial] = useState<MaterialId>("stone");
  const [height, setHeight] = useState(0.18);
  const [glow, setGlow] = useState(0.2);
  const [note, setNote] = useState("");
  const apiRef = useRef<ViewerApi | null>(null);
  const saveGlyph = useStudio((store) => store.saveGlyph);

  useEffect(() => {
    let live = true;
    setState("loading");
    setMade(false);
    setNote("");
    void browseGlyphs({ data: { tokenId, limit: 1 } })
      .then((result) => {
        if (!live) return;
        setSource(result.source);
        const found = result.glyphs[0] ?? null;
        setGlyph(found);
        setState(found ? "ready" : "missing");
      })
      .catch(() => {
        if (live) setState("missing");
      });
    return () => {
      live = false;
    };
  }, [tokenId]);

  return (
    <main>
        <Link to="/glyphs" className="inline-flex min-h-11 items-center text-sm text-gold">
          Back to glyphs
        </Link>
        {state === "loading" ? <p className="mt-6 text-sm text-muted">Fetching this glyph…</p> : null}
        {state === "missing" ? (
          <p className="mt-6 max-w-md text-sm text-muted">
            {source === "sample"
              ? "This piece is not in the saved sample of 12, and the live collection did not answer."
              : "No glyph with that number in Based Glyphs."}
          </p>
        ) : null}
        {glyph && state === "ready" ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section>
              <p className="font-display text-3xl tabular-nums text-ink">#{glyph.tokenId}</p>
              <p className="mt-2 text-sm text-muted">{traitLine(glyph.traits)}</p>
              <div className="mt-4 overflow-hidden rounded-card border border-line bg-bg">
                <div className="aspect-square">
                  <GlyphFace glyph={glyph} />
                </div>
              </div>
            </section>
            <section className="grid content-start gap-4">
              <button
                type="button"
                onClick={() => setMade(true)}
                className="min-h-12 rounded-control bg-gold px-5 font-medium text-gold-ink"
              >
                Make 3D
              </button>
              {made ? (
                <>
                  <ViewerHost
                    apiRef={apiRef}
                    spec={{
                      imageUrl: mediaUrl(glyph.imageUrl) ?? mediaUrl(glyph.remoteUrl),
                      material,
                      height,
                      glow,
                      shape: "tablet",
                      spin: true,
                    }}
                  />
                  <MaterialControls
                    material={material}
                    height={height}
                    glow={glow}
                    onMaterial={setMaterial}
                    onHeight={setHeight}
                    onGlow={setGlow}
                  />
                  <button
                    type="button"
                    className="min-h-12 rounded-control border border-line bg-surface px-5 font-medium text-ink"
                    onClick={() => {
                      saveGlyph({
                        name: glyph.name,
                        tokenId: glyph.tokenId,
                        imageUrl: glyph.imageUrl,
                        material,
                        height,
                        glow,
                      });
                      setNote(`Saved ${glyph.name} on this device.`);
                    }}
                  >
                    Save asset
                  </button>
                  {note ? (
                    <p className="text-sm text-muted" aria-live="polite">
                      {note}{" "}
                      <Link to="/studio" className="text-gold">
                        Open Studio
                      </Link>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted">
                  Make a spinning stone, bronze, gold, or obsidian carving from this glyph.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </main>
  );
}
