# Dashboard API contract

What the staff dashboard needs from the backend, written down so it can be
built without a meeting. This is the second half of the platform's API: the
first half, the public applicant form, is specified in
[`../frontend/API.md`](../frontend/API.md) and is already implemented.

Terminology follows [`../CONTEXT.md`](../CONTEXT.md). Identifiers, enum values
and wire formats are English; every German string a staff member reads lives in
`src/content/de.ts` and is not sent by the backend
([ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md)). The
one exception is Category data, which staff members maintain and applicants
read — see [Categories](#categories).

Status: **proposed, awaiting agreement with the backend**. Every screen in
`dashboard/` currently reads mock data; nothing here is implemented on either
side. The decisions are collected [at the end](#decisions).

## Contents

- [Scope](#scope)
- [What already exists, and what this contract adds](#what-already-exists-and-what-this-contract-adds)
- [Wire names](#wire-names)
- [Sign-in and staff members](#sign-in-and-staff-members)
- [Applications](#applications)
- [State changes](#state-changes)
- [Categories](#categories)
- [Route selections](#route-selections)
- [The live stream](#the-live-stream)
- [Errors](#errors)
- [Deployment](#deployment)
- [Not in this contract](#not-in-this-contract)
- [Decisions](#decisions)
- [What the dashboard changes on its own side](#what-the-dashboard-changes-on-its-own-side)

## Scope

The dashboard is the staff members' side of the platform: three screens today
(Übersicht, Anfragen, Kategorien) and a fourth for discarded Applications
(`A16`). It reads every Application, edits four fields on them, reads their
[state history](#state-changes) so that Übersicht's three metric cards carry a
real seven-day trend, maintains the Category list (`A12`), reads the
route-selection counters, and receives changes made elsewhere over a live
stream (`A18`).

Two rules shape everything below.

**Everything is behind a Sign-in.** All paths in this document sit under
`/api/v1/staff/`, and every one of them except `POST /api/v1/staff/session`
requires an authenticated Sign-in. The prefix exists so that the rule is one
line in Spring Security and one location block in the proxy. The form's three
public endpoints keep the paths they have, unchanged.

**The dashboard holds the whole list.** There is no server-side search,
filtering, sorting or pagination. `GET /api/v1/staff/applications` returns
every Application, and the dashboard computes its views, its metric cards and
its seven-day trends from that array. The association receives Applications in
dozens, not thousands — the roughly thousand emails the client described (`C2`)
are the Backlog (`A3`), which the dashboard does not touch. This is a deliberate
trade: it keeps definitions such as "open" (`A13`), "stale" (`A19`) and
"unassigned" (`A14`) in one place instead of implementing them a second time in
Java, where they would drift.

The same rule decides the shape of [state changes](#state-changes): the backend
hands over the raw changes and the dashboard replays them, rather than the
backend computing "how many were new last Tuesday" — that question is those
same three definitions, asked about a past date.

Both parts sit behind one reverse proxy on one host, so requests are
same-origin and **there is no CORS to configure**. Do not add permissive CORS
headers; the Sign-in cookie makes them actively harmful.

## What already exists, and what this contract adds

The backend already has `Category` and `Application` entities and the form's
three endpoints. This is the delta.

| Area                        | Today                                      | Needed                                                                                                         |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `Application.status`        | absent                                     | new column, enum, defaults to `NEW` on submission (`A9`)                                                       |
| `Application.owner`         | absent                                     | nullable reference to a staff member (`A14`)                                                                   |
| `Application.internalNotes` | absent                                     | nullable text, max 4000                                                                                        |
| `Application.discardedAt`   | absent                                     | nullable timestamp, server-stamped (`A16`)                                                                     |
| State changes               | absent                                     | new table, one row per changed field, no author ([State changes](#state-changes))                              |
| `Category.description`      | absent                                     | new column, max 140, may be empty (`A15`)                                                                      |
| `Category.label`            | exists                                     | renamed to `name` (see [Wire names](#wire-names))                                                              |
| Staff members               | absent                                     | new table, seeded with one account per staff member (`A1`, `A17`)                                              |
| Sign-in                     | absent                                     | cookie-based, `/api/v1/staff/**` protected (`A17`)                                                             |
| Route-selection counters    | endpoint exists, counters are not readable | a read endpoint for the dashboard                                                                              |
| Live stream                 | absent                                     | one `text/event-stream` endpoint (`A18`, [ADR-0004](../docs/adr/0004-server-sent-events-for-the-dashboard.md)) |

An Application submitted through the form gets `status = NEW`, `owner = null`,
`internalNotes = null` and `discardedAt = null`. The form does not send any of
them and must not be able to.

## Wire names

The dashboard's mock data currently uses its own names for fields the backend
and the form contract have already named. **The wire keeps the names that
already exist**; the dashboard renames its own domain types in the same change.
Recording the map here so that neither side has to guess:

| Dashboard today                | On the wire          | Note                                  |
| ------------------------------ | -------------------- | ------------------------------------- |
| `applicantName`                | `name`               |                                       |
| `message`                      | `about`              | the applicant's own text              |
| `receivedAt`                   | `submittedAt`        |                                       |
| `weeklyAvailability`           | `weeklyTime`         | **number becomes an enum**, see below |
| `consent.givenAt`              | `consentAt`          | flat, not nested                      |
| `consent.privacyPolicyVersion` | `consentTextVersion` | flat, not nested                      |
| `Category.name`                | `name`               | the backend column `label` is renamed |

Two of these are more than a rename.

`weeklyTime` is an enum, not a number of hours: `HOURS_1_2`, `HOURS_3_5`,
`HOURS_5_PLUS`, `IRREGULAR`. The dashboard's `weeklyAvailability: number` cannot
represent `IRREGULAR` at all, so the dashboard is simply wrong here and changes.
The four German labels belong in `src/content/de.ts` like every other string a
staff member reads.

`Category.label` becomes `name` because `CONTEXT.md` spends the word "name" on
this and the form contract has no reason to prefer `label`. This is the one
place where the wire moves rather than the dashboard, and it changes
`GET /api/v1/categories` for the form too — see
[Categories](#categories).

Enum values are `SCREAMING_SNAKE_CASE` throughout, following `weeklyTime` in the
form contract and Jackson's default mapping of Java enums. That includes
`status`, whose values the dashboard currently spells in kebab-case; the
dashboard changes.

JSON is `camelCase`, the Jackson default. Timestamps are ISO 8601 in UTC, as
`Instant` already serialises them.

## Sign-in and staff members

There is no self-registration and no user administration anywhere in the
dashboard. The backend seeds one account per staff member (`A1`), with initial
passwords supplied as environment variables and stored hashed (`A17`).

### POST /api/v1/staff/session

The one public dashboard endpoint. The login screen is being built separately;
this is what it posts.

```json
{ "email": "ashton.blackwell@ichbinhier.example", "password": "…" }
```

On success: `200 OK`, the body of
[`GET /api/v1/staff/me`](#get-apiv1staffme), and

```
Set-Cookie: ibh_session=…; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200
```

A server-side cookie rather than a bearer token, because an `EventSource`
cannot set request headers — a token would have to travel in the query string of
[the live stream](#the-live-stream), where the proxy logs it. `SameSite=Strict`
on one origin removes CSRF without a token. Twelve hours of sliding inactivity
(`A17`).

On failure: `401` with `code: INVALID_CREDENTIALS`, and **the same response for
an unknown address as for a wrong password** — the dashboard has no
"registered?" question to answer. After repeated failures from one address,
`429` with `code: RATE_LIMITED`. There is deliberately no account lockout: with
five staff members and no administrator, a locked account stays locked (`A17`).

### DELETE /api/v1/staff/session

Ends the Sign-in, clears the cookie, `204 No Content`. Answers `204` when there
was no Sign-in either.

### GET /api/v1/staff/me

```json
{
  "id": "e0d1…",
  "name": "Ashton Blackwell",
  "email": "ashton.blackwell@ichbinhier.example"
}
```

The dashboard greets the staff member by name and shows the account card in the
sidebar. **No avatar field**: the dashboard renders initials, and photo upload
is not a feature of any screen.

### GET /api/v1/staff/members

Every staff member, for the owner selector in the Application drawer and the
owner filter on Übersicht.

```json
{ "members": [{ "id": "e0d1…", "name": "Ashton Blackwell" }] }
```

No email here — the selector shows names, and an address per row would spread
personal data further than the screen needs.

### When a Sign-in expires

Any protected endpoint answers `401` with `code: UNAUTHENTICATED`. The
dashboard then covers itself with the sign-in screen and, after a successful
sign-in, continues where the staff member was, keeping unsent internal notes.
That is the dashboard's own behaviour, mentioned here so the backend knows that
`401` is expected mid-session and is not an error to work around.

## Applications

### GET /api/v1/staff/applications

Every Application, including discarded ones.

```json
{
  "applications": [
    {
      "id": "a3f1c0de-4cde-4d61-830b-4af475f5727b",
      "categoryId": "5c2b…",
      "name": "Mara Weber",
      "email": "mara.weber@example.org",
      "weeklyTime": "HOURS_3_5",
      "about": "Ich arbeite seit zwei Jahren in der Social-Media-Redaktion …",
      "status": "NEW",
      "ownerId": null,
      "internalNotes": "",
      "discardedAt": null,
      "consentAt": "2026-09-01T08:12:44Z",
      "consentTextVersion": "2026-09",
      "submittedAt": "2026-09-01T08:12:44Z"
    }
  ]
}
```

| Field                | Type           | Note                                                  |
| -------------------- | -------------- | ----------------------------------------------------- |
| `id`                 | string         | UUID                                                  |
| `categoryId`         | string         | UUID of a Category, active or not                     |
| `name`               | string         | as the applicant typed it                             |
| `email`              | string         | as the applicant typed it                             |
| `weeklyTime`         | enum           | `HOURS_1_2`, `HOURS_3_5`, `HOURS_5_PLUS`, `IRREGULAR` |
| `about`              | string \| null | `null` when the applicant wrote nothing               |
| `status`             | enum           | see below                                             |
| `ownerId`            | string \| null | `null` means nobody has taken it on (`A14`)           |
| `internalNotes`      | string         | staff-written, may be `""`                            |
| `discardedAt`        | string \| null | non-`null` means Discarded (`A16`)                    |
| `consentAt`          | string         | server-stamped at submission                          |
| `consentTextVersion` | string         | which wording the applicant agreed to                 |
| `submittedAt`        | string         | when the form was submitted                           |

`submissionId` is deliberately **not** exposed: it is the form's idempotency
key and means nothing to a staff member.

Ordered by `submittedAt`, newest first. The dashboard sorts for itself, so the
order is a convenience rather than a contract. `Cache-Control: no-store` — this
is personal data and must not sit in a browser cache.

An empty list is valid and means the dashboard shows its empty state.

### Status

Six values, the flow `A9` proposes. `A9` holds them at low confidence and notes
they must be renameable without a code change, so keep them as data rather than
hard-coding behaviour on any one of them:

`NEW`, `IN_REVIEW`, `INTRO_BOOKED`, `ACTIVE`, `WAITLISTED`, `DECLINED`

**Any status may follow any other.** The drawer offers all six in one selector
and the real process is unknown to us (`A9`), so the backend validates that the
value exists and nothing more. Rejecting a transition would encode a process
the association has never confirmed.

`ACTIVE` and `DECLINED` are the two that mean "done", which is what Übersicht's
open-Applications panel excludes (`A13`). That rule lives in the dashboard; the
backend needs no notion of it.

**No status change sends anything to the applicant.** The only mail the platform
sends is the confirmation on submission that
[`../frontend/API.md`](../frontend/API.md) already requires. Everything after it
is the staff member writing directly, from their own mail client. A dashboard
that silently mails a rejection would put wording nobody in this team reviewed
in front of an applicant, and would leave the staff member unsure whether it
went out.

### PATCH /api/v1/staff/applications/{id}

The one endpoint for everything a staff member changes. Any subset of four
fields; an absent field is untouched.

```json
{
  "status": "IN_REVIEW",
  "ownerId": "e0d1…",
  "internalNotes": "Schreibprobe angefragt.",
  "discarded": false
}
```

| Field           | Type           | Meaning                                   |
| --------------- | -------------- | ----------------------------------------- |
| `status`        | enum           | one of the six                            |
| `ownerId`       | string \| null | explicit `null` clears the Owner          |
| `internalNotes` | string         | max 4000 characters; `""` clears it       |
| `discarded`     | boolean        | `true` discards, `false` restores (`A16`) |

Absent and `null` are different for `ownerId`: absent means "leave the Owner
alone", `null` means "clear it". The drawer's owner selector sends `null` when a
staff member picks the empty option.

`discarded` is a boolean, not a timestamp: the server stamps `discardedAt` from
its own clock, the same rule the form contract applies to the consent
timestamp. A timestamp from a browser's clock is worth nothing as a record.

Response: `200 OK` with the complete Application in the shape above, so the
dashboard never has to infer what happened. `404` with `code: NOT_FOUND` for an
unknown id.

**Nothing an applicant wrote can be changed** — `name`, `email`, `about`,
`weeklyTime`, `categoryId`, `consentAt` and `consentTextVersion` are rejected
if present, rather than ignored. Silently dropping them would let a future bug
look like it worked.

**Last write wins.** No `ETag`, no `If-Match`, no `409` on a concurrent edit.
With five staff members (`A1`) and dozens of Applications the collision is rare,
and the live stream means the loser sees the winner's value within seconds. What
protects the important case is the partial `PATCH` itself: the drawer sends only
`internalNotes` while somebody types, so a colleague's status change is never
overwritten by a note.

Internal notes must arrive debounced: the dashboard is required to wait until
typing pauses (800 ms) rather than send a request per keystroke. Named here
because the alternative looks, from the server, like a flood — and named as a
requirement rather than as a fact, because the drawer does not debounce yet
(see [what the dashboard changes](#what-the-dashboard-changes-on-its-own-side)).
The 4000-character limit is likewise enforced on both sides: the textarea caps
the input, and the backend still answers `NOTES_TOO_LONG` for a request that
gets past it.

### Bulk actions are N single requests

Anfragen discards a checked selection, and the fourth screen restores or erases
one. There is deliberately **no bulk endpoint**: the dashboard sends one
`PATCH` — or one `DELETE … /permanently` — per Application, at most a handful
in flight at once. With dozens of Applications the round trips are cheap, and a
bulk endpoint would need its own partial-failure shape for a case a single
request already describes.

Each request emits its own [stream](#the-live-stream) event, so a bulk discard
of five Applications produces five `application.updated` events. That is
expected traffic, not a loop to guard against.

When part of a bulk action fails, the dashboard shows one general message and
refetches `GET /api/v1/staff/applications` — the successful requests keep their
effect, and the list, not the dashboard's own optimism, says what happened.

### DELETE /api/v1/staff/applications/{id}/permanently

Erases the row. `204 No Content`, `404` for an unknown id.

The ordinary delete action in the dashboard is **not** this: it is
`PATCH … { "discarded": true }`, which moves the Application to the fourth
screen and keeps it on file (`A16`). This endpoint is the second, deliberate
step a staff member takes from that screen, and it is the platform's only path
to actually erasing what a person wrote. There is no retention period and no
automatic purge: the timespan would be a number we invented for data belonging
to someone who never agreed to it.

`400` with `code: NOT_DISCARDED` if the Application has not been discarded
first. Erasing straight from the working list is not a thing the UI can do, and
the backend should not offer what the UI does not.

## State changes

Übersicht carries three metric cards — "Neue Anfragen" (`status = NEW`), "Ohne
Zuständigkeit" (`ownerId = null`) and "Lange offen" (older than seven days,
`A19`) — and each one shows a sparkline of the trailing seven days next to its
number. The number comes from the list. **The seven days cannot**: a card's
value last Tuesday depends on what `status` and `ownerId` were last Tuesday,
and an Application carries only its current pair. Replaying today's values
across the week produces a curve that is confidently wrong — an Application
moved to `IN_REVIEW` this morning would count as "not new" for all seven days,
and "Lange offen" would count a restored Application as present on days it was
discarded.

So the backend records every change to the three fields that decide those
cards, and the dashboard replays them backwards from the current state.

### GET /api/v1/staff/applications/changes

```
GET /api/v1/staff/applications/changes?days=30
```

```json
{
  "changes": [
    {
      "applicationId": "a3f1c0de-…",
      "at": "2026-09-04T09:31:02Z",
      "field": "STATUS",
      "to": "IN_REVIEW"
    },
    {
      "applicationId": "a3f1c0de-…",
      "at": "2026-09-04T09:31:02Z",
      "field": "OWNER",
      "to": "e0d1…"
    },
    {
      "applicationId": "7b20…",
      "at": "2026-09-05T14:02:55Z",
      "field": "DISCARDED",
      "to": true
    }
  ]
}
```

| Field           | Type                              | Note                                      |
| --------------- | --------------------------------- | ----------------------------------------- |
| `applicationId` | string                            | UUID, an Application in the list          |
| `at`            | string                            | when the change was applied, server clock |
| `field`         | enum                              | `STATUS`, `OWNER`, `DISCARDED`            |
| `to`            | enum \| string \| null \| boolean | the new value, typed by `field`           |

`to` is one of the six statuses for `STATUS`, a staff-member id or `null` for
`OWNER`, and `true`/`false` for `DISCARDED` — `true` meaning discarded,
matching `PATCH`'s own `discarded` boolean rather than a timestamp.

`days` defaults to 30 and caps the window. The dashboard needs seven and slices
for itself, so the sparkline's length is a constant in the dashboard, not a
release of the backend. Ordered by `at`, oldest first. `Cache-Control:
no-store`, for the same reason the list is.

### The rules that make a replay correct

**One row per changed field.** A `PATCH` that sets `status` and `ownerId` in
one request writes two rows with the same `at`. A snapshot per request would
force the dashboard to work out which fields a partial `PATCH` actually
touched.

**No `internalNotes`.** No card reads them, and a debounced textarea would turn
one note into a stream of rows.

**No author.** A row records what changed and when, never which staff member
did it. See [Not in this contract](#not-in-this-contract) — this is a state
history, not an audit log, and the distinction is deliberate
([ADR-0005](../docs/adr/0005-state-history-without-authorship.md)).

**No rows means unchanged since submission.** An Application with no `STATUS`
row has been `NEW` since `submittedAt`, one with no `OWNER` row has never had
an Owner, and one with no `DISCARDED` row has never left the working list.
That is the dashboard's starting point when it walks backwards, and it is a
correct reconstruction rather than a fallback.

**Which makes seeding part of this contract.** A seeder that writes an
Application with `status = IN_REVIEW` and no `STATUS` row claims the
Application was submitted that way, and every sparkline in the demo goes flat.
Seeded and test data must write the state changes that lead to the state, with
the dates they happened on.

**Erasing an Application erases its state changes.**
`DELETE …/permanently` cascades. It is the platform's only path to actually
removing what a person wrote, and it must not leave a trail of their
Application's life behind. The visible consequence is that a sparkline's past
can change: a figure shown for last Tuesday may read lower after an erasure.
That is the right trade, and it is written down here so it does not look like a
bug.

**No `Last-Event-ID`, same as the stream.** There is no event type for a state
change. The dashboard already receives the full Application on
`application.updated`, knows the value it held before, and appends the change
to its own copy of the history — and on every `open` of the stream, including
every reconnect, it refetches this endpoint alongside the list. Correctness
comes from the refetch, exactly as it does for the list itself.

## Categories

The list an applicant picks from on the form, maintained by staff members
without a release (`A12`). Category `name` and `description` are the only
applicant-facing German values the backend owns, exactly as the form contract
already says of `name`.

### `description` has to be added, and the form has to return it

`A15` gives a Category one line of description, **shown under the name on the
form** and edited in the dashboard. It exists in neither place today: the
entity has no such column, and `GET /api/v1/categories` does not return one. A
description no applicant ever reads is a field whose only purpose has been
quietly cancelled, so this contract asks for both halves:

- add `description` to the entity, max 140 characters, may be empty;
- add `description` to the form's `GET /api/v1/categories` response;
- rename `label` to `name` in the same change, in both responses;
- lower the name's limit from 120 characters to 60 in the same change — the
  form contract's `1–120` is the applicant-name limit applied to a Category by
  reflex, and a 120-character Category does not fit the line an applicant reads
  it on.

That is the one edit this document asks for in the already-agreed form
contract. [`../frontend/API.md`](../frontend/API.md) is marked as awaiting
renewed agreement anyway.

### GET /api/v1/staff/categories

Every Category, active and inactive, in display order.

```json
{
  "categories": [
    {
      "id": "5c2b…",
      "name": "Social Media",
      "description": "Kommentare moderieren, Kampagnen begleiten, Kanäle betreuen.",
      "active": true
    }
  ]
}
```

| Field         | Type    | Note                                   |
| ------------- | ------- | -------------------------------------- |
| `id`          | string  | UUID                                   |
| `name`        | string  | German, 1–60 characters after trimming |
| `description` | string  | German, max 140, may be `""`           |
| `active`      | boolean | whether the form offers it             |

**No counts on a Category.** The Kategorien table shows how many Applications
name each Category, and its delete button is disabled for a Category that any
Application names — but both numbers are counted in the dashboard from the list
it already holds, for the same reason "open", "stale" and "unassigned" are
([Scope](#scope)). The two counts differ, and the difference is the least
obvious rule on this screen: the column excludes discarded Applications so a
discarded one does not inflate it, while the delete guard counts every
Application including discarded ones, because a discarded Application still
carries its `categoryId` and restoring it must not land on a Category that no
longer exists (`A15`). A server-side count would have to reproduce that
distinction in Java to say nothing new.

`name` is capped at 60 rather than 120 because an applicant reads it as one
line of the form's category list, where 120 characters do not fit. The
dashboard's dialog counts down from the same 60.

Display order is the array's order. A Category carries no position field on the
wire — the backend keeps `displayOrder` internally and hands the list over
sorted.

### POST /api/v1/staff/categories

```json
{
  "name": "Fundraising",
  "description": "Förderanträge schreiben.",
  "active": true
}
```

`description` may be omitted or `""`. `active` may be omitted and defaults to
`true`. The new Category is appended at the end of the display order.

Response: `201 Created` with the created Category in the shape above.

Names are what an applicant reads, so **two Categories may not share one**.
Compared case-insensitively and after trimming, in German collation. A duplicate
is `400 VALIDATION_FAILED` with field code `CATEGORY_NAME_TAKEN`.

### PATCH /api/v1/staff/categories/{id}

Any subset of `name`, `description`, `active`. Absent means untouched.

```json
{ "active": false }
```

Response: `200 OK` with the Category. Deactivating takes it out of the form and
leaves every existing Application with the Category it was submitted under
(`A15`) — it changes no Application at all.

Renaming a Category changes what a staff member sees against old Applications
too, which is intended: staff members may correct a label, but a new field of
work gets a new Category. That rule is already in the form contract.

### DELETE /api/v1/staff/categories/{id}

`204 No Content` when nothing references the Category.

`409 Conflict` with `code: CATEGORY_IN_USE` when any Application names it,
discarded ones included. The dashboard also disables the button in that case,
but the rule belongs to the data, not to a button (`A15`) — the dashboard's own
code carries the same guard twice for the same reason.

### PUT /api/v1/staff/categories/order

The whole display order, as the dashboard now sees it.

```json
{ "ids": ["5c2b…", "a1f0…", "7e33…", "c904…"] }
```

The dashboard's reorder control swaps a Category with its neighbour, but it
sends the resulting full order rather than a direction. The server does not have
to guess which state "up" was relative to, and two reorders in a row cannot
leave two Categories sharing a position.

`ids` must contain every Category exactly once, including inactive ones;
anything else is `400 VALIDATION_FAILED` with code `ORDER_INCOMPLETE`.

Response: `200 OK` with the reordered list, same shape as
`GET /api/v1/staff/categories`.

## Route selections

`POST /api/v1/route-selections` already collects, per the form contract, which
route each visitor picked — and nothing currently reads it back. That endpoint
is the only measurement of `A5` this project will produce, and `A5` — that
roughly four in five requests want the community rather than association work —
carries the whole design of the project. A number that can only be reached by
running SQL against someone else's database will not survive to the final
presentation.

### GET /api/v1/staff/route-selections

```json
{
  "fixedRoutes": [
    { "route": "COMMUNITY", "count": 412 },
    { "route": "SUPPORTING_MEMBER", "count": 37 }
  ],
  "categories": [{ "categoryId": "5c2b…", "name": "Social Media", "count": 21 }]
}
```

Two blocks rather than one flat list, because `A5` is a claim about the ratio
between the two fixed routes and Vereinsarbeit as a whole. The Vereinsarbeit
total is the sum of the `categories` block; the per-Category breakdown is the
secondary question.

Counts only. **No raw selection records, no timestamps per selection.** The form
contract promised that this counter is not associated with a person, and a list
of individual selections with times weakens that promise for no gain — there is
no screen for it.

Categories with a count of zero appear with `"count": 0`, including inactive
ones, so "nobody has ever chosen this" is visible rather than absent.

**No screen reads this yet**, and that is an open debt rather than a change of
mind: the dashboard needs a block on Übersicht — the two fixed routes, the
Vereinsarbeit total as the sum of the `categories` block, and the per-Category
breakdown under it. Named here so the backend does not read a missing screen as
a cancelled endpoint. Without it `A5`, which carries the design of the whole
project, stays a claim nobody can show.

## The live stream

One endpoint, so that an Application submitted on the form appears in every
open dashboard within seconds, and so that a status or owner change made by one
staff member reaches the others (`A18`). The reasoning, and why not polling or
WebSockets, is in
[ADR-0004](../docs/adr/0004-server-sent-events-for-the-dashboard.md).

### GET /api/v1/staff/events

`Content-Type: text/event-stream`. Authenticated by the same Sign-in cookie as
everything else — this is why the Sign-in is a cookie and not a bearer token.

Three event types:

| `event`               | When                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| `application.created` | the form created an Application                                         |
| `application.updated` | any `PATCH` succeeded, including discarding and restoring               |
| `application.deleted` | an Application was erased permanently, with its state changes (cascade) |

`data` is **the complete Application**, in exactly the shape
`GET /api/v1/staff/applications` returns — including on `application.deleted`,
because a discarded Application is not gone and the dashboard may need to drop
it from the fourth screen too. The client applies the event without a follow-up
request, which is the whole point of holding the full list.

```
id: 1043
event: application.created
data: {"id":"a3f1c0de-…","status":"NEW","ownerId":null, …}

```

`id` is a monotonic counter, useful in logs. **The server does not honour
`Last-Event-ID` and keeps no replay buffer.** On every `open` — including every
automatic reconnect — the dashboard refetches
`GET /api/v1/staff/applications` **and
[`GET /api/v1/staff/applications/changes`](#get-apiv1staffapplicationschanges)**
and replaces its state, which is what actually guarantees correctness; an
in-memory buffer would not survive a backend restart and would give false
confidence.

There is **no event type for a state change**. `application.updated` already
carries the full Application, and the dashboard derives the change from the
value it held before, which is why one event type covers both the list and the
trend.

Events are sent to every open stream, including the one belonging to the staff
member who caused the change. Suppressing the originator's own event would mean
two code paths for one state change.

A comment heartbeat every 20 seconds keeps the connection alive through proxy
timeouts and makes a dead network visible in seconds rather than at the
timeout:

```
:heartbeat

```

When the Sign-in expires the server closes the stream with `401`. `EventSource`
reconnects on its own; the dashboard shows the sign-in screen after repeated
failures. There is no polling fallback — the dashboard shows whether the stream
is connected instead, because a dashboard that silently displays yesterday's
queue is worse than one that admits it is disconnected.

`category.changed` is **not** in this contract. Categories are edited rarely and
by one person; the stream can grow later.

## Errors

`application/problem+json`, [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457),
the same shape the form already uses via Spring's `ProblemDetail`.

```json
{
  "type": "https://ichbinhier.eu/problems/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "errors": [{ "field": "name", "code": "CATEGORY_NAME_TAKEN" }]
}
```

**Do not send German error messages.** The dashboard looks its wording up by
`code` in `src/content/de.ts`, where it is reviewed in one place
([ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md)).
Category `name` and `description` remain the only German the backend owns.

Top-level codes:

| Status        | `code`                | Dashboard behaviour                                     |
| ------------- | --------------------- | ------------------------------------------------------- |
| 400           | `VALIDATION_FAILED`   | inline errors from `errors`                             |
| 400           | `NOT_DISCARDED`       | one general message, the list is refetched              |
| 401           | `INVALID_CREDENTIALS` | sign-in screen shows one general message                |
| 401           | `UNAUTHENTICATED`     | sign-in screen covers the dashboard, work is kept       |
| 404           | `NOT_FOUND`           | one general message, the list is refetched              |
| 409           | `CATEGORY_IN_USE`     | the Category cannot be deleted, deactivation is offered |
| 429           | `RATE_LIMITED`        | one general message, the action stays retryable         |
| 500, 502, 503 | `INTERNAL_ERROR`      | one general message, the action stays retryable         |

Field codes:

| `code`                                                                    | Field           |
| ------------------------------------------------------------------------- | --------------- |
| `STATUS_UNKNOWN`                                                          | `status`        |
| `OWNER_UNKNOWN`                                                           | `ownerId`       |
| `NOTES_TOO_LONG`                                                          | `internalNotes` |
| `CATEGORY_NAME_REQUIRED`, `CATEGORY_NAME_TOO_LONG`, `CATEGORY_NAME_TAKEN` | `name`          |
| `CATEGORY_DESCRIPTION_TOO_LONG`                                           | `description`   |
| `ORDER_INCOMPLETE`                                                        | `ids`           |
| `IMMUTABLE_FIELD`                                                         | the named field |

`NOT_DISCARDED` is a top-level `code` rather than a field code: nothing in the
request is wrong, the Application is simply not on the fourth screen yet, so
there is no field to hang it on.

A status this table does not name — a `405`, a `415`, a `400` Spring raises
before a controller sees the body — carries the status's own name as its `code`
(`METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE`, `BAD_REQUEST`). Each of those
is a caller defect rather than something a staff member can act on, so the
general message is the right wording; what matters is that a body arrives at
all.

`RATE_LIMITED` is the one code in this table the backend does not send yet: it
arrives with the Sign-in's throttling, not with the error contract.

An unknown `code` falls back to the general message, so adding one never breaks
the dashboard — but the staff member then sees generic wording, so say when the
list grows. The lookup itself does not exist yet: `src/content/de.ts` has no
block keyed by these codes, and adding one is
[dashboard-side work](#what-the-dashboard-changes-on-its-own-side).

`INVALID_CREDENTIALS` gets **one wording for both causes** — a wrong password
and an unknown address read identically, as
[Sign-in](#post-apiv1staffsession) requires. The dashboard currently says "Zu
dieser E-Mail-Adresse gibt es kein Konto", which answers the "registered?"
question this contract refuses to answer; that string goes.

A timeout or a network failure is treated as retryable, and unsent internal
notes are kept.

## Deployment

Everything the form contract says about deployment still holds: one reverse
proxy, one origin, no CORS, and a database that holds **test data only** — the
prototype runs on our own domain, and the consent text names the association as
the party that stores an applicant's details, which on our domain is not who
receives them.

Two things are new, both about the stream, and both cause the same failure if
missed: events arrive in batches instead of immediately, and "the Application
appears while you watch" — the moment the demo is built around — does not
happen.

- The proxy must not buffer this path: `proxy_buffering off;` and a long
  `proxy_read_timeout` (an hour) for `/api/v1/staff/events`. Compression must be
  off for it too.
- The backend should send `X-Accel-Buffering: no` on the stream response, so
  the behaviour survives a proxy configuration we forget to change.

The dashboard takes one build-time variable, as the form does:

```
VITE_API_BASE_URL=http://localhost:8080
```

Unset means requests go to a Mock Service Worker rather than a real backend, so
the dashboard stays demonstrable while the backend is being built. The existing
mock data (`src/data/`) stays as test fixtures.

## Not in this contract

Named so that nobody builds them by accident:

- **No email from the dashboard.** One confirmation on submission, nothing else.
- **No server-side search, filter, sort or pagination**, and no
  `GET /api/v1/staff/applications/{id}` — the dashboard holds the list and no
  screen links to a single Application.
- **No bulk endpoints.** A bulk action is N single requests
  ([Bulk actions](#bulk-actions-are-n-single-requests)).
- **No server-computed counts or metrics.** No `applicationCount`, no
  `deletable`, no per-card figures: the dashboard counts from the list and the
  state changes.
- **No `category.changed` event**, and no event type for a state change.
- **No user administration, no self-registration, no password reset screen, no
  avatar upload.** Accounts are seeded (`A17`). The account menu's "Profil
  ansehen" and "Einstellungen" are deliberate decoration for a possible later
  feature — they call nothing, and no endpoint is being asked for here.
- **No optimistic locking**, no `ETag`, no `If-Match`.
- **No audit log.** [State changes](#state-changes) record _what_ changed and
  _when_, never _who_ changed it. The dashboard has nowhere to show authorship,
  and five colleagues do not need a log of each other's clicks
  ([ADR-0005](../docs/adr/0005-state-history-without-authorship.md)).
- **No retention policy** for discarded Applications, and no automatic purge.
- **No Backlog import.** The roughly thousand existing emails (`C2`) are handled
  in bulk outside the platform (`A3`).

## Decisions

Proposed for agreement with the backend team:

1. **`/api/v1/staff/` prefix, `v1` unchanged.** The form's three public paths
   stay as they are. One prefix carries the "requires a Sign-in" rule.
2. **The dashboard reads the whole list.** No server-side querying. The
   definitions of open (`A13`), stale (`A19`) and unassigned (`A14`) stay in the
   dashboard.
3. **A server-side cookie, not a bearer token** — because `EventSource` cannot
   set headers, and a token in a query string ends up in proxy logs.
4. **Five seeded accounts, twelve-hour Sign-in, throttling by address rather
   than account lockout** (`A17`).
5. **`status`, `ownerId`, `internalNotes` and `discarded` change through one
   partial `PATCH`.** Applicant-written fields are immutable and rejected rather
   than ignored.
6. **Any status may follow any other** (`A9`), and no status change sends mail.
7. **Deleting is discarding** (`A16`). Permanent erasure is a separate endpoint,
   reachable only for an already-discarded Application.
8. **A Category carries no counts on the wire.** The dashboard counts
   Applications per Category itself — excluding discarded ones in the column,
   including them in the delete guard (`A15`). The server keeps only the
   `409 CATEGORY_IN_USE` guard, which protects the data rather than a button.
9. **`description` is added to the Category entity and to the form's category
   response, and `label` is renamed to `name`** in both. This is the one change
   asked of the already-agreed form contract.
10. **One SSE stream, full payloads, no `Last-Event-ID`, refetch on every
    reconnect, no polling fallback**
    ([ADR-0004](../docs/adr/0004-server-sent-events-for-the-dashboard.md)).
11. **Last write wins** on concurrent edits.
12. **Route-selection counts become readable**, as two blocks, counts only —
    and Übersicht owes them a screen.
13. **The backend records state changes** to `status`, `owner` and `discarded`
    — one row per changed field, no author, no `internalNotes` — and hands the
    raw rows over; the dashboard replays them into the metric cards' seven-day
    trends. Erasing an Application cascades to its rows
    ([ADR-0005](../docs/adr/0005-state-history-without-authorship.md)).
14. **Seeded and test data must write the state changes that lead to the
    state.** Otherwise every trend in the demo is flat.
15. **A bulk action is N single requests**, N stream events, and a refetch on
    partial failure. No bulk endpoint.
16. **Category `name` is capped at 60 characters**, not 120 — it is one line of
    the form.

## What the dashboard changes on its own side

Not work for the backend, listed because the contract above assumes it and
because the mock data disagreed with the wire on eight names. The renaming
items are struck through: they are done, on the mock data, ahead of the first
request:

- ~~rename the domain fields per [Wire names](#wire-names), and replace
  `weeklyAvailability: number` with the `weeklyTime` enum plus four German
  labels in `src/content/de.ts`~~ — done, against the mock data; the labels are
  `de.weeklyTimes` and carry no "pro Woche" suffix, since `IRREGULAR` is not a
  quantity;
- ~~spell statuses in `SCREAMING_SNAKE_CASE`~~ — done;
- ~~add `discardedAt` to the Application type and the fourth screen with its
  own table, plus restore and permanent-delete actions~~ — done, against the
  mock data; `README.md` records the screen and the wording;
- ~~add `description` to the Category type — it is already there — and drop the
  client-side slug id generator, since the backend owns ids~~ — done; a
  Category added on Kategorien takes a `crypto.randomUUID()` until the request
  layer hands the backend's id back;
- replace the sign-in screen's "kein Konto" message with one wording for
  `INVALID_CREDENTIALS`, add one for `RATE_LIMITED`, and add the `de.errors`
  block the [Errors](#errors) table is looked up in;
- debounce internal notes by 800 ms, cap the textarea at 4000 characters and
  count down the remainder — none of the three exists yet;
- read the metric cards' trends from
  [`GET …/applications/changes`](#get-apiv1staffapplicationschanges) instead of
  replaying today's `status`/`ownerId` across the week, and let
  `OverviewStats` read `App`'s shared list rather than building its own mock
  set, so the cards and the "Offene Anfragen" panel cannot disagree;
- ~~take the stale threshold's German label from `STALE_AFTER_DAYS` instead of
  spelling "Älter als 7 Tage" a second time, and point the constant's comment
  at `A19`, which exists~~ — done;
- replace the sidebar's mock avatar with initials, and read the signed-in staff
  member from `GET /api/v1/staff/me` rather than from
  `src/data/currentStaffMember.ts`;
- keep `src/data/` as test fixtures and put a Mock Service Worker behind an
  unset `VITE_API_BASE_URL`;
- add the stream connection marker.

~~Two smaller drifts to fix while renaming: the mock spells the fourth Category
`Sonstiges` where the backend seeds `Etwas anderes`, and the mock stamps
`privacyPolicyVersion: '2026-05'` where the consent text is at `2026-09`. In
both cases the backend is right and the mock is stale.~~ — both fixed.
