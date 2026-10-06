import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { WalletStrip } from "@/components/wallet-strip";
import { BURIAL_LATER, BURIAL_NOW } from "@/lib/burials";
import type { Difficulty } from "@/lib/treasury";

export const Route = createFileRoute("/")({ component: Home });

const LEVELS: { id: Difficulty; title: string; copy: string; featured?: boolean }[] = [
  { id: "easy", title: "Easy", copy: "Four seals under loose sand. Your hands can move it. A brush helps." },
  {
    id: "medium",
    title: "Medium",
    copy: "Eight pits. Some are packed earth or a clay pot. You will need a trowel.",
    featured: true,
  },
  { id: "hard", title: "Hard", copy: "Deeper pits, the last under fallen stone. The mallet shifts rubble." },
];

function Home() {
  return (
    <Shell>
      <main className="pb-8">
        <p className="font-display text-sm tracking-widest text-gold">Based Glyphs</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-ink sm:text-6xl">
          Dig like a surveyor. Keep what rises.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          An Egyptian river plain at dusk. The treasury’s Based Glyphs are buried under sand, packed earth, clay
          pots, and fallen stone. Nothing marks where they are. Find one and it stays on this device. It does not
          move the token on Base.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {LEVELS.map((level) => (
            <Link
              key={level.id}
              to="/world"
              search={{ difficulty: level.id }}
              className={
                "flex min-h-28 flex-col justify-between rounded-card border p-4 " +
                (level.featured ? "border-gold bg-gold text-gold-ink" : "border-line bg-surface text-ink")
              }
            >
              <span className="font-display text-2xl">{level.title}</span>
              <span className={"mt-3 text-sm " + (level.featured ? "text-gold-ink" : "text-muted")}>{level.copy}</span>
            </Link>
          ))}
        </div>
        <WalletStrip />
        <section className="mt-8 max-w-md">
          <h2 className="font-display text-xl text-ink">Later expeditions</h2>
          <p className="mt-2 text-sm text-muted">
            Other collections held in {BURIAL_NOW.walletLabel} can be buried on a future walk. This version only hides{" "}
            {BURIAL_NOW.name}.
          </p>
          <label className="mt-3 block text-sm text-muted" htmlFor="later-collections">
            {BURIAL_LATER.label}
            <input
              id="later-collections"
              disabled={!BURIAL_LATER.enabled}
              placeholder="Coming later"
              className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3 text-faint"
            />
          </label>
        </section>
        <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/glyphs" className="text-gold">
            Browse the collection
          </Link>
          <Link to="/studio" className="text-muted">
            Studio, for fun
          </Link>
        </p>
      </main>
    </Shell>
  );
}
