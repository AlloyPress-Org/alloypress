"use client";

import "../markdown-viewer/markdown-viewer.css";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { readFileText } from "@/lib/tools/fileText";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:markdown-to-pdf:v1";
const MAX_SAVED_CHARS = 200_000;
const ACCEPT = ".md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain";

type Engine = typeof import("@/lib/tools/markdown");
type Opts = import("@/lib/tools/markdown").PdfOptions;
type Menu = "" | "set" | "tpl";
type Preset = { id: string; label: string; opts: Partial<Opts>; sample: string };

class UserError extends Error { }

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

const README = `# Project Atlas

A small API for tracking tasks.

## Install

\`\`\`bash
npm install
npm run dev
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

Full-stack developer · alex@example.com · Austin, TX

## Summary

Developer with 3 years of experience building fast web apps with React, TypeScript and Node.js.

## Experience

### Frontend Developer, Brightwave
*2024 – Present*

- Built a design system used by 4 product teams.
- Cut page load time by 38% with code splitting and caching.

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

## Undo

- \`git restore file\` discards changes
- \`git reset --soft HEAD~1\` undoes the last commit
`;

const PRESETS: Preset[] = [
    { id: "ai", label: "AI notes", opts: { margin: "normal", font: "medium", family: "sans", pageNumbers: true }, sample: SAMPLE },
    { id: "docs", label: "README / docs", opts: { margin: "normal", font: "medium", family: "sans", pageNumbers: true }, sample: README },
    { id: "resume", label: "Resume", opts: { margin: "narrow", font: "small", family: "sans", pageNumbers: false, header: "", footer: "" }, sample: RESUME },
    { id: "sheet", label: "Cheat sheet", opts: { margin: "narrow", font: "small", family: "sans", pageNumbers: true }, sample: SHEET },
    { id: "study", label: "Study notes", opts: { margin: "wide", font: "large", family: "serif", pageNumbers: true }, sample: SAMPLE },
];

const DEFAULTS: Opts = { size: "letter", margin: "normal", font: "medium", family: "sans", pageNumbers: true, header: "", footer: "" };

type Saved = { text: string; name: string; opts: Opts };

let mermaidSeq = 0;

function preventMermaidBlockStringifyCrash(): void {
    const html = document.documentElement;
    if (Object.prototype.hasOwnProperty.call(html, "toJSON")) return;
    Object.defineProperty(html, "toJSON", { value: () => ({}), configurable: true });
}

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
        return;
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

const latin = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");

const ascii = (s: string) =>
    latin(
        s
            .replace(/[\u2010-\u2015\u2212]/g, "-")
            .replace(/[\u2018\u2019\u201A]/g, "'")
            .replace(/[\u201C\u201D\u201E]/g, '"')
            .replace(/\u2026/g, "...")
            .replace(/[\u2022\u25CF\u25AA]/g, "-"),
    );

type PdfWord = { s: string; x: number; y: number; fs: number; b: boolean; m: boolean };

function collectWords(doc: Document, body: HTMLElement): PdfWord[] {
    const view = doc.defaultView;
    if (!view) return [];
    const sx = view.scrollX || 0;
    const sy = view.scrollY || 0;
    const words: PdfWord[] = [];
    const cache = new Map<Element, { fs: number; b: boolean; m: boolean }>();

    const styleOf = (el: Element) => {
        let v = cache.get(el);
        if (v) return v;
        const cs = view.getComputedStyle(el);
        v = {
            fs: parseFloat(cs.fontSize) || 15,
            b: Number(cs.fontWeight) >= 600 || cs.fontWeight === "bold",
            m: !!el.closest("pre, code, kbd, samp") || /mono|courier|consolas|menlo/i.test(cs.fontFamily),
        };
        cache.set(el, v);
        return v;
    };

    const range = doc.createRange();
    const push = (s: string, node: Node, start: number, end: number, par: Element, xShift = 0) => {
        range.setStart(node, start);
        range.setEnd(node, end);
        const r = range.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const st = styleOf(par);
        words.push({
            s,
            x: r.left + sx - xShift,
            y: r.bottom + sy - r.height * 0.22,
            fs: st.fs,
            b: st.b,
            m: st.m,
        });
    };

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.nodeValue ?? "";
        const par = n.parentElement;
        if (!par || !t.trim() || /^(SCRIPT|STYLE)$/.test(par.tagName)) continue;
        for (const m of t.matchAll(/\S+/g)) {
            const i = m.index ?? 0;
            push(m[0], n, i, i + m[0].length, par);
        }
    }

    body.querySelectorAll("li").forEach((li) => {
        const w = doc.createTreeWalker(li, NodeFilter.SHOW_TEXT);
        let first: Node | null = null;
        for (let n = w.nextNode(); n; n = w.nextNode()) {
            if ((n.nodeValue ?? "").trim()) { first = n; break; }
        }
        const par = first?.parentElement;
        if (!first || !par) return;
        const lead = (first.nodeValue ?? "").length - (first.nodeValue ?? "").trimStart().length;
        const parent = li.parentElement;
        const ordered = parent?.tagName === "OL";
        const idx = parent ? Array.from(parent.children).indexOf(li) + (Number(parent.getAttribute("start")) || 1) : 1;
        const fs = styleOf(par).fs;
        const before = words.length;
        push(ordered ? `${idx}.` : "-", first, lead, lead + 1, par, fs * 1.1);
        if (words.length > before) words[words.length - 1].m = false;
    });

    return words;
}

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
    const [preset, setPreset] = useState("");
    const [engine, setEngine] = useState<Engine | null>(null);
    const [extrasV, setExtrasV] = useState(0);
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

    useEffect(() => {
        if (!engine) return;
        let alive = true;
        engine.loadExtras(deferred).then(
            (changed) => alive && setExtrasV((v) => (changed || v === 0 ? v + 1 : v)),
            () => alive && setExtrasV((v) => (v === 0 ? 1 : v)),
        );
        return () => { alive = false; };
    }, [engine, deferred]);

    const [mathCss, setMathCss] = useState(false);
    const needsMath = deferred.includes("$");
    useEffect(() => {
        if (!needsMath || mathCss) return;
        let alive = true;
        // @ts-ignore
        import("katex/dist/katex.min.css").then(() => alive && setMathCss(true), () => alive && setMathCss(true));
        return () => { alive = false; };
    }, [needsMath, mathCss]);

    const html = useMemo(() => {
        if (!engine || !deferred) return "";
        if (extrasV === 0) return "";
        if (needsMath && !mathCss) return "";
        try {
            return engine.renderMarkdown(deferred);
        } catch {
            return "<p>Could not render this Markdown.</p>";
        }
    }, [engine, deferred, needsMath, mathCss, extrasV]);
    const stats = useMemo(() => analyzeText(deferred), [deferred]);
    const lineCount = useMemo(() => (text ? text.split("\n").length : 0), [text]);

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
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "default", flowchart: { htmlLabels: false, useMaxWidth: true } });

            for (const el of nodes) {
                if (cancelled) return;
                const src = srcOf(el);
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
    const heading = (/^#{1,2}\s+(.+)$/m.exec(text)?.[1] ?? "").replace(/[*_`#[\]]/g, "").trim();
    const slug = heading.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
    const base = slug || (name.replace(/\.[^.]+$/, "") || "markdown").replace(/[^\w.-]+/g, "-");
    const title = heading || name || "Markdown document";
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
        setMenu("");
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
            return;
        }
    };

    const renderedHtml = () => previewRef.current?.innerHTML ?? "";

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
            const contentW = pageW - mm * 2;
            const contentH = pageH - top - bottom;
            const contentPx = Math.round((contentW / 25.4) * 96);

            frame = document.createElement("iframe");
            frame.setAttribute("aria-hidden", "true");
            frame.setAttribute("sandbox", "allow-same-origin");
            frame.tabIndex = -1;
            frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${contentPx}px;height:1200px;border:0;`;
            const ready = new Promise<void>((resolve) => { frame!.onload = () => resolve(); });
            frame.srcdoc = engine.buildPdfDocument(renderedHtml(), outName, opts);
            document.body.appendChild(frame);
            await ready;

            const doc = frame.contentDocument;
            if (!doc) throw new Error("frame");
            try { await doc.fonts?.ready; } catch { void 0; }
            const body = doc.body;
            const view = doc.defaultView;
            if (!view) throw new Error("frame");
            const docH = Math.ceil(Math.max(doc.documentElement.scrollHeight, body.scrollHeight));
            frame.style.height = `${docH}px`;

            const kpx = contentW / contentPx;
            const PT = 72 / 25.4;
            const pageHpx = Math.floor(contentH / kpx);
            const scale = 2;
            if (Math.ceil(docH / pageHpx) > 250) throw new UserError("This document is too long to save directly. Use Print, or split it into parts.");

            const sy = view.scrollY || 0;
            const rectOf = (el: Element) => {
                const r = el.getBoundingClientRect();
                return { top: r.top + sy, bottom: r.bottom + sy };
            };
            const root = body.querySelector<HTMLElement>(".md") ?? body;

            const atoms = Array.from(root.querySelectorAll<HTMLElement>(":scope > *:not(ul):not(ol):not(table), li, tr, pre"))
                .map(rectOf)
                .filter((a) => a.bottom - a.top > 1 && a.bottom - a.top <= pageHpx);
            const heads = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6")).map(rectOf);
            const bigPre = Array.from(root.querySelectorAll<HTMLElement>("pre"))
                .map((el) => {
                    const cs = view.getComputedStyle(el);
                    return { ...rectOf(el), lh: parseFloat(cs.lineHeight), pad: parseFloat(cs.paddingTop) || 0 };
                })
                .filter((p) => p.bottom - p.top > pageHpx && p.lh > 0);

            const slices: [number, number][] = [];
            let y = 0;
            while (docH - y > 6) {
                let end = Math.min(y + pageHpx, docH);
                if (end < docH) {
                    const minTop = y + pageHpx * 0.15;
                    for (let pass = 0; pass < 4; pass++) {
                        const hit = atoms.filter((a) => a.top < end && a.bottom > end && a.top > minTop).sort((p, q) => p.top - q.top)[0];
                        if (!hit) break;
                        end = Math.floor(hit.top);
                    }
                    const lead = heads.filter((h) => h.top > minTop && h.bottom <= end + 1 && h.bottom > end - 48).sort((p, q) => p.top - q.top)[0];
                    if (lead) end = Math.floor(lead.top);
                    const pre = bigPre.find((p) => p.top < end && p.bottom > end);
                    if (pre) {
                        const snapped = pre.top + pre.pad + Math.floor((end - pre.top - pre.pad) / pre.lh) * pre.lh;
                        if (snapped > y + pageHpx * 0.3) end = Math.floor(snapped);
                    }
                }
                if (end <= y) end = Math.min(y + pageHpx, docH);
                slices.push([y, end]);
                y = end;
            }

            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

            const words = collectWords(doc, body);

            const pdf = new jsPDF({ unit: "mm", format: opts.size === "a4" ? "a4" : "letter", orientation: "portrait", compress: true });
            pdf.setProperties({ title: outName });
            const total = slices.length;

            const maxCanvasH = Math.floor(Math.min(16000, 14_000_000 / (contentPx * scale)));
            let gi = 0;
            while (gi < total) {
                let gj = gi;
                while (gj + 1 < total && (slices[gj + 1][1] - slices[gi][0]) * scale <= maxCanvasH) gj++;
                const gFrom = slices[gi][0];
                const gTo = slices[gj][1];
                const canvas = await html2canvas(body, {
                    scale,
                    x: 0,
                    y: gFrom,
                    width: contentPx,
                    height: gTo - gFrom,
                    windowWidth: contentPx,
                    windowHeight: docH,
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    logging: false,
                });

                for (let n = gi; n <= gj; n++) {
                    const [from, to] = slices[n];
                    const sY = Math.round((from - gFrom) * scale);
                    const sH = Math.max(1, Math.min(Math.round((to - from) * scale), canvas.height - sY));
                    const piece = document.createElement("canvas");
                    piece.width = canvas.width;
                    piece.height = sH;
                    const ctx = piece.getContext("2d");
                    if (!ctx) throw new Error("canvas");
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, piece.width, piece.height);
                    ctx.drawImage(canvas, 0, sY, canvas.width, sH, 0, 0, canvas.width, sH);

                    if (n) pdf.addPage();
                    pdf.addImage(piece.toDataURL("image/jpeg", 0.92), "JPEG", mm, top, contentW, (sH / scale) * kpx);

                    pdf.setFontSize(9);
                    pdf.setTextColor(107, 114, 128);
                    if (hdr) pdf.text(hdr, pageW / 2, Math.max(7, mm * 0.6), { align: "center", renderingMode: "fill" });
                    const foot = [ftr, opts.pageNumbers ? `Page ${n + 1} of ${total}` : ""].filter(Boolean).join("  ·  ");
                    if (foot) pdf.text(foot, pageW / 2, pageH - Math.max(6, mm * 0.5), { align: "center", renderingMode: "fill" });

                    for (const w of words) {
                        const yc = w.y - w.fs * 0.3;
                        if (yc < from || yc >= to) continue;
                        const txt = ascii(w.s);
                        if (!txt.trim()) continue;
                        pdf.setFont(w.m ? "courier" : "helvetica", w.b ? "bold" : "normal");
                        pdf.setFontSize(w.fs * kpx * PT);
                        pdf.text(`${txt} `, mm + w.x * kpx, top + (w.y - from) * kpx, { renderingMode: "invisible" });
                    }
                }
                gi = gj + 1;
            }
            pdf.save(`${outName}.pdf`);
        } catch (e) {
            setMsg({ ok: false, text: e instanceof UserError ? e.message : "Could not create the PDF. Try Print, or a shorter document." });
        } finally {
            frame?.remove();
            setBusy(false);
        }
    };

    const printPdf = () => {
        if (!engine || !html) return;
        const frame = document.createElement("iframe");
        frame.setAttribute("sandbox", "allow-same-origin allow-modals");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        frame.srcdoc = engine.buildPdfDocument(renderedHtml(), outName, opts);
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

    const showHdr = hdrOn || opts.header !== "";
    const showFtr = ftrOn || opts.footer !== "";
    const toggle = (m: Menu) => setMenu((c) => (c === m ? "" : m));

    return (
        <div className="tl-tool">
            <section className="mv-card mp-card" aria-label="Markdown to PDF">
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
                        <div className="mp-menu">
                            <button type="button" className={`mp-trig${menu === "tpl" ? " is-open" : ""}`} aria-haspopup="listbox" aria-expanded={menu === "tpl"} onClick={() => toggle("tpl")}>
                                <Svg icon="sample" size={17} />
                                <span className="mp-trig-t">
                                    <small>Templates</small>
                                    <b>{PRESETS.find((p) => p.id === preset)?.label ?? "Choose template"}</b>
                                </span>
                                <Svg icon="chevron" size={16} />
                            </button>
                            {menu === "tpl" && (
                                <div className="mp-pop mp-pop--list" role="listbox" aria-label="Templates">
                                    <p className="mp-pop-h">Templates</p>
                                    {PRESETS.map((p) => (
                                        <button key={p.id} type="button" role="option" aria-selected={preset === p.id} className={`mp-item${preset === p.id ? " is-on" : ""}`} onClick={() => pickPreset(p)}>
                                            <span className="mp-item-t"><b>{p.label}</b></span>
                                            {preset === p.id && <Svg icon="check" size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="button" className="tl-btn tl-btn--primary mp-dl" onClick={() => void downloadPdf()} disabled={!html || busy} aria-busy={busy}>
                        <Svg icon="download" sw={2.2} />
                        {busy ? "Making PDF…" : "Download PDF"}
                    </button>
                </div>

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
                <p className="mv-note">Download PDF saves the file straight away. Each page is drawn as an image with a hidden text layer, so the text can be searched and read by the PDF to Markdown tool. Use Print for fully native text.</p>
            </section>
        </div>
    );
}