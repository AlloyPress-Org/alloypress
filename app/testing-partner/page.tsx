import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { withDefaultSocial } from "@/lib/seo/metadata";

import "@/components/css-style/testing-partner.css";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = withDefaultSocial(
  {
    title: "AI Tool Testing Partner",
    description:
      "Partner with AlloyPress for structured, real-world AI tool testing, competitive benchmarking, and business/SEO input grounded in category experience.",
    alternates: { canonical: "/testing-partner" },
  },
  "/testing-partner"
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
        name: "Testing Partner",
        url: "/testing-partner",
      },
    ]),
  ],
};

const partnerReceives = [
  "Structured testing reports with specific findings, not generic summaries",
  "Competitive benchmarking against tools we have already tested in your category",
  "Feature and product improvement suggestions grounded in category experience",
  "Business and SEO input where relevant to growth and discoverability",
  "Regular cadence as your product evolves, not a one-time engagement",
];

const testingPrinciples = [
  {
    number: "01",
    title: "Real-world testing, not demos",
    text: "We use your tool the way real users would — cold, with real prompts and real tasks. No curated walkthroughs or vendor-guided sessions. The feedback reflects what a first-time user actually encounters.",
  },
  {
    number: "02",
    title: "Structured written feedback",
    text: "After testing, you get a clear written breakdown covering what worked, what broke, where the experience creates friction, and what comparable tools handle better. Specific findings, not general impressions.",
  },
  {
    number: "03",
    title: "Feature and product suggestions",
    text: "We flag gaps, missing capabilities, and areas where the product experience could be meaningfully improved. These come from someone who has seen how similar tools solve the same problems across the category.",
  },
  {
    number: "04",
    title: "Business and SEO perspective",
    text: "Where relevant, we share observations on positioning, discoverability, messaging clarity, and how the product fits within the broader market landscape. The kind of input that helps a product team think beyond the product itself.",
  },
];

const approachCards = [
  {
    label: "Building and growing",
    title: "You are moving fast and need real signal.",
    text: "Internal teams see the product they built, not the product users experience. We come in cold, test without context, and find the friction that only shows up when someone encounters the tool for the first time.",
    bullets: [
      "Pre-launch evaluation before going public",
      "Output quality and UX feedback",
      "Benchmarking against tools in the same category",
      "Feature gap identification against competitors",
    ],
  },
  {
    label: "Established in market",
    title: "You are live. We keep you calibrated.",
    text: "Even strong products drift. Competitors improve. New use cases emerge. An ongoing testing partner gives you an independent read on where you stand before your users form that opinion for you.",
    bullets: [
      "Regular re-testing as the product evolves",
      "Competitive positioning perspective",
      "New feature validation against real use cases",
      "Ongoing product and growth input",
    ],
  },
];

const workflow = [
  {
    number: "01",
    title: "You reach out",
    text: "Email contact@alloypress.com with your product, what you want tested, and any relevant access or context. We respond within 1 to 2 business days.",
  },
  {
    number: "02",
    title: "We agree on scope and cadence",
    text: "We confirm which features or use cases to test, what the output looks like, and the timeline. For ongoing partnerships, we agree on a regular testing cadence that matches how fast your product moves.",
  },
  {
    number: "03",
    title: "We test properly",
    text: "Our team runs the tool through real tasks with real prompts. We benchmark against comparable tools, document findings with screenshots and notes, and track issues across the full experience.",
  },
  {
    number: "04",
    title: "You get structured findings",
    text: "A clear written report covering strengths, friction points, missing features, competitive gaps, and suggestions. The same standard we apply to every tool we write about publicly.",
  },
  {
    number: "05",
    title: "Repeat as your product grows",
    text: "The most useful testing relationships are ongoing. We re-test after major updates, validate new features, and track how the product changes over time so feedback stays relevant.",
  },
];

const outputs = [
  {
    mark: "Findings",
    title: "Written testing report",
    text: "A structured breakdown of what worked, what did not, and where the experience breaks down — with specific examples from testing.",
  },
  {
    mark: "Context",
    title: "Competitive benchmarking",
    text: "How your tool compares to others we have tested in the same category, based on consistent criteria we apply across every evaluation.",
  },
  {
    mark: "Direction",
    title: "Product improvement suggestions",
    text: "Specific feature ideas and UX improvements grounded in what real users need and what competing tools already do well in the category.",
  },
  {
    mark: "Growth",
    title: "Business and SEO input",
    text: "Observations on positioning, messaging clarity, discoverability, and how the product sits within the broader market landscape.",
  },
  {
    mark: "Continuity",
    title: "Ongoing re-testing",
    text: "Repeat testing cycles as your product evolves, so feedback stays current and you can track how changes land in practice.",
  },
  {
    mark: "Visibility",
    title: "Editorial coverage opportunity",
    text: "Tools that perform well in testing are considered for AlloyPress articles and reviews. Coverage ranks in search and gets cited in AI platforms including ChatGPT, Claude, Gemini, and Perplexity. Performance determines inclusion, not partnership",
  },
];

const differentiators = [
  {
    number: "01",
    title: "We test against real competition, not in isolation",
    text: "We have tested 250+ AI tools across 15+ categories using consistent frameworks. When we tell you where your product falls short, it is grounded in direct comparison with tools your users are already evaluating. A generic tester or UX researcher cannot offer that context.",
  },
  {
    number: "02",
    title: "We know the category, not just the tool",
    text: "Category knowledge is what separates useful feedback from general observations. We understand what good looks like in AI writing, image generation, video, humanisers, detectors, and a dozen other spaces because we have spent significant time testing inside each one.",
  },
  {
    number: "03",
    title: "We come in cold, the way your users do",
    text: "No curated walkthroughs, no vendor-guided sessions. We test with real prompts, real tasks, and no prior briefing on what to expect. The friction we find is exactly what a new user encounters on day one. That is where the most useful signal is.",
  },
  {
    number: "04",
    title: "The testing standard is not a black box",
    text: "You can read our published reviews and see exactly how we evaluate tools. Our scoring framework, the criteria we apply, and the way we write about strengths and weaknesses are all visible. You know precisely what standard your product is being held to before we begin.",
  },
  {
    number: "05",
    title: "Feedback gets more useful over time",
    text: "A single testing session produces a useful report. An ongoing partner produces something better: calibrated feedback that tracks how your product changes across cycles, spots regressions early, and validates improvements against the same consistent benchmark.",
  },
  {
    number: "06",
    title: "Independence is what makes it worth having",
    text: "We have no commercial incentive to be flattering. Our editorial decisions stay separate from testing. That separation is exactly why the feedback is credible. Brands that want honest signal choose partners who have no reason to soften it.",
  },
];

const standards = [
  "A testing partnership does not guarantee article inclusion or a dedicated review on AlloyPress.",
  "It does not guarantee a positive review or a specific ranking position in any article.",
  "Editorial decisions stay independent regardless of any partnership arrangement.",
  "It is not a one-time transaction. The value comes from ongoing testing across product cycles.",
];

export default function TestingPartnerPage() {
  return (
    <div className="testing-partner-page">
      <Script
        id="testing-partner-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <main>
        {/* Hero */}
        <section className="testing-partner-hero">
          <div className="testing-partner-container testing-partner-hero-grid">
            <div className="testing-partner-hero-copy">
              <span className="testing-partner-eyebrow">
                AI tool testing partner
              </span>

              <h1>
                An independent eye on your <em>AI product.</em>
              </h1>

              <p className="testing-partner-hero-description">
                AlloyPress works with AI teams as a structured testing partner —
                running independent evaluations, documenting what works and what
                doesn&apos;t, and delivering honest feedback that helps you
                improve continuously.
              </p>

              <div className="testing-partner-actions">
                <button
                  type="button"
                  className="testing-partner-btn testing-partner-btn-primary"
                  data-testing-email-open
                >
                  Start a conversation
                </button>

                <Link
                  className="testing-partner-btn testing-partner-btn-secondary"
                  href="#how-it-works"
                >
                  See how it works
                </Link>
              </div>
            </div>

            <div className="testing-partner-proof-card">
              <span className="testing-partner-proof-card-title">
                What partners receive
              </span>

              {partnerReceives.map((item) => (
                <div className="testing-partner-proof-line" key={item}>
                  <span />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we do */}
        <section className="testing-partner-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading testing-partner-section-heading-wide">
              <span className="testing-partner-eyebrow">What we do</span>
              <h2>Testing with real context behind it.</h2>
              <p>
                We have tested 250+ AI tools across more than 15 categories.
                That gives us a calibrated view of what good looks like in each
                space and where a product falls short before its users find
                out.
              </p>
              <p style={{ maxWidth: "none" }}>
                We currently work with AI brands across video, writing, image
                generation, and productivity categories.
              </p>
              <span className="testing-partner-section-count">01 / 05</span>
            </div>

            <div className="testing-partner-four-grid">
              {testingPrinciples.map((item) => (
                <article className="testing-partner-info-card" key={item.number}>
                  <span className="testing-partner-card-mark">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Who this is for */}
        <section className="testing-partner-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">Who this is for</span>
              <h2>Any AI team that wants an honest outside view.</h2>
              <p>
                Whether you are building something new or maintaining something
                already in the market, independent testing surfaces things
                internal teams consistently miss.
              </p>
            </div>

            <div className="testing-partner-two-grid">
              {approachCards.map((card) => (
                <article className="testing-partner-approach-card" key={card.title}>
                  <span className="testing-partner-card-label">{card.label}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <ul>
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>
                        <ChevronRight aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="testing-partner-section" id="how-it-works">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">How it works</span>
              <h2>Simple process, clear output.</h2>
              <p>
                No lengthy onboarding or vague deliverables. We agree on scope,
                run the testing, and give you something you can act on.
              </p>
            </div>

            <div className="testing-partner-workflow">
              {workflow.map((item) => (
                <div className="testing-partner-workflow-row" key={item.number}>
                  <span className="testing-partner-workflow-number">
                    {item.number}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="testing-partner-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">What you get</span>
              <h2>Concrete output, not a report that sits unread.</h2>
              <p>
                Every engagement produces something specific and actionable.
                Here is what partners receive from a testing cycle.
              </p>
            </div>

            <div className="testing-partner-three-grid">
              {outputs.map((item) => (
                <article className="testing-partner-output-card" key={item.title}>
                  <span className="testing-partner-card-mark">{item.mark}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why AlloyPress */}
        <section className="testing-partner-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">Why AlloyPress</span>
              <h2>What makes us different as a testing partner.</h2>
              <p>
                There are many ways to get feedback on a product. Here is why
                brands choose AlloyPress specifically for ongoing testing.
              </p>
            </div>

            <div className="testing-partner-differentiator-grid">
              {differentiators.map((item) => (
                <article className="testing-partner-differentiator" key={item.number}>
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What this is not */}
        <section className="testing-partner-section testing-partner-standards-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">What this is not</span>
              <h2>Worth saying clearly.</h2>
              <p>
                A testing partnership is a separate arrangement from AlloyPress
                editorial coverage. These distinctions matter and we keep them
                clean.
              </p>
            </div>

            <div className="testing-partner-standards-grid">
              {standards.map((item) => (
                <div className="testing-partner-standard" key={item}>
                  <Check aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="testing-partner-final-cta" id="testing-partner-request">
          <div className="testing-partner-container">
            <div className="testing-partner-cta-card">
              <div>
                <h2>Want an independent eye on your product?</h2>
                <p>
                  Tell us what you are building and what you would like tested.
                  We will respond within 1 to 2 business days and take it from
                  there. No templates, no lengthy intake forms.
                </p>
                <p>
                  Price is based on what you need. Share your products and priorities and we'll put together a scope that fits.
                </p>
              </div>

              <Link
                className="testing-partner-cta-email"
                href="/contact-us"
              >
                Contact AlloyPress
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <dialog
          className="testing-partner-email-dialog"
          data-testing-email-dialog
        >
          <div className="testing-partner-email-dialog-inner">
            <button
              type="button"
              className="testing-partner-email-close"
              data-testing-email-close
              aria-label="Close"
            >
              ×
            </button>

            <span className="testing-partner-eyebrow">
              Contact AlloyPress
            </span>

            <h2>Your product deserves an honest look.</h2>

            <p>
              Tell us about your product, what you’d like improve or test regularly and the monthly budget you have in mind. We respond within 2 to 3 business days.            </p>

            <div className="testing-partner-email-row">
              <span>contact@alloypress.com</span>

              <button
                type="button"
                className="testing-partner-email-copy"
                data-testing-email-copy
              >
                Copy
              </button>
            </div>
          </div>
        </dialog>

        <Script id="testing-partner-email-popup" strategy="afterInteractive">
          {`
    (() => {
      if (document.documentElement.dataset.testingPartnerEmailReady === "true") {
        return;
      }

      document.documentElement.dataset.testingPartnerEmailReady = "true";

      document.addEventListener("click", async (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const openButton = target.closest("[data-testing-email-open]");
        const closeButton = target.closest("[data-testing-email-close]");
        const copyButton = target.closest("[data-testing-email-copy]");
        const dialog = document.querySelector("[data-testing-email-dialog]");

        if (!dialog) return;

        if (openButton) {
          if (!dialog.open) dialog.showModal();
          return;
        }

        if (closeButton) {
          dialog.close();
          return;
        }

        if (target === dialog) {
          dialog.close();
          return;
        }

        if (copyButton) {
          try {
            await navigator.clipboard.writeText("contact@alloypress.com");
            copyButton.textContent = "Copied!";
          } catch {
            copyButton.textContent = "Copy failed";
          }

          window.setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1600);
        }
      });
    })();
  `}
        </Script>

      </main>
    </div>
  );
}