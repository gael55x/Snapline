# @usesnapline/core

The agent-independent Snapline engine: deterministic TSX/JSX scanning, nine UI
drift rules, repair-contract generation, scoring, and conservative safe fixes.

```sh
npm i @usesnapline/core
```

The core reads source files locally and makes no network requests. Its current
syntax and rule boundaries are documented in the
[architecture](https://github.com/gael55x/Snapline/blob/main/docs/architecture.md)
and [rules reference](https://github.com/gael55x/Snapline/blob/main/docs/rules.md).

Most users should install
[`@usesnapline/cli`](https://www.npmjs.com/package/@usesnapline/cli) instead.
