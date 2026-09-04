---
name: build-polished-websites
description: Build, redesign, integrate, or review production websites so they fit their product, audience, content, and platform instead of generic AI defaults. Use for any website or web-UI task: landing pages, editorial and media sites, portfolios, ecommerce, local businesses, nonprofits, events, documentation, dashboards, and web apps on WordPress, WooCommerce, 1C-Bitrix, Tilda, Shopify, Drupal, Webflow, headless CMS, Next.js, Astro, Vite, SvelteKit, Nuxt, or plain HTML. Includes browser verification, accessibility checks, and a Lighthouse gate. Do not use for backend-only, CLI, or non-web work.
---

# Build Polished Websites

Discover the right website for this product, audience, content, and platform,
then prove in a browser that it works. Never replace one AI house style with
another. Preserve the project's stack, content model, and editor workflow
unless changing them is the task.

## Decision loop

```text
UNDERSTAND → ARCHETYPE → PLATFORM CONTRACT → VISUAL THESIS
          → BUILD → VERIFY → REPORT
```

Load references only at the step that needs them. Every path is relative to
this file.

### 1. Understand

Inspect the repository, brand assets, supplied copy, and content before coding.
Write down, in a few lines:

- audience and their primary action;
- the site's one-sentence promise;
- required routes, states, and content sources;
- existing framework, component system, tokens, and deployment path;
- who edits content afterwards and where;
- hard constraints: brand, legal, performance budget, locales.

Make reasonable assumptions for gaps and state them. Ask only when a missing
answer would change the product.

### 2. Choose the archetype

Read `references/archetypes.md`. Choose one primary archetype from user
intent and dominant content unit, plus at most one secondary influence. Then
read the matching completeness checklist in `references/completeness.md` so the
site is a whole product, not a homepage. Never default to a SaaS landing page
because the workspace is empty.

### 3. Fix the platform contract

For a CMS, site builder, exported site, or unknown legacy platform, read
`references/cms-platform-selection.md` and then exactly one playbook it routes
to. For a code framework, read `references/frameworks.md`.

Write four lines before editing:

1. where custom code belongs;
2. what editors must remain able to change without code;
3. how cache and generated output are invalidated;
4. how the change reaches staging and production.

Modify the true source of truth. Never edit vendor code, platform core,
generated exports, or a live visual-builder page unless that is verified as the
source and the user authorized it. Version or back up the editable source
before a risky change.

### 4. Write the visual thesis

Read `references/visual-thesis.md`. Derive direction from product, audience,
content, brand, primary action, and constraints, not from current trends.
Write a thesis of three to five sentences before styling: what the site is
like, which tensions it resolves, the one composition rule, and one explicit
anti-goal. Derive tokens from the thesis and any existing design system; do not
reuse values from a previous project.

Then read `references/anti-slop.md` and answer its questions for your plan.
Techniques are not banned; unjustified defaults are.

### 5. Build

Use the current stack. Do not add a large dependency for a small effect.

- Semantic landmarks, one `main`, one `h1`, logical heading order.
- Native controls first; ARIA only where HTML cannot express the interaction.
- Compose mobile deliberately (`references/responsive.md`), then verify wide
  and awkward widths.
- Design loading, empty, error, disabled, focus, hover, and success states.
- Reserve intrinsic space for media and async content.
- Prefer CSS for layout and motion; animate `transform` and `opacity`;
  honor `prefers-reduced-motion`.
- Copy and imagery follow `references/copy-and-imagery.md`: concrete claims,
  no invented customers, metrics, or testimonials; keep supplied copy.
- Validate untrusted input, keep secrets server-side, fail closed. Apply
  `references/security-seo.md` when the site accepts input, renders user
  content, authenticates, or is indexable.

For CMS work keep presentation in themes or templates, logic in plugins or
modules, and content in the platform's content model, with bounded editor
controls.

### 6. Verify in a real browser

Read `references/verification.md`. Build for production and serve the built
output; do not measure a dev server. At minimum:

- viewport matrix: about 320, 375, 768, one awkward width between your
  breakpoints, 1440; wider when the layout has a wide variant;
- screenshots of every critical route and state;
- console errors and failed network requests;
- a keyboard path through the primary journey and one failure path;
- accessibility checks from `references/accessibility.md`; an automated audit
  is supporting evidence, not proof;
- Lighthouse per `references/performance.md`, three runs per route, evaluated
  with `scripts/lighthouse-gate.mjs`.

`scripts/browser-verify.mjs` automates the viewport matrix, console and
network capture, overflow detection, keyboard smoke, and an optional axe-core
audit when Playwright is already available. Never install heavy tooling into a
user's project for one check without permission.

For a redesign of an existing site, capture before screenshots first
(`references/visual-regression.md`).

Fix what verification finds, then re-verify. Browser evidence outranks
reasoning about code.

### 7. Report

Emit the scorecard from `references/verification.md`: what was built, the
archetype and thesis, platform contract, each check with its result or an
explicit "not run", Lighthouse medians, and remaining risks. Use "verified"
only for things you observed in this session. Say "not tested" for the rest.

## Definition of done

- The primary journey and one failure path work end to end in the browser.
- Every route in the completeness checklist exists or is explicitly deferred.
- No placeholder copy, fabricated proof, or accidental stock UI remains.
- Editors can change intended content without code.
- Critical routes are composed, not merely collapsed, across the viewport
  matrix.
- Keyboard, focus, zoom, and reduced-motion behavior are usable.
- Build, lint, typecheck, and tests pass when the project has them.
- The console has no unexplained errors.
- Lighthouse medians meet the gates or exceptions are written down.
- Public pages have correct metadata, canonical, and share previews.
- Trust boundaries fail closed.
