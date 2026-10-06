import { Link } from "@tanstack/react-router";
import { Map as MapIcon, ScrollText } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { GuideSheet, MapSheet, SandsMinimap, type Walker } from "@/components/sands-map";
import type { BuriedGlyph } from "@/game/field";
import type { WorldSurvey } from "@/game/field";
import { mediaUrl, traitLine, type Glyph } from "@/lib/collection";
import type { ToolId } from "@/game/field";
import { GlyphAvatar, WearAny } from "@/components/glyph-avatar";
import { avatarLine } from "@/lib/avatar";
import { TREASURY, type Difficulty } from "@/lib/treasury";
import { useWallet } from "@/lib/wallet-store";

const COPY: Record<Difficulty, { title: string; body: string }> = {
  easy: {
    title: "Loose sand",
    body: "Four seals under loose sand. Your hands can shift it. A brush, if you find one, is faster.",
  },
  medium: {
    title: "Earth and pots",
    body: "Eight pits. Sand, then packed earth or a clay pot. The trowel is the tool that cuts those.",
  },
  hard: {
    title: "Fallen stone",
    body: "Deeper pits. The last layer is rubble. Only the mallet shifts it. Nothing on the map marks a seal.",
  },
};

const VERB: Record<ToolId, string> = {
  hands: "Scrape",
  brush: "Brush",
  trowel: "Cut",
  mallet: "Clear",
};

const TOOL_LABEL: Record<ToolId, string> = {
  hands: "Hands",
  brush: "Brush",
  trowel: "Trowel",
  mallet: "Mallet",
};

function Scarab() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-gold" aria-hidden>
      <ellipse cx="12" cy="14" rx="5.5" ry="4.5" fill="currentColor" />
      <circle cx="12" cy="7.5" r="2.1" fill="currentColor" />
      <path d="M7 13C4 12 3 9 4 7M17 13c3-1 4-4 3-6" stroke="currentColor" fill="none" strokeWidth="1.6" />
    </svg>
  );
}

function Stick({ stick }: { stick: RefObject<{ forward: number; steer: number }> }) {
  const knob = useRef<HTMLSpanElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  function move(clientX: number, clientY: number) {
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    const max = 36;
    const mag = Math.hypot(dx, dy) || 1;
    const scale = Math.min(max, mag) / mag;
    const power = Math.min(1, mag / max);
    stick.current = { steer: (-dx / mag) * power, forward: (-dy / mag) * power };
    if (knob.current) knob.current.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  }
  return (
    <div
      className="sands-stick sands-touch"
      aria-label="Walk and turn"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        const rect = event.currentTarget.getBoundingClientRect();
        origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        move(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        move(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        stick.current = { forward: 0, steer: 0 };
        if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
      }}
    >
      <span ref={knob} />
    </div>
  );
}

export function SandsHud({
  difficulty,
  phase,
  found,
  total,
  note,
  complete,
  modal,
  offer,
  sheet,
  brushRef,
  brushHeld,
  stick,
  claims,
  tool,
  ownedTools,
  pose,
  survey,
  mapOpen,
  guide,
  onPlay,
  onPause,
  onResume,
  onTake,
  onEquip,
  onDismiss,
  onSheet,
  onMap,
  onGuide,
}: {
  difficulty: Difficulty;
  phase: "intro" | "play" | "pause";
  found: number;
  total: number;
  note: string;
  complete: boolean;
  modal: BuriedGlyph | null;
  offer: ToolId | null;
  sheet: boolean;
  brushRef: RefObject<HTMLDivElement | null>;
  brushHeld: RefObject<boolean>;
  stick: RefObject<{ forward: number; steer: number }>;
  claims: string[];
  tool: ToolId;
  ownedTools: ToolId[];
  pose: RefObject<Walker>;
  survey: WorldSurvey | null;
  mapOpen: boolean;
  guide: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onTake: (id: ToolId) => void;
  onEquip: (id: ToolId) => void;
  onDismiss: () => void;
  onSheet: (open: boolean) => void;
  onMap: (open: boolean) => void;
  onGuide: (open: boolean) => void;
}) {
  const level = COPY[difficulty];
  const glyphs = useWallet((store) => store.glyphs);
  const worn = useWallet((store) => store.worn);
  const hold = useWallet((store) => store.hold);
  const status = useWallet((store) => store.status);
  const walletNote = useWallet((store) => store.note);
  const label = useWallet((store) => store.label);
  const connect = useWallet((store) => store.connect);
  const loadExample = useWallet((store) => store.loadExample);
  const satchel = mergeSatchel(glyphs, claims, worn);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="pointer-events-auto min-h-11 rounded-control border border-line bg-bg px-3 text-sm text-ink"
            onClick={onPause}
          >
            Menu
          </button>
          <button
            type="button"
            className="pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-control border border-line bg-bg px-3 text-sm text-ink"
            onClick={() => onGuide(true)}
          >
            <ScrollText className="size-4" aria-hidden />
            Guide
          </button>
          <button
            type="button"
            className="pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-control border border-line bg-bg px-3 text-sm text-ink"
            onClick={() => onMap(true)}
            disabled={!survey}
          >
            <MapIcon className="size-4" aria-hidden />
            Map
          </button>
        </div>
        <div className="pointer-events-none flex items-center gap-2 rounded-control border border-line bg-bg px-3 py-2">
          <Scarab />
          {worn ? <GlyphAvatar traits={worn.traits} imageUrl={worn.imageUrl} /> : null}
          <span className="font-display text-lg text-gold tabular-nums">
            {found}/{total}
          </span>
          <Compass pose={pose} />
        </div>
      </div>

      {found > 0 && found === total && phase === "play" && !modal ? (
        <p className="pointer-events-none mx-auto mt-2 rounded-control bg-gold px-3 py-2 text-center font-display text-sm text-gold-ink">
          Survey complete
        </p>
      ) : note && phase === "play" && !modal ? (
        <p className="pointer-events-none mx-auto mt-2 max-w-64 rounded-control bg-bg px-3 py-2 text-center text-sm text-ink">
          {note}
        </p>
      ) : (
        <div className="mt-2" />
      )}

      {phase === "play" && survey && !mapOpen && !guide && !modal && !sheet ? (
        <div className="absolute top-16 right-3">
          <SandsMinimap
            survey={survey}
            pose={pose}
            claims={claims}
            onOpen={() => onMap(true)}
          />
        </div>
      ) : null}

      {offer && !modal && phase === "play" ? (
        <button
          type="button"
          className="pointer-events-auto absolute top-[58%] left-1/2 min-h-11 -translate-x-1/2 rounded-control bg-gold px-4 font-medium text-gold-ink"
          onClick={() => onTake(offer)}
        >
          Take the {TOOL_LABEL[offer].toLowerCase()}
        </button>
      ) : null}

      <div className="mt-auto px-3 pb-3">
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          {ownedTools.map((id) => (
            <button
              key={id}
              type="button"
              className={
                "pointer-events-auto min-h-11 rounded-control border px-3 text-sm " +
                (tool === id ? "border-gold bg-gold text-gold-ink" : "border-line bg-bg text-ink")
              }
              onClick={() => onEquip(id)}
            >
              {TOOL_LABEL[id]}
            </button>
          ))}
        </div>
        <p className="mb-1 text-center text-xs tracking-wide text-ink">{VERB[tool]}</p>
        <div className="mx-auto mb-3 h-2 w-40 overflow-hidden rounded-full bg-bg">
          <div ref={brushRef} className="h-full origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <Stick stick={stick} />
          <button
            type="button"
            className="pointer-events-auto min-h-14 min-w-24 rounded-control bg-gold px-4 text-sm font-medium text-gold-ink"
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              brushHeld.current = true;
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              brushHeld.current = false;
            }}
            onPointerCancel={() => {
              brushHeld.current = false;
            }}
          >
            {VERB[tool]}
          </button>
        </div>
      </div>

      {phase === "intro" && !guide && !mapOpen ? (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-bg/25 p-3 sm:items-center">
          <div className="pointer-events-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-card border border-line bg-bg">
            <div className="overflow-y-auto p-5">
              <p className="font-display text-sm tracking-widest text-gold">Based Glyphs</p>
              <h1 className="mt-2 font-display text-4xl text-ink">{level.title}</h1>
              <p className="mt-2 text-sm text-muted">{level.body}</p>
              <p className="mt-3 text-sm text-muted">
                Dig sand, earth, pots, and fallen stone. Take tools when you find them. The seals are the treasury
                glyphs. A seal that rises is kept in your satchel. The map does not mark buried ones.
              </p>
            </div>
            <div className="shrink-0 border-t border-line p-3">
              <button type="button" className="min-h-12 w-full rounded-control bg-gold font-medium text-gold-ink" onClick={onPlay}>
                Enter the sands
              </button>
              <button type="button" className="mt-2 min-h-11 w-full text-sm text-ink" onClick={() => onGuide(true)}>
                Read the guide first
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "pause" && !guide && !mapOpen ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/70 p-4">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-bg p-5">
            <h2 className="font-display text-3xl text-ink">Paused</h2>
            <p className="mt-2 text-sm text-muted">
              {found} of {total} kept on {difficulty}.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="min-h-11 rounded-control bg-gold font-medium text-gold-ink" onClick={onResume}>
                Keep walking
              </button>
              <button type="button" className="min-h-11 rounded-control border border-line text-ink" onClick={() => onGuide(true)}>
                How to walk
              </button>
              <button
                type="button"
                className="min-h-11 rounded-control border border-line text-ink"
                disabled={!survey}
                onClick={() => onMap(true)}
              >
                Map and legend
              </button>
              <button type="button" className="min-h-11 rounded-control border border-line text-ink" onClick={() => onSheet(true)}>
                Satchel and wallet
              </button>
              <Link
                to="/world"
                search={{ difficulty: "easy" }}
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-line text-ink"
              >
                Easy
              </Link>
              <Link
                to="/world"
                search={{ difficulty: "medium" }}
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-line text-ink"
              >
                Medium
              </Link>
              <Link
                to="/world"
                search={{ difficulty: "hard" }}
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-line text-ink"
              >
                Hard
              </Link>
              <Link to="/" className="inline-flex min-h-11 items-center justify-center text-sm text-muted">
                Leave the desert
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 top-16 flex items-end justify-center p-3 sm:items-center">
          <div className="w-full max-w-sm rounded-card border border-gold bg-bg p-5 text-center">
            <p className="font-display text-2xl tracking-wide text-gold">It rises</p>
            <img
              src={mediaUrl(modal.imageUrl)}
              alt={modal.name}
              className="mx-auto mt-4 size-36 rounded-control border border-line object-cover"
            />
            <p className="mt-3 font-display text-lg text-ink">{modal.name}</p>
            {modal.traitLine ? <p className="mt-1 text-sm text-muted">{modal.traitLine}</p> : null}
            <p className="mt-3 text-sm text-muted">In your satchel, and in the studio. The token stays in its wallet.</p>
            {complete ? <p className="mt-2 font-display text-gold">That was the last seal on this walk.</p> : null}
            <button
              type="button"
              className="mt-5 min-h-12 w-full rounded-control bg-gold font-medium text-gold-ink"
              onClick={onDismiss}
            >
              Keep walking
            </button>
          </div>
        </div>
      ) : null}

      {sheet ? (
        <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg/55 p-3 sm:items-center">
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-bg p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-ink">Satchel</h2>
              <button type="button" className="min-h-11 px-3 text-sm text-ink" onClick={() => onSheet(false)}>
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {label || "No wallet yet."} Wear a glyph and you walk as that seal. Studio is just for fun.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="min-h-11 rounded-control bg-gold px-4 text-sm font-medium text-gold-ink"
                disabled={status === "loading"}
                onClick={() => void connect()}
              >
                Connect wallet
              </button>
              <button
                type="button"
                className="min-h-11 rounded-control border border-line px-4 text-sm text-ink"
                disabled={status === "loading"}
                onClick={() => void loadExample()}
              >
                Preview glyph.base.eth
              </button>
            </div>
            {walletNote ? <p className="mt-2 text-sm text-muted">{walletNote}</p> : null}
            {worn ? (
              <div className="mt-3 flex items-center gap-3">
                <GlyphAvatar traits={worn.traits} imageUrl={worn.imageUrl} hero />
                <p className="text-sm text-muted">{avatarLine(worn.traits)}</p>
              </div>
            ) : null}
            <WearAny />
            {satchel.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing kept yet. Clear a pit, or load a wallet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {satchel.map((glyph) => {
                  const active = worn?.tokenId === glyph.tokenId;
                  const kept = claims.includes(glyph.tokenId);
                  return (
                    <li key={glyph.tokenId}>
                      <button
                        type="button"
                        onClick={() => hold(active ? null : glyph.tokenId)}
                        className={
                          "w-full rounded-control border p-1 text-left " + (active ? "border-gold bg-surface" : "border-line")
                        }
                      >
                        <img src={mediaUrl(glyph.imageUrl)} alt="" className="aspect-square w-full rounded-control object-cover" />
                        <span className="mt-1 block truncate text-xs text-ink">{glyph.name}</span>
                        <span className="block truncate text-xs text-muted">{kept ? "Kept" : traitLine(glyph.traits)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {mapOpen && survey ? <MapSheet survey={survey} pose={pose} claims={claims} onClose={() => onMap(false)} /> : null}
      {guide ? <GuideSheet onClose={() => onGuide(false)} /> : null}
    </div>
  );
}

function Compass({ pose }: { pose: RefObject<Walker> }) {
  const node = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const tick = () => {
      const here = pose.current;
      if (node.current && here) {
        const turn = ((-here.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        node.current.textContent = dirs[Math.round(turn / (Math.PI / 4)) % 8] ?? "N";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pose]);
  return (
    <span ref={node} className="font-display text-sm text-gold">
      N
    </span>
  );
}

function mergeSatchel(owned: Glyph[], claims: string[], worn: Glyph | null): Glyph[] {
  const map = new Map<string, Glyph>();
  for (const glyph of TREASURY) {
    if (claims.includes(glyph.tokenId)) map.set(glyph.tokenId, glyph);
  }
  for (const glyph of owned) map.set(glyph.tokenId, glyph);
  if (worn) map.set(worn.tokenId, worn);
  return [...map.values()];
}
