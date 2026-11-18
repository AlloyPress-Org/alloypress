import raw from "../../data/tool-dates.json";

const dates = raw as Record<string, { updatedAt: string }>;

export const getToolUpdatedAt = (slug: string): string | null =>
  dates[slug]?.updatedAt ?? null;

export const getHubUpdatedAt = (): string | null =>
  Object.values(dates).map((d) => d.updatedAt).sort().at(-1) ?? null;