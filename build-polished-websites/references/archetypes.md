# Site archetypes

Choose structure before surface. An archetype fixes what the site contains and
how people move through it; the visual thesis decides how it feels. Two sites
of the same archetype should still look different when their products differ.

## Contents

1. Selection protocol
2. Archetype profiles
3. Hybrids and route splitting
4. Diversity check

## Selection protocol

1. Name the user's main intent: learn, evaluate, buy, book, visit, participate,
   browse, publish, or operate.
2. Name the dominant content unit: story, work, product, service, place, event,
   lesson, record, metric, or task.
3. Pick the one profile below whose job matches. Add at most one secondary
   influence for expression, never for structure.
4. Sketch the page as named content blocks in reading order. Only then open
   `visual-thesis.md`.
5. Open the matching checklist in `completeness.md`.

Do not choose SaaS/product marketing unless evaluating or adopting software is
the actual intent. Do not force a conversion funnel onto sites whose job is
reading, browsing, or operating.

## Archetype profiles

Each profile lists information architecture, density, navigation, typography
roles, imagery role, conversion model, trust signals, proof format, mobile
priorities, interaction style, and common AI failures. Treat these as
tendencies to reason from, not a template to fill.

### SaaS / product landing

- **IA:** problem, how the product actually works, evidence, path to try or
  talk. Depth lives in docs, pricing, and changelog routes.
- **Density:** medium; one idea per screen, real product surface visible early.
- **Navigation:** short top bar: product, pricing, docs, sign in.
- **Typography:** headline states the concrete job; body explains mechanism;
  UI type inside product shots must be legible.
- **Imagery:** the real product, real data shapes, real integrations. Never a
  generic dashboard mock.
- **Conversion:** trial, demo, or contact with an honest next step.
- **Trust:** specific constraints, pricing clarity, security posture, docs.
- **Proof:** demonstration, limits, named integrations; logos only when real.
- **Mobile:** headline, one action, product evidence, readable pricing.
- **Interaction:** product-like states; short, meaningful motion.
- **AI failures:** centered hero, three icon cards, testimonials, pricing, FAQ
  regardless of product; gradient headline; invented customers.

### Editorial / news

- **IA:** front page with ranked stories, section fronts, article, author,
  topic, archive, search.
- **Density:** high on index pages, calm inside articles.
- **Navigation:** sections and search first; masthead identity; date visible.
- **Typography:** the primary instrument: display for headlines, a measured
  text face for reading, small utilitarian metadata.
- **Imagery:** journalistic, captioned, credited; scale follows importance.
- **Conversion:** continue reading, subscribe, newsletter; never before the
  first paragraph.
- **Trust:** bylines, dates, corrections, sourcing, about and masthead pages.
- **Proof:** the reporting itself.
- **Mobile:** ranked headlines, fast article load, readable measure; sticky
  section nav only if it earns its space.
- **Interaction:** none required; reading progress and related trails optional.
- **AI failures:** equal card grid for every story; hero image with overlay
  text on every article; a "latest posts" list as the whole IA; missing dates.

### Portfolio / creative

- **IA:** work first (reel, index, or sequence), then case studies, then who
  and how to contact.
- **Density:** variable; large work, small text; rhythm matters more than grid.
- **Navigation:** minimal: work, about, contact. The work is the navigation.
- **Typography:** one confident voice; captions and credits are first-class.
- **Imagery:** the content. Art direction, cropping, and sequence are design.
- **Conversion:** contact or inquiry; availability stated honestly.
- **Trust:** the quality and specificity of the work; clients only when real.
- **Proof:** case studies with problem, decisions, outcome.
- **Mobile:** images fast and sized, sequence preserved, contact reachable.
- **Interaction:** hover reveals and transitions may express personality; they
  must not gate content.
- **AI failures:** agency hero with services cards; identical thumbnail grid;
  "I craft delightful experiences" copy; invented project names.

### Restaurant / hospitality

- **IA:** what, where, and when first: menu or rooms, hours, location,
  reservation. Story and atmosphere support these facts.
- **Density:** spacious, but facts are never buried.
- **Navigation:** menu, reserve or book, location, hours, contact.
- **Typography:** menu typography is a product surface: names, descriptions,
  and prices aligned and scannable.
- **Imagery:** real food, rooms, people, place; sets tone and proves reality.
- **Conversion:** reserve, book, call, directions, order.
- **Trust:** address, hours, phone, map, real photos, policies.
- **Proof:** the menu, the place; awards only when real.
- **Mobile:** tap to call, directions, hours, reserve within one screen; menu
  as HTML text, not PDF or image.
- **Interaction:** minimal; date and party pickers native-friendly.
- **AI failures:** full-screen video hero with no hours; menu as an image;
  "culinary journey" copy; hidden phone number.

### Local service

- **IA:** service list, service area, how it works, pricing signals,
  credentials, contact or booking; one page per service when SEO matters.
- **Density:** compact and practical.
- **Navigation:** services, areas, about, reviews, contact; phone always
  visible.
- **Typography:** plain, legible, high contrast; headings answer questions.
- **Imagery:** real team, real work, real vehicles; otherwise none.
- **Conversion:** call, request quote, book a slot; response time stated.
- **Trust:** license numbers, insurance, years, named people, service area,
  transparent pricing structure.
- **Proof:** real reviews with source, before and after work, certifications.
- **Mobile:** call button, service list, quote form with few fields.
- **Interaction:** forms with validation and confirmation; nothing decorative.
- **AI failures:** invented "10,000 happy customers"; stock handshake photos;
  three service cards with icons; national-scale claims for a local trade.

### Nonprofit

- **IA:** the issue, what the organization does, evidence of impact, ways to
  act (donate, volunteer, subscribe), transparency (finances, governance).
- **Density:** medium; explanation and evidence get room.
- **Navigation:** about, programs, impact, get involved, donate.
- **Typography:** clear, humane, accessible; long-form explainer typography.
- **Imagery:** real programs and people with consent; documentary tone.
- **Conversion:** donate with amounts and recurrence; volunteer; sign up.
- **Trust:** registration, annual reports, financial breakdown, partners.
- **Proof:** sourced statistics, program outcomes, stories with names and
  dates when permitted.
- **Mobile:** donate path in two taps; story readability.
- **Interaction:** donation form states, error handling, receipt expectations.
- **AI failures:** emotional hero with a vague mission; unsourced impact
  numbers; donate button without amounts or transparency.

### Ecommerce

- **IA:** collection, product, cart, checkout boundary, plus search, account,
  policies, help. Merchandising on the home page, not marketing filler.
- **Density:** collection pages dense and filterable; product page focused.
- **Navigation:** categories, search, cart, account; persistent filters.
- **Typography:** product names, prices, variants, and availability are the
  hierarchy; body text is secondary.
- **Imagery:** product photography with consistent framing; zoom, alternate
  views, in-context shots.
- **Conversion:** add to cart, buy now, clear checkout handoff.
- **Trust:** shipping, returns, payment methods, contact, real reviews.
- **Proof:** product detail, specifications, materials, sizing.
- **Mobile:** sticky add to cart, variant selection, visible price, fast
  images, simple filters.
- **Interaction:** variant changes update price and availability; quantity,
  cart edits, loading and error feedback, unavailable states.
- **AI failures:** beautiful home page with broken or missing product, variant,
  and cart states; fake reviews; "shop the collection" over unrelated stock
  imagery.

### Documentation

- **IA:** getting started, concepts, tasks, reference, versions, search; the
  navigation is a table of contents, not marketing.
- **Density:** high but calm; long pages with an in-page outline.
- **Navigation:** persistent sidebar tree, breadcrumbs, search, version
  switcher, previous and next.
- **Typography:** reading measure, code typography, clear heading levels,
  inline code distinct from prose.
- **Imagery:** diagrams and screenshots only when they explain.
- **Conversion:** none; success is task completion.
- **Trust:** last-updated dates, version accuracy, edit link, changelog.
- **Proof:** runnable examples.
- **Mobile:** collapsible nav, code with horizontal scroll, search.
- **Interaction:** copy code, language tabs, anchors, keyboard search.
- **AI failures:** landing-page hero on the docs home; gradient accents inside
  the reading path; code blocks without overflow handling.

### Dashboard / web application

- **IA:** overview, drill-down, record, action. Work queues, filters, saved
  views. Settings, permissions, and account kept separate.
- **Density:** high and hierarchical; the primary metric or task dominates.
- **Navigation:** persistent app nav, contextual actions, breadcrumbs, command
  or search.
- **Typography:** tabular numerals, compact scale, strong label and value
  contrast.
- **Imagery:** charts and data; no decorative imagery.
- **Conversion:** none; success is fast, correct action.
- **Trust:** correct numbers, timestamps, freshness, undo, audit trail.
- **Proof:** the data itself.
- **Mobile:** prioritize monitoring and approving over authoring; tables
  become lists or cards with intentional column selection.
- **Interaction:** loading, empty, error, permission denied, destructive
  confirmations, keyboard shortcuts, live updates without layout shift.
- **AI failures:** identical KPI tiles with no hierarchy; decorative
  sparklines; a marketing hero inside an authenticated shell; tables that
  overflow on mobile.

### Event / cultural

- **IA:** what, when, where, who; program or schedule; tickets; venue and
  access; archive of past editions.
- **Density:** poster-like opening, dense and scannable schedule.
- **Navigation:** program, tickets, venue, about, news.
- **Typography:** expressive display is appropriate here; dates and times set
  in a disciplined system.
- **Imagery:** artists, previous editions, venue; identity may be graphic
  rather than photographic.
- **Conversion:** tickets, registration, add to calendar.
- **Trust:** organizer, venue address, accessibility information, dates that
  agree everywhere.
- **Proof:** program detail, past editions, partners when real.
- **Mobile:** schedule by day, tickets, map, "happening now" when live.
- **Interaction:** filtering by day, stage, or type; add to calendar; time
  zone clarity for online events.
- **AI failures:** SaaS feature cards for a festival; testimonials; schedule as
  an image; a countdown timer as the only content.

## Hybrids and route splitting

Use a primary archetype for structure and a secondary for expression: a hotel
with travel-guide editorial influence, a portfolio as an archival catalog, a
nonprofit report with data-journalism influence, ecommerce with lookbook
influence, docs with a learning-path influence.

Never blend more than two on one route. When intents conflict, split routes:
the docs home is not the marketing home; the app shell is not the landing page.

## Diversity check

Answer before styling:

1. Which content unit dominates the first screen, and is it this archetype's?
2. Does the navigation match the user's intent rather than a marketing menu?
3. Does section order follow the content rather than hero, features, proof,
   pricing, FAQ, CTA?
4. Are trust and proof native to this archetype?
5. Would swapping in unrelated SaaS copy leave the layout intact? If yes,
   restructure before styling.
