# Shopify themes

## Contents

1. Architecture
2. Merchant editing
3. Liquid and security
4. Performance
5. Commerce verification

## Architecture

Record the theme version, Online Store architecture, development theme, apps,
markets, languages, and existing build tooling.

- Work in a development/duplicate theme, not the published theme.
- Prefer JSON templates with reusable Liquid sections.
- Use section groups for merchant-editable global areas when supported.
- Put reusable snippets in `snippets/` and assets in `assets/`.
- Use theme app extensions/app blocks instead of having apps patch theme code.
- Do not edit app-managed or generated files without understanding ownership.

## Merchant editing

Design section and block schemas around real editorial tasks:

- use clear labels and help text;
- provide constrained variants and sensible defaults;
- include presets so sections can be added in the editor;
- preserve existing merchant settings and content;
- do not create hundreds of settings or embed content in Liquid;
- keep product, collection, metaobject, market, and translation data in their
  platform models.

Use JSON templates to let merchants add, remove, and reorder sections. Keep
actual HTML and Liquid in referenced sections.

## Liquid and security

- Treat merchant content, query values, and app data as untrusted.
- Rely on Liquid's escaped output patterns; use raw output only for a verified
  context that requires it.
- Use Shopify form helpers, routes, localization, and image filters.
- Never place Admin API tokens or app secrets in theme code.
- Do not implement privileged application behavior in storefront JavaScript.
- Review custom Liquid and third-party app blocks as trust boundaries.

## Performance

- Run Theme Check and the repository's existing tooling.
- Avoid parser-blocking scripts and duplicate library bundles.
- Load section JavaScript defensively and make initialization idempotent.
- Use Shopify image URLs and responsive image markup.
- Keep the product's LCP media eager; lazy-load below-fold media.
- Avoid repeated expensive Liquid loops and nested collection scans.
- Treat app scripts, analytics, reviews, chat, personalization, and consent
  tools as performance-budget consumers.
- Test with representative products, collections, media, variants, and content;
  empty demo sections hide real performance cost.

## Commerce verification

Test:

- home, product, collection, search, cart, and content templates;
- unavailable products, sale prices, variants, inventory, localization, and
  long titles;
- add-to-cart, cart updates, errors, accelerated checkout boundaries, and app
  blocks;
- keyboard access, focus, zoom, semantic product forms, and live updates;
- Theme Check and Lighthouse across home, product, and collection pages.

Do not modify checkout or account surfaces as if they were ordinary theme pages;
confirm the store plan and supported extension surface first.

## Official sources

- Theme architecture: https://shopify.dev/docs/storefronts/themes/architecture
- JSON templates: https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates
- Accessibility: https://shopify.dev/docs/storefronts/themes/best-practices/accessibility
