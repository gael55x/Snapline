---
id: audit-log-table
title: Audit log table
fixture: next-shadcn-dashboard-app
category: table
targetPath: src/app/admin/audit-log/page.tsx
---

Build an audit log page for admins with a table of events: timestamp, actor, action (e.g. "user.login", "project.delete"), target, and IP address. Add a severity indicator per row (info, warning, critical) and a date range filter plus a free-text search at the top. Clicking a row should expand it to show the full event payload as formatted JSON. Include an "Export CSV" button.
