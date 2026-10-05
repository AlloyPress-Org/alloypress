import "./CategoryListing.css";

import ArticleGrid from "./ArticleGrid";
import Link from "next/link";
import { cache } from "react";

import {
  payloadFetch,
  PAYLOAD_API_URL,
} from "@/lib/payload";

import type {
  PayloadResponse,
} from "@/lib/cms";

// ============================================================
// PROPS
// ============================================================

type CategoryListingProps = {
  slug: string;
  title: string;
  description: string;
};

// ============================================================
// LOCAL CMS TYPES
// ============================================================

type Media = {
  id?: number | string;
  url?: string | null;
  alt?: string | null;
  width?: number;
  height?: number;
};

type ListingCategory = {
  id: number | string;
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  featuredImage?: number | Media | null;
  category?: number | ListingCategory | null;
  author?:
    | {
        name?: string | null;
      }
    | number
    | null;
  workflowStatus?: string | null;
};

// ============================================================
// NAVIGATION CATEGORIES
// ============================================================

const NAV_CATEGORIES = [
  {
    label: "Blogs",
    slug: "blogs",
  },
  {
    label: "Reviews",
    slug: "reviews",
  },
  {
    label: "News",
    slug: "news",
  },
  {
    label: "Alternatives",
    slug: "alternatives",
  },
  {
    label: "Comparisons",
    slug: "comparisons",
  },
];

// ============================================================
// FALLBACK IMAGES
// ============================================================

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80",
];

// ============================================================
// IMAGE URL
// ============================================================

function getImageUrl(
  featuredImage: Post["featuredImage"],
  index = 0,
): string {
  // ----------------------------------------------------------
  // Populated media object
  // ----------------------------------------------------------

  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    typeof featuredImage.url === "string" &&
    featuredImage.url
  ) {
    return featuredImage.url;
  }

  // ----------------------------------------------------------
  // Numeric media ID
  // ----------------------------------------------------------

  if (typeof featuredImage === "number") {
    const cmsUrl =
      PAYLOAD_API_URL ||
      "http://localhost:3000/api";

    return `${cmsUrl.replace(
      /\/api$/,
      "",
    )}/api/media/${featuredImage}`;
  }

  // ----------------------------------------------------------
  // Fallback image
  // ----------------------------------------------------------

  return FALLBACK_IMAGES[
    index % FALLBACK_IMAGES.length
  ];
}

// ============================================================
// TITLE
// ============================================================

function cleanTitle(
  title?: string | null,
): string {
  if (!title) {
    return "Untitled article";
  }

  return title
    .replace(
      /^Untitled WordPress Post\s*[-:|]?\s*/i,
      "",
    )
    .trim();
}

// ============================================================
// POST VALIDATION
// ============================================================

function isUsefulPost(
  post: Post,
): boolean {
  const title = cleanTitle(post.title);

  if (!title) {
    return false;
  }

  if (
    /^Untitled WordPress Post/i.test(title)
  ) {
    return false;
  }

  if (title.length < 5) {
    return false;
  }

  if (!post.slug) {
    return false;
  }

  if (!post.publishedAt) {
    return false;
  }

  return true;
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  date?: string | null,
): string {
  if (!date) {
    return "Recently";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "numeric",
    },
  ).format(parsed);
}

// ============================================================
// EXCERPT
// ============================================================

function getExcerpt(value: unknown): string {
  if (typeof value !== "string") return "";

  let text = value;

  // Remove leaked HTML headings and their content
  text = text.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&#39;": "'",
    "&#038;": "&",
    "&hellip;": "…",
    "&#8230;": "…",
    "&nbsp;": " ",
  };

  text = text.replace(
    /&(?:amp|lt|gt|quot|#039|#39|#038|hellip|#8230|nbsp);/gi,
    (entity) => entityMap[entity.toLowerCase()] ?? entity,
  );

  // Remove leaked WordPress/editor prefixes
  text = text.replace(
    /^\s*(?:quick\s+blog\s+summary|blog\s+summary)\s*:?\s*/i,
    "",
  );

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
// ============================================================
// AUTHOR
// ============================================================

function getAuthor(
  post: Post,
): string {
  if (
    typeof post.author ===
      "object" &&
    post.author !== null &&
    post.author.name
  ) {
    return post.author.name;
  }

  return "AlloyPress Team";
}

// ============================================================
// GET CATEGORY + POSTS
// ============================================================
//
// PERFORMANCE / ISR STRATEGY
//
// 1. React cache()
//    - Deduplicates identical requests during the same render.
//    - Prevents duplicate category/post fetches when this function
//      is called more than once in the same server render.
//
// 2. Payload/Next.js revalidate = 300
//    - Allows ISR/data caching for 5 minutes.
//    - Avoids repeatedly hitting Payload + Neon on every request.
//
// 3. depth=0 for category
//    - We only need category.id.
//    - No relationship population is required.
//
// 4. select on category
//    - Only return the category ID.
//
// 5. depth=1 for posts
//    - Required because the UI renders featuredImage and author.
//
// 6. select on posts
//    - Prevents Payload from returning the entire Post document.
//    - This is one of the most important network-transfer fixes.
//
// 7. limit=100
//    - Kept intentionally for current UI behavior.
//    - The category page currently displays all fetched articles.
//    - Reducing this to 12/20 would silently hide articles.
//
// Long-term:
//    Replace limit=100 with pagination/load-more once the UI supports
//    it. That is the proper solution for very large categories.
//
// ============================================================

const getCategoryPosts = cache(
  async (
    slug: string,
  ): Promise<{
    category: ListingCategory | null;
    posts: Post[];
  }> => {
    try {
      // ========================================================
      // 1. GET CATEGORY
      // ========================================================

      const categoryData =
        await payloadFetch<
          PayloadResponse<ListingCategory>
        >(
          `/categories?where[slug][equals]=${encodeURIComponent(
            slug,
          )}&limit=1&depth=0&select[id]=true`,
          {
            next: {
              revalidate: 300,
              tags: [
                `category:${slug}`,
                "categories",
              ],
            },
          },
        );

      const category =
        categoryData?.docs?.[0];

      if (!category) {
        return {
          category: null,
          posts: [],
        };
      }

      // ========================================================
      // 2. GET PUBLISHED POSTS
      // ========================================================
      //
      // IMPORTANT:
      // Keep workflowStatus because this is the actual field used
      // by the current AlloyPress Payload schema.
      //
      // Do NOT change this to `_status` unless the Payload schema
      // is explicitly migrated to use that field.
      //
      // ========================================================

      const postsData =
        await payloadFetch<
          PayloadResponse<Post>
        >(
          `/posts` +
            `?where[workflowStatus][equals]=published` +
            `&where[category][equals]=${encodeURIComponent(
              String(category.id),
            )}` +
            `&sort=-publishedAt` +
            `&limit=35` +
            `&depth=0` +
            `&select[id]=true` +
            `&select[title]=true` +
            `&select[slug]=true` +
            `&select[excerpt]=true` +
            `&select[publishedAt]=true` +
            `&select[featuredImage]=true` +
            `&select[author]=true`,
          {
            next: {
              revalidate: 300,
              tags: [
                `category:${slug}`,
                "posts",
              ],
            },
          },
        );

      // ========================================================
      // 3. FILTER POSTS
      // ========================================================

      const posts =
        (postsData?.docs ?? [])
          .filter(isUsefulPost);

      return {
        category,
        posts,
      };
    } catch (error) {
      console.error(
        `CategoryListing fetch error for "${slug}":`,
        error,
      );

      return {
        category: null,
        posts: [],
      };
    }
  },
);

// ============================================================
// CATEGORY LISTING
// ============================================================

export default async function CategoryListing({
  slug,
  title,
  description,
}: CategoryListingProps) {
  const { posts } =
    await getCategoryPosts(slug);

  const featuredPost =
    posts[0] || null;

  const remainingPosts =
    posts.slice(1);

  // ==========================================================
  // SECTION NUMBER
  // ==========================================================

  const sectionIndex =
    NAV_CATEGORIES.findIndex(
      (item) =>
        item.slug === slug,
    ) + 1;

  const sectionNumber =
    String(
      sectionIndex > 0
        ? sectionIndex
        : 1,
    ).padStart(2, "0");

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="category-page">
      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="category-hero">
        <div className="category-hero-grid" />

        <div className="category-hero-inner">
          <div className="category-hero-label">
            <span />
            ALLOYPRESS /{" "}
            {slug.toUpperCase()}
          </div>

          <div className="category-hero-main">
            <div>
              <h1>{title}</h1>

              <p>
                {description}
              </p>
            </div>

            <div className="category-hero-index">
              <span>
                SECTION
              </span>

              <strong>
                {sectionNumber}
              </strong>
            </div>
          </div>

          {/* ==================================================
              CATEGORY NAVIGATION
          ================================================== */}

          <nav
            className="category-filter"
            aria-label="Article categories"
          >
            {NAV_CATEGORIES.map(
              (item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className={
                    item.slug === slug
                      ? "category-filter-link active"
                      : "category-filter-link"
                  }
                >
                  {item.label}

                  {item.slug ===
                    slug && (
                    <span>
                      •
                    </span>
                  )}
                </Link>
              ),
            )}
          </nav>
        </div>
      </section>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="category-content">
        <div className="category-content-inner">
          {/* ==================================================
              FEATURED ARTICLE
          ================================================== */}

          {featuredPost ? (
            <>
              <div className="category-section-heading">
                <div>
                  <span className="section-number">
                    01
                  </span>

                  <h2>
                    Featured
                  </h2>
                </div>

                <span className="section-rule" />
              </div>

              <Link
                href={`/${slug}/${featuredPost.slug}`}
                className="featured-post"
              >
                <div className="featured-image">
                  <img
                    src={getImageUrl(
                      featuredPost.featuredImage,
                      0,
                    )}
                    alt={
                      typeof featuredPost.featuredImage ===
                        "object" &&
                      featuredPost.featuredImage !==
                        null &&
                      featuredPost
                        .featuredImage
                        .alt
                        ? featuredPost
                            .featuredImage
                            .alt
                        : cleanTitle(
                            featuredPost.title,
                          )
                    }
                    loading="eager"
                    decoding="async"
                  />

                  <div className="featured-image-overlay" />

                  <span className="featured-image-label">
                    {title.toUpperCase()}
                  </span>

                  <span
                    className="featured-image-arrow"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </div>

                <div className="featured-info">
                  <div className="featured-meta">
                    <span>
                      FEATURED ARTICLE
                    </span>

                    <i />

                    <span>
                      {formatDate(
                        featuredPost.publishedAt,
                      )}
                    </span>
                  </div>

                  <h3>
                    {cleanTitle(
                      featuredPost.title,
                    )}
                  </h3>

                  <p>
                    {getExcerpt(
                      featuredPost,
                    )}
                  </p>

                  <div className="featured-footer">
                    <span>
                      By{" "}
                      {getAuthor(
                        featuredPost,
                      )}
                    </span>

                    <strong>
                      Read article →
                    </strong>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="empty-state">
              <span>
                NO ARTICLES YET
              </span>

              <h2>
                New{" "}
                {title.toLowerCase()}{" "}
                content is on the way.
              </h2>

              <p>
                Check back soon for new
                AlloyPress articles and
                insights.
              </p>
            </div>
          )}

          {/* ==================================================
              LATEST ARTICLES
          ================================================== */}

          {remainingPosts.length >
            0 && (
            <section className="latest-section">
              <div className="category-section-heading">
                <div>
                  <span className="section-number">
                    02
                  </span>

                  <h2>
                    Latest {title}
                  </h2>
                </div>

                <span className="article-count">
                  {
                    remainingPosts.length
                  }{" "}
                  ARTICLES
                </span>
              </div>

              <ArticleGrid>
                {remainingPosts.map(
                  (
                    post,
                    index,
                  ) => (
                    <Link
                      key={post.id}
                      href={`/${slug}/${post.slug}`}
                      className="article-card"
                    >
                      <div className="article-card-image">
                        <img
                          src={getImageUrl(
                            post.featuredImage,
                            index + 1,
                          )}
                          alt={
                            typeof post.featuredImage ===
                              "object" &&
                            post.featuredImage !==
                              null &&
                            post
                              .featuredImage
                              .alt
                              ? post
                                  .featuredImage
                                  .alt
                              : cleanTitle(
                                  post.title,
                                )
                          }
                          loading="lazy"
                          decoding="async"
                        />

                        <span className="article-card-number">
                          {String(
                            index + 2,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <span
                          className="article-card-arrow"
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </div>

                      <div className="article-card-body">
                        <div className="article-card-meta">
                          <span>
                            {title.toUpperCase()}
                          </span>

                          <i />

                          <span>
                            {formatDate(
                              post.publishedAt,
                            )}
                          </span>
                        </div>

                        <h3>
                          {cleanTitle(
                            post.title,
                          )}
                        </h3>

                        <p>
                          {getExcerpt(
                            post,
                          )}
                        </p>

                        <div className="article-card-footer">
                          <span>
                            {getAuthor(
                              post,
                            )}
                          </span>

                          <strong>
                            Read →
                          </strong>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </ArticleGrid>
            </section>
          )}

          {/* ==================================================
              BOTTOM CTA
          ================================================== */}

          <div className="category-bottom-cta">
            <div>
              <span>
                ALLOYPRESS / EDITORIAL
              </span>

              <h2>
                Looking for something
                specific?
              </h2>

              <p>
                Explore our reviews,
                comparisons, alternatives,
                and practical AI guides.
              </p>
            </div>

            <Link
              href="/"
              className="category-home-link"
            >
              Explore AlloyPress

              <span>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}