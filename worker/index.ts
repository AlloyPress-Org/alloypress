import handler from "vinext/server/fetch-handler";

const GONE_PREFIXES = [
  "/hosting", "/health", "/technology", "/marketing",
  "/social-media", "/person",
  "/uncategorized", "/web-stories", "/sports",
  "/cryptocurrency", "/company",
  "/write-for-us", "/contribute",
];

function isGone(pathname: string) {
  if (pathname.startsWith("/wp-")) return true; // wp-content, wp-admin, wp-login.php, wp-json
  return GONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (isGone(pathname)) {
      return new Response("410 Gone", {
        status: 410,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400, s-maxage=86400",
          "x-robots-tag": "noindex",
        },
      });
    }

    const h: any = handler;
    return typeof h === "function" ? h(request, env, ctx) : h.fetch(request, env, ctx);
  },
};