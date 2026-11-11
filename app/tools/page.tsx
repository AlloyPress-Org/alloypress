import type { Metadata } from "next";
import "@/components/css-style/tools.css";
import ToolsGrid from "@/components/tools/ToolsGrid";

import { hubTools } from "@/lib/tools/registry";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Free AI & Writing Tools – No Sign-up | AlloyPress",
  description:
    "Free online tools for writing and working with AI: word counter, case converter, Markdown tools and more. No sign-up, and your text never leaves your browser.",
  canonicalPath: "/tools",
});

export default function ToolsHub() {
  const tools = hubTools();
  return (
    <div className="tl-page">
      <header className="tl-hero">
        <h1 className="tl-h1">Free <span className="tl-accent">AI &amp; Writing Tools</span></h1>
        <p className="tl-lead">Simple tools that run in your browser. No sign-up, no uploads, no limits.</p>
      </header>
      <div className="tl-body">
        <ToolsGrid tools={tools} />
      </div>
    </div>
  );
}