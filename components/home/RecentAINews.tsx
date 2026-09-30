import Image from "next/image";
import Link from "next/link";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

function cleanNewsExcerpt(value?: string | null): string {
  if (!value) return "";

  return value
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")

    // Remove leaked WordPress/editor headings
    .replace(
      /^\s*(quick\s+blog\s+summary|blog\s+summary)\s*[:\-]?\s*/i,
      "",
    )

    // Decode common HTML entities
    .replace(/&#038;|&#38;|&amp;/gi, "&")
    .replace(/&#8217;|&#x2019;|&rsquo;/gi, "’")
    .replace(/&#8220;|&#x201c;|&ldquo;/gi, "“")
    .replace(/&#8221;|&#x201d;|&rdquo;/gi, "”")
    .replace(/&#8211;|&#x2013;|&ndash;/gi, "–")
    .replace(/&#8212;|&#x2014;|&mdash;/gi, "—")
    .replace(/&#8230;|&#x2026;|&hellip;/gi, "…")

    // Remove WordPress leftover bracketed ellipsis
    .replace(/\[\s*…\s*\]/g, "…")
    .replace(/\[\s*&hellip;\s*\]/gi, "…")

    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

const PAYLOAD_URL =
  process.env.PAYLOAD_API_URL ||
  "http://localhost:3001/api";

const NEWS_CATEGORY_SLUG = "news";
const HOME_NEWS_LIMIT = 6;
const HOME_NEWS_COUNT = 5;

type NewsPost = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  featuredImage?:
    | {
        url?: string | null;
        alt?: string | null;
      }
    | number
    | null;
};

type NewsCategory = {
  id: number | string;
};

type CategoryResponse = {
  docs?: NewsCategory[];
};

type PostsResponse = {
  docs?: NewsPost[];
};

/* =========================================================
   GET NEWS CATEGORY

   Small cached request:
   - depth=0
   - ID only
   - ISR: 5 minutes
========================================================= */

const getNewsCategory = cache(
  async (): Promise<NewsCategory | null> => {
    try {
      const categoryData =
        await payloadFetch<CategoryResponse>(
          `/categories?where[slug][equals]=${NEWS_CATEGORY_SLUG}&limit=1&depth=0&select[id]=true`,
          {
            next: {
              revalidate: 300,
              tags: [
                `category:${NEWS_CATEGORY_SLUG}`,
                "categories",
              ],
            },
          },
        );

      return categoryData?.docs?.[0] ?? null;
    } catch (error) {
      console.error(
        "Recent AI News category fetch error:",
        error,
      );

      return null;
    }
  },
);

/* =========================================================
   GET LATEST PUBLISHED NEWS

   Only fields actually rendered by this component.
========================================================= */

const getRecentAINews = cache(
  async (): Promise<NewsPost[]> => {
    try {
      const category = await getNewsCategory();

      if (!category?.id) {
        console.error(
          "Recent AI News: News category not found.",
        );

        return [];
      }

      const postsData =
        await payloadFetch<PostsResponse>(
          `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
            String(category.id),
          )}&sort=-publishedAt&limit=${HOME_NEWS_LIMIT}&depth=1&select[id]=true&select[title]=true&select[slug]=true&select[excerpt]=true&select[publishedAt]=true&select[featuredImage]=true`,
          {
            next: {
              revalidate: 300,
              tags: [
                "home:latest-news",
                "posts",
                `category:${NEWS_CATEGORY_SLUG}`,
              ],
            },
          },
        );

      const posts = Array.isArray(
        postsData?.docs,
      )
        ? postsData.docs
        : [];

      return posts
        .filter((post) => {
          if (
            !post?.id ||
            !post?.title?.trim() ||
            !post?.slug?.trim() ||
            !post?.publishedAt
          ) {
            return false;
          }

          const title = post.title
            .trim()
            .toLowerCase();

          return (
            !title.includes(
              "untitled wordpress",
            ) &&
            !title.includes("dummy") &&
            !title.includes("test post") &&
            !title.includes("sample post") &&
            !title.includes("lorem ipsum")
          );
        })
        .slice(0, HOME_NEWS_COUNT);
    } catch (error) {
      console.error(
        "Recent AI News fetch error:",
        error,
      );

      return [];
    }
  },
);

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(
  featuredImage: NewsPost["featuredImage"],
): string | null {
  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    featuredImage.url
  ) {
    const imageUrl = featuredImage.url;

    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    return `${PAYLOAD_URL.replace(
      /\/api$/,
      "",
    )}${imageUrl}`;
  }

  if (typeof featuredImage === "number") {
    return `${PAYLOAD_URL.replace(
      /\/api$/,
      "",
    )}/api/media/${featuredImage}`;
  }

  return null;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  date?: string | null,
): string {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

/* =========================================================
   COMPONENT
========================================================= */

export default async function RecentAINews() {
  const posts = await getRecentAINews();

  if (!posts.length) {
    return null;
  }

  /* Latest News post */
  const featured = posts[0];

  /* Remaining latest News posts */
  const supportingPosts = posts.slice(1);

  const featuredImage = getImageUrl(
    featured.featuredImage,
  );

  return (
    <section
      className="recent-ai-news"
      aria-labelledby="recent-ai-news-heading"
    >
      <div
        className="recent-ai-news-bg"
        aria-hidden="true"
      >
        <span className="news-grid" />
        <span className="news-line news-line-one" />
        <span className="news-line news-line-two" />
      </div>

      <div className="container recent-ai-news-inner">
        <div className="recent-ai-news-header">
          <div>
            <h2 id="recent-ai-news-heading">
              AI News
            </h2>
          </div>

          <Link
            href="/news"
            className="recent-ai-news-view-all"
            aria-label="View all AI news"
          >
            View all

            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="recent-ai-news-layout">
          {/* =================================================
              FEATURED — LATEST NEWS
          ================================================= */}

          <article className="recent-news-featured">
            <Link
              href={`/news/${featured.slug}`}
              className="recent-news-featured-link"
              aria-label={`Read ${featured.title}`}
            >
              <div className="recent-news-featured-image">
                {featuredImage ? (
                  <Image
                    src={featuredImage}
                    alt={
                      typeof featured.featuredImage ===
                        "object" &&
                      featured.featuredImage !== null
                        ? featured.featuredImage.alt ||
                          featured.title
                        : featured.title
                    }
                    fill
                    sizes="(max-width: 900px) 100vw, 58vw"
                  />
                ) : (
                  <div
                    className="recent-news-image-placeholder"
                    aria-hidden="true"
                  />
                )}

                <span
                  className="recent-news-image-overlay"
                  aria-hidden="true"
                />

                <span className="recent-news-badge">
                  Latest
                </span>
              </div>

              <div className="recent-news-featured-content">
                <div className="recent-news-meta">
                  <span>AI NEWS</span>

                  <span aria-hidden="true">
                    •
                  </span>

                  <time
                    dateTime={
                      featured.publishedAt ||
                      undefined
                    }
                  >
                    {formatDate(
                      featured.publishedAt,
                    )}
                  </time>
                </div>

                <h3>{featured.title}</h3>

                {featured.excerpt && (
  <p>{cleanNewsExcerpt(featured.excerpt)}</p>
)}

                <span className="recent-news-read">
                  Read story

                  <span aria-hidden="true">
                    ↗
                  </span>
                </span>
              </div>
            </Link>
          </article>

          {/* =================================================
              SUPPORTING — OTHER LATEST NEWS
          ================================================= */}

          <div className="recent-news-list">
            {supportingPosts.map((post) => {
              const image = getImageUrl(
                post.featuredImage,
              );

              return (
                <article
                  className="recent-news-item"
                  key={post.id}
                >
                  <Link
                    href={`/news/${post.slug}`}
                    className="recent-news-item-link"
                    aria-label={`Read ${post.title}`}
                  >
                    <div className="recent-news-item-image">
                      {image ? (
                        <Image
                          src={image}
                          alt={
                            typeof post.featuredImage ===
                              "object" &&
                            post.featuredImage !==
                              null
                              ? post.featuredImage
                                  .alt ||
                                post.title
                              : post.title
                          }
                          fill
                          sizes="96px"
                        />
                      ) : (
                        <div
                          className="recent-news-thumb-placeholder"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="recent-news-item-content">
                      <div className="recent-news-item-meta">
                        <span>AI NEWS</span>

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

                      <h3>{post.title}</h3>
                    </div>

                    <span
                      className="recent-news-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}