# Tilda

## Contents

1. Choose the source of truth
2. Build in the hosted editor
3. Custom code and Zero Block
4. API and export integration
5. Forms, security, and SEO
6. Verification

## Choose the source of truth

Distinguish:

- a hosted Tilda project edited through the UI;
- standard blocks plus Zero Block;
- page- or site-level custom HTML/CSS/JavaScript;
- a manual code export;
- a server-side API synchronization pipeline;
- an exported snapshot embedded in another application.

Do not edit generated Tilda HTML when the hosted project or sync pipeline will
overwrite it. If only an export exists, state that upstream editor changes
cannot be made from the export.

## Build in the hosted editor

Prefer standard blocks for common, content-heavy structures because they retain
responsive behavior and editor maintainability. Use Zero Block for a genuinely
custom composition, not every section.

- Establish site typography, colors, buttons, forms, grid, and spacing first.
- Reuse saved blocks and consistent styles.
- Keep text as real text and controls as real controls.
- Set meaningful mobile layouts in Zero Block rather than shrinking desktop.
- Avoid excessive absolute positioning, animations, and layered decorations.
- Keep custom CSS selectors scoped to a stable block or custom class.
- Publish to a non-production page/domain while iterating when possible.

## Custom code and Zero Block

Custom code is an exception surface. Before adding it:

1. confirm a native block or setting cannot solve the requirement;
2. identify whether code belongs at block, page, or site scope;
3. avoid global selectors that alter editor/platform UI;
4. defer non-critical scripts and guard against double initialization;
5. support repeated blocks and dynamic publishing;
6. document where the code is edited in Tilda.

Do not place secrets, privileged API calls, or unsanitized user content in
client-side custom code.

## API and export integration

Tilda's API is a synchronization API, not a per-page-view content backend.

- Keep public and secret keys in server-side secret storage.
- Prevent secret-bearing request URLs from entering logs or error responses.
- Treat a secret observed in source, request logs, traces, or error reports as
  compromised: rotate it and review every logging layer for retained copies.
- Respect the documented request limit.
- Fetch content only on publish/sync, store it locally, and serve local output.
- Download referenced images, styles, and scripts as required by the chosen
  export endpoint.
- Treat API HTML and asset URLs as external input before integrating them.
- Acknowledge publish webhooks quickly, persist the event, and run heavy sync
  asynchronously.
- Make webhook processing idempotent because delivery may repeat.
- Treat the documented publish webhook as a synchronization hint, not trusted
  content or cryptographic proof. Validate expected identifiers, then fetch the
  canonical page through the authenticated API.
- Build a complete candidate before activation; keep serving the previous
  version when HTML or asset synchronization fails.
- Preserve the required Tilda attribution for API-exported pages under the
  applicable terms.

Do not use `getpage*` on every visitor request.

## Forms, security, and SEO

- Use a supported form receiver or a server endpoint with validation, spam/rate
  controls, consent handling, and sanitized storage.
- Test success and failure delivery; a styled success message does not prove the
  lead reached its destination.
- Review analytics, pixels, embeds, fonts, and consent requirements.
- Set the real page URL, title, description, social image, indexability, and
  canonical behavior in Tilda settings.
- Avoid duplicate headings and duplicate metadata introduced by custom HTML.
- Do not inject unverifiable structured data or hidden SEO text.

## Verification

Test the published page, not only the editor preview:

- Tilda responsive ranges plus 375, 768, 1440, and an awkward width;
- long copy, missing images, and localized text;
- navigation, anchors, popups, forms, payments, and integrations;
- keyboard, focus, zoom, reduced motion, and contrast;
- console/network errors and duplicate scripts;
- page weight and third-party cost;
- Lighthouse three times on the final published or staging URL.

Record which checks are limited by hosted-platform code and third-party assets.
Do not lower the shared quality gates silently.

## Official sources

- Developer resources: https://help-ru.tilda.cc/fordevelopers
- API and export rules: https://help.tilda.cc/api
