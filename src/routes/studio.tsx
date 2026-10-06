import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MaterialControls } from "@/components/material-controls";
import { Shell } from "@/components/shell";
import type { ViewerApi } from "@/components/view-spec";
import { ViewerHost } from "@/components/viewer-host";
import { mediaUrl, shapeFromPrompt, type MaterialId } from "@/lib/collection";
import { downloadBlob, previewNote } from "@/lib/download";
import { useStudio, type SavedAsset } from "@/lib/store";

export const Route = createFileRoute("/studio")({ component: StudioPage });

async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function StudioPage() {
  const assets = useStudio((store) => store.assets);
  const selectedAssetId = useStudio((store) => store.selectedAssetId);
  const selectAsset = useStudio((store) => store.selectAsset);
  const updateAsset = useStudio((store) => store.updateAsset);
  const removeAsset = useStudio((store) => store.removeAsset);
  const savePrompt = useStudio((store) => store.savePrompt);
  const [prompt, setPrompt] = useState("");
  const [upload, setUpload] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    material: "stone" as MaterialId,
    height: 0.22,
    glow: 0.25,
  });
  const apiRef = useRef<ViewerApi | null>(null);
  const selected = assets.find((asset) => asset.id === selectedAssetId) ?? null;

  useEffect(() => {
    if (!selectedAssetId && assets[0]) selectAsset(assets[0].id);
  }, [assets, selectAsset, selectedAssetId]);

  const material = selected?.material ?? draft.material;
  const height = selected?.height ?? draft.height;
  const glow = selected?.glow ?? draft.glow;

  function setMaterial(value: MaterialId) {
    if (selected) updateAsset(selected.id, { material: value });
    else setDraft((current) => ({ ...current, material: value }));
  }
  function setHeight(value: number) {
    if (selected) updateAsset(selected.id, { height: value });
    else setDraft((current) => ({ ...current, height: value }));
  }
  function setGlow(value: number) {
    if (selected) updateAsset(selected.id, { glow: value });
    else setDraft((current) => ({ ...current, glow: value }));
  }

  function generate() {
    const text = prompt.trim();
    if (!text && !upload) {
      setMessage("Describe a prop or shrine, or add an image.");
      return;
    }
    const shape = shapeFromPrompt(text);
    const name = text.slice(0, 48) || "Uploaded prop";
    savePrompt({
      name,
      imageUrl: upload,
      material,
      height,
      glow,
      shape,
      prompt: text,
    });
    setMessage(`Added “${name}” to the shelf.`);
    setPrompt("");
  }

  async function exportPng() {
    try {
      const blob = await apiRef.current?.captureTurntable();
      if (!blob) {
        setMessage("The preview is not ready yet.");
        return;
      }
      downloadBlob("glyph-turntable.png", blob);
      setMessage("Downloaded a PNG turntable. Live mesh export connects later.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not export the image.");
    }
  }

  function exportGlb(asset: SavedAsset) {
    const note = previewNote([
      `Name: ${asset.name}`,
      `Shape: ${asset.shape}`,
      `Material: ${asset.material}`,
      `Height: ${asset.height}`,
      `Glow: ${asset.glow}`,
      asset.tokenId ? `Token: ${asset.tokenId}` : "",
      asset.prompt ? `Prompt: ${asset.prompt}` : "",
    ].filter(Boolean));
    downloadBlob("glyph-studio-preview.txt", new Blob([note], { type: "text/plain" }));
    setMessage("Downloaded a preview file. Live mesh export connects later.");
  }

  const spec = {
    imageUrl: mediaUrl(selected?.imageUrl),
    material,
    height,
    glow,
    shape: selected?.shape ?? shapeFromPrompt(prompt),
    spin: true,
  };

  return (
    <Shell>
      <main>
        <h1 className="font-display text-3xl text-ink">Studio</h1>
        <p className="mt-2 text-sm text-muted">For fun. Glyphs you claim in the sands land here, on this device.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_18rem]">
          <section className="order-3 lg:order-1">
            <h2 className="text-sm text-muted">Saved assets</h2>
            {assets.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing saved yet. Make a glyph 3D, or generate a prop.</p>
            ) : (
              <ul className="mt-3 flex gap-2 overflow-x-auto lg:block lg:space-y-2">
                {assets.map((asset) => {
                  const active = asset.id === selected?.id;
                  return (
                    <li key={asset.id} className="min-w-40 lg:min-w-0">
                      <button
                        type="button"
                        onClick={() => selectAsset(asset.id)}
                        className={
                          "flex min-h-11 w-full items-center gap-2 rounded-control border px-2 py-2 text-left " +
                          (active ? "border-gold bg-surface" : "border-line bg-bg")
                        }
                      >
                        {asset.imageUrl ? (
                          <img
                            src={mediaUrl(asset.imageUrl)}
                            alt=""
                            className="size-12 rounded-control object-cover"
                          />
                        ) : (
                          <span className="grid size-12 place-items-center rounded-control bg-surface text-lg text-gold">
                            𓂀
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ink">{asset.name}</span>
                          <span className="block text-xs text-muted">{asset.shape}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {selected ? (
              <button
                type="button"
                onClick={() => removeAsset(selected.id)}
                className="mt-3 min-h-11 text-sm text-muted"
              >
                Remove from shelf
              </button>
            ) : null}
          </section>
          <section className="order-1 lg:order-2">
            {assets.length === 0 && !prompt ? (
              <div className="stage-piece grid place-items-center rounded-card border border-line bg-surface px-6 text-center text-sm text-muted">
                The viewer is empty. Save a glyph or describe a prop.
              </div>
            ) : (
              <ViewerHost spec={spec} apiRef={apiRef} />
            )}
          </section>
          <section className="order-2 grid content-start gap-4 lg:order-3">
            <label className="text-sm text-muted" htmlFor="prop-prompt">
              Describe a prop or shrine
              <textarea
                id="prop-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="describe a prop or shrine"
                rows={4}
                className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-3 text-ink placeholder:text-faint"
              />
            </label>
            <label className="text-sm text-muted">
              Image
              <input
                type="file"
                accept="image/*"
                className="mt-2 block min-h-11 w-full text-sm text-ink"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void shrinkImage(file)
                    .then((url) => {
                      setUpload(url);
                      setMessage("Image added. Generate to put it on the shelf.");
                    })
                    .catch(() => setMessage("Could not read that image."));
                }}
              />
            </label>
            {upload ? (
              <img src={upload} alt="Upload preview" className="h-24 w-24 rounded-control object-cover" />
            ) : null}
            <button
              type="button"
              onClick={generate}
              className="min-h-12 rounded-control bg-gold px-5 font-medium text-gold-ink"
            >
              Generate
            </button>
            <MaterialControls
              material={material}
              height={height}
              glow={glow}
              onMaterial={setMaterial}
              onHeight={setHeight}
              onGlow={setGlow}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && exportGlb(selected)}
                className="min-h-11 rounded-control border border-line text-sm text-ink disabled:opacity-40"
              >
                GLB
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => void exportPng()}
                className="min-h-11 rounded-control border border-line text-sm text-ink disabled:opacity-40"
              >
                PNG turntable
              </button>
            </div>
            <p className="text-sm text-muted">Live mesh export connects later.</p>
            {message ? (
              <p className="text-sm text-ink" aria-live="polite">
                {message}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </Shell>
  );
}
