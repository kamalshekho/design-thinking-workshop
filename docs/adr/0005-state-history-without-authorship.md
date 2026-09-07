---
status: accepted
---

# State changes are recorded without authorship, and the dashboard replays them

Übersicht's three metric cards — "Neue Anfragen", "Ohne Zuständigkeit" and
"Lange offen" — each show a seven-day sparkline beside their number. The number
is a filter over the current list. The seven days are not: what a card read
last Tuesday depends on what `status` and `ownerId` were last Tuesday, and an
Application carries only its current pair. Replaying today's values across the
week produces a curve that is confidently wrong — an Application moved to
`IN_REVIEW` this morning counts as "not new" for all seven days, and a restored
Application counts as present on the days it was discarded.

**Decision:** the backend records every change to the three fields those cards
read — `status`, `owner` and `discarded` — as a State change: one row per
changed field, carrying `applicationId`, `at`, `field` and the new value.
`GET /api/v1/staff/applications/changes?days=30` hands the raw rows over and
the dashboard replays them backwards from the current state. A row records no
author. `internalNotes` is not recorded. The absence of rows means "unchanged
since submission", which makes seeded data responsible for writing the changes
that lead to the state it seeds. `DELETE …/permanently` cascades to an
Application's rows.

**Why the dashboard replays instead of the server aggregating:** "how many were
new last Tuesday" is the definitions of open (`A13`), stale (`A19`) and
unassigned (`A14`), asked about a past date. Those definitions already live in
the dashboard, in one function the whole application shares, because the
dashboard holds the entire list. A server-side metrics endpoint would implement
them a second time in Java, where the two copies would drift and the card's
number would stop matching the list a click on it opens — which is the one
property the cards were built around.

**Why no author:** with a record of who changed what, this becomes an audit log
of five colleagues' clicks. No screen shows authorship, nothing in the process
the association described asks for it, and the field would exist only because
it was easy to add. Recording _what_ and _when_ answers the trend; recording
_who_ answers a question nobody asked and creates data to defend. This is what
lets `API.md` keep saying "no audit log" while a history exists.

**Consequences worth naming:** a sparkline's past is not immutable — erasing an
Application lowers figures already shown for earlier days, because the cascade
is the point of erasing and outranks the accuracy of a decorative curve. The
stream gains no new event type: `application.updated` already carries the full
Application, the dashboard derives the change from the value it held before, and
on every stream `open` it refetches the changes alongside the list, the same way
[ADR-0004](./0004-server-sent-events-for-the-dashboard.md) makes the list
correct. And a seeder that writes a state without its history makes every trend
in the demo flat, which is the failure mode this decision is most likely to meet
in practice.
