"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  CASE_DEMO,
  CASE_MODES,
  TITLE_STYLES,
  convertCase,
  formatNumber as fmt,
  type CaseMode,
  type CaseOptions,
  type TitleStyle,
} from "@/lib/tools/text";
import { CopyButton } from "@/components/tools/ui";

const STORAGE_KEY = "ap-tool:case-converter:v2";
const HISTORY_LIMIT = 30;
const SAMPLE =
  "the quick brown fox jumps over the lazy dog. NASA and the UK use it to test a title: it's a simple sample text to try every case.";

// The picked case is NOT saved: a fresh visit starts with no case selected.
type Saved = { text: string; titleStyle: TitleStyle; keepAcronyms: boolean };

/** Cases that change letters one-for-one, so an edit can be mapped back onto the original text by position. */
const LENGTH_SAFE: ReadonlySet<CaseMode> = new Set<CaseMode>([
  "upper", "lower", "title", "sentence", "capitalized", "alternating", "inverse",
]);

/** Converts text but keeps trailing spaces/new lines as typed, so code cases do not eat the space you just typed. */
function convertKeep(str: string, m: CaseMode, o: CaseOptions): string {
  const body = str.trimEnd();
  return convertCase(body, m, o) + str.slice(body.length);
}

function readStore(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === "object" && typeof v.text === "string" ? (v as Saved) : null;
  } catch {
    return null;
  }
}

function writeStore(value: Saved) {
  try {
    if (!value.text) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage can be blocked or full: ignore */
  }
}

/**
 * How it works: `text` is what the box shows. While a case is ON (`mode`), `base` holds the
 * original text and text = convert(base). So switching case always starts from the original,
 * and tapping the same case again puts the original back.
 */
export default function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode | null>(null); // case that is ON (green) and applied live while typing
  const [base, setBase] = useState(""); // original text, only meaningful while mode is ON
  const [titleStyle, setTitleStyle] = useState<TitleStyle>("ap");
  const [keepAcronyms, setKeepAcronyms] = useState(true);
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [selLen, setSelLen] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [copiedMode, setCopiedMode] = useState<CaseMode | null>(null);

  const loaded = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sel = useRef({ start: 0, end: 0 });
  const lastTyped = useRef(0);
  const latest = useRef<Saved>({ text: "", titleStyle: "ap", keepAcronyms: true });
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  latest.current = { text, titleStyle, keepAcronyms };

  // Restore after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = readStore();
    if (saved) {
      setText(saved.text);
      if (TITLE_STYLES.some((s) => s.id === saved.titleStyle)) setTitleStyle(saved.titleStyle);
      if (typeof saved.keepAcronyms === "boolean") setKeepAcronyms(saved.keepAcronyms);
    }
    loaded.current = true;
  }, []);

  // Debounced save, plus a flush when the tab is closed so the last 400 ms are never lost
  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => writeStore({ text, titleStyle, keepAcronyms }), 400);
    return () => clearTimeout(id);
  }, [text, titleStyle, keepAcronyms]);

  useEffect(() => {
    const flush = () => {
      if (loaded.current) writeStore(latest.current);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const opts = useMemo(() => ({ titleStyle, keepAcronyms }), [titleStyle, keepAcronyms]);

  // The preview always shows the ORIGINAL text in every format, even while a case is on
  const source = mode ? base : text;
  const deferred = useDeferredValue(source);

  // All-cases preview: only the first 160 characters are converted, so 14 formats stay cheap on huge text
  const previews = useMemo(() => {
    const trimmed = deferred.trim();
    const src = trimmed ? trimmed.slice(0, 160) : CASE_DEMO;
    const more = trimmed.length > 160 ? "…" : "";
    return CASE_MODES.map((c) => ({ ...c, preview: convertCase(src, c.mode, opts) + more }));
  }, [deferred, opts]);

  const hasText = text.length > 0;
  const showStyles = mode === "title";
  const showAcronyms = mode === "title" || mode === "sentence" || mode === "capitalized";
  const styleNote = TITLE_STYLES.find((s) => s.id === titleStyle)?.note;

  /* ---------- selection tracking ---------- */
  const resetSelection = () => {
    sel.current = { start: 0, end: 0 };
    setSelLen(0);
  };

  /** Reads the real selection, so a collapsed selection is never left behind as a stale highlight. */
  const syncSel = (el: HTMLTextAreaElement) => {
    const { selectionStart: start, selectionEnd: end } = el;
    if (sel.current.start === start && sel.current.end === end) return;
    sel.current = { start, end };
    setSelLen(end - start);
  };

  /** True when only PART of the text is highlighted. Select-all counts as the whole text. */
  const hasPartialSelection = () => {
    const { start, end } = sel.current;
    return end > start && end <= text.length && !(start === 0 && end === text.length);
  };

  /* ---------- history (undo / redo) ---------- */

  /** Every change goes through here. Quick typing is merged into one undo step. */
  const change = (next: string, typing = false) => {
    if (next === text) return;
    const now = Date.now();
    const merge = typing && now - lastTyped.current < 800;
    lastTyped.current = typing ? now : 0;
    if (!merge) setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), text]);
    setFuture([]);
    setText(next);
    if (!typing) resetSelection(); // old offsets mean nothing in the new text
  };

  // Undo / redo restore plain text, so the live case is switched off with them
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [text, ...f]);
    setText(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setMode(null);
    lastTyped.current = 0;
    resetSelection();
  };

  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, text]);
    setText(future[0]);
    setFuture((f) => f.slice(1));
    setMode(null);
    lastTyped.current = 0;
    resetSelection();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey && past.length) { e.preventDefault(); undo(); }
    else if (((k === "z" && e.shiftKey) || k === "y") && future.length) { e.preventDefault(); redo(); }
  };

  /* ---------- typing ---------- */
  /** Where the caret should be after the shown text changed from `raw` (as typed) to `next` (converted). */
  const caretAfter = (m: CaseMode, raw: string, next: string, caret: number) => {
    if (caret >= raw.length) return next.length;
    if (next.length === raw.length) return caret;
    return Math.min(next.length, convertKeep(raw.slice(0, caret), m, opts).length);
  };

  const onType = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const raw = el.value;
    syncSel(el); // typing replaces / collapses any selection
    if (!mode) return change(raw, true);

    // Work out what the user changed in the shown text and apply it to the ORIGINAL text
    let s = 0;
    while (s < text.length && s < raw.length && text[s] === raw[s]) s++;
    let t = 0;
    while (t < text.length - s && t < raw.length - s && text[text.length - 1 - t] === raw[raw.length - 1 - t]) t++;
    const inserted = raw.slice(s, raw.length - t);

    let nb: string;
    if (text.length === base.length && LENGTH_SAFE.has(mode)) nb = base.slice(0, s) + inserted + base.slice(base.length - t);
    else if (s === text.length) nb = base + inserted; // typed / pasted at the end
    else nb = raw; // edit in the middle of a reshaped text: the shown text becomes the new original
    setBase(nb);

    if ((e.nativeEvent as InputEvent).isComposing) return change(raw, true); // IME: convert when composition ends

    const next = convertKeep(nb, mode, opts);
    change(next, true);
    if (next !== raw) {
      const caret = caretAfter(mode, raw, next, el.selectionStart);
      requestAnimationFrame(() => el.setSelectionRange(caret, caret));
    }
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    if (!mode) return;
    const el = e.currentTarget;
    const next = convertKeep(base, mode, opts);
    if (next === text) return;
    const caret = caretAfter(mode, text, next, el.selectionStart);
    change(next, true);
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  /* ---------- picking a case ---------- */
  const pickMode = (m: CaseMode) => {
    // 1) Part of the text is highlighted: convert only that part, one time (Undo reverts it)
    if (hasPartialSelection()) {
      const { start, end } = sel.current;
      const converted = convertKeep(text.slice(start, end), m, opts);
      const newEnd = start + converted.length;
      setMode(null); // a live case would keep rewriting the rest of the text
      change(text.slice(0, start) + converted + text.slice(end));
      sel.current = { start, end: newEnd };
      setSelLen(newEnd - start);
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(start, newEnd));
      return;
    }
    // 2) Same case tapped again: switch it off and bring the original text back
    if (mode === m) {
      setMode(null);
      change(base);
      return;
    }
    // 3) Switch it on (or change case): always converts from the ORIGINAL text
    const src = mode ? base : text;
    setBase(src);
    setMode(m);
    change(convertKeep(src, m, opts));
  };

  const onClearAll = () => {
    change("");
    setBase("");
    setMode(null);
  };

  const pickStyle = (id: TitleStyle) => {
    setTitleStyle(id);
    if (mode === "title") change(convertKeep(base, "title", { titleStyle: id, keepAcronyms }));
  };

  const pickAcronyms = (v: boolean) => {
    setKeepAcronyms(v);
    if (mode) change(convertKeep(base, mode, { titleStyle, keepAcronyms: v })); // lossless: starts from the original
  };

  /* ---------- actions ---------- */
  /** New original text (paste / sample). Converted right away when a case is on. */
  const setSource = (nb: string) => {
    if (mode) {
      setBase(nb);
      change(convertKeep(nb, mode, opts));
    } else {
      change(nb);
    }
  };

  const onPaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setSource((mode ? base : text) + clip);
    } catch {
      /* permission denied: user can paste with Ctrl/Cmd+V */
    }
  };

  const onDownload = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "alloypress-converted.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyMode = async (m: CaseMode) => {
    try {
      await navigator.clipboard.writeText(convertCase(source || CASE_DEMO, m, opts));
      setCopiedMode(m);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedMode((c) => (c === m ? null : c)), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const renderGroup = (group: "text" | "format" | "code", title: string) => (
    <div className="cc-group">
      <p className="cc-group-title">{title}</p>
      <div className="cc-modes" role="group" aria-label={title}>
        {CASE_MODES.filter((c) => c.group === group).map((c) => (
          <button
            key={c.mode}
            type="button"
            className={`cc-mode${mode === c.mode ? " is-on" : ""}`}
            aria-pressed={mode === c.mode}
            onClick={() => pickMode(c.mode)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tl-tool">
      <div className="cc-card">
        {/* ---------- 1. Input: Undo/Redo/Clear top right, Copy/Download bottom right ---------- */}
        <div className="cc-pane">
          <div className="cc-head">
            <label htmlFor="cc-input" className="cc-label">
              Your text{selLen > 0 && <span className="cc-sel"> · {fmt(selLen)} selected</span>}
            </label>
            <div className="cc-actions">
              <button type="button" className="tl-btn" onClick={undo} disabled={!past.length} aria-label="Undo">Undo</button>
              <button type="button" className="tl-btn" onClick={redo} disabled={!future.length} aria-label="Redo">Redo</button>
              <button type="button" className="tl-btn" onClick={onClearAll} disabled={!hasText && !mode}>Clear</button>
            </div>
          </div>
          <textarea
            id="cc-input"
            ref={inputRef}
            className="cc-textarea"
            value={text}
            onChange={onType}
            onCompositionEnd={onCompositionEnd}
            onSelect={(e) => syncSel(e.currentTarget)}
            onKeyUp={(e) => syncSel(e.currentTarget)}
            onMouseUp={(e) => syncSel(e.currentTarget)}
            onTouchEnd={(e) => syncSel(e.currentTarget)}
            onFocus={(e) => syncSel(e.currentTarget)}
            onKeyDown={onKeyDown}
            placeholder="Type or paste your text, then tap a case below. Tap it again to remove it. Highlight part of the text to convert only that part."
            spellCheck
          />
          <div className="cc-foot">
            <div className="cc-actions">
              <button type="button" className="tl-btn" onClick={onPaste}>Paste</button>
              <button type="button" className="tl-btn" onClick={() => setSource(SAMPLE)}>Sample</button>
            </div>
            <div className="cc-actions">
              <CopyButton text={text} disabled={!hasText} />
              <button type="button" className="tl-btn" onClick={onDownload} disabled={!hasText}>Download .txt</button>
            </div>
          </div>
        </div>

        {/* ---------- 2. Pick a case (below the input) ---------- */}
        <div className="cc-choose">
          {renderGroup("text", "Text case")}
          {renderGroup("format", "Formatting")}
          {renderGroup("code", "Code case")}

          {(showStyles || showAcronyms) && (
            <div className="cc-options">
              {showStyles && (
                <div className="cc-style">
                  <div className="cc-seg" role="group" aria-label="Title case style">
                    {TITLE_STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={titleStyle === s.id ? "is-on" : ""}
                        aria-pressed={titleStyle === s.id}
                        onClick={() => pickStyle(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <span className="tl-small">{styleNote}</span>
                </div>
              )}
              {showAcronyms && (
                <label className="cc-check">
                  <input type="checkbox" checked={keepAcronyms} onChange={(e) => pickAcronyms(e.target.checked)} />
                  Keep acronyms (NASA, SEO, UK)
                </label>
              )}
            </div>
          )}
        </div>

        <span className="cc-private">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
          Runs on your device. Nothing is uploaded. Saved in this browser.
        </span>
      </div>

      {/* ---------- 3. All cases preview ---------- */}
      <section className="cc-card" aria-labelledby="cc-prev-h">
        <div className="cc-preview-head">
          <div>
            <h2 id="cc-prev-h" className="cc-h">All cases preview</h2>
            <p className="tl-small">
              {hasText ? "Every format at once. Tap a card to select it, or copy it directly." : "Type something above to see every format at once."}
            </p>
          </div>
          <button type="button" className="tl-btn" aria-expanded={previewOpen} onClick={() => setPreviewOpen((v) => !v)}>
            {previewOpen ? "Hide" : "Show"}
          </button>
        </div>
        {previewOpen && (
          <div className="cc-grid">
            {previews.map((p) => (
              <div key={p.mode} className={`cc-pv${mode === p.mode ? " is-on" : ""}`}>
                <button type="button" className="cc-pv-main" aria-pressed={mode === p.mode} onClick={() => pickMode(p.mode)}>
                  <span className="cc-pv-name">{p.label}</span>
                  <span className="cc-pv-text">{p.preview}</span>
                </button>
                <button type="button" className="cc-pv-copy" onClick={() => copyMode(p.mode)} aria-label={`Copy ${p.label}`}>
                  {copiedMode === p.mode ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}