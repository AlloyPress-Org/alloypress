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
const PAGE_TITLE = "AI Comparisons";
const PAGE_DESCRIPTION =
  "Side-by-side AI tool comparisons to help you choose the right tool with confidence.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: CATEGORY_PATHS.comparisons,
});

export default function ComparisonsPage() {
  const pageUrl = `${SITE_URL}${CATEGORY_PATHS.comparisons}`;

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
        { name: "Comparisons", url: pageUrl },
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
        slug="comparisons"
        title="Comparisons"
        description="Side-by-side AI tool analysis to help you choose confidently."
      />
    </>
  );
}