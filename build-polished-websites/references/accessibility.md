# Accessibility verification

A Lighthouse accessibility score checks a fraction of what matters and cannot
see keyboard behavior, focus management, or meaning. Treat automated results as
supporting evidence. Report what you verified by hand and what you did not.

## Contents

1. Manual checks
2. Automated checks
3. Tooling adapters
4. Reporting

## Manual checks

Perform in a real browser on the built output:

- **Semantic structure:** one `main`, `header`, `nav` with labels when more
  than one, `footer`; heading levels do not skip; lists are lists; buttons
  are `button`, links are `a` with `href`.
- **Keyboard traversal:** Tab through the primary journey and one failure
  path. Every interactive element is reachable, in a logical order, with no
  traps, and Escape closes what Enter opened.
- **Focus visibility:** every focused element shows a visible indicator with
  sufficient contrast on every background it appears over.
- **Dialogs and menus:** focus moves in on open, stays in while open, returns
  to the trigger on close; the underlying page is inert or hidden from the
  accessibility tree.
- **Forms:** every field has a visible label or an accessible name; required
  and format instructions come before errors; errors are announced, linked to
  the field, and focus moves to the first error; success is confirmed.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, content still
  appears, transitions are minimal, autoplay motion stops.
- **Zoom and reflow:** 200% zoom and 320-wide reflow keep all content and
  function available.
- **Contrast:** text, UI boundaries, focus indicators, and state colors meet
  WCAG 2.2 AA in default, hover, focus, disabled (informational), and selected
  states, including text over images.
- **Accessible names:** icon buttons, links with only images, and custom
  controls announce a purpose, not "button" or the file name.
- **Screen-reader-sensitive patterns:** live regions for meaningful async
  updates; no content hidden from assistive technology that sighted users
  rely on; tables have headers; decorative images have empty alt.
- **Language and direction:** `lang` is correct; right-to-left content uses
  logical CSS properties.

## Automated checks

Run at least one automated audit on every critical route and state, including
open dialogs and error states, which a page-load audit never sees:

- axe-core through Playwright or a browser extension;
- Lighthouse accessibility category, run as part of the performance gate;
- framework tooling when present: `eslint-plugin-jsx-a11y`, Angular or Vue
  a11y lint rules, Storybook a11y addon, `@axe-core/react`,
  `svelte-check` a11y warnings, Astro or Nuxt equivalents.

Zero automated violations is the floor, not proof. Note the rules the tool
could not evaluate.

## Tooling adapters

Use what the project already has, in this order:

1. Existing test runner with an a11y assertion (Playwright + `@axe-core/playwright`,
   Cypress + `cypress-axe`, Jest + `jest-axe`, Vitest + `axe-core`).
2. `scripts/browser-verify.mjs --axe`, which loads `axe-core` and `playwright`
   from the project or from a directory passed with `--tooling-dir`, and reports
   violations per viewport and route without modifying the project.
3. Browser DevTools accessibility tree and a browser extension, done by hand.

Never add Playwright, Cypress, or axe to a user's project only to run one check
without asking. If nothing is available, run the manual checks and say so.

## Reporting

For each route, list:

- manual checks performed and their result;
- automated tool, version, rule set, and violations found or fixed;
- what remains untested (for example "screen reader not manually tested").

Never write "accessible" or "WCAG compliant" as a conclusion. Write what was
verified.
