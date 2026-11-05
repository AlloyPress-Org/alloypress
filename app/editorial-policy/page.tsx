import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { payloadFetch } from "@/lib/payload";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema } from "@/lib/seo/schema";

// Cache this page for 7 days (static + ISR), same approach as the other pages.
// Must be a literal number: 60 * 60 * 24 * 7 = 604800.
export const revalidate = 604800;

const PAGE_SLUG = "editorial-policy";
const CANONICAL = "/editorial-policy";
const FALLBACK_TITLE = "Editorial Policy | AlloyPress";
const FALLBACK_DESC =
  "How AlloyPress chooses, tests and reviews AI tools, works with AI brands, and keeps every verdict independent.";

const SEO_SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://alloypress.com";
const CONTACT_EMAIL = "contact@alloypress.com";

// Update this whenever the policy copy changes.
const LAST_UPDATED = "November 2026";

// ============================================================
// METADATA
// ============================================================

type PageSeoDoc = {
  seo?: {
    title?: string | null;
    description?: string | null;
    openGraphImage?: { url?: string | null } | null;
  } | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await payloadFetch<{ docs?: PageSeoDoc[] }>(
    `/pages?where[slug][equals]=${PAGE_SLUG}&where[status][equals]=published&limit=1&depth=1&select[seo]=true`,
    { strict: false, next: { revalidate: 604800, tags: ["pages", `page:${PAGE_SLUG}`] } },
  );
  const seo = data?.docs?.[0]?.seo;
  const img = seo?.openGraphImage?.url;

  return buildPageMetadata({
    title: seo?.title?.trim() || FALLBACK_TITLE,
    description: seo?.description?.trim() || FALLBACK_DESC,
    canonicalPath: CANONICAL,
    imageUrl: img
      ? img.startsWith("http")
        ? img
        : `${SEO_SITE}${img}`
      : `${SEO_SITE}/og-default.png`,
  });
}

// ============================================================
// SCHEMA
// ============================================================

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@graph": [
    createBreadcrumbSchema([
      { name: "Home", url: SEO_SITE },
      { name: "Editorial Policy", url: `${SEO_SITE}${CANONICAL}` },
    ]),
  ],
};

// ============================================================
// CONTENT
// Table of contents. Every id must match a section id below.
// ============================================================

const toc = [
  ["promise", "Our promise"],
  ["cover", "What we cover"],
  ["independence", "Independence"],
  ["brands", "Working with AI brands"],
  ["money", "How we make money"],
  ["ai", "How we use AI"],
  ["accuracy", "Accuracy and updates"],
  ["corrections", "Corrections"],
  ["contact", "Contact"],
] as const;

function Tick() {
  return (
    <svg
      className="ep-tick"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="9" r="7.5" opacity="0.35" />
      <path d="M5.8 9.2l2.2 2.2 4.2-4.6" />
    </svg>
  );
}

function Head({ n, children }: { n: number; children: string }) {
  return (
    <div className="ep-sec-head">
      <span className="ep-num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <h2>{children}</h2>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function EditorialPolicyPage() {
  return (
    <main className="ep-page">
      <Script
        id="editorial-policy-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* HERO */}
      <header className="ep-hero">
        <div className="ep-grid" aria-hidden="true" />
        <div className="ep-wrap">
          <div className="ep-hero-copy">
            <p className="ep-eyebrow">
              <span className="ep-dot" aria-hidden="true" />
              Editorial policy
            </p>
            <h1 className="ep-h1">Our editorial policy</h1>
            <p className="ep-lead">
              How we decide what to cover, how we keep it accurate, and how we keep our verdicts
              independent. Readers come first in every decision we make.
            </p>
            <p className="ep-updated">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
      </header>

      {/* TOC + POLICY */}
      <div className="ep-body-sec">
        <div className="ep-wrap ep-layout">
          <nav className="ep-toc" aria-label="On this page">
            <p className="ep-toc-title">On this page</p>
            <ol>
              {toc.map(([id, label], i) => (
                <li key={id}>
                  <a href={`#${id}`}>
                    <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="ep-main">
            {/* 1 */}
            <section className="ep-sec" id="promise" aria-labelledby="promise-h">
              <Head n={1}>Our promise to readers</Head>
              <div className="ep-callout ep-callout-lg">
                <p>
                  We test every tool we recommend before we write about it, and we write what we
                  see. Our job is to help you choose the right AI tool, so every article is written
                  for you, not for the brands we cover.
                </p>
              </div>
            </section>

            {/* 2 */}
            <section className="ep-sec" id="cover">
              <Head n={2}>What we cover, and what we don’t</Head>
              <div className="ep-prose">
                <p>
                  Our team decides which tools to test based on what readers are looking for, how
                  useful a tool is, and how it compares with others in its category.
                </p>
                <p>
                  We don’t cover tools that make claims we can’t verify, put users’ data or money
                  at risk, or exist mainly to mislead. A tool being well known, new or willing to
                  pay doesn’t guarantee coverage.
                </p>
              </div>
            </section>

            {/* 3 */}
            <section className="ep-sec" id="independence">
              <Head n={3}>Our independence</Head>
              <div className="ep-cards">
                <div className="ep-card">
                  <h3>No paid rankings or verdicts.</h3>
                  <p>
                    No tool can pay to be ranked higher, reviewed more kindly, or have a weakness
                    left out.
                  </p>
                </div>
                <div className="ep-card">
                  <h3>Our team makes every editorial decision.</h3>
                  <p>
                    What we test, how we test it, and what we write are decided by AlloyPress alone.
                  </p>
                </div>
                <div className="ep-card">
                  <h3>Free access doesn’t buy anything.</h3>
                  <p>
                    Brands sometimes give us test accounts or credits so we can test paid features.
                    It doesn’t change the verdict.
                  </p>
                </div>
              </div>
            </section>

            {/* 4 */}
            <section className="ep-sec" id="brands">
              <Head n={4}>Working with AI brands</Head>
              <div className="ep-prose">
                <p>
                  AI brands can ask us to schedule a dedicated review of their tool or to join our
                  testing partnership. Here’s how that works:
                </p>
              </div>
              <ul className="ep-checks">
                <li>
                  <Tick />
                  <span>
                    The fee covers our testing time and moves the tool up our testing queue. It does
                    not buy a positive review or a ranking.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>Brands don’t see or approve articles before they’re published.</span>
                </li>
                <li>
                  <Tick />
                  <span>
                    After publishing, a brand can point out a factual error. We check it against our
                    testing and correct it if it’s wrong. Opinions and verdicts stay ours.
                  </span>
                </li>
                <li className="ep-hl">
                  <Tick />
                  <span>
                    <strong>Problems we find are always published.</strong> If testing turns up bugs,
                    limits or difficulties, they go in the article. Alongside, we share what we found
                    with the brand so they can fix it. We never hide findings.
                  </span>
                </li>
              </ul>
            </section>

            {/* 5 */}
            <section className="ep-sec" id="money">
              <Head n={5}>How we make money</Head>
              <div className="ep-callout">
                <p>
                  <strong>Testing partnerships are our main source of income.</strong> We test AI
                  tools in depth for the companies that make them, share detailed reports on bugs,
                  usability and missing features, and help them improve their products over time.
                  Some of the brands we work with are among the best known in AI.
                </p>
              </div>
              <div className="ep-prose">
                <p>
                  We also earn from the scheduled reviews and list inclusions described above, and
                  from ads on our site.
                </p>
                <p>
                  Occasionally we add an affiliate link where it genuinely helps readers. We never
                  push them, and like everything else here, they never decide what we test, how we
                  rank tools, or what we write.
                </p>
              </div>
            </section>

            {/* 6 */}
            <section className="ep-sec" id="ai">
              <Head n={6}>How we use AI in our work</Head>
              <div className="ep-prose">
                <p>
                  We’re an AI publication, so yes, we use AI tools. Here’s where they fit, and where
                  they don’t.
                </p>
              </div>
              <div className="ep-cards ep-cards-2">
                <div className="ep-card">
                  <h3>Where we use AI</h3>
                  <p>
                    To help with research, summarise long material, compare information, and
                    organise findings into tables.
                  </p>
                </div>
                <div className="ep-card">
                  <h3>Where we don’t</h3>
                  <p>
                    Our team plans every article by hand, based on what readers are searching for
                    and what they need. The testing is ours, the verdicts are ours, and the final
                    word on every article is ours.
                  </p>
                </div>
              </div>
              <div className="ep-prose ep-after">
                <p>
                  Screenshots, outputs and results in our articles come from our own testing unless
                  we say otherwise.
                </p>
              </div>
            </section>

            {/* 7 */}
            <section className="ep-sec" id="accuracy">
              <Head n={7}>Accuracy and updates</Head>
              <ul className="ep-checks ep-checks-2">
                <li>
                  <Tick />
                  <span>
                    Features, pricing and claims are checked in the tool itself during testing.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    Our team reviews every article before it’s published, and keeps reviewing it
                    after.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    When a tool changes its features or pricing, we retest it and update the
                    article.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    Every article shows when it was last tested, so you can see how current it is.
                  </span>
                </li>
              </ul>
              <div className="ep-box">
                <p>
                  For the full testing process, see{" "}
                  <Link href="/how-we-test">How we test AI tools</Link>.
                </p>
              </div>
            </section>

            {/* 8 */}
            <section className="ep-sec" id="corrections">
              <Head n={8}>Corrections</Head>
              <div className="ep-banner">
                <p>
                  If you find a mistake in one of our articles, tell us. We check every report and
                  correct confirmed errors within 10 business days. When a correction changes a
                  verdict or a key fact, we add a short note at the end of the article saying what
                  changed and when.
                </p>
                <Link className="ep-btn" href="/contact-us">
                  Report a correction
                </Link>
              </div>
            </section>

            {/* 9 */}
            <section className="ep-sec" id="contact">
              <Head n={9}>Contact</Head>
              <div className="ep-prose">
                <p>
                  Questions about this policy? Email us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use our{" "}
                  <Link href="/contact-us">contact page</Link>.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// STYLES (scoped to .ep-page, theme-aware through CSS variables)
// Note: no overflow rule on .ep-page, so the sticky table of
// contents keeps working.
// ============================================================

const styles = `
html { scroll-behavior: smooth; }

.ep-page {
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-body);
}
.ep-page *,
.ep-page *::before,
.ep-page *::after { box-sizing: border-box; }
.ep-page h1, .ep-page h2, .ep-page h3,
.ep-page p, .ep-page ul, .ep-page ol { margin: 0; padding: 0; }
.ep-page ul, .ep-page ol { list-style: none; }

.ep-page .ep-wrap {
  width: min(1160px, calc(100% - 48px));
  margin-inline: auto;
}

/* Eyebrow */
.ep-page .ep-eyebrow {
  display: flex; align-items: center; gap: 8px;
  color: var(--brand);
  font: 700 11px/1.2 var(--font-mono);
  letter-spacing: 0.12em; text-transform: uppercase;
}
.ep-page .ep-dot {
  width: 6px; height: 6px; flex: none; border-radius: 50%;
  background: currentColor; box-shadow: 0 0 0 3px var(--brand-soft);
}

/* Hero */
.ep-page .ep-hero {
  position: relative; overflow: hidden; isolation: isolate;
  padding: 80px 0 56px;
  background:
    radial-gradient(900px 400px at 70% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent),
    var(--background-base);
  border-bottom: 1px solid var(--border);
}
.ep-page .ep-grid {
  position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0.55;
  background-image:
    linear-gradient(color-mix(in srgb, var(--text-primary) 4.5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--text-primary) 4.5%, transparent) 1px, transparent 1px);
  background-size: 52px 52px;
  -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
}
html[data-theme="light"] .ep-page .ep-grid { opacity: 0.22; }
.ep-page .ep-hero-copy { max-width: 760px; }
.ep-page .ep-h1 {
  margin: 18px 0 20px;
  font: 700 clamp(38px, 5.2vw, 58px) / 1.06 var(--font-ui);
  letter-spacing: -0.055em; text-wrap: balance;
}
.ep-page .ep-lead {
  color: var(--text-secondary); font: 400 17px/1.7 var(--font-body);
}
.ep-page .ep-updated {
  margin-top: 20px; color: var(--text-muted);
  font: 500 13px/1.4 var(--font-mono);
}

/* Layout */
.ep-page .ep-body-sec { padding: 56px 0 96px; }
.ep-page .ep-layout {
  display: grid; grid-template-columns: 250px minmax(0, 1fr);
  gap: 64px; align-items: start;
}

/* TOC */
.ep-page .ep-toc {
  position: sticky; top: calc(var(--header-height, 72px) + 24px);
  padding: 20px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card);
}
.ep-page .ep-toc-title {
  margin-bottom: 12px; color: var(--text-muted);
  font: 500 12px/1.4 var(--font-mono);
  letter-spacing: 0.1em; text-transform: uppercase;
}
.ep-page .ep-toc ol { display: grid; gap: 2px; }
.ep-page .ep-toc a {
  display: flex; gap: 10px; align-items: baseline;
  padding: 8px 10px; border-radius: 8px;
  color: var(--text-secondary); text-decoration: none;
  font: 500 14px/1.4 var(--font-ui);
  transition: background 0.2s ease, color 0.2s ease;
}
.ep-page .ep-toc a span {
  color: var(--text-muted); font: 500 11px/1 var(--font-mono);
}
.ep-page .ep-toc a:hover,
.ep-page .ep-toc a:focus-visible {
  background: var(--brand-soft); color: var(--brand); outline: none;
}
.ep-page .ep-toc a:hover span,
.ep-page .ep-toc a:focus-visible span { color: var(--brand); }

/* Main */
.ep-page .ep-main { max-width: 780px; min-width: 0; }
.ep-page .ep-sec {
  padding: 0 0 56px; margin-bottom: 56px;
  border-bottom: 1px solid var(--border);
  scroll-margin-top: calc(var(--header-height, 72px) + 24px);
}
.ep-page .ep-sec:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }
.ep-page .ep-sec-head {
  display: flex; align-items: center; gap: 14px; margin-bottom: 22px;
}
.ep-page .ep-num {
  flex: none; padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--brand-subtle); background: var(--brand-soft);
  color: var(--brand); font: 700 12px/1 var(--font-mono); letter-spacing: 0.06em;
}
.ep-page .ep-sec-head h2 {
  font: 700 clamp(22px, 2.6vw, 28px) / 1.25 var(--font-ui);
  letter-spacing: -0.03em; text-wrap: balance;
}

/* Body copy */
.ep-page .ep-prose { display: grid; gap: 16px; max-width: 68ch; }
.ep-page .ep-prose p,
.ep-page .ep-callout p,
.ep-page .ep-banner p {
  color: var(--text-secondary); font: 400 16.5px/1.8 var(--font-body);
}
.ep-page .ep-after { margin-top: 20px; }
.ep-page strong { color: var(--text-primary); font-weight: 700; }
.ep-page .ep-prose a,
.ep-page .ep-box a {
  color: var(--brand); text-decoration: underline; text-underline-offset: 3px;
  transition: color 0.2s ease;
}
.ep-page .ep-prose a:hover,
.ep-page .ep-box a:hover { color: var(--brand-hover); }

/* Callouts */
.ep-page .ep-callout {
  margin-bottom: 20px; padding: 22px 24px;
  border: 1px solid var(--brand-subtle); border-left: 3px solid var(--brand);
  border-radius: 14px; background: var(--brand-soft);
}
.ep-page .ep-callout p { color: var(--text-primary); }
.ep-page .ep-callout-lg { margin-bottom: 0; padding: 28px 30px; }
.ep-page .ep-callout-lg p { font-size: 18px; line-height: 1.75; font-weight: 500; }

/* Cards */
.ep-page .ep-cards {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
}
.ep-page .ep-cards-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ep-page .ep-card {
  padding: 24px;
  border: 1px solid var(--border); border-radius: 16px; background: var(--card);
}
.ep-page .ep-card h3 {
  margin-bottom: 10px; color: var(--text-primary);
  font: 700 17px/1.4 var(--font-ui); letter-spacing: -0.02em;
}
.ep-page .ep-card p {
  color: var(--text-secondary); font: 400 15px/1.7 var(--font-body);
}

/* Check lists */
.ep-page .ep-checks { display: grid; gap: 12px; margin-top: 20px; }
.ep-page .ep-checks-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 0;
}
.ep-page .ep-checks li {
  display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 14px; align-items: start;
  padding: 16px 18px;
  border: 1px solid var(--border); border-radius: 14px; background: var(--card);
  color: var(--text-secondary); font: 400 15.5px/1.7 var(--font-body);
}
.ep-page .ep-checks li.ep-hl {
  border-color: var(--brand-subtle); background: var(--brand-soft);
  color: var(--text-primary);
}
.ep-page .ep-tick { margin-top: 4px; color: var(--brand); }

/* Link box */
.ep-page .ep-box {
  margin-top: 20px; padding: 18px 22px;
  border: 1px solid var(--border); border-radius: 12px; background: var(--card);
}
.ep-page .ep-box p {
  color: var(--text-secondary); font: 400 15px/1.7 var(--font-body);
}

/* Corrections banner */
.ep-page .ep-banner {
  display: grid; gap: 22px; justify-items: start; padding: 28px 30px;
  border: 1px solid var(--brand-subtle); border-radius: 16px;
  background:
    radial-gradient(500px 200px at 100% 0%, var(--brand-soft), transparent),
    var(--card);
}

/* Button */
.ep-page .ep-btn {
  min-height: 48px; display: inline-flex; align-items: center; justify-content: center;
  padding: 0 24px; white-space: nowrap;
  border: 1px solid var(--brand); border-radius: var(--radius-sm);
  background: var(--brand); color: #fff; text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.ep-page .ep-btn:hover {
  transform: translateY(-2px); border-color: var(--brand-hover);
  background: var(--brand-hover); color: #fff; box-shadow: var(--shadow-green);
}
.ep-page .ep-btn:active { transform: translateY(0); }
.ep-page .ep-btn:focus-visible,
.ep-page .ep-prose a:focus-visible,
.ep-page .ep-box a:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }

/* Responsive */
@media (max-width: 1024px) {
  .ep-page .ep-layout { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  .ep-page .ep-toc {
    position: sticky; top: var(--header-height, 0px); z-index: 20;
    padding: 8px 0; border-width: 0 0 1px; border-radius: 0;
    margin-inline: -24px; padding-inline: 24px;
    background: color-mix(in srgb, var(--background) 90%, transparent);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  }
  .ep-page .ep-toc-title { display: none; }
  .ep-page .ep-toc ol {
    display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
  }
  .ep-page .ep-toc ol::-webkit-scrollbar { display: none; }
  .ep-page .ep-toc a {
    white-space: nowrap; border-radius: 999px; padding: 9px 14px;
  }
  .ep-page .ep-toc a span { display: none; }
  .ep-page .ep-sec { scroll-margin-top: calc(var(--header-height, 0px) + 72px); }
}
@media (max-width: 760px) {
  .ep-page .ep-cards,
  .ep-page .ep-cards-2,
  .ep-page .ep-checks-2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .ep-page .ep-wrap { width: calc(100% - 32px); }
  .ep-page .ep-toc { margin-inline: -16px; padding-inline: 16px; }
  .ep-page .ep-hero { padding: 56px 0 40px; }
  .ep-page .ep-body-sec { padding: 32px 0 64px; }
  .ep-page .ep-sec { padding-bottom: 40px; margin-bottom: 40px; }
  .ep-page .ep-callout-lg { padding: 22px 20px; }
  .ep-page .ep-callout-lg p { font-size: 16.5px; }
  .ep-page .ep-banner { padding: 24px 20px; }
  .ep-page .ep-btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .ep-page * { transition: none !important; }
}
`;