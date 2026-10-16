import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { withDefaultSocial } from "@/lib/seo/metadata";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = withDefaultSocial(
  {
    title: "AI Tool Article Inclusion",
    description:
      "Submit your AI tool for consideration in AlloyPress editorial lists and alternatives articles. Learn how inclusion works, what we evaluate, and what to expect.",
    alternates: { canonical: "/get-featured" },
    openGraph: {
      title: "AI Tool Article Inclusion",
      description:
        "Get your AI tool considered for relevant AlloyPress lists and alternatives articles through a reader-first editorial process.",
      type: "website",
    },
  },
  "/get-featured"
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
        name: "Get Featured",
        url: "/get-featured",
      },
    ]),
  ],
};

const principles = [
  ["▣", "Readers are actively deciding", "People visit our lists because they need a practical answer. We include products that genuinely help with the use case an article covers."],
  ["▤", "Editorial credibility still counts", "Paid inclusion supports editorial work, but it does not buy a position, rating, recommendation, or positive conclusion."],
  ["⌁", "Long-term search and discoverability", "Useful lists can continue attracting readers through search and AI discovery. Inclusion gives a product durable editorial context."],
  ["↗", "Updated as your product grows", "When meaningful features, pricing, or positioning changes affect an article, the relevant coverage can be revisited."],
];

const articleTypes = [
  ["01", "Best AI Image Generators", "List"], ["02", "Best AI Logo Generators", "List"], ["03", "Best AI Video Generators", "List"],
  ["04", "Best AI Writing Tools", "List"], ["05", "Best AI Website Builders", "List"], ["06", "Best AI Background Removers", "List"],
  ["07", "ChatGPT Alternatives", "Alternative"], ["08", "Jasper Alternatives", "Alternative"], ["09", "Midjourney Alternatives", "Alternative"],
  ["10", "Best AI Productivity Tools", "List"], ["11", "Best AI Coding Tools", "List"], ["12", "Best AI Research Tools", "List"],
];

const differences = [
  ["01", "Real testing, not marketing", "We use the product where practical. We do not rely only on launch copy, feature pages, or sales claims."],
  ["02", "We pick what belongs, not what pays", "Payment can fund editorial work. It does not guarantee a ranking, rating, recommendation, or favourable conclusion."],
  ["03", "Built for long-term discoverability", "Useful articles can keep attracting readers through search and AI discovery, so context and structure matter."],
  ["04", "Honest about strengths and limitations", "We explain where a product works well and where it falls short because readers need useful trade-offs."],
  ["05", "Updated as things change", "Meaningful changes to products, pricing, or capabilities can trigger a review of existing coverage."],
  ["06", "Context that actually helps", "Readers should understand who the tool is for, what it does best, and when another option may make more sense."],
];

const boundaries = [
  ["✕", "We don't guarantee a listing or ranking", "Every request is reviewed for editorial fit before inclusion is confirmed."],
  ["✕", "We don't publish supplied marketing copy", "Your product information helps us understand the tool, but the final editorial wording is ours."],
  ["✕", "We don't hide meaningful limitations", "If testing reveals an important weakness, readers should know about it."],
  ["✕", "We don't publish without enough context", "A useful listing needs enough product information and, when required, access for evaluation."],
];

const process = [
  ["01", "You submit your tool details", "Send the product name, URL, category, article you have in mind, and enough context for us to understand the product."],
  ["02", "We review whether there's a genuine fit", "We check the product against the article topic, audience, and existing coverage before moving forward."],
  ["03", "We collect access and testing details", "If hands-on evaluation is needed, we arrange product access, demo details, or the appropriate plan for testing."],
  ["04", "We test and prepare the editorial coverage", "We evaluate relevant workflows and create the inclusion around observable usefulness rather than marketing claims."],
  ["05", "The article is published and maintained", "Approved coverage is published with SEO-friendly structure and can be revisited when meaningful changes affect the article."],
  ["06", "You receive the published context", "We share the relevant article details once the editorial work is complete and the page is live."],
];

const requirements = [
  "Product name and website URL", "Which article or category you want to be considered for", "A short explanation of what the product does",
  "Key differentiators or features worth testing", "Product access or demo details, if required", "A business email connected to your company or product",
];

export default function InclusionPage() {
  return (
    <main className="inclusion-page">
      <Script
        id="get-featured-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <section className="inc-hero">
        <div className="inc-grid" aria-hidden="true" />
        <div className="inc-glow" aria-hidden="true" />
        <div className="inc-container inc-hero-inner">
          <div className="inc-hero-copy">
            <div className="inc-eyebrow inc-light"><span /> EDITORIAL LISTING PROGRAMME</div>
            <h1>Get Your AI Tool<br />Considered for a <em>Spot It</em><br /><em>Actually Earns</em></h1>
            <p>We publish honest, tested lists and alternatives articles covering the best AI tools in each category. If your tool fits genuinely, we want to know about it.</p>
            <button
              type="button"
              className="inc-primary inc-email-open"
              data-email-open
            >
              Get Featured <span>↗</span>
            </button>
            <div className="inc-hero-meta"><span>LISTS</span><i>·</i><span>ALTERNATIVES</span><i>·</i><span>HANDS-ON TESTING</span><i>·</i><span>EDITORIAL REVIEW</span></div>
          </div>
        </div>
        <div className="inc-note-bar"><div className="inc-container inc-note"><span className="inc-note-icon">●</span><p><strong>Quick note:</strong> inclusion is editorial, not a guaranteed ranking. We evaluate tools based on reader usefulness, fit, and evidence.</p></div></div>
      </section>

      <section className="inc-section inc-matters">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> WHY IT MATTERS</div><h2>What being in an AlloyPress list actually means for your product.</h2><p>There's a meaningful difference between being featured because a product is useful to readers and being dropped into a directory. Here's what editorial inclusion provides.</p></div><span className="inc-index">01 / 06</span></header>
          <div className="inc-principle-grid">{principles.map(([icon, title, text]) => <article className="inc-principle-card" key={title}><span className="inc-card-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-lists">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> OUR LISTS</div><h2>The lists and alternatives articles you can be considered for.</h2><p>These are article categories we actively maintain. If your tool belongs in one, that's the starting point for a conversation.</p></div><span className="inc-index">02 / 06</span></header>
          <div className="inc-article-grid">{articleTypes.map(([num, title, type]) => <div className="inc-article-chip" key={title}><span>{num}</span><strong>{title}</strong><small>{type}</small></div>)}</div>
        </div>
      </section>

      <section className="inc-proof-section"><div className="inc-container"><div className="inc-proof-card"><div><div className="inc-eyebrow inc-light"><span /> WE'RE NOT SELLING A RANKING</div><h2>We test first.<br />We list based on <em>what we find.</em></h2></div><div className="inc-proof-copy"><p>Most tools can look impressive on a product page. The useful question is what happens when someone actually uses them.</p><p>Our coverage focuses on real workflows, observable outputs, usability, pricing, limitations, and audience fit. Payment supports the work — it doesn't decide the conclusion.</p></div></div></div></section>

      <section className="inc-section inc-difference">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> WHY ALLOYPRESS</div><h2>What makes our lists different from most.</h2><p>There are a lot of “best of” lists for AI tools. Here's what separates ours.</p></div><span className="inc-index">03 / 06</span></header>
          <div className="inc-difference-grid">{differences.map(([num, title, text]) => <article className="inc-difference-card" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-boundaries">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> KEEP IT CLEAR</div><h2>A few things worth being clear about.</h2><p>We know there are sites that place products on lists after a paid request. That's not how we want our editorial coverage to work.</p></div><span className="inc-index">04 / 06</span></header>
          <div className="inc-boundary-grid">{boundaries.map(([icon, title, text]) => <article className="inc-boundary-card" key={title}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-process">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow inc-light"><span /> HOW IT WORKS</div><h2>What happens after you reach out.</h2><p>The process is straightforward. Here's exactly what to expect from submission to coverage.</p></div><span className="inc-index">05 / 06</span></header>
          <div className="inc-process-list">{process.map(([num, title, text]) => <article className="inc-process-row" key={num}><span className="inc-process-number">{num}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></article>)}</div>
          <div className="inc-timeline"><strong>Timeline: 7 to 14 working days in most cases</strong><p>Once collaboration is confirmed, product access is available, and required details are received, most inclusion requests can move through the editorial process within this window. Complex evaluations may take longer.</p></div>
        </div>
      </section>

      <section className="inc-section inc-requirements"><div className="inc-container inc-requirements-layout"><div><div className="inc-eyebrow"><span /> BEFORE YOU REACH OUT</div><h2>What to share when you reach out.</h2><p>The more context you give us, the faster we can evaluate your request and tell you whether there's a useful place for the product.</p></div><div className="inc-requirement-list">{requirements.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></div></section>

      <section className="inc-final"><div className="inc-final-grid" aria-hidden="true" /><div className="inc-final-glow" aria-hidden="true" /><div className="inc-container inc-final-inner"><div className="inc-eyebrow inc-light"><span /> GET STARTED</div><h2>If your tool genuinely belongs in our lists,<br /><em>let's find out.</em></h2><p>Send us the basics and we'll review your fit. If there's a useful editorial opportunity, we'll take it from there.</p><button
        type="button"
        className="inc-primary inc-email-open"
        data-email-open
      >
        Get Featured <span>↗</span>
      </button><small>Product name, URL, category, and relevant testing details</small></div></section>
      <div
        className="inc-email-modal-wrap"
        data-email-modal
        aria-hidden="true"
      >
        <div
          className="inc-email-backdrop"
          data-email-close
        />

        <div
          className="inc-email-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inc-email-title"
        >
          <button
            type="button"
            className="inc-email-close"
            data-email-close
            aria-label="Close"
          >
            ×
          </button>

          <div className="inc-eyebrow">
            <span />
            ARTICLE INCLUSION
          </div>

          <h2 id="inc-email-title">
            Send us your tool
          </h2>

          <p>
            Send your product details and relevant
            testing information to:
          </p>

          <div className="inc-email-row">
            <input
              type="text"
              value="contact@alloypress.com"
              readOnly
              aria-label="AlloyPress email address"
              className="inc-email-input"
              data-email-input
            />

            <button
              type="button"
              className="inc-email-copy"
              data-email-copy
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <Script
        id="email-popup-script"
        strategy="afterInteractive"
      >{`
  (() => {
    const modal = document.querySelector("[data-email-modal]");

    if (!modal || modal.dataset.ready === "true") {
      return;
    }

    modal.dataset.ready = "true";

    const openButtons = document.querySelectorAll(
      "[data-email-open]"
    );

    const closeButtons = document.querySelectorAll(
      "[data-email-close]"
    );

    const copyButton = document.querySelector(
      "[data-email-copy]"
    );

    openButtons.forEach((button) => {
      button.addEventListener("click", () => {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      });
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }
    });

    copyButton?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          "contact@alloypress.com"
        );

        copyButton.textContent = "Copied!";

        window.setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1600);
      } catch {
        copyButton.textContent = "Copy failed";

        window.setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1600);
      }
    });
  })();
`}</Script>
    </main>
  );
}

const styles = `
.inclusion-page {
  color:var(--text-primary);
  background:var(--background);
  overflow:hidden
}
.inclusion-page *,.inclusion-page *::before,.inclusion-page *::after {
  box-sizing:border-box
}
.inc-container {
  width:min(1160px,calc(100% - 40px));
  margin-inline:auto
}
.inc-hero {
  position:relative;
  min-height:500px;
  display:flex;
  align-items:center;
  overflow:hidden;
  background:radial-gradient(circle at 65% 35%,color-mix(in srgb, var(--brand) 15%, transparent),transparent 30%),var(--background-base);
  color:var(--foreground);
  isolation:isolate
}
.inc-grid,.inc-final-grid {
  position:absolute;
  inset:0;
  pointer-events:none;
  background-image:linear-gradient(color-mix(in srgb, var(--foreground) 4.5%, transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb, var(--foreground) 4.5%, transparent) 1px,transparent 1px);
  background-size:52px 52px;
  opacity:.55
}
.inc-grid::after,.inc-final-grid::after {
  content:"";
  position:absolute;
  inset:0;
  background-image:radial-gradient(color-mix(in srgb, var(--brand-hover) 65%, transparent) .7px,transparent .7px);
  background-size:14px 14px;
  opacity:.18
}
.inc-glow {
  position:absolute;
  width:560px;
  height:560px;
  right:-170px;
  top:-230px;
  border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb, var(--brand) 15%, transparent),transparent 68%)
}
.inc-hero-inner {
  position:relative;
  z-index:1;
  display:flex;
  justify-content:center;
  padding:78px 0 92px;
  text-align:center
}
.inc-hero-copy {
  max-width:790px
}
.inc-eyebrow {
  display:inline-flex;
  align-items:center;
  gap:8px;
  color:var(--brand);
  font:700 10px/1.2 var(--font-mono);
  letter-spacing:.11em;
  text-transform:uppercase
}
.inc-eyebrow span {
  width:6px;
  height:6px;
  flex:none;
  border-radius:50%;
  background:currentColor;
  box-shadow:0 0 0 3px var(--brand-soft)
}
.inc-light {
  color:var(--brand-hover)
}
.inc-hero h1 {
  margin:17px 0 19px;
  color:var(--foreground);
  font:700 clamp(42px,5vw,63px)/1.05 var(--font-ui);
  letter-spacing:-.055em
}
.inc-hero h1 em,.inc-proof-card h2 em,.inc-final h2 em {
  color:var(--brand-hover);
  font-style:normal
}
.inc-hero-copy>p {
  max-width:650px;
  margin:0 auto;
  color:var(--text-secondary);
  font:400 16px/1.78 var(--font-body)
}
.inc-primary {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--text-xs);
  margin-top: 25px;
  padding: 0 var(--text-xl);

  border: 1px solid var(--brand);
  border-radius: var(--radius-sm);

  background: var(--brand);
  color: #ffffff;

  text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);

  box-shadow: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.inc-primary:hover {
  transform: translateY(-2px);
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  color: #ffffff;
  box-shadow: var(--shadow-green);
}

.inc-primary:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.inc-primary:active {
  transform: translateY(0);
}
.inc-hero-meta {
  display:flex;
  justify-content:center;
  flex-wrap:wrap;
  gap:8px;
  margin-top:21px;
  color:var(--text-muted);
  font:600 9px/1.3 var(--font-mono)
}
.inc-hero-meta i {
  color:var(--brand);
  font-style:normal
}
.inc-note-bar {
  position:absolute;
  right:0;
  bottom:0;
  left:0;
  z-index:2;
  border-top:1px solid var(--border-soft);
  background:var(--surface-2)
}
.inc-note {
  min-height:58px;
  display:flex;
  align-items:center;
  gap:11px
}
.inc-note-icon {
  width:22px;
  height:22px;
  display:grid;
  place-items:center;
  flex:none;
  border-radius:6px;
  background:var(--brand-soft);
  color:var(--brand-hover);
  font-size:7px
}
.inc-note p {
  margin:0;
  color:var(--text-secondary);
  font:400 12px/1.6 var(--font-body)
}
.inc-note strong {
  color:var(--text-primary);
  font-family:var(--font-ui)
}
.inc-section {
  position:relative;
  padding:76px 0
}
.inc-matters {
  background:radial-gradient(circle at 88% 12%,color-mix(in srgb, var(--brand) 5.5%, transparent),transparent 25%),var(--card)
}
.inc-heading {
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:30px;
  margin-bottom:30px
}
.inc-heading h2 {
  max-width:850px;
  margin:11px 0 0;
  color:var(--text-primary);
  font:700 clamp(29px,3.35vw,41px)/1.1 var(--font-ui);
  letter-spacing:-.05em
}
.inc-heading p {
  max-width:720px;
  margin:12px 0 0;
  color:var(--text-secondary);
  font:400 15px/1.78 var(--font-body)
}
.inc-index {
  flex:none;
  color:var(--text-muted);
  font:600 10px/1.2 var(--font-mono)
}
.inc-principle-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px
}
.inc-principle-card {
  min-height:188px;
  display:grid;
  grid-template-columns:36px 1fr;
  gap:17px;
  padding:23px 24px;
  border:1px solid var(--border);
  border-radius:10px;
  background:var(--card);
  transition:.2s ease
}
.inc-principle-card:hover,.inc-difference-card:hover,.inc-article-chip:hover {
  transform:translateY(-3px);
  border-color:color-mix(in srgb, var(--brand) 28%, transparent);
  box-shadow:0 14px 35px color-mix(in srgb, var(--text-primary) 6%, transparent)
}
.inc-card-icon {
  width:32px;
  height:32px;
  display:grid;
  place-items:center;
  border:1px solid var(--brand-subtle);
  border-radius:7px;
  background:var(--brand-soft);
  color:var(--brand);
  font:600 13px/1 var(--font-mono)
}
.inc-principle-card h3,.inc-difference-card h3,.inc-boundary-card h3,.inc-process-row h3 {
  margin:2px 0 7px;
  color:var(--text-primary);
  font:700 15px/1.4 var(--font-ui)
}
.inc-principle-card p,.inc-difference-card p,.inc-boundary-card p,.inc-process-row p {
  margin:0;
  color:var(--text-secondary);
  font:400 14px/1.72 var(--font-body)
}
.inc-lists {
  background:var(--surface);
  border-block:1px solid color-mix(in srgb, var(--text-primary) 5.5%, transparent)
}
.inc-article-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:9px
}
.inc-article-chip {
  min-height:62px;
  display:grid;
  grid-template-columns:27px 1fr auto;
  align-items:center;
  gap:9px;
  padding:10px 12px;
  border:1px solid var(--border);
  border-radius:7px;
  background:var(--card);
  transition:.2s ease
}
.inc-article-chip>span {
  color:var(--brand);
  font:700 9px/1.2 var(--font-mono)
}
.inc-article-chip strong {
  color:var(--text-primary);
  font:600 12px/1.35 var(--font-ui)
}
.inc-article-chip small {
  padding:4px 6px;
  border-radius:5px;
  background:var(--surface-2);
  color:var(--text-muted);
  font:600 8px/1 var(--font-mono)
}
.inc-proof-section {
  padding:70px 0;
  background:var(--card)
}
.inc-proof-card {
  display:grid;
  grid-template-columns:1.05fr .95fr;
  gap:55px;
  padding:40px 42px;
  border:1px solid var(--border-soft);
  border-radius:11px;
  background:radial-gradient(circle at 8% 0%,color-mix(in srgb, var(--brand) 9%, transparent),transparent 30%),var(--surface-elevated);
  color:var(--foreground);
  box-shadow:0 18px 45px var(--shadow-sm)
}
.inc-proof-card h2 {
  margin:13px 0 0;
  color:var(--foreground);
  font:700 clamp(29px,3.5vw,42px)/1.1 var(--font-ui);
  letter-spacing:-.045em
}
.inc-proof-copy {
  display:flex;
  flex-direction:column;
  justify-content:center
}
.inc-proof-copy p {
  margin:0 0 15px;
  color:var(--text-secondary);
  font:400 14px/1.78 var(--font-body)
}
.inc-proof-copy p:last-child {
  margin-bottom:0
}
.inc-difference {
  background:var(--surface)
}
.inc-difference-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px
}
.inc-difference-card {
  min-height:190px;
  padding:20px 21px;
  border:1px solid var(--border);
  border-radius:9px;
  background:var(--card);
  transition:.2s ease
}
.inc-difference-card>span {
  color:var(--brand);
  font:700 9px/1.2 var(--font-mono)
}
.inc-difference-card h3 {
  margin-top:16px
}
.inc-boundaries {
  background:var(--card)
}
.inc-boundary-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px
}
.inc-boundary-card {
  display:grid;
  grid-template-columns:31px 1fr;
  gap:13px;
  padding:19px 21px;
  border:1px solid color-mix(in srgb, var(--error) 16%, transparent);
  border-radius:9px;
  background:var(--card)afa
}
.inc-boundary-card>span {
  width:27px;
  height:27px;
  display:grid;
  place-items:center;
  border-radius:6px;
  background:var(--card)0f0;
  color:var(--error);
  font:700 11px/1 var(--font-mono)
}
.inc-process {
  background:linear-gradient(color-mix(in srgb, var(--foreground) 4.5%, transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb, var(--foreground) 4.5%, transparent) 1px,transparent 1px),var(--background-base);
  background-size:48px 48px;
  color:var(--foreground)
}
.inc-process .inc-heading h2 {
  color:var(--foreground)
}
.inc-process .inc-heading p {
  color:var(--text-secondary)
}
.inc-process .inc-index {
  color:var(--text-muted)
}
.inc-process-list {
  overflow:hidden;
  border:1px solid var(--border-soft);
  border-radius:10px;
  background:color-mix(in srgb, var(--surface-elevated) 78%, transparent)
}
.inc-process-row {
  display:grid;
  grid-template-columns:52px 1fr 25px;
  gap:17px;
  align-items:center;
  padding:19px 21px;
  border-bottom:1px solid var(--border-soft);
  transition:background .2s ease
}
.inc-process-row:last-child {
  border-bottom:0
}
.inc-process-row:hover {
  background:color-mix(in srgb, var(--brand) 4.5%, transparent)
}
.inc-process-number {
  color:var(--brand-hover);
  font:700 10px/1.2 var(--font-mono)
}
.inc-process-row h3 {
  color:var(--foreground)
}
.inc-process-row p {
  color:var(--text-secondary)
}
.inc-process-row>b {
  color:var(--brand-hover);
  font:700 12px/1 var(--font-mono)
}
.inc-timeline {
  margin-top:13px;
  padding:17px 19px;
  border:1px solid color-mix(in srgb, var(--brand) 18%, transparent);
  border-radius:8px;
  background:color-mix(in srgb, var(--brand) 8%, transparent)
}
.inc-timeline strong {
  display:block;
  color:var(--brand-hover);
  font:700 11px/1.35 var(--font-ui)
}
.inc-timeline p {
  margin:5px 0 0;
  color:var(--text-secondary);
  font:400 12px/1.65 var(--font-body)
}
.inc-requirements {
  background:var(--surface)
}
.inc-requirements-layout {
  display:grid;
  grid-template-columns:.9fr 1.1fr;
  gap:70px;
  align-items:start
}
.inc-requirements-layout h2 {
  margin:12px 0 10px;
  color:var(--text-primary);
  font:700 clamp(29px,3.4vw,40px)/1.1 var(--font-ui);
  letter-spacing:-.05em
}
.inc-requirements-layout>div:first-child p {
  max-width:480px;
  margin:0;
  color:var(--text-secondary);
  font:400 15px/1.78 var(--font-body)
}
.inc-requirement-list {
  overflow:hidden;
  border:1px solid var(--border);
  border-radius:9px;
  background:var(--card)
}
.inc-requirement-list div {
  min-height:58px;
  display:grid;
  grid-template-columns:38px 1fr;
  align-items:center;
  gap:8px;
  padding:10px 16px;
  border-bottom:1px solid var(--border)
}
.inc-requirement-list div:last-child {
  border-bottom:0
}
.inc-requirement-list span {
  color:var(--brand);
  font:700 9px/1.2 var(--font-mono)
}
.inc-requirement-list p {
  margin:0;
  color:var(--text-secondary);
  font:500 13px/1.5 var(--font-ui)
}
.inc-final {
  position:relative;
  min-height:420px;
  display:flex;
  align-items:center;
  overflow:hidden;
  background:var(--background-base);
  color:var(--foreground);
  text-align:center;
  isolation:isolate
}
.inc-final-grid {
  opacity:.42
}
.inc-final-glow {
  position:absolute;
  width:650px;
  height:370px;
  left:50%;
  bottom:-285px;
  transform:translateX(-50%);
  background:radial-gradient(circle,color-mix(in srgb, var(--brand) 20%, transparent),transparent 68%)
}
.inc-final-inner {
  position:relative;
  z-index:1;
  padding:75px 0
}
.inc-final h2 {
  margin:14px 0 13px;
  color:var(--foreground);
  font:700 clamp(32px,4.4vw,49px)/1.07 var(--font-ui);
  letter-spacing:-.055em
}
.inc-final-inner>p {
  max-width:590px;
  margin:0 auto;
  color:var(--text-secondary);
  font:400 15px/1.78 var(--font-body)
}
.inc-final small {
  display:block;
  margin-top:20px;
  color:var(--text-muted);
  font:500 12px/1.5 var(--font-mono)
}
@media(max-width:900px) {
  .inc-proof-card,.inc-requirements-layout {
    grid-template-columns:1fr;
    gap:30px
  }
  .inc-difference-grid {
    grid-template-columns:1fr 1fr
  }
  .inc-requirements-layout {
    gap:35px
  }
}
@media(max-width:700px) {
  .inc-container {
    width:min(100% - 28px,620px)
  }
  .inc-hero {
    min-height:540px
  }
  .inc-hero-inner {
    padding:64px 0 100px
  }
  .inc-hero h1 {
    font-size:clamp(37px,10vw,50px)
  }
  .inc-hero-copy>p {
    font-size:15px
  }
  .inc-section {
    padding:56px 0
  }
  .inc-heading {
    display:block;
    margin-bottom:24px
  }
  .inc-heading h2 {
    font-size:29px
  }
  .inc-index {
    display:block;
    margin-top:13px
  }
  .inc-principle-grid,.inc-boundary-grid,.inc-difference-grid,.inc-article-grid {
    grid-template-columns:1fr
  }
  .inc-principle-card {
    min-height:auto
  }
  .inc-proof-section {
    padding:54px 0
  }
  .inc-proof-card {
    padding:28px 23px
  }
  .inc-proof-card h2 {
    font-size:30px
  }
  .inc-process-row {
    grid-template-columns:34px 1fr 15px;
    gap:11px;
    padding:17px 15px
  }
  .inc-process-row p,.inc-principle-card p,.inc-difference-card p,.inc-boundary-card p {
    font-size:13.5px
  }
  .inc-requirements-layout h2 {
    font-size:29px
  }
  .inc-final-inner {
    padding:62px 0
  }
}
@media(max-width:450px) {
  .inc-container {
    width:min(100% - 22px,620px)
  }
  .inc-hero h1 br,.inc-final h2 br {
    display:none
  }
  .inc-hero-meta {
    gap:6px;
    font-size:8px
  }
  .inc-note p {
    font-size:11px
  }
}
@media(prefers-reduced-motion:reduce) {
  .inclusion-page * {
    scroll-behavior:auto!important;
    transition:none!important
  }
}
html[data-theme="light"] .inclusion-page {
  background: var(--background);
  color: var(--text-primary);
}
html[data-theme="light"] .inc-hero {
  background:
    radial-gradient(circle at 65% 35%, var(--brand-soft), transparent 30%),
    var(--background-base);
  color: var(--text-primary);
}
html[data-theme="light"] .inc-hero h1,
html[data-theme="light"] .inc-proof-card h2,
html[data-theme="light"] .inc-final h2 {
  color: var(--text-primary);
}
html[data-theme="light"] .inc-hero-copy > p,
html[data-theme="light"] .inc-heading p,
html[data-theme="light"] .inc-proof-copy p,
html[data-theme="light"] .inc-process .inc-heading p,
html[data-theme="light"] .inc-process-row p,
html[data-theme="light"] .inc-timeline p,
html[data-theme="light"] .inc-requirements-layout > div:first-child p,
html[data-theme="light"] .inc-final-inner > p,
html[data-theme="light"] .inc-final small {
  color: var(--text-secondary);
}
html[data-theme="light"] .inc-hero-meta,
html[data-theme="light"] .inc-index,
html[data-theme="light"] .inc-process .inc-index {
  color: var(--text-muted);
}
html[data-theme="light"] .inc-note-bar,
html[data-theme="light"] .inc-process,
html[data-theme="light"] .inc-final {
  background: var(--surface);
  color: var(--text-primary);
}
html[data-theme="light"] .inc-note-bar {
  border-top-color: var(--border);
}
html[data-theme="light"] .inc-note p {
  color: var(--text-secondary);
}
html[data-theme="light"] .inc-note strong {
  color: var(--text-primary);
}
html[data-theme="light"] .inc-proof-card {
  background:
    radial-gradient(circle at 8% 0%, var(--brand-soft), transparent 30%),
    var(--surface-elevated);
  color: var(--text-primary);
  border-color: var(--border);
  box-shadow: var(--shadow-md);
}
html[data-theme="light"] .inc-process-list {
  background: var(--card);
  border-color: var(--border);
}
html[data-theme="light"] .inc-process-row {
  border-bottom-color: var(--border);
}
html[data-theme="light"] .inc-process-row h3 {
  color: var(--text-primary);
}
html[data-theme="light"] .inc-requirements {
  background: var(--surface);
}
html[data-theme="light"] .inc-requirement-list,
html[data-theme="light"] .inc-principle-card,
html[data-theme="light"] .inc-article-chip,
html[data-theme="light"] .inc-difference-card,
html[data-theme="light"] .inc-boundary-card {
  background: var(--card);
  border-color: var(--border);
}
html[data-theme="light"] .inc-principle-card h3,
html[data-theme="light"] .inc-difference-card h3,
html[data-theme="light"] .inc-boundary-card h3,
html[data-theme="light"] .inc-requirement-list p,
html[data-theme="light"] .inc-article-chip strong {
  color: var(--text-primary);
}
html[data-theme="light"] .inc-principle-card p,
html[data-theme="light"] .inc-difference-card p,
html[data-theme="light"] .inc-boundary-card p {
  color: var(--text-secondary);
}
html[data-theme="light"] .inc-article-chip small {
  background: var(--surface-2);
  color: var(--text-secondary);
}
html[data-theme="light"] .inc-primary {
  background: var(--brand);
  color: var(--background);
}
html[data-theme="light"] .inc-primary:hover {
  background: var(--brand-hover);
  box-shadow: var(--shadow-green);
}
html[data-theme="light"] .inc-final-grid,
html[data-theme="light"] .inc-grid {
  opacity: .22;
}
html[data-theme="dark"] .inc-hero-copy > p,
html[data-theme="dark"] .inc-heading p,
html[data-theme="dark"] .inc-proof-copy p,
html[data-theme="dark"] .inc-process .inc-heading p,
html[data-theme="dark"] .inc-process-row p,
html[data-theme="dark"] .inc-timeline p,
html[data-theme="dark"] .inc-requirements-layout > div:first-child p,
html[data-theme="dark"] .inc-final-inner > p {
  color: var(--text-secondary);
}
.inc-hero-copy > p,
.inc-note p,
.inc-heading p,
.inc-principle-card p,
.inc-difference-card p,
.inc-boundary-card p,
.inc-proof-copy p,
.inc-process-row p,
.inc-timeline p,
.inc-requirements-layout > div:first-child p,
.inc-final-inner > p {
  color: var(--text-secondary);
  opacity: 1;
  text-wrap: pretty;
}
  .inc-email-open {
  cursor: pointer;
}

.inc-email-modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
}

.inc-email-modal-wrap.is-open {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.inc-email-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(7px);
}

.inc-email-modal {
  position: relative;
  z-index: 1;
  width: min(520px, 100%);
  padding: 34px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-elevated);
  color: var(--text-primary);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
}

.inc-email-modal h2 {
  margin: 14px 0 10px;
  color: var(--text-primary);
  font: 700 clamp(28px, 4vw, 34px)/1.1 var(--font-ui);
  letter-spacing: -0.04em;
}

.inc-email-modal > p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font: 400 14px/1.7 var(--font-body);
}

.inc-email-close {
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

.inc-email-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.inc-email-input {
  flex: 1;
  min-width: 0;
  padding: 10px 11px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font: 600 14px/1.4 var(--font-ui);
}

.inc-email-copy {
  flex: none;
  padding: 10px 15px;
  border: 0;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font: 600 13px/1 var(--font-ui);
  cursor: pointer;
}

.inc-email-copy:hover {
  background: var(--brand-hover);
}

@media (max-width: 600px) {
  .inc-email-modal {
    padding: 27px 20px;
  }

  .inc-email-row {
    flex-direction: column;
    align-items: stretch;
  }

  .inc-email-copy {
    width: 100%;
  }
}
`;