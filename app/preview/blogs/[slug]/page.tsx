import type { Metadata } from "next";

import BlogLivePreview from "@/components/blogs/BlogLivePreview";
import type { Post } from "@/lib/cms";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Params = Promise<{
  slug: string;
}>;

type SearchParams = Promise<{
  id?: string;
  secret?: string;
}>;

const PAYLOAD_URL = (
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api"
).replace(/\/api\/?$/, "");

export default async function BlogPreviewPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { id, secret } = await searchParams;

  // Drafts must never be viewable by the public: the preview URL carries the
  // same secret that Payload puts in livePreview.url (PREVIEW_SECRET).
  const expectedSecret = process.env.PREVIEW_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return <div>Unauthorized preview.</div>;
  }

  if (!id) {
    return <div>Preview document ID missing.</div>;
  }

  const response = await fetch(
    `${PAYLOAD_URL}/api/posts/preview-doc?id=${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        "x-preview-secret": expectedSecret,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error(
      `[preview] Payload returned ${response.status} for post ${id}: ${details}`,
    );
    return <div>Unable to load preview (Payload status {response.status}).</div>;
  }

  const post = (await response.json()) as Post;

  return (
    <BlogLivePreview
      initialData={post}
      related={[]}
      slug={slug}
    />
  );
}