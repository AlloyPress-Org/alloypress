import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./text-diff.css";
import TextDiff from "./TextDiff";

const content: ToolContent = {
  metaTitle: "Text Compare: Free Diff Checker to Compare Two Texts Online",
  metaDescription:
    "Compare two texts and see every added, removed and changed word highlighted. Free online diff checker that runs in your browser. No sign-up.",
  h1: "Free Text Compare (Diff Checker)",
  h1Accent: "Text Compare",
  intro:
    "Paste or upload two versions of a text and see exactly what changed, line by line and word by word. It runs in your browser, so your text and files are never uploaded.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "Spot Every Change in Seconds",
      intro: "Reading two versions side by side is slow and easy to get wrong. Paste both and let the highlights show you what moved.",
      items: [
        {
          icon: "search",
          title: "Word-level highlights",
          text: "Changed words are marked inside the line, not just the whole line.",
          list: ["Removed text in red", "Added text in green", "Split or unified view"],
        },
        {
          icon: "bolt",
          title: "Made for everyday use",
          text: "Simple controls for the checks people actually do.",
          list: ["Upload files or drag and drop", "Copy each text, both texts or the diff", "Copy share link", "Ignore case and whitespace"],
        },
        {
          icon: "lock",
          title: "Private by design",
          text: "No account, no upload, no server copy of your text.",
          list: ["Runs on your device", "Share links keep text inside the link", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to compare two texts",
      items: [
        { title: "Paste or upload both texts", text: "Put the original on the left and the changed version on the right. You can also upload or drop a file on each side." },
        { title: "Read the highlights", text: "Red is removed, green is added. Use Prev and Next to jump between changes." },
        { title: "Adjust the options", text: "Ignore case or whitespace, hide line numbers, or show only the changed lines." },
        { title: "Share the result", text: "Copy a link that opens the same comparison, or copy or download the diff as text." },
      ],
    },
    {
      kind: "table",
      id: "options",
      title: "What each option does",
      head: ["Option", "What it does", "Example"],
      rows: [
        ["Upload file", "Loads a text, code or .docx file into that side", "Drag a file onto a box"],
        ["Ignore case", "Treats capital and small letters as the same", "Apple = apple"],
        ["Ignore whitespace", "Ignores extra spaces and indentation", "a  b = a b"],
        ["Line numbers", "Shows or hides the line numbers", "Hide them for plain paragraphs"],
        ["Only changes", "Hides long runs of unchanged lines", "Shows 2 lines around each change"],
        ["Split / Unified", "Side by side, or one column with − and +", "Unified is easier on a phone"],
        ["Swap", "Switches the left and right texts", "Original ⇄ Changed"],
        ["Copy options", "Copy each text, both texts, the diff, or only added or removed lines", "Copy added lines → paste into a doc"],
        ["Copy share link", "Copies a link to this exact comparison", "Send it instead of screenshots"],
        ["Words and characters", "Shows how much longer or shorter the text got", "Words 120 → 125 (+5)"],
      ],
    },
    {
      kind: "prose",
      id: "how-it-works",
      title: "How the diff checker works",
      paragraphs: [
        "The tool first compares the two texts line by line and finds the smallest set of lines to remove and add. Where one line changed into another, it then compares the two lines word by word, so you see which words changed.",
        "The summary counts lines. A line that exists in both texts but was edited is counted as changed. A line only in the changed text is counted as added, and a line only in the original is counted as removed.",
      ],
      chips: [
        "Step 1 → Compare line by line",
        "Step 2 → Compare word by word",
        "Edited line → Changed",
        "Line only in changed text → Added",
        "Line only in original → Removed",
      ],
    },
        {
      kind: "prose",
      id: "share",
      title: "Share links and privacy",
      bullets: [
        "Your files and text are compared in your browser. Nothing is uploaded.",
        "A share link keeps both texts after the # sign, which browsers never send to a server.",
        "Anyone who has the link can read both texts, so only send it to people who should see them.",
        "Very long texts do not fit in a link. Use Copy diff, Copy added or removed lines, or Download .txt instead.",
      ],
      note: "Tip: if the text is private, copy the diff instead of sharing a link.",
    },
  ],

  faq: [
    { question: "Is my text uploaded anywhere?", answer: "No. Everything is compared in your browser. Open your browser’s network tab while you type and you’ll see no requests carrying your text." },
    { question: "Can I compare Word or PDF files?", answer: "Word .docx files, yes: the text is read in your browser and loaded into the box. Old .doc files and PDFs are not supported, so copy the text from them and paste it. Plain text, .md, .csv, .json and code files all work, up to 5 MB." },
    { question: "How does the share link work without a server?", answer: "Both texts are packed into the link, after the # sign. Browsers never send that part to a server. Anyone with the link sees the same comparison." },
    { question: "Who can read a shared link?", answer: "Anyone who has the link, because the text is inside it. Treat it like sending the text itself." },
    { question: "Why can’t I share a very long text?", answer: "Links have a length limit. When the texts are too long, use Copy diff or Download .txt instead." },
    { question: "What is the difference between split and unified view?", answer: "Split shows the two texts side by side. Unified shows one column, with − before removed lines and + before added lines. It fits small screens better." },
    { question: "What does Ignore case do?", answer: "It treats “Apple” and “apple” as the same, so only real wording changes show up." },
    { question: "What does Ignore whitespace do?", answer: "It ignores extra spaces, tabs and indentation, so reformatted text does not show as changed." },
    { question: "How are changed, added and removed lines counted?", answer: "By line. An edited line is counted as changed. A line only in the changed text is counted as added, and a line only in the original is counted as removed." },
    { question: "What do the word and character numbers mean?", answer: "They compare the whole original and changed texts, so you can see at a glance if the text got longer or shorter, for example +5 words." },
    { question: "Can I compare code?", answer: "Yes, it works on any plain text, including code. It is not a Git tool, so it does not know about files or branches." },
    { question: "Will I lose my text if I refresh?", answer: "No. Your two texts and options are saved in this browser until you press Clear all." },
  ],

  // Humanizer, blog writing tools, detectors. Slugs that do not exist are skipped.
  blogSlugs: ["best-ai-humanizer", "best-ai-blog-writing-tools", "best-ai-detectors"],
};

export const metadata = toolMetadata("text-compare", content);

export default function TextDiffPage() {
  return (
    <ToolPage slug="text-compare" content={content}>
      <TextDiff />
    </ToolPage>
  );
}