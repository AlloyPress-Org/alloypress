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
  page?: number;
};

type PaginatedPayloadResponse<T> =
  PayloadResponse<T> & {
    totalPages?: number;
    totalDocs?: number;
    page?: number;
    limit?: number;
  };

// ============================================================
// LOCAL CMS TYPES
// ============================================================

type Media = {
  id?: number;
  url?: string | null;
  alt?: string | null;
  width?: number;
  height?: number;
};

type ListingCategory = {
  id: number | string;
  name: string;
  slug: string;
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  featuredImage?: number | Media | null;
  category?: number | ListingCategory | null;
  author?: {
    name?: string | null;
  } | number | null;
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
  // Populated media object
  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    typeof featuredImage.url === "string" &&
    featuredImage.url
  ) {
    return featuredImage.url;
  }

  // Numeric media ID
  if (typeof featuredImage === "number") {
    const cmsUrl =
      PAYLOAD_API_URL ||
      "http://localhost:3000/api";

    return `${cmsUrl.replace(/\/api$/, "")}/api/media/${featuredImage}`;
  }

  // Fallback image
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

function isUsefulPost(post: Post): boolean {
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

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(parsed);
}

// ============================================================
// EXCERPT
// ============================================================

function getExcerpt(post: Post): string {
  if (post.excerpt?.trim()) {
    return post.excerpt.trim();
  }

  return "Practical insights, testing, and analysis from AlloyPress.";
}

// ============================================================
// AUTHOR
// ============================================================

function getAuthor(post: Post): string {
  if (
    typeof post.author === "object" &&
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

const getCategoryPosts = cache(
  async (
    slug: string,
    page: number,
  ): Promise<{
    category: ListingCategory | null;
    posts: Post[];
    totalPages: number;
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

      const category = categoryData?.docs?.[0];

      if (!category) {
        return {
          category: null,
          posts: [],
          totalPages: 0,
        };
      }

      // ========================================================
      // 2. GET PUBLISHED POSTS WITH REAL PAGINATION
      // ========================================================

      const postsData =
        await payloadFetch<
          PaginatedPayloadResponse<Post>
        >(
          `/posts` +
          `?where[workflowStatus][equals]=published` +
          `&where[category][equals]=${encodeURIComponent(
            String(category.id),
          )}` +
          `&sort=-publishedAt` +
          `&limit=13` +
          `&page=${page}` +
          `&depth=1` +
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

      const posts =
        (postsData?.docs ?? []).filter(isUsefulPost);

      return {
        category,
        posts,
        totalPages: Math.max(
          1,
          postsData?.totalPages ?? 1,
        ),
      };
    } catch (error) {
      console.error(
        `CategoryListing fetch error for "${slug}" page ${page}:`,
        error,
      );

      throw error;
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
  page = 1,
}: CategoryListingProps) {
  const currentPage = Math.max(1, page);

  const { posts, totalPages } =
    await getCategoryPosts(
      slug,
      currentPage,
    );

  // Page 1 keeps the existing featured layout.
  // Pagination pages render every fetched article as a card.
  const featuredPost =
    currentPage === 1
      ? posts[0] || null
      : null;

  const remainingPosts =
    currentPage === 1
      ? posts.slice(1)
      : posts;

  // ==========================================================
  // SECTION NUMBER
  // ==========================================================

  const sectionIndex =
    NAV_CATEGORIES.findIndex(
      (item) => item.slug === slug,
    ) + 1;

  const sectionNumber =
    String(
      sectionIndex > 0 ? sectionIndex : 1,
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
              <span>SECTION</span>

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

                  {item.slug === slug && (
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

          {featuredPost && (
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
                        featuredPost.featuredImage.alt
                        ? featuredPost.featuredImage.alt
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
          )}

          {!featuredPost && currentPage === 1 && (
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
                    {remainingPosts.length}{" "}
                    ARTICLES
                  </span>
                </div>

                <ArticleGrid>
                  {remainingPosts.map(
                    (post, index) => (
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
                                post.featuredImage.alt
                                ? post.featuredImage.alt
                                : cleanTitle(
                                  post.title,
                                )
                            }
                            loading="lazy"
                            decoding="async"
                          />

                          {/*
                          FIX (Bug 2): was `index + 1`, which
                          restarted numbering at 01 and collided
                          with the Featured post's own "01" label.
                          Featured post occupies slot 1, so the
                          grid now continues from 2.
                        */}
                          <span className="article-card-number">
                            {String(
                              currentPage === 1
                                ? index + 2
                                : (currentPage - 1) * 13 + index + 1,
                            ).padStart(2, "0")}
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

                {totalPages > 1 && (
                  <nav
                    className="category-pagination"
                    aria-label={`${title} pagination`}
                  >
                    {currentPage > 1 && (
                      <Link
                        href={
                          currentPage === 2
                            ? `/${slug}`
                            : `/${slug}/page/${currentPage - 1}`
                        }
                        className="category-pagination-arrow"
                        aria-label="Previous page"
                      >
                        ←
                      </Link>
                    )}

                    {currentPage < totalPages && (
                      <Link
                        href={`/${slug}/page/${currentPage + 1}`}
                        className="category-pagination-arrow"
                        aria-label="Next page"
                      >
                        →
                      </Link>
                    )}
                  </nav>
                )}
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