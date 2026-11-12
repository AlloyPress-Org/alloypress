import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";

import { payloadFetch } from "@/lib/payload";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema } from "@/lib/seo/schema";

// Cache this page for 7 days (static + ISR), same approach as the other pages.
// Must be a literal number: 60 * 60 * 24 * 7 = 604800.
export const revalidate = 604800;

const PAGE_SLUG = "how-we-test";
const CANONICAL = "/how-we-test";
const FALLBACK_TITLE = "How We Test AI Tools | AlloyPress";
const FALLBACK_DESC =
  "Every AI tool on AlloyPress is tested hands-on by our team. See what we check, how we test reviews, comparisons and guides, and how we stay independent.";

const SEO_SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://alloypress.com";

// Update this whenever the page copy changes.
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
      { name: "How We Test", url: `${SEO_SITE}${CANONICAL}` },
    ]),
  ],
};

// ============================================================
// CONTENT
// ============================================================

const stats = [
  ["300+", "AI tools tested hands-on"],
  ["300K+", "Citations in Google AI Overviews and AI Mode, last 6 months"],
  ["190+", "Countries our readers come from"],
  ["0%", "Paid rankings or verdicts. Ever."],
] as const;

const toc = [
  ["who-tests", "Who tests"],
  ["what-we-check", "What we check"],
  ["by-type", "By article type"],
  ["staying-current", "Staying current"],
  ["independence", "Independence"],
] as const;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const checks: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Features",
    text: "We use the features that matter for the tool’s main job and note which ones work as promised.",
    icon: (
      <Icon>
        <rect x="3" y="3" width="6" height="6" rx="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </Icon>
    ),
  },
  {
    title: "Pricing and plans",
    text: "We check what each plan includes, what the free tier really allows, and keep pricing updated as it changes.",
    icon: (
      <Icon>
        <path d="M10 2v16M14 5.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.7c0 3.8 8 2 8 5.8 0 1.6-1.8 2.8-4 2.8s-4-1.2-4-2.7" />
      </Icon>
    ),
  },
  {
    title: "Use cases",
    text: "We say who the tool is right for, and who should look at something else.",
    icon: (
      <Icon>
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3.5 17c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      </Icon>
    ),
  },
  {
    title: "Output quality",
    text: "We judge the actual results: the images, videos, text or answers the tool produces.",
    icon: (
      <Icon>
        <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.8l5-.7z" />
      </Icon>
    ),
  },
  {
    title: "Bugs and limits",
    text: "Errors, slow spots, failed outputs and usage caps are written up, not left out.",
    icon: (
      <Icon>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.5M10 13.5v.01" />
      </Icon>
    ),
  },
  {
    title: "Claims vs reality",
    text: "When a tool’s marketing says more than the product does, we say so.",
    icon: (
      <Icon>
        <path d="M10 2l6.5 2.5v4.7c0 4-2.8 7-6.5 8.3-3.7-1.3-6.5-4.3-6.5-8.3V4.5z" />
        <path d="M7 10l2 2 4-4" />
      </Icon>
    ),
  },
];

const articleTypes: { title: string; example: string; points: string[] }[] = [
  {
    title: "Best-of lists",
    example: "e.g. Best AI Video Generators, Best AI Blog Writers, Best AI Humanizers",
    points: [
      "We test the leading tools in the category, not just the best-known names.",
      "Each tool is ranked on our own verdict, and we explain why it sits where it does.",
      "Every pick gets a clear “best for” label, so you can find the right one for your use, not just the overall winner.",
      "We share our own tips and tricks for getting better results from each tool.",
      "Its position reflects our testing, never a payment. Lists are rechecked, and tools that change or shut down are moved or removed.",
    ],
  },
  {
    title: "Reviews",
    example: "e.g. [Tool] Review",
    points: [
      "We test every important feature in detail, not only the headline one.",
      "We check pricing, plans and free-tier limits, and update them when they change.",
      "We write up what works, what doesn’t, the bugs we hit, and who the tool is and isn’t for.",
      "Every review notes the plan we tested on and when we tested it.",
    ],
  },
  {
    title: "Alternatives",
    example: "e.g. [Tool] Alternatives",
    points: [
      "We review the main tool in full first, so we know exactly what it does well and where it falls short.",
      "Then we look at why people switch: price, a missing feature, output quality, limits.",
      "We test alternatives against those needs, so each pick answers a real reason to switch, like “cheaper for long videos” or “better avatars”.",
    ],
  },
  {
    title: "Comparisons",
    example: "e.g. [Tool A] vs [Tool B]",
    points: [
      "Close rivals are tested head to head with the same prompts and tasks.",
      "We show the outputs side by side so you can judge the difference yourself.",
      "We compare pricing and value on the plans people actually choose.",
      "We end with a clear call: which tool to pick for which kind of user.",
    ],
  },
];

const connectSteps = [
  ["1", "Review", "A full, detailed test of one tool."],
  ["2", "Alternatives", "What to use instead, for each reason people switch."],
  ["3", "Comparisons", "Head to head for the close calls."],
  ["4", "Best-of list", "The whole category, ranked on everything we’ve tested."],
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="hwt-eyebrow">
      <span className="hwt-dot" aria-hidden="true" />
      {children}
    </p>
  );
}

function Tick() {
  return (
    <svg
      className="hwt-tick"
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

// ============================================================
// PAGE
// ============================================================

export default function HowWeTestPage() {
  return (
    <main className="hwt-page">
      <Script
        id="how-we-test-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* HERO */}
      <header className="hwt-hero">
        <div className="hwt-grid" aria-hidden="true" />
        <div className="hwt-wrap">
          <div className="hwt-hero-copy">
            <Eyebrow>How we test</Eyebrow>
            <h1 className="hwt-h1">
              How we test <em>AI tools</em>
            </h1>
            <p className="hwt-lead">
              Every tool we recommend on AlloyPress is used by our team before we write about it. We
              check its features, pricing, use cases, bugs and claims for ourselves, and we write
              what we see.
            </p>
            <p className="hwt-updated">Last updated: {LAST_UPDATED}</p>
          </div>

          <dl className="hwt-stats">
            {stats.map(([value, label]) => (
              <div className="hwt-stat" key={value}>
                <dt>{value}</dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* IN-PAGE NAV */}
      <nav className="hwt-toc" aria-label="On this page">
        <div className="hwt-wrap">
          <ul>
            {toc.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* WHO TESTS */}
      <section className="hwt-sec" id="who-tests">
        <div className="hwt-wrap hwt-split">
          <div className="hwt-split-head">
            <Eyebrow>Who tests</Eyebrow>
            <h2 className="hwt-h2">A dedicated team that uses the tools</h2>
          </div>
          <div className="hwt-prose">
            <p>
              AlloyPress is run by a dedicated team with years of experience in SEO, digital
              marketing, content, advertising, social media and business, and we have been using AI
              tools in that work for years. For more than a year, testing and writing about AI tools
              has been our full-time focus.
            </p>
            <p>
              We sign up for each tool and use it on real tasks, the way you would. We don’t rewrite
              vendor demos, press releases or feature lists.
            </p>
            <p className="hwt-callout">
              Each review notes the plan we tested on and when we tested it, so you know exactly
              what our verdict is based on.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE CHECK */}
      <section className="hwt-sec hwt-sec-alt" id="what-we-check">
        <div className="hwt-wrap">
          <div className="hwt-head">
            <Eyebrow>What we check</Eyebrow>
            <h2 className="hwt-h2">What we check in every tool</h2>
          </div>
          <div className="hwt-g3">
            {checks.map((item) => (
              <article className="hwt-card" key={item.title}>
                <div className="hwt-ico">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BY TYPE OF ARTICLE */}
      <section className="hwt-sec" id="by-type">
        <div className="hwt-wrap">
          <div className="hwt-head">
            <Eyebrow>By type of article</Eyebrow>
            <h2 className="hwt-h2">How testing works for each kind of article</h2>
            <p className="hwt-lead">
              Every article that recommends a tool is built on our own testing. Here’s what that
              testing looks like for each one.
            </p>
          </div>

          <div className="hwt-types">
            {articleTypes.map((type) => (
              <article className="hwt-card hwt-type" key={type.title}>
                <h3>{type.title}</h3>
                <p className="hwt-eg">{type.example}</p>
                <ul>
                  {type.points.map((point) => (
                    <li key={point}>
                      <Tick />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="hwt-connect">
            <div className="hwt-connect-head">
              <h3>How our articles connect</h3>
              <p>
                Our articles build on each other, so a recommendation in one is backed by testing in
                the others.
              </p>
            </div>
            <ol className="hwt-steps">
              {connectSteps.map(([num, label, text]) => (
                <li className="hwt-step" key={label}>
                  <span className="hwt-step-num" aria-hidden="true">
                    {num}
                  </span>
                  <p className="hwt-step-label">
                    <span className="hwt-sr">Step {num}: </span>
                    {label}
                  </p>
                  <p className="hwt-step-text">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* STAYING CURRENT + INDEPENDENCE */}
      <section className="hwt-sec hwt-sec-alt">
        <div className="hwt-wrap hwt-g2">
          <article className="hwt-card hwt-card-lg" id="staying-current">
            <Eyebrow>Staying current</Eyebrow>
            <h3>How we keep articles up to date</h3>
            <p>
              AI tools change fast. When a tool adds features, changes its pricing or drops
              something, we retest it and update the article. Every article shows the date it was
              last tested, so you know how fresh the verdict is.
            </p>
          </article>

          <article className="hwt-card hwt-card-lg hwt-card-accent" id="independence">
            <Eyebrow>Independence</Eyebrow>
            <h3>How we stay independent</h3>
            <p>
              No tool can pay for a ranking, a verdict or the words we write. AI brands can ask us
              to schedule a dedicated review sooner. That fee covers our testing time, and the
              verdict is always ours.
            </p>
            <p>
              If testing turns up problems, they go in the article, and we let the brand know what
              we found. We don’t hide anything. Occasional ads and affiliate links never decide what
              we test or what we say.
            </p>
            <p className="hwt-linkrow">
              <Link className="hwt-slink" href="/editorial-policy">
                Read our editorial policy →
              </Link>
            </p>
          </article>
        </div>
      </section>

      {/* CTAs */}
      <section className="hwt-cta-sec">
        <div className="hwt-wrap hwt-cta-stack">
          <div className="hwt-card hwt-banner">
            <div>
              <h3>Spot something wrong?</h3>
              <p>
                If a price, feature or detail in one of our articles is out of date, tell us. We
                check it and correct the article.
              </p>
            </div>
            <Link className="hwt-btn" href="/contact-us">
              Report a correction
            </Link>
          </div>

          <div className="hwt-strip">
            <p>
              <strong>Building an AI tool?</strong> We test tools independently, and every verdict
              is our own.
            </p>
            <div className="hwt-strip-links">
              <Link className="hwt-slink" href="/review-your-ai-tool">
                Get your tool reviewed
              </Link>
              <Link className="hwt-slink" href="/submit-your-ai-tool">
                Submit to a list
              </Link>
              <Link className="hwt-slink" href="/testing-partner">
                Testing partnership
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// STYLES (scoped to .hwt-page, theme-aware through CSS variables)
// ============================================================

const styles = `
html { scroll-behavior: smooth; }

.hwt-page {
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-body);
}
.hwt-page *,
.hwt-page *::before,
.hwt-page *::after { box-sizing: border-box; }
.hwt-page h1, .hwt-page h2, .hwt-page h3,
.hwt-page p, .hwt-page ul, .hwt-page ol, .hwt-page dl, .hwt-page dd { margin: 0; padding: 0; }
.hwt-page ul, .hwt-page ol { list-style: none; }
.hwt-page .hwt-sr {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* Layout */
.hwt-page .hwt-wrap {
  width: min(1160px, calc(100% - 48px));
  margin-inline: auto;
}
.hwt-page .hwt-sec { padding: 88px 0; scroll-margin-top: 72px; }
.hwt-page .hwt-sec-alt {
  background: var(--background-base);
  border-block: 1px solid var(--border);
}
.hwt-page .hwt-head { max-width: 720px; margin-bottom: 40px; }
.hwt-page .hwt-head .hwt-lead { margin-top: 14px; }
.hwt-page [id] { scroll-margin-top: 88px; }

/* Eyebrow */
.hwt-page .hwt-eyebrow {
  display: flex; align-items: center; gap: 8px;
  color: var(--brand);
  font: 700 11px/1.2 var(--font-mono);
  letter-spacing: 0.12em; text-transform: uppercase;
}
.hwt-page .hwt-dot {
  width: 6px; height: 6px; flex: none; border-radius: 50%;
  background: currentColor; box-shadow: 0 0 0 3px var(--brand-soft);
}

/* Type */
.hwt-page .hwt-h1 {
  margin: 18px 0 20px;
  font: 700 clamp(40px, 5.4vw, 60px) / 1.05 var(--font-ui);
  letter-spacing: -0.055em; text-wrap: balance;
}
.hwt-page .hwt-h1 em { color: var(--brand); font-style: normal; }
.hwt-page .hwt-h2 {
  margin-top: 12px;
  font: 700 clamp(28px, 3.4vw, 38px) / 1.15 var(--font-ui);
  letter-spacing: -0.045em; text-wrap: balance;
}
.hwt-page .hwt-lead {
  color: var(--text-secondary);
  font: 400 17px/1.7 var(--font-body);
}

/* HERO */
.hwt-page .hwt-hero {
  position: relative; overflow: hidden; isolation: isolate;
  padding: 80px 0 56px;
  background:
    radial-gradient(900px 400px at 70% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent),
    var(--background-base);
}
.hwt-page .hwt-grid {
  position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0.55;
  background-image:
    linear-gradient(color-mix(in srgb, var(--text-primary) 4.5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--text-primary) 4.5%, transparent) 1px, transparent 1px);
  background-size: 52px 52px;
  -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
}
html[data-theme="light"] .hwt-page .hwt-grid { opacity: 0.22; }
.hwt-page .hwt-hero-copy { max-width: 760px; }
.hwt-page .hwt-updated {
  margin-top: 20px; color: var(--text-muted);
  font: 500 13px/1.4 var(--font-mono);
}

/* Stats */
.hwt-page .hwt-stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 48px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card); overflow: hidden;
}
.hwt-page .hwt-stat {
  padding: 24px 28px;
  border-left: 1px solid var(--border);
}
.hwt-page .hwt-stat:first-child { border-left: 0; }
.hwt-page .hwt-stat dt {
  color: var(--text-primary);
  font: 700 34px/1.1 var(--font-ui); letter-spacing: -0.04em;
}
.hwt-page .hwt-stat:last-child dt { color: var(--brand); }
.hwt-page .hwt-stat dd {
  margin-top: 8px; color: var(--text-secondary);
  font: 400 13px/1.5 var(--font-body);
}

/* TOC */
.hwt-page .hwt-toc {
  position: sticky; top: var(--header-height, 0px); z-index: 20;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 88%, transparent);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
}
.hwt-page .hwt-toc ul {
  display: flex; gap: 8px; padding: 10px 0;
  overflow-x: auto; scrollbar-width: none;
}
.hwt-page .hwt-toc ul::-webkit-scrollbar { display: none; }
.hwt-page .hwt-toc a {
  display: block; padding: 8px 14px; border-radius: 999px; white-space: nowrap;
  color: var(--text-secondary); text-decoration: none;
  font: 600 13px/1 var(--font-ui);
  transition: background 0.2s ease, color 0.2s ease;
}
.hwt-page .hwt-toc a:hover,
.hwt-page .hwt-toc a:focus-visible {
  background: var(--brand-soft); color: var(--brand); outline: none;
}

/* Split (Who tests) */
.hwt-page .hwt-split {
  display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 64px; align-items: start;
}
.hwt-page .hwt-split-head { position: sticky; top: 140px; }
.hwt-page .hwt-prose p {
  max-width: 62ch; margin-bottom: 18px;
  color: var(--text-secondary); font: 400 16.5px/1.8 var(--font-body);
}
.hwt-page .hwt-prose .hwt-callout {
  margin: 28px 0 0; padding: 18px 20px;
  border: 1px solid var(--brand-subtle); border-left: 3px solid var(--brand);
  border-radius: 12px; background: var(--brand-soft);
  color: var(--text-primary); font-weight: 500;
}

/* Cards */
.hwt-page .hwt-card {
  padding: 26px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.hwt-page .hwt-g3 > .hwt-card:hover { border-color: var(--brand-subtle); transform: translateY(-2px); }
.hwt-page .hwt-card h3 {
  margin-bottom: 8px;
  font: 700 18px/1.35 var(--font-ui); letter-spacing: -0.02em;
}
.hwt-page .hwt-card p {
  color: var(--text-secondary); font: 400 15px/1.65 var(--font-body);
}
.hwt-page .hwt-ico {
  width: 42px; height: 42px; display: grid; place-items: center;
  margin-bottom: 18px;
  border: 1px solid var(--brand-subtle); border-radius: 12px;
  background: var(--brand-soft); color: var(--brand);
}
.hwt-page .hwt-g3 {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px;
}
.hwt-page .hwt-g2 {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
  align-items: stretch;
}

/* Article types */
.hwt-page .hwt-types {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
}
.hwt-page .hwt-type { padding: 30px; }
.hwt-page .hwt-type h3 { font-size: 22px; margin-bottom: 6px; }
.hwt-page .hwt-eg {
  margin-bottom: 20px; padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted) !important; font: 500 13px/1.5 var(--font-body) !important;
}
.hwt-page .hwt-type ul { display: grid; gap: 14px; }
.hwt-page .hwt-type li {
  display: grid; grid-template-columns: 18px 1fr; gap: 12px; align-items: start;
  color: var(--text-secondary); font: 400 15px/1.6 var(--font-body);
}
.hwt-page .hwt-tick { margin-top: 3px; color: var(--brand); }

/* Connect stepper */
.hwt-page .hwt-connect {
  margin-top: 64px; padding: 36px;
  border: 1px solid var(--border); border-radius: 20px;
  background:
    radial-gradient(600px 220px at 0% 0%, var(--brand-soft), transparent),
    var(--card);
}
.hwt-page .hwt-connect-head { max-width: 640px; margin-bottom: 32px; }
.hwt-page .hwt-connect-head h3 {
  margin-bottom: 8px;
  font: 700 24px/1.3 var(--font-ui); letter-spacing: -0.03em;
}
.hwt-page .hwt-connect-head p {
  color: var(--text-secondary); font: 400 15.5px/1.65 var(--font-body);
}
.hwt-page .hwt-steps {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px;
  position: relative;
}
.hwt-page .hwt-step { position: relative; }
.hwt-page .hwt-step::before {
  content: ""; position: absolute; top: 17px; left: 44px; right: -24px; height: 2px;
  background: linear-gradient(90deg, var(--brand), var(--brand-subtle));
}
.hwt-page .hwt-step:last-child::before { display: none; }
.hwt-page .hwt-step-num {
  position: relative; z-index: 1;
  width: 36px; height: 36px; display: grid; place-items: center;
  margin-bottom: 16px; border-radius: 50%;
  background: var(--brand); color: #fff;
  font: 700 14px/1 var(--font-mono);
  box-shadow: 0 0 0 5px var(--brand-soft);
}
.hwt-page .hwt-step-label {
  margin-bottom: 6px; color: var(--text-primary);
  font: 700 16px/1.3 var(--font-ui);
}
.hwt-page .hwt-step-text {
  color: var(--text-secondary); font: 400 14.5px/1.6 var(--font-body);
}

/* Current + independence */
.hwt-page .hwt-card-lg { padding: 34px; }
.hwt-page .hwt-card-lg h3 {
  margin: 14px 0 12px; font-size: 24px; letter-spacing: -0.03em;
}
.hwt-page .hwt-card-lg p + p { margin-top: 12px; }
.hwt-page .hwt-card-accent { border-color: var(--brand-subtle); }
.hwt-page .hwt-linkrow { margin-top: 20px !important; }

/* Links + buttons */
.hwt-page .hwt-slink {
  padding-bottom: 2px; border-bottom: 1px solid var(--border-strong);
  color: var(--text-primary); text-decoration: none;
  font: 600 14px/1.4 var(--font-ui);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.hwt-page .hwt-slink:hover,
.hwt-page .hwt-slink:focus-visible { border-color: var(--brand); color: var(--brand); }
.hwt-page .hwt-btn {
  min-height: 48px; display: inline-flex; align-items: center; justify-content: center;
  padding: 0 24px; white-space: nowrap;
  border: 1px solid var(--brand); border-radius: var(--radius-sm);
  background: var(--brand); color: #fff; text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.hwt-page .hwt-btn:hover {
  transform: translateY(-2px); border-color: var(--brand-hover);
  background: var(--brand-hover); box-shadow: var(--shadow-green);
}
.hwt-page .hwt-btn:active { transform: translateY(0); }
.hwt-page .hwt-btn:focus-visible,
.hwt-page .hwt-slink:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }

/* CTAs */
.hwt-page .hwt-cta-sec { padding: 88px 0 96px; }
.hwt-page .hwt-cta-stack { display: grid; gap: 28px; }
.hwt-page .hwt-banner {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 24px; padding: 32px 36px;
  border-color: var(--brand-subtle);
  background:
    radial-gradient(500px 200px at 100% 50%, var(--brand-soft), transparent),
    var(--card);
}
.hwt-page .hwt-banner > div { flex: 1 1 440px; }
.hwt-page .hwt-banner h3 { font-size: 24px; letter-spacing: -0.03em; }
.hwt-page .hwt-strip {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 16px 32px; padding: 20px 4px;
  border-top: 1px solid var(--border);
}
.hwt-page .hwt-strip p {
  color: var(--text-secondary); font: 400 15px/1.6 var(--font-body);
}
.hwt-page .hwt-strip strong { color: var(--text-primary); font-family: var(--font-ui); }
.hwt-page .hwt-strip-links { display: flex; flex-wrap: wrap; gap: 12px 28px; }

/* Responsive */
@media (max-width: 1024px) {
  .hwt-page .hwt-split { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .hwt-page .hwt-split-head { position: static; }
  .hwt-page .hwt-g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hwt-page .hwt-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 24px; }
  .hwt-page .hwt-step:nth-child(2)::before { display: none; }
}
@media (max-width: 820px) {
  .hwt-page .hwt-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hwt-page .hwt-stat:nth-child(3) { border-left: 0; }
  .hwt-page .hwt-stat:nth-child(n + 3) { border-top: 1px solid var(--border); }
  .hwt-page .hwt-types,
  .hwt-page .hwt-g2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .hwt-page .hwt-wrap { width: calc(100% - 32px); }
  .hwt-page .hwt-hero { padding: 56px 0 40px; }
  .hwt-page .hwt-sec { padding: 56px 0; }
  .hwt-page .hwt-cta-sec { padding: 56px 0 64px; }
  .hwt-page .hwt-head { margin-bottom: 28px; }
  .hwt-page .hwt-g3 { grid-template-columns: minmax(0, 1fr); }
  .hwt-page .hwt-stat { padding: 18px 16px; }
  .hwt-page .hwt-stat dt { font-size: 28px; }
  .hwt-page .hwt-type,
  .hwt-page .hwt-card-lg { padding: 24px; }
  .hwt-page .hwt-connect { padding: 24px 20px; margin-top: 40px; }
  .hwt-page .hwt-steps { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .hwt-page .hwt-step { padding: 0 0 24px 52px; }
  .hwt-page .hwt-step:last-child { padding-bottom: 0; }
  .hwt-page .hwt-step-num { position: absolute; left: 0; top: 0; margin: 0; }
  .hwt-page .hwt-step::before {
    display: block; top: 40px; bottom: 4px; left: 17px; right: auto; width: 2px; height: auto;
    background: var(--brand-subtle);
  }
  .hwt-page .hwt-step:last-child::before { display: none; }
  .hwt-page .hwt-banner { padding: 24px 20px; }
  .hwt-page .hwt-btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .hwt-page * { transition: none !important; }
}
`;