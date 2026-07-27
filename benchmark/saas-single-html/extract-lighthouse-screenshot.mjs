#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const [reportArg, outputArg] = process.argv.slice(2);

if (!reportArg || !outputArg) {
  console.error(
    "Usage: node extract-lighthouse-screenshot.mjs <report.json> <output.png>",
  );
  process.exitCode = 1;
} else if (extname(outputArg).toLowerCase() !== ".png") {
  console.error("Output must use the .png extension.");
  process.exitCode = 1;
} else {
  const reportPath = resolve(reportArg);
  const outputPath = resolve(outputArg);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const dataUrl =
    report.audits?.["full-page-screenshot"]?.details?.screenshot?.data ??
    report.audits?.["final-screenshot"]?.details?.data;

  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error(`${reportPath}: Lighthouse screenshot data is missing`);
  }

  const match = /^data:image\/(?:png|webp|jpeg);base64,(.+)$/s.exec(dataUrl);
  if (!match) {
    throw new Error(`${reportPath}: unsupported screenshot encoding`);
  }

  await writeFile(outputPath, Buffer.from(match[1], "base64"));
  console.log(`Wrote ${outputPath}`);
}
