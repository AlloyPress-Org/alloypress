/* PDF to Markdown: text extraction (pdf.js, browser only) + pure conversion to Markdown. */

export type Item = { s: string; x: number; y: number; w: number; size: number; b: boolean; i: boolean; m: boolean };
export type PageData = { w: number; h: number; items: Item[] };
export type PdfData = { pages: PageData[]; total: number; chars: number; truncated: boolean };

export type ConvOpts = {
    headings: boolean;
    tables: boolean;
    emphasis: boolean;
    clean: boolean;
    twoCol: boolean;
    breaks: boolean;
    range: string;
};

export const DEFAULT_OPTS: ConvOpts = { headings: true, tables: true, emphasis: true, clean: true, twoCol: false, breaks: false, range: "" };
export const MAX_PAGES = 300;
export const MAX_BYTES = 25 * 1024 * 1024;

const BOLD = /bold|black|heavy|semibold|demi/i;
const ITALIC = /italic|oblique/i;
const MONO = /mono|courier|consolas|menlo|monaco|lucidaconsole|typewriter|sourcecode|firacode|jetbrains/i;

/* ---------- 1. extraction (pdf.js) ---------- */
export async function extractPdf(data: ArrayBuffer, onProgress?: (done: number, total: number) => void): Promise<PdfData> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

    const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
    const doc = await task.promise;
    const total = doc.numPages;
    const count = Math.min(total, MAX_PAGES);
    const pages: PageData[] = [];
    let chars = 0;

    try {
        for (let n = 1; n <= count; n++) {
            const page = await doc.getPage(n);
            const vp = page.getViewport({ scale: 1 });
            const tc = await page.getTextContent();
            try { await page.getOperatorList(); } catch { /* fonts may stay unknown: styles fall back to the font family */ }

            const cache = new Map<string, { b: boolean; i: boolean; m: boolean }>();
            const styleOf = (fn: string) => {
                let v = cache.get(fn);
                if (v) return v;
                let name = "";
                let bold = false, italic = false, mono = false;
                try {
                    const f = page.commonObjs.get(fn) as { name?: string; bold?: boolean; italic?: boolean; isMonospace?: boolean } | undefined;
                    name = String(f?.name ?? "");
                    bold = !!f?.bold; italic = !!f?.italic; mono = !!f?.isMonospace;
                } catch { /* not loaded */ }
                const family = String(tc.styles[fn]?.fontFamily ?? "");
                if (!name) name = family;
                v = { b: bold || BOLD.test(name), i: italic || ITALIC.test(name), m: mono || MONO.test(name) || family === "monospace" };
                cache.set(fn, v);
                return v;
            };

            const items: Item[] = [];
            for (const it of tc.items) {
                if (!("str" in it)) continue;
                const s = it.str.replace(/\u00a0/g, " ");
                if (!s.trim()) continue;
                const [a, b, , , e, f] = it.transform as number[];
                const size = Math.hypot(a, b) || it.height || 10;
                if (Math.abs(b) > size * 0.2) continue; // rotated text (watermarks, side labels)
                items.push({ s, x: e, y: f, w: it.width, size, ...styleOf(it.fontName) });
                chars += s.length;
            }
            pages.push({ w: vp.width, h: vp.height, items });
            page.cleanup();
            onProgress?.(n, count);
        }
    } finally {
        await task.destroy();
    }
    return { pages, total, chars, truncated: total > count };
}

/** Characters of real body text. Ignores the top and bottom 10% of each page, where page numbers and running headers sit. */
export function bodyChars(data: PdfData): number {
    let n = 0;
    for (const p of data.pages) {
        for (const it of p.items) {
            if (it.y >= p.h * 0.1 && it.y <= p.h * 0.9) n += it.s.trim().length;
        }
    }
    return n;
}

/* ---------- 2. conversion (pure) ---------- */
type Run = { t: string; b: boolean; i: boolean; m: boolean };
type Seg = { x: number; runs: Run[] };
type Line = { page: number; ph: number; y: number; x: number; size: number; segs: Seg[] };
type Block =
    | { t: "h"; level: number; text: string; page: number; size: number; y: number }
    | { t: "p"; text: string }
    | { t: "li"; ord: string | null; text: string; indent: number; x: number }
    | { t: "code"; lines: string[] }
    | { t: "table"; rows: string[][] }
    | { t: "sep" };

export function parseRange(r: string, total: number): number[] {
    const t = r.trim();
    if (!t) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set<number>();
    for (const part of t.split(",")) {
        const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part);
        if (!m) continue;
        const a = Number(m[1]);
        const b = m[2] ? Number(m[2]) : a;
        for (let n = Math.max(1, Math.min(a, b)); n <= Math.min(total, Math.max(a, b)); n++) set.add(n);
    }
    return [...set].sort((x, y) => x - y);
}

function buildLines(items: Item[], page: number, ph: number): Line[] {
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const groups: Item[][] = [];
    let cur: Item[] = [];
    let curY = 0;
    let curSize = 0;
    for (const it of sorted) {
        if (cur.length && Math.abs(it.y - curY) <= 0.45 * Math.max(it.size, curSize)) {
            cur.push(it);
            curSize = Math.max(curSize, it.size);
        } else {
            if (cur.length) groups.push(cur);
            cur = [it];
            curY = it.y;
            curSize = it.size;
        }
    }
    if (cur.length) groups.push(cur);

    return groups.map((g) => {
        g.sort((a, b) => a.x - b.x);
        const main = g.reduce((m, it) => (it.s.length > m.s.length ? it : m), g[0]);
        const size = main.size;
        const segs: Seg[] = [];
        let seg: Seg | null = null;
        let prevEnd = 0;
        let prevStr = "";
        for (const it of g) {
            const gap = it.x - prevEnd;
            let prefix = "";
            if (!seg || gap > size * 1.5) {
                seg = { x: it.x, runs: [] };
                segs.push(seg);
            } else if (gap > size * 0.12 && !/\s$/.test(prevStr) && !/^\s/.test(it.s)) {
                prefix = " ";
            }
            seg.runs.push({ t: prefix + it.s, b: it.b, i: it.i, m: it.m });
            prevEnd = it.x + it.w;
            prevStr = it.s;
        }
        return { page, ph, y: main.y, x: g[0].x, size, segs };
    });
}

const flat = (l: Line): Run[] => l.segs.flatMap((s, k) => (k ? [{ t: " ", b: false, i: false, m: false }, ...s.runs] : s.runs));
const rawOf = (runs: Run[]) => runs.map((r) => r.t).join("");
const solid = (runs: Run[]) => runs.filter((r) => r.t.trim());
const allBold = (l: Line) => { const r = solid(flat(l)); return r.length > 0 && r.every((x) => x.b); };
const allMono = (l: Line) => { const r = solid(flat(l)); return r.length > 0 && r.every((x) => x.m); };
const esc = (t: string) => t.replace(/[\\`*<]/g, "\\$&");

function render(runs: Run[], mode: "md" | "plain"): string {
    const merged: Run[] = [];
    for (const r of runs) {
        const l = merged[merged.length - 1];
        if (l && l.b === r.b && l.i === r.i && l.m === r.m) l.t += r.t;
        else merged.push({ ...r });
    }
    return merged.map((r) => {
        const core = r.t.trim();
        if (!core) return r.t;
        const lead = r.t.slice(0, r.t.length - r.t.trimStart().length);
        const trail = r.t.slice(r.t.trimEnd().length);
        if (mode === "plain") return lead + esc(core) + trail;
        if (r.m) return `${lead}\`${core.replace(/`/g, "'")}\`${trail}`;
        const e = esc(core);
        return lead + (r.b && r.i ? `***${e}***` : r.b ? `**${e}**` : r.i ? `*${e}*` : e) + trail;
    }).join("");
}

function dropMarker(runs: Run[]): Run[] {
    const out = runs.map((r) => ({ ...r }));
    while (out.length && !out[0].t.trim()) out.shift();
    if (!out.length) return out;
    out[0].t = out[0].t.trimStart().replace(/^(?:[•●▪■◦‣⁃·∙○▫◆➢➤✓✔*]|[-–—]|\d{1,3}[.)])\s*/, "");
    while (out.length && !out[0].t.trim()) out.shift();
    if (out.length) out[0].t = out[0].t.trimStart();
    return out;
}

const BULLET = /^([•●▪■◦‣⁃·∙○▫◆➢➤✓✔*]|[-–—])\s+\S/;
const ORDERED = /^(\d{1,3})[.)]\s+\S/;

const tidy = (t: string) => t.replace(/\*\*(\s+)\*\*/g, "$1").replace(/\s{2,}/g, " ").trim();
const joinText = (a: string, b: string) => (/[A-Za-z]-$/.test(a) && /^[a-z]/.test(b) ? a.slice(0, -1) + b : `${a} ${b}`);

export function convertPdf(data: PdfData, o: ConvOpts): string {
    const sel = parseRange(o.range, data.pages.length);
    if (!sel.length) return "";

    // Body text size = the most common size, so headings are found by comparing to it
    const hist = new Map<number, number>();
    let chars = 0;
    let mono = 0;
    for (const n of sel) {
        for (const it of data.pages[n - 1].items) {
            const k = Math.round(it.size * 2) / 2;
            hist.set(k, (hist.get(k) ?? 0) + it.s.length);
            chars += it.s.length;
            if (it.m) mono += it.s.length;
        }
    }
    if (!chars) return "";
    let body = 12;
    let best = 0;
    hist.forEach((v, k) => { if (v > best) { best = v; body = k; } });
    const useMono = mono / chars < 0.6; // a whole document in a typewriter font is not "all code"

    let lines: Line[] = [];
    for (const n of sel) {
        const p = data.pages[n - 1];
        if (o.twoCol) {
            const mid = p.w / 2;
            lines.push(...buildLines(p.items.filter((i) => i.x < mid), n, p.h), ...buildLines(p.items.filter((i) => i.x >= mid), n, p.h));
        } else {
            lines.push(...buildLines(p.items, n, p.h));
        }
    }

    // Repeated headers, footers and page numbers
    if (o.clean) {
        const key = (l: Line) => rawOf(flat(l)).toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
        const edge = (l: Line) => l.y > l.ph * 0.92 || l.y < l.ph * 0.08;
        const seen = new Map<string, Set<number>>();
        for (const l of lines) {
            if (!edge(l)) continue;
            const k = key(l);
            let s = seen.get(k);
            if (!s) { s = new Set(); seen.set(k, s); }
            s.add(l.page);
        }
        const need = Math.max(2, Math.ceil(sel.length * 0.5));
        lines = lines.filter((l) => {
            if (!edge(l)) return true;
            const k = key(l);
            if (/^(page )?#( (of|\/) #)?$/.test(k)) return false;
            return (seen.get(k)?.size ?? 0) < need;
        });
    }

    const blocks: Block[] = [];
    let prev: Line | null = null;
    let listBase: number | null = null;

    for (let idx = 0; idx < lines.length; idx++) {
        const L = lines[idx];
        const newPage = !!prev && prev.page !== L.page;
        if (newPage && o.breaks) blocks.push({ t: "sep" });
        const gap = prev && !newPage ? prev.y - L.y : Infinity;
        const sz = prev ? Math.max(prev.size, L.size) : L.size;
        const tight = gap <= sz * 1.75;
        const runs = flat(L);
        const raw = rawOf(runs).trim();
        const last = blocks[blocks.length - 1];

        // Tables: consecutive lines with the same number of widely spaced columns
        if (o.tables && L.segs.length >= 2 && !(useMono && allMono(L))) {
            const rows = [L];
            let j = idx + 1;
            while (j < lines.length) {
                const N = lines[j];
                if (N.page !== L.page || N.segs.length !== L.segs.length) break;
                if (rows[rows.length - 1].y - N.y > N.size * 3.4) break;
                if (Math.abs(N.segs[0].x - L.segs[0].x) > N.size) break;
                rows.push(N);
                j++;
            }
            if (rows.length >= 2) {
                blocks.push({ t: "table", rows: rows.map((r) => r.segs.map((s) => render(s.runs, "plain").trim().replace(/\|/g, "\\|"))) });
                idx = j - 1;
                prev = rows[rows.length - 1];
                listBase = null;
                continue;
            }
        }

        // Code: lines set in a monospace font
        if (useMono && allMono(L)) {
            const grp = [L];
            let j = idx + 1;
            while (j < lines.length && lines[j].page === L.page && allMono(lines[j]) && grp[grp.length - 1].y - lines[j].y <= lines[j].size * 2.4) {
                grp.push(lines[j]);
                j++;
            }
            const minX = Math.min(...grp.map((g) => g.x));
            const cw = Math.max(grp[0].size * 0.6, 1);
            const rows = grp.map((g) => " ".repeat(Math.round((g.x - minX) / cw)) + rawOf(flat(g)).trim());
            if (last?.t === "code" && (newPage || tight)) last.lines.push(...rows);
            else blocks.push({ t: "code", lines: rows });
            idx = j - 1;
            prev = grp[grp.length - 1];
            listBase = null;
            continue;
        }

        const bm = BULLET.test(raw);
        const om = ORDERED.exec(raw);
        const ratio = L.size / body;

        // Wrapped list item: indented line right under a list item
        if (last?.t === "li" && tight && !bm && !om && ratio < 1.12 && L.x > last.x + body * 0.3) {
            last.text = joinText(last.text, render(o.emphasis ? runs : runs.map((r) => ({ ...r, b: false, i: false })), "md"));
            prev = L;
            continue;
        }

        // Headings
        if (o.headings && !bm) {
            const text = render(runs, "plain").trim();
            let level = 0;
            if (text.length > 0 && text.length <= 160) {
                if (ratio >= 1.8) level = 1;
                else if (ratio >= 1.4) level = 2;
                else if (ratio >= 1.12) level = 3;
                else if (allBold(L) && text.length <= 80 && !/[.,;:!?]$/.test(text) && ratio >= 0.95 && (!prev || newPage || gap > L.size * 1.35)) level = 4;
            }
            if (level) {
                if (last?.t === "h" && last.level === level && last.page === L.page && tight && Math.abs(last.size - L.size) < 0.6) last.text += ` ${text}`;
                else blocks.push({ t: "h", level, text, page: L.page, size: L.size, y: L.y });
                prev = L;
                listBase = null;
                continue;
            }
        }

        const styled = (rs: Run[]) => render(o.emphasis ? rs : rs.map((r) => ({ ...r, b: false, i: false })), "md");

        // Lists
        if (bm || om) {
            if (listBase === null || last?.t !== "li" || !tight) listBase = L.x;
            else if (L.x < listBase - body) listBase = L.x;
            const indent = Math.max(0, Math.min(3, Math.round((L.x - listBase) / (body * 1.6))));
            blocks.push({ t: "li", ord: om ? om[1] : null, text: styled(dropMarker(runs)), indent, x: L.x });
            prev = L;
            continue;
        }

        // Paragraphs
        listBase = null;
        const text = styled(runs);
        const joins =
            last?.t === "p" && prev &&
            ((!newPage && gap <= sz * 1.65 && Math.abs(L.size - prev.size) < 1.2) ||
                (newPage && !/[.!?:;"”’)]\s*$/.test(last.text) && /^[a-z]/.test(raw)));
        if (joins && last?.t === "p") last.text = joinText(last.text, text);
        else blocks.push({ t: "p", text });
        prev = L;
    }

    const out: string[] = [];
    let before: Block | null = null;
    for (const b of blocks) {
        let md = "";
        if (b.t === "h") md = `${"#".repeat(b.level)} ${tidy(b.text)}`;
        else if (b.t === "p") md = tidy(b.text);
        else if (b.t === "li") md = `${" ".repeat(b.indent * (b.ord ? 3 : 2))}${b.ord ? `${b.ord}. ` : "- "}${tidy(b.text)}`;
        else if (b.t === "code") md = "```\n" + b.lines.join("\n") + "\n```";
        else if (b.t === "sep") md = "---";
        else {
            const cols = Math.max(...b.rows.map((r) => r.length));
            const pad = (r: string[]) => `| ${[...r, ...Array(cols - r.length).fill("")].join(" | ")} |`;
            md = [pad(b.rows[0]), `| ${Array(cols).fill("---").join(" | ")} |`, ...b.rows.slice(1).map(pad)].join("\n");
        }
        if (!md.trim()) continue;
        if (out.length) out.push(before?.t === "li" && b.t === "li" ? "\n" : "\n\n");
        out.push(md);
        before = b;
    }
    return out.length ? out.join("") + "\n" : "";
}

/* ---------- sample PDF (built in code, so no file is needed) ---------- */
export function samplePdf(): PdfData {
    const it = (s: string, x: number, y: number, size = 12, b = false): Item => ({ s, x, y, w: s.length * size * 0.5, size, b, i: false, m: false });
    const items: Item[] = [
        it("Quarterly Report", 72, 720, 24, true),
        it("Summary", 72, 676, 12, true),
        it("Revenue grew 12% this quarter, driven by new customers in", 72, 652),
        it("Europe and a strong renewal rate across all plans.", 72, 637),
        it("Next steps", 72, 600, 12, true),
        it("• Launch the mobile app in May", 72, 576),
        it("• Collect feedback from 50 customers", 72, 561),
        it("Plan", 72, 510), it("Price", 300, 510),
        it("Basic", 72, 492), it("$5", 300, 492),
        it("Pro", 72, 474), it("$12", 300, 474),
    ];
    return { pages: [{ w: 612, h: 792, items }], total: 1, chars: items.reduce((n, i) => n + i.s.length, 0), truncated: false };
}

/* ---------- copy helpers ---------- */
export function toPlain(md: string): string {
    return md
        .replace(/```[\w-]*\n?/g, "")
        .replace(/^\|?\s*(?:-{3,}\s*\|?\s*)+$/gm, "")
        .replace(/^\|(.+)\|$/gm, (_m, r: string) => r.split("|").map((c) => c.trim()).join("\t"))
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*\*?|__|`/g, "")
        .replace(/(^|[^*\w])\*(?=\S)([^*\n]+)\*/g, "$1$2")
        .replace(/^\s*---\s*$/gm, "")
        .replace(/^(\s*)[-*]\s+/gm, "$1• ")
        .replace(/\\([\\`*<])/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim() + "\n";
}

/** Wraps the Markdown so it can be pasted into ChatGPT or Claude as context. */
export const forAi = (md: string, name: string) =>
    `The text below was converted from the PDF "${name.replace(/"/g, "'")}". Use it as context for my next question.\n\n<document name="${name.replace(/"/g, "'")}">\n${md.trim()}\n</document>\n`;