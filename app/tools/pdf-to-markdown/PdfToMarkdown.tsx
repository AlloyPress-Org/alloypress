"use client";

import "../markdown-viewer/markdown-viewer.css"; // shared box, toolbar and preview styles

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { DEFAULT_OPTS, MAX_BYTES, convertPdf, extractPdf, forAi, samplePdf, toPlain, type ConvOpts, type PdfData } from "@/lib/tools/pdfToMarkdown";
import { formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:pdf-to-markdown:v1";

type Engine = typeof import("@/lib/tools/markdown");
type Status = "idle" | "loading" | "ready" | "error";
type View = "md" | "preview";
type CopyKind = "" | "md" | "ai" | "plain";
type Info = { name: string; size: number; pages: number; total: number; truncated: boolean };

class UserError extends Error {}

function friendly(e: unknown): string {
    if (e instanceof UserError) return e.message;
    const name = e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
    if (name === "PasswordException") return "This PDF is password-protected. Remove the password and try again.";
    if (name === "InvalidPDFException") return "This file is not a valid PDF.";
    return "Could not read this PDF. Try another file.";
}

function readOpts(): Partial<ConvOpts> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
function writeOpts(o: ConvOpts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...o, range: "" }));
    } catch {
        /* storage blocked: ignore */
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

const ICONS: Record<string, ReactNode> = {
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
    download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
    clear: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    pdf: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h1.5a1.5 1.5 0 010 3H9v-3zM13.5 16v-3h1.5" /></>,
    upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
};

function Svg({ name, size = 18 }: { name: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[name]}
        </svg>
    );
}

function IconBtn({ icon, label, text, onClick, disabled, done }: { icon: string; label: string; text?: string; onClick: () => void; disabled?: boolean; done?: boolean }) {
    return (
        <button type="button" className={`mv-ic${done ? " is-ok" : ""}${text ? " mv-ic--txt" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
            <Svg name={done ? "check" : icon} />
            {text && <span>{text}</span>}
        </button>
    );
}

function Tog({ on, label, hint, onChange }: { on: boolean; label: string; hint: string; onChange: (v: boolean) => void }) {
    return (
        <label className={`pm-chk${on ? " is-on" : ""}`} title={hint}>
            <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function PdfToMarkdown() {
    const [data, setData] = useState<PdfData | null>(null);
    const [info, setInfo] = useState<Info | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [error, setError] = useState("");
    const [opts, setOpts] = useState<ConvOpts>(DEFAULT_OPTS);
    const [md, setMd] = useState("");
    const [view, setView] = useState<View>("md");
    const [engine, setEngine] = useState<Engine | null>(null);
    const [drag, setDrag] = useState(false);
    const [copied, setCopied] = useState<CopyKind>("");
    const loaded = useRef(false);
    const token = useRef(0);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const s = readOpts();
        if (s) setOpts({ ...DEFAULT_OPTS, ...s, range: "" });
        loaded.current = true;
    }, []);

    useEffect(() => {
        if (loaded.current) writeOpts(opts);
    }, [opts]);

    // The renderer (and anything it pulls in) is only needed for the Preview tab
    useEffect(() => {
        if (view !== "preview" || engine) return;
        let alive = true;
        import("@/lib/tools/markdown").then((m) => alive && setEngine(m));
        return () => { alive = false; };
    }, [view, engine]);

    const converted = useMemo(() => (data ? convertPdf(data, opts) : ""), [data, opts]);
    useEffect(() => setMd(converted), [converted]);

    const html = useMemo(() => {
        if (view !== "preview" || !engine || !md) return "";
        try {
            return engine.renderMarkdown(md);
        } catch {
            return "<p>Could not render this Markdown.</p>";
        }
    }, [view, engine, md]);

    const set = <K extends keyof ConvOpts>(k: K, v: ConvOpts[K]) => setOpts((o) => ({ ...o, [k]: v }));

    const openSample = () => {
        token.current++;
        const d = samplePdf();
        setError("");
        setData(d);
        setInfo({ name: "sample.pdf", size: 0, pages: d.pages.length, total: d.total, truncated: false });
        setView("md");
        setStatus("ready");
    };

    const open = async (f: File) => {
        const id = ++token.current;
        setError("");
        setStatus("loading");
        setProgress({ done: 0, total: 0 });
        try {
            if (f.size > MAX_BYTES) throw new UserError("This PDF is larger than 25 MB. Split it into parts and try again.");
            const buf = await f.arrayBuffer();
            const head = new TextDecoder("latin1").decode(new Uint8Array(buf.slice(0, 1024)));
            if (!head.includes("%PDF-")) throw new UserError("This file is not a PDF. Choose a .pdf file.");
            const d = await extractPdf(buf, (done, total) => { if (id === token.current) setProgress({ done, total }); });
            if (id !== token.current) return;
            setData(d);
            setInfo({ name: f.name, size: f.size, pages: d.pages.length, total: d.total, truncated: d.truncated });
            setView("md");
            setStatus("ready");
        } catch (e) {
            if (id !== token.current) return;
            setData(null);
            setInfo(null);
            setStatus("error");
            setError(friendly(e));
        }
    };

    const loadFile = (f?: File | null) => {
        if (f) void open(f);
    };

    const reset = () => {
        token.current++;
        setData(null);
        setInfo(null);
        setMd("");
        setError("");
        setStatus("idle");
    };

    const base = (info?.name.replace(/\.pdf$/i, "") || "document").replace(/[^\w.-]+/g, "-");
    const hasMd = md.trim().length > 0;
    // Image-only PDF: almost no text for the number of pages. Checked as soon as the file is read.
    const scanned = status === "ready" && !!data && data.chars < Math.max(40, (info?.pages ?? 1) * 10);
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    const words = useMemo(() => (md ? md.split(/\s+/).filter(Boolean).length : 0), [md]);
    const lineCount = useMemo(() => (md ? md.split("\n").length : 0), [md]);

    const copy = async (kind: Exclude<CopyKind, "">) => {
        if (!hasMd) return;
        const text = kind === "md" ? md : kind === "plain" ? toPlain(md) : forAi(md, info?.name ?? "document.pdf");
        if (await writeClipboard(text)) {
            setCopied(kind);
            setTimeout(() => setCopied(""), 1500);
        }
    };

    const downloadMd = () => {
        const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div className="tl-tool">
            <section className="mv-card pm-card" aria-label="PDF to Markdown">
                <div className="mv-bar">
                    <div className="mv-seg" role="group" aria-label="View">
                        <button type="button" className={view === "md" ? "is-on" : ""} aria-pressed={view === "md"} onClick={() => setView("md")}>Markdown</button>
                        <button type="button" className={view === "preview" ? "is-on" : ""} aria-pressed={view === "preview"} onClick={() => setView("preview")}>Preview</button>
                    </div>
                    <span className="mv-private">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                        Runs on your device. PDFs are never uploaded.
                    </span>
                </div>

                <div className="mv-panes mv-panes--split">
                    {/* ---------- left: PDF + options ---------- */}
                    <div
                        className={`mv-box pm-left${drag ? " is-drag" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); loadFile(e.dataTransfer.files?.[0]); }}
                    >
                        {info ? (
                            <div className="pm-file">
                                <span className="pm-file-ic"><Svg name="pdf" size={22} /></span>
                                <div className="pm-file-t">
                                    <b title={info.name}>{info.name}</b>
                                    <span>{fmt(info.pages)} {info.pages === 1 ? "page" : "pages"}{info.size ? ` · ${size(info.size)}` : " · sample"}</span>
                                </div>
                                <button type="button" className="tl-btn" onClick={() => fileRef.current?.click()}>Replace</button>
                                <button type="button" className="tl-btn" onClick={reset}>Remove</button>
                            </div>
                        ) : (
                            <>
                                <button type="button" className="pm-drop" onClick={() => fileRef.current?.click()} disabled={status === "loading"}>
                                    <span className="pm-drop-ic"><Svg name="upload" size={26} /></span>
                                    <b>{status === "loading" ? "Reading your PDF…" : "Drop a PDF here, or click to upload"}</b>
                                    <span>Text-based PDFs up to 25 MB. Nothing is uploaded.</span>
                                </button>
                                <div style={{ textAlign: "center", marginTop: 10 }}>
                                    <button type="button" className="tl-btn" onClick={openSample} disabled={status === "loading"}>
                                        Try a sample PDF
                                    </button>
                                </div>
                            </>
                        )}
                        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ""; }} />

                        {status === "loading" && (
                            <div className="pm-prog" role="status">
                                <div className="pm-bar"><span style={{ width: `${pct}%` }} /></div>
                                <span>{progress.total ? `Page ${progress.done} of ${progress.total}` : "Opening…"}</span>
                            </div>
                        )}
                        {error && <p className="pm-alert is-bad" role="alert">{error}</p>}
                        {scanned && (
                            <p className="pm-alert is-bad" role="alert">
                                This looks scanned (pictures of pages), so there is no text to read. We can’t read images yet. Run OCR on the file first, then upload it again.
                            </p>
                        )}
                        {info?.truncated && <p className="pm-alert" role="status">Only the first 300 of {fmt(info.total)} pages were read.</p>}

                        <div className="pm-opts">
                            <span className="pm-l">What to detect</span>
                            <div className="pm-togs">
                                <Tog on={opts.headings} label="Headings" hint="Find headings from larger font sizes" onChange={(v) => set("headings", v)} />
                                <Tog on={opts.tables} label="Tables" hint="Turn aligned columns into Markdown tables" onChange={(v) => set("tables", v)} />
                                <Tog on={opts.emphasis} label="Bold and italic" hint="Keep bold and italic text" onChange={(v) => set("emphasis", v)} />
                                <Tog on={opts.clean} label="Remove headers and footers" hint="Drop repeated headers, footers and page numbers" onChange={(v) => set("clean", v)} />
                                <Tog on={opts.twoCol} label="Two columns" hint="Read the left column, then the right column" onChange={(v) => set("twoCol", v)} />
                                <Tog on={opts.breaks} label="Page separators" hint="Add a line between pages" onChange={(v) => set("breaks", v)} />
                            </div>
                            <label className="pm-range">
                                <span className="pm-l">Pages</span>
                                <input type="text" value={opts.range} maxLength={40} placeholder="All pages, or 1-5, 8" onChange={(e) => set("range", e.target.value)} />
                            </label>
                        </div>
                    </div>

                    {/* ---------- right: Markdown output ---------- */}
                    <div className="mv-box mv-box--prev">
                        {view === "md" ? (
                            <textarea
                                aria-label="Markdown output"
                                className="mv-textarea"
                                value={md}
                                onChange={(e) => setMd(e.target.value)}
                                placeholder={
                                    scanned
                                        ? "Nothing to show. This PDF has no readable text (it looks scanned)."
                                        : status === "ready" && !hasMd
                                          ? "No text matched these settings."
                                          : "Your Markdown appears here. You can edit it before you copy or download."
                                }
                                spellCheck={false}
                            />
                        ) : (
                            <div className="mv-prev" aria-label="Preview">
                                {!hasMd ? (
                                    <p className="mv-empty">{scanned ? "This PDF has no readable text (it looks scanned)." : "Upload a PDF, or try the sample, to see the Markdown preview here."}</p>
                                ) : !engine ? (
                                    <p className="mv-empty">Loading preview…</p>
                                ) : (
                                    <article className="mv-md" dangerouslySetInnerHTML={{ __html: html }} />
                                )}
                            </div>
                        )}
                        <div className="mv-tools">
                            <div className="mv-icons" role="toolbar" aria-label="Output tools">
                                <IconBtn icon="copy" label={copied === "md" ? "Copied" : "Copy Markdown"} onClick={() => void copy("md")} disabled={!hasMd} done={copied === "md"} />
                                <IconBtn icon="copy" text={copied === "ai" ? "Copied" : "For AI"} label="Copy for ChatGPT or Claude (Markdown wrapped for a prompt)" onClick={() => void copy("ai")} disabled={!hasMd} done={copied === "ai"} />
                                <IconBtn icon="copy" text={copied === "plain" ? "Copied" : "Plain text"} label="Copy as plain text (no Markdown symbols)" onClick={() => void copy("plain")} disabled={!hasMd} done={copied === "plain"} />
                                <IconBtn icon="download" text=".md" label="Download .md file" onClick={downloadMd} disabled={!hasMd} />
                                <IconBtn icon="clear" label="Clear output" onClick={() => setMd("")} disabled={!hasMd} />
                            </div>
                            <span className="mv-count">Lines: {fmt(lineCount)} | Words: {fmt(words)}</span>
                        </div>
                    </div>
                </div>

                <p className="mv-note">Results depend on how the PDF was made. Check the output, especially tables, before you rely on it. Editing the output is lost if you change a setting.</p>
            </section>
        </div>
    );
}