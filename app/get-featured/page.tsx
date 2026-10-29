import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { withDefaultSocial } from "@/lib/seo/metadata";
import ProofStrip, { type ProofStat } from "@/components/shared/ProofStrip";
import { payloadFetch } from "@/lib/payload";
import type { Post, PayloadResponse } from "@/lib/cms";
import { getBlogHeadings } from "@/lib/blogUtils";

import { createBreadcrumbSchema } from "@/lib/seo/schema";

// Cache this page for 7 days (static + ISR), same approach as the blog posts.
// Must be a literal number: 60 * 60 * 24 * 7 = 604800.
export const revalidate = 604800;

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
  ["▤", "Trusted by buyers", "Readers trust lists that aren't for sale, so being on one carries weight with the people choosing a tool."],
  ["⌁", "Long-term search and discoverability", "Useful lists continue attracting readers through search and AI discovery. Inclusion gives a product durable editorial context."],
  ["↗", "Updated as your product grows", "When meaningful features, pricing, or positioning changes affect an article, the relevant coverage can be revisited."],
];

// Rendered by the shared <ProofStrip /> component.
const proofStats: readonly ProofStat[] = [
  ["6.1M+", "Google Search visibility across our top 5 pages"],
  ["2.3M+", "Google Search visibility for our Best AI Image Generators list"],
  ["250+", "AI tools tested and published"],
  ["1,000+", "Hours of hands-on testing"],
];

type ListType = "List" | "Alternatives";

type ListItem = {
  title: string;
  type: ListType;
  href: string;
  /** Optional manual override. Normally the CMS excerpt is used. */
  description: string;
  /** Optional manual override, e.g. "12". Normally counted from the article. */
  tested: string;
  /** Fallback date (from the sitemap) shown as "Updated Mon YYYY". */
  updated: string;
  published: string;
};

const SEVEN_DAYS = 604800;

const slugOf = (href: string) => href.split("/").filter(Boolean).pop() ?? "";

const formatMonth = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    : "";

// ---------------------------------------------------------------
// Articles listed on this page. Slugs and dates come from the live
// sitemap (alloypress.com/sitemap.xml), so every card links to a real page.
// [slug, title, type, sitemap lastmod]
// List  -> /blogs/<slug>        Alternatives -> /alternatives/<slug>
// ---------------------------------------------------------------
const listSource: [string, string, ListType, string][] = [
  ["best-ai-image-generator", "Best AI Image Generators", "List", "2026-10-23"],
  ["best-ai-video-generators", "Best AI Video Generators", "List", "2026-10-23"],
  ["free-grok-image-and-video-generation", "Free Grok Image and Video Alternatives", "Alternatives", "2026-09-25"],
  ["kling-ai-alternatives", "Kling AI Alternatives", "Alternatives", "2026-10-24"],
  ["best-ai-logo-generators", "Best AI Logo Generators", "List", "2026-10-23"],
  ["best-ai-writing-tools", "Best AI Writing Tools", "List", "2026-10-23"],
  ["best-ai-website-builders", "Best AI Website Builders", "List", "2026-10-24"],
  ["best-ai-background-remover-tools", "Best AI Background Remover Tools", "List", "2026-10-23"],
  ["best-ai-chatbots", "Best AI Chatbots", "List", "2026-10-23"],
  ["best-ai-vibe-coding-tools", "Best AI Vibe Coding Tools", "List", "2026-10-23"],
  ["best-ai-seo-tools", "Best AI SEO Tools", "List", "2026-10-24"],
  ["chatgpt", "ChatGPT Alternatives", "Alternatives", "2026-10-14"],
];

const lists: ListItem[] = listSource.map(([slug, title, type, lastmod]) => ({
  title,
  type,
  href: `${type === "List" ? "/blogs" : "/alternatives"}/${slug}`,
  description: "",
  tested: "",
  updated: formatMonth(lastmod),
  published: "",
}));

const fallbackDescription = (type: ListType) =>
  type === "List"
    ? "Tools tested hands-on and compared side by side, with honest strengths, limitations and pricing."
    : "Alternatives tested hands-on, showing where each one is stronger or weaker.";

// ---------------------------------------------------------------
// Live data from the CMS: excerpt, dates and tools-tested count.
// Requests are split into small groups so each response stays small,
// run in parallel, cached for 7 days and tagged like the blog posts
// (post:<slug> + posts-content), so an article update also refreshes
// this page. If a request fails, the sitemap dates above are used.
// ---------------------------------------------------------------
type ArticleMeta = { date: string; tested: string; metaDescription: string; };

// Counts numbered tool headings ("1. Tool", "#2 Tool", "03) Tool").
const NUMBERED_HEADING = /^\s*(?:#\d{1,2}\b|\d{1,2}\s*[.):\u2013-])\s*\S/;

function countTools(content: Post["content"]) {
  if (!content) return "";

  const headings = getBlogHeadings(content);
  const count = (level: number) =>
    headings.filter((h) => h.level === level && NUMBERED_HEADING.test(h.text)).length;

  const total = Math.max(count(2), count(3));
  return total >= 3 ? String(total) : "";
}

async function getArticleMeta() {
  const slugs = lists.map((item) => slugOf(item.href));
  const groups: string[][] = [];
  for (let i = 0; i < slugs.length; i += 6) groups.push(slugs.slice(i, i + 6));

  const responses = await Promise.all(
    groups.map((group) => {
      const params = new URLSearchParams({
        "where[slug][in]": group.join(","),
        "where[workflowStatus][equals]": "published",
        limit: String(group.length),
        depth: "0",
        "select[slug]": "true",
        "select[meta]": "true",
        "select[publishedAt]": "true",
        "select[updatedAt]": "true",
        "select[content]": "true",
      });

      return payloadFetch<PayloadResponse<Post>>(`/posts?${params.toString()}`, {
        next: {
          revalidate: SEVEN_DAYS,
          tags: ["posts-content", ...group.map((slug) => `post:${slug}`)],
        },
      });
    })
  );

  const meta = new Map<string, ArticleMeta>();

  for (const response of responses) {
    for (const post of response?.docs ?? []) {
      if (!post.slug) continue;

      const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
      const updated = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
      const wasUpdated = updated - published > 24 * 60 * 60 * 1000;

      meta.set(post.slug, {
        date: wasUpdated
          ? `Updated ${formatMonth(post.updatedAt)}`
          : post.publishedAt
            ? `Published ${formatMonth(post.publishedAt)}`
            : "",
        tested: countTools(post.content),
        metaDescription: ((post as Post & { meta?: { description?: string } }).meta?.description ?? "").trim(),
      });
    }
  }

  return meta;
}

// Higgsfield approval is pending. Set to true only once they approve the quote.
const showTestimonial = true;

const faqs = [
  ["Is this paid placement?", "No. We don't sell positions, ratings or verdicts. The fee covers the time our team spends testing your tool, taking screenshots, writing and keeping the coverage updated. A tool that tests poorly doesn't get a strong write-up, paid or not."],
  ["How much does it cost?", "It depends on the article and the depth of testing your tool needs. Reach out with your tool and we'll share how we work, what's included and the fees behind it, usually within 1 to 3 business days."],
  ["Can you guarantee a #1 position?", "No, for any brand. Position is decided by how your tool performs against the others in the same test. If it stands out, nothing stops it from ranking first."],
  ["Can you include my tool for free?", "We do cover tools from our own research, but our team is small and the testing queue is long. A confirmed collaboration gets a scheduled slot. Without one, we can't say when we'd reach your tool."],
  ["You've already tested us for another article. Why is this one separate?", "Each article is a fresh, head-to-head test against the tools in that article, so it's new work every time."],
  ["Can we send the description or the copy?", "No. Everything is written by our team from our own testing. We're happy to correct facts such as pricing or feature names."],
  ["Can we pay through an affiliate commission instead?", "No. We don't work on commission, and we're removing affiliate links from our editorial content to keep coverage independent."],
];

const listPopup = {
  eyebrow: "List inclusion",
  title: "Get your tool considered for a list",
  text: "Tell us which list your tool fits. We'll check the fit and share how we work, the value we provide and the fees behind it.",
  email: "contact@alloypress.com",
  subject: "Feature request: [Your tool name]",
  include: [
    "Tool name and website",
    "The list or category you'd like to be in",
    "What sets it apart from the tools already listed",
    "Test access or demo details",
  ],
};

function listMailto() {
  const body = listPopup.include
    .map((line) => encodeURIComponent(line + ":\n"))
    .join("");
  return (
    "mailto:" + listPopup.email +
    "?subject=" + encodeURIComponent(listPopup.subject) +
    "&body=" + body
  );
}


const differences = [
  ["01", "Real testing, not marketing", "We use the product where practical. We do not rely only on launch copy, feature pages, or sales claims."],
  ["02", "Side by side with real competitors", "Readers see how your tool compares with others on the same tasks, which is what moves a decision."],
  ["03", "Built for long-term discoverability", "Useful articles can keep attracting readers through search and AI discovery, as context and structure matter."],
  ["04", "Honest about strengths and limitations", "We explain where a product works well and where it falls short because readers need useful trade-offs."],
  ["05", "Updated as things change", "Meaningful changes to products, pricing, or capabilities can trigger a review of existing coverage."],
  ["06", "Context that actually helps", "Readers should understand who the tool is for, what it does best, and when another option may make more sense."],
];

const boundaries = [
  ["✓", "Every inclusion is earned in testing", "We review each request for editorial fit before anything is confirmed."],
  ["✓", "Our words, your facts", "We write the coverage ourselves, and we're happy to correct facts like pricing or feature names."],
  ["✓", "Honest strengths and limitations", "If testing reveals a real weakness, readers hear about it. That's why they trust the strengths too."],
  ["✓", "Full context before we publish", "We publish once we have enough product information and, where needed, access for testing."],
];

const process = [
  ["01", "You submit your tool details", "Send the product name, URL, category, the article you have in mind, and enough context for us to understand the product."],
  ["02", "We review whether there's a genuine fit", "We check the product against the article topic, audience, and existing coverage, then share how we work and the fees behind it."],
  ["03", "We collect access and testing details", "If hands-on evaluation is needed, we arrange product access, demo details, or the appropriate plan for testing."],
  ["04", "We test and prepare the editorial coverage", "We evaluate relevant workflows and write the inclusion around observable usefulness rather than marketing claims."],
  ["05", "The article is published and maintained", "Approved coverage is published with a search-friendly structure and can be revisited when meaningful changes affect the article."],
  ["06", "You receive the published details", "We share the article link and your position once the editorial work is complete and the page is live."],
];

const requirements = [
  "Product name and website URL", "Which article or category you want to be considered for", "A short explanation of what the product does",
  "Key differentiators or features worth testing", "Product access or demo details, if required", "A business email connected to your company or product",
];

export default async function InclusionPage() {
  const articleMeta = await getArticleMeta();

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
            <div className="inc-eyebrow inc-light"><span /> EDITORIAL LISTING PROGRAM</div>
            <h1>Get Your AI Tool{" "}<br />Considered for a <em>Spot It</em>{" "}<br /><em>Actually Earns</em></h1>
            <p>We publish honest, tested lists and alternatives articles covering the best AI tools in each category. If your tool genuinely fits, we want to know about it.</p>
            <button
              type="button"
              className="inc-primary inc-email-open"
              data-inc-open
            >
              Get Featured <span>↗</span>
            </button>
            <div className="inc-hero-meta"><span>LISTS</span><i>·</i><span>ALTERNATIVES</span><i>·</i><span>HANDS-ON TESTING</span><i>·</i><span>EDITORIAL REVIEW</span></div>
            <p className="inc-hero-editorial">Inclusion is editorial, not a guaranteed ranking.</p>
          </div>
        </div>
      </section>

      {/* PROOF STRIP (shared component) */}
      <ProofStrip stats={proofStats} showAiPlatforms />

      <section className="inc-section inc-matters">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> WHY IT MATTERS</div><h2>What being in an AlloyPress list actually means for your product.</h2><p>There's a real difference between being featured because a product is useful to readers and being dropped into a directory. Here's what editorial inclusion provides.</p></div></header>
          <div className="inc-principle-grid">{principles.map(([icon, title, text]) => <article className="inc-principle-card" key={title}><span className="inc-card-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-lists">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> OUR LISTS</div><h2>The lists and alternatives articles you can be considered for.</h2><p>These are article categories we actively maintain. If your tool belongs in one, that's the starting point for a conversation.</p></div></header>
          <div className="inc-article-grid">
            {lists.map((item, index) => {
              const meta = articleMeta.get(slugOf(item.href));
              const dateText =
                meta?.date ||
                (item.updated ? `Updated ${item.updated}` : item.published ? `Published ${item.published}` : "");
              const description =
                item.description || meta?.metaDescription || fallbackDescription(item.type);

              return (
                <Link className="inc-list-card" href={item.href} key={item.title}>
                  <span className="inc-list-num">{String(index + 1).padStart(2, "0")}</span>
                  <div className="inc-list-body">
                    <strong>{item.title}</strong>
                    <p className="inc-list-desc">{description}</p>
                    {dateText && (
                      <small className="inc-list-meta">{dateText}</small>
                    )}
                  </div>
                  <span className="inc-list-type">{item.type} <i>↗</i></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {showTestimonial && (
        <section className="inc-testimonial">
          <div className="inc-container">
            <figure>
              <blockquote>
                &ldquo;Coming from a team that has tested 250+ tools, Higgsfield
                ranking first means a lot.&rdquo;
              </blockquote>
              <figcaption>
                By Higgsfield Team.
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      <section className="inc-proof-section"><div className="inc-container"><div className="inc-proof-card"><div><div className="inc-eyebrow inc-light"><span /> WE'RE NOT SELLING A RANKING</div><h2>We test first.<br />We list based on <em>what we find.</em></h2></div><div className="inc-proof-copy"><p>Most tools can look impressive on a product page. The useful question is what happens when someone actually uses them.</p><p>Our coverage focuses on real workflows, observable outputs, usability, pricing, limitations, and audience fit. Payment supports the work; it doesn't decide the conclusion.</p></div></div></div></section>

      <section className="inc-section inc-difference">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> WHY ALLOYPRESS</div><h2>What makes our lists different from most.</h2><p>There are a lot of “best of” lists for AI tools. Here's what separates ours.</p></div></header>
          <div className="inc-difference-grid">{differences.map(([num, title, text]) => <article className="inc-difference-card" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-boundaries">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow"><span /> OUR COMMITMENTS</div><h2>Our commitments to readers (and to you).</h2><p>This is how we keep lists worth being on.</p></div></header>
          <div className="inc-boundary-grid">{boundaries.map(([icon, title, text]) => <article className="inc-boundary-card" key={title}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="inc-section inc-process">
        <div className="inc-container">
          <header className="inc-heading"><div><div className="inc-eyebrow inc-light"><span /> HOW IT WORKS</div><h2>What happens after you reach out.</h2><p>The process is straightforward. Here's exactly what to expect from submission to coverage.</p></div></header>
          <div className="inc-process-list">{process.map(([num, title, text]) => <article className="inc-process-row" key={num}><span className="inc-process-number">{num}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></article>)}</div>
          <div className="inc-timeline"><p><strong>Timeline: 6 to 12 working days</strong>, depending on our current testing queue. It can be shorter or longer, and we confirm the exact timing when you reach out.</p></div>
        </div>
      </section>

      <section className="inc-crosssell">
        <div className="inc-container">
          <div className="inc-crosssell-card">
            <div>
              <h2>Want more than a section?</h2>
              <p>
                A list section shows how you compare. A dedicated review shows
                everything your tool does, on a permanent page that&apos;s only
                about you and refreshed as you ship. Pair the two and we&apos;ll
                share a combined rate.
              </p>
            </div>
            <Link className="inc-secondary-link" href="/get-reviewed">
              See dedicated reviews
            </Link>
          </div>
        </div>
      </section>

      <section className="inc-section inc-requirements"><div className="inc-container inc-requirements-layout"><div><div className="inc-eyebrow"><span /> BEFORE YOU REACH OUT</div><h2>What to share when you reach out.</h2><p>The more context you give us, the faster we can evaluate your request and tell you whether there's a useful place for the product.</p></div><div className="inc-requirement-list">{requirements.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></div></section>

      <section className="inc-section inc-faq">
        <div className="inc-container">
          <header className="inc-heading">
            <div>
              <div className="inc-eyebrow"><span /> FAQ</div>
              <h2>Questions brands ask before reaching out.</h2>
            </div>
          </header>
          <div className="inc-faq-list">
            {faqs.map(([question, answer]) => (
              <details className="inc-faq-item" key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="inc-final"><div className="inc-final-grid" aria-hidden="true" /><div className="inc-final-glow" aria-hidden="true" /><div className="inc-container inc-final-inner"><div className="inc-eyebrow inc-light"><span /> GET STARTED</div><h2>If your tool genuinely belongs in our lists,<br /><em>let's find out.</em></h2><p>Send us the basics and we'll review your fit, then share how we work, the value we provide and the fees behind it.</p><button
        type="button"
        className="inc-primary inc-email-open"
        data-inc-open
      >
        Get Featured <span>↗</span>
      </button><p className="inc-urgency">We schedule testing in the order collaborations are confirmed, and each list has limited room.</p><small>Or email <a href="mailto:contact@alloypress.com">contact@alloypress.com</a> with your product name, URL, category and testing details.</small></div></section>
      <div
        className="inc-email-modal-wrap"
        data-inc-modal
        aria-hidden="true"
      >
        <div className="inc-email-backdrop" data-inc-close />

        <div
          className="inc-email-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inc-email-title"
        >
          <button
            type="button"
            className="inc-email-close"
            data-inc-close
            aria-label="Close"
          >
            ×
          </button>

          <div className="inc-eyebrow">
            <span />
            {listPopup.eyebrow}
          </div>

          <h2 id="inc-email-title">{listPopup.title}</h2>
          <p>{listPopup.text}</p>

          <span className="inc-field-label">Email</span>
          <div className="inc-email-row">
            <input
              type="text"
              value={listPopup.email}
              readOnly
              aria-label="AlloyPress email address"
              className="inc-email-input"
            />
            <button type="button" className="inc-email-copy" data-inc-copy={listPopup.email}>
              Copy
            </button>
          </div>

          <span className="inc-field-label">Subject</span>
          <div className="inc-email-row">
            <input
              type="text"
              value={listPopup.subject}
              readOnly
              aria-label="Email subject"
              className="inc-email-input"
            />
            <button type="button" className="inc-email-copy" data-inc-copy={listPopup.subject}>
              Copy
            </button>
          </div>

          <span className="inc-field-label">Include in your email</span>
          <ul className="inc-include">
            {listPopup.include.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <a className="inc-mailto" href={listMailto()}>
            Open in email app
          </a>
          <p className="inc-hint">
            Use Gmail or Outlook in the browser? Copy the email and subject above.
          </p>
        </div>
      </div>

      <Script id="email-popup-script" strategy="afterInteractive">{`
  (() => {
    if (document.documentElement.dataset.incPopupReady === "true") return;
    document.documentElement.dataset.incPopupReady = "true";

    let opener = null;

    const getModal = () => document.querySelector("[data-inc-modal]");

    const closeModal = () => {
      const modal = getModal();
      if (!modal || !modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      opener?.focus();
      opener = null;
    };

    document.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const modal = getModal();
      if (!modal) return;

      const openButton = target.closest("[data-inc-open]");
      if (openButton) {
        opener = openButton;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        modal.querySelector(".inc-email-close")?.focus();
        return;
      }

      if (target.closest("[data-inc-close]")) {
        closeModal();
        return;
      }

      const copyButton = target.closest("[data-inc-copy]");
      if (copyButton) {
        try {
          await navigator.clipboard.writeText(copyButton.getAttribute("data-inc-copy") || "");
          copyButton.textContent = "Copied";
        } catch {
          copyButton.textContent = "Copy failed";
        }
        window.setTimeout(() => { copyButton.textContent = "Copy"; }, 2000);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
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
.inc-hero-editorial {
  margin: 14px 0 0;
  color: color-mix(in srgb, var(--foreground) 78%, transparent);
  font: 500 var(--text-sm)/1.5 var(--font-ui);
}

/* ---------- Article cards (3 x 4 grid) ---------- */
.inc-list-card {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: start;
  gap: 12px;
  min-height: 150px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  color: var(--text-primary);
  text-decoration: none;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}

.inc-list-card:hover,
.inc-list-card:focus-visible {
  border-color: var(--brand);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--brand) 12%, transparent);
  outline: none;
}

.inc-list-num {
  color: var(--brand);
  font: 700 var(--text-xs)/1.6 var(--font-mono);
}

.inc-list-body strong {
  display: block;
  font: 700 var(--text-md)/1.35 var(--font-ui);
}

.inc-list-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.6 var(--font-body);
}

.inc-list-meta {
  display: block;
  margin-top: 10px;
  color: var(--text-secondary);
  font: 500 var(--text-xs)/1.5 var(--font-mono);
}

.inc-list-type {
  padding: 3px 9px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  color: var(--text-primary);
  font: 600 var(--text-xs)/1.5 var(--font-mono);
  white-space: nowrap;
}

.inc-list-type i {
  color: var(--brand);
  font-style: normal;
}

.inc-testimonial {
  padding: 24px 0 56px;
}

.inc-testimonial figure {
  max-width: 760px;
  margin: 0 auto;
  padding: 36px 40px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--brand);
  border-right: 4px solid var(--brand);
  border-radius: 16px;
  background: var(--card);
  text-align: center;
}

.inc-testimonial blockquote {
  margin: 0 0 14px;
  color: var(--text-primary);
  font: 700 clamp(20px, 2.2vw, 26px)/1.4 var(--font-ui);
  letter-spacing: -.02em;
  text-wrap: balance;
}

.inc-testimonial figcaption {
  color: var(--text-secondary);
  font: 500 var(--text-sm)/1.5 var(--font-ui);
}

.inc-boundary-card {
  border-color: color-mix(in srgb, var(--brand) 28%, transparent);
  background: var(--card);
}

.inc-boundary-card > span {
  background: color-mix(in srgb, var(--brand) 14%, transparent);
  color: var(--brand);
  font-size: 14px;
}

.inc-timeline p {
  margin: 0;
  color: var(--text-secondary);
}

.inc-timeline p strong {
  display: inline;
  color: var(--text-primary);
}

.inc-crosssell {
  padding: 0 0 64px;
}

.inc-crosssell-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border: 1px solid var(--brand);
  border-radius: 14px;
  background: color-mix(in srgb, var(--brand) 7%, var(--card));
}

.inc-crosssell-card > div {
  flex: 1 1 520px;
}

.inc-crosssell-card h2 {
  margin: 0 0 8px;
  font: 800 var(--text-2xl)/1.2 var(--font-ui);
  letter-spacing: -.03em;
}

.inc-crosssell-card p {
  margin: 0;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.inc-secondary-link {
  display: inline-flex;
  padding: 13px 22px;
  border: 1px solid var(--brand);
  border-radius: 10px;
  background: var(--card);
  color: var(--text-primary);
  font: 700 var(--text-md)/1.2 var(--font-ui);
  text-decoration: none;
  transition: background .2s ease;
}

.inc-secondary-link:hover {
  background: color-mix(in srgb, var(--brand) 12%, var(--card));
}

.inc-faq-list {
  display: grid;
  gap: 10px;
  max-width: 860px;
}

.inc-faq-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
}

.inc-faq-item[open] {
  border-color: var(--brand);
}

.inc-faq-item summary {
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

.inc-faq-item summary::-webkit-details-marker {
  display: none;
}

.inc-faq-item summary::after {
  content: "+";
  flex: none;
  color: var(--brand);
  font: 600 22px/1 var(--font-mono);
}

.inc-faq-item[open] summary::after {
  content: "−";
}

.inc-faq-item summary:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-radius: 10px;
}

.inc-faq-item p {
  margin: 0;
  padding: 0 20px 18px;
  color: var(--text-secondary);
  font: 400 var(--text-md)/1.7 var(--font-body);
}

.inc-urgency {
  margin: 16px 0 0;
  font: 500 var(--text-sm)/1.6 var(--font-ui);
}

.inc-final small a {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.inc-email-modal {
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
}

.inc-field-label {
  display: block;
  margin: 16px 0 6px;
  color: var(--text-secondary);
  font: 700 var(--text-xs)/1.2 var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.inc-include {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.inc-include li {
  display: flex;
  gap: 8px;
  margin: 0 0 6px;
  color: var(--text-primary);
  font: 500 var(--text-sm)/1.5 var(--font-ui);
}

.inc-include li::before {
  content: "";
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 8px;
  border-radius: 50%;
  background: var(--brand);
}

.inc-mailto {
  display: flex;
  justify-content: center;
  padding: 13px 18px;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font: 700 var(--text-md)/1.2 var(--font-ui);
  text-decoration: none;
}

.inc-mailto:hover {
  background: var(--brand-hover);
}

.inc-email-modal p.inc-hint {
  margin: 12px 0 0;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .inc-article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .inc-article-grid {
    grid-template-columns: 1fr;
  }

  .inc-list-card {
    grid-template-columns: 26px 1fr;
    min-height: 0;
  }

  .inc-list-type {
    grid-column: 2;
    justify-self: start;
  }

  .inc-crosssell-card {
    padding: 22px;
  }
}

/* =========================================================
   LAYOUT FIXES (hero spacing, FAQ centering, final CTA spacing)
   Selectors are intentionally more specific than ".x > p" rules
   above so the margins actually apply.
   ========================================================= */

/* Hero */
.inc-hero h1 {
  text-wrap: balance;
}

.inc-hero .inc-primary {
  margin-top: 32px;
}

.inc-hero .inc-hero-meta {
  margin-top: 32px;
  gap: 10px;
  font-size: 11px;
  letter-spacing: .08em;
}

.inc-hero-copy > .inc-hero-editorial {
  max-width: 560px;
  margin: 16px auto 0;
  color: var(--text-secondary);
  font: 500 var(--text-sm)/1.6 var(--font-ui);
}

/* FAQ centered */
.inc-faq .inc-heading {
  justify-content: center;
  text-align: center;
}

.inc-faq .inc-heading h2 {
  margin-inline: auto;
}

.inc-faq-list {
  margin-inline: auto;
}

/* Final CTA spacing */
.inc-final h2 {
  margin: 18px 0 20px;
}

.inc-final .inc-primary {
  margin-top: 32px;
}

.inc-final-inner > .inc-urgency {
  max-width: 560px;
  margin: 28px auto 0;
  color: var(--text-secondary);
}

.inc-final-inner > small {
  max-width: 640px;
  margin: 28px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

@media (max-width: 450px) {
  .inc-hero .inc-hero-meta {
    font-size: 10px;
  }
}
`;