"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  LONG_SENTENCE_WORDS,
  analyzeText,
  formatDuration,
  formatNumber as fmt,
  topKeywords,
} from "@/lib/tools/text";
import { convertCase, PLATFORM_LIMITS, type CaseMode } from "@/lib/tools/text";
import { CopyButton, StatBar } from "@/components/tools/ui";

const STORAGE_KEY = "ap-tool:word-counter:v1";

const CASES: { mode: CaseMode; label: string }[] = [
  { mode: "upper", label: "UPPER" },
  { mode: "lower", label: "lower" },
  { mode: "title", label: "Title Case" },
  { mode: "sentence", label: "Sentence" },
];

function readStore(): { text: string; goal: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(value: { text: string; goal: number }) {
  try {
    if (!value.text) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage can be blocked or full: ignore */
  }
}

export default function WordCounter() {
  const [text, setText] = useState("");
  const [goal, setGoal] = useState(500);
  const [platformId, setPlatformId] = useState("x");
  const [ignoreCommon, setIgnoreCommon] = useState(true);
  const [longOnly, setLongOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [undoText, setUndoText] = useState<string | null>(null);
  const [caseOpen, setCaseOpen] = useState(false);
  const loaded = useRef(false);

  // Restore after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = readStore();
    if (saved) {
      setText(saved.text ?? "");
      if (saved.goal > 0) setGoal(saved.goal);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => writeStore({ text, goal }), 400);
    return () => clearTimeout(id);
  }, [text, goal]);

  // Keep typing smooth on very long text
  const deferred = useDeferredValue(text);
  const stats = useMemo(() => analyzeText(deferred), [deferred]);
  const keywords = useMemo(() => topKeywords(stats.wordList, ignoreCommon), [stats.wordList, ignoreCommon]);

  const platform = PLATFORM_LIMITS.find((p) => p.id === platformId) ?? PLATFORM_LIMITS[0];
  const over = stats.characters > platform.limit;
  const platformPct = Math.min(100, (stats.characters / platform.limit) * 100);

  const safeGoal = Math.max(1, goal || 1);
  const goalPct = Math.min(100, Math.round((stats.words / safeGoal) * 100));

  const maxKw = keywords[0]?.count ?? 1;

  const sentences = useMemo(
    () => (longOnly ? stats.sentenceList.filter((s) => s.words > LONG_SENTENCE_WORDS) : stats.sentenceList),
    [stats.sentenceList, longOnly],
  );
  const visibleSentences = showAll ? sentences : sentences.slice(0, 8);
  const sentenceBarMax = Math.max(LONG_SENTENCE_WORDS * 1.5, stats.longestSentenceWords);

  const onPaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText((t) => t + clip);
    } catch {
      /* permission denied: user can paste with Ctrl/Cmd+V */
    }
  };

  const onDownload = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "alloypress-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyCase = (mode: CaseMode) => {
    if (!text) return;
    setUndoText(text);
    setText(convertCase(text, mode));
  };

  const onClear = () => {
    setUndoText(null);
    setText("");
  };

  const hasText = text.length > 0;

  const statBar = [
    { value: fmt(stats.words), label: "Words" },
    { value: fmt(stats.characters), label: "Characters" },
    { value: fmt(stats.charactersNoSpaces), label: "Characters (no spaces)", short: "No spaces" },
    { value: fmt(stats.sentences), label: "Sentences" },
  ];

  const details: [string, string][] = [
    ["Paragraphs", fmt(stats.paragraphs)],
    ["Reading time", formatDuration(stats.readingSeconds)],
    ["Speaking time", formatDuration(stats.speakingSeconds)],
    ["AI tokens (estimate)", fmt(stats.tokensEstimate)],
    ["Longest sentence", `${fmt(stats.longestSentenceWords)} words`],
  ];

  return (
    <div className="tl-tool">
      {/* ---------- Stats (sticky: a compact copy follows the page until the FAQ) ---------- */}
      <StatBar items={statBar} />

      {/* ---------- Editor + details ---------- */}
      <div className="tl-toolcard">
        <div className="tl-editor">
          <label htmlFor="wc-text" className="tl-label">Your text</label>
          <textarea
            id="wc-text"
            className="tl-textarea"
            value={text}
            onChange={(e) => { setUndoText(null); setText(e.target.value); }}
            placeholder="Start typing or paste your text here…"
            spellCheck
          />

          <div className="tl-actions">
            <button type="button" className="tl-btn" onClick={onPaste}>Paste</button>
            <CopyButton text={text} disabled={!hasText} />
            <button type="button" className="tl-btn" onClick={onClear} disabled={!hasText}>Clear</button>
            <button type="button" className="tl-btn tl-btn--primary" onClick={onDownload} disabled={!hasText}>Download .txt</button>
            <button type="button" className="tl-link-btn" aria-expanded={caseOpen} onClick={() => setCaseOpen((v) => !v)}>
              Change case {caseOpen ? "↑" : "→"}
            </button>
          </div>

          {caseOpen && (
            <div className="tl-seg" role="group" aria-label="Change case">
              {CASES.map((c) => (
                <button key={c.mode} type="button" onClick={() => applyCase(c.mode)} disabled={!hasText}>
                  {c.label}
                </button>
              ))}
              {undoText !== null && (
                <button type="button" className="tl-seg-undo" onClick={() => { setText(undoText); setUndoText(null); }}>
                  Undo
                </button>
              )}
            </div>
          )}

          <span className="tl-private">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
            Runs on your device. Nothing is uploaded. Saved in this browser.
          </span>
        </div>

        <aside className="tl-details" aria-label="Details">
          <p className="tl-kicker">Details</p>
          <dl className="tl-details-list" aria-live="polite">
            {details.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="tl-details-note">Reading at 238 and speaking at 150 words a minute.</p>

          <div className="tl-goal">
            <label htmlFor="wc-goal" className="tl-kicker">Word goal</label>
            <input id="wc-goal" type="number" min={1} inputMode="numeric" value={goal || ""} placeholder="e.g. 500"
              onChange={(e) => setGoal(parseInt(e.target.value, 10) || 0)} />
            <div className="tl-bar"><span style={{ width: `${goalPct}%` }} /></div>
            <span className="tl-small">{fmt(stats.words)} of {fmt(safeGoal)} words ({goalPct}%)</span>
          </div>
        </aside>
      </div>

      {/* ---------- Platform limits + keywords ---------- */}
      <div className="tl-panels">
        <section className="tl-card tl-panel" aria-labelledby="wc-limits-h">
          <h2 id="wc-limits-h" className="tl-panel-title">Platform limits</h2>
          <p className="tl-small">See how close you are to common limits.</p>
          <div className="tl-pills" role="group" aria-label="Platform">
            {PLATFORM_LIMITS.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === platform.id}
                className={`tl-pill${p.id === platform.id ? " is-on" : ""}`} onClick={() => setPlatformId(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="tl-row">
            <span>{platform.name} · limit {fmt(platform.limit)} characters</span>
            <b className={over ? "is-over" : ""}>{fmt(stats.characters)} / {fmt(platform.limit)}</b>
          </div>
          <div className="tl-bar tl-bar--lg"><span className={over ? "is-over" : ""} style={{ width: `${platformPct}%` }} /></div>
          <span className="tl-small">
            {over ? `${fmt(stats.characters - platform.limit)} characters over the limit` : `${fmt(platform.limit - stats.characters)} characters left`}
          </span>
        </section>

        <section className="tl-card tl-panel" aria-labelledby="wc-kw-h">
          <div className="tl-panel-head">
            <h2 id="wc-kw-h" className="tl-panel-title">Top keywords</h2>
            <label className="tl-check">
              <input type="checkbox" checked={ignoreCommon} onChange={() => setIgnoreCommon((v) => !v)} />
              Ignore common words
            </label>
          </div>
          {keywords.length === 0 ? (
            <p className="tl-small">Your most-used words appear here as you type.</p>
          ) : (
            <ul className="tl-kw">
              {keywords.map((k) => (
                <li key={k.word}>
                  <span className="tl-kw-word">{k.word}</span>
                  <span className="tl-bar"><span style={{ width: `${Math.round((k.count / maxKw) * 100)}%` }} /></span>
                  <span className="tl-kw-meta">{k.count} · {k.percent.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- Sentence analysis (merged sentence counter) ---------- */}
      <section className="tl-card tl-panel tl-sentences" aria-labelledby="wc-sent-h">
        <div className="tl-panel-head">
          <div>
            <h2 id="wc-sent-h" className="tl-panel-title">Sentence analysis</h2>
            <p className="tl-small">Sentences over {LONG_SENTENCE_WORDS} words are flagged as long.</p>
          </div>
          <label className="tl-check">
            <input type="checkbox" checked={longOnly} onChange={() => { setLongOnly((v) => !v); setShowAll(false); }} />
            Long sentences only
          </label>
        </div>

        <div className="tl-mini-stats">
          <div><b>{fmt(stats.sentences)}</b><span>Sentences</span></div>
          <div><b>{fmt(stats.avgSentenceWords)}</b><span>Avg words / sentence</span></div>
          <div><b>{fmt(stats.longestSentenceWords)}</b><span>Longest (words)</span></div>
          <div><b>{fmt(stats.shortestSentenceWords)}</b><span>Shortest (words)</span></div>
          <div className={stats.longSentences ? "is-warn" : ""}><b>{fmt(stats.longSentences)}</b><span>Long sentences</span></div>
        </div>

        {sentences.length === 0 ? (
          <p className="tl-small">
            {hasText && longOnly ? "No long sentences. Nice and easy to read." : "Your sentences appear here as you type."}
          </p>
        ) : (
          <>
            <ol className="tl-sent-list">
              {visibleSentences.map((s, i) => {
                const long = s.words > LONG_SENTENCE_WORDS;
                return (
                  <li key={i} className={long ? "is-long" : ""}>
                    <span className="tl-sent-text" title={s.text}>{s.text}</span>
                    <span className="tl-bar"><span style={{ width: `${Math.min(100, (s.words / sentenceBarMax) * 100)}%` }} /></span>
                    <span className="tl-sent-n">{s.words} words{long ? " · long" : ""}</span>
                  </li>
                );
              })}
            </ol>
            {sentences.length > 8 && (
              <button type="button" className="tl-btn tl-btn--ghost" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show all ${fmt(sentences.length)} sentences`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- Page estimator (rendered lower on the page, from page.tsx) ---------- */
const pages = (n: number) => {
  const v = Math.round(n * 10) / 10;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
};

const ROWS = [500, 1000, 1500, 2000, 3000];

export function PageEstimator() {
  const [words, setWords] = useState(1000);
  return (
    <div className="tl-estimator">
      <div className="tl-card tl-estimator-main">
        <label htmlFor="tl-pages" className="tl-estimator-slider">
          <span className="tl-estimator-words">{fmt(words)} <small>words</small></span>
          <input id="tl-pages" type="range" min={250} max={5000} step={250} value={words}
            onChange={(e) => setWords(Number(e.target.value))} />
        </label>
        <div className="tl-estimator-out">
          <div><b>{pages(words / 500)}</b><span>single-spaced</span></div>
          <div><b>{pages(words / 250)}</b><span>double-spaced</span></div>
        </div>
      </div>
      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead><tr><th scope="col">Words</th><th scope="col">Single-spaced</th><th scope="col">Double-spaced</th></tr></thead>
          <tbody>
            {ROWS.map((w) => (
              <tr key={w}>
                <td>{fmt(w)}</td>
                <td>{pages(w / 500)} {w / 500 === 1 ? "page" : "pages"}</td>
                <td>{pages(w / 250)} {w / 250 === 1 ? "page" : "pages"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}