"use client";

import "../markdown-viewer/markdown-viewer.css"; // shared box, toolbar and rendered-Markdown styles

import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { readFileText } from "@/lib/tools/fileText";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:markdown-to-pdf:v1";
const MAX_SAVED_CHARS = 200_000;
const ACCEPT = ".md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain";

type Engine = typeof import("@/lib/tools/markdown");
type Opts = import("@/lib/tools/markdown").PdfOptions;
type Menu = "" | "set";

class UserError extends Error {}

const SAMPLE = `# Study Notes: How Caching Works

> Summary from a ChatGPT session. Edit freely, then download.

## Key ideas

- **Cache hit:** the data is already stored, so it is returned fast.
- **Cache miss:** the data is fetched, then stored for next time.
- **TTL:** how long an item stays valid.

## Comparison

| Strategy | Best for | Risk |
| --- | --- | --- |
| Write-through | Consistency | Slower writes |
| Write-back | Speed | Data loss on crash |

## Hit rate

$$ \\text{hit rate} = \\frac{\\text{hits}}{\\text{hits} + \\text{misses}} $$

## Flow

\`\`\`mermaid
flowchart LR
  A[Request] --> B{In cache?}
  B -->|Yes| C[Return fast]
  B -->|No| D[Fetch and store]
\`\`\`
`;

const DEFAULTS: Opts = { size: "letter", margin: "normal", font: "medium", family: "sans", pageNumbers: true, header: "", footer: "" };

type Saved = { text: string; name: string; opts: Opts };

let mermaidSeq = 0;

/** Mermaid's block layout tries to JSON.stringify a DOM node that React has decorated with circular Fiber refs. */
function preventMermaidBlockStringifyCrash(): void {
    const html = document.documentElement;
    if (Object.prototype.hasOwnProperty.call(html, "toJSON")) return;
    Object.defineProperty(html, "toJSON", { value: () => ({}), configurable: true });
}

/** Shows a short message and the diagram source in place of a diagram that could not be drawn. */
function showDiagramFallback(el: HTMLElement, note: string, src: string) {
    const wrap = document.createElement("div");
    wrap.className = "mv-fallback";
    const p = document.createElement("p");
    p.className = "mv-err";
    p.textContent = note;
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = src;
    pre.appendChild(code);
    wrap.append(p, pre);
    el.replaceChildren(wrap);
}

function readStore(): Saved | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
function writeStore(v: Saved) {
    try {
        if (!v.text || v.text.length > MAX_SAVED_CHARS) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
        /* storage blocked or full: ignore */
    }
}
async function writeClipboard(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        return false;
    }
}
function save(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** jsPDF's built-in fonts only cover Latin text, so anything else in a header or footer is replaced. */
const latin = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");

const ICONS: Record<string, ReactNode> = {
    upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
    paste: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" /></>,
    sample: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
    code: <><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /><path d="M14 4l-4 16" /></>,
    download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
    print: <><path d="M7 9V3h10v6" /><rect x="5" y="14" width="14" height="7" rx="1" /><path d="M5 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-1" /></>,
    clear: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    sliders: <><path d="M4 6h10" /><path d="M18 6h2" /><circle cx="16" cy="6" r="2" /><path d="M4 12h2" /><path d="M10 12h10" /><circle cx="8" cy="12" r="2" /><path d="M4 18h12" /><path d="M20 18h0" /><circle cx="18" cy="18" r="2" /></>,
    chevron: <path d="M6 9l6 6 6-6" />,
};

function Svg({ icon, size = 18, sw = 2 }: { icon: string; size?: number; sw?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[icon]}
        </svg>
    );
}

function IconBtn({ icon, label, text, onClick, disabled, done }: { icon: string; label: string; text?: string; onClick: () => void; disabled?: boolean; done?: boolean }) {
    return (
        <button type="button" className={`mv-ic${done ? " is-ok" : ""}${text ? " mv-ic--txt" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
            <Svg icon={done ? "check" : icon} />
            {text && <span>{text}</span>}
        </button>
    );
}

function Seg<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: [T, string][]; onChange: (v: T) => void }) {
    return (
        <div className="mp-row">
            <span className="mp-opt-l">{label}</span>
            <div className="mv-seg mp-seg" role="group" aria-label={label}>
                {items.map(([v, l]) => (
                    <button key={v} type="button" className={value === v ? "is-on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
                ))}
            </div>
        </div>
    );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="mp-switch-row">
            <span className="mp-sw-l">{label}</span>
            <button type="button" role="switch" aria-checked={on} aria-label={label} className={`mp-sw${on ? " is-on" : ""}`} onClick={() => onChange(!on)}>
                <i />
            </button>
        </div>
    );
}

export default function MarkdownToPdf() {
    const [text, setText] = useState("");
    const [name, setName] = useState("");
    const [fileName, setFileName] = useState("");
    const [opts, setOpts] = useState<Opts>(DEFAULTS);
    const [engine, setEngine] = useState<Engine | null>(null);
    const [extrasV, setExtrasV] = useState(0); // 0 = highlighter and KaTeX not checked yet; bumps when one finishes loading
    const [drag, setDrag] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [copied, setCopied] = useState("");
    const [menu, setMenu] = useState<Menu>("");
    const [busy, setBusy] = useState(false);
    const [hdrOn, setHdrOn] = useState(false);
    const [ftrOn, setFtrOn] = useState(false);
    const loaded = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let alive = true;
        import("@/lib/tools/markdown").then((m) => alive && setEngine(m));
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        const s = readStore();
        if (s) {
            setText(s.text ?? "");
            setName(s.name ?? "");
            if (s.opts) setOpts({ ...DEFAULTS, ...s.opts });
        }
        loaded.current = true;
    }, []);

    useEffect(() => {
        if (!loaded.current) return;
        const id = setTimeout(() => writeStore({ text, name, opts }), 500);
        return () => clearTimeout(id);
    }, [text, name, opts]);

    // dropdown: close on outside click or Escape
    useEffect(() => {
        if (!menu) return;
        const onDown = (e: MouseEvent) => {
            if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu("");
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(""); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [menu]);

    const deferred = useDeferredValue(text);

    // highlight.js and the KaTeX renderer load only when the text has a fenced code language or a "$"
    useEffect(() => {
        if (!engine) return;
        let alive = true;
        engine.loadExtras(deferred).then(
            (changed) => alive && setExtrasV((v) => (changed || v === 0 ? v + 1 : v)),
            () => alive && setExtrasV((v) => (v === 0 ? 1 : v)),
        );
        return () => { alive = false; };
    }, [engine, deferred]);

    // KaTeX stylesheet loads only when the document contains "$"
    const [mathCss, setMathCss] = useState(false);
    const needsMath = deferred.includes("$");
    useEffect(() => {
        if (!needsMath || mathCss) return;
        let alive = true;
        // @ts-ignore: plain .css has no type declaration
        import("katex/dist/katex.min.css").then(() => alive && setMathCss(true), () => alive && setMathCss(true));
        return () => { alive = false; };
    }, [needsMath, mathCss]);

    const html = useMemo(() => {
        if (!engine || !deferred) return "";
        if (extrasV === 0) return ""; // first render waits once for the highlighter and KaTeX
        if (needsMath && !mathCss) return ""; // wait for the stylesheet, so math never flashes unstyled
        try {
            return engine.renderMarkdown(deferred);
        } catch {
            return "<p>Could not render this Markdown.</p>";
        }
    }, [engine, deferred, needsMath, mathCss, extrasV]);
    const stats = useMemo(() => analyzeText(deferred), [deferred]);
    const lineCount = useMemo(() => (text ? text.split("\n").length : 0), [text]);

    // Mermaid placeholders -> SVG (Mermaid loads only when a diagram exists). A diagram that cannot be drawn shows its source.
    useEffect(() => {
        const root = previewRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(".mv-mermaid"));
        if (!nodes.length) return;
        let cancelled = false;
        (async () => {
            const srcOf = (el: HTMLElement) => {
                const raw = el.getAttribute("data-src") ?? "";
                try { return decodeURIComponent(raw); } catch { return raw; }
            };

            let mermaid: (typeof import("mermaid"))["default"];
            try {
                mermaid = (await import("mermaid")).default;
            } catch {
                if (cancelled) return;
                for (const el of nodes) {
                    const src = srcOf(el);
                    if (src.trim()) showDiagramFallback(el, "Diagrams could not be loaded. Check your connection and try again. Its source is shown instead.", src);
                }
                return;
            }
            if (cancelled) return;

            preventMermaidBlockStringifyCrash();
            const strict = { startOnLoad: false, securityLevel: "strict" as const, theme: "default" as const, flowchart: { htmlLabels: false, useMaxWidth: true } };
            mermaid.initialize(strict);

            for (const el of nodes) {
                if (cancelled) return;
                const src = srcOf(el);
                if (!src.trim()) { el.textContent = ""; continue; }
                const id = `mp-m-${++mermaidSeq}`;
                try {
                    let svg: string;
                    try {
                        ({ svg } = await mermaid.render(id, src));
                    } catch (first) {
                        // Some diagram types (e.g. block-beta) crash in strict mode: retry once in loose mode
                        document.getElementById(`d${id}`)?.remove();
                        document.getElementById(id)?.remove();
                        mermaid.initialize({ ...strict, securityLevel: "loose" });
                        try {
                            ({ svg } = await mermaid.render(`${id}r`, src));
                        } finally {
                            mermaid.initialize(strict);
                        }
                        void first;
                    }
                    if (!cancelled) el.innerHTML = svg;
                } catch (e) {
                    ["", "r"].forEach((s) => {
                        document.getElementById(`d${id}${s}`)?.remove();
                        document.getElementById(`${id}${s}`)?.remove();
                    });
                    if (cancelled) return;
                    const why = e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "invalid syntax";
                    showDiagramFallback(
                        el,
                        /circular structure/i.test(why) ? "This diagram type could not be drawn in the browser. Its source is shown instead." : `Diagram error: ${why}`,
                        src,
                    );
                }
            }
        })();
        return () => { cancelled = true; };
    }, [html]);

    const hasText = text.length > 0;
    const base = (name.replace(/\.[^.]+$/, "") || "markdown").replace(/[^\w.-]+/g, "-");
    const title = (/^#\s+(.+)$/m.exec(text)?.[1] ?? name) || "Markdown document";
    const outName = (fileName.trim().replace(/\.pdf$/i, "").replace(/[^\w .-]+/g, "-") || base) || "document";

    const flash = (k: string) => {
        setCopied(k);
        setTimeout(() => setCopied((c) => (c === k ? "" : c)), 1500);
    };

    const setOpt = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts((o) => ({ ...o, [k]: v }));

    const loadFile = async (f?: File | null) => {
        if (!f) return;
        try {
            const t = await readFileText(f);
            setText(t);
            setName(f.name);
            setMsg({ ok: true, text: `Loaded “${f.name}” (${fmt(t.length)} characters).` });
        } catch (e) {
            setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not read this file." });
        }
    };

    const onPaste = async () => {
        try {
            const clip = await navigator.clipboard.readText();
            if (clip) { setText(clip); setName(""); }
        } catch {
            /* permission denied: use Ctrl/Cmd+V in the box */
        }
    };

    const renderedHtml = () => previewRef.current?.innerHTML ?? "";

    /**
     * Direct download: the print-ready page is drawn in a hidden frame, captured with html2canvas,
     * cut into pages (never through the middle of a paragraph, row or code block that fits on one page) and saved with jsPDF.
     */
    const downloadPdf = async () => {
        if (!engine || !html || busy) return;
        setBusy(true);
        setMsg(null);
        let frame: HTMLIFrameElement | null = null;
        try {
            const mm = parseFloat(engine.PDF_MARGINS[opts.margin]);
            const pageW = opts.size === "a4" ? 210 : 215.9;
            const pageH = opts.size === "a4" ? 297 : 279.4;
            const hdr = latin(opts.header.trim());
            const ftr = latin(opts.footer.trim());
            const top = mm + (hdr ? 6 : 0);
            const bottom = mm + (ftr || opts.pageNumbers ? 6 : 0);
            const contentW = pageW - mm * 2; // mm
            const contentH = pageH - top - bottom; // mm
            const contentPx = Math.round((contentW / 25.4) * 96);

            frame = document.createElement("iframe");
            frame.setAttribute("aria-hidden", "true");
            frame.tabIndex = -1;
            frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${contentPx}px;height:1200px;border:0;`;
            const ready = new Promise<void>((resolve) => { frame!.onload = () => resolve(); });
            frame.srcdoc = engine.buildPdfDocument(renderedHtml(), outName, opts);
            document.body.appendChild(frame);
            await ready;

            const doc = frame.contentDocument;
            if (!doc) throw new Error("frame");
            try { await doc.fonts?.ready; } catch { /* ignore */ }
            const body = doc.body;
            const bodyH = body.scrollHeight;
            frame.style.height = `${bodyH}px`;

            // Keep the canvas inside browser limits (long documents are drawn at a lower resolution)
            const scale = Math.min(2, 16000 / bodyH, Math.sqrt(14_000_000 / (contentPx * bodyH)));
            if (scale < 0.6) throw new UserError("This document is too long to save directly. Use Print, or split it into parts.");

            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
            const canvas = await html2canvas(body, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: contentPx });

            // Safe places to start a new page: top edges of blocks that fit on one page
            const sliceH = Math.floor((contentH / contentW) * canvas.width);
            const origin = body.getBoundingClientRect().top;
            const blocks = Array.from(body.querySelectorAll<HTMLElement>(".md > *, .md li, .md tr"))
                .map((el) => {
                    const r = el.getBoundingClientRect();
                    return { top: (r.top - origin) * scale, bottom: (r.bottom - origin) * scale };
                })
                .filter((b) => b.bottom - b.top > 1 && b.bottom - b.top <= sliceH);

            const slices: [number, number][] = [];
            let y = 0;
            while (y < canvas.height - 1) {
                let end = Math.min(y + sliceH, canvas.height);
                if (end < canvas.height) {
                    const hit = blocks.filter((b) => b.top < end && b.bottom > end && b.top > y + sliceH * 0.3).sort((a, b) => b.top - a.top)[0];
                    if (hit) end = Math.floor(hit.top);
                }
                slices.push([y, end]);
                y = end;
            }

            const pdf = new jsPDF({ unit: "mm", format: opts.size === "a4" ? "a4" : "letter", orientation: "portrait", compress: true });
            pdf.setProperties({ title: outName });
            const total = slices.length;
            slices.forEach(([from, to], i) => {
                if (i) pdf.addPage();
                const h = to - from;
                const piece = document.createElement("canvas");
                piece.width = canvas.width;
                piece.height = h;
                const ctx = piece.getContext("2d");
                if (!ctx) throw new Error("canvas");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, piece.width, piece.height);
                ctx.drawImage(canvas, 0, from, canvas.width, h, 0, 0, canvas.width, h);
                pdf.addImage(piece.toDataURL("image/jpeg", 0.95), "JPEG", mm, top, contentW, h * (contentW / canvas.width));

                pdf.setFontSize(9);
                pdf.setTextColor(107, 114, 128);
                if (hdr) pdf.text(hdr, pageW / 2, Math.max(7, mm * 0.6), { align: "center" });
                const foot = [ftr, opts.pageNumbers ? `Page ${i + 1} of ${total}` : ""].filter(Boolean).join("  ·  ");
                if (foot) pdf.text(foot, pageW / 2, pageH - Math.max(6, mm * 0.5), { align: "center" });
            });
            pdf.save(`${outName}.pdf`);
        } catch (e) {
            setMsg({ ok: false, text: e instanceof UserError ? e.message : "Could not create the PDF. Try Print, or a shorter document." });
        } finally {
            frame?.remove();
            setBusy(false);
        }
    };

    /** Browser print engine: slower to set up, but the PDF text stays selectable and searchable. */
    const printPdf = () => {
        if (!engine || !html) return;
        const frame = document.createElement("iframe");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        frame.srcdoc = engine.buildPdfDocument(renderedHtml(), outName, opts); // the title becomes the suggested PDF file name
        frame.onload = () => {
            const w = frame.contentWindow;
            if (!w) return;
            w.focus();
            w.print();
            setTimeout(() => frame.remove(), 60000);
        };
        document.body.appendChild(frame);
    };

    const downloadHtml = () => {
        if (!engine) return;
        save(`${outName}.html`, engine.buildPdfDocument(renderedHtml(), title, opts), "text/html;charset=utf-8");
    };

    const clearAll = () => { setText(""); setName(""); setMsg(null); };

    const pageVars = {
        "--pg-w": opts.size === "a4" ? "210mm" : "215.9mm",
        "--pg-pad": `calc(var(--mp-m-${opts.margin}) * .6)`,
        "--pg-fs": { small: "13px", medium: "15px", large: "17px" }[opts.font],
        "--pg-ff": opts.family === "serif" ? `Georgia,"Times New Roman",serif` : "inherit",
    } as CSSProperties;

    const showHdr = hdrOn || opts.header !== "";
    const showFtr = ftrOn || opts.footer !== "";
    const toggle = (m: Menu) => setMenu((c) => (c === m ? "" : m));

    return (
        <div className="tl-tool">
            <section className="mv-card mp-card" aria-label="Markdown to PDF">
                {/* ---------- top bar: Document setup dropdown | Download ---------- */}
                <div className="mp-top">
                    <div className="mp-bar" ref={barRef}>
                        <div className="mp-menu">
                            <button type="button" className={`mp-trig${menu === "set" ? " is-open" : ""}`} aria-haspopup="dialog" aria-expanded={menu === "set"} onClick={() => toggle("set")}>
                                <Svg icon="sliders" size={17} />
                                <span className="mp-trig-t">
                                    <small>Editor</small>
                                    <b>Document setup</b>
                                </span>
                                <Svg icon="chevron" size={16} />
                            </button>
                            {menu === "set" && (
                                <div className="mp-pop mp-pop--set" role="dialog" aria-label="Document setup">
                                    <p className="mp-pop-h">Document setup</p>

                                    <Seg label="Page size" value={opts.size} items={[["letter", "Letter"], ["a4", "A4"]]} onChange={(v) => setOpt("size", v)} />
                                    <Seg label="Margins" value={opts.margin} items={[["narrow", "Narrow"], ["normal", "Normal"], ["wide", "Wide"]]} onChange={(v) => setOpt("margin", v)} />
                                    <Seg label="Font family" value={opts.family} items={[["sans", "Sans"], ["serif", "Serif"]]} onChange={(v) => setOpt("family", v)} />
                                    <Seg label="Font size" value={opts.font} items={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} onChange={(v) => setOpt("font", v)} />

                                    <div className="mp-divider" />

                                    <Switch label="Page numbers" on={opts.pageNumbers} onChange={(v) => setOpt("pageNumbers", v)} />

                                    <Switch
                                        label="Header"
                                        on={showHdr}
                                        onChange={(v) => {
                                            setHdrOn(v);
                                            if (!v) setOpt("header", "");
                                        }}
                                    />
                                    {showHdr && (
                                        <input className="mp-input" type="text" value={opts.header} maxLength={80} placeholder="Top of every page" aria-label="Header text" onChange={(e) => setOpt("header", e.target.value)} />
                                    )}

                                    <Switch
                                        label="Footer"
                                        on={showFtr}
                                        onChange={(v) => {
                                            setFtrOn(v);
                                            if (!v) setOpt("footer", "");
                                        }}
                                    />
                                    {showFtr && (
                                        <input className="mp-input" type="text" value={opts.footer} maxLength={80} placeholder="Bottom of every page" aria-label="Footer text" onChange={(e) => setOpt("footer", e.target.value)} />
                                    )}

                                    <div className="mp-divider" />

                                    <label className="mp-field">
                                        <span className="mp-opt-l">File name</span>
                                        <input className="mp-input" type="text" value={fileName} maxLength={60} placeholder={base} onChange={(e) => setFileName(e.target.value)} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="button" className="tl-btn tl-btn--primary mp-dl" onClick={() => void downloadPdf()} disabled={!html || busy} aria-busy={busy}>
                        <Svg icon="download" sw={2.2} />
                        {busy ? "Making PDF…" : "Download PDF"}
                    </button>
                </div>

                {/* ---------- editor | paper preview ---------- */}
                <div className="mv-panes mv-panes--split">
                    <div
                        className={`mv-box${drag ? " is-drag" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); void loadFile(e.dataTransfer.files?.[0]); }}
                    >
                        <textarea
                            id="mp-in"
                            aria-label="Markdown"
                            className="mv-textarea"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste Markdown from ChatGPT, Claude or a README, or drop a .md file…"
                            spellCheck={false}
                        />
                        {drag && <div className="mv-drop">Drop file to load</div>}
                        <div className="mv-tools">
                            <div className="mv-icons" role="toolbar" aria-label="Markdown tools">
                                <IconBtn icon="upload" text="Upload" label="Upload .md file" onClick={() => fileRef.current?.click()} />
                                <IconBtn icon="paste" text="Paste" label="Paste from clipboard" onClick={onPaste} />
                                <IconBtn icon="sample" text="Sample" label="Load sample document (table, diagram, math)" onClick={() => { setText(SAMPLE); setName(""); }} />
                                <IconBtn icon="copy" label={copied === "md" ? "Copied" : "Copy Markdown"} onClick={async () => { if (text && (await writeClipboard(text))) flash("md"); }} disabled={!hasText} done={copied === "md"} />
                                <IconBtn icon="clear" label="Clear the editor" onClick={clearAll} disabled={!hasText} />
                            </div>
                            <span className="mv-count">{name && <span className="mv-file">{name} · </span>}Lines: {fmt(lineCount)} | Words: {fmt(stats.words)}</span>
                        </div>
                        <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>

                    <div className="mv-box mv-box--prev">
                        <div className="mv-prev mp-stage" aria-label="PDF preview" style={pageVars}>
                            {!hasText ? (
                                <p className="mv-empty">Paste Markdown, upload a .md file, or try the Sample to see the PDF page here.</p>
                            ) : !engine ? (
                                <p className="mv-empty">Loading preview…</p>
                            ) : (
                                <div className="mp-paper" data-size={opts.size}>
                                    <article ref={previewRef} className="mv-md" dangerouslySetInnerHTML={{ __html: html }} />
                                </div>
                            )}
                        </div>
                        <div className="mv-tools">
                            <div className="mv-icons" role="toolbar" aria-label="Preview tools">
                                <IconBtn icon="code" label={copied === "html" ? "Copied" : "Copy HTML"} onClick={async () => { if (html && (await writeClipboard(renderedHtml()))) flash("html"); }} disabled={!html} done={copied === "html"} />
                                <IconBtn icon="download" text="HTML" label="Download HTML" onClick={downloadHtml} disabled={!html} />
                                <IconBtn icon="print" text="Print" label="Print or save with your browser (keeps the PDF text selectable)" onClick={printPdf} disabled={!html} />
                            </div>
                            <span className="mv-count">{opts.size === "a4" ? "A4" : "Letter"} · {opts.margin} margins</span>
                        </div>
                    </div>
                </div>

                {msg && <p className={`mv-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</p>}
                <p className="mv-note">Download PDF saves the file straight away, with each page drawn as an image. Use Print if you need selectable, searchable text.</p>
            </section>
        </div>
    );
}