import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "./slop-scan.mjs";

const scriptPath = fileURLToPath(new URL("./slop-scan.mjs", import.meta.url));
const directory = await mkdtemp(join(tmpdir(), "slop-scan-"));

const classicPage = `<!doctype html><html lang="en"><head><style>
.hero { background: linear-gradient(135deg, #6366f1, #a855f7); }
.title { background: linear-gradient(90deg, #8b5cf6, #3b82f6); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card { backdrop-filter: blur(12px); }
.nav { backdrop-filter: blur(20px); }
.blob { position: absolute; filter: blur(80px); }
</style></head><body><main>
<h1>Supercharge your workflow with seamless AI ✨</h1>
<p>Trusted by 10,000+ teams. Join 50,000 makers.</p>
<ul><li>🚀 Fast</li><li>🔒 Secure</li><li>⚡ Simple</li></ul>
</main></body></html>`;

const fashionablePage = `<!doctype html><html lang="en"><head><style>
:root { --paper: #f3f0e6; --ink: #17201d; --signal: #e8512d; --mono: "JetBrains Mono", monospace; }
body { background: var(--paper); }
.eyebrow { font: 700 .75rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.button { box-shadow: 4px 4px 0 var(--signal); }
.button:hover { box-shadow: 7px 7px 0 var(--signal); }
h1 { letter-spacing: -.07em; }
</style></head><body><main>
<p class="eyebrow">Field notes</p><h1>The work ends. The lesson <em>stays.</em></h1>
<section><p class="eyebrow">Method</p><span>01</span> <span>02</span> <span>03</span></section>
<section><p class="eyebrow">Pricing</p></section>
</main></body></html>`;

const restrainedPage = `<!doctype html><html lang="en"><head><style>
:root { --ground: #ffffff; --ink: #101418; --line: #d7dbe0; --accent: #0b5cad; }
body { background: var(--ground); color: var(--ink); font-family: "Public Sans", system-ui, sans-serif; }
.button { border-radius: 4px; background: var(--accent); color: #fff; }
</style></head><body><main>
<h1>Harbour tide tables for Gdańsk Bay</h1>
<p>Published every morning at 06:00 from the port authority feed.</p>
</main></body></html>`;

try {
  const classicPath = join(directory, "classic.html");
  const fashionablePath = join(directory, "fashionable.html");
  const restrainedPath = join(directory, "restrained.html");
  await writeFile(classicPath, classicPage);
  await writeFile(fashionablePath, fashionablePage);
  await writeFile(restrainedPath, restrainedPage);

  const classic = await scan([classicPath]);
  const classicIds = classic.signals.map((signal) => signal.id);
  for (const id of ["purple-gradient", "gradient-text", "glassmorphism", "glow-blobs", "emoji-icons", "stock-phrases", "unverified-proof"]) {
    assert.ok(classicIds.includes(id), `classic page should trigger ${id}`);
  }
  assert.ok(classic.clusters.some((cluster) => cluster.id === "classic-template"));
  assert.equal(classic.verdict, "likely generic");

  const fashionable = await scan([fashionablePath]);
  const fashionableIds = fashionable.signals.map((signal) => signal.id);
  for (const id of ["cream-paper", "terracotta-accent", "mono-eyebrows", "hard-offset-shadow", "section-numbering", "headline-accent-word", "tight-tracking", "fashionable-fonts"]) {
    assert.ok(fashionableIds.includes(id), `fashionable page should trigger ${id}`);
  }
  assert.ok(fashionable.clusters.some((cluster) => cluster.id === "fashionable-template"));
  assert.equal(fashionable.verdict, "likely generic");

  const restrained = await scan([restrainedPath]);
  assert.equal(restrained.signals.length, 0, `restrained page fired: ${restrained.signals.map((s) => s.id).join(", ")}`);
  assert.equal(restrained.verdict, "low");

  const directoryScan = await scan([directory]);
  assert.equal(directoryScan.files, 3);

  const strict = spawnSync(process.execPath, [scriptPath, classicPath, "--max-score", "3"], { encoding: "utf8" });
  assert.equal(strict.status, 1, "--max-score should fail a generic page");
  const lenient = spawnSync(process.execPath, [scriptPath, restrainedPath, "--max-score", "3"], { encoding: "utf8" });
  assert.equal(lenient.status, 0, lenient.stderr);
  const json = spawnSync(process.execPath, [scriptPath, fashionablePath, "--json"], { encoding: "utf8" });
  assert.equal(json.status, 0, json.stderr);
  assert.equal(JSON.parse(json.stdout).verdict, "likely generic");
  const missing = spawnSync(process.execPath, [scriptPath], { encoding: "utf8" });
  assert.equal(missing.status, 2);

  process.stdout.write("slop-scan tests passed\n");
} finally {
  await rm(directory, { recursive: true, force: true });
}
