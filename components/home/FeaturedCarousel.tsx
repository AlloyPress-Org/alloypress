"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Media = {
  url?: string | null;
  alt?: string | null;
};

type Category = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
};

type Post = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  publishedAt?: string | null;
  featuredImage?: Media | number | null;
  category?: Category | number | null;
};

function getMediaUrl(media: Post["featuredImage"]): string | null {
  if (!media || typeof media === "number" || !media.url) {
    return null;
  }

  if (media.url.startsWith("http")) {
    return media.url;
  }

  const cmsUrl =
    process.env.NEXT_PUBLIC_PAYLOAD_URL ||
    "http://localhost:3001/api";

  return `${cmsUrl.replace(/\/api$/, "")}${media.url}`;
}

function getCategory(
  category: Post["category"]
): { name: string; slug: string } {
  if (!category || typeof category === "number") {
    return {
      name: "AI",
      slug: "ai",
    };
  }

  return {
    name: category.name || "AI",
    slug: category.slug || "ai",
  };
}

function formatDate(date?: string | null): string {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function FeaturedCarousel({
  posts,
}: {
  posts: Post[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = useMemo(
    () => posts.slice(0, 5),   // was 3
    [posts]
  );

  /* =========================================================
     AUTO SLIDE
  ========================================================= */

  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % slides.length
      );
    }, 4200);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length, isPaused]);

  /* =========================================================
     SAFETY — RESET INDEX WHEN SLIDES CHANGE
  ========================================================= */

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  /* =========================================================
     MOBILE / MANUAL NAVIGATION
  ========================================================= */

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0
        ? slides.length - 1
        : current - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((current) =>
      current === slides.length - 1
        ? 0
        : current + 1
    );
  };

  if (!slides.length) {
    return null;
  }

  return (
    <div
      className="alloy-featured-carousel"
      aria-roledescription="carousel"
      aria-label="Featured articles"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* =====================================================
          FEATURED SLIDES
      ===================================================== */}

      <div className="alloy-featured-track">
        {slides.map((post, index) => {
          const image = getMediaUrl(
            post.featuredImage
          );

          const category = getCategory(
            post.category
          );

          const isActive =
            index === activeIndex;

          return (
            <Link
              key={post.id}
              href={`/${category.slug}/${post.slug}`}
              className={`alloy-featured-card${isActive ? " is-active" : ""
                }`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              aria-label={`Read ${post.title || "featured article"}`}
            >
              {/* =================================================
                  IMAGE
              ================================================= */}

              <div className="alloy-featured-image">
                {image ? (
                  <Image
                    src={image}
                    alt={
                      typeof post.featuredImage ===
                        "object"
                        ? post.featuredImage?.alt ||
                        post.title ||
                        "AlloyPress featured article"
                        : post.title ||
                        "AlloyPress featured article"
                    }
                    fill
                    sizes="(max-width: 860px) 100vw, 58vw"
                    priority={index === 0}
                  />
                ) : (
                  <div
                    className="alloy-image-placeholder"
                    aria-hidden="true"
                  >
                    <span>AI</span>
                  </div>
                )}
              </div>

              {/* =================================================
                  CONTENT
              ================================================= */}

              <div className="alloy-featured-content">
                <div className="alloy-post-meta-top">
                  <span>{category.name}</span>

                  <span aria-hidden="true">
                    •
                  </span>

                  <span>FEATURED</span>
                </div>

                <h3>{post.title}</h3>

                <div className="alloy-featured-meta">
                  <span>AlloyPress Team</span>

                  <span aria-hidden="true">
                    •
                  </span>

                  <time
                    dateTime={
                      post.publishedAt || undefined
                    }
                  >
                    {formatDate(
                      post.publishedAt
                    )}
                  </time>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* =====================================================
          MOBILE PREVIOUS / NEXT CONTROLS
          Desktop-la CSS மூலம் hidden
      ===================================================== */}

      {slides.length > 1 && (
        <div
          className="alloy-featured-mobile-controls"
          aria-label="Featured article navigation"
        >
          <button
            type="button"
            className="alloy-featured-mobile-arrow alloy-featured-mobile-arrow-prev"
            onClick={goToPrevious}
            aria-label="Previous featured article"
          >
            <span aria-hidden="true">
              ‹
            </span>
          </button>

          <button
            type="button"
            className="alloy-featured-mobile-arrow alloy-featured-mobile-arrow-next"
            onClick={goToNext}
            aria-label="Next featured article"
          >
            <span aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      )}

      {/* =====================================================
          PAGINATION DOTS
      ===================================================== */}

      {slides.length > 1 && (
        <div
          className="alloy-featured-pagination"
          aria-label="Choose featured article"
        >
          {slides.map((post, index) => (
            <button
              key={post.id}
              type="button"
              className={`alloy-featured-dot${index === activeIndex
                  ? " is-active"
                  : ""
                }`}
              aria-label={`Show featured article ${index + 1
                }`}
              aria-current={
                index === activeIndex
                  ? "true"
                  : undefined
              }
              onClick={() =>
                setActiveIndex(index)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}