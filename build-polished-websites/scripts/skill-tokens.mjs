#!/usr/bin/env node
// Approximate token cost of the skill: SKILL.md (always loaded when the skill
// triggers) and each reference (loaded on demand). Uses a chars/4 estimate,
// which is within about 15% for English markdown on common tokenizers.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const skillRoot = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
const budget = Number(process.env.SKILL_TOKEN_BUDGET ?? 2000);

export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

async function measure(path) {
  const content = await readFile(path, "utf8");
  return { path: relative(skillRoot, path).replace(/\\/g, "/"), chars: content.length, tokens: estimateTokens(content), lines: content.split("\n").length };
}

const skill = await measure(join(skillRoot, "SKILL.md"));
const frontmatter = (await readFile(join(skillRoot, "SKILL.md"), "utf8")).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
const references = [];
for (const entry of await readdir(join(skillRoot, "references"))) {
  if (entry.endsWith(".md")) references.push(await measure(join(skillRoot, "references", entry)));
}
references.sort((a, b) => b.tokens - a.tokens);

const rows = [skill, ...references];
const width = Math.max(...rows.map((row) => row.path.length));
process.stdout.write(`${"File".padEnd(width)}  ~tokens   chars  lines\n`);
for (const row of rows) {
  process.stdout.write(`${row.path.padEnd(width)}  ${String(row.tokens).padStart(7)}  ${String(row.chars).padStart(6)}  ${String(row.lines).padStart(5)}\n`);
}
const total = rows.reduce((sum, row) => sum + row.tokens, 0);
process.stdout.write(`\nMetadata (always visible): ~${estimateTokens(frontmatter)} tokens\n`);
process.stdout.write(`SKILL.md (on trigger): ~${skill.tokens} tokens (budget ${budget})\n`);
process.stdout.write(`All references (never all at once): ~${total - skill.tokens} tokens\n`);

if (skill.tokens > budget) {
  process.stderr.write(`SKILL.md exceeds the token budget: ${skill.tokens} > ${budget}. Move detail into references.\n`);
  process.exitCode = 1;
}
