import { useEffect, useState, type ComponentType } from "react";
import type { FieldProps } from "@/components/field-world";

export function SandsHost(props: FieldProps) {
  const [View, setView] = useState<ComponentType<FieldProps> | null>(null);
  useEffect(() => {
    let live = true;
    void import("@/components/field-world").then((mod) => {
      if (live) setView(() => mod.FieldWorld);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!View) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <p className="rounded-control bg-bg px-4 py-3 text-sm text-ink">Raising the dunes…</p>
      </div>
    );
  }
  return <View {...props} />;
}
