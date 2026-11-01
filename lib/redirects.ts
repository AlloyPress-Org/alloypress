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

// Real content paths illa: bot probes. Indha paths-ku Payload / Neon call-e illa.
const BOT_PROBE =
  /%25|%2e|\/\.|\.(php|env|ya?ml|json|js|map|sql|bak|zip|gz|ini|conf|config|log|txt|xml)\/?$|\/wp-(admin|content|includes|login|json|config)|xmlrpc|phpinfo|cgi-bin/i;

export async function resolveRedirect(path: string): Promise<string | null> {
  if (BOT_PROBE.test(path)) return null;

  const clean = path.replace(/\/+$/, "") || "/";
  const wanted = new Set([clean, `${clean}/`, `${SITE}${clean}`, `${SITE}${clean}/`]);

  // Ella path-kum ore URL => 1 cache entry => max 1 Neon query per hour.
  // Admin-la redirect maathina "redirects" tag expire aagi udane refresh aagum.
  const data = await payloadFetch<{ docs?: RedirectDoc[] }>(
    "/redirects?limit=500&depth=2" +
      "&populate[posts][slug]=true&populate[posts][category]=true" +
      "&populate[pages][slug]=true",
    { strict: false, next: { revalidate: 3600, tags: ["redirects"] } },
  );

  const to = data?.docs?.find((d) => wanted.has(d.from))?.to;
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