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
  exists to prevent. Our dashboard and presentation stay in English.

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

`new → categorised → intro session booked → active` (plus `waitlisted` and
`declined`) is **our** model. The association's real process is unknown to us.

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

---

## Open questions we cannot answer ourselves

- Who owns and maintains the platform after the workshop?
- What is the legal basis under GDPR for storing applicant data — motivation,
  skills, availability?
- Is automated classification of applicants acceptable to an association whose
  own subject is discrimination?
- How many applicants does the association actually receive, and how many can it
  actually absorb?
