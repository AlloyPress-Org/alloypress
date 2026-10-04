import Link from "next/link";

export default function ToolSubmissionCTA() {
  return (
    <section className="tool-cta">
      <div className="tool-cta-inner">

        {/* HEADER */}
        <div className="tool-cta-header">
          <div className="tool-cta-label">
            FOR AI BRANDS AND AGENCIES
          </div>

          <h2>Have an AI tool worth covering?</h2>

          <p>
            Every tool on AlloyPress is tested hands-on before it’s written
            about. We don’t feature tools based on outreach alone — placement
            depends entirely on how a tool performs against the others in its
            category.
          </p>
        </div>

        {/* REJECTION CRITERIA */}
        <div className="tool-cta-rejection">
          <strong>We reject tools that:</strong>

          <p>
            don’t compete meaningfully in their category, fall below our
            hands-on testing standards, make misleading or unverifiable
            claims, or request guaranteed placement or specific ranking
            positions.
          </p>
        </div>

        {/* OPTIONS */}
        <div className="tool-cta-options">

          <div className="tool-cta-option">
            <div className="tool-cta-option-label">
              ARTICLE INCLUSION
            </div>

            <h3>Get featured in a roundup</h3>

            <p>
              Tested and evaluated alongside every other tool in the
              category. Position is based on results, not payment.
            </p>

            <Link
              href="/get-featured"
              className="tool-cta-primary"
            >
              Get featured
              <span>↗</span>
            </Link>
          </div>

          <div className="tool-cta-option">
            <div className="tool-cta-option-label">
              DEDICATED REVIEW
            </div>

            <h3>Get a full standalone review</h3>

            <p>
              An in-depth article covering every feature, real use cases,
              and our honest verdict. Ranks independently in search.
            </p>

            <Link
              href="/get-reviewed"
              className="tool-cta-secondary"
            >
              See How Reviews Work
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* FOOTER NOTE */}
        <div className="tool-cta-footer">
          We respond within 1–2 business days.
        </div>

      </div>
    </section>
  );
}