# Security and privacy

Snapline is a local developer tool. The scanner parses source files, project
configuration, component metadata, and git-changed paths on the developer's
machine. It does not call an LLM, start a server, or transmit source code,
design tokens, prompts, findings, or repair contracts.

## Trust boundary

The process working directory is the project boundary. Hook payloads cannot
replace it. Explicit scan/fix paths must be project-relative; absolute paths,
`..` traversal, and symlinks that resolve outside the project are rejected.
New or deleted paths are checked against the canonical nearest existing parent
so containment does not disappear during edits.

Snapline parses `snapline.yml` as data. It does not evaluate JavaScript config
or interpolate shell commands. Git and the plugin launcher use argument arrays,
not a shell. Agent hook configuration is executable project configuration, so
Claude/Codex trust prompts and Cursor workspace trust still matter: inspect the
generated hook files before approving an unfamiliar repository.

## Local output and logs

Human, JSON, and agent reports include offending source snippets. Treat those
outputs like source code when redirecting them into CI artifacts or issue
reports.

There is no remote telemetry. Setting `SNAPLINE_HOOK_LOG` opts into a local
JSON-lines file containing agent, hook kind, action, duration, and file paths.
The benchmark uses this for repair-loop measurements. Leave it unset to write
nothing.

`.snapline/` is local state and self-gitignored. Current production scans do not
use a persistent cache.

## Commands with broader effects

- `snapline fix --safe` writes only explicitly selected project files and only
  applies codemods marked mechanical. Use `--dry-run` first in sensitive repos.
- `snapline install` and `uninstall` edit project hook settings while
  preserving unrelated entries.
- `snapline benchmark` runs repository-owned benchmark scripts and is intended
  for the Snapline source repository, not arbitrary package consumers.

## Dependency audit

`pnpm audit --prod` reported no known vulnerabilities against the candidate
lockfile on 2026-07-13. This is a registry snapshot, not a permanent guarantee;
rerun it on the final tag commit.

## Reporting a vulnerability

Do not open a public issue with an exploit or sensitive source. Use the
repository's private GitHub security-advisory reporting path. General bugs can
use the public issue tracker. The standard support policy is in
[`SECURITY.md`](../SECURITY.md).
