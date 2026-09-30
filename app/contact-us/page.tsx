import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Contact AlloyPress — AI Reviews, Partnerships & Enquiries",
  description:
    "Contact AlloyPress for AI tool reviews, article inclusion, partnerships, editorial enquiries, and other collaboration requests.",
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: "Contact AlloyPress — AI Reviews & Partnerships",
    description:
      "Get in touch with AlloyPress about AI tool reviews, editorial collaborations, partnerships, and enquiries.",
    type: "website",
  },
};

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
    icon: "▣",
    tag: "PAID COLLABORATION",
    title: "Article Inclusion",
    text: "Get your tool featured in one of our existing listicles or alternatives articles. We test the product, write a dedicated section, and include a link so readers can navigate to your site directly. Position is based on how the tool performs during our evaluation.",
    href: "#how-we-work",
  },
  {
    icon: "⌕",
    tag: "PAID COLLABORATION",
    title: "Dedicated Review",
    text: "A completely new, standalone article written specifically for your product. We test it hands-on across real workflows, document everything with screenshots, and publish a detailed in-depth review optimised for long-term search visibility.",
    href: "#how-we-work",
  },
  {
    icon: "◈",
    tag: "PARTNERSHIP",
    title: "Long-Term Partnership",
    text: "For brands and agencies looking to build an ongoing editorial relationship with AlloyPress. This includes early access for feature testing, regular content updates, promotional coverage, and digital marketing support.",
    href: "mailto:contact@alloypress.com?subject=Long-Term%20Partnership",
  },
  {
    icon: "◇",
    tag: "GENERAL",
    title: "General Enquiries",
    text: "For anything else — press mentions, factual corrections on an existing article, product update notifications, or anything that doesn't fit the other categories. Use the email directly and we'll route it to the right person.",
    link: "Send us an email",
    href: "mailto:contact@alloypress.com",
  },
];

const outreach = [
  ["01", "Product name and website URL", "So we can look at the tool before we even reply. Saves a round of back and forth."],
  ["02", "What you are looking for", "Tell us whether you are interested in an article inclusion, a full review, a partnership, or something else."],
  ["03", "Which article or category you have in mind", "If you want to be in one of our existing lists, tell us which one. It helps us check fit immediately."],
  ["04", "How your tool compares to competitors", "Mention which tools you see yourself competing with. This gives us useful context for the evaluation."],
  ["05", "Product access or demo details", "If you have a premium plan or a demo account ready for testing, share it. Makes everything faster."],
  ["06", "Use a business email", "Please reach out from an email address associated with your company or product. It helps us verify quickly."],
];

const expectations = [
  "Response within 1–2 business days",
  "Clear yes or no — no vague replies",
  "Honest feedback if your tool isn't a match",
  "All collaborations go through editorial review",
  "Open to agencies representing brands",
  "Long-term partnership discussions welcome",
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
              of our lists, or explore a longer-term partnership — reach out
              and we'll take it from there.
            </p>
          </div>

          <aside className="contact-quick-card">
            <div className="contact-response">
              <span />
              Usually responds within <strong>1 to 2 business days</strong>
            </div>

            <div className="contact-card-divider" />

            <div className="contact-label">CONTACT EMAIL</div>

            <button
              type="button"
              className="contact-email"
              data-email-popup-open
            >
              <span>Contact</span>
              <b>→</b>
            </button>

            <div className="contact-meta-grid">
              <div>
                <strong>Editorial</strong>
                <span>All collaborations</span>
              </div>
              <div>
                <strong>AI + SaaS</strong>
                <span>Focus area</span>
              </div>
              <div>
                <strong>1 to 2 days</strong>
                <span>Response time</span>
              </div>
              <div>
                <strong>Global</strong>
                <span>Open to work with</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="contact-hero-bottom">
          <div className="contact-container contact-note">
            <span className="contact-note-icon">⊘</span>
            <p>
              <strong>Quick note:</strong> Generic outreach, link swap requests,
              and unrelated pitches are filtered and ignored. If you have a
              genuine product or collaboration in mind, we'd love to hear from
              you.
            </p>
          </div>
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
                We collaborate in a few specific ways. Read through and pick
                the one that matches what you need — it helps us get back to
                you faster.
              </p>
            </div>
            <span className="contact-index">01 / 03</span>
          </header>

          <div className="contact-path-grid">
            {paths.map((path) => (
              <article className="contact-path-card" key={path.title}>
                <div className="contact-path-top">
                  <span className="contact-path-icon">{path.icon}</span>
                  <span className="contact-path-tag">{path.tag}</span>
                </div>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
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
                you a clear answer. Here is what helps.
              </p>
            </div>
            <span className="contact-index">02 / 03</span>
          </header>

          <div className="contact-outreach-layout">
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

            <aside className="contact-expect-card">
              <div className="contact-eyebrow contact-eyebrow-light">
                <span />
                WHAT TO EXPECT
              </div>
              <h3>We keep things straightforward.</h3>
              <p>
                No automated responses, no complex onboarding. When you email
                us, a real person reads it and replies with a clear answer —
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
            review the details and get back to you.
          </p>

          <button
            type="button"
            className="contact-primary-button"
            data-email-popup-open
          >
            Email AlloyPress <span>↗</span>
          </button>

          <div className="contact-final-email">
            <span>·</span>
            <span>Usually responds within 1–2 business days</span>
          </div>
        </div>
      </section>
      <dialog
        className="contact-email-dialog"
        data-email-dialog
      >
        <div className="contact-email-dialog-inner">
          <button
            type="button"
            className="contact-email-dialog-close"
            data-email-popup-close
            aria-label="Close"
          >
            ×
          </button>

          <div className="contact-eyebrow">
            <span />
            GET IN TOUCH
          </div>

          <h2>Contact AlloyPress</h2>

          <p>
            Send your enquiry to our email address.
            Copy the email below to continue.
          </p>

          <div className="contact-email-copy-row">
            <span>contact@alloypress.com</span>

            <button
              type="button"
              data-email-copy
              className="contact-email-copy-button"
            >
              Copy
            </button>
          </div>
        </div>
      </dialog>
      <Script id="contact-email-popup">
  {`
    (() => {
      const dialog = document.querySelector("[data-email-dialog]");

      if (!dialog || dialog.dataset.ready === "true") {
        return;
      }

      dialog.dataset.ready = "true";

      const openButtons = document.querySelectorAll(
        "[data-email-popup-open]"
      );

      const closeButton = dialog.querySelector(
        "[data-email-popup-close]"
      );

      const copyButton = dialog.querySelector(
        "[data-email-copy]"
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
        const email = "contact@alloypress.com";

        try {
          await navigator.clipboard.writeText(email);

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
  `}
</Script>
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

  .contact-hero-copy h1 br,
  .contact-final-inner h2 br {
    display: none;
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
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  text-align: left;
}

.contact-primary-button {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
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
`;
