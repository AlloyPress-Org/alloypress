import type { Metadata } from "next";
import Script from "next/script";

import Hero from "@/components/home/Hero";
import LatestUpdate from "@/components/home/LatestUpdates";
import CategorySection from "@/components/home/CategorySection";
import AlloyPick from "@/components/home/AlloyPick";
import LearnAboutAI from "@/components/home/LearnAboutAI";
import RecentAINews from "@/components/home/RecentAINews";
import AIToolReviews from "@/components/home/AIToolReviews";
import PopularResources from "@/components/home/PopularResources";
import ToolSubmissionCTA from "@/components/home/ToolSubmissionCTA";
import NewsletterSection from "@/components/home/NewsletterSection";
import BackToTop from "@/components/BackToTop";
import TestingPartnerPromo from "@/components/home/testing-cta";

import { buildPageMetadata } from "@/lib/seo/metadata";
import { createWebSiteSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Tools Tested, Reviewed & Explained",
  description:
    "Honest AI tool reviews, real comparisons, practical alternatives, AI news and clear guides based on hands-on testing.",
  canonicalPath: "/",
  openGraph: {
    title: "AI Tools Tested, Reviewed & Explained",
    description:
      "Honest AI tool reviews, real comparisons, practical alternatives, AI news and clear guides based on hands-on testing.",
  },
  twitter: {
    title: "AI Tools Tested, Reviewed & Explained",
    description:
      "Honest AI tool reviews, real comparisons, practical alternatives, AI news and clear guides based on hands-on testing.",
  },
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [createWebSiteSchema()],
};

export default function Home() {
  return (
    <>
      <Script
        id="home-website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />

      <Hero />
      <TestingPartnerPromo />
      <CategorySection />
      <AlloyPick />
      <LatestUpdate />
      <PopularResources />
      <LearnAboutAI />
      <RecentAINews />
      <AIToolReviews />
      <NewsletterSection />
      <ToolSubmissionCTA />
    </>
  );
}