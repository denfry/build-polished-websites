# Visual thesis

The visual thesis turns product facts into design decisions. It exists so the
result belongs to this product and not to a trend or to this skill.

## Contents

1. Inputs
2. Tensions to resolve
3. Writing the thesis
4. Deriving tokens
5. Preserving an existing system
6. Self-check

## Inputs

Collect these before choosing anything visual. Each one should influence at
least one decision you can point to later.

| Input | Ask | Design consequence |
|---|---|---|
| Product | What does it actually do, and what does the real artifact look like? | Composition shows the real thing; the palette can come from it. |
| Audience | Who, in what situation, on what device, with how much patience? | Density, type size, tone, interaction complexity. |
| Content | What content exists today, in what volume and quality? | Image-led vs typography-led; index vs narrative; how much the layout must tolerate long or missing content. |
| Brand | Existing colors, type, voice, and rules; what must not change? | Tokens start from brand, not from taste. |
| Primary action | The one thing a visitor should be able to do easily. | Placement, prominence, and what everything else defers to. |
| Constraints | Platform, performance budget, locales, legal, editors, timeline. | What is buildable and maintainable; what editors can vary. |

If an input is missing, say what you assumed. Do not fill gaps with fashion.

## Tensions to resolve

Decide where this product sits on each tension, and why. Use words, not
numbers. Most products sit clearly on one side; the interesting design is in
the two or three where the answer is "both, in this specific way".

- **Editorial ↔ transactional.** Is the page read or used? A menu is used; a
  feature story is read; a product page is both, in that order.
- **Quiet ↔ expressive.** How much personality can the content carry before it
  obscures the job? A hospice site and a music festival answer differently.
- **Dense ↔ spacious.** How many decisions per screen does the user want?
  Operators want density; first-time buyers want fewer, clearer choices.
- **Utilitarian ↔ atmospheric.** Does mood help the decision? Hospitality yes,
  documentation no, ecommerce depends on the product category.
- **Structured ↔ freeform.** Does a strict grid express the product's rigor, or
  does a looser rhythm express craft?
- **Image-led ↔ typography-led.** Follow the content you actually have. Weak or
  absent imagery means typography must lead; do not invent imagery to fix it.

Two products with the same archetype should resolve these differently when
their audiences or content differ. That is where diversity comes from.

## Writing the thesis

Three to five sentences, written before any CSS:

1. What the site is like, in concrete terms a reader could picture.
2. The two or three tensions that matter and how they are resolved.
3. One composition rule the whole site obeys (for example: importance shown
   by scale; a persistent index beside a changing pane; the schedule is the
   spine; every product shown at the same scale for comparison).
4. One anti-goal that names the nearest wrong direction.
5. Optionally, where the palette and type come from in the product world.

Example, for a regional bakery with a wholesale side:

> A working bakery's order board rather than a lifestyle brand: practical,
> warm, unpretentious. It is transactional first (hours, location, wholesale
> order form) and atmospheric only through real photography of bread and the
> shop. Composition rule: every page opens with today's facts before story.
> Anti-goal: artisanal minimalism with whitespace hiding the price list.

"Modern, clean, and professional" is not a thesis. If the thesis would fit an
unrelated product, rewrite it.

## Deriving tokens

Tokens make the site consistent. They must be derived, not copied.

- **Color:** start from brand or product material. Choose one neutral family
  with a warm or cool bias justified by the content, one accent tied to the
  primary action, and semantic state colors. Check contrast for text, UI, and
  states before committing.
- **Typography:** choose faces for the reading task, then for voice. Set a
  scale from actual content hierarchy: how many levels the content has, how
  long the headlines are, whether numerals are tabular. Two families at most
  unless the brand has more.
- **Spacing:** pick a base unit and a short ramp that produce the density you
  decided on. Dense products use a tighter ramp.
- **Radius, borders, shadows:** one coherent treatment. Sharp, soft, or round
  are all valid; the choice should follow the thesis, not a rule of thumb.
- **Motion:** two or three durations and easings, used only where motion
  communicates state, spatial relationship, or attention.

Vary every group from the last project you remember. If your palette, radius,
and type pairing could be pasted into an unrelated brief, they are house style,
not derived tokens.

## Preserving an existing system

When a project has a design system, brand guide, `theme.json`, Tailwind config,
Liquid settings, or established components:

- extend it; do not fork it;
- add tokens only when the thesis needs a value that does not exist;
- express new components with existing primitives first;
- record deliberate deviations and why.

A redesign that discards a working system needs explicit authorization.

## Self-check

- Could this thesis describe a different product? Rewrite it.
- Does each token group trace to an input or the thesis? Fix the ones that
  do not.
- Is the composition rule visible on mobile as well as desktop?
- Did you pick an expressive treatment because the content calls for it, or a
  restrained one because it is safe? Either can be wrong.
