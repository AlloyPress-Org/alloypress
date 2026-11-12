/* =========================================================
   AI Text Cleaner: pure cleaning logic (no React, no DOM).
   Used by app/tools/ai-text-cleaner. Everything runs in the browser.
   ========================================================= */

export type ListMode = "keep" | "plain" | "remove";
export type DashMode = "keep" | "hyphen" | "comma";
export type CustomRule = { find: string; replace: string; regex: boolean };

export type CleanOptions = {
  hidden: boolean;        // zero-width, BOM, bidi marks, soft hyphen, odd spaces
  html: boolean;          // HTML -> plain text
  markdown: boolean;      // **bold**, ## headings, `code`, links, quotes, tables
  lists: ListMode;        // markdown / bullet lists
  spaces: boolean;        // double spaces, tabs, trailing spaces
  blankLines: boolean;    // 3+ line breaks -> one blank line
  joinWrapped: boolean;   // join hard-wrapped lines into paragraphs
  quotes: boolean;        // curly quotes, ellipsis character, odd hyphens
  dashes: DashMode;       // em / en dashes
  introPhrases: boolean;  // "Sure! Here's ..."
  closingPhrases: boolean; // "Let me know if ..."
  dupLines: boolean;
  dupParagraphs: boolean;
  preserve: boolean;      // keep URLs, emails and code untouched
  trim: boolean;
  custom: CustomRule[];
};

export type CleanStats = {
  before: number; after: number;
  hidden: number; html: number; markdown: number; spaces: number; blankLines: number;
  joined: number; quotes: number; dashes: number; phrases: number; duplicates: number; custom: number;
};

export type CleanResult = { text: string; stats: CleanStats };

const OFF: CleanOptions = {
  hidden: false, html: false, markdown: false, lists: "keep", spaces: false, blankLines: false,
  joinWrapped: false, quotes: false, dashes: "keep", introPhrases: false, closingPhrases: false,
  dupLines: false, dupParagraphs: false, preserve: true, trim: false, custom: [],
};

const AI: CleanOptions = {
  ...OFF, hidden: true, html: true, markdown: true, lists: "plain", spaces: true, blankLines: true,
  quotes: true, dashes: "hyphen", trim: true,
};

export const CLEAN_PRESETS: { id: string; label: string; hint: string; options: CleanOptions }[] = [
  { id: "ai", label: "AI Text", hint: "Everything ChatGPT, Claude and Gemini leave behind. Your wording is not changed.", options: AI },
  { id: "plain", label: "Plain Text", hint: "AI Text, plus bullet markers removed and broken lines joined.", options: { ...AI, lists: "remove", joinWrapped: true } },
  { id: "pro", label: "Professional", hint: "AI Text, plus intro and closing lines, repeated paragraphs and em dashes turned into commas.", options: { ...AI, introPhrases: true, closingPhrases: true, dupParagraphs: true, joinWrapped: true, dashes: "comma" } },
  { id: "custom", label: "Custom", hint: "Pick each cleaning step yourself below.", options: AI },
];

export const DEFAULT_OPTIONS: CleanOptions = AI;
export const MAX_CUSTOM_RULES = 6;

/* ---------- helpers ---------- */
const PH_OPEN = "\uE000";
const PH_CLOSE = "\uE001";
const PH_RE = /\uE000(\d+)\uE001/g;
const HAS_PH = /[\uE000\uE001]/;

const ZERO_WIDTH = /[\u200B-\u200D\u2060\u180E\uFEFF]/g;
const BIDI = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const SOFT_HYPHEN = /\u00AD/g;
const TAG_CHARS = /[\u{E0000}-\u{E007F}]/gu;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const ODD_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

const BULLET = /^([ \t]*)[-*+•·▪◦●‣⁃][ \t]+/;
const NUMBERED = /^([ \t]*)(\d{1,3})[.)][ \t]+/;

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

function emptyStats(): CleanStats {
  return { before: 0, after: 0, hidden: 0, html: 0, markdown: 0, spaces: 0, blankLines: 0, joined: 0, quotes: 0, dashes: 0, phrases: 0, duplicates: 0, custom: 0 };
}

/* ---------- HTML -> text ---------- */
const TAGS = "a|abbr|article|aside|b|blockquote|body|br|button|center|code|dd|div|dl|dt|em|figure|figcaption|font|footer|form|h[1-6]|head|header|hr|html|i|img|input|label|li|main|nav|ol|p|pre|section|small|span|strong|sub|sup|table|tbody|td|tfoot|th|thead|tr|u|ul";
const TAG_RE = new RegExp(`<\\/?(?:${TAGS})(?:\\s[^>]*)?\\/?>`, "gi");

function htmlToText(input: string): [string, number] {
  let n = 0;
  let t = input
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, () => { n++; return ""; })
    .replace(/<!--[\s\S]*?-->/g, () => { n++; return ""; })
    .replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      n += 2;
      const l = label.replace(TAG_RE, "").trim();
      return !l || l === href ? href : `${l} (${href})`;
    })
    .replace(/<br\s*\/?>/gi, () => { n++; return "\n"; })
    .replace(/<li(?:\s[^>]*)?>/gi, () => { n++; return "\n- "; })
    .replace(/<\/(?:p|div|h[1-6]|ul|ol|table|tr|blockquote|section|article|pre)>/gi, () => { n++; return "\n\n"; })
    .replace(TAG_RE, () => { n++; return ""; });
  if (n > 0 || /&(?:amp|lt|gt|quot|nbsp|apos|#\d+|#x[0-9a-f]+);/i.test(t)) {
    t = t
      .replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&amp;/gi, "&");
  }
  return [t, n];
}

/* ---------- Markdown ---------- */
function mdLinks(t: string): string {
  return t
    .replace(/!\[([^\]]*)\]\([^)\s]*(?:\s+"[^"]*")?\)/g, "$1")
    .replace(/\[([^\]]+)\]\((\S+?)(?:\s+"[^"]*")?\)/g, (_m, label: string, url: string) => (label.trim() === url ? url : `${label} (${url})`));
}

function mdBlocks(t: string): string {
  return t
    .replace(/^[ \t]*(```|~~~)[^\n]*\n([\s\S]*?)\n?[ \t]*\1[ \t]*$/gm, "$2")
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, "$1")
    .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, "")
    .replace(/^[ \t]*=+[ \t]*$/gm, "")
    .replace(/^[ \t]*(?:>[ \t]?)+/gm, "")
    .replace(/^([ \t]*[-*+][ \t]+)\[[ xX]\][ \t]+/gm, "$1")
    .split("\n")
    .filter((line) => !(line.includes("|") && line.includes("-") && /^[\s|:\-]+$/.test(line))) // table separator rows
    .map((line) => (/^\s*\|.*\|\s*$/.test(line) ? line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()).join(" | ") : line))
    .join("\n");
}

function mdLists(t: string, mode: ListMode): string {
  if (mode === "keep") return t;
  return t.split("\n").map((line) => {
    const b = BULLET.exec(line);
    if (b) {
      const rest = line.slice(b[0].length);
      return mode === "remove" ? rest : `${b[1].replace(/\t/g, "  ")}- ${rest}`;
    }
    const n = NUMBERED.exec(line);
    if (n) {
      const rest = line.slice(n[0].length);
      return mode === "remove" ? rest : `${n[1].replace(/\t/g, "  ")}${n[2]}. ${rest}`;
    }
    return line;
  }).join("\n");
}

function mdInline(t: string): string {
  return t
    .replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, "$1")
    .replace(/(^|[^\w])__(?=\S)([^\n]*?\S)__(?!\w)/g, "$1$2")
    .replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, "$1$2")
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, "$1$2")
    .replace(/~~(?=\S)([^\n]*?\S)~~/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/`{3,}/g, "")
    .replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, "$1");
}

/* ---------- AI intro / closing lines ---------- */
const HERE = /\b(here(?:'|’)?s|here is|here are|happy to|let me|i(?:'|’)ll|below)\b/i;
function isIntro(line: string): boolean {
  const l = line.trim();
  if (!l || l.length > 220) return false;
  if (/^(sure|certainly|absolutely|of course|okay|ok|great question|good question)\b/i.test(l)) return /[!:]$/.test(l) || HERE.test(l);
  if (/^(here(?:'|’)s|here is|here are|below is|below are)\b/i.test(l)) return /:$/.test(l);
  return /^(i(?:'|’)d be happy to|i(?:'|’)m happy to|i can help|as an ai)\b/i.test(l);
}
function isClosing(line: string): boolean {
  const l = line.trim();
  if (!l || l.length > 250) return false;
  return /^(i hope this helps|hope this helps|hope that helps|let me know if|let me know whether|feel free to|if you(?:'|’)d like|if you would like|if you have any (?:other |more |further )?questions|would you like me to|do you want me to|is there anything else|happy to help|i(?:'|’)m here to help)\b/i.test(l);
}

/* ---------- main ---------- */
export function cleanText(input: string, o: CleanOptions): CleanResult {
  const st = emptyStats();
  st.before = input.length;
  let t = input.replace(/\r\n?/g, "\n");
  const store: string[] = [];
  const hide = (value: string) => {
    store.push(value);
    return PH_OPEN + (store.length - 1) + PH_CLOSE;
  };

  // 1. hidden characters (before anything is protected, so they go everywhere)
  if (o.hidden) {
    st.hidden = [ZERO_WIDTH, BIDI, SOFT_HYPHEN, TAG_CHARS, CONTROL, ODD_SPACES].reduce((n, re) => n + count(t, re), 0);
    t = t.replace(ODD_SPACES, " ").replace(ZERO_WIDTH, "").replace(BIDI, "").replace(SOFT_HYPHEN, "").replace(TAG_CHARS, "").replace(CONTROL, "");
  }

  // 2. protect code
  if (o.preserve) {
    t = t.replace(/^[ \t]*(```|~~~)[^\n]*\n([\s\S]*?)\n?[ \t]*\1[ \t]*$/gm, (m, _f: string, inner: string) => hide(o.markdown ? inner : m));
    t = t.replace(/`([^`\n]+)`/g, (m, inner: string) => hide(o.markdown ? inner : m));
  }

  // 3. HTML and markdown links
  if (o.html) {
    const [out, n] = htmlToText(t);
    t = out;
    st.html = n;
  }
  if (o.markdown) t = mdLinks(t);

  // 4. protect URLs and emails
  if (o.preserve) {
    t = t.replace(/(?:https?:\/\/|www\.)[^\s<>"\uE000\uE001]+/gi, (m) => {
      const tail = /[.,;:!?)\]'"]+$/.exec(m)?.[0] ?? "";
      return hide(tail ? m.slice(0, -tail.length) : m) + tail;
    });
    t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, (m) => hide(m));
  }

  // 5. markdown symbols and lists
  const mdStart = t.length;
  if (o.markdown) t = mdBlocks(t);
  t = mdLists(t, o.lists);
  if (o.markdown) t = mdInline(t);
  st.markdown = Math.max(0, mdStart - t.length);

  // 6. punctuation
  if (o.quotes) {
    st.quotes = count(t, /[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2018\u2019\u201A\u201B\u2026\u2010\u2011\u2012\u2212]/g);
    t = t
      .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/\u2026/g, "...")
      .replace(/[\u2010\u2011\u2012\u2212]/g, "-");
  }
  if (o.dashes !== "keep") {
    st.dashes = count(t, /[\u2013\u2014\u2015]/g);
    t = t.replace(/(\d)[ \t]*\u2013[ \t]*(\d)/g, "$1-$2");
    if (o.dashes === "hyphen") t = t.replace(/[ \t]*[\u2014\u2015][ \t]*/g, " - ").replace(/[ \t]*\u2013[ \t]*/g, " - ");
    else t = t.replace(/[ \t]*[\u2014\u2015][ \t]*/g, ", ").replace(/[ \t]*\u2013[ \t]*/g, "-");
  }

  // 7. spaces
  if (o.spaces) {
    const before = t.length;
    t = t.split("\n").map((line) => {
      const indent = /^[ \t]*/.exec(line)?.[0] ?? "";
      const body = line.slice(indent.length).replace(/[ \t]+$/, "").replace(/[ \t]{2,}|\t/g, " ");
      return (BULLET.test(line) || NUMBERED.test(line) ? indent.replace(/\t/g, "  ") : "") + body;
    }).join("\n");
    st.spaces += Math.max(0, before - t.length);
  }

  // 8. AI intro and closing lines
  if (o.introPhrases || o.closingPhrases) {
    const lines = t.split("\n");
    const firstIdx = () => lines.findIndex((l) => l.trim());
    const lastIdx = () => { for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim()) return i; return -1; };
    if (o.introPhrases) {
      for (let k = 0; k < 2; k++) {
        const i = firstIdx();
        if (i < 0 || HAS_PH.test(lines[i]) || !isIntro(lines[i])) break;
        lines.splice(i, 1);
        while (i < lines.length && !lines[i].trim()) lines.splice(i, 1);
        st.phrases++;
      }
    }
    if (o.closingPhrases) {
      for (let k = 0; k < 2; k++) {
        const i = lastIdx();
        if (i < 0 || HAS_PH.test(lines[i]) || !isClosing(lines[i])) break;
        lines.splice(i, 1);
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
        st.phrases++;
      }
    }
    t = lines.join("\n");
  }

  // 9. broken (hard-wrapped) lines
  if (o.joinWrapped) {
    const lines = t.split("\n");
    const out: string[] = [];
    for (const line of lines) {
      const prev = out[out.length - 1];
      const join =
        prev !== undefined && prev.trim() !== "" && line.trim() !== "" &&
        prev.trim().length >= 40 && !/[.!?:;…"”')\]\uE001]\s*$/.test(prev) &&
        /^[a-z0-9(]/.test(line.trim()) && !BULLET.test(prev) && !NUMBERED.test(prev) && !BULLET.test(line) && !NUMBERED.test(line);
      if (join) { out[out.length - 1] = prev.replace(/[ \t]+$/, "") + " " + line.trim(); st.joined++; }
      else out.push(line);
    }
    t = out.join("\n");
  }

  // 10. blank lines
  if (o.blankLines) {
    const before = count(t, /\n/g);
    t = t.replace(/^[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
    st.blankLines = Math.max(0, before - count(t, /\n/g));
  }

  // 11. duplicates (never touch protected code)
  if (o.dupParagraphs) {
    const seen = new Set<string>();
    const paras = t.split(/\n{2,}/).filter((p) => {
      const key = p.replace(/\s+/g, " ").trim().toLowerCase();
      if (!key || HAS_PH.test(p)) return true;
      if (seen.has(key)) { st.duplicates++; return false; }
      seen.add(key);
      return true;
    });
    t = paras.join("\n\n");
  }
  if (o.dupLines) {
    const seen = new Set<string>();
    t = t.split("\n").filter((line) => {
      const key = line.trim();
      if (!key || HAS_PH.test(line)) return true;
      if (seen.has(key)) { st.duplicates++; return false; }
      seen.add(key);
      return true;
    }).join("\n");
  }

  // 12. custom rules
  for (const r of o.custom) {
    if (!r.find) continue;
    try {
      if (r.regex) {
        const re = new RegExp(r.find, "g");
        st.custom += count(t, re);
        t = t.replace(re, r.replace);
      } else {
        const parts = t.split(r.find);
        st.custom += parts.length - 1;
        t = parts.join(r.replace);
      }
    } catch {
      /* invalid regular expression: skip this rule */
    }
  }

  // 13. trim, restore protected text
  if (o.trim) {
    const before = t.length;
    t = t.replace(/^\s+|\s+$/g, "");
    st.spaces += Math.max(0, before - t.length);
  }
  t = t.replace(PH_RE, (_m, i: string) => store[Number(i)] ?? "");

  st.after = t.length;
  return { text: t, stats: st };
}

/* ---------- Markdown -> simple HTML (for "Copy with formatting") ---------- */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inlineHtml(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s"]+)\)/g, '<a href="$2">$1</a>');
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  const isUl = (l: string) => /^\s*[-*+]\s+/.test(l);
  const isOl = (l: string) => /^\s*\d+[.)]\s+/.test(l);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) { out.push(`<h${h[1].length}>${inlineHtml(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*(?:[-*_]\s*){3,}$/.test(line)) { out.push("<hr>"); i++; continue; }
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? isOl(lines[i]) : isUl(lines[i]))) {
        items.push(`<li>${inlineHtml(lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""))}</li>`);
        i++;
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>${inlineHtml(buf.join(" "))}</blockquote>`);
      continue;
    }
    const buf = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !/^\s*(#{1,6}\s|```|~~~|>)/.test(lines[i]) && !isUl(lines[i]) && !isOl(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inlineHtml(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}