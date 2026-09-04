# Staff dashboard is a separate application with its own design system

The staff dashboard (Wayfinder, issue #10) needs UI components, and Untitled
UI React (MIT-licensed, local clone at a sibling project) is the intended
source rather than building each component from scratch. `frontend/` already
forbids Tailwind and enforces a one-component-per-folder, no-barrel-file
convention built for the applicant form.

**Decision:** the dashboard lives in a new `dashboard/` directory, sibling to
`frontend/`, with its own `package.json` (npm, matching `frontend/`'s package
manager) and no shared workspace package with `frontend/`. It uses Untitled UI
React's native stack (Tailwind CSS, React Aria) and file-layout conventions as
they are, rather than porting components into `frontend/`'s CSS-Modules/token
system. Components are copied by hand from the local clone one at a time, as a
screen needs them — no submodule, subtree, or npm dependency on the clone. A
`dashboard/THIRD_PARTY_LICENSES` file carries Untitled UI's MIT notice and
lists what was copied.

**Why:** the dashboard's audience (staff members, not applicants), constraints
(no applicant-facing copy or token discipline to protect) and delivery shape
(Wayfinder is planning-first — `dashboard/` starts with only a specification)
differ enough from the applicant form that sharing a design system would mean
bending one of the two to fit the other. Keeping the two isolated is also the
direct answer to issue #11's "without creating premature shared packages."

## Consequences

- Two different frontend stacks live in the same repository — CSS Modules for
  `frontend/`, Tailwind for `dashboard/`. This is deliberate, not drift.
- Updating a copied component means re-copying it by hand; nothing pulls
  Untitled UI updates automatically.
- `frontend/README.md`'s barrel-file and one-component-per-folder rules do not
  apply inside `dashboard/`.
