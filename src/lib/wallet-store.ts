import { create } from "zustand";
import type { Glyph } from "@/lib/collection";
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
  connect: () => Promise<void>;
  loadExample: () => Promise<void>;
  hold: (id: string | null) => void;
};

async function load(address: string, set: (partial: Partial<WalletState>) => void) {
  set({ status: "loading", note: "", address, label: short(address) });
  try {
    const result = await ownedGlyphs({ data: { address } });
    const note = result.glyphs.length
      ? "Hold a glyph to carry its face. The seals in the sand are the treasury set."
      : "No Based Glyphs in this wallet. The seals in the sand are still the treasury set.";
    set({ glyphs: result.glyphs, status: "ready", note, heldId: result.glyphs[0]?.tokenId ?? null });
  } catch (error) {
    set({
      status: "error",
      glyphs: [],
      note: error instanceof Error ? error.message : "Could not read that wallet.",
    });
  }
}

export const useWallet = create<WalletState>((set) => ({
  address: null,
  label: "",
  glyphs: [],
  status: "idle",
  note: "",
  heldId: null,
  hold: (id) => set({ heldId: id }),
  loadExample: () => load(EXAMPLE_WALLET, set),
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
      await load(address, set);
    } catch (error) {
      set({
        status: "error",
        note: error instanceof Error ? error.message : "Could not connect.",
      });
    }
  },
}));
