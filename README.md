# Volunteer Intake Platform — "Ich bin hier e.V."

A three-week design-thinking workshop. "Ich bin hier e.V." is a German
association raising awareness about online hate; people who want to volunteer
write to a single inbox, where their requests get lost among roughly a thousand
emails of every kind and go unanswered.

We are designing a platform that gives volunteer requests their own structured
channel: a German-language web form that splits community members from
applicants for association work, an instant reply carrying a concrete next step,
and a staff dashboard that holds the applications.

This repo holds the design record and the code. The applicant form is a React
project in [`frontend/`](./frontend/), and the Spring Boot service behind it is
in [`backend/`](./backend/).

## Running the prototype

```bash
cp .env.example .env   # set DB_PASSWORD
docker compose up -d --build
```

The form is then on <http://localhost:8081>

`docker compose down` to stop services, with `-v` to drop the database

## Documents

| Document | What it holds |
| --- | --- |
| [`CONTEXT.md`](./CONTEXT.md) | The domain vocabulary — the terms we use and the ones we avoid |
| [`docs/CASE.md`](./docs/CASE.md) | The client's situation, the problem statement, and the Team Canvas |
| [`docs/ASSUMPTIONS.md`](./docs/ASSUMPTIONS.md) | Every number and process step we invented, each with a confidence and what breaks if it is wrong |
| [`docs/DISNEY.md`](./docs/DISNEY.md) | Walt Disney method — Dreamer, Realist, Critic — and the scope that survives all three |
| [`frontend/README.md`](./frontend/README.md) | The form's code conventions, component rules, and how a screen is ported from Figma |
| [`frontend/DESIGN.md`](./frontend/DESIGN.md) | Design specification of the form — copy, states, tokens, Figma structure |
| [`frontend/API.md`](./frontend/API.md) | What the form sends to the backend and what it needs back |
| [`frontend/references/`](./frontend/references/) | Screenshots of the applicant form, one per UI state |
| [`docs/adr/`](./docs/adr/) | Decisions that are hard to reverse, and why we took them |
| [`AGENTS.md`](./AGENTS.md) | Conventions for writing in this repo |

Start with `docs/ASSUMPTIONS.md`. The client answered us once and has been silent
since, so almost everything here is our own modelling — the assumptions document
says which parts are theirs and which are ours.


## Team
Kamal, Ilyas, Tarek, Leon, Bohdan, Anna, Lawrence.
