---
id: api-keys-page
title: API keys page
fixture: next-shadcn-custom-theme
category: build
targetPath: src/app/settings/api-keys/page.tsx
---

Build an API keys page where developers can manage their keys. List existing keys with a name, a masked key (sk-...abc4) with a copy button, created date, last used date, and a revoke action. Add a "Create key" button that opens a form asking for a name and scope (Read only / Full access), then shows the full key once with a warning that it won't be shown again.
