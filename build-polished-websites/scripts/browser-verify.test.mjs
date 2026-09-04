import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs, resolveTooling, summarize } from "./browser-verify.mjs";

const scriptPath = fileURLToPath(new URL("./browser-verify.mjs", import.meta.url));
const emptyDir = await mkdtemp(join(tmpdir(), "bpw-empty-"));
let passed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    cwd: emptyDir,
    env: { ...process.env, BPW_TOOLING_DIR: "", ...env },
  });
}

try {
  await test("parseArgs validates input", () => {
    assert.throws(() => parseArgs([]), /At least one --url/);
    assert.throws(() => parseArgs(["--url", "file:///x.html"]), /Only http\(s\)/);
    assert.throws(() => parseArgs(["--url", "not a url"]), /Invalid URL/);
    assert.throws(() => parseArgs(["--url", "http://a.test", "--viewports", "abc"]), /Invalid viewport/);
    assert.throws(() => parseArgs(["--url", "http://a.test", "--tabs", "-1"]), /--tabs/);
    assert.throws(() => parseArgs(["--url", "http://a.test", "--nope"]), /Unknown option/);
    const options = parseArgs(["--url", "http://a.test/", "--viewports", "320x800,1440x900", "--axe", "--tooling-dir", "./t"]);
    assert.deepEqual(options.viewportList, [{ width: 320, height: 800 }, { width: 1440, height: 900 }]);
    assert.equal(options.axe, true);
    assert.equal(options.toolingDir, "./t");
  });

  await test("resolveTooling returns null when nothing is installed", () => {
    assert.equal(resolveTooling("playwright", emptyDir), null);
  });

  await test("CLI exits 3 with instructions when Playwright is unavailable", () => {
    const result = runCli(["--url", "http://127.0.0.1:1/"]);
    assert.equal(result.status, 3, result.stderr);
    assert.match(result.stderr, /Playwright is not available/);
    assert.match(result.stderr, /--tooling-dir/);
  });

  await test("CLI exits 2 on usage errors", () => {
    const result = runCli([]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /At least one --url/);
  });

  await test("summarize renders findings", () => {
    const summary = summarize({
      generatedAt: "now",
      playwrightVersion: "x",
      routes: [{ url: "http://a.test/", viewports: [{ width: 375, facts: { horizontalOverflow: true, title: "T", lang: "en", h1Count: 1, mainCount: 1, landmarks: ["main"] }, consoleErrors: ["boom"], pageErrors: [], failedRequests: [], screenshot: "a.png" }], keyboard: { viewport: { width: 1440 }, reachable: 3, withoutVisibleFocus: 1, firstStopIsSkipLink: true, possibleTrap: false }, axe: null, findings: ["375px: horizontal overflow"] }],
    });
    assert.match(summary, /\| 375 \| yes \| 1 \| 0 \| a.png \|/);
    assert.match(summary, /first stop is skip link: yes/);
    assert.match(summary, /- 375px: horizontal overflow/);
  });

  // Optional real run when a tooling directory with Playwright is provided.
  const toolingDir = process.env.BPW_TOOLING_DIR;
  if (toolingDir && resolveTooling("playwright", toolingDir)) {
    await test("real run captures screenshots and detects overflow, console errors, and missing h1", async () => {
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fixture</title><meta name="description" content="d"></head>
<body><header><a href="#main" class="skip">Skip to content</a><nav><a href="/x">X</a></nav></header><main id="main"><h2>No h1</h2><div style="width:2000px;height:10px;background:red"></div><button>Go</button><img src="/missing.png"></main><footer></footer>
<script>console.error("fixture error")</script></body></html>`;
      const server = createServer((request, response) => {
        if (request.url === "/") {
          response.writeHead(200, { "content-type": "text/html" });
          response.end(html);
        } else {
          response.writeHead(404);
          response.end();
        }
      });
      await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
      const { port } = server.address();
      const out = join(emptyDir, "out");
      try {
        const result = runCli(["--url", `http://127.0.0.1:${port}/`, "--out", out, "--viewports", "375x812,1440x900", "--tabs", "5", "--axe", "--json"], { BPW_TOOLING_DIR: toolingDir });
        assert.equal(result.status, 1, result.stderr);
        const parsed = JSON.parse(result.stdout);
        const route = parsed.routes[0];
        const findings = route.findings.join("\n");
        assert.match(findings, /horizontal overflow/);
        assert.match(findings, /console error/);
        assert.match(findings, /h1 count is 0/);
        assert.match(findings, /failed request/);
        assert.match(findings, /image\(s\) without alt/);
        assert.equal(route.keyboard.firstStopIsSkipLink, true);
        assert.ok(route.keyboard.reachable >= 3);
        assert.ok(route.viewports.every((entry) => entry.screenshot));
        if (resolveTooling("axe-core/axe.min.js", toolingDir)) assert.ok(Array.isArray(route.axe.violations));
        const summary = await readFile(join(out, "summary.md"), "utf8");
        assert.match(summary, /Browser verification/);
      } finally {
        server.close();
      }
    });
  } else {
    process.stdout.write("browser-verify: real-browser test skipped (set BPW_TOOLING_DIR to a directory with playwright installed)\n");
  }

  process.stdout.write(`browser-verify tests passed (${passed})\n`);
} finally {
  await rm(emptyDir, { recursive: true, force: true });
}
