import Image from "@/components/CfImage";
import Link from "next/link";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";
import { getCategoryBySlug } from "@/lib/api/categories";
import { postHref } from "@/lib/post-href";
import "@/components/css-style/learn-ai.css";

type Media = {
  url?: string | null;
  alt?: string | null;
};

type Category = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
};

type Author = {
  name?: string | null;
};

type Post = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: Author | number | string | null;
  category?: Category | number | string | null;
  featuredImage?: Media | number | string | null;
};

type PostsResponse = {
  docs?: Post[];
};

const BLOGS_CATEGORY_SLUG = "blogs";
const HOME_BLOG_LIMIT = 6;
const HOME_BLOG_COUNT = 4;

/* =========================================================
   FETCH SUB-CATEGORY (informatives / listicles)

   Tiny cached request:
   - depth=0
   - id only
   - cached per slug
========================================================= */

const getSubCategory = cache(
  async (slug: string): Promise<Category | null> => {
    try {
      // One shared /categories request for all home sections
      return await getCategoryBySlug(slug);
    } catch (error) {
      console.error(
        `Home section category fetch error (${slug}):`,
        error,
      );

      return null;
    }
  },
);

/* =========================================================
   FETCH LATEST POSTS FOR THE SUB-CATEGORY

   Only request fields actually used by this component.
========================================================= */

const getSectionPosts = cache(
  async (slug: string, homeTag: string): Promise<Post[]> => {
    try {
      const category = await getSubCategory(slug);

      if (!category?.id) {
        console.error(
          `Home section: category "${slug}" not found.`,
        );

        return [];
      }

      const postsData =
        await payloadFetch<PostsResponse>(
          `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
            String(category.id),
          )}&sort=-updatedAt&limit=${HOME_BLOG_LIMIT}&depth=1&select[id]=true&select[title]=true&select[slug]=true&select[excerpt]=true&select[publishedAt]=true&select[updatedAt]=true&select[author]=true&select[category]=true&select[featuredImage]=true`,
          {
            next: {
              revalidate: 604800,
              tags: [
                homeTag,
                `category:${BLOGS_CATEGORY_SLUG}`,
                `category:${slug}`,
              ],
            },
          },
        );

      if (!Array.isArray(postsData?.docs)) {
        return [];
      }

      return postsData.docs
        .filter((post) => {
          if (
            !post?.id ||
            !post?.title?.trim() ||
            !post?.slug?.trim() ||
            !post?.publishedAt
          ) {
            return false;
          }

          const title = post.title.trim().toLowerCase();

          if (
            title.includes("untitled wordpress") ||
            title.includes("dummy") ||
            title.includes("test post") ||
            title.includes("sample post") ||
            title.includes("lorem ipsum")
          ) {
            return false;
          }

          return true;
        })
        .slice(0, HOME_BLOG_COUNT);
    } catch (error) {
      console.error(
        `Home section posts fetch error (${slug}):`,
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
  featuredImage: Post["featuredImage"],
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

    const cmsUrl =
      process.env.PAYLOAD_API_URL ||
      "http://localhost:3001/api";

    return `${cmsUrl.replace(/\/api$/, "")}${imageUrl}`;
  }

  if (typeof featuredImage === "number") {
    const cmsUrl =
      process.env.PAYLOAD_API_URL ||
      "http://localhost:3001/api";

    return `${cmsUrl.replace(/\/api$/, "")}/api/media/${featuredImage}`;
  }

  return null;
}

/* =========================================================
   DATE
========================================================= */

function getDisplayDate(post: Post): {
  label: "Published" | "Updated";
  date: string;
  dateTime: string;
} | null {
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

  const rawDate = isUpdated
    ? post.updatedAt
    : post.publishedAt;

  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    label: isUpdated ? "Updated" : "Published",
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsedDate),
    dateTime: parsedDate.toISOString(),
  };
}

/* =========================================================
   EXCERPT
========================================================= */

function getExcerpt(excerpt?: string | null): string {
  if (!excerpt) {
    return "";
  }

  const clean = excerpt
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "";
  }

  if (clean.length <= 115) {
    return clean;
  }

  return `${clean.slice(0, 115)}…`;
}

/* =========================================================
   COMPONENT

   Reusable for both home sections:
     <LearnAboutAI />                                  -> informatives (default)
     <LearnAboutAI slug="listicles" heading="..." ... />
========================================================= */

type LearnAboutAIProps = {
  slug?: string;
  heading?: string;
  viewAllHref?: string;
  homeTag?: string;
};

export default async function LearnAboutAI({
  slug = "informatives",
  heading = "AI informative blogs",
  viewAllHref = "/blogs/informatives",
  homeTag = "home:informatives",
}: LearnAboutAIProps = {}) {
  const posts = await getSectionPosts(slug, homeTag);

  if (!posts.length) {
    return null;
  }

  const cards = posts
    .filter((post) => post?.id && post?.slug && post?.title)
    .slice(0, HOME_BLOG_COUNT)
    .map((post) => {
      const category =
        typeof post.category === "object" &&
          post.category !== null
          ? post.category
          : null;

      const author =
        typeof post.author === "object" &&
          post.author !== null
          ? post.author
          : null;

      const featuredImage =
        typeof post.featuredImage === "object" &&
          post.featuredImage !== null
          ? post.featuredImage
          : null;

      return {
        id: String(post.id),
        title: post.title,
        slug: post.slug,
        date: getDisplayDate(post),
        author: author?.name || "AlloyPress Team",
        image: getImageUrl(post.featuredImage),
        imageAlt: featuredImage?.alt || post.title,
        category: category?.name || heading,
        categorySlug: category?.slug || BLOGS_CATEGORY_SLUG,
      };
    });

  if (!cards.length) {
    return null;
  }

  return (
    <section
      className="learn-ai-section"
      aria-labelledby={`learn-ai-title-${slug}`}
    >
      <div className="container">
        <div className="learn-ai-header">
          <div className="learn-ai-heading">
            <span
              className="learn-ai-heading-line"
              aria-hidden="true"
            />

            <h2 id={`learn-ai-title-${slug}`}>{heading}</h2>
          </div>

          <Link
            href={viewAllHref}
            className="learn-ai-view-all"
          >
            View all
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="learn-ai-track">
          {cards.map((card) => (
            <article
              key={card.id}
              className="learn-ai-card"
            >
              <Link
                href={postHref(card.categorySlug, card.slug)}
                className="learn-ai-card-link"
                aria-label={`Read ${card.title}`}
              >
                <div className="learn-ai-image">
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.imageAlt}
                      fill
                      className="learn-ai-image-inner"
                      sizes="(max-width: 700px) 100vw, 50vw"
                    />
                  ) : (
                    <div
                      className="learn-ai-image-fallback"
                      aria-hidden="true"
                    >
                      <span>AI</span>
                    </div>
                  )}

                  <div
                    className="learn-ai-image-overlay"
                    aria-hidden="true"
                  />
                </div>

                <div className="learn-ai-card-content">
                  <div className="learn-ai-meta">
                    <span>{card.category}</span>

                    {card.date && (
                      <>
                        <i aria-hidden="true" />
                        <time dateTime={card.date.dateTime}>
                          {card.date.label} {card.date.date}
                        </time>
                      </>
                    )}
                  </div>

                  <h3>{card.title}</h3>

                  <div className="learn-ai-card-footer">
                    <span>{card.author}</span>

                    <span
                      className="learn-ai-card-arrow"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}