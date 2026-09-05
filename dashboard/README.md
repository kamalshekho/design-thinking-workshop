# Dashboard — staff application

Wayfinder (issue #10) is planning-first: this document was written as the
technical specification for the scaffold ahead of the code, so implementation
started from an agreed boundary instead of an assumed one. The scaffold below
is now in place; screen-by-screen design is still open (see
[Scope of this document](#scope-of-this-document)). See
[`../docs/adr/0002-dashboard-as-separate-application.md`](../docs/adr/0002-dashboard-as-separate-application.md)
for why these choices were made, and [`../CONTEXT.md`](../CONTEXT.md) for the
vocabulary — it is binding here too.

The staff dashboard shows staff members the Applications submitted through the
public form and lets them move an Application through its lifecycle. It is not
an email client and does not touch the historical mixed inbox.

## Boundary

- Separate application, sibling to [`../frontend/`](../frontend/). No shared
  workspace package with `frontend/` — each surface owns its own dependencies
  and conventions.
- Own `package.json`, npm — the same package manager as `frontend/`, so the
  repository has one, not two.
- UI components are copied by hand, one at a time as a screen needs them, from
  the local Untitled UI React clone at
  `/home/iliasalmerekov/Projects/Schule/react` (MIT-licensed). No submodule,
  subtree, or npm dependency on the clone — nothing pulls its updates in
  automatically.
- Components keep Untitled UI's own stack (Tailwind CSS, React Aria) and its
  own file layout (components can span several files per folder, some
  `index.ts` barrels exist). `frontend/README.md`'s one-component-per-folder
  and no-barrel-file rules do not apply here — they were written to protect
  the applicant form's design tokens, which this surface does not share.
- AG Grid Community owns the Applications list. It is not yet validated for
  this use case — that validation is separate work, not decided by this
  document.

## Language

The dashboard UI is German (`A6`) — staff members are German speakers. Code
identifiers, this specification, comments, and tracker prose stay English, the
same split `frontend/` uses for its own copy versus its own code.

German UI labels belong in UI copy. Documents and the glossary use English
domain terms without German translations or bilingual label tables. See
[ADR-0003](../docs/adr/0003-german-dashboard-english-documentation.md).

## Attribution

`dashboard/THIRD_PARTY_LICENSES` carries Untitled UI React's MIT notice and
lists every component copied from the clone. It is a source-tree file, not
something shown in the UI — the same treatment `frontend/public/fonts/OFL.txt`
already gets for the Nunito font licence. Update it in the same commit as any
new component copy.

## Scope of this document

In scope: the application boundary, the component-sourcing mechanism, and the
conventions that follow from both — enough to start the scaffold.

Out of scope, still open, and not decided here: screen-by-screen design, the
AG Grid Community validation, the backend contract, the final specification
structure, and the acceptance/demo walkthrough. These are the remaining items
on the Wayfinder map (issue #10) and follow once this boundary is built on.

## Getting started

Requires Node 24 (see `.nvmrc`; `nvm use` picks it up).

```bash
npm ci
npm run dev
```

| Command                           | What it does                  |
| --------------------------------- | ----------------------------- |
| `npm run dev`                     | Dev server on port 5174       |
| `npm run build`                   | Production build into `dist/` |
| `npm run preview`                 | Serve the built output        |
| `npm run typecheck`               | `tsc --noEmit`                |
| `npm run lint` / `lint:fix`       | ESLint                        |
| `npm run format` / `format:check` | Prettier                      |
| `npm test` / `test:watch`         | Vitest                        |

CI (`.github/workflows/dashboard.yml`, mirroring `frontend.yml`, scoped to
`dashboard/`) runs typecheck, ESLint, format check, tests and the build on
every pull request touching this directory.

## What does not exist yet

No `THIRD_PARTY_LICENSES` file yet — no component has been copied from the
Untitled UI clone. Add it in the same commit as the first one. Screen-by-screen
design, the AG Grid Community validation, and the backend contract are still
open, tracked on the Wayfinder map (issue #10).
