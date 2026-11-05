# Design review loop

## Contents

1. Capture
2. Look before scoring
3. Blocking defects
4. Score
5. Fix and repeat
6. Mechanical scan
7. Evidence

Reading code is not looking. A page is reviewed only when its rendered
screenshots have been opened and examined at several widths.

## Capture

Serve the site (or use the built HTML file directly) and run:

```bash
node <skill-dir>/scripts/snap.mjs <url-or-file> [more pages] --gray [--out <dir>]
```

It needs Node 22+ and a local Chrome, Chromium, or Edge (`CHROME_PATH`
overrides discovery). For every page it captures 375, 768, 1100, and 1440 px
(`--widths` changes them) and writes:

- `<page>-<width>.png`: the first screen exactly as a visitor sees it;
- `<page>-<width>-sheet.png`: the whole page cut into screen-height slices
  laid side by side, legible in one image;
- `<page>-<width>-full.png`: the raw full-page capture;
- `<page>-<width>-gray.png` with `--gray`: the first screen in grayscale.

It also prints horizontal overflow and the elements causing it, console errors,
failed requests, which web fonts actually loaded, title, `lang`, viewport meta,
`h1` and `main` counts, images without `alt`, and small tap targets. Add
`--dark` or `--reduced-motion` to check those modes.

The script scrolls the page before the full capture so scroll-triggered content
renders. If a sheet still shows blank sections, content is hidden behind
JavaScript or animation: that is a defect, not a capture problem.

Use the agent's own browser tools as well when interaction matters. Minimum
interaction checklist:

- Tab through the whole page once: focus is visible everywhere, order is
  logical, nothing is trapped;
- hover and active states of the primary action and navigation;
- open and close every menu, dialog, tab set, and accordion with the keyboard;
- submit each form empty, with one invalid field, and valid: errors are
  announced and focused, success is designed;
- for time-dependent states (open now, playing now, sold out, countdowns),
  fake the clock (override `Date` or pass a query parameter) and check before,
  during, after, and closed-day cases.

## Look before scoring

Open every sheet and every first screen. Then:

1. **Stranger test.** From the first screen alone, write three short answers:
   what is this, who is it for, what should I do next. If the answers are vague
   or would fit a competitor, identity and hierarchy are weak.
2. **Squint test.** Blur your attention: one element should dominate each view,
   and the reading path should be obvious.
3. **Grayscale test.** In the `-gray` capture, hierarchy must survive without
   hue.
4. **Swap test.** Imagine an unrelated business's copy in this layout. If it
   would still work, the structure is generic.
5. **Fingerprint test.** Compare against the model-default fingerprints in
   [visual-direction.md](visual-direction.md). Count those the source world did
   not produce.
6. **Card test.** Compare the screenshots with the direction card field by
   field. Sections that drift from the card (usually the lower half of the
   page) are defects.

## Blocking defects

Fix these before scoring anything else:

- horizontal overflow; clipped, overlapping, or truncated text;
- console errors, failed requests, or web fonts that did not load;
- content invisible after scrolling (stuck reveal animations, JS-dependent
  content);
- text with insufficient contrast, or text over imagery without treatment;
- a heading line holding a single orphaned word;
- broken images, empty grey boxes, unlabelled placeholder areas;
- primary action missing from the mobile first screen when the archetype needs
  it (booking, tickets, purchase, contact);
- sticky header covering anchored headings or a large share of the mobile
  viewport;
- interactive elements without visible focus.

## Score

Score each dimension from 1 to 5. Ship only when every dimension is at least 4
and no blocking defect remains.

Calibration: 3 means a stranger would notice a flaw in that dimension without
being asked; 4 means a designer would find only minor issues; 5 means the
dimension is a reason to remember the page. When unsure between two scores,
give the lower one and name the defect that keeps it there. Self-review is
lenient by nature, so every score of 4 or 5 needs one sentence of evidence
from the screenshots.

| Dimension | A 5 looks like | Typical 2–3 tells |
|---|---|---|
| Concept fidelity | the direction card visibly drives every section | the hero follows the card, the rest is template |
| Hierarchy | one dominant element per view; obvious scan path | competing focal points; everything bold or everything quiet |
| Typography | deliberate scale, measure, leading, tracking by size | default sizes; long lines; crushed display tracking; widows |
| Colour | clear roles; scarce accent; contrast passes in all states | accent everywhere; muddy greys; low-contrast muted text |
| Composition and rhythm | varied, purposeful pacing; shared alignment lines; designed transitions | the same centered stack repeated; random gaps |
| Imagery | every visual has a job and a consistent treatment | icons as filler, empty boxes, decorative blobs |
| Detail craft | consistent radii, borders, icons, control heights, states | misaligned baselines, mixed styles, unstyled focus |
| Mobile composition | recomposed; essentials early; comfortable targets | squeezed desktop; giant headline pushing content away |
| Distinctiveness | fails the swap test; the signature moment lands | swap test passes; two or more unjustified fingerprints |
| Content truth | specific, sourced, honest | vague claims, invented proof, filler copy |

## Fix and repeat

1. List the three highest-impact defects across all widths, worst first.
2. Fix them at the token or layout level where possible rather than with
   one-off overrides.
3. Re-capture and re-score.

Run at least two passes. The first pass usually catches broken things; the
second catches rhythm, mobile composition, and drift from the card. A pass that
only changes colours has not fixed composition defects. If concept fidelity or
distinctiveness is still 2 or lower after two passes, return to the candidate
directions instead of polishing a default.

## Mechanical scan

```bash
node <skill-dir>/scripts/slop-scan.mjs <source-or-build-directory-or-files>
```

Scan one site or one project at a time: signals and class usage are counted
across all files passed together. The scanner reports first-generation template signals, second-generation
fashionable defaults, stock phrases (English and Russian), unverified social
proof, and placeholder content, with file and line. Score 0–3 is low, 4–7 needs
review, 8 or more usually means a default direction. For each signal, either
remove it or name in the direction card the brief-specific reason it exists.
`--json` prints machine-readable output; `--max-score <n>` exits non-zero above
a threshold for CI use.

A clean scan proves only the absence of known tells. The screenshots decide.

## Evidence

Report for the final pass:

- the score per dimension and the defects fixed in each pass;
- widths captured and the screenshot directory;
- overflow, console, request, and font results from `snap.mjs`;
- the `slop-scan.mjs` score and the justification for any remaining signal.
