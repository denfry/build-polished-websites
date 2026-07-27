# Drupal, Webflow, headless CMS, static, and unknown platforms

## Contents

1. Drupal
2. Webflow and hosted builders
3. Headless CMS
4. Static site generators
5. Unknown or legacy systems

## Drupal

- Record Drupal/PHP versions, active base theme, custom theme, modules, config
  workflow, and caching layers.
- Never edit core or contributed modules/themes directly.
- Use a custom theme or sub-theme and documented template suggestions.
- Declare CSS/JavaScript in `*.libraries.yml`; attach only where needed.
- Keep data preparation in preprocess hooks/services and presentation in Twig.
- Preserve Twig auto-escaping; avoid `|raw` for untrusted or editor content.
- Maintain render arrays and cache metadata: contexts, tags, and max-age.
- Move configuration through the established config-management workflow.
- Rebuild caches after new templates or library definitions.
- Verify anonymous/authenticated roles, translations, Views, forms, cache
  variants, aggregation, and representative routes.

Official sources:

- https://www.drupal.org/docs/develop/theming-drupal/drupal-theme-folder-structure
- https://www.drupal.org/docs/administering-a-drupal-site/security-in-drupal/writing-secure-code-for-drupal

## Webflow and hosted builders

First determine whether work occurs in the hosted Designer, through an
authorized API, or against an export. The hosted project is usually the source
of truth.

- Reuse classes and variables; avoid uncontrolled combo-class proliferation.
- Keep CMS-bound elements bound to CMS fields.
- Build reusable components for repeated structures.
- Use custom code only when native interactions and components cannot meet the
  requirement.
- Scope custom CSS and make custom scripts idempotent.
- Keep secrets and privileged API work out of custom client code.
- Test the published staging domain because Designer preview and production
  scripts can differ.
- Do not promise that edits to exported HTML will round-trip into the Designer.

Apply the same rule to Framer, Wix, Squarespace, and similar hosted builders:
identify native components, editor ownership, export limitations, and supported
code/API surfaces before implementation.

## Headless CMS

Treat the content schema as a public application contract.

- Generate or use typed queries when available.
- Separate draft/preview and published delivery credentials.
- Never expose write/admin tokens to the browser.
- Validate CMS data before passing it to HTML, URL, style, or script sinks.
- Model reusable content by meaning, not by one page's pixel layout.
- Provide safe fallbacks for missing optional fields.
- Implement preview without weakening production authentication.
- Verify webhook signatures, deduplicate events, and invalidate only affected
  pages or cache tags.
- Prevent unpublished, scheduled, private, or cross-tenant content leakage.
- Test schema evolution and deleted references.

## Static site generators

Preserve the current generator and content format. Put design tokens in the
existing styling system, reusable structures in components/layouts, and content
in Markdown/MDX/data files.

- Validate frontmatter and internal links at build time.
- Sanitize raw HTML and untrusted Markdown extensions.
- Optimize images at build time with explicit dimensions.
- Generate canonical, sitemap, feeds, and metadata from one verified site URL.
- Test the generated production directory through a real HTTP server.

## Unknown or legacy systems

Do not rewrite first. Trace:

1. request entrypoints and template resolution;
2. content/database sources;
3. asset pipeline and cache;
4. form and authentication boundaries;
5. deployment and rollback;
6. which files are generated or vendor-owned.

Create a small adapter or isolated template change. Capture before/after browser
evidence and preserve behavior. Recommend migration only as a separately scoped
decision with content, URL, SEO, analytics, redirect, and rollback plans.
