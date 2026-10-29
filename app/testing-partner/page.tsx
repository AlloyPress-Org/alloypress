import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { withDefaultSocial } from "@/lib/seo/metadata";
import { BrandLogos } from "@/components/shared/ProofStrip";

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
    text: "We use your tool the way real users would: cold, with real prompts and real tasks. No curated walkthroughs or vendor-guided sessions.",
  },
  {
    number: "02",
    title: "Structured written feedback",
    text: "After testing, you get a clear written breakdown covering what worked, what broke, where the experience creates friction, and what comparable tools handle better.",
  },
  {
    number: "03",
    title: "Feature and product suggestions",
    text: "We flag gaps, missing capabilities, and areas where the product experience could be meaningfully improved, from someone who has seen how similar tools solve the same problems.",
  },
  {
    number: "04",
    title: "Business and SEO perspective",
    text: "Where relevant, we share observations on positioning, discoverability, messaging clarity, and how the product fits within the broader market landscape.",
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
    text: "Email contact@alloypress.com with your product, what you want tested, and any relevant access or context. We respond within 1 to 3 business days.",
  },
  {
    number: "02",
    title: "We agree on scope and cadence",
    text: "We confirm which features or use cases to test, what the output looks like, and the timeline. For ongoing partnerships, we agree on a regular testing cadence.",
  },
  {
    number: "03",
    title: "We test properly",
    text: "Our team runs the tool through real tasks with real prompts. We benchmark against comparable tools, document findings with screenshots and notes, and track issues across the full experience.",
  },
  {
    number: "04",
    title: "You get structured findings",
    text: "A clear written report covering strengths, friction points, missing features, competitive gaps, and suggestions.",
  },
  {
    number: "05",
    title: "Repeat as your product grows",
    text: "The most useful testing relationships are ongoing. We re-test after major updates, validate new features, and track how the product changes over time",
  },
];

const outputs = [
  {
    mark: "Findings",
    title: "Written testing report",
    text: "A structured breakdown of what worked, what did not, and where the experience breaks down, with specific examples from testing.",
  },
  {
    mark: "Context",
    title: "Competitive benchmarking",
    text: "How your tool compares to others we have tested in the same category, based on consistent criteria.",
  },
  {
    mark: "Direction",
    title: "Product improvement suggestions",
    text: "Specific feature ideas and UX improvements grounded in what real users need and what competing tools do well.",
  },
  {
    mark: "Growth",
    title: "Business and SEO input",
    text: "Observations on positioning, messaging clarity, discoverability, and how the product sits within the broader market.",
  },
  {
    mark: "Continuity",
    title: "Ongoing re-testing",
    text: "Repeat testing cycles as your product evolves, so feedback stays current and you can track how changes land.",
  },
  {
    mark: "Visibility",
    title: "Editorial coverage opportunity",
    text: "Tools that perform well in testing are considered for AlloyPress articles and reviews. Performance determines inclusion, not partnership.",
  },
];

type Priority = "High" | "Medium" | "Quick win";

const reportGroups: {
  title: string;
  note?: string;
  items: [Priority, string][];
}[] = [
  {
    title: "1. Bugs and reliability",
    items: [
      ["High", "Follow-up requests sometimes fail with a \"PIN not found\" error, with no prompt to enter one. A retry fixes it, so users see it as random and stop trusting the tool."],
      ["High", "Credits are still deducted when a generation fails. Users pay for nothing, and paying users notice this fastest."],
      ["Medium", "Voice input handles short prompts well but returns an error on longer ones."],
      ["Medium", "The AI edit prompt fails with no error message once input passes about 500 characters."],
    ],
  },
  {
    title: "2. Output quality",
    items: [
      ["High", "The article writer adds no images where readers expect them. Tone, EEAT-aligned structure and formatting trail the category leaders. A stronger writer could become the most compelling tool in the suite."],
      ["Medium", "On the same coding prompts, the in-house model gave shallower output than a leading third-party model."],
    ],
  },
  {
    title: "3. Usage and adoption",
    items: [
      ["High", "The research agent behaves like the article writer, so users won't see why both exist and will likely use only one."],
      ["Quick win", "Remaining AI credits are hidden in the dashboard. Showing them on every generation screen removes the most common point of confusion."],
      ["Medium", "The featured tools are what new users try first. Polishing those first protects the first impression."],
    ],
  },
  {
    title: "4. Hidden issues that cost repeat users",
    note: "These rarely show up in your analytics or support tickets. Users simply don't come back.",
    items: [
      ["High", "Work in progress is lost on a page refresh or an expired session, with no autosave or draft history."],
      ["High", "The sign-up verification email lands in spam for Outlook users, so part of every day's sign-ups never activate."],
      ["Medium", "On phones, the export button sits off-screen, so mobile users can create but can't download."],
      ["Medium", "Cancelling a plan takes five screens and a support email, which turns a quiet churn into a public complaint."],
    ],
  },
  {
    title: "5. New feature suggestions",
    items: [
      ["Medium", "Inline section editing and auto-generated tables in the article writer."],
      ["Medium", "Follow-up prompts and an edit-and-preview mode inside the presentation builder."],
      ["Medium", "A built-in blog with a customizable template and an AI blog writer. Two of the benchmarked competitors already offer this."],
    ],
  },
  {
    title: "6. Marketing and positioning",
    items: [
      ["Medium", "The \"Start for free\" button leads to a paid-plan step, which feels misleading at sign-up."],
      ["Quick win", "Unanswered reviews on Trustpilot and G2 show up in brand searches. Replying to them builds trust with people still deciding."],
      ["Medium", "The homepage lists features, while competitors lead with the outcome for their main user type."],
    ],
  },
  {
    title: "7. SEO, search results and AI visibility",
    note: "We check how your brand shows up on Google and in AI answers, not just inside the product.",
    items: [
      ["High", "Two brand domains rank for the brand name and compete with each other. Pick one primary domain and redirect the other to combine their ranking strength."],
      ["High", "ChatGPT and Perplexity name two competitors for \"best [category] tool\" but not you. They cite comparison pages, and you have none."],
      ["High", "Feature pages load their content with JavaScript only, so Google indexes an almost empty page."],
      ["Medium", "Old URLs from the last redesign return 404 with no redirects, so the backlinks pointing at them are wasted."],
      ["Medium", "Competitors own \"[Product] alternatives\" and \"[Product] vs [Competitor]\" searches, so people researching you land on their pages."],
      ["Quick win", "Product pages carry no structured data, so search results show no pricing or ratings next to the brand."],
    ],
  },
];

const benchmarkRows = [
  ["Output quality", "Average", "Strong", "Average"],
  ["Reliability", "Inconsistent", "Strong", "Strong"],
  ["Editing controls", "Limited", "Strong", "Average"],
  ["First-time setup", "Strong", "Average", "Average"],
  ["Usage visibility", "Hidden", "Clear", "Clear"],
  ["Pricing clarity", "Average", "Average", "Strong"],
  ["Cited in AI answers", "No", "Yes", "Yes"],
];

const topRecommendations = [
  "Stop charging credits on failed generations and fix the follow-up error. Both break trust with paying users.",
  "Add autosave and fix the verification email, so new users activate and keep their work.",
  "Get into AI answers and Google: one primary domain, indexable feature pages, and your own comparison pages.",
];

const pilotIncludes = [
  ["One full testing round", "Real prompts and real tasks across the features you choose"],
  ["A written report", "Findings, benchmark snapshot and suggestions"],
  ["A 30-minute walkthrough call", "We go through the findings together"],
  ["SEO input, if you want it", "Discoverability and positioning notes alongside the report"],
];

const popups = {
  partnership: {
    eyebrow: "Testing partnership",
    title: "Talk to us about a testing partnership",
    text: "Tell us what you're building. We'll suggest a scope around your priorities and budget, usually within 1 to 3 business days.",
    subject: "Testing partnership: [Your product]",
    include: [
      "What you're building and your website",
      "What you'd like tested",
      "One round or a regular cadence",
      "The budget you have in mind",
    ],
  },
  pilot: {
    eyebrow: "Pilot",
    title: "Start with one testing cycle",
    text: "Tell us what to test first. We'll shape the scope and fee around your budget and show exactly what's delivered at that level.",
    subject: "Testing pilot: [Your product]",
    include: [
      "Product name and website",
      "The features you want tested first",
      "The budget you have in mind",
      "Test access you can share",
    ],
  },
} as const;

const popupEmail = "contact@alloypress.com";

function mailtoFor(subject: string, include: readonly string[]) {
  const body = include.map((line) => encodeURIComponent(`${line}:\n`)).join("");
  return `mailto:${popupEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

const differentiators = [
  {
    number: "01",
    title: "We test against real competition, not in isolation",
    text: "We have tested 250+ AI tools across 15+ categories using consistent frameworks, so feedback is grounded in direct comparison with tools your users are already evaluating.",
  },
  {
    number: "02",
    title: "We know the category, not just the tool",
    text: "We understand what good looks like in AI writing, image generation, video, humanisers, detectors, and a dozen other spaces.",
  },
  {
    number: "03",
    title: "We come in cold, the way your users do",
    text: "No curated walkthroughs, no vendor-guided sessions. We test with real prompts, real tasks, and no prior briefing on what to expect.",
  },
  {
    number: "04",
    title: "The testing standard is not a black box",
    text: "You can read our published reviews and see exactly how we evaluate tools. You know precisely what standard your product is being held to.",
  },
  {
    number: "05",
    title: "Feedback gets more useful over time",
    text: "A single testing session produces a useful report. An ongoing partner produces something better: calibrated feedback that tracks how your product changes across cycles and validates improvements.",
  },
  {
    number: "06",
    title: "Independence is what makes it worth having",
    text: "Our editorial decisions stay separate from testing. That separation is exactly why the feedback is credible.",
  },
];

const standards = [
  "A testing partnership does not guarantee article inclusion or a dedicated review on AlloyPress.",
  "It does not guarantee a positive review or a specific ranking position in any article.",
  "Editorial decisions stay independent regardless of any partnership arrangement.",
  "It is not a one-time transaction. The value comes from ongoing testing across product cycles.",
];

const extraCss = `
.tp-response{display:flex;align-items:center;gap:8px;margin:0;color:var(--text-secondary);font-size:14px;font-weight:600}
.tp-response span{flex:none;width:8px;height:8px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 4px color-mix(in srgb,var(--brand) 20%,transparent)}
.testing-partner-proof-card .tp-response{margin-top:4px;padding-top:18px;border-top:1px solid var(--border)}
.tp-brand-logos{margin:0 0 44px;padding:8px 0}
.tp-report-section{position:relative;background:linear-gradient(180deg,transparent 0,color-mix(in srgb,var(--brand) 7%,transparent) 14%,color-mix(in srgb,var(--brand) 7%,transparent) 86%,transparent 100%);border-block:1px solid color-mix(in srgb,var(--brand) 18%,var(--border))}
.tp-report{position:relative;border:1px solid color-mix(in srgb,var(--brand) 45%,var(--border-strong));border-radius:18px;background:var(--surface);overflow:hidden;box-shadow:0 28px 70px -28px color-mix(in srgb,var(--brand) 45%,transparent),0 0 0 5px color-mix(in srgb,var(--brand) 8%,transparent)}
.tp-report::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:linear-gradient(90deg,var(--brand),color-mix(in srgb,var(--brand) 25%,transparent))}
.tp-report-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;padding:28px 28px 24px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--brand) 10%,transparent)}
.tp-report-head h3{margin:0 0 6px;color:var(--text-primary);font-size:20px;font-weight:700}
.tp-report-head p{margin:0;color:var(--text-secondary);font-size:14px}
.tp-report-badges{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
.tp-report-badges span{padding:6px 12px;border:1px solid var(--border-strong);border-radius:999px;color:var(--text-primary);font-size:12px;font-weight:600}
.tp-report-badges span:first-child{border-color:var(--brand);background:var(--brand);color:#fff}
.tp-legend{display:flex;flex-wrap:wrap;gap:10px;padding:16px 28px;border-bottom:1px solid var(--border)}
.tp-pill{display:inline-block;flex:none;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;line-height:1.5;white-space:nowrap}
.tp-high{background:color-mix(in srgb,#e5484d 16%,transparent);color:#e5484d}
.tp-medium{background:color-mix(in srgb,#e0a100 18%,transparent);color:#b98300}
.tp-quick{background:color-mix(in srgb,var(--brand) 16%,transparent);color:var(--brand)}
html[data-theme="dark"] .tp-medium{color:#f0b429}
.tp-report-body{padding:8px 28px 28px}
.tp-report-group{padding-top:24px}
.tp-report-group h4{margin:0 0 6px;color:var(--text-primary);font-size:17px;font-weight:700}
.tp-report-note{margin:0 0 8px;color:var(--text-secondary);font-size:14px;font-style:italic}
.tp-report-group ul{margin:10px 0 0;padding:0;list-style:none}
.tp-report-group li{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid var(--border)}
.tp-report-group li p{margin:0;color:var(--text-secondary);font-size:14.5px;line-height:1.6}
.tp-table-wrap{overflow-x:auto;margin-top:10px;border:1px solid var(--border);border-radius:12px}
.tp-table{width:100%;min-width:520px;border-collapse:collapse;font-size:14px}
.tp-table th,.tp-table td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--border);color:var(--text-secondary)}
.tp-table thead th{background:color-mix(in srgb,var(--brand) 6%,transparent);color:var(--text-primary);font-weight:700}
.tp-table tbody th{color:var(--text-primary);font-weight:600}
.tp-table tr:last-child th,.tp-table tr:last-child td{border-bottom:0}
.tp-good{color:var(--brand)!important;font-weight:700}
.tp-bad{color:#e5484d!important;font-weight:700}
.tp-report-top ol{margin:10px 0 0;padding-left:22px;color:var(--text-secondary);font-size:14.5px;line-height:1.7}
.tp-report-top ol li{display:list-item;padding:4px 0;border:0}
.tp-report-next{margin:16px 0 0;padding:14px 16px;border-left:3px solid var(--brand);background:color-mix(in srgb,var(--brand) 7%,transparent);color:var(--text-secondary);font-size:14.5px;line-height:1.6}
.tp-pilot{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:40px;align-items:center;padding:40px;border:1px solid var(--border-strong);border-radius:20px;background:color-mix(in srgb,var(--brand) 5%,var(--surface))}
.tp-pilot-copy h2{margin:12px 0 12px;color:var(--text-primary);font-size:clamp(28px,3.4vw,38px);line-height:1.1;font-weight:800;letter-spacing:-.04em}
.tp-pilot-copy p{margin:0 0 22px;color:var(--text-secondary);font-size:16px;line-height:1.7}
.tp-pilot-list{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.tp-pilot-list li{display:flex;gap:12px;padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
.tp-pilot-list svg{flex:none;width:20px;height:20px;margin-top:2px;color:var(--brand)}
.tp-pilot-list strong{display:block;color:var(--text-primary);font-size:15px}
.tp-pilot-list span{display:block;margin-top:2px;color:var(--text-secondary);font-size:14px;line-height:1.5}
.tp-cta-actions{display:flex;flex-wrap:wrap;gap:12px}
.tp-cta-secondary{background:transparent!important;color:var(--text-primary)!important;border:1px solid var(--border-strong)!important}
button.testing-partner-cta-email{cursor:pointer;font:inherit}
.tp-field-label{display:block;margin:0 0 6px;color:var(--text-secondary);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.testing-partner-email-dialog .testing-partner-email-row{margin-bottom:16px}
.testing-partner-email-dialog{max-height:calc(100dvh - 28px);overflow-y:auto}
.tp-include{margin:0 0 20px;padding:0;list-style:none}
.tp-include li{display:flex;gap:8px;margin:0 0 6px;color:var(--text-primary);font-size:14px}
.tp-include li::before{content:"";flex:none;width:6px;height:6px;margin-top:8px;border-radius:50%;background:var(--brand)}
.tp-mailto{display:flex;justify-content:center;padding:13px 18px;border-radius:10px;background:var(--brand);color:#fff!important;font-size:15px;font-weight:700;text-decoration:none}
.tp-mailto:hover{background:var(--brand-hover)}
.testing-partner-email-dialog p.tp-hint{margin:12px 0 0;font-size:13px;text-align:center}
@media(max-width:900px){.tp-pilot{grid-template-columns:1fr;padding:24px}.tp-report-head,.tp-legend,.tp-report-body{padding-left:18px;padding-right:18px}.testing-partner-email-dialog{top:auto;bottom:0;left:0;transform:none;width:100%;max-width:100%;border-radius:18px 18px 0 0}.testing-partner-email-dialog-inner{padding:26px 20px}}
`;

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
                AlloyPress works with AI teams as a structured testing partner:
                running independent evaluations, documenting what works and what
                doesn&apos;t, and delivering honest feedback that helps you
                improve continuously.
              </p>

              <div className="testing-partner-actions">
                <button
                  type="button"
                  className="testing-partner-btn testing-partner-btn-primary"
                  data-tp-open="partnership"
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

              <p className="tp-response">
                <span aria-hidden="true" />
                Response within 1 to 3 business days
              </p>
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
                generation and productivity categories.
              </p>
              <span className="testing-partner-section-count">01 / 05</span>
            </div>

            <BrandLogos label="" className="tp-brand-logos" />

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

        {/* Sample report (highlighted) */}
        <section
          className="testing-partner-section tp-report-section"
          id="sample-report"
        >
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">Sample report</span>
              <h2>Here&apos;s what a testing report looks like.</h2>
              <p>
                Every finding comes from our own hands-on testing, is tagged by
                priority, and comes with a suggested fix. Product, search and
                marketing are covered in one report.
              </p>
            </div>

            <div className="tp-report">
              <header className="tp-report-head">
                <div>
                  <h3>Testing report · Cycle 1 · [Product]</h3>
                  <p>Tested cold with real prompts and real tasks. No vendor walkthrough.</p>
                </div>
                <div className="tp-report-badges">
                  <span>Sample report</span>
                  <span>25 findings</span>
                  <span>2 competitors benchmarked</span>
                </div>
              </header>

              <div className="tp-legend">
                <span className="tp-pill tp-high">High: fix first</span>
                <span className="tp-pill tp-medium">Medium: plan in</span>
                <span className="tp-pill tp-quick">Quick win: small effort</span>
              </div>

              <div className="tp-report-body">
                {reportGroups.map((group) => (
                  <div className="tp-report-group" key={group.title}>
                    <h4>{group.title}</h4>
                    {group.note && <p className="tp-report-note">{group.note}</p>}
                    <ul>
                      {group.items.map(([priority, text]) => (
                        <li key={text}>
                          <span
                            className={`tp-pill ${
                              priority === "High"
                                ? "tp-high"
                                : priority === "Medium"
                                  ? "tp-medium"
                                  : "tp-quick"
                            }`}
                          >
                            {priority}
                          </span>
                          <p>{text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="tp-report-group">
                  <h4>Benchmark snapshot: same prompts, same tasks</h4>
                  <div className="tp-table-wrap">
                    <table className="tp-table">
                      <thead>
                        <tr>
                          <th>Area</th>
                          <th>[Product]</th>
                          <th>Competitor A</th>
                          <th>Competitor B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarkRows.map(([area, ...cells]) => (
                          <tr key={area}>
                            <th scope="row">{area}</th>
                            {cells.map((cell, index) => (
                              <td
                                key={`${area}-${index}`}
                                className={
                                  ["Strong", "Clear", "Yes"].includes(cell)
                                    ? "tp-good"
                                    : ["Inconsistent", "Limited", "Hidden", "No"].includes(cell)
                                      ? "tp-bad"
                                      : ""
                                }
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="tp-report-group tp-report-top">
                  <h4>Top 3 recommendations</h4>
                  <ol>
                    {topRecommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  <p className="tp-report-next">
                    <strong>Next cycle:</strong> we re-test these fixes, update
                    the benchmark, and track what changed since Cycle 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why AlloyPress */}
        <section className="testing-partner-section">
          <div className="testing-partner-container">
            <div className="testing-partner-section-heading">
              <span className="testing-partner-eyebrow">Why AlloyPress</span>
              <h2>What makes us different as a testing partner.</h2>
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

        {/* Pilot */}
        <section className="testing-partner-section" id="pilot">
          <div className="testing-partner-container">
            <div className="tp-pilot">
              <div className="tp-pilot-copy">
                <span className="testing-partner-eyebrow">Not sure yet?</span>
                <h2>Start with one testing cycle.</h2>
                <p>
                  Try the partnership on a single round first. We set the scope
                  and fee around your priorities and the budget you can
                  allocate, and show you exactly what&apos;s delivered at that
                  level. If it&apos;s useful, we set up an ongoing cadence.
                </p>
                <button
                  type="button"
                  className="testing-partner-btn testing-partner-btn-primary"
                  data-tp-open="pilot"
                >
                  Start with one cycle
                </button>
              </div>

              <ul className="tp-pilot-list">
                {pilotIncludes.map(([title, text]) => (
                  <li key={title}>
                    <Check aria-hidden="true" />
                    <div>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </div>
                  </li>
                ))}
              </ul>
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
                  We will respond within 1 to 3 business days and take it from
                  there. Scope and fees are based on what you need and the
                  budget you have in mind.
                </p>
              </div>

              <div className="tp-cta-actions">
                <button
                  type="button"
                  className="testing-partner-cta-email"
                  data-tp-open="partnership"
                >
                  Contact AlloyPress
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="testing-partner-cta-email tp-cta-secondary"
                  data-tp-open="pilot"
                >
                  Start with one cycle
                </button>
              </div>
            </div>
          </div>
        </section>
        {(Object.keys(popups) as (keyof typeof popups)[]).map((key) => {
          const popup = popups[key];
          return (
            <dialog
              className="testing-partner-email-dialog"
              data-tp-dialog={key}
              aria-labelledby={`tp-popup-${key}`}
              key={key}
            >
              <div className="testing-partner-email-dialog-inner">
                <button
                  type="button"
                  className="testing-partner-email-close"
                  data-tp-close
                  aria-label="Close"
                >
                  ×
                </button>

                <span className="testing-partner-eyebrow">{popup.eyebrow}</span>
                <h2 id={`tp-popup-${key}`}>{popup.title}</h2>
                <p>{popup.text}</p>

                <span className="tp-field-label">Email</span>
                <div className="testing-partner-email-row">
                  <span>{popupEmail}</span>
                  <button type="button" className="testing-partner-email-copy" data-tp-copy={popupEmail}>
                    Copy
                  </button>
                </div>

                <span className="tp-field-label">Subject</span>
                <div className="testing-partner-email-row">
                  <span>{popup.subject}</span>
                  <button type="button" className="testing-partner-email-copy" data-tp-copy={popup.subject}>
                    Copy
                  </button>
                </div>

                <span className="tp-field-label">Include in your email</span>
                <ul className="tp-include">
                  {popup.include.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <a className="tp-mailto" href={mailtoFor(popup.subject, popup.include)}>
                  Open in email app
                </a>
                <p className="tp-hint">
                  Use Gmail or Outlook in the browser? Copy the email and subject above.
                </p>
              </div>
            </dialog>
          );
        })}

        <Script id="testing-partner-popups" strategy="afterInteractive">
          {`
    (() => {
      if (document.documentElement.dataset.tpPopupsReady === "true") return;
      document.documentElement.dataset.tpPopupsReady = "true";

      let opener = null;

      document.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const openButton = target.closest("[data-tp-open]");
        if (openButton) {
          const dialog = document.querySelector('[data-tp-dialog="' + openButton.getAttribute("data-tp-open") + '"]');
          if (dialog && !dialog.open) {
            opener = openButton;
            dialog.showModal();
          }
          return;
        }

        if (target.closest("[data-tp-close]")) {
          target.closest("dialog")?.close();
          return;
        }

        if (target instanceof HTMLDialogElement && target.hasAttribute("data-tp-dialog")) {
          target.close();
          return;
        }

        const copyButton = target.closest("[data-tp-copy]");
        if (copyButton) {
          try {
            await navigator.clipboard.writeText(copyButton.getAttribute("data-tp-copy") || "");
            copyButton.textContent = "Copied";
          } catch {
            copyButton.textContent = "Copy failed";
          }
          window.setTimeout(() => { copyButton.textContent = "Copy"; }, 2000);
        }
      });

      document.addEventListener("close", (event) => {
        if (event.target instanceof HTMLDialogElement && event.target.hasAttribute("data-tp-dialog")) {
          opener?.focus();
          opener = null;
        }
      }, true);
    })();
  `}
        </Script>

        <style dangerouslySetInnerHTML={{ __html: extraCss }} />
      </main>
    </div>
  );
}