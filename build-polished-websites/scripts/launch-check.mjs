#!/usr/bin/env node

// Checks built HTML for launch essentials: metadata, sharing, icons,
// structured data, crawl files, accessibility basics, links, and forms.
// Failures block launch; warnings need a fix or a stated reason.
//
// Usage:
//   node launch-check.mjs <build-dir-or-html>... [--base-url <https://host>] [--json]

import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import process from "node:process";

const SKIPPED_DIRS = new Set(["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".astro", ".cache"]);

function usage() {
  return "Usage: node launch-check.mjs <build-dir-or-html>... [--base-url <https://host>] [--json]";
}

function parseArgs(argv) {
  const options = { paths: [], baseUrl: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") options.json = true;
    else if (value === "--base-url") {
      options.baseUrl = argv[index + 1];
      index += 1;
      if (!options.baseUrl) throw new Error("--base-url needs a value");
      new URL(options.baseUrl);
    } else if (value === "-h" || value === "--help") options.help = true;
    else options.paths.push(value);
  }
  return options;
}

async function collect(path, files) {
  const info = await stat(path);
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIPPED_DIRS.has(entry.name)) continue;
      await collect(join(path, entry.name), files);
    }
  } else if (/\.html?$/i.test(path)) files.push(path);
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>"'/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const name = match[1].toLowerCase();
    if (name.startsWith("<")) continue;
    result[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({ raw: match[0], index: match.index, attrs: attributes(match[0].slice(name.length + 1)) }));
}

const text = (value) => value.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
const isAbsoluteHttps = (value) => /^https:\/\/[^/]+/i.test(value ?? "");

export function checkPage(html, file) {
  const issues = [];
  const add = (level, id, message) => issues.push({ level, id, message, file });
  const head = html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? html;
  const metas = tags(head, "meta");
  const links = tags(head, "link");
  const meta = (key, value) => metas.find((tag) => (tag.attrs[key] ?? "").toLowerCase() === value)?.attrs.content;
  const link = (rel) => links.find((tag) => (tag.attrs.rel ?? "").toLowerCase().split(/\s+/).includes(rel));

  if (!/^\s*(?:<!--[\s\S]*?-->\s*)*<!doctype html>/i.test(html)) add("fail", "doctype", "missing <!doctype html>");
  const htmlTag = tags(html, "html")[0];
  if (!htmlTag?.attrs.lang) add("fail", "lang", "<html> has no lang attribute");
  if (!metas.some((tag) => "charset" in tag.attrs)) add("fail", "charset", "missing <meta charset>");
  if (!meta("name", "viewport")) add("fail", "viewport", "missing viewport meta");

  const robots = (meta("name", "robots") ?? "").toLowerCase();
  const noindex = robots.includes("noindex");
  const utility = /(^|[\\/])(404|500|offline|thank[-_]?you|thanks|success|confirm\w*|search|cart|checkout|account|login)(\.html?|[\\/]index\.html?)$/i.test(file);
  if (noindex && !utility) add("warn", "noindex", "page is noindex: confirm this is intentional before launch");
  if (!noindex && utility && !/(^|[\\/])404/.test(file)) add("info", "utility-indexed", "utility page is indexable; consider noindex,follow");

  const title = text(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (!title) add("fail", "title", "missing <title>");
  else if (title.length < 15 || title.length > 70) add("warn", "title-length", `title is ${title.length} characters (aim for about 30-65): "${title}"`);

  const description = meta("name", "description");
  if (!description) add(noindex ? "warn" : "fail", "description", "missing meta description");
  else if (description.length < 50 || description.length > 170) add("warn", "description-length", `description is ${description.length} characters (aim for about 120-160)`);

  const canonical = link("canonical")?.attrs.href;
  if (!canonical) {
    if (!noindex) add("warn", "canonical", "missing canonical link");
  } else if (!isAbsoluteHttps(canonical)) add("fail", "canonical-absolute", `canonical is not an absolute https URL: ${canonical}`);

  if (!noindex) {
    for (const property of ["og:title", "og:description", "og:image", "og:url"]) {
      if (!meta("property", property)) add("warn", "open-graph", `missing ${property}`);
    }
    if (!meta("name", "twitter:card")) add("warn", "twitter-card", "missing twitter:card (summary_large_image)");
  }
  const ogImage = meta("property", "og:image");
  if (ogImage && !isAbsoluteHttps(ogImage)) add("fail", "og-image-absolute", `og:image must be an absolute https URL for link previews: ${ogImage}`);
  if (!link("icon")) add("fail", "favicon", "missing <link rel=icon>");
  if (!link("apple-touch-icon")) add("warn", "apple-touch-icon", "missing apple-touch-icon");
  if (!link("manifest") && !noindex) add("info", "manifest", "no web app manifest linked");
  if (!meta("name", "theme-color")) add("info", "theme-color", "no theme-color meta");

  const body = html.slice(html.search(/<body\b/i) >= 0 ? html.search(/<body\b/i) : 0);
  const h1 = (body.match(/<h1\b/gi) ?? []).length;
  if (h1 !== 1) add("fail", "h1", `expected exactly one <h1>, found ${h1}`);
  const mains = (body.match(/<main\b/gi) ?? []).length;
  if (mains !== 1) add("fail", "main", `expected exactly one <main>, found ${mains}`);
  let previous = 0;
  for (const match of body.matchAll(/<h([1-6])\b/gi)) {
    const level = Number(match[1]);
    if (previous && level > previous + 1) {
      add("warn", "heading-order", `heading jumps from h${previous} to h${level}`);
      break;
    }
    previous = level;
  }

  const images = tags(body, "img");
  const noAlt = images.filter((image) => !("alt" in image.attrs)).length;
  if (noAlt) add("fail", "img-alt", `${noAlt} <img> without alt`);
  const noSize = images.filter((image) => !(image.attrs.width && image.attrs.height) && !/aspect-ratio/i.test(image.attrs.style ?? "")).length;
  if (noSize) add("warn", "img-size", `${noSize} <img> without width/height (layout shift risk)`);

  const anchors = tags(body, "a");
  const dead = anchors.filter((anchor) => anchor.attrs.href === "#" || /^javascript:/i.test(anchor.attrs.href ?? "")).length;
  if (dead) add("warn", "dead-links", `${dead} link(s) with href="#" or javascript:`);
  const unsafeBlank = anchors.filter((anchor) => anchor.attrs.target === "_blank" && !/noopener|noreferrer/i.test(anchor.attrs.rel ?? "")).length;
  if (unsafeBlank) add("warn", "target-blank", `${unsafeBlank} target=_blank link(s) without rel="noopener"`);
  const insecure = [...html.matchAll(/\b(?:src|href)\s*=\s*["']http:\/\/(?!localhost|127\.0\.0\.1)[^"']+["']/gi)].length;
  if (insecure) add("warn", "mixed-content", `${insecure} http:// resource or link reference(s)`);
  const placeholderLinks = anchors.filter((anchor) => /example\.(com|org)/i.test(anchor.attrs.href ?? "")).length;
  if (placeholderLinks) add("warn", "placeholder-links", `${placeholderLinks} link(s) to example.com`);

  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const types = [];
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] ?? [data];
      for (const node of nodes) {
        if (!node["@type"]) add("fail", "jsonld-type", "JSON-LD node without @type");
        else types.push([].concat(node["@type"]).join("/"));
      }
    } catch (error) {
      add("fail", "jsonld-parse", `JSON-LD does not parse: ${error.message}`);
    }
  }
  if (scripts.length === 0 && !noindex) add("warn", "jsonld", "no JSON-LD structured data");

  const forms = [...body.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map((match) => match[0]);
  for (const form of forms) {
    const controls = tags(form, "input").filter((input) => !/^(hidden|submit|button|reset|image)$/i.test(input.attrs.type ?? ""))
      .concat(tags(form, "select"), tags(form, "textarea"));
    const unlabeled = controls.filter((control) => {
      const id = control.attrs.id;
      if (control.attrs["aria-label"] || control.attrs["aria-labelledby"] || control.attrs.title) return false;
      if (id && new RegExp(`<label\\b[^>]*for\\s*=\\s*["']?${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\\s>]`, "i").test(form)) return false;
      const before = form.slice(0, form.indexOf(control.raw));
      return before.lastIndexOf("<label") <= before.lastIndexOf("</label>");
    }).length;
    if (unlabeled) add("fail", "form-labels", `${unlabeled} form control(s) without a label`);
    const personal = /type\s*=\s*["']?(email|tel)|name\s*=\s*["']?(name|phone|email|fullname)/i.test(form);
    if (personal && !/privacy|policy|политик|персональн|конфиденциальн|datenschutz/i.test(html)) {
      add("warn", "privacy", "form collects personal data but the page links no privacy policy or consent text");
    }
    if (/type\s*=\s*["']?email/i.test(form) && !/autocomplete\s*=/i.test(form)) add("info", "autocomplete", "form fields have no autocomplete attributes");
  }

  return { file, title, canonical, noindex, jsonLdTypes: types, issues };
}

async function checkSite(root) {
  const issues = [];
  const add = (level, id, message) => issues.push({ level, id, message, file: root });
  const robotsPath = join(root, "robots.txt");
  if (!existsSync(robotsPath)) add("warn", "robots", "no robots.txt at the site root");
  else {
    const robots = await readFile(robotsPath, "utf8");
    if (/^\s*disallow:\s*\/\s*$/im.test(robots)) add("fail", "robots-block", "robots.txt disallows the whole site");
    if (!/^\s*sitemap:\s*https:\/\//im.test(robots)) add("warn", "robots-sitemap", "robots.txt has no absolute Sitemap: line");
  }
  const sitemapPath = join(root, "sitemap.xml");
  if (!existsSync(sitemapPath)) add("warn", "sitemap", "no sitemap.xml at the site root");
  else if (!/<urlset[\s\S]*<loc>https:\/\//i.test(await readFile(sitemapPath, "utf8"))) add("fail", "sitemap-format", "sitemap.xml has no absolute https <loc> entries");
  if (!["404.html", "404/index.html"].some((path) => existsSync(join(root, path)))) add("warn", "404", "no 404 page (404.html)");
  const manifest = ["site.webmanifest", "manifest.webmanifest", "manifest.json"].map((name) => join(root, name)).find(existsSync);
  if (manifest) {
    try {
      const data = JSON.parse(await readFile(manifest, "utf8"));
      if (!data.icons?.some((icon) => /512/.test(icon.sizes ?? ""))) add("warn", "manifest-icons", "manifest has no 512px icon");
    } catch (error) {
      add("fail", "manifest-parse", `manifest does not parse: ${error.message}`);
    }
  }
  if (!existsSync(join(root, "favicon.ico"))) add("info", "favicon-ico", "no /favicon.ico (some crawlers and Yandex request it)");
  return issues;
}

export async function launchCheck(paths, baseUrl = null) {
  const files = [];
  const roots = [];
  for (const path of paths) {
    const absolute = resolve(path);
    if ((await stat(absolute)).isDirectory()) roots.push(absolute);
    await collect(absolute, files);
  }
  const pages = [];
  for (const file of files) pages.push(checkPage(await readFile(file, "utf8"), file));
  const issues = pages.flatMap((page) => page.issues);
  for (const root of roots) issues.push(...(await checkSite(root)));

  const titles = new Map();
  for (const page of pages) {
    if (page.noindex || !page.title) continue;
    titles.set(page.title, [...(titles.get(page.title) ?? []), page.file]);
    if (baseUrl && page.canonical && isAbsoluteHttps(page.canonical) && new URL(page.canonical).host !== new URL(baseUrl).host) {
      issues.push({ level: "fail", id: "canonical-host", message: `canonical host ${new URL(page.canonical).host} differs from ${new URL(baseUrl).host}`, file: page.file });
    }
  }
  for (const [title, duplicates] of titles) {
    if (duplicates.length > 1) issues.push({ level: "warn", id: "duplicate-title", message: `${duplicates.length} pages share the title "${title}"`, file: dirname(duplicates[0]) });
  }
  const count = (level) => issues.filter((issue) => issue.level === level).length;
  return { pages: pages.length, failures: count("fail"), warnings: count("warn"), infos: count("info"), issues, structuredData: pages.map((page) => ({ file: page.file, types: page.jsonLdTypes })) };
}

function format(result, cwd) {
  const lines = [`launch-check: ${result.pages} page(s), ${result.failures} failure(s), ${result.warnings} warning(s), ${result.infos} note(s)`];
  const byFile = new Map();
  for (const issue of result.issues) byFile.set(issue.file, [...(byFile.get(issue.file) ?? []), issue]);
  const order = { fail: 0, warn: 1, info: 2 };
  for (const [file, issues] of byFile) {
    lines.push("", relative(cwd, file) || file);
    for (const issue of issues.sort((a, b) => order[a.level] - order[b.level])) {
      lines.push(`  ${issue.level.toUpperCase().padEnd(4)} ${issue.id}: ${issue.message}`);
    }
  }
  const typed = result.structuredData.filter((page) => page.types.length > 0);
  if (typed.length > 0) {
    lines.push("", "Structured data");
    for (const page of typed) lines.push(`  ${relative(cwd, page.file)}: ${page.types.join(", ")}`);
  }
  lines.push("", result.failures > 0 ? "Not launch-ready: fix every FAIL." : "No failures. Fix or justify each WARN in the report.");
  return `${lines.join("\n")}\n`;
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
  if (options.help || options.paths.length === 0) {
    process.stdout.write(`${usage()}\n`);
    process.exitCode = options.help ? 0 : 2;
    return;
  }
  let result;
  try {
    result = await launchCheck(options.paths, options.baseUrl);
  } catch (error) {
    process.stderr.write(`launch-check: ${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  if (result.pages === 0) {
    process.stderr.write("launch-check: no HTML files found\n");
    process.exitCode = 2;
    return;
  }
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : format(result, process.cwd()));
  if (result.failures > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  await main();
}
