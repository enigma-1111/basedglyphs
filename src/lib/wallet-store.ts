import { create } from "zustand";
import type { Glyph } from "@/lib/collection";
import { browseGlyphs } from "@/lib/glyphs.functions";
import { COLLECTION } from "@/lib/collection";
import { EXAMPLE_LABEL, EXAMPLE_WALLET, sameAddress } from "@/lib/treasury";
import { ownedGlyphs } from "@/lib/wallet.functions";

type Status = "idle" | "loading" | "ready" | "error";

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function ethereum(): Eth | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eth }).ethereum;
  return eth?.request ? eth : null;
}

function short(address: string): string {
  return sameAddress(address, EXAMPLE_WALLET) ? EXAMPLE_LABEL : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type WalletState = {
  address: string | null;
  label: string;
  glyphs: Glyph[];
  status: Status;
  note: string;
  heldId: string | null;
  worn: Glyph | null;
  admin: boolean;
  connect: () => Promise<void>;
  loadExample: () => Promise<void>;
  hold: (id: string | null) => void;
  wearToken: (tokenId: string) => Promise<void>;
  restore: (glyph: Glyph) => void;
};

const WORN_KEY = "glyph-sands-worn-v1";

function remember(glyph: Glyph | null) {
  if (typeof window === "undefined") return;
  if (!glyph) localStorage.removeItem(WORN_KEY);
  else localStorage.setItem(WORN_KEY, JSON.stringify(glyph));
}

function applyWorn(
  glyphs: Glyph[],
  address: string,
  previous: Glyph | null,
): { worn: Glyph | null; heldId: string | null } {
  const admin = sameAddress(address, EXAMPLE_WALLET);
  if (previous && (admin || glyphs.some((glyph) => glyph.tokenId === previous.tokenId))) {
    return { worn: previous, heldId: previous.tokenId };
  }
  const first = glyphs[0] ?? null;
  return { worn: first, heldId: first?.tokenId ?? null };
}

async function load(
  address: string,
  set: (partial: Partial<WalletState>) => void,
  get: () => WalletState,
) {
  set({ status: "loading", note: "", address, label: short(address), admin: sameAddress(address, EXAMPLE_WALLET) });
  try {
    const result = await ownedGlyphs({ data: { address } });
    const next = applyWorn(result.glyphs, address, get().worn);
    if (next.worn) remember(next.worn);
    const note = result.glyphs.length
      ? "Wear a glyph. Its face is the glyph, then metal, rank, and hour. The seals in the sand stay the treasury set."
      : "No Based Glyphs in this wallet. The seals in the sand are still the treasury set.";
    set({ glyphs: result.glyphs, status: "ready", note, ...next });
  } catch (error) {
    set({
      status: "error",
      glyphs: [],
      note: error instanceof Error ? error.message : "Could not read that wallet.",
    });
  }
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  label: "",
  glyphs: [],
  status: "idle",
  note: "",
  heldId: null,
  worn: null,
  admin: false,
  restore: (glyph) => {
    remember(glyph);
    set({ worn: glyph, heldId: glyph.tokenId });
  },
  hold: (id) => {
    if (!id) {
      remember(null);
      set({ heldId: null, worn: null });
      return;
    }
    const state = get();
    const glyph = state.glyphs.find((item) => item.tokenId === id) ?? (state.worn?.tokenId === id ? state.worn : null);
    if (!glyph) return;
    if (!state.admin && !state.glyphs.some((item) => item.tokenId === id)) return;
    remember(glyph);
    set({ heldId: id, worn: glyph });
  },
  wearToken: async (tokenId) => {
    const state = get();
    if (!state.admin) {
      set({ note: "Only glyph.base.eth can wear a seal it does not hold." });
      return;
    }
    const id = tokenId.replace(/\D/g, "").replace(/^0+/, "");
    const number = Number(id);
    if (!id || number < 1 || number > COLLECTION.supply) {
      set({ note: `Use a token number from 1 to ${COLLECTION.supply}.` });
      return;
    }
    set({ status: "loading", note: "" });
    try {
      const result = await browseGlyphs({ data: { tokenId: id, limit: 1 } });
      const glyph = result.glyphs[0];
      if (!glyph || String(Number(glyph.tokenId)) !== id) {
        set({ status: "ready", note: "That seal was not found." });
        return;
      }
      remember(glyph);
      set({ status: "ready", worn: glyph, heldId: glyph.tokenId, note: `Wearing ${glyph.name}.` });
    } catch (error) {
      set({
        status: "ready",
        note: error instanceof Error ? error.message : "Could not wear that seal.",
      });
    }
  },
  loadExample: () => load(EXAMPLE_WALLET, set, get),
  connect: async () => {
    const eth = ethereum();
    if (!eth) {
      set({
        status: "error",
        note: "No wallet in this browser. Preview glyph.base.eth to carry the example glyphs.",
      });
      return;
    }
    set({ status: "loading", note: "" });
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("The wallet did not share an address.");
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x2105" }] });
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        }
      }
      await load(address, set, get);
    } catch (error) {
      set({
        status: "error",
        note: error instanceof Error ? error.message : "Could not connect.",
      });
    }
  },
}));

export function restoreWorn() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(WORN_KEY);
  if (!raw) return;
  try {
    const glyph = JSON.parse(raw) as Glyph;
    if (!glyph?.tokenId || !glyph.traits) return;
    useWallet.getState().restore(glyph);
  } catch {
    localStorage.removeItem(WORN_KEY);
  }
}
