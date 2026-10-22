import type { Metadata } from "next";

import Hero from "@/components/home/Hero";
import LatestUpdate from "@/components/home/LatestUpdates";
import CategorySection from "@/components/home/CategorySection";
import AlloyPick from "@/components/home/AlloyPick";
import LearnAboutAI from "@/components/home/LearnAboutAI";
import RecentAINews from "@/components/home/RecentAINews";
import AIToolList from "@/components/home/AIToolList";
import PopularResources from "@/components/home/PopularResources";
import ToolSubmissionCTA from "@/components/home/ToolSubmissionCTA";
import NewsletterSection from "@/components/home/NewsletterSection";
import TestingPartnerPromo from "@/components/home/testing-cta";

import { buildPageMetadata } from "@/lib/seo/metadata";
import { createWebSiteSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";

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

/**
 * WebSite schema belongs ONLY on the homepage.
 *
 * Organization schema is rendered globally from app/layout.tsx.
 * Do not add Organization here to avoid duplicate schema.
 */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [createWebSiteSchema()],
};

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />

      <Hero />

      <CategorySection />

      <AlloyPick />

      <LatestUpdate />

      <PopularResources />

      {/* Informative posts (Learn > Informative). Defaults: slug "informatives",
          View all -> /blogs/informatives, tag "home:informatives" */}
      <LearnAboutAI />

      <RecentAINews />

      {/* Listicle posts (Learn > Listicle), View all -> /blogs/listicles */}
      <AIToolList />

      <NewsletterSection />

      <TestingPartnerPromo />

      <ToolSubmissionCTA />
    </>
  );
}