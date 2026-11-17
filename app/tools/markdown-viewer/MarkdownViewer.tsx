"use client";

import "katex/dist/katex.min.css";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { readFileText } from "@/lib/tools/fileText";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:markdown-viewer:v1";
const MAX_SAVED_CHARS = 200_000;
const ACCEPT = ".md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain";

const SAMPLE = [
    "# Markdown Viewer sample",
    "",
    "Paste or upload any `.md` file. **Bold**, *italic*, ~~strikethrough~~ and [links](https://alloypress.com) all render.",
    "",
    "## Table",
    "",
    "| Feature | Status |",
    "| --- | :---: |",
    "| GitHub tables | ✅ |",
    "| Task lists | ✅ |",
    "| Mermaid and math | ✅ |",
    "",
    "## Task list",
    "",
    "- [x] Paste Markdown",
    "- [x] Read the preview",
    "- [ ] Download as HTML",
    "",
    "## Code",
    "",
    "```js",
    "const greet = (name) => `Hello, ${name}!`;",
    "console.log(greet(\"AlloyPress\"));",
    "```",
    "",
    "## Diagram",
    "",
    "```mermaid",
    "flowchart LR",
    "  A[Paste] --> B{Valid?}",
    "  B -->|Yes| C[Preview]",
    "  B -->|No| D[Fix it]",
    "```",
    "",
    "## Math",
    "",
    "Inline math: $E = mc^2$",
    "",
    "$$",
    "\\int_0^1 x^2 \\, dx = \\frac{1}{3}",
    "$$",
    "",
    "> Everything runs in your browser. Nothing is uploaded.",
].join("\n");

type View = "split" | "write" | "preview";
type Saved = { text: string; view: View; name: string };
type Engine = typeof import("@/lib/tools/markdown");

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
        try {
            const ta = document.createElement("textarea");
            ta.value = value;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch {
            return false;
        }
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

export default function MarkdownViewer() {
    const [text, setText] = useState("");
    const [view, setView] = useState<View>("split");
    const [name, setName] = useState("");
    const [engine, setEngine] = useState<Engine | null>(null);
    const [dark, setDark] = useState(true);
    const [drag, setDrag] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [copied, setCopied] = useState("");
    const loaded = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);

    // Load the renderer in the browser only (marked, highlight.js, DOMPurify)
    useEffect(() => {
        let alive = true;
        import("@/lib/tools/markdown").then((m) => alive && setEngine(m));
        return () => { alive = false; };
    }, []);

    // Follow the site theme (used for Mermaid colors)
    useEffect(() => {
        const read = () => setDark(document.documentElement.getAttribute("data-theme") !== "light");
        read();
        const mo = new MutationObserver(read);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => mo.disconnect();
    }, []);

    // Restore saved text
    useEffect(() => {
        const s = readStore();
        if (s) {
            setText(s.text ?? "");
            setName(s.name ?? "");
            if (s.view === "split" || s.view === "write" || s.view === "preview") setView(s.view);
        }
        loaded.current = true;
    }, []);

    useEffect(() => {
        if (!loaded.current) return;
        const id = setTimeout(() => writeStore({ text, view, name }), 500);
        return () => clearTimeout(id);
    }, [text, view, name]);

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

    // Turn Mermaid placeholders into SVG diagrams (Mermaid loads only when a diagram exists)
    useEffect(() => {
        const root = previewRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(".mv-mermaid"));
        if (!nodes.length) return;
        let cancelled = false;
        (async () => {
            const mermaid = (await import("mermaid")).default;
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default" });
            for (const el of nodes) {
                const src = el.getAttribute("data-src") ?? "";
                const id = `mv-m-${++mermaidSeq}`;
                try {
                    const { svg } = await mermaid.render(id, src);
                    if (!cancelled) el.innerHTML = svg;
                } catch (e) {
                    document.getElementById(`d${id}`)?.remove();
                    document.getElementById(id)?.remove();
                    if (!cancelled) {
                        const pre = document.createElement("pre");
                        pre.className = "mv-err";
                        pre.textContent = `Diagram error: ${e instanceof Error ? e.message.slice(0, 200) : "invalid syntax"}`;
                        el.replaceChildren(pre);
                    }
                }
            }
        })();
        return () => { cancelled = true; };
    }, [html, dark]);

    const hasText = text.length > 0;
    const base = (name.replace(/\.[^.]+$/, "") || "markdown").replace(/[^\w.-]+/g, "-");
    const title = (/^#\s+(.+)$/m.exec(text)?.[1] ?? name) || "Markdown document";

    const flash = (k: string) => {
        setCopied(k);
        setTimeout(() => setCopied((c) => (c === k ? "" : c)), 1500);
    };
    const label = (k: string, idle: string) => (copied === k ? "Copied ✓" : idle);

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

    const copyText = async (k: string, v: string) => {
        if (v && (await writeClipboard(v))) flash(k);
    };

    const renderedHtml = () => previewRef.current?.innerHTML ?? "";

    const copyRich = async () => {
        const h = renderedHtml();
        if (!h) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": new Blob([h], { type: "text/html" }),
                    "text/plain": new Blob([text], { type: "text/plain" }),
                }),
            ]);
            flash("rich");
        } catch {
            const el = previewRef.current;
            if (!el) return;
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            try { if (document.execCommand("copy")) flash("rich"); } catch { /* ignore */ }
            sel?.removeAllRanges();
        }
    };

    const downloadHtml = () => {
        if (!engine) return;
        save(`${base}.html`, engine.buildHtmlDocument(renderedHtml(), title), "text/html;charset=utf-8");
    };

    /** Prints only the rendered document (in a hidden frame), so no site elements end up in the PDF. */
    const downloadPdf = () => {
        if (!engine) return;
        const frame = document.createElement("iframe");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        frame.srcdoc = engine.buildHtmlDocument(renderedHtml(), title);
        frame.onload = () => {
            const w = frame.contentWindow;
            if (!w) return;
            w.focus();
            w.print();
            setTimeout(() => frame.remove(), 60000);
        };
        document.body.appendChild(frame);
    };

    const clearAll = () => { setText(""); setName(""); setMsg(null); };

    const writeOff = view === "preview";
    const previewOff = view === "write";

    return (
        <div className="tl-tool">
            <section className="mv-card" aria-label="Markdown viewer">
                <div className="mv-bar">
                    <div className="mv-seg" role="group" aria-label="View">
                        {(["split", "write", "preview"] as View[]).map((v) => (
                            <button key={v} type="button" className={view === v ? "is-on" : ""} aria-pressed={view === v} onClick={() => setView(v)}>
                                {v === "split" ? "Split" : v === "write" ? "Write" : "Preview"}
                            </button>
                        ))}
                    </div>
                    <span className="mv-private">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                        Runs on your device. Files are never uploaded.
                    </span>
                </div>

                <div className={`mv-panes mv-panes--${view}`}>
                    {/* ---------- Editor ---------- */}
                    <div
                        className={`mv-pane${writeOff ? " is-off" : ""}${drag ? " is-drag" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); void loadFile(e.dataTransfer.files?.[0]); }}
                    >
                        <div className="mv-head">
                            <label htmlFor="mv-in" className="mv-label">Markdown{name && <span className="mv-file"> · {name}</span>}</label>
                            <div className="mv-actions">
                                <button type="button" className="tl-btn mv-up" onClick={() => fileRef.current?.click()}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
                                    Upload .md
                                </button>
                                <button type="button" className="tl-btn" onClick={onPaste}>Paste</button>
                                <button type="button" className="tl-btn" onClick={() => { setText(SAMPLE); setName(""); }}>Sample</button>
                                <button type="button" className="tl-btn" onClick={() => copyText("md", text)} disabled={!hasText}>{label("md", "Copy")}</button>
                                <button type="button" className="tl-btn" onClick={clearAll} disabled={!hasText}>Clear</button>
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept={ACCEPT}
                                hidden
                                onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }}
                            />
                        </div>
                        <textarea
                            id="mv-in"
                            className="mv-textarea"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste Markdown here, or drop a .md file…"
                            spellCheck={false}
                        />
                        {drag && <div className="mv-drop">Drop file to load</div>}
                    </div>

                    {/* ---------- Preview ---------- */}
                    <div className={`mv-pane${previewOff ? " is-off" : ""}`}>
                        <div className="mv-head">
                            <span className="mv-label">Preview{hasText && <span className="mv-file"> · {fmt(stats.words)} words</span>}</span>
                            <div className="mv-actions">
                                <button type="button" className="tl-btn" onClick={() => copyText("html", renderedHtml())} disabled={!html}>{label("html", "Copy HTML")}</button>
                                <button type="button" className="tl-btn" onClick={copyRich} disabled={!html}>{label("rich", "Copy formatted")}</button>
                                <button type="button" className="tl-btn" onClick={downloadHtml} disabled={!html}>Download HTML</button>
                                <button type="button" className="tl-btn" onClick={downloadPdf} disabled={!html}>Download PDF</button>
                            </div>
                        </div>
                        <div className="mv-print mv-prev">
                            {!hasText ? (
                                <p className="mv-empty">Paste Markdown, upload a .md file, or try the Sample to see the preview here.</p>
                            ) : !engine ? (
                                <p className="mv-empty">Loading preview…</p>
                            ) : (
                                <article ref={previewRef} className="mv-md" dangerouslySetInnerHTML={{ __html: html }} />
                            )}
                        </div>
                    </div>
                </div>

                {msg && <p className={`mv-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</p>}
                <p className="mv-note">Download PDF opens your print dialog. Choose “Save as PDF” as the printer.</p>
            </section>
        </div>
    );
}