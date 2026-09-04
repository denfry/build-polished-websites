# Copy and imagery

Generic design often starts as generic content. Copy and imagery are part of
the design system: they carry the hierarchy the layout only frames.

## Contents

1. Copy rules
2. Imagery priority
3. Image implementation
4. Alt text decisions

## Copy rules

- Preserve supplied copy unless the request includes rewriting. Fix obvious
  typos and note them.
- A headline states what the product, place, story, or organization actually
  does or is, in its own vocabulary. If a competitor could use the same
  headline, it is a category description, not a headline.
- Each claim is concrete: a number with a unit and a source, a constraint, a
  named integration, a date, a place. Prefer "Menus update by 11:00 daily"
  over "Always fresh".
- Calls to action name the outcome: "Reserve a table", "Download the annual
  report", "Compare plans", not "Get started" or "Learn more" by default.
- Body copy explains mechanism and trade-offs; marketing adjectives are cut.
- Never invent customers, testimonials, logos, ratings, metrics, awards, press,
  team members, or addresses. When proof is missing, leave it out or mark a
  visible draft placeholder that cannot ship unnoticed.
- Microcopy matters: form labels, errors, empty states, and confirmations are
  written in the product voice and tell the user what to do next.
- Match the register of the audience and platform. A council website, a music
  festival, and an API product each have a correct tone; "friendly SaaS" is
  not universal.

## Imagery priority

Use the first available source; do not skip levels to reach a prettier one.

1. Supplied brand assets: logos, illustrations, photography, brand patterns.
2. Supplied product imagery: real screenshots, products, dishes, rooms, work.
3. Real project assets already in the repository or CMS.
4. Appropriately licensed or sourced imagery when tools and license permit,
   chosen for specificity to this product, credited when required.
5. Generated imagery only when the brief explicitly allows it, under a coherent
   art direction, and never to imply real people, customers, or products.

No image is better than a meaningless one. A typography-led composition is a
valid answer to missing imagery.

## Image implementation

- Size images for their rendered dimensions; provide `srcset` and `sizes` or
  the framework's image component.
- Encode as AVIF or WebP with a fallback where the platform requires it;
  compress to the quality the content needs.
- Always set intrinsic `width` and `height` or `aspect-ratio` to prevent
  layout shift.
- Art-direct crops with `<picture>` or `object-position` when the focal point
  changes between widths.
- Keep the LCP image eager with high fetch priority; lazy-load everything
  below the fold.
- Never bake text into images; keep captions and credits as HTML.

## Alt text decisions

- Decorative or redundant with adjacent text: `alt=""`.
- Informative: describe what the image conveys in context, concisely, without
  "image of".
- Functional (inside a link or button): describe the destination or action.
- Complex (charts, diagrams): a short alt plus a text alternative nearby.
- Product photography: name the product and the distinguishing attribute shown.
