"use client";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, useId } from "react";
import {
  Check,
  Copy,
  FileText,
  Link2,
  ChevronDown,
  Share2,
  Sparkles,
  Send,
  CalendarDays,
  Clock3,
  X as LucideX,
} from "lucide-react";
import FaqAccordion from './FaqAccordion'
import { extractFaqs } from '@/lib/faq-from-html'
import {
  FaWhatsapp,
  FaLinkedinIn,
  FaXTwitter,
  FaRedditAlien,
  FaPinterestP,
} from "react-icons/fa6";
import AdSenseSidebar from "@/components/ads/AdSenseSidebar";
import AdSenseInArticle from "@/components/ads/AdSenseInArticle";
import BackToTop from "@/components/BackToTop";

import "./BlogPostView.css";
type Props = {
  post: any;
  related: any[];
  articleImage: string | null;
  category?: string;
  categoryLabel?: string;
};

/* -------------------------------------------------------------------------- */
/* Interactive HTML handling                                                  */
/* -------------------------------------------------------------------------- */

const INTERACTIVE_RE = /<script\b|\son[a-z]+\s*=/i;

/*
 * Real legacy widgets. These are driven by the delegated click listener in
 * ArticleRenderer, so they stay inline (scripts stripped) exactly as before.
 */
const LEGACY_STRICT_RE =
  /apx-bike-widget|apx-prompt-challenge|apx-reference-gallery/i;

/*
 * The old `.prompt-box` widget. Matches ONLY the exact class token
 * "prompt-box" (start of class list or after whitespace), so new class names
 * like "ap-prompt-box" are NOT treated as legacy and can use their own
 * script / onclick inside the sandboxed iframe.
 */
const LEGACY_PROMPTBOX_RE = /class=["'](?:[^"']*\s)?prompt-box(?=[\s"'])/i;

// Existing widgets that are driven by the delegated listener in ArticleRenderer
const LEGACY_WIDGET_RE = new RegExp(
  `${LEGACY_STRICT_RE.source}|${LEGACY_PROMPTBOX_RE.source}`,
  "i"
);

const FAQ_RE = /ai-faq-question|ai-faq-answer/i;

/*
 * Script-free widgets that use data attributes (data-copy, data-toggle...).
 * They render inline (SEO friendly) and are handled by ArticleRenderer.
 */
const DATA_ACTION_RE = /\sdata-(copy|copy-target|copy-scope|toggle)\b/i;

function isLegacyWidget(code: string): boolean {
  return LEGACY_WIDGET_RE.test(code);
}

function isInteractiveHtml(code: string): boolean {
  if (FAQ_RE.test(code)) return false;
  return INTERACTIVE_RE.test(code) && !LEGACY_WIDGET_RE.test(code);
}

/* -------------------------------------------------------------------------- */
/* Sandboxed iframe (auto-height + theme aware)                               */
/* -------------------------------------------------------------------------- */

/*
 * Theme tokens the site can define on :root / [data-theme="dark"].
 * Authors can use var(--apx-bg), var(--apx-text) ... inside iframe HTML.
 * Tokens that the site does not define are skipped, so var() fallbacks work.
 */
const THEME_TOKENS = [
  "--apx-bg",
  "--apx-surface",
  "--apx-text",
  "--apx-muted",
  "--apx-border",
  "--apx-accent",
];

/*
 * `height:100vh` / `min-height:100vh` inside an iframe is relative to the
 * iframe itself, which creates a resize feedback loop and blank space.
 * Neutralize them so the content decides its own height.
 */
function neutralizeViewportUnits(html: string): string {
  return html.replace(
    /(^|[;{\s"'])((?:min-)?height)\s*:\s*[\d.]+(?:d|s|l)?vh/gi,
    (_m, pre: string, prop: string) =>
      prop.toLowerCase() === "min-height"
        ? `${pre}min-height:0`
        : `${pre}height:auto`
  );
}

function cssPreviewHtml(code: string): string {
  const safe = code.replace(/<\/style/gi, "<\\/style");
  return `<style>${safe}</style><div class="alloypress-css-preview">CSS Preview</div>`;
}

function jsPreviewHtml(code: string): string {
  const safe = code.replace(/<\/script/gi, "<\\/script");
  return `<div id="app"></div>
<script>
try {
${safe}
} catch (error) {
  document.body.innerHTML = '<pre style="color:red;white-space:pre-wrap;">' + String((error && error.stack) || error) + '</pre>';
}
</script>`;
}

function detectColorScheme(): "light" | "dark" {
  const root = document.documentElement;
  const explicit = getComputedStyle(root).colorScheme || "";

  if (/\bdark\b/.test(explicit) && !/\blight\b/.test(explicit)) return "dark";
  if (/\blight\b/.test(explicit) && !/\bdark\b/.test(explicit)) return "light";

  const attr = (root.getAttribute("data-theme") || "").toLowerCase();
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";

  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function SandboxedHtml({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const id = useId();
  const [height, setHeight] = useState(60);

  const srcDoc = useMemo(
    () => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base target="_blank" />
<script>
(function () {
  var SID = ${JSON.stringify(id)};
  function legacyCopy(t) {
    var ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  var shim = {
    writeText: function (t) {
      t = String(t);
      if (!legacyCopy(t)) {
        parent.postMessage({ type: "apx-copy", id: SID, text: t.slice(0, 200000) }, "*");
      }
      return Promise.resolve();
    }
  };
  try {
    Object.defineProperty(navigator, "clipboard", { value: shim, configurable: true });
  } catch (e) {}

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "apx-theme" && e.data.id === SID) {
      var el = document.getElementById("apx-theme");
      if (el) el.textContent = e.data.css;
    }
  });
})();
</script>
<style>
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: hidden;
  }
  body { color: var(--apx-text, CanvasText); font-family: system-ui, sans-serif; }
  #apx-root { position: absolute; top: 0; left: 0; right: 0; display: flow-root; }
  *, *::before, *::after { box-sizing: border-box; }
</style>
<style id="apx-theme"></style>
</head>
<body>
<div id="apx-root">${neutralizeViewportUnits(html)}</div>
<script>
(function () {
  var id = ${JSON.stringify(id)};
  var root = document.getElementById("apx-root");
  var last = -1;

  function send() {
    var r = root.getBoundingClientRect();
    var h = Math.ceil(Math.max(r.height, root.scrollHeight, root.offsetHeight));
    if (h === last) return;
    last = h;
    parent.postMessage({ type: "apx-height", id: id, height: h }, "*");
  }

  // Parent asks for the height (fixes the hydration race)
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "apx-ping" && e.data.id === id) {
      last = -1;
      send();
    }
  });

  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  document.addEventListener("DOMContentLoaded", send);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(send);
  if (window.ResizeObserver) new ResizeObserver(send).observe(root);
  new MutationObserver(send).observe(root, {
    subtree: true, childList: true, attributes: true, characterData: true
  });

  Array.prototype.forEach.call(root.querySelectorAll("img"), function (img) {
    if (!img.complete) {
      img.addEventListener("load", send);
      img.addEventListener("error", send);
    }
  });

  // Safety net: re-measure for the first ~5 seconds
  var n = 0;
  var t = setInterval(function () {
    send();
    if (++n > 20) clearInterval(t);
  }, 250);

  send();
})();
</script>
</body>
</html>`,
    [html, id]
  );

  /* Receive height + clipboard messages from the iframe */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.id !== id) return;

      if (e.data.type === "apx-height") {
        setHeight(Math.max(0, Math.ceil(e.data.height)));
        return;
      }

      if (e.data.type === "apx-copy" && typeof e.data.text === "string") {
        void copyText(e.data.text);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id]);

  /*
   * Hydration race fix: the iframe may send its first height before React
   * attaches the listener above. Ask it to resend, several times.
   */
  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const ping = () =>
      iframe.contentWindow?.postMessage({ type: "apx-ping", id }, "*");

    ping();
    const timers = [50, 150, 400, 900, 1800, 3500].map((ms) =>
      window.setTimeout(ping, ms)
    );
    iframe.addEventListener("load", ping);

    return () => {
      timers.forEach(window.clearTimeout);
      iframe.removeEventListener("load", ping);
    };
  }, [id]);

  /* Theme sync (tokens + color-scheme) without reloading the iframe */
  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const push = () => {
      const cs = getComputedStyle(document.documentElement);
      const scheme = detectColorScheme();

      iframe.style.colorScheme = scheme;

      const vars = THEME_TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()])
        .filter(([, v]) => v)
        .map(([t, v]) => `${t}:${v}`)
        .join(";");

      iframe.contentWindow?.postMessage(
        {
          type: "apx-theme",
          id,
          css: `:root{${vars}${vars ? ";" : ""}color-scheme:${scheme}}`,
        },
        "*"
      );
    };

    const mo = new MutationObserver(push);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", push);

    iframe.addEventListener("load", push);
    push();
    const themeTimers = [150, 500, 1500].map((ms) =>
      window.setTimeout(push, ms)
    );

    return () => {
      themeTimers.forEach(window.clearTimeout);
      mo.disconnect();
      mq.removeEventListener("change", push);
      iframe.removeEventListener("load", push);
    };
  }, [id]);

  return (
    <div className="post-live-code">
      <iframe
        ref={ref}
        title={title}
        srcDoc={srcDoc}
        loading="lazy"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-write"
        className="post-live-code-frame"
        style={{
          width: "100%",
          height,
          border: 0,
          display: "block",
          background: "transparent",
        }}
      />
    </div>
  );
}

/* next.config.ts remotePatterns la irukkura hostnames mattum */
const OPTIMIZABLE_HOSTS = [
  "media.alloypress.com",
  "pub-c555bbd45f8b41b3bd6910202b4ee75d.r2.dev",
];

function isOptimizable(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) {
    return true;
  }

  try {
    return OPTIMIZABLE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

type SmartImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  preload?: boolean;
};

function SmartImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  preload = false,
}: SmartImageProps) {
  if (isOptimizable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={className}
        preload={preload}
        fetchPriority={preload ? "high" : undefined}
      />
    );
  }

  // Only use native img for genuinely unsupported legacy URLs.
  // Do not use this path for the current R2 production images.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={preload ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={preload ? "high" : undefined}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function textFromNodes(nodes: any[] = []): string {
  return nodes
    .map((node) => {
      if (node?.text) return node.text;
      if (node?.children) return textFromNodes(node.children);
      if (node?.fields?.text) return node.fields.text;
      return "";
    })
    .join("");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function getMedia(value: any): any | null {
  if (!value) return null;

  if (typeof value === "object") {
    if (value.media && typeof value.media === "object") return value.media;
    if (value.value && typeof value.value === "object") return value.value;
    return value;
  }

  return null;
}

function mediaUrl(value: any): string | null {
  const media = getMedia(value);

  if (!media) return null;

  return (
    media.url ||
    media.src ||
    media.publicUrl ||
    media.path ||
    media.filename ||
    media.fields?.url ||
    null
  );
}
function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      const watchId = parsed.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      const pathMatch = parsed.pathname.match(
        /^\/(?:embed|shorts|live)\/([^/?#]+)/
      );

      return pathMatch?.[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function LiteYouTubeEmbed({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [activated, setActivated] = useState(false);

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <iframe
        src={url}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (activated) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
          videoId
        )}?autoplay=1&rel=0`}
        title={title}
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="lite-youtube"
      onClick={() => setActivated(true)}
      aria-label={`Play ${title}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${encodeURIComponent(
          videoId
        )}/hqdefault.jpg`}
        alt=""
        className="lite-youtube-thumbnail"
        loading="lazy"
        decoding="async"
      />

      <span
        className="lite-youtube-play"
        aria-hidden="true"
      >
        <span />
      </span>

      <span className="lite-youtube-label">
        Play video
      </span>
    </button>
  );
}
const BLOCK_NODE_TYPES = new Set([
  "upload",
  "image",
  "block",
  "quote",
  "blockquote",
  "table",
  "list",
  "listitem",
  "list-item",
  "code",
  "codeBlock",
  "horizontalrule",
  "horizontalRule",
  "hr",
  "video",
  "videoEmbed",
  "videoFile",
  "audio",
]);

function isBlockNode(node: any): boolean {
  if (!node) return false;

  if (BLOCK_NODE_TYPES.has(node.type)) {
    return true;
  }

  /*
   * Some custom migrated blocks may be represented as a generic node
   * containing fields.blockType.
   */
  if (node.fields?.blockType) {
    return true;
  }

  return false;
}

function paragraphContainsBlockNode(children: any[]): boolean {
  return children.some((child) => isBlockNode(child));
}

function buildHeadingIndex(
  nodes: any[] = []
): {
  headings: { id: string; text: string; level: 2 }[];
  idsByNode: Map<any, string>;
} {
  const headings: { id: string; text: string; level: 2 }[] = [];
  const idsByNode = new Map<any, string>();
  const usedIds = new Set<string>();

  function walk(items: any[]): void {
    items.forEach((node) => {
      if (!node || typeof node !== "object") return;

      if (node.type === "heading") {
        const rawTag = node.tag || "h2";
        const tag =
          ["h1", "h2", "h3", "h4", "h5", "h6"].includes(rawTag)
            ? rawTag
            : "h2";

        const text = textFromNodes(node.children || []).trim();

        if (text) {
          const baseId = slugify(text) || "section";
          let id = baseId;
          let suffix = 2;

          while (usedIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
          }

          usedIds.add(id);
          idsByNode.set(node, id);

          // Keep the generated TOC clean: migrated WordPress posts often
          // contain a literal "Table of Contents" H2 that is only an editor
          // artefact. The real TOC is rendered by this page.
          const isGeneratedTocHeading = /^(table\s+of\s+contents|contents)$/i.test(
            text.replace(/[:：]/g, "").trim()
          );

          if (tag === "h2" && !isGeneratedTocHeading) {
            headings.push({
              id,
              text,
              level: 2,
            });
          }
        }
      }

      if (Array.isArray(node.children)) {
        walk(node.children);
      }
    });
  }

  walk(nodes);

  return { headings, idsByNode };
}

function extractSummary(
  nodes: any[] = [],
  excerpt = ""
): string {
  for (const node of nodes) {
    if (
      node?.type === "block" &&
      node?.fields?.blockType === "styledBox"
    ) {
      const heading = node.fields.heading || "";

      if (/t[lI];?dr/i.test(heading)) {
        return node.fields.text || excerpt;
      }
    }

    if (Array.isArray(node?.children)) {
      const found = extractSummary(node.children, "");

      if (found) {
        return found;
      }
    }
  }

  return excerpt || "A practical AlloyPress breakdown of this article.";
}

function cleanEditorialText(value: unknown): string {
  if (typeof value !== "string") return "";

  let text = value
    // Remove WordPress/editor headings completely before stripping
    // the remaining HTML tags.
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")

    // Remove remaining HTML tags.
    .replace(/<[^>]*>/g, " ")

    // Decode common WordPress HTML entities.
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&#038;/gi, "&")
    .replace(/&#38;/gi, "&")
    .replace(/&#8230;/gi, "…")
    .replace(/&#x26;/gi, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x22;/gi, '"')

    // Normalize whitespace.
    .replace(/\s+/g, " ")
    .trim();

  // Remove migrated WordPress / AI toolbar artifacts.
  text = text.replace(
    /Ask AI which software may suit your team[\s\S]*?(?=TL;DR\s*:|$)/i,
    ""
  );

  text = text.replace(
    /📋\s*Copied!.*?(?:Copy again\s*[✕×x]?|$)/i,
    ""
  );

  // Remove TL;DR label and migrated excerpt markers.
  text = text.replace(/^TL;DR\s*:\s*/i, "");
  text = text.replace(/\s*\[…\]\s*$/i, "");
  text = text.replace(/\s*\[\.\.\.\]\s*$/i, "");
  text = text.replace(/…\s*$/i, "");

  // Clean leading punctuation / whitespace.
  text = text.replace(/^[-–—•\s]+/, "");

  return text.replace(/\s+/g, " ").trim();
}
async function copyText(text: string): Promise<boolean> {
  const value = text.trim();
  if (!value) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continue to the legacy fallback below.
    }
  }

  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.left = "-9999px";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";

  document.body.appendChild(ta);

  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    ta.remove();
  }
}
/* -------------------------------------------------------------------------- */
/* Inline renderer                                                            */
/* -------------------------------------------------------------------------- */

function InlineText({ node }: { node: any }) {
  if (!node) return null;

  if (node.type === "link") {
    const url = node.fields?.url || node.url || "#";

    const internal =
      url.startsWith("/") ||
      url.includes("staging1.alloypress.com/blogs/") ||
      url.includes("alloypress.com/blogs/");

    let href = url;

    try {
      if (
        url.includes("staging1.alloypress.com/blogs/") ||
        url.includes("alloypress.com/blogs/")
      ) {
        href = new URL(url).pathname;
      }
    } catch {
      // Keep original URL if parsing fails.
    }

    return (
      <a
        href={href}
        target={internal ? undefined : "_blank"}
        rel={internal ? undefined : "noopener noreferrer"}
        className="post-link"
      >
        {(node.children || []).map((child: any, i: number) => (
          <InlineText key={i} node={child} />
        ))}
      </a>
    );
  }

  if (node.type === "text") {
    const value = node.text || "";
    const format = Number(node.format || 0);

    let content: any = value;

    if (format & 1) {
      content = <strong>{content}</strong>;
    }

    if (format & 2) {
      content = <em>{content}</em>;
    }

    if (format & 4) {
      content = <s>{content}</s>;
    }

    if (format & 8) {
      content = <u>{content}</u>;
    }

    if (format & 16) {
      content = (
        <code className="inline-code">
          {content}
        </code>
      );
    }

    if (format & 32) {
      content = <sub>{content}</sub>;
    }

    if (format & 64) {
      content = <sup>{content}</sup>;
    }
    return <span>{content}</span>;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Main Lexical renderer                                                      */
/* -------------------------------------------------------------------------- */

function isArticleHtml(code: string): boolean {
  const html = code.trim();

  if (!html) return false;

  const articleTags = [
    /<table\b/i,
    /<h[1-6]\b/i,
    /<p\b/i,
    /<ul\b/i,
    /<ol\b/i,
    /<blockquote\b/i,
    /<figure\b/i,
    /<section\b/i,
    /<article\b/i,
  ];

  const matches = articleTags.filter((pattern) =>
    pattern.test(html)
  ).length;

  return matches >= 2 || /<table\b/i.test(html);
}

function cleanArticleHtml(code: string): string {
  return code
    // Never allow executable JavaScript from migrated article HTML.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<img\b(?![^>]*\sloading\s*=)/gi, '<img loading="lazy" decoding="async"');
}

/*
 * Single decision point for ALL html coming from Payload
 * (Lexical code node, Code block, htmlContent block).
 */
function HtmlBlock({
  code,
  title = "HTML preview",
}: {
  code: string;
  title?: string;
}) {
  if (!code.trim()) return null;

  // 1. Real FAQ markup -> native accordion
  if (FAQ_RE.test(code)) {
    const faqs = extractFaqs(code);
    if (faqs.length > 0) {
      return <FaqAccordion faqs={faqs} />;
    }
  }

  // 2. Legacy widgets -> inline (site CSS + delegated listener handle them)
  if (isLegacyWidget(code)) {
    return (
      <div
        className="post-html-content"
        dangerouslySetInnerHTML={{ __html: cleanArticleHtml(code) }}
      />
    );
  }

  // 2b. Script-free data-copy / data-toggle widgets -> inline
  //     (handled by the delegated listener in ArticleRenderer)
  if (DATA_ACTION_RE.test(code) && !INTERACTIVE_RE.test(code)) {
    return (
      <div
        className="post-html-content"
        dangerouslySetInnerHTML={{ __html: cleanArticleHtml(code) }}
      />
    );
  }

  // 3. Script / inline handlers -> isolated sandboxed iframe
  if (isInteractiveHtml(code)) {
    return <SandboxedHtml html={code} title="Interactive widget" />;
  }

  // 4. Normal article HTML (tables, paragraphs...) -> inline for SEO
  if (isArticleHtml(code)) {
    return (
      <div
        className="post-html-content"
        dangerouslySetInnerHTML={{ __html: cleanArticleHtml(code) }}
      />
    );
  }

  // 5. Everything else (HTML demos) -> sandboxed iframe
  return <SandboxedHtml html={code} title={title} />;
}

function isInlineArticleTocList(node: any): boolean {
  if (!node || node.type !== "list") return false;

  const items = Array.isArray(node.children) ? node.children : [];
  if (!items.length) return false;

  let linkedItems = 0;
  let totalItems = 0;

  for (const item of items) {
    if (!item || !Array.isArray(item.children)) continue;
    totalItems += 1;

    const hasInternalAnchor = item.children.some((child: any) => {
      const href = child?.fields?.url || child?.url || "";
      return child?.type === "link" && typeof href === "string" && href.startsWith("#");
    });

    if (hasInternalAnchor) linkedItems += 1;
  }

  return totalItems > 0 && linkedItems === totalItems;
}

function RenderNode({
  node,
  index,
  headingIds,
}: {
  node: any;
  index: number;
  headingIds?: Map<any, string>;
}) {
  if (!node) return null;

  const type = node.type;

  /* ---------------------------------------------------------------------- */
  /* Inline nodes                                                            */
  /* ---------------------------------------------------------------------- */

  if (type === "text" || type === "link") {
    return <InlineText node={node} />;
  }

  /* ---------------------------------------------------------------------- */
  /* Paragraph                                                               */
  /* ---------------------------------------------------------------------- */

  if (type === "paragraph") {
    const children = Array.isArray(node.children)
      ? node.children
      : [];

    const text = textFromNodes(children).trim();

    if (!text && !children.some(isBlockNode)) {
      return null;
    }

    if (/^📋\s*Copied!/i.test(text)) {
      return null;
    }

    if (/^Table of Contents/i.test(text)) {
      return null;
    }

    if (paragraphContainsBlockNode(children)) {
      return (
        <>
          {children.map((child: any, i: number) => (
            <RenderNode
              key={`${index}-${i}`}
              node={child}
              index={i}
              headingIds={headingIds}
            />
          ))}
        </>
      );
    }

    const format = node.format;
    const isFaqQuestion = node.__faqQuestion === true;

    return (
      <p
        className={`post-p${isFaqQuestion ? " post-faq-question" : ""}`}
        style={
          format && format !== ""
            ? { textAlign: format as any }
            : undefined
        }
      >
        {children.map((child: any, i: number) => (
          <RenderNode
            key={`${index}-${i}`}
            node={child}
            index={i}
            headingIds={headingIds}
          />
        ))}
      </p>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Heading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (type === "heading") {
    const text = textFromNodes(
      node.children || []
    ).trim();

    if (!text) return null;

    const id =
      headingIds?.get(node) ||
      slugify(text) ||
      "section";

    const tag =
      ["h1", "h2", "h3", "h4", "h5", "h6"].includes(
        node.tag
      )
        ? node.tag
        : "h2";

    const Tag = tag === "h1" ? "h2" : tag;

    return (
      <Tag
        id={id}
        className={`post-${Tag}`}
      >
        {(node.children || []).map(
          (child: any, i: number) => (
            <RenderNode
              key={i}
              node={child}
              index={i}
              headingIds={headingIds}
            />
          )
        )}
      </Tag>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Lists                                                                   */
  /* ---------------------------------------------------------------------- */

  if (type === "list") {
    const Tag =
      node.listType === "number" ||
        node.tag === "ol"
        ? "ol"
        : "ul";

    const items = node.children || [];

    const isToc = isInlineArticleTocList(node);

    return (
      <Tag className={`post-list${isToc ? " post-inline-toc" : ""}`}>
        {items.map(
          (item: any, i: number) => (
            <li key={i}>
              {(item.children || []).map(
                (child: any, j: number) => (
                  <RenderNode
                    key={j}
                    node={child}
                    index={j}
                    headingIds={headingIds}
                  />
                )
              )}
            </li>
          )
        )}
      </Tag>
    );
  }

  if (
    type === "listitem" ||
    type === "list-item"
  ) {
    return (
      <li>
        {(node.children || []).map(
          (child: any, i: number) => (
            <RenderNode
              key={i}
              node={child}
              index={i}
              headingIds={headingIds}
            />
          )
        )}
      </li>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Images / uploads                                                        */
  /* ---------------------------------------------------------------------- */

  if (
    type === "upload" ||
    type === "image"
  ) {
    const media = getMedia(
      node.value ||
      node.fields?.media ||
      node.fields?.value ||
      node.media ||
      node.fields?.image ||
      node.image
    );

    const url = mediaUrl(media);

    if (!url) return null;

    return (
      <figure className="post-figure">
        <div className="post-image-frame">
          <SmartImage
            src={url}
            alt={
              media?.alt ||
              media?.title ||
              "AlloyPress article image"
            }
            width={media?.width || 1200}
            height={media?.height || 800}
            sizes="(max-width: 820px) 100vw, 720px"
          />
        </div>

        {media?.caption ? (
          <figcaption
            dangerouslySetInnerHTML={{
              __html: cleanArticleHtml(String(media.caption)),
            }}
          />
        ) : null}
      </figure>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Quote                                                                   */
  /* ---------------------------------------------------------------------- */

  if (
    type === "quote" ||
    type === "blockquote"
  ) {
    return (
      <blockquote className="post-quote">
        {(node.children || []).map(
          (child: any, i: number) => (
            <RenderNode
              key={i}
              node={child}
              index={i}
              headingIds={headingIds}
            />
          )
        )}
      </blockquote>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Executable Code (native Lexical code node)                              */
  /* ---------------------------------------------------------------------- */

  if (
    type === "code" ||
    type === "codeBlock"
  ) {
    const fields = node.fields || node;

    const code =
      typeof fields.code === "string"
        ? fields.code
        : textFromNodes(node.children || []);

    const language = String(
      fields.language ||
      node.language ||
      fields.lang ||
      node.lang ||
      "plaintext"
    ).toLowerCase();

    if (!code.trim()) {
      return null;
    }

    const normalizedLanguage =
      language === "html5"
        ? "html"
        : language === "htmlmixed"
          ? "html"
          : language === "javascript"
            ? "js"
            : language === "ecmascript"
              ? "js"
              : language === "typescript"
                ? "ts"
                : language;

    if (normalizedLanguage === "html") {
      return <HtmlBlock code={code} />;
    }

    if (normalizedLanguage === "css") {
      return <SandboxedHtml html={cssPreviewHtml(code)} title="CSS preview" />;
    }

    if (normalizedLanguage === "js") {
      return (
        <SandboxedHtml html={jsPreviewHtml(code)} title="JavaScript preview" />
      );
    }

    return (
      <div className="post-code">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Table                                                                   */
  /* ---------------------------------------------------------------------- */

  if (type === "table") {
    const rows = Array.isArray(node.children) ? node.children : [];
    const columnCount = rows.reduce(
      (max: number, row: any) =>
        Math.max(max, Array.isArray(row?.children) ? row.children.length : 0),
      0
    );

    return (
      <div className="table-scroll">
        <table className="post-table">
          {columnCount > 0 ? (
            <colgroup>
              <col className="table-label-col" />
              {Array.from({ length: Math.max(columnCount - 1, 0) }).map((_, i) => (
                <col key={i} />
              ))}
            </colgroup>
          ) : null}
          <tbody>
            {rows.map(
              (row: any, r: number) => (
                <tr key={r}>
                  {(row.children || []).map(
                    (cell: any, c: number) => {
                      const Cell =
                        cell.headerState || r === 0
                          ? "th"
                          : "td";

                      return (
                        <Cell
                          key={c}
                          className={`${cell.headerState ? "table-head" : ""}${c === 0 ? " table-label-cell" : ""}`.trim()}
                        >
                          {(cell.children || []).map(
                            (
                              child: any,
                              i: number
                            ) => (
                              <RenderNode
                                key={i}
                                node={child}
                                index={i}
                                headingIds={headingIds}
                              />
                            )
                          )}
                        </Cell>
                      );
                    }
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Horizontal rule                                                         */
  /* ---------------------------------------------------------------------- */

  if (
    type === "horizontalrule" ||
    type === "horizontalRule" ||
    type === "hr"
  ) {
    return (
      <hr className="post-rule" />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Line break                                                              */
  /* ---------------------------------------------------------------------- */

  if (
    type === "linebreak" ||
    type === "lineBreak"
  ) {
    return <br />;
  }

  /* ---------------------------------------------------------------------- */
  /* Custom blocks                                                           */
  /* ---------------------------------------------------------------------- */

  if (type === "block") {
    const fields = node.fields || {};
    const blockType =
      fields.blockType ||
      node.blockType;

    if (blockType === "htmlContent") {
      const html =
        typeof fields.html === "string"
          ? fields.html
          : "";

      if (!html.trim()) {
        return null;
      }

      return <HtmlBlock code={html} title="HTML content" />;
    }

    /* Styled box */
    if (blockType === "styledBox") {
      const heading =
        fields.heading || "";

      const body =
        fields.text || "";

      return (
        <aside className="styled-box">
          {heading ? (
            <div className="styled-box-label">
              {heading}
            </div>
          ) : null}

          {body ? (
            <div className="styled-box-body">
              {body}
            </div>
          ) : null}
        </aside>
      );
    }

    /* FAQ block */
    if (blockType === "faq") {
      const items = Array.isArray(fields.items) ? fields.items : [];

      const faqs = items
        .map((it: any) => ({
          q: String(it?.question || "").trim(),
          a: String(it?.answer || "").trim(),
        }))
        .filter((f: { q: string; a: string }) => f.q && f.a);

      if (!faqs.length) return null;

      return <FaqAccordion faqs={faqs} />;
    }

    /* Raw code / HTML / CSS / JS block
       (Payload's built-in CodeBlock saves blockType as "Code") */
    if (String(blockType).toLowerCase() === "code") {
      const code =
        typeof fields.code === "string"
          ? fields.code
          : typeof node.code === "string"
            ? node.code
            : textFromNodes(node.children || []);

      const rawLanguage =
        fields.language ||
        node.language ||
        fields.lang ||
        node.lang ||
        "plaintext";

      const language = String(rawLanguage)
        .toLowerCase()
        .trim();

      if (!code.trim()) {
        return null;
      }

      /* HTML */
      if (
        language === "html" ||
        language === "html5" ||
        language === "htmlmixed"
      ) {
        return <HtmlBlock code={code} />;
      }

      /* CSS */
      if (language === "css") {
        return (
          <SandboxedHtml html={cssPreviewHtml(code)} title="CSS preview" />
        );
      }

      /* JavaScript */
      if (
        language === "js" ||
        language === "javascript" ||
        language === "ecmascript"
      ) {
        return (
          <SandboxedHtml
            html={jsPreviewHtml(code)}
            title="JavaScript preview"
          />
        );
      }

      /* Other languages -> normal code display */
      return (
        <div className="post-code">
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    /* CTA */
    if (blockType === "ctaButton") {
      const href = fields.url || "#";

      const external = /^https?:\/\//i.test(href);

      const alignment =
        fields.alignment === "center"
          ? "center"
          : fields.alignment === "right"
            ? "flex-end"
            : "flex-start";

      return (
        <div
          className="cta-wrap"
          style={{
            display: "flex",
            justifyContent: alignment,
            width: "100%",
          }}
        >
          <a
            href={href}
            className="article-cta"
            target={fields.openInNewTab || external ? "_blank" : undefined}
            rel={fields.openInNewTab || external ? "noopener noreferrer" : undefined}
            style={{
              background: fields.backgroundColor,
              color: fields.textColor,
              borderColor: fields.borderColor,
              borderWidth: fields.borderWidth,
              borderStyle: fields.borderStyle,
              borderRadius: fields.borderRadius,
              fontSize: fields.fontSize,
              fontWeight: fields.fontWeight,
              fontStyle: fields.italic ? "italic" : undefined,
              textDecoration: fields.underline ? "underline" : undefined,
              textTransform: fields.textTransform,
              letterSpacing: fields.letterSpacing,
              padding: fields.padding,
              minWidth: fields.minWidth,
              ["--cta-hover-bg" as any]: fields.hoverBackgroundColor,
              ["--cta-hover-color" as any]: fields.hoverTextColor,
            }}
          >
            {fields.label || "Try this tool →"}
          </a>
        </div>
      );
    }

    /* YouTube / video embed */
    if (blockType === "videoEmbed") {
      const url =
        typeof fields.url === "string"
          ? fields.url.trim()
          : "";

      if (!url) return null;

      const title =
        fields.caption ||
        "AlloyPress article video";

      return (
        <figure className="post-video">
          <div className="post-video-frame">
            <LiteYouTubeEmbed
              url={url}
              title={title}
            />
          </div>

          {fields.caption ? (
            <figcaption>
              {fields.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    /* Uploaded video */
    if (blockType === "videoFile") {
      const media = getMedia(fields.video);

      const url = mediaUrl(media);

      if (!url) return null;

      return (
        <figure className="post-video">
          <div className="post-video-frame">
            <video
              controls
              preload="metadata"
              playsInline
              src={url}
            >
              Your browser does not support
              the video element.
            </video>
          </div>

          {fields.caption ? (
            <figcaption>
              {fields.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    /* Audio */
    if (blockType === "audio") {
      const media = getMedia(fields.audio);

      const url = mediaUrl(media);

      if (!url) return null;

      return (
        <figure className="post-audio">
          {fields.title ? (
            <div className="post-audio-title">
              {fields.title}
            </div>
          ) : null}

          <audio
            controls
            preload="none"
            src={url}
          >
            Your browser does not support
            the audio element.
          </audio>

          {fields.caption ? (
            <figcaption>
              {fields.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    /*
     * Future/custom blocks:
     * keep their children instead of silently
     * deleting article content.
     */
    if (Array.isArray(node.children)) {
      return (
        <div className="unknown-block">
          {node.children.map(
            (child: any, i: number) => (
              <RenderNode
                key={i}
                node={child}
                index={i}
                headingIds={headingIds}
              />
            )
          )}
        </div>
      );
    }

    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Generic children                                                        */
  /* ---------------------------------------------------------------------- */

  if (Array.isArray(node.children)) {
    return (
      <>
        {node.children.map(
          (child: any, i: number) => (
            <RenderNode
              key={i}
              node={child}
              index={i}
              headingIds={headingIds}
            />
          )
        )}
      </>
    );
  }

  return null;
}


function normalizeArticleContent(nodes: any[] = []): any[] {
  const normalized: any[] = [];
  let inFaqSection = false;

  nodes.forEach((node: any) => {
    if (!node || typeof node !== "object") return;

    if (
      node.type === "paragraph" &&
      (!Array.isArray(node.children) || node.children.length === 0)
    ) {
      return;
    }

    if (node.type === "paragraph") {
      const inlineChildren: any[] = [];
      const paragraphText = textFromNodes(node.children || []).trim();
      const faqQuestion = inFaqSection && /\?\s*$/.test(paragraphText);

      (node.children || []).forEach((child: any) => {
        if (isBlockNode(child)) {
          if (inlineChildren.length) {
            normalized.push({
              ...node,
              ...(faqQuestion ? { __faqQuestion: true } : {}),
              children: [...inlineChildren],
            });
            inlineChildren.length = 0;
          }

          normalized.push(child);
        } else {
          inlineChildren.push(child);
        }
      });

      if (inlineChildren.length) {
        normalized.push({
          ...node,
          ...(faqQuestion ? { __faqQuestion: true } : {}),
          children: inlineChildren,
        });
      }

      return;
    }

    if (node.type === "heading") {
      const headingText = textFromNodes(node.children || []).trim();
      const headingTag = node.tag || "h2";

      if (/^h[1-6]$/i.test(headingTag)) {
        if (/frequently asked questions|^faq$/i.test(headingText)) {
          inFaqSection = true;
        } else if (headingTag.toLowerCase() === "h2") {
          inFaqSection = false;
        }
      }
    }

    if (Array.isArray(node.children)) {
      normalized.push({
        ...node,
        children: node.children.filter(
          (child: any) => child && typeof child === "object"
        ),
      });
      return;
    }

    normalized.push(node);
  });

  return normalized;
}

/* -------------------------------------------------------------------------- */
/* Article renderer                                                           */
/* -------------------------------------------------------------------------- */

function ArticleRenderer({
  content,
  headingIds,
}: {
  content: any;
  headingIds: Map<any, string>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const children = normalizeArticleContent(content?.root?.children || []);


  const h2Indexes = children.flatMap((node: any, index: number) => {
    const tag = String(node?.tag || "h2").toLowerCase();

    return node?.type === "heading" && tag === "h2"
      ? [index]
      : [];
  });

  const adIndexes = [
    h2Indexes[Math.floor(h2Indexes.length / 3)],
    h2Indexes[Math.floor((h2Indexes.length * 2) / 3)],
  ].filter(
    (index, position, indexes) =>
      index !== undefined && indexes.indexOf(index) === position
  );


  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      /* ============================================================
       * Generic script-free copy button: data-copy / data-copy-target
       *
       *   <div data-copy-scope>
       *     <pre class="x">text...</pre>
       *     <button data-copy-target=".x">Copy</button>
       *   </div>
       *
       *   <button data-copy="literal text">Copy</button>
       *
       * The old reference gallery keeps its own handler below.
       * ============================================================ */
      const dataCopyTrigger = target.closest<HTMLElement>(
        "[data-copy], [data-copy-target]"
      );

      if (
        dataCopyTrigger &&
        root.contains(dataCopyTrigger) &&
        !dataCopyTrigger.closest(".apx-reference-gallery")
      ) {
        let text = dataCopyTrigger.dataset.copy ?? "";
        const selector = dataCopyTrigger.dataset.copyTarget;

        if (!text && selector) {
          try {
            const scope =
              dataCopyTrigger.closest<HTMLElement>("[data-copy-scope]") ||
              root;

            const el = scope.querySelector<HTMLElement>(selector);

            text =
              el instanceof HTMLTextAreaElement
                ? el.value
                : el?.textContent || "";
          } catch {
            text = "";
          }
        }

        text = text.trim();

        if (!text) return;

        const ok = await copyText(text);

        const original =
          dataCopyTrigger.dataset.label ??
          dataCopyTrigger.textContent ??
          "Copy";

        dataCopyTrigger.dataset.label = original;
        dataCopyTrigger.textContent = ok ? "Copied!" : "Copy failed";

        window.setTimeout(() => {
          dataCopyTrigger.textContent = original;
        }, 1600);

        return;
      }

      /* ============================================================
       * Generic script-free toggle: data-toggle="<css selector>"
       *
       *   <button data-toggle="#more">Show more</button>
       *   <div id="more" hidden>...</div>
       * ============================================================ */
      const dataToggleTrigger = target.closest<HTMLElement>("[data-toggle]");

      if (dataToggleTrigger && root.contains(dataToggleTrigger)) {
        try {
          const scope =
            dataToggleTrigger.closest<HTMLElement>("[data-copy-scope]") ||
            root;

          const el = scope.querySelector<HTMLElement>(
            dataToggleTrigger.dataset.toggle || ""
          );

          if (el) {
            el.hidden = !el.hidden;
            dataToggleTrigger.setAttribute(
              "aria-expanded",
              String(!el.hidden)
            );
          }
        } catch {
          // Invalid selector from editor content: ignore.
        }

        return;
      }

      /* ============================================================
       * Prompt Challenge widget
       * ============================================================ */
      const promptChallenge = target.closest<HTMLElement>(
        ".apx-prompt-challenge"
      );

      if (promptChallenge && root.contains(promptChallenge)) {
        const promptButton = target.closest<HTMLButtonElement>(
          ".apx-pc-btn"
        );

        if (promptButton && promptChallenge.contains(promptButton)) {
          const isBetter = promptButton.textContent
            ?.toLowerCase()
            .includes("refined");

          const promptBox = target.closest<HTMLElement>(".prompt-box");

          if (promptBox && root.contains(promptBox)) {
            const toggleButton = target.closest<HTMLButtonElement>(".toggle-btn");

            if (toggleButton && promptBox.contains(toggleButton)) {
              const promptContent =
                promptBox.querySelector<HTMLElement>(".prompt-content");

              if (!promptContent) return;

              const isOpen = !promptContent.hidden;

              promptContent.hidden = isOpen;

              promptBox.classList.toggle("is-open", !isOpen);
              toggleButton.classList.toggle("active", !isOpen);

              toggleButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
              );

              return;
            }
          }

          const panelName = isBetter ? "better" : "first";

          promptChallenge
            .querySelectorAll<HTMLElement>(".apx-pc-panel")
            .forEach((panel) => {
              panel.classList.toggle(
                "active",
                panel.id === `apx-pc-${panelName}`
              );
            });

          promptChallenge
            .querySelectorAll<HTMLButtonElement>(".apx-pc-btn")
            .forEach((button) => {
              button.classList.toggle(
                "active",
                button === promptButton
              );
            });

          return;
        }
      }
      /*
       * ============================================================
       * 1. Generic HTML article widgets (legacy, class-based)
       * ============================================================
       */
      const bikeWidget = target.closest<HTMLElement>(".apx-bike-widget");

      if (bikeWidget && root.contains(bikeWidget)) {
        /* Image / Prompt tabs */
        const bikeTab = target.closest<HTMLButtonElement>(
          ".apx-bike-tab-btn"
        );

        if (bikeTab && bikeWidget.contains(bikeTab)) {
          const name = bikeTab.textContent?.toLowerCase().includes("prompt")
            ? "prompt"
            : "image";

          bikeWidget
            .querySelectorAll<HTMLElement>(".apx-bike-panel")
            .forEach((panel) => {
              panel.classList.toggle(
                "active",
                panel.dataset.apxBikePanel === name
              );
            });

          bikeWidget
            .querySelectorAll<HTMLButtonElement>(".apx-bike-tab-btn")
            .forEach((button) => {
              button.classList.toggle("active", button === bikeTab);
            });

          return;
        }

        /* Copy Prompt */
        const bikeCopyBtn = target.closest<HTMLButtonElement>(
          ".apx-bike-copy-btn"
        );

        if (bikeCopyBtn && bikeWidget.contains(bikeCopyBtn)) {
          const promptBox = bikeWidget.querySelector<HTMLElement>(
            ".apx-bike-prompt-box"
          );

          const text = promptBox?.textContent?.trim() || "";

          if (!text) {
            console.warn(
              "[AlloyPress] Copy Prompt: prompt text not found."
            );
            return;
          }

          const copied = await copyText(text);

          if (!copied) {
            bikeCopyBtn.innerHTML = "⚠️ Copy Failed";
            window.setTimeout(() => {
              bikeCopyBtn.innerHTML = "📋 Copy Prompt";
            }, 1800);
            return;
          }

          bikeCopyBtn.innerHTML = "✓ Copied!";
          bikeCopyBtn.classList.add("copied");

          window.setTimeout(() => {
            bikeCopyBtn.innerHTML = "📋 Copy Prompt";
            bikeCopyBtn.classList.remove("copied");
          }, 1800);

          return;
        }
      }
      const promptBox = target.closest<HTMLElement>(".prompt-box");

      if (promptBox && root.contains(promptBox)) {
        const toggleBtn = target.closest<HTMLButtonElement>(".toggle-btn");

        if (toggleBtn && promptBox.contains(toggleBtn)) {
          const isOpen = promptBox.classList.toggle("open");

          toggleBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
          );

          return;
        }

        const copyBtn = target.closest<HTMLButtonElement>(".copy-btn");

        if (copyBtn && promptBox.contains(copyBtn)) {
          const promptContent =
            promptBox.querySelector<HTMLElement>(".prompt-content");

          const text = promptContent?.textContent?.trim() || "";

          if (!text) return;

          const copied = await copyText(text);

          if (copied) {
            const originalText = copyBtn.textContent || "Copy";

            copyBtn.textContent = "Copied!";

            window.setTimeout(() => {
              copyBtn.textContent = originalText;
            }, 1500);
          }

          return;
        }
      }
      /*
       * ============================================================
       * 2. Existing reference gallery functionality
       * ============================================================
       */
      const gallery = target.closest<HTMLElement>(".apx-reference-gallery");
      if (!gallery || !root.contains(gallery)) return;

      /* Prompt toggle */
      const toggle = target.closest<HTMLElement>(".apx-prompt-toggle");
      if (toggle) {
        const isActive = toggle.classList.toggle("active");
        const panel = gallery.querySelector<HTMLElement>(
          ".apx-prompt-panel, .apx-prompt-box, .apx-prompt-content"
        );
        if (panel) {
          panel.classList.toggle("active", isActive);
          panel.classList.toggle("open", isActive);
          panel.style.display = isActive ? "block" : "none";
        }
        return;
      }

      /* 2. Copy button */
      const copyBtn = target.closest<HTMLElement>("[class*='copy'], [data-copy]");
      if (copyBtn && gallery.contains(copyBtn)) {
        const promptEl = gallery.querySelector<HTMLElement>(
          "[class*='prompt-text'], [class*='prompt-content'], pre, textarea"
        );
        const text = (
          copyBtn.dataset.copy ??
          (promptEl as HTMLTextAreaElement)?.value ??
          promptEl?.textContent ??
          ""
        ).trim();
        if (!text) return;

        const copied = await copyText(text);
        if (!copied) {
          copyBtn.textContent = "Copy failed";
          window.setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1500);
          return;
        }

        const original = copyBtn.textContent;
        copyBtn.textContent = "Copied ✓";
        window.setTimeout(() => (copyBtn.textContent = original), 1500);
        return;
      }

      /* 3. Thumbnails */
      const thumb = target.closest<HTMLElement>("[class*='thumb']");
      if (thumb) {
        const thumbImg = thumb.querySelector("img");
        const mainImg = gallery.querySelector<HTMLImageElement>(".apx-ref-main img");
        if (thumbImg && mainImg) {
          mainImg.src = thumbImg.src;
          mainImg.alt = thumbImg.alt;
          gallery
            .querySelectorAll("[class*='thumb']")
            .forEach((t) => t.classList.remove("active"));
          thumb.classList.add("active");
        }
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);


  return (
    <div className="post-content" ref={rootRef}>
      {children.map((node: any, i: number) => (
        <Fragment key={i}>
          {adIndexes.includes(i) && (
            <AdSenseInArticle
              slot={
                adIndexes.indexOf(i) === 0
                  ? process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_1 || ""
                  : process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_2 || ""
              }
            />
          )}

          <RenderNode
            node={node}
            index={i}
            headingIds={headingIds}
          />
        </Fragment>
      ))}
    </div>
  );

}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function BlogPostView({
  post,
  related,
  articleImage,
  category = "blogs",
  categoryLabel = "Blogs"
}: Props) {
  const [aiOpen, setAiOpen] =
    useState(false);

  const [shareOpen, setShareOpen] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [badgeCopied, setBadgeCopied] = useState(false);

  const [articleUrl, setArticleUrl] =
    useState("");

  const AI_ENABLED = false;

  const [tocOpen, setTocOpen] = useState(false);
  const [desktopTocOpen, setDesktopTocOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setArticleUrl(window.location.href);
  }, []);
  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    return () => {
      window.history.scrollRestoration =
        previousScrollRestoration;
    };
  }, [post?.slug]);
  useEffect(() => {
    if (!shareOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shareOpen]);

  useEffect(() => {
    if (!tocOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTocOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tocOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 821px)");

    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  const nodes =
    post?.content?.root?.children || [];

  const headingIndex = useMemo(
    () => buildHeadingIndex(nodes),
    [nodes]
  );

  const headings = headingIndex.headings;
  const headingIds = headingIndex.idsByNode;

  const excerpt = useMemo(
    () =>
      cleanEditorialText(
        post?.meta?.description ||
        post?.excerpt
      ),
    [post?.meta?.description, post?.excerpt]
  );

  const summary = useMemo(
    () =>
      cleanEditorialText(
        extractSummary(nodes, excerpt)
      ),
    [nodes, excerpt]
  );

  const readingTime = useMemo(() => {
    const articleText = textFromNodes(nodes).trim();

    if (!articleText) {
      return 1;
    }

    const wordCount = articleText
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(wordCount / 200));
  }, [nodes]);

  const categoryName =
    typeof post?.category === "object"
      ? post.category?.name ||
      "Article"
      : "Article";

  const date = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "";

  const rawUpdatedAt =
    post?.legacy?.wordpressModifiedAt || post?.updatedAt;

  const updatedDate = rawUpdatedAt
    ? new Date(rawUpdatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "";

  // Only show "Updated" if it's meaningfully after publish (avoid showing
  // "Updated" for the same-day migration/save that created the post).
  const showUpdatedDate =
    Boolean(post?.publishedAt) &&
    Boolean(rawUpdatedAt) &&
    new Date(rawUpdatedAt).getTime() -
    new Date(post.publishedAt).getTime() >
    24 * 60 * 60 * 1000;

  function openShareWindow(url: string) {
    const shareWindow = window.open(
      url,
      "alloypress-share",
      "noopener,noreferrer,width=720,height=640,resizable=yes,scrollbars=yes"
    );

    if (shareWindow) {
      shareWindow.opener = null;
    }

    setShareOpen(false);
  }

  const badgeArticleUrl =
    articleUrl ||
    `https://alloypress.com/${category}/${post?.slug || ""}`;

  const badgeToolName =
    typeof post?.title === "string" && post.title.trim()
      ? post.title.trim()
      : "This tool";

  // Plain HTML snippet that works on ANY publisher website
  // (the previous version copied JSX, which does not work outside React).
  const badgeEmbedCode = `<a href="${badgeArticleUrl}" target="_blank" rel="noopener noreferrer" aria-label="Featured on AlloyPress — ${badgeToolName}">
  <img src="https://alloypress.com/badges/featured.svg" alt="Featured on AlloyPress" width="320" height="117" style="max-width:100%;height:auto;" />
</a>`

  async function copyBadgeEmbedCode() {
    const ok = await copyText(badgeEmbedCode);

    setBadgeCopied(ok);

    if (ok) {
      window.setTimeout(() => {
        setBadgeCopied(false);
      }, 1800);
    }
  }

  async function copyArticleLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      setShareOpen(false);
    } catch {
      setCopied(false);
    }
  }

  function shareOnWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnX() {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnReddit() {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnPinterest() {
    const url = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function toggleToc() {
    if (window.matchMedia("(min-width: 821px)").matches) {
      setDesktopTocOpen((value) => !value);
      return;
    }

    setTocOpen((value) => !value);
  }

  function handleTocKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleToc();
    }
  }

  return (
    <>

      <main className="single-post">
        {/* ---------------------------------------------------------------- */}
        {/* Editorial hero                                                   */}
        {/* ---------------------------------------------------------------- */}
        <nav className="post-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="post-breadcrumb-sep">/</span>
          <a href={`/${category}`}>{categoryLabel}</a>
          <span className="post-breadcrumb-sep">/</span>
          <span className="post-breadcrumb-current">{post?.title}</span>
        </nav>
        <header className="post-hero">
          <div className="post-shell">
            <div className="post-hero-inner">

              <div className="post-hero-grid">

                {/* LEFT — editorial content */}
                <div className="post-hero-copy">

                  <div className="post-hero-badges">
                    <span className="post-hero-badge post-hero-badge-primary">
                      {categoryLabel}
                    </span>

                    {Array.isArray(post?.tags) &&
                      post.tags.length > 0 ? (
                      <span className="post-hero-badge">
                        {typeof post.tags[0] === "string"
                          ? post.tags[0]
                          : post.tags[0]?.name ||
                          post.tags[0]?.slug ||
                          "AI TOOLS"}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="post-title">
                    {post?.title}
                  </h1>

                  {excerpt ? (
                    <p className="post-excerpt">
                      {excerpt}
                    </p>
                  ) : null}

                  <div className="post-meta-row">

                    <Link
                      href="/author/alloypress"
                      className="post-author-link"
                    >
                      <span className="author-dot">
                        <Image
                          src="/ap-icons.png"
                          alt="AlloyPress"
                          width={32}
                          height={32}
                        />
                      </span>

                      <span>By AlloyPress Team</span>
                    </Link>

                    <span className="post-meta-divider" aria-hidden="true" />

                    {date ? (
                      <span className="post-meta-item">
                        <CalendarDays
                          aria-hidden="true"
                        />
                        {showUpdatedDate
                          ? `Updated ${updatedDate}`
                          : `Published ${date}`}
                      </span>
                    ) : null}

                    <span
                      className="post-meta-divider"
                      aria-hidden="true"
                    />

                    <span className="post-meta-item">
                      <Clock3 aria-hidden="true" />
                      {readingTime} min read
                    </span>

                  </div>
                </div>

                {/* RIGHT — featured image */}
                {articleImage ? (
                  <figure className="hero-image">
                    <SmartImage
                      src={articleImage}
                      alt={
                        post?.featuredImage?.alt ||
                        post?.title ||
                        "AlloyPress article image"
                      }
                      width={post?.featuredImage?.width || 1536}
                      height={post?.featuredImage?.height || 1024}
                      sizes="(max-width: 820px) 100vw, (max-width: 1100px) 45vw, 600px"
                      preload
                    />
                  </figure>
                ) : null}

              </div>
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Reading toolbar (mobile/tablet): Contents | Share | Back to Top  */}
        {/* Sits directly below the hero. Hidden on desktop via CSS.         */}
        {/* ---------------------------------------------------------------- */}
        <nav
          className="single-post-reading-toolbar"
          aria-label="Article navigation tools"
        >
          <div className="post-shell reading-toolbar-inner">
            <button
              type="button"
              className="reading-toolbar-button"
              aria-haspopup="dialog"
              aria-expanded={tocOpen}
              aria-controls="mobile-article-toc"
              onClick={() => setTocOpen(true)}
            >
              <FileText aria-hidden="true" />
              <span>TOC</span>
              <ChevronDown
                className="reading-toolbar-chevron"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className="reading-toolbar-button"
              aria-haspopup="dialog"
              aria-expanded={shareOpen}
              onClick={() => setShareOpen(true)}
            >
              <Share2 aria-hidden="true" />
              <span>Share</span>
              <ChevronDown
                className="reading-toolbar-chevron"
                aria-hidden="true"
              />
            </button>

            <BackToTop variant="toolbar" />
          </div>
        </nav>


        {/* ---------------------------------------------------------------- */}
        {/* Main three-column reading workspace                               */}
        {/* ---------------------------------------------------------------- */}

        <div className="post-shell">
          <div className="post-layout">
            {tocOpen ? (
              <div
                className="mobile-toc-backdrop"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.currentTarget === event.target) {
                    setTocOpen(false);
                  }
                }}
              >
                <div
                  id="mobile-article-toc"
                  className="mobile-toc-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mobile-toc-title"
                >
                  <div className="mobile-toc-header">
                    <div>
                      <div className="mobile-toc-kicker">Article navigation</div>
                      <h2 id="mobile-toc-title">Table of Contents</h2>
                    </div>

                    <button
                      type="button"
                      className="mobile-toc-close"
                      aria-label="Close table of contents"
                      onClick={() => setTocOpen(false)}
                    >
                      <LucideX aria-hidden="true" />
                    </button>
                  </div>

                  {headings.length ? (
                    <nav
                      className="mobile-toc-list"
                      aria-label="Article sections"
                    >
                      {headings.map((item, i) => (
                        <a
                          key={`${item.id}-${i}`}
                          href={`#${item.id}`}
                          className="mobile-toc-link"
                          onClick={() => setTocOpen(false)}
                        >
                          <span className="mobile-toc-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          <span className="mobile-toc-text">
                            {item.text}
                          </span>
                        </a>
                      ))}
                    </nav>
                  ) : (
                    <div className="mobile-toc-empty">
                      Article sections will appear here.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            {/* Left: compact sticky TOC */}
            <aside
              className={`toc${tocOpen ? " mobile-open" : ""
                }${desktopTocOpen ? "" : " desktop-toc-collapsed"
                }`}
              data-open={tocOpen}
              aria-label="Table of contents"
            >
              <div className="toc-card">
                <button
                  type="button"
                  className="toc-header"
                  aria-expanded={isDesktop ? desktopTocOpen : tocOpen}
                  aria-controls="article-toc-list"
                  onClick={toggleToc}
                  onKeyDown={handleTocKeyDown}
                >
                  <span>Table of Contents</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={
                      (isDesktop ? desktopTocOpen : tocOpen)
                        ? "toc-chevron-open"
                        : ""
                    }
                  />
                </button>

                {headings.length ? (
                  <nav
                    id="article-toc-list"
                    className="toc-list"
                    aria-label="Article sections"
                  >
                    {headings.map((item, i) => (
                      <a
                        key={`${item.id}-${i}`}
                        href={`#${item.id}`}
                        className="toc-link"
                        onClick={() => {
                          if (!isDesktop) {
                            setTocOpen(false);
                          }
                        }}
                      >
                        <span className="toc-bullet" aria-hidden="true">•</span>
                        <span>{item.text}</span>
                      </a>
                    ))}
                  </nav>
                ) : (
                  <div className="toc-empty">Article sections will appear here.</div>
                )}
              </div>
              <div className="sidebar-card alloypress-badge-card desktop-featured-badge">
                <div className="side-label">Tested by AlloyPress</div>

                <div className="alloypress-badge-copy-box">
                  <div className="alloypress-badge-preview">
                    <Image
                      src="/badges/featured.svg"
                      alt="Featured on AlloyPress"
                      width={320}
                      height={117}
                      sizes="(max-width: 820px) 200px, 170px"
                      className="alloypress-badge-image"
                    />
                  </div>

                  <button
                    type="button"
                    className="alloypress-badge-copy-button"
                    onClick={copyBadgeEmbedCode}
                    aria-label={badgeCopied ? "Badge code copied" : "Copy badge code"}
                    title={badgeCopied ? "Copied!" : "Copy badge code"}
                  >
                    {badgeCopied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>
                </div>

                <p className="alloypress-badge-text">
                  Is your tool in this article? Copy this badge to show it was independently tested by our team.
                </p>
              </div>
            </aside>
            {/* Center: article */}
            <article className="article-column">

              <ArticleRenderer
                content={post?.content}
                headingIds={headingIds}
              />

              <div className="article-end">
                <div className="side-label">Article tags</div>

                <div className="tag-row">
                  {(post?.tags || [])
                    .slice(0, 8)
                    .map((tag: any, i: number) => (
                      <span className="tag" key={i}>
                        {typeof tag === "string"
                          ? tag
                          : tag?.name ||
                          tag?.slug ||
                          "AI"}
                      </span>
                    ))}
                </div>

                {/* Mobile AlloyPress Badge */}
                <div className="mobile-alloypress-badge">
                  <div className="side-label">Tested by AlloyPress</div>

                  <div className="alloypress-badge-copy-box">
                    <div className="alloypress-badge-preview">
                      <Image
                        src="/badges/featured.svg"
                        alt="Featured on AlloyPress"
                        width={320}
                        height={117}
                        sizes="(max-width: 820px) 200px, 170px"
                        className="alloypress-badge-image"
                      />
                    </div>

                    <button
                      type="button"
                      className="alloypress-badge-copy-button"
                      onClick={copyBadgeEmbedCode}
                      aria-label={
                        badgeCopied ? "Badge code copied" : "Copy badge code"
                      }
                      title={badgeCopied ? "Copied!" : "Copy badge code"}
                    >
                      {badgeCopied ? <Check /> : <Copy />}
                    </button>
                  </div>

                  <p className="alloypress-badge-text">
                    Is your tool in this article? Copy this badge to show it was independently tested by our team.
                  </p>
                </div>
              </div>
            </article>

            {/* Right: share / ads / AI tools (desktop only; hidden on mobile via CSS) */}
            <aside
              className="article-sidebar"
              aria-label="Article tools"
            >
              <div className="sidebar-card">
                <div className="side-label">Share article</div>

                <button
                  type="button"
                  className="share-trigger"
                  aria-haspopup="dialog"
                  aria-expanded={shareOpen}
                  onClick={() => setShareOpen(true)}
                >
                  <span className="share-trigger-label">
                    <Share2 aria-hidden="true" />
                    Share
                  </span>
                </button>
              </div>

              {/* Ad directly below Share Article */}
              <AdSenseSidebar />

              {AI_ENABLED && (
                <div className="sidebar-card ai-tools-card">
                  <div className="side-label">AI tools</div>

                  <div className="ai-options">
                    <button
                      type="button"
                      className="ai-option"
                      onClick={() => setAiOpen(true)}
                    >
                      <span>Ask AI</span>
                      <Sparkles aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

            </aside>
          </div>
        </div >

        {/* ---------------------------------------------------------------- */}
        {/* Related articles                                                 */}
        {/* ---------------------------------------------------------------- */}

        {
          related?.length ? (
            <section className="related">
              <div className="post-shell">
                <div className="section-head">
                  <div>
                    <div className="side-label">Keep exploring</div>
                    <h2>Related articles</h2>
                  </div>

                  <a
                    href={`/${category}`}
                    className="related-view-all"
                  >
                    View all →
                  </a>
                </div>

                <div className="related-grid">
                  {related.map((item: any) => {
                    const relatedImage =
                      mediaUrl(item.featuredImage);

                    return (
                      <a
                        className="related-card"
                        href={`/${typeof item.category === "object" ? item.category?.slug || category : category}/${item.slug}`}
                        key={item.id}
                      >
                        {relatedImage ? (
                          <div className="related-image">
                            <SmartImage
                              src={relatedImage}
                              alt={item.title || "Related article"}
                              width={640}
                              height={360}
                              sizes="(max-width: 820px) 100vw, 400px"
                            />
                          </div>
                        ) : null}

                        <div className="related-body">
                          <div className="related-cat">
                            {typeof item.category === "object"
                              ? item.category?.name || category
                              : category}
                          </div>

                          <h3>{item.title}</h3>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null
        }

        {/* ---------------------------------------------------------------- */}
        {/* Share dialog                                                     */}
        {/* ---------------------------------------------------------------- */}

        {
          shareOpen ? (
            <div
              className="share-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setShareOpen(false);
                }
              }}
            >
              <div
                className="share-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-modal-title"
              >
                <div className="share-modal-header">
                  <div>
                    <div className="share-modal-kicker">AlloyPress</div>
                    <h3 id="share-modal-title">Share this article</h3>
                  </div>

                  <button
                    type="button"
                    className="share-modal-close"
                    aria-label="Close share dialog"
                    onClick={() => setShareOpen(false)}
                  >
                    <LucideX aria-hidden="true" />
                  </button>
                </div>

                <div className="share-modal-options">

                  <button
                    type="button"
                    className="share-option share-option-primary"
                    onClick={shareOnWhatsApp}
                  >
                    <FaWhatsapp aria-hidden="true" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="share-option"
                    onClick={shareOnLinkedIn}
                  >
                    <FaLinkedinIn aria-hidden="true" />
                    <span>LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    className="share-option"
                    onClick={shareOnX}
                  >
                    <FaXTwitter aria-hidden="true" />
                    <span>Share on X</span>
                  </button>

                  <button
                    type="button"
                    className="share-option"
                    onClick={shareOnReddit}
                  >
                    <FaRedditAlien aria-hidden="true" />
                    <span>Reddit</span>
                  </button>

                  <button
                    type="button"
                    className="share-option"
                    onClick={shareOnPinterest}
                  >
                    <FaPinterestP aria-hidden="true" />
                    <span>Pinterest</span>
                  </button>

                  <button
                    type="button"
                    className="share-option"
                    onClick={copyArticleLink}
                  >
                    {copied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}

                    <span>
                      {copied ? "Link copied" : "Copy link"}
                    </span>
                  </button>

                </div>
                <div className="share-modal-url">
                  <Link2 aria-hidden="true" />
                  <span title={articleUrl}>{articleUrl || "Article link"}</span>
                </div>
              </div>
            </div>
          ) : null
        }

        {/* ---------------------------------------------------------------- */}
        {/* AI dialog                                                         */}
        {/* ---------------------------------------------------------------- */}
        {
          aiOpen ? (
            <div
              id="alloy-ai-panel"
              className="ai-panel"
              role="dialog"
              aria-modal="false"
              aria-labelledby="alloy-ai-title"
            >
              <div className="ai-panel-header">
                <div className="ai-panel-heading">
                  <div className="ai-panel-icon" aria-hidden="true">
                    <Sparkles />
                  </div>

                  <div>
                    <h3 id="alloy-ai-title">Ask AI</h3>
                    <span>Article assistant</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="ai-close"
                  aria-label="Close Alloy AI assistant"
                  onClick={() => setAiOpen(false)}
                >
                  <LucideX aria-hidden="true" />
                </button>
              </div>

              <div className="ai-intro">
                <p>
                  Ask questions about this article and get quick,
                  easy-to-understand answers.
                </p>
              </div>

              <div className="ai-answer">
                <div className="ai-answer-label">
                  <Sparkles aria-hidden="true" />
                  <span>Quick take</span>
                </div>

                <p>{summary}</p>
              </div>

              <div className="ai-suggestions">
                <div className="ai-section-label">
                  Try asking
                </div>

                <button type="button" className="ai-suggestion">
                  What are the key takeaways?
                </button>

                <button type="button" className="ai-suggestion">
                  Which option is best?
                </button>

                <button type="button" className="ai-suggestion">
                  Give me a short summary
                </button>

                <button type="button" className="ai-suggestion">
                  Who should use this?
                </button>
              </div>

              <div className="ai-input-wrap">
                <input
                  type="text"
                  className="ai-input"
                  placeholder="Ask about this article..."
                  aria-label="Ask about this article"
                  disabled
                />

                <button
                  type="button"
                  className="ai-send"
                  aria-label="Send question"
                  disabled
                >
                  <Send aria-hidden="true" />
                </button>
              </div>

              <div className="ai-powered-note">
                <span className="ai-status-dot" />
                AI answers will be connected here.
              </div>
            </div>
          ) : null
        }
      </main >
    </>
  );
}