import Link from "next/link";

// Homepage section: "How we test". Drop it in after the articles block.
// Usage: import HowWeTest from "@/components/home/How-we-test";  then  <HowWeTest />

const cards = [
  {
    tag: "Best-of lists",
    title: "Every top tool, tested",
    text: "We test the leading tools in a category and rank them on our own verdict, with the reasons and our tips for better results.",
  },
  {
    tag: "Reviews",
    title: "Every key feature, in detail",
    text: "We work through each important feature, check pricing and plans, and write up what works, what doesn’t and who it suits.",
  },
  {
    tag: "Alternatives",
    title: "Built on a full review",
    text: "We review the main tool first, then test alternatives for the specific features people want instead.",
  },
  {
    tag: "Comparisons",
    title: "Head to head, same tasks",
    text: "Close rivals get the same prompts and tasks, so you see the real difference and which one fits you.",
  },
] as const;

const checks = [
  "Claims and pricing checked",
  "Bugs and limits written up",
  "Updated when tools change",
] as const;

function Tick() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

export default function HowWeTest() {
  return (
    <section className="hwts" aria-labelledby="hwts-heading">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="hwts-wrap">
        <header className="hwts-head">
          <p className="hwts-eyebrow">
            <span className="hwts-dot" aria-hidden="true" />
            How we test
          </p>
          <h2 id="hwts-heading" className="hwts-h2">
            We use every tool before we write about it.
          </h2>
          <p className="hwts-lead">
            Our team tests each tool hands-on and writes what we see. The testing depends on what
            we’re writing.
          </p>
        </header>

        <ul className="hwts-grid">
          {cards.map((card) => (
            <li className="hwts-card" key={card.tag}>
              <span className="hwts-tag">{card.tag}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </li>
          ))}
        </ul>

        <div className="hwts-strip">
          <ul className="hwts-checks">
            {checks.map((item) => (
              <li key={item}>
                <Tick />
                {item}
              </li>
            ))}
          </ul>
          <Link className="hwts-btn" href="/how-we-test">
            Read our full testing process →
          </Link>
        </div>
      </div>
    </section>
  );
}

const styles = `
.hwts {
  padding: 40px 0;
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-body);
}
.hwts *,
.hwts *::before,
.hwts *::after { box-sizing: border-box; }
.hwts h2, .hwts h3, .hwts p, .hwts ul { margin: 0; padding: 0; }
.hwts ul { list-style: none; }

.hwts .hwts-wrap {
  width: min(1160px, calc(100% - 48px));
  margin-inline: auto;
}

/* Header */
.hwts .hwts-head { max-width: 640px; margin-bottom: 40px; }
.hwts .hwts-eyebrow {
  display: flex; align-items: center; gap: 8px;
  color: var(--brand);
  font: 700 11px/1.2 var(--font-mono);
  letter-spacing: 0.12em; text-transform: uppercase;
}
.hwts .hwts-dot {
  width: 6px; height: 6px; flex: none; border-radius: 50%;
  background: currentColor; box-shadow: 0 0 0 3px var(--brand-soft);
}
.hwts .hwts-h2 {
  margin: 14px 0 16px;
  font: 700 clamp(30px, 4vw, 44px) / 1.12 var(--font-ui);
  letter-spacing: -0.05em; text-wrap: balance;
}
.hwts .hwts-lead {
  color: var(--text-secondary);
  font: 400 17px/1.7 var(--font-body);
}

/* Cards */
.hwts .hwts-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;
}
.hwts .hwts-card {
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 24px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.hwts .hwts-card:hover {
  border-color: var(--brand-subtle); transform: translateY(-2px);
}
.hwts .hwts-tag {
  margin-bottom: 18px; padding: 5px 10px; border-radius: 6px;
  background: var(--brand-soft); color: var(--brand);
  font: 600 12px/1 var(--font-mono);
}
.hwts .hwts-card h3 {
  margin-bottom: 10px; color: var(--text-primary);
  font: 700 17px/1.35 var(--font-ui); letter-spacing: -0.02em;
}
.hwts .hwts-card p {
  color: var(--text-secondary); font: 400 14.5px/1.65 var(--font-body);
}

/* Bottom strip */
.hwts .hwts-strip {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 20px 32px; margin-top: 16px; padding: 18px 24px;
  border: 1px solid var(--border); border-radius: 16px;
  background: var(--card);
}
.hwts .hwts-checks { display: flex; flex-wrap: wrap; gap: 12px 28px; }
.hwts .hwts-checks li {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--text-secondary); font: 500 14px/1.4 var(--font-body);
}
.hwts .hwts-checks svg { flex: none; color: var(--brand); }

.hwts .hwts-btn {
  min-height: 44px; display: inline-flex; align-items: center; justify-content: center;
  padding: 0 20px; white-space: nowrap;
  border: 1px solid var(--brand); border-radius: var(--radius-sm);
  background: transparent; color: var(--text-primary); text-decoration: none;
  font: 600 14px/1 var(--font-ui);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.hwts .hwts-btn:hover {
  transform: translateY(-2px); background: var(--brand); color: #fff;
  box-shadow: var(--shadow-green);
}
.hwts .hwts-btn:active { transform: translateY(0); }
.hwts .hwts-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }

/* Responsive */
@media (max-width: 1024px) {
  .hwts .hwts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .hwts { padding: 56px 0; }
  .hwts .hwts-wrap { width: calc(100% - 32px); }
  .hwts .hwts-head { margin-bottom: 28px; }
  .hwts .hwts-grid { grid-template-columns: minmax(0, 1fr); }
  .hwts .hwts-strip { padding: 20px; }
  .hwts .hwts-checks { flex-direction: column; gap: 10px; }
  .hwts .hwts-btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .hwts * { transition: none !important; }
}
`;