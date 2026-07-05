---
id: subscription-history
title: Subscription history
fixture: next-shadcn-dashboard-app
category: table
targetPath: src/components/billing/subscription-history.tsx
---

Add a subscription history section to the billing page showing every plan change: date, event (Upgraded, Downgraded, Renewed, Canceled), plan name, amount charged, and who made the change. Upgrades and downgrades should be visually distinguishable at a glance. Show the most recent events first and collapse anything older than a year behind a "Show older" toggle.
