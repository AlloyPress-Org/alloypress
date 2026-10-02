import CategoryListing from "@/components/category/CategoryListing";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { CATEGORY_PATHS, SITE_URL } from "@/lib/seo/constants";

import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
} from "@/lib/seo/schema";

const PAGE_TITLE = "AI Tool Reviews";
const PAGE_DESCRIPTION =
  "Hands-on AI tool reviews based on real testing, real prompts and practical use cases.";

// NOTE: title is passed WITHOUT "| AlloyPress" — the root layout's
// title template ("%s | AlloyPress") appends that automatically.
// Passing the full suffixed string here causes a duplicate, e.g.
// "AI Tool Reviews | AlloyPress | AlloyPress".
export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: CATEGORY_PATHS.reviews,
});

export default function ReviewsPage() {
  const pageUrl = `${SITE_URL}${CATEGORY_PATHS.reviews}`;

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
        { name: "Reviews", url: pageUrl },
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
        slug="reviews"
        title="Reviews"
        description="Hands-on AI tool reviews based on real testing, practical use cases and honest results."
      />
    </>
  );
}