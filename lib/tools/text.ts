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
export type CaseMode =
  | "upper" | "lower" | "title" | "sentence" | "capitalized" | "alternating" | "inverse" | "bold" | "italic"
  | "camel" | "pascal" | "snake" | "kebab" | "constant";
export type TitleStyle = "ap" | "apa" | "chicago" | "mla";
export type CaseOptions = { titleStyle?: TitleStyle; keepAcronyms?: boolean };

export const TITLE_STYLES: { id: TitleStyle; label: string; note: string }[] = [
  { id: "ap", label: "AP", note: "Words of 4+ letters are capitalised. Short a, an, the, and, but, or, for, nor and prepositions (up to 3 letters) stay lower case." },
  { id: "apa", label: "APA", note: "Same rule as AP: words of 4+ letters are capitalised, short minor words stay lower case." },
  { id: "chicago", label: "Chicago", note: "Articles, coordinating conjunctions and all prepositions stay lower case, whatever their length." },
  { id: "mla", label: "MLA", note: "Like Chicago: articles, coordinating conjunctions and prepositions stay lower case." },
];

/** One list feeds the tool buttons, the all-cases preview AND the SEO table, so they can never disagree. */
export const CASE_DEMO = "the quick brown fox";
export const CASE_MODES: { mode: CaseMode; label: string; group: "text" | "format" | "code" }[] = [
  { mode: "upper", label: "UPPER CASE", group: "text" },
  { mode: "lower", label: "lower case", group: "text" },
  { mode: "title", label: "Title Case", group: "text" },
  { mode: "sentence", label: "Sentence case", group: "text" },
  { mode: "capitalized", label: "Capitalized Case", group: "text" },
  { mode: "alternating", label: "aLtErNaTiNg", group: "text" },
  { mode: "inverse", label: "iNVERSE", group: "text" },
  { mode: "bold", label: "𝐁𝐨𝐥𝐝", group: "format" },
  { mode: "italic", label: "𝐼𝑡𝑎𝑙𝑖𝑐", group: "format" },
  { mode: "camel", label: "camelCase", group: "code" },
  { mode: "pascal", label: "PascalCase", group: "code" },
  { mode: "snake", label: "snake_case", group: "code" },
  { mode: "kebab", label: "kebab-case", group: "code" },
  { mode: "constant", label: "CONSTANT_CASE", group: "code" },
];

const MINOR_SHORT = new Set(["a","an","the","and","but","or","nor","for","so","yet","as","at","by","in","of","off","on","out","per","to","up","via"]);
const MINOR_LONG = new Set(["about","above","across","after","against","along","among","around","before","behind","below","beneath","beside","between","beyond","down","during","except","from","inside","into","like","near","onto","over","past","since","through","throughout","till","toward","towards","under","until","upon","with","within","without"]);
const isMinor = (w: string, style: TitleStyle) =>
  MINOR_SHORT.has(w) || ((style === "chicago" || style === "mla") && MINOR_LONG.has(w));

const isAcronym = (w: string) => w.length > 1 && w === w.toUpperCase() && /\p{L}/u.test(w);
/** Acronyms are only kept when the text is not already ALL CAPS (otherwise every word would look like one). */
const hasLower = (text: string) => /\p{Ll}/u.test(text);

function lowerKeep(text: string, keep: boolean): string {
  if (!keep || !hasLower(text)) return text.toLowerCase();
  return text.replace(/[\p{L}\p{N}]+/gu, (w) => (isAcronym(w) ? w : w.toLowerCase()));
}

const LETTER_AHEAD = /[^\n\p{L}\p{N}]*[\p{L}\p{N}]/uy; // sticky: is there another word on this line?

function titleCase(text: string, style: TitleStyle, keep: boolean): string {
  const canKeep = keep && hasLower(text);
  let i = 0;
  return text.replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, (w, offset: number, full: string) => {
    const first = i++ === 0;
    if (canKeep && isAcronym(w)) return w;
    const lower = w.toLowerCase();
    LETTER_AHEAD.lastIndex = offset + w.length;
    const last = !LETTER_AHEAD.test(full); // last word of its line
    const afterBreak = /(?:[:.!?]\s+|\n\s*)$/.test(full.slice(Math.max(0, offset - 8), offset));
    if (!first && !last && !afterBreak && isMinor(lower, style)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

export function convertCase(text: string, mode: CaseMode, opts: CaseOptions = {}): string {
  const keep = !!opts.keepAcronyms;
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return titleCase(text, opts.titleStyle ?? "ap", keep);
    case "sentence":
      return lowerKeep(text, keep)
        .replace(/(^\s*|[.!?…]\s+|\n\s*)(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase())
        .replace(/\bi\b/g, "I");
    case "capitalized":
      return lowerKeep(text, keep).replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
    case "alternating": {
      let n = 0;
      return Array.from(text.toLowerCase(), (ch) =>
        ch.toUpperCase() === ch.toLowerCase() ? ch : n++ % 2 ? ch.toUpperCase() : ch,
      ).join("");
    }
    case "inverse":
      return Array.from(text, (ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join("");
    case "bold":
      return styleLetters(text, false);
    case "italic":
      return styleLetters(text, true);
    default:
      // code cases work line by line, so each line becomes its own identifier
      return text.split("\n").map((line) => joinWords(caseWords(line), mode)).join("\n");
  }
}

/** Split into words: spaces, punctuation, _ - . / and camelCase boundaries all separate words. */
function caseWords(line: string): string[] {
  // ALL CAPS (e.g. USER_FIRST_NAME) has no camelCase humps to split
  const split = /\p{Ll}/u.test(line)
    ? line.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2").replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    : line;
  return (split.match(/[\p{L}\p{N}]+/gu) ?? []).map((w) => w.toLowerCase());
}

/** Bold / italic use Unicode math letters, so they paste into X, LinkedIn and Instagram (not real font styles). */
function styleLetters(text: string, italic: boolean): string {
  const [up, low, digit] = italic ? [0x1d434, 0x1d44e, 0] : [0x1d400, 0x1d41a, 0x1d7ce];
  return Array.from(text, (ch) => {
    const c = ch.codePointAt(0) as number;
    if (c >= 65 && c <= 90) return String.fromCodePoint(up + c - 65);
    if (c >= 97 && c <= 122) return italic && ch === "h" ? "\u210E" : String.fromCodePoint(low + c - 97);
    if (digit && c >= 48 && c <= 57) return String.fromCodePoint(digit + c - 48);
    return ch;
  }).join("");
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

function joinWords(words: string[], mode: CaseMode): string {
  switch (mode) {
    case "camel": return words.map((w, i) => (i ? cap(w) : w)).join("");
    case "pascal": return words.map(cap).join("");
    case "snake": return words.join("_");
    case "kebab": return words.join("-");
    default: return words.join("_").toUpperCase(); // constant
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