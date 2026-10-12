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
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  publishedAt?: string | null;
  featuredImage?: Media | number | null;
};

type PayloadResponse = {
  docs?: Post[];
};

type CategoryResponse = {
  docs?: Category[];
};

const ALTERNATIVES_CATEGORY_SLUG = "alternatives";

const HOME_RESOURCE_LIMIT = 6;
const HOME_RESOURCE_COUNT = 4;

const RESOURCE_DEFINITIONS = [
  {
    number: "01",
    category: "ALTERNATIVES",
    icon: "◈",
  },
  {
    number: "02",
    category: "ALTERNATIVES",
    icon: "◉",
  },
  {
    number: "03",
    category: "ALTERNATIVES",
    icon: "⌁",
  },
  {
    number: "04",
    category: "ALTERNATIVES",
    icon: "✦",
  },
];

/* =========================================================
   GET ALTERNATIVES CATEGORY

   Small cached request:
   - depth=0
   - ID only
   - ISR: 5 minutes
========================================================= */

const getAlternativesCategory = cache(
  async (): Promise<Category | null> => {
    try {
      const categoryData =
        await payloadFetch<CategoryResponse>(
          `/categories?where[slug][equals]=${ALTERNATIVES_CATEGORY_SLUG}&limit=1&depth=0&select[id]=true`,
          {
            next: {
              revalidate: 86400,
              tags: [
                `category:${ALTERNATIVES_CATEGORY_SLUG}`,
                "categories",
              ],
            },
          },
        );

      return categoryData?.docs?.[0] ?? null;
    } catch (error) {
      console.error(
        "Popular Resources category fetch error:",
        error,
      );

      return null;
    }
  },
);

/* =========================================================
   GET LATEST ALTERNATIVES POSTS

   Only request fields actually used by this component.

   Required:
   - id
   - title
   - slug
   - featuredImage

   depth=1 is intentionally kept because the component
   needs the populated media URL/alt information.
========================================================= */

const getLatestPosts = cache(
  async (): Promise<Post[]> => {
    try {
      const alternativesCategory =
        await getAlternativesCategory();

      if (!alternativesCategory?.id) {
        console.error(
          "Popular Resources: Alternatives category not found.",
        );

        return [];
      }

      const postsData =
        await payloadFetch<PayloadResponse>(
          `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
            String(alternativesCategory.id),
          )}&sort=-publishedAt&limit=${HOME_RESOURCE_LIMIT}&depth=1&select[id]=true&select[title]=true&select[slug]=true&select[publishedAt]=true&select[featuredImage]=true`,
          {
            next: {
              revalidate: 86400,
              tags: [
                "home:alternatives",
                "posts",
                `category:${ALTERNATIVES_CATEGORY_SLUG}`,
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
        .slice(0, HOME_RESOURCE_COUNT);
    } catch (error) {
      console.error(
        "Popular Resources fetch error:",
        error,
      );

      return [];
    }
  },
);

/* =========================================================
   IMAGE URL
========================================================= */

function getMediaUrl(
  media: Post["featuredImage"],
): string | null {
  if (!media) {
    return null;
  }

  if (
    typeof media === "object" &&
    media !== null &&
    media.url
  ) {
    if (media.url.startsWith("http")) {
      return media.url;
    }

    const cmsUrl =
      process.env.PAYLOAD_API_URL ||
      "http://localhost:3001/api";

    return `${cmsUrl.replace(
      /\/api$/,
      "",
    )}${media.url}`;
  }

  /*
   * A numeric featuredImage means the relationship was not
   * populated. We cannot safely use /api/media/:id directly
   * as an <Image src>, because Payload's media API returns
   * media JSON rather than the actual image binary.
   *
   * Therefore the normal production path is the populated
   * Media object above.
   */
  return null;
}

/* =========================================================
   COMPONENT
========================================================= */

export default async function PopularResources() {
  const posts = await getLatestPosts();

  if (!posts.length) {
    return null;
  }

  const resources = posts
    .slice(0, HOME_RESOURCE_COUNT)
    .map((post, index) => {
      const definition =
        RESOURCE_DEFINITIONS[index];

      return {
        ...definition,
        post,
      };
    });

  if (!resources.length) {
    return null;
  }

  return (
    <section
      className="popular-resources"
      aria-labelledby="popular-resources-title"
    >
      <div className="popular-resources-inner">
        <div className="resources-header">
          <h2 id="popular-resources-title">
            TOP AI tools alternatives
          </h2>

          <Link
            href="/alternatives"
            className="resources-view-all"
          >
            View all

            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="resources-grid">
          {resources.map((resource) => {
            const image = getMediaUrl(
              resource.post.featuredImage,
            );

            return (
              <Link
                key={resource.post.id}
                href={`/alternatives/${resource.post.slug}`}
                className="resource-card"
              >
                {image ? (
                  <div className="resource-image">
                    <Image
                      src={image}
                      alt={
                        typeof resource.post
                          .featuredImage ===
                          "object" &&
                        resource.post.featuredImage !==
                          null
                          ? resource.post
                              .featuredImage?.alt ||
                            resource.post.title ||
                            "Popular AI resource"
                          : resource.post.title ||
                            "Popular AI resource"
                      }
                      fill
                      sizes="(max-width: 620px) 100vw, (max-width: 950px) 50vw, 25vw"
                    />
                  </div>
                ) : null}

                <div className="resource-card-top">
                  <span className="resource-number">
                    {resource.number}
                  </span>

                  <span className="resource-icon">
                    {resource.icon}
                  </span>
                </div>

                <div className="resource-content">
                  <h3>
                    {resource.post.title}
                  </h3>
                </div>

                <div className="resource-footer">
                  <span>
                    {resource.category}
                  </span>

                  <b>
                    Read now{" "}
                    <span aria-hidden="true">
                      →
                    </span>
                  </b>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}