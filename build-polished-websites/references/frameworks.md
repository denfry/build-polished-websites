# Code frameworks

Pitfalls that affect design quality, performance, and correctness on common
frameworks. This is not a tutorial. Read the section for the detected stack
and keep the project's existing conventions.

## Contents

1. Shared rules
2. Next.js
3. React with Vite
4. Astro
5. Nuxt / Vue
6. SvelteKit
7. Plain HTML, CSS, and JavaScript

## Shared rules

- Detect the framework from the manifest and config, not from file extensions.
- Use the framework's image, font, and metadata primitives before custom ones.
- Render above-the-fold content on the server or at build time when the
  framework supports it; hydrate only what is interactive.
- Self-host fonts or use the framework's font loader with `font-display`
  handled and metrics-compatible fallbacks; preload only the fonts used
  above the fold.
- Reserve dimensions for every image, embed, and async block.
- Route-level metadata, canonical, Open Graph, sitemap, robots, and 404 are
  part of the deliverable.
- Measure the production build served statically or through the framework's
  production server, never the dev server.

## Next.js

- App Router: server components by default; add `"use client"` only for
  interactive leaves. Avoid passing large data into client components.
- Use `next/image` with correct `sizes`; mark the LCP image `priority`.
- Use `next/font` for fonts; avoid `<link>` font tags that bypass it.
- Metadata via the `metadata` export or `generateMetadata`; `metadataBase`
  must be the real production origin.
- Hydration mismatches come from date, locale, random, or `window` access
  during render; fix the cause rather than suppressing warnings.
- Check the bundle with the build output and analyzer; a marketing route
  should not ship the dashboard's dependencies.
- Static or ISR for content pages; dynamic rendering only where needed.

## React with Vite

- Client-only rendering means the LCP depends on the JS bundle; keep the
  shell small, code-split routes, and consider prerendering for public pages.
- Provide real `index.html` metadata; single-page apps still need titles per
  route (update `document.title` or use a head manager).
- Use `<img>` with `srcset`, `width`, `height`, and `loading` attributes; Vite
  does not optimize images without a plugin.
- Avoid layout shift from late-loaded fonts and data: reserve space and use
  skeletons matching final dimensions.
- Routing must handle unknown routes with a 404 view and correct focus
  management on navigation.

## Astro

- Islands: keep components static by default; add `client:*` directives only
  where interaction exists, and choose the least eager directive that works.
- Use `astro:assets` `<Image>` and `<Picture>` for local images; set `widths`
  and `sizes` deliberately.
- Content collections for structured content; validate frontmatter schemas.
- View transitions and prefetch are optional; verify they do not break focus
  or scroll restoration.
- Set `site` in the config so canonical and sitemap URLs are correct.

## Nuxt / Vue

- Prefer server-side rendering or static generation for public routes;
  `useHead` or `useSeoMeta` for per-route metadata.
- `<NuxtImg>` and `<NuxtPicture>` with the image module for optimization.
- Use `useFetch` and `useAsyncData` for data so it is serialized once; avoid
  double fetching on hydration.
- Hydration mismatch sources are the same as elsewhere: time, random, locale,
  browser globals.
- Lazy hydration or client-only components for heavy widgets.

## SvelteKit

- Load data in `load` functions; keep pages server-rendered unless the route
  must be client-only.
- Use `enhance` for progressive forms so they work without JavaScript.
- Images: `@sveltejs/enhanced-img` or explicit `srcset`, `width`, `height`.
- Set `<svelte:head>` metadata per route; handle `+error.svelte` design.
- Check `a11y-*` compiler warnings; do not silence them without fixing the
  cause.

## Plain HTML, CSS, and JavaScript

- One stylesheet with tokens as custom properties; no framework CSS reset that
  fights the design.
- Responsive images by hand: `srcset`, `sizes`, `width`, `height`, `loading`,
  `decoding`, and `fetchpriority` on the LCP image.
- Fonts: `@font-face` with `font-display: swap` or `optional`, preloaded only
  when critical, with size-adjusted fallbacks.
- Scripts `defer` or `type="module"`; no render-blocking scripts in `head`.
- Navigation is real links; enhance with JavaScript without depending on it.
- Every page carries its own title, description, canonical, and share
  metadata; generate a sitemap when there is more than one page.
