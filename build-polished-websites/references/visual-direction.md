# Art direction and anti-slop review

## Contents

1. Why generated sites look generated
2. Mine the subject's world
3. Generate three candidates, then choose
4. The direction card
5. Model-default fingerprints
6. Composition principles
7. Copy

## Why generated sites look generated

Generic output does not come from one bad technique. It comes from skipped
decisions: when nothing specific is chosen, every choice falls to the most
probable value, and the most probable values are the same for every brief.

Those values move over time. The first generation was purple gradients, glass
cards, and centered heroes. Agents told to "avoid AI slop" now land on a second,
fashionable default: warm cream "paper", a terracotta or acid-lime accent, a
huge tightly tracked headline with one coloured or italic word, monospace
uppercase labels above every section, 01/02/03 numbering, hairline rules, grain,
and hard offset shadows. Each piece looks tasteful. Together they look the same
for a bakery, a law firm, and an incident-response tool.

Avoiding a list of bad patterns therefore produces the next default, not a good
site. Work from a positive chain instead: a source world, three candidate
directions, a direction card with concrete values, and a screenshot review
([design-review.md](design-review.md)).

## Mine the subject's world

Before choosing any colour or font, list at least eight concrete things from the
subject's own world: objects, materials, documents, places, tools, signage,
rituals, sounds, and era. Generic metaphors such as "journey", "growth", or
"connection" do not count.

Pick one or two as the **source**: the thing whose visual language the site
borrows. Extract from it:

| From the source | Becomes |
|---|---|
| Printed matter on it: labels, tickets, forms, signage, packaging | type genre, case, weight, numerals |
| Its real colours, as photographed rather than imagined | palette and colour roles |
| How it is organised: grid, list, timetable, map, ledger, shelf | layout silhouette and navigation |
| Its surfaces, edges, and materials | borders, radii, depth, texture |
| How it moves or changes state | motion vocabulary |
| What only this subject has, not its whole category | the signature moment |

Illustrations of the method (do not reuse them as directions):

- **Ferry operator** → departure boards, hull numbers, safety placards, tide
  tables. Condensed signage sans with tabular numerals; hull navy, lifebuoy
  orange, white; timetable rows act as navigation; signature: a live
  next-departure board.
- **Ceramics studio** → glaze test tiles, kiln logs, clay bodies, cone
  temperatures. Palette sampled from glaze tiles (celadon, tenmoku brown, shino
  white); works shown as a tile grid with glaze codes; signature: each work
  turns over to its glaze recipe card.
- **Tax adviser** → statute paragraphs, filing calendars, receipts, boxed forms.
  Sober text serif with form-style labels; the opening is the filing calendar;
  signature: countdown to the client's next deadline.
- **Climbing gym** → route tags, chalk, grade scales, resin holds. Hold colours
  on raw concrete grey; routes as colour-coded tags; signature: the grade scale
  is the navigation.

When the brand already has a system, the brand is the source. Extend it with
the same method instead of replacing it.

## Generate three candidates, then choose

Write three one-line directions that differ on at least three of these axes:

- value: light, dark, mid-tone, or full colour-field;
- type genre: grotesk, humanist, geometric, old-style serif, transitional,
  didone, slab, mono, or expressive display;
- page silhouette from [site-archetypes.md](site-archetypes.md);
- density: showcase, reading, index, or operational;
- image mode: photography, illustration, built UI, typography as image, data,
  or map;
- colour temperature and saturation.

Use [aesthetic-directions.md](aesthetic-directions.md) to widen the range: it
gives twenty direction families with concrete starting values. Adapt a family
to the source world; never paste it unchanged.

Discard any candidate that depends on fingerprints from the list below that the
source world did not produce. Choose the remaining candidate that is most
specific to the subject and best serves the primary action. Not the safest, not
the loudest.

When the user is actively collaborating on a substantial project, show the three
candidates in a few lines and let them choose. Otherwise choose and proceed.

## The direction card

Write the card before code and include it in the final report. Every field
takes a concrete value; the values become CSS custom properties verbatim.

```text
Source world:     the objects and materials the language is borrowed from
Thesis:           one sentence: what it looks like and why, tied to the audience
Adjectives:       three testable adjectives; not <one anti-goal>
Type:             display family, weights, case; text family; numerals
                  (tabular or oldstyle); script support checked for <languages>
Palette:          ground; ink; accent and the only things it marks; supporting
                  colours; semantic ok/warn/error
Layout:           silhouette; grid and measure; density; navigation model
Shape & surface:  radius scale; border treatment; elevation; texture (none, or
                  what and why)
Imagery:          mode; source (supplied, generated, built, or placeholder);
                  treatment (crop ratios, colour handling, captions)
Motion:           durations; easing; what moves and why; reduced-motion behaviour
Signature moment: one memorable element derived from the source world
Default check:    fingerprints present, each with its brief-specific reason, or none
```

## Model-default fingerprints

Use this list to review a direction and its output. Do not generate from it:
avoiding items is not a direction.

**First generation (classic template)**

- purple, indigo, or violet gradients; gradient-filled headline text;
- blurred glow blobs, orbs, sparkles, dot grids, or grid-line backdrops as filler;
- glassmorphism as the main idea; every section in a floating rounded card;
- centered hero with badge pill, gradient headline, two buttons, and dashboard
  mockup;
- three equal feature cards with icons in tinted rounded squares;
- emoji used as icons; pill-shaped everything;
- Inter, Roboto, Poppins, or Montserrat with no typographic decision behind it;
- "Trusted by" logo strips, invented metrics, invented testimonials.

**Second generation (fashionable default)**

- warm cream, beige, or "paper" ground (`#f3f0e6`-like) as the starting point;
- terracotta, vermilion, burnt orange, or acid lime as the single accent;
- giant display headline tracked tighter than −0.04em with one word in the
  accent colour or a serif italic;
- monospace uppercase tracked "eyebrow" labels above every section;
- 01/02/03 section numbering and hairline-ruled lists everywhere;
- hard offset "neo-brutalist" shadows on buttons and cards;
- grain or noise over the whole page;
- split hero with copy on the left and a dark terminal or log panel on the right;
- Instrument Serif, Fraunces, Space Grotesk, Space Mono, Syne, or mono labels
  as the reflex choice;
- an infinite marquee of keywords;
- "field notes", "manual", "index", or "almanac" framing applied to subjects
  that are none of those.

A fingerprint is acceptable only when you can name the specific object in the
source world that produces it, in the direction card: a bakery whose
real bags are kraft paper, a developer tool whose product is a terminal, a
festival whose posters really are numbered. Two or more fingerprints that the
source world did not produce mean the direction is a default; return to the
candidates. [`scripts/slop-scan.mjs`](../scripts/slop-scan.mjs) detects many of
them mechanically.

Never ban a technique categorically. Require it to serve the source, the
hierarchy, or the interaction.

## Composition principles

- The first screen communicates identity, value, and next action.
- The page has a silhouette you could recognise as a thumbnail.
- One element dominates each view; avoid five competing focal points.
- Dense and sparse passages alternate for a reason the content supplies.
- Grids align content; break them only to create meaning.
- Reading copy stays within roughly 45–75 characters per line.
- Transitions between sections are designed, not only the sections.
- Whitespace is structure, not a substitute for content.
- Mobile is recomposed for a thumb and a narrow column, not merely stacked.
- Do not default to a centered hero. The opening may be an index, product grid,
  schedule, map, article lead, project reel, menu, search surface, calendar, or
  operational overview.

## Copy

Write or gather real copy at real length before laying out sections. Layout
built around placeholder rhythm collapses when real text arrives, and vague
filler is the fastest route to a generic page.

Use specific nouns, verbs, numbers, dates, prices, names, places, and
constraints. Prefer:

> Export a signed audit report in under two minutes.

over:

> Empower your workflow with seamless insights.

The same holds in every language. In Russian, avoid bureaucratic filler and
stock claims such as «индивидуальный подход», «команда профессионалов»,
«широкий спектр услуг», and «качественно и в срок»; state the concrete service,
term, price, or guarantee instead.

Never invent customer evidence: reviews, ratings, logos, press, awards, or
usage statistics. Mark unavailable content honestly, write clearly labelled
drafts, or ask for it.

Operational facts a brief requires but does not supply (schedules, fees,
policies, bios) may be drafted when they are plausible and harmless. List every
drafted fact in the report. On the page, keep drafts visually normal for
review builds and add a single visible "draft content" notice in the footer or
the relevant section; never leave drafts unflagged on a production deploy.
Missing assets (portraits, addresses, admission years) become labelled
"to supply" slots instead of invented values. Give each image a job: explain, prove, orient, or set
tone. Decorative images get empty alt text; meaningful images get concise
contextual alt text.
