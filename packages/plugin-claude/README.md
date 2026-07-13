<p align="center">
  <img src="https://raw.githubusercontent.com/gael55x/Snapline/main/assets/snapline-logo.png" alt="Snapline logo" width="320" />
</p>

# Snapline — Claude Code plugin

Keep AI-generated UI on-system. This plugin wires Snapline's drift scanner into
Claude Code's lifecycle:

- **PostToolUse** (`Write|Edit|MultiEdit`): scans the edited TSX file. Errors
  block with an exact repair contract; Claude repairs itself before continuing.
- **Stop**: scans the full changed set. Claude cannot finish while severe drift
  remains.

## Install

The plugin calls the Snapline CLI, so the project needs it:

```sh
npm i -D @usesnapline/cli
npx snapline init
```

Then add the plugin from the Snapline marketplace:

```
/plugin marketplace add gael55x/Snapline
/plugin install snapline
```

If the CLI is missing, hooks allow without breaking the session and return
visible recovery context telling Claude how to install it.

## Metadata

- Category: agent UI repair hook
- Topics: ai-coding-agent, agent-hooks, claude-code, codex, cursor,
  tailwindcss, shadcn-ui, react, nextjs, design-system, ui-drift,
  repair-contracts, developer-tools, open-source

Docs: [github.com/gael55x/Snapline](https://github.com/gael55x/Snapline)
