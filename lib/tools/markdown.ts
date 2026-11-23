/* Markdown render logic: sanitized GFM. Highlighting and math load only when the document needs them. */
import DOMPurify from "dompurify";
import { Marked, type MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";

const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Hljs = typeof import("highlight.js/lib/common").default;
type KatexExt = typeof import("marked-katex-extension").default;

let hljs: Hljs | null = null;
let katexExt: KatexExt | null = null;
let marked: Marked | null = null;

const lang1 = (lang: string | undefined) => (lang ?? "").trim().split(/\s+/)[0].toLowerCase();

export const needsHighlight = (md: string) => {
    const re = /^[ \t]{0,3}(?:`{3,}|~{3,})[ \t]*([^\s`]+)/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md))) if (m[1].toLowerCase() !== "mermaid") return true;
    return false;
};

export const needsMath = (md: string) => md.includes("$");

/** Loads the highlighter / KaTeX only when the text needs them. Returns true if something new was loaded. */
export async function loadExtras(md: string): Promise<boolean> {
    let changed = false;
    const jobs: Promise<void>[] = [];
    if (!hljs && needsHighlight(md)) {
        jobs.push(import("highlight.js/lib/common").then((m) => { hljs = m.default; changed = true; }, () => {}));
    }
    if (!katexExt && needsMath(md)) {
        jobs.push(import("marked-katex-extension").then((m) => { katexExt = m.default; changed = true; }, () => {}));
    }
    if (jobs.length) await Promise.all(jobs);
    if (changed) marked = null;
    return changed;
}

/** Same function under the name the security test uses. */
export const prepare = loadExtras;

function build(): Marked {
    const exts: MarkedExtension[] = [
        markedHighlight({
            emptyLangClass: "hljs",
            langPrefix: "hljs language-",
            highlight(code, lang) {
                if (lang1(lang) === "mermaid") return code;
                if (hljs && lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
                return esc(code);
            },
        }),
    ];
    if (katexExt) exts.push(katexExt({ throwOnError: false }));
    exts.push({
        gfm: true,
        breaks: false,
        renderer: {
            code({ text, lang }) {
                if (lang1(lang) === "mermaid") {
                    // Source is encoded because DOMPurify strips attributes that contain "-->"
                    return `<div class="mv-mermaid" data-src="${encodeURIComponent(text)}"></div>`;
                }
                return false;
            },
        },
    });
    return new Marked(...exts);
}

// KaTeX needs inline styles for layout. Allow ONLY harmless numeric properties, and ONLY inside .katex.
const KATEX_STYLE =
    /^(?:\s*(?:height|width|min-width|top|left|margin-left|margin-right|margin-top|padding-left|vertical-align|border-bottom-width)\s*:\s*-?[\d.]+(?:em|ex|px|%)?\s*;?)*\s*$/i;

let hooked = false;

/** Markdown -> sanitized HTML. Scripts, event handlers, javascript: links, forms, style tags and style attributes are removed. */
export function renderMarkdown(md: string): string {
    // DOMPurify needs a browser DOM. On the server we return nothing rather than unsanitized HTML.
    if (!DOMPurify.isSupported) return "";

    if (!hooked) {
        DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
            if (data.attrName === "style" && node.closest?.(".katex") && KATEX_STYLE.test(data.attrValue)) {
                data.forceKeepAttr = true;
            }
        });
        DOMPurify.addHook("afterSanitizeAttributes", (node) => {
            if (node.tagName === "A" && /^https?:/i.test(node.getAttribute("href") ?? "")) {
                node.setAttribute("target", "_blank");
                node.setAttribute("rel", "noopener noreferrer");
            }
            // The only input allowed is a read-only task-list checkbox
            if (node.tagName === "INPUT") {
                if (node.getAttribute("type") !== "checkbox") node.remove();
                else node.setAttribute("disabled", "");
            }
        });
        hooked = true;
    }
    if (!marked) marked = build();
    const raw = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(raw, {
        USE_PROFILES: { html: true, svg: true, mathMl: true },
        FORBID_TAGS: ["form", "style", "button", "textarea", "select", "iframe", "object", "embed"],
        FORBID_ATTR: ["style"],
    });
}

export async function waitForPrintReady(root: ParentNode = document, timeoutMs = 8000): Promise<void> {
    const wait = async () => {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            const boxes = Array.from(root.querySelectorAll<HTMLElement>(".mv-mermaid"));
            if (boxes.every((b) => b.querySelector("svg"))) break;
            await new Promise((r) => setTimeout(r, 50));
        }
        if ("fonts" in document) await document.fonts.ready.catch(() => {});
        const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
        await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };
    await Promise.race([wait(), new Promise<void>((r) => setTimeout(r, timeoutMs + 2000))]);
}

export const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

const EXPORT_CSS = `
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:#1f2328;font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.md{max-width:820px;margin:0 auto;padding:40px 24px;overflow-wrap:anywhere}
.md>*:first-child{margin-top:0}
.md h1,.md h2,.md h3,.md h4,.md h5,.md h6{margin:1.6em 0 .6em;line-height:1.25;font-weight:700;color:#111827}
.md h1{font-size:2em;padding-bottom:.3em;border-bottom:2px solid #e5e7eb}
.md h2{font-size:1.5em;padding-bottom:.25em;border-bottom:1px solid #e5e7eb}
.md h3{font-size:1.25em}
.md h4{font-size:1.05em}
.md p,.md ul,.md ol,.md blockquote,.md table,.md pre,.md .mv-mermaid{margin:0 0 1em}
.md ul,.md ol{padding-left:1.7em}
.md ul{list-style:disc outside}
.md ol{list-style:decimal outside}
.md ul ul{list-style:circle outside}
.md ul ul ul{list-style:square outside}
.md li{margin:.25em 0}
.md li::marker{color:#6b7280}
.md li:has(>input[type=checkbox]){list-style:none;margin-left:-1.4em}
.md li>input[type=checkbox]{margin-right:.5em}
.md hr{height:0;margin:1.6em 0;border:0;border-top:1px solid #e5e7eb}
.md hr+h1,.md hr+h2{margin-top:.8em}
.md a{color:#0969da;text-decoration:none}
.md strong{font-weight:700;color:#111827}
.md img{max-width:100%;height:auto}
.md code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;padding:.15em .4em;border-radius:5px;background:#f3f4f6}
.md pre{padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;background:#f6f8fa;overflow:auto;line-height:1.55}
.md pre code{padding:0;background:none;font-size:.85em}
.md blockquote{padding:.5em 1em;border-left:4px solid #d0d7de;border-radius:0 6px 6px 0;background:#f9fafb;color:#4b5563}
.md blockquote>:last-child{margin-bottom:0}
.md table{display:table;width:100%;border-collapse:collapse;font-size:.95em}
.md th,.md td{padding:8px 12px;border:1px solid #e5e7eb;text-align:left;vertical-align:top}
.md th{background:#f3f4f6;font-weight:700}
.md tbody tr:nth-child(even){background:#f9fafb}
.md .mv-mermaid{display:flex;justify-content:center;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;overflow:hidden}
.md .mv-mermaid svg{max-width:100%;height:auto;max-height:150mm}
.hljs-keyword,.hljs-literal,.hljs-selector-tag{color:#cf222e}
.hljs-string,.hljs-regexp,.hljs-meta .hljs-string{color:#0a3069}
.hljs-number,.hljs-symbol,.hljs-variable.constant_{color:#0550ae}
.hljs-comment,.hljs-quote{color:#6e7781}
.hljs-title,.hljs-title.function_,.hljs-section{color:#8250df}
.hljs-attr,.hljs-attribute,.hljs-built_in,.hljs-type{color:#116329}
@media print{
html,body{height:auto!important;overflow:visible!important}
.md{padding:0;max-width:none}
.md h1,.md h2,.md h3,.md h4,.md h5,.md h6{break-after:avoid-page;page-break-after:avoid;break-inside:avoid}
.md h1+*,.md h2+*,.md h3+*,.md h4+*{break-before:avoid-page;page-break-before:avoid}
.md pre,.md img,.md .mv-mermaid,.md blockquote,.md figure{break-inside:avoid-page;page-break-inside:avoid}
.md pre{white-space:pre-wrap;word-break:break-word;overflow:visible}
.md table{display:table;width:100%;border-collapse:collapse;break-inside:auto}
.md thead{display:table-header-group}
.md tbody{display:table-row-group}
.md tr{display:table-row;break-inside:avoid;page-break-inside:avoid}
.md th,.md td{display:table-cell}
.md li{break-inside:avoid}
.md p{orphans:3;widows:3}
.md hr{break-after:avoid}
.md .mv-mermaid{overflow:visible;max-height:none}
.md .mv-mermaid svg{max-width:100%;height:auto;max-height:230mm}
}
`;

export function buildHtmlDocument(body: string, title: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${KATEX_CSS}">
<style>${EXPORT_CSS}</style>
</head>
<body>
<article class="md">
${body}
</article>
</body>
</html>`;
}

export type PdfOptions = {
    size: "letter" | "a4";
    margin: "narrow" | "normal" | "wide";
    font: "small" | "medium" | "large";
    family: "sans" | "serif";
    pageNumbers: boolean;
    header: string;
    footer: string;
};

export const PDF_MARGINS = { narrow: "12mm", normal: "18mm", wide: "25mm" } as const;
export const PDF_FONTS = { small: "13px", medium: "15px", large: "17px" } as const;
export const PDF_FAMILIES = {
    sans: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`,
    serif: `Georgia,"Times New Roman",serif`,
} as const;

const cssStr = (s: string) =>
    s
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/</g, "\\3C ")
        .replace(/>/g, "\\3E ")
        .replace(/[\r\n]+/g, " ")
        .slice(0, 120);

export function buildPdfDocument(body: string, title: string, o: PdfOptions): string {
    const header = o.header.trim();
    const footer = o.footer.trim();
    const foot = [footer ? `"${cssStr(footer)}"` : "", o.pageNumbers ? `"Page " counter(page) " of " counter(pages)` : ""].filter(Boolean).join(` "  ·  " `);
    const box = "font:10px -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;";
    const page =
        `@page{size:${o.size === "a4" ? "A4" : "Letter"};margin:${PDF_MARGINS[o.margin]};` +
        (header ? `@top-center{content:"${cssStr(header)}";${box}}` : "") +
        (foot ? `@bottom-center{content:${foot};${box}}` : "") +
        `}`;
    const css = `${EXPORT_CSS}\n${page}\n.md{max-width:none;margin:0;padding:0;font-size:${PDF_FONTS[o.font]};font-family:${PDF_FAMILIES[o.family]}}`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${KATEX_CSS}">
<style>${css}</style>
</head>
<body>
<article class="md">
${body}
</article>
</body>
</html>`;
}