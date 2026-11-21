import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./markdown-to-pdf.css";
import MarkdownToPdf from "./MarkdownToPdf";

const content: ToolContent = {
  metaTitle: "Markdown to PDF Converter: Free .md to PDF Online",
  metaDescription:
    "Convert Markdown to PDF with Letter or A4 size, margins and page numbers. Ideal for READMEs, ChatGPT notes and resumes. Free, nothing uploaded.",
  h1: "Free Markdown to PDF Converter",
  h1Accent: "Markdown to PDF",
  intro:
    "Paste or upload Markdown and turn it into a clean PDF. Pick the page size, margins and page numbers, check the paper preview, then download the file. Everything runs in your browser.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "From Markdown to a PDF You Can Share",
      intro: "Markdown is great to write and awkward to send. Convert it into a document anyone can open.",
      items: [
        {
          icon: "bolt",
          title: "Made for real documents",
          text: "Tables, code, diagrams and math all come through.",
          list: ["GitHub Flavored Markdown", "Syntax-highlighted code", "Mermaid diagrams and LaTeX math", "Page breaks avoid cutting through paragraphs and tables"],
        },
        {
          icon: "device",
          title: "You control the page",
          text: "Set up the PDF before you download it.",
          list: ["Letter or A4", "Narrow, normal or wide margins", "Text size, sans or serif font", "Page numbers, header and footer"],
        },
        {
          icon: "lock",
          title: "Private and free",
          text: "No sign-ups or paywalls. Your files stay on your device.",
          list: ["Nothing is uploaded", "No account needed", "No watermark", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to convert Markdown to PDF",
      items: [
        { title: "Paste or upload", text: "Paste Markdown, drop a .md file, or click Sample to see how it looks." },
        { title: "Set up the page", text: "Open Document setup and choose the page size, margins, text size and page numbers. The paper preview updates at once." },
        { title: "Download the PDF", text: "Click Download PDF and the file saves straight to your device. Use Print if you need selectable text." },
      ],
    },
    {
      kind: "tiles",
      id: "use-cases",
      eyebrow: "Use cases",
      title: "What People Turn Into PDFs",
      items: [
        { icon: "bolt", title: "AI chat notes and handouts", text: "Save ChatGPT or Claude answers as neat study notes, guides or summaries." },
        { icon: "device", title: "READMEs and technical docs", text: "Share a README, API doc, setup guide or architecture note with a team or client." },
        { icon: "limit", title: "Plans, specs and changelogs", text: "Export coding agent plans, feature specs, release notes and bug reports." },
        { icon: "chart", title: "Cheat sheets and assignments", text: "Turn formulas, code examples and structured notes into a printable page." },
      ],
    },
    {
      kind: "split",
      id: "resume",
      eyebrow: "Resumes",
      title: "Turn a Markdown Resume Into a PDF",
      intro: "Markdown keeps a resume simple. Use narrow margins and a small font so it fits on one page.",
      rows: [
        {
          badge: "Resume settings",
          title: "Write once, export a clean page",
          text: "Use headings for sections, bullets for achievements and bold for skills. The layout stays the same every time you export.",
          list: ["Narrow margins and a small font", "Turn page numbers off for one page", "Use Print if a job site needs to read the text"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">You type</span>
              <pre className="tl-demo-code">{`# Alex Morgan\nFull-stack developer · Austin, TX\n\n## Experience\n### Frontend Developer, Brightwave\n- Cut page load time by 38%`}</pre>
              <div className="tl-demo-arrow">↓</div>
              <div className="tl-demo-out">
                <strong>Alex Morgan</strong><br />
                <small>Full-stack developer · Austin, TX</small><br />
                <strong>Experience</strong><br />
                Frontend Developer, Brightwave<br />
                • Cut page load time by 38%
              </div>
            </div>
          ),
        },
      ],
    },
    {
      kind: "split",
      id: "ai-notes",
      eyebrow: "AI notes",
      title: "Turn ChatGPT and Claude Answers Into Study Notes",
      intro: "AI tools reply in Markdown. Copy the answer, paste it here and save a PDF you can print, share or keep.",
      rows: [
        {
          badge: "Copy, paste, save",
          title: "A handout from one chat answer",
          text: "Headings, bullets, tables and code come through with clean formatting. Add a header, page numbers and a file name, then download.",
          list: ["Works with ChatGPT, Claude, Gemini and Cursor", "Tables and code keep their layout", "Clean up stray symbols with the AI Text Cleaner first"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">Chat answer</span>
              <pre className="tl-demo-code">{`## Key ideas\n- **Cache hit:** fast\n- **Cache miss:** fetch, then store`}</pre>
              <div className="tl-demo-arrow">↓</div>
              <div className="tl-demo-out">
                <strong>Key ideas</strong><br />
                • <strong>Cache hit:</strong> fast<br />
                • <strong>Cache miss:</strong> fetch, then store
              </div>
            </div>
          ),
        },
      ],
    },
    {
      kind: "table",
      id: "options",
      title: "PDF options explained",
      head: ["Option", "What it does", "Good for"],
      rows: [
        ["Page: Letter or A4", "Sets the paper size", "Letter in the US, A4 elsewhere"],
        ["Margins", "Narrow, normal or wide space around the text", "Narrow for resumes and cheat sheets"],
        ["Text size", "Small, medium or large body text", "Small to fit more, large for reading"],
        ["Font", "Sans or serif", "Serif for study notes and letters"],
        ["Page numbers", "Adds “Page 1 of 3” at the bottom", "Reports, docs and notes"],
        ["Header and footer", "Your own text on every page", "A title, a name or “Confidential”"],
        ["File name", "The name of the saved PDF", "Keeping files organized"],
      ],
    },
    {
      kind: "prose",
      id: "download-modes",
      title: "Download PDF or Print: which one?",
      paragraphs: [
        "Download PDF saves the file straight away, with no print dialog. Each page is drawn as an image, so the text is not selectable or searchable, and very long documents may not fit.",
        "Print uses your browser’s own print engine instead. It takes one extra step, but the text stays selectable and searchable, which suits resumes and long documents. Need to read or copy a .md file instead? Use the Markdown Viewer.",
      ],
      chips: [
        "Quick file to share → Download PDF",
        "Selectable, searchable text → Print",
        "Read or copy a .md file → Markdown Viewer",
      ],
    },
    {
      kind: "prose",
      id: "privacy",
      title: "Privacy and safety",
      bullets: [
        "Your Markdown is converted in your browser. The PDF tools load on demand, and neither the text nor the PDF is sent anywhere.",
        "Scripts, event handlers and unsafe links in your Markdown are removed before the preview and the PDF are made.",
        "Your text and page options are saved only in this browser. Clear removes the text.",
        "Download PDF draws the pages in your browser, so there is no watermark and no account.",
      ],
    },
  ],

  faq: [
    { question: "Is my file uploaded anywhere?", answer: "No. Files and text are read and converted in your browser. Open your browser’s network tab while you use the tool and you’ll see no requests carrying your content." },
    { question: "How do I convert Markdown to PDF?", answer: "Paste your Markdown or upload a .md file, set the page options in Document setup, then click Download PDF. The file saves straight to your device." },
    { question: "Does Download PDF open a print dialog?", answer: "No. Download PDF saves the file directly. If you prefer the browser’s print dialog, click Print above the preview and choose “Save as PDF” as the printer." },
    { question: "Is the text in the PDF selectable?", answer: "Not with Download PDF, because each page is drawn as an image. Use Print when you need to select, copy or search the text, for example for a resume that a job site must read." },
    { question: "Can I turn a README.md into a PDF?", answer: "Yes. Paste or upload the file and download. Tables, code blocks and task lists keep their formatting." },
    { question: "Can I save ChatGPT or Claude output as a PDF?", answer: "Yes. Copy the answer, paste it into the editor and click Download PDF. If it has stray symbols or hidden characters, run it through the AI Text Cleaner first." },
    { question: "Can I make a resume PDF from Markdown?", answer: "Yes. Write your resume with headings and bullets, choose narrow margins and a small font, and check that it fits on one page. Use Print if the job site needs to read the text." },
    { question: "Does it support Mermaid diagrams and math?", answer: "Yes. Diagrams in mermaid code blocks are drawn into the PDF, and LaTeX math between dollar signs is typeset with KaTeX. A diagram with a syntax mistake shows its source instead." },
    { question: "Why are page numbers or my header missing?", answer: "Download PDF draws page numbers, header and footer itself, so check that they are switched on in Document setup. With Print, they need a current Chrome, Edge or Safari. Header and footer text in a Download PDF supports Latin letters only." },
    { question: "How do I remove the date and web address from a printed PDF?", answer: "That only happens with Print. In the print dialog, open More settings and turn off “Headers and footers”. Download PDF does not add them." },
    { question: "Why does Download PDF fail on a long document?", answer: "Each page is drawn in your browser’s memory, and very long documents can run out of it. Use Print, or split the Markdown into parts." },
    { question: "Which files can I upload?", answer: "Markdown files (.md, .markdown, .mdown, .mkd) and plain .txt files, up to 5 MB." },
    { question: "Will I lose my text if I refresh?", answer: "No. Your text and options are saved in this browser until you press Clear. Very large files are not saved." },
  ],

  blogSlugs: ["best-ai-blog-writing-tools", "what-is-chat-gpt", "ai-hallucinations-explained"],
};

export const metadata = toolMetadata("markdown-to-pdf", content);

export default function MarkdownToPdfPage() {
  return (
    <ToolPage slug="markdown-to-pdf" content={content}>
      <MarkdownToPdf />
    </ToolPage>
  );
}