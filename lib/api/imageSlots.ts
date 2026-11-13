import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

/** One poster. */
export type ImageSlotItem = {
  id: string | number;
  src: string;
  width: number;
  height: number;
  alt: string;
  href: string | null;
  followMode: "nofollow" | "dofollow";
  sponsored: boolean;
};

/**
 * What getImageSlot() returns: the FIRST poster (so existing code such as
 * <PostImageSlot slot={...} /> keeps working) plus `slides` = ALL enabled posters.
 * `slides` has 2+ items only when the carousel should be shown.
 */
export type ImageSlot = ImageSlotItem & {
  slides?: ImageSlotItem[];
};

type RawSlot = {
  id: string | number;
  name?: string | null;
  image?: { url?: string | null; width?: number | null; height?: number | null } | number | null;
  linkUrl?: string | null;
  followMode?: "nofollow" | "dofollow" | null;
  sponsored?: boolean | null;
};

/** Safety cap so a post page never loads dozens of posters. */
const MAX_SLIDES = 8;

const fetchRaw = cache(async (): Promise<RawSlot[]> => {
  const params = new URLSearchParams();
  params.set("where[enabled][equals]", "true");
  // Oldest first = stable order (editing a slot does not reshuffle the carousel).
  params.set("sort", "createdAt");
  params.set("depth", "1");
  params.set("limit", String(MAX_SLIDES));

  const data = await payloadFetch<{ docs?: RawSlot[] }>(
    `/image-slots?${params.toString()}`,
    {
      strict: false, // CMS down => no poster, page still renders
      next: { tags: ["image-slots"] },
    },
  );

  return data?.docs ?? [];
});

function toItem(s: RawSlot): ImageSlotItem | null {
  const img = typeof s.image === "object" && s.image ? s.image : null;
  if (!img?.url) return null; // slot without a usable image is skipped

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

/** Every enabled poster, oldest first (max 8). */
export const getImageSlots = cache(async (): Promise<ImageSlotItem[]> => {
  const raw = await fetchRaw();
  return raw.map(toItem).filter((item): item is ImageSlotItem => item !== null);
});

/**
 * First poster + all posters in `slides`, or null when there is none.
 * Single poster  -> slides has 1 item  -> frontend renders it exactly as before.
 * Several posters -> slides has 2+ items -> frontend renders the carousel.
 */
export async function getImageSlot(): Promise<ImageSlot | null> {
  const slides = await getImageSlots();
  if (!slides.length) return null;

  return { ...slides[0], slides };
}