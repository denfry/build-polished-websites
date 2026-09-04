#!/usr/bin/env node
// Browser verification harness: viewport matrix screenshots, console and
// network capture, overflow detection, document facts, keyboard smoke, and an
// optional axe-core audit. Uses Playwright only when it is already available;
// never installs anything.

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_VIEWPORTS = "320x800,375x812,768x1024,1000x800,1440x900";

function usage() {
  return [
    "Usage: node browser-verify.mjs --url <url> [--url <url> ...] [options]",
    "",
    "Options:",
    "  --out <dir>             Output directory (default ./artifacts/browser-verify)",
    `  --viewports <list>      WxH comma list (default ${DEFAULT_VIEWPORTS})`,
    "  --tabs <n>              Tab presses for the keyboard smoke (default 30)",
    "  --axe                   Run axe-core when resolvable",
    "  --tooling-dir <dir>     Directory whose node_modules has playwright/axe-core",
    "                          (also read from BPW_TOOLING_DIR)",
    "  --timeout <ms>          Navigation timeout (default 30000)",
    "  --json                  Print machine-readable results",
    "  --help                  Show this help",
    "",
    "Exit codes: 0 no findings, 1 findings, 2 usage error, 3 tooling unavailable.",
  ].join("\n");
}

export function parseArgs(argv) {
  const options = {
    urls: [],
    out: "./artifacts/browser-verify",
    viewports: DEFAULT_VIEWPORTS,
    tabs: 30,
    axe: false,
    toolingDir: process.env.BPW_TOOLING_DIR ?? null,
    timeout: 30000,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (value === undefined) throw new Error(`Missing value for ${arg}`);
      index += 1;
      return value;
    };
    switch (arg) {
      case "--help":
        options.help = true;
        break;
      case "--url":
        options.urls.push(next());
        break;
      case "--out":
        options.out = next();
        break;
      case "--viewports":
        options.viewports = next();
        break;
      case "--tabs":
        options.tabs = Number(next());
        break;
      case "--timeout":
        options.timeout = Number(next());
        break;
      case "--axe":
        options.axe = true;
        break;
      case "--tooling-dir":
        options.toolingDir = next();
        break;
      case "--json":
        options.json = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.help) return options;
  if (options.urls.length === 0) throw new Error("At least one --url is required");
  for (const url of options.urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error(`Only http(s) URLs are supported (serve the build over HTTP): ${url}`);
    }
  }
  options.viewportList = options.viewports.split(",").map((item) => {
    const match = /^(\d+)x(\d+)$/.exec(item.trim());
    if (!match) throw new Error(`Invalid viewport: ${item}`);
    return { width: Number(match[1]), height: Number(match[2]) };
  });
  if (!Number.isInteger(options.tabs) || options.tabs < 0) throw new Error("--tabs must be a non-negative integer");
  if (!Number.isFinite(options.timeout) || options.timeout <= 0) throw new Error("--timeout must be positive");
  return options;
}

export function resolveTooling(name, toolingDir) {
  const candidates = [process.cwd()];
  if (toolingDir) candidates.push(resolve(toolingDir));
  for (const base of candidates) {
    try {
      const require = createRequire(join(base, "package.json"));
      return require.resolve(name);
    } catch {
      // try the next base
    }
  }
  return null;
}

function toolingInstructions() {
  return [
    "Playwright is not available in this project or tooling directory.",
    "",
    "Options (do not add it to the user's project without permission):",
    "  1. Use an existing Playwright install: --tooling-dir <dir with node_modules/playwright>",
    "  2. Create a scratch directory outside the project:",
    "       mkdir bpw-tooling && cd bpw-tooling && npm init -y && npm i playwright axe-core",
    "       npx playwright install chromium",
    "     then pass --tooling-dir ./bpw-tooling (or set BPW_TOOLING_DIR).",
    "  3. Perform the checks manually in a browser and record them in the scorecard.",
  ].join("\n");
}

function slugForUrl(url) {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const slug = (path === "/" ? "home" : path.replace(/^\//, "").replace(/[^a-z0-9._-]+/gi, "-"))
    .slice(0, 60);
  return parsed.search ? `${slug}${parsed.search.replace(/[^a-z0-9]+/gi, "-").slice(0, 20)}` : slug;
}

const PAGE_FACTS = () => {
  const doc = document;
  const root = doc.documentElement;
  const overflow = root.scrollWidth > window.innerWidth + 1;
  const offenders = [];
  if (overflow) {
    for (const element of doc.body.querySelectorAll("*")) {
      const rect = element.getBoundingClientRect();
      if (rect.right > window.innerWidth + 1 && rect.width > 0) {
        const id = element.id ? `#${element.id}` : "";
        const cls = element.className && typeof element.className === "string"
          ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";
        offenders.push(`${element.tagName.toLowerCase()}${id}${cls} (right=${Math.round(rect.right)})`);
        if (offenders.length >= 5) break;
      }
    }
  }
  const images = [...doc.images];
  return {
    title: doc.title,
    lang: root.getAttribute("lang"),
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
    viewportMeta: doc.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
    h1Count: doc.querySelectorAll("h1").length,
    mainCount: doc.querySelectorAll("main").length,
    landmarks: ["header", "nav", "main", "footer"].filter((tag) => doc.querySelector(tag)),
    imagesWithoutAlt: images.filter((img) => !img.hasAttribute("alt")).length,
    imagesWithoutDimensions: images.filter((img) => !(img.getAttribute("width") && img.getAttribute("height")) && getComputedStyle(img).aspectRatio === "auto").length,
    horizontalOverflow: overflow,
    overflowOffenders: offenders,
    scrollWidth: root.scrollWidth,
    innerWidth: window.innerWidth,
  };
};

const FOCUS_INFO = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: "body", name: "", visible: false, selector: "body" };
  const style = getComputedStyle(el);
  const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
  const shadow = style.boxShadow && style.boxShadow !== "none";
  const name = el.getAttribute("aria-label") || el.getAttribute("alt") || el.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || el.getAttribute("title") || "";
  const rect = el.getBoundingClientRect();
  const id = el.id ? `#${el.id}` : "";
  return {
    tag: el.tagName.toLowerCase(),
    name,
    selector: `${el.tagName.toLowerCase()}${id}`,
    visible: outline || shadow,
    inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
    hidden: rect.width === 0 && rect.height === 0,
  };
};

async function verifyRoute(browser, url, options, axePath) {
  const slug = slugForUrl(url);
  const routeDir = join(options.out, slug);
  await mkdir(routeDir, { recursive: true });
  const route = { url, slug, viewports: [], keyboard: null, axe: null, findings: [] };

  for (const viewport of options.viewportList) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
    });
    page.on("pageerror", (error) => pageErrors.push(String(error.message ?? error).slice(0, 300)));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? "failed"})`));
    page.on("response", (response) => {
      if (response.status() >= 400) failedRequests.push(`${response.url()} (${response.status()})`);
    });

    const entry = { width: viewport.width, height: viewport.height, screenshot: null, facts: null, consoleErrors, pageErrors, failedRequests, error: null };
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: options.timeout });
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      entry.facts = await page.evaluate(PAGE_FACTS);
      const screenshot = join(routeDir, `${viewport.width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
      entry.screenshot = screenshot;
      if (viewport === options.viewportList[0]) {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.reload({ waitUntil: "networkidle", timeout: options.timeout });
        const reduced = join(routeDir, `${viewport.width}-reduced-motion.png`);
        await page.screenshot({ path: reduced, fullPage: true, animations: "disabled" });
        entry.reducedMotionScreenshot = reduced;
      }
    } catch (error) {
      entry.error = String(error.message ?? error).slice(0, 300);
    }
    route.viewports.push(entry);
    await context.close();
  }

  // Keyboard smoke at the widest viewport.
  const widest = options.viewportList.reduce((a, b) => (b.width > a.width ? b : a));
  const context = await browser.newContext({ viewport: widest });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: options.timeout });
    const stops = [];
    let repeats = 0;
    let previous = null;
    for (let index = 0; index < options.tabs; index += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(FOCUS_INFO);
      stops.push(info);
      const key = `${info.selector}|${info.name}`;
      if (key === previous) repeats += 1;
      else repeats = 0;
      previous = key;
      if (repeats >= 2) break;
      if (info.tag === "body" && index > 0) break;
    }
    const focusable = stops.filter((stop) => stop.tag !== "body");
    route.keyboard = {
      viewport: widest,
      stops,
      reachable: focusable.length,
      withoutVisibleFocus: focusable.filter((stop) => !stop.visible).length,
      offscreenStops: focusable.filter((stop) => stop.hidden).length,
      possibleTrap: repeats >= 2,
      firstStopIsSkipLink: /skip/i.test(focusable[0]?.name ?? ""),
    };
  } catch (error) {
    route.keyboard = { error: String(error.message ?? error).slice(0, 300) };
  }

  if (options.axe) {
    if (!axePath) {
      route.axe = { skipped: "axe-core not resolvable" };
    } else {
      try {
        await page.addScriptTag({ path: axePath });
        const results = await page.evaluate(async () => {
          // eslint-disable-next-line no-undef
          const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
          return {
            version: result.testEngine?.version,
            violations: result.violations.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              help: violation.help,
              nodes: violation.nodes.length,
              firstTarget: violation.nodes[0]?.target?.join(" ") ?? null,
            })),
            incomplete: result.incomplete.length,
          };
        });
        route.axe = results;
      } catch (error) {
        route.axe = { error: String(error.message ?? error).slice(0, 300) };
      }
    }
  }
  await context.close();

  // Findings
  for (const entry of route.viewports) {
    const label = `${entry.width}px`;
    if (entry.error) route.findings.push(`${label}: navigation failed: ${entry.error}`);
    if (entry.facts?.horizontalOverflow) route.findings.push(`${label}: horizontal overflow (${entry.facts.scrollWidth} > ${entry.facts.innerWidth}): ${entry.facts.overflowOffenders.join("; ")}`);
    if (entry.consoleErrors.length) route.findings.push(`${label}: ${entry.consoleErrors.length} console error(s): ${entry.consoleErrors[0]}`);
    if (entry.pageErrors.length) route.findings.push(`${label}: ${entry.pageErrors.length} uncaught exception(s): ${entry.pageErrors[0]}`);
    if (entry.failedRequests.length) route.findings.push(`${label}: ${entry.failedRequests.length} failed request(s): ${entry.failedRequests[0]}`);
  }
  const facts = route.viewports.find((entry) => entry.facts)?.facts;
  if (facts) {
    if (facts.h1Count !== 1) route.findings.push(`h1 count is ${facts.h1Count}`);
    if (facts.mainCount !== 1) route.findings.push(`main count is ${facts.mainCount}`);
    if (!facts.lang) route.findings.push("missing lang attribute");
    if (!facts.title) route.findings.push("missing title");
    if (!facts.description) route.findings.push("missing meta description");
    if (!facts.viewportMeta) route.findings.push("missing viewport meta");
    if (facts.imagesWithoutAlt) route.findings.push(`${facts.imagesWithoutAlt} image(s) without alt attribute`);
    if (facts.imagesWithoutDimensions) route.findings.push(`${facts.imagesWithoutDimensions} image(s) without intrinsic dimensions or aspect-ratio`);
  }
  if (route.keyboard && !route.keyboard.error) {
    if (route.keyboard.reachable === 0) route.findings.push("keyboard: no focusable element reached");
    if (route.keyboard.withoutVisibleFocus) route.findings.push(`keyboard: ${route.keyboard.withoutVisibleFocus} stop(s) without a detectable focus indicator (verify by eye)`);
    if (route.keyboard.possibleTrap) route.findings.push("keyboard: possible focus trap (same element focused repeatedly)");
    if (route.keyboard.offscreenStops) route.findings.push(`keyboard: ${route.keyboard.offscreenStops} stop(s) on zero-size elements`);
  }
  if (route.axe?.violations?.length) {
    for (const violation of route.axe.violations) {
      route.findings.push(`axe ${violation.impact ?? "n/a"}: ${violation.id} (${violation.nodes} node(s)) ${violation.help}`);
    }
  }
  return route;
}

export function summarize(results) {
  const lines = [`# Browser verification`, "", `Generated: ${results.generatedAt}`, `Playwright: ${results.playwrightVersion ?? "unknown"} · axe-core: ${results.axeVersion ?? "not run"}`, ""];
  for (const route of results.routes) {
    lines.push(`## ${route.url}`, "");
    lines.push("| Width | Overflow | Console errors | Failed requests | Screenshot |", "|---|---|---:|---:|---|");
    for (const entry of route.viewports) {
      lines.push(`| ${entry.width} | ${entry.error ? "error" : entry.facts?.horizontalOverflow ? "yes" : "no"} | ${entry.consoleErrors.length + entry.pageErrors.length} | ${entry.failedRequests.length} | ${entry.screenshot ?? "-"} |`);
    }
    const facts = route.viewports.find((entry) => entry.facts)?.facts;
    if (facts) {
      lines.push("", `Title: ${facts.title || "(none)"} · lang: ${facts.lang || "(none)"} · h1: ${facts.h1Count} · main: ${facts.mainCount} · landmarks: ${facts.landmarks.join(", ") || "none"}`);
    }
    if (route.keyboard && !route.keyboard.error) {
      lines.push("", `Keyboard (${route.keyboard.viewport.width}px): ${route.keyboard.reachable} stops · ${route.keyboard.withoutVisibleFocus} without detectable focus indicator · first stop is skip link: ${route.keyboard.firstStopIsSkipLink ? "yes" : "no"} · possible trap: ${route.keyboard.possibleTrap ? "yes" : "no"}`);
    }
    if (route.axe) {
      if (route.axe.violations) lines.push("", `axe-core ${route.axe.version}: ${route.axe.violations.length} violation(s), ${route.axe.incomplete} incomplete`);
      else lines.push("", `axe-core: ${route.axe.skipped ?? route.axe.error}`);
    }
    lines.push("", route.findings.length ? "Findings:" : "Findings: none", ...route.findings.map((finding) => `- ${finding}`), "");
  }
  lines.push("These are observations, not a verdict. Review the screenshots by eye; the harness cannot judge composition.");
  return lines.join("\n");
}

export async function run(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const playwrightPath = resolveTooling("playwright", options.toolingDir);
  if (!playwrightPath) {
    process.stderr.write(`${toolingInstructions()}\n`);
    return 3;
  }
  const axePath = options.axe ? resolveTooling("axe-core/axe.min.js", options.toolingDir) : null;
  const playwright = await import(pathToFileURL(playwrightPath).href);
  const { chromium } = playwright.default ?? playwright;
  let playwrightVersion = null;
  try {
    const require = createRequire(playwrightPath);
    playwrightVersion = require("playwright/package.json").version;
  } catch {
    // version is informational
  }

  await mkdir(options.out, { recursive: true });
  const browser = await chromium.launch();
  const results = { generatedAt: new Date().toISOString(), playwrightVersion, axeVersion: null, options: { viewports: options.viewportList, tabs: options.tabs, axe: options.axe }, routes: [] };
  try {
    for (const url of options.urls) {
      const route = await verifyRoute(browser, url, options, axePath);
      if (route.axe?.version) results.axeVersion = route.axe.version;
      results.routes.push(route);
    }
  } finally {
    await browser.close();
  }
  const summary = summarize(results);
  await writeFile(join(options.out, "results.json"), JSON.stringify(results, null, 2));
  await writeFile(join(options.out, "summary.md"), summary);
  process.stdout.write(options.json ? `${JSON.stringify(results, null, 2)}\n` : `${summary}\n`);
  return results.routes.some((route) => route.findings.length > 0) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`browser-verify error: ${error.message}\n\n${usage()}\n`);
      process.exitCode = 2;
    });
}
