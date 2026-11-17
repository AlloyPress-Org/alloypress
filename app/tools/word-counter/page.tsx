import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";
import { LIMITS_CHECKED, PLATFORM_LIMITS } from "@/lib/tools/text";

import "./word-counter.css";
import WordCounter, { PageEstimator } from "./WordCounter";

const content: ToolContent = {
  metaTitle: "Free Word Counter: Count Words, Characters & Sentences",
  metaDescription:
    "Count words, characters (with and without spaces) and sentences as you type. See reading time, platform limits and AI tokens. Free, no sign-up.",
  h1: "Free Word Counter",
  h1Accent: "Free Word Counter",
  intro:
    "Count words, characters, sentences and AI tokens as you type. Runs in your browser, so your text is never uploaded.",

  sections: [
    {
      kind: "steps",
      id: "how",
      title: "How to use the word counter",
      items: [
        { title: "Type or paste", text: "Write in the box or paste from Google Docs, Word or ChatGPT." },
        { title: "Read the counts", text: "Words, characters and sentences update as you type." },
        { title: "Check limits", text: "Pick a platform or set a word goal, then trim until it fits." },
      ],
    },
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "Why use this word counter",
      intro: "Paste your text, see every count and limit at once, and trim until it fits.",
      items: [
        {
          icon: "search",
          title: "Every limit at once",
          text: "Titles and descriptions get cut off in search when they run long. Check how much room you have before you publish.",
          list: ["SEO title: about 60 characters", "Meta description: 155–160 characters", "X, LinkedIn, Instagram and YouTube limits"],
        },
        {
          icon: "bolt",
          title: "Live counts as you type",
          text: "Everything updates together, so there is no switching tools and no manual counting.",
          list: ["Words and characters", "Sentences and reading time", "AI token estimate", "Keywords and long sentences"],
        },
        {
          icon: "free",
          title: "Free and private",
          text: "No account and no word limit. Your text stays in your browser.",
          list: ["100% free", "No login or sign-up", "No word limit", "Nothing uploaded"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "prose",
      id: "characters",
      title: "Character count with and without spaces",
      paragraphs: [
        "“Characters” counts every letter, number, space and punctuation mark. “Characters (no spaces)” leaves out spaces, tabs and line breaks. Social platforms and most forms count spaces; some schools and translation rates use the count without them. The counter shows both, so you never have to switch.",
      ],
      chips: ["“Hello world” → 11 characters", "“Hello world” → 10 without spaces"],
    },
    {
      kind: "prose",
      id: "sentences",
      title: "Sentence counter and sentence length checker",
      paragraphs: [
        "The sentence counter splits your text at full stops, question marks, exclamation marks and ellipses. It skips common abbreviations such as “Dr.” and “e.g.”, and treats a blank line as the end of a sentence.",
        "Sentences over 25 words are flagged as long. Shorter sentences are usually easier to read, so use the list under the counter to find the ones worth splitting.",
      ],
      chips: ["“Dr. Smith left. He sat.” → 2 sentences", "Over 25 words → flagged as long"],
    },
    {
      kind: "prose",
      id: "rules",
      title: "How words are counted",
      bullets: [
        "A word is any run of letters or numbers. “AI-powered” and “don’t” count as one word each.",
        "Numbers count as words: “2026” and “3.5” are one word each.",
        "Links and email addresses count as one word.",
        "A sentence ends at a full stop, question mark or exclamation mark followed by a space or the end of the text, or at a blank line.",
        "A paragraph is text separated by an empty line.",
      ],
      paragraphs: [
        "Google Docs and Word follow slightly different rules for hyphens, symbols and links, so their totals can differ by a few words on long documents.",
      ],
    },
    {
      kind: "table",
      id: "limits",
      title: "Common character limits",
      intro: "Limits change from time to time, so check each platform before you publish.",
      head: ["Where", "Limit", "Tip"],
      rows: PLATFORM_LIMITS.map((p) => [p.name, p.limitLabel, p.tip]),
      note: `Last checked ${LIMITS_CHECKED}.`,
    },
    {
      kind: "widget",
      id: "pages",
      title: "Plan your writing with page estimates",
      intro:
        "About 2 pages single-spaced or 4 pages double-spaced for 1,000 words, using 12-point Times New Roman with 1-inch margins. Drag to estimate any length.",
      widget: "page-estimator",
    },
  ],

  faq: [
    { question: "Is my text uploaded anywhere?", answer: "No. Everything is counted in your browser. Open your browser’s network tab while you type and you’ll see no requests carrying your text." },
    { question: "Is it really free?", answer: "Yes, with no sign-up and no word limit." },
    { question: "Do I need an account?", answer: "No. There is no login and nothing to install." },
    { question: "How are words counted?", answer: "A word is a run of letters or numbers. Hyphenated words and contractions count as one word, and links and email addresses count as one word." },
    { question: "How does the sentence counter work?", answer: "It ends a sentence at a full stop, question mark, exclamation mark or ellipsis followed by a space or the end of the text, and at a blank line. Common abbreviations like “Dr.” and “e.g.” are skipped." },
    { question: "What counts as a long sentence?", answer: "Any sentence over 25 words. The longest sentence and the number of long sentences are shown in the sentence analysis." },
    { question: "Does it count spaces as characters?", answer: "It shows both: characters with spaces and characters without spaces." },
    { question: "Why is my count different from Google Docs or Word?", answer: "Each tool treats hyphens, symbols and links slightly differently, so totals can differ by a few words on long documents." },
    { question: "How is reading time calculated?", answer: "Words divided by 238 words a minute, a common average for adult silent reading. Speaking time uses 150." },
    { question: "How accurate is the AI token count?", answer: "It is an estimate of roughly 4 characters per token. Real counts vary by model and language." },
    { question: "Will I lose my text if I refresh?", answer: "No. It is saved in this browser until you press Clear." },
    { question: "Does it work on my phone?", answer: "Yes, in any modern mobile browser." },
  ],

  // Posts shown as "From the AlloyPress blog". Slugs that do not exist are skipped; the section hides itself when empty.
  blogSlugs: ["best-ai-blog-writing-tools", "what-is-chat-gpt", "ai-hallucinations-explained"],
};

export const metadata = toolMetadata("word-counter", content);

export default function WordCounterPage() {
  return (
    <ToolPage slug="word-counter" content={content} widgets={{ "page-estimator": <PageEstimator /> }}>
      <WordCounter />
    </ToolPage>
  );
}