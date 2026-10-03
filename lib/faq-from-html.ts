export type FaqItem = {
  q: string;
  a: string;
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");

const strip = (s: string) =>
  decode(s.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

export function extractFaqs(html: string): FaqItem[] {
  const out: FaqItem[] = [];

  // Question: button | summary | div | h2-h6 | p | span with class ai-faq-question
  // Answer:   div | p | section with class ai-faq-answer
  const re =
    /<(button|summary|div|h[2-6]|p|span)\b[^>]*class=["'][^"']*ai-faq-question[^"']*["'][^>]*>([\s\S]*?)<\/\1>\s*<(div|p|section)\b[^>]*class=["'][^"']*ai-faq-answer[^"']*["'][^>]*>([\s\S]*?)<\/\3>/gi;

  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    const q = strip(match[2]).replace(/^\d+\.\s*/, "");
    const a = strip(match[4]);

    if (q && a) {
      out.push({ q, a });
    }
  }

  return out;
}