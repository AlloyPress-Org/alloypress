import type { ReactNode } from "react";
import type { FaqItem } from "@/lib/faq-from-html";

type FaqWithRich = FaqItem & { aNode?: ReactNode };

export default function FaqAccordion({
  faqs,
}: {
  faqs: FaqWithRich[];
}) {
  if (!faqs.length) return null;

  return (
    <div className="post-faq">
      {faqs.map((faq, index) => (
        <details key={index} className="post-faq-item">
          <summary>{faq.q}</summary>
          {faq.aNode ? (
            <div className="post-faq-answer">{faq.aNode}</div>
          ) : (
            <p>{faq.a}</p>
          )}
        </details>
      ))}
    </div>
  );
}