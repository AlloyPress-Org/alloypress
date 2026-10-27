import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

export type ImageSlot = {
  id: string | number;
  src: string;
  width: number;
  height: number;
  alt: string;
  href: string | null;
  followMode: "nofollow" | "dofollow";
  sponsored: boolean;
};

type RawSlot = {
  id: string | number;
  name?: string | null;
  image?: { url?: string | null; width?: number | null; height?: number | null } | number | null;
  linkUrl?: string | null;
  followMode?: "nofollow" | "dofollow" | null;
  sponsored?: boolean | null;
};

const fetchRaw = cache(async (): Promise<RawSlot[]> => {
  const params = new URLSearchParams();
  params.set("where[enabled][equals]", "true");
  params.set("sort", "-updatedAt");
  params.set("depth", "1");
  params.set("limit", "1");

  const data = await payloadFetch<{ docs?: RawSlot[] }>(
    `/image-slots?${params.toString()}`,
    {
      strict: false, // CMS down => no poster, page still renders
      next: { tags: ["image-slots"] },
    },
  );

  return data?.docs ?? [];
});

/** The one active poster (most recently updated enabled slot), or null. */
export async function getImageSlot(): Promise<ImageSlot | null> {
  const [s] = await fetchRaw();
  if (!s) return null;

  const img = typeof s.image === "object" && s.image ? s.image : null;
  if (!img?.url) return null;

  return {
    id: s.id,
    src: img.url,
    width: img.width || 300,
    height: img.height || 250,
    alt: s.name || "AlloyPress",
    href: s.linkUrl?.trim() || null,
    followMode: s.followMode ?? "nofollow",
    sponsored: s.sponsored ?? false,
  };
}