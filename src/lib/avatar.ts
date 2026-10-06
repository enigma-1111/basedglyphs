export type Metal = "gold" | "silver" | "iron" | "copper";
export type Hour = "day" | "morning" | "evening" | "night";
export type Rank = "pharaoh" | "royal" | "priest" | "noble" | "scribe" | "farmer" | "merchant" | "work";

export type AvatarLook = {
  mark: string;
  metal: Metal;
  hour: Hour;
  rank: Rank;
};

const ORDER = ["Glyph", "Alchemy", "Hierarchy", "Time"] as const;

export function avatarLine(traits: Record<string, string>): string {
  return ORDER.map((key) => traits[key]).filter(Boolean).join(" · ");
}

export function lookOf(traits: Record<string, string>): AvatarLook {
  const alchemy = traits.Alchemy ?? "";
  const time = traits.Time ?? "";
  const station = (traits.Hierarchy ?? "").toLowerCase();
  const metal: Metal = alchemy.includes("Silver")
    ? "silver"
    : alchemy.includes("Iron")
      ? "iron"
      : alchemy.includes("Copper")
        ? "copper"
        : "gold";
  const hour: Hour = time.includes("Night")
    ? "night"
    : time.includes("Evening")
      ? "evening"
      : time.includes("Morning")
        ? "morning"
        : "day";
  const rank: Rank = station.startsWith("pharaoh")
    ? "pharaoh"
    : station.startsWith("royal")
      ? "royal"
      : station.startsWith("priest")
        ? "priest"
        : station.startsWith("noble")
          ? "noble"
          : station.startsWith("scribe")
            ? "scribe"
            : station.startsWith("farmer")
              ? "farmer"
              : station.startsWith("merchant")
                ? "merchant"
                : "work";
  return { mark: traits.Glyph || "𓂀", metal, hour, rank };
}
