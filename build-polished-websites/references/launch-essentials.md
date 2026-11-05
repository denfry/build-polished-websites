# Launch essentials

## Contents

1. The rule
2. Document head
3. Icons, manifest, and share image
4. Crawling: robots, sitemap, canonicals, languages
5. Structured data by archetype
6. Local presence and search consoles
7. Analytics and consent
8. Legal pages and personal data
9. Forms that actually deliver
10. Security headers, redirects, and caching
11. Error and utility pages
12. Verification

## The rule

A site is not finished when it looks right. It ships configured: every item in
this file is either done, or listed in the report as blocked with the reason
and the person who must supply the missing input (domain, analytics ID,
company details). Never invent a production domain, legal entity, tax number,
or analytics ID; use clearly marked placeholders such as `https://example.com`
only in templates and report them.

Run the mechanical check on the built output before reporting:

```bash
node <skill-dir>/scripts/launch-check.mjs <build-dir-or-html> [--base-url https://www.example.com]
```

## Document head

Every indexable page carries this baseline, filled with page-specific values:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Свежий хлеб на закваске в Бонфиме — Forno Alto, Порту</title>
  <meta name="description" content="Пекарня на дровах в Порту: что печём сегодня, бронь хлеба к самовывозу, часы работы и адрес.">
  <link rel="canonical" href="https://www.example.com/">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#1f3fa8">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Forno Alto">
  <meta property="og:title" content="Свежий хлеб на закваске в Бонфиме">
  <meta property="og:description" content="Что печём сегодня и бронь к самовывозу.">
  <meta property="og:url" content="https://www.example.com/">
  <meta property="og:image" content="https://www.example.com/og/home.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="ru_RU">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
</head>
```

- **Title:** unique per page, the page's actual subject first, brand last,
  about 50–60 characters. Not "Home".
- **Description:** unique, a concrete answer to "why open this", about
  120–160 characters. It is copy; write it like copy.
- **Canonical, og:url, sitemap, internal links** use the same absolute form
  (protocol, host, trailing-slash policy).
- **Utility pages** (thank-you, search results, cart, account) get
  `noindex,follow`.

## Icons, manifest, and share image

Ship five files, derived from the brand mark or the direction card:

| File | Size | Purpose |
|---|---|---|
| `favicon.ico` | 32 × 32 | legacy browsers, RSS readers, Yandex |
| `icon.svg` | vector | modern browsers; may switch colour with `prefers-color-scheme` |
| `apple-touch-icon.png` | 180 × 180, no transparency | iOS home screen |
| `icon-192.png`, `icon-512.png` | 192, 512 | manifest, Android |
| `og/<page>.png` | 1200 × 630 | link previews in Telegram, VK, WhatsApp, Slack, X, Facebook |

```json
{
  "name": "Forno Alto",
  "short_name": "Forno Alto",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "theme_color": "#1f3fa8",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

**Share images are designed, not screenshots.** Build `og.html` at
1200 × 630 in the site's own type and palette (page title, one key fact, the
mark) and render it:

```bash
chrome --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=5000 --window-size=1200,630 \
  --screenshot=og/home.png file:///path/to/og.html
```

Keep text inside the central 1000 × 500 area; messengers crop edges. Render
icons the same way from an SVG mark at each size, or export them from the
source artwork.

## Crawling: robots, sitemap, canonicals, languages

```text
# robots.txt
User-agent: *
Disallow: /cart
Disallow: /search
Sitemap: https://www.example.com/sitemap.xml
```

- Never ship `Disallow: /` or a site-wide `noindex` from staging to production;
  check both on the production build.
- Russian-language sites with tracking parameters: add Yandex's
  `Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term`
  under `User-agent: Yandex`.
- `sitemap.xml` lists every canonical, indexable URL with `<lastmod>` from real
  content changes, and nothing that redirects, 404s, or is `noindex`. Generate
  it in the build (framework plugin, CMS module, or a small script) rather than
  by hand.
- Multilingual sites: one URL per language, `hreflang` links in both
  directions plus `x-default`, and a language switcher that links to the
  equivalent page, not the home page.
- One host and one protocol: redirect `http` → `https` and `www` ↔ apex to the
  canonical host with a single 301.
- Clean, readable, lowercase URLs (`/menu/`, `/tickets/`); Cyrillic sites
  usually transliterate slugs.

## Structured data by archetype

JSON-LD in the `head` or at the end of `body`, describing only what the page
visibly shows. Fill every value from real content; omit unknown fields rather
than guessing.

| Archetype | Types |
|---|---|
| Restaurant, café, bar | `Restaurant` / `Bakery` / `CafeOrCoffeeShop` with `address`, `geo`, `openingHoursSpecification`, `servesCuisine`, `hasMenu`, `acceptsReservations` |
| Local service, clinic, law firm | `LocalBusiness` subtype (`LegalService`, `Dentist`, `MedicalClinic`, `HomeAndConstructionBusiness`), `Person` for practitioners |
| Event, festival, concert | `Event` / `MusicEvent` / `Festival` with `startDate`, `endDate`, `location` (`Place` + address), `offers` (price, currency, availability, URL), `performer`, `eventStatus`, `eventAttendanceMode` |
| Commerce | `Product` + `Offer` (price, currency, availability), `BreadcrumbList`; `AggregateRating` only from real reviews |
| Editorial, blog | `Article` / `BlogPosting` with `headline`, `datePublished`, `dateModified`, `author`, `image` |
| Education | `Course` with `provider`, `hasCourseInstance` |
| Software | `SoftwareApplication` with `operatingSystem`, `applicationCategory`, `offers` |
| Every site, home page | `Organization` (name, url, logo, sameAs links to real profiles) and `WebSite` |
| Inner pages | `BreadcrumbList` |

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "Forno Alto",
  "url": "https://www.example.com/",
  "image": "https://www.example.com/og/home.png",
  "telephone": "+351 000 000 000",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua do Heroísmo 212",
    "addressLocality": "Porto",
    "addressCountry": "PT"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "07:30",
    "closes": "14:00"
  }],
  "servesCuisine": "Bakery",
  "acceptsReservations": true
}
</script>
```

`FAQPage` markup is valid but Google shows FAQ rich results only for a narrow
set of sites; add it when the page has a real FAQ, without expecting a
snippet. Validate with the Schema Markup Validator and Google's Rich Results
Test; `launch-check.mjs` verifies that every block parses and has a `@type`.

## Local presence and search consoles

List these as launch tasks for the owner, with exactly what to paste:

- **Google Search Console** and **Яндекс.Вебмастер:** verify the domain
  (DNS record preferred, or a meta tag the agent adds), submit the sitemap,
  set the main mirror (Yandex) and target region.
- **Bing Webmaster Tools** (imports from Search Console).
- **Local businesses:** Google Business Profile, Яндекс Бизнес, 2ГИС, and
  Apple Business Connect with the same name, address, phone, and hours as the
  site (NAP consistency); link the site from each.
- **Maps on the page:** a static map image or styled SVG with a link to the map
  service; load an interactive map only on click (facade pattern) so it does
  not cost performance or set cookies before consent.

## Analytics and consent

Choose by audience and law, and record the choice in the report:

- **Privacy-first, no consent banner in most jurisdictions:** Plausible,
  Umami, Fathom, Cloudflare Web Analytics (cookieless, no personal data).
- **Google Analytics 4 or Яндекс Метрика:** set cookies and process personal
  data. In the EU/UK they require prior opt-in consent (GDPR, ePrivacy); in
  Russia, a cookie and personal-data notice and a privacy policy (152-ФЗ).
  Метрика's Webvisor records sessions; enable it only with consent and mask
  form fields.
- Load analytics after consent, never block rendering, and define real
  conversion events (reservation sent, ticket checkout started, call link
  tapped) instead of only pageviews.
- A consent banner is small, does not cover content on mobile, has "accept"
  and "reject" as equal choices, and remembers the decision.

## Legal pages and personal data

- **Privacy policy** whenever the site collects anything personal (forms,
  analytics with cookies, newsletters, orders). For Russian operators under
  152-ФЗ: the policy is published, forms collecting personal data show a
  consent checkbox (not pre-ticked) with a link to the policy, and the
  operator's legal name and contacts are stated.
- **Company details** where law or trust requires them: legal name, registration
  number (ИНН/ОГРН in Russia, Impressum in Germany), address, contact.
- **Terms, refund, and delivery policies** for commerce and ticketing.
- The agent drafts structure and plain-language text, marks them as drafts for
  legal review, and never presents them as legal advice.

## Forms that actually deliver

A form is finished only when a submission reaches a person:

1. A real endpoint: the platform's form handler (CMS plugin, Bitrix component,
   Tilda forms, Netlify or Cloudflare forms), a serverless function, or a
   service such as Formspree. Secrets stay server-side.
2. Server-side validation mirroring the client rules.
3. Spam protection without punishing people: honeypot field plus a minimum
   fill time first; add Cloudflare Turnstile, hCaptcha, or Yandex SmartCaptcha
   only if spam persists.
4. Designed success and failure states; the visitor sees what happens next and
   when.
5. A notification to the owner (email, Telegram bot, CRM) and, where useful, a
   confirmation to the sender.
6. `autocomplete` attributes, correct `type` and `inputmode` for phone, email,
   and numbers, and labels that stay visible.

When the endpoint cannot be configured yet, the form says so on the page and
the report lists exactly what is missing.

## Security headers, redirects, and caching

Ship headers in the host's own format and verify them on the deployed
response.

```text
# _headers (Netlify, Cloudflare Pages)
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

- Vercel uses `headers` in `vercel.json`; nginx uses `add_header ... always`;
  Apache uses `.htaccess`; WordPress, Bitrix, and Tilda set them at the server
  or CDN. Adjust the CSP to every third party actually used (analytics, maps,
  payment, fonts).
- Fingerprinted assets get long immutable caching; HTML revalidates.
- Brotli or gzip compression on text responses; HTTP/2 or HTTP/3.
- Keep a redirect map when replacing an existing site: every old URL with
  traffic or links 301s to its closest new equivalent.
- Publish `/.well-known/security.txt` with a contact for public products.

## Error and utility pages

- **404** designed in the site's direction, with search or the main paths, and
  a real 404 status (not a 200 "soft 404").
- **500/offline** fallback where the platform allows it.
- **Thank-you and confirmation pages** that are `noindex` and fire the
  conversion event.
- **Print styles** for menus, schedules, recipes, articles, and invoices.

## Verification

- `launch-check.mjs` passes with no failures, and every warning is fixed or
  explained in the report.
- Share previews checked with a real link preview (Telegram, Slack, or a
  debugger such as Facebook Sharing Debugger or the VK and LinkedIn
  inspectors).
- Structured data validated; robots, sitemap, canonical, and redirects checked
  on the production host.
- Form submission received end to end; consent and analytics behaviour checked
  with cookies cleared.
- The report lists every owner task (search console verification, business
  listings, analytics IDs, legal review) that the agent could not complete.
