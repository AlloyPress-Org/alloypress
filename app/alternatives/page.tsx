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
const PAGE_TITLE = "AI Alternatives";
const PAGE_DESCRIPTION =
  "Find better AI tool alternatives based on features, pricing, use cases and practical testing.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: CATEGORY_PATHS.alternatives,
});

export default function AlternativesPage() {
  const pageUrl = `${SITE_URL}${CATEGORY_PATHS.alternatives}`;

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
        { name: "Alternatives", url: pageUrl },
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
        slug="alternatives"
        title="Alternatives"
        description="Find better AI tools when the obvious choice isn't right — compared by real use cases."
      />
    </>
  );
}