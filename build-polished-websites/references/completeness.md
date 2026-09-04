# Completeness checklists

A polished website is a whole product, not a homepage. Read only the section
for the chosen archetype. Every item must exist, be explicitly deferred with the
user's agreement, or be marked "not in scope" in the report.

Shared for every site: 404 page, metadata and share preview per route,
favicon, skip link when navigation repeats, form validation and confirmation,
consent handling when analytics or embeds run, print or reader behavior for
long text where relevant.

## SaaS / product landing

- Home with the real product visible and one primary action.
- Pricing with plans, units, limits, and what happens at limits.
- Sign-up or contact path with validation, success, and failure states.
- Docs or help entry point; changelog or status if the product is live.
- Legal: privacy, terms; security posture when it is a buying factor.
- Honest handling of missing proof; no invented logos or quotes.

## Editorial / news

- Front page with ranked stories, not equal cards.
- Article: headline, standfirst, byline, date, updated date, body typography,
  images with captions and credits, pull quotes, related trail.
- Section or topic archive with pagination or infinite scroll that keeps URL
  state.
- Author page; search; tag or topic pages.
- Corrections or editorial standards page; about and contact.
- Feeds (RSS/Atom) and structured data for articles.

## Portfolio / creative

- Work index with a deliberate sequence, not upload order.
- Case study: brief, role, decisions, outcome, credits, media with captions.
- About with a real point of view; contact with availability.
- Image pipeline: sized, compressed, correct aspect ratios, no layout shift.
- Graceful state when a project has few assets or is confidential.

## Restaurant / hospitality

- Hours (with exceptions), address, phone, map link, parking or access.
- Menu or rooms as HTML text with prices; dietary or amenity markers.
- Reservation or booking path, or an honest external handoff.
- Events, private dining, or offers where they exist.
- Policies: cancellation, deposits, dress, children, pets, accessibility.
- Real photography or none.

## Local service

- Services with scope and pricing signals; one page per service if SEO
  matters.
- Service area, hours, phone, emergency or response-time statement.
- Quote or booking form with few fields, validation, confirmation, and a
  fallback contact.
- Credentials: license, insurance, certifications, named people.
- Reviews only with source; FAQ answering real objections.
- Local business structured data with verified details.

## Nonprofit

- Mission and issue explainer; programs with what they do and for whom.
- Impact with sourced numbers and dates; annual report or financials.
- Donate: amounts, recurrence, currency, receipt expectation, error states,
  secure processor boundary.
- Volunteer, subscribe, and contact paths.
- Governance: board, registration, policies.

## Ecommerce

- Collection: filters, sort, pagination or load more, result count, empty
  result state, price and availability on cards.
- Product: gallery with zoom, variants that change price and availability,
  quantity, unavailable and back-in-stock states, shipping and returns
  summary, specifications, real reviews or none.
- Cart: line edits, quantity change, remove, totals, empty cart, error
  handling, clear checkout handoff.
- Search with suggestions and empty state; account or guest boundary.
- Policies: shipping, returns, payments, privacy, contact.
- Loading and error states for every asynchronous action.

## Documentation

- Getting started; concepts; task guides; reference; FAQ or troubleshooting.
- Sidebar tree, breadcrumbs, in-page outline, previous/next, search.
- Version switcher when versions exist; last-updated dates.
- Code blocks with copy, language labels, horizontal overflow, and
  dark/light legibility.
- Edit or feedback link; 404 that offers search.

## Dashboard / web application

- Authenticated shell: navigation, account, sign-out, permissions.
- Every data view: loading, empty, error, permission denied, and partial
  failure states.
- Destructive actions with confirmation and undo where feasible.
- Forms with inline validation, unsaved-changes handling, and error focus.
- Tables: sorting, column priority on narrow screens, sticky headers, row
  actions reachable by keyboard.
- Keyboard navigation and shortcuts documented; focus management in dialogs.
- Live data without layout shift; timestamps and freshness visible.

## Event / cultural

- Program or schedule by day and stage, filterable, as HTML.
- Tickets or registration with pricing tiers and availability, or an honest
  external handoff.
- Venue: address, map, transport, accessibility, opening hours.
- Artists, speakers, or exhibits with detail pages when content exists.
- Practical info and FAQ; news or updates; past editions archive.
- Dates and times consistent everywhere, with time zone for online events.
