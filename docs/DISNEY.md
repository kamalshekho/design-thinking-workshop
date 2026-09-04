# Walt Disney Method — Volunteer Intake Platform

Three chairs, taken in order. The **Dreamer** speaks without constraints. The
**Realist** takes the dream and asks what can actually be built in the three
weeks of this workshop. The **Critic (Questioner)** attacks both — the dream for
being unwanted, the plan for being undeliverable.

Terminology follows [`CONTEXT.md`](../CONTEXT.md). The case is in
[`CASE.md`](./CASE.md). **Every number below is an assumption of ours, not a
statement from the client — see [`ASSUMPTIONS.md`](./ASSUMPTIONS.md).**

### The problem, restated

The association describes its problem as a lack of time: requests get lost among
other emails and there is no capacity to answer them. Two different problems are
hiding in that sentence.

- **Findability** — a staff member cannot locate volunteer requests inside a
  general-purpose inbox. Cheap to solve: a dedicated structured channel.
- **Capacity** — five staff members cannot hold a conversation with every person
  who writes. A dashboard does not solve this. It converts lost mail into a
  neatly sorted, still unworkable list.

The association reports the first because it is the visible one. `CASE.md`
describes the second: applications *put on hold*, no new volunteers, the
association stagnating. Our solution has to answer both, and only one of them is
answered by a form.

---

## 1. Dreamer

*No budget, no deadline, no technical limits.*

### The vision

Nobody at "Ich bin hier e.V." ever opens an inbox again.

A person who cares about online hate finds the association and is acting within
ten minutes. There is no waiting, no "we will get back to you", no request
sitting somewhere. The gap between *wanting to help* and *helping* has collapsed
to nothing — and taking people in is no longer a task performed by any of the
five staff members.

### What the platform does

- **Every door is open.** The applicant arrives however they already
  communicate, and the platform meets them there: a form on the website, a plain
  email to the existing inbox, WhatsApp, a DM on the social platforms where the
  association's work actually happens, a referral from someone already inside,
  a signup at an event.
- **It knows which of two things you want.** Joining the #ichbinhier community
  and working inside the association are different requests with different
  costs; the platform separates them at the first breath and never mixes them
  again.
- **The community door needs no human at all.** Four out of five people who
  write want to stand against hate online, not to work in the editorial team.
  They are inside, welcomed and given their first thread within minutes,
  automatically.
- **It reads and understands.** An incoming German message is parsed for
  motivation, skills, available hours and field of interest — no staff member
  re-types anything.
- **It answers questions from the association's own material** without waking
  anyone up.
- **It schedules itself**, and it onboards without staff: 39,000 engaged people
  are a pool of mentors, so a newcomer is handed to an experienced volunteer
  rather than to one of the five.
- **The old backlog dissolves.** The thousand messages accumulated over years
  are read, categorised, answered and closed — the association starts from zero
  instead of from a debt.
- **It never shows a staff member an inbox.** They see one thing: people ready
  to work, and where each of them fits.

### What it feels like

The association stops choosing between *raising awareness* and *processing
requests*, because processing requests is no longer work anyone does. Growth
stops being a cost. Every wave of public attention — a campaign, a news cycle, a
viral thread — converts into active people instead of into a backlog.

---

## 2. Realist

*Horizon: three weeks. Deliverable: a prototype that can be demonstrated.*
*Constraint that shapes everything: the client does not answer us (`C1`).*

### What survives from the dream

Of six doors, two: a **German-language web form** as the primary channel, and a
**structured auto-reply** on the existing inbox for the people who will send an
email regardless. The second door is cheap and closes the largest hole in the
first.

Of the automation, the split: the platform **routes and organises** rather than
understands. The staff member stays in the loop for association work — but reads
a structured record instead of composing a reply.

Of the dream's boldest claim — no humans needed — one real piece survives, and
it is the piece that matters: **the community funnel is fully self-service.**

### The two funnels

This is the core of the design, and the reason a form is worth building at all.

| | **Community** | **Vereinsarbeit** |
| --- | --- | --- |
| What the person wants | Join #ichbinhier and act against hate online | Work inside the association |
| Share of requests (`A5`) | ~4 in 5 | ~1 in 5 |
| Staff time | **Zero** | Review + intro session |
| What happens | Instant automated reply: group link, rules, first action | Enters the staff queue |

The applicant self-selects on the first screen. If `A5` holds, this single branch
removes more volume than every dashboard feature combined — and what reaches the
staff queue is dozens of records per month, not hundreds, which is the only
reason a weekly review is realistic at all.

### Categories

Taken from the association's own public calls for volunteers (`A7`), not
invented: **Social Media**, **Redaktion / Öffentlichkeitsarbeit**, **Rechtliche
Unterstützung**, **Community**, **Sonstiges**.

The applicant classifies themselves. The staff member no longer has to work out
where a person fits — that work is done, for free, by the person applying.

**Stated openly:** categories solve matching, not volume. There is no cap and no
"position closed", because we do not know what the association currently needs
and cannot ask. Findability is solved; capacity is only relieved, not fixed.

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Backend | Java + Spring Boot | Least boilerplate for Java web work in three weeks |
| Frontend | React | Team experience; two surfaces (public form, staff dashboard) |
| Database | PostgreSQL | Relational fit for requests, categories, sessions |
| Deployment | Docker Compose on a single machine | One-day setup, no cloud lock-in |

**Cost of this choice, stated openly:** two languages and two deployables
instead of one. Infrastructure is a real line item, not an afterthought.

**Language split:** applicant-facing form in **German** (`A6`) — an English form
on a German association's site loses applicants, which is the very loss we are
fixing. The staff dashboard UI is German too, since staff members are German
speakers; documents, code and the presentation stay in English.

### Scope

**In:**

1. **German web form**, funnel split on the first screen, then category and a
   short free-text field.
2. **Instant automated reply** carrying a concrete next step (`A8`): the group
   link for Community; the date of the next intro session for association work;
   an honest waitlist message when there is no room. No applicant ever receives
   silence or "we will get back to you".
3. **Email intake**: inbox polling, an auto-reply pointing to the form, and a
   parsed request record. Uncertain messages default to *request* rather than
   noise, and land in a review lane instead of the main queue.
4. **Staff dashboard — flow mode**: the week's new requests, filterable by
   category and age, with the status flow `new, in review, intro booked,
   active, waitlisted, declined` (`A9`). Categorised is not a status — every
   Application always carries a Category. Statuses are data, renameable
   without code (`C1`).
5. **Staff dashboard — backlog mode**: bulk triage of the ~1,000 accumulated
   messages (`A3`) — multi-select, categorise as a batch, answer with a
   template, close. This is the feature that relieves pain on day one; a
   flow-only dashboard leaves the old debt untouched.
6. **Group intro session** every two weeks, booked automatically by the form
   (`A10`). Individual slots only for *Rechtliche Unterstützung*. One hour of one
   staff member serves fifty people instead of fifty calls — the strongest
   capacity lever we have left.
7. **Notes and tags** per request, so nobody re-reads a message from scratch.
8. **Peer onboarder** as a role and an assignment field (`A11`) — the data model
   admits that an experienced volunteer, not a staff member, can take a newcomer
   in. No matching mechanism in the prototype.

**Out, named so the Critic cannot claim it was hidden:** automated answering of
questions, WhatsApp and social DM channels, referral flow, event signup,
onboarding material, a working mentor-matching mechanism, production hosting,
GDPR sign-off.

### Success bar

- **No request idles longer than 7 days** — every record has an owner and a
  visible age.
- **Zero staff minutes per Community request** — the ~4 in 5 majority is handled
  end-to-end by the platform.
- **Under 10 minutes of staff time per Vereinsarbeit applicant**, from arrival
  to booked intro session.
- **No silent applicants** — every submission triggers a reply with a concrete
  next step.

### Three weeks, seven people

| Week | Work | Who |
| --- | --- | --- |
| 1 | Assumptions written down and defended, funnel + category model settled, Docker Compose + Postgres + Spring Boot skeleton running, React shell, German form copy drafted | Kamal (model, PO), Bohdan (backend skeleton), Ilyas (infra, UI/UX), Tarek (form), Leon (process + assumptions), Anna (success bar & acceptance criteria), Lawrence (public-source research, client context) |
| 2 | Request CRUD + status flow, form wired end to end, instant auto-reply, dashboard flow mode, email polling | Bohdan + Kamal (backend, email), Ilyas + Tarek (frontend), Leon (scope moderation), Anna (bar tracking) |
| 3 | Backlog bulk-triage mode, intro session booking, notes & tags, seed data, demo script, presentation, buffer | Kamal (sessions), Bohdan (backlog mode), Ilyas + Tarek (polish), Lawrence (business model + presentation), Anna (bar verification), Leon (demo run-through) |

### Main risks

1. **Two build pipelines before any feature exists.** If the skeleton is not
   running by the end of week 1, week 3 loses its buffer. The skeleton is week
   1's only hard deliverable.
2. **Email intake is the riskiest item** — inbox credentials and a parser that
   survives real German formatting can each eat a week. It is the first thing
   dropped if week 2 slips, demonstrated with a manual paste-in fallback.
3. **`A5` carries the whole design.** If most applicants really do want
   association work, the community funnel relieves nothing and the staff queue
   fills up as before.
4. **No client validation at all** (`C1`). Nothing we build can be confirmed as
   wanted within these three weeks.

---

## 3. Critic (Questioner)

*Attacks the Dreamer for wanting the wrong thing, and the Realist for promising
what will not exist.*

### Against the Dreamer

- **Does the association want humans out of the loop?** Its work is moderating
  hate speech under its own name. An unvetted person acting on the
  association's behalf within ten minutes is a reputational risk, and speed may
  be precisely the wrong goal.
- **Automated screening decides who is allowed to help.** On what basis? An
  algorithm filtering applicants for an anti-discrimination association is a
  headline waiting to happen.
- **Six doors means six inboxes.** The dream removes one inbox and creates five
  more. Is the WhatsApp door a feature, or the same problem in a different app?
- **Parsing German emails means processing personal data** — motivation,
  skills, availability — for a German e.V. under GDPR. The dream never names a
  legal basis.
- **Who runs it?** The dream assumes a self-maintaining system. The association
  has five staff members and no engineers.
- **"The backlog dissolves" is the dream's biggest bluff.** A thousand messages
  answered automatically after years of silence is a thousand people receiving a
  belated form letter. Some will be insulted rather than reactivated.

### Against the Realist

- **The whole design rests on `A5`, which is our invention.** Four-in-five is
  reasoning, not measurement, and there is no way to check it — the client does
  not answer. If it is wrong, the funnel split relieves nothing and the plan
  quietly becomes "a nicer inbox".
- **The success bar cannot be tested in three weeks.** "No request idles longer
  than 7 days" needs real applicants over real weeks. The prototype demonstrates
  a mechanism; the numbers are targets you have not observed.
- **Categories have no vent.** You say this openly, which is honest — but it
  means the stated problem ("not enough time to handle all applications") is
  still there at the end of the workshop, better organised.
- **A group intro session may be unacceptable** (`A10`). If the association
  insists on speaking to each applicant individually, the bottleneck returns in
  full and no feature in this scope removes it.
- **Peer onboarding is a role field and nothing else** (`A11`). It is the
  strongest idea in the project and the least built. On stage it will sound like
  a promise; in the code it is a column.
- **Backlog mode answers old mail with a template.** Who writes that template,
  in German, and who takes responsibility for sending it to a thousand people
  the association has never spoken to?
- **Two dashboard modes in three weeks** — flow *and* backlog — and backlog mode
  is scheduled in week 3, on top of the buffer, behind the two riskiest items.
- **A weekly review is a design choice you did not question.** Motivation peaks
  the moment someone writes. The instant reply covers this — but only if the
  reply is honest about the wait, and "next intro session in up to two weeks"
  will lose people no matter how well it is worded.
- **Seven people, and two of them do not build.** Anna and Lawrence hold goals,
  business model and presentation. Intended, or an idle third of the team in
  weeks 2 and 3?
- **Ten working days, not fifteen.** Week 1 delivers infrastructure and
  assumptions, not features.

---

## 4. What survives

The prototype the three chairs agree on:

1. **German web form** with the funnel split on the first screen — the one
   decision that carries the project.
2. **Community funnel, fully self-service** — instant reply, group link, first
   action, zero staff time.
3. **Instant reply with a concrete next step** for every submission, including
   an honest waitlist. No silence.
4. **Staff dashboard, flow mode**, with categories from the association's own
   public calls and a renameable status flow.
5. **Backlog mode** for the accumulated messages — kept in scope because the old
   debt is the pain the association actually feels, and moved earlier in week 3
   than the polish.
6. **Group intro session** booked by the form; individual slots only for legal
   support.
7. **Email intake as a stretch goal**, conditional on week 2, with a manual
   paste-in fallback for the demo.
8. **Peer onboarder as a role in the data model** — presented as a direction,
   explicitly not as a working feature.

Claims deliberately not made: no automated decision about who may volunteer, no
measured 7-day figure, no verified request volume, no production readiness, no
GDPR sign-off, no working mentor matching.

Carried forward as questions for the association — the same list as in
[`ASSUMPTIONS.md`](./ASSUMPTIONS.md): who owns the platform after the workshop,
what the legal basis for processing applicant data is, whether automated
classification is acceptable at all, how many requests actually arrive, and how
many people the association can absorb.
