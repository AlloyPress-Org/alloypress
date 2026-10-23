import { cache } from "react";
import { payloadFetch } from "@/lib/payload";
import { getCategoryBySlug } from "@/lib/api/categories";
import { cleanEditorialText } from "@/lib/content/cleanEditorialText";
import { postHref } from "@/lib/post-href";

// ============================================================
// CONFIG
// ============================================================

const PAYLOAD_URL =
  process.env.PAYLOAD_API_URL ||
  "http://localhost:3001/api";

// Listicle = child category of Learn (slug "blogs").
// Posts open at /blogs/<post-slug> (see lib/post-href.ts).
const CATEGORY_SLUG = "listicles";

// Tags: MUST match what app/api/revalidate/route.ts invalidates.
//   home:listicles   -> added when a listicle post is published/edited
//   category:listicles / category:blogs -> category + section level
const HOME_TAG = "home:listicles";
const CATEGORY_TAG = `category:${CATEGORY_SLUG}`;
const SECTION_TAG = "category:blogs";

const HOME_LIST_LIMIT = 6;
const HOME_LIST_COUNT = 4;

// ============================================================
// TYPES
// ============================================================

export type ListPost = {
  id: number | string;
  title: string;
  slug: string;
  meta?: {
    description?: string | null;
  } | null;
  publishedAt?: string | null;
  updatedAt?: string | null;

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

type PostsResponse = {
  docs?: ListPost[];
};

// ============================================================
// GET LISTICLES CATEGORY
// ============================================================

const getListiclesCategory = cache(
  async (): Promise<
    number | string | null
  > => {
    try {
      // One shared /categories request for all home sections
      const category = await getCategoryBySlug(CATEGORY_SLUG, [
        CATEGORY_TAG,
      ]);

      return category?.id ?? null;
    } catch (error) {
      console.error(
        "[AIToolList] Category fetch failed:",
        error,
      );

      return null;
    }
  },
);

// ============================================================
// GET LISTICLE POSTS
// ============================================================

const getListPosts = cache(
  async (): Promise<ListPost[]> => {
    try {
      const categoryId =
        await getListiclesCategory();

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
        String(HOME_LIST_LIMIT),
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
        "select[meta]",
        "true",
      );

      params.set(
        "select[publishedAt]",
        "true",
      );

      params.set("select[updatedAt]", "true");

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
              revalidate: 604800,
              tags: [
                HOME_TAG,
                CATEGORY_TAG,
                SECTION_TAG,
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
        .filter(
          (post) =>
            Boolean(post?.id) &&
            Boolean(post?.title) &&
            Boolean(post?.slug) &&
            !/^Untitled WordPress Post/i.test(
              post.title,
            ),
        )
        .slice(0, HOME_LIST_COUNT);
    } catch (error) {
      console.error(
        "[AIToolList] Posts fetch failed:",
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
  featuredImage: ListPost["featuredImage"],
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

export default async function AIToolList() {
  const posts = await getListPosts();

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
      description: cleanEditorialText(
        post.meta?.description?.trim() || "",
      ),
      publishedAt: formatDate(post.updatedAt || post.publishedAt),
      image,
      imageAlt,
    };
  });

  return (
    <section
      className="ai-tool-reviews"
      aria-labelledby="ai-tool-list-heading"
    >
      <div className="container">
        <div className="ai-tool-reviews-header">
          <h2 id="ai-tool-list-heading">
            Best AI tools list by hands on testing
          </h2>

          <a
            href="/blogs/listicles"
            className="learn-ai-view-all"
            aria-label="View all AI tool lists"
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
              href={postHref(CATEGORY_SLUG, card.slug)}
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
                    AI TOOLS LIST
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

                {card.description && (
                  <p>{card.description}</p>
                )}

                <span className="ai-tool-review-read">
                  Read list{" "}
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