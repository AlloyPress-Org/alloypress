import type { Metadata } from "next";
import "@/components/css-style/tools.css";
import ToolsGrid from "@/components/tools/ToolsGrid";

import { hubIsPublic, hubTools } from "@/lib/tools/registry";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Free Online Tools for Text, AI & Files",
    description: "Free word counter, case converter, AI text cleaner and more. No sign-up, and your text never leaves your device. Your privacy matters.",
    canonicalPath: "/tools",
  }),
  // Hub is unlisted until enough tools are live (see HUB_MIN_TOOLS).
};

export default function ToolsHub() {
  const tools = hubTools();
  return (
    <div className="tl-page">
      <header className="tl-hero">
        <h1 className="tl-h1">Free <span className="tl-accent">AI &amp; Writing Tools</span></h1>
        <p className="tl-lead">Simple tools for text, AI, files and photos. Free, no sign-up. Your text and files stay on your device.</p>
      </header>
      <div className="tl-body">
        <ToolsGrid tools={tools} />
      </div>
    </div>
  );
}