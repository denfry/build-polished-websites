#!/usr/bin/env node

// Scans website source or build output for fingerprints of templated,
// machine-default design. Every signal is a prompt to justify or revise a
// decision, not an automatic failure: a brief can legitimately call for any
// single technique. Clusters of signals are what make a page read as generated.
//
// Usage:
//   node slop-scan.mjs <file-or-directory>... [--json] [--max-score <n>]

import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import process from "node:process";

const SCANNED = new Set([
  ".html", ".htm", ".css", ".scss", ".sass", ".less", ".js", ".jsx", ".ts", ".tsx", ".mjs",
  ".vue", ".svelte", ".astro", ".liquid", ".php", ".twig", ".njk", ".hbs", ".md", ".mdx", ".erb",
]);
const MARKUP = new Set([".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte", ".astro", ".liquid", ".php", ".twig", ".njk", ".hbs", ".md", ".mdx", ".erb"]);
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".astro", "coverage", "vendor", ".cache", ".turbo"]);

const STOCK_PHRASES = [
  "revolutioniz", "supercharge", "seamless", "next-generation", "next-gen", "cutting-edge", "game-changer",
  "game changer", "unlock your", "unlock the power", "unleash", "elevate your", "empower", "effortless",
  "streamline", "harness the power", "in today's fast-paced", "world-class", "best-in-class",
  "to the next level", "transform your", "all-in-one", "state-of-the-art", "look no further",
  "reimagine", "redefine", "designed for the future", "built for the future", "boost your",
  "your journey", "dive into", "delve", "tapestry", "testament to", "like never before",
  "революцион", "инновационн", "бесшовн", "передов", "на новый уровень", "раскройте потенциал",
  "индивидуальный подход", "команда профессионалов", "высококвалифицированн", "широкий спектр",
  "качественно и в срок", "лучшие решения", "уникальное предложение", "мы предлагаем",
];

const PROOF = /trusted by\s+(?:over\s+)?[\d,.]+|\b\d{1,3}(?:,\d{3})+\+|\b\d+k\+\s|join (?:over |more than )?[\d,]+|\b99\.9+%|★{4,}|\b4\.\d\s*\/\s*5\b|rated \d\.\d|as seen (?:on|in)\b|loved by\s+[\d,.]+|нам доверяют|более\s+\d[\d\s]*\+?\s*(?:клиентов|компаний|пользователей|проектов)|довольных клиентов/i;
const PLACEHOLDER = /lorem ipsum|\bacme(?: inc| corp)?\b|\bjohn doe\b|\bjane doe\b|your (?:company|logo) here|\byour company\b|placeholder (?:text|image)|\[insert |иван иванов|рыба текст/i;

const CLASSIC_FONTS = ["Inter", "Roboto", "Poppins", "Montserrat", "Open Sans", "Lato", "Plus Jakarta Sans", "Outfit", "Sora", "DM Sans", "Manrope", "Nunito"];
const FASHIONABLE_FONTS = ["Instrument Serif", "Fraunces", "Space Grotesk", "Space Mono", "Syne", "DM Serif Display", "Playfair Display", "IBM Plex Mono", "JetBrains Mono", "Cormorant Garamond"];

const SIGNALS = {
  "purple-gradient": { group: "classic", weight: 3, text: "purple/indigo/violet gradient" },
  "gradient-text": { group: "classic", weight: 2, text: "gradient-filled headline text" },
  glassmorphism: { group: "classic", weight: 2, text: "repeated backdrop blur (glass cards)" },
  "glow-blobs": { group: "classic", weight: 2, text: "large blurred glow shapes" },
  "pill-overuse": { group: "classic", weight: 1, text: "fully rounded pills used throughout" },
  "emoji-icons": { group: "classic", weight: 2, text: "emoji used as an icon system" },
  "classic-fonts": { group: "classic", weight: 1, text: "default AI-template font family" },
  "cream-paper": { group: "fashionable", weight: 2, text: "cream/beige 'paper' page background" },
  "terracotta-accent": { group: "fashionable", weight: 1, text: "terracotta/vermilion accent" },
  "acid-accent": { group: "fashionable", weight: 1, text: "acid-lime accent" },
  "mono-eyebrows": { group: "fashionable", weight: 2, text: "uppercase tracked mono labels above sections" },
  "tracked-caps": { group: "fashionable", weight: 1, text: "many uppercase letter-spaced labels" },
  "hard-offset-shadow": { group: "fashionable", weight: 2, text: "hard offset 'neo-brutalist' shadows" },
  "section-numbering": { group: "fashionable", weight: 1, text: "01/02/03 section numbering" },
  "headline-accent-word": { group: "fashionable", weight: 1, text: "one highlighted or italic word inside the h1" },
  "tight-tracking": { group: "fashionable", weight: 1, text: "display letter-spacing tighter than -0.05em" },
  "grain-overlay": { group: "fashionable", weight: 1, text: "site-wide noise/grain overlay" },
  marquee: { group: "fashionable", weight: 1, text: "infinite marquee/ticker" },
  "fashionable-fonts": { group: "fashionable", weight: 1, text: "fashionable AI-default font family" },
  "stock-phrases": { group: "copy", weight: 1, text: "stock marketing phrases" },
  "unverified-proof": { group: "copy", weight: 2, text: "social proof or metrics that need a source" },
  placeholder: { group: "copy", weight: 3, text: "placeholder content" },
};

const GROUP_TITLES = {
  classic: "Classic AI template (first generation)",
  fashionable: "Fashionable defaults (second generation)",
  copy: "Copy and proof",
};

function usage() {
  return "Usage: node slop-scan.mjs <file-or-directory>... [--json] [--max-score <n>]";
}

function parseArgs(argv) {
  const options = { paths: [], json: false, maxScore: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") options.json = true;
    else if (value === "--max-score") {
      const parsed = Number(argv[index + 1]);
      if (!Number.isFinite(parsed)) throw new Error("--max-score needs a number");
      options.maxScore = parsed;
      index += 1;
    } else if (value === "-h" || value === "--help") {
      options.help = true;
    } else options.paths.push(value);
  }
  return options;
}

async function collect(path, files, isRoot = true) {
  const info = await stat(path);
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIPPED_DIRS.has(entry.name)) continue;
      if (entry.isDirectory() || entry.isFile()) await collect(join(path, entry.name), files, false);
    }
  } else if (info.isFile() && (isRoot || SCANNED.has(extname(path).toLowerCase()))) {
    if (!/\.min\.(js|css)$/i.test(path) || isRoot) files.push(path);
  }
}

function hexToRgb(hex) {
  let value = hex.slice(1);
  if (value.length === 3 || value.length === 4) value = [...value.slice(0, 3)].map((c) => c + c).join("");
  if (value.length !== 6 && value.length !== 8) return null;
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}

function rgbToHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l: lightness * 100 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === rn) hue = ((gn - bn) / delta) % 6;
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return { h: hue, s: saturation * 100, l: lightness * 100 };
}

const COLOR = /#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3,4}\b|rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}[^)]*\)/gi;

function toHsl(token) {
  if (token.startsWith("#")) {
    const rgb = hexToRgb(token);
    return rgb ? rgbToHsl(rgb) : null;
  }
  const numbers = token.match(/\d{1,3}/g);
  return numbers && numbers.length >= 3 ? rgbToHsl(numbers.slice(0, 3).map(Number)) : null;
}

const isCream = ({ h, s, l }) => l >= 88 && l < 98.5 && s >= 15 && h >= 28 && h <= 65;
const isTerracotta = ({ h, s, l }) => s >= 55 && l >= 38 && l <= 62 && h >= 5 && h <= 28;
const isAcid = ({ h, s, l }) => s >= 70 && l >= 48 && l <= 82 && h >= 65 && h <= 100;
const isPurple = ({ h, s, l }) => s >= 45 && l >= 30 && l <= 82 && h >= 235 && h <= 300;

const BACKGROUND_CONTEXT = /background(?:-color)?\s*:|--[\w-]*(?:bg|background|paper|surface|canvas|cream|sand|ivory|bone|linen|parchment|page|base)[\w-]*\s*:|\bbg-\[/i;

function lineOf(text, index) {
  let line = 1;
  for (let cursor = text.indexOf("\n"); cursor !== -1 && cursor < index; cursor = text.indexOf("\n", cursor + 1)) line += 1;
  return line;
}

function excerpt(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 90);
}

// Matches a family only where it is the chosen face: first in a font-family
// list (or a --font-* token), requested from Google Fonts, or imported from
// next/font. Fallback families later in a stack are ignored.
function fontPattern(name) {
  const spaced = name.replace(/ /g, "[ +]");
  const underscored = name.replace(/ /g, "_");
  return new RegExp(
    `font-family\\s*:\\s*["']?${spaced}["']?\\s*[,;}!]` +
      `|--[\\w-]+\\s*:\\s*["']${spaced}["']\\s*[,;}]` +
      `|family=${spaced}(?=[:&"'\\s]|$)` +
      `|\\bimport\\s*\\{[^}]*\\b${underscored}\\b[^}]*\\}\\s*from\\s*["']next\\/font`,
    "i",
  );
}

const FONT_PATTERNS = {
  "classic-fonts": CLASSIC_FONTS.map((name) => [name, fontPattern(name)]),
  "fashionable-fonts": FASHIONABLE_FONTS.map((name) => [name, fontPattern(name)]),
};

function classUsage(texts, name) {
  const safe = name.replace(/[^\w-]/g, "");
  const pattern = new RegExp(`(?:class|className)=["'\`][^"'\`]*(?<![\\w-])${safe}(?![\\w-])`, "g");
  return texts.reduce((sum, text) => sum + (text.match(pattern)?.length ?? 0), 0);
}

function scanText(text, file, record, markupTexts) {
  const extension = extname(file).toLowerCase();
  const markup = MARKUP.has(extension);
  const lines = text.split(/\r?\n/);
  const counts = {};
  const bump = (id, line, sample) => {
    counts[id] = (counts[id] ?? 0) + 1;
    record(id, { file, line, sample: excerpt(sample) });
  };

  lines.forEach((line, index) => {
    const number = index + 1;
    const lower = line.toLowerCase();

    if (/gradient\(/i.test(line)) {
      const purple = (line.match(COLOR) ?? []).map(toHsl).some((hsl) => hsl && isPurple(hsl));
      if (purple) bump("purple-gradient", number, line);
    }
    if (/\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d{2,3}\b/.test(line)) bump("purple-gradient", number, line);
    if (/background-clip\s*:\s*text|\bbg-clip-text\b/i.test(line)) bump("gradient-text", number, line);
    if (/backdrop-filter\s*:\s*[^;]*blur|\bbackdrop-blur\b/i.test(line)) bump("glassmorphism", number, line);
    const blur = line.match(/(?:^|[^-])filter\s*:\s*[^;]*blur\(\s*(\d+(?:\.\d+)?)(px|rem)/i);
    if ((blur && Number(blur[1]) * (blur[2] === "rem" ? 16 : 1) >= 40) || /(?<!backdrop-)\bblur-(?:2xl|3xl)\b/.test(line)) {
      bump("glow-blobs", number, line);
    }
    const pills = line.match(/border-radius\s*:\s*(?:9{3,}|\d{3,})px|border-radius\s*:\s*(?:50rem|100vmax|999em)|\brounded-full\b/gi);
    if (pills) for (let i = 0; i < pills.length; i += 1) bump("pill-overuse", number, line);

    for (const color of line.match(COLOR) ?? []) {
      const hsl = toHsl(color);
      if (!hsl) continue;
      if (isCream(hsl) && BACKGROUND_CONTEXT.test(line)) bump("cream-paper", number, line);
      if (isTerracotta(hsl)) bump("terracotta-accent", number, line);
      if (isAcid(hsl)) bump("acid-accent", number, line);
    }

    if (/box-shadow\s*:\s*-?\d*\.?\d+(?:px|rem)\s+-?\d*\.?\d+(?:px|rem)\s+0(?:px)?\s+[^;]*/i.test(line)) {
      const offsets = line.match(/box-shadow\s*:\s*(-?\d*\.?\d+)(?:px|rem)\s+(-?\d*\.?\d+)/i);
      if (offsets && (Number(offsets[1]) !== 0 || Number(offsets[2]) !== 0)) bump("hard-offset-shadow", number, line);
    }
    if (/shadow-\[-?\d+px_-?\d+px_0/.test(line)) bump("hard-offset-shadow", number, line);
    if (/letter-spacing\s*:\s*-0?\.(?:0[5-9]|[1-9])\d*em/i.test(line)) bump("tight-tracking", number, line);
    if (/@keyframes\s+[\w-]*(?:marquee|ticker)|<marquee\b/i.test(line)) bump("marquee", number, line);

    if (markup) {
      const numbering = line.match(/>\s*(?:0[1-9]|№\s*0?[1-9])\s*(?:[/.—–-]|<)/g);
      if (numbering) for (let i = 0; i < numbering.length; i += 1) bump("section-numbering", number, line);
    }
    if (/decimal-leading-zero/i.test(line)) bump("section-numbering", number, line);

    for (const phrase of STOCK_PHRASES) {
      if (lower.includes(phrase)) bump("stock-phrases", number, `${phrase}: ${line}`);
    }
    if (PROOF.test(line)) bump("unverified-proof", number, line);
    if (PLACEHOLDER.test(line)) bump("placeholder", number, line);

    for (const id of ["classic-fonts", "fashionable-fonts"]) {
      for (const [name, pattern] of FONT_PATTERNS[id]) {
        if (pattern.test(line)) bump(id, number, `${name}: ${line}`);
      }
    }
  });

  if (markup) {
    const pictographs = [...text.matchAll(/\p{Extended_Pictographic}/gu)].filter((match) => !"©®™‼⁉".includes(match[0]));
    for (const match of pictographs) bump("emoji-icons", lineOf(text, match.index), match[0]);
    for (const match of text.matchAll(/<h1\b[^>]*>(?:(?!<\/h1>)[\s\S]){0,400}?<(?:em|i|mark)\b|<h1\b[^>]*>(?:(?!<\/h1>)[\s\S]){0,400}?<span\b(?:\s*>|[^>]*class=["'][^"']*(?:accent|highlight|italic|serif|color|em)\b)/gi)) {
      bump("headline-accent-word", lineOf(text, match.index), match[0]);
    }
  }

  if (/feTurbulence/i.test(text) && /position\s*:\s*fixed|\bfixed\b[^"'\n]*\binset-0\b|grain|noise/i.test(text)) {
    const index = text.search(/feTurbulence/i);
    bump("grain-overlay", lineOf(text, index), "feTurbulence");
  }

  for (const block of text.matchAll(/[^{}]*\{[^{}]*\}/g)) {
    const body = block[0];
    if (!/text-transform\s*:\s*uppercase/i.test(body)) continue;
    const spacing = body.match(/letter-spacing\s*:\s*(\d*\.?\d+)(em|px|rem)/i);
    if (!spacing) continue;
    const em = spacing[2] === "px" ? Number(spacing[1]) / 14 : Number(spacing[1]);
    if (em < 0.06) continue;
    const mono = /font(?:-family)?\s*:[^;]*(?:mono|courier|consolas|menlo)|var\(--[\w-]*mono/i.test(body);
    const selector = body.slice(0, body.indexOf("{"));
    const usages = [...selector.matchAll(/\.([\w-]+)/g)].reduce((sum, match) => sum + classUsage(markupTexts, match[1]), 0);
    const line = lineOf(text, block.index + body.length - body.trimStart().length);
    for (let i = 0; i < Math.max(1, usages); i += 1) bump(mono ? "mono-eyebrows" : "tracked-caps", line, body);
  }
  for (const match of text.matchAll(/(?:class|className)=["'`]([^"'`]*)["'`]/g)) {
    const classes = match[1];
    if (/\buppercase\b/.test(classes) && /\btracking-(?:wide|wider|widest|\[0?\.\d+em\])\b/.test(classes)) {
      bump(/\bfont-mono\b/.test(classes) ? "mono-eyebrows" : "tracked-caps", lineOf(text, match.index), classes);
    }
  }
  return counts;
}

const THRESHOLDS = {
  glassmorphism: 2,
  "pill-overuse": 6,
  "emoji-icons": 3,
  "hard-offset-shadow": 2,
  "section-numbering": 3,
  "tracked-caps": 4,
  "mono-eyebrows": 2,
};

export async function scan(paths) {
  const files = [];
  for (const path of paths) await collect(path, files);
  const totals = {};
  const examples = {};
  const record = (id, example) => {
    examples[id] ??= [];
    const duplicate = examples[id].some((item) => item.file === example.file && item.line === example.line);
    if (!duplicate && examples[id].length < 3) examples[id].push(example);
  };
  const texts = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const markupTexts = texts.filter((_, index) => MARKUP.has(extname(files[index]).toLowerCase()));
  for (const [index, file] of files.entries()) {
    const counts = scanText(texts[index], file, record, markupTexts);
    for (const [id, count] of Object.entries(counts)) totals[id] = (totals[id] ?? 0) + count;
  }

  const fired = Object.entries(totals)
    .filter(([id, count]) => count >= (THRESHOLDS[id] ?? 1))
    .map(([id, count]) => {
      const signal = SIGNALS[id];
      const stockWeight = id === "stock-phrases" ? Math.min(4, count) : signal.weight;
      return { id, group: signal.group, text: signal.text, count, weight: stockWeight, examples: examples[id] };
    });
  const has = (id) => fired.some((signal) => signal.id === id);
  if (has("mono-eyebrows") && has("tracked-caps")) {
    const tracked = fired.find((signal) => signal.id === "tracked-caps");
    tracked.weight = 0;
  }

  const clusters = [];
  if (has("cream-paper") && (has("terracotta-accent") || has("acid-accent")) &&
      (has("mono-eyebrows") || has("tracked-caps") || has("hard-offset-shadow") || has("section-numbering"))) {
    clusters.push({ id: "fashionable-template", weight: 3, text: "paper background + signal accent + label/shadow grammar: the current model-default 'tasteful' look" });
  }
  if (has("purple-gradient") && (has("gradient-text") || has("glassmorphism") || has("glow-blobs"))) {
    clusters.push({ id: "classic-template", weight: 3, text: "purple gradient + glow/glass/gradient text: the classic AI landing page" });
  }

  const score = [...fired, ...clusters].reduce((sum, item) => sum + item.weight, 0);
  const verdict = score >= 8 ? "likely generic" : score >= 4 ? "review" : "low";
  return { files: files.length, score, verdict, signals: fired, clusters };
}

function formatText(result, cwd) {
  const lines = [
    `slop-scan: ${result.files} file(s) scanned`,
    `Score ${result.score}: ${result.verdict} (0-3 low, 4-7 review, 8+ likely generic).`,
    "Signals are prompts to justify or revise a decision, not automatic failures.",
  ];
  for (const group of Object.keys(GROUP_TITLES)) {
    const signals = result.signals.filter((signal) => signal.group === group);
    if (signals.length === 0) continue;
    lines.push("", GROUP_TITLES[group]);
    for (const signal of signals) {
      lines.push(`  [+${signal.weight}] ${signal.id} x${signal.count}: ${signal.text}`);
      for (const example of signal.examples) {
        lines.push(`        ${relative(cwd, example.file) || example.file}:${example.line}  ${example.sample}`);
      }
    }
  }
  if (result.clusters.length > 0) {
    lines.push("", "Clusters");
    for (const cluster of result.clusters) lines.push(`  [+${cluster.weight}] ${cluster.id}: ${cluster.text}`);
  }
  if (result.signals.length === 0) lines.push("", "No template signals found. Still review the screenshots: absence of tells is not presence of an idea.");
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
    result = await scan(options.paths);
  } catch (error) {
    process.stderr.write(`slop-scan: ${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  if (result.files === 0) {
    process.stderr.write("slop-scan: no scannable files found\n");
    process.exitCode = 2;
    return;
  }
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : formatText(result, process.cwd()));
  if (options.maxScore !== null && result.score > options.maxScore) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  await main();
}
