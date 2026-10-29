import { payloadFetch } from "@/lib/payload";
import { postHref } from "@/lib/post-href";

type RedirectDoc = {
  from: string;
  to?: {
    type?: "reference" | "custom" | null;
    url?: string | null;
    reference?: { relationTo: string; value: any } | null;
  };
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://alloypress.com";

export async function resolveRedirect(path: string): Promise<string | null> {
  const clean = path.replace(/\/+$/, "") || "/";
  // Admin la full URL type pannirukeenga (screenshot), so rendu form-um check pannrom
  const variants = [clean, `${clean}/`, `${SITE}${clean}`, `${SITE}${clean}/`];

  const params = new URLSearchParams();
  params.set("where[from][in]", variants.join(","));
  params.set("limit", "1");
  params.set("depth", "2");

  const data = await payloadFetch<{ docs?: RedirectDoc[] }>(
    `/redirects?${params.toString()}`,
    { strict: false, next: { revalidate: 300, tags: ["redirects"] } },
  );

  const to = data?.docs?.[0]?.to;
  if (!to) return null;

  if (to.type === "custom" && to.url) return to.url;

  const doc = to.reference?.value;
  if (doc && typeof doc === "object" && doc.slug) {
    if (to.reference?.relationTo === "posts") {
      const cat = typeof doc.category === "object" ? doc.category?.slug : null;
      return postHref(cat, doc.slug);
    }
    return `/${doc.slug}`;
  }
  return null;
}