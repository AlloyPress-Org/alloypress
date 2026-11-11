import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";
import { LIMITS_CHECKED, PLATFORM_LIMITS } from "@/lib/tools/text";

import "./word-counter.css";
import WordCounter, { PageEstimator } from "./WordCounter";

const content: ToolContent = {
  metaTitle: "Word Counter, Character & Sentence Counter – Free Online Tool",
  metaDescription:
    "Free word counter, character counter and sentence counter. See words, characters, sentences, reading time and AI tokens as you type. No sign-up, nothing uploaded.",
  h1: "Free Word & Character Counter",
  h1Accent: "Character Counter",
  intro:
    "Count words, characters, sentences and AI tokens as you type. Runs in your browser, so your text is never uploaded.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "The Writing Limits Every Writer Faces",
      intro:
        "Turning a draft into something you can publish is a hygiene job. This counter shows every limit at once, so you can trim, fix and publish smarter.",
      items: [
        {
          icon: "search",
          title: "SEO & meta limits",
          text: "Titles and descriptions get cut off in search when they run long. Check how much room you have before you publish.",
          list: ["SEO title: about 60 characters", "Meta description: about 160", "See the cut-off before Google does"],
        },
        {
          icon: "bolt",
          title: "One counter, everything at once",
          text: "Words, characters, sentences, reading time and AI tokens update together. No switching tools, no manual counting.",
          list: ["Words and characters", "Sentences and reading time", "AI token estimate"],
          highlight: true,
        },
        {
          icon: "free",
          title: "No sign-ups, limits or paywalls",
          text: "Many counters ask you to log in or cap how much text you can paste. This one is free, with no account and no word limit.",
          list: ["100% free", "No login or sign-up", "No word limit", "Nothing uploaded", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "cards",
      id: "features",
      title: "Everything You Need for Cleaner Writing",
      intro: "A word counter, character counter and sentence counter in one place. Paste your text, check the limits and trim until it fits.",
      items: [
        {
          title: "Live platform limits",
          text: "Bars for X, SEO titles, meta descriptions, Instagram, LinkedIn and YouTube show how close you are.",
          visual: <div className="wc-bars">{[42, 66, 92, 54, 78].map((h) => <i key={h} style={{ height: `${h}%` }} />)}</div>,
        },
        {
          title: "Sentence counter & length check",
          text: "See how many sentences you have, the average length and which sentences run too long.",
          visual: (
            <div className="wc-sentbars">
              <div><span style={{ width: "34%" }} /><b>8 words</b></div>
              <div><span style={{ width: "58%" }} /><b>14 words</b></div>
              <div className="is-long"><span style={{ width: "96%" }} /><b>31 · long</b></div>
            </div>
          ),
        },
        {
          title: "Keyword insights",
          text: "Your most-used words with count and density. Switch common words off to focus on real keywords.",
          visual: (
            <div className="wc-kwvis">
              <div>design<span style={{ width: "92%" }} /><em>5.7%</em></div>
              <div>writing<span style={{ width: "68%" }} /><em>3.8%</em></div>
              <div>tools<span style={{ width: "46%" }} /><em>2.6%</em></div>
              <div>content<span style={{ width: "30%" }} /><em>1.9%</em></div>
            </div>
          ),
        },
        {
          title: "AI token estimate",
          text: "A quick estimate before you paste into ChatGPT, Claude or Gemini.",
          visual: <div className="wc-tokens">{["Write", "a", "short", "prompt", "for", "AI", "tools"].map((t) => <span key={t}>{t}</span>)}</div>,
        },
      ],
    },
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