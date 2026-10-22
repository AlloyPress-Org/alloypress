const SECTION_SLUGS = new Set([
  "blogs",
  "reviews",
  "news",
  "alternatives",
  "comparisons",
]);

export function sectionSlug(
  categorySlug?: string | null,
): string {
  return categorySlug && SECTION_SLUGS.has(categorySlug)
    ? categorySlug
    : "blogs";
}

export function postHref(
  categorySlug: string | null | undefined,
  postSlug: string | null | undefined,
): string {
  const section = sectionSlug(categorySlug);

  // Slug illaadha post-ku section page-ku pogum (broken link aagaadhu)
  return postSlug
    ? `/${section}/${postSlug}`
    : `/${section}`;
}