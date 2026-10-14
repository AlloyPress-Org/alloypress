import { NextRequest } from "next/server";
import { payloadFetch } from "@/lib/payload";

const MEDIA_BASE = "https://media.alloypress.com";

type MediaDoc = { filename?: string | null };

// "123-Name.jpg" -> "name" (same logic as scripts/fix-media-urls.ts)
const norm = (f: string) =>
  f.replace(/^\d+-/, "").replace(/\.[a-z0-9]+$/i, "").toLowerCase();

async function findKey(raw: string): Promise<string | null> {
  let name = raw;
  try { name = decodeURIComponent(raw); } catch {}

  // 1) exact name, 2) WP size/scaled suffix illama (main image)
  const candidates = [
    name,
    name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "").replace(/-scaled(?=\.[a-z0-9]+$)/i, ""),
  ];

  for (const c of [...new Set(candidates)]) {
    const base = c.replace(/\.[a-z0-9]+$/i, "");
    const data = await payloadFetch<{ docs?: MediaDoc[] }>(
      `/media?where[filename][like]=${encodeURIComponent(base)}&limit=10&depth=0&select[filename]=true`,
      { strict: false, next: { revalidate: 86400, tags: ["media"] } },
    );
    const hit = data?.docs?.find((d) => d.filename && norm(d.filename) === norm(c));
    if (hit?.filename) return hit.filename;
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const file = path[path.length - 1];
  const key = file ? await findKey(file) : null;

  if (!key) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  return new Response(null, {
    status: 301,
    headers: {
      Location: `${MEDIA_BASE}/${encodeURIComponent(key)}`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}