# Mutationstests mit Vitest 4 in CI

Recherche zu #104, Stand 23.11.2026. Das Dokument sammelt Fakten und Optionen.
Schwellwerte und der Zuschnitt der CI-Jobs werden in einem späteren Ticket
entschieden.

## Kurzfassung

- StrykerJS unterstützt Vitest 4 seit Version 9.4.0. Für Vitest 4.1 braucht es
  mindestens 9.6.1, weil erst diese Version Coverage und Hit-Count unter 4.1
  repariert. Aktuell ist 10.1.1, die Node.js 22 oder neuer verlangt.
- Eine eigenständige, gepflegte Alternative für Vitest gibt es nicht. Die
  Optionen sind Varianten von Stryker selbst oder Wrapper um Stryker.
- Gemessen auf einem Entwicklerrechner mit 4 Stryker-Workern braucht
  `frontend/` für einen vollen Lauf 15 Minuten. `dashboard/` hat 4004 Mutanten.
  Aus einem abgebrochenen Teillauf ergeben sich hochgerechnet etwa 4 Stunden.
  Ein inkrementeller Lauf nach einer kleinen Änderung braucht im `frontend/`
  etwa 45 Sekunden.
- `thresholds.break` lässt Stryker mit Exit-Code 1 enden, wenn der
  Mutation-Score darunter liegt. Ohne Wert bricht der Build nie.
- Stryker hat keinen eingebauten Modus "nur der Diff des Pull Requests". Es
  gibt zwei Bausteine dafür, `--incremental` mit einer Baseline vom
  Hauptzweig und `--mutate datei:von-bis` mit Zeilenbereichen aus `git diff`.
- Berichte gibt es als HTML und JSON im Repo und optional im kostenlosen Stryker
  Dashboard, das für öffentliche Repos auf GitHub gedacht ist.

## Ausgangslage im Repo

Beide Anwendungen sind React 19 mit Vite 8 und TypeScript 6. Sie testen mit
`vitest` ^4.1.11 (installiert 4.1.11) und `jsdom` 29.1.1. Es gibt keine eigene
`vitest.config.ts`, die Testkonfiguration steht im Block `test` von
`vite.config.ts`. Er setzt `environment: 'jsdom'`, `globals: true`, eine
Setup-Datei `src/test/setup.ts`, `css: true` und
`include: ['src/**/*.test.{ts,tsx}']`. Beide CI-Workflows laufen auf
`ubuntu-latest` mit der Node-Version aus `.nvmrc`, das ist 24.

| Anwendung    | Quelldateien | Zeilen ohne Tests | Testdateien | Tests |
| ------------ | -----------: | ----------------: | ----------: | ----: |
| `frontend/`  |           37 |             2.376 |          18 |    76 |
| `dashboard/` |          108 |            14.125 |          21 |   181 |

Gezählt sind `.ts` und `.tsx` unter `src/` ohne `*.test.*` und
`*.stories.*`. Die Zahl der Tests stammt aus `vitest run`.

## Unterstützt Stryker Vitest 4?

Ja. Der Runner ist das Paket `@stryker-mutator/vitest-runner`. Er bringt kein
eigenes Vitest mit, sondern nutzt das installierte
([Doku zum Vitest-Runner][vr-docs]).

### Versionen

Die npm-Metadaten nennen für jede Version seit 9.0.1 die Peer-Abhängigkeit
`vitest >=2.0.0` ([npm-Registry][npm-vr]). Die Peer-Range sagt also nichts über
Vitest 4 aus. Das tut nur das Changelog des Pakets ([Changelog][vr-changelog]).

| Version | Datum      | Relevanz für Vitest 4                                                                |
| ------- | ---------- | ------------------------------------------------------------------------------------ |
| 9.4.0   | 23.11.2025 | "support vitest v4" ([#5360][pr-5360])                                               |
| 9.5.0   | 30.01.2026 | Vitest-Fixtures (`test.extend`), Doppel-Instanz bei Vitest-Plugins, `--testFiles`    |
| 9.6.1   | 10.04.2026 | Hit-Count und Coverage für Vitest 4.1 repariert ([#5928][pr-5928])                   |
| 10.0.0  | 14.08.2026 | Node.js 20 entfällt, Node.js 22 oder neuer nötig ([Release][rel-10])                 |
| 10.1.0  | 23.10.2026 | Vitest 5, Option `vitest.pool`, Testpositionen im Bericht, Fehler beim Sammeln sichtbar |
| 10.1.1  | 23.10.2026 | nur Versionssprung, aktuell `latest`                                                 |

Vitest 4.0.0 erschien am 22.10.2025, 4.1.0 am 12.03.2026. Der npm-Tag `latest`
von Vitest zeigt inzwischen auf 5.1.1, der Tag `V4` auf 4.1.12
([npm-Registry][npm-vitest]). Die Node-Anforderung von Stryker 10 ist mit Node
24 aus `.nvmrc` erfüllt ([npm-Registry][npm-core]).

### Bekannte Probleme

Offene Issues im Repo `stryker-mutator/stryker-js` mit Bezug zu Vitest 4 oder
zur aktuellen Version (Stand 23.11.2026):

- [#6073][i-6073]: Unter `coverageAnalysis: "perTest"` wechseln Ergebnisse
  zwischen identischen Läufen, etwa Killed und Survived. Gemeldet mit 9.6.1 und
  Vitest 4.1.9.
- [#6192][i-6192]: Mutanten gelten als Survived, obwohl die zugeordneten Tests
  mit dem Mutanten scheitern. Gemeldet mit 10.0.0 und Vitest 4.1.11.
- [#6335][i-6335]: Wegen `bail: 1` kann Vitest den Lauf abbrechen, bevor das
  Ergebnis des scheiternden Tests ankommt. Ein getöteter Mutant zählt dann als
  Survived. Der Fehler geht nur in diese eine Richtung, ein Build mit
  `thresholds.break` kann dadurch zufällig scheitern. Gemeldet mit 10.1.1 und
  Vitest 5.1.0.
- [#6004][i-6004]: Die Test-IDs in der inkrementellen Datei ändern sich bei
  jedem Lauf, auch ohne Codeänderung. Die Datei erzeugt deshalb große Diffs und
  eignet sich nicht zum Einchecken.
- [#5284][i-5284]: Mit `concurrency` größer 1 und jsdom meldet Stryker einen
  niedrigeren Score als erwartet. Label "Bug", offen seit Mai 2025.
- [#6311][i-6311]: Der erste Testlauf (Dry Run) läuft immer auf einem einzigen
  Vitest-Worker. Bei großen jsdom-Suiten dominiert er kurze Läufe auf wenigen
  Dateien. Feature-Request für eine Option `vitest.dryRunMaxWorkers`.
- [#6256][i-6256] und [#6213][i-6213]: Mutanten ohne erreichende Tests landen
  in einigen Fällen als Survived statt als NoCoverage.

Die Liste zeigt Meldungen, keine bestätigten Ursachen. Nicht jedes Issue ist
vom Team bestätigt oder für diese Projekte reproduziert.

### Einschränkungen des Runners

Laut [Doku][vr-docs] setzt Stryker diese Vitest-Optionen fest:
`coverage.enabled: false`, `includeTaskLocation: true`, `maxWorkers: 1`,
`watch: false` und `bail: 1`, solange `disableBail` nicht gesetzt ist. Die
Parallelität kommt aus eigenen Worker-Prozessen von Stryker
([Parallel Workers][par-docs]). `coverageAnalysis` ist immer `perTest`. Der
Browser Mode von Vitest wird nicht unterstützt. `vitest.related` steht auf
`true`, Vitest führt also nur Tests aus, die die mutierte Datei importieren.

Die Doku widerspricht sich an einer Stelle. Unter "Limitations" steht, nur
`threads: true` werde unterstützt. Weiter oben beschreibt dieselbe Seite die
Option `vitest.pool` mit `threads`, `forks`, `vmThreads` und `vmForks` seit
10.1.0.

## Alternativen

Eine Suche in der npm-Registry nach "mutation testing vitest" liefert außer den
Stryker-Paketen und ihren Bibliotheken (`mutation-testing-elements`,
`mutation-testing-metrics`) kein Werkzeug für Mutationstests
([npm-Suche][npm-search]). Die realistischen Optionen sind daher:

1. **Stryker mit Vitest-Runner.** Der Standardweg mit Coverage pro Test und
   voller Unterstützung im inkrementellen Modus.
2. **Stryker mit Command-Runner.** `testRunner: "command"` ruft für jeden
   Mutanten `npm test` auf ([Konfiguration][cfg-docs]). Ohne Coverage-Analyse
   laufen für jeden Mutanten alle Tests, und der inkrementelle Modus erkennt
   keine Teständerungen ([Incremental][incr-docs]). Nur als Notlösung, falls
   der Vitest-Runner bricht.
3. **Stryker mit Jest-Runner.** Die Stryker-Anleitung für React empfiehlt Jest
   ([React-Guide][react-guide]). Das hieße, beide Testsuiten von Vitest auf
   Jest umzustellen.
4. **Wrapper um Stryker für Pull Requests.** Tautest (npm `tautest` 2.1.5,
   [npm-Registry][npm-tautest]) ermittelt geänderte Zeilen eines PR und
   startet Stryker darauf. Der Autor hat es in [#6018][i-6018] vorgestellt,
   es ist kein Stryker-Projekt. `stryker-diff-runner` mutiert ganze geänderte
   Dateien, die letzte Änderung auf npm ist von November 2022
   ([npm-Registry][npm-sdr]).

Zusätzlich gibt es `@stryker-mutator/typescript-checker` (Peer
`typescript >=3.6`, [npm-Registry][npm-tsc]). Er verwirft Mutanten, die nicht
kompilieren, bevor Tests laufen. Das ist eine Ergänzung, keine Alternative.

## Laufzeit

Stryker veröffentlicht keine Benchmarks für den Vitest-Runner. Das Verzeichnis
`perf/` im Stryker-Repo enthält nur Testprojekte für Angular CLI, Express und
Lighthouse und ist als experimentell markiert ([perf/README][perf]). Deshalb
folgen eigene Messungen.

### Messung

Gemessen wurde an einer Kopie beider Anwendungen außerhalb des Repos, nach
`npm ci` und mit `@stryker-mutator/core` und `@stryker-mutator/vitest-runner`
10.1.1. Der Rechner hat 22 logische Kerne und lief unter WSL2 mit Node 25.9.0.
Stryker lief mit `concurrency: 4`, so viele CPUs hat ein GitHub-Runner. Die
beiden Läufe überlappten sich teilweise. Die Konfiguration war in beiden
Anwendungen gleich:

```json
{
  "testRunner": "vitest",
  "vitest": { "configFile": "vite.config.ts" },
  "mutate": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.stories.tsx",
    "!src/test/**",
    "!src/**/*.d.ts"
  ],
  "reporters": ["clear-text", "progress", "html", "json"],
  "concurrency": 4,
  "incremental": true
}
```

Ergebnisse für `frontend/`:

| Lauf                                       | Neu getestet | Dry Run |    Gesamt |
| ------------------------------------------ | -----------: | ------: | --------: |
| `vitest run` ohne Stryker                  |            - |       - |     7,9 s |
| voll, 34 Dateien, 735 Mutanten             |          735 |    19 s | 15:13 min |
| inkrementell, keine Änderung               |            0 |    31 s |      39 s |
| inkrementell, eine Zeile in `lib/http.ts`  |            4 |    27 s |      45 s |
| inkrementell, ein Testname geändert        |            9 |    30 s |      43 s |
| `--mutate "src/lib/http.ts:30-41"`         |            6 |    11 s |      35 s |

Der letzte Lauf hatte keine Baseline und mutierte nur die Zeilen 30 bis 41.

Der volle Lauf ergab einen Mutation-Score von 59,26 % (433 Killed, 2 Timeout,
218 Survived, 81 NoCoverage, 1 Fehler). Die Zahl dient nur der Einordnung, sie
ist kein Vorschlag für einen Schwellwert.

Ergebnisse für `dashboard/`:

- `vitest run` ohne Stryker: 42,6 s.
- 104 Dateien mit 4004 Mutanten.
- Der Dry Run auf einem Vitest-Worker dauerte 1:52 min (181 Tests).
- Der Lauf wurde nach etwa 18 Minuten abgebrochen. Bis dahin waren 836 von
  4004 Mutanten getestet (7 %). Rund 575 davon zählte Stryker gleich zu Beginn,
  weil kein Test sie erreicht. Danach schaffte der Lauf etwa 15 bis 17
  Mutanten pro Minute.
- Die eigene Schätzung von Stryker lag beim Abbruch bei rund 3 Stunden 40
  Minuten Restlaufzeit. Ein voller Lauf dauert auf dem Messrechner damit etwa
  4 Stunden. Das ist eine Hochrechnung aus einem Teillauf, keine Messung.

### Hochrechnung für CI

Die folgenden Werte sind Schätzungen, keine Messungen. Ein Standard-Runner
`ubuntu-latest` hat in öffentlichen Repos 4 CPUs und 16 GB RAM und ist dort
kostenlos ([GitHub-Runner][gh-runners]). Ein Job darf höchstens 6 Stunden
laufen ([GitHub-Limits][gh-limits]). Ein Kern des Runners ist vermutlich
langsamer als ein Kern des Messrechners. Jede Spanne beginnt deshalb beim Wert
vom Messrechner.

- `frontend/` voll: etwa 15 bis 30 Minuten.
- `dashboard/` voll: etwa 4 bis 8 Stunden. Das kann über dem Job-Limit von 6
  Stunden liegen. Ein voller Lauf müsste dann auf mehrere Jobs mit getrennten
  `--mutate`-Mustern verteilt werden, etwa je Feature-Verzeichnis.
- Bei inkrementellen Läufen und Zeilenbereichen kostet der Dry Run immer
  gleich viel. Er lag im `frontend/` bei 11 bis 31 Sekunden und im
  `dashboard/` bei knapp 2 Minuten. Dazu kommen die Mutanten der geänderten
  Zeilen, `npm ci` und das Laden der Baseline.

## Schwellwert mit `thresholds.break`

Konfiguration nur über die Konfigurationsdatei, nicht über die Kommandozeile
([Konfiguration][cfg-docs]):

```json
{ "thresholds": { "high": 80, "low": 60, "break": null } }
```

Das sind die Standardwerte. `high` und `low` steuern nur die Farben in den
Berichten. Liegt der Score unter `break`, beendet sich Stryker mit Exit-Code 1.
Mit `break: null` scheitert der Build nie. Die Werte gelten nur zusammen, es
ist nicht erlaubt, einen einzelnen Wert anzugeben. Im Code von Stryker ist der
Vergleich `mutationScore < breaking`, ein Score genau auf dem Schwellwert
besteht also ([Quellcode][src-break]).

Verglichen wird der Mutation-Score des ganzen Laufs. Er ist `detected / valid`,
also (Killed + Timeout) geteilt durch alle gültigen Mutanten. NoCoverage zählt
als nicht entdeckt, CompileError, RuntimeError und Ignored zählen nicht mit
([Metriken][metrics]). Die zweite Kennzahl "Score based on covered code" lässt
NoCoverage weg, `break` nutzt sie nicht.

Das hat zwei Folgen für Pull Requests:

- Bei `--mutate` mit Zeilenbereichen ohne Baseline besteht der Lauf nur aus den
  Mutanten im Bereich. Der Score bezieht sich auf diese wenigen Mutanten. In der
  Messung oben waren es 6 Mutanten mit 16,67 %.
- Mit `--incremental` bleibt der Bericht vollständig, auch wenn nur ein Teil
  neu getestet wird ([Incremental][incr-docs]). Der Score und damit `break`
  beziehen sich dann auf die ganze Anwendung.

Je Anwendung ist eine eigene Konfiguration nötig. Beide Anwendungen können
also verschiedene Schwellwerte bekommen. Issue [#6335][i-6335] (siehe oben)
kann den Score zufällig senken und so einen knapp gesetzten Schwellwert reißen.

## Inkrementeller Modus

`--incremental` oder `"incremental": true` speichert das Ergebnis in
`reports/stryker-incremental.json`, der Pfad ist über `--incrementalFile`
änderbar ([Konfiguration][cfg-docs]). Beim nächsten Lauf vergleicht Stryker
Quell- und Testdateien mit dem Stand in dieser Datei, ähnlich wie `git diff`
([Incremental][incr-docs]). Ein Ergebnis wird übernommen, wenn

- ein Killed-Mutant von einem Test getötet wurde, der noch existiert und sich
  nicht geändert hat, oder
- ein nicht getöteter Mutant von keinem neuen Test erreicht wird und sich keine
  Tests geändert haben.

Der Vitest-Runner meldet Tests mit Position, Stryker erkennt deshalb Änderungen
an einzelnen Tests ("Full" in der Tabelle der Doku). Der Dry Run läuft trotzdem
jedes Mal. Wird ein Lauf abgebrochen, speichert Stryker die Teilergebnisse, und
der nächste Lauf setzt dort an. `--force` testet alle Mutanten im Bereich neu.

Die Doku nennt diese Grenzen. Stryker sieht nur Änderungen an mutierten
Dateien und an Testdateien. Geänderte Abhängigkeiten, Umgebungsvariablen,
Snapshots oder andere Dateien, etwa `src/test/setup.ts` oder
`vite.config.ts`, bemerkt es nicht. Statische Mutanten haben keine Coverage pro
Test, Teständerungen lösen für sie keinen neuen Lauf aus. Stryker empfiehlt
deshalb ab und zu einen vollen Lauf, etwa mit `--force`
([Blog zum inkrementellen Modus][incr-blog]).

### Baseline in CI ablegen

Laut Stryker gehört die Datei nicht ins Repo, sie ist ein Build-Artefakt
([Blog][incr-blog]). Issue [#6004][i-6004] bestätigt das für Vitest, weil sich
die Test-IDs bei jedem Lauf ändern. Der Blog beschreibt diesen Ablauf:

1. Baseline laden, zuerst die des eigenen Branches, sonst die von `main`.
2. `stryker run --incremental` ausführen.
3. Baseline wieder ablegen.

Für Schritt 1 und 3 gibt es in GitHub Actions zwei Wege:

- **`actions/cache`.** Ein Cache gehört zu Schlüssel und Branch. Branches
  dürfen den Cache des Standard-Branches lesen. `restore-keys` findet per
  Präfix einen älteren Eintrag, wenn der genaue Schlüssel fehlt. Ein Cache wird
  nur gespeichert, wenn der Job erfolgreich endet. Läufe aus Forks dürfen unter
  Umständen nicht speichern. Einträge, die eine Woche nicht gelesen wurden,
  entfallen, das Limit liegt bei 10 GB je Repo ([actions/cache][gh-cache]).
  Weil ein Job mit gerissenem `break` nicht erfolgreich endet, speichert er
  auch keine neue Baseline.
- **Stryker Dashboard.** Die JSON-Datei des inkrementellen Modus hat dasselbe
  Format wie ein Dashboard-Bericht. Der Dashboard-Reporter lädt sie hoch, ein
  `curl` holt sie für den nächsten Lauf zurück ([Blog][incr-blog]).

## Nur den Diff eines Pull Requests mutieren

Einen eingebauten Modus, der aus einem Commit-Bereich die geänderten Zeilen
ableitet, hat Stryker nicht. Der Feature-Request [#2843][i-2843] wurde 2022
geschlossen. Die Maintainer verweisen dort auf Mutationsbereiche und das
programmatische API.

Bausteine:

- **Mutationsbereich in `--mutate`.** `datei:startZeile-endZeile`, optional mit
  Spalten, mutiert nur diesen Bereich. Bereich und Glob dürfen nicht im selben
  Eintrag stehen ([Konfiguration][cfg-docs]). Ein Skript kann die Bereiche aus
  `git diff --unified=0` gegen den Merge-Base erzeugen. Die Glob-Muster der
  Konfiguration (keine Tests, keine Stories) muss das Skript dann selbst
  anwenden, das merkt ein Kommentar in #2843 an.
- **`--incremental` mit Baseline von `main`.** Testet alles neu, was sich seit
  der Baseline geändert hat, und liefert den vollen Bericht.
- **Beides zusammen.** `--incremental --force --mutate datei:5-7` testet genau
  diese Zeilen neu und aktualisiert die Baseline. Mutanten außerhalb des
  Bereichs bleiben im Bericht ([Incremental][incr-docs]).
- **`--testFiles`.** Seit 9.5.0 begrenzt die Option, welche Testdateien laufen
  ([Konfiguration][cfg-docs]). Bei Vitest erledigt `vitest.related` das schon
  für die mutierten Dateien.

In allen Fällen bleibt der Dry Run der feste Anteil (siehe Messung).

## Berichte

Standard-Reporter sind `clear-text`, `progress` und `html`. Zur Auswahl stehen
außerdem `json`, `dots`, `dashboard` und `event-recorder`
([Konfiguration][cfg-docs]). Seit 10.1.0 enthält der Bericht die Dauer je
Mutant ([Changelog][vr-changelog]).

- **HTML.** Eine eigenständige Datei. In der Messung schrieb Stryker 10.1.1 sie
  nach `reports/mutation/mutation.html`, die Konfigurationsdoku nennt noch
  `reports/mutation.html`. Der Pfad ist über `htmlReporter.fileName` wählbar.
  Die Datei zeigt jeden Mutanten im Quelltext und lässt sich als Artefakt des
  Workflows hochladen.
- **JSON.** Folgt dem offenen Schema `mutation-testing-report-schema`, Pfad
  `reports/mutation/mutation.json`.
- **Clear-Text.** Tabelle je Datei im Log des Jobs, wie in der Messung.
- **Stryker Dashboard.** Gehostet unter dashboard.stryker-mutator.io, kostenlos
  und Open Source, laut Doku "free to use for open source"
  ([Dashboard-Doku][dash]). Anmeldung mit GitHub, Freischalten des Repos, dann
  `STRYKER_DASHBOARD_API_KEY` als Secret setzen. `dashboard.project` und
  `dashboard.version` liest Stryker in GitHub Actions selbst aus der Umgebung.
  `dashboard.module` trennt mehrere Berichte pro Version, hier also `frontend`
  und `dashboard`. `reportType` ist `full` oder nur der Score, der Score allein
  reicht für ein Badge im README. Als Projektanbieter unterstützt das Dashboard
  derzeit nur `github.com`. Dieses Repo ist öffentlich.

## Optionen für die Entscheidung

Diese Punkte sind offen und gehören in das spätere HITL-Ticket:

- Wo Stryker läuft: auf jedem Pull Request, nur nach dem Merge auf `main`,
  nachts, oder kombiniert.
- Welcher PR-Modus: inkrementell mit Baseline von `main` (Score über die ganze
  Anwendung) oder Zeilenbereiche aus dem Diff (Score nur über den Diff).
- Wo die Baseline liegt: `actions/cache`, Workflow-Artefakt oder Stryker
  Dashboard.
- Wie der volle Lauf des Dashboards in das Job-Limit von 6 Stunden passt:
  Aufteilen per `--mutate`, weniger Mutanten durch engere `mutate`-Muster, oder
  nur inkrementell nach einem einmaligen vollen Lauf.
- Ob `thresholds.break` gesetzt wird, mit welchem Wert je Anwendung, und wie
  mit zufälligen Ausreißern aus #6335 und #6073 umgegangen wird.
- Ob der TypeScript-Checker mitläuft.
- Ob Berichte nur als Artefakt oder auch im Stryker Dashboard landen.

## Quellen

- [Stryker, Vitest Runner][vr-docs]
- [Stryker, Incremental][incr-docs]
- [Stryker, Konfiguration][cfg-docs]
- [Stryker, Parallel Workers][par-docs]
- [Stryker, React-Guide][react-guide]
- [Stryker, Dashboard][dash]
- [Stryker, Mutant states and metrics][metrics]
- [Stryker-Blog, Announcing incremental mode][incr-blog]
- [Changelog `@stryker-mutator/vitest-runner`][vr-changelog]
- [Release v10.0.0][rel-10]
- [Quellcode `determineExitCode`][src-break]
- [Stryker `perf/README.md`][perf]
- [npm-Registry `@stryker-mutator/vitest-runner`][npm-vr]
- [npm-Registry `@stryker-mutator/core`][npm-core]
- [npm-Registry `@stryker-mutator/typescript-checker`][npm-tsc]
- [npm-Registry `vitest`][npm-vitest]
- [npm-Registry `stryker-diff-runner`][npm-sdr]
- [npm-Registry `tautest`][npm-tautest]
- [npm-Suche "mutation testing vitest"][npm-search]
- [GitHub Docs, GitHub-hosted runners][gh-runners]
- [GitHub Docs, Actions limits][gh-limits]
- [`actions/cache` README][gh-cache]
- Stryker-Issues und PRs: [#2843][i-2843], [#5284][i-5284], [#5360][pr-5360],
  [#5928][pr-5928], [#6004][i-6004], [#6018][i-6018], [#6073][i-6073],
  [#6192][i-6192], [#6213][i-6213], [#6256][i-6256], [#6311][i-6311],
  [#6335][i-6335]

[vr-docs]: https://stryker-mutator.io/docs/stryker-js/vitest-runner/
[incr-docs]: https://stryker-mutator.io/docs/stryker-js/incremental/
[cfg-docs]: https://stryker-mutator.io/docs/stryker-js/configuration/
[par-docs]: https://stryker-mutator.io/docs/stryker-js/parallel-workers/
[react-guide]: https://stryker-mutator.io/docs/stryker-js/guides/react/
[dash]: https://stryker-mutator.io/docs/General/dashboard/
[metrics]: https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/
[incr-blog]: https://stryker-mutator.io/blog/announcing-incremental-mode/
[vr-changelog]: https://github.com/stryker-mutator/stryker-js/blob/master/packages/vitest-runner/CHANGELOG.md
[rel-10]: https://github.com/stryker-mutator/stryker-js/releases/tag/v10.0.0
[src-break]: https://github.com/stryker-mutator/stryker-js/blob/master/packages/core/src/reporters/mutation-test-report-helper.ts
[perf]: https://github.com/stryker-mutator/stryker-js/blob/master/perf/README.md
[npm-vr]: https://registry.npmjs.org/@stryker-mutator/vitest-runner
[npm-core]: https://registry.npmjs.org/@stryker-mutator/core/latest
[npm-tsc]: https://registry.npmjs.org/@stryker-mutator/typescript-checker/latest
[npm-vitest]: https://registry.npmjs.org/vitest
[npm-sdr]: https://registry.npmjs.org/stryker-diff-runner
[npm-tautest]: https://registry.npmjs.org/tautest
[npm-search]: https://registry.npmjs.org/-/v1/search?text=mutation%20testing%20vitest
[gh-runners]: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
[gh-limits]: https://docs.github.com/en/actions/reference/limits
[gh-cache]: https://github.com/actions/cache/blob/main/README.md
[i-2843]: https://github.com/stryker-mutator/stryker-js/issues/2843
[i-5284]: https://github.com/stryker-mutator/stryker-js/issues/5284
[pr-5360]: https://github.com/stryker-mutator/stryker-js/issues/5360
[pr-5928]: https://github.com/stryker-mutator/stryker-js/issues/5928
[i-6004]: https://github.com/stryker-mutator/stryker-js/issues/6004
[i-6018]: https://github.com/stryker-mutator/stryker-js/issues/6018
[i-6073]: https://github.com/stryker-mutator/stryker-js/issues/6073
[i-6192]: https://github.com/stryker-mutator/stryker-js/issues/6192
[i-6213]: https://github.com/stryker-mutator/stryker-js/issues/6213
[i-6256]: https://github.com/stryker-mutator/stryker-js/issues/6256
[i-6311]: https://github.com/stryker-mutator/stryker-js/issues/6311
[i-6335]: https://github.com/stryker-mutator/stryker-js/issues/6335
