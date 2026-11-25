# Verification

How an agent proves a change in this repo. `implement` reads this file to pick
and run the proof for each acceptance criterion; `pr` reads the manual checks.

There is no `package.json` at the root. Each app installs, tests and builds
from its own folder: `frontend/` (the applicant form), `dashboard/` (the staff
dashboard), `backend/` (Spring Boot).

## Tests

- **Location**: `frontend/src/**/*.test.{ts,tsx}` and `dashboard/src/**/*.test.{ts,tsx}` (Vitest, React Testing Library, MSW); `backend/src/test/java` (JUnit, Spring Boot test slices, H2).
- **Single file**: `npx vitest run <path>` inside `frontend/` or `dashboard/`.
- **Full suite**: `npm run check` inside `frontend/` or `dashboard/` runs the local steps of the app's CI job (`frontend` or `dashboard` in `.github/workflows/ci.yml`) plus the config-parity check of the `config` job, tests with coverage included. `npm run build` and `npm run size` run only in CI. Backend: `./mvnw -B test` in `backend/`.
- **End to end**: `e2e/tests/*.spec.ts` (Playwright, axe) against the running Compose stack, in three projects: `chromium-320`, `chromium-1280` and `webkit-375`. Start the stack (see Run), then in `e2e/`: `npm ci`, `./node_modules/.bin/playwright install chromium webkit` once per Playwright version, `npm run typecheck`, `npm test`. `FORM_URL` and `DASHBOARD_URL` override the default ports; the dashboard tests take `STAFF_1_PASSWORD` from the environment or from the root `.env`. CI runs the same steps in the `e2e` job.
- **Property testing**: none installed.

The backend needs JDK 25. Without one, run its suite in the Maven image:

```bash
docker run --rm -v "$PWD/backend":/build -w /build -v ibh-m2:/root/.m2 \
  docker.io/library/maven:3.9-eclipse-temurin-25-alpine mvn -B test
```

## Run

- **Start**: `docker compose up -d --build` from the root. It needs a `.env` copied from `.env.example` with `DB_PASSWORD` and `STAFF_1_PASSWORD` to `STAFF_5_PASSWORD` set. `SPRING_PROFILES_ACTIVE=demo` seeds the demo week of Applications into an empty database.
- **Ready when**: `docker compose ps` shows `backend`, `frontend` and `dashboard` as `healthy`.
- **Drive**: `agent-browser` for the form and the dashboard (see AI browser verification below); `http` for the API, sent through the dashboard's nginx at `http://localhost:8082/api/v1/...`.
- **URL or entry point**: form `http://localhost:8081`, dashboard `http://localhost:8082`, Mailpit `http://localhost:8025`. The backend publishes no port; both nginx containers proxy `/api` to it. To trigger an acceptance email, sign in to the dashboard, open an Application, and set its Status to `Angenommen`; the email with the personal `/onboarding/<token>` link arrives in Mailpit (`GET http://localhost:8025/api/v1/messages`).
- **Test login**: dashboard Sign-in as `ashton.blackwell@ichbinhier.online` with `STAFF_1_PASSWORD` from `.env`.
- **Setup**: none.
- **Logs**: `docker compose logs -f <service>`.
- **Stop**: `docker compose down`; `-v` also drops the database.

What no config file says:

- Staff passwords are read only when the account is first created. Changing
  `.env` later does nothing on an existing `db-data` volume.
- The Sign-in cookie is `Secure`. Open the stack as `localhost`; over an IP
  address or a network name the browser drops the cookie.
- The form runs without the stack: `npx vite` in `frontend/` starts Mock
  Service Worker when `VITE_API_BASE_URL` is unset, categories included. The
  first `<select>` shows "Lädt …" until the categories arrive.
- The dashboard's Vite dev proxy targets `localhost:8080`, and Compose
  publishes no backend port. Drive the dashboard through the Compose build on
  port 8082.
- `agent-browser` is a dependency of no app. It is installed once per machine:
  `npm i -g agent-browser`, then `agent-browser install` for Chrome for
  Testing, then `agent-browser doctor`. Its usage guide comes from the CLI:
  `agent-browser skills get core`. Playwright stays a dependency of `e2e/`
  only.
- jsdom lays nothing out: every `getBoundingClientRect()` in a Vitest test
  returns zeros. Sizes, overlap and tap targets need the browser.
- A local database can hold Applications typed in by hand. Before a screenshot
  leaves the machine, mask every row whose email does not end in
  `@example.org`.

## AI browser verification

A change to a user scenario goes through this loop before code review. It runs
only on a developer machine; CI runs the Playwright suite alone, because an
agent in CI gives a different answer on each run and needs an API key.

1. Start the stack and run the E2E suite (see End to end under Tests). A
   failing test goes back to the implementation.
2. Load `agent-browser skills get core`, and `agent-browser skills get dogfood`
   for a wider search. Take a session of your own with
   `agent-browser session id --scope worktree --prefix verify` and pass it as
   `--session` on every command: other agents on the machine share the default
   session.
3. Walk every scenario the change touches. Check the form at
   `set viewport 320 640` and `set viewport 1280 800`. For the dashboard,
   store the login once with
   `auth save staff --url http://localhost:8082 --username <email> --password-stdin`,
   reading the password from `.env`, then `auth login staff`. Never pass the
   password as an argument.
4. Judge what you see against the specification, not against taste: the
   acceptance criteria of the issue, [`frontend/DESIGN.md`](../../frontend/DESIGN.md),
   the screenshots in [`frontend/references/`](../../frontend/references/),
   [`dashboard/README.md`](../../dashboard/README.md) and
   [`CONTEXT.md`](../../CONTEXT.md). A difference from them is a bug. A
   preference they do not state goes into the PR as a note.
5. A bug the change did not touch gets its own issue and does not block the
   PR.
6. For a bug in the change, write a test that fails first, on the lowest layer
   that reproduces it: Vitest for logic, markup and component state;
   Playwright in `e2e/` for layout, cookies, navigation and flows across
   pages. Record the red run, fix the bug, and start again at step 1.
7. After three rounds that each found a new bug, stop and hand the open bugs
   to a human.
8. Take a screenshot of each bug and of the final state of each scenario.
   Mask them as described above before they leave the machine. Close the
   session with `agent-browser --session <name> close`.

WebKit has no `agent-browser` driver. The `webkit-375` project in `e2e/`
covers it.

## Manual checks

- **Form markup or styles changed**: the list "What automation cannot check"
  under Accessibility in [`frontend/README.md`](../../frontend/README.md), and
  state 07 (375px wide) from [`frontend/DESIGN.md`](../../frontend/DESIGN.md).
- **Lint, format, TypeScript or CI configuration changed**: none.
