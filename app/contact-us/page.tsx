import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import ProofStrip from "@/components/shared/ProofStrip";
import { ContactPopup } from "./ContactClient";
import { withDefaultSocial } from "@/lib/seo/metadata";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = withDefaultSocial(
  {
    title: "Contact AlloyPress — AI Reviews, Partnerships & Enquiries",
    description:
      "Contact AlloyPress for AI tool reviews, article inclusion, partnerships, editorial enquiries, and other collaboration requests.",
    alternates: { canonical: "/contact-us" },
    openGraph: {
      title: "Contact AlloyPress — AI Reviews & Partnerships",
      description:
        "Get in touch with AlloyPress about AI tool reviews, editorial collaborations, partnerships, and enquiries.",
      type: "website",
    },
  },
  "/contact-us"
);

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@graph": [
    createBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Contact", url: "/contact-us" },
    ]),
  ],
};

const paths = [
  {
    icon: "⌕",
    title: "Dedicated Review",
    text: "A completely new, standalone article written specifically for your product. We test it hands-on across real workflows, document everything with screenshots, and publish a permanent, in-depth review we refresh as you ship.",
    href: "/get-reviewed",
    cta: "See review details",
  },
  {
    icon: "▣",
    title: "Article Inclusion",
    text: "Get your tool featured in one of our existing lists or alternatives articles. We test the product, write a dedicated section, and include a link so readers can reach your site directly. Position is based on how the tool performs in our evaluation.",
    href: "/get-featured",
    cta: "See list details",
  },
  {
    icon: "◈",
    title: "Testing Partnership",
    text: "For AI teams that want an ongoing, independent read on their product: regular testing cycles, written reports, competitive benchmarking and SEO input. You can start with a single cycle.",
    href: "/testing-partner",
    cta: "See partnership details",
  },
  {
    icon: "◇",
    title: "General Enquiries",
    text: "For anything else: press mentions, factual corrections on an existing article, product update notifications, or anything that doesn't fit the other paths. Email us and we'll route it to the right person.",
    href: "",
    cta: "Email us",
  },
];

const heroStats = [
  ["250+", "AI tools tested"],
  ["AI-cited", "ChatGPT, Perplexity, Gemini, AI Overviews"],
  ["1 to 3 days", "Response time"],
  ["Global", "Open to work with"],
];

const contactEmail = "contact@alloypress.com";


const outreach = [
  ["01", "Product name and website URL", "So we can look at the tool before we even reply."],
  ["02", "What you are looking for", "A dedicated review, an article inclusion, both, a testing partnership, or something else."],
  ["03", "Which article or category you have in mind", "If you want to be in one of our existing lists, tell us which one."],
  ["04", "How your tool compares to competitors", "Mention which tools you see yourself competing with."],
  ["05", "Product access or demo details", "If you have a premium plan or a demo account ready for testing, share it."],
  ["06", "Use a business email", "An address associated with your company or product helps us verify quickly."],
  ["07", "Agencies: copy someone from the brand", "It keeps access and approvals aligned from the start."],
];

const expectations = [
  "Response within 1 to 3 business days",
  "Clear yes or no, no vague replies",
  "Honest feedback if your tool isn't a match",
  "All collaborations go through editorial review",
  "Open to agencies representing brands",
  "Testing partnership discussions welcome",
];

export default function ContactPage() {
  return (
    <>
      <Script
        id="contact-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <main className="contact-page">
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        <section className="contact-hero">
          <div className="contact-hero-grid" aria-hidden="true" />
          <div className="contact-hero-glow" aria-hidden="true" />

          <div className="contact-container contact-hero-inner">
            <div className="contact-hero-copy">
              <div className="contact-eyebrow contact-eyebrow-light">
                <span />
                GET IN TOUCH
              </div>

              <h1>
                Let's Talk About
                <br />
                What You're <em>Building</em>
              </h1>

              <p>
                Whether you're looking to get your tool reviewed, featured in one
                of our lists, or explore a testing partnership, reach out and
                we'll take it from there.
              </p>
            </div>

            <aside className="contact-quick-card">
              <div className="contact-response">
                <span />
                Usually responds within <strong>1 to 3 business days</strong>
              </div>

              <div className="contact-card-divider" />

              <div className="contact-label">CONTACT EMAIL</div>

              <button
                type="button"
                className="contact-email"
                data-ct-open="review"
              >
                <span>{contactEmail}</span>
                <b>→</b>
              </button>

              <div className="contact-meta-grid">
                {heroStats.map(([value, label]) => (
                  <div key={value}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

        </section>

        <section className="contact-section contact-paths" id="how-we-work">
          <div className="contact-container">
            <header className="contact-section-heading">
              <div>
                <div className="contact-eyebrow">
                  <span />
                  HOW WE WORK TOGETHER
                </div>
                <h2>Choose the right path for your goal.</h2>
                <p>
                  We collaborate in a few specific ways. Pick the one that
                  matches what you need. It helps us get back to you faster.
                </p>
              </div>
            </header>

            <div className="contact-path-grid">
              {paths.map((path) => (
                <article className="contact-path-card" key={path.title}>
                  <div className="contact-path-top">
                    <span className="contact-path-icon">{path.icon}</span>
                  </div>

                  <h3>{path.title}</h3>
                  <p>{path.text}</p>

                  {path.href ? (
                    <Link className="contact-path-cta" href={path.href}>
                      {path.cta}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="contact-path-cta"
                      data-ct-open="other"
                    >
                      {path.cta}
                      <span aria-hidden="true">↗</span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section contact-outreach">
          <div className="contact-container">
            <header className="contact-section-heading">
              <div>
                <div className="contact-eyebrow">
                  <span />
                  MAKE IT EASY FOR US
                </div>
                <h2>What to include when you reach out.</h2>
                <p>
                  The more context you give us upfront, the faster we can give
                  you a clear answer.
                </p>
              </div>
            </header>

            <div className="contact-outreach-layout">
              <div className="contact-outreach-main">
              <div className="contact-outreach-list">
                {outreach.map(([number, title, text]) => (
                  <div className="contact-outreach-item" key={number}>
                    <span>{number}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="contact-filter-note">
                For a fast reply, tell us the tool you represent. We don&apos;t
                reply to link-swap, guest-post or unrelated requests.
              </p>
              </div>

              <aside className="contact-expect-card">
                <div className="contact-eyebrow contact-eyebrow-light">
                  <span />
                  WHAT TO EXPECT
                </div>
                <h3>We keep things straightforward.</h3>
                <p>
                  No automated responses, no complex onboarding. When you email
                  us, a real person reads it and replies with a clear answer,
                  whether that is next steps or a polite pass.
                </p>

                <ul>
                  {expectations.map((item) => (
                    <li key={item}>
                      <span>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <ProofStrip />

        <section className="contact-final-cta">
          <div className="contact-final-grid" aria-hidden="true" />
          <div className="contact-final-glow" aria-hidden="true" />

          <div className="contact-container contact-final-inner">
            <div className="contact-eyebrow contact-eyebrow-light">
              <span />
              START A CONVERSATION
            </div>

            <h2>
              Have something useful
              <br />
              to <em>build together?</em>
            </h2>

            <p>
              Tell us what you're working on and what you have in mind. We'll
              review the details and share how we work, the value we provide and
              the fees behind it.
            </p>

            <button
              type="button"
              className="contact-primary-button"
              data-ct-open="review"
            >
              Email AlloyPress <span>↗</span>
            </button>

            <div className="contact-final-email">
              <span>·</span>
              <span>Usually responds within 1 to 3 business days</span>
            </div>
          </div>
        </section>
        <ContactPopup />
      </main>
    </>
  );
}
const styles = `
.contact-page {
  --contact-brand: var(--brand);
  --contact-brand-bright: var(--accent-neon);
  --contact-ink: var(--text-primary);
  --contact-muted: var(--text-secondary);
  --contact-line: var(--border);
  --contact-soft: var(--surface);
  --contact-dark: var(--background);
  --contact-dark-card: var(--surface-elevated);
  color: var(--contact-ink);
  background: var(--card);
  overflow: hidden;
}

.contact-page *,
.contact-page *::before,
.contact-page *::after {
  box-sizing: border-box;
}

.contact-container {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

.contact-hero {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: transparent;
  color: var(--text-primary);
  isolation: isolate;
}

.contact-hero-grid,
.contact-final-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: none;
  background-size: 52px 52px;
  opacity: 0;
}


.contact-hero-glow {
  position: absolute;
  width: 540px;
  height: 540px;
  right: -120px;
  top: -210px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--brand-soft), transparent 68%);
  pointer-events: none;
}

.contact-hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) 440px;
  align-items: center;
  gap: 72px;
  padding: 70px 0 66px;
}

.contact-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--contact-brand);
  font: 700 10px/1.2 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.contact-eyebrow span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.contact-eyebrow-light {
   color: var(--contact-brand);
}

.contact-hero-copy h1 {
  max-width: 690px;
  margin: 17px 0 18px;
  color: var(--text-primary);
  font: 700 clamp(42px, 5.2vw, 64px)/1.03 var(--font-ui);
  letter-spacing: -.055em;
}

.contact-hero-copy h1 em {
  color: var(--contact-brand);
  font-style: normal;
}

.contact-hero-copy p {
  max-width: 580px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 16px/1.78 var(--font-body);
}

.contact-quick-card {
  padding: 23px 23px 21px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: var(--surface-elevated);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
}

.contact-response {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font: 600 14px/1.45 var(--font-mono);
}

.contact-response > span {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--brand);
}

.contact-response strong {
  color: var(--contact-brand);
}

.contact-card-divider {
  height: 1px;
  margin: 18px 0;
  background: var(--border);
}

.contact-label {
  margin-bottom: 7px;
  color: var(--text-muted);
  font: 700 10px/1.2 var(--font-mono);
  letter-spacing: .08em;
}

.contact-email {
  min-height: 43px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
  color: var(--text-primary);
  text-decoration: none;
  font: 600 14px/1.25 var(--font-mono);
  transition: border-color .2s ease, background .2s ease;
}

.contact-email:hover {
  border-color: var(--brand-glow);
  background: var(--brand-soft);
}

.contact-email b {
  color: var(--contact-brand-bright);
}

.contact-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 9px;
}

.contact-meta-grid div {
  min-height: 61px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 11px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
}

.contact-meta-grid strong {
  color: var(--text-primary);
  font: 700 14px/1.3 var(--font-ui);
}

.contact-meta-grid span {
  margin-top: 4px;
  color: var(--text-muted);
  font: 500 12px/1.3 var(--font-mono);
}

.contact-hero-bottom {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.contact-note {
  min-height: 55px;
  display: flex;
  align-items: center;
  gap: 11px;
}

.contact-note-icon {
  width: 23px;
  height: 23px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--error) 12%, transparent);
  color: var(--error);
  font: 700 10px/1.2 var(--font-mono);
}

.contact-note p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 13px/1.65 var(--font-body);
}

.contact-note strong {
  color: var(--text-primary);
  font-family: var(--font-ui);
}

.contact-section {
  position: relative;
  padding: 72px 0;
}

.contact-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 29px;
}

.contact-section-heading h2 {
  max-width: 800px;
  margin: 11px 0 0;
  color: var(--contact-ink);
  font: 700 clamp(28px, 3.4vw, 40px)/1.08 var(--font-ui);
  letter-spacing: -.05em;
}

.contact-section-heading p {
  max-width: 650px;
  margin: 11px 0 0;
  color: var(--contact-muted);
  font: 400 16px/1.78 var(--font-body);
}

.contact-index {
  flex: none;
  color: var(--text-muted);
  font: 600 10px/1.2 var(--font-mono);
}

.contact-paths {
  background:
    radial-gradient(circle at 92% 12%, var(--brand-soft), transparent 24%),
    transparent;
}

.contact-path-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.contact-path-card {
  min-height: 225px;
  padding: 22px 23px 20px;
  border: 1px solid var(--contact-line);
  border-radius: 10px;
  background: var(--card);
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.contact-path-card:hover {
  transform: translateY(-3px);
  border-color: var(--brand-glow);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}


.contact-path-card .contact-path-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-height: 40px;
  margin-top: 18px;
  padding: 0 15px;

  border: 1px solid var(--brand);
  border-radius: var(--radius-sm);

  background: var(--brand);
  color: #ffffff;

  font: 600 13px/1 var(--font-ui);
  text-decoration: none;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-path-card .contact-path-cta:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  color: #ffffff;
  transform: translateY(-1px);
}

.contact-path-card .contact-path-cta[aria-disabled="true"] {
  cursor: default;
  opacity: 0.9;
}


.contact-path-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.contact-path-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--brand-subtle);
  border-radius: 7px;
  background: var(--brand-soft);
  color: var(--contact-brand);
  font: 600 13px/1 var(--font-mono);
}

.contact-path-tag {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  font: 700 8px/1.2 var(--font-mono);
  letter-spacing: .05em;
}

.contact-path-card h3 {
  margin: 16px 0 7px;
  color: var(--contact-ink);
  font: 700 16px/1.35 var(--font-ui);
}

.contact-path-card p {
  max-width: 510px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 15px/1.75 var(--font-body);
}

.contact-path-card a {
  display: inline-block;
  margin-top: 14px;
  color: var(--contact-brand);
  text-decoration: none;
  font: 700 10px/1.2 var(--font-mono);
}

.contact-path-card a:hover {
  color: var(--brand-hover);
}

.contact-outreach {
  background: transparent;
  border-top: 1px solid var(--border);
}

.contact-outreach-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(350px, .85fr);
  gap: 42px;
  align-items: start;
}

.contact-outreach-list {
  overflow: hidden;
  border: 1px solid var(--contact-line);
  border-radius: 10px;
  background: var(--card);
}

.contact-outreach-item {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 13px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--contact-line);
}

.contact-outreach-item:last-child {
  border-bottom: 0;
}

.contact-outreach-item > span {
  width: 25px;
  height: 25px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--contact-brand);
  font: 700 9px/1.2 var(--font-mono);
}

.contact-outreach-item h3 {
  margin: 1px 0 5px;
  color: var(--contact-ink);
  font: 700 14px/1.4 var(--font-ui);
}

.contact-outreach-item p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 14px/1.7 var(--font-body);
}

.contact-expect-card {
  padding: 27px 29px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--brand-soft), transparent 50%),
    var(--surface-elevated);
  color: var(--text-primary);
}

.contact-expect-card h3 {
  margin: 13px 0 9px;
  color: var(--text-primary);
  font: 700 24px/1.2 var(--font-ui);
  letter-spacing: -.035em;
}

.contact-expect-card > p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 14px/1.75 var(--font-body);
}

.contact-expect-card ul {
  display: grid;
  gap: 9px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.contact-expect-card li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--text-secondary);
  font: 500 12px/1.5 var(--font-mono);
}

.contact-expect-card li span {
  color: var(--contact-brand-bright);
  font-weight: 700;
}

.contact-final-cta {
  position: relative;
  min-height: 430px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: transparent;
  color: var(--text-primary);
  text-align: center;
  isolation: isolate;
}

.contact-final-grid {
  opacity: .4;
}

.contact-final-glow {
  position: absolute;
  width: 620px;
  height: 360px;
  left: 50%;
  bottom: -280px;
  transform: translateX(-50%);
  background: radial-gradient(circle, var(--brand-glow), transparent 68%);
  pointer-events: none;
}

.contact-final-inner {
  position: relative;
  z-index: 1;
  padding: 75px 0;
}

.contact-final-inner h2 {
  margin: 14px 0 13px;
  color: var(--text-primary);
  font: 700 clamp(31px, 4.3vw, 48px)/1.06 var(--font-ui);
  letter-spacing: -.055em;
}

.contact-final-inner h2 em {
  color: var(--contact-brand);
  font-style: normal;
}

.contact-final-inner > p {
  max-width: 550px;
  margin: 0 auto;
  color: var(--text-secondary);
  font: 400 15px/1.75 var(--font-body);
}

.contact-primary-button {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--text-xs);

  margin-top: var(--text-xl);
  padding: 0 var(--text-xl);

  border: 1px solid var(--brand);
  border-radius: var(--radius-sm);

  background: var(--brand);
  color: #ffffff;

  text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);
  line-height: 1;

  box-shadow: none;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.contact-primary-button:hover {
  transform: translateY(-2px);
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  color: #ffffff;
  box-shadow: var(--shadow-green);
}

.contact-primary-button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.contact-primary-button:active {
  transform: translateY(0);
}

.contact-final-email {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: var(--text-muted);
  font: 500 12px/1.55 var(--font-body);
}

.contact-final-email a {
  color: var(--contact-brand-bright);
  text-decoration: none;
}

.contact-final-email a:hover {
  text-decoration: underline;
}

@media (max-width: 950px) {
  .contact-hero-inner {
    grid-template-columns: 1fr;
    gap: 35px;
  }

  .contact-quick-card {
    max-width: 620px;
  }

  .contact-outreach-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .contact-container {
    width: min(100% - 28px, 620px);
  }

  .contact-hero {
    min-height: auto;
  }

  .contact-hero-inner {
    padding: 62px 0 85px;
  }

  .contact-hero-copy h1 {
    font-size: clamp(37px, 10vw, 50px);
  }

  .contact-hero-copy p {
    font-size: var(--text-md);
  }

  .contact-section {
    padding: 54px 0;
  }

  .contact-section-heading {
    display: block;
    margin-bottom: 23px;
  }

  .contact-section-heading h2 {
    font-size: var(--text-2xl);
  }

  .contact-index {
    display: block;
    margin-top: 13px;
  }

  .contact-path-grid {
    grid-template-columns: 1fr;
  }

  .contact-path-card {
    min-height: auto;
  }

  .contact-note {
    min-height: 62px;
    padding: 10px 0;
  }

  .contact-note p {
    font-size: var(--text-xs);
  }

  .contact-expect-card {
    padding: 25px 22px;
  }

  .contact-final-inner {
    padding: 62px 0;
  }
}


@media (max-width: 480px) {
  .contact-container {
    width: min(100% - 22px, 620px);
  }
  .contact-final-inner h2 br {
    display: none;
  }
}


  .contact-quick-card {
    padding: 19px;
  }

  .contact-meta-grid div {
    min-height: 57px;
  }

  .contact-path-card p,
  .contact-outreach-item p {
    font-size: var(--text-sm);
  }

  .contact-final-email {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-page *,
  .contact-page *::before,
  .contact-page *::after {
    transition: none !important;
  }
}



/* Theme support — inherit the AlloyPress global design system. */
html[data-theme="dark"] .contact-page,
body.dark .contact-page,
html.dark .contact-page {
  color: var(--foreground);
  background: transparent;
}

html[data-theme="light"] .contact-page,
body:not(.dark) .contact-page {
  color: var(--foreground);
  background: transparent;
}

html[data-theme="dark"] .contact-hero,
html[data-theme="light"] .contact-hero {
  background: transparent;
  color: var(--text-primary);
}

html[data-theme="dark"] .contact-paths,
html[data-theme="light"] .contact-paths,
html[data-theme="dark"] .contact-outreach,
html[data-theme="light"] .contact-outreach {
  background: transparent;
  border-color: var(--border);
}

html[data-theme="dark"] .contact-path-card,
html[data-theme="light"] .contact-path-card,
html[data-theme="dark"] .contact-outreach-list,
html[data-theme="light"] .contact-outreach-list {
  background: var(--card);
  border-color: var(--border);
}

html[data-theme="dark"] .contact-path-card:hover,
html[data-theme="light"] .contact-path-card:hover {
  background: var(--card-elevated);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

html[data-theme="dark"] .contact-expect-card,
html[data-theme="light"] .contact-expect-card {
  background: var(--surface-elevated);
  border-color: var(--border);
}

html[data-theme="dark"] .contact-final-cta,
html[data-theme="light"] .contact-final-cta {
  background: transparent;
  color: var(--text-primary);
}

html[data-theme="dark"] .contact-section-heading h2,
html[data-theme="light"] .contact-section-heading h2,
html[data-theme="dark"] .contact-path-card h3,
html[data-theme="light"] .contact-path-card h3,
html[data-theme="dark"] .contact-outreach-item h3,
html[data-theme="light"] .contact-outreach-item h3,
html[data-theme="dark"] .contact-final-inner h2,
html[data-theme="light"] .contact-final-inner h2 {
  color: var(--text-primary);
}

html[data-theme="dark"] .contact-section-heading p,
html[data-theme="light"] .contact-section-heading p,
html[data-theme="dark"] .contact-path-card p,
html[data-theme="light"] .contact-path-card p,
html[data-theme="dark"] .contact-outreach-item p,
html[data-theme="light"] .contact-outreach-item p,
html[data-theme="dark"] .contact-expect-card > p,
html[data-theme="light"] .contact-expect-card > p,
html[data-theme="dark"] .contact-final-inner > p,
html[data-theme="light"] .contact-final-inner > p {
  color: var(--text-secondary);
}

.contact-email {
  width: 100%;
  min-height: 43px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 13px;

  border: 1px solid var(--brand);
  border-radius: 7px;

  background: var(--brand);
  color: #ffffff;

  text-decoration: none;
  font: 600 14px/1.25 var(--font-mono);

  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  text-align: left;

  transition: background 0.2s ease, border-color 0.2s ease;
}

.contact-email b {
  color: #ffffff;
}

.contact-email:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  color: #ffffff;
}

.contact-email:hover b {
  color: #ffffff;
}


.contact-email-dialog {
  position: fixed;
  top: 50%;
  left: 50%;

  width: min(500px, calc(100% - 32px));
  max-width: 500px;

  margin: 0;
  padding: 0;

  transform: translate(-50%, -50%);

  border: 1px solid var(--border-strong);
  border-radius: 18px;

  background: var(--surface-elevated);
  color: var(--text-primary);

  box-shadow: var(--shadow-lg);
}

.contact-email-dialog::backdrop {
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(6px);
}

.contact-email-dialog-inner {
  position: relative;
  padding: 32px;
}

.contact-email-dialog h2 {
  margin: 14px 0 10px;
  color: var(--text-primary);
  font: 700 30px/1.12 var(--font-ui);
  letter-spacing: -.04em;
}

.contact-email-dialog p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font: 400 15px/1.7 var(--font-body);
}

.contact-email-dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.contact-email-copy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.contact-email-copy-row > span {
  flex: 1;
  min-width: 0;
  padding: 10px 11px;
  color: var(--text-primary);
  font: 600 14px/1.4 var(--font-ui);
  overflow-wrap: anywhere;
}

.contact-email-copy-button {
  flex: none;
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font: 600 13px/1 var(--font-ui);
  cursor: pointer;
}

.contact-email-copy-button:hover {
  background: var(--brand-hover);
}

@media (max-width: 600px) {
  .contact-email-dialog-inner {
    padding: 27px 20px;
  }

  .contact-email-copy-row {
    flex-direction: column;
    align-items: stretch;
  }

  .contact-email-copy-button {
    width: 100%;
  }
}
.contact-path-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.contact-email-dialog {
  max-height: calc(100dvh - 28px);
  overflow-y: auto;
}

.ct-field-label {
  display: block;
  margin: 16px 0 6px;
  color: var(--text-secondary);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.ct-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ct-topic {
  padding: 8px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  font: 600 var(--text-sm)/1.2 var(--font-ui);
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}

.ct-topic:hover {
  border-color: var(--brand);
}

.ct-topic.is-active {
  border-color: var(--brand);
  background: var(--brand);
  color: #fff;
}

.ct-topic:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.ct-mailto {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 13px 18px;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font: 700 var(--text-md)/1.2 var(--font-ui);
  text-decoration: none;
}

.ct-mailto:hover {
  background: var(--brand-hover);
}

.contact-email-dialog p.ct-hint {
  margin: 12px 0 0;
  font-size: 13px;
  text-align: center;
}


@media (max-width: 600px) {


  .contact-email-dialog {
    top: auto;
    bottom: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: 100%;
    border-radius: 18px 18px 0 0;
  }
}


/* ---- Layout and spacing tune-up ---- */
.contact-hero {
  min-height: 0;
}

.contact-hero-inner {
  padding: 64px 0 56px;
}

.contact-section {
  padding: 64px 0;
}

.contact-section-heading {
  margin-bottom: 32px;
}

.contact-path-card {
  display: flex;
  flex-direction: column;
}

.contact-path-card p {
  margin-bottom: 22px;
}

.contact-path-cta {
  margin-top: auto;
  align-self: flex-start;
}

.contact-outreach-layout {
  align-items: start;
}

.contact-outreach-main {
  display: grid;
  gap: 14px;
}

.contact-filter-note {
  margin: 0;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

.contact-expect-card {
  position: sticky;
  top: 96px;
}



.contact-final-cta {
  min-height: 0;
}

.contact-final-inner {
  padding: 72px 0 80px;
}

.ct-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.contact-email-copy-button {
  position: relative;
  min-width: 78px;
}

@media (max-width: 900px) {
  .contact-expect-card {
    position: static;
  }
}

@media (max-width: 600px) {
  .contact-section {
    padding: 48px 0;
  }

  .contact-hero-inner {
    padding: 44px 0 40px;
  }

  .contact-final-inner {
    padding: 56px 0 64px;
  }

}

`;