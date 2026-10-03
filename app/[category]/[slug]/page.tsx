import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { cache } from "react";

import BlogLivePreview from "@/components/blogs/BlogLivePreview";

import BlogPostView from "@/components/blogs/BlogPostView";

import { payloadFetch } from "@/lib/payload";

import type {
  Post,
  PayloadResponse,
} from "@/lib/cms";

import { buildArticleMetadata } from "@/lib/seo/metadata";
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createWebPageSchema,
} from "@/lib/seo/schema";
import { CATEGORY_PATHS } from "@/lib/seo/constants";
import { collectFaqs } from "@/lib/faq-from-content";

// ============================================================
// SITE
// ============================================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://alloypress.com";

// ============================================================
// ALLOWED CATEGORIES
// ============================================================

const ALLOWED_CATEGORIES = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

const CATEGORY_LABELS: Record<
  string,
  string
> = {
  blogs: "Blogs",
  reviews: "Reviews",
  news: "News",
  alternatives: "Alternatives",
  comparisons: "Comparisons",
};

// ============================================================
// PARAMS
// ============================================================

type Params = Promise<{
  category: string;
  slug: string;
}>;

type SearchParams = Promise<{
  preview?: string;
}>;

// ============================================================
// POST META TYPES
// ============================================================

type RobotsMeta = {
  index?: boolean;
  follow?: boolean;
  noArchive?: boolean;
  noImageIndex?: boolean;
  noSnippet?: boolean;
};

type OpenGraphMeta = {
  title?: string;
  description?: string;
  image?: unknown;
};

type TwitterMeta = {
  title?: string;
  description?: string;
};

type PostMeta = {
  title?: string;
  description?: string;
  canonicalURL?: string;

  robots?: RobotsMeta;

  image?: unknown;

  openGraph?: OpenGraphMeta;

  twitter?: TwitterMeta;
};

type PostWithMeta = Post & {
  meta?: PostMeta;
};

// ============================================================
// MEDIA TYPES
// ============================================================

type MediaDocument = {
  id: number | string;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
};

// ============================================================
// MEDIA HELPERS
// ============================================================

function mediaUrl(
  value: unknown,
): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "url" in value
  ) {
    const url = (
      value as {
        url?: unknown;
      }
    ).url;

    return typeof url === "string"
      ? url
      : null;
  }

  return null;
}

function imageUrl(
  value: unknown,
): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "url" in value
  ) {
    const url = (
      value as {
        url?: unknown;
      }
    ).url;

    return typeof url === "string"
      ? url
      : null;
  }

  if (typeof value === "number") {
    const cmsUrl =
      process.env.PAYLOAD_API_URL ||
      "http://localhost:3000/api";

    return `${cmsUrl.replace(
      /\/api$/,
      "",
    )}/api/media/${value}`;
  }

  return null;
}

// ============================================================
// COLLECT LEXICAL MEDIA IDS
// ============================================================

function collectContentMediaIds(
  content: unknown,
): number[] {
  if (
    typeof content !== "object" ||
    content === null
  ) {
    return [];
  }

  const root = (
    content as {
      root?: {
        children?: unknown[];
      };
    }
  ).root;

  if (
    !root ||
    !Array.isArray(root.children)
  ) {
    return [];
  }

  const ids = new Set<number>();

  function collect(
    node: unknown,
  ): void {
    if (
      typeof node !== "object" ||
      node === null
    ) {
      return;
    }

    const current = node as {
      type?: unknown;
      value?: unknown;
      fields?: Record<
        string,
        unknown
      >;
      children?: unknown[];
    };

    // --------------------------------------------------------
    // Lexical upload node
    // --------------------------------------------------------

    if (
      current.type === "upload" &&
      typeof current.value === "number"
    ) {
      ids.add(current.value);
    }

    // --------------------------------------------------------
    // Custom media blocks
    // --------------------------------------------------------

    if (current.type === "block") {
      const fields =
        current.fields || {};

      if (
        fields.blockType ===
        "videoFile" &&
        typeof fields.video === "number"
      ) {
        ids.add(fields.video);
      }

      if (
        fields.blockType ===
        "audio" &&
        typeof fields.audio === "number"
      ) {
        ids.add(fields.audio);
      }
    }

    // --------------------------------------------------------
    // Nested children
    // --------------------------------------------------------

    if (
      Array.isArray(
        current.children,
      )
    ) {
      current.children.forEach(
        collect,
      );
    }
  }

  root.children.forEach(collect);

  return Array.from(ids);
}

// ============================================================
// BATCH MEDIA FETCH
// ============================================================
//
// IMPORTANT:
// Instead of:
//
//   /media/10
//   /media/20
//   /media/30
//   /media/40
//
// we make ONE Payload request:
//
//   /media?where[id][in]=10,20,30,40
//
// This removes the N+1 request pattern.
// ============================================================

const getContentMedia = cache(
  async (
    ids: number[],
  ): Promise<
    Map<number, MediaDocument>
  > => {
    if (!ids.length) {
      return new Map();
    }

    try {
      const params =
        new URLSearchParams();

      params.set(
        "where[id][in]",
        ids.join(","),
      );

      params.set(
        "limit",
        String(ids.length),
      );

      params.set(
        "depth",
        "0",
      );

      params.set(
        "select[id]",
        "true",
      );

      params.set(
        "select[url]",
        "true",
      );

      params.set(
        "select[alt]",
        "true",
      );

      params.set(
        "select[filename]",
        "true",
      );

      params.set(
        "select[width]",
        "true",
      );

      params.set(
        "select[height]",
        "true",
      );

      params.set(
        "select[mimeType]",
        "true",
      );

      const data =
        await payloadFetch<
          PayloadResponse<MediaDocument>
        >(
          `/media?${params.toString()}`,
          {
            next: {
              revalidate: 300,
              tags: [
                "media",
                ...ids.map(
                  (id) =>
                    `media:${id}`,
                ),
              ],
            },
          },
        );

      const map =
        new Map<
          number,
          MediaDocument
        >();

      for (
        const media of
        data?.docs ?? []
      ) {
        const numericId =
          Number(media.id);

        if (
          Number.isFinite(
            numericId,
          )
        ) {
          map.set(
            numericId,
            media,
          );
        }
      }

      return map;
    } catch (error) {
      console.error(
        "[Article] Failed to hydrate content media:",
        error,
      );

      return new Map();
    }
  },
);

// ============================================================
// REPLACE LEXICAL MEDIA
// ============================================================

function replaceContentMedia(
  content: unknown,
  mediaMap: Map<
    number,
    MediaDocument
  >,
): unknown {
  if (
    typeof content !== "object" ||
    content === null
  ) {
    return content;
  }

  const root = (
    content as {
      root?: {
        children?: unknown[];
      };
    }
  ).root;

  if (
    !root ||
    !Array.isArray(root.children)
  ) {
    return content;
  }

  function replace(
    node: unknown,
  ): unknown {
    if (
      typeof node !== "object" ||
      node === null
    ) {
      return node;
    }

    const current =
      node as Record<
        string,
        unknown
      >;

    const next: Record<
      string,
      unknown
    > = {
      ...current,
    };

    // --------------------------------------------------------
    // Upload node
    // --------------------------------------------------------

    if (
      next.type === "upload" &&
      typeof next.value === "number"
    ) {
      next.value =
        mediaMap.get(
          next.value,
        ) ?? next.value;
    }

    // --------------------------------------------------------
    // Custom block
    // --------------------------------------------------------

    if (next.type === "block") {
      const fields =
        typeof next.fields ===
          "object" &&
          next.fields !== null
          ? {
            ...(
              next.fields as Record<
                string,
                unknown
              >
            ),
          }
          : {};

      if (
        fields.blockType ===
        "videoFile" &&
        typeof fields.video ===
        "number"
      ) {
        fields.video =
          mediaMap.get(
            fields.video,
          ) ?? fields.video;
      }

      if (
        fields.blockType ===
        "audio" &&
        typeof fields.audio ===
        "number"
      ) {
        fields.audio =
          mediaMap.get(
            fields.audio,
          ) ?? fields.audio;
      }

      next.fields = fields;
    }

    // --------------------------------------------------------
    // Children
    // --------------------------------------------------------

    if (
      Array.isArray(
        next.children,
      )
    ) {
      next.children =
        next.children.map(
          replace,
        );
    }

    return next;
  }

  return {
    ...(content as Record<
      string,
      unknown
    >),

    root: {
      ...root,

      children:
        root.children.map(
          replace,
        ),
    },
  };
}

// ============================================================
// HYDRATE NESTED LEXICAL MEDIA
// ============================================================

const hydrateContentMedia = cache(
  async (
    content: unknown,
  ): Promise<unknown> => {
    const ids =
      collectContentMediaIds(
        content,
      );

    if (!ids.length) {
      return content;
    }

    const mediaMap =
      await getContentMedia(ids);

    if (!mediaMap.size) {
      return content;
    }

    return replaceContentMedia(
      content,
      mediaMap,
    );
  },
);

// ============================================================
// GET POST
// ============================================================
//
// IMPORTANT:
// cache() prevents generateMetadata() and the page itself from
// independently fetching the same article during one render.
//
// depth changed:
//   5 -> 1
//
// select added:
// Only fields required by metadata, BlogPostView and article
// rendering are requested.
//
// workflowStatus is used because that is the actual publishing
// field in the current AlloyPress Payload data.
// ============================================================

const getPost = cache(
  async (
    category: string,
    slug: string,
  ): Promise<PostWithMeta | null> => {
    // ----------------------------------------------------------
    // Validate category
    // ----------------------------------------------------------

    if (
      !ALLOWED_CATEGORIES.has(
        category,
      )
    ) {
      return null;
    }

    const params =
      new URLSearchParams();

    params.set(
      "where[slug][equals]",
      slug,
    );

    params.set(
      "where[workflowStatus][equals]",
      "published",
    );

    params.set(
      "limit",
      "1",
    );

    // ----------------------------------------------------------
    // IMPORTANT NETWORK OPTIMIZATION
    //
    // depth=5 was causing Payload to recursively populate
    // relationships throughout the article.
    //
    // depth=1 is enough for:
    // - category
    // - featuredImage
    // - meta media
    //
    // Nested Lexical media is hydrated separately and in batch.
    // ----------------------------------------------------------

    params.set(
      "depth",
      "1",
    );

    // ----------------------------------------------------------
    // SELECT ONLY REQUIRED FIELDS
    // ----------------------------------------------------------

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
      "select[content]",
      "true",
    );

    params.set(
      "select[publishedAt]",
      "true",
    );

    params.set(
      "select[updatedAt]",
      "true",
    );

    params.set(
      "select[category]",
      "true",
    );

    params.set(
      "select[featuredImage]",
      "true",
    );

    params.set(
      "select[meta]",
      "true",
    );

    const data =
      await payloadFetch<
        PayloadResponse<PostWithMeta>
      >(
        `/posts?${params.toString()}`,
        {
          next: {
            revalidate: 300,
            tags: [
              `post:${category}:${slug}`,
              `post:${slug}`,
              "posts",
            ],
          },
        },
      );

    const post =
      data?.docs?.[0] ?? null;

    if (!post) {
      return null;
    }

    // ----------------------------------------------------------
    // VERIFY CATEGORY
    // ----------------------------------------------------------

    const postCategory =
      typeof post.category ===
        "object"
        ? post.category?.slug
        : null;

    if (
      postCategory !== category
    ) {
      return null;
    }

    // ----------------------------------------------------------
    // HYDRATE ONLY NESTED CONTENT MEDIA
    // ----------------------------------------------------------

    const hydratedContent =
      await hydrateContentMedia(
        post.content,
      );

    return {
      ...post,

      content:
        hydratedContent as Post["content"],
    };
  },
);

// ============================================================
// GET RELATED POSTS
// ============================================================
//
// Related cards do NOT need:
// - full content
// - deep relationships
// - SEO metadata
// - large nested media objects
//
// So keep this response intentionally small.
// ============================================================

const getRelatedPosts = cache(
  async (
    categoryId: string | number,
    currentPostId:
      | string
      | number,
    category: string,
  ): Promise<Post[]> => {
    const params =
      new URLSearchParams();

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

    // Only need a small safety buffer.
    params.set(
      "limit",
      "5",
    );

    // Related cards need populated category/media,
    // but don't need deep recursive population.
    params.set(
      "depth",
      "1",
    );

    // ----------------------------------------------------------
    // SELECT ONLY RELATED-CARD FIELDS
    // ----------------------------------------------------------

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
      "select[featuredImage]",
      "true",
    );

    params.set(
      "select[author]",
      "true",
    );

    params.set(
      "select[category]",
      "true",
    );

    const data =
      await payloadFetch<
        PayloadResponse<Post>
      >(
        `/posts?${params.toString()}`,
        {
          next: {
            revalidate: 300,
            tags: [
              `category:${category}`,
              "posts",
            ],
          },
        },
      );

    return (data?.docs ?? [])
      .filter(
        (item) =>
          String(item.id) !==
          String(
            currentPostId,
          ),
      )
      .filter(
        (item) =>
          !/^Untitled WordPress Post/i.test(
            item.title || "",
          ),
      )
      .slice(0, 3);
  },
);

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const {
    category,
    slug,
  } = await params;

  const post =
    await getPost(
      category,
      slug,
    );

  if (!post) {
    return {
      title:
        "Article Not Found | AlloyPress",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const meta =
    post.meta ?? {};

  return buildArticleMetadata({
    title: meta.title || post.title,
    description: meta.description || post.excerpt,

    canonicalPath: `/${category}/${post.slug}`,
    canonicalUrl: meta.canonicalURL,

    imageUrl:
      mediaUrl(meta.image) ||
      mediaUrl(post.featuredImage),
    imageAlt: post.title,

    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,

    robots: meta.robots,

    openGraph: {
      title: meta.openGraph?.title,
      description: meta.openGraph?.description,
      imageUrl: mediaUrl(meta.openGraph?.image),
    },

    twitter: {
      title: meta.twitter?.title,
      description: meta.twitter?.description,
    },
  });
}

// ============================================================
// PAGE
// ============================================================

export default async function CategoryPostPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const {
    category,
    slug,
  } = await params;

  const {
    preview,
  } = await searchParams;

  // ----------------------------------------------------------
  // LIVE PREVIEW
  // ----------------------------------------------------------

  if (preview === "1") {
    const previewSeed = {
      id: "preview",
      title: "",
      slug,
      excerpt: "",
      content: null,

      category: {
        id: "preview-category",
        slug: category,
        name:
          CATEGORY_LABELS[category] ||
          category,
      },

      featuredImage: null,
      publishedAt: null,
      updatedAt: null,
      legacy: {},
      tags: [],
      author: null,
    } as unknown as Post;

    return (
      <BlogLivePreview
        initialData={previewSeed}
        related={[]}
        slug={slug}
      />
    );
  }

  const post = await getPost(
    category,
    slug,
  );

  if (!post) {
    notFound();
  }

  // ==========================================================
  // CATEGORY
  // ==========================================================

  const categoryId =
    typeof post.category ===
      "object"
      ? post.category?.id
      : post.category;

  // ==========================================================
  // RELATED POSTS
  // ==========================================================

  const related = categoryId
    ? await getRelatedPosts(
      categoryId,
      post.id,
      category,
    )
    : [];

  // ==========================================================
  // ARTICLE IMAGE
  // ==========================================================

  const articleImage =
    imageUrl(
      post.featuredImage,
    );

  // ==========================================================
  // CATEGORY LABEL
  // ==========================================================

  const categoryLabel =
    CATEGORY_LABELS[
    category
    ] || category;

  // ==========================================================
  // JSON-LD
  // ==========================================================

  function getReviewedSoftwareName(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .replace(/\bAi\b/g, "AI");
  }

  const reviewedSoftwareName =
  getReviewedSoftwareName(post.slug || slug);

  const articleUrl = `${SITE_URL}/${category}/${post.slug}`;

const categoryPath =
  CATEGORY_PATHS[category as keyof typeof CATEGORY_PATHS] ||
  `/${category}`;

const faqs = collectFaqs(post.content);

const breadcrumb = createBreadcrumbSchema(
  [
    { name: "Home", url: SITE_URL },
    { name: categoryLabel, url: `${SITE_URL}${categoryPath}` },
    { name: post.title || "", url: articleUrl },
  ],
  articleUrl,
);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    createWebPageSchema({
      url: articleUrl,
      name: post.title || "",
      description: post.meta?.description || post.excerpt,
      image: articleImage,
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt || post.publishedAt,
      hasBreadcrumb: Boolean(breadcrumb),
    }),
    createArticleSchema({
      url: articleUrl,
      title: post.title || "",
      description: post.meta?.description || post.excerpt,
      image: articleImage,
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt || post.publishedAt,
      category: categoryLabel,
      authorName: post.author?.name,
    }),
    breadcrumb,
    faqs.length ? createFAQSchema(faqs, articleUrl) : null,
  ].filter(Boolean),
};

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              jsonLd,
            ),
        }}
      />

      <BlogPostView
        post={post}
        related={related}
        articleImage={
          articleImage
        }
        category={category}
        categoryLabel={
          categoryLabel
        }
      />
    </>
  );
}