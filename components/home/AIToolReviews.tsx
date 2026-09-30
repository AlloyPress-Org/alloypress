import { cache } from "react";
import { payloadFetch } from "@/lib/payload";
import { cleanEditorialText } from "@/lib/content/cleanEditorialText";

// ============================================================
// CONFIG
// ============================================================

const PAYLOAD_URL =
  process.env.PAYLOAD_API_URL ||
  "http://localhost:3001/api";

const CATEGORY_SLUG = "reviews";
const CATEGORY_TAG = "category:reviews";
const HOME_TAG = "home:reviews";

const HOME_REVIEW_LIMIT = 6;
const HOME_REVIEW_COUNT = 4;

// ============================================================
// TYPES
// ============================================================

export type ReviewPost = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;

  author?:
  | string
  | {
    name?: string | null;
  }
  | null;

  featuredImage?:
  | {
    url?: string | null;
    alt?: string | null;
  }
  | number
  | null;
};

type CategoryResponse = {
  docs?: Array<{
    id: number | string;
  }>;
};

type PostsResponse = {
  docs?: ReviewPost[];
};

// ============================================================
// GET REVIEWS CATEGORY
// ============================================================

const getReviewsCategory = cache(
  async (): Promise<
    number | string | null
  > => {
    try {
      const data =
        await payloadFetch<CategoryResponse>(
          `/categories?where[slug][equals]=${encodeURIComponent(
            CATEGORY_SLUG,
          )}&limit=1&depth=0&select[id]=true`,
          {
            next: {
              revalidate: 300,
              tags: [CATEGORY_TAG],
            },
          },
        );

      return data?.docs?.[0]?.id ?? null;
    } catch (error) {
      console.error(
        "[AIToolReviews] Category fetch failed:",
        error,
      );

      return null;
    }
  },
);

// ============================================================
// GET REVIEW POSTS
// ============================================================

const getReviewPosts = cache(
  async (): Promise<ReviewPost[]> => {
    try {
      const categoryId =
        await getReviewsCategory();

      if (!categoryId) {
        return [];
      }

      const params = new URLSearchParams();

      params.set(
        "where[workflowStatus][equals]",
        "published",
      );

      params.set(
        "where[category][equals]",
        String(categoryId),
      );

      params.set(
        "sort",
        "-publishedAt",
      );

      params.set(
        "limit",
        String(HOME_REVIEW_LIMIT),
      );

      params.set(
        "depth",
        "1",
      );

      // Only fields required by this homepage section.
      params.set(
        "select[id]",
        "true",
      );

      params.set(
        "select[title]",
        "true",
      );

      params.set(
        "select[slug]",
        "true",
      );

      params.set(
        "select[excerpt]",
        "true",
      );

      params.set(
        "select[publishedAt]",
        "true",
      );

      params.set(
        "select[author]",
        "true",
      );

      params.set(
        "select[featuredImage]",
        "true",
      );

      const postsData =
        await payloadFetch<PostsResponse>(
          `/posts?${params.toString()}`,
          {
            next: {
              revalidate: 300,
              tags: [HOME_TAG],
            },
          },
        );

      const posts = Array.isArray(
        postsData?.docs,
      )
        ? postsData.docs
        : [];

      return posts
        .filter(
          (post) =>
            Boolean(post?.id) &&
            Boolean(post?.title) &&
            Boolean(post?.slug) &&
            !/^Untitled WordPress Post/i.test(
              post.title,
            ),
        )
        .slice(0, HOME_REVIEW_COUNT);
    } catch (error) {
      console.error(
        "[AIToolReviews] Posts fetch failed:",
        error,
      );

      return [];
    }
  },
);

// ============================================================
// IMAGE URL
// ============================================================

function getImageUrl(
  featuredImage: ReviewPost["featuredImage"],
): string | null {
  if (
    typeof featuredImage === "object" &&
    featuredImage !== null &&
    typeof featuredImage.url === "string" &&
    featuredImage.url
  ) {
    return featuredImage.url;
  }

  if (typeof featuredImage === "number") {
    return `${PAYLOAD_URL.replace(
      /\/api$/,
      "",
    )}/api/media/${featuredImage}`;
  }

  return null;
}

// ============================================================
// AUTHOR
// ============================================================

function getAuthor(
  author: ReviewPost["author"],
): string {
  if (typeof author === "string") {
    return author;
  }

  if (
    author &&
    typeof author === "object" &&
    typeof author.name === "string"
  ) {
    return author.name;
  }

  return "";
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  date?: string | null,
): string {
  if (!date) {
    return "";
  }

  const timestamp = Date.parse(date);

  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(timestamp);
}

// ============================================================
// COMPONENT
// ============================================================

export default async function AIToolReviews() {
  const posts = await getReviewPosts();

  if (!posts.length) {
    return null;
  }

  const cards = posts.map((post) => {
    const image =
      getImageUrl(post.featuredImage);

    const imageAlt =
      typeof post.featuredImage === "object" &&
        post.featuredImage !== null
        ? post.featuredImage.alt ||
        post.title
        : post.title;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: cleanEditorialText(post.excerpt || ""),
      publishedAt: formatDate(
        post.publishedAt,
      ),
      author: getAuthor(post.author),
      image,
      imageAlt,
    };
  });

  return (
    <section
      className="ai-tool-reviews"
      aria-labelledby="ai-tool-reviews-heading"
    >
      <div className="container">
        <div className="ai-tool-reviews-header">
          <h2 id="ai-tool-reviews-heading">
            Best AI tools list by hands on testing
          </h2>

          <a
            href="/reviews"
            className="learn-ai-view-all"
            aria-label="View all AI tool reviews"
          >
            View all
            <span aria-hidden="true">
              →
            </span>
          </a>
        </div>

        <div className="ai-tool-reviews-grid">
          {cards.map((card) => (
            <a
              key={card.id}
              href={`/reviews/${card.slug}`}
              className="ai-tool-review-card"
            >
              <div className="ai-tool-review-image">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.imageAlt}
                    loading="lazy"
                  />
                ) : (
                  <div className="ai-tool-review-image-placeholder" />
                )}
              </div>

              <div className="ai-tool-review-content">
                <div className="ai-tool-review-meta">
                  <span>
                    AI TOOL REVIEW
                  </span>

                  {card.publishedAt && (
                    <>
                      <span aria-hidden="true">
                        ·
                      </span>

                      <time>
                        {card.publishedAt}
                      </time>
                    </>
                  )}
                </div>

                <h3>{card.title}</h3>

                {card.excerpt && (
                  <p>{card.excerpt}</p>
                )}

                <span className="ai-tool-review-read">
                  Read review{" "}
                  <span>↗</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}