import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/components/css-style/tools.css";

import AdSenseInArticle from "@/components/ads/AdSenseInArticle";
import Image from "@/components/CfImage";
import NewsletterSection from "@/components/home/NewsletterSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getApiUrl, payloadFetch } from "@/lib/payload";
import { postHref } from "@/lib/post-href";
import { SITE_URL } from "@/lib/seo/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema, createFAQSchema } from "@/lib/seo/schema";
import { getTool, hubIsPublic, relatedTools } from "@/lib/tools/registry";

/* =========================================================
   Content types (one object per tool, lives in its page.tsx)
========================================================= */

export type ToolIcon = "free" | "lock" | "bolt" | "search" | "chart" | "device" | "limit";

export type ToolFaqItem = { question: string; answer: string };

export type ToolSection =
  | { kind: "steps"; id?: string; title: string; items: { title: string; text: string }[] }
  | {
      kind: "cards";
      id?: string;
      title: string;
      intro?: string;
      eyebrow?: string;
      items: { title: string; text: string; icon?: ToolIcon; list?: string[]; highlight?: boolean; visual?: ReactNode }[];
    }
  /** paragraphs + optional rules (bullets) + optional examples ("input → result" chips) */
  | { kind: "prose"; id?: string; title: string; paragraphs?: string[]; bullets?: string[]; chips?: string[]; note?: string }
  | { kind: "table"; id?: string; title: string; intro?: string; head: string[]; rows: string[][]; note?: string }
  /** `widget` is a key into the `widgets` prop that the tool's page.tsx passes to <ToolPage>. */
  | { kind: "widget"; id?: string; title: string; intro?: string; widget: string }
  | { kind: "ad" };

/** SEO + page copy for one tool. Lives in app/tools/<slug>/page.tsx. */
export type ToolContent = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** part of h1 rendered in brand gradient, e.g. "Character Counter" */
  h1Accent?: string;
  intro: string;
  /** sections between the tool and the FAQ (the sticky ad follows these) */
  sections: ToolSection[];
  faq: ToolFaqItem[];
  /** slugs of AlloyPress posts shown as "From the AlloyPress blog" at the end */
  blogSlugs?: string[];
};

/* ------------------------------------------------------------------
   Used by every app/tools/<slug>/page.tsx:
     export const metadata = toolMetadata("word-counter", content);
     <ToolPage slug="word-counter" content={content} widgets={{…}}>
       <WordCounter />
     </ToolPage>
------------------------------------------------------------------- */

export function toolMetadata(slug: string, content: ToolContent): Metadata {
  return buildPageMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    canonicalPath: `/tools/${slug}`,
  });
}

/* =========================================================
   Small pieces
========================================================= */

const ICON_PATHS: Record<ToolIcon, ReactNode> = {
  free: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  device: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  limit: <><path d="M4 12h16M4 6h10M4 18h13" /></>,
};

function Icon({ name }: { name: ToolIcon }) {
  return (
    <span className="tl-ic" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[name]}
      </svg>
    </span>
  );
}

/** Decorative icon per tool category, used on the "More free tools" cards. */
const RELATED_ICON: Record<string, ToolIcon> = { text: "chart", markdown: "device", ai: "bolt", file: "limit", image: "device" };

function Tick() {
  return (
    <svg className="tl-tick" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" strokeWidth="0" fill="currentColor" opacity=".16" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}

/* ---------- Ads (2 slots only) ----------
   Slot 1 = sticky sidebar that follows the page until the FAQ.
   Slot 2 = one in-content ad. Both stay away from inputs and buttons. */

const AD_SLOTS: Record<number, string | undefined> = {
  1: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_1,
  2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_2,
};

function ToolAd({ slot, tall = false }: { slot: 1 | 2; tall?: boolean }) {
  const id = AD_SLOTS[slot];
  const dev = process.env.NODE_ENV !== "production";
  return (
    <aside className={`tl-ad${tall ? " tl-ad--tall" : ""}`} aria-label="Advertisement">
      {id ? (
        <AdSenseInArticle slot={id} />
      ) : dev ? (
        <>
          <span className="tl-ad-label">Advertisement</span>
          <div className="tl-ad-box">Ad slot {slot}</div>
        </>
      ) : null}
    </aside>
  );
}

/* ---------- Content sections (data → markup) ---------- */

function Section({ s, widgets }: { s: ToolSection; widgets: Record<string, ReactNode> }) {
  switch (s.kind) {
    case "ad":
      return null;

    case "steps":
      return (
        <section className="tl-section" id={s.id}>
          <h2 className="tl-h2">{s.title}</h2>
          <ol className="tl-steps">
            {s.items.map((it, i) => (
              <li key={it.title} className="tl-card">
                <span className="tl-step-n" aria-hidden="true">{i + 1}</span>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </li>
            ))}
          </ol>
        </section>
      );

    case "cards":
      return (
        <section className="tl-section" id={s.id}>
          <div className="tl-section-head">
            {s.eyebrow && <span className="eyebrow">{s.eyebrow}</span>}
            <h2 className="tl-h2">{s.title}</h2>
            {s.intro && <p className="tl-muted">{s.intro}</p>}
          </div>
          <div className={`tl-cards tl-cards--${s.items.length}`}>
            {s.items.map((it) => (
              <div key={it.title} className={`tl-card tl-feature${it.highlight ? " is-highlight" : ""}`}>
                {it.visual && <div className="tl-vis" aria-hidden="true">{it.visual}</div>}
                {it.icon && !it.visual && <Icon name={it.icon} />}
                <h3>{it.title}</h3>
                <p>{it.text}</p>
                {it.list && (
                  <ul className="tl-checklist">
                    {it.list.map((l) => (
                      <li key={l}><Tick />{l}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case "prose": {
      const examples = (s.chips ?? []).map((c) => {
        const [input, result] = c.split(" → ");
        return { input, result };
      });
      // Rules-style section (bullets, no examples): plain heading + tick list + closing note, no boxes.
      if (examples.length === 0) {
        return (
          <section className="tl-section" id={s.id}>
            <h2 className="tl-h2">{s.title}</h2>
            {!s.bullets && s.paragraphs?.map((p) => <p key={p} className="tl-muted">{p}</p>)}
            {s.bullets && (
              <ul className="tl-rules">
                {s.bullets.map((b) => (
                  <li key={b}><Tick />{b}</li>
                ))}
              </ul>
            )}
            {s.bullets && s.paragraphs?.map((p) => <p key={p} className="tl-muted">{p}</p>)}
            {s.note && <p className="tl-note">{s.note}</p>}
          </section>
        );
      }

      return (
        <section className="tl-section" id={s.id}>
          <div className="tl-card tl-explain has-examples">
            <div className="tl-explain-copy">
              <h2 className="tl-h2">{s.title}</h2>
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
            </div>
            <div className="tl-examples">
              {examples.map((e) => (
                <div key={e.input} className="tl-example">
                  <span>{e.input}</span>
                  {e.result && <b>{e.result}</b>}
                </div>
              ))}
            </div>
          </div>
          {s.note && <p className="tl-note">{s.note}</p>}
        </section>
      );
    }

    case "table":
      return (
        <section className="tl-section" id={s.id}>
          <h2 className="tl-h2">{s.title}</h2>
          {s.intro && <p className="tl-muted">{s.intro}</p>}
          <div className="tl-table-wrap">
            <table className="tl-table">
              <thead><tr>{s.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.note && <p className="tl-note">{s.note}</p>}
        </section>
      );

    case "widget":
      return (
        <section className="tl-section" id={s.id}>
          <h2 className="tl-h2">{s.title}</h2>
          {s.intro && <p className="tl-muted">{s.intro}</p>}
          {widgets[s.widget]}
        </section>
      );
  }
}

/* ---------- Related blogs (from Payload, same pattern as the navbar featured post) ---------- */

type BlogPost = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  meta?: { description?: string | null } | null;
  featuredImage?: { url?: string | null; alt?: string | null } | number | null;
  category?: { name?: string | null; slug?: string | null } | number | null;
};

function imageUrl(m: BlogPost["featuredImage"]) {
  if (!m || typeof m === "number" || !m.url) return null;
  return m.url.startsWith("http") ? m.url : `${getApiUrl().replace(/\/api$/, "")}${m.url}`;
}

async function RelatedBlogs({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;

  const params = new URLSearchParams({
    "where[slug][in]": slugs.join(","),
    "where[workflowStatus][equals]": "published",
    limit: String(slugs.length),
    depth: "1",
    "select[slug]": "true",
    "select[title]": "true",
    "select[excerpt]": "true",
    "select[meta]": "true",
    "select[featuredImage]": "true",
    "select[category]": "true",
  });

  const data = await payloadFetch<{ docs?: BlogPost[] }>(`/posts?${params.toString()}`, {
    strict: false,
    next: { revalidate: 86400, tags: ["tool-blogs", "posts-content"] },
  });

  const posts = slugs
    .map((s) => data?.docs?.find((d) => d.slug === s))
    .filter((p): p is BlogPost => !!p?.slug && !!p.title);
  if (posts.length === 0) return null;

  return (
    <section className="tl-section" id="blogs">
      <div className="tl-section-head">
        <span className="eyebrow">Keep reading</span>
        <h2 className="tl-h2">From the AlloyPress blog</h2>
      </div>
      <div className="tl-blogs">
        {posts.map((p) => {
          const cat = typeof p.category === "object" && p.category ? p.category : null;
          const img = imageUrl(p.featuredImage);
          const desc = p.excerpt || p.meta?.description || "";
          return (
            <Link key={p.slug} href={postHref(cat?.slug, p.slug)} className="tl-card tl-blog">
              <span className="tl-blog-media">
                {img && (
                  <Image
                    src={img}
                    alt={(typeof p.featuredImage === "object" && p.featuredImage?.alt) || p.title || ""}
                    fill
                    sizes="(max-width: 700px) 100vw, 360px"
                  />
                )}
              </span>
              <span className="tl-blog-body">
                <span className="eyebrow">{cat?.name || "Blog"}</span>
                <h3>{p.title}</h3>
                {desc && <p>{desc}</p>}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   Page shell
========================================================= */

export default function ToolPage({
  slug,
  content,
  widgets = {},
  children,
}: {
  slug: string;
  content: ToolContent;
  /** extra interactive blocks referenced by `kind: "widget"` sections */
  widgets?: Record<string, ReactNode>;
  /** the tool itself (client component) */
  children: ReactNode;
}) {
  const tool = getTool(slug);
  if (!tool) throw new Error(`Tool "${slug}" is missing from lib/tools/registry.ts`);

  const url = `${SITE_URL}/tools/${slug}`;
  const related = relatedTools(tool);

  const graph = [
    {
      "@type": "SoftwareApplication",
      name: tool.name,
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      description: content.metaDescription,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    createFAQSchema(
      content.faq.map((f) => ({ question: f.question, answer: f.answer })),
      url,
    ),
    createBreadcrumbSchema(
      [
        { name: "Home", url: "/" },
        ...(hubIsPublic() ? [{ name: "Free tools", url: "/tools" }] : []),
        { name: tool.name, url: `/tools/${slug}` },
      ],
      url,
    ),
  ].filter(Boolean);

  const hasAccent = !!content.h1Accent && content.h1.includes(content.h1Accent);
  const [before, after] = hasAccent ? content.h1.split(content.h1Accent as string) : [content.h1, ""];

  return (
    <div className="tl-page">
      <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />

      {/* Heading + paragraph, then the tool starts */}
      <header className="tl-hero">
        <nav className="tl-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link> / {hubIsPublic() && (<><Link href="/tools">Free tools</Link> / </>)}<span>{tool.name}</span>
        </nav>
        <h1 className="tl-h1">
          {before}
          {hasAccent && <span className="tl-accent">{content.h1Accent}</span>}
          {after}
        </h1>
        <p className="tl-lead">{content.intro}</p>
      </header>

      {/* Tool + sections on the left, ad 1 sticks on the right until the FAQ.
          Mobile order: tool → ad → sections. */}
      <div className="tl-flow">
        <div className="tl-flow-main">
          <div className="tl-flow-tool" id="tool">{children}</div>

          <div className="tl-flow-rest">
            {content.sections.map((s, i) => <Section key={i} s={s} widgets={widgets} />)}
          </div>
        </div>

        <aside className="tl-flow-aside" aria-label="Advertisement">
          <div className="tl-sticky">
            <ToolAd slot={1} tall />
          </div>
        </aside>
      </div>

      <div className="tl-body">
        {related.length > 0 && (
          <section className="tl-section">
            <h2 className="tl-h2">More free tools</h2>
            <div className="tl-cards tl-cards--related">
              {related.map((t) => (
                <Link key={t.slug} href={`/tools/${t.slug}`} className="tl-card tl-link-card tl-related">
                  <div className="tl-related-top">
                    <Icon name={RELATED_ICON[t.category] ?? "bolt"} />
                    <span className="tl-related-tag">Free tool</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.shortDescription}</p>
                  <span className="tl-related-cta">Open tool <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="tl-section tl-faq" id="faq" aria-labelledby="tl-faq-h">
          <div className="tl-faq-side">
            <h2 id="tl-faq-h" className="tl-h2">Frequently Asked Questions</h2>
            <p className="tl-muted">Free, private, runs in your browser.</p>
            <Link href="/contact-us" className="btn-primary tl-faq-cta">Contact us</Link>
          </div>
          <div className="tl-faq-list">
            {content.faq.map((f, i) => (
              <details key={f.question} className="tl-faq-item" {...(i === 0 ? { open: true } : {})}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <RelatedBlogs slugs={content.blogSlugs ?? []} />

        <p className="tl-note tl-updated">
          Last updated {tool.updatedAt} · Built and tested by the AlloyPress team ·{" "}
          <Link href="/how-we-test">How we test</Link>
        </p>
      </div>

      <NewsletterSection />
    </div>
  );
}