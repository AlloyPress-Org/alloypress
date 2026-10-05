import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { payloadFetch } from "@/lib/payload";
import "./search.css";
// Search results are infinite ?q= variations of thin/duplicate
// content — keep this out of Google's index, but still let it
// be followed/linked so the crawler can reach real pages.
import { buildPageMetadata } from "@/lib/seo/metadata";

/*
 * FIX: Search must never be cached.
 * Every ?q= is a unique, user-driven request. Caching it (revalidate: 300)
 * on Cloudflare Workers stores empty/failed responses in the incremental
 * cache (KV) and keeps serving "0 results". force-dynamic also makes every
 * fetch() in this route default to no-store.
 */
export const dynamic = "force-dynamic";

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
  // NEW: same source the blog post page uses for its hero excerpt
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

function cleanText(value?: string | null) {
  if (!value) return "";

  return value
    // Remove WordPress/editor headings completely
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")

    // Remove common WordPress/editor blocks
    .replace(
      /<div[^>]*class=["'][^"']*(?:table[-\s]?of[-\s]?contents|toc)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      " ",
    )

    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, " ")

    // Remove leaked editor labels
    .replace(
      /\b(?:Table of Contents|Quick Blog Summary|Independent Review)\b\s*:?\s*/gi,
      " ",
    )

    // Remove WordPress/editor leftovers
    .replace(/TL;DR\s*:/gi, "")
    .replace(
      /📋?\s*Copied!\s*Press\s*Ctrl\+V\s*\(or\s*Cmd\+V on Mac\)\s*in the box that just opened\.?/gi,
      "",
    )
    .replace(/Copy again\s*[×x]?/gi, "")

    // Decode common HTML entities
    .replace(/&#038;|&#x26;|&amp;/gi, "&")
    .replace(/&#8230;|&#x2026;|&hellip;/gi, "…")
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")

    // Remove remaining raw entity patterns
    .replace(/&#x?[0-9a-f]+;/gi, " ")
    // Remove leaked TOC markers and heading separators
    .replace(/[≡☰]/g, " ")
    .replace(/\^/g, " ")

    // Clean whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * Same cleaning logic used by BlogPostView (cleanEditorialText),
 * so the search excerpt matches the excerpt shown on the article page.
 */
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

/*
 * Clean, short excerpt for cards.
 *
 * Priority:
 *   1. meta.description  (same as the blog post hero excerpt)
 *   2. excerpt           (fallback, cleaned of TOC / editor junk)
 *
 * Truncates at a word boundary so it never cuts mid-word.
 */
function getPostExcerpt(post: Post, maxLength: number) {
  const hasMeta = Boolean(post.meta?.description?.trim());
  const source = post.meta?.description || post.excerpt || "";

  let text = cleanEditorialText(cleanText(source));

  // Strip any leading symbol/junk char (any Unicode symbol, not just ^)
  text = text.replace(/^[^\p{L}\p{N}]+/u, "").trim();

  // No meta description + excerpt looks like leaked TOC → hide it
  // (a blank excerpt is better than junk text on the card)
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

const MAX_SEARCH_RESULTS = 8;
const MAX_QUERY_LENGTH = 100;
const RETRY_DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function attachMetaDescriptions(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return posts;

  try {
    const ids = posts.map((p) => p.id).join(",");

    const data = await payloadFetch<PayloadResponse<Post>>(
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
    console.error("[AlloyPress Search] Meta fetch failed:", error);
    return posts;
  }
}

async function fetchSearchDocs(query: string): Promise<Post[]> {
  const params = new URLSearchParams();

  params.set("q", query);
  params.set("limit", String(MAX_SEARCH_RESULTS));

  const data = await payloadFetch<PayloadResponse<Post>>(
    `/posts/search?${params.toString()}`,
    { cache: "no-store" },
  );

  return (data?.docs || []).filter(isValidPost);
}

/*
 * FIX: separate "failed" from "really no results".
 * - one automatic retry (covers cold start / transient backend errors)
 * - if both attempts throw -> failed = true (UI shows "temporarily
 *   unavailable" instead of a fake "No results found")
 */
async function searchPosts(query: string): Promise<SearchOutcome> {
  const normalizedQuery = query.trim().slice(
    0,
    MAX_QUERY_LENGTH,
  );

  if (!normalizedQuery) {
    return { posts: [], failed: false };
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const docs = await fetchSearchDocs(normalizedQuery);

      // Got results, or an empty result on the retry -> accept it
      if (docs.length > 0 || attempt === 1) {
        return {
          posts: await attachMetaDescriptions(docs),
          failed: false,
        };
      }

      // Empty on first try -> retry once before trusting it
      await sleep(RETRY_DELAY_MS);
    } catch (error) {
      lastError = error;
      console.error(
        `[AlloyPress Search] Attempt ${attempt + 1} failed:`,
        { q: normalizedQuery, error: String(error) },
      );

      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  console.error("[AlloyPress Search] Search failed after retry:", {
    q: normalizedQuery,
    error: String(lastError),
  });

  return { posts: [], failed: true };
}

const getSuggestedPosts = cache(
  async (): Promise<Post[]> => {
    try {
      const data =
        await payloadFetch<PayloadResponse<Post>>(
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
          "&select[featuredImage]=true",
          { cache: "no-store" },
        );

      return (data?.docs || [])
        .filter(isValidPost)
        .slice(0, 4);
    } catch (error) {
      console.error(
        "[AlloyPress Search] Suggested posts failed:",
        error,
      );

      return [];
    }
  },
);

function getImageUrl(
  featuredImage: Post["featuredImage"],
): string | null {
  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    typeof featuredImage.url === "string" &&
    featuredImage.url
  ) {
    return featuredImage.url.startsWith("http")
      ? featuredImage.url
      : `${process.env.PAYLOAD_API_URL?.replace(/\/api$/, "") ||
      "http://localhost:3001"
      }${featuredImage.url}`;
  }

  return null;
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "" } = await searchParams;

  const query = q
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  /*
   * Search mode:
   *   -> fetch search results only
   *
   * Empty mode:
   *   -> fetch latest content only
   */
  const emptyOutcome: SearchOutcome = { posts: [], failed: false };

  const [outcome, suggestedPosts] =
    await Promise.all([
      query
        ? searchPosts(query)
        : Promise.resolve(emptyOutcome),
      query
        ? Promise.resolve([] as Post[])
        : getSuggestedPosts(),
    ]);

  const results = outcome.posts;
  const searchFailed = outcome.failed;

  return (
    <main className="search-page">
      <section className="search-page-inner">
        <header className="search-page-header">
          <span className="search-page-eyebrow">
            ALLOYPRESS SEARCH
          </span>

          <h1>Search AlloyPress</h1>

          <p>
            Find articles, reviews, news, alternatives, and
            comparisons.
          </p>
        </header>

        <form
          className="search-page-form"
          method="GET"
          action="/search"
        >
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

            <button type="submit">
              Search
            </button>
          </div>
        </form>

        {!query ? (
          <section className="search-discovery">
            <div className="search-discovery-header">
              <span className="search-section-label">
                EXPLORE ALLOYPRESS
              </span>

              <h2>What are you looking for?</h2>

              <p>
                Start with a popular topic or explore our latest
                AI content.
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

                    const imageUrl = getImageUrl(
                      post.featuredImage,
                    );

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
                              alt={
                                post.featuredImage &&
                                  typeof post.featuredImage === "object" &&
                                  post.featuredImage.alt
                                  ? post.featuredImage.alt
                                  : post.title || "AlloyPress article"
                              }
                              loading="lazy"
                            />
                          </div>
                        ) : null}

                        <div className="search-suggested-content">
                          <div className="search-suggested-meta">
                            <span>
                              {category.name || category.slug}
                            </span>

                            {post.publishedAt && (
                              <span>
                                {formatDate(post.publishedAt)}
                              </span>
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
                  {results.length === 1
                    ? ""
                    : "s"}
                </span>

                <strong>
                  for “{query}”
                </strong>
              </div>
            )}

            {results.length > 0 ? (
              <div className="search-results-list">
                {results.map((post, index) => {
                  const category =
                    getCategory(post);

                  if (
                    !category?.slug ||
                    !post.slug
                  ) {
                    return null;
                  }

                  const excerpt = getPostExcerpt(post, 180);
                  const imageUrl = getImageUrl(post.featuredImage);

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
                            alt={
                              post.featuredImage &&
                                typeof post.featuredImage === "object" &&
                                post.featuredImage.alt
                                ? post.featuredImage.alt
                                : post.title || "AlloyPress article"
                            }
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      <span className="search-result-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="search-result-content">
                        <div className="search-result-meta">
                          <span>
                            {category.name || category.slug}
                          </span>

                          {post.publishedAt && (
                            <span>
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                        </div>

                        <h2>{post.title}</h2>

                        {excerpt ? <p>{excerpt}</p> : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : searchFailed ? (
              <div className="search-no-results">
                <div className="search-no-results-icon">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>

                <h2>Search is temporarily unavailable</h2>

                <p>
                  Something went wrong while searching. Please
                  try again in a moment.
                </p>

                <p>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="search-suggestion"
                  >
                    <span>Try again</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </p>
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
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <h2>
                  No results found for “{query}”
                </h2>

                <p>
                  We couldn't find a direct match.
                  Try another keyword or explore
                  one of the topics below.
                </p>
              </div>
            )}

            <section className="search-more">
              <div className="search-more-header">
                <span className="search-section-label">
                  TRY THESE
                </span>

                <h2>
                  Explore related topics
                </h2>
              </div>

              <div className="search-suggestions">
                {SUGGESTED_SEARCHES.map(
                  (suggestion) => (
                    <Link
                      key={suggestion}
                      href={`/search?q=${encodeURIComponent(
                        suggestion,
                      )}`}
                      className="search-suggestion"
                    >
                      <span>{suggestion}</span>
                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}