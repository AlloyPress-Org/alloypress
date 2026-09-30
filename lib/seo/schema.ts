import {
  LOGO_ID,
  ORGANIZATION_ID,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  WEBSITE_ID,
  buildSiteUrl,
} from "./constants";
import { absoluteUrl as toAbsolute, cleanText } from "./text";

// ============================================================
// Types
// ============================================================

export type BreadcrumbItem = { name: string; url: string };
export type FAQItem = { question: string; answer: string };
export type ItemListEntry = { name: string; url: string };

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
  article?: Omit<ArticleSchemaInput, "url" | "title" | "description" | "image"> & {
    // optional overrides; defaults come from the page fields
    title?: string;
    description?: string | null;
    image?: string | null;
  };
  faqs?: FAQItem[];
  itemList?: ItemListEntry[];
};

type Node = Record<string, unknown>;

const abs = (v?: string | null) => toAbsolute(v, SITE_URL);

// ============================================================
// Core entities (included in EVERY page graph)
// ============================================================

export function createOrganizationSchema(): Node {
  return {
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
    image: { "@id": LOGO_ID },
    sameAs: [...SOCIAL_PROFILES],
  };
}

export function createWebSiteSchema(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: buildSiteUrl("/"),
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: SITE_LANGUAGE,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ============================================================
// Page-level nodes
// ============================================================

export function createBreadcrumbSchema(
  items: BreadcrumbItem[],
  pageUrl?: string,
): Node | null {
  const listItems = items
    .map((item, index) => {
      const name = cleanText(item.name);
      const url = abs(item.url);

      return name && url
        ? {
            "@type": "ListItem",
            position: index + 1,
            name,
            item: url,
          }
        : null;
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== null,
    )
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));

  if (listItems.length < 2) {
    return null;
  }

  const breadcrumb: Node = {
    "@type": "BreadcrumbList",
    itemListElement: listItems,
  };

  // Only add @id when the parent page explicitly provides
  // its canonical URL.
  if (pageUrl) {
    const url = abs(pageUrl);

    if (url) {
      breadcrumb["@id"] = `${url}#breadcrumb`;
    }
  }

  return breadcrumb;
}

export function createFAQSchema(items: FAQItem[], pageUrl: string): Node | null {
  const mainEntity = items
    .map((item) => {
      const question = cleanText(item.question);
      const answer = cleanText(item.answer);
      return question && answer
        ? {
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          }
        : null;
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (!mainEntity.length) return null;

  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
    mainEntity,
  };
}

export function createItemListSchema(
  entries: ItemListEntry[],
  pageUrl: string,
): Node | null {
  const itemListElement = entries
    .map((e) => {
      const name = cleanText(e.name);
      const url = abs(e.url);
      return name && url ? { name, url } : null;
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .map((e, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: e.url,
      name: e.name,
    }));

  if (!itemListElement.length) return null;

  return {
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    numberOfItems: itemListElement.length,
    itemListElement,
  };
}

export function createArticleSchema(input: ArticleSchemaInput): Node {
  const url = abs(input.url) || SITE_URL;
  const description = cleanText(input.description);
  const image = abs(input.image);
  const category = cleanText(input.category);
  const authorName = cleanText(input.authorName);
  const authorUrl = abs(input.authorUrl);

  const article: Node = {
    "@type": input.type || "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: (cleanText(input.title) || SITE_NAME).slice(0, 110),
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isPartOf: { "@id": `${url}#webpage` },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: SITE_LANGUAGE,
    author: authorName
      ? { "@type": "Person", name: authorName, ...(authorUrl ? { url: authorUrl } : {}) }
      : { "@id": ORGANIZATION_ID },
  };

  if (description) article.description = description;
  if (image) article.image = [image];
  if (input.publishedAt) article.datePublished = input.publishedAt;
  if (input.modifiedAt) article.dateModified = input.modifiedAt;
  if (category) article.articleSection = category;
  if (typeof input.wordCount === "number" && Number.isFinite(input.wordCount)) {
    article.wordCount = input.wordCount;
  }
  return article;
}

export function createWebPageSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  type?: WebPageType;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  hasBreadcrumb?: boolean;
}): Node {
  const url = abs(input.url) || SITE_URL;
  const description = cleanText(input.description);
  const image = abs(input.image);

  return {
    "@type": input.type || "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: cleanText(input.name) || SITE_NAME,
    ...(description ? { description } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: SITE_LANGUAGE,
    ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.modifiedAt ? { dateModified: input.modifiedAt } : {}),
    ...(input.hasBreadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
  };
}

// ============================================================
// ONE function for every route. Always includes Organization + WebSite.
// ============================================================

export function createCollectionPageSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  itemList?: ItemListEntry[];
}) {
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

export function createPageSchema(input: PageSchemaInput) {
  const url = abs(input.url) || SITE_URL;

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
        description: input.article.description ?? input.description,
        image: input.article.image ?? input.image,
      })
    : null;

  const faq = input.faqs ? createFAQSchema(input.faqs, url) : null;
  const itemList = input.itemList ? createItemListSchema(input.itemList, url) : null;

  if (itemList) webPage.mainEntity = { "@id": `${url}#itemlist` };

  return {
    "@context": "https://schema.org",
    "@graph": [
      createOrganizationSchema(),
      createWebSiteSchema(),
      webPage,
      breadcrumb,
      article,
      faq,
      itemList,
    ].filter(Boolean),
  };
}