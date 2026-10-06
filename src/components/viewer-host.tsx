import { useEffect, useState, type ComponentType, type RefObject } from "react";
import type { ViewSpec } from "@/components/view-spec";
import type { ViewerApi } from "@/components/view-spec";

export function ViewerHost({
  spec,
  apiRef,
}: {
  spec: ViewSpec;
  apiRef: RefObject<ViewerApi | null>;
}) {
  const [View, setView] = useState<ComponentType<{
    spec: ViewSpec;
    apiRef: RefObject<ViewerApi | null>;
  }> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./piece-canvas").then((mod) => {
      if (live) setView(() => mod.PieceCanvas);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!View) {
    return (
      <div className="stage-piece grid place-items-center rounded-card border border-line bg-surface text-sm text-muted">
        Carving the preview…
      </div>
    );
  }

  return <View spec={spec} apiRef={apiRef} />;
}
