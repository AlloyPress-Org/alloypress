"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
    MAX_SHARE_CODE,
    collapseRows,
    decodeShare,
    diffTexts,
    encodeShare,
    splitLines,
    toUnified,
    type DiffOptions,
    type DisplayRow,
    type Row,
    type Side,
} from "@/lib/tools/diff";
import { readFileText } from "@/lib/tools/fileText";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:text-diff:v1";
const ACCEPT = ".txt,.md,.csv,.tsv,.json,.xml,.html,.htm,.css,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.sql,.yml,.yaml,.log,.ini,.cfg,.env,.sh,.rtf,.docx,text/*";

const SAMPLE_A = [
    "Our team meets every Monday at 10 AM.",
    "Please send your weekly report before the meeting.",
    "The office is closed on Friday.",
    "Thanks for your hard work.",
].join("\n");
const SAMPLE_B = [
    "Our team meets every Tuesday at 10 AM.",
    "Please send your weekly report before the meeting.",
    "The office is open on Friday.",
    "Thanks for your hard work, everyone.",
    "See you soon!",
].join("\n");

type View = "split" | "unified";
type Saved = { a: string; b: string; opts: DiffOptions; view: View; lineNumbers: boolean; onlyChanges: boolean };
type Msg = { ok: boolean; text: string } | null;

function readStore(): Saved | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeStore(value: Saved) {
    try {
        if (!value.a && !value.b) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        /* storage can be blocked or full: ignore */
    }
}

const delta = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : "0");

function text(s?: Side) {
    if (!s) return null;
    if (!s.parts) return s.text || "\u00A0";
    return s.parts.map((p, i) => (p.changed ? <mark key={i} className="tc-w">{p.text}</mark> : <span key={i}>{p.text}</span>));
}

async function writeClipboard(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = value;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
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

export default function TextDiff() {
    const [a, setA] = useState("");
    const [b, setB] = useState("");
    const [opts, setOpts] = useState<DiffOptions>({ ignoreCase: false, ignoreWhitespace: false });
    const [view, setView] = useState<View>("split");
    const [lineNumbers, setLineNumbers] = useState(true);
    const [onlyChanges, setOnlyChanges] = useState(false);
    const [cur, setCur] = useState<number | null>(null);
    const [share, setShare] = useState<Msg>(null);
    const [fileMsg, setFileMsg] = useState<Msg>(null);
    const [banner, setBanner] = useState("");
    const [copied, setCopied] = useState("");
    const [drag, setDrag] = useState<"a" | "b" | "">("");
    const loaded = useRef(false);
    const fromShare = useRef(false);
    const fileA = useRef<HTMLInputElement>(null);
    const fileB = useRef<HTMLInputElement>(null);

    // Restore after mount: a shared link wins over saved state
    useEffect(() => {
        let alive = true;
        (async () => {
            const hash = window.location.hash;
            if (hash.startsWith("#d=")) {
                const s = await decodeShare(hash.slice(3));
                if (s && alive) {
                    fromShare.current = true;
                    setA(s.a);
                    setB(s.b);
                    setOpts({ ignoreCase: s.ic, ignoreWhitespace: s.iw });
                    setBanner("Loaded from a shared link. Edit the texts freely, the link itself does not change.");
                    loaded.current = true;
                    setTimeout(() => document.getElementById("tc-result")?.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
                    return;
                }
            }
            const saved = readStore();
            if (saved && alive) {
                setA(saved.a ?? "");
                setB(saved.b ?? "");
                if (saved.opts) setOpts({ ignoreCase: !!saved.opts.ignoreCase, ignoreWhitespace: !!saved.opts.ignoreWhitespace });
                if (saved.view === "split" || saved.view === "unified") setView(saved.view);
                else if (window.innerWidth < 700) setView("unified");
                if (typeof saved.lineNumbers === "boolean") setLineNumbers(saved.lineNumbers);
                if (typeof saved.onlyChanges === "boolean") setOnlyChanges(saved.onlyChanges);
            } else if (window.innerWidth < 700) setView("unified"); // split view is too tight on phones
            loaded.current = true;
        })();
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!loaded.current || fromShare.current) return;
        const id = setTimeout(() => writeStore({ a, b, opts, view, lineNumbers, onlyChanges }), 400);
        return () => clearTimeout(id);
    }, [a, b, opts, view, lineNumbers, onlyChanges]);

    // Keep typing smooth on very long text
    const da = useDeferredValue(a);
    const db = useDeferredValue(b);
    const diff = useMemo(() => diffTexts(da, db, opts), [da, db, opts]);
    const rows: DisplayRow[] = useMemo(() => (onlyChanges ? collapseRows(diff.rows, 2) : diff.rows), [diff, onlyChanges]);
    const sa = useMemo(() => analyzeText(da), [da]);
    const sb = useMemo(() => analyzeText(db), [db]);
    const linesA = useMemo(() => splitLines(da).length, [da]);
    const linesB = useMemo(() => splitLines(db).length, [db]);
    useEffect(() => setCur(null), [diff]);

    const hasBoth = a.length > 0 && b.length > 0;
    const hasAny = a.length > 0 || b.length > 0;

    const edit = (setter: (v: string) => void) => (v: string) => {
        fromShare.current = false;
        setBanner("");
        setShare(null);
        setter(v);
    };
    const editA = edit(setA);
    const editB = edit(setB);

    const pasteInto = (setter: (v: string) => void) => async () => {
        try {
            const clip = await navigator.clipboard.readText();
            if (clip) setter(clip);
        } catch {
            /* permission denied: user can paste with Ctrl/Cmd+V */
        }
    };

    const loadFile = (setter: (v: string) => void) => async (f?: File | null) => {
        if (!f) return;
        try {
            const t = await readFileText(f);
            setter(t);
            setFileMsg({ ok: true, text: `Loaded “${f.name}” (${fmt(t.length)} characters, ${fmt(splitLines(t).length)} lines).` });
        } catch (e) {
            setFileMsg({ ok: false, text: e instanceof Error ? e.message : "Could not read this file." });
        }
    };
    const loadA = loadFile(editA);
    const loadB = loadFile(editB);

    const onPick = (load: (f?: File | null) => Promise<void>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        void load(e.target.files?.[0]);
        e.target.value = ""; // allow picking the same file again
    };
    const onDrop = (side: "a" | "b") => (e: React.DragEvent) => {
        e.preventDefault();
        setDrag("");
        const f = e.dataTransfer.files?.[0];
        if (f) void (side === "a" ? loadA(f) : loadB(f));
    };
    const dragProps = (side: "a" | "b") => ({
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDrag(side); },
        onDragLeave: () => setDrag(""),
        onDrop: onDrop(side),
    });

    const copy = async (key: string, value: string) => {
        if (!value) return;
        if (await writeClipboard(value)) {
            setCopied(key);
            setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1500);
        }
    };
    const label = (key: string, idle: string) => (copied === key ? "Copied ✓" : idle);

    const cellCopy = (side: Side | undefined, key: string) =>
        side ? (
            <button
                type="button"
                className="tc-cp"
                title="Copy line"
                aria-label="Copy this line"
                onClick={(e) => { e.stopPropagation(); void copy(key, side.text); }}
            >
                {copied === key ? "✓" : "⧉"}
            </button>
        ) : null;

    const swap = () => { editA(b); editB(a); };
    const clearAll = () => { editA(""); editB(""); setFileMsg(null); };
    const sample = () => { editA(SAMPLE_A); editB(SAMPLE_B); };
    const toggle = (k: keyof DiffOptions) => setOpts((o) => ({ ...o, [k]: !o[k] }));

    const go = (dir: 1 | -1) => {
        if (!diff.hunks) return;
        const next = cur === null ? (dir === 1 ? 0 : diff.hunks - 1) : (cur + dir + diff.hunks) % diff.hunks;
        setCur(next);
        document.getElementById(`tc-h-${next}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    };

    const copyLink = async () => {
        const code = await encodeShare({ a, b, ic: opts.ignoreCase, iw: opts.ignoreWhitespace });
        if (code.length > MAX_SHARE_CODE) {
            setShare({ ok: false, text: "These texts are too long to fit in a link. Use Copy diff or Download instead." });
            return;
        }
        const url = `${window.location.origin}${window.location.pathname}#d=${code}`;
        if (await writeClipboard(url)) setShare({ ok: true, text: "Link copied. It contains your two texts, so only send it to people who should read them." });
        else setShare({ ok: false, text: `Could not copy automatically. Copy this link: ${url}` });
    };

    const download = () => {
        const url = URL.createObjectURL(new Blob([toUnified(diff.rows)], { type: "text/plain;charset=utf-8" }));
        const el = document.createElement("a");
        el.href = url;
        el.download = "alloypress-diff.txt";
        el.click();
        URL.revokeObjectURL(url);
    };

    const rowProps = (r: Row) => ({
        id: r.first ? `tc-h-${r.hunk}` : undefined,
        cur: r.hunk !== undefined && r.hunk === cur,
    });

    const splitRow = (r: DisplayRow, i: number) => {
        if (r.kind === "skip") {
            return <tr key={i} className="tc-skip"><td colSpan={lineNumbers ? 4 : 2}>⋯ {fmt(r.count)} unchanged {r.count === 1 ? "line" : "lines"}</td></tr>;
        }
        const left = "left" in r ? r.left : undefined;
        const right = "right" in r ? r.right : undefined;
        const p = rowProps(r);
        return (
            <tr key={i} id={p.id} className={`tc-r tc-${r.kind}${p.cur ? " is-cur" : ""}`}>
                {lineNumbers && <td className="tc-ln">{left?.n}</td>}
                <td className={`tc-c tc-l${left ? "" : " is-empty"}`}>{text(left)}{cellCopy(left, `ln-${i}-l`)}</td>
                {lineNumbers && <td className="tc-ln">{right?.n}</td>}
                <td className={`tc-c tc-rt${right ? "" : " is-empty"}`}>{text(right)}{cellCopy(right, `ln-${i}-r`)}</td>
            </tr>
        );
    };

    const unifiedRows = (r: DisplayRow, i: number) => {
        if (r.kind === "skip") {
            return [<tr key={i} className="tc-skip"><td colSpan={lineNumbers ? 4 : 2}>⋯ {fmt(r.count)} unchanged {r.count === 1 ? "line" : "lines"}</td></tr>];
        }
        const p = rowProps(r);
        const cls = (extra: string) => `tc-r ${extra}${p.cur ? " is-cur" : ""}`;
        const line = (key: string, extra: string, sign: string, ln1: number | undefined, ln2: number | undefined, side: Side, id?: string) => (
            <tr key={key} id={id} className={cls(extra)}>
                {lineNumbers && <td className="tc-ln">{ln1}</td>}
                {lineNumbers && <td className="tc-ln">{ln2}</td>}
                <td className="tc-sign">{sign}</td>
                <td className="tc-c">{text(side)}{cellCopy(side, `ln-${key}`)}</td>
            </tr>
        );
        const out = [];
        if (r.kind === "eq") out.push(line(`${i}`, "tc-eq", "", r.left.n, r.right.n, r.left));
        if (r.kind === "del" || r.kind === "chg") out.push(line(`${i}d`, "tc-ud", "−", r.left.n, undefined, r.left, p.id));
        if (r.kind === "add" || r.kind === "chg") out.push(line(`${i}a`, "tc-ua", "+", undefined, r.right.n, r.right, r.kind === "add" ? p.id : undefined));
        return out;
    };

    const wordDelta = sb.words - sa.words;
    const charDelta = sb.characters - sa.characters;

    const pane = (side: "a" | "b") => {
        const isA = side === "a";
        const value = isA ? a : b;
        const edt = isA ? editA : editB;
        const ref = isA ? fileA : fileB;
        const load = isA ? loadA : loadB;
        return (
            <div className={`tc-pane${drag === side ? " is-drag" : ""}`} {...dragProps(side)}>
                <div className="tc-head">
                    <label htmlFor={`tc-${side}`} className="tc-label"><span className={`tc-dot ${isA ? "tc-dot--del" : "tc-dot--add"}`} />{isA ? "Original text" : "Changed text"}</label>
                    <div className="tc-actions">
                        <button type="button" className="tl-btn tc-up" onClick={() => ref.current?.click()}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
                            Upload file
                        </button>
                        <button type="button" className="tl-btn" onClick={pasteInto(edt)}>Paste</button>
                        <button type="button" className="tl-btn" onClick={() => copy(`in-${side}`, value)} disabled={!value}>{label(`in-${side}`, "Copy")}</button>
                        <button type="button" className="tl-btn" onClick={() => edt("")} disabled={!value}>Clear</button>
                    </div>
                    <input ref={ref} type="file" accept={ACCEPT} hidden onChange={onPick(load)} />
                </div>
                <textarea
                    id={`tc-${side}`}
                    className="tc-textarea"
                    value={value}
                    onChange={(e) => edt(e.target.value)}
                    placeholder={isA ? "Paste the original text here, or drop a file…" : "Paste the changed text here, or drop a file…"}
                    spellCheck={false}
                />
                {drag === side && <div className="tc-drop">Drop file to load</div>}
            </div>
        );
    };

    return (
        <div className="tl-tool">
            {banner && <div className="tc-banner" role="status">{banner}</div>}

            {/* ---------- 1. Inputs ---------- */}
            <div className="tc-card">
                <div className="tc-panes">
                    {pane("a")}
                    {pane("b")}
                </div>

                <div className="tc-bar">
                    <div className="tc-actions">
                        <button type="button" className="tl-btn" onClick={swap} disabled={!hasAny}>⇄ Swap</button>
                        <button type="button" className="tl-btn" onClick={clearAll} disabled={!hasAny}>Clear all</button>
                        <button type="button" className="tl-btn" onClick={sample}>Sample</button>
                        <button type="button" className="tl-btn" onClick={() => copy("both", `--- Original ---\n${a}\n\n--- Changed ---\n${b}`)} disabled={!hasAny}>{label("both", "Copy both")}</button>
                    </div>
                    <button type="button" className="tl-btn tl-btn--primary tc-share" onClick={copyLink} disabled={!hasBoth}>Copy share link</button>
                </div>
                {fileMsg && <p className={`tc-msg${fileMsg.ok ? " is-ok" : " is-bad"}`} role="status">{fileMsg.text}</p>}
                {share && <p className={`tc-msg${share.ok ? " is-ok" : " is-bad"}`} role="status">{share.text}</p>}

                <span className="tc-private">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                    Runs on your device. Files and text are never uploaded. Share links keep your text inside the link itself.
                </span>
            </div>

            {/* ---------- 2. Result ---------- */}
            <section className="tc-card" id="tc-result" aria-labelledby="tc-result-h">
                <div className="tc-toolbar">
                    <h2 id="tc-result-h" className="tc-h">Differences</h2>
                    <div className="tc-opts" role="group" aria-label="Compare options">
                        <button type="button" className={`tc-tog${opts.ignoreCase ? " is-on" : ""}`} aria-pressed={opts.ignoreCase} onClick={() => toggle("ignoreCase")}>Ignore case</button>
                        <button type="button" className={`tc-tog${opts.ignoreWhitespace ? " is-on" : ""}`} aria-pressed={opts.ignoreWhitespace} onClick={() => toggle("ignoreWhitespace")}>Ignore whitespace</button>
                        <button type="button" className={`tc-tog${lineNumbers ? " is-on" : ""}`} aria-pressed={lineNumbers} onClick={() => setLineNumbers((v) => !v)}>Line numbers</button>
                        <button type="button" className={`tc-tog${onlyChanges ? " is-on" : ""}`} aria-pressed={onlyChanges} onClick={() => setOnlyChanges((v) => !v)}>Only changes</button>
                    </div>
                    <div className="tc-seg" role="group" aria-label="View">
                        <button type="button" className={view === "split" ? "is-on" : ""} aria-pressed={view === "split"} onClick={() => setView("split")}>Split</button>
                        <button type="button" className={view === "unified" ? "is-on" : ""} aria-pressed={view === "unified"} onClick={() => setView("unified")}>Unified</button>
                    </div>
                </div>

                {hasAny ? (
                    <>
                        <div className="tc-summary" aria-live="polite">
                            <span className="tc-badge tc-badge--del">−{fmt(diff.removed)} removed</span>
                            <span className="tc-badge tc-badge--add">+{fmt(diff.added)} added</span>
                            <span className="tc-badge">Words {fmt(sa.words)} → {fmt(sb.words)} <b className={wordDelta > 0 ? "is-up" : wordDelta < 0 ? "is-down" : ""}>({delta(wordDelta)})</b></span>
                            <span className="tc-badge">Characters {fmt(sa.characters)} → {fmt(sb.characters)} <b className={charDelta > 0 ? "is-up" : charDelta < 0 ? "is-down" : ""}>({delta(charDelta)})</b></span>
                        </div>

                        <div className="tc-nav">
                            <div className="tc-actions">
                                <button type="button" className="tl-btn" onClick={() => go(-1)} disabled={!diff.hunks} aria-label="Previous change">↑ Prev</button>
                                <button type="button" className="tl-btn" onClick={() => go(1)} disabled={!diff.hunks} aria-label="Next change">↓ Next</button>
                                <span className="tl-small">{diff.hunks === 0 ? "No changes" : cur === null ? `${fmt(diff.hunks)} ${diff.hunks === 1 ? "change" : "changes"}` : `Change ${cur + 1} of ${fmt(diff.hunks)}`}</span>
                            </div>
                            <div className="tc-actions">
                                <button type="button" className="tl-btn" onClick={() => copy("diff", toUnified(diff.rows))} disabled={diff.identical}>{label("diff", "Copy diff")}</button>
                                <button type="button" className="tl-btn" onClick={() => copy("added", diff.rows.flatMap((r) => (r.kind === "add" || r.kind === "chg" ? [r.right.text] : [])).join("\n"))} disabled={!diff.added}>{label("added", "Copy added lines")}</button>
                                <button type="button" className="tl-btn" onClick={() => copy("removed", diff.rows.flatMap((r) => (r.kind === "del" || r.kind === "chg" ? [r.left.text] : [])).join("\n"))} disabled={!diff.removed}>{label("removed", "Copy removed lines")}</button>
                                <button type="button" className="tl-btn" onClick={download} disabled={diff.identical}>Download .txt</button>
                            </div>
                        </div>

                        <div className="tc-sides">
                            <div className="tc-side tc-side--del">
                                <span className="tc-side-t">−{fmt(diff.removed)} removals</span>
                                <span className="tc-side-n">{fmt(linesA)} {linesA === 1 ? "line" : "lines"}</span>
                                <button type="button" className="tl-btn" onClick={() => copy("res-a", a)} disabled={!a}>{label("res-a", "Copy")}</button>
                            </div>
                            <div className="tc-side tc-side--add">
                                <span className="tc-side-t">+{fmt(diff.added)} additions</span>
                                <span className="tc-side-n">{fmt(linesB)} {linesB === 1 ? "line" : "lines"}</span>
                                <button type="button" className="tl-btn" onClick={() => copy("res-b", b)} disabled={!b}>{label("res-b", "Copy")}</button>
                            </div>
                        </div>

                        {diff.approx && <p className="tc-msg is-bad">These texts are very different, so they are shown as one removed block and one added block.</p>}

                        {hasBoth && diff.identical ? (
                            <p className="tc-same">No differences found{opts.ignoreCase || opts.ignoreWhitespace ? " with these options" : ""}. The two texts match.</p>
                        ) : (
                            <div className="tc-scroll">
                                <table className={`tc-table tc-table--${view}${lineNumbers ? "" : " no-ln"}`}>
                                    <tbody>{rows.flatMap((r, i) => (view === "split" ? [splitRow(r, i)] : unifiedRows(r, i)))}</tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="tc-empty">Paste text or upload a file in both boxes, or try the Sample, to see what changed. Removed text is red, added text is green.</p>
                )}
            </section>
        </div>
    );
}