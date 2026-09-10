# Frontend — applicant form

The public German- and English-language form where someone says how they want
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

| Command                               | What it does                            |
| ------------------------------------- | --------------------------------------- |
| `npm run dev`                         | Dev server on port 5173, mocked backend |
| `npm run build`                       | Production build into `dist/`           |
| `npm run preview`                     | Serve the built output                  |
| `npm run typecheck`                   | `tsc --noEmit`                          |
| `npm run lint` / `lint:fix`           | ESLint                                  |
| `npm run stylelint` / `stylelint:fix` | Stylelint over CSS modules              |
| `npm run format` / `format:check`     | Prettier                                |
| `npm test` / `test:watch`             | Vitest                                  |
| `npm run storybook`                   | Component workbench on port 6006        |
| `npm run build-storybook`             | Static Storybook build                  |

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
├── public/
│   └── fonts/                    self-hosted fallback face, plus its licence
└── src/
    ├── app/                      entry point and page shell
    ├── features/
    │   └── application-form/     the form: schema, transport, routes
    ├── components/ui/            presentational components, domain-free
    ├── content/                  localized copy and external links
    ├── styles/                   tokens.css and base.css
    ├── mocks/                    MSW handlers — API.md, executable
    └── test/                     test setup
```

A feature owns its schema, its transport and its components. Anything reusable
and domain-free moves down to `components/ui/`. There is one feature and there
is not expected to be a second — the staff dashboard is a separate surface.

## Code style

Prettier and ESLint decide formatting and most style questions; run them rather
than arguing. What they cannot check:

- **Named exports only.** `export function Button()`, never
  `export default`. A default export can be imported under any name, which
  makes a component hard to find. Enforced by ESLint.
- **No barrel files.** No `index.ts` that re-exports a folder. Import the file
  you mean, so a reader can see where a symbol comes from.
- **One component per folder**, `Button/Button.tsx` next to
  `Button/Button.module.css`. The stylesheet sits beside the only component
  allowed to use it.
- **Type inference where it reads well, annotations at boundaries.** Exported
  functions and props get explicit types; local variables usually do not.
- **No `any`, no non-null assertion in `src` outside tests.** `strict` plus
  `noUncheckedIndexedAccess` is on; if a type is hard to express, that is
  usually a sign the data shape is wrong.
- **English identifiers, localized strings.** A variable is never named
  `bewerbung`; the copy it renders comes from the active locale.

## Component rules

**A component in `components/ui/` does not know the domain.** It receives
finished strings as props. It may not import from `content/` or `features/` —
ESLint rejects that import.

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
  `features/application-form/schema.ts`, once. A component that re-checks a
  length will disagree with the schema eventually.
- **A component does not fetch.** Requests live in
  `features/application-form/api.ts`.
- **State stays local.** One page, one form — `react-hook-form` holds the
  values and there is no store. Do not add one.

## Design tokens

`src/styles/tokens.css` is the only file allowed to hold a literal colour, size
or shadow. Everything else references a variable:

```css
/* Good */
color: var(--color-primary);

/* Rejected by Stylelint */
color: #e31119;
```

Stylelint enforces this, and ESLint rejects the `style` prop for the same
reason — an inline style cannot be checked for literal values.

Primitives in `tokens.css` come from the live site and are mirrored in
`token.json`, which is what Figma reads. **Change one and change the other in
the same commit**, or the design and the code stop describing the same product.

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

All fixed applicant-facing copy lives in `src/content/de.ts` and
`src/content/en.ts`, except the dynamic category labels returned by the backend
as specified in `API.md`. No localized string appears in a component.

The point is reviewability: the fixed copy of the form can be read against
`DESIGN.md` in two locale files. `DESIGN.md` section 49 forbids rewriting the
specified wording, so a copy change is a change to both files in one commit.
Category labels are backend-owned data because staff members can maintain them
(`A12`).

Some strings — most error messages — were written for this implementation and
are **not yet in `DESIGN.md`**. They are marked in `de.ts` and still need a copy
review.

The applicant form supports German and English through a small local locale
provider; the selected language is kept in browser storage. Backend-managed
category labels are returned as provided by the API and are not translated in
the client. The dashboard is a separate surface with German UI. Code and
documentation use English; see
[ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md).

## Errors

One path for every error, whether it came from the schema or from the backend:

```
zod / server  →  error code  →  locale content  →  visible text
```

Codes are machine-readable (`EMAIL_INVALID`, `CONSENT_REQUIRED`) and listed in
`features/application-form/errors.ts`. The backend sends the same codes and no
localized error text — see `API.md`.

Adding a code without adding its German and English text is a type error, which
is intentional.

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
   `var(--wp--preset--spacing--60)`. Stylelint will stop you otherwise.
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
component internals. There is no Playwright: all the logic is client-side and
synchronous, so RTL covers it. Native select behaviour on a real phone
(`DESIGN.md` section 34) is a manual check either way.

## Quality gates

The pre-commit hook runs Prettier and `eslint --fix` on staged files only. It
is deliberately fast — a slow hook gets bypassed with `--no-verify`.

CI (`.github/workflows/frontend.yml`) runs typecheck, ESLint, Stylelint,
format check, tests and the build on every pull request touching `frontend/`.
All of it is required; none of it is advisory.

## Accessibility

`DESIGN.md` section 40 is the requirement. Automated: `eslint-plugin-jsx-a11y`
in the linter, and `expectNoA11yViolations` (axe-core) in tests. Together they
catch missing labels, broken `aria-describedby` wiring and structural problems.

`src/test/a11y.test.ts` checks that the helper can still fail. An a11y check
that cannot fail is worse than none, because it reports success.

**What automation cannot check, and you have to check by hand:**

- **colour contrast** — jsdom computes no colour, so axe's `color-contrast`
  rule is switched off and nothing automated checks it;
- the focus ring is actually visible on creme _and_ on white surfaces;
- each error text explains what to do, not just that something is wrong — a red
  border alone fails section 32;
- tap targets are at least 44px on a real phone;
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
   link, so a wrong URL breaks the majority route (`A5`).
2. **Error copy beyond the email field is ours, not the specification's.** It
   needs a review pass in both supported languages.
3. **The consent text version (`2026-09`) needs a home** where a reader can
   resolve it to the exact wording.
4. **The confirmation email does not exist yet.** The form's subheading and its
   confirmation screen both promise it. Until the backend sends it, that
   promise is unbacked — and if it will not be ready, the copy has to change
   before the demo, not after.
