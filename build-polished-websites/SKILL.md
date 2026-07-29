---
name: build-polished-websites
description: Design, build, integrate, refactor, migrate, or review distinctive production-ready websites without generic AI-generated visual patterns or SaaS-default layouts. Use for editorial and media sites, portfolios, cultural and event sites, hospitality, local services, nonprofits, education, documentation, directories, marketplaces, ecommerce, landing pages, marketing sites, dashboards, web apps, themes, templates, CMS work, WordPress, WooCommerce, Gutenberg, Elementor, 1C-Bitrix, Bitrix24 sites, Tilda, Shopify, Drupal, Webflow, headless CMS, static sites, responsive UI, accessibility, technical SEO, security review, browser verification, and Lighthouse quality gates.
---

# Build Polished Websites

Build websites that feel art-directed, intentional, credible, and maintainable
inside their actual publishing platform. Preserve the project's stack, content
model, editor experience, and deployment path unless changing them is necessary.

## Read the right references

- Read [references/cms-platform-selection.md](references/cms-platform-selection.md)
  whenever a CMS, site builder, theme, exported site, or unknown legacy
  platform is involved.
- Then read exactly the matching platform playbook:
  - [references/wordpress.md](references/wordpress.md) for WordPress,
    WooCommerce, Gutenberg, Elementor, ACF, themes, or plugins.
  - [references/bitrix.md](references/bitrix.md) for 1C-Bitrix Site Manager,
    Bitrix Framework, components, templates, modules, or D7.
  - [references/tilda.md](references/tilda.md) for hosted Tilda projects, Zero
    Block, custom code, forms, export, API sync, or Tilda-generated markup.
  - [references/shopify.md](references/shopify.md) for Shopify themes, Liquid,
    Online Store 2.0, sections, blocks, and app extensions.
  - [references/other-platforms.md](references/other-platforms.md) for Drupal,
    Webflow, headless CMS, static generators, or another platform.
- Read [references/visual-direction.md](references/visual-direction.md) before
  choosing or materially changing the visual language.
- Read [references/site-archetypes.md](references/site-archetypes.md) for every
  new site or substantial redesign. Use it to choose the site's content
  architecture before choosing its visual style.
- Read [references/quality-gates.md](references/quality-gates.md) before
  verification or when changing performance-sensitive code.
- Read [references/security-seo.md](references/security-seo.md) when the site
  accepts input, fetches remote data, renders user content, has authentication,
  or is public and indexable.
- Read [references/platform-installation.md](references/platform-installation.md)
  only when installing or distributing this skill.

## Workflow

### 1. Establish the brief

Inspect the repository, supplied references, existing brand assets, and content
before writing code. Determine:

- the audience and primary action;
- the site's one-sentence promise;
- the primary site archetype and, when useful, one secondary influence;
- the required routes, states, and content;
- the existing framework, component system, and deployment constraints;
- the source of truth for content and the editor who must maintain it;
- whether work targets source code, a visual editor, an export pipeline, a
  staging instance, or a live production site;
- three visual adjectives and one explicit visual anti-goal.

Make reasonable assumptions when the brief is incomplete. Ask only when a
missing choice would materially change the product.

### 2. Identify the platform contract

Detect the platform from files and runtime evidence. Read the matching playbook
before editing. Do not force framework conventions onto a CMS or flatten an
editable theme into hardcoded markup.

Write down four constraints:

1. where custom code belongs;
2. what editors must remain able to change;
3. how cache and generated output are invalidated;
4. how the change reaches staging and production.

Never edit vendor, platform core, generated exports, or a live visual-builder
page unless that is the verified source of truth and the user authorized it.
Back up or version the editable source before a risky platform change.

### 3. Define a visual thesis

Read [references/site-archetypes.md](references/site-archetypes.md). Choose an
archetype from the audience, content, and primary action; never default to SaaS
because the workspace is blank. Select a composition model, density, navigation
model, and proof format that fit that archetype. A secondary influence may
shape the presentation, but it must not obscure the primary job.

Then choose one coherent visual direction grounded in the product. State it in
one sentence before implementation. Define a small token system for color,
type, space, radii, borders, and motion.

Use real copy and meaningful hierarchy. Generate or source imagery only when it
supports the concept. Do not decorate empty space with arbitrary effects.

Reject the anti-patterns in
[references/visual-direction.md](references/visual-direction.md). A clean site
is not automatically generic, and a dramatic site is not automatically good.
Do not reuse the same section sequence, hero geometry, card grammar, or CTA
placement across unrelated archetypes. Let the content model determine the
page silhouette.

### 4. Build the semantic foundation

Use the repository's current stack. Do not replace working infrastructure or
add a large dependency for a small visual effect.

- Use semantic landmarks and exactly one primary `main`.
- Keep heading levels logical and provide one clear `h1`.
- Build mobile-first, then verify intermediate and wide widths.
- Support keyboard use, visible focus, reduced motion, zoom, and reflow.
- Reserve intrinsic space for images, video, embeds, and async content.
- Use native controls before custom ARIA widgets.
- Keep content in HTML when it conveys meaning; do not bake text into images.
- Treat empty, loading, error, disabled, hover, focus, and success states as
  designed states.

Prefer CSS for layout and simple motion. Animate `transform` and `opacity`;
avoid layout-thrashing effects. Remove dead code and placeholder content.

For CMS work, expose intentional editor controls instead of arbitrary styling
knobs. Keep presentation in themes/templates, business logic in modules or
plugins, and content in the platform's content model.

### 5. Protect trust boundaries

Validate untrusted input before side effects. Keep secrets server-side. Avoid
unsafe HTML, shell interpolation, unsanitized redirects, user-controlled fetch
targets, and path concatenation. Enforce authentication, authorization, and
ownership on every state-changing server path.

Apply the targeted checklist in
[references/security-seo.md](references/security-seo.md). Never claim a site is
secure when a relevant trust boundary was not inspected.

### 6. Verify in a real browser

Run the production build and serve the production output. Do not use a
development server for final performance measurements.

Inspect every critical route and interaction at approximately:

- 375 × 812;
- 768 × 1024;
- 1440 × 900.

Also inspect one awkward width between breakpoints. Check screenshots, keyboard
navigation, console errors, failed requests, overflow, clipping, focus order,
content reflow, and motion preferences. Exercise at least the primary user
journey and one failure path.

Test both the public page and the editing/publishing workflow when CMS behavior
changed. Fix issues and repeat. Browser-visible evidence outranks assumptions
from code.

### 7. Run deterministic quality gates

Follow [references/quality-gates.md](references/quality-gates.md). Run
Lighthouse against the production site three times per representative route,
then evaluate the JSON reports with:

```bash
node <skill-dir>/scripts/lighthouse-gate.mjs <report-1.json> <report-2.json> <report-3.json>
```

Default median gates:

- Performance: 90
- Accessibility: 95
- Best Practices: 95
- SEO: 95
- LCP: at most 2500 ms
- CLS: at most 0.10
- TBT: at most 200 ms

Treat thresholds as floors, not targets. Do not weaken them to make a failing
build pass. Document a justified exception when external scripts or an
intentional product trade-off prevent a gate.

### 8. Report the outcome

Lead with what was built or fixed. Include:

- the visual thesis and major implementation decisions;
- the selected archetype, composition model, and any secondary influence;
- routes and viewports verified;
- platform version, edit surface, cache actions, and deployment target;
- commands run and their results;
- Lighthouse median scores and failed audits, if any;
- remaining risks, exceptions, or unverified areas.

Do not say "Lighthouse passed," "accessible," "secure," or "responsive"
without fresh evidence from this implementation.

## Definition of done

Finish only when:

- the primary journey works end to end;
- no placeholder copy or accidental stock UI remains;
- the editor can maintain intended content without modifying source code;
- critical routes work at the verified widths;
- keyboard and focus behavior are usable;
- production build, lint, typecheck, and tests pass when available;
- the browser console has no unexplained errors;
- Lighthouse reports meet the gates or exceptions are explicit;
- public pages have correct metadata, canonical behavior, and share previews;
- relevant trust boundaries have validation and fail closed.
