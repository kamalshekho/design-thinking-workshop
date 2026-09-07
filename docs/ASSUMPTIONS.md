# Assumptions

We spoke to "Ich bin hier e.V." once, at the start. Since then they have not
responded. Everything the association told us in that conversation counts as a
client requirement and is marked **stated by the client**. Everything else below
is our own modelling, derived from public sources or from reasoning about the
case.

**Read this document as the foundation of the project, not as an appendix.** Any
number quoted in [`CASE.md`](./CASE.md) or [`DISNEY.md`](./DISNEY.md) traces back
to an entry here.

Confidence is deliberately coarse: **high** = stated publicly by the association
or a volunteering platform; **medium** = reasoned from public sources; **low** =
our invention, held only because the project needs a value.

---

## Project condition

### C1 — One conversation at the start, silence since

We spoke to the association once, at the beginning of the project. They have not
answered since. There will be no second round of requirements, no process
walkthrough and no validation of the prototype by the client within these three
weeks.

- **Confidence:** high — observed directly.
- **Consequence:** the one conversation is our only source of client
  requirements, and it outranks every inference we drew from public sources.
  Everything beyond it is our proposal, not a specification.
- **Mitigation:** statuses and categories are stored as data, not hard-coded, so
  the association can rename or reorder them without a rewrite.

### C2 — What the client actually told us

**Stated by the client:** they have no time to go through all their mail looking
for volunteer requests, and many requests are lost among roughly a thousand
emails of every kind.

- **Confidence:** high — heard directly.
- **This is the stated main problem, and it is findability, not capacity.** A
  separate structured channel solves it at the root: from the moment the form
  exists, volunteer requests never enter the general inbox again. No searching,
  no triage of old mail.
- **What it does not tell us:** how many volunteer requests actually arrive, and
  how many people the association can absorb. Both remain unknown.

---

## The organisation

### A1 — About 5 staff members

vostel.de lists 5 *hauptamtliche Mitarbeiter\*innen*; LinkedIn gives the
organisation size as 2–10 employees.

- **Confidence:** high.
- **Why it matters:** it sets the ceiling on any solution that spends staff
  time. Five people is the entire capacity of the association.

### A2 — About 39,000–40,000 engaged people

vostel.de lists ~40,000 *Ehrenamtliche & Freiwillige*; the association itself
wrote of "knapp 39.000 Engagierten" in early 2026.

- **Confidence:** high for the figure, medium for the interpretation.
- **Interpretation:** these are overwhelmingly participants of the
  #ichbinhier Facebook community, not people doing association work. Treating
  them as 40,000 workers would be a misreading.
- **Why it matters:** the association's constraint is not a shortage of people.
  It is that only five people are allowed to do the work of taking people in.

---

## The volume

### A3 — The thousand is the whole inbox, not a thousand requests

**Stated by the client (`C2`):** roughly a thousand emails of every kind —
invoices, press enquiries, newsletters, spam — among which volunteer requests
get lost.

- **Confidence:** high for the figure, and it corrects an earlier misreading of
  ours.
- **Earlier misreading, recorded on purpose:** we first read "1,000+" as a
  backlog of a thousand *volunteer requests*. It is not. Two conclusions we drew
  from that reading are therefore withdrawn — bulk triage of a thousand
  applications as a core dashboard feature, and any one-time mass reply to the
  old inbox. Mass-mailing a thousand mixed emails with "please re-apply here"
  would reach hundreds of people who never applied.
- **What remains unknown:** the share of those thousand that are volunteer
  requests. Nobody counted, which is precisely why they get lost.

### A4 — The number of volunteer requests is genuinely unknown

The association did not give us a figure, and no public source states one. The
only large number in play — ~3,000 people once waiting to join the Facebook
group — is historical and is about joining a community, not applying for
association work.

- **Confidence:** none. We are not replacing this with an invented figure.
- **Why it matters:** it decides whether capacity is a real second problem at
  all. If only a few dozen volunteer requests hide among the thousand emails,
  then nothing was ever too much — things were only lost. The platform is
  therefore designed to be indifferent to volume: a form and a filtered list
  behave the same at 20 requests a month as at 200.

### A5 — About 4 in 5 requests want the community, not association work

Judging by how people describe themselves in public — wanting to act against
hate online, wanting to join #ichbinhier — most enquiries are about joining the
community, which needs no staff involvement at all.

- **Confidence:** low.
- **Why it matters:** this single assumption carries most of the solution. If it
  holds, splitting the two funnels at the form removes more volume than any
  dashboard feature. If it is wrong and most applicants really do want
  association work, the staff queue receives hundreds of records instead of
  dozens and the capacity problem returns untouched.

---

## The requests themselves

### A6 — Requests arrive by email, in German, unstructured

The association publicly invites people to write to `info@ichbinhier.online`
about helping with *Vereinsarbeit*. Public communication is in German.

- **Confidence:** high for the channel and the language, medium for the shape.
- **Consequence:** the applicant-facing form is German-only. An English form on
  a German association's site would lose applicants — the same loss the project
  exists to prevent. The staff dashboard UI is German too, since staff members
  are German speakers; only our documents, code and presentation stay English.

### A7 — The categories are the association's own four

Social Media, Redaktion / Öffentlichkeitsarbeit, Rechtliche Unterstützung, and
joining the Community — these are the areas the association itself names when
asking for volunteers. We add *Sonstiges* as a catch-all.

- **Confidence:** high.
- **Why it matters:** these are the only written requirements we have from the
  client. They answer "where did these fields come from?" without us guessing.

### A8 — Requests are lost to silence as much as to the inbox

An applicant whose message goes unanswered for weeks stops being an applicant,
regardless of whether the email itself was ever lost.

- **Confidence:** medium — reasoning, not measurement.
- **Consequence:** an immediate automated reply carrying a concrete next step is
  treated as a core feature, not a nicety. It also removes the follow-up emails
  ("did you receive my message?") that add to the volume being cleared.

---

## The process we invented

### A9 — The status flow

`new, in review, intro booked, active, waitlisted, declined` is **our** model.
The association's real process is unknown to us. *Categorised* is not a status:
every Application always carries a Category, so it cannot mark a step in the
flow (superseded, see the staff dashboard issue tracker).

- **Confidence:** low.
- **Mitigation:** statuses are data rows, renameable without code changes.

### A10 — A group intro session is acceptable

We replace the individual appointment with a recurring group introduction
session every two weeks, with individual slots kept only for *Rechtliche
Unterstützung*, where the numbers are small and the conversation genuinely
personal.

- **Confidence:** low.
- **Why it matters:** one hour of one staff member serves fifty people instead
  of fifty calls. This is the strongest capacity lever left after we dropped
  capped positions.
- **What breaks if wrong:** if the association insists on speaking to every
  applicant individually, the bottleneck returns in full and no software
  removes it.

### A11 — Existing volunteers may onboard new ones

- **Confidence:** low.
- **Why it matters:** it converts a staffing problem into a routing problem —
  the association has 39,000 people and 5 staff members.
- **What breaks if wrong:** the association's work is moderating hate speech.
  It may consider vetting and induction something only staff may do, for
  reputational reasons. In the prototype this exists only as a role and an
  assignment field, not as a working matching mechanism.

### A12 — Staff members may maintain application categories

We propose that staff members can create, rename, reorder and deactivate the
categories for Vereinsarbeit without a frontend release. The platform starts
with Social Media, Redaktion / Öffentlichkeitsarbeit, Rechtliche Unterstützung
and Sonstiges, but that list is not treated as permanent.

- **Confidence:** low — this is our response to `C1`, not a capability requested
  or validated by the association.
- **Why it matters:** the association can correct our initial model after the
  workshop without asking a developer to change the form.
- **What breaks if wrong:** loading categories from the backend adds a new
  dependency to the form without giving staff a process they will actually use.
  The initial four categories would be simpler and more reliable as frontend
  data.

### A13 — Übersicht's "Offene Anfragen" panel shows five rows by default

The panel below Übersicht's three metric cards lists the oldest open
Applications — every status except `active` and `declined` — after search and
Category/Zuständigkeit filtering, capped at five. Five is our proposal for a
compact overview, not a confirmed client need; nothing in `C1`/`C2` says how
many Applications a Staff member should see at a glance before going to
Anfragen for the rest.

- **Confidence:** low — invented for the prototype.
- **Why it matters:** it sets how much of the queue is visible without a click.
  Five rows fits comfortably below the three cards without scrolling; a busier
  queue in practice could make five feel too short and push Staff members
  straight to Anfragen instead.
- **What breaks if wrong:** the cap is one number, read from
  `OPEN_APPLICATIONS_LIMIT` in `selectOpenApplications.ts`, not scattered
  across the panel — raising or removing it is a one-line change, not a
  rewrite.

### A14 — An Application without an Owner reads as unread

The Applications list marks every Application that has no Owner the way a mail
client marks an unread message: a dot at the row's left edge, the applicant's
name in bold, and a tinted row. An Application with an Owner reads as plain
text on the card's own background. The state is derived from the Owner on
every render — assigning one turns the row plain, clearing one turns it back —
and nothing is stored per Staff member.

- **Confidence:** low — our proposal. `C2` says mail is unfindable among ~1,000
  emails; it does not say that "nobody has taken this on" is the distinction a
  Staff member wants to see first.
- **Why it matters:** it decides what the list emphasises. Ownership is the
  only signal here that says a human has looked at an Application at all —
  Status moves later and by hand — so it is the closest thing we have to
  read/unread. A shared dashboard also means the mark is the same for every
  Staff member, which a per-person "read" flag would not be.
- **What breaks if wrong:** if Staff members read the emphasis as "new" rather
  than "unowned", an old Application somebody deliberately left unassigned
  keeps shouting, and an Application that arrived this morning and was claimed
  at once disappears into the plain rows. The rule is one predicate,
  `isUnassigned` in `domain/application.ts`, so a different signal — Status
  `new`, or an age — is a change in one place.

### A15 — A Category carries a description, and one in use is deactivated

Beyond its name, a Category carries one line of description, shown under the
name on the form and edited on Kategorien. A Category that Applications are
already filed under cannot be deleted at all — the dashboard offers
deactivation instead, which takes it out of the form and leaves every existing
Application with the Category it was submitted under.

- **Confidence:** low — both halves are our proposal. `A7` gives us four
  category names and nothing else; nothing the association said asks for a
  description, and nothing says what should happen to old Applications when a
  Category goes away.
- **Why it matters:** the description is the only place the form can explain
  what "Redaktion / Öffentlichkeitsarbeit" involves, and the four names of
  `A7` are only useful if an Applicant can tell them apart. The deletion rule
  is what keeps the
  Applications list readable: a deleted Category would leave rows pointing at
  an id with no name behind it.
- **What breaks if wrong:** if descriptions go unwritten they are one empty
  line per option, which the form can drop. If the association wants a
  Category gone rather than hidden, the inactive list grows instead — visible
  on Kategorien's "Inaktiv" tab, so nothing is lost, but nothing is cleaned up
  either.

### A16 — Deleting an Application moves it aside rather than erasing it

The dashboard's delete action marks an Application _Discarded_: it leaves the
working list, the metric cards and the view counts, and appears on a fourth
screen of its own. It keeps its Status, Owner and Category. From there a staff
member can restore it, or erase it for good in a second, separate action. There
is no automatic purge after a retention period.

- **Confidence:** low — our proposal. Nothing the association said describes
  what happens to a request they do not want.
- **Why it matters:** an Application is a person who wrote in. A single
  mis-click that erases their message for good is a worse failure than a list
  that needs tidying, and `C2` says requests are already being lost — losing
  them faster is not the fix.
- **What breaks if wrong:** if staff members never visit the fourth screen, the
  discarded set grows without limit. That is a screen nobody opens, not lost
  data. The alternative — erasing on the first click — cannot be undone at all,
  and a retention period would be a number we invented for data belonging to
  someone who never agreed to it.

### A17 — Five seeded staff accounts and a twelve-hour sign-in

The dashboard has no self-registration and no user administration. The backend
seeds one account per staff member (`A1`), and a Sign-in lasts twelve hours of
sliding inactivity. There is no account lockout; repeated failed sign-ins are
throttled by address instead.

- **Confidence:** low — the count follows `A1`, the twelve hours are invented.
- **Why it matters:** it decides how much of the prototype is authentication
  work rather than dashboard work. Twelve hours means a staff member signs in
  once at the start of a working day and is not interrupted inside it.
- **What breaks if wrong:** too short, and staff members meet a sign-in screen
  mid-task; too long, and an unattended dashboard stays open. Both are one
  configured duration. Lockout was rejected for a different reason: with five
  staff members and no administrator, a locked account stays locked.

### A18 — The dashboard is fed by a live stream, not by reloading

An Application submitted on the form appears in every open dashboard within
seconds, and so do changes to Status, Owner, notes and the discarded state made
by another staff member. The dashboard shows whether that stream is connected,
and does not fall back to polling when it is not.

- **Confidence:** low — our proposal, and the only one here that the
  association could not have asked for, since they have never seen a
  dashboard.
- **Why it matters:** the dashboard is shared by up to five people (`A1`) and
  ownership is the signal that somebody has taken an Application on (`A14`).
  Without a live stream, two staff members can claim the same Application and
  neither sees the other — exactly the duplicated work this project exists to
  remove.
- **What breaks if wrong:** if the stream cannot be kept open in the deployment
  we demonstrate on, the dashboard still works, but only tells the truth
  immediately after a reload, and the connection marker tells the staff member
  so.

### A19 — An Application counts as stale after seven days

Seven days of no movement is where an Application starts reading as overdue: it
enters Anfragen's "Lange offen" view and Übersicht's third metric card. This
closes the debt the code has been carrying — `STALE_AFTER_DAYS` in
`dashboard/src/domain/application.ts` had no entry here.

- **Confidence:** low — our invention. `A8` says requests are lost to silence,
  but nothing says at what age silence becomes a failure.
- **Why it matters:** it is the only number in the dashboard that turns a
  waiting Application into a visible problem, and it drives both a view and a
  card.
- **What breaks if wrong:** too low and every Application is overdue, so the
  card stops meaning anything; too high and the card is empty while people
  wait. It is one constant in one file.

---

## Open questions we cannot answer ourselves

- Who owns and maintains the platform after the workshop?
- What is the legal basis under GDPR for storing applicant data — motivation,
  skills, availability?
- Is automated classification of applicants acceptable to an association whose
  own subject is discrimination?
- How many applicants does the association actually receive, and how many can it
  actually absorb?
