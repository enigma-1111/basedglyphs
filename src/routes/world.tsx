import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SandsHost } from "@/components/sands-host";
import { SandsHud } from "@/components/sands-hud";
import { buildField, rosterFor, SPAWN, type BuriedGlyph, type ToolId, type Walker, type WorldSurvey } from "@/game/field";
import { loadClaims, loadTools, saveClaims, saveTools } from "@/lib/hunt";
import { chime, tick, unlockSound } from "@/game/sfx";
import { useStudio } from "@/lib/store";
import { treasuryFor, type Difficulty } from "@/lib/treasury";
import { useWallet } from "@/lib/wallet-store";

type Search = { difficulty: Difficulty; qa?: "1" };

export const Route = createFileRoute("/world")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const difficulty: Difficulty =
      search.difficulty === "easy" || search.difficulty === "hard" ? search.difficulty : "medium";
    return { difficulty, qa: search.qa === "1" ? "1" : undefined };
  },
  component: WorldPage,
});

function WorldPage() {
  const { difficulty, qa } = Route.useSearch();
  const [claims, setClaims] = useState<string[] | null>(null);
  const [pouch, setPouch] = useState<ToolId[] | null>(null);
  const [equipped, setEquipped] = useState<ToolId>("hands");
  const [phase, setPhase] = useState<"intro" | "play" | "pause">(qa === "1" ? "play" : "intro");
  const [modal, setModal] = useState<BuriedGlyph | null>(null);
  const [offer, setOffer] = useState<ToolId | null>(null);
  const [note, setNote] = useState("");
  const [sheet, setSheet] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [survey, setSurvey] = useState<WorldSurvey | null>(null);
  const [complete, setComplete] = useState(false);
  const pose = useRef<Walker>({ x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw });
  const brushRef = useRef<HTMLDivElement>(null);
  const brushHeld = useRef(false);
  const stick = useRef({ forward: 0, steer: 0 });
  const heldId = useWallet((store) => store.heldId);
  const owned = useWallet((store) => store.glyphs);
  const buried = useMemo(() => buildField(rosterFor(difficulty)).glyphs, [difficulty]);
  const found = claims ? buried.filter((glyph) => claims.includes(glyph.tokenId)).length : 0;
  const held =
    owned.find((glyph) => glyph.tokenId === heldId) ??
    treasuryFor("hard").find((glyph) => glyph.tokenId === heldId);
  const ownedTools: ToolId[] = ["hands", ...(pouch ?? [])];

  useEffect(() => {
    setSurvey(null);
    setMapOpen(false);
    setModal(null);
    setOffer(null);
    setNote("");
  }, [difficulty]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const practice = qa === "1" || window.location.hash === "#qa";
    if (practice) setPhase("play");
    void Promise.resolve(useStudio.persist.rehydrate()).finally(() => {
      setClaims(loadClaims());
      const saved = loadTools() as ToolId[];
      if (practice && !saved.includes("brush")) saved.push("brush");
      setPouch(saved);
      setEquipped(saved.includes("brush") ? "brush" : "hands");
    });
    return () => {
      document.body.style.overflow = previous;
    };
  }, [qa]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        if (mapOpen) {
          setMapOpen(false);
          return;
        }
        if (guide) {
          setGuide(false);
          return;
        }
        setPhase((current) => (current === "play" ? "pause" : current));
        setModal(null);
      }
      if (event.code === "KeyE" && phase === "play" && offer) take(offer);
      const order: ToolId[] = ["hands", "brush", "trowel", "mallet"];
      const index = Number(event.code.replace("Digit", "")) - 1;
      const next = order[index];
      if (next && ownedTools.includes(next)) setEquipped(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, mapOpen, guide, offer, ownedTools]);

  function keep(glyph: BuriedGlyph) {
    const already = (claims ?? []).includes(glyph.tokenId);
    setClaims((current) => {
      const base = current ?? [];
      if (base.includes(glyph.tokenId)) return base;
      const next = [...base, glyph.tokenId];
      saveClaims(next);
      return next;
    });
    useStudio.getState().saveGlyph({
      name: glyph.name,
      tokenId: glyph.tokenId,
      imageUrl: glyph.imageUrl,
      material: "gold",
      height: 1.1,
      glow: 0.55,
    });
    setModal(glyph);
    setNote("");
    setComplete(!already && found + 1 >= buried.length);
    chime();
  }

  function take(id: ToolId) {
    if (id === "hands") return;
    setPouch((current) => {
      const next = [...new Set([...(current ?? []), id])];
      saveTools(next);
      return next;
    });
    setEquipped(id);
    setOffer(null);
    tick();
  }

  const playing = phase === "play" && !modal && !sheet && !mapOpen && !guide;
  const ready = claims && pouch;

  return (
    <div className="sands-root" onPointerDown={unlockSound}>
      <div className="sands-sky" />
      {ready ? (
        <SandsHost
          key={difficulty}
          sites={buried}
          claimed={claims}
          heldUrl={held?.imageUrl}
          phase={playing ? "play" : phase === "intro" ? "intro" : "pause"}
          qa={qa === "1"}
          tool={equipped}
          ownedTools={ownedTools}
          brushRef={brushRef}
          brushHeld={brushHeld}
          stick={stick}
          pose={pose}
          onSurvey={setSurvey}
          onReveal={keep}
          onTool={setOffer}
          onNote={setNote}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <p className="rounded-control bg-bg px-4 py-3 text-sm text-ink">Raising the dunes…</p>
        </div>
      )}
      <SandsHud
        difficulty={difficulty}
        phase={phase}
        found={found}
        total={buried.length}
        note={note}
        complete={complete}
        modal={modal}
        offer={offer}
        sheet={sheet}
        brushRef={brushRef}
        brushHeld={brushHeld}
        stick={stick}
        claims={claims ?? []}
        tool={equipped}
        ownedTools={ownedTools}
        onPlay={() => setPhase("play")}
        onPause={() => setPhase("pause")}
        onResume={() => {
          setSheet(false);
          setPhase("play");
        }}
        onTake={take}
        onEquip={setEquipped}
        onDismiss={() => setModal(null)}
        onSheet={setSheet}
        pose={pose}
        survey={survey}
        mapOpen={mapOpen}
        guide={guide}
        onMap={setMapOpen}
        onGuide={setGuide}
      />
    </div>
  );
}
