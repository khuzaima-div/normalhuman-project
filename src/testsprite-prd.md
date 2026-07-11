# Normal Human — Test PRD
## App
AI-powered email client (Next.js 15)

## Core flows to test
1. Sign in via Clerk at /sign-in
2. Open /mail — 3-panel layout: sidebar, thread list, reading pane
3. Sidebar: Inbox / Drafts / Sent navigation, account switcher
4. Thread list: select email, search (press /)
5. Reply box: expand To/Cc/Subject, type reply, Send
6. Sidebar Ask AI: suggestion pills, chat input, send
7. Inbox/Done toggle on inbox view
8. Theme toggle (light/dark)
9. Compose button opens drawer

## Success criteria
- No console errors on main flows
- Navigation updates thread list
- Selected thread shows in reading pane
- Reply UI renders without crash