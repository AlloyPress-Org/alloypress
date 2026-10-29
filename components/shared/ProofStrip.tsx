import Image from "next/image";

export type ProofStat = readonly [value: string, label: string];

export const defaultProofStats: readonly ProofStat[] = [
  ["6.1M+", "Google Search visibility across our top 5 pages"],
  ["639K+", "Google Search visibility across our top 5 reviews"],
  ["250+", "AI tools tested and published"],
  ["1,000+", "Hours of hands-on testing"],
];

export const aiPlatforms = [
  "ChatGPT",
  "Perplexity",
  "Gemini",
  "Google AI Overviews",
] as const;

export const proofBrands = [
  { name: "Higgsfield", src: "/logos/higgsfield.png" },
  { name: "Design.com", src: "/logos/designcom.png" },
  { name: "BrandCrowd", src: "/logos/brandcrowd.png" },
  { name: "Onepage", src: "/logos/onepage.png" },
  { name: "DeeVid", src: "/logos/deevid.png" },
  { name: "Bluehost", src: "/logos/bluehost.png" },
  { name: "Cursor", src: "/logos/cursor.png" },
  { name: "InVideo", src: "/logos/invideo.png" },
] as const;

type BrandLogosProps = {
  /** Text label above the logos. Pass "" to hide it. */
  label?: string;
  className?: string;
};

export function BrandLogos({
  label = "Tools we've tested",
  className = "",
}: BrandLogosProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: proofStyles }} />
      <div className={`ps-brands ${className}`.trim()}>
        {label && <span className="ps-label">{label}</span>}
        <ul className="ps-logo-grid" aria-label={label || "Tools we've tested"}>
          {proofBrands.map((brand) => (
            <li className="ps-logo-cell" key={brand.name}>
              <Image
                className="ps-logo"
                src={brand.src}
                alt={brand.name}
                width={240}
                height={80}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

type ProofStripProps = {
  stats?: readonly ProofStat[];
  showAiPlatforms?: boolean;
  showBrands?: boolean;
  brandsLabel?: string;
  aiLabel?: string;
  ariaLabel?: string;
  className?: string;
};

export default function ProofStrip({
  stats = defaultProofStats,
  showAiPlatforms = false,
  showBrands = true,
  brandsLabel = "Tools we've tested",
  aiLabel = "Cited in AI answers from",
  ariaLabel = "AlloyPress in numbers",
  className = "",
}: ProofStripProps) {
  return (
    <section className={`ps-section ${className}`.trim()} aria-label={ariaLabel}>
      <style dangerouslySetInnerHTML={{ __html: proofStyles }} />
      <div className="ps-container">
        {stats.length > 0 && (
          <div className="ps-stats">
            {stats.map(([value, label]) => (
              <div className="ps-stat" key={value}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {showAiPlatforms && (
          <div className="ps-row">
            <span className="ps-label">{aiLabel}</span>
            <ul className="ps-chips">
              {aiPlatforms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {showBrands && <BrandLogos label={brandsLabel} />}
      </div>
    </section>
  );
}

const proofStyles = `
.ps-section {
  padding: 56px 0;
  border-top: 1px solid var(--border);
}

.ps-container {
  display: grid;
  gap: 32px;
  width: min(1160px, calc(100% - 40px));
  margin-inline: auto;
}

.ps-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.ps-stat {
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--brand) 16%, var(--border));
  border-radius: 14px;
  background: var(--card);
}

.ps-stat strong {
  display: block;
  color: var(--text-primary);
  font: 800 clamp(28px, 3.2vw, 38px)/1.05 var(--font-ui);
  letter-spacing: -.04em;
}

.ps-stat span {
  display: block;
  margin-top: 12px;
  color: var(--text-secondary);
  font: 400 var(--text-sm)/1.55 var(--font-body);
}

.ps-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 28px;
}

.ps-label {
  min-width: 170px;
  color: var(--text-secondary);
  font: 500 var(--text-xs)/1.4 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

/* ---------- Brand logos: single line, no cards/borders ---------- */
.ps-brands {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 28px;
}

.ps-brands .ps-label {
  flex: 0 0 auto;
  min-width: 0;
  white-space: nowrap;
}

.ps-logo-grid {
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ps-logo-cell {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 40px;
}

.ps-logo {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 34px;
  object-fit: contain;
  object-position: center;
  filter: grayscale(1) brightness(1.15);
  opacity: .9;
  transition: opacity .2s ease, filter .2s ease;
}

.ps-logo:hover {
  opacity: 1;
  filter: none;
}

html[data-theme="dark"] .ps-logo {
  filter: grayscale(1) brightness(1.9);
  opacity: .95;
}

html[data-theme="dark"] .ps-logo:hover {
  opacity: 1;
  filter: none;
}

/* ---------- AI chips ---------- */
.ps-chips {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ps-chips li {
  padding: 7px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--card);
  color: var(--text-primary);
  font: 600 var(--text-sm)/1.2 var(--font-ui);
}

@media (max-width: 900px) {
  .ps-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ps-brands {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }

  .ps-logo-grid {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 22px 36px;
  }

  .ps-logo-cell {
    flex: 0 0 auto;
    width: 120px;
  }
}

@media (max-width: 600px) {
  .ps-section {
    padding: 44px 0;
  }

  .ps-stats {
    grid-template-columns: 1fr;
  }

  .ps-label {
    min-width: 0;
    width: 100%;
  }

  .ps-logo-grid {
    gap: 18px 28px;
  }

  .ps-logo-cell {
    width: 100px;
    height: 32px;
  }

  .ps-logo {
    max-height: 28px;
  }
}
`;