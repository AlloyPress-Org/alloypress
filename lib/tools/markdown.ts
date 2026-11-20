/* Markdown Viewer: pure render logic (GFM + highlight + KaTeX + sanitize). Loaded lazily in the browser. */
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/common";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";

const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const marked = new Marked(
    markedHighlight({
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight(code, lang) {
            if ((lang ?? "").trim().split(/\s+/)[0].toLowerCase() === "mermaid") return code; // rendered later as a diagram
            if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
            return esc(code);
        },
    }),
    markedKatex({ throwOnError: false }),
    {
        gfm: true,
        breaks: false,
        renderer: {
            // Mermaid blocks become placeholders; the component turns them into SVG
            code({ text, lang }) {
                if ((lang ?? "").trim().split(/\s+/)[0].toLowerCase() === "mermaid") {
                    // Encoded on purpose: DOMPurify strips attributes containing "-->" or "]>"
                    return `<div class="mv-mermaid" data-src="${encodeURIComponent(text)}"></div>`;
                }
                return false;
            },
        },
    },
);

let hooked = false;

/** Markdown -> sanitized HTML. Scripts, event handlers and javascript: links are removed. */
export function renderMarkdown(md: string): string {
    if (!hooked) {
        DOMPurify.addHook("afterSanitizeAttributes", (node) => {
            if (node.tagName === "A" && /^https?:/i.test(node.getAttribute("href") ?? "")) {
                node.setAttribute("target", "_blank");
                node.setAttribute("rel", "noopener noreferrer");
            }
        });
        hooked = true;
    }
    const raw = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true, svg: true, mathMl: true } });
}

const EXPORT_CSS = `
body{margin:0;background:#fff;color:#1f2328;font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.md{max-width:820px;margin:0 auto;padding:40px 24px;overflow-wrap:anywhere}
.md h1,.md h2,.md h3,.md h4{line-height:1.25;margin:28px 0 14px}
.md h1,.md h2{padding-bottom:8px;border-bottom:1px solid #d0d7de}
.md a{color:#0969da}
.md code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;padding:.15em .4em;border-radius:6px;background:#f6f8fa}
.md pre{padding:14px 16px;border-radius:8px;background:#f6f8fa;overflow:auto}
.md pre code{padding:0;background:none}
.md blockquote{margin:0 0 16px;padding:2px 16px;border-left:4px solid #d0d7de;color:#59636e}
.md table{border-collapse:collapse;display:block;overflow-x:auto}
.md th,.md td{padding:8px 12px;border:1px solid #d0d7de}
.md th{background:#f6f8fa}
.md img{max-width:100%;height:auto}
.md .mv-mermaid{display:flex;justify-content:center;overflow-x:auto;margin:0 0 16px}
.md .mv-mermaid svg{max-width:100%;height:auto}
.hljs-keyword,.hljs-literal,.hljs-selector-tag{color:#cf222e}
.hljs-string,.hljs-regexp,.hljs-meta .hljs-string{color:#0a3069}
.hljs-number,.hljs-symbol,.hljs-variable.constant_{color:#0550ae}
.hljs-comment,.hljs-quote{color:#6e7781}
.hljs-title,.hljs-title.function_,.hljs-section{color:#8250df}
.hljs-attr,.hljs-attribute,.hljs-built_in,.hljs-type{color:#116329}
@media print{
.md{padding:0;max-width:none}
pre{white-space:pre-wrap}
h1,h2,h3,h4,h5,h6{break-after:avoid-page;page-break-after:avoid}
h1+.mv-mermaid,h2+.mv-mermaid,h3+.mv-mermaid,h4+.mv-mermaid,h2+p,h3+p{break-before:avoid}
.mv-mermaid{break-inside:auto;overflow:visible}
.mv-mermaid svg{max-width:100%;max-height:230mm;width:auto;height:auto;break-inside:avoid}
table,img,blockquote{break-inside:avoid}
}
`;

/** Standalone HTML file. Math fonts load from the KaTeX CDN stylesheet. */
export function buildHtmlDocument(body: string, title: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>${EXPORT_CSS}</style>
</head>
<body>
<article class="md">
${body}
</article>
</body>
</html>`;
}

/* ---------- PDF export with page options ---------- */
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

const cssStr = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ").slice(0, 120);

/** Standalone HTML made for printing. Page numbers and header/footer use @page margin boxes (Chrome 131+, Edge, Safari). */
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
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>${css}</style>
</head>
<body>
<article class="md">
${body}
</article>
</body>
</html>`;
}