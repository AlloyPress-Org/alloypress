import type { Metadata } from "next";
import Script from "next/script";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Do Not Sell or Share My Personal Information | AlloyPress",
  description:
    "Learn how AlloyPress handles personal information and how to submit a request regarding the sale or sharing of personal information.",
  alternates: {
    canonical: "/do-not-sell-my-info",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@graph": [
    createBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Do Not Sell or Share My Personal Information", url: "/do-not-sell-my-info" },
    ]),
  ],
};

const rights = [
  "Request access to your personal information",
  "Request the deletion of your information",
  "Request information regarding collected data",
  "Opt out of certain tracking technologies through your browser settings",
];

export default function DoNotSellPage() {
  return (
    <>
      <Script
        id="do-not-sell-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <main className="dns-page">
        <section className="dns-hero">
          <div className="dns-grid" aria-hidden="true" />
          <div className="dns-hero-glow" aria-hidden="true" />

          <div className="dns-container dns-hero-inner">
            <div className="dns-eyebrow">
              <span />
              PRIVACY CONTROL
            </div>

            <h1>
              Do Not Sell or Share
              <br />
              <span>My Personal Information</span>
            </h1>

            <p>
              Your privacy matters. Learn what information AlloyPress collects,
              how it may be used, and how you can exercise your privacy rights.
            </p>

            <div className="dns-meta">
              <span>LAST UPDATED</span>
              <strong>May 14, 2026</strong>
            </div>
          </div>
        </section>

        <section className="dns-content">
          <div className="dns-container dns-layout">
            <article className="dns-document">
              <div className="dns-document-head">
                <span className="dns-doc-number">01</span>
                <div>
                  <span className="dns-kicker">YOUR PRIVACY RIGHTS</span>
                  <h2>Do Not Sell or Share My Personal Information</h2>
                </div>
              </div>

              <p>
                At AlloyPress, we respect your privacy and are committed to
                protecting your personal information.
              </p>

              <p>
                Under certain privacy laws, including the California Consumer
                Privacy Act (CCPA) and California Privacy Rights Act (CPRA),
                users may have the right to request that businesses do not sell
                or share their personal information.
              </p>

              <div className="dns-callout">
                <span className="dns-callout-icon">✓</span>
                <div>
                  <strong>AlloyPress does not sell personal information</strong>
                  <p>
                    AlloyPress does not sell personal information to third
                    parties for monetary compensation.
                  </p>
                </div>
              </div>

              <h3>How information may still be collected</h3>

              <p>
                However, some third-party advertising, analytics, affiliate, or
                tracking services used on our website may collect limited
                information through cookies or similar technologies to improve
                user experience, analytics, advertising performance, or
                affiliate tracking.
              </p>

              <h3>Your privacy choices</h3>

              <p>You may:</p>

              <ul className="dns-rights">
                {rights.map((right, index) => (
                  <li key={right}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{right}</p>
                  </li>
                ))}
              </ul>

              <div className="dns-request">
                <span className="dns-kicker">SUBMIT A REQUEST</span>
                <h3>Want to make a privacy-related request?</h3>
                <p>
                  If you would like to submit a privacy-related request,
                  please contact us at:
                </p>

                <a href="mailto:contact@alloypress.com">
                  contact@alloypress.com <span>↗</span>
                </a>

                <p className="dns-small">
                  We may need to verify your identity before processing certain
                  requests.
                </p>
              </div>

              <h3>More information</h3>

              <p>
                For additional details about how we collect, use, and protect
                information, please review our Privacy Policy.
              </p>

              <p>
                Website:{" "}
                <a
                  href="https://alloypress.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://alloypress.com
                </a>
              </p>
            </article>

            <aside className="dns-sidebar">
              <div className="dns-side-card dns-side-primary">
                <span className="dns-side-dot" />
                <span className="dns-kicker">NEED HELP?</span>
                <h2>Have a privacy question?</h2>
                <p>
                  If you have a question about your personal information or
                  want to submit a privacy request, contact our team directly.
                </p>
                <a href="mailto:contact@alloypress.com">
                  Contact us <span>↗</span>
                </a>
              </div>

              <div className="dns-side-card dns-side-note">
                <span className="dns-side-index">02 / PRIVACY</span>
                <h3>Keep your request clear</h3>
                <p>
                  Tell us what you are requesting and provide enough
                  information for us to verify and process the request.
                </p>
              </div>

              <div className="dns-side-card dns-side-note">
                <span className="dns-side-index">03 / RESPONSE</span>
                <h3>Identity verification</h3>
                <p>
                  Certain requests may require verification before they can be
                  processed.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="dns-bottom">
          <div className="dns-container dns-bottom-inner">
            <div>
              <span className="dns-kicker">PRIVACY, WITHOUT THE FRICTION</span>
              <h2>Your information should stay under your control.</h2>
            </div>
            <a href="mailto:contact@alloypress.com">
              Contact AlloyPress <span>↗</span>
            </a>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </>
  );
}

const styles = `
.dns-page {
  color: var(--text-primary);
  background: var(--background);
  font-family: var(--font-body);
}

.dns-container {
  width: min(1180px, calc(100% - 48px));
  margin-inline: auto;
}

.dns-hero {
  position: relative;
  overflow: hidden;
  min-height: 455px;
  display: flex;
  align-items: center;

  background:
    radial-gradient(
      circle at 82% 35%,
      var(--brand-subtle) 0%,
      transparent 32%
    ),
    var(--background);

  color: var(--text-primary);
}

.dns-hero-glow {
  position: absolute;
  width: 520px;
  height: 520px;
  right: -170px;
  top: -190px;

  border-radius: 50%;
  background: var(--brand-subtle);

  filter: blur(110px);
  opacity: 0.7;
  pointer-events: none;
}

.dns-eyebrow,
.dns-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--brand);
  font: 700 var(--text-xs)/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.dns-eyebrow span,
.dns-side-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-soft);
}

.dns-hero h1 {
  max-width: 900px;
  margin: 20px 0 18px;
  color: var(--text-primary);
  font: 700 clamp(42px, 5.7vw, 78px)/.98 var(--font-ui);
  letter-spacing: -.055em;
}

.dns-hero h1 span {
  color: var(--brand);
}

.dns-hero > .dns-container > p {
  max-width: 700px;
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-lg)/1.7 var(--font-body);
}

.dns-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid var(--border-soft);
  width: min(700px, 100%);
}

.dns-meta span {
  color: var(--text-muted);
  font: 700 var(--text-xs)/1 var(--font-mono);
  letter-spacing: .12em;
}

.dns-meta strong {
  color: var(--text-primary);
  font: 600 var(--text-sm)/1 var(--font-mono);
}

.dns-content {
  padding: 64px 0 78px;
}

.dns-layout {
  display: grid;
  grid-template-columns: minmax(0, 780px) 310px;
  gap: 52px;
  align-items: start;
}

.dns-document {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: clamp(30px, 4vw, 52px);
  box-shadow: 0 18px 50px var(--shadow-sm);
}

.dns-document-head {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 28px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border);
}

.dns-doc-number {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: var(--radius-sm);
  background: var(--brand-soft);
  color: var(--brand-hover);
  font: 700 var(--text-xs)/1 var(--font-mono);
}

.dns-document h2 {
  margin: 8px 0 0;
  font: 700 clamp(25px, 3vw, 36px)/1.15 var(--font-ui);
  letter-spacing: -.035em;
}

.dns-document > p,
.dns-document li p {
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.82 var(--font-body);
}

.dns-document > p {
  margin: 0 0 22px;
}

.dns-document h3 {
  margin: 34px 0 12px;
  color: var(--text-primary);
  font: 700 var(--text-xl)/1.3 var(--font-ui);
  letter-spacing: -.025em;
}

.dns-callout {
  display: flex;
  gap: 16px;
  margin: 30px 0;
  padding: 20px 22px;
  border: 1px solid var(--brand-soft);
  border-left: 3px solid var(--brand);
  border-radius: var(--radius-lg);
  background: var(--brand-subtle);
}

.dns-callout-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: var(--radius-sm);
  background: var(--brand-soft);
  color: var(--brand-hover);
  font: 700 14px/1 var(--font-mono);
}

.dns-callout strong {
  display: block;
  margin: 2px 0 7px;
  color: var(--text-primary);
  font: 700 15px/1.35 var(--font-ui);
}

.dns-callout p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.65 var(--font-body);
}

.dns-rights {
  display: grid;
  gap: 0;
  margin: 16px 0 30px;
  padding: 0;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.dns-rights li {
  display: grid;
  grid-template-columns: 38px 1fr;
  align-items: center;
  gap: 14px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--border);
}

.dns-rights li:last-child {
  border-bottom: 0;
}

.dns-rights li > span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--brand-hover);
  font: 700 9px/1 var(--font-mono);
}

.dns-rights p {
  margin: 0 !important;
  color: var(--text-primary) !important;
  font-family: var(--font-ui) !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  font-weight: 600 !important;
}

.dns-request {
  margin: 38px 0;
  padding: 28px;
  border-radius: var(--radius-md);
  background: var(--background);
  color: #fff;
}

.dns-request .dns-kicker {
  margin-bottom: 10px;
}

.dns-request h3 {
  margin: 0 0 10px;
  color: var(--text-primary);
  font-size: 23px;
}

.dns-request p {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.dns-request a,
.dns-document a {
  color: var(--brand);
  font-weight: 700;
  text-decoration: none;
}

.dns-request a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: 700 13px/1 var(--font-mono);
}

.dns-request .dns-small {
  margin-top: 18px;
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.dns-sidebar {
  position: sticky;
  top: 92px;
  display: grid;
  gap: 14px;
}

.dns-side-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
}

.dns-side-primary {
  border-color: var(--brand-soft);
  box-shadow: 0 12px 35px var(--shadow-sm);
}

.dns-side-dot {
  display: inline-block;
  margin-bottom: 17px;
}

.dns-side-card h2 {
  margin: 10px 0 9px;
  color: var(--text-primary);
  font: 700 var(--text-xl)/1.2 var(--font-ui);
  letter-spacing: -.03em;
}

.dns-side-card p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 13px/1.7 var(--font-body);
}

.dns-side-primary > a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 20px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  background: var(--brand);
  color: var(--background);
  font: 700 var(--text-xs)/1 var(--font-mono);
  text-decoration: none;
}

.dns-side-index {
  display: block;
  margin-bottom: 12px;
  color: var(--brand-hover);
  font: 700 9px/1 var(--font-mono);
  letter-spacing: .08em;
}

.dns-side-note h3 {
  margin: 0 0 7px;
  font-size: 15px;
}

.dns-bottom {
  position: relative;
  overflow: hidden;
  padding: 52px 0;
  background:
    radial-gradient(circle at 75% 50%, var(--brand-soft), transparent 30%),
    var(--background);
  color: #fff;
}

.dns-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.dns-bottom h2 {
  max-width: 650px;
  margin: 10px 0 0;
  color: var(--text-primary);
  font: 700 clamp(25px, 3.5vw, 42px)/1.1 var(--font-ui);
  letter-spacing: -.04em;
}

.dns-bottom-inner > a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  background: var(--brand);
  color: var(--background);
  font: 700 var(--text-xs)/1 var(--font-mono);
  text-decoration: none;
  transition: transform .2s ease, background .2s ease;
}

.dns-bottom-inner > a:hover {
  transform: translateY(-2px);
  background: var(--brand-hover);
}

@media (max-width: 900px) {
  .dns-layout {
    grid-template-columns: 1fr;
  }

  .dns-sidebar {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dns-side-primary {
    grid-column: 1 / -1;
  }

  .dns-bottom-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .dns-container {
    width: min(100% - 28px, 1180px);
  }

  .dns-hero {
    min-height: auto;
  }

  .dns-hero-inner {
    padding: 58px 0 52px;
  }

  .dns-hero h1 {
    font-size: clamp(36px, 11vw, 52px);
    line-height: 1.02;
  }

  .dns-hero > .dns-container > p {
    font-size: 15px;
    line-height: 1.7;
  }

  .dns-content {
    padding: 28px 0 42px;
  }

  .dns-document {
    padding: 24px 20px;
    border-radius: var(--radius-lg);
  }

  .dns-document-head {
    gap: 12px;
  }

  .dns-document > p,
  .dns-document li p {
    font-size: 15px;
    line-height: 1.78;
  }

  .dns-document h3 {
    font-size: 18px;
    margin-top: 28px;
  }

  .dns-sidebar {
    grid-template-columns: 1fr;
  }

  .dns-side-primary {
    grid-column: auto;
  }

  .dns-rights li {
    grid-template-columns: 32px 1fr;
    padding: 13px 12px;
    gap: 10px;
  }

  .dns-request {
    padding: 22px 18px;
  }

  .dns-bottom {
    padding: 42px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dns-bottom-inner > a {
    transition: none;
  }
}
.dns-side-primary > a,
.dns-bottom-inner > a {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--text-xs);
  padding: 0 var(--text-xl);
  border: 1px solid var(--brand);
  border-radius: var(--radius-sm);
  background: var(--brand);
  color: #fff;
  text-decoration: none;
  font: 600 var(--text-sm)/1 var(--font-ui);
  box-shadow: none;
  transition:
    background .2s ease,
    border-color .2s ease,
    transform .2s ease,
    box-shadow .2s ease;
}

.dns-side-primary > a:hover,
.dns-bottom-inner > a:hover {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: var(--shadow-green);
}

.dns-side-primary > a:focus-visible,
.dns-bottom-inner > a:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.dns-side-primary > a:active,
.dns-bottom-inner > a:active {
  transform: translateY(0);
}

.dns-page .dns-hero h1,
.dns-page .dns-document h2,
.dns-page .dns-document h3,
.dns-page .dns-side-card h2,
.dns-page .dns-bottom h2 {
  color: var(--text-primary);
}

.dns-page .dns-hero > .dns-container > p,
.dns-page .dns-document > p,
.dns-page .dns-document li p,
.dns-page .dns-callout p,
.dns-page .dns-side-card p,
.dns-page .dns-request p {
  color: var(--text-secondary);
  opacity: 1;
}

.dns-page .dns-document,
.dns-page .dns-side-card {
  background: var(--card);
  border-color: var(--border);
}

.dns-page .dns-document {
  box-shadow: var(--shadow-sm);
}

.dns-page .dns-content {
  background:
    radial-gradient(circle at 90% 5%, var(--brand-subtle), transparent 26%),
    var(--background-base);
}

.dns-page .dns-request,
.dns-page .dns-bottom {
  background:
    radial-gradient(circle at 75% 50%, var(--brand-soft), transparent 30%),
    var(--background);
  color: var(--text-primary);
}

.dns-page .dns-request h3 {
  color: var(--text-primary);
}

.dns-page .dns-request p {
  color: var(--text-secondary);
}

.dns-page .dns-document a,
.dns-page .dns-request a {
  color: var(--brand);
}

.dns-page .dns-document a:hover,
.dns-page .dns-request a:hover {
  color: var(--brand-hover);
}
`;