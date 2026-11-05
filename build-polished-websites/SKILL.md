---
name: build-polished-websites
description: Use when designing, building, redesigning, reviewing, or migrating any website or web interface - landing pages, brand and marketing sites, portfolios, blogs and editorial, restaurants and hospitality, events, local services, clinics and law firms, nonprofits, education, documentation, directories, ecommerce, dashboards, and web apps - or when a site looks generic, templated, or AI-generated. Also for WordPress, WooCommerce, Gutenberg, Elementor, 1C-Bitrix, Bitrix24 sites, Tilda, Shopify, Drupal, Webflow, headless CMS, and static sites, and for responsive layout, accessibility, technical SEO, security review, browser screenshots, and Lighthouse quality gates.
---

# Build Polished Websites

Beautiful sites come from a specific idea, executed with craft, and checked with
eyes. Generic sites skip one of the three: no idea (every choice falls to the
model's default), no craft (rough type, spacing, and states), or no looking (the
page is never screenshotted). Each step below produces evidence that the step
happened.

Preserve the project's stack, content model, editor experience, and deployment
path unless changing them is necessary.

## References

| Situation | Read |
|---|---|
| New site, redesign, or any material visual change | [site-archetypes.md](references/site-archetypes.md), then [visual-direction.md](references/visual-direction.md), then [aesthetic-directions.md](references/aesthetic-directions.md) |
| Writing markup and CSS for visible UI, stock photos and video, non-rectangular shapes | [craft.md](references/craft.md) |
| Game-like or themed worlds: pixel, isometric, paper, sketch, 3D, Y2K | [aesthetic-directions.md](references/aesthetic-directions.md) (Genre worlds) |
| Anything rendered, every time before reporting | [design-review.md](references/design-review.md) |
| A CMS, builder, theme, exported site, or unknown legacy platform | [cms-platform-selection.md](references/cms-platform-selection.md), then exactly one playbook below |
| WordPress, WooCommerce, Gutenberg, Elementor, ACF | [wordpress.md](references/wordpress.md) |
| 1C-Bitrix, Bitrix Framework, D7 | [bitrix.md](references/bitrix.md) |
| Tilda, Zero Block, Tilda export or API | [tilda.md](references/tilda.md) |
| Shopify, Liquid, Online Store 2.0 | [shopify.md](references/shopify.md) |
| Drupal, Webflow, headless CMS, static generators, others | [other-platforms.md](references/other-platforms.md) |
| Verification or performance-sensitive code | [quality-gates.md](references/quality-gates.md) |
| Input, remote data, user content, auth, or public indexable pages | [security-seo.md](references/security-seo.md) |
| Installing or distributing this skill | [platform-installation.md](references/platform-installation.md) |

## Workflow

### 1. Establish the brief

Inspect the repository, supplied references, brand assets, and content before
writing code. Determine:

- the audience and primary action;
- the site's one-sentence promise;
- the required routes, states, and content;
- the existing framework, component system, and deployment constraints;
- the source of truth for content and the editor who must maintain it;
- whether work targets source code, a visual editor, an export pipeline, a
  staging instance, or a live production site.

Gather real content first: names, offers, prices, hours, addresses, dates,
people, product facts. Write copy at real length before layout. When facts are
missing, write plausible drafts, mark them clearly, and say so. Never invent
reviews, ratings, logos, press, awards, or statistics.

Make reasonable assumptions when the brief is incomplete. Ask only when a
missing choice would materially change the product.

### 2. Identify the platform contract

For a standalone static page or a new project without a CMS, the contract
reduces to where the files live and how they are deployed; skip editor and
cache items that do not exist and say so in the report.

Otherwise, detect the platform from files and runtime evidence and read the
matching playbook before editing. Do not force framework conventions onto a CMS or
flatten an editable theme into hardcoded markup. Write down:

1. where custom code belongs;
2. what editors must remain able to change;
3. how cache and generated output are invalidated;
4. how the change reaches staging and production.

Never edit vendor code, platform core, generated exports, or a live
visual-builder page unless that is the verified source of truth and the user
authorized it. Back up or version the editable source before a risky change.

### 3. Choose the structure

Using [site-archetypes.md](references/site-archetypes.md), choose the primary
archetype from the audience's intent and the dominant content unit, plus at
most one secondary influence. Never default to SaaS because the workspace is
blank. Choose silhouette, density, navigation, hierarchy, media role, proof
format, and primary action, then sketch the page as named content blocks in
order before any styling.

### 4. Art-direct

Follow [visual-direction.md](references/visual-direction.md):

1. List at least eight concrete things from the subject's world and choose the
   source the visual language will borrow from.
2. Write three candidate directions that differ on at least three axes. Use
   [aesthetic-directions.md](references/aesthetic-directions.md) to widen the
   range beyond the first idea.
3. Reject candidates that rely on model-default fingerprints the source world
   did not produce.
4. Fill in the direction card. Every field gets a concrete value: typefaces,
   colour values with roles, layout, shape, imagery plan, motion, signature
   moment, and the default check.

The card is the contract for the rest of the work and goes into the report.
When the user is actively collaborating on a substantial project, show the
three candidates briefly and let them pick.

### 5. Build with craft

Use the repository's current stack. Do not replace working infrastructure or
add a large dependency for a small visual effect. Apply
[craft.md](references/craft.md): tokens from the card first, then typography,
colour, layout, surfaces, imagery, motion, and finishing details.

- Use semantic landmarks, exactly one `main`, one clear `h1`, and logical
  heading levels.
- Build mobile-first, then recompose for intermediate and wide widths.
- Support keyboard use, visible focus, reduced motion, zoom, and reflow.
- Reserve intrinsic space for images, video, embeds, and async content.
- Use native controls before custom ARIA widgets.
- Keep meaningful text in HTML, never baked into images.
- Content is visible without JavaScript; animation only enhances it.
- Treat empty, loading, error, disabled, hover, focus, and success states as
  designed states.
- Remove dead code and placeholder content.

For CMS work, expose intentional editor controls instead of arbitrary styling
knobs. Keep presentation in themes and templates, business logic in modules or
plugins, and content in the platform's content model.

### 6. Protect trust boundaries

Validate untrusted input before side effects. Keep secrets server-side. Avoid
unsafe HTML, shell interpolation, unsanitized redirects, user-controlled fetch
targets, and path concatenation. Enforce authentication, authorization, and
ownership on every state-changing server path. Apply
[security-seo.md](references/security-seo.md). Never claim a site is secure when
a relevant trust boundary was not inspected.

### 7. Look, critique, refine

Follow [design-review.md](references/design-review.md). Capture the rendered
pages:

```bash
node <skill-dir>/scripts/snap.mjs <url-or-file> --gray
```

Open the contact sheets and first screens. Fix blocking defects, score the
rubric, fix the three worst defects, and capture again. Run at least two passes
and ship only when every dimension scores 4 or more. Then scan the source or
build output:

```bash
node <skill-dir>/scripts/slop-scan.mjs <source-or-build>
```

Remove each signal or justify it in the direction card.

### 8. Verify behaviour in a real browser

Run the production build and serve the production output; never measure
performance on a development server. Inspect every critical route and
interaction at about 375 × 812, 768 × 1024, 1440 × 900, and one awkward width
in between. Check keyboard navigation, focus order, console errors, failed
requests, overflow, clipping, reflow, and motion preferences. Exercise the
primary journey and one failure path. When CMS behaviour changed, test both the
public page and the editing and publishing workflow.

### 9. Run deterministic quality gates

Follow [quality-gates.md](references/quality-gates.md). Run Lighthouse against
the production site three times per representative route and evaluate the
reports:

```bash
node <skill-dir>/scripts/lighthouse-gate.mjs <report-1.json> <report-2.json> <report-3.json>
```

Default median gates: Performance 90, Accessibility 95, Best Practices 95,
SEO 95, LCP at most 2500 ms, CLS at most 0.10, TBT at most 200 ms. Thresholds
are floors, not targets. Do not weaken them to pass; document a justified
exception when external scripts or an intentional trade-off prevent a gate.

### 10. Report the outcome

Lead with what was built or fixed. Include:

- the direction card, archetype, and composition model;
- the final design-review scores and what each pass fixed;
- the `slop-scan.mjs` score and justification for any remaining signal;
- routes and viewports verified and where the screenshots are;
- platform version, edit surface, cache actions, and deployment target;
- commands run and their results; Lighthouse medians and failed audits;
- remaining risks, exceptions, unverified areas, and content still needed from
  the client (photos, facts, legal text).

Do not say "beautiful," "Lighthouse passed," "accessible," "secure," or
"responsive" without fresh evidence from this implementation.

## Red flags: drifting to a default

| Thought | Do instead |
|---|---|
| "Warm cream with a terracotta accent feels editorial and safe." | That is the current model default. Sample the palette from the source world. |
| "A mono uppercase label above each section adds polish." | Labels are navigation, not ornament. Use them where the source world has them. |
| "Huge headline with one word in colour or italic." | Let the card decide what dominates; hierarchy comes from content. |
| "No photos were supplied, so the page will be type-only." | Choose an imagery mode in craft.md: licensed stock, generated, built, or honest art-directed slots. |
| "Every block is a rectangle with rounded corners." | If the source world has a shape (arch, ticket, torn edge, hull), use it on a few elements. |
| "Inter or the system font is fine for now." | Typography is the cheapest, largest lever. Choose it in the card. |
| "A marquee, grain, or bento grid will add energy." | Energy comes from the concept. Add an effect only if the card names it. |
| "Same layout as the last site, new colours." | Change at least three composition dimensions. |
| "It looks right in the code." | You have not looked. Run snap.mjs and open the images. |
| "One review pass is enough." | The first pass catches breakage; the second catches rhythm, mobile, and drift. |

## Definition of done

Finish only when:

- the direction card exists and the screenshots visibly follow it;
- every design-review dimension scores at least 4 with no blocking defects;
- every `slop-scan.mjs` signal is removed or justified;
- the primary journey works end to end;
- no placeholder copy, invented proof, or accidental stock UI remains, and any
  intentional placeholder is labelled with what the client must supply;
- the editor can maintain intended content without modifying source code;
- critical routes work at the verified widths with usable keyboard and focus
  behaviour;
- production build, lint, typecheck, and tests pass when available;
- the browser console has no unexplained errors;
- Lighthouse reports meet the gates or exceptions are explicit;
- public pages have correct metadata, canonical behaviour, and share previews;
- relevant trust boundaries validate input and fail closed.
