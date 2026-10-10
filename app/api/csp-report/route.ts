import { NextRequest } from "next/server";

const MAX_BYTES = 8 * 1024;

const EXTENSION_SCHEME =
  /^(chrome-extension|moz-extension|safari-extension|safari-web-extension|webkit-masked-url):/i;

function str(value: unknown, max = 200): string | undefined {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function stripQuery(value: unknown): string | undefined {
  const s = str(value, 300);
  if (!s) return undefined;
  const i = s.search(/[?#]/);
  return i === -1 ? s : s.slice(0, i);
}

type Flat = {
  directive?: string;
  blocked?: string;
  page?: string;
  source?: string;
  line?: number;
  sample?: string;
  disposition?: string;
};

function flatten(raw: unknown): Flat | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // legacy report-uri
  const legacy = r["csp-report"];
  if (typeof legacy === "object" && legacy !== null) {
    const b = legacy as Record<string, unknown>;
    return {
      directive: str(b["effective-directive"] ?? b["violated-directive"], 60),
      blocked: stripQuery(b["blocked-uri"]),
      page: stripQuery(b["document-uri"]),
      source: stripQuery(b["source-file"]),
      line: typeof b["line-number"] === "number" ? b["line-number"] : undefined,
      sample: str(b["script-sample"], 100),
      disposition: str(b["disposition"], 20),
    };
  }

  // modern report-to
  if (r.type === "csp-violation" && typeof r.body === "object" && r.body) {
    const b = r.body as Record<string, unknown>;
    return {
      directive: str(b.effectiveDirective ?? b.violatedDirective, 60),
      blocked: stripQuery(b.blockedURL),
      page: stripQuery(b.documentURL),
      source: stripQuery(b.sourceFile),
      line: typeof b.lineNumber === "number" ? b.lineNumber : undefined,
      sample: str(b.sample, 100),
      disposition: str(b.disposition, 20),
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) return new Response(null, { status: 204 });

    const text = await request.text();
    if (!text || text.length > MAX_BYTES) return new Response(null, { status: 204 });

    const parsed: unknown = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items.slice(0, 10)) {
      const v = flatten(item);
      if (!v) continue;

      // Ignore browser-extension noise (e.g. content-DS2BZpGT.js / Floto widget)
      if (
        (v.blocked && EXTENSION_SCHEME.test(v.blocked)) ||
        (v.source && EXTENSION_SCHEME.test(v.source))
      ) {
        continue;
      }

      console.log(JSON.stringify({ event: "csp-violation", ...v }));
    }
  } catch {
    // malformed report: ignore silently
  }

  return new Response(null, { status: 204 });
}