/* Reads an uploaded file as text in the browser: encoding detection + .docx support. */
const MAX_BYTES = 5 * 1024 * 1024;

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  return new Uint8Array(await new Response(new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(ds)).arrayBuffer());
}

function decodeText(u8: Uint8Array): string {
  let s: string;
  if (u8[0] === 0xff && u8[1] === 0xfe) s = new TextDecoder("utf-16le").decode(u8.subarray(2));
  else if (u8[0] === 0xfe && u8[1] === 0xff) s = new TextDecoder("utf-16be").decode(u8.subarray(2));
  else {
    const head = u8.subarray(0, 8000);
    for (let i = 0; i < head.length; i++) if (head[i] === 0) throw new Error("This looks like a binary file (image, PDF, zip…). Upload a text file or a .docx.");
    try { s = new TextDecoder("utf-8", { fatal: true }).decode(u8); }
    catch { s = new TextDecoder("windows-1252").decode(u8); }
  }
  return s.replace(/^\uFEFF/, "");
}

async function docxText(buf: ArrayBuffer): Promise<string> {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("This .docx file could not be read.");
  const count = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true);
    const elen = dv.getUint16(p + 30, true);
    const clen = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (name !== "word/document.xml") continue;
    const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
    const data = u8.subarray(start, start + csize);
    const xml = new TextDecoder("utf-8").decode(method === 0 ? data : await inflateRaw(data));
    return xml
      .replace(/<w:tab\s*\/>/g, "\t")
      .replace(/<w:br\s*\/>|<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
      .replace(/\n+$/, "");
  }
  throw new Error("No text found in this .docx file.");
}

export async function readFileText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("File is too large. Max size is 5 MB.");
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  const isZip = u8[0] === 0x50 && u8[1] === 0x4b;
  if (isZip) {
    if (/\.docx$/i.test(file.name)) {
      if (typeof DecompressionStream === "undefined") throw new Error("Your browser cannot open .docx files. Try a newer browser.");
      return docxText(buf);
    }
    throw new Error("Zip-based files are not supported. Upload a text file or a .docx.");
  }
  if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) throw new Error("PDF files are not supported. Copy the text from the PDF and paste it.");
  return decodeText(u8);
}