import CategoryListing from "@/components/category/CategoryListing";

import { CATEGORY_PATHS, SITE_URL } from "@/lib/seo/constants";

import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
} from "@/lib/seo/schema";

/**
 * Shared page body for /blogs/<subcategory> (listicles, informatives, ...).
 * Posts themselves stay at /blogs/<post-slug>.
 */
type Props = {
  /** CMS slug of the subcategory, e.g. "listicles" */
  subSlug: string;
  /** H1 shown in the hero, e.g. "Listicles" */
  title: string;
  description: string;
};

export default function BlogSubcategoryPage({
  subSlug,
  title,
  description,
}: Props) {
  const sectionUrl = `${SITE_URL}${CATEGORY_PATHS.blogs}`;
  const pageUrl = `${sectionUrl}/${subSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      createCollectionPageSchema({
        url: pageUrl,
        name: title,
        description,
      }),

      createBreadcrumbSchema([
        { name: "Home", url: SITE_URL },
        { name: "Blogs", url: sectionUrl },
        { name: title, url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CategoryListing
        slug="blogs"
        subSlug={subSlug}
        title={title}
        description={description}
      />
    </>
  );
}