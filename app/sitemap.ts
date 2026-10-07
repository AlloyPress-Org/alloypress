import type { MetadataRoute } from "next";

import { payloadFetch } from "@/lib/payload";
import { buildSiteUrl } from "@/lib/seo/constants";

// 1 hour cache. Publish hook /api/revalidate call pannina udane refresh aagum.
export const revalidate = 3600;

const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

const STATIC_PAGES = [
  "/",
  "/blogs",
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
// Fetch helpers. Fail aanaa THROW, empty return panna maatom.
// ------------------------------------------------------------
async function payloadGet<T>(path: string): Promise<T> {
  const data = await payloadFetch<T>(path, {
    next: { revalidate: 3600, tags: ["sitemap"] },
  });

  // payloadFetch 404 na null return pannum. Sitemap-ku idhu error.
  if (!data) throw new Error(`[Sitemap] Payload returned null for ${path}`);
  return data;
}

async function fetchAll<T>(basePath: string, limit = 500): Promise<T[]> {
  const sep = basePath.includes("?") ? "&" : "?";
  const url = (page: number) => `${basePath}${sep}limit=${limit}&page=${page}`;

  const first = await payloadGet<PayloadResponse<T>>(url(1));
  const totalPages = first.totalPages ?? 1;

  const rest = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
      payloadGet<PayloadResponse<T>>(url(i + 2)),
    ),
  );

  return [first, ...rest].flatMap((d) => d.docs ?? []);
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
    100,
  );

const getCategories = () =>
  fetchAll<Category>(
    "/categories?select[slug]=true&select[updatedAt]=true",
    100,
  );

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function resolveCategorySlug(
  category: Post["category"],
  categories: Category[],
): string | undefined {
  let slug: string | null | undefined;

  if (typeof category === "object" && category !== null) {
    slug = category.slug;
  } else if (typeof category === "number" || typeof category === "string") {
    slug = categories.find((c) => String(c.id) === String(category))?.slug;
  }

  return slug && ALLOWED_CATEGORIES.has(slug) ? slug : undefined;
}

// ------------------------------------------------------------
// Sitemap
// ------------------------------------------------------------
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, categories] = await Promise.all([
    getPosts(),
    getPages(),
    getCategories(),
  ]);

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
  for (const category of categories) {
    if (!category.slug || !ALLOWED_CATEGORIES.has(category.slug)) continue;

    const path = `/${category.slug}`;
    entries.set(path, {
      url: buildSiteUrl(path),
      ...(category.updatedAt ? { lastModified: category.updatedAt } : {}),
    });
  }

  // Posts
  let skipped = 0;

  for (const post of posts) {
    if (!post.slug || post.includeInSitemap === false) continue;

    const categorySlug = resolveCategorySlug(post.category, categories);

    if (!categorySlug) {
      skipped++;
      console.warn(`[Sitemap] Skipping "${post.slug}" - category not resolved`);
      continue;
    }

    const path = `/${categorySlug}/${post.slug}`;
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