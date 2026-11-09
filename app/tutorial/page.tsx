import CategoryListing from "@/components/category/CategoryListing";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { CATEGORY_PATHS, SITE_URL } from "@/lib/seo/constants";

import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
} from "@/lib/seo/schema";

const PAGE_TITLE = "AI Tutorials";
const PAGE_DESCRIPTION =
  "Step-by-step AI tutorials with real tools, clear screenshots and practical results you can follow along.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: CATEGORY_PATHS.tutorial,
});

export default function TutorialPage() {
  const pageUrl = `${SITE_URL}${CATEGORY_PATHS.tutorial}`;

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
        { name: "Tutorials", url: pageUrl },
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
        slug="tutorial"
        title="Tutorials"
        description="Step-by-step guides to get real work done with AI tools, tested hands-on."
      />
    </>
  );
}