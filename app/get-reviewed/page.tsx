import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "AI Tool Reviews — Tested Before We Recommend",
  description:
    "Request an AlloyPress AI tool review. We test real workflows, verify claims, explain limitations, and publish practical, reader-first reviews.",
  alternates: {
    canonical: "/get-reviewed",
  },
};

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
  "AI writing & content tools",
  "AI image & video generators",
  "AI coding assistants",
  "Website & design tools",
  "Automation & workflow tools",
  "AI productivity software",
  "SaaS business tools",
  "AI research & search tools",
  "Creator & marketing tools",
];

const included = [
  [
    "01",
    "Full product walkthrough",
    "We cover what the tool is, what it does, and who it is actually for — without letting marketing copy lead the review.",
  ],
  [
    "02",
    "Hands-on workflow testing",
    "We use the tool across real-world tasks and document the experience, including things that work and things that don't.",
  ],
  [
    "03",
    "Output quality analysis",
    "We test practical outputs, compare results, and explain what readers can realistically expect from the product.",
  ],
  [
    "04",
    "Screenshots & visual walkthroughs",
    "Where useful, the review includes original screenshots from our testing so readers can understand the workflow before trying it.",
  ],
  [
    "05",
    "Strengths and honest limitations",
    "We explain what works well and what doesn't. Both sides matter when readers are deciding whether a product is worth their time.",
  ],
  [
    "06",
    "Pricing breakdown & free-plan reality",
    "We explain what users actually get at each relevant pricing level, not just what the pricing page promises.",
  ],
  [
    "07",
    "Competitor context",
    "We position the tool honestly within its category so readers understand how it compares with alternatives they may also consider.",
  ],
  [
    "08",
    "SEO optimisation and long-term publishing",
    "Every review is structured for discoverability and maintained when important product details, pricing, or capabilities change.",
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
    "We check whether the tool is relevant to our audience and editorial direction. We don't review everything — that's what keeps the coverage useful.",
  ],
  [
    "03",
    "Access and testing",
    "We collect what we need to get started — product access, any premium tier needed for thorough testing, brand assets, and key context.",
  ],
  [
    "04",
    "Testing and writing",
    "Our editorial team tests the tool across different use cases and workflows, then writes the review using specific, observable evidence.",
  ],
  [
    "05",
    "Published and promoted",
    "The review goes live SEO-optimised and formatted for discoverability. We handle promotion and keep the article updated as your product evolves.",
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
          <div className="review-hero-grid" aria-hidden="true" />
          <div className="review-hero-glow" aria-hidden="true" />
          <div className="review-hero-line review-hero-line-one" aria-hidden="true" />
          <div className="review-hero-line review-hero-line-two" aria-hidden="true" />

          <div className="review-container review-hero-inner">
            <div className="review-eyebrow">
              <span />
              EDITORIAL REVIEW PROGRAMME
            </div>

            <h1>
              Your AI Tool, Reviewed by
              <br />
              People Who <span><em>Actually Use It.</em></span>
            </h1>

            <p className="review-hero-copy">
              We don't rewrite your marketing page and call it a review. We test
              your tool on real workflows, push its limits, and write exactly what
              we find.
            </p>

            <div className="review-hero-actions">
              <button
                type="button"
                className="review-primary"
                data-review-email-open
              >
                Request a Review <span>↗</span>
              </button>
              <Link className="review-secondary" href="/blogs">
                See our articles
              </Link>
            </div>

            <div className="review-hero-note">
              We review AI tools, SaaS products, automation tools, and business
              software.
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="review-trust" aria-label="Review principles">
          <div className="review-container review-trust-inner">
            <span className="review-trust-label">FEATURED TOOL REVIEWS</span>
            <div className="review-trust-items">
              <span><b>✦</b> Real testing</span>
              <span><b>✓</b> Original evidence</span>
              <span><b>▣</b> Clear comparisons</span>
              <span><b>◈</b> Reader-first</span>
              <span><b>↗</b> Search-ready</span>
            </div>
          </div>
        </section>

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
                  The internet is full of posts that read like product brochures
                  than honest evaluations. We built AlloyPress to do the opposite:
                  every tool gets tested hands-on, not summarised from a feature page.
                </p>
              </div>
              <span className="review-index">01 / 05</span>
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
              <span className="review-index">02 / 05</span>
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
              <span className="review-index">03 / 05</span>
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
              <span className="review-index">04 / 05</span>
            </div>

            <div className="process-list">
              {process.map(([number, title, text]) => (
                <article className="process-item" key={number}>
                  <span className="process-step">{number}</span>
                  <div className="process-content">
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <span className="process-arrow">↗</span>
                </article>
              ))}
            </div>

            <div className="process-note">
              <span>ⓘ</span>
              <p>
                <strong>Timeline: 14 to 21 working days</strong>
                <br />
                Once collaboration is confirmed, product access and all required
                details are received, most reviews are published within 14–21
                working days. Complex tools may take a little longer and we will
                let you know upfront.
              </p>
            </div>
          </div>
        </section>

        {/* STANDARDS */}
        <section className="review-standards">
          <div className="review-standards-grid" aria-hidden="true" />
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
                The cost of a review covers editorial work — research, hands-on
                testing, writing, editing, SEO, hosting, and ongoing maintenance.
                What it does not cover is guaranteed positive outcome, exaggerated
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

        {/* CTA */}
        <section className="review-cta" id="request">
          <div className="review-cta-grid" aria-hidden="true" />
          <div className="review-cta-glow" aria-hidden="true" />

          <div className="review-container review-cta-inner">
            <div className="review-eyebrow review-eyebrow-light">
              <span />
              GET STARTED
            </div>

            <h2>
              Ready to get your tool in front of
              <br />
              the <em>right readers?</em>
            </h2>

            <p>
              Send us the basics and we'll take it from there. Most requests get
              a response within 1–2 business days.
            </p>

            <button
              type="button"
              className="review-primary review-primary-large"
              data-review-email-open
            >
              Submit a Review Request <span>↗</span>
            </button>

            <div className="review-cta-note">
              Email us {" "}
              <button
                type="button"
                className="review-email-link"
                data-review-email-open
              >
              </button>{" "}
              with your product name, website, URL, category, and any relevant
              testing details.
            </div>
          </div>
        </section>
        <dialog
          className="review-email-dialog"
          data-review-email-dialog
        >
          <div className="review-email-dialog-inner">
            <button
              type="button"
              className="review-email-close"
              data-review-email-close
              aria-label="Close"
            >
              ×
            </button>

            <div className="review-eyebrow">
              <span />
              AI TOOL REVIEW
            </div>

            <h2>Send your review request</h2>

            <p>
              Send your product details and relevant testing
              information to our email address.
            </p>

            <div className="review-email-copy-row">
              <span>contact@alloypress.com</span>

              <button
                type="button"
                className="review-email-copy"
                data-review-email-copy
              >
                Copy
              </button>
            </div>
          </div>
        </dialog>
        <Script id="review-email-popup">
          {`
    (() => {
      const dialog = document.querySelector(
        "[data-review-email-dialog]"
      );

      if (!dialog || dialog.dataset.ready === "true") {
        return;
      }

      dialog.dataset.ready = "true";

      const openButtons =
        document.querySelectorAll(
          "[data-review-email-open]"
        );

      const closeButton =
        dialog.querySelector(
          "[data-review-email-close]"
        );

      const copyButton =
        dialog.querySelector(
          "[data-review-email-copy]"
        );

      openButtons.forEach((button) => {
        button.addEventListener("click", () => {
          dialog.showModal();
        });
      });

      closeButton?.addEventListener("click", () => {
        dialog.close();
      });

      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          dialog.close();
        }
      });

      copyButton?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            "contact@alloypress.com"
          );

          copyButton.textContent = "Copied!";

          setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1600);
        } catch {
          copyButton.textContent = "Copy failed";

          setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1600);
        }
      });
    })();
  `}
        </Script>
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

.review-hero-grid,
.review-cta-grid,
.review-standards-grid {
  display: none;
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
  max-width: 570px;
  margin: 0 auto;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.75 var(--font-body);
}

.review-hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 26px;
}

.review-primary,
.review-secondary {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  transition: transform .2s ease, background .2s ease, border-color .2s ease;
}

.review-primary {
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

.review-trust {
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
}

.review-trust-inner {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}

.review-trust-label {
  color: var(--text-muted);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .12em;
}

.review-trust-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 20px;
  font: 500 var(--text-xs)/1.35 var(--font-mono);
}

.review-trust-items span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.review-trust-items b {
  color: var(--brand-hover);
  font-weight: 700;
}

.review-section {
  position: relative;
  padding: 70px 0;
}

.review-heading {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.review-heading h2 {
  max-width: 820px;
  margin: 11px 0 0;
  color: var(--text-primary);
  font: 700 clamp(27px, 3.2vw, 39px)/1.08 var(--font-ui);
  letter-spacing: -.048em;
}

.review-heading p {
  max-width: 680px;
  margin: 11px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.72 var(--font-body);
}

.review-index {
  flex: none;
  color: var(--text-muted);
  font: 600 var(--text-xs)/1.3 var(--font-mono);
}

.review-eyebrow-light {
  color: var(--brand);
}

.review-why {

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
  padding: 22px 24px;
  border-right: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  transition: background .2s ease, transform .2s ease;

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

.why-card-featured {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

.why-card-featured:hover {
  background: var(--surface-elevated);
}

.why-icon {
  display: inline-grid;
  place-items: center;
  width: 25px;
  height: 25px;
  margin-bottom: 13px;
  border-radius: var(--radius-sm);
  color: var(--brand);
  background: var(--brand-soft);
  font: 500 var(--text-sm)/1.3 var(--font-mono);
}

.why-card-featured .why-icon {
  color: var(--brand);
  background: var(--brand-soft);
}

.why-card h3 {
  margin: 0 0 7px;
  color: var(--text-primary);
  font: 700 var(--text-md)/1.4 var(--font-ui);
}

.why-card-featured h3 {
  color: var(--text-primary);
}

.why-card p {
  max-width: 440px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.why-card-featured p {
  color: var(--text-secondary);
}

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
  padding: 8px 10px;
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
  font-size: 7px;
}

.review-included {

  background: transparent;
}

.included-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--border-soft);
}

.included-item {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 15px;
  padding: 19px 18px 19px 0;
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

.review-process {

  background: transparent;
}

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
  padding: 17px 20px;
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
  width: 28px;
  height: 28px;
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

.review-standards {
  position: relative;
  padding: 76px 0;
  overflow: hidden;
  background: var(--surface);
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
  font: 700 clamp(25px, 3.2vw, 38px)/1.08 var(--font-ui);
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
  gap: 7px;
  margin-top: 22px;
}

.standards-list div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-secondary);
  font: 500 8px var(--text-xs)/1.45 var(--font-mono);
}

.standards-list span {
  color: var(--error);
  font-size: 13px;
}

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
  margin: 13px 0 12px;
  color: var(--text-primary);
  font: 700 clamp(28px, 4vw, 46px)/1.06 var(--font-ui);
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
  margin-top: 24px;
  min-height: 43px;
  padding: 0 19px;
}

.review-cta-note {
  max-width: 650px;
  margin: 20px auto 0;
  color: var(--text-muted);
  font: 400 var(--text-xs)/1.65 var(--font-mono);
}

.review-cta-note a {
  color: var(--brand);
  text-decoration: none;
}

.review-cta-note a:hover {
  text-decoration: underline;
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
    font-size: 12px;
  }

  .review-trust-inner {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 0;
  }

  .review-trust-items {
    justify-content: flex-start;
    gap: 10px 15px;
  }

  .review-section,
  .review-standards {
    padding: 52px 0;
  }

  .review-heading {
    display: block;
    margin-bottom: 23px;
  }

  .review-index {
    display: block;
    margin-top: 14px;
  }

  .review-heading h2 {
    font-size: 27px;
  }

  .why-card {
    min-height: auto;
    padding: 20px;
  }

  .coverage-tags span {
    font-size: 7px;
  }

  .process-item {
    grid-template-columns: 32px 1fr 15px;
    gap: 12px;
    padding: 16px 14px;
  }

  .process-content p {
    font-size: 9px;
  }

  .standards-card {
    padding: 28px 22px;
  }

  .review-cta-inner {
    padding: 58px 0;
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

  .review-trust-items span:nth-child(n+4) {
    display: none;
  }

  .coverage-tags {
    gap: 6px;
  }

  .coverage-tags span {
    padding: 7px 8px;
  }

  .standards-card h2 {
    font-size: 27px;
  }

  .standards-list div {
    align-items: flex-start;
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
  .review-primary {
  border: 0;
  cursor: pointer;
  appearance: none;
}

.review-email-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--brand);
  font: inherit;
  cursor: pointer;
}

.review-email-link:hover {
  text-decoration: underline;
}

.review-email-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: min(500px, calc(100% - 32px));
  max-width: 500px;

  margin: 0;
  padding: 0;

  border: 1px solid var(--border-strong);
  border-radius: 18px;

  background: var(--surface-elevated);
  color: var(--text-primary);

  box-shadow: var(--shadow-lg);
}

.review-email-dialog::backdrop {
  background: rgba(0, 0, 0, 0.62);
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
  cursor: pointer;
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
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font: 600 13px/1 var(--font-ui);
  cursor: pointer;
}

.review-email-copy:hover {
  background: var(--brand-hover);
}

@media (max-width: 600px) {
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
}
`;

export function ReviewPageStyles() {
  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}
