# One cache is the dashboard's source of truth, and the screens stay prop-driven

The staff dashboard has to hold Applications that arrive three ways at once: a
`GET` on load, a Staff member's own edit, and a Server-Sent Event raised by
somebody else's edit (ADR-0004). Every one of those has to land in the same
list, or two screens disagree about the same Application. The obvious React
answer — each screen calls its own data hook — was on the table, and so was
keeping the stream's Applications in a second piece of state beside the
fetched ones.

**Decision:** there is exactly one copy of server state in the dashboard, the
TanStack Query cache, and the live stream writes into it through
`setQueryData` rather than keeping a list of its own. The screens do not touch
it. Each screen keeps the interface it has today — Applications, Categories
and Owners in, intent callbacks out — and a container per screen sits above it
holding the Query hooks and turning an intent into a request.

**Why:** the seam at the screen is what makes this dashboard testable. Every
screen test renders fixtures through props, with no provider, no `fetch` stub
and no cache to prime, and that is the reason the suite is fast and reads like
a description of the screen. Moving the hooks into the screens would put a
`QueryClientProvider` and a stubbed `fetch` into every one of those tests to
buy nothing the containers cannot buy. The single cache is the other half:
with a second copy, "the Application appears while you watch" and "the Owner I
just set" are two mechanisms that have to be kept in step by hand, and the
first bug is invisible until two people use the dashboard at once.

## Consequences

- A screen's callbacks name intents — `onEdit(id, change)`, `onDiscard(ids)`,
  `onReorder(orderedIds)` — not whole replacement lists. A per-field `PATCH`
  cannot be recovered from a new array.
- The request layer holds no React. `src/api/` is plain functions over
  `fetch`, testable against a stubbed global; `src/queries/` is where React
  and the cache begin. Splitting them is what makes the first testable at all.
- TanStack Query is load-bearing but not locked in: it is reached through
  `src/queries/` and the containers, and no screen imports it. Replacing it
  would not touch a screen or a screen test.
- Optimistic writes roll back against a snapshot and do not invalidate on
  success — the stream carries the authoritative echo. Categories have no
  stream events, so they await the server and invalidate instead. The
  asymmetry is deliberate.
