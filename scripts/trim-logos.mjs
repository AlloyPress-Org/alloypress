// Trims transparent padding around every PNG in public/logos so logos render at a
// consistent size. Run once:  node scripts/trim-logos.mjs
import { readdir, rename } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "logos");

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".png"))) {
  const input = path.join(dir, file);
  const output = path.join(dir, `${file}.tmp`);
  await sharp(input).trim({ threshold: 10 }).toFile(output);
  await rename(output, input);
  console.log("trimmed", file);
}
