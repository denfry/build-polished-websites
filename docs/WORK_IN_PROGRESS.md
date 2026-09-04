# Work in progress — evidence-driven skill (branch `feat/evidence-driven-skill`)

Handoff notes so the work can continue from another machine. Delete this file
before the release PR.

## Done (committed on this branch)

1. `SKILL.md` rewritten as a compact seven-step loop (~1650 tokens, was ~2420).
   Old `visual-direction.md`, `site-archetypes.md`, `quality-gates.md` removed.
2. New references: `archetypes`, `completeness`, `visual-thesis`, `anti-slop`,
   `copy-and-imagery`, `responsive`, `accessibility`, `verification` (with
   scorecard), `performance` (lab vs field, regression mode),
   `visual-regression`, `frameworks`.
3. `scripts/lighthouse-gate.mjs` v2 (globs, PSI wrapper, runtime errors, form
   factor, `--baseline` regression mode) + 15 tests.
4. `scripts/browser-verify.mjs` harness (viewport matrix, console, network,
   overflow, keyboard smoke, axe) + tests. Verified end to end on the existing
   SaaS benchmark pages using a scratch tooling dir (Playwright 1.62.1, axe
   4.13.0). Finding: `without-skill.html` has 7 axe color-contrast nodes.
5. `scripts/skill-tokens.mjs`; `verify-package.mjs` checks description cap,
   token budget, and backticked paths.
6. Benchmark prompts for 6 archetypes and `benchmark/tools/run-case.mjs`
   (Codex CLI runner) + `benchmark/tools/measure.mjs`.

## Audit findings gathered so far (to be written into docs/SKILL_AUDIT.md)

- P0 · Benchmark credibility: the existing SaaS "without-skill" baseline was
  hand-authored to look bad (README admits "intentionally art-directed"), and
  README shows it as "a typical unconstrained AI landing page". Must be
  relabeled as author-simulated and replaced by real agent runs.
- P0 · House-style risk: old visual-direction example thesis ("warm paper,
  compressed type") + anti-list ("no pills, no rounded containers, no
  gradients") biased toward one editorial/sharp aesthetic; with-skill demo
  followed exactly that. Fixed by visual-thesis tensions + anti-slop "justify
  defaults" framing; needs multi-archetype benchmark to confirm.
- P1 · Unverifiable rule: "vary at least three composition dimensions from the
  nearest recent project" — agent has no memory of prior projects. Removed.
- P1 · Lighthouse gate: PowerShell does not expand `*.json`; no runtime-error
  or form-factor checks; 4 tests only. Fixed.
- P1 · No viewport below 375, no landscape, no completeness checklists, no
  keyboard/axe automation, no scorecard, no framework guidance, no image
  priority, no visual regression. Fixed by new references/scripts.
- P2 · Duplication: SKILL.md step 3 repeated visual-direction; README anti-slop
  list duplicated the reference; archetypes "diversity checks" overlapped
  visual "review questions". Consolidated.
- P2 · Description was keyword-stuffed (may over-trigger on "security review"
  alone); rewritten with an explicit "do not use for" clause.
- P2 · CI does not test installer `--replace` backup path or upgrade.
- P3 · Codex docs URL in platform-installation.md was stale; fixed to
  https://learn.chatgpt.com/docs/build-skills. Installer paths verified
  against OpenCode docs (reads `.opencode/skills`, `.claude/skills`,
  `.agents/skills`; user: `~/.config/opencode/skills`, `~/.claude/skills`,
  `~/.agents/skills`) and Codex docs (`.agents/skills`, `~/.agents/skills`).
- CMS playbooks (WordPress, Bitrix, Tilda, Shopify, Drupal, headless): no
  factual errors found on read-through; source-of-truth invariant is present
  in each. Still to spot-check against current vendor docs.

## Open problem: isolating the benchmark "without-skill" arm

Codex CLI on this machine loads the user's global `~/.codex/AGENTS.md`
(context7, BridgeSpace, "browser companion" instructions) and user skills in
`~/.agents/skills` (superpowers, orchestration, …). Findings:

- A fresh `CODEX_HOME` (only `auth.json` + minimal `config.toml`) removes
  AGENTS.md, hooks and MCP servers, but user skills are still listed.
- Overriding `HOME`/`USERPROFILE` does not hide them (home resolved via OS API).
- First trial run (portfolio/without) ended after 87 s asking "Would you like
  me to use the browser companion?" and produced no files — contaminated by
  the global AGENTS.md. Discarded.

Options to resolve (pick one, document in benchmark/README.md):

1. Run benchmarks on a machine/user profile with no global skills.
2. Temporarily move `~/.agents/skills` aside during runs (reversible; ask the
   user first).
3. Check `codex features list` / config for a skills toggle
   (`-c features.<x>=false`) — not yet checked.
4. Accept the contamination and record it as a limitation (weakest).

Also add to both prompts, equally: "Do not ask questions; make reasonable
assumptions and complete the deliverable." (non-interactive run).

Scratch tooling used locally (not in repo):
`%LOCALAPPDATA%/Temp/claude/.../scratchpad/tools` with `lighthouse@13`,
`playwright@1.62.1` (+ `npx playwright install chromium`), `axe-core`, `serve`.
Set `BPW_TOOLING_DIR` to it for `browser-verify.mjs` and `measure.mjs`.

## Remaining plan

1. Resolve isolation, then run 6 cases × 2 variants with Codex
   (`gpt-5.6-luna`, medium). Keep failures. Run `measure.mjs` on each output.
   Optionally repeat 2–3 cases with Claude Code (`claude -p`) for cross-model
   evidence.
2. Relabel `benchmark/saas-single-html` as author-simulated; keep as
   historical, or rerun with the agent.
3. Write `docs/SKILL_AUDIT.md`, `docs/EVALUATION.md` (methodology, results
   table, failures), `docs/DESIGN_RUBRIC.md` (anchored 1/3/5 criteria:
   hierarchy, product specificity, coherence, credibility, layout,
   typography, responsive composition, interaction clarity, originality,
   accessibility, CMS maintainability), `docs/DEMO.md` (3 contrasting cases
   with exact reproduction), `docs/ROADMAP.md`, `CHANGELOG.md`.
4. Score each benchmark output against the rubric (human review by the
   author, clearly labeled as such) + attach measurements.
5. Update README/README.ru: precise claim labels (PROVEN / DEMONSTRATED /
   DESIGN GOAL / ROADMAP), new structure, new scripts; update CONTRIBUTING,
   issue templates (add "benchmark" area), PR template (browser-verify test).
6. CI: add `browser-verify.test.mjs`, `skill-tokens.mjs`; test installer
   `--replace` backup path on both OSes.
7. Spot-check CMS playbooks against current official docs (WordPress
   theme.json/block.json, Shopify section groups, Tilda API limits, Bitrix
   /local); security-seo: add CSP guidance nuance and "frontend-only
   inspection" disclaimer.
8. Cross-agent: Claude Code discovery test (project scope), Codex discovery
   (confirmed: `$build-polished-websites` resolves from `.agents/skills`),
   OpenCode (CLI present but account has no balance; verify discovery via
   `opencode` listing if possible).
9. Final report per the task spec; recommended version 1.0.0-rc or 0.9.0.
