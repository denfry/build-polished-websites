# Performance and the Lighthouse gate

Lighthouse is a lab guardrail. It catches regressions and obvious waste. It is
not field data and never proves how the site performs for real users.

## Contents

1. Lab versus field
2. Procedure
3. `lighthouse-gate.mjs`
4. Regression mode
5. Diagnosis

## Lab versus field

- **Lab metrics** (Lighthouse, WebPageTest): one device profile, one network
  profile, one cold load. Deterministic enough to gate a build when you take
  the median of several runs. Report them as "lab".
- **Field Core Web Vitals** (CrUX, RUM, Search Console): real users, real
  devices, 75th percentile over 28 days. Authoritative for ranking and user
  experience. Report them when available; say "field data unavailable" when
  not. Never present a lab score as field performance.

## Procedure

1. Build for production and serve the built output over HTTP.
2. Run Lighthouse three times per representative route with the same form
   factor, fresh profile, and unique output paths. Use a project-local binary
   or one from a scratch directory; do not add Lighthouse to the project for
   a one-off.

```bash
npx --no-install lighthouse http://127.0.0.1:4173/ \
  --output=json --output-path=./artifacts/lh/home-1.json \
  --chrome-flags="--headless=new" --quiet
```

3. Evaluate the reports with the gate script.
4. Audit distinct templates, not only the home page: a content-heavy page,
   an interactive shell, a conversion route, the heaviest media or
   third-party route.
5. Mobile is the default form factor. Add a desktop run when the desktop
   layout differs materially. Never mix form factors in one evaluation.

## `lighthouse-gate.mjs`

```bash
node <skill-dir>/scripts/lighthouse-gate.mjs ./artifacts/lh/home-*.json
```

Default median gates: Performance 90, Accessibility 95, Best Practices 95,
SEO 95, LCP ≤ 2500 ms, CLS ≤ 0.10, TBT ≤ 200 ms. Thresholds are floors.
Do not lower them to pass; write down a justified exception instead.

Behavior:

- expands `*` globs itself so the same command works in PowerShell;
- accepts raw Lighthouse JSON or PageSpeed Insights `lighthouseResult`
  wrappers;
- rejects reports with a runtime error, missing categories, mixed final URLs,
  or mixed form factors;
- warns when fewer than three reports are supplied (`--min-reports 3`
  enforces);
- `--json` emits machine-readable output; exit code 0 pass, 1 fail, 2 error.

Options to override thresholds: `--performance`, `--accessibility`,
`--best-practices`, `--seo` (0 to 100), `--lcp`, `--tbt` (ms), `--cls`.

## Regression mode

Compare a previous state with the current one:

```bash
node <skill-dir>/scripts/lighthouse-gate.mjs ./after/home-*.json \
  --baseline ./before/home-*.json
```

Medians are computed for both sets. The gate fails when a category median
drops more than `--max-regression` points (default 3) or a metric median
worsens more than `--max-metric-regression` percent (default 10, with a small
absolute floor for CLS). Both sets must share form factor and URL path.
Improvements never fail. Use this for redesigns of existing sites and for
verifying that a performance fix actually moved the median.

## Diagnosis

Fix causes, not scores:

- **LCP:** server response time, render-blocking CSS and fonts, unoptimized or
  lazy-loaded hero media, client-only rendering of above-fold content. Preload
  the actual LCP resource only.
- **CLS:** missing image dimensions, late-loaded fonts without size-adjusted
  fallbacks, injected banners, async content without reserved space.
- **TBT and INP risk:** large JavaScript bundles, hydration of static content,
  long tasks on load, third-party scripts. Split, defer, and remove.
- **Payload:** responsive AVIF/WebP images, subset fonts, tree-shaken bundles,
  lazy below-fold media.
- **Third parties:** analytics, chat, consent, embeds are budget consumers.
  Load them after interaction or with facades where acceptable, and document
  the ones the user requires.

Do not trade accessibility, correctness, or the editor's ability to change
content for a score.
