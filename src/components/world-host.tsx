import { useEffect, useState, type ComponentType } from "react";
import type { Placement, SavedAsset } from "@/lib/store";

type WorldProps = {
  placements: Placement[];
  assets: SavedAsset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function WorldHost(props: WorldProps) {
  const [View, setView] = useState<ComponentType<WorldProps> | null>(null);
  useEffect(() => {
    let live = true;
    void import("./world-canvas").then((mod) => {
      if (live) setView(() => mod.WorldCanvas);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!View) {
    return (
      <div className="stage-world grid place-items-center rounded-card border border-line bg-surface text-sm text-muted">
        Lighting the path…
      </div>
    );
  }
  return <View {...props} />;
}
