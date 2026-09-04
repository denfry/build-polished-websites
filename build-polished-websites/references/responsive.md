# Responsive composition

Breakpoints are where layout changes; they are not the design. The mobile
layout must be composed on purpose, and every width in between must be checked,
not assumed.

## Contents

1. Compose, do not collapse
2. Viewport matrix
3. What to check at each width
4. Techniques that survive real content

## Compose, do not collapse

Before writing desktop CSS, decide the phone layout:

- What is the first screen on a 375-wide phone? It should carry identity,
  the main content unit, and the primary action, in that order of importance
  for this archetype.
- Which elements are reordered, resized, merged, or dropped on mobile? Write
  the list. A layout with no changes other than stacking is not composed.
- How does navigation transform: priority items visible, the rest behind a
  disclosure with a real label, or a bottom bar for app-like tasks?
- How do tables, schedules, and comparisons transform: column priority,
  card-per-row, horizontal scroll with a visible affordance, or a different
  data view?
- Where do sticky elements live, how tall are they together, and do they leave
  the content readable in landscape?

Then design the wide layout and let the intermediate widths be the proof that
both were designed.

## Viewport matrix

Verify every critical route at approximately:

| Width | Represents | Why it matters |
|---|---|---|
| 320 | narrow phones, large text settings | wrapping, long words, minimum tap targets |
| 375 × 812 | common phone | the mobile composition itself |
| 768 × 1024 | tablet portrait | two-column decisions, nav transformation |
| one awkward width | between your breakpoints (for example 900 or 1100) | orphaned columns, squeezed grids |
| 1440 × 900 | common desktop | the desktop composition |
| 1920+ | wide desktop, when the layout has a wide variant | line length, max-width, stretched media |
| landscape phone (about 812 × 375) | video, games, sticky UI | sticky bars eating the viewport |

Also check 200% browser zoom at 1280 wide, which behaves like a 640-wide
layout with large text, and a dynamic viewport where the browser chrome
collapses (`dvh` versus `vh`).

## What to check at each width

- **Line length:** roughly 45 to 75 characters for reading text; shorter for
  captions and UI.
- **Image cropping:** focal points survive; art direction with `<picture>` or
  `object-position` where a single crop fails.
- **Navigation:** transformation is intentional, labeled, keyboard operable,
  and closes predictably.
- **Tables and data:** no horizontal page scroll; overflow scrolls inside a
  container with a visible cue.
- **Long words and translations:** headings and buttons tolerate 30% longer
  text and single long tokens (`overflow-wrap: anywhere` where appropriate).
- **Touch targets:** at least about 44 × 44 CSS pixels for primary controls,
  with spacing between adjacent targets.
- **Sticky UI:** headers, bars, and banners together leave most of the
  viewport for content; nothing sticky covers focused inputs.
- **Viewport units:** `100vh` heroes overflow on mobile browsers; prefer
  `min-height` with `dvh` or `svh`, and never rely on exact viewport height for
  critical content.
- **Safe areas:** on notched devices, sticky bottom bars respect
  `env(safe-area-inset-bottom)`.
- **Zoom and reflow:** at 200% zoom and 320 width, all content and function
  remain available without two-dimensional scrolling for text.
- **Motion:** any reveal or parallax behaves at every width and under
  `prefers-reduced-motion`.

## Techniques that survive real content

- Fluid type and spacing with `clamp()` bounded by content needs, not
  viewport spectacle.
- Intrinsic layouts: `grid-template-columns: repeat(auto-fit, minmax(...))`,
  `flex-wrap`, `min()` and `max()`, container queries for components used in
  several contexts.
- Content-based breakpoints: change layout where the content breaks, not at
  device marketing sizes.
- Reserved space for media with `aspect-ratio` or intrinsic `width` and
  `height`, so no layout shift when images or embeds load.
- Test with real or realistic content lengths: the longest product name, a
  headline in German, an empty description, a 4-line button label.
