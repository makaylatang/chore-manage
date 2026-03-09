# Architectural Patterns

## 1. Database Access — Singleton via `getDb()`

Every file that touches the DB calls `getDb()` at the top of the function. The singleton is lazy-initialized and cached in a module-level `_db` variable.

- Defined: `lib/db.ts:8-16`
- Used in every API route and `lib/chores.ts`

```
const db = getDb();
db.prepare<[ParamType], ReturnType>("SELECT ...").get(param)
db.prepare("INSERT ...").run(a, b, c)
db.prepare("SELECT ...").all()
```

Queries always use prepared statements with positional `?` parameters. Generic types on `prepare<Params, Row>` enforce type safety.

---

## 2. Safe Schema Migrations

New columns are added at startup using `PRAGMA table_info` to check before altering. This means the app self-migrates on first run after a code update.

- Pattern: `lib/db.ts:29-32` (team_members.color), `lib/db.ts:46-49` (chores.category)

```
const cols = db.prepare("PRAGMA table_info(table_name)").all() as { name: string }[];
if (!cols.some(c => c.name === "new_col")) {
  db.exec("ALTER TABLE table_name ADD COLUMN new_col TEXT ...");
}
```

New tables use `CREATE TABLE IF NOT EXISTS`. Only additive migrations (new columns/tables) have been needed.

---

## 3. API Route Conventions

All routes live in `app/api/<resource>/route.ts` and export named functions matching HTTP verbs.

- Validate input → run query → return `NextResponse.json(result, { status })`
- Error responses: `{ error: "message" }` with 400/404
- Body is read via `await req.json()`; query params via `new URL(req.url).searchParams`
- `DELETE` and `PATCH` take the resource `id` from the JSON body (not the URL)

Examples: `app/api/chores/route.ts:13-42` (POST), `app/api/team/route.ts:39-47` (DELETE)

---

## 4. Business Logic Lives in `lib/chores.ts`

API routes are thin. Complex logic (recurrence scheduling, rotation) is in `lib/chores.ts` and called from routes.

- `getNextAssignee(choreId)` — `lib/chores.ts:55-76`: circular rotation through team members
- `seedInstances(chore)` — `lib/chores.ts:101-129`: pre-generates 5 weeks of instances on chore creation
- `completeInstance(id)` — `lib/chores.ts:152-196`: marks done, schedules next, returns enriched row
- `nextDueDate()` — `lib/chores.ts:79-98`: date math for daily/weekly/monthly recurrence

Monthly recurrence caps at day 28 (`lib/chores.ts:84`) to avoid month-length edge cases.

---

## 5. Shared Types

All interfaces are exported from `lib/chores.ts:14-52` and imported everywhere with `import type`. This is the single source of truth for `Chore`, `ChoreInstance`, `TeamMember`, `Category`.

`ChoreInstance` carries joined fields (`chore_title`, `member_name`, `member_color`, `chore_category`, `category_color`) populated by SQL JOINs in the instances query — `app/api/instances/route.ts:14-24`.

---

## 6. Client Components + Fetch Pattern

All pages and components are `"use client"`. Data loading follows this pattern uniformly:

```
const [data, setData] = useState([]);
const load = useCallback(async () => { ... fetch ... setData }, [deps]);
useEffect(() => { load(); }, [load]);
```

Parallel fetches use `Promise.all` — `app/page.tsx:15-18`.

The NavBar re-fetches the overdue count whenever `pathname` changes (`components/NavBar.tsx:11-16`), keeping the badge fresh after navigation.

---

## 7. Optimistic UI Updates

Mutations update local state immediately before the API call completes, then refetch to sync.

- Completing a chore chip: `components/WeekCalendar.tsx:78-89` — sets `completed_at` locally, then PATCHes, then refetches
- Changing a category color: `app/page.tsx:57-67` — updates the `categories` array in state, then PATCHes

---

## 8. Filter State — Props-Down Pattern

Filter state (selected members, selected categories) lives in `app/page.tsx`. It flows down as props:

```
app/page.tsx  →  selectedMembers (Set<number>), selectedCategories (Set<string>)
  ├── <Sidebar>   — renders checkboxes, fires onToggle* callbacks up
  └── <WeekCalendar filterMemberIds= filterCategories= >  — filters locally
```

Filtering is client-side: `WeekCalendar` receives all instances for the date window and filters before render (`components/WeekCalendar.tsx:193-198`). Empty set = show all.

---

## 9. Color Storage Pattern

Both team members and categories store a hex color string in the DB (defaults `#6366f1` and `#a855f7` respectively). Dynamic colors cannot use Tailwind utility classes, so they always use inline `style={{ backgroundColor: color }}`.

The same 10-color palette is defined as a `COLORS` constant in three files:
- `components/Sidebar.tsx:6-9`
- `app/team/page.tsx:6-17`
- `components/AddChoreForm.tsx:12-23`

Category color is set at chore-creation time via `INSERT OR IGNORE INTO categories` (`app/api/chores/route.ts:32-36`), which preserves an existing category's color if the name already exists.

---

## 10. Modal Pattern

`AddChoreForm` manages its own open/closed state with a single `open` boolean. When closed it renders a button; when open it renders a full-screen overlay modal. No portal or external library.

- `components/AddChoreForm.tsx:75-83` (closed), `components/AddChoreForm.tsx:86-237` (open)
- Same approach for the color popover in `components/Sidebar.tsx:21-50`, which closes on `onMouseLeave`
