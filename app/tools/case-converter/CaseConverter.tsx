"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  CASE_DEMO,
  CASE_MODES,
  TITLE_STYLES,
  convertCase,
  formatNumber as fmt,
  type CaseMode,
  type TitleStyle,
} from "@/lib/tools/text";
import { CopyButton } from "@/components/tools/ui";

const STORAGE_KEY = "ap-tool:case-converter:v2";
const HISTORY_LIMIT = 30;
const SAMPLE =
  "the quick brown fox jumps over the lazy dog. NASA and the UK use it to test a title: it's a simple sample text to try every case.";

type Saved = { text: string; mode: CaseMode; titleStyle: TitleStyle; keepAcronyms: boolean };

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
    if (!value.text) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage can be blocked or full: ignore */
  }
}

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");
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

  // Restore after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = readStore();
    if (saved) {
      setText(saved.text ?? "");
      if (CASE_MODES.some((c) => c.mode === saved.mode)) setMode(saved.mode);
      if (TITLE_STYLES.some((s) => s.id === saved.titleStyle)) setTitleStyle(saved.titleStyle);
      if (typeof saved.keepAcronyms === "boolean") setKeepAcronyms(saved.keepAcronyms);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => writeStore({ text, mode, titleStyle, keepAcronyms }), 400);
    return () => clearTimeout(id);
  }, [text, mode, titleStyle, keepAcronyms]);

  const opts = useMemo(() => ({ titleStyle, keepAcronyms }), [titleStyle, keepAcronyms]);

  // Keep typing smooth on very long text
  const deferred = useDeferredValue(text);

  // All-cases preview: only the first 160 characters are converted, so 15 formats stay cheap on huge text
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

  /* ---------- history (undo / redo) ---------- */
  const resetSelection = () => {
    sel.current = { start: 0, end: 0 };
    setSelLen(0);
  };

  /** Every change goes through here. Quick typing is merged into one undo step. */
  const change = (next: string, typing = false) => {
    if (next === text) return;
    const now = Date.now();
    const merge = typing && now - lastTyped.current < 800;
    lastTyped.current = typing ? now : 0;
    if (!merge) setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), text]);
    setFuture([]);
    setText(next);
  };

  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [text, ...f]);
    setText(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    lastTyped.current = 0;
    resetSelection();
  };

  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, text]);
    setText(future[0]);
    setFuture((f) => f.slice(1));
    lastTyped.current = 0;
    resetSelection();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey && past.length) { e.preventDefault(); undo(); }
    else if (((k === "z" && e.shiftKey) || k === "y") && future.length) { e.preventDefault(); redo(); }
  };

  /* ---------- selection conversion ---------- */
  const onSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart: start, selectionEnd: end } = e.currentTarget;
    sel.current = { start, end };
    setSelLen(end - start);
  };

  /** Converts the highlighted part, or the whole text when nothing is highlighted. */
  const applyMode = (m: CaseMode, o: { titleStyle: TitleStyle; keepAcronyms: boolean } = opts) => {
    const { start, end } = sel.current;
    const part = end > start && end <= text.length;
    const converted = convertCase(part ? text.slice(start, end) : text, m, o);
    change(part ? text.slice(0, start) + converted + text.slice(end) : converted);
    if (part) {
      const newEnd = start + converted.length;
      sel.current = { start, end: newEnd };
      setSelLen(newEnd - start);
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(start, newEnd));
    }
  };

  const pickMode = (m: CaseMode) => {
    setMode(m);
    applyMode(m);
  };

  const pickStyle = (id: TitleStyle) => {
    setTitleStyle(id);
    if (mode === "title") applyMode("title", { titleStyle: id, keepAcronyms });
  };

  /* ---------- actions ---------- */
  const onPaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) change(text + clip);
    } catch {
      /* permission denied: user can paste with Ctrl/Cmd+V */
    }
  };

  const onDownload = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "alloypress-converted.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMode = async (m: CaseMode) => {
    try {
      await navigator.clipboard.writeText(convertCase(text || CASE_DEMO, m, opts));
      setCopiedMode(m);
      setTimeout(() => setCopiedMode((c) => (c === m ? null : c)), 1500);
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
              <button type="button" className="tl-btn" onClick={() => change("")} disabled={!hasText}>Clear</button>
            </div>
          </div>
          <textarea
            id="cc-input"
            ref={inputRef}
            className="cc-textarea"
            value={text}
            onChange={(e) => change(e.target.value, true)}
            onSelect={onSelect}
            onKeyDown={onKeyDown}
            placeholder="Type or paste your text, then tap a case below. Highlight part of it to convert only that part."
            spellCheck
          />
          <div className="cc-foot">
            <div className="cc-actions">
              <button type="button" className="tl-btn" onClick={onPaste}>Paste</button>
              <button type="button" className="tl-btn" onClick={() => change(SAMPLE)}>Sample</button>
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
                  <input type="checkbox" checked={keepAcronyms} onChange={(e) => setKeepAcronyms(e.target.checked)} />
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