import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/seo/metadata";

import "./not-found.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Page Not Found",
  description:
    "The page you're looking for could not be found on AlloyPress.",
  canonicalPath: "/404",
});

export default function NotFound() {
  return (
    <main className="alloy-404" aria-labelledby="alloy-404-title">
      <div className="alloy-404__glow" aria-hidden="true" />

      <div className="alloy-404__container">
        <div className="alloy-404__content">
          <div className="alloy-404__eyebrow">
            <span className="alloy-404__dot" aria-hidden="true" />
            <span>ERROR 404</span>
          </div>

          <div className="alloy-404__number" aria-hidden="true">
            404
          </div>

          <h1 id="alloy-404-title" className="alloy-404__title">
            This page went off the radar.
          </h1>

          <p className="alloy-404__description">
            The page you&apos;re looking for doesn&apos;t exist, may have
            moved, or the URL might be incorrect.
          </p>

          <div className="alloy-404__actions">
            <Link href="/" className="alloy-404__primary">
              <span>Back to homepage</span>
              <span aria-hidden="true">↗</span>
            </Link>

            <Link href="/blogs" className="alloy-404__secondary">
              Explore Blogs
            </Link>
          </div>
        </div>

        <div className="alloy-404__visual" aria-hidden="true">
          <div className="alloy-404__orbit alloy-404__orbit--outer" />
          <div className="alloy-404__orbit alloy-404__orbit--inner" />

          <div className="alloy-404__core">
            <img
              src="/ap-icon.png"
              alt="AlloyPress"
              className="alloy-404__core-mark"
            />
          </div>

          <span className="alloy-404__floating alloy-404__floating--one">
            AI
          </span>

          <span className="alloy-404__floating alloy-404__floating--two">
            ?
          </span>

          <span className="alloy-404__floating alloy-404__floating--three">
            /
          </span>
        </div>
      </div>
    </main>
  );
}