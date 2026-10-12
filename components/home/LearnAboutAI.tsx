import Image from "next/image";
import Link from "next/link";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

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
  author?: Author | number | string | null;
  category?: Category | number | string | null;
  featuredImage?: Media | number | string | null;
};

type CategoryResponse = {
  docs?: Category[];
};

type PostsResponse = {
  docs?: Post[];
};

const BLOGS_CATEGORY_SLUG = "blogs";
const HOME_BLOG_LIMIT = 6;
const HOME_BLOG_COUNT = 4;

/* =========================================================
   FETCH BLOG CATEGORY

   Tiny cached request:
   - depth=0
   - id only
   - ISR: 5 minutes
========================================================= */

const getBlogsCategory = cache(
  async (): Promise<Category | null> => {
    try {
      const categoryData =
        await payloadFetch<CategoryResponse>(
          `/categories?where[slug][equals]=${BLOGS_CATEGORY_SLUG}&limit=1&depth=0&select[id]=true`,
          {
            next: {
              revalidate: 86400,
              tags: [
                `category:${BLOGS_CATEGORY_SLUG}`,
                "categories",
              ],
            },
          },
        );

      return categoryData?.docs?.[0] ?? null;
    } catch (error) {
      console.error(
        "AI Informative Blogs category fetch error:",
        error,
      );

      return null;
    }
  },
);

/* =========================================================
   FETCH LATEST BLOGS

   Only request fields actually used by this component.
========================================================= */

const getLearnPosts = cache(
  async (): Promise<Post[]> => {
    try {
      const blogsCategory =
        await getBlogsCategory();

      if (!blogsCategory?.id) {
        console.error(
          "AI Informative Blogs: Blogs category not found.",
        );

        return [];
      }

      const postsData =
        await payloadFetch<PostsResponse>(
          `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
            String(blogsCategory.id),
          )}&sort=-publishedAt&limit=${HOME_BLOG_LIMIT}&depth=1&select[id]=true&select[title]=true&select[slug]=true&select[excerpt]=true&select[publishedAt]=true&select[author]=true&select[category]=true&select[featuredImage]=true`,
          {
            next: {
              revalidate: 86400,
              tags: [
                "home:latest-blogs",
                "posts",
                `category:${BLOGS_CATEGORY_SLUG}`,
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

          const title = post.title
            .trim()
            .toLowerCase();

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
        "AI Informative Blogs fetch error:",
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
   EXCERPT
========================================================= */

function getExcerpt(
  excerpt?: string | null,
): string {
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
========================================================= */

export default async function LearnAboutAI() {
  const posts = await getLearnPosts();

  if (!posts.length) {
    return null;
  }

  const cards = posts
    .filter(
      (post) =>
        post?.id &&
        post?.slug &&
        post?.title,
    )
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
        excerpt: getExcerpt(post.excerpt || "")
          .replace(/^TL;DR\s*:\s*/i, "")
          .trim(),
        date: formatDate(post.publishedAt),
        author:
          author?.name || "AlloyPress Team",
        image: getImageUrl(
          post.featuredImage,
        ),
        imageAlt:
          featuredImage?.alt ||
          post.title,
        category:
          category?.name || "Learn",
        categorySlug:
          category?.slug || BLOGS_CATEGORY_SLUG,
      };
    });

  if (!cards.length) {
    return null;
  }

  return (
    <section
      className="learn-ai-section"
      aria-labelledby="learn-ai-title"
    >
      <div className="container">
        <div className="learn-ai-header">
          <div className="learn-ai-heading">
            <span
              className="learn-ai-heading-line"
              aria-hidden="true"
            />

            <h2 id="learn-ai-title">
              AI informative blogs
            </h2>
          </div>

          <Link
            href="/blogs"
            className="learn-ai-view-all"
          >
            View all
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="learn-ai-track">
          {cards.map((card) => (
            <article
              key={card.id}
              className="learn-ai-card"
            >
              <Link
                href={`/${card.categorySlug}/${card.slug}`}
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
                    <span>
                      {card.category}
                    </span>

                    {card.date && (
                      <>
                        <i aria-hidden="true" />

                        <time>
                          {card.date}
                        </time>
                      </>
                    )}
                  </div>

                  <h3>{card.title}</h3>

                  {card.excerpt && (
                    <p>{card.excerpt}</p>
                  )}

                  <div className="learn-ai-card-footer">
                    <span>
                      {card.author}
                    </span>

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