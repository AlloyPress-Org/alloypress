import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./ai-text-cleaner.css";
import AiTextCleaner from "./AiTextCleaner";

const content: ToolContent = {
  metaTitle: "AI Text Cleaner – Remove Markdown & Hidden Characters",
  metaDescription:
    "Free AI text cleaner. Remove Markdown, hidden characters, extra line breaks and em dashes from ChatGPT, Claude and Gemini text. Private, in your browser.",
  h1: "Free AI Text Cleaner",
  h1Accent: "AI Text Cleaner",
  intro:
    "Paste text from ChatGPT, Claude or Gemini and clear out the Markdown symbols, hidden characters, extra line breaks and dashes. Your wording stays the same, and nothing leaves your browser.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "What it cleans",
      title: "Make AI Text Ready to Paste Anywhere",
      intro: "AI chat tools copy a lot of formatting you cannot see or do not want. Clean it in one click, then paste into Word, Google Docs, your CMS or an email.",
      items: [
        {
          icon: "bolt",
          title: "Formatting leftovers",
          text: "Turn chat formatting into clean text.",
          list: ["**bold**, ## headings and backticks", "Extra blank lines and double spaces", "Bullet lists to plain lists", "HTML to readable text"],
        },
        {
          icon: "search",
          title: "Hidden characters",
          text: "Find characters you cannot see.",
          list: ["Zero-width spaces and BOM", "Non-breaking and odd spaces", "Hidden direction marks", "Em dashes and curly quotes"],
          highlight: true,
        },
        {
          icon: "lock",
          title: "You stay in control",
          text: "Every step is a switch.",
          list: ["Presets and individual toggles", "URLs, emails and code kept safe", "Custom find and replace rules", "Nothing is uploaded"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to clean AI text",
      items: [
        { title: "Paste your text", text: "Paste from any AI chat, website or document. The cleaned version appears next to it as you type." },
        { title: "Pick a preset", text: "Choose AI Text, Plain Text or Professional, or switch steps on and off yourself." },
        { title: "Check the summary", text: "A line under the boxes shows exactly what was removed, such as hidden characters and Markdown symbols." },
        { title: "Copy or download", text: "Copy plain text, copy with formatting, or save a .txt file." },
      ],
    },
    {
      kind: "table",
      id: "options",
      title: "What each option does",
      head: ["Option", "What it does", "Example"],
      rows: [
        ["Remove Markdown", "Removes the symbols and keeps the words", "**Speed** matters → Speed matters"],
        ["Invisible characters", "Deletes zero-width spaces, BOM and hidden marks", "Spe(zero-width space)ed → Speed"],
        ["Extra spaces", "Collapses double spaces and tabs", "Use  a  CDN → Use a CDN"],
        ["Blank lines", "Keeps one blank line between paragraphs", "3 empty lines → 1"],
        ["Dashes", "Turns em dashes into a hyphen or comma", "fast — and simple → fast - and simple"],
        ["Quotes and ellipsis", "Straightens curly quotes and the … character", "“Hi”… → \"Hi\"..."],
        ["HTML", "Converts tags to readable text", "<b>Hi</b> → Hi"],
        ["Repeated lines", "Removes lines or paragraphs that repeat", "Same line twice → once"],
        ["Intro and closing lines", "Removes lines like “Sure! Here’s …”", "Optional, off by default"],
      ],
    },
    {
      kind: "table",
      id: "cleanup",
      title: "Text cleanup, not detector evasion",
      head: ["What this tool does", "What it never does"],
      rows: [
        ["✓ Removes Markdown symbols and stray spaces", "✕ Rewrites your sentences or changes word choice"],
        ["✓ Clears hidden characters and extra line breaks", "✕ Tries to make text look human-written"],
        ["✓ Keeps your wording exactly as it is", "✕ Changes how AI detectors score a text"],
        ["✓ Gives you tidy, paste-ready text", "✕ Works as a way around detectors"],
      ],
    },
    {
      kind: "steps",
      id: "hidden",
      title: "About hidden characters and watermarks",
      items: [
        { title: "Where they come from", text: "Zero-width spaces are usually left over from web pages, documents and apps." },
        { title: "What they break", text: "They can break search, spell checks, code and form fields, which is why cleaning them is useful." },
        { title: "No invisible watermark", text: "Plain text from ChatGPT, Claude or Gemini has no hidden watermark made of invisible characters, so cleaning is not removing one." },
        { title: "Statistical marks", text: "Some research systems mark text through word choice. A text cleaner cannot find or remove that, and this tool does not claim to." },
      ],
    },
    {
      kind: "prose",
      id: "safe",
      title: "What stays untouched",
      bullets: [
        "Your wording. The tool never rewrites sentences.",
        "URLs and email addresses, when “Keep URLs, emails and code untouched” is on.",
        "Code inside backticks and code blocks, including spacing.",
        "Everything stays in your browser. Nothing is uploaded or logged.",
      ],
    },
  ],

  faq: [
    { question: "Is my text uploaded anywhere?", answer: "No. Everything runs in your browser. Open your browser’s network tab while you type and you’ll see no requests carrying your text." },
    { question: "Does it change my wording?", answer: "No. It only removes formatting, hidden characters and extra whitespace. The optional intro and closing line removal deletes whole lines, and it is off by default." },
    { question: "Does it make AI text undetectable?", answer: "No, and it is not meant to. Detectors look at writing patterns, not formatting, so cleaning does not change the result. It is a cleanup tool." },
    { question: "Is there a hidden watermark in ChatGPT, Claude or Gemini text?", answer: "Not one made of invisible characters. Hidden characters in pasted text usually come from web pages and apps. Statistical watermarks, which are based on word choice, cannot be removed by a cleaner." },
    { question: "What are zero-width characters?", answer: "Characters that take up no space on screen, like the zero-width space and the byte order mark (BOM). They can break search, code and forms, so it helps to remove them." },
    { question: "Why replace em dashes?", answer: "Some styles and systems prefer a plain hyphen or a comma. It is optional. Choose “Keep” if you want your dashes left alone." },
    { question: "Can I keep my formatting when I copy?", answer: "Yes. “Copy with formatting” puts headings, bold text and lists on your clipboard as real formatting, so they keep their look in Word, Google Docs and email." },
    { question: "What do the presets do?", answer: "AI Text cleans the usual chat formatting. Plain Text also removes list markers and joins broken lines. Professional also removes intro and closing lines and repeated paragraphs. Custom is for your own choices." },
    { question: "Will it break my code or links?", answer: "No, when “Keep URLs, emails and code untouched” is on, which is the default. Code in backticks and code blocks, URLs and emails are left exactly as they are." },
    { question: "Can I undo a change?", answer: "Your original text stays in the left box, so nothing is lost. If you use “Use as original”, press Undo to go back." },
    { question: "Can I add my own rules?", answer: "Yes. Add up to six find and replace rules, with an optional regular expression switch." },
  ],

  // Shown as cards at the end of the page. Slugs that do not exist are skipped. The humanizer slug is a guess (several spellings are listed): keep only the real one.
  blogSlugs: ["best-ai-detectors", "best-ai-humanizers", "best-ai-humanizer", "best-ai-humanizer-tools", "best-ai-blog-writing-tools"],
};

export const metadata = toolMetadata("ai-text-cleaner", content);

export default function AiTextCleanerPage() {
  return (
    <ToolPage slug="ai-text-cleaner" content={content}>
      <AiTextCleaner />
    </ToolPage>
  );
}