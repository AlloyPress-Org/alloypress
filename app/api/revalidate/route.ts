import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = ["blogs", "reviews", "news", "alternatives", "comparisons"];

// Subcategories of "blogs" (Learn). Their listing pages live at /blogs/<slug>
// and their posts at /blogs/<post-slug>.
const SUB_CATEGORIES = ["listicles", "informatives"];

const PAGE_PATHS: Record<string, string> = { about: "/about-us" };

// Home section tag for each category.
// These MUST match the tags used in the home components:
//   LatestUpdates   -> "home:reviews"
//   LearnAboutAI    -> "home:informatives"   (informative posts)
//   AIToolList      -> "home:listicles"      (listicle posts)
//   RecentAINews    -> "home:latest-news"
//   PopularResources-> "home:alternatives"
const HOME_TAG_BY_CATEGORY: Record<string, string> = {
  blogs: "home:latest-blogs",
  listicles: "home:listicles",
  informatives: "home:informatives",
  reviews: "home:reviews",
  news: "home:latest-news",
  alternatives: "home:alternatives",
};
const ALL_HOME_CATEGORY_TAGS = Object.values(HOME_TAG_BY_CATEGORY);

const clean = (v: unknown): string | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim();
  return /^[\w.\-]{1,200}$/.test(s) ? s : null;
};

// ------------------------------------------------------------
// 1) Next cache: expire tags IMMEDIATELY
//
// "max" = stale-while-revalidate: the first visitor still gets the OLD page.
// { expire: 0 } = the very next request renders fresh data.
// (Required together with the Cloudflare purge below: if the edge re-fetched
//  a page while Next still served the stale copy, the edge would cache the
//  OLD page again.)
// ------------------------------------------------------------
function expireTag(tag: string) {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    // runtime does not support the profile object -> fall back
    revalidateTag(tag, "max");
  }
}

// ------------------------------------------------------------
// 2) Cloudflare edge cache: purge the website hostname
//
// Next revalidation cannot clear Cloudflare's own copies (that was the reason
// /blogs showed a 41h old page). Purging by hostname also clears the
// ?_rsc=... variants used by client-side navigation.
// Needs Worker secrets: CF_ZONE_ID, CF_API_TOKEN (Zone > Cache Purge > Purge).
// If they are missing the purge is skipped (revalidation still works).
// ------------------------------------------------------------
type PurgeResult = "ok" | "skipped" | "failed";

async function purgeCloudflareEdge(): Promise<PurgeResult> {
  const zone = process.env.CF_ZONE_ID;
  const token = process.env.CF_API_TOKEN;

  if (!zone || !token) return "skipped";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alloypress.com";

  let host: string;

  try {
    host = new URL(siteUrl).hostname;
  } catch {
    host = "alloypress.com";
  }

  const bare = host.replace(/^www\./, "");
  const hosts = [bare, `www.${bare}`];

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hosts }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      console.error(
        "[revalidate] Cloudflare purge failed",
        res.status,
        await res.text(),
      );
      return "failed";
    }

    return "ok";
  } catch (error) {
    console.error("[revalidate] Cloudflare purge error", error);
    return "failed";
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const scope = typeof body?.scope === "string" ? body.scope : "post";
    const tags = new Set<string>();
    const paths = new Set<string>();
    const bad = (m: string) => NextResponse.json({ error: m }, { status: 400 });

    // Adds the home-section tags for the given categories.
    // If no category is known, refresh all home sections (safe fallback).
    const addHomeTags = (cats: Array<string | null>) => {
      const known = cats.filter((c): c is string => !!c);
      if (known.length === 0) {
        ALL_HOME_CATEGORY_TAGS.forEach((t) => tags.add(t));
        return;
      }
      known.forEach((c) => {
        const t = HOME_TAG_BY_CATEGORY[c];
        if (t) tags.add(t);
      });
    };

    if (scope === "post") {
      const slug = clean(body.slug);
      if (!slug) return bad("slug is required");
      const prevSlug = clean(body.previousSlug);

      // cat  = website section (blogs / reviews / news / ...)
      // sub  = subcategory slug when the post is a listicle / informative
      const cat = clean(body.categorySlug);
      const prevCat = clean(body.previousCategorySlug);
      const sub = clean(body.subCategorySlug);
      const prevSub = clean(body.previousSubCategorySlug);
      const author = clean(body.authorSlug);

      addHomeTags([cat, prevCat, sub, prevSub]);

      // homepage:featured -> featured posts are embedded (depth 2) inside
      // homepage-settings, so editing a featured post must refresh it too.
      ["sitemap", "home:hero", "home:latest-posts", "homepage:featured"].forEach((t) =>
        tags.add(t),
      );
      tags.add(`post:${slug}`);
      paths.add(`/blogs/${slug}`);
      paths.add("/sitemap.xml");
      paths.add("/");
      if (author) tags.add(`author:${author}`);

      // ---- current section ----
      if (cat) {
        tags.add(`post:${cat}:${slug}`);
        tags.add(`category:${cat}`);
        paths.add(`/${cat}/${slug}`);
        paths.add(`/${cat}`);
      }

      // ---- current subcategory (Listicle / Informative) ----
      // refreshes: /blogs/listicles (collection page) + home sections
      if (sub) {
        tags.add(`category:${sub}`);
        paths.add(`/${cat ?? "blogs"}/${sub}`);
      }

      // ---- previous section / subcategory (category was changed) ----
      if (prevCat) {
        tags.add(`category:${prevCat}`);
        paths.add(`/${prevCat}`);
      }
      if (prevSub) {
        tags.add(`category:${prevSub}`);
        paths.add(`/${prevCat ?? cat ?? "blogs"}/${prevSub}`);
      }

      // ---- slug was changed ----
      if (prevSlug) {
        tags.add(`post:${prevSlug}`);
        if (cat) tags.add(`post:${cat}:${prevSlug}`);
        paths.add(`/blogs/${prevSlug}`);
        if (cat) paths.add(`/${cat}/${prevSlug}`);
      }
    } else if (scope === "category") {
      const slug = clean(body.categorySlug);
      if (!slug) return bad("categorySlug is required");
      const prev = clean(body.previousCategorySlug);
      [
        "categories",
        "posts-content",
        "related",
        "sitemap",
        "home:hero",
        "home:latest-posts",
        "homepage:featured",
      ].forEach((t) => tags.add(t));
      addHomeTags([slug, prev]);
      tags.add(`category:${slug}`);
      paths.add(`/${slug}`);
      paths.add("/");
      if (prev) {
        tags.add(`category:${prev}`);
        paths.add(`/${prev}`);
      }

      // A subcategory (listicles / informatives) was created / edited / deleted:
      // refresh its own page, the parent section (/blogs) and its home section.
      [slug, prev].forEach((c) => {
        if (c && !CATEGORIES.includes(c)) {
          tags.add("category:blogs");
          paths.add("/blogs");
          paths.add(`/blogs/${c}`);
        }
      });
    } else if (scope === "page") {
      const slug = clean(body.pageSlug);
      if (!slug) return bad("pageSlug is required");
      const prev = clean(body.previousPageSlug);
      ["pages", "sitemap"].forEach((t) => tags.add(t));
      tags.add(`page:${slug}`);
      paths.add(PAGE_PATHS[slug] ?? `/${slug}`);
      if (prev) {
        tags.add(`page:${prev}`);
        paths.add(PAGE_PATHS[prev] ?? `/${prev}`);
      }
    } else if (scope === "homepage") {
      ["homepage", "homepage:featured"].forEach((t) => tags.add(t));
      paths.add("/");
    } else if (scope === "media") {
      const id = clean(body.mediaId);
      if (!id) return bad("mediaId is required");
      [
        "media",
        "posts-content",
        "related",
        "home:hero",
        "home:latest-posts",
        "homepage",
        "homepage:featured",
      ].forEach((t) => tags.add(t));
      ALL_HOME_CATEGORY_TAGS.forEach((t) => tags.add(t));
      tags.add(`media:${id}`);
      // lists embed images
      [...CATEGORIES, ...SUB_CATEGORIES].forEach((c) => tags.add(`category:${c}`));
    } else {
      return bad("unknown scope");
    }

    // 1) Next cache: paths + tags (tags expire immediately)
    for (const p of paths) revalidatePath(p);
    for (const t of tags) expireTag(t);

    // 2) Cloudflare edge: clear AFTER Next is expired, so the edge cannot
    //    re-cache the old page. Pass { "skipEdgePurge": true } in the body
    //    for bulk jobs (Cloudflare Free allows only ~5 purges / minute).
    const edgePurge: PurgeResult =
      body?.skipEdgePurge === true ? "skipped" : await purgeCloudflareEdge();

    console.log("[revalidate]", scope, {
      paths: [...paths],
      tags: [...tags],
      edgePurge,
    });

    return NextResponse.json({
      success: true,
      scope,
      paths: [...paths],
      revalidated: [...tags],
      edgePurge,
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}