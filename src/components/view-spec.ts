import type { MaterialId, ShapeId } from "@/lib/collection";

export type ViewSpec = {
  imageUrl?: string;
  material: MaterialId;
  height: number;
  glow: number;
  shape: ShapeId;
  spin?: boolean;
};

export type ViewerApi = {
  captureTurntable: () => Promise<Blob>;
};
