import { cache } from "react";
import { payloadFetch } from "@/lib/payload";

const PAGE_SIZE = 500;
const MAX_PAGES = 40;

type PageResponse = {
  docs?: { slug?: string | null }[];
  hasNextPage?: boolean;
  totalPages?: number;
};

async function fetchPage(page: number): Promise<PageResponse | null> {
  return payloadFetch<PageResponse>(
    `/posts?depth=0&limit=${PAGE_SIZE}&page=${page}` +
      `&sort=id&select[slug]=true&where[_status][equals]=published`,
    {
      strict: false,
      next: { revalidate: 604800, tags: ["sitemap", "posts-slugs"] },
    },
  );
}

export const getKnownPostSlugs = cache(async (): Promise<Set<string> | null> => {
  try {
    const slugs = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchPage(page);

      // Fail / bad response => list incomplete => protection off (fail-open)
      if (!res || !Array.isArray(res.docs)) return null;

      for (const doc of res.docs) {
        if (doc.slug) slugs.add(doc.slug);
      }

      const hasMore =
        typeof res.hasNextPage === "boolean"
          ? res.hasNextPage
          : typeof res.totalPages === "number"
            ? page < res.totalPages
            : res.docs.length >= PAGE_SIZE; // pagination info illa, full page na innum irukkalaam

      if (!hasMore) {
        // Empty list suspicious (CMS issue) => fail-open
        return slugs.size > 0 ? slugs : null;
      }
    }

    // MAX_PAGES thaandiduchu => incomplete => fail-open
    console.error("[known-slugs] MAX_PAGES exceeded, allow-list disabled");
    return null;
  } catch (error) {
    console.error("[known-slugs] failed, allow-list disabled", error);
    return null;
  }
});