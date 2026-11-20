"use client";

import "katex/dist/katex.min.css";
import "../markdown-viewer/markdown-viewer.css"; // shared box, toolbar and rendered-Markdown styles

import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { readFileText } from "@/lib/tools/fileText";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:markdown-to-pdf:v1";
const MAX_SAVED_CHARS = 200_000;
const ACCEPT = ".md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain";

type Engine = typeof import("@/lib/tools/markdown");
type Opts = import("@/lib/tools/markdown").PdfOptions;
type Preset = { id: string; label: string; opts: Partial<Opts>; sample: string };

const NOTES = `# Study Notes: How Caching Works

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

const README = `# Project Atlas

A small API for tracking tasks.

## Install

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

\`\`\`js
const res = await fetch("/api/tasks");
console.log(await res.json());
\`\`\`

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create a task |

## Changelog

- [x] v1.1 Add filters
- [ ] v1.2 Add webhooks
`;

const RESUME = `# Alex Morgan

Full-stack developer · alex@example.com · github.com/alexmorgan · Austin, TX

## Summary

Developer with 3 years of experience building fast web apps with React, TypeScript and Node.js.

## Experience

### Frontend Developer, Brightwave
*2024 – Present*

- Built a design system used by 4 product teams.
- Cut page load time by 38% with code splitting and caching.

### Junior Developer, Northlight
*2022 – 2024*

- Shipped 20+ features for a customer portal.
- Wrote tests that raised coverage from 40% to 82%.

## Skills

**Languages:** TypeScript, JavaScript, Python, SQL
**Tools:** React, Next.js, Node.js, PostgreSQL, Git

## Education

B.S. Computer Science, University of Texas, 2022
`;

const SHEET = `# Git Cheat Sheet

| Command | What it does |
| --- | --- |
| \`git status\` | Show changed files |
| \`git add .\` | Stage all changes |
| \`git commit -m "msg"\` | Save a snapshot |
| \`git push\` | Upload commits |
| \`git pull\` | Download and merge |

## Undo

- \`git restore file\` discards changes
- \`git reset --soft HEAD~1\` undoes the last commit
`;

const PRESETS: Preset[] = [
    { id: "ai", label: "AI notes", opts: { margin: "normal", font: "medium", family: "sans", pageNumbers: true }, sample: NOTES },
    { id: "docs", label: "README / docs", opts: { margin: "normal", font: "medium", family: "sans", pageNumbers: true }, sample: README },
    { id: "resume", label: "Resume", opts: { margin: "narrow", font: "small", family: "sans", pageNumbers: false, header: "", footer: "" }, sample: RESUME },
    { id: "sheet", label: "Cheat sheet", opts: { margin: "narrow", font: "small", family: "sans", pageNumbers: true }, sample: SHEET },
    { id: "study", label: "Study notes", opts: { margin: "wide", font: "large", family: "serif", pageNumbers: true }, sample: NOTES },
];

const DEFAULTS: Opts = { size: "letter", margin: "normal", font: "medium", family: "sans", pageNumbers: true, header: "", footer: "" };

type Saved = { text: string; name: string; opts: Opts; preset: string };

let mermaidSeq = 0;

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

const ICONS: Record<string, ReactNode> = {
    upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
    paste: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" /></>,
    sample: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
    code: <><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /><path d="M14 4l-4 16" /></>,
    download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
    clear: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

function IconBtn({ icon, label, text, onClick, disabled, done }: { icon: string; label: string; text?: string; onClick: () => void; disabled?: boolean; done?: boolean }) {
    return (
        <button type="button" className={`mv-ic${done ? " is-ok" : ""}${text ? " mv-ic--txt" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {done ? ICONS.check : ICONS[icon]}
            </svg>
            {text && <span>{text}</span>}
        </button>
    );
}

function Seg<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: [T, string][]; onChange: (v: T) => void }) {
    return (
        <div className="mp-opt">
            <span className="mp-opt-l">{label}</span>
            <div className="mv-seg" role="group" aria-label={label}>
                {items.map(([v, l]) => (
                    <button key={v} type="button" className={value === v ? "is-on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
                ))}
            </div>
        </div>
    );
}

export default function MarkdownToPdf() {
    const [text, setText] = useState("");
    const [name, setName] = useState("");
    const [fileName, setFileName] = useState("");
    const [opts, setOpts] = useState<Opts>(DEFAULTS);
    const [preset, setPreset] = useState("");
    const [engine, setEngine] = useState<Engine | null>(null);
    const [drag, setDrag] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [copied, setCopied] = useState("");
    const loaded = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);

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
            if (s.preset) setPreset(s.preset);
        }
        loaded.current = true;
    }, []);

    useEffect(() => {
        if (!loaded.current) return;
        const id = setTimeout(() => writeStore({ text, name, opts, preset }), 500);
        return () => clearTimeout(id);
    }, [text, name, opts, preset]);

    const deferred = useDeferredValue(text);
    const html = useMemo(() => {
        if (!engine || !deferred) return "";
        try {
            return engine.renderMarkdown(deferred);
        } catch {
            return "<p>Could not render this Markdown.</p>";
        }
    }, [engine, deferred]);
    const stats = useMemo(() => analyzeText(deferred), [deferred]);
    const lineCount = useMemo(() => (text ? text.split("\n").length : 0), [text]);

    // Mermaid placeholders -> SVG (loads Mermaid only when a diagram exists). A diagram that cannot be drawn shows its source.
    useEffect(() => {
        const root = previewRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(".mv-mermaid"));
        if (!nodes.length) return;
        let cancelled = false;
        (async () => {
            const mermaid = (await import("mermaid")).default;
            if (cancelled) return;
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "default", flowchart: { htmlLabels: false, useMaxWidth: true } });
            for (const el of nodes) {
                if (cancelled) return;
                const raw = el.getAttribute("data-src") ?? "";
                let src = raw;
                try { src = decodeURIComponent(raw); } catch { /* keep raw */ }
                if (!src.trim()) { el.textContent = ""; continue; }
                const id = `mp-m-${++mermaidSeq}`;
                try {
                    const { svg } = await mermaid.render(id, src);
                    if (!cancelled) el.innerHTML = svg;
                } catch (e) {
                    document.getElementById(`d${id}`)?.remove();
                    document.getElementById(id)?.remove();
                    if (cancelled) return;
                    const why = e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "invalid syntax";
                    const wrap = document.createElement("div");
                    wrap.className = "mv-fallback";
                    const note = document.createElement("p");
                    note.className = "mv-err";
                    note.textContent = /circular structure/i.test(why) ? "This diagram type could not be drawn in the browser. Its source is shown instead." : `Diagram error: ${why}`;
                    const pre = document.createElement("pre");
                    const code = document.createElement("code");
                    code.textContent = src;
                    pre.appendChild(code);
                    wrap.append(note, pre);
                    el.replaceChildren(wrap);
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

    const setOpt = <K extends keyof Opts>(k: K, v: Opts[K]) => {
        setOpts((o) => ({ ...o, [k]: v }));
        setPreset("");
    };

    const pickPreset = (p: Preset) => {
        setOpts((o) => ({ ...o, ...p.opts }));
        setPreset(p.id);
        if (!text.trim()) { setText(p.sample); setName(""); }
    };

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

    const downloadPdf = () => {
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

    const clearAll = () => { setText(""); setName(""); setMsg(null); setPreset(""); };

    const pageVars = {
        "--pg-w": opts.size === "a4" ? "210mm" : "215.9mm",
        "--pg-pad": `calc(var(--mp-m-${opts.margin}) * .6)`,
        "--pg-fs": { small: "13px", medium: "15px", large: "17px" }[opts.font],
        "--pg-ff": opts.family === "serif" ? `Georgia,"Times New Roman",serif` : "inherit",
    } as CSSProperties;

    return (
        <div className="tl-tool">
            <section className="mv-card mp-card" aria-label="Markdown to PDF">
                {/* ---------- top bar: presets + download ---------- */}
                <div className="mp-top">
                    <div className="mp-presets" role="group" aria-label="Presets">
                        <span className="mp-opt-l">Make a PDF for</span>
                        {PRESETS.map((p) => (
                            <button key={p.id} type="button" className={`mp-chip${preset === p.id ? " is-on" : ""}`} aria-pressed={preset === p.id} onClick={() => pickPreset(p)}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="tl-btn tl-btn--primary mp-dl" onClick={downloadPdf} disabled={!html}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS.download}</svg>
                        Download PDF
                    </button>
                </div>

                {/* ---------- page options ---------- */}
                <div className="mp-options">
                    <Seg label="Page" value={opts.size} items={[["letter", "Letter"], ["a4", "A4"]]} onChange={(v) => setOpt("size", v)} />
                    <Seg label="Margins" value={opts.margin} items={[["narrow", "Narrow"], ["normal", "Normal"], ["wide", "Wide"]]} onChange={(v) => setOpt("margin", v)} />
                    <Seg label="Text" value={opts.font} items={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} onChange={(v) => setOpt("font", v)} />
                    <Seg label="Font" value={opts.family} items={[["sans", "Sans"], ["serif", "Serif"]]} onChange={(v) => setOpt("family", v)} />
                    <label className="mp-check">
                        <input type="checkbox" checked={opts.pageNumbers} onChange={(e) => setOpt("pageNumbers", e.target.checked)} />
                        Page numbers
                    </label>

                    <details className="mp-more">
                        <summary>Header, footer and file name</summary>
                        <div className="mp-fields">
                            <label className="mp-field"><span>Header text</span>
                                <input type="text" value={opts.header} maxLength={80} placeholder="Top of every page" onChange={(e) => setOpt("header", e.target.value)} />
                            </label>
                            <label className="mp-field"><span>Footer text</span>
                                <input type="text" value={opts.footer} maxLength={80} placeholder="Bottom of every page" onChange={(e) => setOpt("footer", e.target.value)} />
                            </label>
                            <label className="mp-field"><span>File name</span>
                                <input type="text" value={fileName} maxLength={60} placeholder={base} onChange={(e) => setFileName(e.target.value)} />
                            </label>
                        </div>
                    </details>
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
                                <IconBtn icon="upload" label="Upload .md file" onClick={() => fileRef.current?.click()} />
                                <IconBtn icon="paste" label="Paste" onClick={onPaste} />
                                <IconBtn icon="sample" label="Sample" onClick={() => { setText(NOTES); setName(""); }} />
                                <IconBtn icon="copy" label={copied === "md" ? "Copied" : "Copy Markdown"} onClick={async () => { if (text && (await writeClipboard(text))) flash("md"); }} disabled={!hasText} done={copied === "md"} />
                                <IconBtn icon="clear" label="Clear" onClick={clearAll} disabled={!hasText} />
                            </div>
                            <span className="mv-count">{name && <span className="mv-file">{name} · </span>}Lines: {fmt(lineCount)} | Words: {fmt(stats.words)}</span>
                        </div>
                        <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>

                    <div className="mv-box mv-box--prev">
                        <div className="mv-prev mp-stage" aria-label="PDF preview" style={pageVars}>
                            {!hasText ? (
                                <p className="mv-empty">Paste Markdown, upload a .md file, or pick a preset to see the PDF page here.</p>
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
                            </div>
                            <span className="mv-count">{opts.size === "a4" ? "A4" : "Letter"} · {opts.margin} margins</span>
                        </div>
                    </div>
                </div>

                {msg && <p className={`mv-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</p>}
                <p className="mv-note">Download PDF opens your print dialog. Choose “Save as PDF” as the printer, and turn off “Headers and footers” for a clean page.</p>
            </section>
        </div>
    );
}