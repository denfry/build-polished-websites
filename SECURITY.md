# Security Policy

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose users,
credentials, repositories, or production systems.

Use GitHub's **Report a vulnerability** flow in the Security tab of this
repository. Include:

- affected files and versions;
- realistic impact and prerequisites;
- reproduction steps or a minimal proof of concept;
- suggested mitigation, if known.

Avoid sending real credentials, personal data, or third-party proprietary code.
Use synthetic values and redact logs.

## Scope

Security reports are especially relevant for:

- installer path handling, replacement, and rollback;
- secret exposure in platform guidance;
- unsafe shell, HTML, SQL, URL, or filesystem recommendations;
- cross-tenant or authorization mistakes in CMS guidance;
- supply-chain behavior in CI and installation;
- Lighthouse report parsing or local file handling.

This repository contains instructions and local validation scripts. It does not
run a hosted service or collect user data.

## Supported version

Security fixes are applied to the latest revision of the `main` branch.
