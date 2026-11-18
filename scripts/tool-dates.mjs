import { createHash } from "node:crypto";
import {
    readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync,
} from "node:fs";
import path from "node:path";

// Un folder structure ku match pannu
const TOOL_ROOTS = ["app/tools"];
// Shared code maathina ella tool kum date maaranum na, inga folder podu (illana [] vitru)
const SHARED_DIRS = [];
const OUT = "data/tool-dates.json";

const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
        const full = path.join(dir, n);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });

function hashDirs(dirs) {
    const h = createHash("sha1");
    for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        const files = walk(dir).map((f) => f.split(path.sep).join("/")).sort();
        for (const f of files) {
            h.update(f);
            h.update(readFileSync(f, "utf8").replace(/\r\n/g, "\n")); // Windows/Linux same hash
        }
    }
    return h.digest("hex");
}

const slugs = TOOL_ROOTS.filter(existsSync).flatMap((root) =>
    readdirSync(root).filter(
        (n) =>
            statSync(path.join(root, n)).isDirectory() &&
            !/^[_\[(]/.test(n),
    ),
);

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const next = {};
const now = new Date().toISOString();

for (const slug of [...new Set(slugs)].sort()) {
    const hash = hashDirs([...TOOL_ROOTS.map((r) => path.join(r, slug)), ...SHARED_DIRS]);
    next[slug] = prev[slug]?.hash === hash ? prev[slug] : { hash, updatedAt: now };
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(next, null, 2) + "\n");
console.log("tool-dates updated:", Object.keys(next).length, "tools");