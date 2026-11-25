# Backend

Spring Boot service backing the applicant form and the staff dashboard. See
[`../AGENTS.md`](../AGENTS.md) for repo-wide conventions.

## Running locally

`docker compose up` from the repo root runs the backend with the rest of the
stack and passes `DB_PASSWORD` from `.env` (see `../README.md`). To run the
backend on its own, on port 8080 where both dev servers expect it, start a
Postgres with a password of your choice and hand the same password to the
backend:

```
export DB_PASSWORD=pick-a-local-password
docker run -d --name volunteer-form-db -p 5432:5432 \
  -e POSTGRES_DB=volunteer_form -e POSTGRES_USER=volunteer_form \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" docker.io/library/postgres:17-alpine
STAFF_1_PASSWORD=… STAFF_2_PASSWORD=… STAFF_3_PASSWORD=… \
  STAFF_4_PASSWORD=… STAFF_5_PASSWORD=… ./mvnw spring-boot:run
```

**`DB_PASSWORD` has no default.** Without it the backend refuses to start and
says so, rather than trying a password written in this repo. The test suite
runs on H2 and needs none of these variables.

## Code and tests

The packages group code by feature. Within a feature, `web` handles HTTP,
`service` implements operations, `repository` reads and writes data, `domain`
holds the domain model, and `config` contains configuration and seed data.
The dashboard's request and response types live in `dashboard/dto`, grouped
by Application, Category, Staff member and route selection.

`application` handles Applications submitted through the public form;
`category` provides the form's available Categories. `dashboard` lets Staff
members view and update those same Applications and Categories. `staff` holds
the Staff accounts, `email` sends messages, and `demo` prepares presentation
data. The shared `web` package handles errors and security.

`ApplicationSubmissionController` and `ApplicationSubmissionService` handle
the public form submission. The `application/domain` model is also used by the
dashboard, so the feature is named for the Application rather than the form.

The application and dashboard service interfaces sit in their feature's root
package; their implementations are package-private in `service`. This keeps
controllers dependent on the service contract instead of its implementation.
Java subpackages are separate packages, so domain types and repositories shared
across features still need public visibility.

Run `./mvnw test` with Java 25. A `*Test` checks an isolated part, while an
`*IntegrationTest` checks several parts together using the test database. The
`ApplicationEndToEndTest` starts the backend on a local port and follows a
submission through staff sign-in and review over HTTP. It does not run a browser.

## API documentation

Swagger UI describes the implemented HTTP endpoints and their request and
response types. It is disabled by default. To enable it on the presenting
machine, start the stack with the `docs` profile and the local-only port:

```bash
SPRING_PROFILES_ACTIVE=docs docker compose -f docker-compose.yml -f docker-compose.docs.yml up -d --build
```

Open <http://localhost:8080/swagger-ui.html>. The OpenAPI document is available
at <http://localhost:8080/v3/api-docs>. To include demo data on a suitable empty
database, use `SPRING_PROFILES_ACTIVE=docs,demo` instead. For a backend started
directly with Maven, set `SPRING_PROFILES_ACTIVE=docs` alongside the database
and staff variables described above.

Use `POST /api/v1/staff/session` in Swagger UI to sign in before calling staff
endpoints. The browser keeps the HTTP-only session cookie; there is no token to
paste into Swagger's Authorize dialog. Open the UI on `localhost`, as the cookie
is marked Secure. The API's existing access checks still apply.

Swagger's **Try it out** sends real requests: changes affect the connected
database and a form submission may send a confirmation email. Use synthetic data
and a demo database. See [`../frontend/API.md`](../frontend/API.md) and
[`../dashboard/API.md`](../dashboard/API.md) for the detailed contracts and
error codes; the form contract notes where agreement is still pending.

## Staff accounts

The dashboard has no self-registration and no user administration, so
`staff/config/StaffSeeder.java` is the only way an account comes into being: five of
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

`docker-compose.yml` leaves the profile off; `SPRING_PROFILES_ACTIVE=demo
docker compose up -d --build` (or the same variable in `.env`) turns it on. The
seeder is skipped whole once there is any Application at all, so a restart
mid-demo neither duplicates the week nor brings back a set somebody cleared.

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

A changed Status also triggers an email after the database change commits
(`A30`). Saving the same Status again, changing the Owner or editing notes does
not trigger one. The wording and which transitions should send mail still need
the association's approval. Mail failures are logged; there is no automatic
retry or delivery guarantee, and a saved Status remains saved if sending fails.

Without `RESEND_API_KEY` set, `email/NoopEmailSender.java` takes over
automatically and logs the subject instead of sending the email. Local
development and the test suite need nothing configured. No log line carries an
applicant's address; the confirmation is logged with the Application's id.

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
