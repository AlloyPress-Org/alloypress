import CategoryListing from "@/components/category/CategoryListing";

import {
  buildPageMetadata,
} from "@/lib/seo/metadata";

import {
  CATEGORY_PATHS,
  SITE_URL,
} from "@/lib/seo/constants";

import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
} from "@/lib/seo/schema";

// NOTE: title is passed WITHOUT "| AlloyPress" — the root layout's
// title template ("%s | AlloyPress") appends that automatically.
// Passing the full suffixed string here causes a duplicate.
const PAGE_TITLE = "AI Blogs";
const PAGE_DESCRIPTION =
  "Practical AI guides, tutorials, explainers and useful knowledge from AlloyPress.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,

  description: PAGE_DESCRIPTION,

  canonicalPath:
    CATEGORY_PATHS.blogs,
});

export default function BlogsPage() {
  const pageUrl =
    `${SITE_URL}${CATEGORY_PATHS.blogs}`;

  const jsonLd = {
    "@context": "https://schema.org",

    "@graph": [

      createCollectionPageSchema({
        url: pageUrl,

        name: PAGE_TITLE,

        description: PAGE_DESCRIPTION,
      }),

      createBreadcrumbSchema([
        {
          name: "Home",
          url: SITE_URL,
        },

        {
          name: "Blogs",
          url: pageUrl,
        },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLd,
          ),
        }}
      />

      <CategoryListing
        slug="blogs"
        title="Blogs"
        description="Practical guides, tutorials and useful AI knowledge — tested, explained and simplified."
      />
    </>
  );
}