/* =========================================================
   Text Compare: pure diff logic + share-link encoding (no React).
   Used by app/tools/text-diff. Everything runs in the browser.
   ========================================================= */

export type DiffOptions = { ignoreCase: boolean; ignoreWhitespace: boolean };
export type Part = { text: string; changed: boolean };
export type Side = { n: number; text: string; parts?: Part[] };

type Meta = { hunk?: number; first?: boolean };
export type Row =
  | ({ kind: "eq"; left: Side; right: Side } & Meta)
  | ({ kind: "chg"; left: Side; right: Side } & Meta)
  | ({ kind: "del"; left: Side } & Meta)
  | ({ kind: "add"; right: Side } & Meta);
export type DisplayRow = Row | { kind: "skip"; count: number };

export type DiffResult = {
  rows: Row[];
  added: number;    // lines only in the changed text (a changed line counts once here and once in removed)
  removed: number;  // lines only in the original text
  hunks: number;    // blocks of changes
  identical: boolean;
  approx: boolean;  // texts were too different to compare line by line
};

type Op = "=" | "-" | "+";

/* ---------- Myers diff (shortest edit script) ---------- */
function myers(a: string[], b: string[], maxD = 2500): Op[] | null {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, maxD);
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= max && found < 0; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) { found = d; break; }
    }
  }
  if (found < 0) return null;
  const ops: Op[] = [];
  let x = n;
  let y = m;
  for (let d = found; d >= 0; d--) {
    const t = trace[d];
    const at = (k: number) => t[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push("="); x--; y--; }
    if (d > 0) ops.push(x === prevX ? "+" : "-");
    x = prevX;
    y = prevY;
  }
  return ops.reverse();
}

/** Edit script for two key lists: trims the common start and end first, which is most of the work for real texts. */
function script(a: string[], b: string[]): { ops: Op[]; approx: boolean } {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0;
  while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  const ma = a.slice(s, a.length - e);
  const mb = b.slice(s, b.length - e);
  let mid: Op[];
  let approx = false;
  if (!ma.length) mid = mb.map(() => "+");
  else if (!mb.length) mid = ma.map(() => "-");
  else {
    const r = myers(ma, mb);
    if (r) mid = r;
    else { approx = true; mid = [...ma.map(() => "-" as Op), ...mb.map(() => "+" as Op)]; }
  }
  return { ops: [...Array<Op>(s).fill("="), ...mid, ...Array<Op>(e).fill("=")], approx };
}

/* ---------- keys and tokens ---------- */
const key = (s: string, o: DiffOptions) => {
  let k = s;
  if (o.ignoreWhitespace) k = k.trim().replace(/\s+/g, " ");
  if (o.ignoreCase) k = k.toLowerCase();
  return k;
};

export function splitLines(text: string): string[] {
  if (!text) return [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop(); // a final line break is not a line
  return lines;
}

const TOKEN = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
const MAX_TOKENS = 600;

function merge(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.changed === p.changed) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

/** Word-level changes inside one changed line pair. */
function wordParts(l: string, r: string, o: DiffOptions): [Part[], Part[]] {
  const ta = l.match(TOKEN) ?? [];
  const tb = r.match(TOKEN) ?? [];
  if (ta.length > MAX_TOKENS || tb.length > MAX_TOKENS) return [[{ text: l, changed: true }], [{ text: r, changed: true }]];
  const tk = (t: string) => (/^\s+$/.test(t) ? (o.ignoreWhitespace ? " " : t) : o.ignoreCase ? t.toLowerCase() : t);
  const { ops } = script(ta.map(tk), tb.map(tk));
  const lp: Part[] = [];
  const rp: Part[] = [];
  let i = 0;
  let j = 0;
  for (const op of ops) {
    if (op === "=") { lp.push({ text: ta[i++], changed: false }); rp.push({ text: tb[j++], changed: false }); }
    else if (op === "-") lp.push({ text: ta[i++], changed: true });
    else rp.push({ text: tb[j++], changed: true });
  }
  return [merge(lp), merge(rp)];
}

/* ---------- main diff ---------- */
export function diffTexts(original: string, changed: string, o: DiffOptions): DiffResult {
  const A = splitLines(original);
  const B = splitLines(changed);
  const { ops, approx } = script(A.map((l) => key(l, o)), B.map((l) => key(l, o)));

  const rows: Row[] = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  let hunks = 0;
  let p = 0;
  while (p < ops.length) {
    if (ops[p] === "=") {
      rows.push({ kind: "eq", left: { n: i + 1, text: A[i] }, right: { n: j + 1, text: B[j] } });
      i++; j++; p++;
      continue;
    }
    const dels: number[] = [];
    const adds: number[] = [];
    while (p < ops.length && ops[p] !== "=") {
      if (ops[p] === "-") dels.push(i++);
      else adds.push(j++);
      p++;
    }
    const hunk = hunks++;
    const pairs = Math.min(dels.length, adds.length);
    const block: Row[] = [];
    for (let q = 0; q < pairs; q++) {
      const [lp, rp] = wordParts(A[dels[q]], B[adds[q]], o);
      block.push({ kind: "chg", left: { n: dels[q] + 1, text: A[dels[q]], parts: lp }, right: { n: adds[q] + 1, text: B[adds[q]], parts: rp } });
    }
    for (let q = pairs; q < dels.length; q++) block.push({ kind: "del", left: { n: dels[q] + 1, text: A[dels[q]] } });
    for (let q = pairs; q < adds.length; q++) block.push({ kind: "add", right: { n: adds[q] + 1, text: B[adds[q]] } });
    removed += dels.length;
    added += adds.length;
    block.forEach((r, idx) => rows.push({ ...r, hunk, first: idx === 0 }));
  }
  return { rows, added, removed, hunks, identical: hunks === 0, approx };
}

/** Hides long runs of unchanged lines, keeping `ctx` lines of context around every change. */
export function collapseRows(rows: Row[], ctx = 2): DisplayRow[] {
  const out: DisplayRow[] = [];
  let k = 0;
  while (k < rows.length) {
    if (rows[k].kind !== "eq") { out.push(rows[k++]); continue; }
    let e = k;
    while (e < rows.length && rows[e].kind === "eq") e++;
    const run = rows.slice(k, e);
    const atStart = k === 0;
    const atEnd = e === rows.length;
    const head = atStart ? 0 : ctx;
    const tail = atEnd ? 0 : ctx;
    if (run.length > head + tail + 1) {
      out.push(...run.slice(0, head), { kind: "skip", count: run.length - head - tail }, ...run.slice(run.length - tail));
    } else out.push(...run);
    k = e;
  }
  return out;
}

/** Plain-text diff (- removed, + added) for copy and download. */
export function toUnified(rows: Row[]): string {
  const lines = ["--- Original", "+++ Changed"];
  for (const r of rows) {
    if (r.kind === "eq") lines.push("  " + r.left.text);
    if (r.kind === "del" || r.kind === "chg") lines.push("- " + r.left.text);
    if (r.kind === "add" || r.kind === "chg") lines.push("+ " + r.right.text);
  }
  return lines.join("\n");
}

/* ---------- share link (the text lives in the URL after #, so it is never sent to a server) ---------- */
export type ShareState = { a: string; b: string; ic: boolean; iw: boolean };
export const MAX_SHARE_CODE = 7500;

const toB64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const pipe = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) =>
  new Uint8Array(await new Response(new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());

export async function encodeShare(s: ShareState): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  if (typeof CompressionStream !== "undefined") {
    try { return "z" + toB64(await pipe(bytes, new CompressionStream("deflate-raw"))); } catch { /* fall back */ }
  }
  return "r" + toB64(bytes);
}

export async function decodeShare(code: string): Promise<ShareState | null> {
  try {
    const raw = fromB64(code.slice(1));
    let bytes = raw;
    if (code[0] === "z") {
      if (typeof DecompressionStream === "undefined") return null;
      bytes = await pipe(raw, new DecompressionStream("deflate-raw"));
    } else if (code[0] !== "r") return null;
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof o?.a !== "string" || typeof o?.b !== "string") return null;
    return { a: o.a, b: o.b, ic: !!o.ic, iw: !!o.iw };
  } catch {
    return null;
  }
}