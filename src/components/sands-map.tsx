import { useEffect, useRef, useState, type RefObject } from "react";
import { nearestPlace, PLACES, SPAN, type ChartGlyph, type Landmark, type LandmarkKind, type Walker, type WorldSurvey } from "@/game/field";

export type { Walker };

const LEGEND: { kind: LegendKind; label: string; note: string }[] = [
  { kind: "you", label: "You", note: "Gold arrow. It points the way you face." },
  { kind: "camp", label: "Camp", note: "Where you started, south." },
  { kind: "pyramid", label: "Pyramid", note: "Smooth stone houses on the north rise. Walk around them." },
  { kind: "oasis", label: "Sun basin", note: "A gold ring in the sand. A landmark, not a seal." },
  { kind: "obelisk", label: "Needle", note: "A tapered stone spike. Use it to keep a bearing." },
  { kind: "ruin", label: "Columns", note: "A short row of standing columns." },
  { kind: "grove", label: "Palms", note: "Shade on the west side of camp." },
  { kind: "tool", label: "Tool cache", note: "A gold diamond. Brush, trowel, or mallet. Not a seal." },
  { kind: "dust", label: "Still buried", note: "Not marked. The map does not lead you to a seal." },
  { kind: "kept", label: "Lifted", note: "Already in your satchel. It stays on the map." },
];

type LegendKind = LandmarkKind | "you" | "dust" | "kept" | "tool";

function Mark({ kind }: { kind: LegendKind }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-gold" aria-hidden>
      {kind === "pyramid" ? <path d="M8 1.5 14.5 14.5H1.5Z" fill="currentColor" /> : null}
      {kind === "camp" ? <rect x="3" y="3" width="10" height="10" fill="currentColor" /> : null}
      {kind === "oasis" ? <circle cx="8" cy="8" r="5" fill="currentColor" /> : null}
      {kind === "obelisk" ? <path d="M6.5 1.5h3L11 14.5H5Z" fill="currentColor" /> : null}
      {kind === "ruin" ? <path d="M1.5 14.5V6.5h3v8h2V2.5h3v12h2V8h3v6.5Z" fill="currentColor" /> : null}
      {kind === "grove" ? <path d="M8 1.5 12.5 8H10l3 6.5H3L6 8H3.5Z" fill="currentColor" /> : null}
      {kind === "tool" ? <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill="currentColor" /> : null}
      {kind === "you" ? <path d="M8 1 14 14.5 8 11.2 2 14.5Z" fill="currentColor" /> : null}
      {kind === "dust" ? <circle cx="8" cy="8" r="3" fill="currentColor" /> : null}
      {kind === "kept" ? (
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      ) : null}
    </svg>
  );
}

function percent(x: number, z: number) {
  return { left: `${(x / SPAN) * 100}%`, top: `${(z / SPAN) * 100}%` };
}

function useChartMotion(
  pose: RefObject<Walker>,
  youRef: RefObject<HTMLSpanElement | null>,
  dotsRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const you = youRef.current;
      const here = pose.current;
      if (you && here) {
        you.style.left = `${(here.x / SPAN) * 100}%`;
        you.style.top = `${(here.z / SPAN) * 100}%`;
        you.style.transform = `translate(-50%, -50%) rotate(${-here.yaw}rad)`;
      }
      const root = dotsRef.current;
      if (root && here) {
        for (const node of root.querySelectorAll<HTMLElement>("[data-gx]")) {
          const found = node.dataset.found === "1";
          node.style.opacity = found ? "1" : "0";
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pose, youRef, dotsRef]);
}

function Chart({
  survey,
  pose,
  claims,
  selectedId,
  onPick,
}: {
  survey: WorldSurvey;
  pose: RefObject<Walker>;
  claims: string[];
  selectedId?: string | null;
  onPick?: (place: Landmark) => void;
}) {
  const youRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  useChartMotion(pose, youRef, dotsRef);
  const claimed = new Set(claims);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-control border border-line bg-soil">
      <img src={survey.mapUrl} alt="Top-down map of the sands. North is up." className="sands-map-img" />
      <span className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 font-display text-xs text-gold-ink">
        N
      </span>
      <div ref={dotsRef} className="pointer-events-none absolute inset-0">
        {survey.glyphs.map((glyph) => (
          <Pip key={glyph.tokenId} glyph={glyph} found={claimed.has(glyph.tokenId) || !glyph.sealed} />
        ))}
      </div>
      {PLACES.map((place) =>
        onPick ? (
          <button
            key={place.id}
            type="button"
            className={
              "absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full " +
              (selectedId === place.id ? "bg-bg/80 ring-2 ring-gold" : "")
            }
            style={percent(place.x, place.z)}
            aria-label={place.name}
            aria-pressed={selectedId === place.id}
            onClick={() => onPick(place)}
          >
            <Mark kind={place.kind} />
          </button>
        ) : (
          <span
            key={place.id}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={percent(place.x, place.z)}
          >
            <Mark kind={place.kind} />
          </span>
        ),
      )}
      <span ref={youRef} className="sands-you pointer-events-none absolute z-20" aria-hidden>
        <Mark kind="you" />
      </span>
    </div>
  );
}

function Pip({ glyph, found }: { glyph: ChartGlyph; found: boolean }) {
  return (
    <span
      data-gx={glyph.x}
      data-gz={glyph.z}
      data-tier={glyph.tier}
      data-found={found ? "1" : "0"}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 opacity-0"
      style={percent(glyph.x, glyph.z)}
      title={found ? glyph.name : undefined}
    >
      <Mark kind={found ? "kept" : "dust"} />
    </span>
  );
}

export function SandsMinimap({
  survey,
  pose,
  claims,
  onOpen,
}: {
  survey: WorldSurvey;
  pose: RefObject<Walker>;
  claims: string[];
  onOpen: () => void;
}) {
  return (
    <button type="button" className="pointer-events-auto w-28" aria-label="Open the map" onClick={onOpen}>
      <Chart survey={survey} pose={pose} claims={claims} />
    </button>
  );
}

export function MapSheet({
  survey,
  pose,
  claims,
  onClose,
}: {
  survey: WorldSurvey;
  pose: RefObject<Walker>;
  claims: string[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Landmark | null>(null);
  const [near, setNear] = useState("Camp");
  useEffect(() => {
    const tick = () => {
      const here = pose.current;
      if (!here) return;
      setNear(nearestPlace(here.x, here.z).name);
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [pose]);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg/70 p-3 sm:items-center">
      <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm tracking-widest text-gold">Sands</p>
            <h2 className="font-display text-3xl text-ink">Map</h2>
          </div>
          <button type="button" className="min-h-11 px-3 text-sm text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          North is up. Pale ridges are high sand, dark is the fields, blue is the river. Gold diamonds are tools. You are near {near}.
        </p>
        <div className="mt-3">
          <Chart survey={survey} pose={pose} claims={claims} selectedId={selected?.id ?? null} onPick={setSelected} />
        </div>
        <p className="mt-3 text-sm text-ink">
          {selected ? (
            <>
              <span className="font-medium">{selected.name}.</span> {selected.blurb}
            </>
          ) : (
            <span className="text-muted">Tap a mark, or a name below, to read what it is.</span>
          )}
        </p>
        <h3 className="mt-4 font-display text-lg text-ink">Legend</h3>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEGEND.map((item) => (
            <li key={item.kind} className="flex items-start gap-2">
              <span className="mt-0.5 grid size-7 place-items-center rounded-control bg-surface">
                <Mark kind={item.kind} />
              </span>
              <span>
                <span className="block text-sm text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.note}</span>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 font-display text-lg text-ink">Places</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {PLACES.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className={
                  "flex min-h-11 w-full items-center gap-3 rounded-control border px-3 text-left " +
                  (selected?.id === place.id ? "border-gold bg-surface" : "border-line")
                }
                onClick={() => setSelected(place)}
              >
                <Mark kind={place.kind} />
                <span className="text-sm text-ink">{place.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Walk",
    body: "Hold W to walk the way you face. S steps back. On a phone, push the stick up to walk.",
  },
  {
    title: "Turn",
    body: "A or the left arrow turns you left. D or the right arrow turns you right. Push the stick sideways to turn.",
  },
  {
    title: "Tools",
    body: "You start with your hands. Gold diamonds on the map are a brush, a trowel, and a mallet. Take one when you reach it, then tap it to use it.",
  },
  {
    title: "Dig",
    body: "Stand on loose sand, packed earth, a clay pot, or fallen stone. Hold the dig button, or hold Space. The wrong tool will not bite. The bar fills one layer at a time.",
  },
  {
    title: "The seal",
    body: "When the last layer is gone, the glyph rises and faces you. It is kept in your satchel and the studio. The token on Base does not move.",
  },
  {
    title: "The map",
    body: "North is up. The river is blue on the west, the dark band is the fields, and the triangles are the pyramids. Gold diamonds are tools. Lifted seals stay marked. Buried ones do not.",
  },
  {
    title: "The treasury",
    body: "Every walk hides the same treasury seals, from glyph.base.eth. A wallet only lets you carry a face. It does not change what is buried, and a find does not move the token.",
  },
];

export function GuideSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg/70 p-3 sm:items-center">
      <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm tracking-widest text-gold">Sands</p>
            <h2 className="font-display text-3xl text-ink">How to walk</h2>
          </div>
          <button type="button" className="min-h-11 px-3 text-sm text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-control border border-line bg-surface p-3">
              <p className="font-display text-sm text-gold">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-ink">{step.body}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="mt-4 min-h-12 w-full rounded-control bg-gold font-medium text-gold-ink" onClick={onClose}>
          Close the guide
        </button>
      </div>
    </div>
  );
}
