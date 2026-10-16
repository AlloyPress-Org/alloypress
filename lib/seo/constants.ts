// ============================================================
// AlloyPress SEO Constants
// ============================================================

const trimTrailingSlashes = (value: string): string =>
  value.replace(/\/+$/, "");

// ------------------------------------------------------------
// Site identity
// ------------------------------------------------------------

export const SITE_URL = trimTrailingSlashes(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://alloypress.com",
);

export const SITE_NAME = "AlloyPress";

export const SITE_DESCRIPTION =
  "Practical AI guides, tutorials, explainers, reviews and useful knowledge from AlloyPress.";

export const SITE_LOCALE = "en_US"; // og:locale format
export const SITE_LANGUAGE = "en"; // <html lang> and schema inLanguage

// ------------------------------------------------------------
// Canonical / absolute URL helper
// ------------------------------------------------------------

export function buildSiteUrl(path = ""): string {
  if (!path || path === "/") {
    return `${SITE_URL}/`;
  }

  const normalizedPath = path.replace(/^\/+|\/+$/g, "");

  return `${SITE_URL}/${normalizedPath}`;
}

// ------------------------------------------------------------
// Shared Schema.org entity IDs
// ------------------------------------------------------------

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOGO_ID = `${SITE_URL}/#logo`;

// ------------------------------------------------------------
// Image configuration
// ------------------------------------------------------------

export const SITE_LOGO_URL =
  process.env.NEXT_PUBLIC_SITE_LOGO_URL?.trim() ||
  `${SITE_URL}/ap-logo.png`;

// 1200x630 image create panni /public/og-default.png-la vainga
export const DEFAULT_OG_IMAGE_URL =
  process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE_URL?.trim() ||
  `${SITE_URL}/og-default.png`;

export const DEFAULT_OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// ------------------------------------------------------------
// Social profiles (Organization sameAs)
// ------------------------------------------------------------

export const SOCIAL_PROFILES = [
  "https://www.youtube.com/@AlloyPress",
  "https://www.instagram.com/alloypressdotcom/",
  "https://x.com/AlloyPress",
] as const;

// ------------------------------------------------------------
// Content categories
// ------------------------------------------------------------

export const ARTICLE_CATEGORIES = [
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  blogs: "Blogs",
  reviews: "Reviews",
  news: "News",
  alternatives: "Alternatives",
  comparisons: "Comparisons",
};

export const isArticleCategory = (
  value: string,
): value is ArticleCategory =>
  ARTICLE_CATEGORIES.includes(value as ArticleCategory);

// ------------------------------------------------------------
// Category listing URLs
// ------------------------------------------------------------

export const CATEGORY_PATHS = {
  blogs: "/blogs",
  reviews: "/reviews",
  news: "/news",
  alternatives: "/alternatives",
  comparisons: "/comparisons",
} as const;