import CategoryListing from "@/components/category/CategoryListing";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { CATEGORY_PATHS, SITE_URL } from "@/lib/seo/constants";

import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
} from "@/lib/seo/schema";

// NOTE: title is passed WITHOUT "| AlloyPress" — the root layout's
// title template ("%s | AlloyPress") appends that automatically.
// Passing the full suffixed string here causes a duplicate.
const PAGE_TITLE = "AI News";
const PAGE_DESCRIPTION =
  "The latest AI developments, launches, updates and important stories, explained clearly.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: CATEGORY_PATHS.news,
});

export default function NewsPage() {
  const pageUrl = `${SITE_URL}${CATEGORY_PATHS.news}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [

      createCollectionPageSchema({
        url: pageUrl,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
      }),

      createBreadcrumbSchema([
        { name: "Home", url: SITE_URL },
        { name: "News", url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <CategoryListing
        slug="news"
        title="News"
        description="The latest AI developments, launches and updates — without the noise."
      />
    </>
  );
}