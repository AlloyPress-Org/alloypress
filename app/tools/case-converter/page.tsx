import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";
import { CASE_DEMO, CASE_MODES, convertCase, type CaseMode } from "@/lib/tools/text";

import "./case-converter.css";
import CaseConverter from "./CaseConverter";

const WHEN_TO_USE: Record<CaseMode, string> = {
  upper: "Short labels, warnings, buttons",
  lower: "Hashtags, casual text, cleaning up caps-lock text",
  title: "Headlines, blog titles, book and article names",
  sentence: "Emails, paragraphs, website buttons and menus",
  capitalized: "Names, product listings, simple headings",
  alternating: "Memes and jokes",
  inverse: "Fixing text typed with caps lock on",
  camel: "JavaScript variables and functions",
  pascal: "Class names, React components",
  snake: "Python, database columns, file names",
  kebab: "URLs (slugs), CSS classes",
  constant: "Environment variables, fixed settings",
};

const content: ToolContent = {
  metaTitle: "Case Converter: Convert to UPPER, lower, Title and More",
  metaDescription:
    "Convert text to UPPER, lower, Title Case, Sentence case, camelCase, snake_case and more. Free, instant and private. Your text never leaves your browser.",
  h1: "Free Online Case Converter",
  h1Accent: "Case Converter",
  intro:
    "Convert text to 12 case formats as you type, from Title Case to camelCase and snake_case. Runs in your browser, so your text is never uploaded.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "Fix the Case of Any Text in Seconds",
      intro:
        "Retyping a heading or renaming a variable by hand wastes time and adds typos. Paste your text, pick a case and copy the result.",
      items: [
        {
          title: "Text cases for writers",
          text: "Clean up headlines, captions, emails and copy that came in the wrong case.",
          list: ["UPPER, lower and Sentence case", "Title Case in AP, APA, Chicago or MLA style", "Keeps acronyms like NASA"],
        },
        {
          icon: "bolt",
          title: "Code cases for developers",
          text: "Turn a phrase into a variable, file or URL name without retyping it.",
          list: ["camelCase and PascalCase", "snake_case and kebab-case", "CONSTANT_CASE"],
        },
        {
          icon: "free",
          title: "No sign-ups or paywalls",
          text: "Free, with no account and no text limit. Your text stays on your device.",
          list: ["100% free", "Live conversion as you type", "Tap a case again to remove it", "Nothing uploaded", "Built for mobile"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to use the case converter",
      items: [
        { title: "Type or paste", text: "Write in the box or paste from Google Docs, Word or ChatGPT." },
        { title: "Pick a case", text: "Choose a text case or a code case. It turns green and the result updates as you type. Tap it again to get your original text back. The preview shows all 12 formats at once." },
        { title: "Copy or download", text: "Copy the result or save it as a .txt file. To change only part of your text, highlight that part and pick a case." },
      ],
    },
    {
      kind: "table",
      id: "cases",
      title: "All the cases, with examples",
      intro: `Every case below is applied to the same text: “${CASE_DEMO}”. Title Case is shown in AP style with Keep acronyms on.`,
      head: ["Case", "Result", "When to use it"],
      rows: CASE_MODES.map((c) => [
        c.label,
        convertCase(CASE_DEMO, c.mode, { keepAcronyms: true }),
        WHEN_TO_USE[c.mode],
      ]),
    },
    {
      kind: "prose",
      id: "title-case",
      title: "Title Case: AP, APA, Chicago and MLA",
      paragraphs: [
        "Title Case capitalizes the main words of a headline. Style guides disagree on the small words. AP and APA capitalize every word of four letters or more and keep short articles, conjunctions and prepositions lower case. Chicago and MLA keep all prepositions lower case, whatever their length.",
        "The first and last word, and the first word after a colon, are always capitalized. Turn on “Keep acronyms” to leave words like NASA or SEO as typed. It only works when your text is not already all in capitals.",
        "Sentence case capitalizes only the first letter of each sentence and the word “I”. Capitalized Case capitalizes every word.",
      ],
      chips: [
        "AP Title Case: “a tale from the moon” → A Tale From the Moon",
        "Chicago Title Case: “a tale from the moon” → A Tale from the Moon",
        "“HELLO. HOW ARE YOU?” → Hello. How are you?",
      ],
    },
    {
      kind: "prose",
      id: "code-case",
      title: "camelCase, snake_case and other code cases",
      paragraphs: [
        "Code cases join words without spaces, for variable, file and URL names. Spaces, punctuation and existing camelCase or snake_case are treated as word breaks, and each line converts separately, so you can paste a whole list.",
      ],
      chips: [
        "camelCase: “user first name” → userFirstName",
        "kebab-case: “user first name” → user-first-name",
      ],
    },
    {
      kind: "prose",
      id: "rules",
      title: "How text is converted",
      bullets: [
        "UPPER and lower case change every letter, including accented letters.",
        "Title, Sentence and Capitalized Case first lower the text. With “Keep acronyms” on, words already in capitals (NASA, SEO) are kept.",
        "Sentence case lowers every word except the first, so names and places (like John, London, OpenAI) become lower case. Fix them after converting, or turn on ‘Keep acronyms’ to keep words like AI and NASA.",
        "Code cases keep only letters and numbers. Symbols and punctuation are removed.",
        "Line breaks are kept in every case.",
      ],
    },
  ],

  faq: [
    { question: "Is my text uploaded anywhere?", answer: "No. Everything is converted in your browser. Open your browser’s network tab while you type and you’ll see no requests carrying your text." },
    { question: "Is it free, and do I need an account?", answer: "It is free, with no text limit. There is no login, no sign-up and nothing to install." },
    { question: "What is the difference between Title Case and Sentence case?", answer: "Title Case capitalizes the main words of a headline. Sentence case capitalizes only the first word of each sentence and the word “I”." },
    { question: "Which title case style should I use?", answer: "Use AP for news and most web headlines, APA for academic papers, and Chicago or MLA for books and essays. When you are not sure, check the guide your publisher or school follows." },
    { question: "Why did an acronym or a name change to lower case?", answer: "Sentence case lowers every word except the first, so names like John or London become lower case. Turn on “Keep acronyms” to keep words already in capitals, such as NASA or AI. It cannot tell acronyms apart when your whole text is in capitals." },
    { question: "Can I convert only part of my text, or undo a case?", answer: "Yes. Highlight the part you want to change and pick a case. The rest stays as it is. To remove a case, tap the green button again and your original text comes back. Undo and Redo also work, and so do Ctrl+Z and Ctrl+Shift+Z." },
    { question: "What is the difference between camelCase, snake_case and kebab-case?", answer: "camelCase joins words with no spaces and capitalizes every word except the first, like “userFirstName”. snake_case uses underscores and kebab-case uses hyphens. Snake case is common in Python and databases, kebab case in URLs and CSS." },
    { question: "Will I lose my text if I refresh, and does it work on my phone?", answer: "Your text is saved in this browser until you press Clear. It works in any modern mobile browser." },
  ],

  // Posts shown as "From the AlloyPress blog". Slugs that do not exist are skipped; the section hides itself when empty.
  blogSlugs: ["best-ai-blog-writing-tools", "what-is-chat-gpt", "ai-hallucinations-explained"],
};

export const metadata = toolMetadata("case-converter", content);

export default function CaseConverterPage() {
  return (
    <ToolPage slug="case-converter" content={content}>
      <CaseConverter />
    </ToolPage>
  );
}