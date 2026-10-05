type NextOpts = { revalidate?: number | false; tags?: string[] };

type PayloadFetchOptions = RequestInit & {
  next?: NextOpts;
  /** true = throw on failure (only 404 returns null) */
  strict?: boolean;
};

/**
 * Resolved lazily at request time (not module load), so a missing env
 * var never crashes the build or a Worker cold start.
 */
function getApiUrl(): string {
  const url = process.env.PAYLOAD_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYLOAD_API_URL is not set");
  }
  return "http://localhost:3001/api";
}

/** Kept for files that still import it. Prefer getApiUrl(). */
export const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
export { getApiUrl };

const DEFAULT_REVALIDATE = 300;
const MAX_ATTEMPTS = 3;
const STALE_MAX_AGE = 60 * 60 * 1000; // 1 hour
const MAX_STALE_ENTRIES = 200;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

// Last successful responses (plain data only, safe on Workers)
const lastGood = new Map<string, { data: unknown; at: number }>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelay(res: Response | null, attempt: number): number {
  const ra = Number(res?.headers.get("retry-after"));
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 2000);
  return 300 * 2 ** attempt + Math.random() * 200;
}

function isAbort(e: unknown) {
  return (
    e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError")
  );
}

export async function payloadFetch<T>(
  path: string,
  options: PayloadFetchOptions = {},
): Promise<T | null> {
  const { next, cache, strict = true, ...requestOptions } = options;

  const fetchOptions: RequestInit & { next?: NextOpts } = {
    ...requestOptions,
  };

  if (cache) fetchOptions.cache = cache;

  if (cache !== "no-store") {
    fetchOptions.next = { revalidate: DEFAULT_REVALIDATE, ...next };
  } else if (next?.tags?.length) {
    fetchOptions.next = { tags: next.tags };
  }

  const headers = new Headers(requestOptions.headers);
  headers.set("accept", "application/json");
  if (process.env.PAYLOAD_INTERNAL_KEY) {
    headers.set("x-internal-key", process.env.PAYLOAD_INTERNAL_KEY);
  }
  fetchOptions.headers = headers;

  const url = `${getApiUrl()}${path}`;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;

    try {
      res = await fetch(url, fetchOptions);

      if (res.ok) {
        const data = (await res.json()) as T;
        if (lastGood.size >= MAX_STALE_ENTRIES) {
          const first = lastGood.keys().next().value;
          if (first) lastGood.delete(first);
        }
        lastGood.set(url, { data, at: Date.now() });
        return data;
      }

      // Free the connection before retrying / returning
      await res.body?.cancel().catch(() => {});

      if (res.status === 404) return null; // genuine not found

      lastError = new Error(`Payload ${res.status} ${res.statusText}`);
      if (!RETRYABLE.has(res.status)) break;
    } catch (e) {
      lastError = e;
      // Same signal is already aborted; retrying is pointless
      if (isAbort(e)) break;
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(retryDelay(res, attempt));
    }
  }

  console.error(`[Payload] failed after retries - ${path}`, lastError);

  const stale = lastGood.get(url);
  if (stale && Date.now() - stale.at < STALE_MAX_AGE) {
    return stale.data as T;
  }

  if (strict) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Payload request failed");
  }

  return null;
}