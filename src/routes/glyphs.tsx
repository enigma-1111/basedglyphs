import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/glyphs")({ component: GlyphsLayout });

function GlyphsLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
