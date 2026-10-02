import {
  ORGANIZATION_ID,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  WEBSITE_ID,
  LOGO_ID,
  buildSiteUrl,
} from "./constants";

import { absoluteUrl as toAbsolute, cleanText } from "./text";

// ============================================================
// Types
// ============================================================

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type ItemListEntry = {
  name: string;
  url: string;
};

export type WebPageType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "ProfilePage";

export type ArticleSchemaInput = {
  url: string;
  title: string;
  description?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  category?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  wordCount?: number | null;
  type?: "Article" | "BlogPosting";
};

export type PageSchemaInput = {
  url: string;
  name: string;
  description?: string | null;
  type?: WebPageType;
  image?: string | null;

  breadcrumbs?: BreadcrumbItem[];

  article?: Omit<
    ArticleSchemaInput,
    "url" | "title" | "description" | "image"
  > & {
    title?: string;
    description?: string | null;
    image?: string | null;
  };

  faqs?: FAQItem[];

  itemList?: ItemListEntry[];
};

export type SchemaNode = Record<string, unknown>;

export type SchemaGraph = {
  "@context": "https://schema.org";
  "@graph": SchemaNode[];
};

// ============================================================
// Helpers
// ============================================================

/**
 * Convert a relative URL into an absolute canonical URL.
 *
 * Important:
 * `toAbsolute()` expects `string | null`, so undefined must
 * never be passed into it.
 */
const abs = (value?: string | null): string | null => {
  if (!value) return null;

  const absolute = toAbsolute(value, SITE_URL);

  return absolute || null;
};

/**
 * Normalize a URL and always return a usable absolute URL.
 *
 * Used when a schema node cannot exist without a URL.
 */
const requiredUrl = (value: string): string => {
  return abs(value) || SITE_URL;
};

/**
 * Clean text before putting it into JSON-LD.
 */
const safeText = (value?: string | null): string => {
  return cleanText(value) || "";
};

/**
 * Remove empty values from an object.
 */
const compactObject = <T extends Record<string, unknown>>(
  object: T,
): T => {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    }),
  ) as T;
};

// ============================================================
// ORGANIZATION
// ============================================================

/**
 * Organization is a SITE-LEVEL entity.
 *
 * Render this globally from `app/layout.tsx`.
 *
 * DO NOT call this from individual page schemas.
 *
 * Google recommends Organization structured data on the home page
 * or a single page describing the organization; it does not need
 * to be duplicated on every page.
 */
export function createOrganizationSchema(): SchemaNode {
  return compactObject({
    "@type": "Organization",
    "@id": ORGANIZATION_ID,

    name: SITE_NAME,

    url: buildSiteUrl("/"),

    description: SITE_DESCRIPTION,

    logo: {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: SITE_LOGO_URL,
      contentUrl: SITE_LOGO_URL,
    },

    image: {
      "@id": LOGO_ID,
    },

    sameAs:
      SOCIAL_PROFILES.length > 0
        ? [...SOCIAL_PROFILES]
        : undefined,
  });
}

// ============================================================
// WEBSITE
// ============================================================

/**
 * WebSite is rendered ONLY on the home page.
 *
 * DO NOT include this inside createPageSchema().
 *
 * The home page should be the canonical place for the WebSite
 * entity and SearchAction.
 */
export function createWebSiteSchema(): SchemaNode {
  return compactObject({
    "@type": "WebSite",
    "@id": WEBSITE_ID,

    url: buildSiteUrl("/"),

    name: SITE_NAME,

    description: SITE_DESCRIPTION,

    publisher: {
      "@id": ORGANIZATION_ID,
    },

    inLanguage: SITE_LANGUAGE,

    potentialAction: {
      "@type": "SearchAction",

      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },

      "query-input": "required name=search_term_string",
    },
  });
}

// ============================================================
// BREADCRUMB
// ============================================================

export function createBreadcrumbSchema(
  items: BreadcrumbItem[],
  pageUrl?: string,
): SchemaNode | null {
  const listItems = items
    .map((item) => {
      const name = safeText(item.name);
      const url = abs(item.url);

      if (!name || !url) {
        return null;
      }

      return {
        "@type": "ListItem",
        name,
        item: url,
      };
    })
    .filter(
      (item): item is {
        "@type": "ListItem";
        name: string;
        item: string;
      } => item !== null,
    )
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));

  /**
   * Google requires at least two ListItems for BreadcrumbList.
   */
  if (listItems.length < 2) {
    return null;
  }

  const breadcrumb: SchemaNode = {
    "@type": "BreadcrumbList",
    itemListElement: listItems,
  };

  if (pageUrl) {
    const url = abs(pageUrl);

    if (url) {
      breadcrumb["@id"] = `${url}#breadcrumb`;
    }
  }

  return breadcrumb;
}

// ============================================================
// FAQ
// ============================================================

/**
 * FAQPage schema.
 *
 * IMPORTANT:
 * The FAQ questions and answers MUST actually be present on the
 * visible page content.
 *
 * Do not generate FAQ structured data for hidden/unrelated content.
 */
export function createFAQSchema(
  items: FAQItem[],
  pageUrl: string,
): SchemaNode | null {
  const url = requiredUrl(pageUrl);

  const mainEntity = items
    .map((item) => {
      const question = safeText(item.question);
      const answer = safeText(item.answer);

      if (!question || !answer) {
        return null;
      }

      return {
        "@type": "Question",
        name: question,

        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      };
    })
    .filter(
      (
        item,
      ): item is {
        "@type": "Question";
        name: string;
        acceptedAnswer: {
          "@type": "Answer";
          text: string;
        };
      } => item !== null,
    );

  if (mainEntity.length === 0) {
    return null;
  }

  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity,
  };
}

// ============================================================
// ITEM LIST
// ============================================================

export function createItemListSchema(
  entries: ItemListEntry[],
  pageUrl: string,
): SchemaNode | null {
  const url = requiredUrl(pageUrl);

  const itemListElement = entries
    .map((entry) => {
      const name = safeText(entry.name);
      const itemUrl = abs(entry.url);

      if (!name || !itemUrl) {
        return null;
      }

      return {
        "@type": "ListItem",
        name,
        item: itemUrl,
      };
    })
    .filter(
      (
        item,
      ): item is {
        "@type": "ListItem";
        name: string;
        item: string;
      } => item !== null,
    )
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));

  if (itemListElement.length === 0) {
    return null;
  }

  return {
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    numberOfItems: itemListElement.length,
    itemListElement,
  };
}

// ============================================================
// ARTICLE / BLOG POST
// ============================================================

export function createArticleSchema(
  input: ArticleSchemaInput,
): SchemaNode {
  const url = requiredUrl(input.url);

  const title = safeText(input.title) || SITE_NAME;
  const description = safeText(input.description);

  const image = abs(input.image);

  const category = safeText(input.category);

  const authorName = safeText(input.authorName);
  const authorUrl = abs(input.authorUrl);

  const article: SchemaNode = {
    "@type": input.type || "BlogPosting",

    "@id": `${url}#article`,

    url,

    headline: title.slice(0, 110),

    mainEntityOfPage: {
      "@id": `${url}#webpage`,
    },

    isPartOf: {
      "@id": `${url}#webpage`,
    },

    publisher: {
      "@id": ORGANIZATION_ID,
    },

    inLanguage: SITE_LANGUAGE,

    author: authorName
      ? compactObject({
          "@type": "Person",
          name: authorName,
          url: authorUrl || undefined,
        })
      : {
          "@id": ORGANIZATION_ID,
        },
  };

  if (description) {
    article.description = description;
  }

  if (image) {
    article.image = [image];
  }

  if (input.publishedAt) {
    article.datePublished = input.publishedAt;
  }

  if (input.modifiedAt) {
    article.dateModified = input.modifiedAt;
  }

  if (category) {
    article.articleSection = category;
  }

  if (
    typeof input.wordCount === "number" &&
    Number.isFinite(input.wordCount)
  ) {
    article.wordCount = input.wordCount;
  }

  return article;
}

// ============================================================
// WEB PAGE
// ============================================================

export function createWebPageSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  type?: WebPageType;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  hasBreadcrumb?: boolean;
}): SchemaNode {
  const url = requiredUrl(input.url);

  const description = safeText(input.description);

  const image = abs(input.image);

  return compactObject({
    "@type": input.type || "WebPage",

    "@id": `${url}#webpage`,

    url,

    name: safeText(input.name) || SITE_NAME,

    description: description || undefined,

    isPartOf: {
      "@id": WEBSITE_ID,
    },

    about: {
      "@id": ORGANIZATION_ID,
    },

    publisher: {
      "@id": ORGANIZATION_ID,
    },

    inLanguage: SITE_LANGUAGE,

    primaryImageOfPage: image
      ? {
          "@type": "ImageObject",
          url: image,
        }
      : undefined,

    datePublished: input.publishedAt || undefined,

    dateModified: input.modifiedAt || undefined,

    breadcrumb: input.hasBreadcrumb
      ? {
          "@id": `${url}#breadcrumb`,
        }
      : undefined,
  });
}

// ============================================================
// COLLECTION PAGE
// ============================================================

export function createCollectionPageSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  itemList?: ItemListEntry[];
}): SchemaGraph {
  return createPageSchema({
    url: input.url,
    name: input.name,
    description: input.description,
    type: "CollectionPage",
    image: input.image,
    breadcrumbs: input.breadcrumbs,
    itemList: input.itemList,
  });
}

// ============================================================
// GENERIC PAGE GRAPH
// ============================================================

/**
 * IMPORTANT ARCHITECTURE
 *
 * This function DOES NOT include:
 *
 * - Organization
 * - WebSite
 *
 * Those are site-level entities and are rendered separately.
 *
 * This function only creates entities belonging to THIS PAGE:
 *
 * - WebPage / CollectionPage
 * - BreadcrumbList
 * - BlogPosting / Article
 * - FAQPage
 * - ItemList
 */
export function createPageSchema(
  input: PageSchemaInput,
): SchemaGraph {
  const url = requiredUrl(input.url);

  const breadcrumb = input.breadcrumbs
    ? createBreadcrumbSchema(input.breadcrumbs, url)
    : null;

  const webPage = createWebPageSchema({
    url,

    name: input.name,

    description: input.description,

    type: input.type,

    image: input.image,

    publishedAt: input.article?.publishedAt,

    modifiedAt: input.article?.modifiedAt,

    hasBreadcrumb: Boolean(breadcrumb),
  });

  const article = input.article
    ? createArticleSchema({
        ...input.article,

        url,

        title: input.article.title || input.name,

        description:
          input.article.description ?? input.description,

        image:
          input.article.image ?? input.image,
      })
    : null;

  const faq =
    input.faqs && input.faqs.length > 0
      ? createFAQSchema(input.faqs, url)
      : null;

  const itemList =
    input.itemList && input.itemList.length > 0
      ? createItemListSchema(input.itemList, url)
      : null;

  /**
   * Collection/List pages should point their main entity
   * to ItemList when one exists.
   */
  if (itemList) {
    webPage.mainEntity = {
      "@id": `${url}#itemlist`,
    };
  }

  /**
   * Never put null values into JSON-LD.
   */
  const graph = [
    webPage,
    breadcrumb,
    article,
    faq,
    itemList,
  ].filter(
    (node): node is SchemaNode =>
      node !== null && node !== undefined,
  );

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

// ============================================================
// HOME PAGE GRAPH
// ============================================================

/**
 * Home page gets:
 *
 * 1. Organization
 * 2. WebSite
 * 3. WebPage
 *
 * This is the ONLY helper that combines site-level entities
 * with the home page.
 */
export function createHomePageSchema(input: {
  url?: string;
  name: string;
  description?: string | null;
  image?: string | null;
  breadcrumbs?: BreadcrumbItem[];
}): SchemaGraph {
  const url = requiredUrl(input.url || "/");

  const page = createWebPageSchema({
    url,
    name: input.name,
    description: input.description,
    type: "WebPage",
    image: input.image,
    hasBreadcrumb: false,
  });

  const breadcrumb = input.breadcrumbs
    ? createBreadcrumbSchema(input.breadcrumbs, url)
    : null;

  return {
    "@context": "https://schema.org",

    "@graph": [
      createOrganizationSchema(),
      createWebSiteSchema(),
      page,
      breadcrumb,
    ].filter(
      (node): node is SchemaNode =>
        node !== null && node !== undefined,
    ),
  };
}