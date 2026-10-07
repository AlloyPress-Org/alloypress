import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  if (
    !process.env.REVALIDATION_SECRET ||
    secret !== process.env.REVALIDATION_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, categorySlug, authorSlug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const tags = [
      "sitemap", // sitemap fetch cache
      `post:${slug}`,
      categorySlug ? `post:${categorySlug}:${slug}` : null,
      categorySlug ? `category:${categorySlug}` : null,
      "home:latest-posts",
      categorySlug === "reviews" ? "home:reviews" : null,
      authorSlug ? `author:${authorSlug}` : null,
    ].filter((tag): tag is string => Boolean(tag));

    // Post page: blogs route and category route rendu-m revalidate
    const paths = new Set<string>([`/blogs/${slug}`]);
    if (categorySlug) {
      paths.add(`/${categorySlug}/${slug}`);
      paths.add(`/${categorySlug}`);
    }
    paths.add("/sitemap.xml");

    for (const path of paths) revalidatePath(path);
    for (const tag of tags) revalidateTag(tag, "max");

    return NextResponse.json({
      success: true,
      paths: [...paths],
      revalidated: tags,
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}