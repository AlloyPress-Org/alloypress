import Link from "next/link";

import type { ToolDef } from "@/lib/tools/registry";

export default function ToolsGrid({ tools }: { tools: ToolDef[] }) {
  return (
    <div className="tl-cards tl-cards--hub">
      {tools.map((t) =>
        t.status === "live" ? (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="tl-card tl-link-card">
            <span className="eyebrow">Free</span>
            <h2>{t.name}</h2>
            <p>{t.shortDescription}</p>
          </Link>
        ) : (
          <div key={t.slug} className="tl-card tl-link-card is-soon" aria-disabled="true">
            <span className="tl-soon">Coming soon</span>
            <h2>{t.name}</h2>
            <p>{t.shortDescription}</p>
          </div>
        ),
      )}
    </div>
  );
}