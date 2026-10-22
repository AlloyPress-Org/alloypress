import type { MetadataRoute } from "next";

import { payloadFetch } from "@/lib/payload";
import { buildSiteUrl } from "@/lib/seo/constants";

// 1 hour cache. Publish hook /api/revalidate call pannina udane refresh aagum.
export const revalidate = 3600;

// Website sections. A post belongs to a section when its category IS the
// section, or is a CHILD of it (listicles / informatives -> blogs).
const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

// Subcategory listing pages that exist as routes:
//   /blogs/listicles   (app/blogs/listicles/page.tsx)
//   /blogs/informatives (app/blogs/informatives/page.tsx)
const SUB_CATEGORY_PAGES = new Set(["listicles", "informatives"]);

const STATIC_PAGES = [
  "/",
  "/blogs",
  "/blogs/listicles",
  "/blogs/informatives",
  "/reviews",
  "/news",
  "/alternatives",
  "/comparisons",
  "/about-us",
  "/contact-us",
  "/get-reviewed",
  "/privacy-policy",
  "/terms-and-conditions",
  "/do-not-sell-my-info",
  "/testing-partner",
  "/get-featured",
];

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

type Page = {
  slug?: string | null;
  updatedAt?: string | null;
};

type PayloadResponse<T> = {
  docs?: T[];
  totalPages?: number;
};

// ------------------------------------------------------------
// Rate limit config
// ------------------------------------------------------------
const MAX_429_RETRIES = 5; // 429 vandha max 5 thadava retry
const BASE_BACKOFF_MS = 1000; // 1s, 2s, 4s, 8s, 16s
const GAP_BETWEEN_REQUESTS_MS = 150; // requests naduvula small gap

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || /too many requests/i.test(msg);
}

// ------------------------------------------------------------
// Fetch helpers. Fail aanaa THROW, empty/partial return panna maatom.
// (Throw aana Next.js pazhaya cached sitemap-ae serve pannum)
// ------------------------------------------------------------
async function payloadGet<T>(path: string): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      const data = await payloadFetch<T>(path, {
        next: { revalidate: 604800, tags: ["sitemap"] },
      });

      // payloadFetch 404 na null return pannum. Sitemap-ku idhu error.
      if (!data) throw new Error(`[Sitemap] Payload returned null for ${path}`);
      return data;
    } catch (err) {
      // 429 na mattum backoff panni retry. Vera error na udane throw.
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

// Pages ellam SEQUENTIAL-a fetch (parallel burst illa), rate limit-ku safe.
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

// ------------------------------------------------------------
// Data loaders (light queries, needed fields mattum)
// depth=0 so category ID-ah varum, adha categories list la resolve panrom.
// ------------------------------------------------------------
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

// parent is needed to know that listicles / informatives belong to "blogs"
const getCategories = () =>
  fetchAll<Category>(
    "/categories?depth=0" +
      "&select[slug]=true" +
      "&select[parent]=true" +
      "&select[updatedAt]=true",
    100,
  );

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Returns the website SECTION slug of a category:
//   reviews / news / ...        -> itself
//   listicles / informatives    -> "blogs" (their parent is Learn = blogs)
//   uncategorized, tutorial ... -> undefined (post is skipped until moved)
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

  // walk up the parents (max 4 levels)
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

// ------------------------------------------------------------
// Build sitemap (full data fetch + entries)
// ------------------------------------------------------------
async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  // SEQUENTIAL: Promise.all illa, so Payload-ku burst requests pogaadhu.
  const categories = await getCategories();
  const pages = await getPages();
  const posts = await getPosts();

  const byId = new Map(categories.map((c) => [String(c.id), c]));

  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  // Static pages
  for (const path of STATIC_PAGES) {
    entries.set(path, { url: buildSiteUrl(path) });
  }

  // CMS pages
  for (const page of pages) {
    if (!page.slug) continue;

    const path =
      page.slug === "home" || page.slug === "/"
        ? "/"
        : `/${page.slug.replace(/^\/+/, "")}`;

    entries.set(path, {
      url: buildSiteUrl(path),
      ...(page.updatedAt ? { lastModified: page.updatedAt } : {}),
    });
  }

  // Category listing pages
  //   sections:      /blogs, /reviews, /news, ...
  //   subcategories: /blogs/listicles, /blogs/informatives
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
      ...(category.updatedAt ? { lastModified: category.updatedAt } : {}),
    });
  }

  // Posts
  // listicle / informative posts -> /blogs/<post-slug>
  // reviews / news / ... posts   -> /<section>/<post-slug> (unchanged)
  let skipped = 0;

  for (const post of posts) {
    if (!post.slug || post.includeInSitemap === false) continue;

    const section = resolveSection(post.category, byId);

    if (!section) {
      skipped++;
      console.warn(
        `[Sitemap] Skipping "${post.slug}" - category not resolved (move it to Listicle / Informative or a section)`,
      );
      continue;
    }

    const path = `/${section}/${post.slug}`;
    const lastModified =
      post.updatedAt ||
      post.publishedAt ||
      post.legacy?.wordpressModifiedAt ||
      undefined;

    entries.set(path, {
      url: buildSiteUrl(path),
      ...(lastModified ? { lastModified } : {}),
    });
  }

  console.log(
    `[Sitemap] ${entries.size} URLs (${posts.length} posts fetched, ${skipped} skipped)`,
  );

  return Array.from(entries.values());
}

// ------------------------------------------------------------
// Sitemap (last-good fallback)
// Fetch fail aanaa: 1) memory-la last good copy irundha adha kudukkum
//                   2) illa-na throw -> Next.js pazhaya cached sitemap serve pannum
// ------------------------------------------------------------
let lastGood: MetadataRoute.Sitemap | null = null;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const result = await buildSitemap();
    lastGood = result;
    return result;
  } catch (err) {
    console.error("[Sitemap] build failed", err);
    if (lastGood) return lastGood;
    throw err;
  }
}