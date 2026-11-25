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
- **Property testing**: none installed.

The backend needs JDK 25. Without one, run its suite in the Maven image:

```bash
docker run --rm -v "$PWD/backend":/build -w /build -v ibh-m2:/root/.m2 \
  docker.io/library/maven:3.9-eclipse-temurin-25-alpine mvn -B test
```

## Run

- **Start**: `docker compose up -d --build` from the root. It needs a `.env` copied from `.env.example` with `DB_PASSWORD` and `STAFF_1_PASSWORD` to `STAFF_5_PASSWORD` set. `SPRING_PROFILES_ACTIVE=demo` seeds the demo week of Applications into an empty database.
- **Ready when**: `docker compose ps` shows `backend`, `frontend` and `dashboard` as `healthy`.
- **Drive**: `playwright` for the form and the dashboard; `http` for the API, sent through the dashboard's nginx at `http://localhost:8082/api/v1/...`.
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
- Playwright is a dependency of no app. Install `playwright-core` into a
  directory outside the repo and point `executablePath` at a browser in
  `~/.cache/ms-playwright`.
- jsdom lays nothing out: every `getBoundingClientRect()` in a Vitest test
  returns zeros. Sizes, overlap and tap targets need the browser.
- A local database can hold Applications typed in by hand. Before a screenshot
  leaves the machine, mask every row whose email does not end in
  `@example.org`.

## Manual checks

- **Form markup or styles changed**: the list "What automation cannot check"
  under Accessibility in [`frontend/README.md`](../../frontend/README.md), and
  state 07 (375px wide) from [`frontend/DESIGN.md`](../../frontend/DESIGN.md).
- **Lint, format, TypeScript or CI configuration changed**: none.
