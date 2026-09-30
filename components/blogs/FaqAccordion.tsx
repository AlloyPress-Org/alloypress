import type { FaqItem } from '@/lib/faq-from-html'

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="post-faq">
      {faqs.map((f, i) => (
        <details key={i} className="post-faq-item">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  )
}