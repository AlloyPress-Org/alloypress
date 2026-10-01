const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api";

type NextOpts = { revalidate?: number | false; tags?: string[] };

type PayloadFetchOptions = RequestInit & {
  next?: NextOpts;
  /** true = failure la null kudukkaama throw pannum (404 mattum null) */
  strict?: boolean;
};

const DEFAULT_REVALIDATE = 300;
const MAX_ATTEMPTS = 3;
const STALE_MAX_AGE = 60 * 60 * 1000; // 1 hour
const MAX_STALE_ENTRIES = 200;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

// Last successful responses (plain data mattum, Workers la safe)
const lastGood = new Map<string, { data: unknown; at: number }>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelay(res: Response | null, attempt: number): number {
  const ra = Number(res?.headers.get("retry-after"));
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 2000);
  return 300 * 2 ** attempt + Math.random() * 200;
}

export async function payloadFetch<T>(
  path: string,
  options: PayloadFetchOptions = {},
): Promise<T | null> {
  const { next, cache, strict = false, ...requestOptions } = options;

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
  // Optional: host WAF la indha header ku allow rule podalaam
  if (process.env.PAYLOAD_INTERNAL_KEY) {
    headers.set("x-internal-key", process.env.PAYLOAD_INTERNAL_KEY);
  }
  fetchOptions.headers = headers;

  const url = `${PAYLOAD_API_URL}${path}`;
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

      if (res.status === 404) return null; // genuine not found

      lastError = new Error(`Payload ${res.status} ${res.statusText}`);
      if (!RETRYABLE.has(res.status)) break;
    } catch (e) {
      lastError = e;
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(retryDelay(res, attempt));
    }
  }

  console.error(`[Payload] failed after retries - ${path}`, lastError);

  // Stale data irundha adhai kudukkalaam (user ku page break aagadhu)
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

export { PAYLOAD_API_URL };