# Security and technical SEO

## Contents

1. Trust-boundary review
2. Browser security
3. Public-page SEO
4. Structured data and sharing
5. Release checklist

## Trust-boundary review

Trace untrusted data from source to sink:

- request body, query, route parameter, cookie, header, uploaded file;
- CMS, database, remote API, webhook, environment value;
- HTML render, database query, command, filesystem path, redirect, outbound
  fetch, log, email, or analytics event.

At each state-changing server path, require:

1. server-side authentication;
2. authorization and ownership scoping;
3. schema validation before side effects;
4. sanitized client errors and auditable server logs;
5. replay protection, CSRF protection, or idempotency where relevant.

Parameterize database operations. Avoid shell execution. Sanitize allowed HTML.
Resolve filesystem paths and enforce the expected root. Allowlist outbound
protocols and hosts and block private or metadata IP ranges for user-controlled
URLs.

Keep secrets out of source, client bundles, logs, errors, and screenshots. If a
real credential is found, treat it as compromised and recommend rotation.

## Browser security

- Use a restrictive Content Security Policy appropriate to the application.
- Set secure, `HttpOnly`, and suitable `SameSite` cookies for sessions.
- Use `rel="noopener"` with external `target="_blank"` links.
- Prevent framing unless embedding is an intentional requirement.
- Use HTTPS and HSTS in production.
- Avoid permissive CORS; allow only required origins, methods, and headers.
- Pin or integrity-protect third-party assets when practical.
- Do not expose source maps publicly when they reveal sensitive implementation.

Do not add headers that break the product and call the task complete. Verify
them in the deployed or production-like response.

## Public-page SEO

For each indexable page:

- write a unique, intent-matched title, usually 50–60 characters;
- write a useful description, usually 150–160 characters;
- use one clear `h1` and a logical heading hierarchy;
- provide a self-referential HTTPS canonical;
- include `index,follow,max-image-preview:large` unless the route should not be
  indexed;
- render meaningful content without requiring user interaction;
- use descriptive internal link text;
- include image dimensions and contextual alt text;
- keep canonical URLs consistent with the sitemap;
- return correct status codes and avoid redirect chains.

Use `noindex,follow` for thin utility pages. Do not combine `noindex` with a
robots.txt block that prevents crawlers from seeing it.

Create `robots.txt` and `sitemap.xml` when the site is public and multi-page.
Do not invent production domains; derive them from verified configuration or
ask.

## Structured data and sharing

Add JSON-LD only for visible, truthful content. Common fits:

- `Organization` and `WebSite` on the homepage;
- `BreadcrumbList` on non-home pages;
- `Article` or `BlogPosting` for editorial content;
- `Product` and `Offers` only when real product and offer data are visible.

Validate structured data. Do not add ratings, reviews, prices, authors, or
dates that the page does not show.

Add Open Graph and large-image social card metadata with absolute HTTPS image
URLs. Prefer a 1200 × 630 share image and keep critical content away from crop
edges.

## Release checklist

- No secret or high-entropy credential is present in changed files.
- Dependency changes are intentional and lockfile-backed.
- Forms validate on both client and server.
- Errors fail closed and do not reveal internals.
- Authentication and ownership checks cover every mutation.
- Metadata, canonical, robots, sitemap, and structured data match the real
  production URL and visible content.
- External links and third-party scripts are reviewed.
- Security-sensitive headers are verified from a production-like response.
