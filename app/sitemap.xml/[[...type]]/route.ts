import { payloadFetch } from "@/lib/payload";
import { buildSiteUrl } from "@/lib/seo/constants";
import { liveTools } from "@/lib/tools/registry";

export const revalidate = 3600;

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

// A post belongs to a section when its category IS the section, or is a CHILD
// of it (listicles / informatives -> blogs).
const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
  "tutorial",
]);

// Subcategory listing pages that exist as routes
const SUB_CATEGORY_PAGES = new Set(["listicles", "informatives"]);

const STATIC_PAGE_PATHS = [
  "/",
  "/about-us",
  "/contact-us",
  "/review-your-ai-tool",
  "/privacy-policy",
  "/terms-and-conditions",
  "/do-not-sell-my-info",
  "/testing-partner",
  "/submit-your-ai-tool",
];

const STATIC_CATEGORY_PATHS = [
  "/blogs",
  "/blogs/listicles",
  "/blogs/informatives",
  "/reviews",
  "/news",
  "/alternatives",
  "/comparisons",
  "/tutorial",
];

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Entry = { url: string; lastModified?: string | null };

type Category = {
  id: number | string;
  slug?: string | null;
  parent?: Category | number | string | null;
  updatedAt?: string | null;
};

type Post = {
  slug?: string | null;
  category?: Category | number | string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  includeInSitemap?: boolean | null;
  legacy?: { wordpressModifiedAt?: string | null } | null;
};

type Page = { slug?: string | null; updatedAt?: string | null };

type PayloadResponse<T> = { docs?: T[]; totalPages?: number };

/* -------------------------------------------------------------------------- */
/* XML helpers                                                                */
/* -------------------------------------------------------------------------- */

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function toIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function latestModified(entries: Entry[]): string | undefined {
  let max = 0;
  for (const entry of entries) {
    const iso = toIso(entry.lastModified);
    if (iso) max = Math.max(max, new Date(iso).getTime());
  }
  return max ? new Date(max).toISOString() : undefined;
}

function renderUrlset(entries: Entry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = toIso(entry.lastModified);
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function renderIndex(items: Entry[]): string {
  const body = items
    .map((item) => {
      const lastmod = toIso(item.lastModified);
      return [
        "  <sitemap>",
        `    <loc>${escapeXml(item.url)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        "  </sitemap>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Fetch helpers (429 retry, sequential pages, THROW on failure)              */
/* -------------------------------------------------------------------------- */

const MAX_429_RETRIES = 5;
const BASE_BACKOFF_MS = 1000; // 1s, 2s, 4s, 8s, 16s
const GAP_BETWEEN_REQUESTS_MS = 150;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || /too many requests/i.test(msg);
}

async function payloadGet<T>(path: string): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      const data = await payloadFetch<T>(path, {
        next: { revalidate: 604800, tags: ["sitemap"] },
      });

      if (!data) throw new Error(`[Sitemap] Payload returned null for ${path}`);
      return data;
    } catch (err) {
      if (isRateLimitError(err) && attempt < MAX_429_RETRIES) {
        const wait = BASE_BACKOFF_MS * 2 ** attempt;
        console.warn(
          `[Sitemap] 429 for ${path}. Retry ${attempt + 1}/${MAX_429_RETRIES} in ${wait}ms`,
        );
        await sleep(wait);
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

async function fetchAll<T>(basePath: string, limit = 500): Promise<T[]> {
  const sep = basePath.includes("?") ? "&" : "?";
  const url = (page: number) => `${basePath}${sep}limit=${limit}&page=${page}`;

  const first = await payloadGet<PayloadResponse<T>>(url(1));
  const totalPages = first.totalPages ?? 1;
  const docs: T[] = [...(first.docs ?? [])];

  for (let p = 2; p <= totalPages; p++) {
    await sleep(GAP_BETWEEN_REQUESTS_MS);
    const res = await payloadGet<PayloadResponse<T>>(url(p));
    docs.push(...(res.docs ?? []));
  }

  return docs;
}

const getPosts = () =>
  fetchAll<Post>(
    "/posts?depth=0" +
      "&where[_status][equals]=published" +
      "&select[slug]=true" +
      "&select[category]=true" +
      "&select[includeInSitemap]=true" +
      "&select[updatedAt]=true" +
      "&select[publishedAt]=true" +
      "&select[legacy]=true",
  );

const getPages = () =>
  fetchAll<Page>(
    "/pages?where[status][equals]=published" +
      "&select[slug]=true&select[updatedAt]=true",
    500,
  );

const getCategories = () =>
  fetchAll<Category>(
    "/categories?depth=0" +
      "&select[slug]=true" +
      "&select[parent]=true" +
      "&select[updatedAt]=true",
    100,
  );

/* -------------------------------------------------------------------------- */
/* Category -> section                                                        */
/* -------------------------------------------------------------------------- */

// reviews / news / ...     -> itself
// listicles / informatives -> "blogs" (parent)
// anything else            -> undefined (post skipped)
function resolveSection(
  category: Post["category"],
  byId: Map<string, Category>,
): string | undefined {
  let current: Category | undefined;

  if (typeof category === "object" && category !== null) {
    current = byId.get(String(category.id)) ?? category;
  } else if (category !== null && category !== undefined) {
    current = byId.get(String(category));
  }

  for (let i = 0; i < 4 && current; i++) {
    if (current.slug && ALLOWED_CATEGORIES.has(current.slug)) {
      return current.slug;
    }

    const parent: Category | number | string | null | undefined = current.parent;
    const parentId =
      typeof parent === "object" && parent !== null ? parent.id : parent;

    current =
      parentId !== null && parentId !== undefined
        ? byId.get(String(parentId))
        : undefined;
  }

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Entry builders (one per child sitemap)                                     */
/* -------------------------------------------------------------------------- */

async function getPageEntries(): Promise<Entry[]> {
  const pages = await getPages();
  const entries = new Map<string, Entry>();

  for (const path of STATIC_PAGE_PATHS) {
    entries.set(path, { url: buildSiteUrl(path) });
  }

  for (const page of pages) {
    if (!page.slug) continue;

    const path =
      page.slug === "home" || page.slug === "/"
        ? "/"
        : `/${page.slug.replace(/^\/+/, "")}`;

    entries.set(path, {
      url: buildSiteUrl(path),
      lastModified: page.updatedAt ?? null,
    });
  }

  return Array.from(entries.values());
}

async function getCategoryEntries(): Promise<Entry[]> {
  const categories = await getCategories();
  const byId = new Map(categories.map((c) => [String(c.id), c]));
  const entries = new Map<string, Entry>();

  for (const path of STATIC_CATEGORY_PATHS) {
    entries.set(path, { url: buildSiteUrl(path) });
  }

  for (const category of categories) {
    if (!category.slug) continue;

    let path: string | null = null;

    if (ALLOWED_CATEGORIES.has(category.slug)) {
      path = `/${category.slug}`;
    } else if (
      SUB_CATEGORY_PAGES.has(category.slug) &&
      resolveSection(category, byId) === "blogs"
    ) {
      path = `/blogs/${category.slug}`;
    }

    if (!path) continue;

    entries.set(path, {
      url: buildSiteUrl(path),
      lastModified: category.updatedAt ?? null,
    });
  }

  return Array.from(entries.values());
}

async function getPostEntries(): Promise<Entry[]> {
  // Sequential (no Promise.all) so Payload never gets a burst of requests
  const categories = await getCategories();
  const posts = await getPosts();
  const byId = new Map(categories.map((c) => [String(c.id), c]));

  const entries = new Map<string, Entry>();
  let skipped = 0;

  for (const post of posts) {
    if (!post.slug || post.includeInSitemap === false) continue;

    const section = resolveSection(post.category, byId);

    if (!section) {
      skipped++;
      console.warn(
        `[Sitemap] Skipping "${post.slug}" - category not resolved (move it to a section)`,
      );
      continue;
    }

    const path = `/${section}/${post.slug}`;

    entries.set(path, {
      url: buildSiteUrl(path),
      lastModified:
        post.updatedAt ||
        post.publishedAt ||
        post.legacy?.wordpressModifiedAt ||
        null,
    });
  }

  if (skipped) console.warn(`[Sitemap] ${skipped} posts skipped (no section)`);

  return Array.from(entries.values());
}

async function getToolEntries(): Promise<Entry[]> {
  return [
    { url: buildSiteUrl("/tools") },
    ...liveTools().map((t) => ({ url: buildSiteUrl(`/tools/${t.slug}`) })),
  ];
}

/* -------------------------------------------------------------------------- */
/* Registry: /sitemap.xml/<type>                                              */
/* -------------------------------------------------------------------------- */

const CHILD_SITEMAPS = {
  pages: getPageEntries,
  posts: getPostEntries,
  categories: getCategoryEntries,
  tools: getToolEntries,
} as const;

type ChildType = keyof typeof CHILD_SITEMAPS;

const isChildType = (value: string): value is ChildType =>
  Object.prototype.hasOwnProperty.call(CHILD_SITEMAPS, value);

/* -------------------------------------------------------------------------- */
/* Handler (last-good fallback)                                               */
/* Fetch fails -> serve last good XML; if none, THROW so Next.js keeps its    */
/* previously cached sitemap (never an empty one).                            */
/* -------------------------------------------------------------------------- */

const lastGood = new Map<string, string>();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type?: string[] }> },
) {
  const { type } = await params;
  const segments = type ?? [];

  // Only "/sitemap.xml" or "/sitemap.xml/<one-name>" are valid
  if (segments.length > 1) {
    return new Response("Not found", { status: 404 });
  }

  const key = segments[0]?.replace(/\.xml$/i, "") ?? "index";

  if (key !== "index" && !isChildType(key)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    let xml: string;

    if (key === "index") {
      // Sequential so Payload never gets a burst of requests
      const pages = await getPageEntries();
      const posts = await getPostEntries();
      const categories = await getCategoryEntries();
      const tools = await getToolEntries();

      xml = renderIndex([
        { url: buildSiteUrl("/sitemap.xml/pages"), lastModified: latestModified(pages) },
        { url: buildSiteUrl("/sitemap.xml/posts"), lastModified: latestModified(posts) },
        { url: buildSiteUrl("/sitemap.xml/categories"), lastModified: latestModified(categories) },
        { url: buildSiteUrl("/sitemap.xml/tools"), lastModified: latestModified(tools) },
      ]);
    } else {
      const entries = await CHILD_SITEMAPS[key]();
      console.log(`[Sitemap:${key}] ${entries.length} URLs`);
      xml = renderUrlset(entries);
    }

    lastGood.set(key, xml);
    return xmlResponse(xml);
  } catch (err) {
    console.error(`[Sitemap:${key}] build failed`, err);

    const cached = lastGood.get(key);
    if (cached) return xmlResponse(cached);

    throw err;
  }
}