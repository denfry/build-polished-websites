import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPage, launchCheck } from "./launch-check.mjs";

const scriptPath = fileURLToPath(new URL("./launch-check.mjs", import.meta.url));
const directory = await mkdtemp(join(tmpdir(), "launch-check-"));

const good = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Harbour tide tables for Gdańsk Bay, updated daily</title>
<meta name="description" content="Daily tide tables for Gdańsk Bay from the port authority feed, with high and low water times for the next fourteen days.">
<link rel="canonical" href="https://tides.example.org/">
<meta name="theme-color" content="#0b5cad">
<meta property="og:title" content="Gdańsk Bay tide tables"><meta property="og:description" content="High and low water for fourteen days.">
<meta property="og:image" content="https://tides.example.org/og.png"><meta property="og:url" content="https://tides.example.org/">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Tides","url":"https://tides.example.org/"}</script>
</head><body><main><h1>Tide tables</h1><h2>Today</h2>
<img src="/chart.png" alt="Tide curve for today" width="800" height="400">
<form><label for="email">Email</label><input id="email" type="email" autocomplete="email"><p><a href="/privacy">Privacy policy</a></p></form>
</main></body></html>`;

const bad = `<html><head><title>Home</title>
<meta property="og:image" content="/og.png">
<script type="application/ld+json">{ broken </script>
</head><body><h1>A</h1><h1>B</h1><h4>Skip</h4>
<img src="x.png"><a href="#">More</a><a href="https://x.test" target="_blank">Out</a>
<form><input type="email" name="email"></form></body></html>`;

try {
  const goodResult = checkPage(good, "good.html");
  const goodFailures = goodResult.issues.filter((issue) => issue.level !== "info");
  assert.deepEqual(goodFailures, [], `good page reported: ${goodFailures.map((issue) => issue.id).join(", ")}`);
  assert.deepEqual(goodResult.jsonLdTypes, ["WebSite"]);

  const badIds = checkPage(bad, "bad.html").issues.map((issue) => issue.id);
  for (const id of ["doctype", "lang", "charset", "viewport", "title-length", "description", "og-image-absolute",
    "favicon", "h1", "main", "heading-order", "img-alt", "img-size", "dead-links", "target-blank", "jsonld-parse",
    "form-labels", "privacy"]) {
    assert.ok(badIds.includes(id), `bad page should report ${id}`);
  }

  const site = join(directory, "site");
  await mkdir(site);
  await writeFile(join(site, "index.html"), good);
  await writeFile(join(site, "about.html"), good);
  await writeFile(join(site, "robots.txt"), "User-agent: *\nDisallow: /\n");
  await writeFile(join(site, "sitemap.xml"), "<urlset><url><loc>http://insecure.test/</loc></url></urlset>");
  const siteResult = await launchCheck([site], "https://other.example.org");
  const siteIds = siteResult.issues.map((issue) => issue.id);
  for (const id of ["robots-block", "robots-sitemap", "sitemap-format", "404", "duplicate-title", "canonical-host"]) {
    assert.ok(siteIds.includes(id), `site check should report ${id}`);
  }

  const failing = spawnSync(process.execPath, [scriptPath, site], { encoding: "utf8" });
  assert.equal(failing.status, 1, "failures must exit 1");
  const goodFile = join(directory, "good.html");
  await writeFile(goodFile, good);
  const passing = spawnSync(process.execPath, [scriptPath, goodFile, "--json"], { encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stdout + passing.stderr);
  assert.equal(JSON.parse(passing.stdout).failures, 0);
  assert.equal(spawnSync(process.execPath, [scriptPath], { encoding: "utf8" }).status, 2);

  process.stdout.write("launch-check tests passed\n");
} finally {
  await rm(directory, { recursive: true, force: true });
}
