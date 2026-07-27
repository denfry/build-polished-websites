# Browser and Lighthouse quality gates

## Contents

1. Required checks
2. Production Lighthouse procedure
3. Route selection
4. Accessibility checks
5. Performance diagnosis
6. Evidence format

## Required checks

Run the project's existing commands first:

1. dependency integrity or lockfile install;
2. lint;
3. typecheck;
4. unit and integration tests;
5. production build;
6. browser smoke test;
7. Lighthouse on the served production output.

Do not silently install dependencies or run a downloaded package. Prefer a
project-local binary. Ask before adding Lighthouse, Playwright, or another tool
to a repository.

## Production Lighthouse procedure

Serve the production output on a local port. Use an isolated browser profile and
run Lighthouse three times for each representative route.

Example when Lighthouse already exists as a project dependency:

```bash
npx --no-install lighthouse http://127.0.0.1:4173/ \
  --output=json \
  --output-path=./artifacts/lighthouse-home-1.json \
  --chrome-flags="--headless --incognito"
```

Repeat with unique output paths. Evaluate the three reports:

```bash
node <skill-dir>/scripts/lighthouse-gate.mjs \
  ./artifacts/lighthouse-home-1.json \
  ./artifacts/lighthouse-home-2.json \
  ./artifacts/lighthouse-home-3.json
```

Use a median because a single lab run is noisy. Keep raw reports as build
artifacts when the project convention allows it; do not commit generated
reports unless requested.

Field Core Web Vitals are authoritative for real users. Lighthouse is a lab
guardrail. State this distinction when field data is unavailable.

## Route selection

Audit distinct templates and critical journeys, not merely the homepage:

- home or primary landing page;
- one content-heavy page;
- one interactive or authenticated shell;
- one conversion route;
- one route with the largest media or third-party burden.

For a single-page site, test the initial load and the heaviest reachable state.

## Accessibility checks

Automated tools do not prove accessibility. Also verify:

- complete keyboard traversal without traps;
- visible focus and logical focus order;
- skip link when navigation is repeated;
- accessible names for controls;
- form labels, instructions, errors, and error focus;
- correct landmarks and heading order;
- dialogs that trap and restore focus;
- contrast in default, hover, focus, disabled, and selected states;
- 200% zoom and narrow reflow without lost content;
- reduced-motion behavior;
- screen-reader announcement for meaningful async updates.

Use ARIA only where native HTML cannot express the interaction.

## Performance diagnosis

Fix causes, not the score:

- LCP: reduce server latency, preload only the real LCP resource, compress and
  size images, avoid client-only rendering of above-fold content.
- CLS: set dimensions or aspect ratios, reserve async slots, stabilize fonts,
  and avoid inserting content above the viewport.
- TBT/INP risk: remove unnecessary JavaScript, split long tasks, defer
  third-party code, and avoid hydration for static content.
- Payload: ship responsive AVIF/WebP images, subset fonts, tree-shake libraries,
  and lazy-load below-fold media.

Do not lazy-load the LCP image. Do not preload resources that are not used
immediately. Do not trade accessibility or correctness for a score.

## Evidence format

Report one row per route:

| Route | Viewports | Perf | A11y | Best | SEO | LCP | CLS | TBT | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|

List the exact production command, server URL, Lighthouse command, report count,
and any deviations. If a check could not run, say why and do not call it passed.
