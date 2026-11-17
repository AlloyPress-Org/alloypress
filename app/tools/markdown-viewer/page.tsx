import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./markdown-viewer.css";
import MarkdownViewer from "./MarkdownViewer";

const content: ToolContent = {
  metaTitle: "Markdown Viewer: Open and Preview .md Files Online",
  metaDescription:
    "Open a .md file or paste Markdown and see it rendered live, with tables, code highlighting, Mermaid diagrams and math. Free, private, runs in your browser.",
  h1: "Free Markdown Viewer",
  h1Accent: "Markdown Viewer",
  intro:
    "Upload a .md file or paste Markdown from ChatGPT, Claude or a README and read it as a clean page. Tables, code, diagrams and math all render, and nothing leaves your browser.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "Read Markdown the Way It Was Meant to Look",
      intro: "Raw Markdown is full of symbols. Paste it or open the file and get a clean, readable page in one step.",
      items: [
        {
          icon: "search",
          title: "Renders what AI and docs write",
          text: "Built for the files ChatGPT, Claude, Cursor and README pages produce.",
          list: ["GitHub Flavored Markdown", "Tables and task lists", "Code with syntax highlighting", "Mermaid diagrams and LaTeX math"],
        },
        {
          icon: "bolt",
          title: "Take it with you",
          text: "Copy or save the result in the format you need.",
          list: ["Copy HTML or formatted text", "Download as an HTML file", "Download as PDF", "Upload or drag and drop .md files"],
        },
        {
          icon: "lock",
          title: "Private and free",
          text: "No sign-ups or paywalls. Your files stay on your device.",
          list: ["Nothing is uploaded", "No account needed", "Unsafe HTML is removed", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to view a Markdown file",
      items: [
        { title: "Upload or paste", text: "Click Upload .md, drop a file on the editor, or paste Markdown into the box." },
        { title: "Read the preview", text: "The rendered page updates as you type. Use Split, Write or Preview to change the layout." },
        { title: "Copy or download", text: "Copy HTML, copy formatted text, or download the page as HTML or PDF." },
      ],
    },
    {
      kind: "table",
      id: "syntax",
      title: "What the viewer supports",
      head: ["Feature", "You type", "You get"],
      rows: [
        ["Headings", "## Title", "A section heading"],
        ["Bold and italic", "**bold** and *italic*", "bold and italic text"],
        ["Strikethrough", "~~old~~", "Crossed-out text"],
        ["Tables", "| A | B |", "A formatted table"],
        ["Task lists", "- [x] Done", "A checked box"],
        ["Code blocks", "```js", "Highlighted code"],
        ["Mermaid diagrams", "```mermaid", "A flowchart or diagram"],
        ["Inline math", "$E = mc^2$", "A formatted formula"],
        ["Block math", "$$ ... $$", "A centered formula"],
      ],
    },
    {
      kind: "prose",
      id: "diagrams-math",
      title: "Mermaid diagrams and math",
      paragraphs: [
        "Start a code block with the word mermaid and write your diagram inside it. The viewer draws it as a chart. If the syntax has a mistake, you see an error message in place of the diagram.",
        "Wrap math in single dollar signs for a formula inside a sentence, or double dollar signs for a formula on its own line. Math is typeset with KaTeX.",
      ],
      chips: [
        "```mermaid → Flowchart, sequence or Gantt chart",
        "$a^2 + b^2 = c^2$ → Inline formula",
        "$$ ... $$ → Centered block formula",
      ],
    },
    {
      kind: "prose",
      id: "privacy",
      title: "Privacy and safety",
      bullets: [
        "Files and text are read and rendered in your browser. Nothing is uploaded.",
        "Scripts, event handlers and unsafe links in your Markdown are removed before the preview is shown.",
        "Your text is saved only in this browser, and Clear removes it.",
        "Exported HTML loads the math stylesheet from a public CDN. Everything else is inside the file.",
      ],
    },
  ],

  faq: [
    { question: "Is my file uploaded anywhere?", answer: "No. Files and text are read and rendered in your browser. Open your browser’s network tab while you use the tool and you’ll see no requests carrying your content." },
    { question: "Which files can I upload?", answer: "Markdown files (.md, .markdown, .mdown, .mkd) and plain .txt files, up to 5 MB. You can click Upload .md or drop a file on the editor." },
    { question: "Does it support GitHub Flavored Markdown?", answer: "Yes. Tables, task lists, strikethrough, autolinks and fenced code blocks all render the way they do on GitHub." },
    { question: "Which languages get code highlighting?", answer: "About 35 common languages, including JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, SQL, HTML, CSS, JSON, YAML, Bash and Markdown. Add the language after the opening fence, like ```python." },
    { question: "How do I add a Mermaid diagram?", answer: "Open a code block with ```mermaid, write your diagram, and close the block. Flowcharts, sequence diagrams, Gantt charts and more are supported. A syntax mistake shows an error instead of the diagram." },
    { question: "How do I write math?", answer: "Use $...$ for a formula inside a sentence and $$...$$ on separate lines for a centered formula. Math uses LaTeX syntax and is rendered with KaTeX." },
    { question: "How do I save the preview as a PDF?", answer: "Click Download PDF. Your browser’s print dialog opens, and you choose “Save as PDF” as the printer. Only the preview is printed, in light colors." },
    { question: "What is the difference between Copy HTML and Copy formatted?", answer: "Copy HTML copies the HTML code, which you can paste into a CMS or an editor’s code view. Copy formatted copies the rendered page as rich text, so it keeps its look when you paste into Word, Google Docs or email." },
    { question: "Is HTML inside my Markdown safe?", answer: "Safe HTML such as details, tables and images works. Scripts, inline event handlers and javascript: links are removed before the preview is shown." },
    { question: "Will I lose my text if I refresh?", answer: "No. Your text is saved in this browser until you press Clear. Very large files are not saved." },
  ],

  blogSlugs: ["best-ai-blog-writing-tools", "what-is-chat-gpt", "ai-hallucinations-explained"],
};

export const metadata = toolMetadata("markdown-viewer", content);

export default function MarkdownViewerPage() {
  return (
    <ToolPage slug="markdown-viewer" content={content}>
      <MarkdownViewer />
    </ToolPage>
  );
}