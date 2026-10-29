import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { createBreadcrumbSchema } from "@/lib/seo/schema";
import { withDefaultSocial } from "@/lib/seo/metadata";
import ProofStrip from "@/components/shared/ProofStrip";
import ReviewRequestPopup from "./ReviewRequestPopup";

export const metadata: Metadata = withDefaultSocial(
  {
    title: "AI Tool Reviews — Tested Before We Recommend",
    description:
      "Request an AlloyPress AI tool review. We test real workflows, verify claims, explain limitations, and publish practical, reader-first reviews.",
    alternates: { canonical: "/get-reviewed" },
  },
  "/get-reviewed"
);

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@graph": [
    createBreadcrumbSchema([
      {
        name: "Home",
        url: "/",
      },
      {
        name: "Review Tool",
        url: "/get-reviewed",
      },
    ]),
  ],
};

const coverage = [
  "AI writing and content tools",
  "AI image and video generators",
  "AI coding assistants",
  "Website and design tools",
  "Automation and workflow tools",
  "AI productivity software",
  "SaaS business tools",
  "AI research and search tools",
  "Creator and marketing tools",
];

/**
 * Featured review cards: [name, meta description, slug].
 * TODO: replace each description with the exact meta description of that
 * review's blog post so the card always matches what Google shows.
 */
const featuredReviews = [
  [
    "Grok AI Image and Animation",
    "Hands-on review of Grok's image and animation tools: output quality, limits, pricing and who it suits.",
    "grok-ai-image-and-animation-review",
  ],
  [
    "Kling AI",
    "Tested review of Kling AI video generation: real results, credit costs, strengths and limitations.",
    "kling-ai-review",
  ],
  [
    "GravityWrite",
    "GravityWrite tested on real writing workflows: what the templates do well, where it falls short, and pricing.",
    "gravitywrite-review",
  ],
  [
    "Manus AI",
    "Manus AI tested on real tasks: how the agent performs, what it costs and who should use it.",
    "manus-ai-review",
  ],
  [
    "Reve AI Image Generator",
    "Reve AI image generator review: image quality, prompt accuracy, pricing and honest limitations.",
    "reve-ai-image-generator-review",
  ],
];

const afterLive = [
  ["▣", "A permanent page", "Your review is its own page. It isn't a list position that can move when we retest the category."],
  ["↻", "Refreshed as you ship", "When you release a major feature or change pricing, we update the review so it matches your product."],
  ["↗", "Found in search and AI answers", "Because we test for real and write honest verdicts, our reviews are built to rank on Google and to be cited by ChatGPT, Perplexity, Google AI Overviews & more."],
  ["✓", "A badge you can use", "Show the Tested by AlloyPress badge on your site, linked to an independent review."],
];

const BADGE_SRC = "/badges/featured.svg";

const previewChecks = [
  "A clear verdict box near the top",
  "Original screenshots from our own testing",
  "A plain pricing breakdown",
  "Competitor context",
  "The Tested by AlloyPress badge",
];

/**
 * Preview screenshots. Leave `src` as null to show the striped placeholder.
 * Later, drop real images into /public/reviews/ and set e.g.
 * src: "/reviews/onepage-review-1.png".
 */
const previewShots: { src: string | null; alt: string; number?: string }[] = [
  { src: "/test1.avif", alt: "Original screenshot from our testing", number: "2" },
  { src: "/test2.avif", alt: "Original screenshot from our testing" },
];

const faqs = [
  ["Is this paid placement?", "No. We don't sell positions, ratings or verdicts. The fee covers the time our team spends testing your tool, taking screenshots, writing and keeping the coverage updated. A tool that tests poorly doesn't get a strong write-up, paid or not."],
  ["How much does it cost?", "It depends on the format and the depth of testing your tool needs. Reach out with your tool and we'll share how we work, what's included and the fees behind it, usually within 1 to 3 business days."],
  ["Can you guarantee a #1 position?", "No, for any brand. In lists, position is decided by how your tool performs against the others in the same test. If it stands out, nothing stops it from ranking first. A dedicated review has no ranking at all: the page is only about your tool."],
  ["Can you test my tool for free?", "We do cover tools from our own research, but our team is small and the testing queue is long. A confirmed collaboration gets a scheduled slot. Without one, we can't say when we'd reach your tool."],
  ["Can we pay through an affiliate commission instead?", "No. We don't work on commission, and we're removing affiliate links from our editorial content to keep coverage independent."],
  ["Can we send the description or write the review ourselves?", "No. Everything is written by our team from our own testing. That independence is what makes the coverage worth having. We're happy to correct facts such as pricing or feature names."],
  ["What happens when our product changes?", "Tell us when you ship a major feature or change pricing. We refresh the review so it stays accurate."],
  ["Do you work with agencies?", "Yes. Please copy someone from the brand team so we're aligned on access and approvals."],
];

const reviewPopup = {
  eyebrow: "Dedicated review",
  title: "Request a review",
  text: "Email us your tool and we'll reply within 1 to 3 business days with how we work, the value we provide and the fees behind it.",
  email: "contact@alloypress.com",
  subject: "Review request: [Your tool name]",
  include: [
    "Tool name and website",
    "Category and your main competitors",
    "Test access you can share (plan or credits)",
    "Whether you'd also like a list inclusion",
  ],
} as const;

const included = [
  [
    "01",
    "Full product walkthrough",
    "What the tool is, what it does, and who it is actually for, without letting marketing copy lead the review.",
  ],
  [
    "02",
    "Hands-on workflow testing",
    "We use the tool across real-world tasks and document the experience, including things that work and things that don't.",
  ],
  [
    "03",
    "Output quality analysis",
    "We test practical outputs, compare results, and explain what readers can realistically expect.",
  ],
  [
    "04",
    "Screenshots and visual walkthroughs",
    "Original screenshots from our testing so readers can understand the workflow before trying it.",
  ],
  [
    "05",
    "Strengths and honest limitations",
    "Both sides matter when readers are deciding whether a product is worth their time.",
  ],
  [
    "06",
    "Pricing breakdown and free-plan reality",
    "What users actually get at each pricing level, not just what the pricing page promises.",
  ],
  [
    "07",
    "Competitor context",
    "Where the tool sits within its category and how it compares with alternatives readers may also consider.",
  ],
  [
    "08",
    "SEO optimisation and long-term publishing",
    "Structured for discoverability and maintained when product details, pricing, or capabilities change.",
  ],
];

const process = [
  [
    "01",
    "Submit your review request",
    "Send us your product name, website, category, and any details relevant to testing. A business email is preferred so we can verify the request.",
  ],
  [
    "02",
    "We review fit and get back to you",
    "We check whether the tool is relevant to our audience and editorial direction, then share how we work, what's included, and the fees behind it.",
  ],
  [
    "03",
    "Access and testing",
    "We collect what we need to get started: product access, any premium tier needed for thorough testing, brand assets, and key context.",
  ],
  [
    "04",
    "Testing and writing",
    "Our editorial team tests the tool across different use cases and workflows, then writes the review using specific, observable evidence.",
  ],
  [
    "05",
    "Published and kept updated",
    "The review goes live, built for search and AI discovery, and we keep it updated as your product evolves.",
  ],
];

const standards = [
  "Misleading claims or exaggerated product descriptions",
  "AI-generated filler content without real testing behind it",
  "Guaranteed positive ratings or unsupported limitations",
  "Backlink-only requests disguised as editorial coverage",
  "Products outside our editorial scope, including harmful or misleading tools",
];

export default function ReviewsPage() {
  return (
    <>
      <Script
        id="review-tool-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <main className="review-page">
        {/* HERO */}
        <section className="review-hero">
          <div className="review-hero-glow" aria-hidden="true" />
          <div className="review-hero-line review-hero-line-one" aria-hidden="true" />
          <div className="review-hero-line review-hero-line-two" aria-hidden="true" />

          <div className="review-container review-hero-inner">
            <div className="review-eyebrow">
              <span />
              EDITORIAL REVIEW PROGRAM
            </div>

            <h1>
              Your AI Tool, Reviewed by{" "}
              <br />
              People Who <span><em>Actually Use It.</em></span>
            </h1>

            <p className="review-hero-copy">
              We don't rewrite your marketing page and call it a review. We test
              your tool on real workflows, push its limits, and write exactly what
              we find.
            </p>

            <p className="review-hero-permanent">
              A permanent, standalone page about your tool, refreshed every
              time you ship something new.
            </p>

            <div className="review-hero-actions">
              <button
                type="button"
                className="review-primary"
                data-rv-open
              >
                Request a Review <span>↗</span>
              </button>
              <Link className="review-secondary" href="/reviews">
                See our reviews
              </Link>
            </div>

            <div className="review-hero-note">
              We review AI tools, SaaS products, automation tools and business
              software.
            </div>
          </div>
        </section>

        {/* FEATURED REVIEWS */}
        <section className="review-featured" aria-label="Featured tool reviews">
          <div className="review-container">
            <div className="featured-head">
              <span className="featured-label">FEATURED TOOL REVIEWS</span>
              <div className="featured-points">
                <span><b>✦</b> Real testing</span>
                <span><b>✓</b> Original evidence</span>
                <span><b>▣</b> Clear comparisons</span>
                <span><b>◈</b> Reader-first</span>
                <span><b>↗</b> Search-ready</span>
              </div>
            </div>

            <div className="featured-grid">
              {featuredReviews.map(([name, description, slug]) => (
                <Link className="featured-card" href={`/reviews/${slug}`} key={slug}>
                  <span className="featured-tag">Review</span>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <span className="featured-link">Read review <i>↗</i></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PROOF STRIP (shared component) */}
        <ProofStrip showAiPlatforms />

        {/* WHY IT MATTERS */}
        <section className="review-section review-why">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow review-eyebrow-light">
                  <span />
                  WHY IT MATTERS
                </div>
                <h2>
                  There are a lot of AI tool reviews out there.
                  <br />
                  Most of them aren't reviews.
                </h2>
                <p>
                  The internet is full of posts that read like product brochures.
                  We built AlloyPress to do the opposite:
                  every tool gets tested hands-on, not summarised from a feature page.
                </p>
              </div>
            </div>

            <div className="why-grid">
              <article className="why-card why-card-featured">
                <span className="why-icon">↯</span>
                <h3>What we actually do</h3>
                <p>
                  We sign up, use the tool across real tasks, run practical
                  workflows, and document what happens. Then we write about what
                  we found.
                </p>
              </article>

              <article className="why-card">
                <span className="why-icon">▱</span>
                <h3>Real search and AI visibility</h3>
                <p>
                  Our reviews are built for readers arriving from search and
                  AI-assisted discovery. Useful information comes before sales
                  language.
                </p>
              </article>

              <article className="why-card">
                <span className="why-icon">△</span>
                <h3>Built to be useful, not promotional</h3>
                <p>
                  We cover strengths, limitations, pricing realities, and who the
                  tool is genuinely best for. Readers should understand the fit.
                </p>
              </article>

              <article className="why-card">
                <span className="why-icon">◫</span>
                <h3>We update as products evolve</h3>
                <p>
                  Products change. When important features, pricing, or capabilities
                  move, useful coverage should not quietly become outdated.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* AFTER YOU GO LIVE */}
        <section className="review-section review-afterlive">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow">
                  <span />
                  AFTER YOU GO LIVE
                </div>
                <h2>What happens after your review goes live.</h2>
                <p>A review keeps working for you long after we publish it.</p>
              </div>
            </div>

            <div className="afterlive-grid">
              {afterLive.map(([icon, title, text]) => (
                <article className="afterlive-card" key={title}>
                  <span className="why-icon">{icon}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {title === "A badge you can use" && (
                    <Image
                      className="afterlive-badge-img"
                      src={BADGE_SRC}
                      alt="Tested by AlloyPress badge"
                      width={180}
                      height={56}
                    />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* COVERAGE */}
        <section className="review-section review-coverage">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow">
                  <span />
                  OUR COVERAGE AREAS
                </div>
                <h2>We cover the tools people are actively searching for.</h2>
                <p>
                  AlloyPress focuses on AI and SaaS products used by founders,
                  creators, marketers, developers, and everyday users looking for
                  tools that actually work.
                </p>
              </div>
            </div>

            <div className="coverage-tags">
              {coverage.map((item, index) => (
                <span key={item}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT IS INCLUDED */}
        <section className="review-section review-included">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow">
                  <span />
                  WHAT'S INCLUDED
                </div>
                <h2>A review that covers the whole picture.</h2>
                <p>
                  Depending on the tool and category, here's what goes into a
                  typical AlloyPress editorial review.
                </p>
              </div>
            </div>

            <div className="included-grid">
              {included.map(([number, title, text]) => (
                <article className="included-item" key={number}>
                  <span className="included-number">{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEW PREVIEW */}
        <section className="review-section review-preview">
          <div className="review-container preview-layout">
            <div className="preview-mock" aria-hidden="true">
              <div className="preview-bar">
                <i /><i /><i />
                <span>alloypress.com/reviews/your-tool</span>
              </div>

              <div className="preview-page">
                <h3>[Your Tool] Review: Tested on Real Workflows</h3>

                <div className="preview-grid">
                  <div className="preview-block preview-block-verdict">
                    <i className="preview-num">1</i>
                    <strong>Our verdict</strong>
                    <span>Best for, strengths, limitations, at a glance</span>
                  </div>

                  <div className="preview-block">
                    <i className="preview-num">5</i>
                    <strong>Tested by AlloyPress</strong>
                    <span>Badge the brand can show on its site</span>
                    <Image
                      className="preview-badge"
                      src={BADGE_SRC}
                      alt=""
                      width={160}
                      height={48}
                    />
                  </div>

                  {previewShots.map((shot, index) => (
                    <div className="preview-block preview-shot" key={index}>
                      {shot.src ? (
                        <>
                          <Image
                            src={shot.src}
                            alt={shot.alt}
                            fill
                            sizes="(max-width: 900px) 50vw, 400px"
                          />
                          {shot.number && (
                            <i className="preview-num preview-num-float">{shot.number}</i>
                          )}
                        </>
                      ) : (
                        <p>
                          {shot.number && <i className="preview-num">{shot.number}</i>}
                          Original screenshot
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="preview-block">
                    <i className="preview-num">3</i>
                    <strong>Pricing breakdown</strong>
                    <span>Free plan vs paid tiers, what you really get</span>
                  </div>

                  <div className="preview-block">
                    <i className="preview-num">4</i>
                    <strong>Competitor context</strong>
                    <span>How it compares with the tools readers also consider</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-copy">
              <div className="review-eyebrow">
                <span />
                THE DELIVERABLE
              </div>
              <h2>What your review page looks like</h2>
              <ol>
                {previewChecks.map((item, index) => (
                  <li key={item}>
                    <i className="preview-num">{index + 1}</i>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="review-section review-process">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow">
                  <span />
                  HOW IT WORKS
                </div>
                <h2>Simple process, no back and forth.</h2>
                <p>
                  We keep the process straightforward so you spend less time on
                  admin and more time seeing results.
                </p>
              </div>
            </div>

            <div className="process-list">
              {process.map(([number, title, text]) => (
                <article className="process-item" key={number}>
                  <span className="process-step">{number}</span>
                  <div className="process-content">
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <span className="process-arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>

            <div className="process-note">
              <span aria-hidden="true">ⓘ</span>
              <p>
                <strong>Timeline: 6 to 12 working days</strong>, depending on
                our current testing queue. It can be shorter or longer, and we
                confirm the exact timing when you reach out.
              </p>
            </div>
          </div>
        </section>

        {/* LIST CROSS-SELL */}
        <section className="review-crosssell">
          <div className="review-container">
            <div className="crosssell-card">
              <div>
                <h2>Add your tool to a list too</h2>
                <p>
                  Most tools also fit one of our comparison lists, where readers
                  compare options side by side. Because the review gives our
                  team full context on your tool, adding a list inclusion takes
                  less testing time, so we pass that saving on as a reduced
                  combined rate. Your position in the list is still decided only
                  by how your tool performs against the others.
                </p>
              </div>
              <Link className="review-primary" href="/get-featured">
                See our lists
              </Link>
            </div>
          </div>
        </section>

        {/* STANDARDS */}
        <section className="review-standards">
          <div className="review-container">
            <div className="standards-card">
              <div className="review-eyebrow review-eyebrow-light">
                <span />
                EDITORIAL STANDARDS
              </div>

              <h2>
                Payment funds the work.
                <br />
                It doesn't change what we write.
              </h2>

              <p className="standards-lead">
                The cost of a review covers editorial work: research, hands-on
                testing, writing, editing, SEO, hosting, and ongoing maintenance.
                It does not buy a guaranteed positive outcome, exaggerated
                claims, or a piece that reads like it was written by marketing.
              </p>

              <div className="standards-list">
                {standards.map((item) => (
                  <div key={item}>
                    <span>×</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="review-section review-faq">
          <div className="review-container">
            <div className="review-heading">
              <div>
                <div className="review-eyebrow">
                  <span />
                  FAQ
                </div>
                <h2>Questions brands ask before reaching out.</h2>
              </div>
            </div>

            <div className="faq-list">
              {faqs.map(([question, answer]) => (
                <details className="faq-item" key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="review-cta" id="request">
          <div className="review-cta-glow" aria-hidden="true" />

          <div className="review-container review-cta-inner">
            <div className="review-eyebrow review-eyebrow-light">
              <span />
              GET STARTED
            </div>

            <h2>
              Ready to get your tool in front of{" "}
              <br />
              the <em>right readers?</em>
            </h2>

            <p>
              Send us the basics and we'll share how we work, the value we
              provide and the fees behind it. Most requests get a response
              within 1 to 3 business days.
            </p>

            <button
              type="button"
              className="review-primary review-primary-large"
              data-rv-open
            >
              Submit a Review Request <span>↗</span>
            </button>

            <p className="review-cta-urgency">
              We take on a limited number of reviews each month, scheduled in
              the order they&apos;re confirmed.
            </p>

            <div className="review-cta-note">
              Or email{" "}
              <a className="review-email-link" href="mailto:contact@alloypress.com">
                contact@alloypress.com
              </a>{" "}
              with your product name, website, category and testing details.
            </div>
          </div>
        </section>

        {/* Popup: opened by any [data-rv-open] button */}
        <ReviewRequestPopup content={reviewPopup} />
      </main>
    </>
  );
}

const styles = `
.review-page {
  color: var(--text-primary);
  background: var(--background);
  overflow: hidden;
}

.review-page *,
.review-page *::before,
.review-page *::after {
  box-sizing: border-box;
}

.review-container {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

/* ---------- Hero ---------- */
.review-hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  overflow: hidden;
  color: var(--text-primary);
  isolation: isolate;
  background: transparent;
}

.review-hero-glow {
  position: absolute;
  width: 580px;
  height: 580px;
  right: -230px;
  top: -260px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--brand-glow), transparent 68%);
  pointer-events: none;
}

.review-hero-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,216,74,.45), transparent);
  transform: rotate(-24deg);
  pointer-events: none;
}

.review-hero-line-one {
  width: 270px;
  right: 8%;
  top: 28%;
}

.review-hero-line-two {
  width: 180px;
  right: 20%;
  bottom: 19%;
  opacity: .4;
}

.review-hero-inner {
  position: relative;
  z-index: 1;
  padding: 82px 0 72px;
  text-align: center;
}

.review-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--brand);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.review-eyebrow span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px rgba(0,216,74,.10);
}

.review-eyebrow-light {
  color: var(--brand);
}

.review-hero h1 {
  max-width: 900px;
  margin: 18px auto 18px;
  color: var(--text-primary);
  font: 700 clamp(38px, 5.4vw, 66px)/1.02 var(--font-ui);
  letter-spacing: -.055em;
}

.review-hero h1 em {
  color: var(--brand-hover);
  font-style: normal;
}

.review-hero-copy {
  max-width: 600px;
  margin: 0 auto;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.75 var(--font-body);
}

.review-hero-permanent {
  max-width: 600px;
  margin: 16px auto 0;
  text-align: center;
  color: var(--text-primary);
  font: 600 var(--text-md)/1.6 var(--font-ui);
}

.review-hero-permanent::before {
  content: "✓ ";
  color: var(--brand);
}

.review-hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.review-primary,
.review-secondary {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  transition: transform .2s ease, background .2s ease, border-color .2s ease;
}

.review-primary {
  border: 0;
  cursor: pointer;
  appearance: none;
  color: white;
  background: var(--brand-hover);
}

.review-primary:hover {
  background: var(--brand-hover);
  transform: translateY(-2px);
}

.review-secondary {
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
  background: var(--surface);
}

.review-secondary:hover {
  border-color: rgba(0,216,74,.42);
  color: var(--brand);
  transform: translateY(-2px);
}

.review-hero-note {
  margin-top: 18px;
  color: var(--text-muted);
  font: 400 var(--text-xs)/1.5 var(--font-mono);
}

/* ---------- Featured reviews ---------- */
.review-featured {
  padding: 0 0 56px;
}

.featured-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 24px;
  min-height: 58px;
  margin-bottom: 20px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.featured-label {
  color: var(--text-muted);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .12em;
}

.featured-points {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px 20px;
  color: var(--text-muted);
  font: 500 var(--text-xs)/1.35 var(--font-mono);
}

.featured-points span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.featured-points b {
  color: var(--brand-hover);
  font-weight: 700;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.featured-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--text-primary);
  text-decoration: none;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}

.featured-card:hover,
.featured-card:focus-visible {
  border-color: var(--brand);
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  outline: none;
}

.featured-tag {
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font: 700 var(--text-xs)/1.4 var(--font-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.featured-card h3 {
  margin: 0;
  font: 700 var(--text-md)/1.3 var(--font-ui);
}

.featured-card p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

.featured-link {
  margin-top: auto;
  padding-top: 6px;
  color: var(--brand);
  font: 700 var(--text-sm)/1.3 var(--font-ui);
}

/* ---------- Sections ---------- */
.review-section {
  position: relative;
  padding: 72px 0;
}

.review-heading {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 32px;
}

.review-heading h2 {
  max-width: 820px;
  margin: 12px 0 0;
  color: var(--text-primary);
  font: 700 clamp(27px, 3.2vw, 39px)/1.1 var(--font-ui);
  letter-spacing: -.048em;
}

.review-heading p {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.72 var(--font-body);
}

.review-why,
.review-included,
.review-process {
  background: transparent;
}

.why-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-2);
}

.why-card {
  min-height: 158px;
  padding: 24px 26px;
  border-right: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  transition: background .2s ease;
  background: var(--card);
}

.why-card:nth-child(2n) {
  border-right: 0;
}

.why-card:nth-child(3),
.why-card:nth-child(4) {
  border-bottom: 0;
}

.why-card:hover {
  background: var(--surface-2);
}

.why-card-featured,
.why-card-featured:hover {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

.why-icon {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-bottom: 14px;
  border-radius: var(--radius-sm);
  color: var(--brand);
  background: var(--brand-soft);
  font: 500 var(--text-sm)/1.3 var(--font-mono);
}

.why-card h3 {
  margin: 0 0 8px;
  color: var(--text-primary);
  font: 700 var(--text-md)/1.4 var(--font-ui);
}

.why-card p {
  max-width: 440px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

/* ---------- After you go live ---------- */
.afterlive-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.afterlive-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
}

.afterlive-card h3 {
  margin: 0 0 8px;
  font: 700 var(--text-md)/1.3 var(--font-ui);
}

.afterlive-card p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.65 var(--font-body);
}

.afterlive-badge-img {
  width: auto;
  height: 44px;
  max-width: 100%;
  margin-top: auto;
  padding-top: 16px;
  box-sizing: content-box;
  object-fit: contain;
  object-position: left center;
}

/* ---------- Coverage ---------- */
.review-coverage {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: transparent;
}

.coverage-tags {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 900px;
}

.coverage-tags span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text-secondary);
  font: 600 var(--text-xs)/1.3 var(--font-mono);
  transition: transform .2s ease, border-color .2s ease, color .2s ease;
}

.coverage-tags span:hover {
  transform: translateY(-2px);
  border-color: rgba(0,216,74,.30);
  color: var(--brand);
}

.coverage-tags i {
  color: var(--brand);
  font-style: normal;
  font-size: 10px;
}

/* ---------- Included ---------- */
.included-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--border-soft);
}

.included-item {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 15px;
  padding: 20px 18px 20px 0;
  border-bottom: 1px solid var(--border-soft);
}

.included-item:nth-child(odd) {
  padding-right: 28px;
  border-right: 1px solid var(--border-soft);
}

.included-item:nth-child(even) {
  padding-left: 28px;
}

.included-number {
  color: var(--brand);
  font: 700 var(--text-xs)/1.3 var(--font-mono);
  padding-top: 3px;
}

.included-item h3 {
  margin: 0 0 5px;
  color: var(--text-primary);
  font: 700 var(--text-md)/1.4 var(--font-ui);
}

.included-item p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

/* ---------- Review preview ---------- */
.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, .75fr);
  gap: 48px;
  align-items: center;
}

.preview-mock {
  overflow: hidden;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-md);
}

.preview-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.preview-bar i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--border-strong);
}

.preview-bar span {
  margin-left: 10px;
  color: var(--text-secondary);
  font: 500 var(--text-xs)/1 var(--font-mono);
}

.preview-page {
  padding: 24px;
}

.preview-page h3 {
  margin: 0 0 18px;
  color: var(--text-primary);
  font: 800 var(--text-xl)/1.25 var(--font-ui);
  letter-spacing: -.03em;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preview-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 104px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
}

.preview-block-verdict {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.preview-block strong {
  color: var(--text-primary);
  font: 700 var(--text-sm)/1.3 var(--font-ui);
}

.preview-block > span {
  color: var(--text-secondary);
  font: 400 var(--text-xs)/1.5 var(--font-body);
}

.preview-num {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand);
  font: 700 var(--text-xs)/1 var(--font-mono);
  font-style: normal;
}

.preview-badge {
  width: auto;
  height: 40px;
  max-width: 100%;
  margin-top: auto;
  object-fit: contain;
  object-position: left center;
}

.preview-shot {
  align-items: center;
  justify-content: center;
  min-height: 150px;
  overflow: hidden;
  border-style: dashed;
  background:
    repeating-linear-gradient(
      135deg,
      var(--surface-2) 0 10px,
      var(--surface) 10px 20px
    );
}

.preview-shot p {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text-secondary);
  font: 500 var(--text-xs)/1.4 var(--font-mono);
}

.preview-shot img {
  object-fit: cover;
}

.preview-shot {
  border-style: solid;
}

.preview-num-float {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  background: rgba(0, 0, 0, .72);
  backdrop-filter: blur(4px);
}

.preview-copy h2 {
  margin: 12px 0 20px;
  color: var(--text-primary);
  font: 800 clamp(24px, 2.6vw, 30px)/1.15 var(--font-ui);
  letter-spacing: -.04em;
}

.preview-copy ol {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.preview-copy li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  font: 500 var(--text-md)/1.5 var(--font-ui);
}

/* ---------- Process ---------- */
.process-list {
  position: relative;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--card);
}

.process-item {
  display: grid;
  grid-template-columns: 42px 1fr 24px;
  gap: 18px;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border-soft);
  transition: background .2s ease;
}

.process-item:last-child {
  border-bottom: 0;
}

.process-item:hover {
  background: var(--surface-2);
}

.process-step {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--brand-glow);
  border-radius: 50%;
  color: var(--brand);
  background: var(--brand-soft);
  font: 700 var(--text-xs)/1.3 var(--font-mono);
}

.process-content h3 {
  margin: 0;
  color: var(--text-primary);
  font: 700 var(--text-md)/1.4 var(--font-ui);
}

.process-content p {
  max-width: 850px;
  margin: 5px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.process-arrow {
  color: var(--brand);
  font: 400 var(--text-sm)/1.3 var(--font-mono);
}

.process-note {
  display: grid;
  grid-template-columns: 25px 1fr;
  gap: 12px;
  margin-top: 14px;
  padding: 15px 17px;
  border: 1px solid var(--brand-subtle);
  border-radius: var(--radius-sm);
  background: var(--brand-soft);
}

.process-note > span {
  color: var(--brand);
  font: 700 var(--text-sm)/1.3 var(--font-mono);
}

.process-note p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.65 var(--font-body);
}

.process-note strong {
  color: var(--text-primary);
  font-family: var(--font-ui);
}

/* ---------- Cross-sell ---------- */
.review-crosssell {
  padding: 0 0 72px;
}

.crosssell-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border: 1px solid var(--brand);
  border-radius: var(--radius-lg);
  background: var(--brand-soft);
}

.crosssell-card > div {
  flex: 1 1 520px;
}

.crosssell-card h2 {
  margin: 0 0 8px;
  color: var(--text-primary);
  font: 800 var(--text-2xl)/1.2 var(--font-ui);
  letter-spacing: -.03em;
}

.crosssell-card p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

/* ---------- Standards ---------- */
.review-standards {
  position: relative;
  padding: 72px 0;
  overflow: hidden;
  color: var(--text-primary);
  isolation: isolate;
  background: transparent;
}

.review-standards .review-container {
  position: relative;
  z-index: 1;
}

.standards-card {
  max-width: 850px;
  margin: 0 auto;
  padding: 38px 42px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-lg);
}

.standards-card h2 {
  margin: 13px 0 15px;
  color: var(--text-primary);
  font: 700 clamp(25px, 3.2vw, 38px)/1.1 var(--font-ui);
  letter-spacing: -.045em;
}

.standards-lead {
  max-width: 720px;
  margin: 0;
  color: var(--text-muted);
  font: 400 var(--text-md)/1.75 var(--font-body);
}

.standards-list {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.standards-list div {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-secondary);
  font: 500 var(--text-sm)/1.5 var(--font-ui);
}

.standards-list span {
  color: var(--error);
  font-size: 15px;
  line-height: 1.3;
}

/* ---------- FAQ ---------- */
.review-faq .review-heading {
  justify-content: center;
  text-align: center;
}

.review-faq .review-heading h2 {
  margin-inline: auto;
}

.faq-list {
  display: grid;
  gap: 10px;
  max-width: 860px;
  margin-inline: auto;
}

.faq-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
}

.faq-item[open] {
  border-color: var(--brand);
}

.faq-item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  color: var(--text-primary);
  font: 700 var(--text-md)/1.4 var(--font-ui);
  cursor: pointer;
  list-style: none;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: "+";
  flex: none;
  color: var(--brand);
  font: 600 22px/1 var(--font-mono);
}

.faq-item[open] summary::after {
  content: "−";
}

.faq-item summary:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

.faq-item p {
  margin: 0;
  padding: 0 20px 18px;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

/* ---------- CTA ---------- */
.review-cta {
  position: relative;
  min-height: 390px;
  display: flex;
  align-items: center;
  overflow: hidden;
  color: var(--text-primary);
  isolation: isolate;
  text-align: center;
  background: transparent;
}

.review-cta-glow {
  position: absolute;
  width: 520px;
  height: 520px;
  left: 50%;
  bottom: -400px;
  transform: translateX(-50%);
  background: radial-gradient(circle, var(--brand-glow), transparent 67%);
  pointer-events: none;
}

.review-cta-inner {
  position: relative;
  z-index: 1;
  padding: 72px 0;
}

.review-cta h2 {
  margin: 18px 0 20px;
  color: var(--text-primary);
  font: 700 clamp(28px, 4vw, 46px)/1.08 var(--font-ui);
  letter-spacing: -.05em;
}

.review-cta h2 em {
  color: var(--brand);
  font-style: normal;
}

.review-cta p {
  max-width: 500px;
  margin: 0 auto;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.review-primary-large {
  margin-top: 32px;
  min-height: 46px;
  padding: 0 22px;
}

.review-cta .review-cta-urgency {
  margin: 28px auto 0;
  color: var(--text-secondary);
  font: 500 var(--text-sm)/1.6 var(--font-ui);
}

.review-cta-note {
  max-width: 650px;
  margin: 28px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font: 400 var(--text-xs)/1.65 var(--font-mono);
}

.review-cta-note a,
.review-email-link {
  color: var(--brand);
  text-decoration: none;
}

.review-cta-note a:hover,
.review-email-link:hover {
  text-decoration: underline;
}

/* ---------- Popup ---------- */
.review-email-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(500px, calc(100% - 32px));
  max-width: 500px;
  max-height: calc(100dvh - 28px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  background: var(--surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}

.review-email-dialog::backdrop {
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(2px);
}

.review-email-dialog-inner {
  position: relative;
  padding: 32px;
}

.review-email-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.review-email-close:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.review-email-dialog h2 {
  margin: 14px 0 10px;
  color: var(--text-primary);
  font: 700 30px/1.12 var(--font-ui);
  letter-spacing: -.04em;
}

.review-email-dialog p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font: 400 15px/1.7 var(--font-body);
}

.rv-field-label {
  display: block;
  margin: 16px 0 6px;
  color: var(--text-secondary);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.review-email-copy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.review-email-copy-row > span {
  flex: 1;
  min-width: 0;
  padding: 10px 11px;
  color: var(--text-primary);
  font: 600 14px/1.4 var(--font-ui);
  overflow-wrap: anywhere;
}

.review-email-copy {
  flex: none;
  min-width: 82px;
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font: 600 13px/1 var(--font-ui);
  cursor: pointer;
  transition: background .2s ease;
}

.review-email-copy:hover {
  background: var(--brand-hover);
}

.review-email-copy.is-copied {
  background: var(--brand-hover);
}

.rv-include {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.rv-include li {
  display: flex;
  gap: 8px;
  margin: 0 0 6px;
  color: var(--text-primary);
  font: 500 var(--text-sm)/1.5 var(--font-ui);
}

.rv-include li::before {
  content: "";
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 8px;
  border-radius: 50%;
  background: var(--brand);
}

.rv-mailto {
  display: flex;
  justify-content: center;
  padding: 13px 18px;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font: 700 var(--text-md)/1.2 var(--font-ui);
  text-decoration: none;
}

.rv-mailto:hover {
  background: var(--brand-hover);
}

.review-email-dialog p.rv-hint {
  margin: 12px 0 0;
  font-size: 13px;
  text-align: center;
}

.rv-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .featured-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .featured-card {
    grid-column: span 2;
  }

  .featured-card:nth-child(n + 4) {
    grid-column: span 3;
  }
}

@media (max-width: 900px) {
  .review-hero-inner {
    padding: 72px 0 64px;
  }

  .review-heading {
    align-items: flex-start;
  }

  .why-grid,
  .included-grid {
    grid-template-columns: 1fr;
  }

  .why-card,
  .why-card:nth-child(3),
  .why-card:nth-child(4),
  .why-card:nth-child(2n) {
    border-right: 0;
    border-bottom: 1px solid var(--border-soft);
  }

  .why-card:last-child {
    border-bottom: 0;
  }

  .included-item:nth-child(odd),
  .included-item:nth-child(even) {
    padding: 18px 0;
    border-right: 0;
  }

  .included-item:last-child {
    border-bottom: 0;
  }

  .afterlive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preview-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .featured-points {
    justify-content: flex-start;
  }
}

@media (max-width: 700px) {
  .review-container {
    width: min(100% - 28px, 620px);
  }

  .review-hero {
    min-height: auto;
  }

  .review-hero-inner {
    padding: 62px 0 55px;
  }

  .review-hero h1 {
    font-size: clamp(34px, 10vw, 48px);
  }

  .review-hero-copy {
    font-size: 15px;
  }

  .review-section,
  .review-standards {
    padding: 56px 0;
  }

  .review-heading {
    display: block;
    margin-bottom: 24px;
  }

  .review-heading h2 {
    font-size: 27px;
  }

  .why-card {
    min-height: auto;
    padding: 20px;
  }

  .coverage-tags span {
    font-size: 11px;
  }

  .process-item {
    grid-template-columns: 32px 1fr 15px;
    gap: 12px;
    padding: 16px 14px;
  }

  .process-content p {
    font-size: 14px;
  }

  .standards-card {
    padding: 28px 22px;
  }

  .review-cta-inner {
    padding: 58px 0;
  }
}

@media (max-width: 600px) {
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .featured-card,
  .featured-card:nth-child(n + 4) {
    grid-column: auto;
  }

  .featured-points span:nth-child(n + 4) {
    display: none;
  }

  .afterlive-grid,
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .preview-page {
    padding: 16px;
  }

  .crosssell-card {
    padding: 22px;
  }

  .review-email-dialog-inner {
    padding: 27px 20px;
  }

  .review-email-copy-row {
    flex-direction: column;
    align-items: stretch;
  }

  .review-email-copy {
    width: 100%;
  }

  .review-email-dialog {
    top: auto;
    bottom: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: 100%;
    margin: 0;
    border-radius: 18px 18px 0 0;
  }
}

@media (max-width: 480px) {
  .review-container {
    width: min(100% - 22px, 620px);
  }

  .review-hero h1 br,
  .review-cta h2 br {
    display: none;
  }

  .review-hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .review-primary,
  .review-secondary {
    width: 100%;
  }

  .coverage-tags {
    gap: 6px;
  }

  .standards-card h2 {
    font-size: 27px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .review-page *,
  .review-page *::before,
  .review-page *::after {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
`;

export function ReviewPageStyles() {
  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}