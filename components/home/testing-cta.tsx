import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/components/css-style/testing-cta.css";

export default function TestingPartnerPromo() {
  return (
    <section className="testing-cta-promo">
      <div className="testing-cta-promo-card">

        <div className="testing-cta-promo-body">
          <span className="testing-cta-promo-eyebrow">
            AI Tool Testing Partner
          </span>

          <h3>
            We work with AI brands as an independent testing partner.
          </h3>

          <p>
            Regular testing cycles, structured feedback, product
            suggestions, and competitive benchmarking, helping AI teams
            improve their products continuously, not through a one-time
            report.
          </p>
        </div>

        <div className="testing-cta-promo-action">
          <Link className="testing-cta-promo-btn" href="/testing-partner">
            Explore testing partnerships
            <ArrowRight aria-hidden="true" />
          </Link>

          <span className="testing-cta-promo-note">
            For AI product teams and founders
          </span>
        </div>
      </div>
    </section>
  );
}