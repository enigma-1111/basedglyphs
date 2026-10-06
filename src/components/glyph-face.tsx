import { useState } from "react";
import { mediaUrl, type Glyph } from "@/lib/collection";

export function GlyphFace({
  glyph,
  className = "",
}: {
  glyph: Pick<Glyph, "name" | "imageUrl" | "remoteUrl" | "traits">;
  className?: string;
}) {
  const [src, setSrc] = useState(mediaUrl(glyph.imageUrl));
  const [broken, setBroken] = useState(false);
  const mark = glyph.traits.Glyph || "𓂀";

  if (broken || !src) {
    return (
      <div
        className={`grid place-items-center bg-surface font-display text-5xl text-ink ${className}`}
        role="img"
        aria-label={glyph.name}
      >
        {mark}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={glyph.name}
      className={`h-full w-full object-cover ${className}`}
      onError={() => {
        const remote = mediaUrl(glyph.remoteUrl);
        if (remote && remote !== src) {
          setSrc(remote);
          return;
        }
        setBroken(true);
      }}
    />
  );
}
