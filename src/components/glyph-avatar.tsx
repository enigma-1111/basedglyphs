import { useState } from "react";
import { avatarLine, lookOf, type Hour, type Metal, type Rank } from "@/lib/avatar";
import { COLLECTION } from "@/lib/collection";
import { useWallet } from "@/lib/wallet-store";

const SKY: Record<Hour, string> = {
  day: "bg-sun",
  morning: "bg-ink",
  evening: "bg-dusk",
  night: "bg-bg",
};

const PLATE: Record<Metal, string> = {
  gold: "bg-gold text-gold-ink",
  silver: "bg-ink text-gold-ink",
  iron: "bg-muted text-ink",
  copper: "bg-dusk text-gold-ink",
};

const CAP: Record<Rank, string> = {
  pharaoh: "border-t-4 border-gold",
  royal: "border-t-2 border-gold",
  priest: "border-t-4 border-ink",
  noble: "border-b-2 border-gold",
  work: "",
};

export function GlyphAvatar({
  traits,
  hero = false,
}: {
  traits: Record<string, string>;
  hero?: boolean;
}) {
  const look = lookOf(traits);
  return (
    <span
      className={
        "relative grid shrink-0 place-items-center overflow-hidden rounded-control border border-line " +
        SKY[look.hour] +
        " " +
        CAP[look.rank] +
        (hero ? " size-24" : " size-9")
      }
      role="img"
      aria-label={avatarLine(traits)}
    >
      <span
        className={
          "grid place-items-center rounded-control font-display leading-none " +
          PLATE[look.metal] +
          (hero ? " size-16 text-4xl" : " size-6 text-sm")
        }
      >
        {look.mark}
      </span>
    </span>
  );
}

export function WearAny() {
  const admin = useWallet((store) => store.admin);
  const status = useWallet((store) => store.status);
  const wearToken = useWallet((store) => store.wearToken);
  const [tokenId, setTokenId] = useState("");
  if (!admin) return null;
  return (
    <form
      className="mt-3 flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        void wearToken(tokenId);
      }}
    >
      <label className="block flex-1 text-sm text-muted" htmlFor="wear-any">
        Wear any seal
        <input
          id="wear-any"
          inputMode="numeric"
          value={tokenId}
          placeholder={`1–${COLLECTION.supply}`}
          onChange={(event) => setTokenId(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-control border border-line bg-bg px-3 text-ink"
        />
      </label>
      <button
        type="submit"
        className="min-h-11 self-end rounded-control bg-gold px-4 text-sm font-medium text-gold-ink"
        disabled={status === "loading" || tokenId.trim() === ""}
      >
        Wear it
      </button>
    </form>
  );
}
