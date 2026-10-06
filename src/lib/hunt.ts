const KEY = "glyph-sands-claims-v1";
const TOOLS = "glyph-sands-tools-v1";
const TOOL_IDS = ["brush", "trowel", "mallet"] as const;

export function loadClaims(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function saveClaims(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
}

export function loadTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TOOLS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && (TOOL_IDS as readonly string[]).includes(id));
  } catch {
    return [];
  }
}

export function saveTools(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOOLS, JSON.stringify([...new Set(ids)]));
}
