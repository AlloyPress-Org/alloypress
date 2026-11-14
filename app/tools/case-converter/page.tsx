import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";
import { CASE_DEMO, CASE_MODES, convertCase } from "@/lib/tools/text";

import "./case-converter.css";
import CaseConverter from "./CaseConverter";

const content: ToolContent = {
  metaTitle: "Case Converter – UPPER, Title, camelCase, snake_case",
  metaDescription:
    "Free online case converter: UPPERCASE, Title Case (AP, APA, Chicago, MLA), camelCase, snake_case, bold and italic text. Live, private, no sign-up.",
  h1: "Free Online Case Converter",
  h1Accent: "Case Converter",
  intro:
    "Convert text to 14 case formats as you type, from Title Case to camelCase and snake_case. Runs in your browser, so your text is never uploaded.",

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
          list: ["UPPER, lower and Sentence case", "Title Case in AP, APA, Chicago or MLA style", "Keeps acronyms like NASA", "Bold and italic for social posts"],
        },
        {
          icon: "bolt",
          title: "Code cases for developers",
          text: "Turn a phrase into a variable, file or URL name without retyping it.",
          list: ["camelCase and PascalCase", "snake_case and kebab-case", "CONSTANT_CASE"],
          highlight: true,
        },
        {
          icon: "free",
          title: "No sign-ups, limits or paywalls",
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
        { title: "Pick a case", text: "Choose a text case or a code case. It turns green and the result updates as you type. Tap it again to get your original text back. The preview shows all 14 formats at once." },
        { title: "Copy or download", text: "Copy the result or save it as a .txt file. To change only part of your text, highlight that part and pick a case." },
      ],
    },
    {
      kind: "table",
      id: "cases",
      title: "All the cases, with examples",
      intro: `Every case below is applied to the same text: “${CASE_DEMO}”.`,
      head: ["Case", "Result"],
      rows: CASE_MODES.map((c) => [c.label, convertCase(CASE_DEMO, c.mode)]),
    },
    {
      kind: "prose",
      id: "title-case",
      title: "Title Case: AP, APA, Chicago and MLA",
      paragraphs: [
        "Title Case capitalises the main words of a headline. Style guides disagree on the small words. AP and APA capitalise every word of four letters or more and keep short articles, conjunctions and prepositions lower case. Chicago and MLA keep all prepositions lower case, whatever their length.",
        "The first and last word, and the first word after a colon, are always capitalised. Turn on “Keep acronyms” to leave words like NASA or SEO as typed. It only works when your text is not already all in capitals.",
        "Sentence case capitalises only the first letter of each sentence and the word “I”. Capitalized Case capitalises every word.",
      ],
      chips: [
        "AP: “a tale from the moon” → A Tale From the Moon",
        "Chicago: “a tale from the moon” → A Tale from the Moon",
        "“HELLO. HOW ARE YOU?” → Hello. How are you?",
      ],
    },
    {
      kind: "prose",
      id: "code-case",
      title: "camelCase, snake_case and other code cases",
      paragraphs: [
        "Code cases join words with no spaces so they can be used as variable, function, file or URL names. Spaces, punctuation and existing camelCase or snake_case are all treated as word breaks, so you can convert from one code case to another.",
        "Each line is converted on its own, so you can paste a list of names and get a list back.",
      ],
      chips: [
        "camelCase: “user first name” → userFirstName",
        "snake_case: “user first name” → user_first_name",
        "kebab-case: “user first name” → user-first-name",
        "CONSTANT_CASE: “userFirstName” → USER_FIRST_NAME",
      ],
    },
    {
      kind: "prose",
      id: "rules",
      title: "How text is converted",
      bullets: [
        "UPPER and lower case change every letter, including accented letters.",
        "Title, Sentence and Capitalized Case first lower the text. With “Keep acronyms” on, words already in capitals (NASA, SEO) are kept.",
        "Code cases keep only letters and numbers. Symbols and punctuation are removed.",
        "Line breaks are kept in every case.",
        "Bold and italic use Unicode letters, so they paste into X, LinkedIn and Instagram. They are not real font styles, and screen readers may read them badly.",
        "Bold or italic text can be converted again: every case turns those letters back to plain ones first.",
      ],
    },
  ],

  faq: [
    { question: "Is my text uploaded anywhere?", answer: "No. Everything is converted in your browser. Open your browser’s network tab while you type and you’ll see no requests carrying your text." },
    { question: "Is it really free?", answer: "Yes, with no sign-up and no text limit." },
    { question: "Do I need an account?", answer: "No. There is no login and nothing to install." },
    { question: "What is the difference between Title Case and Sentence case?", answer: "Title Case capitalises the main words of a headline. Sentence case capitalises only the first word of each sentence and the word “I”." },
    { question: "Why did my acronym change to lower case?", answer: "Turn on “Keep acronyms”. It leaves words already in capitals, such as “NASA” or “SEO”, as typed. It cannot tell acronyms apart when your whole text is in capitals." },
    { question: "Which title case style should I use?", answer: "Use AP for news and most web headlines, APA for academic papers, and Chicago or MLA for books and essays. When you are not sure, check the guide your publisher or school follows." },
    { question: "Can I convert only part of my text?", answer: "Yes. Highlight the part you want to change and pick a case. The rest of your text stays as it is. This is a one-time change, so use Undo to revert it." },
    { question: "How do I remove a case?", answer: "Tap the green case again and your original text comes back. Undo and Redo also work, and so do Ctrl+Z and Ctrl+Shift+Z." },
    { question: "Can I turn bold or italic text back to normal?", answer: "Yes. Tap the green Bold or Italic button again to restore your text, or pick any other case. Every case turns bold and italic letters back to plain ones first." },
    { question: "What is the all cases preview?", answer: "A grid that shows your text in all 14 formats at once. Tap a card to select that case, or copy it straight from the card." },
    { question: "What is camelCase?", answer: "camelCase joins words with no spaces and capitalises every word except the first, like “userFirstName”. PascalCase is the same but capitalises the first word too." },
    { question: "What is the difference between snake_case and kebab-case?", answer: "snake_case joins words with underscores and kebab-case joins them with hyphens. Snake case is common in Python and databases. Kebab case is common in URLs and CSS." },
    { question: "Can I convert a whole list at once?", answer: "Yes. Code cases convert each line separately, so a list of names comes back as a list of identifiers." },
    { question: "Does it keep my line breaks?", answer: "Yes, in every case." },
    { question: "Will I lose my text if I refresh?", answer: "No. It is saved in this browser until you press Clear." },
    { question: "Does it work on my phone?", answer: "Yes, in any modern mobile browser." },
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