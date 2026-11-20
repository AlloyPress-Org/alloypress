import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./pdf-to-markdown.css";
import PdfToMarkdown from "./PdfToMarkdown";

/* ---------- small visuals used by the two guide sections ---------- */
type Opt = { label: string; does: string; off: string };

function OptionList({ items }: { items: Opt[] }) {
  return (
    <div className="pg-opts">
      {items.map((o) => (
        <div className="pg-opt" key={o.label}>
          <span className="pg-box" aria-hidden="true">✓</span>
          <div className="pg-opt-t">
            <b>{o.label}</b>
            <span>{o.does}</span>
            <em>Turn off if: {o.off}</em>
          </div>
        </div>
      ))}
    </div>
  );
}

function PageGrid({ typed, picked, note, total = 10 }: { typed: string; picked: number[]; note: string; total?: number }) {
  return (
    <div className="pg-range">
      <div className="pg-input">
        <span>Pages</span>
        <code>{typed}</code>
      </div>
      <div className="pg-tiles" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span key={n} className={picked.includes(n) ? "is-on" : ""}>{n}</span>
        ))}
      </div>
      <p className="pg-note">{note}</p>
    </div>
  );
}

const content: ToolContent = {
  metaTitle: "PDF to Markdown: Convert PDF to .md Online (Free)",
  metaDescription:
    "Convert a PDF to Markdown with headings, lists, tables and bold text kept. Ready for ChatGPT and Claude. Free, private, runs in your browser.",
  h1: "Free PDF to Markdown Converter",
  h1Accent: "PDF to Markdown",
  intro:
    "Upload a text-based PDF and get clean Markdown with headings, lists and tables. Copy it into ChatGPT or Claude, or download a .md file. Your PDF never leaves your browser.",

  sections: [
    {
      kind: "cards",
      id: "why",
      eyebrow: "Why use it",
      title: "Turn a PDF Into Text That Is Easy to Reuse",
      intro: "A PDF is built for printing. Markdown is plain text, so it is easy to read, edit, search and paste into AI tools.",
      items: [
        {
          icon: "bolt",
          title: "Keeps the structure",
          text: "Not just a wall of text.",
          list: ["Headings found from font size", "Bullet and numbered lists", "Simple tables as Markdown tables", "Bold, italic and code blocks"],
        },
        {
          icon: "search",
          title: "Cleans up as it goes",
          text: "Fewer leftovers to fix by hand.",
          list: ["Removes repeated headers and footers", "Removes page numbers", "Joins lines and fixes split words", "Two-column reading order"],
        },
        {
          icon: "lock",
          title: "Private and free",
          text: "No sign-ups or paywalls. Your PDF stays on your device.",
          list: ["Nothing is uploaded", "No account needed", "No page limit under 300 pages", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "tiles",
      id: "use-cases",
      eyebrow: "Use cases",
      title: "What People Convert",
      intro: "Anything with real text inside works best.",
      items: [
        { icon: "bolt", title: "PDFs for ChatGPT and Claude", text: "Paste clean Markdown instead of a messy PDF copy." },
        { icon: "search", title: "Research papers and reports", text: "Pull out headings, lists and tables to read or quote." },
        { icon: "device", title: "Documentation and manuals", text: "Move a PDF guide into a README, wiki or docs site." },
        { icon: "limit", title: "Lecture notes and study guides", text: "Edit and reorganize notes in Obsidian or Notion." },
        { icon: "free", title: "Resumes and CVs", text: "Get the text of a PDF resume as editable Markdown." },
        { icon: "chart", title: "Ebooks and long articles", text: "Convert a chapter at a time with the page range." },
      ],
    },
    {
      kind: "steps",
      id: "how",
      title: "How to convert a PDF to Markdown",
      items: [
        { title: "Upload your PDF", text: "Drop a PDF on the left box or click to choose one. It is read in your browser." },
        { title: "Choose what to detect", text: "Turn headings, tables, bold text and the cleanup options on or off. Set a page range if you only need some pages." },
        { title: "Copy or download", text: "Check the Markdown, edit it if you like, then copy it or download a .md file." },
      ],
    },
    {
      kind: "split",
      id: "options",
      eyebrow: "Options guide",
      title: "What Each Option Does",
      intro: "Leave the options on for most files. If the result looks wrong, turn off the one that matches the problem.",
      rows: [
        {
          badge: "Structure",
          title: "Choose what to keep",
          text: "These three decide how headings, tables and emphasis appear in your Markdown.",
          list: ["Headings come from larger or bold text", "Tables come from aligned columns", "Bold and italic come from the font style"],
          visual: (
            <OptionList
              items={[
                { label: "Headings", does: "Adds #, ## and ### to titles", off: "normal lines become headings" },
                { label: "Tables", does: "Turns aligned columns into a table", off: "text is split into columns by mistake" },
                { label: "Bold and italic", does: "Keeps **bold**, *italic* and `code`", off: "you want plain text" },
              ]}
            />
          ),
        },
        {
          badge: "Cleanup and layout",
          title: "Fix the reading order",
          text: "These options remove repeated lines and control how pages and columns are read.",
          list: ["Repeated headers, footers and page numbers are dropped", "Two columns reads left, then right", "Page separators add a line between pages"],
          visual: (
            <OptionList
              items={[
                { label: "Remove headers and footers", does: "Drops repeated top and bottom lines", off: "a real line at the page edge is missing" },
                { label: "Two columns", does: "Reads the left column, then the right", off: "your PDF has one column" },
                { label: "Page separators", does: "Adds a --- line between pages", off: "you want one continuous document" },
              ]}
            />
          ),
        },
      ],
    },
    {
      kind: "split",
      id: "page-range",
      eyebrow: "Pages box",
      title: "Convert Only the Pages You Need",
      intro: "Type a page range in the Pages box. Leave it empty to convert the whole PDF.",
      rows: [
        {
          badge: "One range",
          title: "Type 1-5 for a chapter",
          text: "Use a dash for a run of pages. It is the quickest way to pull out one chapter or section.",
          list: ["A single number picks one page", "Pages outside the PDF are ignored", "The output updates as you type"],
          visual: <PageGrid typed="1-5" picked={[1, 2, 3, 4, 5]} note="Pages 1 to 5 are converted." />,
        },
        {
          badge: "Mixed pages",
          title: "Combine a range with single pages",
          text: "Separate parts with commas. Skip the cover and index by leaving them out.",
          list: ["Commas join separate parts", "Pages are read in order", "Great for sending part of a PDF to an AI chat"],
          visual: <PageGrid typed="1-3, 8" picked={[1, 2, 3, 8]} note="Pages 1, 2, 3 and 8 are converted." />,
        },
      ],
    },
    {
      kind: "split",
      id: "structure",
      eyebrow: "How it works",
      title: "From Page Layout to Markdown",
      intro: "A PDF only stores where each piece of text sits on a page. The tool uses font size, font style and spacing to rebuild the structure.",
      rows: [
        {
          badge: "Headings and lists",
          title: "Bigger text becomes a heading",
          text: "The most common size is the body text. Larger text becomes a heading, and lines that start with a bullet or number become list items.",
          list: ["Largest text becomes #, then ##, then ###", "Short bold lines become small headings", "Wrapped list items are joined"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">In the PDF</span>
              <div className="tl-demo-out">
                <strong style={{ fontSize: 18 }}>Project Plan</strong><br />
                <strong>Goals</strong><br />
                • Launch in May<br />
                • Collect feedback
              </div>
              <div className="tl-demo-arrow">↓</div>
              <span className="tl-demo-tag">Markdown</span>
              <pre className="tl-demo-code">{`# Project Plan\n\n#### Goals\n\n- Launch in May\n- Collect feedback`}</pre>
            </div>
          ),
        },
        {
          badge: "Tables",
          title: "Aligned columns become a table",
          text: "Rows with the same number of widely spaced columns are turned into a GitHub-style table. Check tables, because PDFs do not mark them.",
          list: ["First row becomes the header", "Works best on simple grids", "Switch Tables off if a layout is misread"],
          visual: (
            <div className="tl-demo">
              <span className="tl-demo-tag">Markdown</span>
              <pre className="tl-demo-code">{`| Plan | Price |\n| --- | --- |\n| Basic | $5 |\n| Pro | $12 |`}</pre>
            </div>
          ),
        },
      ],
    },
    {
      kind: "table",
      id: "limits",
      title: "What converts well, and what does not",
      intro: "A PDF is a picture of a page, so no converter is perfect. Here is what to expect.",
      head: ["PDF content", "Result", "Notes"],
      rows: [
        ["Text, headings, paragraphs", "Converted", "Best results on PDFs made from Word, Docs or web pages"],
        ["Bullet and numbered lists", "Converted", "Nested lists are detected from indentation"],
        ["Simple tables", "Converted", "Merged cells and borders-only tables may need fixing"],
        ["Bold, italic and code fonts", "Converted", "Detected from the font names in the PDF"],
        ["Two-column pages", "Use Two columns", "Turn the option on to read left then right"],
        ["Images and charts", "Not included", "Only text is extracted"],
        ["Math formulas", "As plain text", "Complex formulas may look broken"],
        ["Scanned PDFs", "Not supported", "They are pictures and need OCR first"],
        ["Password-protected PDFs", "Not supported", "Remove the password first"],
      ],
    },
    {
      kind: "prose",
      id: "next",
      title: "Clean up, read or turn it back into a PDF",
      paragraphs: [
        "If the result has stray symbols or hidden characters, run it through the AI Text Cleaner. To read the Markdown as a formatted page, open it in the Markdown Viewer. To turn Markdown into a PDF, use Markdown to PDF.",
      ],
      chips: [
        "Messy characters → AI Text Cleaner",
        "Read the .md as a page → Markdown Viewer",
        "Markdown back to a PDF → Markdown to PDF",
      ],
    },
    {
      kind: "prose",
      id: "privacy",
      title: "Privacy and safety",
      bullets: [
        "Your PDF is read in your browser. Nothing is uploaded, and nothing is logged.",
        "The file is not saved. Only your option choices are remembered in this browser.",
        "Unsafe HTML in the text is removed before the preview is shown.",
        "The PDF reader runs as a script from this site, so it works without an internet connection after the page loads.",
      ],
    },
  ],

  faq: [
    { question: "Is my PDF uploaded anywhere?", answer: "No. The PDF is read and converted in your browser. Open your browser’s network tab while you use the tool and you’ll see no requests carrying your file." },
    { question: "How do I convert a PDF to Markdown?", answer: "Drop a PDF on the left box, choose what to detect, then copy the Markdown or download a .md file." },
    { question: "Can I use the result in ChatGPT or Claude?", answer: "Yes. Copy the Markdown and paste it into the chat. Markdown is plain text, so headings, lists and tables stay clear. Check the output first, especially tables." },
    { question: "Does it work on scanned PDFs?", answer: "No. A scanned PDF is a set of pictures with no text inside, so it needs OCR first. The tool tells you when it finds no text." },
    { question: "How accurate is the conversion?", answer: "It is good on PDFs made from Word, Google Docs or web pages, and weaker on complex layouts. A PDF does not store headings or tables, so the tool infers them from font size and spacing. Review the result before you rely on it." },
    { question: "What do the options do?", answer: "Headings, Tables and Bold and italic decide which structure is kept. Remove headers and footers cleans repeated lines, Two columns fixes reading order, and Page separators adds a line between pages. The Pages box limits which pages are converted." },
    { question: "Why is a heading missing or wrong?", answer: "Headings are found from larger or bold text. If a heading is the same size as the body text, it may not be detected. You can edit the Markdown in the output box." },
    { question: "Why is my table broken?", answer: "Tables are found from aligned columns, so merged cells or tables with empty cells can be misread. Turn Tables off, or fix the rows in the output box." },
    { question: "Can I convert only some pages?", answer: "Yes. Type a page range such as 1-5, or 1-3, 8 in the Pages box." },
    { question: "What about two-column PDFs?", answer: "Turn on Two columns. The tool reads the left column first, then the right column, on every page." },
    { question: "Are images included?", answer: "No. Only the text is extracted. Images, charts and drawings are left out." },
    { question: "Is there a size limit?", answer: "PDFs up to 25 MB, and the first 300 pages. For a bigger file, use the page range or split the PDF." },
    { question: "Can I open a password-protected PDF?", answer: "No. Remove the password in a PDF app first, then upload the file." },
  ],

  blogSlugs: ["best-ai-blog-writing-tools", "what-is-chat-gpt", "ai-hallucinations-explained"],
};

export const metadata = toolMetadata("pdf-to-markdown", content);

export default function PdfToMarkdownPage() {
  return (
    <ToolPage slug="pdf-to-markdown" content={content}>
      <PdfToMarkdown />
    </ToolPage>
  );
}