---
status: accepted
---

# Code speaks English, the applicant reads German

**Partially superseded by
[ADR-0003](./0003-german-dashboard-english-documentation.md):** the dashboard
UI is German, and dashboard translations do not belong in documentation or the
glossary. English identifiers and wire formats remain required. The shared
component assumption below was superseded by
[ADR-0002](./0002-dashboard-as-separate-application.md). The original rationale
is preserved below as history.

`frontend/DESIGN.md` arrived written in the association's own German —
_Aktionsgruppe_, _Info-Runde_, _Fördermitglied_ — while
[`CONTEXT.md`](../../CONTEXT.md) defines the same concepts in English as
community member, intro session and supporting member. We made `CONTEXT.md`
binding for every identifier, enum value and wire format, and confined German to
`frontend/src/content/de.ts` and the copy the applicant actually reads (`A6`).

## Considered options

Naming in German throughout was the obvious alternative, and it has a real
argument: the applicant, the client and the copy all speak German, so German
identifiers would remove a translation step for the team.

We rejected it for two reasons. The staff dashboard is English by the same
`A6` split, and it reuses the form's presentational components — a control
named `BewerbungsFeld` cannot be reused there without a rename. And a wire
value derived from German copy ties the database to the wording: correcting a
label in `DESIGN.md` section 49 would then require a migration.

## Consequences

Anyone reading `DESIGN.md` beside the code meets two vocabularies for one
concept. The glossary carries the mapping — each affected `CONTEXT.md` entry
names its German form explicitly — and it is the only place that mapping is
recorded.

Reversing this later means renaming every enum value, every stored category and
every component, which is why it is written down rather than left implied.
