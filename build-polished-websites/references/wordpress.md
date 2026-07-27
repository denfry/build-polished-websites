# WordPress and WooCommerce

## Contents

1. Detect the architecture
2. Place changes correctly
3. Gutenberg and editor experience
4. Security
5. Performance and SEO
6. Verification and delivery

## Detect the architecture

Record the WordPress, PHP, active theme, parent theme, and relevant plugin
versions. Determine whether the site uses:

- a block theme and Site Editor;
- a classic or hybrid theme;
- a child theme;
- Gutenberg blocks or patterns;
- Elementor, another page builder, or ACF;
- WooCommerce templates and hooks;
- a Bedrock/Composer or conventional WordPress layout.

Follow the established model. Do not migrate a page builder, classic theme, or
content model merely to implement a page.

## Place changes correctly

- Never edit WordPress core, a third-party plugin, or a vendor theme directly.
- Use a child theme when customizing an updateable parent theme.
- Keep presentation in a theme; keep durable domain behavior in a plugin.
- Prefer hooks, filters, documented template overrides, and public APIs.
- Use `theme.json` for supported global settings and styles in block or hybrid
  themes; match the schema supported by the installed WordPress version.
- Register custom blocks with `block.json`; use dynamic server rendering only
  when content or behavior requires it.
- Enqueue scripts and styles through WordPress APIs. Do not hardcode asset tags
  into arbitrary templates.
- For WooCommerce, prefer hooks and documented overrides; copy templates only
  when necessary and track their upstream versions.

## Gutenberg and editor experience

Make the editor resemble the front end. Provide:

- a small curated palette and type scale;
- block styles and variations with meaningful names;
- reusable patterns for real content structures;
- bounded spacing and layout options;
- sensible placeholder content only inside editor previews;
- allowed-block restrictions only when they protect the content model.

Do not lock all content into one monolithic custom block. Do not expose raw HTML
or CSS as the normal editing workflow. Preserve existing user-created Global
Styles and builder data unless the user explicitly wants a migration.

## Security

- Validate expected types and values.
- Sanitize on input and escape late for the output context.
- Use `esc_html`, `esc_attr`, `esc_url`, `wp_kses`, and related contextual APIs.
- Use WordPress data APIs; if raw SQL is unavoidable, use `$wpdb->prepare`.
- Use nonces for intent/CSRF protection, but never treat a nonce as
  authorization. Check capabilities with `current_user_can`.
- Give every REST mutation a restrictive `permission_callback`.
- Validate uploads by capability, MIME, size, and intended use.
- Do not expose API keys through localized scripts, HTML, REST responses, logs,
  or committed `wp-config.php` values.

## Performance and SEO

- Measure logged-out production-like pages without the admin toolbar.
- Avoid unbounded `WP_Query` calls and reset post data after custom loops.
- Prevent N+1 metadata, term, or product queries.
- Cache expensive derived results with a deliberate invalidation path.
- Load block or page assets only where used.
- Use WordPress responsive-image functions instead of handwritten single-source
  images.
- Keep the true LCP image eager and high priority; lazy-load below-fold media.
- Avoid duplicate SEO output from the theme and an SEO plugin. Detect the active
  owner of title, canonical, Open Graph, sitemap, and schema.
- For WooCommerce, test product, collection, search, cart, checkout, account,
  empty, unavailable, sale, and variation states.

## Verification and delivery

Run existing PHP linting, PHPCS, static analysis, JavaScript checks, and tests.
Use a disposable local or staging environment for mutations.

Verify:

- editor insertion, selection, preview, save, reload, and reusable content;
- logged-in and logged-out rendering;
- roles with different capabilities;
- localization and long content;
- cache purge and regeneration;
- forms and REST error paths;
- critical templates and responsive states;
- Lighthouse on representative public templates.

Before production, back up the database and uploads when relevant, record the
active versions, deploy source through the established path, purge only the
required caches, and smoke-test. Never use a database search-and-replace without
serialization-aware tooling and a verified backup.

## Official sources

- Theme security: https://developer.wordpress.org/themes/advanced-topics/security/
- `theme.json`: https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/
- Block metadata: https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/
