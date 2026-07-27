# CMS and platform selection

## Contents

1. Detect the platform
2. Classify the work surface
3. Preserve the editor contract
4. Platform routing
5. Safe delivery

## Detect the platform

Inspect before choosing an implementation:

| Evidence | Platform |
|---|---|
| `wp-content`, `wp-config.php`, `theme.json`, plugin headers | WordPress |
| `bitrix/.settings.php`, `/local/templates`, `/local/components` | 1C-Bitrix |
| `t-records`, `tilda-blocks-*`, `tilda-scripts-*`, Tilda API sync | Tilda export |
| `layout/theme.liquid`, `sections/*.liquid`, `templates/*.json` | Shopify |
| `core/lib/Drupal`, `*.info.yml`, `*.libraries.yml`, Twig templates | Drupal |
| `webflow.css`, `data-wf-page`, Webflow API/export metadata | Webflow export |
| framework config plus CMS SDK or GraphQL schema | Headless CMS |

If evidence conflicts, inspect package manifests, HTTP headers, generated markup,
admin paths, and deployment configuration. Do not guess the platform from visual
appearance.

## Classify the work surface

Choose one:

- **Native theme/template source:** edit the platform-owned extension points.
- **Visual editor:** use the editor or an authorized browser/API integration;
  source files may not be the source of truth.
- **Export pipeline:** change the upstream builder or synchronization logic,
  not a generated file that will be overwritten.
- **Headless frontend:** treat the CMS schema, preview mode, and invalidation
  webhook as part of the application contract.
- **Legacy custom site:** preserve behavior first; isolate improvements behind
  small, reversible changes.

Never claim to have changed a hosted builder when only an exported snapshot was
edited.

## Preserve the editor contract

Determine what a non-developer must control:

- navigation and footer links;
- page headings, prose, media, and calls to action;
- product, price, inventory, taxonomy, or localization;
- reusable sections and their allowed variants;
- SEO title, description, canonical, social image, and indexability.

Expose structured, bounded controls. Do not offer a dozen arbitrary color,
spacing, and radius controls that let the design system collapse. Provide safe
defaults, meaningful labels, help text, validation, and previews.

Keep:

- content in content fields;
- design tokens in the theme or design system;
- reusable presentation in blocks, sections, or components;
- business logic in plugins, modules, apps, or services;
- secrets and privileged integration logic server-side.

## Platform routing

- WordPress or WooCommerce: read
  [wordpress.md](wordpress.md).
- 1C-Bitrix: read [bitrix.md](bitrix.md).
- Tilda: read [tilda.md](tilda.md).
- Shopify: read [shopify.md](shopify.md).
- Drupal, Webflow, headless, static, or unknown: read
  [other-platforms.md](other-platforms.md).

Apply the shared visual, accessibility, security, SEO, and Lighthouse references
after the platform playbook.

## Safe delivery

Before modifying a CMS project:

1. identify platform and runtime versions;
2. locate the canonical source and version control;
3. confirm staging, backup, rollback, and cache behavior;
4. inventory plugins/modules/apps and customizations;
5. capture critical routes and current behavior;
6. change the smallest supported extension point;
7. test authoring, preview, publish, public rendering, and rollback.

Do not update the CMS core, plugins, modules, themes, or dependencies as a side
effect of a design task. Treat version upgrades and data migrations as separate,
explicitly authorized work.
