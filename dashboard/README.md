# Dashboard — staff application

Wayfinder (issue #10) is planning-first: this document was written as the
technical specification for the scaffold ahead of the code, so implementation
started from an agreed boundary instead of an assumed one. The scaffold below
is now in place; screen-by-screen design is still open (see
[Scope of this document](#scope-of-this-document)). See
[`../docs/adr/0002-dashboard-as-separate-application.md`](../docs/adr/0002-dashboard-as-separate-application.md)
for why these choices were made, and [`../CONTEXT.md`](../CONTEXT.md) for the
vocabulary — it is binding here too.

The staff dashboard shows staff members the Applications submitted through the
public form and lets them move an Application through its lifecycle. It is not
an email client and does not touch the historical mixed inbox.

## Boundary

- Separate application, sibling to [`../frontend/`](../frontend/). No shared
  workspace package with `frontend/` — each surface owns its own dependencies
  and conventions.
- Own `package.json`, npm — the same package manager as `frontend/`, so the
  repository has one, not two.
- UI components are copied by hand, one at a time as a screen needs them, from
  the local Untitled UI React clone at
  `/home/iliasalmerekov/Projects/Schule/react` (MIT-licensed). No submodule,
  subtree, or npm dependency on the clone — nothing pulls its updates in
  automatically.
- Components keep Untitled UI's own stack (Tailwind CSS, React Aria) and its
  own file layout (components can span several files per folder, some
  `index.ts` barrels exist). `frontend/README.md`'s one-component-per-folder
  and no-barrel-file rules do not apply here — they were written to protect
  the applicant form's design tokens, which this surface does not share.
- The Applications list is the clone's `application/table` (React Aria Table
  under an Untitled UI card), wrapped by `ApplicationTable` in
  `src/components/application/application-table/`. AG Grid Community was the
  original candidate; it did not fit the read-only, no-Enterprise-features
  shape this list needed and nothing in `src/` depends on it anymore.
- Anfragen, Übersicht's "Offene Anfragen" panel and Aussortiert all render
  that one table, so a row looks and behaves the same on every screen. Its
  trailing actions are a `rowActions` list rather than one callback, because
  the three screens do not agree on what a row offers, and the label and the
  confirmation belong to the screen that owns the action.

## Kategorien

Kategorien is where the list an Applicant picks from on the form is
maintained: add, rename, describe, reorder, deactivate and delete, without a
release (`A12`). It is assembled from the same parts Anfragen is — page
header, tab strip over a search field, one `TableCard` — and drops the three
Anfragen has that this list cannot use:

- **no sorting.** The order of the rows _is_ the order of the form, so a
  column heading that reorders them would show a list no Applicant sees.
  Reordering is the arrows in the first column, and they are disabled while a
  tab or a search hides part of the list;
- **no selection column, no pagination.** Four rows, and no bulk action that
  applies to them.

Two rules the screen enforces, both `A15`:

- a Category that Applications are filed under cannot be deleted. The row's
  delete button is disabled and says why; deactivating is offered instead, and
  it takes the Category out of the form while every existing Application keeps
  the Category it was submitted under;
- a Category carries a one-line description, shown under its name on the form.
  The add/edit dialog previews exactly that, because the Staff member editing
  it never sees the form.

The list comes from `useDashboardData` and is handed to Anfragen and to
Übersicht's panel, so a rename here is a rename in the filter, the table and
the drawer at once. The
dialog is React Aria's `Modal` styled from `base/` primitives, not a component
copied from the clone — `THIRD_PARTY_LICENSES` is therefore unchanged by it.

## Aussortiert

Aussortiert is the fourth screen: the Discarded Applications (`A16`). The
delete action on Anfragen and on Übersicht's panel does not erase an
Application — it stamps `discardedAt` and the Application leaves the working
list, the view counts and the panel, keeping its Category, Status, Owner and
notes. From this screen a staff member either restores it, or erases it in a
second, deliberate action, which is the only path in the dashboard that
actually deletes what a person wrote. There is no automatic purge.

Three things follow from that and are worth naming:

- **the wording is not "löschen" on Anfragen.** A button that says it deletes
  and then does not is worse than a longer label, so the row and bulk actions
  there read "aussortieren" and carry an archive icon; "Endgültig löschen"
  exists only on this screen. `CONTEXT.md` spends the same care on the English
  term — Discarded, never "deleted";
- **discarding asks nothing, erasing asks twice over.** A single row is one
  click from being back, so the row action has no confirmation; the bulk
  action confirms because it moves several rows at once, and both erase
  actions name the consequence;
- **the screen sits in the sidebar's footer**, not among the three: it is
  where a staff member goes to undo something, and keeping it out of the main
  list also keeps the one screen that can erase an Application away from the
  three that cannot.

The screen drops what this list cannot use — no named views, no filter bar, no
drawer, and no unread emphasis, since a discarded Application without an Owner
is not waiting for one. It keeps the selection column, the pager and the
search field.

`discardedAt` lives on `Application`, not on a list of its own, so the working
list is `applications` minus this predicate and nothing has to be kept in step:
`isDiscarded` in `src/domain/application.ts` is what Anfragen's filter,
Übersicht's selector and Kategorien's count all read. Kategorien counts
discarded Applications in its delete guard and not in its "Anfragen" column,
the split `API.md` specifies — a discarded Application still needs its
Category's name for the day it is restored (`A15`).

## Read and unread rows

An Application with no Owner reads as unread (`A14`): a dot at the row's left
edge, the applicant's name in bold, and a tinted row. One with an Owner reads
as plain text. The state is derived from `ownerId` through `isUnassigned` in
`src/domain/application.ts` on every render, never stored — assigning an Owner
in the drawer turns the row plain, clearing one turns it back.

The dot is `aria-hidden`: the Zuständigkeit column already says "Nicht
zugewiesen" in words, and any text in the name cell lands in the row header's
accessible name.

## Language

The dashboard UI is German (`A6`) — staff members are German speakers. Code
identifiers, this specification, comments, and tracker prose stay English, the
same split `frontend/` uses for its own copy versus its own code.

German UI labels belong in UI copy. Documents and the glossary use English
domain terms without German translations or bilingual label tables. See
[ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md).

That split is also why the backend sends an error `code` and never a German
sentence ([`API.md`](./API.md), "Errors"). Both code tables are worded in
`de.errors` — `codes` for a problem's top-level `code`, `fields` for one entry
of its `errors` array — and `src/content/errorMessage.ts` is what looks a code
up, falling back to `de.errors.general` for one it does not know. A failure is
worded once: where the dashboard checks the same thing itself, as Kategorien's
dialog does for an empty or duplicate name, it reads the same string rather
than keeping a second one.

## Attribution

`dashboard/THIRD_PARTY_LICENSES` carries Untitled UI React's MIT notice and
lists every component copied from the clone. It is a source-tree file, not
something shown in the UI — the same treatment `frontend/public/fonts/OFL.txt`
already gets for the Nunito font licence. Update it in the same commit as any
new component copy.

## Scope of this document

In scope: the application boundary, the component-sourcing mechanism, and the
conventions that follow from both — enough to start the scaffold.

Out of scope, still open, and not decided here: screen-by-screen design, the
backend contract, and the final specification structure and acceptance/demo
walkthrough. These are the remaining items on the Wayfinder map (issue #10)
and follow once this boundary is built on.

## Getting started

Requires Node 24 (see `.nvmrc`; `nvm use` picks it up).

```bash
npm ci
npm run dev
```

| Command                           | What it does                  |
| --------------------------------- | ----------------------------- |
| `npm run dev`                     | Dev server on port 5174       |
| `npm run build`                   | Production build into `dist/` |
| `npm run preview`                 | Serve the built output        |
| `npm run typecheck`               | `tsc --noEmit`                |
| `npm run lint` / `lint:fix`       | ESLint                        |
| `npm run format` / `format:check` | Prettier                      |
| `npm test` / `test:watch`         | Vitest                        |

The dev server proxies `/api` to `http://localhost:8080`, so it wants the
backend running on its default port (`backend/README.md`). Development is
same-origin for the same reason production is: the Sign-in cookie is
`SameSite=Strict` and would not travel to a second origin. There is no
`VITE_API_BASE_URL` and no Mock Service Worker — `vite.config.ts` mirrors
`nginx.conf` location for location, the live stream included, and `API.md`'s
"Deployment" section says why.

CI (`.github/workflows/dashboard.yml`, mirroring `frontend.yml`, scoped to
`dashboard/`) runs typecheck, ESLint, format check, tests and the build on
every pull request touching this directory.

## What does not exist yet

All four sidebar items now have a screen behind them; the links still carry
fragments (`#overview`) and `AppShell` is told which one is current, since
there is no router. The backend contract is now written down in
[`API.md`](./API.md) and awaits agreement with the backend team (issue #16);
until it is implemented every screen reads mock data, and an edit made on
Kategorien lives for the session only.

Two findings about the clone are worth writing down here, because both are
work that the Untitled UI website makes look like a copy.

### The clone holds fewer finished blocks than the Untitled UI site

Untitled UI's site shows Metrics cards, filter bars, page headers and whole
dashboard examples. The clone does not contain them — a search for `metric`,
`kpi`, `filter-bar` and `page-header` matches no file in it. What the clone
does hold: `application/app-navigation/sidebar-navigation`,
`application/table`, `application/charts`, `application/pagination`,
`application/tabs`, `application/modals`, `application/slideout-menus` (the
drawer), `application/empty-state`, `application/date-picker`, and the `base/`
primitives — buttons, input, select, dropdown, badges, avatar, tooltip,
checkbox, tags, textarea, toggle.

So the metric cards, the filter bar and the page header are assembled from
`base/` primitives here. Budget for that in issue #17.

### Copying one component brings the whole theme with it

The clone's components style themselves with Untitled UI's own semantic
Tailwind tokens (`bg-primary`, `text-secondary`, `border-secondary`), defined
in the clone's `styles/theme.css` (834 lines) and `styles/typography.css`. They
also expect the `@tailwindcss/typography`, `tailwindcss-react-aria-components`
and `tailwindcss-animate` Tailwind plugins and the `motion` and
`@untitledui/icons` packages. A component copied without those renders
unstyled, so the first copy is a theme decision, not a file copy.

The sidebar copy made that decision: `src/styles/untitledui-theme.css` keeps
the clone's token _names_, so a copied component reads the same as its
original, and gives them the association's palette instead of Untitled UI's.
It is the subset the sidebar uses, not the whole 834 lines, and it grows one
token at a time with the next copy. None of the three Tailwind plugins came
with it — each place that needed one was rewritten against plain Tailwind or
React Aria, and the file comments say where. Only `@untitledui/icons` and
`tailwind-merge` were added as dependencies.

## The copied components

`src/components/` mirrors the clone's own file layout, and `@/` resolves to
`src/` so a copied file's imports stay close to the original — the point is
that a copy can still be diffed against the clone when it changes upstream.
Every copied file opens with a comment naming its path in the clone and what
was changed here; `THIRD_PARTY_LICENSES` lists them all.

The sidebar is the clone's `sidebar-simple`, with its three main items —
Übersicht, Anfragen, Kategorien — Aussortiert in its footer slot, and the
account card at the bottom. Three things went differently:

- the clone's two search inputs are gone. The Anfragen screen has its own
  filter bar, and a second search box that searches nothing is dead UI;
- the account card lost the account switcher. The clone lets a person hold
  several accounts and add another; this dashboard has one Staff member signed
  in, and its menu is Profil ansehen / Einstellungen / Abmelden;
- a string or number badge on a nav item renders as a small pill rather than
  the clone's `Badge`, whose variants no screen needs yet. The copy of
  `base/badges` here is cut down to the two the dashboard does render — `Badge`
  in a table cell and `BadgeWithDot` for an Application's Status.

## How `src/` is laid out

Seven directories, each with one job, so a reader can tell copied UI from this
application's own code, both from the domain, and all three from the wire:

| Directory         | Holds                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| `src/app/`        | routing and the shell: `App`, `AppShell`, `useCurrentScreen`, `DashboardGate`         |
| `src/features/`   | one folder per screen — `overview`, `applications`, `categories`, `discarded`, `auth` |
| `src/components/` | UI shared across screens (see below)                                                  |
| `src/domain/`     | `Application`, `Category`, `StaffMember` and the predicates over them                 |
| `src/api/`        | the wire: one transport over `fetch`, one module per resource. No React               |
| `src/queries/`    | the cache: query keys, the Query hooks, the stream's bridge into `setQueryData`       |
| `src/data/`       | test fixtures, and nothing else                                                       |

Inside `src/components/`:

- `base/`, `application/`, `foundations/`, `ui/` — copies from the clone and
  the shadcn/ui registry, in their upstream file layout;
- `shared/` — what this application assembles from those primitives because
  the clone ships no equivalent: `page-header`, `empty-state`, `tab-strip`;
- `application/application-status/` — `status-styles.ts`, the one place an
  Application's Status maps to a colour, read by both the table row and the
  drawer so a palette change cannot leave the two disagreeing.

## How the dashboard talks to the backend

The shape below was agreed in issue #28 and is recorded in
[ADR-0006](../docs/adr/0006-one-cache-and-prop-driven-screens.md). One
sentence carries the rest: there is exactly one copy of server state — the
TanStack Query cache — and no screen touches it.

**`src/api/` is the wire, and it holds no React.** One transport function
sends `credentials: 'same-origin'`, sets the headers, and on a failed response
parses the `application/problem+json` body into a typed `ApiProblem` —
`status`, `code`, and the `errors` array — which it throws. It throws rather
than returning a result because that is TanStack Query's own contract: what is
thrown becomes `error`. Above it sits one module per resource, each returning
domain types, so the wire-to-domain mapping happens in one place and nothing
above `src/api/` ever sees `fetch`.

**`src/queries/` is the cache.** Query keys live in one module, because the
list's key is read by its own hook, by the stream and by every optimistic
mutation, and keys scattered across hooks would have the stream importing a
hook for a string. Beside them: the Query hooks, one small helper that writes
the `cancelQueries` / snapshot / rollback triad once for the four optimistic
moves, and `useApplicationStream`, called once from `AppShell`, which owns the
`EventSource` and reports whether the dashboard is live. What an event does to
the list is a pure function, so the rules — created adds, updated replaces,
deleted removes — are tested without an `EventSource`, jsdom or a timer.

**Writes are not symmetrical, on purpose.** Status, Owner, discard and restore
are optimistic and do not invalidate on success: the stream brings the
authoritative echo, and invalidating on every debounced save would refetch the
whole list. A failure rolls back to the snapshot and then invalidates to
resync. Categories raise no stream events, so they await the server and
invalidate instead.

**Loading and failure are answered once.** `DashboardGate` sits between
`AppShell` and the screen, subscribed to the same keys, and shows the skeleton
or the failure until the data is there. Its real payoff is below it: no
container and no screen handles `Application[] | undefined`, and no screen
test writes the case where the data has not arrived.

**A Sign-in that has expired is recognised in one place too.** The transport
knows nothing about sessions; the `QueryClient`'s cache-level error callbacks
see `UNAUTHENTICATED`, clear the session entry, and `AppShell` covers the
dashboard with the sign-in screen while the work stays alive. The stream's own
"do not flicker on the first reconnect" rule belongs to
`useApplicationStream`, since it is about `EventSource` and not about
requests.

### What each layer takes for a test

- `src/api/` — a stubbed global `fetch`: the method, the path, the body, the
  wire-to-domain mapping, and the `problem+json` decoding. No React.
- the pure functions — the stream's event application, and the State-change
  replay behind Übersicht's sparklines — plain unit tests.
- the screens — unchanged: fixtures through props, no provider, no `fetch`.
- the containers — only where they carry logic, such as an optimistic
  rollback or a draft surviving a failure, with a real `QueryClient` at
  `retry: false` and `gcTime: 0`.

There is no Mock Service Worker, and `src/data/` is fixtures only.

### What a screen hands upward

A screen's callbacks name intents, not replacement lists:
`onEdit(id, change)`, `onDiscard(ids)`, `onRestore(ids)`, `onErase(ids)`, and
on Kategorien `onCreate`, `onEdit`, `onSetActive`, `onDelete` and
`onReorder(orderedIds)` — the last matching the body of
`PUT …/categories/order`. The whole-list setters `useDashboardData` handed down
cannot survive a per-field `PATCH`: which Application changed, and in which
field, is not recoverable from a new array.

What those callbacks carry lives in `src/domain/`, not in the component that
happens to raise it: `ApplicationEdit` is the body of `PATCH /applications/{id}`
and `CategoryDraft` the body of `POST /categories`, so `src/api/` can name both
without importing a screen. `moveCategory` produces the resulting order as ids
rather than a new list, for the same reason.

One piece of state deliberately sits in the container rather than in the
component that renders it. The internal-notes draft — one at a time, because
one drawer is open at a time — lives above `ApplicationDrawer`, which stays
pure and takes the value and the change handler as props. While a draft
exists, the field does not read the cache, so a stream event cannot overwrite
text typed since the request left, and closing the drawer flushes the request
without discarding the draft: it survives until the write succeeds, so a
failure leaves the typed text where the Staff member can still see it.
