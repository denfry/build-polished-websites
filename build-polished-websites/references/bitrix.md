# 1C-Bitrix Site Manager and Bitrix Framework

## Contents

1. Inspect the installation
2. Keep custom code in `/local`
3. Components and templates
4. Security and data access
5. Caching and performance
6. Verification and release

## Inspect the installation

Record the product edition, main module version, PHP/database versions,
installed modules, site IDs, active templates, composite mode, caching setup,
and whether source control excludes the product core.

Work on a development or staging copy. Do not infer safety from a working public
page; Bitrix projects often contain long-lived customizations and cache layers.

## Keep custom code in `/local`

- Never modify `/bitrix/modules`, `/bitrix/components/bitrix`, or other product
  core directories.
- Put custom components in `/local/components/<namespace>/`.
- Put site and component template overrides in `/local/templates/`.
- Put custom modules in `/local/modules/`.
- Use namespaces, autoloading, localization files, documented events, and D7
  APIs where the installed version supports them.
- Encapsulate D7 dependencies instead of inheriting unstable internal classes.
- Do not copy an entire system component when a template override or event hook
  is sufficient.

Before moving legacy customizations from `/bitrix` to `/local`, inventory
modified core files with the platform quality tools and migrate incrementally.

## Components and templates

Keep data retrieval and business logic in the component or service layer.
Templates should format an already prepared `$arResult`.

- Validate and normalize `$arParams`.
- Use a project namespace.
- Keep language strings in `/lang`.
- Use platform asset management rather than duplicating libraries in templates.
- Give component templates stable, descriptive names.
- Preserve edit-area controls when authors depend on inline editing.
- Avoid queries and mutations inside `template.php`.

Copy a system component template into the active `/local/templates/.../components`
override path before customization. Do not edit the system template in place.

## Security and data access

- Check authentication, group/role permissions, object access, and site scope.
- Protect state-changing requests with session/CSRF checks such as the
  platform's `bitrix_sessid` mechanisms and also enforce authorization.
- Encode untrusted output with the platform HTML filtering/encoding APIs.
- Prefer D7 ORM and documented APIs over direct SQL.
- Validate file IDs, paths, types, sizes, and ownership.
- Sign client-visible state when the server must detect tampering.
- Keep credentials out of templates, public configuration, logs, and VCS.
- Guard directly included PHP files with the standard prolog check.

Treat AJAX actions and public component parameters as adversarial input.

## Caching and performance

Design cache identity and invalidation before enabling long TTLs.

- Use component caching with `StartResultCache` where appropriate.
- Include every output-affecting input, permission dimension, language, site,
  pagination, and filter in the cache key.
- Call `AbortResultCache` when data is invalid or access is denied.
- Use managed/tagged cache for data that needs event-driven invalidation.
- Do not fragment caches per user when a permission group or public variant is
  sufficient.
- Keep dynamic personalized fragments out of full-page/composite cache unless
  the platform's dynamic-area mechanism is used correctly.
- Measure as an anonymous user without admin panels or debug mode.

## Verification and release

Verify:

- anonymous, authenticated, and restricted-role behavior;
- multiple site IDs and languages when configured;
- component cache miss, hit, invalidation, and permission separation;
- composite rendering and dynamic fragments;
- admin inline editing and author workflow;
- forms, AJAX, filters, pagination, and empty states;
- production-like CSS/JS combination and minification;
- representative templates with Lighthouse.

Back up files and database through the established operational process. Deploy
only custom source, not cached/generated files. Clear narrowly scoped caches
first; avoid using a full cache purge as a permanent fix.

## Official sources

- D7 reference: https://dev.1c-bitrix.ru/api_d7/
- `/local` structure: https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=43&LESSON_ID=2705
- Component cache: https://dev.1c-bitrix.ru/api_help/main/reference/cbitrixcomponent/startresultcache.php
