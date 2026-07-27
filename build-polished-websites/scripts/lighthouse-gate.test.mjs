import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = new URL("./lighthouse-gate.mjs", import.meta.url);
const scriptPath = fileURLToPath(script);
const directory = await mkdtemp(join(tmpdir(), "lighthouse-gate-"));

function report(overrides = {}) {
  const values = {
    performance: 0.92,
    accessibility: 0.98,
    "best-practices": 0.97,
    seo: 0.98,
    lcp: 2100,
    cls: 0.04,
    tbt: 120,
    ...overrides,
  };
  return {
    finalUrl: "http://127.0.0.1:4173/",
    categories: {
      performance: { score: values.performance },
      accessibility: { score: values.accessibility },
      "best-practices": { score: values["best-practices"] },
      seo: { score: values.seo },
    },
    audits: {
      "largest-contentful-paint": { numericValue: values.lcp },
      "cumulative-layout-shift": { numericValue: values.cls },
      "total-blocking-time": { numericValue: values.tbt },
    },
  };
}

try {
  const good = join(directory, "good.json");
  const bad = join(directory, "bad.json");
  const malformed = join(directory, "malformed.json");
  const otherUrl = join(directory, "other-url.json");
  await writeFile(good, JSON.stringify(report()));
  await writeFile(bad, JSON.stringify(report({ performance: 0.7, lcp: 4100 })));
  await writeFile(malformed, JSON.stringify({ categories: {} }));
  await writeFile(
    otherUrl,
    JSON.stringify({ ...report(), finalUrl: "http://127.0.0.1:4173/pricing" }),
  );

  const passing = spawnSync(process.execPath, [scriptPath, good], { encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stderr);
  assert.match(passing.stdout, /Lighthouse gate: PASS/);

  const failing = spawnSync(process.execPath, [scriptPath, bad], { encoding: "utf8" });
  assert.equal(failing.status, 1, failing.stderr);
  assert.match(failing.stdout, /performance 70 < 90/);
  assert.match(failing.stdout, /lcp 4100 > 2500/);

  const invalid = spawnSync(process.execPath, [scriptPath, malformed], { encoding: "utf8" });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /missing numeric categories\.performance\.score/);

  const mixedRoutes = spawnSync(process.execPath, [scriptPath, good, otherUrl], { encoding: "utf8" });
  assert.equal(mixedRoutes.status, 2);
  assert.match(mixedRoutes.stderr, /evaluate each route separately/);

  process.stdout.write("lighthouse-gate tests passed\n");
} finally {
  await rm(directory, { recursive: true, force: true });
}
