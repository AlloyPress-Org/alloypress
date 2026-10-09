import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { payloadFetch } from "@/lib/payload";
import "./AuthorPage.css";

const PAYLOAD_URL =
  process.env.PAYLOAD_API_URL?.replace(/\/$/, "") ||
  "https://api.alloypress.com/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://alloypress.com";

const AUTHOR = {
  name: "AlloyPress Team",
  slug: "alloypress",
  role: "AI Research & Editorial Team",
  bio: "We test AI tools, compare alternatives, verify claims, and turn fast-moving AI updates into practical information people can actually use.",
  shortBio:
    "Independent AI reviews, comparisons, tutorials, and news — tested and written for real people.",
  location: "Independent AI publication",
  joined: "Publishing since 2024",
};

type Post = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  author?: string | { name?: string | null } | null;
  category?: string | { name?: string; slug?: string } | null;
  featuredImage?: string | number | { url?: string | null; alt?: string | null } | null;
};

const getAuthorPosts = cache(async (): Promise<Post[]> => {
  try {
    // Fetch the newest published articles across ALL categories.
    // This keeps the Author page in sync with the overall latest content,
    // rather than limiting the section to the Blogs category.
    const data = await payloadFetch<{ docs?: Post[] }>(
      "/posts" +
      "?where[workflowStatus][equals]=published" +
      "&sort=-publishedAt" +
      "&limit=5" +
      "&depth=1" +
      "&select[id]=true" +
      "&select[title]=true" +
      "&select[slug]=true" +
      "&select[excerpt]=true" +
      "&select[publishedAt]=true" +
      "&select[category]=true" +
      "&select[featuredImage]=true",
      {
        next: {
          revalidate: 300,
          tags: [
            "author:alloypress",
            "posts",
          ],
        },
      },
    );

    const posts = Array.isArray(data?.docs)
      ? data.docs
      : [];

    return posts
      .filter(
        (post: Post) =>
          Boolean(post.title) &&
          Boolean(post.slug) &&
          !/^untitled wordpress post/i.test(post.title),
      )
      .slice(0, 5);
  } catch (error) {
    console.error(
      "[AuthorPage] Failed to load latest articles:",
      error,
    );

    return [];
  }
});

function getImageUrl(post: Post) {
  const image = post.featuredImage;

  if (!image) return null;

  if (typeof image === "object" && image?.url) {
    return image.url.startsWith("http")
      ? image.url
      : `${PAYLOAD_URL.replace(/\/api$/, "")}${image.url}`;
  }

  if (typeof image === "number") {
    return `${PAYLOAD_URL}/media/${image}`;
  }

  return null;
}

function getCategory(post: Post) {
  if (typeof post.category === "object" && post.category) {
    return {
      name: post.category.name || "AI",
      slug: post.category.slug || "blogs",
    };
  }

  return {
    name: typeof post.category === "string" ? post.category : "AI",
    slug: "blogs",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `${AUTHOR.name} — AI Research & Editorial Team`;
  const description =
    "Meet the AlloyPress Team — the researchers and editors testing AI tools, comparing alternatives, and explaining AI with practical, reader-first standards.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/author/${AUTHOR.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${SITE_URL}/author/${AUTHOR.slug}`,
      siteName: "AlloyPress",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function AuthorPage() {
  const posts = await getAuthorPosts();
  const featured = posts[0] ?? null;
  const remaining = posts.slice(1);

  const authorUrl = `${SITE_URL}/author/${AUTHOR.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${authorUrl}#person`,
        name: AUTHOR.name,
        url: authorUrl,
        jobTitle: AUTHOR.role,
        description: AUTHOR.bio,
        worksFor: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "AlloyPress",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${authorUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: AUTHOR.name,
            item: authorUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* Author page styles are loaded from ./AuthorPage.css */}

      <main className="author-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* HERO */}
        <section className="author-hero">
          <div className="author-hero-grid" aria-hidden="true" />
          <div className="author-hero-dots" aria-hidden="true" />
          <div className="author-signal author-signal-one" aria-hidden="true" />
          <div className="author-signal author-signal-two" aria-hidden="true" />

          <div className="author-container author-hero-inner">
            <div className="author-hero-copy">
              <div className="eyebrow eyebrow-light">
                <span className="eyebrow-dot" />
                AUTHOR / ALLOYPRESS
              </div>

              <h1>
                We test AI tools
                <br />
                <span>before we write</span>
                <br />
                about any of them.
              </h1>

              <p className="author-hero-description">
                Independent AI research, hands-on testing, and practical
                editorial work designed to make fast-moving AI easier to
                understand and use.
              </p>

              <div className="author-tags">
                <span>REAL TESTS</span>
                <span>HONEST REVIEWS</span>
                <span>AI RESEARCH</span>
                <span>PRACTICAL GUIDES</span>
              </div>
            </div>

            <aside className="author-profile-card">
              <div className="profile-card-pattern" aria-hidden="true" />
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden">
                <Image
                  src="/ap-icons.png"
                  alt="AlloyPress"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div className="profile-card-kicker">AUTHOR PROFILE</div>
              <h2>{AUTHOR.name}</h2>
              <p>{AUTHOR.role}</p>

              <div className="profile-divider" />

              <div className="profile-meta">
                <span>FOCUS</span>
                <strong>AI TOOLS + EDUCATION</strong>
              </div>
              <div className="profile-meta">
                <span>METHOD</span>
                <strong>TEST · VERIFY · EXPLAIN</strong>
              </div>
              <div className="profile-meta">
                <span>PUBLICATION</span>
                <strong>ALLOYPRESS</strong>
              </div>

              <div className="profile-mini-grid">
                <div>
                  <b>01</b>
                  <span>Tested</span>
                </div>
                <div>
                  <b>02</b>
                  <span>Compared</span>
                </div>
                <div>
                  <b>03</b>
                  <span>Explained</span>
                </div>
                <div>
                  <b>04</b>
                  <span>Updated</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* QUICK FACTS */}
        <section className="author-facts">
          <div className="author-container facts-grid">
            <div className="fact">
              <span>01</span>
              <strong>Hands-on</strong>
              <small>AI tool testing</small>
            </div>
            <div className="fact">
              <span>02</span>
              <strong>Reader-first</strong>
              <small>Clear practical writing</small>
            </div>
            <div className="fact">
              <span>03</span>
              <strong>Evidence-led</strong>
              <small>Claims checked before publishing</small>
            </div>
            <div className="fact">
              <span>04</span>
              <strong>Current</strong>
              <small>Content kept useful over time</small>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="author-section author-about">
          <div className="section-texture" aria-hidden="true" />
          <div className="author-container">
            <div className="section-heading compact-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  WHO WE ARE
                </div>
                <h2>AlloyPress started — and who we actually are</h2>
              </div>
              <span className="section-index">01 / 05</span>
            </div>

            <div className="about-layout">
              <div className="about-lead">
                <p>
                  AlloyPress is built around a simple editorial idea: AI
                  coverage should help people make better decisions, not add
                  more noise.
                </p>
                <p>
                  Our team researches tools, runs practical tests, compares
                  competing products, and translates technical changes into
                  clear guidance. When something is useful, we explain why.
                  When it is not, we say that too.
                </p>
              </div>

              <div className="about-detail">
                <p>
                  We cover the parts of AI that matter after the headline:
                  what a tool actually does, where it fits, what it costs,
                  what its limitations are, and who should use it.
                </p>

                <div className="quote-strip">
                  <span>EDITORIAL PRINCIPLE</span>
                  <strong>Useful information over impressive-sounding claims.</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXPERTISE */}
        <section className="author-section author-expertise">
          <div className="author-container">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  AREAS OF COVERAGE
                </div>
                <h2>Our areas of editorial expertise</h2>
                <p>
                  Focused coverage across the AI categories readers use most.
                </p>
              </div>
              <span className="section-index">02 / 05</span>
            </div>

            <div className="expertise-grid">
              {[
                ["01", "AI Tool Reviews", "Hands-on testing, features, pricing, strengths and limitations."],
                ["02", "AI Comparisons", "Side-by-side analysis when choosing between similar tools."],
                ["03", "AI Alternatives", "Useful alternatives when the obvious option is not the right fit."],
                ["04", "AI News", "Important launches, updates, model changes and industry shifts."],
                ["05", "Guides & Tutorials", "Step-by-step explanations that help readers get results."],
                ["06", "AI Education", "Plain-language explanations of concepts, products and workflows."],
              ].map(([number, title, text]) => (
                <article className="expertise-card" key={number}>
                  <span className="card-number">{number}</span>
                  <span className="card-marker"></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ / QUESTIONS */}
        <section className="author-section author-faq">
          <div className="section-texture" aria-hidden="true" />
          <div className="author-container">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  BEFORE YOU READ
                </div>
                <h2>A few questions people ask</h2>
                <p>
                  The editorial approach behind our reviews, guides, and
                  recommendations.
                </p>
              </div>
              <span className="section-index">03 / 05</span>
            </div>

            <div className="faq-list">
              {[
                [
                  "Do you actually test every product you review?",
                  "Our reviews are built around hands-on evaluation whenever access allows. We test the workflows and features that matter to the use case instead of relying only on product pages or launch claims.",
                ],
                [
                  "Are your recommendations paid for?",
                  "Editorial decisions are not based on whether a product is popular or promoted. We focus on usefulness, real-world performance, limitations, and fit for the reader.",
                ],
                [
                  "How do you compare AI tools?",
                  "We compare tools against the same practical criteria wherever possible: output quality, usability, features, speed, pricing, limitations, and the audience each product serves best.",
                ],
                [
                  "Do you update older articles?",
                  "Yes. AI changes quickly, so useful evergreen pages should not be treated as finished forever. Important changes to products, pricing, capabilities, or recommendations are reviewed and updated when needed.",
                ],
                [
                  "Why should I trust an AlloyPress recommendation?",
                  "Because the goal is not to recommend the most tools. It is to reduce the number of tools you need to consider and give you enough context to make a confident decision.",
                ],
              ].map(([question, answer], index) => (
                <details className="faq-item" key={question}>
                  <summary>
                    <span className="faq-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="faq-question">{question}</span>
                    <span className="faq-symbol" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-answer">
                    <p>{answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="author-section author-process">
          <div className="process-glow" aria-hidden="true" />
          <div className="author-container">
            <div className="section-heading section-heading-dark">
              <div>
                <div className="eyebrow eyebrow-light">
                  <span className="eyebrow-dot" />
                  TESTING AND RESEARCH
                </div>
                <h2>Our testing process, step by step</h2>
                <p>
                  A repeatable process keeps the work practical, transparent,
                  and useful across different AI categories.
                </p>
              </div>
              <span className="section-index">04 / 05</span>
            </div>

            <div className="process-list">
              {[
                ["01", "We start with a real use case", "We define what the reader needs the tool to accomplish before evaluating features."],
                ["02", "We run a practical workflow", "We use the product for the task it claims to solve instead of judging it from marketing copy."],
                ["03", "We document quality with original evidence", "Where useful, we record outputs, limitations, workflow friction, pricing and other observable details."],
                ["04", "We check the facts before publishing", "Product claims, features, pricing and important context are checked against reliable sources and the product itself."],
                ["05", "We write for the decision, not the hype", "The final article explains who the tool is for, where it works, where it falls short, and what alternatives deserve attention."],
                ["06", "We revisit when things change", "Important changes can trigger updates so older pages remain useful rather than quietly becoming outdated."],
              ].map(([number, title, text]) => (
                <article className="process-row" key={number}>
                  <span className="process-number">{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <span className="process-arrow"></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT WE DO / DON'T */}
        <section className="author-section author-standards">
          <div className="author-container">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  EDITORIAL VALUES
                </div>
                <h2>What we do — and what we don&apos;t</h2>
                <p>Simple rules keep our coverage useful and grounded.</p>
              </div>
              <span className="section-index">05 / 05</span>
            </div>

            <div className="standards-grid">
              <article className="standard-card positive">
                <span className="standard-icon">+</span>
                <div>
                  <h3>We test before we recommend</h3>
                  <p>Practical evaluation comes before a strong recommendation.</p>
                </div>
              </article>
              <article className="standard-card negative">
                <span className="standard-icon">×</span>
                <div>
                  <h3>We don&apos;t publish hype as evidence</h3>
                  <p>Marketing language alone is not enough to support a claim.</p>
                </div>
              </article>
              <article className="standard-card positive">
                <span className="standard-icon">+</span>
                <div>
                  <h3>We explain limitations</h3>
                  <p>A useful review includes the reasons a product may not be right for you.</p>
                </div>
              </article>
              <article className="standard-card negative">
                <span className="standard-icon">×</span>
                <div>
                  <h3>We don&apos;t pretend every tool is for everyone</h3>
                  <p>Audience fit matters as much as feature count.</p>
                </div>
              </article>
              <article className="standard-card positive">
                <span className="standard-icon">+</span>
                <div>
                  <h3>We keep important pages current</h3>
                  <p>AI changes fast, so useful coverage needs maintenance.</p>
                </div>
              </article>
              <article className="standard-card negative">
                <span className="standard-icon">×</span>
                <div>
                  <h3>We don&apos;t bury the answer</h3>
                  <p>Readers should not have to fight through filler to reach the useful part.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ARTICLES */}
        <section className="author-section author-articles">
          <div className="author-container">
            <div className="section-heading articles-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  LATEST WORK
                </div>
                <h2>Articles published by the AlloyPress Team</h2>
              </div>
              <Link className="view-all" href="/blogs">
                View all <span>→</span>
              </Link>
            </div>

            {featured ? (
              <div className="articles-layout">
                <Link
                  href={`/${getCategory(featured).slug}/${featured.slug}`}
                  className="featured-article"
                >
                  <div className="featured-image">
                    {getImageUrl(featured) ? (
                      <Image
                        src={getImageUrl(featured)!}
                        alt={
                          typeof featured.featuredImage === "object" &&
                            featured.featuredImage?.alt
                            ? featured.featuredImage.alt
                            : featured.title
                        }
                        fill
                        sizes="(max-width: 700px) 100vw, 70vw"
                        quality={90}
                      />
                    ) : (
                      <div className="image-fallback">
                        <span>ALLOYPRESS</span>
                      </div>
                    )}
                    <span className="featured-badge">FEATURED WORK</span>
                  </div>

                  <div className="featured-copy">
                    <div className="article-meta">
                      <span>{getCategory(featured).name}</span>
                      <span>{formatDate(featured.publishedAt)}</span>
                    </div>
                    <h3>{featured.title}</h3>
                    <p>
                      {featured.excerpt ||
                        "Practical AI research, testing, and analysis from the AlloyPress Team."}
                    </p>
                    <span className="read-link">Read article ↗</span>
                  </div>
                </Link>

                <div className="article-list">
                  {remaining.slice(0, 4).map((post, index) => {
                    const category = getCategory(post);

                    return (
                      <Link
                        href={`/${category.slug}/${post.slug}`}
                        className="article-row"
                        key={post.id}
                      >
                        <div className="article-row-image">
                          {getImageUrl(post) ? (
                            <Image
                              src={getImageUrl(post)!}
                              alt={
                                typeof post.featuredImage === "object" &&
                                  post.featuredImage?.alt
                                  ? post.featuredImage.alt
                                  : post.title
                              }
                              fill
                              sizes="(max-width: 560px) 100vw, (max-width: 700px) 92px, (max-width: 1024px) 190px, 240px"
                              quality={90}
                            />
                          ) : (
                            <span>{String(index + 1).padStart(2, "0")}</span>
                          )}
                        </div>

                        <div className="article-row-copy">
                          <div className="article-meta">
                            <span>{category.name}</span>
                            <span>{formatDate(post.publishedAt)}</span>
                          </div>
                          <h3>{post.title}</h3>
                        </div>

                        <span className="article-row-arrow">↗</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-articles">
                <span>ALLOYPRESS / ARTICLES</span>
                <h3>Our latest work will appear here.</h3>
                <p>
                  Published articles from the AlloyPress Team are connected
                  directly to this author page.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="author-cta">
          <div className="cta-grid" aria-hidden="true" />
          <div className="cta-glow" aria-hidden="true" />
          <div className="author-container cta-inner">
            <div>
              <div className="eyebrow eyebrow-light">
                <span className="eyebrow-dot" />
                KEEP EXPLORING
              </div>
              <h2>
                Better AI decisions
                <br />
                start with <span>better context.</span>
              </h2>
            </div>

            <div className="cta-actions">
              <Link href="/blogs" className="cta-primary">
                Explore articles <span>→</span>
              </Link>
              <Link href="/reviews" className="cta-secondary">
                Browse reviews
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
