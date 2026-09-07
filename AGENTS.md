# Working in this repo

This repo holds the design record of a three-week school workshop — a volunteer
intake platform for "Ich bin hier e.V." — and the frontend that implements the
applicant form.

- [`CONTEXT.md`](./CONTEXT.md) — the domain vocabulary
- [`docs/CASE.md`](./docs/CASE.md) — the client's situation, problem statement, Team Canvas
- [`docs/ASSUMPTIONS.md`](./docs/ASSUMPTIONS.md) — every number and process step, each with an id and a confidence
- [`docs/DISNEY.md`](./docs/DISNEY.md) — Dreamer / Realist / Critic pass, and the surviving scope
- [`docs/adr/`](./docs/adr/) — decisions that are hard to reverse, one file each
- [`frontend/`](./frontend/) — the applicant form: specification, API contract, React project
- [`frontend/references/`](./frontend/references/) — screenshots of the applicant form, one per UI state
- [`dashboard/`](./dashboard/) — the staff dashboard: API contract, conventions, React project

## Working on the frontend

[`frontend/README.md`](./frontend/README.md) holds the code conventions,
component rules and the porting workflow, and it takes precedence over this
file for anything inside `frontend/`. Three rules are worth naming here because
they are easy to break from the outside:

- applicant-facing German lives only in `frontend/src/content/de.ts`;
- literal colours and sizes live only in `frontend/src/styles/tokens.css`;
- the wording specified in `frontend/DESIGN.md` is not rewritten in passing —
  code and specification change in the same commit.

## Vocabulary is binding

`CONTEXT.md` defines each term together with an _Avoid_ list. Write the canonical
term; when a term is missing, add it to `CONTEXT.md` in the same shape rather
than coining one in passing.

Recorded quotes are the exception: the Team Canvas in `CASE.md` stays verbatim,
non-canonical words and all.

## Every claim traces to an assumption

The client spoke to us once and has been silent since (`C1`). Only `C2` (mail is
unfindable among ~1,000 emails) and `A7` (the four categories) are client
statements — everything else is our proposal and reads as one.

So a number, a status flow, a share, or a volume belongs in `ASSUMPTIONS.md`
first, with an id, a confidence (high / medium / low), and what breaks if it is
wrong. Then cite the id where you use it: `` (`A5`) ``. When you find a claim
already loose in prose, give it an entry or drop it.

Confidence is coarse on purpose, and a low-confidence entry is worth writing —
an invented figure held openly beats an implied fact.

## Language split

German for anything a person outside the team reads — form copy, auto-replies,
templates, and the staff dashboard UI, since staff members are German speakers
(`A6`). English for the documents in this repo, the code, the specifications,
and the presentation.

## Prose shape

Wrap prose at 80 columns; leave tables and links on one line. Plain Markdown,
relative links between documents, no emoji.

## Git

Commit subjects follow [Conventional Commits
1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): subject`,
in English, imperative, lowercase. `docs:` covers most work here while the repo
is documents; `feat:`, `fix:`, `refactor:`, `chore:` once code exists. The scope
is the area touched — `docs(assumptions):`, `feat(form):`.

The record names the humans who did the work and no one else: the author trailer
is the only attribution a commit, PR, issue, or review comment carries. Leave
out `Co-Authored-By` and any agent or tool footer.

A PR description is two or three sentences — what changed and why. The commits
carry the detail.
