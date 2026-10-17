import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

type HomepageSettings = {
  id: number | string;
  title?: string | null;
  featuredPosts?: Array<unknown> | null;
};

type HomepageSettingsResponse = {
  docs?: HomepageSettings[];
};

export const getHomepageSettings = cache(
  async (): Promise<HomepageSettings | null> => {
    const params = new URLSearchParams();
    params.set("limit", "1");
    params.set("depth", "2");

    const data = await payloadFetch<HomepageSettingsResponse>(
      `/homepage-settings?${params.toString()}`,
      {
        strict: false, // CMS fail aanaalum crash aagaadhu, null return pannum
        next: {
          revalidate: 604800,
          tags: ["homepage", "homepage:featured"],
        },
      },
    );

    return data?.docs?.[0] ?? null;
  },
);