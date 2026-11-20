import toolDates from "../../data/tool-dates.json";
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
const RAW_TOOLS: ToolDef[] = [
  {
    slug: "word-counter",
    name: "Word Counter",
    shortDescription: "Words, characters, sentences, reading time and AI tokens.",
    category: "text",
    phase: 1,
    status: "live",
    keyword: "word counter",
    related: ["case-converter", "ai-text-cleaner", "text-compare", "ai-token-counter"],
    updatedAt: "2026-11-10",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortDescription: "Title (AP, APA, Chicago), camelCase, snake_case and more.",
    category: "text",
    phase: 1,
    status: "live",
    keyword: "case converter",
    related: ["word-counter", "ai-text-cleaner", "text-compare"],
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
    related: ["word-counter", "case-converter", "text-compare"],
    updatedAt: "2026-11-12",
  },
  {
    slug: "text-compare",
    name: "Text Compare",
    shortDescription: "See every added, removed and changed word between two texts.",
    category: "text",
    phase: 2,
    status: "live",
    keyword: "text compare",
    related: ["word-counter", "case-converter", "ai-text-cleaner"],
    updatedAt: "2026-11-12",
  },
  {
    slug: "markdown-viewer",
    name: "Markdown Viewer",
    shortDescription: "Preview .md files and Markdown text with tables, code, diagrams and math.",
    category: "markdown",
    phase: 2,
    status: "live",
    keyword: "markdown viewer",
    related: ["ai-text-cleaner", "text-compare", "markdown-to-pdf"],
    updatedAt: "2026-11-17",
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    shortDescription: "Convert Markdown, README files, AI notes and resumes into a clean PDF.",
    category: "markdown",
    phase: 2,
    status: "live",
    keyword: "markdown to pdf",
    related: ["markdown-viewer", "ai-text-cleaner", "text-compare"],
    updatedAt: "2026-11-19",
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
    shortDescription: "Convert PDF text, headings, lists and tables to Markdown for ChatGPT and Claude.",
    category: "file",
    phase: 3,
    status: "live",
    keyword: "pdf to markdown converter",
    related: ["markdown-viewer", "markdown-to-pdf", "ai-text-cleaner"],
    updatedAt: "2026-11-20",
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

const autoDates = toolDates as Record<string, { updatedAt: string }>;

/** updatedAt comes from the auto-generated tool-dates.json; the manual date is only a fallback. */
export const TOOLS: ToolDef[] = RAW_TOOLS.map((t) => ({
  ...t,
  updatedAt: autoDates[t.slug]?.updatedAt?.slice(0, 10) ?? t.updatedAt,
}));

export const liveTools = () => TOOLS.filter((t) => t.status === "live");
/** The /tools hub stays unlisted (no nav link, no sitemap, noindex) until this many tools are live. */
export const HUB_MIN_TOOLS = 4;
export const hubIsPublic = () => liveTools().length >= HUB_MIN_TOOLS;
export const hubTools = () => TOOLS.filter((t) => t.status === "live");
export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const relatedTools = (tool: ToolDef) =>
  tool.related
    .map(getTool)
    .filter((t): t is ToolDef => !!t && t.status === "live");