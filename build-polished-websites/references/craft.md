# Craft: from direction card to finished surface

## Contents

1. Tokens first
2. Typography
3. Colour
4. Space and layout
5. Surfaces and depth
6. Imagery without a photographer
7. Motion
8. Interaction and finishing details
9. The signature moment
10. Common craft errors

## Tokens first

Turn the direction card into custom properties before styling any component.
Components consume tokens; they never invent raw values. One file, one place to
change the whole direction.

```css
:root {
  /* type */
  --font-display: "Newsreader", "Iowan Old Style", Georgia, serif;
  --font-text: "Public Sans", system-ui, sans-serif;
  /* colour: see Colour */
  /* space: 4px base, named steps */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.5rem; --space-6: 2rem; --space-7: 3rem; --space-8: 4rem;
  --space-9: 6rem; --space-10: 8rem;
  /* shape */
  --radius-1: 2px; --radius-2: 6px;
  /* motion */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-1: 140ms; --dur-2: 240ms; --dur-3: 480ms;
}
```

The values above are a format example, not a direction.

## Typography

Typography is the cheapest and largest lever. Most generic pages fail here
first: default sizes, one weight, crushed or loose tracking, and paragraphs
running the full container width.

**Scale.** Pick a ratio from the direction: about 1.2 for reading and
operational interfaces, 1.25–1.333 for marketing pages, 1.5 or more for poster
directions. Make it fluid with `clamp()`:

```css
:root {
  --step--1: clamp(0.84rem, 0.81rem + 0.14vw, 0.92rem);
  --step-0: clamp(1rem, 0.95rem + 0.24vw, 1.13rem);
  --step-1: clamp(1.2rem, 1.12rem + 0.42vw, 1.41rem);
  --step-2: clamp(1.44rem, 1.31rem + 0.68vw, 1.76rem);
  --step-3: clamp(1.73rem, 1.52rem + 1.05vw, 2.2rem);
  --step-4: clamp(2.07rem, 1.75rem + 1.6vw, 2.75rem);
  --step-5: clamp(2.49rem, 2rem + 2.44vw, 3.43rem);
  --step-6: clamp(2.99rem, 2.25rem + 3.67vw, 4.29rem);
}
```

**Base settings.**

```css
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  font-family: var(--font-text);
  font-size: var(--step-0);
  line-height: 1.55;
  font-kerning: normal;
  font-optical-sizing: auto;
  font-synthesis: none;            /* no fake bold or italic */
}
h1, h2, h3 { font-family: var(--font-display); line-height: 1.08; text-wrap: balance; }
p, li, figcaption, blockquote { text-wrap: pretty; }
.prose { max-inline-size: 66ch; }
time, .price, table, .figures { font-variant-numeric: tabular-nums; }
.label { font-size: var(--step--1); letter-spacing: 0.04em; }
```

**Tracking follows size.** Display sizes above about 64 px: −0.01 to −0.03em.
Headings: 0 to −0.015em. Body: 0. Short uppercase or small-caps labels: +0.04 to
+0.08em. Never track body text, and never apply one negative value to every
heading.

**Leading follows size and measure.** Display 0.95–1.1, headings 1.1–1.25,
body 1.45–1.7, long-form serif text 1.6 or more. Wider measures need more
leading.

**Hierarchy beyond size.** Use weight, case, colour, space, and position before
adding another size step. Three weights per family at most.

**Language-aware typesetting.**

- Set `lang` on `html` and on passages in another language; hyphenation,
  quotes, and screen readers depend on it. `hyphens: auto` helps narrow
  columns.
- Use the language's quotation marks: “ ” in English, « » with „ “ inside in
  Russian, „ “ in German.
- Russian: a no-break space before every em dash so it never starts a line,
  no-break spaces after one- and two-letter words
  (в, и, с, к, о, у, а, на, по, до, не) and between numbers and units
  (10&nbsp;км, 1&nbsp;500&nbsp;₽). Format numbers with
  `Intl.NumberFormat("ru-RU")`.
- Use real typographic characters: … – — × ′ ″ and the correct apostrophe.

**Font loading.** At most two families and four files on the critical path.
With the Google Fonts CSS2 API, request only the weights and axes the card
names (ranges like `wght@400..700` for variable fonts) and check the Network
panel or Lighthouse for the actual file count.
Preload only the face used by the LCP text. Use `font-display: swap` and tune a
metric-compatible fallback so the swap does not shift layout:

```css
@font-face {
  font-family: "Display Fallback";
  src: local("Georgia");
  size-adjust: 104%;          /* tune these three until the swap is invisible */
  ascent-override: 92%;
  descent-override: 24%;
}
```

## Colour

**Build palettes in OKLCH.** Lightness is perceptual, so steps look even and
contrast is predictable. Tint neutrals toward the direction's hue with a very
low chroma: the page gains a temperature without turning into cream.

```css
:root {
  --hue: 245;                                   /* from the source world */
  --ground:  oklch(98.6% 0.004 var(--hue));
  --surface: oklch(96.2% 0.007 var(--hue));
  --line:    oklch(88% 0.012 var(--hue));
  --muted:   oklch(50% 0.02 var(--hue));
  --ink:     oklch(21% 0.02 var(--hue));
  --accent:  oklch(55% 0.17 150);
  --on-accent: oklch(99% 0.01 150);
  --accent-hover: color-mix(in oklch, var(--accent), var(--ink) 16%);
  --focus: color-mix(in oklch, var(--accent), white 10%);
}
```

**Roles, not swatches.** Every colour has one job. The accent marks action,
state, or the single most important thing in a view, and usually covers less
than a tenth of the screen. If everything is accented, nothing is.

**Choose a colour strategy deliberately:** tinted neutral plus accent; full
colour-field sections; monochrome plus photography; duotone; two spot inks;
tonal (one hue across many lightnesses); or dark ground with light-emitting
accents. "Neutral plus orange" is one option among seven, not the default.

**Contrast.** Body text at least 4.5:1, large text and essential UI boundaries
at least 3:1, in every state. Muted text on light grounds rarely works above
about 55% OKLCH lightness. Check hover, focus, disabled, and selected states,
and check the palette in grayscale (`snap.mjs --gray`): hierarchy should survive
without hue.

**Dark themes.** Ground at 14–20% lightness, not `#000`. Raise surface
lightness with elevation instead of adding shadows. Body text near 90%
lightness, not pure white. Lower accent chroma slightly to avoid glare.

**Gradients** are acceptable when the source world produces them (sky, metal,
light falloff on a product) and built from palette colours. A gradient chosen
to "add depth" is decoration.

## Space and layout

**Rhythm.** Use the space scale only. Vary section padding by content weight:
a dense index can sit tight; a single statement needs room. Identical padding on
every section produces the template feel.

**A breakout grid** keeps reading text at a comfortable measure while letting
media and feature blocks run wider or full bleed:

```css
.content-grid {
  --gutter: clamp(1rem, 4vw, 2.5rem);
  --content: 68ch;
  --breakout: calc((84rem - var(--content)) / 2);
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [breakout-start] minmax(0, var(--breakout))
    [content-start] min(100% - var(--gutter) * 2, var(--content)) [content-end]
    minmax(0, var(--breakout)) [breakout-end]
    minmax(var(--gutter), 1fr) [full-end];
}
.content-grid > * { grid-column: content; }
.content-grid > .breakout { grid-column: breakout; }
.content-grid > .full { grid-column: full; }
```

**Asymmetry.** A 12-column grid with uneven spans (for example 1 / 8 and
9 / 13) and content hanging from shared lines creates tension without chaos.
Break the grid only for a reason the content supplies.

**Alignment.** Use `grid-template-rows: subgrid` so titles, text, and actions
line up across cards of different lengths. Use container queries
(`container-type: inline-size`) so components adapt to their slot rather than
the viewport. Use `:has()` for state-driven layout without JavaScript.

**Mobile recomposition** is a design pass, not a collapse:

- reorder so the primary action and the essential facts (date, price, hours,
  location) come early;
- reduce the type ratio; a 7rem desktop headline becomes about 2.6–3.2rem;
- turn wide tables into stacked records or a horizontally scrolling region with
  a visible edge and keyboard access;
- turn long galleries and lists into `scroll-snap` rails with a visible next
  item;
- keep tap targets at least 44 × 44 px and respect `env(safe-area-inset-*)`.

## Surfaces and depth

- **Borders:** 1 px in a role colour (`--line`) or `color-mix()` of ink into
  ground; avoid pure grey on a tinted ground.
- **Radii:** one small scale. Nested radius equals outer radius minus the
  padding between them. Mixing sharp and round requires a rule (for example
  controls round, containers sharp).
- **Shadows:** layered, low-opacity, tinted by the ground hue, with one
  elevation system:

```css
:root {
  --shadow-1: 0 1px 1px oklch(20% 0.02 var(--hue) / 0.06),
              0 2px 4px oklch(20% 0.02 var(--hue) / 0.06);
  --shadow-2: 0 1px 2px oklch(20% 0.02 var(--hue) / 0.05),
              0 8px 16px -4px oklch(20% 0.02 var(--hue) / 0.08),
              0 24px 40px -12px oklch(20% 0.02 var(--hue) / 0.12);
}
```

- **Texture:** only when the source world has it, at low opacity, never over
  text-heavy areas, and never as `position: fixed` over the whole page by
  reflex.

## Imagery without a photographer

Many generated pages fail because they have no images and fill the gap with
icons, blobs, or empty boxes. Decide the imagery plan in the direction card and
work down this list:

1. **Supplied assets.** Ask for brand photos, product shots, logos, and
   documents. Real material outranks anything you can make.
2. **Stock photos and video** that match the direction card (see Stock media
   below). Curate them like a photo editor; one off-direction image breaks the
   whole page.
3. **Generated images,** when an image tool is available and the user allows
   it. Write an art-direction prompt, not a subject line: subject and action,
   setting, lens and framing, light (time of day, direction), palette from the
   card, era and texture, and "no text, no logos". Generate a consistent set
   with the same light and treatment, and never present a generated image as a
   real person, place, or product photograph when that would mislead.
4. **Built imagery.** Things you can make well in code:
   - product UI rebuilt in HTML/CSS with realistic data;
   - SVG diagrams, maps, floor plans, timelines, schedules, and route lines;
   - data graphics from real numbers;
   - typographic compositions where type is the image;
   - patterns and marks derived from the logo or the source world.
5. **Honest placeholders.** Art-directed frames that state the intended shot,
   at the final aspect ratio, filled with a palette tone. They look intentional
   and tell the client exactly what to supply:

```html
<figure class="photo-slot" style="aspect-ratio: 4 / 5">
  <figcaption>Photo to supply: loaves cooling on the oven ledge, early side
  light from the street window, 4:5 crop.</figcaption>
</figure>
```

Never hotlink random stock, use unlicensed images, or leave grey boxes.

**Treatment.** Pick at most two aspect ratios and use them consistently. Set
the focal point with `object-position`. Unify mixed sources with one treatment
(duotone, grayscale, consistent colour grade). Caption images where the
archetype expects it.

**Delivery.** Give every image `width` and `height` or `aspect-ratio`. Serve
AVIF/WebP with `srcset` and `sizes`. The LCP image gets
`fetchpriority="high"` and is never lazy-loaded; everything below the fold gets
`loading="lazy"` and `decoding="async"`.

### Stock media

**Sources.** Unsplash and Pexels (photos; Pexels also video), Pixabay (photos,
video, illustrations), Mixkit and Coverr (video), Openverse and Wikimedia
Commons (mixed Creative Commons licences, check each item). Use the official
API when one exists and the project has a key; otherwise download from the
item page. Follow each provider's terms: some APIs require hotlinking their
URLs and attribution, while downloaded files should be served locally.

**Licence discipline.** Verify the licence of every single asset on its own
page, never by site reputation. Record source URL, author, licence, and date in
`CREDITS.md` (or the CMS media library) and add visible credits where the
licence requires them. Avoid recognisable people, logos, trademarks, and
private property in contexts that imply endorsement; avoid stock for anything
that claims to show the client's real team, premises, or customers.

**Curation.** Search with art-direction words from the card (light, lens,
palette, era, mood), not just the subject. Pick a set with the same light
temperature, contrast, and grain; reject the over-familiar shots (handshakes,
laptops on cafe tables, people pointing at screens, latte-art flatlays). Grade
the set into one look with a consistent crop and, when needed, a shared CSS
treatment.

**No network or no access?** Leave art-directed slots whose captions contain
the exact search query and orientation to use, so the client can fill them in
minutes.

**Optimisation.** Download the original, crop to the design's aspect ratios,
and export AVIF/WebP at 2–3 widths for `srcset`. Hero images rarely need more
than 200–350 KB; thumbnails 30–80 KB.

**Video.** Use video when motion carries information or atmosphere a still
cannot.

```html
<video autoplay muted loop playsinline preload="metadata"
       poster="/media/harbour-poster.avif" width="1600" height="900"
       aria-label="Cranes moving over the harbour at dusk">
  <source src="/media/harbour.av1.webm" type='video/webm; codecs="av01.0.05M.08"'>
  <source src="/media/harbour.h264.mp4" type="video/mp4">
</video>
```

- Background loops: 6–15 s, no sound, 1–4 MB, 720–1080p, trimmed and
  re-encoded (for example `ffmpeg -an -vf scale=1280:-2 -crf 30`).
- The poster image is the LCP candidate and must look finished on its own.
- Provide a visible pause control; under `prefers-reduced-motion: reduce`, do
  not autoplay and show the poster.
- Never put essential text inside video; keep overlaid text on a treated area
  with verified contrast.
- Lazy-load below-the-fold video by setting `src` when it nears the viewport.

### Shapes beyond rectangles

Rectangles are a default, not a law. When the source world has a shape
(an oven arch, a ticket stub, a torn poster, a hull, a leaf, a speech bubble, a
pill bottle), use it, but on a few elements, consistently.

```css
.arch    { border-radius: 50% 50% 0 0 / 30% 30% 0 0; }            /* window or oven arch */
.ticket  { mask: radial-gradient(circle 0.9rem at 0 50%, #0000 98%, #000) left,
                 radial-gradient(circle 0.9rem at 100% 50%, #0000 98%, #000) right;
           mask-size: 51% 100%; mask-repeat: no-repeat; }           /* notched ticket */
.slant   { clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%); }      /* diagonal section edge */
.hull-cutout { clip-path: url(#hull-shape); }                       /* SVG clipPath from the brand mark */
.wrap-around { float: left; shape-outside: circle(50%); clip-path: circle(50%); }
```

- Use SVG `clipPath` or `mask` for complex silhouettes (torn paper, logo
  shapes, coastlines); `clipPathUnits="objectBoundingBox"` keeps them
  responsive.
- `shape-outside` lets text wrap around round or angled images in editorial
  layouts.
- Diagonal and curved section edges must not cut through text; add padding
  equal to the cut depth.
- Clipping also clips focus outlines and shadows: put the clip on an inner
  media element, not on the focusable control, or draw focus inside.
- Simplify or drop complex shapes on mobile when they waste width.
- Organic "blob" shapes with no source in the subject are a fingerprint, not a
  shape language.

**SVG illustration rules.** One stroke width, colours from tokens via
`currentColor` or custom properties, geometric construction, consistent corner
treatment. No blob shapes, random gradients, or mixed icon sets.

## Motion

Motion explains change: where something came from, what it became, what is
now in focus. Define two or three durations and easing curves in tokens and use
nothing else.

- UI feedback 120–200 ms; panels and reveals 240–480 ms; nothing that blocks
  input.
- Animate `transform` and `opacity`; avoid animating layout properties.
- Content must be visible without JavaScript and without animation support.
  Never ship content at `opacity: 0` waiting for a script to reveal it.
- Respect `prefers-reduced-motion`: replace movement with instant or opacity
  changes, stop autoplay and marquees, and provide pause controls for anything
  that moves for more than five seconds.

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 5% cover 25%;
    }
    @keyframes reveal { from { opacity: 0; translate: 0 1.25rem; } }
  }
}
@view-transition { navigation: auto; }   /* multi-page sites, same origin */
```

Stagger only when the order carries meaning (a sequence, a ranking, a
timeline). Reveal-on-scroll on every section is a fingerprint, not a direction.

## Interaction and finishing details

Check each item; together they separate a finished site from a mockup.

- Focus: a visible `:focus-visible` style designed from the palette, with
  offset, on every interactive element.
- Hover changes something meaningful (underline, fill, arrow movement) and is
  never the only cue.
- Active and pressed states give immediate feedback.
- Links: `text-underline-offset: 0.18em`, `text-decoration-thickness` tuned to
  the typeface, a distinct visited state for content sites.
- Forms: labels always visible, helpful hints, inline errors tied with
  `aria-describedby`, focus moved to the first error, `accent-color` for native
  controls, and designed success states.
- Buttons and inputs share one height scale and one radius rule.
- Icons: one set, one stroke width, optically centred, sized to the text they
  accompany. No emoji as icons.
- `::selection` in palette colours; `caret-color` matched to the accent.
- Anchored headings use `scroll-margin-top` to clear sticky headers; smooth
  scrolling only under `prefers-reduced-motion: no-preference`.
- Favicon (an SVG data URI works for single-file builds), `theme-color`, title,
  description, Open Graph image.
- Prices, times, and tables use tabular numerals; currencies and dates follow
  the locale.
- Empty, loading, error, offline, and 404 states are designed.
- A print stylesheet for content and menu pages.
- Sticky headers stay compact and never cover more than about a tenth of a
  mobile viewport.

## The signature moment

Each site gets one memorable element that could only belong to it, derived
from the source world and written in the direction card. Examples of the shape
(not to reuse):

- a bakery's bake board that shows what is still on the shelf today;
- a festival timetable that highlights what is playing now on each stage;
- a law practice's first-consultation walk-through that answers "what will
  happen to me";
- a ceramics shop where each piece turns over to its glaze recipe;
- a museum page whose opening hours render as the building's floor plan lit by
  open rooms.

Rules: it works with keyboard and screen readers, degrades to static content
without JavaScript, respects reduced motion, stays within the performance
budget, and appears once, not on every section.

## Common craft errors

| Error | Fix |
|---|---|
| Everything centered | Left-align reading text; center only short, symmetrical statements |
| Same padding on every section | Vary spacing by content weight from the scale |
| Body text in light grey | Keep muted text at contrast ≥ 4.5:1; use size and weight for hierarchy instead |
| Orphaned single word on a heading line | `text-wrap: balance`, rewrite, or adjust the measure |
| Long lines on wide screens | Constrain reading text to 60–75ch |
| One negative letter-spacing for all headings | Track by size; check at mobile sizes |
| Thin weights at small sizes | 400 or heavier below about 18 px |
| ALL CAPS sentences | Caps only for short labels, with positive tracking |
| Mixed radii and shadow styles | One radius scale and one elevation system |
| Icons of different weights and sizes | One set, one stroke, sized to text |
| Buttons of different heights in one row | Shared control height token |
| Decorative effect fills a content gap | Fill the gap with content, or remove the space |
| Desktop hero squeezed into mobile | Recompose: smaller ratio, essential facts first |
