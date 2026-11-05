<div align="center">

<a href="https://denfry.github.io/build-polished-websites/"><img src=".github/assets/banner.png" alt="Build Polished Websites: an agent skill for art-directed websites, built from the subject's own world and checked with eyes" width="100%"></a>

<p>
  <a href="https://github.com/denfry/build-polished-websites/actions/workflows/ci.yml"><img src="https://github.com/denfry/build-polished-websites/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://denfry.github.io/build-polished-websites/"><img src="https://img.shields.io/badge/showcase-live-d22d2d.svg" alt="Live showcase"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-141619.svg" alt="Apache 2.0 License"></a>
  <a href="build-polished-websites/SKILL.md"><img src="https://img.shields.io/badge/Agent%20Skills-compatible-141619.svg" alt="Agent Skills compatible"></a>
  <img src="https://img.shields.io/badge/Lighthouse-gated-141619.svg" alt="Lighthouse gated">
</p>

<p>
  <a href="https://denfry.github.io/build-polished-websites/"><strong>Live showcase</strong></a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#tools">Tools</a> ·
  <a href="#supported-platforms">Platforms</a> ·
  <a href="README.ru.md">Русская версия</a>
</p>

</div>

**Build Polished Websites** is a skill for Claude Code, Codex, and OpenCode. It
teaches a coding agent to design and ship websites that look like *this*
business and nobody else's, to build them natively in WordPress, Bitrix, Tilda,
Shopify, or plain code, and to prove the result with screenshots, accessibility
checks, and Lighthouse.

<a href="https://denfry.github.io/build-polished-websites/"><img src=".github/assets/compare.png" alt="Three sites built by the same agent with the previous and the current version of the skill. Previous: two cream backgrounds and rust accents. Current: a cobalt azulejo bakery, a shipyard festival in hull colours, and a calm blue-grey law practice." width="100%"></a>

<sub>Same agent, same three briefs, two versions of the skill. Open the pages on the <a href="https://denfry.github.io/build-polished-websites/">showcase</a>.</sub>

## Why

Agents generate pages fast, and they generate the same page. The first
generation of that page is familiar: purple gradients, glass cards, a centered
hero with two buttons, three icon cards, invented metrics.

Tell an agent to "avoid AI slop" and it moves to the second generation:
cream "paper", a terracotta or acid-lime accent, a giant headline with one
italic word, mono uppercase labels, 01/02/03 numbering, hard offset shadows.
Tasteful once, identical across a bakery, a law firm, and a dev tool. We
measured it: our own earlier version did exactly this.

A ban list cannot fix that, because avoiding patterns is not a direction. This
skill replaces it with decisions an agent must make and evidence it must
produce.

## How it works

```text
brief → platform contract → archetype → source world → three candidates
      → direction card → craft → screenshot critique (2+ passes)
      → slop-scan → browser checks → Lighthouse → evidence report
```

| Step | What the agent does |
|---|---|
| **Archetype** | Picks the structure from the visitor's intent: menu-first restaurant, poster-and-timetable event, appointment path, catalog, docs, dashboard, and 12 more. Never "SaaS by default". |
| **Source world** | Lists eight concrete things from the subject's world (tiles, tickets, hull marks, forms) and borrows the visual language from one of them. |
| **Three candidates** | Writes three directions that differ on value, type genre, silhouette, density, or imagery, drawing on 20 direction families and 6 genre worlds. |
| **Direction card** | Commits to typefaces, colour values with roles, layout, shapes, imagery plan, motion, and one signature moment. The values become CSS tokens. |
| **Craft** | Fluid type scales, OKLCH palettes, breakout grids, licensed stock photo and video, non-rectangular shapes, motion, and finishing details. |
| **Critique** | Captures the page at four widths, scores ten dimensions, fixes the three worst defects, and repeats until everything scores at least 4. |
| **Verify** | Keyboard and focus, forms and failure paths, console and requests, security boundaries, SEO metadata, and a three-run Lighthouse median. |

## Quick start

```bash
git clone https://github.com/denfry/build-polished-websites.git
cd build-polished-websites
bash ./install.sh --agent all --scope user        # macOS, Linux, WSL, Git Bash
```

```powershell
.\install.ps1 -Agent all -Scope user              # Windows PowerShell
```

Then ask your agent:

```text
Use $build-polished-websites to build a site for a family bakery in Porto.
Show me the direction card before building.
```

In Claude Code the skill is also available as `/build-polished-websites`, and
it loads automatically for website work.

<details>
<summary><strong>More install options</strong></summary>

| Agent | Installed to |
|---|---|
| Claude Code | `~/.claude/skills/build-polished-websites` |
| Codex, OpenCode | `~/.agents/skills/build-polished-websites` |

One project only:

```bash
bash ./install.sh --agent all --scope project --project-path /path/to/project
```

```powershell
.\install.ps1 -Agent all -Scope project -ProjectPath C:\path\to\project
```

One agent only: pass `claude`, `codex`, or `opencode` to `--agent` / `-Agent`.
Installers never overwrite an existing skill; `--replace` / `-Replace` moves the
current one to a timestamped backup first. Restart the agent if it does not
detect the skill.

</details>

More prompts for redesigns, audits, and each CMS: [examples/prompts.md](examples/prompts.md).

## Tools

Three dependency-free Node scripts ship with the skill.

**`snap.mjs`: look at what you built.** Screenshots at 375, 768, 1100, and
1440 px through a local Chrome or Edge, with a legible contact sheet of the
whole page per width, plus overflow, console errors, failed requests, loaded
fonts, and small tap targets.

```bash
node build-polished-websites/scripts/snap.mjs ./index.html --gray
```

**`slop-scan.mjs`: catch the defaults.** Flags first- and second-generation
template fingerprints, stock phrases in English and Russian, unverified social
proof, and placeholders, with file and line. Signals are prompts to justify or
revise, not automatic failures.

```text
$ node build-polished-websites/scripts/slop-scan.mjs ./src
Score 14: likely generic (0-3 low, 4-7 review, 8+ likely generic).
  [+2] cream-paper x1: cream/beige 'paper' page background
  [+2] mono-eyebrows x6: uppercase tracked mono labels above sections
  [+2] hard-offset-shadow x4: hard offset 'neo-brutalist' shadows
  [+3] fashionable-template: paper background + signal accent + label/shadow grammar
```

**`lighthouse-gate.mjs`: hold the line.** Evaluates three Lighthouse JSON
reports per route and fails on the median.

| Metric | Gate | Metric | Gate |
|---|---:|---|---:|
| Performance | ≥ 90 | LCP | ≤ 2500 ms |
| Accessibility | ≥ 95 | CLS | ≤ 0.10 |
| Best Practices | ≥ 95 | TBT | ≤ 200 ms |
| SEO | ≥ 95 | | |

```bash
node build-polished-websites/scripts/lighthouse-gate.mjs lh-1.json lh-2.json lh-3.json
```

## Supported platforms

The agent reads only the playbook it needs, and keeps the site editable by the
people who run it.

| Platform | Guidance includes |
|---|---|
| WordPress / WooCommerce | Block and classic themes, child themes, Gutenberg, Elementor, ACF, hooks, template ownership |
| 1C-Bitrix | D7, `/local`, components, templates, modules, permissions, component and composite caching |
| Tilda | Standard blocks, Zero Block, custom code, forms, API export, publish-time synchronization |
| Shopify | Liquid, JSON templates, sections, blocks, merchant settings, commerce states, Theme Check |
| Drupal | Custom themes, Twig, libraries, preprocess, render cache metadata, configuration workflow |
| Webflow and hosted builders | Designer ownership, reusable classes and components, CMS bindings, export boundaries |
| Headless CMS | Typed content, preview isolation, webhook verification, cache invalidation |
| Static and legacy sites | Generator-native patterns, output verification, incremental integration |

Before touching a CMS, the agent writes a platform contract: where custom code
belongs, what editors must keep controlling, how caches are invalidated, and how
changes reach production. No edits to core, vendor code, or generated exports.

## What's inside

```text
build-polished-websites/
├── SKILL.md                     workflow, red flags, definition of done
├── references/
│   ├── site-archetypes.md       16 archetypes and composition dimensions
│   ├── visual-direction.md      source world, candidates, direction card, fingerprints
│   ├── aesthetic-directions.md  20 direction families, 6 genre worlds, Cyrillic-ready fonts
│   ├── craft.md                 type, colour, layout, imagery, stock media, shapes, motion
│   ├── design-review.md         screenshot critique loop and rubric
│   ├── quality-gates.md         production Lighthouse procedure
│   ├── security-seo.md          trust boundaries and technical SEO
│   └── wordpress.md, bitrix.md, tilda.md, shopify.md, other-platforms.md, ...
└── scripts/                     snap, slop-scan, lighthouse-gate, verify-package
showcase/                        the GitHub Pages site and its example pages
benchmark/                       the earlier single-file SaaS comparison
```

## Showcase and benchmarks

- **[Live showcase](https://denfry.github.io/build-polished-websites/):** a
  Porto bakery, a Gdańsk shipyard festival, and a Portland family-law practice,
  each built twice with screenshots, palettes, and slop-scan scores.
- **[SaaS benchmark](benchmark/saas-single-html/comparison.md):** the same
  incident-response brief with no skill and with the first version, including
  three-run Lighthouse medians.

Three briefs are a demonstration, not a statistical result. Contributions of
new briefs and reruns are welcome.

## Development

```bash
node build-polished-websites/scripts/verify-package.mjs
node build-polished-websites/scripts/lighthouse-gate.test.mjs
node build-polished-websites/scripts/slop-scan.test.mjs
bash -n install.sh
```

CI runs these checks and both installers on Windows and Linux. The showcase
deploys to GitHub Pages from `showcase/` on every push to `main`.

## Contributing

Platform corrections, new CMS playbooks, new direction families, sharper
fingerprints, and reproducible benchmark briefs are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) first. For vulnerabilities, follow
[SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE)
