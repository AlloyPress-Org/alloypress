import type { FaqItem } from "@/lib/faq-from-html";

export default function FaqAccordion({
  faqs,
}: {
  faqs: FaqItem[];
}) {
  if (!faqs.length) return null;

  return (
    <div className="post-faq">
      {faqs.map((faq, index) => (
        <details key={index} className="post-faq-item">
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}
    </div>
  );
}