import { extractFaqs } from "@/lib/faq-from-html";
import type { FAQItem } from "@/lib/seo/schema";

const FAQ_HTML_RE = /ai-faq-question|ai-faq-answer/i;

function nodeText(nodes: any[] = []): string {
  return nodes
    .map((n) =>
      n?.text ?? (Array.isArray(n?.children) ? nodeText(n.children) : "")
    )
    .join("");
}

export function collectFaqs(content: unknown): FAQItem[] {
  const out: FAQItem[] = [];
  const seen = new Set<string>();

  const push = (question: unknown, answer: unknown) => {
    const q = String(question ?? "").trim();
    const a = String(answer ?? "").trim();
    if (!q || !a) return;

    const key = q.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    out.push({ question: q, answer: a });
  };

  const fromHtml = (html: unknown) => {
    if (typeof html !== "string" || !FAQ_HTML_RE.test(html)) return;
    extractFaqs(html).forEach((f) => push(f.q, f.a));
  };

  const walk = (nodes: any[] = []) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;

      const fields = node.fields || {};
      const blockType = String(
        fields.blockType || node.blockType || ""
      ).toLowerCase();

      // 1. Payload FAQ block
      if (node.type === "block" && blockType === "faq") {
        (Array.isArray(fields.items) ? fields.items : []).forEach((it: any) =>
          push(it?.question, it?.answer)
        );
      }

      // 2. htmlContent block
      if (node.type === "block" && blockType === "htmlcontent") {
        fromHtml(fields.html);
      }

      // 3. Code block / Lexical code node
      if (
        (node.type === "block" && blockType === "code") ||
        node.type === "code" ||
        node.type === "codeBlock"
      ) {
        fromHtml(
          fields.code ??
            node.code ??
            (Array.isArray(node.children) ? nodeText(node.children) : "")
        );
      }

      if (Array.isArray(node.children)) walk(node.children);
    }
  };

  const root = (content as { root?: { children?: any[] } } | null)?.root;
  walk(root?.children || []);

  return out;
}