import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { payloadFetch } from "@/lib/payload";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema } from "@/lib/seo/schema";

// ------------------------------------------------------------
// Fallback copy used only if the "about" page doesn't exist yet
// in Payload's Pages collection, or the request fails.
// ------------------------------------------------------------
const FALLBACK_TITLE = "About AlloyPress";
const FALLBACK_DESCRIPTION =
  "AlloyPress is an independent AI editorial publication. We test AI tools hands-on, write what we actually find, and help readers choose without expensive trial and error.";

type PageDoc = {
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalURL?: string | null;
    openGraphImage?: { url?: string | null } | null;
  } | null;
};

async function getAboutPage(): Promise<PageDoc | null> {
  const data = await payloadFetch<{ docs?: PageDoc[] }>(
    "/pages?where[slug][equals]=about&where[status][equals]=published&limit=1",
  );

  return data?.docs?.[0] ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  const seo = page?.seo;

  return buildPageMetadata({
    title: seo?.title || FALLBACK_TITLE,
    description: seo?.description || FALLBACK_DESCRIPTION,
    canonicalPath: "/about-us",
    canonicalUrl: seo?.canonicalURL,
    imageUrl: seo?.openGraphImage?.url,
  });
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@graph": [
    createBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "About", url: "/about-us" },
    ]),
  ],
};

const stats = [
  ["Top 1%", "Cited across AI answer engines (Perplexity, ChatGPT, Gemini and more)"],
  ["250+", "AI tools tested and published"],
  ["100%", "Independent editorial verdicts"],
  ["1000+ hrs", "Hands-on AI tool testing"],
];

const storyParagraphs = [
  "AlloyPress started from a practical frustration. We are a team of SEO and digital marketing professionals who spent years working with and for AI tool companies. As we tested tools for clients, wrote content about them, and evaluated competitors, we kept running into the same problem.",
  "There was no reliable, independent source that actually tested AI tools hands-on and told you honestly which ones were worth using. Most reviews were surface-level. Many were based on vendor information rather than real use. Readers had to subscribe to multiple tools, pay multiple times, and still ended up guessing which one to keep.",
  "We started AlloyPress to fix that. A publication where every recommendation comes from genuine testing, where alternatives are compared against each other fairly, and where readers can find the right AI tool without the expensive trial and error we experienced ourselves.",
  "Today AlloyPress is a dedicated team with deep backgrounds across SEO, digital marketing, content, advertising, social media, and business. That experience shapes how we test tools, what we look for, and how honestly we write about what we find.",
];

const storyTags = [
  "SEO",
  "Digital Marketing",
  "Content Writing",
  "Advertising",
  "Social Media",
  "Business Strategy",
  "AI Tool Testing",
];

const principles = [
  {
    number: "01",
    label: "TEST",
    title: "We test before we write",
    text: "Every tool we cover is approached with real hands-on testing whenever practical, so recommendations are based on actual use rather than surface-level research.",
  },
  {
    number: "02",
    label: "HONEST",
    title: "We call it as we see it",
    text: "If a tool has limitations, we say so. If something works exceptionally well, we explain why. Nothing has to look perfect.",
  },
  {
    number: "03",
    label: "CURRENT",
    title: "We keep things updated",
    text: "AI changes quickly. Models, features, pricing, and capabilities evolve constantly, so useful information has to evolve too.",
  },
  {
    number: "04",
    label: "HUMAN",
    title: "We write for people",
    text: "Clear answers, practical context, and useful recommendations come before unnecessary jargon, filler, or algorithm-first writing.",
  },
];

const contentTypes = [
  ["01", "AI Tool Reviews", "Hands-on evaluations of features, workflow, pricing, strengths, limitations, and real-world usefulness.", "REVIEWS"],
  ["02", "AI Guides & Tutorials", "Practical explanations that help readers understand and use AI without unnecessary complexity.", "BLOGS"],
  ["03", "AI Alternatives", "Useful alternatives when the obvious choice is not the right fit for a reader.", "ALTERNATIVES"],
  ["04", "AI Comparisons", "Side-by-side analysis designed to make choosing between AI tools easier.", "COMPARISONS"],
  ["05", "AI News and Updates", "Important launches, product changes, announcements, and developments across AI.", "NEWS"],
  ["06", "AI Education", "Clear explanations of AI concepts, trends, terminology, and technologies.", "LEARN"],
];

const standards = [
  ["01", "Testing", "Real hands-on testing", "When we review a product, we use it ourselves and evaluate it in practical scenarios, not guided demos or vendor walkthroughs."],
  ["02", "Integrity", "Paid or organic, same standard", "Commercial relationships should never change the standard used to evaluate a product. The same framework applies regardless of how a tool comes to us."],
  ["03", "Honesty", "Limitations are included", "Readers deserve to know what may not work before they make a decision. A review that only highlights strengths is not a useful review."],
  ["04", "Accuracy", "Updated when things change", "Important information should be reviewed and refreshed when meaningful product changes happen. We revisit articles, not just republish them."],
  ["05", "Independence", "No backdoor rankings", "Editorial decisions are based on usefulness and evidence, not placement payments. Position in any article reflects testing results, not commercial arrangement."],
  ["06", "Readers", "Written for humans", "Useful context and practical answers come before unnecessary optimisation or filler. Content is written for the person reading it, not for an algorithm."],
];

const team = [
  ["SEO and Search", "Our team has hands-on experience running SEO campaigns and content strategies for AI tool companies, which shapes how we evaluate tools and write about them."],
  ["Digital Marketing", "Years spent managing marketing for AI-focused brands gives us a grounded understanding of what these tools are actually used for in practice."],
  ["Content and Editorial", "Experienced writers and editors who understand the difference between a useful recommendation and a sponsored-sounding overview."],
  ["Business and Strategy", "We understand the commercial context around AI tools — pricing models, competitive positioning, and what actually matters to the teams buying and using these products."],
  ["Social Media", "Direct experience managing social media for brands helps us evaluate AI social tools, content tools, and scheduling platforms against real-world use cases."],
  ["AI Tool Testing", "Structured, consistent frameworks applied across 250+ tools over time. We know what questions to ask and what gaps to look for because we have seen how every category evolves."],
];

const audiences = [
  ["⌘", "Developers", "Coding assistants, automation tools, APIs, and practical AI workflows."],
  ["✦", "Content creators", "Writing, design, marketing, video, and creative AI workflows."],
  ["◈", "Business owners", "AI tools that can improve productivity and everyday operations."],
  ["○", "Everyday users", "People who want useful AI without the technical overload."],
];

const workPaths = [
  {
    label: "Article inclusion",
    title: "Get featured in a roundup",
    text: "Hands-on testing by our editorial team, evaluation against the criteria for that category, and a dedicated write-up based entirely on what we find. Position is based on test results, not payment.",
    href: "/get-featured",
    cta: "Get featured",
    primary: true,
  },
  {
    label: "Dedicated review",
    title: "Get a full standalone review",
    text: "A full in-depth article covering every feature, real use cases, pricing, and our honest verdict. Ranks independently in search and gets cited in AI platforms like ChatGPT and Perplexity over time.",
    href: "/get-reviewed",
    cta: "See how reviews work",
    primary: false,
  },
  {
    label: "Testing partnership",
    title: "Ongoing testing and feedback",
    text: "We work with a small number of AI teams as a regular testing partner — structured evaluations, product feedback, competitive benchmarking, and business and SEO input on an ongoing basis.",
    href: "/testing-partner",
    cta: "Explore partnerships",
    primary: false,
  },
];

const styles = `
/* =========================================================
   ALLOYPRESS — ABOUT PAGE
   Editorial + AI Intelligence texture system
   No random circles / no orbit decorations
   ========================================================= */

.about-page {
  position: relative;
  overflow: hidden;
  background: var(--background);
  color: var(--foreground);
}

.about-container {
  position: relative;
  z-index: 3;
  width: min(calc(100% - var(--text-4xl)), var(--container));
  margin-inline: auto;
}

.about-kicker {
  display: inline-flex;
  align-items: center;
  gap: var(--text-xs);
  margin: 0 0 var(--text-md);
  color: var(--brand);
  font: 600 var(--text-xs)/1 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.about-kicker::before {
  content: "";
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--brand);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--brand) 7%, transparent),
    0 0 var(--text-md) color-mix(in srgb, var(--brand) 55%, transparent);
}

.about-title {
  margin: 0;
  font: 700 clamp(var(--text-3xl), 5.2vw, var(--text-display))/.98 var(--font-ui);
  letter-spacing: -.065em;
}

.about-title span,
.about-accent {
  color: var(--brand);
}

.about-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 555px;
  padding: 88px 0 74px;
  background: var(--background-base);
  color: var(--foreground);
}

.about-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -4;
  background-image:
    radial-gradient(
      circle at 1px 1px,
      color-mix(in srgb, var(--foreground) 10.5%, transparent) 1px,
      transparent 1.35px
    ),
    linear-gradient(
      color-mix(in srgb, var(--brand) 7%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--brand) 7%, transparent) 1px,
      transparent 1px
    );
  background-size:
    22px 22px,
    72px 72px,
    72px 72px;
  opacity: .9;
  pointer-events: none;
}

.about-hero::after {
  content: "";
  position: absolute;
  width: 760px;
  height: 560px;
  right: -210px;
  top: -235px;
  z-index: -3;
  background:
    radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--brand) 18%, transparent) 0%,
      color-mix(in srgb, var(--brand) 8.5%, transparent) 32%,
      transparent 72%
    );
  filter: blur(var(--text-xs));
  pointer-events: none;
}

.about-hero-tech {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.about-hero-tech::before,
.about-hero-tech::after {
  content: "";
  position: absolute;
  height: 1px;
  transform-origin: left center;
}

.about-hero-tech::before {
  width: 610px;
  left: 5%;
  top: 31%;
  transform: rotate(-8deg);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--brand) 38%, transparent) 30%,
    color-mix(in srgb, var(--foreground) 12%, transparent) 70%,
    transparent
  );
}

.about-hero-tech::after {
  width: 480px;
  right: -35px;
  top: 67%;
  transform: rotate(-10deg);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--foreground) 10%, transparent),
    color-mix(in srgb, var(--brand) 28%, transparent),
    transparent
  );
}

.about-hero-line {
  position: absolute;
  width: 350px;
  height: 1px;
  left: 28%;
  top: 76%;
  transform: rotate(-7deg);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--brand) 24%, transparent),
    transparent
  );
}

.about-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr);
  gap: 70px;
  align-items: end;
}

.about-hero-copy {
  position: relative;
  max-width: 790px;
}

.about-data-marker {
  position: absolute;
  color: color-mix(in srgb, var(--foreground) 18%, transparent);
  font: 500 var(--text-xs) var(--font-mono);
  letter-spacing: .1em;
}

.about-data-marker::after {
  content: "";
  display: inline-block;
  width: var(--text-lg);
  height: 1px;
  margin-left: var(--text-xs);
  vertical-align: middle;
  background: color-mix(in srgb, var(--brand) 28%, transparent);
}

.about-data-marker-01 {
  left: -5px;
  top: -34px;
}

.about-data-marker-02 {
  right: 9%;
  top: var(--text-2xl);
}

.about-data-marker-03 {
  right: 22%;
  bottom: -34px;
}

.about-signal-point {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 var(--text-sm) color-mix(in srgb, var(--brand) 80%, transparent);
}

.about-signal-point-1 {
  left: 48%;
  top: 30%;
}

.about-signal-point-2 {
  right: 16%;
  top: 44%;
}

.about-signal-point-3 {
  left: 67%;
  bottom: 16%;
}

.about-hero .about-title {
  color: var(--foreground);
}

.about-hero .about-title span {
  color: var(--brand);
}

.about-hero .about-kicker {
  color: var(--brand);
}

.about-hero-description {
  max-width: 660px;
  margin: 26px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.75 var(--font-body);
}

.about-signal {
  position: relative;
  padding: var(--text-2xl);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--foreground) 11%, transparent);
  border-radius: var(--text-md);
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--foreground) 6.5%, transparent),
      color-mix(in srgb, var(--foreground) 1.8%, transparent)
    );
  box-shadow: var(--shadow-lg);
}

.about-signal::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(
      90deg,
      transparent 0 18%,
      color-mix(in srgb, var(--brand) 7.5%, transparent) 18.2%,
      transparent 18.5% 52%,
      color-mix(in srgb, var(--foreground) 4.5%, transparent) 52.2%,
      transparent 52.5% 78%,
      color-mix(in srgb, var(--brand) 5.5%, transparent) 78.2%,
      transparent 78.5%
    ),
    linear-gradient(
      color-mix(in srgb, var(--foreground) 4.5%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--foreground) 3.5%, transparent) 1px,
      transparent 1px
    );
  background-size:
    100% 100%,
    100% 36px,
    44px 100%;
  opacity: .78;
  pointer-events: none;
}

.about-signal::after {
  content: "";
  position: absolute;
  right: var(--text-lg);
  bottom: var(--text-lg);
  width: 115px;
  height: var(--text-4xl);
  opacity: .8;
  background:
    linear-gradient(
      155deg,
      transparent 0 22%,
      color-mix(in srgb, var(--brand) 34%, transparent) 22.4% 23%,
      transparent 23.4% 42%,
      color-mix(in srgb, var(--brand) 22%, transparent) 42.4% 43%,
      transparent 43.4% 64%,
      color-mix(in srgb, var(--brand) 36%, transparent) 64.4% 65%,
      transparent 65.4%
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 var(--text-sm),
      color-mix(in srgb, var(--foreground) 5.5%, transparent) var(--text-sm) var(--text-xs)
    );
  pointer-events: none;
}

.about-signal-label {
  position: relative;
  z-index: 2;
  margin-bottom: var(--text-lg);
  color: var(--brand);
  font: 600 var(--text-xs) var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.about-signal-label::after {
  content: "AP / 03";
  float: right;
  color: color-mix(in srgb, var(--foreground) 18%, transparent);
  font: 500 var(--text-xs) var(--font-mono);
  letter-spacing: .1em;
}

.about-signal-row {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: var(--text-xs);
  padding: var(--text-md) 0;
  border-top: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
}

.about-signal-row:first-of-type {
  border-top: 0;
}

.about-signal-number {
  color: var(--brand);
  font: 500 var(--text-xs) var(--font-mono);
}

.about-signal strong {
  display: block;
  color: var(--text-primary);
  font: 600 var(--text-sm) var(--font-ui);
}

.about-signal p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

.about-stats {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(
      circle at 1px 1px,
      color-mix(in srgb, var(--brand) 10%, transparent) 1px,
      transparent 1.2px
    ),
    color-mix(in srgb, var(--foreground) 3%, var(--background));
  background-size: var(--text-2xl) var(--text-2xl), auto;
}

.about-stats::after {
  content: "";
  position: absolute;
  left: 4%;
  right: 4%;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--brand) 18%, transparent),
    transparent
  );
}

.about-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.about-stat {
  position: relative;
  min-height: 105px;
  padding: 22px var(--text-2xl);
  border-right: 1px solid var(--border);
}

.about-stat::before {
  content: "";
  position: absolute;
  top: var(--text-md);
  right: var(--text-md);
  width: var(--text-md);
  height: 1px;
  background: color-mix(in srgb, var(--brand) 35%, transparent);
}

.about-stat:first-child {
  border-left: 1px solid var(--border);
}

.about-stat strong {
  display: block;
  color: var(--foreground);
  font: 700 var(--text-2xl)/1 var(--font-ui);
  letter-spacing: -.05em;
}

.about-stat span {
  display: block;
  max-width: 165px;
  margin-top: var(--text-xs);
  color: var(--text-secondary);
  font: 500 var(--text-sm)/1.5 var(--font-mono);
  letter-spacing: .04em;
  text-transform: uppercase;
}

.about-section {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 78px 0;
}

.about-section::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background-image:
    radial-gradient(
      circle at 1px 1px,
      color-mix(in srgb, var(--brand) 14%, transparent) 1px,
      transparent 1.35px
    );
  background-size: 23px 23px;
  opacity: .72;
  pointer-events: none;
}

.about-section::after {
  content: "";
  position: absolute;
  left: 4%;
  right: 4%;
  top: 34px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--brand) 15%, transparent) 15%,
    rgba(25,40,50,.075) 50%,
    color-mix(in srgb, var(--brand) 15%, transparent) 85%,
    transparent
  );
  pointer-events: none;
}

.about-section-head {
  position: relative;
  display: grid;
  grid-template-columns: minmax(260px, .8fr) minmax(0, 1.2fr);
  gap: 70px;
  align-items: end;
  margin-bottom: 34px;
}

.about-section-head::after {
  content: "01";
  position: absolute;
  right: 0;
  bottom: -3px;
  color: color-mix(in srgb, var(--brand) 13%, transparent);
  font: 600 var(--text-xs) var(--font-mono);
  letter-spacing: .12em;
}

.about-section-head h2 {
  margin: 0;
  color: var(--foreground);
  font: 700 clamp(var(--text-3xl), 4.2vw, var(--text-4xl))/1.03 var(--font-ui);
  letter-spacing: -.055em;
}

.about-section-head p {
  max-width: 610px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

/* =========================================================
   ORIGIN STORY
   ========================================================= */

.about-story {
  background:
    color-mix(in srgb, var(--brand) 3%, var(--background));
  border-block: 1px solid var(--border);
}

.about-story .about-section-head::after {
  content: "01 / ORIGIN";
}

.about-story-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr);
  gap: 60px;
  align-items: start;
}

.about-story-copy p {
  margin: 0 0 var(--text-lg);
  max-width: 640px;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.75 var(--font-body);
}

.about-story-copy p:last-of-type {
  margin-bottom: 0;
}

.about-story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--text-xs);
  margin-top: 26px;
}

.about-quote {
  padding: var(--text-xl);
  border-left: 2px solid var(--brand);
  border-radius: 0 var(--text-sm) var(--text-sm) 0;
  background: color-mix(in srgb, var(--brand) 5%, var(--card));
}

.about-quote p {
  margin: 0;
  color: var(--text-primary);
  font: 500 var(--text-md)/1.6 var(--font-body);
}

.about-quote cite {
  display: block;
  margin-top: var(--text-md);
  color: var(--text-secondary);
  font: 500 var(--text-xs) var(--font-mono);
  font-style: normal;
  letter-spacing: .06em;
}

.about-principles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--text-xs);
}

.about-principle {
  position: relative;
  min-height: 205px;
  padding: 22px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--text-md);
  background: var(--card);
  transition:
    transform .28s ease,
    border-color .28s ease,
    box-shadow .28s ease;
}

.about-principle::before {
  content: "";
  position: absolute;
  top: var(--text-md);
  right: var(--text-md);
  width: var(--text-3xl);
  height: var(--text-2xl);
  background:
    linear-gradient(
      90deg,
      transparent 0 65%,
      color-mix(in srgb, var(--brand) 20%, transparent) 65% 67%,
      transparent 67%
    ),
    linear-gradient(
      color-mix(in srgb, var(--brand) 20%, transparent) 1px,
      transparent 1px
    );
  background-size: 100% 100%, 100% var(--text-xs);
}

.about-principle::after {
  content: attr(data-number);
  position: absolute;
  right: var(--text-md);
  top: var(--text-3xl);
  color: color-mix(in srgb, var(--foreground) 6%, transparent);
  font: 700 var(--text-4xl) var(--font-ui);
  letter-spacing: -.08em;
}

.about-principle:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--brand) 32%, transparent);
  box-shadow: var(--shadow-md);
}

.about-card-meta {
  position: relative;
  z-index: 2;
  color: var(--brand);
  font: 600 var(--text-xs) var(--font-mono);
  letter-spacing: .12em;
}

.about-principle h3 {
  position: relative;
  z-index: 2;
  margin: var(--text-4xl) 0 0;
  font: 600 var(--text-md)/1.25 var(--font-ui);
  letter-spacing: -.025em;
}

.about-principle p {
  position: relative;
  z-index: 2;
  margin: var(--text-xs) 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.65 var(--font-body);
}

.about-content-section {
  padding-top: 45px;
}

.about-content-section .about-section-head::after {
  content: "02 / PUBLISHING";
}

.about-content-list {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--text-md);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--brand) 2.5%, transparent),
      transparent 25%,
      transparent 75%,
      color-mix(in srgb, var(--brand) 2.5%, transparent)
    ),
    var(--card);
}

.about-content-list::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 55px;
  width: 1px;
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}

.about-content-row {
  position: relative;
  display: grid;
  grid-template-columns: 55px minmax(0, 1fr) auto 26px;
  gap: var(--text-xl);
  align-items: center;
  min-height: 82px;
  padding: var(--text-sm) var(--text-xl);
  border-bottom: 1px solid var(--border);
  transition:
    background .22s ease,
    padding .22s ease;
}

.about-content-row:last-child {
  border-bottom: 0;
}

.about-content-row::after {
  content: "";
  position: absolute;
  right: var(--text-4xl);
  top: 50%;
  width: var(--text-xl);
  height: 1px;
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}

.about-content-row:hover {
  padding-left: 25px;
  background: color-mix(in srgb, var(--brand) 4.5%, transparent);
}

.about-content-number {
  color: var(--brand);
  font: 500 var(--text-xs) var(--font-mono);
}

.about-content-main h3 {
  margin: 0;
  font: 600 var(--text-sm) var(--font-ui);
}

.about-content-main p {
  max-width: 680px;
  margin: 5px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

.about-content-tag {
  padding: 5px var(--text-xs);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font: 500 var(--text-xs) var(--font-mono);
  letter-spacing: .06em;
}

.about-content-arrow {
  color: var(--brand);
  font: 500 var(--text-sm) var(--font-mono);
  opacity: .5;
  transition: transform .22s ease, opacity .22s ease;
}

.about-content-row:hover .about-content-arrow {
  transform: translateX(4px);
  opacity: 1;
}

.about-standards {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 82px 0;
  background: var(--background-base);
  color: var(--foreground);
}

.about-standards::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -3;
  background-image:
    radial-gradient(
      circle at 1px 1px,
      color-mix(in srgb, var(--foreground) 7.5%, transparent) 1px,
      transparent 1.25px
    ),
    linear-gradient(
      color-mix(in srgb, var(--brand) 5.5%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--brand) 5.5%, transparent) 1px,
      transparent 1px
    );
  background-size:
    var(--text-xl) var(--text-xl),
    var(--text-display) var(--text-display),
    var(--text-display) var(--text-display);
  opacity: .9;
}

.about-standards::after {
  content: "";
  position: absolute;
  width: 760px;
  height: 440px;
  right: -210px;
  top: -150px;
  z-index: -2;
  background:
    linear-gradient(
      156deg,
      transparent 45%,
      color-mix(in srgb, var(--brand) 13%, transparent) 45.2%,
      transparent 45.55%
    ),
    radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--brand) 15%, transparent),
      transparent 68%
    );
  pointer-events: none;
}

.about-standards .about-section-head h2 {
  color: var(--foreground);
}

.about-standards .about-section-head p {
  color: var(--text-secondary);
}

.about-standards .about-section-head::after {
  content: "03 / TRUST";
  color: color-mix(in srgb, var(--brand) 28%, transparent);
}

.about-standards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--text-xs);
}

.about-standard {
  position: relative;
  min-height: 165px;
  padding: 21px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--foreground) 9%, transparent);
  border-radius: var(--text-sm);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--foreground) 4.5%, transparent),
      color-mix(in srgb, var(--foreground) 1.8%, transparent)
    );
  transition:
    transform .28s ease,
    background .28s ease,
    border-color .28s ease;
}

.about-standard::before {
  content: "";
  position: absolute;
  right: -15px;
  bottom: var(--text-xl);
  width: 105px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--brand) 38%, transparent),
    transparent
  );
  transform: rotate(-10deg);
}

.about-standard::after {
  content: "+";
  position: absolute;
  right: 17px;
  top: var(--text-md);
  color: color-mix(in srgb, var(--brand) 35%, transparent);
  font: 500 var(--text-xs) var(--font-mono);
}

.about-standard:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--brand) 30%, transparent);
  background: color-mix(in srgb, var(--brand) 5.5%, transparent);
}

.about-standard-meta {
  color: var(--brand);
  font: 500 var(--text-xs) var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.about-standard h3 {
  margin: 28px 0 0;
  color: var(--text-primary);
  font: 600 var(--text-sm) var(--font-ui);
}

.about-standard p {
  margin: var(--text-xs) 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

/* =========================================================
   TEAM
   ========================================================= */

.about-team {
  background: color-mix(in srgb, var(--brand) 3%, var(--background));
  border-block: 1px solid var(--border);
}

.about-team .about-section-head::after {
  content: "04 / TEAM";
}

.about-team-grid,
.about-work-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--text-xs);
}

.about-team-card,
.about-work-card {
  position: relative;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--text-md);
  background: var(--card);
  transition:
    transform .28s ease,
    border-color .28s ease,
    box-shadow .28s ease;
}

.about-team-card:hover,
.about-work-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--brand) 28%, transparent);
  box-shadow: var(--shadow-md);
}

.about-team-card h3,
.about-work-card h3 {
  margin: 0;
  font: 600 var(--text-md)/1.3 var(--font-ui);
  letter-spacing: -.025em;
}

.about-team-card p,
.about-work-card p {
  margin: var(--text-xs) 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.65 var(--font-body);
}

.about-work-card .about-standard-meta {
  display: block;
  margin-bottom: var(--text-lg);
}

.about-work-card .about-button {
  margin-top: var(--text-xl);
}

.about-audience {
  padding-bottom: 82px;
}

.about-audience .about-section-head::after {
  content: "05 / READERS";
}

.about-audience-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--text-xs);
}

.about-audience-card {
  position: relative;
  min-height: 155px;
  padding: var(--text-xl);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--text-sm);
  background: var(--card);
  transition:
    transform .28s ease,
    border-color .28s ease,
    box-shadow .28s ease;
}

.about-audience-card::before {
  content: "";
  position: absolute;
  right: var(--text-md);
  top: 17px;
  width: 42px;
  height: var(--text-lg);
  background:
    linear-gradient(
      90deg,
      transparent 0 20%,
      color-mix(in srgb, var(--brand) 18%, transparent) 20% 23%,
      transparent 23% 46%,
      color-mix(in srgb, var(--brand) 12%, transparent) 46% 49%,
      transparent 49% 72%,
      color-mix(in srgb, var(--brand) 18%, transparent) 72% 75%,
      transparent 75%
    );
}

.about-audience-card::after {
  content: "";
  position: absolute;
  left: var(--text-xl);
  right: var(--text-xl);
  bottom: var(--text-md);
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--brand) 15%, transparent),
    transparent 70%
  );
}

.about-audience-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--brand) 28%, transparent);
  box-shadow: var(--shadow-md);
}

.about-audience-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--text-3xl);
  height: var(--text-3xl);
  margin-bottom: 25px;
  border: 1px solid color-mix(in srgb, var(--brand) 20%, transparent);
  border-radius: var(--text-xs);
  background: color-mix(in srgb, var(--brand) 7.5%, transparent);
  color: var(--brand);
  font: 600 var(--text-md) var(--font-ui);
}

.about-audience-card h3 {
  margin: 0;
  font: 600 var(--text-sm) var(--font-ui);
}

.about-audience-card p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

/* =========================================================
   WORK WITH US
   ========================================================= */

.about-work {
  padding-bottom: 92px;
}

.about-work .about-section-head::after {
  content: "06 / CONTACT";
}

.about-button {
  display: inline-flex;
  align-items: center;
  gap: var(--text-xs);
  min-height: 46px;
  padding: 0 19px;
  border-radius: var(--text-xs);
  text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);
  transition:
    transform .22s ease,
    background .22s ease,
    border-color .22s ease;
}

.about-button:hover {
  transform: translateY(-2px);
}

.about-button-primary {
  background: var(--brand);
  color: white;
}

.about-button-primary:hover {
  background: var(--brand-hover);
}

.about-button-secondary {
  border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
  background: color-mix(in srgb, var(--foreground) 3.5%, transparent);
  color: var(--text-secondary);
}

.about-button-secondary:hover {
  border-color: color-mix(in srgb, var(--brand) 30%, transparent);
}

@media (max-width: 980px) {
  .about-hero-grid,
  .about-story-grid {
    grid-template-columns: 1fr;
    gap: var(--text-3xl);
  }

  .about-signal {
    max-width: 620px;
  }

  .about-principles {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-audience-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-team-grid,
  .about-work-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-section-head {
    grid-template-columns: 1fr;
    gap: var(--text-md);
  }

  .about-section-head::after {
    display: none;
  }

  .about-hero-tech::before {
    width: 430px;
  }

  .about-hero-tech::after {
    width: 360px;
  }
}

@media (max-width: 760px) {
  .about-container {
    width: min(calc(100% - var(--text-3xl)), var(--container));
  }

  .about-hero {
    min-height: auto;
    padding: 65px 0 58px;
  }

  .about-title {
    font-size: clamp(var(--text-3xl), 11vw, var(--text-4xl));
  }

  .about-hero-description {
    font-size: var(--text-sm);
  }

  .about-data-marker-02,
  .about-data-marker-03,
  .about-signal-point-2 {
    display: none;
  }

  .about-hero-tech::before {
    width: 310px;
    left: -20px;
    top: 27%;
  }

  .about-hero-tech::after {
    width: 280px;
    right: -70px;
    top: 72%;
  }

  .about-hero-line {
    width: 230px;
    left: 10%;
  }

  .about-signal {
    padding: var(--text-xl);
  }

  .about-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-stat {
    min-height: 96px;
    padding: 19px 17px;
  }

  .about-stat:nth-child(2) {
    border-right: 0;
  }

  .about-stat:nth-child(3) {
    border-left: 1px solid var(--border);
  }

  .about-stat strong {
    font-size: var(--text-xl);
  }

  .about-section {
    padding: 62px 0;
  }

  .about-section::after {
    left: var(--text-md);
    right: var(--text-md);
  }

  .about-principles,
  .about-standards-grid,
  .about-audience-grid,
  .about-team-grid,
  .about-work-grid {
    grid-template-columns: 1fr;
  }

  .about-principle {
    min-height: 190px;
  }

  .about-story-copy p {
    font-size: var(--text-sm);
  }

  .about-quote {
    padding: var(--text-lg);
  }

  .about-content-row {
    grid-template-columns: var(--text-3xl) minmax(0, 1fr) var(--text-xl);
    gap: var(--text-xs);
  }

  .about-content-tag {
    display: none;
  }

  .about-content-list::before {
    left: var(--text-3xl);
  }

  .about-content-row::after {
    display: none;
  }

  .about-standards {
    padding: 68px 0;
  }

  .about-work-card .about-button {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-principle,
  .about-standard,
  .about-audience-card,
  .about-team-card,
  .about-work-card,
  .about-content-row,
  .about-button {
    transition: none;
  }
}

html[data-theme="light"] .about-hero,
html[data-theme="light"] .about-standards {
  background: var(--surface);
  color: var(--foreground);
}

html[data-theme="light"] .about-hero::before,
html[data-theme="light"] .about-standards::before {
  opacity: .28;
}

html[data-theme="light"] .about-signal,
html[data-theme="light"] .about-standard {
  background: var(--card);
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}

html[data-theme="light"] .about-hero .about-title,
html[data-theme="light"] .about-standards .about-section-head h2 {
  color: var(--text-primary);
}

html[data-theme="light"] .about-hero-description,
html[data-theme="light"] .about-standards .about-section-head p {
  color: var(--text-secondary);
}

html[data-theme="light"] .about-button-secondary {
  border-color: var(--border-strong);
  background: var(--surface-2);
  color: var(--text-primary);
}

.about-hero-description,
.about-signal p,
.about-section-head p,
.about-principle p,
.about-story-copy p,
.about-content-main p,
.about-standard p,
.about-team-card p,
.about-work-card p,
.about-audience-card p {
  opacity: 1;
  text-shadow: none;
  text-wrap: pretty;
}
`;

export default function AboutPage() {
  return (
    <>
      <Script
        id="about-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <main className="about-page">
        {/* =====================================================
            HERO
            ===================================================== */}
        <section className="about-hero">
          <div className="about-hero-tech" aria-hidden="true">
            <span className="about-hero-line" />
            <span className="about-data-marker about-data-marker-01">01</span>
            <span className="about-data-marker about-data-marker-02">02</span>
            <span className="about-data-marker about-data-marker-03">03</span>
            <span className="about-signal-point about-signal-point-1" />
            <span className="about-signal-point about-signal-point-2" />
            <span className="about-signal-point about-signal-point-3" />
          </div>

          <div className="about-container about-hero-grid">
            <div className="about-hero-copy">
              <div className="about-kicker">Who we are</div>

              <h1 className="about-title">
                The AI publication that
                <br />
                actually <span>tests</span> before it
                <br />
                tells you.
              </h1>

              <p className="about-hero-description">
                AlloyPress is an independent AI editorial publication. We test
                AI tools hands-on, write about what we actually find, and help
                readers make better decisions without expensive trial and error.
              </p>
            </div>

            <aside
              className="about-signal"
              aria-label="AlloyPress editorial approach"
            >
              <div className="about-signal-label">The AlloyPress standard</div>

              <div className="about-signal-row">
                <span className="about-signal-number">01</span>
                <div>
                  <strong>Alloy</strong>
                  <p>A stronger mix of ideas, evidence, testing, and context.</p>
                </div>
              </div>

              <div className="about-signal-row">
                <span className="about-signal-number">02</span>
                <div>
                  <strong>Press</strong>
                  <p>
                    Information shared clearly, honestly, and with useful
                    context.
                  </p>
                </div>
              </div>

              <div className="about-signal-row">
                <span className="about-signal-number">03</span>
                <div>
                  <strong>Together</strong>
                  <p>
                    A practical editorial foundation for making AI less
                    intimidating.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* =====================================================
            STATS
            ===================================================== */}
        <section className="about-stats" aria-label="AlloyPress highlights">
          <div className="about-container about-stats-grid">
            {stats.map(([value, label]) => (
              <div className="about-stat" key={value}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            HOW WE STARTED
            ===================================================== */}
        <section className="about-section about-story">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">How we started</div>
                <h2>
                  Built by people who tested
                  <br />
                  <span className="about-accent">AI tools for a living.</span>
                </h2>
              </div>
            </div>

            <div className="about-story-grid">
              <div className="about-story-copy">
                {storyParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}

                <div className="about-story-tags">
                  {storyTags.map((tag) => (
                    <span className="about-content-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <blockquote className="about-quote">
                <p>
                  &ldquo;We kept running into the same problem. There was no
                  reliable, independent source that actually tested AI tools and
                  told you honestly which ones were worth using.&rdquo;
                </p>
                <cite>Abdullah, Co-founder, AlloyPress</cite>
              </blockquote>
            </div>
          </div>
        </section>

        {/* =====================================================
            MISSION
            ===================================================== */}
        <section className="about-section">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">Our mission</div>
                <h2>
                  AI info simplified
                  <br />
                  <span className="about-accent">for everyone.</span>
                </h2>
              </div>
            </div>

            <div className="about-principles">
              {principles.map((item) => (
                <article
                  className="about-principle"
                  data-number={item.number}
                  key={item.number}
                >
                  <div className="about-card-meta">
                    {item.number} · {item.label}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            WHAT WE PUBLISH
            ===================================================== */}
        <section className="about-section about-content-section">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">What we publish</div>
                <h2>
                  Six types of content,
                  <br />
                  <span className="about-accent">one standard.</span>
                </h2>
              </div>
            </div>

            <div className="about-content-list">
              {contentTypes.map(([number, title, text, tag]) => (
                <article className="about-content-row" key={number}>
                  <div className="about-content-number">{number}</div>

                  <div className="about-content-main">
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>

                  <span className="about-content-tag">{tag}</span>
                  <span className="about-content-arrow" aria-hidden="true">
                    ↗
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            EDITORIAL STANDARDS
            ===================================================== */}
        <section className="about-standards">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">Editorial standards</div>
                <h2>
                  How we
                  <br />
                  <span className="about-accent">maintain trust.</span>
                </h2>
              </div>
            </div>

            <div className="about-standards-grid">
              {standards.map(([number, label, title, text]) => (
                <article className="about-standard" key={number}>
                  <div className="about-standard-meta">
                    {number} · {label}
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            TEAM
            ===================================================== */}
        <section className="about-section about-team">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">Our team</div>
                <h2>
                  A dedicated team
                  <br />
                  <span className="about-accent">behind every article.</span>
                </h2>
              </div>

              <p>
                AlloyPress is built and run by a team with real professional
                backgrounds in the domains that matter for evaluating AI tools.
                Every article, review, and test comes from people who have
                worked in these areas, not generalists producing content at
                scale.
              </p>
            </div>

            <div className="about-team-grid">
              {team.map(([title, text]) => (
                <article className="about-team-card" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            AUDIENCE
            ===================================================== */}
        <section className="about-section about-audience">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">Our audience</div>
                <h2>
                  Who reads
                  <br />
                  <span className="about-accent">AlloyPress?</span>
                </h2>
              </div>
            </div>

            <div className="about-audience-grid">
              {audiences.map(([icon, title, text]) => (
                <article className="about-audience-card" key={title}>
                  <div className="about-audience-icon" aria-hidden="true">
                    {icon}
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            WORK WITH US
            ===================================================== */}
        <section className="about-section about-work" id="work-with-us">
          <div className="about-container">
            <div className="about-section-head">
              <div>
                <div className="about-kicker">Work with us</div>
                <h2>
                  Three ways to{" "}
                  <span className="about-accent">work with us.</span>
                </h2>
              </div>

              <p>
                Whether you want your tool covered, reviewed in depth, or need
                an ongoing testing partner, each path is separate and has a
                clear process behind it.
              </p>
            </div>

            <div className="about-work-grid">
              {workPaths.map((path) => (
                <article className="about-work-card" key={path.label}>
                  <span className="about-standard-meta">{path.label}</span>
                  <h3>{path.title}</h3>
                  <p>{path.text}</p>

                  <Link
                    href={path.href}
                    className={
                      path.primary
                        ? "about-button about-button-primary"
                        : "about-button about-button-secondary"
                    }
                  >
                    {path.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}