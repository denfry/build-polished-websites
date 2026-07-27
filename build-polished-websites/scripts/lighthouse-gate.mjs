#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULTS = {
  performance: 0.9,
  accessibility: 0.95,
  "best-practices": 0.95,
  seo: 0.95,
  lcp: 2500,
  cls: 0.1,
  tbt: 200,
};

function usage() {
  return [
    "Usage: node lighthouse-gate.mjs [options] <report.json> [report.json ...]",
    "",
    "Options:",
    "  --performance <0-100>     Default: 90",
    "  --accessibility <0-100>   Default: 95",
    "  --best-practices <0-100>  Default: 95",
    "  --seo <0-100>             Default: 95",
    "  --lcp <milliseconds>      Default: 2500",
    "  --cls <score>             Default: 0.10",
    "  --tbt <milliseconds>      Default: 200",
    "  --json                    Emit machine-readable JSON",
    "  --help                    Show this help",
  ].join("\n");
}

function parseFinite(value, option) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${option} must be a non-negative number`);
  }
  return parsed;
}

function parseArgs(argv) {
  const thresholds = { ...DEFAULTS };
  const reports = [];
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      reports.push(arg);
      continue;
    }

    const key = arg.slice(2);
    if (!(key in thresholds)) throw new Error(`Unknown option: ${arg}`);
    const value = argv[index + 1];
    if (value === undefined) throw new Error(`Missing value for ${arg}`);
    const parsed = parseFinite(value, arg);
    if (["performance", "accessibility", "best-practices", "seo"].includes(key)) {
      if (parsed > 100) throw new Error(`${arg} must be between 0 and 100`);
      thresholds[key] = parsed / 100;
    } else {
      thresholds[key] = parsed;
    }
    index += 1;
  }

  if (reports.length === 0) throw new Error("At least one report is required");
  return { thresholds, reports, json, help: false };
}

function requireNumber(value, path, reportPath) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${reportPath}: missing numeric ${path}`);
  }
  return value;
}

function extractReport(data, reportPath) {
  const category = (name) =>
    requireNumber(data.categories?.[name]?.score, `categories.${name}.score`, reportPath);
  const audit = (name) =>
    requireNumber(data.audits?.[name]?.numericValue, `audits.${name}.numericValue`, reportPath);

  return {
    path: reportPath,
    finalUrl: data.finalDisplayedUrl ?? data.finalUrl ?? "unknown",
    performance: category("performance"),
    accessibility: category("accessibility"),
    "best-practices": category("best-practices"),
    seo: category("seo"),
    lcp: audit("largest-contentful-paint"),
    cls: audit("cumulative-layout-shift"),
    tbt: audit("total-blocking-time"),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function evaluate(extracted, thresholds) {
  const urls = [...new Set(extracted.map((report) => report.finalUrl))];
  if (urls.length > 1) {
    throw new Error(
      `reports contain multiple final URLs; evaluate each route separately: ${urls.join(", ")}`,
    );
  }
  const keys = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
    "lcp",
    "cls",
    "tbt",
  ];
  const medians = Object.fromEntries(
    keys.map((key) => [key, median(extracted.map((report) => report[key]))]),
  );
  const failures = [];

  for (const key of ["performance", "accessibility", "best-practices", "seo"]) {
    if (medians[key] < thresholds[key]) {
      failures.push(`${key} ${Math.round(medians[key] * 100)} < ${Math.round(thresholds[key] * 100)}`);
    }
  }
  for (const key of ["lcp", "cls", "tbt"]) {
    if (medians[key] > thresholds[key]) {
      failures.push(`${key} ${medians[key]} > ${thresholds[key]}`);
    }
  }

  return {
    passed: failures.length === 0,
    reportCount: extracted.length,
    urls,
    thresholds,
    medians,
    failures,
  };
}

function format(result) {
  const score = (value) => Math.round(value * 100);
  const metric = (value, digits = 0) => value.toFixed(digits);
  const rows = [
    ["Performance", score(result.medians.performance), `>= ${score(result.thresholds.performance)}`],
    ["Accessibility", score(result.medians.accessibility), `>= ${score(result.thresholds.accessibility)}`],
    ["Best Practices", score(result.medians["best-practices"]), `>= ${score(result.thresholds["best-practices"])}`],
    ["SEO", score(result.medians.seo), `>= ${score(result.thresholds.seo)}`],
    ["LCP", `${metric(result.medians.lcp)} ms`, `<= ${result.thresholds.lcp} ms`],
    ["CLS", metric(result.medians.cls, 3), `<= ${result.thresholds.cls}`],
    ["TBT", `${metric(result.medians.tbt)} ms`, `<= ${result.thresholds.tbt} ms`],
  ];
  const lines = [
    `Lighthouse gate: ${result.passed ? "PASS" : "FAIL"} (${result.reportCount} report${result.reportCount === 1 ? "" : "s"})`,
    "",
    "| Metric | Median | Gate |",
    "|---|---:|---:|",
    ...rows.map(([name, value, gate]) => `| ${name} | ${value} | ${gate} |`),
  ];
  if (result.failures.length) {
    lines.push("", "Failures:", ...result.failures.map((failure) => `- ${failure}`));
  }
  return lines.join("\n");
}

export async function run(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const extracted = [];
  for (const reportPath of options.reports) {
    const raw = await readFile(reportPath, "utf8");
    extracted.push(extractReport(JSON.parse(raw), reportPath));
  }
  const result = evaluate(extracted, options.thresholds);
  process.stdout.write(`${options.json ? JSON.stringify(result, null, 2) : format(result)}\n`);
  return result.passed ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`Lighthouse gate error: ${error.message}\n\n${usage()}\n`);
      process.exitCode = 2;
    });
}
