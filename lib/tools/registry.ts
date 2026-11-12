export type ToolCategory = "text" | "markdown" | "ai" | "file" | "image";
export type ToolStatus = "live" | "soon" | "hidden";

/** Light data only. Used by navbar, hub, sitemap and related-tools. */
export type ToolDef = {
  slug: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  phase: 1 | 2 | 3 | 4;
  status: ToolStatus;
  keyword: string;
  related: string[];
  updatedAt: string; // YYYY-MM-DD, used for sitemap lastmod
};

/**
 * SINGLE SOURCE OF TRUTH for every tool.
 * live   → page + sitemap + nav + hub card
 * soon   → hub card only ("Coming soon"), no page, not in sitemap
 * hidden → nowhere
 * Launch a tool = build app/tools/<slug>/, then flip status to "live".
 */
export const TOOLS: ToolDef[] = [
  {
    slug: "word-counter",
    name: "Word & Sentence Counter",
    shortDescription: "Words, characters, sentences, reading time and AI tokens.",
    category: "text",
    phase: 1,
    status: "live",
    keyword: "word counter",
    related: ["case-converter", "ai-text-cleaner", "ai-token-counter"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortDescription: "Title (AP, APA, Chicago), camelCase, snake_case, bold and more.",
    category: "text",
    phase: 1,
    status: "live",
    keyword: "case converter",
    related: ["word-counter", "ai-text-cleaner"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "ai-text-cleaner",
    name: "AI Text Cleaner",
    shortDescription: "Clean Markdown, hidden characters, extra breaks and dashes from AI text.",
    category: "text",
    phase: 1,
    status: "live",
    keyword: "chatgpt text cleaner",
    related: ["word-counter", "case-converter"],
    updatedAt: "2026-11-12",
  },
  {
    slug: "text-diff",
    name: "Text Compare",
    shortDescription: "See what changed between two versions of a text.",
    category: "text",
    phase: 2,
    status: "soon",
    keyword: "text compare",
    related: ["word-counter"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "markdown-viewer",
    name: "Markdown Viewer",
    shortDescription: "Open and read .md files from ChatGPT, Claude and coding agents.",
    category: "markdown",
    phase: 2,
    status: "soon",
    keyword: "markdown viewer",
    related: ["markdown-to-pdf"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    shortDescription: "Turn Markdown into a clean, styled PDF.",
    category: "markdown",
    phase: 2,
    status: "soon",
    keyword: "markdown to pdf",
    related: ["markdown-viewer"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "ai-token-counter",
    name: "AI Token Counter",
    shortDescription: "Exact GPT tokens, context fit and API cost.",
    category: "ai",
    phase: 2,
    status: "soon",
    keyword: "token counter",
    related: ["word-counter"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "claude-md-generator",
    name: "CLAUDE.md & AGENTS.md Generator",
    shortDescription: "Generate agent instruction files for Claude Code, Cursor and Codex.",
    category: "ai",
    phase: 2,
    status: "soon",
    keyword: "claude.md",
    related: [],
    updatedAt: "2026-11-10",
  },
  {
    slug: "pdf-to-markdown",
    name: "PDF to Markdown",
    shortDescription: "Convert PDFs to Markdown for ChatGPT and Claude.",
    category: "file",
    phase: 3,
    status: "soon",
    keyword: "pdf to markdown converter",
    related: ["markdown-viewer"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "photo-metadata",
    name: "Photo Metadata Viewer & Remover",
    shortDescription: "See and strip EXIF and GPS data from photos.",
    category: "image",
    phase: 3,
    status: "soon",
    keyword: "exif remover",
    related: [],
    updatedAt: "2026-11-10",
  },
  {
    slug: "background-remover",
    name: "AI Background Remover",
    shortDescription: "Remove image backgrounds in your browser.",
    category: "image",
    phase: 4,
    status: "soon",
    keyword: "background remover",
    related: ["photo-metadata"],
    updatedAt: "2026-11-10",
  },
];

export const liveTools = () => TOOLS.filter((t) => t.status === "live");
/** The /tools hub stays unlisted (no nav link, no sitemap, noindex) until this many tools are live. */
export const HUB_MIN_TOOLS = 6;
export const hubIsPublic = () => liveTools().length >= HUB_MIN_TOOLS;
export const hubTools = () => TOOLS.filter((t) => t.status !== "hidden");
export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const relatedTools = (tool: ToolDef) =>
  tool.related
    .map(getTool)
    .filter((t): t is ToolDef => !!t && t.status === "live");