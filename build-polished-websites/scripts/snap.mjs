#!/usr/bin/env node

// Dependency-free responsive screenshots and browser hygiene checks through the
// Chrome DevTools Protocol. Requires Node 22+ and a local Chrome, Chromium, or
// Edge (set CHROME_PATH to override discovery).
//
// Usage:
//   node snap.mjs <url-or-file>... [--out <dir>] [--widths 375,768,1100,1440]
//                 [--gray] [--dark] [--reduced-motion] [--wait <ms>]
//
// For every page and width it writes the first screen (<name>-<w>.png), the
// full page (<name>-<w>-full.png), and a legible contact sheet of the full page
// cut into screen-sized slices (<name>-<w>-sheet.png). It prints overflow,
// console errors, failed requests, loaded fonts, and basic document checks.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const HEIGHTS = { 320: 640, 375: 812, 390: 844, 768: 1024, 1024: 768, 1100: 800, 1280: 800, 1440: 900, 1920: 1080 };
const MAX_FULL_HEIGHT = 16000;
const MAX_SLICES = 24;

function usage() {
  return "Usage: node snap.mjs <url-or-file>... [--out <dir>] [--widths 375,768,1100,1440] [--gray] [--dark] [--reduced-motion] [--wait <ms>]";
}

function parseArgs(argv) {
  const options = { targets: [], widths: [375, 768, 1100, 1440], wait: 700, gray: false, dark: false, reducedMotion: false, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${value} needs a value`);
      return argv[index];
    };
    if (value === "--out") options.out = next();
    else if (value === "--widths") options.widths = next().split(",").map((item) => Number(item.trim())).filter((item) => item >= 240);
    else if (value === "--wait") options.wait = Number(next());
    else if (value === "--gray") options.gray = true;
    else if (value === "--dark") options.dark = true;
    else if (value === "--reduced-motion") options.reducedMotion = true;
    else if (value === "-h" || value === "--help") options.help = true;
    else options.targets.push(value);
  }
  if (options.widths.length === 0) throw new Error("--widths produced no usable widths");
  return options;
}

function findBrowser() {
  const env = process.env;
  const candidates = [env.CHROME_PATH];
  if (process.platform === "win32") {
    for (const root of [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA]) {
      if (!root) continue;
      candidates.push(join(root, "Google", "Chrome", "Application", "chrome.exe"));
      candidates.push(join(root, "Chromium", "Application", "chrome.exe"));
      candidates.push(join(root, "Microsoft", "Edge", "Application", "msedge.exe"));
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
      "/usr/bin/chromium-browser", "/snap/bin/chromium", "/usr/bin/microsoft-edge",
    );
  }
  return candidates.find((path) => path && existsSync(path));
}

function toUrl(target) {
  if (/^(https?|file):/i.test(target)) return target;
  const path = resolve(target);
  if (!existsSync(path)) throw new Error(`not a URL or existing file: ${target}`);
  return pathToFileURL(path).href;
}

function nameFor(url) {
  const parsed = new URL(url);
  const raw = parsed.protocol === "file:" ? basename(decodeURIComponent(parsed.pathname), extname(parsed.pathname)) : `${parsed.host}${parsed.pathname}`;
  return raw.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "page";
}

const delay = (ms) => new Promise((done) => setTimeout(done, ms));

async function launch(browserPath) {
  const profile = await mkdtemp(join(tmpdir(), "snap-profile-"));
  const args = [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-extensions",
    "--disable-background-networking", "--force-color-profile=srgb", "about:blank",
  ];
  if (process.platform === "linux" && process.getuid?.() === 0) args.unshift("--no-sandbox");
  const child = spawn(browserPath, args, { stdio: "ignore" });
  let exited = false;
  child.on("exit", () => { exited = true; });
  const portFile = join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (exited) throw new Error("browser exited during startup");
    if (existsSync(portFile)) {
      const [port, path] = (await readFile(portFile, "utf8")).split(/\r?\n/);
      if (port && path) return { child, profile, endpoint: `ws://127.0.0.1:${port}${path}` };
    }
    await delay(100);
  }
  child.kill();
  throw new Error("browser did not expose a DevTools endpoint within 15 s");
}

class Connection {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: done, reject, method } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else done(message.result);
      } else if (message.method) {
        for (const listener of this.listeners) listener(message);
      }
    });
  }

  static async open(endpoint) {
    const socket = new WebSocket(endpoint);
    await new Promise((done, reject) => {
      socket.addEventListener("open", done, { once: true });
      socket.addEventListener("error", () => reject(new Error("could not connect to DevTools")), { once: true });
    });
    return new Connection(socket);
  }

  send(method, params = {}, sessionId, timeout = 30000) {
    const id = ++this.sequence;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.socket.send(JSON.stringify(payload));
    return new Promise((done, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, timeout);
      this.pending.set(id, {
        method,
        resolve: (value) => { clearTimeout(timer); done(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
    });
  }

  waitFor(method, sessionId, timeout) {
    return new Promise((done) => {
      const timer = setTimeout(() => { this.listeners.delete(listener); done(false); }, timeout);
      const listener = (message) => {
        if (message.method === method && message.sessionId === sessionId) {
          clearTimeout(timer);
          this.listeners.delete(listener);
          done(true);
        }
      };
      this.listeners.add(listener);
    });
  }
}

const AUDIT = `(() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  const describe = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const clipped = (el) => {
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow !== 'visible') return true;
    }
    return false;
  };
  for (const el of [...document.body.querySelectorAll('*')].slice(0, 4000)) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if ((rect.right > vw + 1 || rect.left < -1) && !clipped(el)) offenders.push(describe(el) + ' (' + Math.round(rect.left) + '..' + Math.round(rect.right) + ')');
    if (offenders.length >= 6) break;
  }
  const visuallyHidden = (el, rect) => rect.width <= 2 || rect.height <= 2 || getComputedStyle(el).opacity === '0';
  const small = [...document.querySelectorAll('a[href], button, input, select, textarea, [role=button]')].filter((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || visuallyHidden(el, rect)) return false;
    if (el.labels && [...el.labels].some((label) => { const r = label.getBoundingClientRect(); return r.width >= 24 && r.height >= 24; })) return false;
    return (rect.height < 24 || rect.width < 24) && getComputedStyle(el).display !== 'inline';
  }).map((el) => { const r = el.getBoundingClientRect(); return describe(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
  const fonts = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))];
  return {
    title: document.title,
    lang: document.documentElement.lang || null,
    viewportMeta: Boolean(document.querySelector('meta[name=viewport]')),
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
    imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
    smallTapTargets: small.length,
    smallTapTargetList: small.slice(0, 6),
    overflowX: Math.max(0, document.documentElement.scrollWidth - vw),
    overflowOffenders: offenders,
    loadedFonts: fonts,
    pageHeight: document.documentElement.scrollHeight,
  };
})()`;

async function capture(connection, sessionId, params) {
  const { data } = await connection.send("Page.captureScreenshot", { format: "png", ...params }, sessionId, 60000);
  return Buffer.from(data, "base64");
}

async function contactSheet(connection, sessionId, png, width, height, sliceHeight) {
  const slices = Math.min(MAX_SLICES, Math.ceil(height / sliceHeight));
  const columns = width < 600 ? 6 : width < 1000 ? 3 : 2;
  const gap = 16;
  const sheetWidth = columns * width + (columns + 1) * gap;
  const figures = Array.from({ length: slices }, (_, index) =>
    `<figure><div class="s" style="background-position:0 -${index * sliceHeight}px"></div><figcaption>${index + 1}/${slices} · y ${index * sliceHeight}</figcaption></figure>`).join("");
  const source = `data:image/png;base64,${png.toString("base64")}`;
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;background:#202124;color:#e8eaed;font:600 13px/1.2 system-ui,sans-serif}
    body{display:flex;flex-wrap:wrap;gap:${gap}px;padding:${gap}px;width:${sheetWidth - 2 * gap}px}
    figure{margin:0}.s{width:${width}px;height:${sliceHeight}px;background:#fff url("${source}") no-repeat;outline:1px solid #5f6368}
    figcaption{padding:6px 0 0}#src{display:none}</style><img id="src" alt="" src="${source}">${figures}`;
  await connection.send("Emulation.setDeviceMetricsOverride", { width: sheetWidth, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  const { frameTree } = await connection.send("Page.getFrameTree", {}, sessionId);
  await connection.send("Page.setDocumentContent", { frameId: frameTree.frame.id, html }, sessionId);
  await connection.send("Runtime.evaluate", { expression: "document.getElementById('src').decode().then(() => new Promise(r => setTimeout(r, 150)))", awaitPromise: true }, sessionId);
  const { cssContentSize } = await connection.send("Page.getLayoutMetrics", {}, sessionId);
  return capture(connection, sessionId, {
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: sheetWidth, height: Math.ceil(cssContentSize.height), scale: 1 },
  });
}

async function snapPage(connection, url, options, outDir) {
  const { targetId } = await connection.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await connection.send("Target.attachToTarget", { targetId, flatten: true });
  const problems = { console: new Set(), requests: new Set() };
  const listener = (message) => {
    if (message.sessionId !== sessionId) return;
    const { method, params } = message;
    if (method === "Runtime.exceptionThrown") problems.console.add(params.exceptionDetails.exception?.description?.split("\n")[0] ?? params.exceptionDetails.text);
    if (method === "Runtime.consoleAPICalled" && (params.type === "error" || params.type === "assert")) {
      problems.console.add(params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ").slice(0, 200));
    }
    if (method === "Log.entryAdded" && params.entry.level === "error") problems.console.add(`${params.entry.text} ${params.entry.url ?? ""}`.trim().slice(0, 200));
    if (method === "Network.responseReceived" && params.response.status >= 400) problems.requests.add(`${params.response.status} ${params.response.url}`);
    if (method === "Network.loadingFailed" && !params.canceled) problems.requests.add(`${params.errorText} (${params.type})`);
  };
  connection.listeners.add(listener);
  for (const domain of ["Page", "Runtime", "Log", "Network"]) await connection.send(`${domain}.enable`, {}, sessionId);
  const features = [];
  if (options.dark) features.push({ name: "prefers-color-scheme", value: "dark" });
  if (options.reducedMotion) features.push({ name: "prefers-reduced-motion", value: "reduce" });
  if (features.length > 0) await connection.send("Emulation.setEmulatedMedia", { features }, sessionId);

  const name = options.names.get(url);
  const results = [];
  for (const width of options.widths) {
    const height = HEIGHTS[width] ?? (width < 600 ? 812 : width < 1000 ? 1024 : 900);
    await connection.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 }, sessionId);
    await connection.send("Emulation.setTouchEmulationEnabled", { enabled: width < 600 }, sessionId);
    const loaded = connection.waitFor("Page.loadEventFired", sessionId, 30000);
    await connection.send("Page.navigate", { url }, sessionId);
    if (!(await loaded)) problems.console.add(`load event did not fire within 30 s at ${width}px`);
    await connection.send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true }, sessionId);
    await delay(options.wait);

    const first = join(outDir, `${name}-${width}.png`);
    await writeFile(first, await capture(connection, sessionId, {}));

    await connection.send("Runtime.evaluate", {
      expression: `(async () => { const step = innerHeight * 0.8; for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, ${options.wait})); })()`,
      awaitPromise: true,
    }, sessionId, 120000);
    const { result } = await connection.send("Runtime.evaluate", { expression: AUDIT, returnByValue: true }, sessionId);
    const audit = result.value;
    const fullHeight = Math.min(MAX_FULL_HEIGHT, audit.pageHeight);
    const fullPng = await capture(connection, sessionId, { captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: fullHeight, scale: 1 } });
    const full = join(outDir, `${name}-${width}-full.png`);
    await writeFile(full, fullPng);

    let gray = null;
    if (options.gray) {
      await connection.send("Runtime.evaluate", { expression: "document.documentElement.style.filter = 'grayscale(1)'" }, sessionId);
      gray = join(outDir, `${name}-${width}-gray.png`);
      await writeFile(gray, await capture(connection, sessionId, {}));
    }

    const sheet = join(outDir, `${name}-${width}-sheet.png`);
    await writeFile(sheet, await contactSheet(connection, sessionId, fullPng, width, fullHeight, height));
    results.push({ width, height, files: { first, full, sheet, gray }, ...audit, truncated: audit.pageHeight > MAX_FULL_HEIGHT });
  }
  connection.listeners.delete(listener);
  await connection.send("Target.closeTarget", { targetId });
  return { url, name, results, consoleErrors: [...problems.console], failedRequests: [...problems.requests] };
}

function formatReport(report) {
  const lines = [`\n${report.url}`];
  const firstResult = report.results[0];
  lines.push(`  title: ${firstResult.title || "(missing)"} | lang: ${firstResult.lang ?? "(missing)"} | viewport meta: ${firstResult.viewportMeta ? "yes" : "NO"} | h1: ${firstResult.h1} | main: ${firstResult.main} | img without alt: ${firstResult.imagesWithoutAlt}`);
  lines.push(`  fonts loaded: ${firstResult.loadedFonts.join(", ") || "(none: system fallback only)"}`);
  for (const result of report.results) {
    const overflow = result.overflowX > 0 ? `OVERFLOW ${result.overflowX}px ${result.overflowOffenders.join(", ")}` : "no horizontal overflow";
    lines.push(`  ${result.width}x${result.height}: page ${result.pageHeight}px tall${result.truncated ? " (capture truncated)" : ""}, ${overflow}, small tap targets: ${result.smallTapTargets}${result.smallTapTargets ? ` (${result.smallTapTargetList.join(", ")})` : ""}`);
    lines.push(`    first screen ${result.files.first}`);
    lines.push(`    sheet        ${result.files.sheet}`);
    if (result.files.gray) lines.push(`    grayscale    ${result.files.gray}`);
  }
  lines.push(`  console errors: ${report.consoleErrors.length === 0 ? "none" : ""}`);
  for (const item of report.consoleErrors) lines.push(`    - ${item}`);
  lines.push(`  failed requests: ${report.failedRequests.length === 0 ? "none" : ""}`);
  for (const item of report.failedRequests) lines.push(`    - ${item}`);
  return lines.join("\n");
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }
  if (options.help || options.targets.length === 0) {
    process.stdout.write(`${usage()}\n`);
    process.exitCode = options.help ? 0 : 2;
    return;
  }
  if (typeof WebSocket !== "function") {
    process.stderr.write("snap: Node 22 or newer is required (global WebSocket).\n");
    process.exitCode = 2;
    return;
  }
  const browserPath = findBrowser();
  if (!browserPath) {
    process.stderr.write("snap: no Chrome, Chromium, or Edge found. Set CHROME_PATH.\n");
    process.exitCode = 2;
    return;
  }
  const outDir = resolve(options.out ?? join(tmpdir(), "website-snaps", new Date().toISOString().replace(/[:.]/g, "-")));
  await mkdir(outDir, { recursive: true });

  let browser;
  let connection;
  let failed = false;
  try {
    const urls = options.targets.map(toUrl);
    options.names = new Map();
    const used = new Map();
    for (const url of urls) {
      const base = nameFor(url);
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);
      options.names.set(url, count === 1 ? base : `${base}-${count}`);
    }
    browser = await launch(browserPath);
    connection = await Connection.open(browser.endpoint);
    const reports = [];
    for (const url of urls) {
      const report = await snapPage(connection, url, options, outDir);
      reports.push(report);
      process.stdout.write(`${formatReport(report)}\n`);
    }
    await writeFile(join(outDir, "snap-report.json"), `${JSON.stringify(reports, null, 2)}\n`);
    process.stdout.write(`\nScreenshots and snap-report.json: ${outDir}\nOpen each *-sheet.png and *-<width>.png and review them before calling the design done.\n`);
  } catch (error) {
    failed = true;
    process.stderr.write(`snap: ${error.message}\n`);
  } finally {
    try { await connection?.send("Browser.close", {}, undefined, 5000); } catch { /* browser already gone */ }
    if (browser) {
      await Promise.race([new Promise((done) => browser.child.once("exit", done)), delay(5000)]);
      if (browser.child.exitCode === null) browser.child.kill();
      await rm(browser.profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
    }
    connection?.socket.close();
  }
  if (failed) process.exitCode = 1;
}

await main();
