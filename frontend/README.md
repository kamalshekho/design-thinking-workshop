# Frontend — applicant form

The public German-language form where someone says how they want
to be involved with "Ich bin hier e.V.". One page, one submission, no
authentication.

The form is implemented: all eight states from `DESIGN.md` (sections 27–35)
are ported and covered by behavioural tests, plus the three category-loading
states (loading/error/empty) the backend contract in `API.md` adds on top.
State 07 (mobile 375px) is the one exception — it is the same markup under the
responsive rules in `ApplicationForm.module.css`, not a separate branch, so it
has no dedicated automated test and stays a manual check (see
[Testing](#testing)). [Changing a screen](#changing-a-screen) is the entry
point for touching an existing state or adding a new one.

Read [`DESIGN.md`](./DESIGN.md) before writing a component and
[`API.md`](./API.md) before touching a request. Vocabulary comes from
[`../CONTEXT.md`](../CONTEXT.md) and is binding.

## Getting started

Requires Node 24 (see `.nvmrc`; `nvm use` picks it up).

```bash
npm ci
npm run dev
```

With no backend running, requests are answered by Mock Service Worker, so the
form is fully usable before the Java service exists.

| Command                               | What it does                                          |
| ------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                         | Dev server on port 5173, mocked backend               |
| `npm run build`                       | Production build into `dist/`                         |
| `npm run size`                        | Gzip size of `dist/assets` vs. budget                 |
| `npm run preview`                     | Serve the built output                                |
| `npm run typecheck`                   | `tsc --noEmit`                                        |
| `npm run lint` / `lint:fix`           | ESLint                                                |
| `npm run stylelint` / `stylelint:fix` | Stylelint over CSS modules                            |
| `npm run format` / `format:check`     | Prettier                                              |
| `npm run check:tokens`                | Tokens in `tokens.css` nothing reads                  |
| `npm run check:token-json`            | Confirmed primitives in `token.json` vs. `tokens.css` |
| `npm run knip` / `knip:production`    | Dead files, exports and dependencies                  |
| `npm run jscpd`                       | Clones of 50+ tokens in production code               |
| `npm test` / `test:watch`             | Vitest                                                |
| `npm run check`                       | All checks and tests, run before a commit             |
| `npm run storybook`                   | Component workbench on port 6006                      |
| `npm run build-storybook`             | Static Storybook build                                |

To point the form at a real backend:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Where things live

```
frontend/
├── DESIGN.md                     design specification (source of truth for UI)
├── API.md                        contract with the backend
├── token.json                    design tokens for Figma
├── references/                   screenshots of the form, one per state
├── public/                       favicon, robots.txt, mock service worker (dev only)
│   └── fonts/                    self-hosted fallback face, plus its licence
└── src/
    ├── app/                      entry point and page shell
    ├── features/
    │   └── application-form/     the form: schema, transport, field mapping
    ├── components/ui/            presentational components, domain-free
    ├── content/                  German copy and external links
    ├── lib/                      error codes, routes, small helpers
    ├── styles/                   tokens.css and base.css
    ├── mocks/                    MSW handlers — API.md, executable
    └── test/                     test setup
```

A feature owns its schema, its transport and its components. Anything reusable
and domain-free moves down to `components/ui/`. There is one feature and there
is not expected to be a second — the staff dashboard is a separate surface.

## Code style

Prettier and ESLint decide formatting and most style questions; run them rather
than arguing. The settings the form shares with the staff dashboard live in the
repo root: the Prettier options in `../.prettierrc.json`, the common ESLint
blocks in `../eslint.base.mjs`.

The rules the form shares with the dashboard, and the check behind each, are
in the [coding standard](../docs/STANDARD.md). Among them:

- [named exports only](../docs/STANDARD.md#nur-benannte-exporte);
- [no barrel files](../docs/STANDARD.md#importrichtung-und-barrel-dateien);
- [one folder per component](../docs/STANDARD.md#ordner-der-komponenten),
  `Button/Button.tsx` next to `Button/Button.module.css`;
- [English identifiers](../docs/STANDARD.md#bezeichner-auf-englisch);
- [the compiler options](../docs/STANDARD.md#compiler-optionen), `strict` and
  `noUncheckedIndexedAccess` among them.

Two more conventions:

- **Type inference where it reads well, annotations at boundaries.** Exported
  functions and props get explicit types; local variables usually do not.
- **No `any`, no non-null assertion in `src` outside tests.** ESLint rejects
  both through `strictTypeChecked` in `../eslint.base.mjs`. If a type is hard
  to express, that is usually a sign the data shape is wrong.

## Component rules

**A component in `components/ui/` does not know the domain.** It receives
finished strings as props. That part is a convention the review checks.
ESLint rejects an import from `features/` or `app/`, but since ADR-0008 not
one from `content/`.
See also [the import rules](../docs/STANDARD.md#importrichtung-und-barrel-dateien).

Two reasons, and the second is the one that matters:

1. It matches the Figma component boundary in `DESIGN.md` section 45. An
   `Input` in Figma has a `label` property; so does ours.
2. Keeping copy in the feature lets the same control serve different fields
   without depending on their domain meaning. The staff dashboard owns its
   own components, as recorded in
   [ADR-0002](../docs/adr/0002-dashboard-as-separate-application.md).

Concretely:

```tsx
// Good — the component takes a string
<Field label={de.fields.name.label}>{(aria) => <TextInput {...aria} />}</Field>

// Wrong — the component reaches for copy itself
<NameField />  // imports de.ts internally
```

Other rules:

- **Controls with labels, hints or inline errors are wrapped in `Field`.**
  `Field` owns the label, the hint and the inline error, and hands the control
  its `id`, `aria-describedby` and `aria-invalid` through a function. That is
  what makes the wiring impossible to forget. `Field/Field.tsx` is the
  reference for the pattern.
- **A compound control outside `Field` owns the same wiring at its call
  site.** The consent checkbox is the exception because its applicant-facing
  copy includes a link. When it has an error, give the error a stable `id`,
  pass that id through `aria-describedby`, set `aria-invalid`, and render the
  error with `role="alert"`.
- **A component does not validate.** Rules live in
  `features/application-form/schema.ts`; see
  [the coding standard](../docs/STANDARD.md#eine-komponente-validiert-nicht).
- **A component does not fetch.** Requests live in
  `features/application-form/api.ts`; see
  [the coding standard](../docs/STANDARD.md#eine-komponente-lädt-keine-daten).
- **State stays local.** One page, one form — `react-hook-form` holds the
  values and there is no store. Do not add one.

## Design tokens

The coding standard says where a literal value may stand and what checks it,
under
[Literal values only in the token source](../docs/STANDARD.md#literale-werte-nur-in-der-quelle-der-tokens).

`token.json` is what Figma reads. How it relates to `tokens.css` is under
[`tokens.css` is the source for `token.json`](../docs/STANDARD.md#tokenscss-ist-die-quelle-für-tokenjson).

If a design needs a value that no token expresses, add a semantic token rather
than a literal, and say so in the pull request — a new token is a design
decision, not an implementation detail.

## Fonts

Two faces, in this order:

1. **Akhand Soft** — the brand face from `DESIGN.md` section 5. Weight 400
   only; the section warns against assuming a real Medium or Bold, so
   `base.css` pins headings to 400 rather than letting the browser synthesise
   a fake bold. The file is provisioned outside the repository, so a fresh
   checkout and CI do not have it.
2. **Nunito** — self-hosted from `public/fonts/`, SIL OFL, weight 400. The
   closest free match: geometric sans, rounded terminals, tall x-height. Its
   licence is in `public/fonts/OFL.txt` and has to stay there.

Without the brand file the browser falls through to Nunito. That is intended
behaviour, not an error — the page still reads as the same product instead of
dropping to Arial.

The two faces have different metrics, so line breaks and block heights shift
slightly between them. When a build does not match a Figma frame, check which
face actually rendered before chasing a spacing bug.

## Copy

All fixed applicant-facing copy lives in `src/content/de.ts`, except the
dynamic category labels returned by the backend as specified in `API.md`. No
localized string appears in a component.

The point is reviewability: the fixed copy of the form can be read against
`DESIGN.md` in one file. `DESIGN.md` section 49 forbids rewriting the
specified wording.
Category labels are backend-owned data because staff members can maintain them
(`A12`).

Some strings, most error messages among them, were written for this
implementation and are **not yet in `DESIGN.md`**. Their comment in `de.ts`
starts with "Not yet in DESIGN.md, see issue #148". The copy review itself is
tracked in [#148](https://github.com/kamalshekho/design-thinking-workshop/issues/148),
so the code carries no review notes of its own.

The applicant form is German only; the English version and its language switch
were removed (`A22`). Backend-managed category labels are shown as the API
returns them. The dashboard is a separate surface with German UI. Code and
documentation use English; see
[ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md).

## Errors

The coding standard describes how an error from the schema or from the
backend becomes visible text, under [Errors](../docs/STANDARD.md#fehler).

Codes are machine-readable (`EMAIL_INVALID`, `CONSENT_REQUIRED`) and listed in
`lib/errorCodes.ts`. The backend sends the same codes and no
localized error text; see `API.md`.

## Changing a screen

`DESIGN.md` sections 26 to 35 define the eight states this form ports from
Figma; `references/` holds screenshots of form fragments and interactions, not
one capture per state. All eight are built. This is the order they were built
in, smallest risk first, and the order to follow again when a state changes or
a new one is added:

1. **Read the spec section** for the state you are touching. It gives exact
   copy, exact spacing and the rules the design review will check.
2. **Update the copy in `de.ts`** first, matching the spec word for word. If
   the spec has no wording for something you need, write it, mark it as not
   yet in `DESIGN.md`, and raise it — do not invent copy quietly.
3. **Build or adjust the control in `components/ui/`.** Keep it domain-free;
   take the variants from `DESIGN.md` section 45 so the Figma component and
   the React component have the same states.
4. **Compose the screen in `features/application-form/`**, taking values from
   the schema and text from `de.ts`.
5. **Use tokens for every value.** Where the design shows `36px`, use
   `var(--wp--preset--spacing--60)`. Which literals Stylelint already rejects
   is in the
   [coding standard](../docs/STANDARD.md#literale-werte-nur-in-der-quelle-der-tokens).
6. **Add or update a behavioural test** for the state — what the applicant
   sees, not how the component is built. `ApplicationForm.test.tsx` shows the
   shape.
7. **Walk the checklist** in `DESIGN.md` section 53 and the manual items below.

Things the design deliberately forbids, worth knowing before touching a
screen: no progress steps, no floating labels, no icons inside inputs, no
extra fields beyond the six, no generic error banner, no giant rounded cards.
Section 52 has the full list.

## Testing

Vitest, React Testing Library and MSW. Tests describe what an applicant
experiences:

- picking a route shows the right fields, and only those;
- an address the association cannot reply to produces an inline error under the
  email field;
- submitting disables the button and cannot fire twice;
- a `400` from the backend lands under the field it belongs to;
- each of the eight states is free of automatically detectable a11y violations
  (`expectNoA11yViolations` from `src/test/a11y.ts`).

Assert on **error codes and visible localized text**, never on class names or
component internals. Native select behaviour on a real phone (`DESIGN.md`
section 34) is a manual check either way.

## Quality gates

The coding standard lists what the shared pre-commit hook runs on the form's
staged files, and which checks run only in CI, under
[Where the checks run](../docs/STANDARD.md#wo-die-prüfungen-laufen).

`npm install` in either app points `core.hooksPath` at `.husky/_`. A clone
made while the hook still lived in `frontend/.husky` needs one `npm install`
in either app to pick up the new hook.

CI is one workflow, `.github/workflows/ci.yml`, run on every pull request and
every push to `main`. Its `changes` job decides which of the other jobs run:

- `frontend` runs typecheck, ESLint, Stylelint, both token checks
  (`check:tokens` and `check:token-json`), knip in both modes, jscpd, format
  check, tests, the build and `npm run size`, then uploads `dist` for 7 days.
  It runs when `frontend/`, `eslint.base.mjs`, `.prettierrc.json`, `scripts/`
  or `ci.yml` changes.
- `config` runs `scripts/check-config-parity.mjs`, which checks that the form
  and the dashboard share compiler options, tool versions and Node version,
  and audits the workflows with actionlint and zizmor.
- `ci`, the gate, fails when any of these jobs, or the dashboard's, failed or
  was cancelled. A skipped job counts as passed, so this one job carries the
  result of the whole run.

All of it is required; none of it is advisory.

## Accessibility

`DESIGN.md` section 40 is the requirement. Automated: `eslint-plugin-jsx-a11y`
in the linter, and `expectNoA11yViolations` (axe-core) in tests. Together they
catch missing labels, broken `aria-describedby` wiring and structural problems.

`src/test/a11y.test.ts` checks that the helper can still fail. An a11y check
that cannot fail is worse than none, because it reports success.

**What automation cannot check, and you have to check by hand:**

- the focus ring is actually visible on creme _and_ on white surfaces;
- each error text explains what to do, not just that something is wrong — a red
  border alone fails section 32;
- [tap targets](../docs/STANDARD.md#tippflächen) on a real phone beyond what
  axe's `target-size` rule measures in E2E;
- the native select opens the OS picker on iOS and Android;
- the sticky mobile submit does not cover the privacy copy;
- the form is completable with the keyboard alone, in a sensible order.

Do not treat a green axe run as section 40 being satisfied.

## Backend

The backend does not exist yet. [`API.md`](./API.md) is the frontend's proposal
for the contract, and `src/mocks/handlers.ts` is that proposal as running code —
including idempotency and the honeypot. If the real backend disagrees with the
handlers, one of the two is wrong and it needs a conversation, not a patch.

## This is a prototype

The form is deployed on **our own domain**, by us. It is not part of
`ichbinhier.eu`, and the association owns none of it — we are showing them what
the platform would look like.

Three consequences that are easy to forget:

- **The page carries their branding on a domain that is not theirs.** In search
  results that reads as an official page of the association. `index.html` sets
  `noindex, nofollow` and `public/robots.txt` disallows everything. Remove that
  only when the association owns the deployment. Keeping the demo behind basic
  auth or an unguessable host is worth the five minutes.
- **The consent text names the wrong party.** `DESIGN.md` section 23 has the
  applicant agree that _ichbinhier e.V._ stores their details; on our domain the
  data reaches us instead. The copy is right for the system we are proposing, so
  it stays — but the demo must therefore not collect real applications. Test
  data only, and reset it.
- **The deployment is temporary.** It exists for the presentation. `nginx.conf`
  and `docker-compose.yml` describe the whole of it, so taking it down is
  removing the container.

## Open questions

Blocking, in the sense that shipping without an answer means shipping something
wrong:

1. **The external URLs in `src/content/links.ts` are guesses** — the privacy
   policy, where a community member actually joins, and the supporting
   membership application. The two bypass routes consist of nothing but their
   link, so a wrong URL breaks the majority route (`A5`). The header and
   footer carry no destinations at all: the prototype shows their items
   without links, and the footer's Kontakt block holds placeholder data.
2. **Error copy beyond the email field is ours, not the specification's.** It
   needs a review pass.
3. **The consent text version (`2026-09`) needs a home** where a reader can
   resolve it to the exact wording.
4. **The confirmation email does not exist yet.** The form's subheading and its
   confirmation screen both promise it. Until the backend sends it, that
   promise is unbacked — and if it will not be ready, the copy has to change
   before the demo, not after.
