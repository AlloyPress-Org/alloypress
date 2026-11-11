"use client";

import { useState } from "react";

/** Shared small pieces for every tool UI. Add Dropzone here when the first file tool needs it. */

export function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };
  return (
    <button type="button" className="tl-btn" onClick={onCopy} disabled={disabled}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export type StatItem = { value: string; label: string; short?: string };

/** Stat strip at the top of a tool. Stays in place (not sticky). */
export function StatBar({ items }: { items: StatItem[] }) {
  return (
    <div className="tl-statbar" role="group" aria-label="Text statistics" aria-live="polite">
      {items.map((s) => (
        <div key={s.label} className="tl-statbar-item">
          <b>{s.value}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}