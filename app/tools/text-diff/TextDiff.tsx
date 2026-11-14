"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  MAX_SHARE_CODE,
  collapseRows,
  decodeShare,
  diffTexts,
  encodeShare,
  toUnified,
  type DiffOptions,
  type DisplayRow,
  type Row,
  type Side,
} from "@/lib/tools/diff";
import { analyzeText, formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:text-diff:v1";

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

export default function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [opts, setOpts] = useState<DiffOptions>({ ignoreCase: false, ignoreWhitespace: false });
  const [view, setView] = useState<View>("split");
  const [lineNumbers, setLineNumbers] = useState(true);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [cur, setCur] = useState<number | null>(null);
  const [share, setShare] = useState<{ ok: boolean; text: string } | null>(null);
  const [banner, setBanner] = useState("");
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);
  const fromShare = useRef(false);

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

  const swap = () => { editA(b); editB(a); };
  const clearAll = () => { editA(""); editB(""); };
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
    try {
      await navigator.clipboard.writeText(url);
      setShare({ ok: true, text: "Link copied. It contains your two texts, so only send it to people who should read them." });
    } catch {
      setShare({ ok: false, text: `Could not copy automatically. Copy this link: ${url}` });
    }
  };

  const copyDiff = async () => {
    try {
      await navigator.clipboard.writeText(toUnified(diff.rows));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
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
        <td className={`tc-c tc-l${left ? "" : " is-empty"}`}>{text(left)}</td>
        {lineNumbers && <td className="tc-ln">{right?.n}</td>}
        <td className={`tc-c tc-rt${right ? "" : " is-empty"}`}>{text(right)}</td>
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
        <td className="tc-c">{text(side)}</td>
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

  return (
    <div className="tl-tool">
      {banner && <div className="tc-banner" role="status">{banner}</div>}

      {/* ---------- 1. Inputs ---------- */}
      <div className="tc-card">
        <div className="tc-panes">
          <div className="tc-pane">
            <div className="tc-head">
              <label htmlFor="tc-a" className="tc-label"><span className="tc-dot tc-dot--del" />Original text</label>
              <div className="tc-actions">
                <button type="button" className="tl-btn" onClick={pasteInto(editA)}>Paste</button>
                <button type="button" className="tl-btn" onClick={() => editA("")} disabled={!a}>Clear</button>
              </div>
            </div>
            <textarea id="tc-a" className="tc-textarea" value={a} onChange={(e) => editA(e.target.value)} placeholder="Paste the original text here…" spellCheck={false} />
          </div>
          <div className="tc-pane">
            <div className="tc-head">
              <label htmlFor="tc-b" className="tc-label"><span className="tc-dot tc-dot--add" />Changed text</label>
              <div className="tc-actions">
                <button type="button" className="tl-btn" onClick={pasteInto(editB)}>Paste</button>
                <button type="button" className="tl-btn" onClick={() => editB("")} disabled={!b}>Clear</button>
              </div>
            </div>
            <textarea id="tc-b" className="tc-textarea" value={b} onChange={(e) => editB(e.target.value)} placeholder="Paste the changed text here…" spellCheck={false} />
          </div>
        </div>

        <div className="tc-bar">
          <div className="tc-actions">
            <button type="button" className="tl-btn" onClick={swap} disabled={!hasAny}>⇄ Swap</button>
            <button type="button" className="tl-btn" onClick={clearAll} disabled={!hasAny}>Clear all</button>
            <button type="button" className="tl-btn" onClick={sample}>Sample</button>
          </div>
          <button type="button" className="tl-btn tl-btn--primary tc-share" onClick={copyLink} disabled={!hasBoth}>Copy share link</button>
        </div>
        {share && <p className={`tc-msg${share.ok ? " is-ok" : " is-bad"}`} role="status">{share.text}</p>}

        <span className="tc-private">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
          Runs on your device. Nothing is uploaded. Share links keep your text inside the link itself.
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
                <button type="button" className="tl-btn" onClick={copyDiff} disabled={diff.identical}>{copied ? "Copied ✓" : "Copy diff"}</button>
                <button type="button" className="tl-btn" onClick={download} disabled={diff.identical}>Download .txt</button>
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
          <p className="tc-empty">Paste text in both boxes, or try the Sample, to see what changed. Removed text is red, added text is green.</p>
        )}
      </section>
    </div>
  );
}