// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { prepare, renderMarkdown } from "./markdown";

const ATTACKS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "[click](javascript:alert(1))",
  "[click](JaVaScRiPt:alert(1))",
  "<svg onload=alert(1)></svg>",
  "<iframe src='https://example.com'></iframe>",
  "<form action='https://example.com'><input type='password'><button>Login</button></form>",
  "<div style='position:fixed;inset:0;background:red'>overlay</div>",
  "<style>body{display:none}</style>",
  "<details open ontoggle=alert(1)><summary>x</summary></details>",
  "<a href='data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='>x</a>",
  "<math><mi xlink:href='javascript:alert(1)'>x</mi></math>",
  "```mermaid\nflowchart LR\n  A[\"<img src=x onerror=alert(1)>\"] --> B\n```",
];

const BAD = [/<script/i, /\son\w+\s*=/i, /javascript:/i, /<iframe/i, /<form/i, /<style/i, /\sstyle\s*=/i, /<button/i, /type="password"/i, /data:text\/html/i];

describe("renderMarkdown blocks unsafe input", () => {
  for (const attack of ATTACKS) {
    it(attack.slice(0, 50), async () => {
      await prepare(attack);
      const html = renderMarkdown(attack);
      for (const bad of BAD) expect(html).not.toMatch(bad);
    });
  }

  it("keeps normal Markdown working", async () => {
    const md = "# Title\n\n- [x] done\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n```js\nconst a = 1;\n```";
    await prepare(md);
    const html = renderMarkdown(md);
    expect(html).toContain("<h1");
    expect(html).toContain("<table");
    expect(html).toContain("checkbox");
    expect(html).toContain("hljs");
  });
});