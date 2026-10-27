import "./CategoryListing.css";

import ArticleGrid from "./ArticleGrid";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";

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
  /** Section slug, e.g. "blogs" (URLs always stay /blogs/<post-slug>) */
  slug: string;
  title: string;
  description: string;
  /** Optional subcategory slug, e.g. "listicles" -> lists only that subcategory */
  subSlug?: string;
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

type ChildCategory = {
  id: number | string;
  name: string;
  slug: string;
};

const capitalize = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
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

// "Blogs" tab is replaced by two tabs. Both live under the "blogs"
// section slug, so their posts still open at /blogs/<post-slug>.
const NAV_CATEGORIES: Array<{
  label: string;
  slug: string;
  href: string;
  subSlug?: string;
}> = [
    {
      label: "Listicles",
      slug: "blogs",
      subSlug: "listicles",
      href: "/blogs/listicles",
    },
    {
      label: "Informatives",
      slug: "blogs",
      subSlug: "informatives",
      href: "/blogs/informatives",
    },
    {
      label: "Reviews",
      slug: "reviews",
      href: "/reviews",
    },
    {
      label: "News",
      slug: "news",
      href: "/news",
    },
    {
      label: "Alternatives",
      slug: "alternatives",
      href: "/alternatives",
    },
    {
      label: "Comparisons",
      slug: "comparisons",
      href: "/comparisons",
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
function getDisplayDate(post: Post): string {
  const published = post.publishedAt
    ? new Date(post.publishedAt).getTime()
    : 0;

  const updated = post.updatedAt
    ? new Date(post.updatedAt).getTime()
    : 0;

  const DAY = 24 * 60 * 60 * 1000;

  const isUpdated =
    published > 0 &&
    updated - published > DAY;

  const raw = isUpdated
    ? post.updatedAt
    : post.publishedAt;

  if (!raw) return "Recently";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(raw));

  return `${isUpdated ? "Updated" : "Published"} ${formattedDate}`;
}

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
// Cached at two levels:
//   1. React cache()  -> dedupes calls within one render
//   2. Next fetch cache (revalidate: 300 + tags) -> Payload
//      responses are reused for 5 min, so Neon is not hit on
//      every visit. Tags allow on-demand revalidation:
//      revalidateTag(`category:${slug}`) / revalidateTag("posts")
// ============================================================

const getCategoryPosts = cache(
  async (
    slug: string,
    subSlug?: string,
  ): Promise<{
    category: ListingCategory | null;
    children: ChildCategory[];
    activeChild: ChildCategory | null;
    posts: Post[];
  }> => {
    try {
      // ========================================================
      // 1. GET SECTION CATEGORY (e.g. Learn / slug "blogs")
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
              revalidate: 604800,
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
          children: [],
          activeChild: null,
          posts: [],
        };
      }

      // ========================================================
      // 2. GET SUBCATEGORIES (listicle, informative, ...)
      // ========================================================

      const childData =
        await payloadFetch<
          PayloadResponse<ChildCategory>
        >(
          `/categories` +
          `?where[parent][equals]=${encodeURIComponent(
            String(category.id),
          )}` +
          `&limit=100&depth=0&sort=name` +
          `&select[name]=true&select[slug]=true`,
          {
            next: {
              revalidate: 604800,
              tags: [
                `category:${slug}`,
                "categories",
              ],
            },
          },
        );

      const children = childData?.docs ?? [];

      // Section page  -> section + all its subcategories
      // Sub page      -> only that subcategory
      let categoryIds: Array<number | string> = [
        category.id,
        ...children.map((child) => child.id),
      ];

      let activeChild: ChildCategory | null = null;

      if (subSlug) {
        activeChild =
          children.find((child) => child.slug === subSlug) ?? null;

        if (!activeChild) {
          return {
            category: null,
            children,
            activeChild: null,
            posts: [],
          };
        }

        categoryIds = [activeChild.id];
      }

      // ========================================================
      // 3. GET LATEST PUBLISHED POSTS
      // ========================================================

      const postsData =
        await payloadFetch<
          PayloadResponse<Post>
        >(
          `/posts` +
          `?where[workflowStatus][equals]=published` +
          `&where[category][in]=${encodeURIComponent(
            categoryIds.join(","),
          )}` +
          `&sort=-updatedAt` +
          `&limit=100` +
          `&depth=1` +
          `&select[id]=true` +
          `&select[title]=true` +
          `&select[slug]=true` +
          `&select[excerpt]=true` +
          `&select[publishedAt]=true` +
          `&select[updatedAt]=true` +
          `&select[featuredImage]=true` +
          `&select[category]=true` +
          `&select[author]=true`,
          {
            next: {
              revalidate: 604800,
              tags: [
                `category:${slug}`,
                ...(subSlug ? [`category:${subSlug}`] : []),
                "posts",
              ],
            },
          },
        );

      const posts =
        (postsData?.docs ?? []).filter(isUsefulPost);

      return {
        category,
        children,
        activeChild,
        posts,
      };
    } catch (error) {
      console.error(
        `CategoryListing fetch error for "${slug}${subSlug ? `/${subSlug}` : ""
        }":`,
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
  subSlug,
}: CategoryListingProps) {
  const { posts, children, activeChild } =
    await getCategoryPosts(slug, subSlug);

  // /blogs/<unknown-subcategory> -> real 404
  if (subSlug && !activeChild) {
    notFound();
  }

  // Label shown on cards: subcategory name (Listicle / Informative)
  // for posts that belong to a subcategory, otherwise the section title.
  const labelFor = (post: Post): string => {
    const cat = post.category;

    if (
      typeof cat === "object" &&
      cat !== null &&
      cat.slug &&
      cat.slug !== slug &&
      cat.name
    ) {
      return capitalize(cat.name);
    }

    return title;
  };

  // 1 featured + remaining 11 = 12 articles
  const featuredPost = posts[0] || null;

  const remainingPosts = posts.slice(1);

  // ==========================================================
  // SECTION NUMBER
  // ==========================================================

  const sectionIndex =
    NAV_CATEGORIES.findIndex(
      (item) =>
        item.slug === slug &&
        item.subSlug === subSlug,
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
            {activeChild && (
              <>
                {" "}/{" "}
                {activeChild.name.toUpperCase()}
              </>
            )}
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
              (item) => {
                const active =
                  item.slug === slug &&
                  item.subSlug === subSlug;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "category-filter-link active"
                        : "category-filter-link"
                    }
                  >
                    {item.label}

                    {active && (
                      <span>
                        •
                      </span>
                    )}
                  </Link>
                );
              },
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
                    {labelFor(featuredPost).toUpperCase()}
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
                      {getDisplayDate(featuredPost)}
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

          {!featuredPost && (
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
                            Featured post occupies slot 01,
                            so the grid numbering starts from 02.
                          */}
                          <span className="article-card-number">
                            {String(index + 2).padStart(2, "0")}
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
                              {labelFor(post).toUpperCase()}
                            </span>

                            <i />

                            <span>
                              {getDisplayDate(post)}
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