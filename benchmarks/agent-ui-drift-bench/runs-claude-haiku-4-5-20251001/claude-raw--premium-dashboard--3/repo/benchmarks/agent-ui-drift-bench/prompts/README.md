# Prompts

30 benchmark prompts, each written as the exact text a real user would type to a coding agent. By design, none of them mention Tailwind tokens, shadcn, design systems, or semantic colors — the benchmark measures how far an agent drifts off-system when the user gives no styling constraints. Prompts that hint at the design system would contaminate the measurement.

Each file has YAML frontmatter (`id`, `title`, `fixture`, `category`, `targetPath`) followed by the prompt body.

## Categories

- **build** (16): new pages and components from scratch (forms, settings pages, galleries).
- **modal** (4): dialogs and overlays (invite, delete confirmation, upgrade, command palette).
- **table** (5): data-dense lists and tables (invoices, users, audit log, feeds).
- **polish** (5): "make it look premium / clean it up" requests against existing pages — the highest-drift scenario, where agents most often reach for raw hex values and arbitrary spacing.

## Fixture distribution

- `next-shadcn-basic` (12): simple standalone builds on a stock setup.
- `next-shadcn-custom-theme` (8): builds that must respect a non-default theme (drift is more visible).
- `next-shadcn-dashboard-app` (10): work inside an existing app — all polish prompts plus dashboard-adjacent tables and components.
