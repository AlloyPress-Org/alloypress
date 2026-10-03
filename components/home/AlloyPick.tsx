import Link from "next/link";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

import FeaturedCarousel from "./FeaturedCarousel";

// ============================================================
// CONFIG
// ============================================================

const HOME_POST_LIMIT = 12;
const FEATURED_POST_COUNT = 3;
const TRENDING_POST_COUNT = 4;

// ============================================================
// TYPES
// ============================================================

type Media = {
  url?: string | null;
  alt?: string | null;
};

type Category = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  publishedAt?: string | null;
  workflowStatus?: string | null;
  featuredImage?: Media | number | null;
  category?: Category | number | null;
};

type PayloadPostsResponse = {
  docs?: Post[];
};

type HomepageSettings = {
  id: number | string;
  title?: string | null;
  featuredPosts?: Array<Post | number | string> | null;
};

type HomepageSettingsResponse = {
  docs?: HomepageSettings[];
};

// ============================================================
// HELPERS
// ============================================================

function getCategory(
  category: Post["category"],
): {
  name: string;
  slug: string;
} {
  if (!category || typeof category === "number") {
    return {
      name: "AI",
      slug: "ai",
    };
  }

  return {
    name: category.name || "AI",
    slug: category.slug || "ai",
  };
}

function formatDate(date?: string | null): string {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

// ============================================================
// POST VALIDATION
// ============================================================

function isValidPost(post: Post): boolean {
  if (!post.title || !post.slug) {
    return false;
  }

  const title = post.title.trim().toLowerCase();
  const category = getCategory(post.category);

  // Ignore unwanted migrated WordPress content.
  if (title.includes("untitled wordpress")) {
    return false;
  }

  // Ignore uncategorized content.
  if (
    category.slug === "uncategorized" ||
    category.name.toLowerCase() === "uncategorized"
  ) {
    return false;
  }

  return true;
}

function isPublishedPost(post: Post): boolean {
  return post.workflowStatus === "published";
}

// ============================================================
// FETCH LATEST PUBLISHED POSTS
// ============================================================
//
// Used only for the "Recently Published" column.
//
// Featured posts are NOT selected from this request.
// Featured posts come exclusively from HomepageSettings.
// ============================================================

const getPublishedPosts = cache(
  async (): Promise<Post[]> => {
    try {
      const params = new URLSearchParams();

      params.set(
        "where[workflowStatus][equals]",
        "published",
      );

      params.set("sort", "-publishedAt");
      params.set("limit", String(HOME_POST_LIMIT));
      params.set("depth", "1");

      // Only request fields required by this section.
      params.set("select[id]", "true");
      params.set("select[title]", "true");
      params.set("select[slug]", "true");
      params.set("select[publishedAt]", "true");
      params.set("select[workflowStatus]", "true");
      params.set("select[featuredImage]", "true");
      params.set("select[category]", "true");

      const data =
        await payloadFetch<PayloadPostsResponse>(
          `/posts?${params.toString()}`,
          {
            next: {
              revalidate: 300,
              tags: [
                "home:latest-posts",
                "posts",
              ],
            },
          },
        );

      if (!Array.isArray(data?.docs)) {
        return [];
      }

      return data.docs.filter(
        (post) =>
          isValidPost(post) &&
          isPublishedPost(post),
      );
    } catch (error) {
      console.error(
        "AlloyPick: failed to fetch published posts",
        error,
      );

      return [];
    }
  },
);

// ============================================================
// FETCH HOMEPAGE SETTINGS
// ============================================================
//
// Payload Admin is the source of truth for Featured.
//
// Homepage Settings
//   └── Featured Posts
//         ├── Post 1
//         ├── Post 2
//         └── Post 3
//
// The order selected in Payload is preserved.
// ============================================================

const getHomepageSettings = cache(
  async (): Promise<HomepageSettings | null> => {
    try {
      const params = new URLSearchParams();

      // We expect one Homepage Settings document.
      params.set("limit", "1");

      // Populate the selected Post relationships.
      // Also populate category + featuredImage.
      params.set("depth", "2");

      const data =
        await payloadFetch<HomepageSettingsResponse>(
          `/homepage-settings?${params.toString()}`,
          {
            next: {
              revalidate: 300,
              tags: [
                "homepage:featured",
                "homepage",
              ],
            },
          },
        );

      const settings = data?.docs?.[0];

      if (!settings) {
        return null;
      }

      return settings;
    } catch (error) {
      console.error(
        "AlloyPick: failed to fetch homepage settings",
        error,
      );

      return null;
    }
  },
);

// ============================================================
// GET EDITOR SELECTED FEATURED POSTS
// ============================================================
//
// IMPORTANT:
// We never automatically replace the editor selection with
// latest posts.
//
// If the admin has not configured Featured Posts,
// the Featured section will not render.
//
// This keeps editorial control predictable.
// ============================================================

function getFeaturedPosts(
  settings: HomepageSettings | null,
): Post[] {
  const selectedPosts = settings?.featuredPosts;

  if (!Array.isArray(selectedPosts)) {
    return [];
  }

  const validPosts: Post[] = [];

  for (const item of selectedPosts) {
    // Payload relationship can return:
    // - populated Post object
    // - Post ID
    //
    // We require populated objects because the carousel
    // needs title, slug, category and image data.
    if (
      typeof item === "number" ||
      typeof item === "string"
    ) {
      continue;
    }

    if (!isValidPost(item)) {
      continue;
    }

    // A manually selected post must still be published.
    if (!isPublishedPost(item)) {
      continue;
    }

    validPosts.push(item);
  }

  // Defensive de-duplication.
  //
  // Map preserves insertion order, so the order selected
  // in Payload Admin remains unchanged.
  const uniquePosts = Array.from(
    new Map(
      validPosts.map((post) => [
        String(post.id),
        post,
      ]),
    ).values(),
  );

  return uniquePosts.slice(
    0,
    FEATURED_POST_COUNT,
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default async function AlloyPick() {
  // These requests are independent.
  // Fetch them in parallel.
  const [
    publishedPosts,
    homepageSettings,
  ] = await Promise.all([
    getPublishedPosts(),
    getHomepageSettings(),
  ]);

  // ==========================================================
  // FEATURED / EDITOR PICKS
  // ==========================================================

  const featuredPosts =
    getFeaturedPosts(homepageSettings);

  // No editorial configuration = no Featured section.
  //
  // This is intentional.
  if (!featuredPosts.length) {
    return null;
  }

  // ==========================================================
  // RECENTLY PUBLISHED
  // ==========================================================
  //
  // Do not show Featured posts again in the right-hand list.
  // ==========================================================

  const featuredIds = new Set(
    featuredPosts.map((post) =>
      String(post.id),
    ),
  );

  const trendingPosts = publishedPosts
    .filter(
      (post) =>
        !featuredIds.has(
          String(post.id),
        ),
    )
    .slice(0, TRENDING_POST_COUNT);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="alloy-trending-section"
      aria-labelledby="alloy-trending-title"
    >
      <div className="container">
        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div className="alloy-trending-header">
          <div className="alloy-trending-heading">
            <div>
              <span className="eyebrow">
                TRENDING NOW
              </span>

              <h2 id="alloy-trending-title">
                Featured
              </h2>
            </div>
          </div>
        </div>

        {/* ==================================================
            FEATURED + RECENTLY PUBLISHED
        ================================================== */}

        <div className="alloy-trending-grid">
          {/* ==================================================
              EDITOR PICK / FEATURED CAROUSEL
          ================================================== */}

          <FeaturedCarousel
            posts={featuredPosts}
          />

          {/* ==================================================
              RECENTLY PUBLISHED
          ================================================== */}

          {trendingPosts.length > 0 && (
            <div className="alloy-trending-posts">
              <div className="alloy-trending-posts-heading">
                <span
                  className="trending-live-dot"
                  aria-hidden="true"
                />

                <span>
                  Recently Published
                </span>
              </div>

              <div className="alloy-trending-list">
                {trendingPosts.map(
                  (post, index) => {
                    const category =
                      getCategory(
                        post.category,
                      );

                    return (
                      <Link
                        key={post.id}
                        href={`/${category.slug}/${post.slug}`}
                        className="alloy-trending-card"
                        aria-label={`Read ${post.title}`}
                      >
                        <span className="alloy-trending-number">
                          {String(
                            index + 1,
                          ).padStart(2, "0")}
                        </span>

                        <div className="alloy-trending-content">
                          <div className="alloy-trending-meta">
                            <span>
                              {category.name}
                            </span>

                            <time
                              dateTime={
                                post.publishedAt ||
                                undefined
                              }
                            >
                              {formatDate(
                                post.publishedAt,
                              )}
                            </time>
                          </div>

                          <h3>
                            {post.title}
                          </h3>
                        </div>

                        <span
                          className="alloy-trending-arrow"
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}