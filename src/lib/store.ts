import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MaterialId, ShapeId, WorldRole } from "@/lib/collection";

export type SavedAsset = {
  id: string;
  source: "glyph" | "prompt";
  name: string;
  tokenId?: string;
  imageUrl?: string;
  material: MaterialId;
  height: number;
  glow: number;
  shape: ShapeId;
  prompt?: string;
  createdAt: number;
};

export type Placement = {
  id: string;
  assetId: string;
  role: WorldRole;
  x: number;
  z: number;
  rot: number;
  scale: number;
};

type GlyphDraft = {
  name: string;
  tokenId: string;
  imageUrl: string;
  material: MaterialId;
  height: number;
  glow: number;
};

type StudioState = {
  assets: SavedAsset[];
  placements: Placement[];
  selectedAssetId: string | null;
  saveGlyph: (draft: GlyphDraft) => string;
  savePrompt: (asset: Omit<SavedAsset, "id" | "createdAt" | "source">) => string;
  updateAsset: (id: string, patch: Partial<SavedAsset>) => void;
  removeAsset: (id: string) => void;
  selectAsset: (id: string | null) => void;
  place: (assetId: string, role: WorldRole) => string | null;
  updatePlacement: (id: string, patch: Partial<Placement>) => void;
  removePlacement: (id: string) => void;
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      assets: [],
      placements: [],
      selectedAssetId: null,
      saveGlyph: (draft) => {
        const existing = get().assets.find((asset) => asset.tokenId === draft.tokenId);
        if (existing) {
          set({
            assets: get().assets.map((asset) =>
              asset.id === existing.id
                ? {
                    ...asset,
                    name: draft.name,
                    imageUrl: draft.imageUrl,
                    material: draft.material,
                    height: draft.height,
                    glow: draft.glow,
                    shape: "tablet",
                  }
                : asset,
            ),
            selectedAssetId: existing.id,
          });
          return existing.id;
        }
        const id = crypto.randomUUID();
        const asset: SavedAsset = {
          id,
          source: "glyph",
          name: draft.name,
          tokenId: draft.tokenId,
          imageUrl: draft.imageUrl,
          material: draft.material,
          height: draft.height,
          glow: draft.glow,
          shape: "tablet",
          createdAt: Date.now(),
        };
        set({ assets: [asset, ...get().assets], selectedAssetId: id });
        return id;
      },
      savePrompt: (draft) => {
        const id = crypto.randomUUID();
        const asset: SavedAsset = { ...draft, id, source: "prompt", createdAt: Date.now() };
        set({ assets: [asset, ...get().assets], selectedAssetId: id });
        return id;
      },
      updateAsset: (id, patch) =>
        set({
          assets: get().assets.map((asset) => (asset.id === id ? { ...asset, ...patch, id } : asset)),
        }),
      removeAsset: (id) =>
        set({
          assets: get().assets.filter((asset) => asset.id !== id),
          placements: get().placements.filter((item) => item.assetId !== id),
          selectedAssetId: get().selectedAssetId === id ? null : get().selectedAssetId,
        }),
      selectAsset: (id) => set({ selectedAssetId: id }),
      place: (assetId, role) => {
        if (!get().assets.some((asset) => asset.id === assetId)) return null;
        if (get().placements.length >= 30) return null;
        const index = get().placements.length;
        const id = crypto.randomUUID();
        const placement: Placement = {
          id,
          assetId,
          role,
          x: role === "seal" ? 0 : index % 2 === 0 ? -0.65 : 0.65,
          z: -1.2 - index * 1.8,
          rot: 0,
          scale: role === "seal" ? 1.15 : 1,
        };
        set({ placements: [...get().placements, placement] });
        return id;
      },
      updatePlacement: (id, patch) =>
        set({
          placements: get().placements.map((item) =>
            item.id === id ? { ...item, ...patch, id } : item,
          ),
        }),
      removePlacement: (id) =>
        set({ placements: get().placements.filter((item) => item.id !== id) }),
    }),
    {
      name: "glyph-studio-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        assets: state.assets,
        placements: state.placements,
        selectedAssetId: state.selectedAssetId,
      }),
    },
  ),
);
