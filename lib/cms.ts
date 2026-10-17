// ============================================================
// AlloyPress — CMS Data Layer
// ============================================================

import {
  payloadFetch,
  PAYLOAD_API_URL,
} from "@/lib/payload";

// ============================================================
// MEDIA
// ============================================================

export type Media = {
  id?: string | number;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  mimeType?: string;
};

// ============================================================
// AUTHOR
// ============================================================

export type Author = {
  id?: string | number;
  name?: string;
  email?: string;
};

// ============================================================
// CATEGORY
// ============================================================

export type Category = {
  id?: string | number;
  name?: string;
  title?: string;
  slug?: string;
};

// ============================================================
// TAG
// ============================================================

export type Tag = {
  id?: string | number;
  name?: string;
  title?: string;
  slug?: string;
};

// ============================================================
// PAYLOAD / LEXICAL RICH TEXT TYPES
// ============================================================

export type RichTextNode = {
  type?: string;
  tag?: string;

  /**
   * Lexical text formatting flags:
   *
   * 1  = bold
   * 2  = italic
   * 4  = strikethrough
   * 8  = underline
   * 16 = inline code
   */
  format?: number | string;

  text?: string;

  /**
   * Used by lists.
   */
  listType?: string;

  /**
   * Used by links and custom nodes.
   */
  url?: string;

  fields?: Record<string, unknown>;

  children?: RichTextNode[];
};

export type RichTextRoot = {
  type?: string;
  format?: string;
  indent?: number;
  version?: number;
  children: RichTextNode[];
};

export type RichTextContent = {
  root: RichTextRoot;
};

// ============================================================
// POST TYPE
// ============================================================

export type Post = {
  id: string;

  title?: string;
  slug?: string;
  excerpt?: string;

  publishedAt?: string;
  updatedAt?: string;

  // ----------------------------------------------------------
  // Author
  // ----------------------------------------------------------

  author?: Author;

  // ----------------------------------------------------------
  // Featured Image
  // ----------------------------------------------------------

  featuredImage?: Media;

  // ----------------------------------------------------------
  // Main Lexical Content
  // ----------------------------------------------------------

  content?: RichTextContent;

  // ----------------------------------------------------------
  // Category
  // ----------------------------------------------------------

  category?: Category;

  // ----------------------------------------------------------
  // Tags
  // ----------------------------------------------------------

  tags?: Tag[];

  // ----------------------------------------------------------
  // Image Position
  // ----------------------------------------------------------

  imagePosition?:
    | "left"
    | "right"
    | "full";

  // ----------------------------------------------------------
  // Workflow
  // ----------------------------------------------------------

  workflowStatus?:
    | "draft"
    | "review"
    | "published";

  // Payload built-in status
  _status?: "draft" | "published";

  // ----------------------------------------------------------
  // SEO / Sitemap
  // ----------------------------------------------------------

  cornerstone?: boolean;
  includeInSitemap?: boolean;

  // ----------------------------------------------------------
  // Redirect
  // ----------------------------------------------------------

  redirectFrom?: string;

  // ----------------------------------------------------------
  // Migration / Internal
  // ----------------------------------------------------------

  legacy?: {
    wordpressId?: number | string;
    wordpressModifiedAt?: string;
  };
};

// ============================================================
// PAYLOAD API RESPONSE
// ============================================================

export type PayloadResponse<T> = {
  docs?: T[];

  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
  pagingCounter?: number;

  hasPrevPage?: boolean;
  hasNextPage?: boolean;

  prevPage?: number | null;
  nextPage?: number | null;
};

// ============================================================
// CMS URL
// ============================================================

export { PAYLOAD_API_URL };

// ============================================================
// GET POST BY SLUG
// ============================================================

export async function getPostBySlug(
  slug: string,
): Promise<Post | null> {
  const params = new URLSearchParams();

  params.set(
    "where[slug][equals]",
    slug,
  );

  params.set(
    "where[_status][equals]",
    "published",
  );

  params.set("limit", "1");

  params.set("depth", "1");

  const data =
    await payloadFetch<PayloadResponse<Post>>(
      `/posts?${params.toString()}`,
      {
        next: {
          revalidate: 604800,
          tags: [`post:${slug}`],
        },
      },
    );

  return data?.docs?.[0] ?? null;
}

// ============================================================
// GET POST BY ID
// ============================================================

export async function getPostById(
  id: string,
): Promise<Post | null> {
  const params = new URLSearchParams();

  params.set(
    "depth",
    "1",
  );

  const data =
    await payloadFetch<Post>(
      `/posts/${encodeURIComponent(id)}?${params.toString()}`,
      {
        next: {
          revalidate: 604800,
          tags: [`post:id:${id}`],
        },
      },
    );

  return data ?? null;
}