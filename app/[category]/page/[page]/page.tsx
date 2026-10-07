import { notFound } from "next/navigation";
import CategoryListing from "../../../../components/category/CategoryListing";

const CATEGORY_CONFIG = {
  blogs: {
    title: "Blogs",
    description:
      "AI guides, tutorials, explainers and practical articles from AlloyPress.",
  },
  reviews: {
    title: "Reviews",
    description:
      "Hands-on AI tool reviews based on real testing, practical use cases and honest results.",
  },
  news: {
    title: "News",
    description:
      "The latest AI news, launches, announcements and important developments.",
  },
  alternatives: {
    title: "Alternatives",
    description:
      "Practical alternatives to popular AI tools, platforms and products.",
  },
  comparisons: {
    title: "Comparisons",
    description:
      "Detailed side-by-side comparisons of AI tools and platforms.",
  },
} as const;

type Category = keyof typeof CATEGORY_CONFIG;

export default async function CategoryPaginationPage({
  params,
}: {
  params: Promise<{
    category: string;
    page: string;
  }>;
}) {
  const { category, page } = await params;

  if (!(category in CATEGORY_CONFIG)) {
    notFound();
  }

  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const config = CATEGORY_CONFIG[category as Category];

  return (
    <CategoryListing
      slug={category}
      title={config.title}
      description={config.description}
      page={pageNumber}
    />
  );
}
