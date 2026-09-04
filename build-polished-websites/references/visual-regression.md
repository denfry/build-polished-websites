# Visual regression for existing sites

When changing a site that already exists, capture evidence before touching it.
Pixel differences are data, not verdicts: intended changes should differ, and
everything else should not.

## Workflow

1. **Before:** on the current production-like build, capture full-page
   screenshots of every route you will touch and every route that shares the
   changed components, across the viewport matrix. Keep console and network
   logs. `scripts/browser-verify.mjs --out before/` does this when Playwright
   is available.
2. **Implement** the change.
3. **After:** repeat the capture with identical URLs, viewports, and settings
   into `after/`.
4. **Compare:** review side by side. Use the project's visual testing tool
   (Playwright `toHaveScreenshot`, Chromatic, Percy, BackstopJS, Loki) when it
   exists; otherwise compare manually or with an image diff tool that is
   already installed.
5. **Classify** every difference as intended, incidental but acceptable
   (record why), or a regression (fix it). Common regressions: shifted layout
   on routes you did not intend to change, changed spacing from a global
   token, missing focus styles, fonts falling back, overflow at an awkward
   width.
6. **Report** the routes and viewports compared, the intended differences,
   and any accepted incidental differences.

## Rules

- Same build type, same data, same viewport sizes, animations disabled, and
  fonts loaded before capture. Otherwise differences are noise.
- Include one route you did not change as a control.
- Dynamic content (dates, randomized items, live data) needs masking or fixed
  fixtures.
- Do not treat a redesign as exempt: the before set is how you prove content
  parity, which links and states survived, and what was deliberately removed.
- Never delete the before set until the change is accepted.
