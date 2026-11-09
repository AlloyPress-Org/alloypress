import { cache } from "react";

import { getApiUrl, payloadFetch } from "@/lib/payload";
import { postHref } from "@/lib/post-href";

import NavbarClient from "./NavbarShell";

const FEATURED_SLUGS = [
  "best-ai-website-builders",
  "best-ai-image-generator",
  "best-ai-video-generators",
];

type Media = { url?: string | null; alt?: string | null };
type Category = { name?: string | null; slug?: string | null };

type NavPost = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  meta?: { description?: string | null } | null;
  featuredImage?: Media | number | null;
  category?: Category | number | null;
};

const TAGS: Record<string, string> = {
  listicle: "Best Of",
  listicles: "Best Of",
  informative: "Explainer",
  informatives: "Explainer",
  reviews: "Review",
  news: "News",
  alternatives: "Alternatives",
  comparisons: "Comparison",
  tutorial: "Tutorial",
};

function clean(value?: string | null, max = 170) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "")}…`;
}

function mediaUrl(media: NavPost["featuredImage"]) {
  if (!media || typeof media === "number" || !media.url) return undefined;
  if (media.url.startsWith("http")) return media.url;
  return `${getApiUrl().replace(/\/api$/, "")}${media.url}`;
}

const getFeaturedArticle = cache(async () => {
  const params = new URLSearchParams({
    "where[slug][in]": FEATURED_SLUGS.join(","),
    "where[workflowStatus][equals]": "published",
    limit: String(FEATURED_SLUGS.length),
    depth: "1",
    "select[slug]": "true",
    "select[title]": "true",
    "select[excerpt]": "true",
    "select[meta]": "true",
    "select[featuredImage]": "true",
    "select[category]": "true",
  });

  const data = await payloadFetch<{ docs?: NavPost[] }>(
    `/posts?${params.toString()}`,
    {
      strict: false,
      next: { revalidate: 86400, tags: ["nav:featured", "posts-content"] },
    }
  );

  const docs = data?.docs ?? [];
  const post = FEATURED_SLUGS.map((slug) =>
    docs.find((doc) => doc.slug === slug)
  ).find(Boolean);

  if (!post?.slug || !post.title) return null;

  const category =
    post.category && typeof post.category !== "number" ? post.category : null;
  const image =
    post.featuredImage && typeof post.featuredImage !== "number"
      ? post.featuredImage
      : null;

  return {
    tag: TAGS[category?.slug ?? ""] ?? category?.name ?? "Best Of",
    title: post.title,
    description: clean(post.meta?.description || post.excerpt),
    href: postHref(category?.slug, post.slug),
    image: mediaUrl(post.featuredImage),
    imageAlt: image?.alt || post.title,
  };
});

export default async function Navbar() {
  const featuredArticle = await getFeaturedArticle();

  return <NavbarClient featuredArticle={featuredArticle} />;
}