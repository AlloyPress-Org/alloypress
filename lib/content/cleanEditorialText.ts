/**
 * Cleans migrated WordPress/editorial text before displaying it
 * in excerpts, cards, search results, metadata, etc.
 */
export function cleanEditorialText(value: unknown): string {
  if (typeof value !== "string") return "";

  let text = value
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")

    // Decode common HTML / WordPress entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&#8230;/gi, "…")
    .replace(/&#038;/gi, "&")
    .replace(/&#38;/gi, "&")

    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Remove migrated WordPress / editor UI artifacts
  text = text.replace(
    /Ask AI which software may suit your team[\s\S]*?(?=TL;DR\s*:|$)/i,
    "",
  );

  text = text.replace(
    /📋\s*Copied!.*?(?:Copy again\s*[✕×x]?|$)/i,
    "",
  );

  // Remove leaked editorial headings
  text = text.replace(
    /^(?:Quick\s+Blog\s+Summary|Blog\s+Summary|Quick\s+Summary|Article\s+Summary|Summary)\s*:?\s*/i,
    "",
  );

  // Remove TL;DR label
  text = text.replace(/^TL;DR\s*:\s*/i, "");

  // Remove migrated trailing ellipsis artifacts
  text = text.replace(/\s*\[…\]\s*$/, "");
  text = text.replace(/\s*\[\.\.\.\]\s*$/, "");
  text = text.replace(/…\s*$/, "");

  // Remove unwanted leading bullets/punctuation
  text = text.replace(/^[-–—•\s]+/, "");

  // Final whitespace cleanup
  text = text.replace(/\s+/g, " ").trim();

  return text;
}