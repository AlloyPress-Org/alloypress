import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = ["blogs", "reviews", "news", "alternatives", "comparisons"];
const PAGE_PATHS: Record<string, string> = { about: "/about-us" };

// Home section tag for each category.
// These MUST match the tags used in the home components:
//   LatestUpdates   -> "home:reviews"
//   LearnAboutAI    -> "home:latest-blogs"
//   RecentAINews    -> "home:latest-news"
//   PopularResources-> "home:alternatives"
const HOME_TAG_BY_CATEGORY: Record<string, string> = {
  blogs: "home:latest-blogs",
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
      const cat = clean(body.categorySlug);
      const prevCat = clean(body.previousCategorySlug);
      const author = clean(body.authorSlug);

      addHomeTags([cat, prevCat]);

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
      if (cat) {
        tags.add(`post:${cat}:${slug}`);
        tags.add(`category:${cat}`);
        paths.add(`/${cat}/${slug}`);
        paths.add(`/${cat}`);
      }
      if (prevCat) {
        tags.add(`category:${prevCat}`);
        paths.add(`/${prevCat}`);
      }
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
      CATEGORIES.forEach((c) => tags.add(`category:${c}`)); // lists embed images
    } else {
      return bad("unknown scope");
    }

    for (const p of paths) revalidatePath(p);
    for (const t of tags) revalidateTag(t, "max");

    return NextResponse.json({ success: true, scope, paths: [...paths], revalidated: [...tags] });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}