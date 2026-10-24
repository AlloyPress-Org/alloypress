import handler from "vinext/server/fetch-handler";

const GONE_PREFIXES = [
  "/hosting",
  "/health",
  "/technology",
  "/marketing",
  "/social-media",
  "/person",
  "/wp-content",
];

function isGone(pathname: string) {
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

    return handler.fetch(request, env, ctx);
  },
};