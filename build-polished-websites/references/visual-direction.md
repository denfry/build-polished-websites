# Visual direction and anti-slop review

## Contents

1. Start from product truth
2. Choose a visual system
3. Patterns to reject
4. Composition checklist
5. Copy and imagery
6. Review questions

## Start from product truth

Derive the interface from the audience, content, and desired action. Write a
one-sentence visual thesis such as:

> A precise editorial catalog with warm paper tones, compressed typography,
> and product photography treated like archival evidence.

The thesis must explain why the site looks this way. "Modern and clean" is not
a direction.

Choose the information architecture first using
[site-archetypes.md](site-archetypes.md). Visual direction controls expression;
the archetype controls what the page contains and how users move through it.
Do not use surface styling to disguise the same SaaS landing-page skeleton.

Select three adjectives that can be tested visually. Pair them with one
anti-goal:

- precise, quiet, tactile; not luxurious;
- dense, technical, kinetic; not cyberpunk;
- playful, handmade, direct; not childish.

## Choose a visual system

Define a deliberately small system before styling individual sections:

- one display face and one text face at most, unless the existing brand differs;
- one dominant neutral family, one accent, and semantic state colors;
- a spacing rhythm with a limited set of values;
- a consistent border, radius, shadow, and icon treatment;
- a type scale based on content hierarchy rather than viewport spectacle;
- a motion vocabulary with two or three durations and easing curves.

Use optical alignment and controlled exceptions. Perfectly uniform cards and
spacing can feel generated; inconsistency without a rule feels broken.

Also define one recognizable composition rule, such as:

- an editorial hierarchy where scale signals story importance;
- a catalog rhythm alternating overview and material detail;
- a chronological spine for an event or process;
- a persistent index paired with a changing reading pane;
- a poster-like field organized around date, place, and program.

Do not default to a centered hero. The opening may instead be an index, product
grid, schedule, map, article lead, project reel, search surface, or operational
overview.

## Patterns to reject

Reject these defaults unless the brief or established brand genuinely calls for
them:

- purple-blue gradients on white or black;
- glowing blobs, orbital dots, sparkles, and decorative grids;
- glassmorphism used as the main visual idea;
- a centered hero with badge, gradient headline, two buttons, and dashboard
  mockup;
- bento cards added without information-architecture value;
- every section inside a rounded floating container;
- excessive pill-shaped controls and labels;
- three equal feature cards with generic icons and vague claims;
- huge text that consumes the viewport without communicating more;
- fake metrics, fake testimonials, fake logos, or invented awards;
- stock phrases such as "revolutionize," "supercharge," "seamless," and
  "next-generation";
- indiscriminate scroll-reveal animations;
- emoji standing in for a coherent icon system;
- icons inside decorative squares by default;
- random underlines, scribbles, and gradients used to simulate personality.

Do not ban a technique categorically. Require it to serve hierarchy, brand, or
interaction.

## Composition checklist

- Make the first screen communicate identity, value, and next action.
- Create a recognizable silhouette at a glance.
- Vary rhythm intentionally: dense and sparse sections should have a reason.
- Let one element dominate; avoid five competing focal points.
- Use grids to align content, then break them only to create meaning.
- Keep line length comfortable: roughly 45–75 characters for reading copy.
- Design the transition between sections, not only the sections themselves.
- Use whitespace as structure, not as a substitute for content.
- Ensure every visual element survives mobile re-composition.

## Copy and imagery

Use specific nouns, verbs, numbers, dates, constraints, and proof. Prefer:

> Export a signed audit report in under two minutes.

over:

> Empower your workflow with seamless insights.

Do not invent customer evidence. Mark unavailable content honestly or request
it. Give each image a job: explain, prove, orient, or set tone. Decorative
images need empty alt text; meaningful images need concise contextual alt text.

Use a coherent art direction for generated images. Avoid generic 3D blobs,
floating devices, plastic people, synthetic office teams, and imagery with
illegible generated text.

## Review questions

Before shipping, ask:

1. Could this design be swapped onto an unrelated product without changes?
2. Which decision expresses this product's specific identity?
3. Is any element present only because common AI templates include it?
4. Are the strongest claims supported by content or evidence?
5. Does mobile feel composed rather than merely stacked?
6. Are interactive states as intentional as the static screenshot?
7. Would removing an effect improve clarity? If yes, remove it.
8. Does the page structure belong to its archetype, or only its styling?
9. Have at least three composition dimensions changed from the nearest existing
   template or recent project?
