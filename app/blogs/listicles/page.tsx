import BlogSubcategoryPage from "@/components/category/Blogsubcategorypage";

import { buildPageMetadata } from "@/lib/seo/metadata";

// Must match the subcategory slug in Payload (Categories -> listicle).
const SUB_SLUG = "listicles";

// Title WITHOUT "| AlloyPress": the root layout title template adds it.
const PAGE_TITLE = "AI Listicles";
const PAGE_DESCRIPTION =
  "Tested & ranked lists of the best AI tools for every use case.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  canonicalPath: `/blogs/${SUB_SLUG}`,
});

export default function ListiclesPage() {
  return (
    <BlogSubcategoryPage
      subSlug={SUB_SLUG}
      title="Listicles"
      description="Tested & ranked lists of the best AI tools for every use case."
    />
  );
}