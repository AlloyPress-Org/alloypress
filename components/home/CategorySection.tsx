import Link from "next/link";
import type { ReactNode } from "react";
import "@/components/css-style/category.css";

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

   Fully static. These cards are just navigation links to
   fixed routes, so no Payload / Neon DB call is needed.
========================================================= */

const categoryDefinitions: CategoryDefinition[] = [
  {
    number: "01",
    slug: "listicles",
    title: "Listicles",
    description: "Tested & ranked lists of the best AI tools for every use case.",
    href: "/blogs/listicles",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 4h12v16H4V8L8 4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 4v4H4M9 12h7M9 16h7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M6.5 12h.01M6.5 16h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  {
    number: "02",
    slug: "informatives",
    title: "Informatives",
    description: "Detailed guides on AI, tools and concepts.",
    href: "/blogs/informatives",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 11v5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },

  {
    number: "03",
    slug: "reviews",
    title: "Reviews",
    description: "Real testing, Honest verdicts, No sponsored rankings.",
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
    number: "04",
    slug: "news",
    title: "News",
    description: "AI updates filtered for what actually matters.",
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
          x="4"
          y="5"
          width="16"
          height="14"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="m7 9 2 2 3-3M14 10h3M7 15h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },

  {
    number: "05",
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
        <circle cx="9" cy="7" r="1.5" fill="currentColor" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" />
        <circle cx="11" cy="17" r="1.5" fill="currentColor" />
      </svg>
    ),
  },

  {
    number: "06",
    slug: "comparisons",
    title: "Comparisons",
    description: "Head-to-head AI tool testing so you don't have to.",
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
   CATEGORY SECTION
========================================================= */

export default function CategorySection() {
  return (
    <section
      className="category-section"
      aria-labelledby="category-section-title"
    >
      <div className="container">
        {/* HEADER */}
        <div className="category-header">
          <div>
            <div className="category-eyebrow">
              <span aria-hidden="true" />
              Explore by category
            </div>

            <h2 id="category-section-title">Explore AI, your way.</h2>
          </div>
        </div>

        {/* CATEGORY CARDS */}
        <div className="category-grid">
          {categoryDefinitions.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="category-card"
            >
              <div className="category-card-top">
                <span className="category-number">{category.number}</span>

                <span className="category-icon">{category.icon}</span>
                <span className="category-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>

              <div className="category-card-content">
                <h3>{category.title}</h3>

                <p>{category.description}</p>
              </div>

              <span className="category-card-line" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}