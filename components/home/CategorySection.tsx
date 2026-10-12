import Link from "next/link";
import type { ReactNode } from "react";
import { cache } from "react";

import { payloadFetch } from "@/lib/payload";

type PayloadCategory = {
  slug: string;
};

type CategoryResponse = {
  docs?: PayloadCategory[];
};

type CategoryDefinition = {
  number: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

/* =========================================================
   CATEGORY CONFIGURATION
========================================================= */

const categoryDefinitions: CategoryDefinition[] = [
  {
    number: "01",
    slug: "blogs",
    title: "Blogs",
    description:
      "AI Guides and explainers, in plain English.",
    href: "/blogs",

    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="M8 8h8M8 11.5h8M8 15h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  {
    number: "02",
    slug: "reviews",
    title: "Reviews",
    description:
      "Real testing, Honest verdicts, No sponsored rankings.",
    href: "/reviews",

    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="10.5"
          cy="10.5"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="m15 15 4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  {
    number: "03",
    slug: "news",
    title: "News",
    description:
      "AI updates filtered for what actually matters.",
    href: "/news",

    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="M8 8h8M8 11.5h5M8 15h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  {
    number: "04",
    slug: "alternatives",
    title: "Alternatives",
    description:
      "Better AI tool options when the obvious choice falls short.",
    href: "/alternatives",

    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 7h12M6 12h12M6 17h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <circle
          cx="9"
          cy="7"
          r="1.5"
          fill="currentColor"
        />

        <circle
          cx="15"
          cy="12"
          r="1.5"
          fill="currentColor"
        />

        <circle
          cx="11"
          cy="17"
          r="1.5"
          fill="currentColor"
        />
      </svg>
    ),
  },

  {
    number: "05",
    slug: "comparisons",
    title: "Comparisons",
    description:
      "Head-to-head AI tool testing so you don't have to.",
    href: "/comparisons",

    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 5v14M17 5v14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M4.5 8.5 7 5l2.5 3.5M14.5 15.5 17 19l2.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/* =========================================================
   FETCH REAL PAYLOAD CATEGORIES

   Only fetch the five categories this component can render.

   - depth=0
   - slug only
   - limit=5
   - ISR: 5 minutes
   - cached with React cache()
========================================================= */

const getCategories = cache(
  async (): Promise<PayloadCategory[]> => {
    try {
      const categoryData =
        await payloadFetch<CategoryResponse>(
          "/categories?where[slug][in]=blogs,reviews,news,alternatives,comparisons&limit=5&depth=0&select[slug]=true",
          {
            next: {
              revalidate: 86400,
              tags: [
                "categories",
                "category:blogs",
                "category:reviews",
                "category:news",
                "category:alternatives",
                "category:comparisons",
              ],
            },
          },
        );

      return Array.isArray(categoryData?.docs)
        ? categoryData.docs
        : [];
    } catch (error) {
      console.error(
        "[CategorySection] Failed to fetch categories:",
        error,
      );

      return [];
    }
  },
);

/* =========================================================
   CATEGORY SECTION
========================================================= */

export default async function CategorySection() {
  const payloadCategories =
    await getCategories();

  /*
   * Match the frontend presentation config
   * against real Payload category slugs.
   */

  const availableSlugs = new Set(
    payloadCategories.map(
      (category) => category.slug,
    ),
  );

  const categories =
    categoryDefinitions.filter(
      (category) =>
        availableSlugs.has(category.slug),
    );

  return (
    <section
      className="category-section"
      aria-labelledby="category-section-title"
    >
      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="category-header">
          <div>
            <div className="category-eyebrow">
              <span aria-hidden="true" />
              Explore by category
            </div>

            <h2 id="category-section-title">
              Explore AI, your way.
            </h2>
          </div>
        </div>

        {/* =================================================
            CATEGORY CARDS
        ================================================= */}

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="category-card"
            >
              <div className="category-card-top">
                <span className="category-number">
                  {category.number}
                </span>

                <span className="category-icon">
                  {category.icon}
                </span>

                <span
                  className="category-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </div>

              <div className="category-card-content">
                <h3>
                  {category.title}
                </h3>

                <p>
                  {category.description}
                </p>
              </div>

              <span
                className="category-card-line"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}