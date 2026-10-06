import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStudio } from "@/lib/store";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    void useStudio.persist.rehydrate();
  }, []);

  const links = [
    { to: "/world" as const, label: "Sands", search: { difficulty: "medium" as const }, active: pathname.startsWith("/world") },
    { to: "/glyphs" as const, label: "Glyphs", search: undefined, active: pathname.startsWith("/glyphs") },
    { to: "/studio" as const, label: "Studio", search: undefined, active: pathname.startsWith("/studio") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
          <Link to="/" className="flex min-h-11 items-center gap-2 pr-1" aria-label="Glyph Sands home">
            <span className="grid size-9 place-items-center rounded-control border border-line font-display text-lg text-gold">
              𓂀
            </span>
            <span className="hidden font-display text-sm tracking-wide text-ink sm:inline">Glyph Sands</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1" aria-label="Main">
            {links.map((link) =>
              link.to === "/world" ? (
                <Link
                  key={link.label}
                  to="/world"
                  search={link.search}
                  aria-current={link.active ? "page" : undefined}
                  className={
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-2.5 text-sm " +
                    (link.active ? "bg-gold text-gold-ink" : "text-ink")
                  }
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  aria-current={link.active ? "page" : undefined}
                  className={
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-2.5 text-sm " +
                    (link.active ? "bg-gold text-gold-ink" : "text-ink")
                  }
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">{children}</div>
    </div>
  );
}
