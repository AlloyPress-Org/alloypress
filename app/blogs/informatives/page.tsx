import BlogSubcategoryPage from "@/components/category/Blogsubcategorypage";

import { buildPageMetadata } from "@/lib/seo/metadata";

// Must match the subcategory slug in Payload (Categories -> informative).
const SUB_SLUG = "informatives";

// Title WITHOUT "| AlloyPress": the root layout title template adds it.
const PAGE_TITLE = "AI Explainers & Guides";
const PAGE_DESCRIPTION =
  "Detailed guides on AI, tools and concepts.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: `/blogs/${SUB_SLUG}`,
});

export default function InformativesPage() {
  return (
    <BlogSubcategoryPage
      subSlug={SUB_SLUG}
      title="Informatives"
      description="Detailed guides on AI, tools and concepts."
    />
  );
}