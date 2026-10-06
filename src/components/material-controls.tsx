import { MATERIALS, type MaterialId } from "@/lib/collection";

export function MaterialControls({
  material,
  height,
  glow,
  onMaterial,
  onHeight,
  onGlow,
}: {
  material: MaterialId;
  height: number;
  glow: number;
  onMaterial: (value: MaterialId) => void;
  onHeight: (value: number) => void;
  onGlow: (value: number) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm text-muted" id="material-label">
          Material
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-labelledby="material-label">
          {MATERIALS.map((item) => {
            const selected = item.id === material;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onMaterial(item.id)}
                className={
                  "min-h-11 rounded-control border px-3 text-sm " +
                  (selected
                    ? "border-gold bg-gold text-gold-ink"
                    : "border-line bg-surface text-ink")
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block text-sm text-muted">
        Height
        <input
          type="range"
          min={0.04}
          max={0.55}
          step={0.01}
          value={height}
          onChange={(event) => onHeight(Number(event.target.value))}
        />
      </label>
      <label className="block text-sm text-muted">
        Glow
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={glow}
          onChange={(event) => onGlow(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
