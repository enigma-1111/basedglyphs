import { GlyphAvatar, WearAny } from "@/components/glyph-avatar";
import { mediaUrl } from "@/lib/collection";
import { avatarLine } from "@/lib/avatar";
import { useWallet } from "@/lib/wallet-store";

export function WalletStrip() {
  const label = useWallet((store) => store.label);
  const glyphs = useWallet((store) => store.glyphs);
  const status = useWallet((store) => store.status);
  const note = useWallet((store) => store.note);
  const worn = useWallet((store) => store.worn);
  const connect = useWallet((store) => store.connect);
  const loadExample = useWallet((store) => store.loadExample);
  const hold = useWallet((store) => store.hold);

  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-4">
      <h2 className="font-display text-xl text-ink">Your glyphs</h2>
      <p className="mt-1 text-sm text-muted">
        Connect a wallet to wear one of your Based Glyphs. The face is built from the glyph, then its metal, rank, and hour.
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
      {worn ? (
        <div className="mt-4 flex items-center gap-3">
          <GlyphAvatar traits={worn.traits} hero />
          <div>
            <p className="font-display text-lg text-ink">{worn.name}</p>
            <p className="text-sm text-muted">{avatarLine(worn.traits)}</p>
          </div>
        </div>
      ) : null}
      <WearAny />
      {glyphs.length > 0 ? (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {glyphs.map((glyph) => {
            const active = worn?.tokenId === glyph.tokenId;
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
                  <span className="mt-1 block truncate text-xs text-muted">{avatarLine(glyph.traits)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
