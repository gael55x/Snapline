---
id: team-invite-modal
title: Team invite modal
fixture: next-shadcn-custom-theme
category: modal
targetPath: src/components/team/invite-member-dialog.tsx
---

Add an "Invite member" modal that opens from the team page. It needs an email input that accepts multiple comma-separated addresses, a role selector (Admin or Member) with a short description of each role, and an optional personal message textarea. Show a count of remaining seats on the plan, disable the invite button when over the limit, and show a success state after sending.
