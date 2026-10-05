import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { payloadFetch } from "@/lib/payload";
import "./search.css";
import { buildPageMetadata } from "@/lib/seo/metadata";

/*
 * PRODUCTION FIX
 * ----------------------------------------------------------------
 * Problem: a transient empty/failed API response got cached
 * (fetch revalidate: 300) and a silent `catch -> []` made it look
 * like a normal "0 results" page for ~5 minutes.
 *
 * Fix:
 *  1. Search is NEVER cached (cache: "no-store") + page is dynamic.
 *  2. Requests have a timeout and one retry.
 *  3. An empty 200 response is retried once before trusting it.
 *  4. Errors are separated from "no results" (own UI state),
 *     and logged with context for `wrangler tail`.
 *  5. Suggested posts never cache an empty result.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: "Search",
  description:
    "Search AlloyPress for AI tool reviews, comparisons, alternatives, news and guides.",
  canonicalPath: "/search",
  robots: { index: false, follow: true },
});

type SearchParams = Promise<{
  q?: string;
}>;

type Category = {
  id: number | string;
  slug?: string | null;
  name?: string | null;
};

type Media = {
  id: number | string;
  url?: string | null;
  alt?: string | null;
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  meta?: {
    description?: string | null;
  } | null;
  publishedAt?: string | null;
  featuredImage?: Media | number | string | null;
  category?: Category | number | string | null;
};

type PayloadResponse<T> = {
  docs?: T[];
};

type SearchOutcome = {
  posts: Post[];
  failed: boolean;
};

const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

const SUGGESTED_SEARCHES = [
  "Best AI Image Generators",
  "Grok AI Review",
  "Best AI Website Builders",
  "AI Video Generators",
  "ChatGPT Alternatives",
  "Cursor AI Review",
  "AI SEO Tools",
  "Google AI Mode",
];

const MAX_SEARCH_RESULTS = 8;
const MAX_QUERY_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 10000;
// payloadFetch already retries 3x internally, so keep this at 1
const MAX_ATTEMPTS = 1;

/* ------------------------------------------------------------------ */
/* Resilient fetch helpers                                             */
/* ------------------------------------------------------------------ */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { message: String(error) };
}

/**
 * Calls payloadFetch with a timeout. payloadFetch returns null on 404;
 * we NEVER treat that as "empty results" - it becomes an error.
 */
async function fetchWithRetry<T>(
  path: string,
  init: Record<string, unknown>,
  attempts = MAX_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      const data = await payloadFetch<T>(path, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      } as never);

      if (data === null) throw new Error(`Payload 404 for ${path}`);

      return data;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await sleep(300 * (i + 1));
    }
  }

  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Text cleaning                                                       */
/* ------------------------------------------------------------------ */

function cleanText(value?: string | null) {
  if (!value) return "";

  return value
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    .replace(
      /<div[^>]*class=["'][^"']*(?:table[-\s]?of[-\s]?contents|toc)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      " ",
    )
    .replace(/<[^>]*>/g, " ")
    .replace(
      /\b(?:Table of Contents|Quick Blog Summary|Independent Review)\b\s*:?\s*/gi,
      " ",
    )
    .replace(/TL;DR\s*:/gi, "")
    .replace(
      /📋?\s*Copied!\s*Press\s*Ctrl\+V\s*\(or\s*Cmd\+V on Mac\)\s*in the box that just opened\.?/gi,
      "",
    )
    .replace(/Copy again\s*[×x]?/gi, "")
    .replace(/&#038;|&#x26;|&amp;/gi, "&")
    .replace(/&#8230;|&#x2026;|&hellip;/gi, "…")
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x?[0-9a-f]+;/gi, " ")
    .replace(/[≡☰]/g, " ")
    .replace(/\^/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanEditorialText(value: unknown): string {
  if (typeof value !== "string") return "";

  let text = value
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&#038;/gi, "&")
    .replace(/&#38;/gi, "&")
    .replace(/&#8230;/gi, "…")
    .replace(/&#x26;/gi, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x22;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  text = text.replace(
    /Ask AI which software may suit your team[\s\S]*?(?=TL;DR\s*:|$)/i,
    "",
  );

  text = text.replace(
    /📋\s*Copied!.*?(?:Copy again\s*[✕×x]?|$)/i,
    "",
  );

  text = text.replace(/^TL;DR\s*:\s*/i, "");
  text = text.replace(/\s*\[…\]\s*$/i, "");
  text = text.replace(/\s*\[\.\.\.\]\s*$/i, "");
  text = text.replace(/…\s*$/i, "");
  text = text.replace(/^[-–—•\s]+/, "");

  return text.replace(/\s+/g, " ").trim();
}

function getPostExcerpt(post: Post, maxLength: number) {
  const hasMeta = Boolean(post.meta?.description?.trim());
  const source = post.meta?.description || post.excerpt || "";

  let text = cleanEditorialText(cleanText(source));

  text = text.replace(/^[^\p{L}\p{N}]+/u, "").trim();

  if (!hasMeta) {
    const questionMarks = (text.slice(0, 200).match(/\?/g) || []).length;
    const looksLikeToc =
      questionMarks >= 2 ||
      /quick overview|how we tested|comparison table|table of contents/i.test(
        text.slice(0, 200),
      );

    if (looksLikeToc) return "";
  }

  if (!text) return "";
  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe =
    lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;

  return `${safe.replace(/[\s,.;:–—-]+$/, "")}…`;
}

/* ------------------------------------------------------------------ */
/* Post helpers                                                        */
/* ------------------------------------------------------------------ */

function getCategory(post: Post): Category | null {
  return typeof post.category === "object" && post.category
    ? post.category
    : null;
}

function isValidPost(post: Post) {
  const category = getCategory(post);

  return Boolean(
    post.id &&
      post.slug &&
      post.title &&
      category?.slug &&
      ALLOWED_CATEGORIES.has(category.slug),
  );
}

function getImageUrl(featuredImage: Post["featuredImage"]): string | null {
  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    typeof featuredImage.url === "string" &&
    featuredImage.url
  ) {
    return featuredImage.url.startsWith("http")
      ? featuredImage.url
      : `${
          process.env.PAYLOAD_API_URL?.replace(/\/api$/, "") ||
          "http://localhost:3001"
        }${featuredImage.url}`;
  }

  return null;
}

function getImageAlt(post: Post) {
  return post.featuredImage &&
    typeof post.featuredImage === "object" &&
    post.featuredImage.alt
    ? post.featuredImage.alt
    : post.title || "AlloyPress article";
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/* ------------------------------------------------------------------ */
/* Data fetching                                                       */
/* ------------------------------------------------------------------ */

/**
 * Meta descriptions are a nice-to-have. Fail soft (keep the posts),
 * never cache.
 */
async function attachMetaDescriptions(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return posts;

  try {
    const ids = posts.map((p) => p.id).join(",");

    const data = await fetchWithRetry<PayloadResponse<Post>>(
      "/posts" +
        `?where[id][in]=${encodeURIComponent(ids)}` +
        `&limit=${posts.length}` +
        "&depth=0" +
        "&select[id]=true" +
        "&select[meta][description]=true",
      { cache: "no-store" },
    );

    const byId = new Map(
      (data?.docs || []).map((d) => [
        String(d.id),
        d.meta?.description ?? null,
      ]),
    );

    return posts.map((p) => ({
      ...p,
      meta: {
        description: byId.get(String(p.id)) ?? p.meta?.description ?? null,
      },
    }));
  } catch (error) {
    console.error("[AlloyPress Search] Meta fetch failed:", describeError(error));
    return posts;
  }
}

async function searchPosts(query: string): Promise<SearchOutcome> {
  const normalizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH);

  if (!normalizedQuery) {
    return { posts: [], failed: false };
  }

  const params = new URLSearchParams();
  params.set("q", normalizedQuery);
  params.set("limit", String(MAX_SEARCH_RESULTS));

  const path = `/posts/search?${params.toString()}`;

  try {
    let data = await fetchWithRetry<PayloadResponse<Post>>(path, {
      cache: "no-store",
    });

    // A 200 with zero docs can be a transient backend hiccup
    // (cold start / DB warming). Double-check once before trusting it.
    if (!data?.docs?.length) {
      await sleep(400);
      data = await fetchWithRetry<PayloadResponse<Post>>(
        path,
        { cache: "no-store" },
        1,
      );
    }

    const valid = (data?.docs || []).filter(isValidPost);
    const posts = await attachMetaDescriptions(valid);

    return { posts, failed: false };
  } catch (error) {
    console.error("[AlloyPress Search] Search request failed:", {
      query: normalizedQuery,
      apiUrl: process.env.PAYLOAD_API_URL,
      ...describeError(error),
    });

    return { posts: [], failed: true };
  }
}

const SUGGESTED_PATH =
  "/posts" +
  "?where[workflowStatus][equals]=published" +
  "&limit=4" +
  "&depth=1" +
  "&sort=-publishedAt" +
  "&select[id]=true" +
  "&select[title]=true" +
  "&select[slug]=true" +
  "&select[excerpt]=true" +
  "&select[meta][description]=true" +
  "&select[publishedAt]=true" +
  "&select[category]=true" +
  "&select[featuredImage]=true";

const getSuggestedPosts = cache(async (): Promise<Post[]> => {
  try {
    // Short cache is fine here, but an EMPTY result must never stick.
    let data = await fetchWithRetry<PayloadResponse<Post>>(SUGGESTED_PATH, {
      next: { revalidate: 300, tags: ["posts"] },
    });

    let posts = (data?.docs || []).filter(isValidPost).slice(0, 4);

    if (!posts.length) {
      data = await fetchWithRetry<PayloadResponse<Post>>(
        SUGGESTED_PATH,
        { cache: "no-store" },
        1,
      );
      posts = (data?.docs || []).filter(isValidPost).slice(0, 4);
    }

    return posts;
  } catch (error) {
    console.error(
      "[AlloyPress Search] Suggested posts failed:",
      describeError(error),
    );

    return [];
  }
});

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "" } = await searchParams;

  const query = q.trim().slice(0, MAX_QUERY_LENGTH);

  const [outcome, suggestedPosts] = await Promise.all([
    query
      ? searchPosts(query)
      : Promise.resolve<SearchOutcome>({ posts: [], failed: false }),
    query ? Promise.resolve<Post[]>([]) : getSuggestedPosts(),
  ]);

  const results = outcome.posts;
  const searchFailed = outcome.failed;

  return (
    <main className="search-page">
      <section className="search-page-inner">
        <header className="search-page-header">
          <span className="search-page-eyebrow">ALLOYPRESS SEARCH</span>

          <h1>Search AlloyPress</h1>

          <p>Find articles, reviews, news, alternatives, and comparisons.</p>
        </header>

        <form className="search-page-form" method="GET" action="/search">
          <div className="search-page-input-wrap">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search AI tools, reviews, news..."
              aria-label="Search AlloyPress"
              autoComplete="off"
              enterKeyHint="search"
              spellCheck={false}
            />

            <button type="submit">Search</button>
          </div>
        </form>

        {!query ? (
          <section className="search-discovery">
            <div className="search-discovery-header">
              <span className="search-section-label">EXPLORE ALLOYPRESS</span>

              <h2>What are you looking for?</h2>

              <p>
                Start with a popular topic or explore our latest AI content.
              </p>
            </div>

            <div className="search-suggestions">
              {SUGGESTED_SEARCHES.map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="search-suggestion"
                >
                  {suggestion}
                </Link>
              ))}
            </div>

            {suggestedPosts.length > 0 && (
              <div className="search-suggested-posts">
                <div className="search-subsection-heading">
                  <span>Latest articles</span>
                </div>

                <div className="search-suggested-grid">
                  {suggestedPosts.map((post) => {
                    const category = getCategory(post);

                    if (!category?.slug || !post.slug) {
                      return null;
                    }

                    const imageUrl = getImageUrl(post.featuredImage);
                    const excerpt = getPostExcerpt(post, 120);

                    return (
                      <Link
                        key={post.id}
                        href={`/${category.slug}/${post.slug}`}
                        className="search-suggested-card"
                      >
                        {imageUrl ? (
                          <div className="search-suggested-image">
                            <img
                              src={imageUrl}
                              alt={getImageAlt(post)}
                              loading="lazy"
                            />
                          </div>
                        ) : null}

                        <div className="search-suggested-content">
                          <div className="search-suggested-meta">
                            <span>{category.name || category.slug}</span>

                            {post.publishedAt && (
                              <span>{formatDate(post.publishedAt)}</span>
                            )}
                          </div>

                          <h3>{post.title}</h3>

                          {excerpt ? <p>{excerpt}</p> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="search-results">
            {!searchFailed && (
              <div className="search-results-heading">
                <span>
                  {results.length} result
                  {results.length === 1 ? "" : "s"}
                </span>

                <strong>for “{query}”</strong>
              </div>
            )}

            {searchFailed ? (
              <div className="search-no-results" role="alert">
                <div className="search-no-results-icon">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5" />
                    <path d="M12 16.5h.01" />
                  </svg>
                </div>

                <h2>Search is temporarily unavailable</h2>

                <p>
                  Something went wrong while searching. Please try again in a
                  moment.
                </p>

                <p>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="search-suggestion"
                  >
                    Try again
                  </Link>
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="search-results-list">
                {results.map((post, index) => {
                  const category = getCategory(post);

                  if (!category?.slug || !post.slug) {
                    return null;
                  }

                  const imageUrl = getImageUrl(post.featuredImage);
                  const excerpt = getPostExcerpt(post, 180);

                  return (
                    <Link
                      key={post.id}
                      href={`/${category.slug}/${post.slug}`}
                      className="search-result-card"
                    >
                      {imageUrl ? (
                        <div className="search-result-image">
                          <img
                            src={imageUrl}
                            alt={getImageAlt(post)}
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      <span
                        className="search-result-number"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="search-result-content">
                        <div className="search-result-meta">
                          <span>{category.name || category.slug}</span>

                          {post.publishedAt && (
                            <span>{formatDate(post.publishedAt)}</span>
                          )}
                        </div>

                        <h2>{post.title}</h2>

                        {excerpt ? <p>{excerpt}</p> : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="search-no-results">
                <div className="search-no-results-icon">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <h2>No results found for “{query}”</h2>

                <p>
                  We couldn&apos;t find a direct match. Try another keyword or
                  explore one of the topics below.
                </p>
              </div>
            )}

            <section className="search-more">
              <div className="search-more-header">
                <span className="search-section-label">TRY THESE</span>

                <h2>Explore related topics</h2>
              </div>

              <div className="search-suggestions">
                {SUGGESTED_SEARCHES.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/search?q=${encodeURIComponent(suggestion)}`}
                    className="search-suggestion"
                  >
                    <span>{suggestion}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}