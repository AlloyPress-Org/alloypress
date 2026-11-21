"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

/** Wait for the browser to be idle, so the Mermaid chunk never competes with first paint. */
const idle = () =>
    new Promise<void>((resolve) => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 1500 });
        else setTimeout(resolve, 200);
    });

/**
 * Fix Mermaid block-beta circular JSON error in React.
 *
 * React attaches circular Fiber references to DOM elements.
 * Mermaid's block layout tries to JSON.stringify a DOM reference.
 */
function preventMermaidBlockStringifyCrash(): void {
    const html = document.documentElement;

    if (Object.prototype.hasOwnProperty.call(html, "toJSON")) {
        return;
    }

    Object.defineProperty(html, "toJSON", {
        value: () => ({}),
        configurable: true,
    });
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

/* ---------- icons ---------- */
const ICONS: Record<string, ReactNode> = {
    upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
    paste: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" /></>,
    sample: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
    code: <><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /><path d="M14 4l-4 16" /></>,
    rich: <><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M9 19h6" /></>,
    download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
    clear: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

function IconBtn({ icon, label, text, onClick, disabled, done }: { icon: keyof typeof ICONS; label: string; text?: string; onClick: () => void; disabled?: boolean; done?: boolean }) {
    return (
        <button type="button" className={`mv-ic${done ? " is-ok" : ""}${text ? " mv-ic--txt" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {done ? ICONS.check : ICONS[icon]}
            </svg>
            {text && <span>{text}</span>}
        </button>
    );
}

export default function MarkdownViewer() {
    const [text, setText] = useState(SAMPLE); // pre-filled so the preview shows a table, diagram and math at once
    const [view, setView] = useState<View>("split");
    const [name, setName] = useState("");
    const [engine, setEngine] = useState<Engine | null>(null);
    const [extrasV, setExtrasV] = useState(0); // 0 = highlighter and KaTeX not checked yet; bumps when one finishes loading
    const [drag, setDrag] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [copied, setCopied] = useState("");
    const loaded = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);

    // Load the renderer in the browser only (marked, DOMPurify). highlight.js and KaTeX come later, only if needed.
    useEffect(() => {
        let alive = true;
        import("@/lib/tools/markdown").then((m) => alive && setEngine(m));
        return () => { alive = false; };
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
        if (extrasV === 0) return ""; // first render waits once for the highlighter and KaTeX, so nothing flashes unstyled
        if (needsMath && !mathCss) return ""; // wait for the stylesheet, so math never flashes unstyled
        try {
            return engine.renderMarkdown(deferred);
        } catch {
            return "<p>Could not render this Markdown.</p>";
        }
    }, [engine, deferred, needsMath, mathCss, extrasV]);
    const stats = useMemo(() => analyzeText(deferred), [deferred]);
    const lineCount = useMemo(() => (text ? text.split("\n").length : 0), [text]);

    // Turn Mermaid placeholders into SVG diagrams (Mermaid loads only when a diagram exists)
    useEffect(() => {
        const root = previewRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(".mv-mermaid"));
        if (!nodes.length) return;
        let cancelled = false;
        (async () => {
            await idle();
            if (cancelled) return;

            // If the Mermaid chunk cannot load (offline, blocked), show the diagram source instead of leaving blank boxes
            let mermaid: (typeof import("mermaid"))["default"];
            try {
                mermaid = (await import("mermaid")).default;
            } catch {
                if (cancelled) return;
                for (const el of nodes) {
                    const raw = el.getAttribute("data-src") ?? "";
                    let src = raw;
                    try { src = decodeURIComponent(raw); } catch { /* keep raw */ }
                    if (src.trim()) showDiagramFallback(el, "Diagrams could not be loaded. Check your connection and try again. Its source is shown instead.", src);
                }
                return;
            }

            if (cancelled) return;

            // Work around Mermaid's React block diagram serialization bug.
            preventMermaidBlockStringifyCrash();

            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                theme: "default",
                flowchart: {
                    htmlLabels: false,
                    useMaxWidth: true,
                },
            });
            for (const el of nodes) {
                if (cancelled) return;
                const raw = el.getAttribute("data-src") ?? "";
                let src = raw;
                try { src = decodeURIComponent(raw); } catch { /* keep raw */ }
                if (!src.trim()) {
                    el.textContent = "";
                    continue;
                }
                const id = `mv-m-${++mermaidSeq}`;
                try {
                    const { svg } = await mermaid.render(id, src);
                    if (!cancelled) el.innerHTML = svg;
                } catch (e) {
                    ["", "r"].forEach((s) => {
                        document.getElementById(`d${id}${s}`)?.remove();
                        document.getElementById(`${id}${s}`)?.remove();
                    });
                    if (!cancelled) {
                        const why = e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "invalid syntax";
                        const circular = /circular structure/i.test(why);
                        showDiagramFallback(
                            el,
                            circular ? "This diagram type could not be drawn in the browser. Its source is shown instead." : `Diagram error: ${why}`,
                            src,
                        );
                    }
                }
            }
        })();
        return () => { cancelled = true; };
    }, [html]);

    const hasText = text.length > 0;
    const base = (name.replace(/\.[^.]+$/, "") || "markdown").replace(/[^\w.-]+/g, "-");
    const title = (/^#\s+(.+)$/m.exec(text)?.[1] ?? name) || "Markdown document";

    const flash = (k: string) => {
        setCopied(k);
        setTimeout(() => setCopied((c) => (c === k ? "" : c)), 1500);
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
                    {/* ---------- Editor box ---------- */}
                    <div
                        className={`mv-box${writeOff ? " is-off" : ""}${drag ? " is-drag" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); void loadFile(e.dataTransfer.files?.[0]); }}
                    >
                        <textarea
                            id="mv-in"
                            aria-label="Markdown"
                            className="mv-textarea"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste Markdown here, or drop a .md file…"
                            spellCheck={false}
                        />
                        {drag && <div className="mv-drop">Drop file to load</div>}
                        <div className="mv-tools">
                            <div className="mv-icons" role="toolbar" aria-label="Markdown tools">
                                <IconBtn icon="upload" text="Upload" label="Upload .md file" onClick={() => fileRef.current?.click()} />
                                <IconBtn icon="paste" text="Paste" label="Paste from clipboard" onClick={onPaste} />
                                <IconBtn icon="sample" text="Sample" label="Load sample document (table, diagram, math)" onClick={() => { setText(SAMPLE); setName(""); }} />
                                <IconBtn icon="copy" label={copied === "md" ? "Copied" : "Copy Markdown"} onClick={() => copyText("md", text)} disabled={!hasText} done={copied === "md"} />
                                <IconBtn icon="clear" label="Clear the editor" onClick={clearAll} disabled={!hasText} />
                            </div>
                            <span className="mv-count">{name && <span className="mv-file">{name} · </span>}Lines: {fmt(lineCount)} | Words: {fmt(stats.words)}</span>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept={ACCEPT}
                            hidden
                            onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }}
                        />
                    </div>

                    {/* ---------- Preview box ---------- */}
                    <div className={`mv-box mv-box--prev${previewOff ? " is-off" : ""}`}>
                        <div className="mv-prev" aria-label="Preview">
                            {!hasText ? (
                                <p className="mv-empty">Paste Markdown, upload a .md file, or try the Sample to see the preview here.</p>
                            ) : !engine ? (
                                <p className="mv-empty">Loading preview…</p>
                            ) : (
                                <article ref={previewRef} className="mv-md" dangerouslySetInnerHTML={{ __html: html }} />
                            )}
                        </div>
                        <div className="mv-tools">
                            <div className="mv-icons" role="toolbar" aria-label="Preview tools">
                                <IconBtn icon="code" label={copied === "html" ? "Copied" : "Copy HTML"} onClick={() => copyText("html", renderedHtml())} disabled={!html} done={copied === "html"} />
                                <IconBtn icon="rich" label={copied === "rich" ? "Copied" : "Copy formatted (rich text)"} onClick={copyRich} disabled={!html} done={copied === "rich"} />
                                <span className="mv-sep" aria-hidden="true" />
                                <IconBtn icon="download" text="HTML" label="Download HTML" onClick={downloadHtml} disabled={!html} />
                                <IconBtn icon="download" text="PDF" label="Download PDF (opens print dialog)" onClick={downloadPdf} disabled={!html} />
                            </div>
                            <span className="mv-count">Preview</span>
                        </div>
                    </div>
                </div>

                {msg && <p className={`mv-msg${msg.ok ? " is-ok" : " is-bad"}`} role="status">{msg.text}</p>}
                <p className="mv-note">Download PDF opens your print dialog. Choose “Save as PDF” as the printer.</p>
            </section>
        </div>
    );
}