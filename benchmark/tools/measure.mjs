#!/usr/bin/env node
// Measures one benchmark output directory: serves it over HTTP, runs the
// browser-verify harness (viewport matrix, console, network, keyboard, axe) and
// Lighthouse three times (mobile), then evaluates the gate. Writes
// measurements.json, browser-verify/, lighthouse/ and screenshots/ next to the
// output.
//
//   BPW_TOOLING_DIR=<dir with playwright, axe-core, lighthouse> \
//   node benchmark/tools/measure.mjs benchmark/editorial/with-skill [--entry index.html] [--routes article.html]

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const [target, ...rest] = process.argv.slice(2);
if (!target) {
  console.error("Usage: measure.mjs <output-dir> [--entry index.html] [--routes a.html,b.html] [--runs 3]");
  process.exit(2);
}
const flags = Object.fromEntries(rest.map((arg, index, all) => (arg.startsWith("--") ? [arg.slice(2), all[index + 1]] : [])).filter((pair) => pair.length));
const dir = resolve(target);
const toolingDir = process.env.BPW_TOOLING_DIR;
if (!toolingDir) {
  console.error("Set BPW_TOOLING_DIR to a directory whose node_modules contains playwright, axe-core and lighthouse.");
  process.exit(3);
}
const runs = Number(flags.runs ?? 3);
const entry = flags.entry ?? (await pickEntry());
const routes = [entry, ...(flags.routes ? flags.routes.split(",") : [])];

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  const file = join(dir, path === "/" ? entry : path);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not file");
    response.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end("not found");
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const measurements = { target: target.replace(/\\/g, "/"), measuredAt: new Date().toISOString(), entry, routes: {}, tooling: {} };
try {
  // Browser verification
  const verifyOut = join(dir, "browser-verify");
  await rm(verifyOut, { recursive: true, force: true });
  const verifyArgs = [join(root, "build-polished-websites", "scripts", "browser-verify.mjs"), ...routes.flatMap((route) => ["--url", `${base}/${route}`]), "--out", verifyOut, "--axe", "--tabs", "40", "--json"];
  const verify = spawnSync(process.execPath, verifyArgs, { encoding: "utf8", env: { ...process.env, BPW_TOOLING_DIR: toolingDir }, maxBuffer: 64 * 1024 * 1024 });
  let verifyJson = null;
  try {
    verifyJson = JSON.parse(verify.stdout);
  } catch {
    measurements.browserVerifyError = (verify.stderr || verify.stdout).slice(-1000);
  }
  measurements.tooling.playwright = verifyJson?.playwrightVersion ?? null;
  measurements.tooling.axe = verifyJson?.axeVersion ?? null;

  // Lighthouse
  const lighthouseBin = join(toolingDir, "node_modules", "lighthouse", "cli", "index.js");
  const lhDir = join(dir, "lighthouse");
  await rm(lhDir, { recursive: true, force: true });
  await mkdir(lhDir, { recursive: true });
  for (const route of routes) {
    const slug = route.replace(/[^a-z0-9]+/gi, "-").replace(/-html$/, "");
    const reports = [];
    for (let run = 1; run <= runs; run += 1) {
      const output = join(lhDir, `${slug}-${run}.json`);
      const result = spawnSync(process.execPath, [lighthouseBin, `${base}/${route}`, "--output=json", `--output-path=${output}`, "--chrome-flags=--headless=new --no-sandbox", "--quiet", "--only-categories=performance,accessibility,best-practices,seo"], { encoding: "utf8", env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? "" } });
      if (result.status !== 0) measurements.lighthouseError = (result.stderr || "").slice(-1000);
      reports.push(output);
    }
    const gate = spawnSync(process.execPath, [join(root, "build-polished-websites", "scripts", "lighthouse-gate.mjs"), ...reports, "--json"], { encoding: "utf8" });
    let gateJson = null;
    try {
      gateJson = JSON.parse(gate.stdout);
    } catch {
      gateJson = { error: (gate.stderr || gate.stdout).slice(-800) };
    }
    const routeVerify = verifyJson?.routes?.find((item) => item.url.endsWith(`/${route}`)) ?? null;
    measurements.routes[route] = {
      lighthouse: gateJson,
      browser: routeVerify
        ? {
            findings: routeVerify.findings,
            overflowWidths: routeVerify.viewports.filter((viewport) => viewport.facts?.horizontalOverflow).map((viewport) => viewport.width),
            consoleErrors: routeVerify.viewports.reduce((sum, viewport) => sum + viewport.consoleErrors.length + viewport.pageErrors.length, 0),
            failedRequests: routeVerify.viewports.reduce((sum, viewport) => sum + viewport.failedRequests.length, 0),
            keyboard: routeVerify.keyboard,
            axeViolations: routeVerify.axe?.violations ?? null,
            facts: routeVerify.viewports.find((viewport) => viewport.facts)?.facts ?? null,
          }
        : null,
    };
    // Promote key screenshots for the comparison table.
    const shots = join(dir, "screenshots");
    await mkdir(shots, { recursive: true });
    for (const width of [375, 1440]) {
      const source = routeVerify?.viewports.find((viewport) => viewport.width === width)?.screenshot;
      if (source) await copyFile(source, join(shots, `${slug}-${width}.png`)).catch(() => {});
    }
    measurements.tooling.lighthouse = gateJson?.lighthouseVersions?.join("/") ?? null;
  }
  // Size
  const files = await readdir(dir);
  measurements.bytes = 0;
  for (const file of files) {
    if (/\.(html?|css|m?js|svg)$/i.test(file)) measurements.bytes += (await stat(join(dir, file))).size;
  }
  // Keep only summary + screenshots from browser-verify (raw png matrix is large); keep results.json.
  for (const routeDir of await readdir(verifyOut, { withFileTypes: true })) {
    if (routeDir.isDirectory()) await rm(join(verifyOut, routeDir.name), { recursive: true, force: true });
  }
  await writeFile(join(dir, "measurements.json"), JSON.stringify(measurements, null, 2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(measurements.routes).map(([route, data]) => [route, { gate: data.lighthouse?.passed, medians: data.lighthouse?.medians, findings: data.browser?.findings?.length, axe: data.browser?.axeViolations?.length }])), null, 2));
} finally {
  server.close();
}

async function pickEntry() {
  const files = await readdir(dir);
  if (files.includes("index.html")) return "index.html";
  const html = files.filter((file) => /\.html?$/i.test(file)).sort();
  if (!html.length) {
    console.error(`No HTML deliverable in ${dir}`);
    process.exit(1);
  }
  return html[0];
}
