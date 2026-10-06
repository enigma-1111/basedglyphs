import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = new Set(["i2c.seadn.io", "i2.seadn.io", "raw2.seadn.io"]);

async function handleMedia(request: Request): Promise<Response> {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) return new Response("Missing image.", { status: 400 });
  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response("Bad image address.", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Image host is not allowed.", { status: 400 });
  }
  try {
    const upstream = await fetch(target, {
      headers: {
        accept: "image/avif,image/png,image/jpeg,image/*",
        "user-agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) return new Response("Image unavailable.", { status: 502 });
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > 8_000_000) return new Response("Image is too large.", { status: 413 });
    const type = upstream.headers.get("content-type") ?? "image/avif";
    return new Response(bytes, {
      headers: {
        "content-type": type.startsWith("image/") ? type : "application/octet-stream",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Image unavailable.", { status: 502 });
  }
}

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      GET: ({ request }) => handleMedia(request),
    },
  },
});
