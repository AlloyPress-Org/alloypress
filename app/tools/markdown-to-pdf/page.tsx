import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./markdown-to-pdf.css";
import MarkdownToPdf from "./MarkdownToPdf";

const content: ToolContent = {
  metaTitle: "Markdown to PDF: Convert .md Files to a Clean PDF Online",
  metaDescription:
    "Convert Markdown to PDF with page size, margins and page numbers. Turn README files, AI notes and resumes into a clean PDF. Free, private, no sign-up.",
  h1: "Free Markdown to PDF Converter",
  h1Accent: "Markdown to PDF",
  intro:
    "Paste or upload Markdown and turn it into a clean PDF. Pick the page size, margins and page numbers, check the paper preview, then download. Everything runs in your browser.",

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
          list: ["GitHub Flavored Markdown", "Syntax-highlighted code", "Mermaid diagrams and LaTeX math", "Page breaks avoid cutting tables and code"],
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
      kind: "tiles",
      id: "use-cases",
      eyebrow: "Use cases",
      title: "What People Turn Into PDFs",
      intro: "Pick a preset above and the page options are set for you.",
      items: [
        { icon: "bolt", title: "AI chat notes and handouts", text: "Save ChatGPT or Claude answers as neat study notes, guides or summaries." },
        { icon: "device", title: "READMEs and technical docs", text: "Share a README, API doc, setup guide or architecture note with a team or client." },
        { icon: "limit", title: "Plans, specs and changelogs", text: "Export coding agent plans, feature specs, release notes and bug reports." },
        { icon: "free", title: "Resumes, CVs and cover letters", text: "Write in Markdown and get the same clean layout every time." },
        { icon: "chart", title: "Cheat sheets and assignments", text: "Turn formulas, code examples and structured notes into a printable page." },
        { icon: "search", title: "Obsidian and Notion exports", text: "Back up .md notes as PDFs for offline reading." },
      ],
    },
    {
      kind: "steps",
      id: "how",
      title: "How to convert Markdown to PDF",
      items: [
        { title: "Paste or upload", text: "Paste Markdown, drop a .md file, or pick a preset to start from a sample." },
        { title: "Set up the page", text: "Choose the page size, margins, text size and page numbers. The paper preview updates at once." },
        { title: "Download the PDF", text: "Click Download PDF, then choose “Save as PDF” in the print dialog." },
      ],
    },
    {
      kind: "split",
      id: "resume",
      eyebrow: "Resumes",
      title: "Turn a Markdown Resume Into a PDF",
      intro: "Markdown keeps a resume simple. The Resume preset gives it tight margins and a compact font so it fits on one page.",
      rows: [
        {
          badge: "Resume preset",
          title: "Write once, export a clean page",
          text: "Use headings for sections, bullets for achievements and bold for skills. The layout stays the same every time you export.",
          list: ["Narrow margins and a small font", "No page numbers on a one-page resume", "Plain text, so it reads well in applicant systems"],
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
        {
          badge: "Tips",
          title: "Keep it to one page",
          text: "Short bullets with numbers work best. Avoid images and tables for the main content, so text is easy to copy and scan.",
          list: ["Lead each bullet with a result", "Use Serif for a classic look", "Check the preview before you download"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">Good bullet</span>
              <div className="tl-demo-out">Cut page load time by 38% with code splitting.</div>
              <span className="tl-demo-tag">Weak bullet</span>
              <div className="tl-demo-err">Responsible for improving performance.</div>
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
        ["File name", "The suggested name of the PDF", "Keeping files organized"],
      ],
    },
    {
      kind: "prose",
      id: "viewer-note",
      title: "Just want to read or copy a Markdown file?",
      paragraphs: [
        "Use the Markdown Viewer when you only want to see what a .md file says, check how it renders, or copy it into another app. Use this tool when you need a PDF with page size, margins and page numbers.",
      ],
      chips: [
        "Read or copy a .md file → Markdown Viewer",
        "A PDF with page options → Markdown to PDF",
      ],
    },
    {
      kind: "prose",
      id: "privacy",
      title: "Privacy and safety",
      bullets: [
        "Files and text are read and converted in your browser. Nothing is uploaded.",
        "Scripts, event handlers and unsafe links in your Markdown are removed before the preview is shown.",
        "Your text is saved only in this browser, and Clear removes it.",
        "The PDF is made by your browser’s own print engine, so there is no watermark and no limit.",
      ],
    },
  ],

  faq: [
    { question: "Is my file uploaded anywhere?", answer: "No. Files and text are read and converted in your browser. Open your browser’s network tab while you use the tool and you’ll see no requests carrying your content." },
    { question: "How do I convert Markdown to PDF?", answer: "Paste your Markdown or upload a .md file, set the page options, then click Download PDF. In the print dialog, choose “Save as PDF” as the printer." },
    { question: "Can I turn a README.md into a PDF?", answer: "Yes. Pick the README / docs preset, paste or upload the file, and download. Tables, code blocks and task lists keep their formatting." },
    { question: "Can I save ChatGPT or Claude output as a PDF?", answer: "Yes. Copy the answer, paste it into the editor and click Download PDF. If it has stray symbols or hidden characters, run it through the AI Text Cleaner first." },
    { question: "Can I make a resume PDF from Markdown?", answer: "Yes. Pick the Resume preset for narrow margins and a compact font, write your resume with headings and bullets, and download. Keep it to one page and check the preview first." },
    { question: "Does it support Mermaid diagrams and math?", answer: "Yes. Diagrams in mermaid code blocks are drawn into the PDF, and LaTeX math between dollar signs is typeset with KaTeX." },
    { question: "Why are there no page numbers in my PDF?", answer: "Page numbers use a newer print feature. They work in current Chrome, Edge and Safari. If they are missing, update your browser or try Chrome." },
    { question: "How do I remove the date and web address at the top and bottom?", answer: "In the print dialog, open More settings and turn off “Headers and footers”. That setting belongs to your browser, so the tool cannot change it." },
    { question: "Can I choose Letter or A4?", answer: "Yes. Letter is the default for the US. Switch to A4 with the Page option." },
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