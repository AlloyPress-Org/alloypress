const UTM_SOURCE = "alloypress.com";

const INTERNAL_HOSTS = ["alloypress.com"];

const SKIP_HOSTS: string[] = [];

function hostMatches(host: string, list: string[]): boolean {
  return list.some((h) => host === h || host.endsWith(`.${h}`));
}

export function addUtm(
  url: string | null | undefined,
  forHtml = false,
): string {
  if (!url) return url ?? "";

  const raw = url.trim();

  if (!/^(https?:)?\/\//i.test(raw)) return url;

  let host: string;

  try {
    const parsed = new URL(raw.startsWith("//") ? `https:${raw}` : raw);

    if (parsed.searchParams.has("utm_source")) return url;

    host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return url;
  }

  if (hostMatches(host, INTERNAL_HOSTS) || hostMatches(host, SKIP_HOSTS)) {
    return url;
  }

  const hashIndex = raw.indexOf("#");
  const base = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : "";

  let joiner = "?";

  if (base.includes("?")) {
    joiner = base.endsWith("?") || base.endsWith("&") ? "" : forHtml ? "&amp;" : "&";
  }

  return `${base}${joiner}utm_source=${encodeURIComponent(UTM_SOURCE)}${hash}`;
}

export function addUtmToHtml(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    if (/\sdata-no-utm\b/i.test(tag)) return tag;

    return tag.replace(
      /(\shref\s*=\s*)(["'])(.*?)\2/i,
      (_match, prefix: string, quote: string, href: string) =>
        `${prefix}${quote}${addUtm(href, true)}${quote}`,
    );
  });
}