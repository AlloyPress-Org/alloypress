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
        { title: "Upload or paste", text: "Click the upload icon, drop a file on the editor, or paste Markdown into the box." },
        { title: "Read the preview", text: "The rendered page updates as you type. Use Split, Write or Preview to change the layout." },
        { title: "Copy or download", text: "Copy HTML, copy formatted text, or download the page as HTML or PDF." },
      ],
    },
    {
      kind: "split",
      id: "mermaid",
      eyebrow: "Diagrams",
      title: "Preview Mermaid Diagrams Instantly",
      intro: "Write a diagram as text inside a mermaid code block and the viewer draws it next to your Markdown. No plugin and no sign-up.",
      rows: [
        {
          badge: "Flowcharts",
          title: "Turn a few lines of text into a flow",
          text: "Describe steps and decisions in plain text. The viewer draws the chart as you type.",
          list: ["Flowchart, top-down or left-right", "State diagram and Git graph", "Mindmap and timeline"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">mermaid</span>
              <pre className="tl-demo-code">{`flowchart LR\n  A[Paste] --> B{Valid?}\n  B -->|Yes| C[Preview]`}</pre>
              <div className="tl-demo-arrow">↓</div>
              <div className="tl-mini-flow"><span>Paste</span><i>→</i><span className="is-d">Valid?</span><i>→</i><span className="is-ok">Preview</span></div>
            </div>
          ),
        },
        {
          badge: "Systems and data",
          title: "Show how the parts of a system talk",
          text: "Sequence, class, ER, Gantt and pie diagrams all use the same simple text format.",
          list: ["Sequence and class diagrams", "Entity relationship (ER)", "Gantt chart and pie chart"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">Supported diagram types</span>
              <div className="tl-chips">
                {["Flowchart", "Sequence", "Class", "State", "ER", "Gantt", "Pie", "Git graph", "Mindmap", "Timeline"].map((t) => <span key={t}>{t}</span>)}
              </div>
            </div>
          ),
        },
        {
          badge: "Fail-safe",
          title: "One broken diagram never breaks the page",
          text: "A syntax mistake shows a clear message. A type that cannot be drawn shows its source instead.",
          list: ["Drawn on a white card", "Readable in dark mode and in PDF", "The rest of your page keeps working"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">Syntax mistake</span>
              <div className="tl-demo-err">Diagram error: Parse error on line 2</div>
              <span className="tl-demo-tag">Cannot be drawn</span>
              <pre className="tl-demo-code">{`block-beta\n  columns 2\n  a b`}</pre>
            </div>
          ),
        },
      ],
    },
    {
      kind: "split",
      id: "math-code",
      eyebrow: "Math and code",
      title: "Formulas and Code That Look Right",
      intro: "Technical notes need more than headings and bullets. The viewer typesets math and colors code the way GitHub does.",
      rows: [
        {
          badge: "KaTeX",
          title: "Write formulas with dollar signs",
          text: "Use LaTeX inside a sentence or on its own line. Math also works in the HTML and PDF export.",
          list: ["$...$ inside a sentence", "$$...$$ for a centered formula", "Fractions, sums and integrals"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">You type</span>
              <pre className="tl-demo-code">{`Energy: $E = mc^2$`}</pre>
              <div className="tl-demo-arrow">↓</div>
              <div className="tl-demo-out tl-math"><i>E</i> = <i>mc</i><sup>2</sup></div>
              <div className="tl-demo-out tl-math">∫₀¹ <i>x</i><sup>2</sup> <i>dx</i> = ⅓</div>
            </div>
          ),
        },
        {
          badge: "Highlighting",
          title: "Code with colors, in 35 languages",
          text: "Add the language after the opening fence and keywords, strings and comments get their colors.",
          list: ["JavaScript, TypeScript and Python", "Java, C, C++, C# and Go", "SQL, HTML, CSS, JSON, YAML and Bash"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">js</span>
              <pre className="tl-demo-code">
                <span className="tl-c">{`// say hello\n`}</span>
                <span className="tl-k">const</span> <span className="tl-f">greet</span> = (name) =&gt;{" "}
                <span className="tl-s">{"`Hello, ${name}!`"}</span>;
              </pre>
            </div>
          ),
        },
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
      kind: "tiles",
      id: "use-cases",
      eyebrow: "Use cases",
      title: "Open READMEs and AI Output in Seconds",
      intro: "Markdown is everywhere now. Here are the files people open most.",
      items: [
        { icon: "device", title: "GitHub README files", text: "Check how a README will look before you push it." },
        { icon: "bolt", title: "ChatGPT and Claude answers", text: "Read AI output as a clean page, not a wall of symbols." },
        { icon: "search", title: "Cursor and agent files", text: "Open plans, specs and notes written by coding agents." },
        { icon: "chart", title: "Tables and task lists", text: "See GitHub-style tables and checkboxes rendered properly." },
        { icon: "free", title: "Obsidian and Notion exports", text: "Preview notes exported as .md before sharing them." },
        { icon: "limit", title: "Docs and changelogs", text: "Check project docs and blog drafts before publishing." },
      ],
    },
    {
      kind: "prose",
      id: "pdf-note",
      title: "Need page size, margins or page numbers?",
      paragraphs: [
        "Download PDF here prints the preview exactly as it looks, which is quick and good for most files. If you want to choose the page size, margins and page numbers, use the Markdown to PDF tool instead.",
        "This viewer is for reading and copying. Use it when you want to see what a Markdown file says, check how it renders, or copy it into another app.",
      ],
      chips: [
        "Read or copy a .md file → Markdown Viewer",
        "Page size, margins, page numbers → Markdown to PDF",
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
    { question: "Which files can I upload?", answer: "Markdown files (.md, .markdown, .mdown, .mkd) and plain .txt files, up to 5 MB. You can click the upload icon or drop a file on the editor." },
    { question: "Can I preview a GitHub README?", answer: "Yes. Paste the README text or upload the README.md file. Tables, task lists, code blocks and links render the way they do on GitHub." },
    { question: "Does it support GitHub Flavored Markdown?", answer: "Yes. Tables, task lists, strikethrough, autolinks and fenced code blocks all render the way they do on GitHub." },
    { question: "Which languages get code highlighting?", answer: "About 35 common languages, including JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, SQL, HTML, CSS, JSON, YAML, Bash and Markdown. Add the language after the opening fence, like ```python." },
    { question: "How do I add a Mermaid diagram?", answer: "Open a code block with ```mermaid, write your diagram, and close the block. Flowcharts, sequence, class, state, ER, Gantt, pie, Git graph, mindmap and timeline diagrams are supported. A syntax mistake shows an error message in place of the diagram." },
    { question: "Why does a diagram show its source instead of a drawing?", answer: "A few diagram types, such as block diagrams, cannot be drawn in the browser yet. The viewer shows the diagram source instead, so the rest of your page still works." },
    { question: "How do I write math?", answer: "Use $...$ for a formula inside a sentence and $$...$$ on separate lines for a centered formula. Math uses LaTeX syntax and is rendered with KaTeX." },
    { question: "How do I save the preview as a PDF?", answer: "Click the PDF button. Your browser’s print dialog opens, and you choose “Save as PDF” as the printer. Only the preview is printed, in light colors. For page size, margins and page numbers, use the Markdown to PDF tool." },
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