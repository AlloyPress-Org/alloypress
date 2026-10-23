import Image from "@/components/CfImage";
import Link from "next/link";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";
import { getCategoryBySlug } from "@/lib/api/categories";
import { postHref } from "@/lib/post-href";

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
  updatedAt?: string | null;
  featuredImage?: Media | number | null;
  category?: Category | number | null;
};

type PayloadResponse = {
  docs?: Post[];
};

const REVIEWS_CATEGORY_SLUG = "reviews";
const HOME_REVIEW_LIMIT = 6;
const HOME_REVIEW_COUNT = 4;

function getMediaUrl(media: Post["featuredImage"]): string | null {
  if (!media || typeof media === "number") {
    return null;
  }

  if (!media.url) {
    return null;
  }

  if (media.url.startsWith("http")) {
    return media.url;
  }

  const cmsUrl =
    process.env.PAYLOAD_API_URL ||
    "http://localhost:3001/api";

  return `${cmsUrl.replace(/\/api$/, "")}${media.url}`;
}

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

function isValidPost(post: Post): boolean {
  // publishedAt is no longer required: posts are ordered by
  // updatedAt, so a published/updated post must never be dropped
  // just because publishedAt is missing.
  if (!post.id || !post.title || !post.slug) {
    return false;
  }

  const title = post.title.trim().toLowerCase();
  const category = getCategory(post.category);

  if (title.includes("untitled wordpress")) {
    return false;
  }

  if (
    category.slug === "uncategorized" ||
    category.name.toLowerCase() === "uncategorized"
  ) {
    return false;
  }

  return true;
}

/**
 * Cached Reviews category lookup.
 *
 * This request is tiny:
 * - depth=0
 * - only id selected
 */
const getReviewsCategory = cache(async (): Promise<Category | null> => {
  try {
    // One shared /categories request for all home sections
    return await getCategoryBySlug(REVIEWS_CATEGORY_SLUG);
  } catch (error) {
    console.error(
      "Latest Updates category fetch error:",
      error,
    );

    return null;
  }
});

/**
 * Cached latest Reviews posts.
 *
 * Sorted by updatedAt so BOTH newly published posts
 * AND updated/republished posts appear at the top.
 *
 * Only fields actually rendered by this component are selected.
 */
const getLatestPosts = cache(async (): Promise<Post[]> => {
  try {
    const reviewsCategory = await getReviewsCategory();

    if (!reviewsCategory?.id) {
      console.error(
        "Latest Updates: Reviews category not found.",
      );

      return [];
    }

    const postsData = await payloadFetch<PayloadResponse>(
      `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
        String(reviewsCategory.id),
      )}&sort=-updatedAt&limit=${HOME_REVIEW_LIMIT}&depth=1&select[id]=true&select[title]=true&select[slug]=true&select[publishedAt]=true&select[updatedAt]=true&select[featuredImage]=true&select[category]=true`,
      {
        next: {
          revalidate: 604800,
          tags: [
            "home:reviews",
            "category:reviews",
          ],
        },
      },
    );

    if (!postsData?.docs?.length) {
      return [];
    }

    return postsData.docs
      .filter(isValidPost)
      .slice(0, HOME_REVIEW_COUNT);
  } catch (error) {
    console.error(
      "Latest Updates fetch error:",
      error,
    );

    return [];
  }
});

export default async function LatestUpdates() {
  const posts = await getLatestPosts();

  if (!posts.length) {
    return null;
  }

  return (
    <section
      className="latest-updates-section"
      aria-labelledby="latest-updates-title"
    >
      <div className="container">
        <div className="latest-updates-header">
          <h2 id="latest-updates-title">
            Detailed AI tools review by Alloypress
          </h2>

          <Link
            href="/reviews"
            className="latest-updates-view-all"
          >
            <span>View all</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="latest-updates-list">
          {posts.map((post, index) => {
            const image = getMediaUrl(
              post.featuredImage,
            );

            const category = getCategory(
              post.category,
            );

            // Most recent activity date (publish or update).
            const displayDate =
              post.updatedAt || post.publishedAt;

            return (
              <Link
                key={post.id}
                href={postHref(category.slug, post.slug)}
                className="latest-update-item"
                aria-label={`Read ${post.title}`}
              >
                <span className="latest-update-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="latest-update-content">
                  <div className="latest-update-meta">
                    <span>{category.name}</span>

                    <time
                      dateTime={displayDate || undefined}
                    >
                      {formatDate(displayDate)}
                    </time>
                  </div>

                  <h3>{post.title}</h3>

                  <span className="latest-update-read">
                    Read story
                    <span aria-hidden="true">
                      →
                    </span>
                  </span>
                </div>

                <div className="latest-update-image">
                  {image ? (
                    <Image
                      src={image}
                      alt={
                        typeof post.featuredImage ===
                          "object"
                          ? post.featuredImage?.alt ||
                          post.title ||
                          "Latest AI update"
                          : post.title ||
                          "Latest AI update"
                      }
                      fill
                      sizes="(max-width: 700px) 100vw, 240px"
                    />
                  ) : (
                    <div
                      className="latest-update-placeholder"
                      aria-hidden="true"
                    >
                      AI
                    </div>
                  )}
                </div>

                <span
                  className="latest-update-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}