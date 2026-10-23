import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

export type CategoryRef = {
  id: number | string;
  slug?: string | null;
};

type CategoryResponse = { docs?: CategoryRef[] };

const getCategoryIndex = cache(
  async (): Promise<Map<string, CategoryRef>> => {
    const data = await payloadFetch<CategoryResponse>(
      "/categories?limit=200&depth=0&select[slug]=true",
      {
        next: {
          revalidate: 604800,
          tags: ["categories"],
        },
      },
    );

    const index = new Map<string, CategoryRef>();

    for (const doc of data?.docs ?? []) {
      // first match wins (same as the old `limit=1` lookup)
      if (doc?.id != null && doc.slug && !index.has(doc.slug)) {
        index.set(doc.slug, doc);
      }
    }

    return index;
  },
);

export async function getCategoryBySlug(
  slug: string,
  extraTags: string[] = [],
): Promise<CategoryRef | null> {
  const index = await getCategoryIndex();
  const hit = index.get(slug);

  if (hit) return hit;

  // Not in the shared list -> exact old query (never a false "not found").
  const data = await payloadFetch<CategoryResponse>(
    `/categories?where[slug][equals]=${encodeURIComponent(
      slug,
    )}&limit=1&depth=0&select[id]=true`,
    {
      next: {
        revalidate: 604800,
        tags: ["categories", ...extraTags],
      },
    },
  );

  return data?.docs?.[0] ?? null;
}