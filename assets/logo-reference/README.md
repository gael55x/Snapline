# Logo reference (internal)

This directory holds internal-only brand reference material.

`old-plumb-logo-reference.png` is the logo of the project's previous internal
codename. That name and mark are **retired and must never ship**: there is an
existing Claude Code-adjacent AI devtool using the name, with overlapping CLI
conventions, Claude skills, dot-directory state, and "keep things true"
positioning. Treat everything here as historical reference for the rebrand
only.

Rules:

- No public artifact (README, docs, package metadata, plugin metadata, npm,
  marketing) may use the old name or mark.
- The Snapline logo lives at `assets/snapline-logo.png` (teal reticle mark +
  lowercase wordmark on dark). It is the only mark that ships.
- CI's docs:check fails any doc outside `assets/` that mentions the old name.

(The PNG itself is not committed to keep retired branding out of the public
repository; this note documents why the placeholder exists in the layout.)
