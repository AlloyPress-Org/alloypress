import Link from "next/link";
import { Suspense, cache } from "react";

import { payloadFetch } from "@/lib/payload";

type HeroPost = {
  id: number | string;
  title: string;
  slug: string;
  publishedAt?: string | null;
};

type HeroCard = {
  label: string;
  meta: string;
  icon: string;
  className: string;
  categorySlug: string;
  post: HeroPost | null;
};

/* =========================================================
   PAYLOAD
   ========================================================= */

const getLatestPostByCategory = cache(
  async (
    categoryId: number | string
  ): Promise<HeroPost | null> => {
    try {
      const data = await payloadFetch<{
        docs?: HeroPost[];
      }>(
        `/posts?where[workflowStatus][equals]=published&where[category][equals]=${encodeURIComponent(
          String(categoryId)
        )}&sort=-publishedAt&limit=1&depth=0&select[id]=true&select[title]=true&select[slug]=true&select[publishedAt]=true`,
        {
          cache: "force-cache",
          next: {
            revalidate: 300,
            tags: [
              `hero:category:${categoryId}`,
              "posts",
            ],
          },
        }
      );

      const post = data?.docs?.[0];

      if (
        !post?.id ||
        !post?.title ||
        !post?.slug
      ) {
        return null;
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt ?? null,
      };
    } catch (error) {
      console.error(
        `[Hero] Failed to load category ${categoryId}:`,
        error
      );

      return null;
    }
  }
);

/* =========================================================
   HERO DATA
   ========================================================= */

const getHeroCards = cache(
  async (): Promise<HeroCard[]> => {
    const [
      reviewPost,
      newsPost,
      comparisonPost,
    ] = await Promise.all([
      getLatestPostByCategory(4),
      getLatestPostByCategory(6),
      getLatestPostByCategory(5),
    ]);

    return [
      {
        label: "AI TOOL REVIEW",
        meta: "Latest review",
        icon: "◫",
        className: "hero-card-review",
        categorySlug: "reviews",
        post: reviewPost,
      },
      {
        label: "LATEST NEWS",
        meta: "Latest update",
        icon: "▤",
        className: "hero-card-news",
        categorySlug: "news",
        post: newsPost,
      },
      {
        label: "DETAILED COMPARISON",
        meta: "Latest comparison",
        icon: "◒",
        className: "hero-card-comparison",
        categorySlug: "comparisons",
        post: comparisonPost,
      },
    ];
  }
);

/* =========================================================
   DYNAMIC HERO CARDS
   ========================================================= */

async function HeroDynamicCards() {
  const heroCards = await getHeroCards();

  return (
    <>
      {heroCards.map(
        (card) =>
          card.post && (
            <Link
              key={card.post.id}
              href={`/${card.categorySlug}/${card.post.slug}`}
              className={`hero-floating-card ${card.className}`}
              aria-label={`Read ${card.label.toLowerCase()}: ${card.post.title}`}
            >
              <div
                className="hero-floating-icon"
                aria-hidden="true"
              >
                {card.icon}
              </div>

              <div className="hero-floating-content">
                <span className="hero-floating-label">
                  {card.label}
                </span>

                <h2>{card.post.title}</h2>

                <span className="hero-floating-meta">
                  {card.meta}
                </span>
              </div>

              <span
                className="hero-floating-arrow"
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>
          )
      )}
    </>
  );
}

/* =========================================================
   HERO
   ========================================================= */

export default function Hero() {
  return (
    <section
      className="home-hero"
      aria-labelledby="hero-title"
    >
      <div className="container">
        <div className="hero-grid">

          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span
                className="hero-eyebrow-dot"
                aria-hidden="true"
              />

              <span>Independent AI Editorial</span>
            </div>

            <h1
              id="hero-title"
              className="hero-title"
            >
              Every AI tool{" "}
              <span className="hero-highlight">
                tested,
              </span>{" "}
              before we write about it.
            </h1>

            <p className="hero-description">
              Honest AI tool reviews, real comparisons,
              practical alternatives, and clear explanations
              based on hands-on testing.
            </p>

            <div className="hero-actions">
              <Link
                href="/blogs"
                className="hero-primary-button"
              >
                <span>Explore Articles</span>

                <span aria-hidden="true">
                  ↗
                </span>
              </Link>

              <Link
                href="/reviews"
                className="hero-secondary-button"
              >
                <span>Browse Reviews</span>

                <span aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </div>

          {/* =================================================
              RIGHT — AI ORBIT
          ================================================= */}

          <div className="hero-visual">

            <div
              className="hero-visual-grid"
              aria-hidden="true"
            />

            <div
              className="hero-visual-glow"
              aria-hidden="true"
            />

            <div
              className="hero-orbit-stage"
              aria-hidden="true"
            >
              <div className="orbit-ambient-glow" />

              <svg
                className="hero-orbit-svg"
                viewBox="0 0 760 760"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient
                    id="heroCoreGlow"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(380 380) rotate(90) scale(210)"
                  >
                    <stop
                      offset="0"
                      stopColor="#18d978"
                      stopOpacity=".42"
                    />
                    <stop
                      offset=".35"
                      stopColor="#18d978"
                      stopOpacity=".18"
                    />
                    <stop
                      offset="1"
                      stopColor="#18d978"
                      stopOpacity="0"
                    />
                  </radialGradient>

                  <radialGradient
                    id="heroCore"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(380 380) rotate(90) scale(70)"
                  >
                    <stop
                      offset="0"
                      stopColor="#ffffff"
                    />
                    <stop
                      offset=".15"
                      stopColor="#e7fff3"
                    />
                    <stop
                      offset=".35"
                      stopColor="#2be483"
                    />
                    <stop
                      offset=".7"
                      stopColor="#12c76d"
                      stopOpacity=".8"
                    />
                    <stop
                      offset="1"
                      stopColor="#12c76d"
                      stopOpacity="0"
                    />
                  </radialGradient>

                  <linearGradient
                    id="orbitLine"
                    x1="70"
                    y1="90"
                    x2="700"
                    y2="680"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop
                      stopColor="#18c974"
                      stopOpacity=".03"
                    />
                    <stop
                      offset=".3"
                      stopColor="#18c974"
                      stopOpacity=".35"
                    />
                    <stop
                      offset=".5"
                      stopColor="#18e984"
                      stopOpacity=".9"
                    />
                    <stop
                      offset=".7"
                      stopColor="#18c974"
                      stopOpacity=".35"
                    />
                    <stop
                      offset="1"
                      stopColor="#18c974"
                      stopOpacity=".03"
                    />
                  </linearGradient>

                  <filter
                    id="orbitBlur"
                    x="-200%"
                    y="-200%"
                    width="400%"
                    height="400%"
                  >
                    <feGaussianBlur stdDeviation="8" />
                  </filter>

                  <filter
                    id="nodeGlow"
                    x="-300%"
                    y="-300%"
                    width="600%"
                    height="600%"
                  >
                    <feGaussianBlur
                      stdDeviation="5"
                      result="blur"
                    />

                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <circle
                  cx="380"
                  cy="380"
                  r="210"
                  fill="url(#heroCoreGlow)"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="300"
                  stroke="url(#orbitLine)"
                  strokeWidth="1"
                  strokeDasharray="3 10"
                  opacity=".55"
                  className="orbit-spin-slow"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="270"
                  stroke="#18c974"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                  opacity=".20"
                  className="orbit-spin-reverse"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="235"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".16"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="195"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".22"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="155"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".20"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="115"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".18"
                />

                <g className="orbit-ellipse orbit-ellipse-one">
                  <ellipse
                    cx="380"
                    cy="380"
                    rx="320"
                    ry="110"
                    stroke="#18cf74"
                    strokeWidth="1.2"
                    opacity=".55"
                  />
                </g>

                <g className="orbit-ellipse orbit-ellipse-two">
                  <ellipse
                    cx="380"
                    cy="380"
                    rx="300"
                    ry="104"
                    stroke="#18cf74"
                    strokeWidth="1"
                    opacity=".32"
                  />
                </g>

                <g className="orbit-ellipse orbit-ellipse-three">
                  <ellipse
                    cx="380"
                    cy="380"
                    rx="260"
                    ry="88"
                    stroke="#18cf74"
                    strokeWidth="1"
                    opacity=".36"
                  />
                </g>

                <g className="orbit-ellipse orbit-ellipse-four">
                  <ellipse
                    cx="380"
                    cy="380"
                    rx="215"
                    ry="70"
                    stroke="#18cf74"
                    strokeWidth="1"
                    opacity=".26"
                  />
                </g>

                <line
                  x1="380"
                  y1="380"
                  x2="95"
                  y2="120"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".08"
                />

                <line
                  x1="380"
                  y1="380"
                  x2="670"
                  y2="105"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".08"
                />

                <line
                  x1="380"
                  y1="380"
                  x2="690"
                  y2="610"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".08"
                />

                <line
                  x1="380"
                  y1="380"
                  x2="85"
                  y2="630"
                  stroke="#18c974"
                  strokeWidth="1"
                  opacity=".08"
                />

                <g className="orbit-moving-node orbit-node-a">
                  <circle
                    cx="380"
                    cy="68"
                    r="5"
                    fill="#19d978"
                    filter="url(#nodeGlow)"
                  />
                </g>

                <g className="orbit-moving-node orbit-node-b">
                  <circle
                    cx="684"
                    cy="380"
                    r="6"
                    fill="#19e984"
                    filter="url(#nodeGlow)"
                  />
                </g>

                <g className="orbit-moving-node orbit-node-c">
                  <circle
                    cx="380"
                    cy="692"
                    r="5"
                    fill="#19d978"
                    filter="url(#nodeGlow)"
                  />
                </g>

                <g className="orbit-moving-node orbit-node-d">
                  <circle
                    cx="76"
                    cy="380"
                    r="5"
                    fill="#19d978"
                    filter="url(#nodeGlow)"
                  />
                </g>

                <circle
                  cx="165"
                  cy="245"
                  r="5"
                  fill="#72a8ff"
                />

                <circle
                  cx="585"
                  cy="190"
                  r="5"
                  fill="#ffffff"
                />

                <circle
                  cx="610"
                  cy="575"
                  r="6"
                  fill="#19dc7d"
                />

                <circle
                  cx="155"
                  cy="575"
                  r="6"
                  fill="#19dc7d"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="105"
                  fill="url(#heroCoreGlow)"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="76"
                  fill="rgba(17,185,103,.08)"
                  stroke="#19cf74"
                  strokeWidth="1"
                  opacity=".38"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="60"
                  fill="rgba(18,190,105,.10)"
                  stroke="#19d978"
                  strokeWidth="1"
                  opacity=".45"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="48"
                  fill="#18bf6b"
                  opacity=".22"
                  filter="url(#orbitBlur)"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="32"
                  fill="url(#heroCore)"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="15"
                  fill="#ffffff"
                  filter="url(#nodeGlow)"
                />

                <circle
                  cx="380"
                  cy="380"
                  r="8"
                  fill="#ffffff"
                />
              </svg>

              <span className="orbit-marker orbit-marker-one">
                <span />
              </span>

              <span className="orbit-marker orbit-marker-two">
                <span />
              </span>

              <span className="orbit-marker orbit-marker-three">
                <span />
              </span>
            </div>

            {/* =================================================
                NON-CRITICAL DYNAMIC CONTENT
                ================================================= */}

            <Suspense fallback={null}>
              <HeroDynamicCards />
            </Suspense>
          </div>
        </div>

        {/* =====================================================
            STATS
            ===================================================== */}

        <div className="hero-stats-section">
          <div className="hero-stats-heading">
            <span>Why Trust AlloyPress?</span>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div
                className="hero-stat-icon"
                aria-hidden="true"
              >
                ▤
              </div>

              <div>
                <strong>100%</strong>
                <span>Hands on Testing</span>
              </div>
            </div>

            <div className="hero-stat">
              <div
                className="hero-stat-icon"
                aria-hidden="true"
              >
                ⚗
              </div>

              <div>
                <strong>250+</strong>
                <span>AI Tools Tested</span>
              </div>
            </div>

            <div className="hero-stat">
              <div
                className="hero-stat-icon"
                aria-hidden="true"
              >
                ♧
              </div>

              <div>
                <strong>20+</strong>
                <span>Detailed AI Reviews</span>
              </div>
            </div>

            <div className="hero-stat">
              <div
                className="hero-stat-icon"
                aria-hidden="true"
              >
                ☆
              </div>

              <div>
                <strong>4+ LLMs</strong>

                <span>
                  Cited by GPT, Gemini, Claude, Perplexity and more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
