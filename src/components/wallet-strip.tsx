import { mediaUrl, traitLine } from "@/lib/collection";
import { useWallet } from "@/lib/wallet-store";

export function WalletStrip() {
  const label = useWallet((store) => store.label);
  const glyphs = useWallet((store) => store.glyphs);
  const status = useWallet((store) => store.status);
  const note = useWallet((store) => store.note);
  const heldId = useWallet((store) => store.heldId);
  const connect = useWallet((store) => store.connect);
  const loadExample = useWallet((store) => store.loadExample);
  const hold = useWallet((store) => store.hold);

  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-4">
      <h2 className="font-display text-xl text-ink">Your glyphs</h2>
      <p className="mt-1 text-sm text-muted">
        Connect a wallet to carry your Based Glyphs into the desert. The buried examples come from glyph.base.eth.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="min-h-11 rounded-control bg-gold px-4 font-medium text-gold-ink"
          disabled={status === "loading"}
          onClick={() => void connect()}
        >
          {status === "loading" ? "Looking…" : "Connect wallet"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-control border border-line px-4 text-ink"
          disabled={status === "loading"}
          onClick={() => void loadExample()}
        >
          Preview glyph.base.eth
        </button>
      </div>
      {label ? <p className="mt-3 text-sm text-gold">{label}</p> : null}
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
      {glyphs.length > 0 ? (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {glyphs.map((glyph) => {
            const active = heldId === glyph.tokenId;
            return (
              <li key={glyph.tokenId} className="w-24 shrink-0">
                <button
                  type="button"
                  onClick={() => hold(active ? null : glyph.tokenId)}
                  className={
                    "w-full rounded-control border p-1 text-left " +
                    (active ? "border-gold bg-bg" : "border-line")
                  }
                >
                  <img src={mediaUrl(glyph.imageUrl)} alt="" className="aspect-square w-full rounded-control object-cover" />
                  <span className="mt-1 block truncate text-xs text-ink">{glyph.name}</span>
                  <span className="block truncate text-xs text-muted">{traitLine(glyph.traits)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
