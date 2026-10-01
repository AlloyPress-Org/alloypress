import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE_SIZE,
  DEFAULT_OG_IMAGE_URL,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "./constants";
import { absoluteUrl as toAbsolute, cleanText } from "./text";

export type SeoRobotsInput = {
  index?: boolean;
  follow?: boolean;
  noArchive?: boolean;
  noImageIndex?: boolean;
  noSnippet?: boolean;
};

type SocialOverride = {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
} | null;

export type BuildPageMetadataInput = {
  title?: string | null;
  description?: string | null;
  canonicalPath?: string | null;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  robots?: SeoRobotsInput | null;
  openGraph?: SocialOverride;
  twitter?: SocialOverride;
};

export type BuildArticleMetadataInput = BuildPageMetadataInput & {
  publishedTime?: string | null;
  modifiedTime?: string | null;
};

const abs = (v?: string | null) => toAbsolute(v, SITE_URL);

function buildCanonical(input: BuildPageMetadataInput): string {
  // CMS override wins, but our own/preview hosts are normalised to production.
  const cms = abs(input.canonicalUrl);
  if (cms) {
    try {
      const parsed = new URL(cms);
      const siteHost = new URL(SITE_URL).hostname;
      const ownHost =
        parsed.hostname === siteHost ||
        parsed.hostname === `www.${siteHost}` ||
        parsed.hostname.endsWith(".vercel.app") ||
        parsed.hostname.endsWith(".workers.dev");

      return ownHost
        ? new URL(parsed.pathname + parsed.search, `${SITE_URL}/`).toString()
        : cms;
    } catch {
      /* fall through */
    }
  }
  const path = input.canonicalPath?.trim();
  return (path && abs(path)) || `${SITE_URL}/`;
}

function buildRobots(input?: SeoRobotsInput | null): Metadata["robots"] {
  const index = input?.index !== false;
  const follow = input?.follow !== false;
  return {
    index,
    follow,
    ...(input?.noArchive === true ? { noarchive: true } : {}),
    ...(input?.noImageIndex === true ? { noimageindex: true } : {}),
    ...(input?.noSnippet === true ? { nosnippet: true } : {}),
    googleBot: {
      index,
      follow,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

function build(
  input: BuildArticleMetadataInput,
  type: "website" | "article",
): Metadata {
  const title = cleanText(input.title) || SITE_NAME;
  const description = cleanText(input.description);
  const canonical = buildCanonical(input);

  const primaryImage = abs(input.imageUrl) || DEFAULT_OG_IMAGE_URL;
  const ogImageUrl = abs(input.openGraph?.imageUrl) || primaryImage;
  const twitterImageUrl = abs(input.twitter?.imageUrl) || ogImageUrl;
  const imageAlt = cleanText(input.imageAlt) || title;

  const ogTitle = cleanText(input.openGraph?.title) || title;
  const ogDescription = cleanText(input.openGraph?.description) || description;
  const twTitle = cleanText(input.twitter?.title) || title;
  const twDescription = cleanText(input.twitter?.description) || description;

  const ogImage = {
    url: ogImageUrl,
    alt: imageAlt,
    ...(ogImageUrl === DEFAULT_OG_IMAGE_URL ? DEFAULT_OG_IMAGE_SIZE : {}),
  };

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    robots: buildRobots(input.robots),
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: ogTitle,
      ...(ogDescription ? { description: ogDescription } : {}),
      url: canonical,
      images: [ogImage],
      ...(type === "article" && input.publishedTime
        ? { publishedTime: input.publishedTime }
        : {}),
      ...(type === "article" && input.modifiedTime
        ? { modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: twTitle,
      ...(twDescription ? { description: twDescription } : {}),
      images: [twitterImageUrl],
    },
  };
}

export const buildPageMetadata = (input: BuildPageMetadataInput): Metadata =>
  build(input, "website");

export const buildArticleMetadata = (input: BuildArticleMetadataInput): Metadata =>
  build(input, "article");