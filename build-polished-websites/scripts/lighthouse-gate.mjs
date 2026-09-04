#!/usr/bin/env node
// Lighthouse gate: median-of-N evaluation against floors, plus optional
// regression comparison against a baseline set. Lab data only.

import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
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
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const METRICS = ["lcp", "cls", "tbt"];
const METRIC_AUDITS = {
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  tbt: "total-blocking-time",
};

function usage() {
  return [
    "Usage: node lighthouse-gate.mjs [options] <report.json|glob> [more ...]",
    "",
    "Gate options (medians must meet these floors):",
    "  --performance <0-100>        Default: 90",
    "  --accessibility <0-100>      Default: 95",
    "  --best-practices <0-100>     Default: 95",
    "  --seo <0-100>                Default: 95",
    "  --lcp <ms>                   Default: 2500",
    "  --cls <score>                Default: 0.10",
    "  --tbt <ms>                   Default: 200",
    "  --min-reports <n>            Fail when fewer reports are supplied (default: warn below 3)",
    "",
    "Regression options:",
    "  --baseline <report|glob>     Repeatable. Compare candidate medians against this set",
    "  --max-regression <points>    Category drop allowed vs baseline (default: 3)",
    "  --max-metric-regression <%>  Metric worsening allowed vs baseline (default: 10)",
    "",
    "  --json                       Emit machine-readable JSON",
    "  --help                       Show this help",
    "",
    "Globs with * are expanded by the script, so quoting works in PowerShell too.",
    "Exit codes: 0 pass, 1 fail, 2 error.",
  ].join("\n");
}

function parseFinite(value, option) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${option} must be a non-negative number`);
  }
  return parsed;
}

export function parseArgs(argv) {
  const thresholds = { ...DEFAULTS };
  const reports = [];
  const baseline = [];
  const options = { json: false, help: false, minReports: null, maxRegression: 3, maxMetricRegression: 10 };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      reports.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (value === undefined) throw new Error(`Missing value for ${arg}`);
    index += 1;
    if (key === "baseline") {
      baseline.push(value);
    } else if (key === "min-reports") {
      options.minReports = parseFinite(value, arg);
    } else if (key === "max-regression") {
      options.maxRegression = parseFinite(value, arg);
    } else if (key === "max-metric-regression") {
      options.maxMetricRegression = parseFinite(value, arg);
    } else if (key in thresholds) {
      const parsed = parseFinite(value, arg);
      if (CATEGORIES.includes(key)) {
        if (parsed > 100) throw new Error(`${arg} must be between 0 and 100`);
        thresholds[key] = parsed / 100;
      } else {
        thresholds[key] = parsed;
      }
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (reports.length === 0) throw new Error("At least one report is required");
  return { thresholds, reports, baseline, ...options, help: false };
}

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/\\\\]*").replace(/\?/g, "[^/\\\\]");
  return new RegExp(`^${escaped}$`);
}

export async function expandPatterns(patterns) {
  const files = [];
  for (const pattern of patterns) {
    if (!/[*?]/.test(pattern)) {
      files.push(pattern);
      continue;
    }
    const directory = dirname(pattern);
    if (/[*?]/.test(directory)) throw new Error(`Globs are only supported in the file name: ${pattern}`);
    const matcher = globToRegExp(basename(pattern));
    let entries;
    try {
      entries = await readdir(resolve(directory));
    } catch {
      throw new Error(`Directory not found for pattern: ${pattern}`);
    }
    const matches = entries.filter((entry) => matcher.test(entry)).sort().map((entry) => join(directory, entry));
    if (matches.length === 0) throw new Error(`No files match: ${pattern}`);
    files.push(...matches);
  }
  return [...new Set(files)];
}

function requireNumber(value, path, reportPath) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${reportPath}: missing numeric ${path}`);
  }
  return value;
}

export function normalizeUrl(value) {
  if (typeof value !== "string") return "unknown";
  try {
    const url = new URL(value);
    url.hash = "";
    let path = url.pathname.replace(/\/+$/, "") || "/";
    // Treat index.html and the directory as the same route.
    path = path.replace(/\/index\.html?$/i, "") || "/";
    return `${url.origin}${path}${url.search}`;
  } catch {
    return value;
  }
}

export function extractReport(raw, reportPath) {
  const data = raw && typeof raw === "object" && raw.lighthouseResult && typeof raw.lighthouseResult === "object"
    ? raw.lighthouseResult
    : raw;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${reportPath}: not a Lighthouse report object`);
  }
  if (!data.categories || typeof data.categories !== "object") {
    throw new Error(`${reportPath}: missing categories (is this a Lighthouse JSON report?)`);
  }
  if (data.runtimeError && data.runtimeError.code && data.runtimeError.code !== "NO_ERROR") {
    throw new Error(`${reportPath}: Lighthouse runtime error ${data.runtimeError.code}: ${data.runtimeError.message ?? ""}`.trim());
  }
  if (data.gatherMode && data.gatherMode !== "navigation") {
    throw new Error(`${reportPath}: gatherMode ${data.gatherMode} is not supported; use navigation reports`);
  }
  const category = (name) => requireNumber(data.categories?.[name]?.score, `categories.${name}.score`, reportPath);
  const audit = (name) => requireNumber(data.audits?.[name]?.numericValue, `audits.${name}.numericValue`, reportPath);
  const formFactor = data.configSettings?.formFactor ?? data.configSettings?.emulatedFormFactor ?? "unknown";

  const result = {
    path: reportPath,
    finalUrl: normalizeUrl(data.finalDisplayedUrl ?? data.finalUrl ?? data.requestedUrl),
    formFactor,
    lighthouseVersion: data.lighthouseVersion ?? "unknown",
    fetchTime: data.fetchTime ?? null,
  };
  for (const name of CATEGORIES) result[name] = category(name);
  for (const [key, auditName] of Object.entries(METRIC_AUDITS)) result[key] = audit(auditName);
  return result;
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarizeSet(extracted, label) {
  const urls = [...new Set(extracted.map((report) => report.finalUrl))];
  if (urls.length > 1) {
    throw new Error(`${label} reports contain multiple final URLs; evaluate each route separately: ${urls.join(", ")}`);
  }
  const formFactors = [...new Set(extracted.map((report) => report.formFactor))];
  if (formFactors.length > 1) {
    throw new Error(`${label} reports mix form factors (${formFactors.join(", ")}); evaluate mobile and desktop separately`);
  }
  const versions = [...new Set(extracted.map((report) => report.lighthouseVersion))];
  const medians = Object.fromEntries([...CATEGORIES, ...METRICS].map((key) => [key, median(extracted.map((report) => report[key]))]));
  return { url: urls[0], formFactor: formFactors[0], versions, medians, reportCount: extracted.length };
}

export function evaluate(candidate, thresholds, options = {}, baseline = null) {
  const failures = [];
  const warnings = [];
  const set = summarizeSet(candidate, "candidate");

  if (options.minReports != null && set.reportCount < options.minReports) {
    failures.push(`only ${set.reportCount} report(s) supplied; --min-reports ${options.minReports}`);
  } else if (set.reportCount < 3) {
    warnings.push(`only ${set.reportCount} report(s); a single lab run is noisy, prefer the median of 3`);
  }
  if (set.versions.length > 1) warnings.push(`mixed Lighthouse versions: ${set.versions.join(", ")}`);

  for (const key of CATEGORIES) {
    if (set.medians[key] < thresholds[key]) {
      failures.push(`${key} ${Math.round(set.medians[key] * 100)} < ${Math.round(thresholds[key] * 100)}`);
    }
  }
  for (const key of METRICS) {
    if (set.medians[key] > thresholds[key]) failures.push(`${key} ${set.medians[key]} > ${thresholds[key]}`);
  }

  let comparison = null;
  if (baseline && baseline.length) {
    const base = summarizeSet(baseline, "baseline");
    if (base.formFactor !== set.formFactor) {
      throw new Error(`baseline form factor ${base.formFactor} differs from candidate ${set.formFactor}`);
    }
    const basePath = new URL(base.url).pathname;
    const candidatePath = new URL(set.url).pathname;
    if (basePath !== candidatePath) warnings.push(`baseline path ${basePath} differs from candidate ${candidatePath}`);
    const maxRegression = (options.maxRegression ?? 3) / 100;
    const maxMetric = (options.maxMetricRegression ?? 10) / 100;
    const deltas = {};
    for (const key of CATEGORIES) {
      const delta = set.medians[key] - base.medians[key];
      deltas[key] = delta;
      if (delta < -maxRegression - 1e-9) {
        failures.push(`${key} regressed ${Math.round(base.medians[key] * 100)} → ${Math.round(set.medians[key] * 100)} (allowed drop ${Math.round(maxRegression * 100)})`);
      }
    }
    for (const key of METRICS) {
      const before = base.medians[key];
      const after = set.medians[key];
      deltas[key] = after - before;
      const floor = key === "cls" ? 0.01 : 50; // ignore noise below this absolute change
      if (after > before && after - before > floor && after > before * (1 + maxMetric)) {
        failures.push(`${key} regressed ${before} → ${after} (allowed ${Math.round(maxMetric * 100)}%)`);
      }
    }
    comparison = { baseline: base, deltas, maxRegression: options.maxRegression ?? 3, maxMetricRegression: options.maxMetricRegression ?? 10 };
  }

  return {
    passed: failures.length === 0,
    reportCount: set.reportCount,
    url: set.url,
    formFactor: set.formFactor,
    lighthouseVersions: set.versions,
    thresholds,
    medians: set.medians,
    comparison,
    warnings,
    failures,
    note: "Lab data from Lighthouse; not field Core Web Vitals.",
  };
}

export function format(result) {
  const score = (value) => Math.round(value * 100);
  const metric = (value, digits = 0) => value.toFixed(digits);
  const delta = (key) => {
    if (!result.comparison) return null;
    const value = result.comparison.deltas[key];
    if (CATEGORIES.includes(key)) return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}`;
    const digits = key === "cls" ? 3 : 0;
    return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
  };
  const baseValue = (key) => {
    if (!result.comparison) return null;
    const value = result.comparison.baseline.medians[key];
    if (CATEGORIES.includes(key)) return String(score(value));
    return key === "cls" ? metric(value, 3) : `${metric(value)} ms`;
  };
  const rows = [
    ["Performance", "performance", String(score(result.medians.performance)), `>= ${score(result.thresholds.performance)}`],
    ["Accessibility", "accessibility", String(score(result.medians.accessibility)), `>= ${score(result.thresholds.accessibility)}`],
    ["Best Practices", "best-practices", String(score(result.medians["best-practices"])), `>= ${score(result.thresholds["best-practices"])}`],
    ["SEO", "seo", String(score(result.medians.seo)), `>= ${score(result.thresholds.seo)}`],
    ["LCP", "lcp", `${metric(result.medians.lcp)} ms`, `<= ${result.thresholds.lcp} ms`],
    ["CLS", "cls", metric(result.medians.cls, 3), `<= ${result.thresholds.cls}`],
    ["TBT", "tbt", `${metric(result.medians.tbt)} ms`, `<= ${result.thresholds.tbt} ms`],
  ];
  const lines = [
    `Lighthouse gate: ${result.passed ? "PASS" : "FAIL"} (${result.reportCount} report${result.reportCount === 1 ? "" : "s"}, ${result.formFactor}, Lighthouse ${result.lighthouseVersions.join("/")})`,
    `Route: ${result.url}`,
    "",
  ];
  if (result.comparison) {
    lines.push("| Metric | Baseline | Median | Δ | Gate |", "|---|---:|---:|---:|---:|");
    for (const [name, key, value, gate] of rows) lines.push(`| ${name} | ${baseValue(key)} | ${value} | ${delta(key)} | ${gate} |`);
  } else {
    lines.push("| Metric | Median | Gate |", "|---|---:|---:|");
    for (const [name, , value, gate] of rows) lines.push(`| ${name} | ${value} | ${gate} |`);
  }
  if (result.warnings.length) lines.push("", "Warnings:", ...result.warnings.map((warning) => `- ${warning}`));
  if (result.failures.length) lines.push("", "Failures:", ...result.failures.map((failure) => `- ${failure}`));
  lines.push("", result.note);
  return lines.join("\n");
}

async function loadReports(paths) {
  const extracted = [];
  for (const reportPath of paths) {
    const info = await stat(reportPath).catch(() => null);
    if (!info || !info.isFile()) throw new Error(`${reportPath}: file not found`);
    const raw = await readFile(reportPath, "utf8");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`${reportPath}: invalid JSON`);
    }
    extracted.push(extractReport(parsed, reportPath));
  }
  return extracted;
}

export async function run(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const candidateFiles = await expandPatterns(options.reports);
  const baselineFiles = await expandPatterns(options.baseline);
  const candidate = await loadReports(candidateFiles);
  const baseline = baselineFiles.length ? await loadReports(baselineFiles) : null;
  const result = evaluate(candidate, options.thresholds, options, baseline);
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
