# Contributing

Thank you for improving `build-polished-websites`.

## Good contributions

- Correct a platform rule using primary vendor documentation.
- Add a focused playbook for a widely used CMS or builder.
- Improve triggering without making the skill load for unrelated work.
- Add a deterministic check or a reproducible failure fixture.
- Tighten security, accessibility, performance, or editor safeguards.
- Replace an anti-slop rule with a clearer product-driven heuristic.

Keep the main `SKILL.md` concise. Put platform-specific detail in a directly
linked file under `references/`.

## Before opening a pull request

Run:

```bash
node build-polished-websites/scripts/verify-package.mjs
node build-polished-websites/scripts/lighthouse-gate.test.mjs
node build-polished-websites/scripts/slop-scan.test.mjs
node build-polished-websites/scripts/launch-check.test.mjs
bash -n install.sh
```

On Windows, also parse `install.ps1`:

```powershell
$tokens = $null
$errors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path .\install.ps1),
  [ref]$tokens,
  [ref]$errors
)
if ($errors.Count -gt 0) { $errors; exit 1 }
```

## Platform guidance

- Prefer official, current vendor documentation.
- State version constraints when behavior differs by release.
- Preserve the platform's source of truth and editor workflow.
- Never recommend editing core, vendor, or generated output as a normal path.
- Include security, cache invalidation, verification, and rollback implications.
- Avoid secrets, private customer artifacts, and proprietary code in fixtures.

## Pull requests

Keep each pull request focused. Explain:

- the problem;
- the chosen change;
- the evidence or official documentation;
- how you validated it;
- any compatibility or migration risk.

By contributing, you agree that your contribution is licensed under Apache-2.0.
