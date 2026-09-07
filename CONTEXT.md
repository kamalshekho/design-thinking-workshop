# Volunteer Intake

The domain of "Ich bin hier e.V." taking in people who reach out by email and
turning them into active volunteers.

## Language

**Association**:
"Ich bin hier e.V." itself — a registered German _eingetragener Verein_.
_Avoid_: Foundation, organisation, NGO, Stiftung

**Staff member**:
A paid employee of the association. Distinct from a volunteer.
_Avoid_: Employee, worker, admin

**Volunteer**:
A person already active in the association's awareness work.
_Avoid_: Helper, member, contributor

**Applicant**:
A person who has reached out wanting to volunteer but is not yet active. Becomes
a volunteer only once onboarding completes.
_Avoid_: Candidate, lead, interested person

**Community member**:
Someone who joins the #ichbinhier community to act against online hate. Needs no
staff involvement — the platform admits them end to end. Called _Aktionsgruppe_
in the German copy the applicant reads (`A6`); code and documents say community
member.
_Avoid_: Volunteer, follower, participant

**Supporting member**:
Someone who funds the association with a recurring contribution instead of doing
work. Files no application and needs no staff involvement — the platform sends
them to the association's membership form. Called _Fördermitglied_ in the German
copy the applicant reads (`A6`).
_Avoid_: Donor, sponsor, patron, paying member

**Vereinsarbeit**:
Work inside the association itself — Social Media, Redaktion /
Öffentlichkeitsarbeit, Rechtliche Unterstützung. Requires review by a staff
member. Distinct from community participation.
_Avoid_: Internal work, association work, staff work

**Category**:
The field of work an applicant selects for themselves on the form. Categories
are backend-owned data that staff members maintain (`A12`); the initial set
was seeded from the association's own public calls for volunteers (`A7`), but
the backend — not the frontend — is the source of truth for which categories
exist. A category always names Vereinsarbeit — community participation and
supporting membership are routes, not categories.
_Avoid_: Department, area, tag, position

**Route**:
One of the paths the form offers on its first field. A route either opens an
application (the Vereinsarbeit categories) or ends the form in a panel with an
external link (community member, supporting member). The route is the
applicant's own answer to what they want; it is not assigned to them.
_Avoid_: Path, option, funnel, track, branch

**Backlog**:
The requests accumulated in the inbox before the platform existed, handled in
bulk rather than one by one.
_Avoid_: Queue, archive, old mail

**Intro session**:
The recurring group introduction that replaces an individual appointment for
everyone except applicants for Rechtliche Unterstützung. Called _Info-Runde_ in
the German copy the applicant reads (`A6`).
_Avoid_: Meeting, appointment, call, interview

**Peer onboarder**:
An experienced volunteer who takes a new applicant in, in place of a staff
member.
_Avoid_: Mentor, buddy, sponsor

**Application**:
One applicant's request to volunteer, as it exists inside the platform.
_Avoid_: Request, submission, ticket

**Owner**:
The staff member responsible for an Application. An Application may have no
owner yet. Distinct from Peer onboarder, which is a separate, unimplemented
role.
_Avoid_: Assignee, handler

**Discarded**:
An Application a staff member has taken out of the working list without
deleting it. It keeps its Category, Status and Owner, and stays on file until a
staff member either restores it or erases it deliberately (`A16`). Discarded is
not a Status — an Application carries both at once.
_Avoid_: Deleted, removed, trashed, archived

**State change**:
One recorded change to an Application's Status, Owner or Discarded flag, with
the moment it happened and without who made it. The dashboard replays state
changes to say what a metric card read on a past day; nothing in the platform
shows authorship.
_Avoid_: Audit entry, event, revision, history entry

**Inquiry**:
An incoming message that asks a question rather than offering to volunteer. Not
an application.
_Avoid_: Question, general mail

**Onboarding**:
Everything between an application arriving and the applicant becoming a
volunteer — screening, the appointment, and introduction to the work.
_Avoid_: Intake, activation, signup

**Sign-in**:
A staff member's authenticated period of work in the dashboard. Bounded, and
ended either by the staff member or by expiry (`A17`).
_Avoid_: Session — the glossary already spends that word on Intro session, and
a document that says "session" twice for two unrelated things is worse than a
longer term. Also avoid: login, auth

**Platform**:
The system this team is designing.
_Avoid_: System, tool, app, form-like program
