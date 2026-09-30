const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED[entity.toLowerCase()] ?? match;
  });
}

// Strips tags, decodes entities (&hellip; &#038; &#8217; ...), collapses spaces.
export function cleanText(value?: string | null): string {
  if (!value) return "";
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function absoluteUrl(
  value: string | null | undefined,
  base: string,
): string | undefined {
  const input = value?.trim();
  if (!input) return undefined;
  try {
    return new URL(input, `${base}/`).toString();
  } catch {
    return undefined;
  }
}