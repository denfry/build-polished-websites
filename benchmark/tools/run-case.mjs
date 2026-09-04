#!/usr/bin/env node
// Runs one benchmark case with an independent coding agent (Codex CLI), with or
// without the skill installed, and records the transcript metadata.
//
//   node benchmark/tools/run-case.mjs --case editorial --variant with
//   node benchmark/tools/run-case.mjs --case editorial --variant without
//
// The "with" variant installs the skill into <workdir>/.agents/skills and
// prefixes the neutral prompt with "Use $build-polished-websites." Nothing
// else differs. Outputs land in benchmark/<case>/<variant>-skill/.

import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile, readdir, copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = Object.fromEntries(process.argv.slice(2).map((arg, index, all) => (arg.startsWith("--") ? [arg.slice(2), all[index + 1]] : [])).filter((pair) => pair.length));

const caseName = args.case;
const variant = args.variant;
const agent = args.agent ?? "codex";
const timeoutMinutes = Number(args.timeout ?? 40);
if (!caseName || !["with", "without"].includes(variant)) {
  console.error("Usage: run-case.mjs --case <name> --variant with|without [--agent codex] [--model <id>] [--timeout <min>]");
  process.exit(2);
}

const caseDir = join(root, "benchmark", caseName);
const prompt = await readFile(join(caseDir, "prompt.txt"), "utf8");
const outDir = join(caseDir, `${variant}-skill`);
const workDir = resolve(process.env.BENCH_WORKDIR ?? join(root, ".bench-runs"), `${caseName}-${variant}`);

await rm(workDir, { recursive: true, force: true });
await mkdir(workDir, { recursive: true });
await mkdir(outDir, { recursive: true });

if (variant === "with") {
  await cp(join(root, "build-polished-websites"), join(workDir, ".agents", "skills", "build-polished-websites"), { recursive: true });
}

const fullPrompt = `${variant === "with" ? "Use $build-polished-websites.\n\n" : ""}${prompt.trim()}\n\nWrite the deliverable files into the current working directory.`;
await writeFile(join(workDir, "PROMPT.txt"), fullPrompt);

const started = Date.now();
const events = [];
const filesRead = new Set();
const commands = [];
let lastMessage = "";
let model = args.model ?? null;

const codexArgs = ["exec", "--json", "--skip-git-repo-check", "-s", "workspace-write", "-C", workDir, "--ephemeral", "-o", join(workDir, "LAST_MESSAGE.md")];
if (args.model) codexArgs.push("-m", args.model);
codexArgs.push("-"); // prompt is piped through stdin to avoid shell quoting issues

const child = spawn(agent === "codex" ? (process.platform === "win32" ? "codex.cmd" : "codex") : agent, codexArgs, { stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" });
child.stdin.end(fullPrompt);
let stdoutBuffer = "";
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  let newline;
  while ((newline = stdoutBuffer.indexOf("\n")) >= 0) {
    const line = stdoutBuffer.slice(0, newline).trim();
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (!line.startsWith("{")) continue;
    try {
      const event = JSON.parse(line);
      events.push(event);
      const text = JSON.stringify(event);
      if (!model) model = event.model ?? event.msg?.model ?? event.item?.model ?? null;
      for (const match of text.matchAll(/(SKILL\.md|references\/[a-z0-9-]+\.md|scripts\/[a-z0-9-]+\.mjs)/g)) filesRead.add(match[1]);
      const item = event.item ?? event.msg ?? {};
      if (item.type === "command_execution" || item.type === "exec_command_begin") commands.push((item.command ?? "").toString().slice(0, 200));
      if (item.type === "agent_message" && item.text) lastMessage = item.text;
    } catch {
      // ignore partial lines
    }
  }
});
let stderr = "";
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

const timer = setTimeout(() => {
  stderr += `\n[run-case] timeout after ${timeoutMinutes} minutes; killing agent\n`;
  child.kill();
}, timeoutMinutes * 60 * 1000);

const exitCode = await new Promise((resolveExit) => child.on("close", resolveExit));
clearTimeout(timer);
const durationSeconds = Math.round((Date.now() - started) / 1000);

// Collect deliverables (HTML, CSS, JS, SVG, MD) excluding the installed skill and prompt.
const produced = [];
for (const entry of await readdir(workDir, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html?|css|m?js|svg|md|txt|json)$/i.test(entry.name) && !["PROMPT.txt", "LAST_MESSAGE.md"].includes(entry.name)) {
    await copyFile(join(workDir, entry.name), join(outDir, entry.name));
    produced.push(entry.name);
  }
}
let finalMessage = lastMessage;
try {
  finalMessage = await readFile(join(workDir, "LAST_MESSAGE.md"), "utf8");
} catch {
  // fall back to the streamed message
}

const usage = events.map((event) => event.usage ?? event.msg?.usage ?? event.item?.usage).filter(Boolean).at(-1) ?? null;
const record = {
  case: caseName,
  variant,
  agent: agent === "codex" ? `codex-cli ${await codexVersion()}` : agent,
  model: model ?? (await codexConfigModel()),
  startedAt: new Date(started).toISOString(),
  durationSeconds,
  exitCode,
  eventCount: events.length,
  skillFilesReferenced: [...filesRead].sort(),
  commandsRun: commands.slice(0, 40),
  usage,
  producedFiles: produced,
  prompt: fullPrompt,
  stderrTail: stderr.slice(-2000),
};
await writeFile(join(outDir, "run.json"), JSON.stringify(record, null, 2));
await writeFile(join(outDir, "agent-report.md"), finalMessage || "(no final message captured)");
await writeFile(join(workDir, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
console.log(`${caseName}/${variant}: exit ${exitCode}, ${durationSeconds}s, files: ${produced.join(", ") || "none"}, skill files referenced: ${record.skillFilesReferenced.length}`);
process.exit(exitCode === 0 && produced.some((file) => /\.html?$/i.test(file)) ? 0 : 1);

async function codexVersion() {
  return new Promise((resolveVersion) => {
    const proc = spawn(process.platform === "win32" ? "codex.cmd" : "codex", ["--version"], { shell: process.platform === "win32" });
    let out = "";
    proc.stdout.on("data", (chunk) => {
      out += chunk;
    });
    proc.on("close", () => resolveVersion(out.trim().replace(/^codex-cli\s*/, "")));
    proc.on("error", () => resolveVersion("unknown"));
  });
}

async function codexConfigModel() {
  try {
    const config = await readFile(join(process.env.CODEX_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME, ".codex"), "config.toml"), "utf8");
    return config.match(/^model\s*=\s*"([^"]+)"/m)?.[1] ?? "default";
  } catch {
    return "default";
  }
}
