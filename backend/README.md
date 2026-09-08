# Backend

Spring Boot service backing the applicant form and the staff dashboard. See
[`../AGENTS.md`](../AGENTS.md) for repo-wide conventions.

## Staff accounts

The dashboard has no self-registration and no user administration, so
`staff/StaffSeeder.java` is the only way an account comes into being: five of
them, one per staff member (`A1`, `A17`), invented people at the association's
domain. The addresses are sign-in identities and nothing else — no mail is ever
sent to a staff member, so none of these mailboxes has to exist.

**The five initial passwords come from the environment**, `STAFF_1_PASSWORD`
through `STAFF_5_PASSWORD` in `.env` (see `../.env.example`); there is no
password literal anywhere in this repo. Each is read once, when its account is
created, and hashed with bcrypt. Set them to five distinct values before the
first start and hand each staff member their own.

The seeder works account by account rather than behind one "is the table empty"
check, which decides two things worth knowing:

- an **already-seeded** deployment starts without any of these variables, since
  it creates nothing;
- a **missing** password is fatal only for an account that is actually absent —
  the backend refuses to start and names the variable, because a dashboard
  nobody can sign in to fails later and less clearly.

A `Sign-in` lasts twelve hours of sliding inactivity and lives in this process's
memory, so **restarting the backend signs everybody out** (`A17`). Repeated
failures from one address answer `429 RATE_LIMITED` rather than locking the
account, since five staff members with no administrator would stay locked
(`A20`); the numbers are `sign-in.attempt-limit` and `sign-in.attempt-window` in
`application.properties`.

## Demo data

`demo/DemoSeeder.java` seeds a week that reads like a real one: thirteen
Applications across the four Categories and all six statuses, some owned and
some not, six older than seven days, two discarded and one discarded and
restored (`A21`). **It runs only under the `demo` profile** — the Categories and
the staff accounts are platform data, while these Applications are a
presentation artifact, so a database only gets applicant-shaped rows when
somebody asks for it:

```
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

`docker-compose.yml` sets the profile for you, since that stack _is_ the demo
environment; `SPRING_PROFILES_ACTIVE=` in `.env` turns it off again. The seeder
is skipped whole once there is any Application at all, so a restart mid-demo
neither duplicates the week nor brings back a set somebody cleared.

Every Application carries the **State changes that lead to it**, dated when they
happened — that is what makes Übersicht's sparklines a real trend rather than
today's number repeated seven times (`dashboard/API.md`, "Which makes seeding
part of this contract"). A seed declares only its timeline; the current Status,
Owner and discarded state are folded out of it, so the two cannot disagree.

The applicants are invented and their addresses sit at `example.org`, which
[RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) reserves — no mailbox can
exist there. That is the point: the consent text names the association as the
party that stores an applicant's details, and on our own domain that is not who
receives them, so nothing a real person wrote may end up in this database
(`dashboard/API.md`, "Deployment").

## Transactional email

The confirmation email an applicant gets on submit (`A8` in
[`../docs/ASSUMPTIONS.md`](../docs/ASSUMPTIONS.md)) goes through
[Resend](https://resend.com). `email/ResendEmailSender.java` calls their HTTP
API directly — no SDK dependency, the API is one POST request.

Without `RESEND_API_KEY` set, `email/NoopEmailSender.java` takes over
automatically and logs the email instead of sending it. Local development and
the test suite need nothing configured.

**To send real email:**

1. Sign up at [resend.com](https://resend.com), free tier is enough for this
   project's volume.
2. Create an API key in the dashboard and set it as `RESEND_API_KEY` in `.env`
   (see `.env.example`) — never commit the key itself.
3. That's it for a demo. Sending works immediately from
   `onboarding@resend.dev`, but **only to the email address on the Resend
   account itself** — good enough to show the flow with your own inbox.
4. To send to any address (what a real deployment needs), verify a domain in
   Resend: add the DNS records it shows you, wait for verification, then set
   `RESEND_FROM=noreply@your-domain` in `.env`. Until the branding question
   with the association is settled, use a neutral domain, not
   `ichbinhier.*` — see the reply to Paula's email for context.

Both `resend.api-key` and `resend.from` are read from environment variables in
`application.properties`; nothing provider-specific lives outside the `email`
package.
