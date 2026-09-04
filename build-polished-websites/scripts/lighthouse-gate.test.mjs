import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { evaluate, extractReport, median, normalizeUrl, parseArgs } from "./lighthouse-gate.mjs";

const scriptPath = fileURLToPath(new URL("./lighthouse-gate.mjs", import.meta.url));
const directory = await mkdtemp(join(tmpdir(), "lighthouse-gate-"));

function report(overrides = {}, extra = {}) {
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
    lighthouseVersion: "13.4.0",
    finalDisplayedUrl: "http://127.0.0.1:4173/",
    configSettings: { formFactor: "mobile" },
    runtimeError: { code: "NO_ERROR", message: "" },
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
    ...extra,
  };
}

function runCli(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], { encoding: "utf8" });
}

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
    })
    .catch((error) => {
      error.message = `${name}: ${error.message}`;
      throw error;
    });
}

try {
  // Unit: median
  await test("median odd/even", () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([1, 2, 3, 4]), 2.5);
    assert.equal(median([7]), 7);
  });

  await test("normalizeUrl treats trailing slash, hash and index.html as the same route", () => {
    assert.equal(normalizeUrl("http://a.test/x/"), "http://a.test/x");
    assert.equal(normalizeUrl("http://a.test/x#top"), "http://a.test/x");
    assert.equal(normalizeUrl("http://a.test/x/index.html"), "http://a.test/x");
    assert.equal(normalizeUrl("http://a.test/"), "http://a.test/");
    assert.equal(normalizeUrl("http://a.test/?q=1"), "http://a.test/?q=1");
    assert.equal(normalizeUrl(undefined), "unknown");
  });

  await test("extractReport accepts PageSpeed Insights wrapper", () => {
    const extracted = extractReport({ lighthouseResult: report() }, "psi.json");
    assert.equal(extracted.performance, 0.92);
    assert.equal(extracted.formFactor, "mobile");
  });

  await test("extractReport rejects runtime errors, non-navigation modes, null scores", () => {
    assert.throws(() => extractReport(report({}, { runtimeError: { code: "NO_FCP", message: "no paint" } }), "r.json"), /runtime error NO_FCP/);
    assert.throws(() => extractReport(report({}, { gatherMode: "snapshot" }), "r.json"), /gatherMode snapshot/);
    assert.throws(() => extractReport(report({ seo: null }), "r.json"), /missing numeric categories\.seo\.score/);
    assert.throws(() => extractReport([], "r.json"), /not a Lighthouse report/);
    assert.throws(() => extractReport({ audits: {} }, "r.json"), /missing categories/);
  });

  await test("evaluate uses medians and reports threshold failures", () => {
    const reports = [report({ performance: 0.7 }), report({ performance: 0.95 }), report({ performance: 0.93 })].map((r, i) => extractReport(r, `r${i}.json`));
    const result = evaluate(reports, parseArgs(["x.json"]).thresholds);
    assert.equal(result.passed, true);
    assert.equal(result.medians.performance, 0.93);
    assert.equal(result.warnings.length, 0);
  });

  await test("evaluate warns below three reports and can enforce --min-reports", () => {
    const one = [extractReport(report(), "r.json")];
    const args = parseArgs(["x.json"]);
    assert.match(evaluate(one, args.thresholds, args).warnings[0], /noisy/);
    const strict = parseArgs(["x.json", "--min-reports", "3"]);
    const result = evaluate(one, strict.thresholds, strict);
    assert.equal(result.passed, false);
    assert.match(result.failures[0], /--min-reports 3/);
  });

  await test("evaluate rejects mixed form factors and mixed URLs", () => {
    const mixedFactor = [extractReport(report(), "a.json"), extractReport(report({}, { configSettings: { formFactor: "desktop" } }), "b.json")];
    assert.throws(() => evaluate(mixedFactor, DEFAULT_THRESHOLDS()), /mix form factors/);
    const mixedUrl = [extractReport(report(), "a.json"), extractReport(report({}, { finalDisplayedUrl: "http://127.0.0.1:4173/pricing" }), "b.json")];
    assert.throws(() => evaluate(mixedUrl, DEFAULT_THRESHOLDS()), /evaluate each route separately/);
  });

  await test("regression mode fails on category drop and metric worsening, passes on improvement", () => {
    const args = parseArgs(["c.json", "--baseline", "b.json"]);
    const baseline = [report({ performance: 0.96, lcp: 1500 }), report({ performance: 0.96, lcp: 1500 }), report({ performance: 0.96, lcp: 1500 })].map((r, i) => extractReport(r, `b${i}.json`));
    const worse = [report({ performance: 0.9, lcp: 2400 })].map((r) => extractReport(r, "c.json"));
    const result = evaluate(worse, args.thresholds, args, baseline);
    assert.equal(result.passed, false);
    assert.match(result.failures.join("\n"), /performance regressed 96 → 90/);
    assert.match(result.failures.join("\n"), /lcp regressed 1500 → 2400/);
    assert.equal(result.comparison.deltas.lcp, 900);

    const better = [report({ performance: 0.99, lcp: 900 })].map((r) => extractReport(r, "c.json"));
    assert.equal(evaluate(better, args.thresholds, args, baseline).passed, true);

    const noise = [report({ performance: 0.95, lcp: 1540, cls: 0.045 })].map((r) => extractReport(r, "c.json"));
    assert.equal(evaluate(noise, args.thresholds, args, baseline).passed, true, "small changes within tolerance pass");
  });

  await test("regression mode refuses different form factors", () => {
    const args = parseArgs(["c.json", "--baseline", "b.json"]);
    const baseline = [extractReport(report({}, { configSettings: { formFactor: "desktop" } }), "b.json")];
    const candidate = [extractReport(report(), "c.json")];
    assert.throws(() => evaluate(candidate, args.thresholds, args, baseline), /form factor desktop differs/);
  });

  await test("parseArgs validates options", () => {
    assert.throws(() => parseArgs([]), /At least one report/);
    assert.throws(() => parseArgs(["a.json", "--performance", "101"]), /between 0 and 100/);
    assert.throws(() => parseArgs(["a.json", "--lcp", "-1"]), /non-negative/);
    assert.throws(() => parseArgs(["a.json", "--bogus", "1"]), /Unknown option/);
    assert.throws(() => parseArgs(["a.json", "--tbt"]), /Missing value/);
    assert.equal(parseArgs(["--help"]).help, true);
    assert.equal(parseArgs(["a.json", "--seo", "80"]).thresholds.seo, 0.8);
  });

  // CLI
  const good = join(directory, "good.json");
  const bad = join(directory, "bad.json");
  const malformed = join(directory, "malformed.json");
  const notJson = join(directory, "not.json");
  const otherUrl = join(directory, "other-url.json");
  const globDir = join(directory, "runs");
  await mkdir(globDir);
  await writeFile(good, JSON.stringify(report()));
  await writeFile(bad, JSON.stringify(report({ performance: 0.7, lcp: 4100 })));
  await writeFile(malformed, JSON.stringify({ categories: {} }));
  await writeFile(notJson, "{not json");
  await writeFile(otherUrl, JSON.stringify({ ...report(), finalDisplayedUrl: "http://127.0.0.1:4173/pricing" }));
  for (const [index, perf] of [0.91, 0.93, 0.95].entries()) {
    await writeFile(join(globDir, `home-${index + 1}.json`), JSON.stringify(report({ performance: perf })));
  }
  await writeFile(join(globDir, "notes.txt"), "ignore me");

  await test("CLI passes and prints a table", () => {
    const passing = runCli([good]);
    assert.equal(passing.status, 0, passing.stderr);
    assert.match(passing.stdout, /Lighthouse gate: PASS/);
    assert.match(passing.stdout, /Lab data/);
    assert.match(passing.stdout, /only 1 report/);
  });

  await test("CLI fails with exit 1 and lists failures", () => {
    const failing = runCli([bad]);
    assert.equal(failing.status, 1, failing.stderr);
    assert.match(failing.stdout, /performance 70 < 90/);
    assert.match(failing.stdout, /lcp 4100 > 2500/);
  });

  await test("CLI exits 2 on malformed, invalid JSON, missing file, mixed URLs", () => {
    assert.equal(runCli([malformed]).status, 2);
    assert.match(runCli([malformed]).stderr, /missing numeric categories\.performance\.score/);
    assert.match(runCli([notJson]).stderr, /invalid JSON/);
    assert.match(runCli([join(directory, "missing.json")]).stderr, /file not found/);
    const mixed = runCli([good, otherUrl]);
    assert.equal(mixed.status, 2);
    assert.match(mixed.stderr, /evaluate each route separately/);
  });

  await test("CLI expands globs itself and computes the median of three", () => {
    const result = runCli([join(globDir, "home-*.json"), "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.reportCount, 3);
    assert.equal(parsed.medians.performance, 0.93);
    assert.equal(parsed.warnings.length, 0);
    assert.match(runCli([join(globDir, "nothing-*.json")]).stderr, /No files match/);
  });

  await test("CLI regression mode prints baseline and delta columns", async () => {
    const baselineDir = join(directory, "baseline");
    await mkdir(baselineDir);
    for (const index of [1, 2, 3]) {
      await writeFile(join(baselineDir, `home-${index}.json`), JSON.stringify(report({ performance: 0.99, lcp: 1200 })));
    }
    const result = runCli([join(globDir, "home-*.json"), "--baseline", join(baselineDir, "home-*.json")]);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /\| Metric \| Baseline \| Median \| Δ \| Gate \|/);
    assert.match(result.stdout, /performance regressed 99 → 93/);
    const lenient = runCli([join(globDir, "home-*.json"), "--baseline", join(baselineDir, "home-*.json"), "--max-regression", "10", "--max-metric-regression", "100"]);
    assert.equal(lenient.status, 0, lenient.stdout);
  });

  process.stdout.write(`lighthouse-gate tests passed (${passed})\n`);
} finally {
  await rm(directory, { recursive: true, force: true });
}

function DEFAULT_THRESHOLDS() {
  return parseArgs(["x.json"]).thresholds;
}
