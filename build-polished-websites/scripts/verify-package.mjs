#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = resolve(process.argv[2] ?? defaultRoot);
const required = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/archetypes.md",
  "references/completeness.md",
  "references/visual-thesis.md",
  "references/anti-slop.md",
  "references/copy-and-imagery.md",
  "references/responsive.md",
  "references/accessibility.md",
  "references/verification.md",
  "references/performance.md",
  "references/visual-regression.md",
  "references/frameworks.md",
  "references/cms-platform-selection.md",
  "references/security-seo.md",
  "references/wordpress.md",
  "references/bitrix.md",
  "references/tilda.md",
  "references/shopify.md",
  "references/other-platforms.md",
  "references/platform-installation.md",
  "scripts/lighthouse-gate.mjs",
  "scripts/browser-verify.mjs",
  "scripts/skill-tokens.mjs",
  "scripts/verify-package.mjs",
];
const SKILL_TOKEN_BUDGET = Number(process.env.SKILL_TOKEN_BUDGET ?? 2000);
const failures = [];

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

for (const path of required) {
  if (!(await exists(join(skillRoot, path)))) failures.push(`missing required file: ${path}`);
}

const skillPath = join(skillRoot, "SKILL.md");
if (await exists(skillPath)) {
  const skill = await readFile(skillPath, "utf8");
  const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) {
    failures.push("SKILL.md has invalid or missing YAML frontmatter");
  } else {
    if (!/^name:\s*build-polished-websites\s*$/m.test(frontmatter[1])) {
      failures.push("SKILL.md name does not match the package directory");
    }
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1] ?? "";
    if (!description) {
      failures.push("SKILL.md description is missing");
    } else if (description.length > 1024) {
      failures.push(`SKILL.md description is ${description.length} characters; agents cap it at 1024`);
    }
  }
  const approxTokens = Math.ceil(skill.length / 4);
  if (approxTokens > SKILL_TOKEN_BUDGET) {
    failures.push(`SKILL.md is ~${approxTokens} tokens; budget is ${SKILL_TOKEN_BUDGET} (move detail into references)`);
  }
  // Backtick-quoted relative paths (references/x.md, scripts/x.mjs) must exist.
  for (const match of skill.matchAll(/`((?:references|scripts)\/[A-Za-z0-9._-]+)`/g)) {
    if (!(await exists(join(skillRoot, match[1])))) failures.push(`SKILL.md mentions missing file: ${match[1]}`);
  }
}

for (const markdownPath of (await walk(skillRoot)).filter((path) => path.endsWith(".md"))) {
  const content = await readFile(markdownPath, "utf8");
  const links = content.matchAll(/\[[^\]]*]\(([^)]+)\)/g);
  for (const match of links) {
    const target = match[1].trim().split("#", 1)[0];
    if (!target || /^(https?:|mailto:|#)/i.test(target) || isAbsolute(target)) continue;
    const resolved = resolve(dirname(markdownPath), decodeURIComponent(target));
    const relativeTarget = relative(skillRoot, resolved);
    if (relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
      failures.push(`${relative(skillRoot, markdownPath)} links outside the skill: ${target}`);
    } else if (!(await exists(resolved))) {
      failures.push(`${relative(skillRoot, markdownPath)} has broken link: ${target}`);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`Package verification failed:\n${failures.map((item) => `- ${item}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Package verification passed: ${skillRoot}\n`);
}
