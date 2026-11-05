import Link from "next/link";

// Homepage "For brands" strip. One slim row that replaces both brand blocks.
// Usage: import BrandBlocks from "@/components/home/brand-blocks";  then  <BrandBlocks />

const links = [
  { label: "Get your tool reviewed", href: "/review-your-ai-tool", primary: true },
  { label: "Submit to a list", href: "/submit-your-ai-tool", primary: false },
  { label: "Testing partnership", href: "/testing-partner", primary: false },
] as const;

export default function BrandBlocks() {
  return (
    <section className="bb" aria-label="For AI brands">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="bb-wrap">
        <div className="bb-strip">
          <p className="bb-text">
            <strong>Building an AI tool?</strong> We test tools independently, and every verdict is
            our own.
          </p>

          <nav className="bb-links" aria-label="Brand links">
            {links.map((item) => (
              <Link
                className={item.primary ? "bb-btn bb-btn-primary" : "bb-btn"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

const styles = `
.bb {
  padding: 20px 0 80px ;
  color: var(--text-primary);
  font-family: var(--font-body);
}
.bb *,
.bb *::before,
.bb *::after { box-sizing: border-box; }
.bb p { margin: 0; }

.bb .bb-wrap {
  width: min(1200px, calc(100% - 48px));
  margin-inline: auto;
}

/* White strip: text left, buttons right, one line */
.bb .bb-strip {
  display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between;
  gap: 24px; padding: 18px 24px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
html[data-theme="light"] .bb .bb-strip {
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.08);
}

.bb .bb-text {
  min-width: 0;
  color: var(--text-secondary);
  font: 400 15px/1.5 var(--font-body);
}
.bb .bb-text strong {
  color: var(--text-primary);
  font-family: var(--font-ui); font-weight: 700;
}

.bb .bb-links { display: flex; flex: none; align-items: center; gap: 10px; }

/* Buttons: same shape as the site's other CTAs */
.bb .bb-btn {
  min-height: 44px; display: inline-flex; align-items: center; justify-content: center;
  padding: 0 18px; white-space: nowrap;
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-primary); text-decoration: none;
  font: 600 var(--text-sm) var(--font-ui);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease,
    transform 0.2s ease, box-shadow 0.2s ease;
}
.bb .bb-btn:hover,
.bb .bb-btn:focus-visible {
  transform: translateY(-2px);
  border-color: var(--brand); color: var(--brand); background: var(--brand-soft);
}
.bb .bb-btn:active { transform: translateY(0); }
.bb .bb-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }

.bb .bb-btn-primary {
  border-color: var(--brand); background: var(--brand); color: #fff;
}
.bb .bb-btn-primary:hover,
.bb .bb-btn-primary:focus-visible {
  border-color: var(--brand-hover); background: var(--brand-hover); color: #fff;
  box-shadow: var(--shadow-green);
}

/* Below this width one line no longer fits, so stack text over buttons */
@media (max-width: 1100px) {
  .bb .bb-strip { flex-wrap: wrap; }
  .bb .bb-text { flex: 1 1 100%; }
}
@media (max-width: 600px) {
  .bb .bb-wrap { width: calc(100% - 32px); }
  .bb .bb-strip { padding: 20px 18px; }
  .bb .bb-links { width: 100%; flex-direction: column; align-items: stretch; }
}
@media (prefers-reduced-motion: reduce) {
  .bb * { transition: none !important; }
}
`;