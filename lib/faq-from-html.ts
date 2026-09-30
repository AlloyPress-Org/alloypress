export type FaqItem = { q: string; a: string }

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')

const strip = (s: string) =>
  decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

export function extractFaqs(html: string): FaqItem[] {
  const out: FaqItem[] = []
  const re =
    /<button[^>]*class="[^"]*ai-faq-question[^"]*"[^>]*>([\s\S]*?)<\/button>\s*<div[^>]*class="[^"]*ai-faq-answer[^"]*"[^>]*>([\s\S]*?)<\/div>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const q = strip(m[1]).replace(/^\d+\.\s*/, '')
    const a = strip(m[2])
    if (q && a) out.push({ q, a })
  }
  return out
}