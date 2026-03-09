# manage-chore

Office chore management app: assign recurring chores to team members with a calendar view, auto-rotation, and per-category/member color labels.

## Tech Stack

- **Framework:** Next.js 15 (App Router, `app/` directory)
- **Database:** SQLite via `better-sqlite3` (synchronous, file `chores.db`)
- **Styling:** Tailwind CSS v4 + inline `style` for dynamic colors
- **Date math:** `date-fns`
- **Language:** TypeScript throughout

## Key Directories

| Path | Purpose |
|---|---|
| `lib/db.ts` | DB singleton, schema init, safe migrations |
| `lib/chores.ts` | All shared types + business logic (recurrence, rotation, seeding) |
| `app/api/` | REST API routes — one directory per resource |
| `app/` (pages) | Client components: `page.tsx`, `chores/page.tsx`, `team/page.tsx` |
| `components/` | Shared UI: `WeekCalendar`, `Sidebar`, `ChoreChip`, `NavBar`, `AddChoreForm` |

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (also runs TypeScript check)
npm start        # Serve production build
```

No test suite currently. Use `npm run build` to catch type errors.

## Data Model (quick reference)

Four tables: `team_members`, `chores`, `categories`, `chore_instances`.
Schema defined at `lib/db.ts:19-67`. Types at `lib/chores.ts:14-52`.

## Key Config

- `next.config.ts:3` — `serverExternalPackages: ['better-sqlite3']` (required for native module)
- `postcss.config.mjs` — Tailwind v4 via `@tailwindcss/postcss`

## Additional Documentation

Check these files when working on the relevant area:

- `.claude/docs/architectural_patterns.md` — API conventions, DB access, state management, recurrence logic, optimistic updates, migration strategy

## Note
Bug fix: when the user clicks on the calendar in weekly view to add a new chore, the time of the new chore doesn’t reflect the cell the user clicked.
