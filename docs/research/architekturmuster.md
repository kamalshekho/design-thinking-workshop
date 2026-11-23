# Architekturmuster für React-Anwendungen

Diese Notiz beantwortet die Frage aus Issue #103 der Karte #100: Welche
Architekturmuster kommen für das Bewerbungsformular (`frontend/`) und das
Dashboard (`dashboard/`) in Frage, und wie lassen sich ihre Grenzen maschinell
prüfen? Sie vergleicht Feature-Sliced Design, bulletproof-react und flache
Feature-Ordner sowie die Werkzeuge, die Importgrenzen in CI prüfen.

Die Notiz empfiehlt kein Muster. Die Entscheidung fällt in einem eigenen
HITL-Ticket der Karte. Stand der Angaben ist der 23.11.2026, Code-Stand Commit
`506b239`. Versionen, Veröffentlichungsdaten und Downloadzahlen stammen aus der
npm-Registry ([npm-registry]) und der npm-Download-API ([npm-downloads]),
abgefragt am selben Tag. Jede andere Aussage nennt ihre Quelle am Absatz.

## Ausgangslage

Beide Anwendungen nutzen React 19, Vite 8, TypeScript 6 und ESLint 9.39 mit
Flat Config über `tseslint.config(...)`. Gezählt mit `wc -l` über alle `*.ts`
und `*.tsx` in `src/` ohne Tests und Stories hat das Bewerbungsformular rund
2.300 Zeilen und das Dashboard rund 13.500 Zeilen.

Das Bewerbungsformular hat eine flache Struktur mit genau einem Feature:
`app/`, `features/application-form/`, `components/ui/`, `content/`, `lib/`,
`styles/`, `mocks/`, `test/` ([frontend-readme]). Eine Grenze ist schon
maschinell geprüft. `frontend/eslint.config.js` verbietet mit der
ESLint-Kernregel `no-restricted-imports`, dass `src/components/**` aus
`content/` oder `features/` importiert. Die README verbietet außerdem
Barrel-Dateien (`index.ts`, die einen Ordner re-exportiert) und verlangt eine
Komponente pro Ordner.

Das Dashboard trennt nach Aufgabe: `app/`, `features/` mit einem Ordner pro
Screen (`overview`, `applications`, `categories`, `discarded`, `auth`),
`components/`, `domain/`, `api/`, `queries/`, `test/`, dazu `hooks/` und
`utils/` ([dashboard-readme]). ADR-0006 legt fest, dass es genau einen Cache
für Server-State gibt, den TanStack-Query-Cache. Die Screens bekommen Daten
über Props, ein Container pro Screen hält die Query-Hooks, und `src/api/`
enthält kein React ([adr-0006]). Rund 5.300 Zeilen liegen in
`components/base/`, `components/application/`, `components/foundations/` und
`components/ui/`, überwiegend aus Untitled UI kopierter Code, der in der
Dateistruktur des Originals bleiben soll. Der Alias `@/` zeigt auf `src/`.
`dashboard/eslint.config.js` enthält bisher keine Regel für Importgrenzen.

## Die drei Muster

### Feature-Sliced Design

Feature-Sliced Design (FSD) teilt den Code in Schichten, Slices und Segmente.
Die Schichten sind von oben nach unten `app`, `processes`, `pages`, `widgets`,
`features`, `entities` und `shared`. `processes` ist veraltet, der Inhalt soll
nach `features` und `app` wandern ([fsd-layers]).

Die Importregel lautet: Eine Datei in einem Slice darf andere Slices nur aus
Schichten strikt darunter importieren. Slices derselben Schicht kennen sich
nicht. `app` und `shared` haben keine Slices, ihre Segmente dürfen sich
gegenseitig importieren ([fsd-layers]). Für unvermeidbare Querbezüge zwischen
Entities gibt es eine eigene Public API in der Form `entities/A/@x/B`. Die
Dokumentation rät, sie nur auf der Entities-Schicht zu verwenden
([fsd-public-api]).

Jeder Slice hat eine Public API, in der Regel eine `index.ts`. Wildcard-Exporte
sind unerwünscht. In `shared/ui` und `shared/lib` empfiehlt FSD eine eigene
`index.ts` pro Komponente statt einer für den ganzen Ordner, weil eine große
Barrel-Datei Tree-Shaking verschlechtert. Die Dokumentation sagt selbst, dass
viele Index-Dateien den Dev-Server verlangsamen können ([fsd-public-api]).
Vite rät allgemein von Barrel-Dateien ab, weil der Dev-Server beim Import
eines einzelnen Namens alle re-exportierten Dateien laden und transformieren
muss ([vite-performance]).

Version 2.1 vom 13.11.2024 heißt "Pages come first". Code, den keine andere
Seite nutzt, bleibt im Slice der Seite, auch Formulare und Datenlogik. Widgets
dürfen eigene Stores und API-Aufrufe haben. Die Version ist abwärtskompatibel
([fsd-releases]). Laut Übersicht eignet sich FSD für Anwendungen jeder Größe.
Sie sagt aber auch, dass sich ein Umbau nicht lohnen muss, wenn die bestehende
Architektur funktioniert, und beschreibt eine schrittweise Migration, die bei
`app` und `shared` beginnt ([fsd-overview]).

Für TanStack Query nennt der FSD-Leitfaden drei Orte für Query-Keys und
Query-Fabriken mit `queryOptions`: `shared/api` als ein Ordner, `shared/api`
aufgeteilt nach Controller oder das `api`-Segment eines Entity. Mutationen
sollen getrennt von Queries liegen, entweder nahe am Ort der Nutzung oder in
`shared` bzw. `entities`. Der `QueryClient` und sein Provider gehören nach
`app/providers` ([fsd-react-query]).

Auf das Dashboard übertragen hieße das ungefähr: `app/` bleibt `app`, die
Screen-Ordner in `features/` werden zu `pages`, `domain/` wird zu `entities`,
`api/` und `queries/` landen in `shared/api` oder in den Entities, die
kopierten Komponenten in `shared/ui`. Das Bewerbungsformular hätte `app`, eine
Seite und `shared`. Zwei Reibungspunkte sind absehbar. FSD erwartet eine
`index.ts` pro Slice, das Bewerbungsformular verbietet Barrel-Dateien. Und die
Untitled-UI-Kopien folgen ihrer eigenen Dateistruktur, die zu den
Segment-Regeln von FSD passen muss oder ausgenommen wird.

### bulletproof-react

bulletproof-react ist ein Beispielprojekt mit Dokumentation, kein Framework.
Die Struktur hat in `src/` die Ordner `app` (Routen, Provider, Router),
`assets`, `components`, `config`, `features`, `hooks`, `lib`, `stores`,
`testing`, `types` und `utils`. Ein Feature-Ordner enthält nur die Unterordner,
die er braucht: `api`, `assets`, `components`, `hooks`, `stores`, `types`,
`utils` ([bp-structure]).

Die Abhängigkeiten laufen in eine Richtung, von geteiltem Code über `features`
zu `app`. Features importieren nur geteilten Code, `app` darf beides. Importe
zwischen Features sind unerwünscht, Features werden in `app` zusammengesetzt.
Durchgesetzt wird das mit der Regel `import/no-restricted-paths` aus
`eslint-plugin-import`, mit einer Zone pro Feature plus Zonen für die
Richtung. Barrel-Dateien pro Feature empfiehlt das Projekt nicht mehr, weil sie
Vite beim Tree-Shaking stören. Importiert wird direkt aus der Datei
([bp-structure]).

Server-State liegt im Feature. Der API-Client ist eine einzige Instanz in
`src/lib/api-client.ts`. Jede Anfrage bekommt eine eigene Datei im
`api`-Ordner des Features, zum Beispiel
`features/discussions/api/get-discussions.ts`, und dieselbe Datei enthält den
React-Query-Hook ([bp-api-layer]).

Die Beispielanwendung `apps/react-vite` nutzt React 18, Vite 5 und ESLint 8
mit `.eslintrc.cjs` ([bp-react-vite]). Die Regeln lassen sich in Flat Config
übertragen, das muss man aber selbst tun.

Das Dashboard ist heute schon nahe an dieser Struktur (`app`, `features`,
`components`, `hooks`, `utils`). Abweichend liegen `domain/`, `api/` und
`queries/` global statt im Feature. ADR-0006 begründet das: Der Key der Liste
wird von ihrem Hook, vom Stream und von jeder optimistischen Mutation gelesen
([adr-0006]). Mit bulletproof-react müssten Keys und Cache-Helfer deshalb in
einem geteilten Ordner wie `lib/` liegen, sonst entstünden Importe zwischen
Features. Das Bewerbungsformular passt mit einem
Feature ohne Umbau.

### Flache Feature-Ordner

Die React-Dokumentation schreibt keine Struktur vor. Sie nennt zwei übliche
Ansätze, Gruppierung nach Feature oder Route und Gruppierung nach Dateityp.
Sie rät, nicht tiefer als drei oder vier Ordnerebenen zu schachteln, Dateien,
die sich gemeinsam ändern, nahe beieinander zu halten, und am Anfang nicht
lange über die Struktur nachzudenken ([react-faq]).

"Flache Feature-Ordner" heißt hier: ein Ordner pro Feature oder Screen, daneben
wenige geteilte Ordner, ohne festes Schichtenmodell von außen. Beide
Anwendungen sind heute so gebaut. Welche Importe erlaubt sind, legt das Team
selbst fest und schreibt es in die eigene ESLint-Konfiguration, wie es das
Bewerbungsformular für `components/` schon tut. Server-State liegt dort, wo
das Team es festlegt, im Dashboard also nach ADR-0006 in `api/` und
`queries/`.

### Vergleich

| Kriterium | Feature-Sliced Design | bulletproof-react | Flache Feature-Ordner |
| --- | --- | --- | --- |
| Herkunft | Methodik mit Dokumentation und eigenem Linter | Beispielprojekt mit Dokumentation | keine feste Quelle, React-FAQ nennt den Ansatz |
| Schichten | 6 aktive Schichten, Slices, Segmente | geteilt, `features`, `app` | vom Team festgelegt |
| Importregel | nur strikt nach unten, keine Importe zwischen Slices einer Schicht, Ausnahme `@x` bei Entities | nur `shared -> features -> app`, keine Importe zwischen Features | vom Team festgelegt |
| Geteilte Komponenten | `shared/ui`, eine `index.ts` pro Komponente | `src/components` | z. B. `components/ui` |
| Server-State (React Query) | Keys und `queryOptions` in `shared/api` oder `entities`, Mutationen getrennt, `QueryClient` in `app` | Anfrage und Hook in `features/*/api`, Client in `lib` | vom Team festgelegt, im Dashboard ADR-0006 |
| Barrel-Dateien | Public API per `index.ts` pro Slice verlangt | rät davon ab | Bewerbungsformular verbietet sie |
| Fertiges Prüfwerkzeug | Steiger | Beispielregel für `import/no-restricted-paths` | keins, eigene Regeln |
| Umbau Bewerbungsformular | Ordner umbenennen, Public API je Slice | kaum | keiner |
| Umbau Dashboard | `domain`, `api`, `queries` auf `entities` und `shared` verteilen, Screens zu `pages` | `domain`, `api`, `queries` in geteilte Ordner, sonst kaum | keiner |

Quellen der Tabelle: [fsd-layers], [fsd-public-api], [fsd-react-query],
[bp-structure], [bp-api-layer], [react-faq], [adr-0006].

## Werkzeuge für Importgrenzen

Die Werkzeuge fallen in zwei Gruppen. ESLint-Regeln laufen im Editor, in
lint-staged und im bestehenden `npm run lint` mit. Eigene CLIs brauchen einen
zusätzlichen Schritt in CI und im pre-commit-Hook, sehen dafür aber den ganzen
Abhängigkeitsgraphen.

### ESLint-Kernregel `no-restricted-imports`

Die Regel ist in ESLint enthalten und im Bewerbungsformular schon im Einsatz.
Muster nach `patterns.group` (gitignore-Syntax) oder `patterns.regex` gelten
für den Importpfad, wie er im Code steht ([eslint-nri]). Die Regel löst also
weder relative Pfade noch den Alias `@/` auf. Eine Regel wie "kein Import aus
einem anderen Feature als dem eigenen" braucht einen eigenen Konfigurationsblock
pro Feature. Aufwand: keiner für die Installation, wachsend mit der Zahl der
Features.

### `eslint-plugin-import` und `eslint-plugin-import-x`

Die Regel `no-restricted-paths` arbeitet mit Zonen aus `target`, `from`,
`except` und `message`. Sie prüft den aufgelösten Pfad der importierten Datei,
nicht den Text des Imports ([import-nrp]). `eslint-plugin-import` bietet
`flatConfigs` und eine Anleitung für `tseslint.config(...)`. Für TypeScript
braucht es `eslint-import-resolver-typescript` ([import-readme]). Die letzte
Version ist 2.32.0 vom 20.06.2025, rund 84 Mio. Downloads pro Woche, Peer
ESLint bis 9 ([npm-registry]).

`eslint-plugin-import-x` ist ein Fork, der laut README schneller ist, weil er
`get-tsconfig` statt `tsconfig-paths` und weniger TypeScript nutzt
([import-x-readme]). Version 4.18.1 vom 09.11.2026, rund 10 Mio. Downloads pro
Woche, Peer ESLint 8.57, 9 und 10 ([npm-registry]). Beide Plugins brauchen wie
im bulletproof-Beispiel eine Zone pro Feature, um Importe zwischen Features zu
verbieten ([bp-structure]). Aufwand: zwei Pakete und eine Resolver-Einstellung,
danach Zonen pflegen.

### `eslint-plugin-boundaries`

Das Plugin ordnet Dateien und Ordner per Muster Element-Typen zu und prüft
Abhängigkeiten gegen Policies mit einem Default wie `disallow`. Teile des
Pfads lassen sich einfangen, sodass eine Policy eine ganze Familie von
Elementen abdeckt, etwa "jedes Feature nur sich selbst" ([boundaries-readme]).
Neben der Hauptregel `boundaries/dependencies` gibt es
`no-unknown-files`, `no-unknown-dependencies` und `no-ignored-dependencies`.
Die früheren Regeln `element-types`, `entry-point`, `external` und
`no-private` gelten als veraltet und gehen in `dependencies` auf
([boundaries-rules]).

Die Dokumentation zeigt Konfiguration nur als Flat Config in
`eslint.config.js` ([boundaries-quickstart]). Für TypeScript und Pfad-Aliase
listet sie `eslint-import-resolver-typescript` als Voraussetzung
([boundaries-ts]). Das Paket existiert seit Juni 2020, Version 7.4.4 vom
15.11.2026, rund 3,1 Mio. Downloads pro Woche ([npm-registry]), acht Releases
seit August 2026 und rund 1.000 Sterne ([boundaries-releases]). Die
Umbenennung der Regeln zeigt, dass sich die Konfiguration zwischen
Hauptversionen ändert. Aufwand: Plugin plus Resolver, eine Liste von Elementen
und Policies pro Anwendung. Das Plugin ist an kein Muster gebunden.

### `dependency-cruiser`

`dependency-cruiser` ist eine eigene CLI, kein ESLint-Plugin. `npx
dependency-cruiser --init` legt eine `.dependency-cruiser.js` an, mit
Startregeln gegen Zyklen, verwaiste Module und fehlende Abhängigkeiten in
`package.json`. Regeln stehen im Array `forbidden`, geprüft wird mit `npx
dependency-cruiser src`. Ausgaben gibt es unter anderem als `err` für Builds,
als `dot`-Graph, als HTML und als Mermaid ([depcruise-readme]). Mit "group
matching" verbietet eine einzige Regel Importe zwischen Geschwisterordnern,
über `$1` in `pathNot` ([depcruise-rules]). Die Option `tsConfig` liest die
`tsconfig.json` samt `extends` ([depcruise-options]).

TypeScript muss im Projekt installiert sein. Versionen 2 bis 6 funktionieren,
TypeScript 7 erst ab 7.1 ([depcruise-faq]). Das Paket existiert seit 2016,
Version 18.9.0 vom 22.11.2026, rund 9,9 Mio. Downloads pro Woche
([npm-registry]), rund 7.500 Sterne ([depcruise-readme]). Die ESLint-Version
spielt keine Rolle. Aufwand: ein Paket, `--init`, ein zusätzlicher Schritt in
CI und im pre-commit-Hook. Fehler erscheinen nicht im Editor.

### Steiger

Steiger ist der Linter von FSD für Dateistruktur und Architektur. Installiert
werden `steiger` und `@feature-sliced/steiger-plugin`, ausgeführt mit `npx
steiger ./src`. Die Konfiguration liegt in `steiger.config.ts` und ist dem
Flat-Config-Format von ESLint nachgebaut, mit `files`, `rules` und `ignores`.
Das Plugin hat 21 Regeln, darunter `fsd/forbidden-imports` gegen Importe aus
höheren Schichten und zwischen Slices einer Schicht ([steiger-readme]).

Zum Reifegrad widersprechen sich die Quellen. Die Release-Notes zu FSD 2.1
nennen Steiger produktionsreif ([fsd-releases]). Die README sagt, das Projekt
sei in der Beta und APIs könnten sich ändern ([steiger-readme]). `steiger`
steht bei 0.10.0 vom 09.11.2026, das Plugin bei 0.8.2, zusammen rund 0,3 Mio.
Downloads pro Woche ([npm-registry]), rund 460 Sterne ([steiger-readme]).
Releases erscheinen laufend, zuletzt `steiger` 0.9.0 am 01.11.2026 und
0.10.0 am 09.11.2026 ([steiger-releases]).
Steiger prüft nur FSD. Aufwand: zwei Pakete und ein zusätzlicher Schritt in CI.

Das ältere `@feature-sliced/eslint-config` steht bei 0.1.1 vom 30.04.2024 und
nennt sich selbst "WIP" und Beta. Die README beschreibt nur `.eslintrc`, keine
Flat Config ([fsd-eslint-config], [npm-registry]).

### Weitere Werkzeuge

Sheriff prüft Modulgrenzen und Abhängigkeitsregeln in TypeScript-Projekten.
Module entstehen durch eine `sheriff.config.ts` oder durch eine Barrel-Datei
wie `index.ts` ([sheriff-intro]). Das ESLint-Plugin unterstützt Flat Config
über `sheriff.configs.all` und Legacy-Config, eine CLI gibt es auch
([sheriff-install]). Die Pakete heißen heute `@sheriff-arch/...`, die alten
unter `@softarc/...` sind in der Registry als umbenannt markiert. Version
0.21.1 vom 21.11.2026, Peer TypeScript unter 7, ESLint 8 bis 10. Unter dem
neuen Namen sind es rund 450 Downloads pro Woche ([npm-registry]). Die
Dokumentation zeigt Beispiele für Angular und Nx und erwähnt React nicht
([sheriff-install]).

`@nx/enforce-module-boundaries` prüft Abhängigkeiten zwischen Nx-Projekten
über Tags und `depConstraints`. Projekte ohne Tag dürfen von keinem anderen
Projekt abhängen ([nx-boundaries]). Die Regel setzt einen Nx-Workspace mit
Projekten voraus und prüft Grenzen zwischen Projekten, nicht zwischen Ordnern
in einer Anwendung.

### Übersicht

| Werkzeug | Art | Version, Datum | Downloads pro Woche | ESLint 9 Flat Config | Reifegrad | Aufwand |
| --- | --- | --- | --- | --- | --- | --- |
| `no-restricted-imports` | ESLint-Kernregel | mit ESLint 9.39 | entfällt | ja | stabil, im Einsatz | keiner, ein Block pro Grenze |
| `eslint-plugin-import` | ESLint-Plugin | 2.32.0, 20.06.2025 | ~84 Mio. | ja, `flatConfigs` | etabliert, letzte Version über 1 Jahr alt | Plugin, Resolver, Zonen |
| `eslint-plugin-import-x` | ESLint-Plugin | 4.18.1, 09.11.2026 | ~10 Mio. | ja, auch ESLint 10 | aktiv gepflegt | Plugin, Resolver, Zonen |
| `eslint-plugin-boundaries` | ESLint-Plugin | 7.4.4, 15.11.2026 | ~3,1 Mio. | ja, nur Flat Config dokumentiert | seit 2020, Regeln zuletzt umbenannt | Plugin, Resolver, Elemente, Policies |
| `dependency-cruiser` | CLI | 18.9.0, 22.11.2026 | ~9,9 Mio. | entfällt | seit 2016 | `--init`, eigener CI-Schritt |
| Steiger | CLI, nur FSD | 0.10.0, 09.11.2026 | ~0,3 Mio. | entfällt | laut README Beta | zwei Pakete, eigener CI-Schritt |
| `@feature-sliced/eslint-config` | ESLint-Config | 0.1.1, 30.04.2024 | ~19.000 | nicht dokumentiert | "WIP", Beta | Config plus zwei Plugins |
| Sheriff | ESLint-Plugin und CLI | 0.21.1, 21.11.2026 | ~450 (neuer Name) | ja | 0.x, gerade umbenannt | zwei Pakete, `sheriff.config.ts` |
| `@nx/enforce-module-boundaries` | ESLint-Regel | 24.0.6, 10.11.2026 | ~5,3 Mio. | ja | etabliert | Nx-Workspace nötig |

Quellen der Tabelle: [npm-registry], [npm-downloads], [eslint-nri],
[import-readme], [import-x-readme], [boundaries-quickstart], [depcruise-faq],
[steiger-readme], [fsd-eslint-config], [sheriff-install], [nx-boundaries].

## Fragen für die Entscheidung

Diese Punkte ergeben sich aus den Quellen und dem Code. Das HITL-Ticket muss
sie beantworten, egal welches Muster es wählt.

- Barrel-Dateien. FSD verlangt eine Public API per `index.ts` pro Slice,
  bulletproof-react und Vite raten davon ab, das Bewerbungsformular verbietet
  sie ([fsd-public-api], [bp-structure], [vite-performance],
  [frontend-readme]). Ein gemeinsamer Standard für beide Anwendungen muss
  sich hier festlegen.
- Kopierter Code. Die Untitled-UI-Kopien im Dashboard bleiben in der Struktur
  des Originals ([dashboard-readme]). Jedes Werkzeug muss sie als ein Element
  behandeln oder ausnehmen. ESLint-Plugins und Steiger können das über
  `files` und `ignores`, `dependency-cruiser` über Pfadmuster.
- ADR-0006. Die Trennung von Container und Screen und der eine geteilte Cache
  müssen in die Schichten des Musters passen. In FSD liegen Keys in
  `shared/api` oder `entities`, in bulletproof-react im Feature
  ([fsd-react-query], [bp-api-layer], [adr-0006]).
- Ein Muster für beide. Die Karte setzt ein Muster für beide Anwendungen als
  Rahmen. Das Bewerbungsformular hat ein Feature und rund 2.300 Zeilen, das
  Dashboard rund 13.500. FSD sagt, es passe für jede Größe, die React-FAQ rät,
  am Anfang nicht lange nachzudenken ([fsd-overview], [react-faq]).
- Editor oder Graph. ESLint-basierte Werkzeuge melden Verstöße im Editor und
  laufen mit dem vorhandenen Lint-Schritt. `dependency-cruiser` und Steiger
  brauchen einen eigenen Schritt, `dependency-cruiser` findet dafür auch
  Zyklen und verwaiste Module ([depcruise-readme]).
- TypeScript 7. `dependency-cruiser` braucht dann mindestens 7.1, Sheriff
  erlaubt als Peer nur Versionen unter 7 ([depcruise-faq], [npm-registry]).

## Quellen

- [ADR-0006, One cache is the dashboard's source of truth][adr-0006]
- [bulletproof-react, API Layer][bp-api-layer]
- [bulletproof-react, `apps/react-vite/package.json`][bp-react-vite]
- [bulletproof-react, Project Structure][bp-structure]
- [JS Boundaries, Quick start][boundaries-quickstart]
- [`eslint-plugin-boundaries`, README][boundaries-readme]
- [`eslint-plugin-boundaries`, Releases][boundaries-releases]
- [JS Boundaries, Rules][boundaries-rules]
- [JS Boundaries, TypeScript support][boundaries-ts]
- [`dashboard/README.md`][dashboard-readme]
- [`dependency-cruiser`, FAQ][depcruise-faq]
- [`dependency-cruiser`, Options reference][depcruise-options]
- [`dependency-cruiser`, README][depcruise-readme]
- [`dependency-cruiser`, Rules reference][depcruise-rules]
- [ESLint, `no-restricted-imports`][eslint-nri]
- [`frontend/README.md`][frontend-readme]
- [`@feature-sliced/eslint-config`, README][fsd-eslint-config]
- [Feature-Sliced Design, Layers][fsd-layers]
- [Feature-Sliced Design, Overview][fsd-overview]
- [Feature-Sliced Design, Public API][fsd-public-api]
- [Feature-Sliced Design, Usage with React Query][fsd-react-query]
- [Feature-Sliced Design, Releases (v2.1)][fsd-releases]
- [`eslint-plugin-import`, `no-restricted-paths`][import-nrp]
- [`eslint-plugin-import`, README][import-readme]
- [`eslint-plugin-import-x`, README][import-x-readme]
- [npm-Download-API, letzte Woche][npm-downloads]
- [npm-Registry, Paketmetadaten][npm-registry]
- [Nx, Enforce module boundaries][nx-boundaries]
- [React (Legacy-Doku), File Structure][react-faq]
- [Sheriff, Installation & Setup][sheriff-install]
- [Sheriff, Introduction][sheriff-intro]
- [Steiger, README][steiger-readme]
- [Steiger, Releases][steiger-releases]
- [Vite, Performance, Avoid barrel files][vite-performance]

[adr-0006]: ../adr/0006-one-cache-and-prop-driven-screens.md
[bp-api-layer]: https://github.com/alan2207/bulletproof-react/blob/master/docs/api-layer.md
[bp-react-vite]: https://github.com/alan2207/bulletproof-react/blob/master/apps/react-vite/package.json
[bp-structure]: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
[boundaries-quickstart]: https://www.jsboundaries.dev/docs/quick-start/
[boundaries-readme]: https://github.com/javierbrea/eslint-plugin-boundaries
[boundaries-releases]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
[boundaries-rules]: https://www.jsboundaries.dev/docs/rules/
[boundaries-ts]: https://www.jsboundaries.dev/docs/guides/typescript-support/
[dashboard-readme]: ../../dashboard/README.md
[depcruise-faq]: https://github.com/sverweij/dependency-cruiser/blob/main/doc/faq.md
[depcruise-options]: https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
[depcruise-readme]: https://github.com/sverweij/dependency-cruiser
[depcruise-rules]: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
[eslint-nri]: https://eslint.org/docs/latest/rules/no-restricted-imports
[frontend-readme]: ../../frontend/README.md
[fsd-eslint-config]: https://github.com/feature-sliced/eslint-config
[fsd-layers]: https://feature-sliced.design/docs/reference/layers
[fsd-overview]: https://feature-sliced.design/docs/get-started/overview
[fsd-public-api]: https://feature-sliced.design/docs/reference/public-api
[fsd-react-query]: https://feature-sliced.design/docs/guides/tech/with-react-query
[fsd-releases]: https://github.com/feature-sliced/documentation/releases/tag/v2.1
[import-nrp]: https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md
[import-readme]: https://github.com/import-js/eslint-plugin-import
[import-x-readme]: https://github.com/un-ts/eslint-plugin-import-x
[npm-downloads]: https://github.com/npm/registry/blob/main/docs/download-counts.md
[npm-registry]: https://registry.npmjs.org/
[nx-boundaries]: https://nx.dev/docs/features/enforce-module-boundaries
[react-faq]: https://legacy.reactjs.org/docs/faq-structure.html
[sheriff-install]: https://sheriff-arch.github.io/sheriff/docs/installation
[sheriff-intro]: https://sheriff-arch.github.io/sheriff/docs/introduction
[steiger-readme]: https://github.com/feature-sliced/steiger
[steiger-releases]: https://github.com/feature-sliced/steiger/releases
[vite-performance]: https://vite.dev/guide/performance#avoid-barrel-files
