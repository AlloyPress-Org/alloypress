"use client";

import Link from "next/link";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  CLEAN_PRESETS,
  DEFAULT_OPTIONS,
  MAX_CUSTOM_RULES,
  cleanText,
  markdownToHtml,
  type CleanOptions,
  type CleanStats,
  type CustomRule,
  type DashMode,
  type ListMode,
} from "@/lib/tools/clean";
import { diffTexts } from "@/lib/tools/diff";
import { formatNumber as fmt } from "@/lib/tools/text";

const STORAGE_KEY = "ap-tool:ai-text-cleaner:v1";
/** Very large pastes are not saved (keeps typing fast and avoids storage quota errors). */
const MAX_SAVED_CHARS = 200_000;
/** Set this to the real URL of your "Best AI Humanizers" post. */
const HUMANIZER_HREF = "/blogs/best-ai-humanizer";
/** Invisible characters are shown as ▯ in "Show changes" so the removal is visible. */
const INVISIBLE = /[\u200B-\u200F\u2060\u180E\uFEFF\u00AD\u202A-\u202E\u2066-\u2069\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
const show = (s: string) => s.replace(INVISIBLE, "▯");

const SAMPLE = [
  "Sure! Here’s a quick summary of the plan:",
  "",
  "## Key points",
  "",
  "**Speed**\u200B matters — users leave after 3 seconds.",
  "* Use  a CDN",
  "* Compress   images",
  "",
  "Read more at https://example.com/guide_v2 or email hello@example.com.",
  "",
  "Run `npm run build` first.",
  "",
  "",
  "",
  "“Smart” quotes…",
  "",
  "Let me know if you’d like any changes!",
].join("\n");

type Saved = { text: string; options: CleanOptions; preset: string };

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
    if (!value.text || value.text.length > MAX_SAVED_CHARS) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage can be blocked or full: ignore */
  }
}

/* ---------- icons ---------- */
const ICONS = {
  paste: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" /></>,
  sample: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
  rich: <><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M9 19h6" /></>,
  download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
  clear: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

function IconBtn({ icon, label, onClick, disabled, done }: { icon: keyof typeof ICONS; label: string; onClick: () => void; disabled?: boolean; done?: boolean }) {
  return (
    <button type="button" className={`atc-ic${done ? " is-ok" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {done ? ICONS.check : ICONS[icon]}
      </svg>
    </button>
  );
}

const Check = memo(function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="atc-check" title={hint}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
});

function Select<T extends string>({ id, label, value, items, onChange }: { id: string; label: string; value: T; items: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="atc-select">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {items.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

const SUMMARY_LABELS: [keyof CleanStats, string][] = [
  ["hidden", "hidden characters"],
  ["html", "HTML tags"],
  ["markdown", "Markdown symbols"],
  ["spaces", "extra spaces"],
  ["blankLines", "blank lines"],
  ["joined", "broken lines joined"],
  ["quotes", "quotes and dots"],
  ["dashes", "dashes"],
  ["phrases", "AI phrase lines"],
  ["duplicates", "duplicates"],
  ["custom", "custom replacements"],
];

export default function AiTextCleaner() {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [preset, setPreset] = useState("ai");
  const [copied, setCopied] = useState<"" | "plain" | "rich">("");
  const [customize, setCustomize] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const loaded = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Restore after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = readStore();
    if (saved) {
      setText(saved.text ?? "");
      setOptions({ ...DEFAULT_OPTIONS, ...saved.options, custom: Array.isArray(saved.options?.custom) ? saved.options.custom : [] });
      if (CLEAN_PRESETS.some((p) => p.id === saved.preset)) setPreset(saved.preset);
      if (saved.preset === "custom") setCustomize(true);
    }
    loaded.current = true;
    return () => clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => writeStore({ text, options, preset }), 600);
    return () => clearTimeout(id);
  }, [text, options, preset]);

  // Typing stays instant: the heavy clean runs on a deferred copy of the text
  const deferred = useDeferredValue(text);
  const result = useMemo(() => cleanText(deferred, options), [deferred, options]);
  const { stats } = result;
  const words = useMemo(() => (result.text.match(/\S+/g) || []).length, [result.text]);
  const hasText = text.length > 0;

  // "Show changes": original text with the removed characters marked
  const marked = useMemo(
    () => (showChanges && deferred ? diffTexts(deferred, result.text, { ignoreCase: false, ignoreWhitespace: false }) : null),
    [showChanges, deferred, result.text],
  );

  const renderMarked = () => {
    if (!marked) return null;
    const out: ReactNode[] = [];
    marked.rows.forEach((r, i) => {
      if (r.kind === "add") return;
      if (r.kind === "eq") out.push(<span key={i}>{r.left.text}{"\n"}</span>);
      else if (r.kind === "del") out.push(<span key={i}><del className="atc-del">{show(r.left.text) || "¶"}</del>{"\n"}</span>);
      else out.push(
        <span key={i}>
          {(r.left.parts ?? []).map((p, j) => (p.changed ? <del key={j} className="atc-del">{show(p.text)}</del> : <span key={j}>{p.text}</span>))}
          {"\n"}
        </span>,
      );
    });
    return out;
  };

  const activeSteps =
    [options.hidden, options.html, options.markdown, options.spaces, options.blankLines, options.joinWrapped, options.quotes,
      options.introPhrases, options.closingPhrases, options.dupLines, options.dupParagraphs, options.trim].filter(Boolean).length +
    (options.lists !== "keep" ? 1 : 0) + (options.dashes !== "keep" ? 1 : 0) + options.custom.filter((r) => r.find).length;

  const set = useCallback(<K extends keyof CleanOptions>(key: K, value: CleanOptions[K]) => {
    setOptions((o) => ({ ...o, [key]: value }));
    setPreset("custom");
  }, []);

  const pickPreset = (id: string) => {
    const p = CLEAN_PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (id !== "custom") setOptions({ ...p.options, custom: options.custom });
    if (id === "custom") setCustomize(true);
    setPreset(id);
  };

  const resetSteps = () => {
    const base = CLEAN_PRESETS.find((p) => p.id === preset && p.id !== "custom") ?? CLEAN_PRESETS[0];
    setOptions({ ...base.options, custom: [] });
    setPreset(base.id);
  };

  const setRule = (i: number, patch: Partial<CustomRule>) => set("custom", options.custom.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  const flash = (kind: "plain" | "rich") => {
    setCopied(kind);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(""), 1500);
  };

  const onPaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText((t) => t + clip);
    } catch {
      /* permission denied: user can paste with Ctrl/Cmd+V */
    }
  };

  const copyPlain = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      flash("plain");
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  /** Copies headings, bold and lists as real formatting (HTML + plain text fallback). */
  const copyRich = async () => {
    const html = markdownToHtml(cleanText(text, { ...options, markdown: false, lists: "keep" }).text);
    let ok = false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([result.text], { type: "text/plain" }),
        }),
      ]);
      ok = true;
    } catch {
      const box = document.createElement("div");
      box.contentEditable = "true";
      box.style.cssText = "position:fixed;left:-9999px;top:0;";
      box.innerHTML = html;
      document.body.appendChild(box);
      const range = document.createRange();
      range.selectNodeContents(box);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      sel?.removeAllRanges();
      document.body.removeChild(box);
    }
    if (ok) flash("rich");
  };

  const onDownload = () => {
    const url = URL.createObjectURL(new Blob([result.text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "alloypress-cleaned-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const changes = SUMMARY_LABELS.map(([k, label]) => ({ n: stats[k], label })).filter((c) => c.n > 0);
  const removed = Math.max(0, stats.before - stats.after);
  const presetHint = CLEAN_PRESETS.find((p) => p.id === preset)?.hint;

  return (
    <div className="tl-tool atc-root">
      {/* ================= Editor ================= */}
      <div className="atc-card">
        <div className="atc-modes">
          {presetHint && <p className="atc-hint">{presetHint}</p>}
          <div className="atc-seg" role="group" aria-label="Cleaning mode">
            {CLEAN_PRESETS.map((p) => (
              <button key={p.id} type="button" className={preset === p.id ? "is-on" : ""} aria-pressed={preset === p.id} onClick={() => pickPreset(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="atc-panes">
          {/* ---------- Input box ---------- */}
          <div className="atc-box">
            <textarea
              id="atc-in"
              aria-label="Your text"
              className="atc-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text from ChatGPT, Claude, Gemini or any website…"
              spellCheck={false}
            />
            <div className="atc-tools">
              <div className="atc-icons" role="toolbar" aria-label="Input tools">
                <IconBtn icon="paste" label="Paste" onClick={onPaste} />
                <IconBtn icon="sample" label="Sample text" onClick={() => setText(SAMPLE)} />
                <IconBtn icon="clear" label="Clear" onClick={() => setText("")} disabled={!hasText} />
              </div>
              <span className="atc-count">Characters: {fmt(text.length)}</span>
            </div>
          </div>

          {/* ---------- Cleaned box ---------- */}
          <div className="atc-box atc-box--out">
            <textarea
              id="atc-out"
              aria-label="Cleaned text"
              className="atc-textarea atc-textarea--out"
              value={result.text}
              readOnly
              placeholder="Your cleaned text appears here…"
              aria-live="polite"
            />
            <div className="atc-tools">
              <div className="atc-icons" role="toolbar" aria-label="Output tools">
                <IconBtn icon="copy" label={copied === "plain" ? "Copied" : "Copy cleaned text"} onClick={copyPlain} disabled={!hasText} done={copied === "plain"} />
                <IconBtn icon="rich" label={copied === "rich" ? "Copied" : "Copy Formatted (keeps headings, bold and lists)"} onClick={copyRich} disabled={!hasText} done={copied === "rich"} />
                <IconBtn icon="download" label="Download .txt" onClick={onDownload} disabled={!hasText} />
              </div>
              <span className="atc-count">Characters: {fmt(stats.after)} | Words: {fmt(words)}</span>
            </div>
          </div>
        </div>

        <p className="atc-private">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
          Runs on your device. Nothing is uploaded. Your original text is never changed.
        </p>

        <div className="atc-stats" aria-live="polite">
          <div className="atc-stat"><span>Original characters</span><b>{fmt(stats.before)}</b></div>
          <div className="atc-stat"><span>Cleaned characters</span><b>{fmt(stats.after)}</b></div>
          <div className="atc-stat"><span>Characters removed</span><b>{fmt(removed)}</b></div>
          <div className="atc-stat"><span>Words</span><b>{fmt(words)}</b></div>
        </div>

        <div className="atc-togrow">
          <button type="button" className={`atc-tog${showChanges ? " is-on" : ""}`} aria-pressed={showChanges} onClick={() => setShowChanges((v) => !v)} disabled={!hasText}>
            Show changes
          </button>
          <button type="button" className="atc-tog" aria-expanded={customize} onClick={() => setCustomize((v) => !v)}>
            {customize ? "Hide steps ▴" : "Customize steps ▾"}
          </button>
        </div>

        {showChanges && hasText && (
          <div className="atc-marked">
            <p className="atc-hint">Your original text. Removed characters are in red. ▯ marks an invisible character.</p>
            <div className="atc-marked-text">{renderMarked()}</div>
          </div>
        )}

        <div className="atc-changes" aria-live="polite">
          {!hasText && <span className="atc-hint">Paste your text, or try the Sample. Every change is listed here.</span>}
          {hasText && changes.length === 0 && <span className="atc-hint">Nothing to clean with these settings.</span>}
          {hasText && changes.map((c) => <span key={c.label} className="atc-chip"><b>{fmt(c.n)}</b> {c.label}</span>)}
        </div>
      </div>

      <aside className="atc-promo">
        <span>Need to rewrite AI text, not just clean it?</span>
        <Link href={HUMANIZER_HREF}>See our tested Best AI Humanizers →</Link>
      </aside>

      {/* ================= Options (hidden until "Customize steps") ================= */}
      {customize && (
        <section className="atc-card" aria-labelledby="atc-opts-h">
          <div className="atc-opts-head">
            <div>
              <h2 id="atc-opts-h" className="atc-h">Cleaning options</h2>
              <p className="atc-hint">{activeSteps} steps on. Switch any step on or off.</p>
            </div>
            <button type="button" className="tl-btn" onClick={resetSteps}>Reset steps</button>
          </div>

          <div className="atc-checks">
            <Check label="Remove Markdown" hint="**bold**, ## headings, backticks, links" checked={options.markdown} onChange={(v) => set("markdown", v)} />
            <Check label="Remove invisible characters" hint="Zero-width spaces, BOM, odd spaces" checked={options.hidden} onChange={(v) => set("hidden", v)} />
            <Check label="Trim start and end" checked={options.trim} onChange={(v) => set("trim", v)} />
            <Check label="Fix extra spaces and tabs" checked={options.spaces} onChange={(v) => set("spaces", v)} />
            <Check label="Convert HTML to plain text" checked={options.html} onChange={(v) => set("html", v)} />
            <Check label="Straighten quotes and ellipsis" hint="Curly quotes and … become plain ones" checked={options.quotes} onChange={(v) => set("quotes", v)} />
            <Check label="Collapse extra blank lines" checked={options.blankLines} onChange={(v) => set("blankLines", v)} />
            <Check label="Join broken lines" hint="Fixes hard-wrapped paragraphs" checked={options.joinWrapped} onChange={(v) => set("joinWrapped", v)} />
            <Check label="Remove repeated lines" checked={options.dupLines} onChange={(v) => set("dupLines", v)} />
            <Check label="Remove repeated paragraphs" checked={options.dupParagraphs} onChange={(v) => set("dupParagraphs", v)} />
            <Check label="Remove intro line" hint="“Sure! Here’s …”" checked={options.introPhrases} onChange={(v) => set("introPhrases", v)} />
            <Check label="Remove closing line" hint="“Let me know if …”" checked={options.closingPhrases} onChange={(v) => set("closingPhrases", v)} />
            <Check label="Keep URLs, emails and code untouched" checked={options.preserve} onChange={(v) => set("preserve", v)} />
          </div>

          <div className="atc-selects">
            <Select id="atc-lists" label="Lists" value={options.lists} onChange={(v: ListMode) => set("lists", v)}
              items={[["keep", "Keep as written"], ["plain", "Plain list (- item)"], ["remove", "Remove markers"]]} />
            <Select id="atc-dashes" label="Em and en dashes" value={options.dashes} onChange={(v: DashMode) => set("dashes", v)}
              items={[["keep", "Keep"], ["hyphen", "Spaced hyphen ( - )"], ["comma", "Comma"]]} />
          </div>

          <div className="atc-rules">
            <div className="atc-rules-head">
              <div>
                <h3 className="atc-h3">Custom rules (advanced)</h3>
                <p className="atc-hint">Replace any text with your own. Leave “Replace with” empty to delete it.</p>
              </div>
              <button type="button" className="tl-btn" disabled={options.custom.length >= MAX_CUSTOM_RULES}
                onClick={() => set("custom", [...options.custom, { find: "", replace: "", regex: false }])}>
                + Add rule
              </button>
            </div>
            {options.custom.map((r, i) => (
              <div className="atc-rule" key={i}>
                <input aria-label={`Find ${i + 1}`} placeholder="Find" value={r.find} onChange={(e) => setRule(i, { find: e.target.value })} />
                <input aria-label={`Replace with ${i + 1}`} placeholder="Replace with" value={r.replace} onChange={(e) => setRule(i, { replace: e.target.value })} />
                <label className="atc-rule-re"><input type="checkbox" checked={r.regex} onChange={(e) => setRule(i, { regex: e.target.checked })} /> Regex</label>
                <button type="button" className="tl-btn" aria-label={`Remove rule ${i + 1}`} onClick={() => set("custom", options.custom.filter((_, n) => n !== i))}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}