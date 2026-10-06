export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function previewNote(lines: string[]) {
  return [
    "Glyph Studio preview",
    "Live mesh export connects later.",
    "",
    "This is not a 3D mesh. It records the asset so a later exporter can build the GLB.",
    "",
    ...lines,
  ].join("\n");
}
