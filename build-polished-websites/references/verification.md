# Browser verification and scorecard

Evidence comes from the built site in a real browser. The order is: production
build, serve, capture, check, fix, repeat, then report only what was observed.

## Contents

1. Procedure
2. What to capture
3. `browser-verify.mjs`
4. Scorecard format

## Procedure

1. Run the project's own checks first: install from lockfile, lint, typecheck,
   tests, production build. Do not skip a failing step to reach screenshots.
2. Serve the production output over HTTP on a local port (the framework's
   preview or start command, or any static server). Never measure the dev
   server or `file://`.
3. Capture the viewport matrix from `responsive.md` for every critical route
   and state: home or index, one content-heavy route, one interactive or
   authenticated shell, one conversion or form route, one error state, 404.
4. Walk the primary journey and one failure path with the keyboard.
5. Run the accessibility checks in `accessibility.md`.
6. Run Lighthouse per `performance.md`.
7. Fix what you found and repeat the affected steps. Keep the last artifacts.
8. For CMS work also exercise authoring: insert, edit, preview, publish, and
   confirm the public page and cache reflect the change.

## What to capture

- Full-page screenshot per route per viewport, plus one reduced-motion
  capture and one 200% zoom capture.
- Console errors and unhandled exceptions.
- Failed or 4xx/5xx network requests, including fonts, images, and analytics.
- Horizontal overflow at each width.
- Basic document facts: `lang`, title, description, one `h1`, one `main`,
  images without alt, images without dimensions.
- Keyboard path: focus order, visible focus, traps, Escape behavior.
- Automated accessibility violations per route and state when a tool exists.

## `browser-verify.mjs`

`scripts/browser-verify.mjs` performs the captures above with Playwright when
it is already available. It never installs anything.

```bash
node <skill-dir>/scripts/browser-verify.mjs \
  --url http://127.0.0.1:4173/ --url http://127.0.0.1:4173/pricing \
  --out ./artifacts/verify --axe
```

Options:

- `--url <url>` repeatable; at least one.
- `--out <dir>` output directory (default `./artifacts/browser-verify`).
- `--viewports 320x800,375x812,768x1024,1000x800,1440x900` default matrix.
- `--tabs <n>` number of Tab presses in the keyboard smoke (default 30).
- `--axe` run axe-core when it can be resolved.
- `--tooling-dir <dir>` a directory whose `node_modules` contains `playwright`
  (and optionally `axe-core`), for example a scratch directory; also read from
  `BPW_TOOLING_DIR`.
- `--json` print machine-readable results.

Resolution order for tooling: the current project, `--tooling-dir`,
`BPW_TOOLING_DIR`. When Playwright is missing the script prints how to provide
it and exits with code 3 without touching the project. Exit code 1 means the
page loaded but a check failed; 2 is a usage error.

Outputs: `results.json`, `summary.md`, and `<route>/<width>.png` screenshots.
The script reports facts; you decide whether each finding is a defect.

## Scorecard format

End the task with this scorecard. Every line is one of `✓` (observed in this
session), `✗` (observed failing), `?` (not run or not testable here), with a
short note. Never mark `✓` on inference.

```text
SCORECARD — <site or route set>

ARCHETYPE   <primary> (+ <secondary>)  · thesis: <one line>
PLATFORM    <platform/version> · source of truth: <where> · editors keep: <what>

BUILD
✓ production build (<command>)
✓ lint / typecheck / tests (<commands>) or ? not present

RESPONSIVE (routes: <list>)
✓ 320  ✓ 375  ✓ 768  ✓ <awkward>  ✓ 1440  ? 1920
✓ no horizontal overflow · ✓ 200% zoom · ? landscape

ACCESSIBILITY
✓ keyboard path (<journey>) · ✓ visible focus · ✓ dialog focus management
✓ automated audit (<tool version>, <n> violations → fixed)
? screen reader not manually tested

PERFORMANCE (lab, Lighthouse <version>, <mobile|desktop>, median of 3)
<route>: Perf 96 · A11y 100 · BP 100 · SEO 100 · LCP 1.8s · CLS 0.00 · TBT 40ms
? field Core Web Vitals unavailable

CMS / CONTENT
✓ source of truth preserved (<what was edited>)
✓ editor workflow tested (<what>) or ? not applicable

SECURITY / SEO
✓ inputs validated server-side · ✓ metadata + canonical + share preview
? headers not verified on production response

COMPLETENESS
✓ <checklist items done> · deferred: <items, agreed with user>

RISKS
- <exceptions, unverified areas, external scripts, assumptions>
```

The scorecard is evidence, not reassurance. A short honest scorecard with
several `?` marks is correct; a long one with only `✓` is suspicious.
