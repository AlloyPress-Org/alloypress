/** Shared text logic for all text tools (pure functions, no React/DOM). */

// ===== counting =====
/**
 * Pure text analysis. No React, no DOM. Safe to unit-test and to reuse in
 * Word Counter, Token Counter, Case Converter, Text Cleaner…
 */

export const READING_WPM = 238;
export const SPEAKING_WPM = 150;
export const LONG_SENTENCE_WORDS = 25;

// URL | email | number (3.5, 1,000) | word (letters/numbers/marks, inner ' ’ - kept together).
// \p{M} matters: Tamil, Hindi etc. use combining vowel signs.
const WORD_RE =
  /(?:https?:\/\/|www\.)[^\s]+|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}|\p{N}+(?:[.,]\p{N}+)+|[\p{L}\p{N}\p{M}]+(?:['’-][\p{L}\p{N}\p{M}]+)*/gu;

const PLAIN_WORD_RE = /\p{N}+(?:[.,]\p{N}+)+|[\p{L}\p{N}\p{M}]+(?:['’-][\p{L}\p{N}\p{M}]+)*/gu;

const SENTENCE_END_RE = /[.!?…।]+["'”’)\]]*(?=\s|$)/g;

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "fig",
  "inc", "ltd", "st", "no", "e.g", "i.e", "approx", "dept",
]);

export type Sentence = { text: string; words: number };

export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingSeconds: number;
  speakingSeconds: number;
  tokensEstimate: number;
  avgSentenceWords: number;
  longestSentenceWords: number;
  shortestSentenceWords: number;
  longSentences: number;
  sentenceList: Sentence[];
  wordList: string[];
};

export const EMPTY_STATS: TextStats = {
  words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0,
  readingSeconds: 0, speakingSeconds: 0, tokensEstimate: 0, avgSentenceWords: 0,
  longestSentenceWords: 0, shortestSentenceWords: 0, longSentences: 0,
  sentenceList: [], wordList: [],
};

export function countCodePoints(text: string): number {
  let n = 0;
  for (const _ of text) n++; // eslint-disable-line @typescript-eslint/no-unused-vars
  return n;
}

export function extractWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function countPlainWords(text: string): number {
  return (text.match(PLAIN_WORD_RE) ?? []).length;
}

function isAbbreviation(before: string): boolean {
  const m = before.match(/([\p{L}.]+)$/u);
  if (!m) return false;
  return ABBREVIATIONS.has(m[1].replace(/\.$/, "").toLowerCase());
}

/** A sentence ends at . ! ? … (or ।) followed by space/end, or at a blank line. */
export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  const paragraphs = text.split(/\n\s*\n/);

  for (const para of paragraphs) {
    let start = 0;
    const push = (end: number) => {
      const s = para.slice(start, end).trim();
      if (s && /[\p{L}\p{N}]/u.test(s)) out.push({ text: s, words: countPlainWords(s) });
      start = end;
    };

    SENTENCE_END_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SENTENCE_END_RE.exec(para))) {
      const end = m.index + m[0].length;
      // "Dr. Smith", "e.g. this" are not sentence ends
      if (m[0] === "." && isAbbreviation(para.slice(start, m.index))) continue;
      push(end);
    }
    push(para.length);
  }
  return out;
}

export function analyzeText(text: string): TextStats {
  if (!text) return EMPTY_STATS;

  const wordList = extractWords(text);
  const words = wordList.length;
  const characters = countCodePoints(text);
  const charactersNoSpaces = countCodePoints(text.replace(/\s/g, ""));
  const sentenceList = splitSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

  const counts = sentenceList.map((s) => s.words);
  const longest = counts.length ? Math.max(...counts) : 0;
  const shortest = counts.length ? Math.min(...counts) : 0;
  const avg = counts.length ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences: sentenceList.length,
    paragraphs,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
    tokensEstimate: Math.ceil(characters / 4),
    avgSentenceWords: avg,
    longestSentenceWords: longest,
    shortestSentenceWords: shortest,
    longSentences: counts.filter((c) => c > LONG_SENTENCE_WORDS).length,
    sentenceList,
    wordList,
  };
}

const STOP_WORDS = new Set(
  ("the a an and or but of to in on for with is are was were be it its this that as at by from you your we our i he she they them his her not no so if then than can will just do does did have has had my me us also into about more all one").split(" "),
);

export type Keyword = { word: string; count: number; percent: number };

export function topKeywords(wordList: string[], ignoreCommon: boolean, limit = 6): Keyword[] {
  const freq = new Map<string, number>();
  let total = 0;
  for (const raw of wordList) {
    if (/^(https?:|www\.)/i.test(raw) || raw.includes("@")) continue;
    const w = raw.toLowerCase();
    total++;
    if (w.length < 2) continue;
    if (ignoreCommon && STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, percent: total ? (count / total) * 100 : 0 }));
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export const formatNumber = (n: number) => n.toLocaleString("en-US");


// ===== case conversion =====
export type CaseMode = "upper" | "lower" | "title" | "sentence";

const SMALL = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","of","in","up","as"]);

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title": {
      let i = 0;
      return text.toLowerCase().replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, (w, offset: number, full: string) => {
        const first = i++ === 0;
        const rest = full.slice(offset + w.length);
        const last = !/[\p{L}\p{N}]/u.test(rest);
        if (!first && !last && SMALL.has(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      });
    }
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?…]\s+|\n\s*)(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase())
        .replace(/\bi\b/g, "I");
  }
}


// ===== platform limits =====
/**
 * Platform character limits. One list feeds the interactive checker AND the
 * SEO table, so they can never disagree.
 * TODO(before launch): re-verify every number and update LIMITS_CHECKED.
 */
export type PlatformLimit = {
  id: string;
  name: string;
  limit: number;
  limitLabel: string;
  tip: string;
};

export const LIMITS_CHECKED = "November 2026";

export const PLATFORM_LIMITS: PlatformLimit[] = [
  { id: "x", name: "X post", limit: 280, limitLabel: "280 characters", tip: "Longer posts need a paid plan" },
  { id: "seo", name: "SEO title", limit: 60, limitLabel: "about 60 characters", tip: "Put the main keyword first" },
  { id: "meta", name: "Meta description", limit: 160, limitLabel: "about 155–160 characters", tip: "Give a clear reason to click" },
  { id: "ig", name: "Instagram", limit: 2200, limitLabel: "2,200 characters", tip: "Hook readers in the first line" },
  { id: "li", name: "LinkedIn", limit: 3000, limitLabel: "3,000 characters", tip: "Break text into short paragraphs" },
  { id: "yt", name: "YouTube title", limit: 100, limitLabel: "100 characters", tip: "Keep the key words in the first 60" },
];