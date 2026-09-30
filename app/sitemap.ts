import type { MetadataRoute } from "next";

import { payloadFetch } from "@/lib/payload";
import { buildSiteUrl } from "@/lib/seo/constants";

// ============================================================
// Dynamic Sitemap Configuration
// ============================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================================
// Allowed Article Categories
// ============================================================

const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

// ============================================================
// Static Pages
// ============================================================

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

// ============================================================
// Types
// ============================================================

type Category = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  updatedAt?: string | null;
};

type Post = {
  slug?: string | null;

  category?: Category | number | string | null;

  publishedAt?: string | null;
  updatedAt?: string | null;

  includeInSitemap?: boolean | null;

  _status?: "draft" | "published" | null;

  legacy?: {
    wordpressId?: number | string | null;
    wordpressModifiedAt?: string | null;
  } | null;
};

type Page = {
  slug?: string | null;
  status?: "draft" | "published" | null;
  updatedAt?: string | null;
};

type PayloadResponse<T> = {
  docs?: T[];

  totalDocs?: number;
  totalPages?: number;
  page?: number;
  hasNextPage?: boolean;
};

// ============================================================
// Last Modified
// ============================================================

function postLastModified(
  post: Post,
): string | undefined {
  return (
    post.updatedAt ||
    post.publishedAt ||
    post.legacy?.wordpressModifiedAt ||
    undefined
  );
}

// ============================================================
// Posts
// ============================================================

async function getPosts(): Promise<Post[]> {
  const allPosts: Post[] = [];

  let page = 1;
  const limit = 100;

  try {
    while (true) {
      const data = await payloadFetch<
        PayloadResponse<Post>
      >(
        `/posts?limit=${limit}&page=${page}&depth=1`,
        {
          cache: "no-store",
        },
      );

      const posts = data?.docs ?? [];

      allPosts.push(...posts);

      console.log(
        `[Sitemap] Posts page ${page}: ${posts.length}`,
      );

      if (
        !data?.hasNextPage ||
        posts.length === 0
      ) {
        break;
      }

      page++;
    }

    console.log(
      `[Sitemap] Payload returned ${allPosts.length} posts`,
    );

    const validPosts = allPosts.filter(
      (post) => {
        const categorySlug =
          typeof post.category === "object" &&
          post.category !== null
            ? post.category.slug
            : undefined;

        return (
          Boolean(post.slug) &&
          post._status === "published" &&
          post.includeInSitemap !== false &&
          typeof categorySlug === "string" &&
          ALLOWED_CATEGORIES.has(
            categorySlug,
          )
        );
      },
    );

    console.log(
      `[Sitemap] ${validPosts.length} posts included in sitemap`,
    );

    return validPosts;
  } catch (error) {
    console.error(
      "[Sitemap] Posts fetch failed:",
      error,
    );

    return [];
  }
}

// ============================================================
// Pages
// ============================================================

async function getPages(): Promise<Page[]> {
  try {
    const data =
      await payloadFetch<
        PayloadResponse<Page>
      >(
        "/pages?where[status][equals]=published" +
          "&limit=100" +
          "&select[slug]=true" +
          "&select[status]=true" +
          "&select[updatedAt]=true",
        {
          cache: "no-store",
        },
      );

    return (data?.docs ?? []).filter(
      (page) =>
        Boolean(page.slug) &&
        page.status === "published",
    );
  } catch (error) {
    console.error(
      "[Sitemap] Pages fetch failed:",
      error,
    );

    return [];
  }
}

// ============================================================
// Categories
// ============================================================

async function getCategories(): Promise<
  Category[]
> {
  try {
    const data =
      await payloadFetch<
        PayloadResponse<Category>
      >(
        "/categories?limit=100" +
          "&select[id]=true" +
          "&select[name]=true" +
          "&select[slug]=true" +
          "&select[updatedAt]=true",
        {
          cache: "no-store",
        },
      );

    return (data?.docs ?? []).filter(
      (category) =>
        typeof category.slug === "string" &&
        ALLOWED_CATEGORIES.has(
          category.slug,
        ),
    );
  } catch (error) {
    console.error(
      "[Sitemap] Categories fetch failed:",
      error,
    );

    return [];
  }
}

// ============================================================
// Resolve Category Slug
// ============================================================

function resolveCategorySlug(
  category: Post["category"],
  categories: Category[],
): string | undefined {
  // Populated relationship
  if (
    typeof category === "object" &&
    category !== null &&
    typeof category.slug === "string"
  ) {
    return ALLOWED_CATEGORIES.has(
      category.slug,
    )
      ? category.slug
      : undefined;
  }

  // Relationship returned as ID
  if (
    typeof category === "number" ||
    typeof category === "string"
  ) {
    const matchedCategory =
      categories.find(
        (item) =>
          String(item.id) ===
          String(category),
      );

    if (
      matchedCategory?.slug &&
      ALLOWED_CATEGORIES.has(
        matchedCategory.slug,
      )
    ) {
      return matchedCategory.slug;
    }
  }

  return undefined;
}

// ============================================================
// Sitemap
// ============================================================

export default async function sitemap(): Promise<
  MetadataRoute.Sitemap
> {
  console.log(
    "[Sitemap] Generating dynamic sitemap...",
  );

  const [
    posts,
    pages,
    categories,
  ] = await Promise.all([
    getPosts(),
    getPages(),
    getCategories(),
  ]);

  const entries = new Map<
    string,
    MetadataRoute.Sitemap[number]
  >();

  // ==========================================================
  // Static Pages
  // ==========================================================

  for (const path of STATIC_PAGES) {
    entries.set(path, {
      url: buildSiteUrl(path),
    });
  }

  // ==========================================================
  // CMS Pages
  // ==========================================================

  for (const page of pages) {
    if (!page.slug) continue;

    const path =
      page.slug === "home" ||
      page.slug === "/"
        ? "/"
        : `/${page.slug.replace(
            /^\/+/,
            "",
          )}`;

    entries.set(path, {
      url: buildSiteUrl(path),

      ...(page.updatedAt
        ? {
            lastModified:
              page.updatedAt,
          }
        : {}),
    });
  }

  // ==========================================================
  // Categories
  // ==========================================================

  for (const category of categories) {
    if (!category.slug) continue;

    const path = `/${category.slug}`;

    entries.set(path, {
      url: buildSiteUrl(path),

      ...(category.updatedAt
        ? {
            lastModified:
              category.updatedAt,
          }
        : {}),
    });
  }

  // ==========================================================
  // Blog Posts
  // ==========================================================

  for (const post of posts) {
    if (!post.slug || !post.category) {
      continue;
    }

    const categorySlug =
      resolveCategorySlug(
        post.category,
        categories,
      );

    if (!categorySlug) {
      console.warn(
        `[Sitemap] Skipping post "${post.slug}" - category not resolved`,
      );

      continue;
    }

    const path =
      `/${categorySlug}/${post.slug}`;

    const lastModified =
      postLastModified(post);

    entries.set(path, {
      url: buildSiteUrl(path),

      ...(lastModified
        ? {
            lastModified,
          }
        : {}),
    });
  }

  // ==========================================================
  // Final Result
  // ==========================================================

  const sitemap =
    Array.from(entries.values());

  console.log(
    `[Sitemap] Generated ${sitemap.length} URLs`,
  );

  console.log(
    `[Sitemap] ${posts.length} posts processed`,
  );

  return sitemap;
}