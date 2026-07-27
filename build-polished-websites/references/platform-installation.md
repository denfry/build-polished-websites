# Install on Claude Code, Codex, and OpenCode

The skill is a portable directory. Keep `SKILL.md`, `scripts/`, `references/`,
and `agents/` together.

From the standalone repository, use:

```powershell
.\install.ps1 -Agent all -Scope user
```

or:

```bash
./install.sh --agent all --scope user
```

The installers refuse an existing destination by default. Replace mode first
moves the existing skill to a timestamped backup.

## Claude Code

Install for one project:

```text
.claude/skills/build-polished-websites/
```

Install for the current user:

```text
~/.claude/skills/build-polished-websites/
```

Claude Code discovers `SKILL.md` from these directories. Restart the session if
the top-level skills directory did not exist when the session started.

Official reference:
https://code.claude.com/docs/en/skills

## Codex

Install for one project:

```text
.agents/skills/build-polished-websites/
```

Install for the current user:

```text
~/.agents/skills/build-polished-websites/
```

Keep `agents/openai.yaml`; it provides Codex UI metadata and does not change the
portable skill instructions.

Official reference:
https://learn.chatgpt.com/docs/customization/overview

## OpenCode

OpenCode reads both the shared agent location and its native location:

```text
.agents/skills/build-polished-websites/
.opencode/skills/build-polished-websites/
```

User-level alternatives:

```text
~/.agents/skills/build-polished-websites/
~/.config/opencode/skills/build-polished-websites/
```

Use one location per scope to avoid duplicate IDs.

Official reference:
https://opencode.ai/docs/skills

## One canonical copy

Prefer `.agents/skills/` when a single checked-in copy must serve Codex and
OpenCode. Claude Code needs `.claude/skills/`; use a supported directory
symlink when the team and operating systems handle symlinks reliably, otherwise
copy the directory and update both copies together.

For a standalone skill repository, install the repository directory into the
appropriate location rather than duplicating its contents inside the repository.
