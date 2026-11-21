import ToolPage, { toolMetadata, type ToolContent } from "@/components/tools/ToolPage";

import "./pdf-to-markdown.css";
import PdfToMarkdown from "./PdfToMarkdown";

/* ---------- small visual used by the options guide ---------- */
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

const content: ToolContent = {
  metaTitle: "PDF to Markdown: Convert PDF to .md Online (Free)",
  metaDescription:
    "Convert a PDF to Markdown in your browser. Keeps headings, lists, tables and bold text, ready for ChatGPT and Claude. Free, nothing uploaded.",
  h1: "Free PDF to Markdown Converter",
  h1Accent: "PDF to Markdown",
  intro:
    "Upload a text-based PDF, or try the sample, and get clean Markdown with headings, lists and tables. Copy it for ChatGPT or Claude, feed it to a RAG pipeline, or download a .md file. Your PDF never leaves your browser.",

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
          list: ["Nothing is uploaded", "No account needed", "Up to 25 MB and 300 pages", "Works on any device"],
        },
      ],
    },
    { kind: "ad" },
    {
      kind: "steps",
      id: "how",
      title: "How to convert a PDF to Markdown",
      items: [
        { title: "Upload your PDF", text: "Drop a PDF on the left box, click to choose one, or press Try a sample PDF to see the result first." },
        { title: "Choose what to detect", text: "Turn headings, tables, bold text and cleanup options on or off. In the Pages box, type 1-5 or 1-3, 8 to convert only some pages. Leave it empty for all pages." },
        { title: "Copy or download", text: "Check the Markdown, edit it if you like, then copy it (as Markdown, for AI, or as plain text) or download a .md file." },
      ],
    },
    {
      kind: "tiles",
      id: "ai",
      eyebrow: "For AI",
      title: "PDF to Markdown for ChatGPT, Claude and RAG",
      intro: "Models read Markdown better than a raw PDF copy. Headings and tables survive, and page numbers do not waste tokens.",
      items: [
        { icon: "bolt", title: "ChatGPT and Claude", text: "Press Copy for AI to paste a prompt-ready block." },
        { icon: "search", title: "RAG pipelines", text: "Split the .md by heading for cleaner chunks." },
        { icon: "limit", title: "Long PDFs", text: "Use the Pages box to send only the part you need." },
        { icon: "device", title: "Notes and wikis", text: "Move it into Obsidian, Notion or a README." },
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
          text: "Headings come from larger or bold text, tables from aligned columns, and bold and italic from the font style. Check tables, because PDFs do not mark them.",
          list: ["Largest text becomes #, then ##, then ###", "First table row becomes the header", "Works best on simple grids"],
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
        ["Scanned PDFs", "Detected, not read", "The tool shows a message. Run OCR first"],
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
      title: "Privacy of your PDF",
      bullets: [
        "Contracts, invoices and papers are read by a script in your browser tab. No request carries the file, so you can check this in the network tab.",
        "The PDF itself is never saved. Only your option choices are kept in this browser, and the page range is not.",
        "The sample PDF is built in your browser too, so trying it fetches nothing.",
        "The Preview tab strips unsafe HTML that the PDF text may contain before showing it.",
      ],
    },
  ],

  faq: [
    { question: "Is my PDF uploaded anywhere?", answer: "No. The PDF is read and converted in your browser. Open your browser’s network tab while you use the tool and you’ll see no requests carrying your file." },
    { question: "How do I convert a PDF to Markdown?", answer: "Drop a PDF on the left box, choose what to detect, then copy the Markdown or download a .md file. Press Try a sample PDF if you want to see the output first." },
    { question: "Can I use the result in ChatGPT or Claude?", answer: "Yes. Press Copy for AI to get the Markdown wrapped in a prompt-ready block, or Copy Markdown for the plain result. Headings, lists and tables stay clear. Check the output first, especially tables." },
    { question: "Is the output good for RAG?", answer: "It is a good starting point. Headings give you natural places to split chunks, and tables stay as rows. Download the .md file and chunk it by heading in your own pipeline." },
    { question: "Does it work on scanned PDFs?", answer: "No. A scanned PDF is a set of pictures with no text inside, so it needs OCR first. The tool detects this as soon as the file is read and tells you, so it does not look broken." },
    { question: "How accurate is the conversion?", answer: "It is good on PDFs made from Word, Google Docs or web pages, and weaker on complex layouts. A PDF does not store headings or tables, so the tool infers them from font size and spacing. Review the result before you rely on it." },
    { question: "Why is a heading missing or wrong?", answer: "Headings are found from larger or bold text. If a heading is the same size as the body text, it may not be detected. You can edit the Markdown in the output box." },
    { question: "Why is my table broken?", answer: "Tables are found from aligned columns, so merged cells or tables with empty cells can be misread. Turn Tables off, or fix the rows in the output box." },
    { question: "What about two-column PDFs?", answer: "Turn on Two columns. The tool reads the left column first, then the right column, on every page." },
    { question: "Is there a size limit?", answer: "PDFs up to 25 MB, and the first 300 pages. For a bigger file, type a page range in the Pages box or split the PDF." },
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