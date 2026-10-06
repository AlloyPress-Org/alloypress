import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  if (
    !process.env.REVALIDATION_SECRET ||
    secret !== process.env.REVALIDATION_SECRET
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const {
      slug,
      categorySlug,
      authorSlug,
    } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 },
      );
    }

    const tags = [
      `post:${slug}`,
      categorySlug ? `post:${categorySlug}:${slug}` : null,
      categorySlug ? `category:${categorySlug}` : null,
      "home:latest-posts",
      categorySlug === "reviews" ? "home:reviews" : null,
      authorSlug ? `author:${authorSlug}` : null,
    ].filter((tag): tag is string => Boolean(tag));

    // Invalidate the exact blog page.
    revalidatePath(`/blogs/${slug}`);

    // Invalidate related data caches.
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }

    return NextResponse.json({
      success: true,
      path: `/blogs/${slug}`,
      revalidated: tags,
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 },
    );
  }
}