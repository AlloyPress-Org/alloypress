import { unstable_noStore as noStore } from "next/cache";

type NextOpts = { revalidate?: number | false; tags?: string[] };

type PayloadFetchOptions = RequestInit & {
  next?: NextOpts;
  /** true = throw on failure (only 404 returns null) */
  strict?: boolean;
};
function getApiUrl(): string {
  const url = process.env.PAYLOAD_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYLOAD_API_URL is not set");
  }
  return "https://api.alloypress.com/api";
}

/** Kept for files that still import it. Prefer getApiUrl(). */
export const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "https://api.alloypress.com/api";
export { getApiUrl };


const DEFAULT_REVALIDATE = 604800; // 7 days
const MAX_ATTEMPTS = 3; // Initial request + at most 2 retries (spread out by jitter)
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

// NOTE: there is intentionally NO "last good response" fallback here.
// It used to return a per-isolate, up-to-7-day-old copy when Payload failed
// (e.g. 429). That ignored revalidateTag(), so right after a publish a failed
// refetch rendered OLD blogs, and that page was then cached as if fresh
// ("refresh -> new blogs, refresh -> old blogs").

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelay(res: Response | null, attempt: number): number {
  const ra = Number(res?.headers.get("retry-after"));
  // Honour Retry-After (capped), plus jitter so the parallel home-page
  // requests do not all retry at the same instant and trip the limit again.
  if (Number.isFinite(ra) && ra > 0) {
    return Math.min(ra * 1000, 3000) + Math.random() * 400;
  }
  const base = res?.status === 429 ? 600 : 300;
  return base * 2 ** attempt + Math.random() * 500;
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
        const contentType = res.headers.get("content-type") || "";

        if (!contentType.toLowerCase().includes("application/json")) {
          lastError = new Error(
            `Payload returned non-JSON response: status=${res.status}, content-type=${contentType || "missing"}`,
          );

          console.error("[Payload] Unexpected response format", {
            path,
            status: res.status,
            contentType,
          });

          await res.body?.cancel().catch(() => { });
          break;
        }

        return (await res.json()) as T;
      }

      // Free the connection before retrying / returning
      await res.body?.cancel().catch(() => { });

      if (res.status === 404) return null; // genuine not found

      lastError = new Error(`Payload ${res.status} ${res.statusText}`);
      if (!RETRYABLE.has(res.status)) break;
      // 429 is retried with a longer, jittered backoff (see retryDelay)
      // instead of giving up after a single quick retry.
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
  try {
    noStore();
  } catch {
    // outside a request scope (e.g. build) - nothing to opt out of
  }

  if (strict) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Payload request failed");
  }

  return null;
}