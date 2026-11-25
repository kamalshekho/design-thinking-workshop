# Refactoring

Dieses Dokument hält fest, welche Refactorings im Projekt umgesetzt sind und
welche noch anstehen. Grundlage ist Issue #76. Jede Angabe aus #76 ist hier am
Code nachgeprüft, Stand `origin/main` bei Commit `318b88e` am 10.11.2026. Wo
#76 falsch lag, steht die Korrektur dabei. Die Refactorings im Frontend ab
`14ec1f0` und der Status der Kandidaten sind am 25.11.2026 auf `43c2a87`
nachgeprüft. Für das Fachgespräch stellt
[`REFACTORING-FRONTEND.md`](./REFACTORING-FRONTEND.md) drei davon ausführlich
vor.

Gemessen ist von Hand: Zeilen mit `wc -l`, Literale und Aufrufe mit `grep`,
zyklomatische Komplexität durch Abzählen der Verzweigungen (`if`, `?:`, `&&`,
`||`, Schleifen, jeweils +1 auf den Grundwert 1, wie PMD zählt). Werte, die
nicht gezählt, sondern geschätzt sind, sind als Schätzung markiert.

## Umgesetzte Änderungen

| Commit | Typ laut Commit | Änderung | Technik (Fowler) | Muster | Metrik vorher | Metrik nachher |
|---|---|---|---|---|---|---|
| `2c77089` | `refactor(dashboard)` | Listen-Setter der Screens durch Intent-Callbacks ersetzt | Change Function Declaration, Move Function | Callbacks über Props (Dependency Injection) | 6 Stellen, an denen ein Screen eine Ersatzliste baut | 0 |
| `a42d118` | `refactor(dashboard)` | Domänennamen und Enums des Dashboards an die API angeglichen | Rename Field | kein Entwurfsmuster | 109 Vorkommen von 5 alten Feldnamen in `dashboard/src` | 0 |
| `a1a7d71` | `feat(email)` | Versand der Bestätigungsmail mit `EmailSender`, `NoopEmailSender`, `ResendEmailSender` | keine (Neuentwicklung) | Strategy, Null Object | entfällt | 1 Klasse kennt Resend |
| `32a577e` | `feat(backend)` | Jeder Fehler als `application/problem+json` mit `code` | Replace Error Code with Exception, Replace Constructor with Factory Function, Extract Function | statische Fabrikmethoden | 10 Fehlerantworten ohne Body in 3 Controllern | 0 |
| `14ec1f0` | `refactor(dashboard)` | 13 geteilte Module aus `features/applications` in geteilte Schichten | Move Function | Schichtenarchitektur (bulletproof-react) | 17 Importe von Feature zu Feature | 0 |
| `0764e9f`, `ea757c9` | `refactor(frontend)`, `refactor(dashboard)` | Server-Antworten mit Zod und Werte mit Type Guards geprüft statt mit `as` umgewandelt | Substitute Algorithm | Schema-Validierung an der Systemgrenze | 24 Typumwandlungen (7 Formular, 17 Dashboard) | 0 |
| `9c53480`, `c4d9484`, `07b46ec` | `refactor(dashboard)` | Gemeinsame Buttons, Dialoge und Escape-Hook statt Kopien | Extract Function | Komposition über Props, Custom Hook | 10 Klone laut `jscpd` auf `c3efba4` | 0 |

Von den ersten vier Commits sind nur zwei Refactorings im engen Sinn.
`a1a7d71` und `32a577e` tragen den Typ `feat` und ändern sichtbares Verhalten: das eine
verschickt neu eine Mail, das andere liefert neu einen Fehler-Body, wo vorher
keiner war.

### `2c77089`: Intent-Callbacks statt Listen-Setter

Die Screens Anfragen, Übersicht und Kategorien gaben bei jeder Änderung eine
komplette neue Liste nach oben (`onApplicationsChange`, `onCategoriesChange`).
Aus einer neuen Liste lässt sich kein `PATCH` für ein einzelnes Feld ableiten.
Nach dem Commit meldet jeder Screen, was passiert ist: `onEdit(id, change)` für
Anfragen, und für Kategorien `onCreate`, `onEdit`, `onSetActive`, `onDelete`
und `onReorder(orderedIds)`, je ein Callback pro Endpunkt in `API.md`. Den
Listenaufbau übernimmt `useDashboardData` (81 geänderte Zeilen im Diff). Der
Commit bereitet so die Datenzugriffsgrenze aus
[ADR-0006](./adr/0006-one-cache-and-prop-driven-screens.md) vor.

Gemessen am Diff:

- Stellen, an denen ein Screen eine Ersatzliste baut und hochreicht: 6 (5 in
  `CategoriesScreen.tsx`, 1 in `useApplicationActions.ts`) vorher, 0 nachher.
- Erwähnungen von `onApplicationsChange` oder `onCategoriesChange` in
  `dashboard/src`: 26 vorher, 0 nachher.
- Umfang: 15 Dateien, 235 Zeilen hinzu, 92 entfernt.

Korrekturen zu #76: "Introduce Parameter Object" trifft nicht zu.
`ApplicationEdit` und `CategoryDraft` gab es vorher schon, in
`useApplicationActions.ts` und `CategoryDialog.tsx`. Der Commit verschiebt sie
nur nach `src/domain/`. "Replace Parameter with Explicit Methods" passt
höchstens sinngemäß, denn es gab keinen Parameter, nach dessen Wert verzweigt
wurde. Genauer sind Change Function Declaration (neue Props-Signaturen) und
Move Function (der Listenaufbau wandert aus den Screens nach
`useDashboardData`). Das Muster "Command" trifft ebenfalls nur im losen Sinn
zu: Die Intents sind Funktionsaufrufe, keine Objekte, die man speichern,
einreihen oder rückgängig machen könnte.

Vorher und nachher, `CategoriesScreen.tsx` beim Speichern des Dialogs (vorher
um einen Kommentar gekürzt):

```tsx
// vorher (2c77089^)
if (editing === 'new') {
  onCategoriesChange([
    ...categories,
    { id: crypto.randomUUID(), ...draft },
  ]);
} else {
  const id = editing.id;
  onCategoriesChange(
    categories.map((category) =>
      category.id === id ? { ...category, ...draft } : category,
    ),
  );
}
```

```tsx
// nachher (2c77089)
if (editing === 'new') {
  onCreate(draft);
} else {
  onEdit(editing.id, draft);
}
```

Der Screen muss nicht mehr wissen, wie die Liste aufgebaut ist und wer die id
vergibt. Beides liegt jetzt an einer Stelle, die später durch Requests ersetzt
wird.

### `a42d118`: Namen und Enums an die API angeglichen

Die Domänentypen des Dashboards wichen von den Namen auf der Leitung ab. Der
Commit benennt sie gegen die Mock-Daten um, damit der spätere Wechsel auf echte
Requests nur die Datenquelle ändert. Die Tabelle "Wire names" in
`dashboard/API.md` hatte vor dem Commit 7 Zeilen, 6 davon betreffen das
Dashboard: `applicantName`, `message`, `receivedAt`, `weeklyAvailability`,
`consent.givenAt`, `consent.privacyPolicyVersion`. Dazu kommen die sechs
Statuswerte, die von `'in-review'` zu `'IN_REVIEW'` usw. wechseln.

Gemessen am Diff:

- Vorkommen der fünf eindeutig suchbaren alten Namen (`applicantName`,
  `receivedAt`, `weeklyAvailability`, `givenAt`, `privacyPolicyVersion`) in
  `dashboard/src`: 109 vorher (39, 34, 20, 7, 9), 0 nachher. `message` ist
  als Wort zu häufig, um es per `grep` sauber zu zählen.
- Der Typ `Application` in `dashboard/src/domain/application.ts` hat nach dem
  Commit 13 Felder, alle gleichnamig mit den 13 Feldern des heutigen
  `ApplicationDto` im Backend.
- Umfang: 20 Dateien, 268 Zeilen hinzu, 267 entfernt.

Korrekturen zu #76: Die Zahl "8 Abweichungen" stammt aus dem Commit-Text und
aus `API.md`. Aus der Tabelle lassen sich nur 6 Feldnamen nachzählen, die "8"
ist nicht reproduzierbar. "Replace Magic Number with Enum" ist kein Eintrag in
Fowlers Katalog. Es gab auch keine magische Zahl: `weeklyAvailability` war eine
Stundenzahl, `weeklyTime` ist ein Band aus vier Werten. Das ist eine Änderung
des Modells, denn `IRREGULAR` war vorher nicht darstellbar, und die Spalte
Verfügbarkeit sortiert seitdem nach dem Index im Band. Dasselbe gilt für die
beiden korrigierten Mock-Werte (`Etwas anderes`, Einwilligung `2026-09`). Das
Muster "DTO" trifft nicht zu: Es entsteht kein Transferobjekt, die Domänentypen
übernehmen nur die Namen der Leitung.

### `a1a7d71`: `EmailSender` mit zwei Implementierungen

`ApplicationService.submit` ruft nach dem Speichern `ConfirmationMailer` auf,
der über das Interface `EmailSender` versendet. Spring wählt beim Start genau
eine Implementierung: `ResendEmailSender`, wenn `resend.api-key` gesetzt ist,
sonst `NoopEmailSender`, der nur loggt. Beide Bedingungen stehen in
`HasResendApiKey` und sind Negationen voneinander.

Gemessen am Code: Nur `ResendEmailSender` (50 Zeilen) kennt
`https://api.resend.com`. Außerhalb des Pakets `email` nennt keine Klasse
`EmailSender`. Eine Vorher-Metrik gibt es nicht, weil der Commit neuen Code
anlegt.

Korrekturen zu #76: Der Commit ist ein `feat`, kein Refactoring. "Extract
Interface" und "Replace Conditional with Polymorphism" setzen bestehenden Code
voraus, den es nicht gab. Das Muster Strategy stimmt. `NoopEmailSender` ist
zusätzlich ein Null Object (bei Fowler: Introduce Special Case).

### `32a577e`: Fehlercode in jeder Fehlerantwort

Vorher antworteten die Controller bei Fehlern mit leerem Body und nacktem
Status, z. B. `ResponseEntity.notFound().build()`. Nachher werfen sie
`ApiException` oder `FieldValidationException`, und `ApiExceptionHandler`
erzeugt daraus über `ApiProblem.of` einen `application/problem+json`-Body mit
`code`. `ApiException` bietet dafür statische Fabrikmethoden wie
`ApiException.notFound()` und `ApiException.categoryInUse()`. Für Anfragen, die
schon an Spring Security scheitern, schreibt `ProblemAuthenticationEntryPoint`
denselben Body. Der Commit bringt 277 Zeilen Vertragstests mit
(`DashboardErrorContractTests`).

Gemessen am Diff: Fehlerantworten ohne Body
(`badRequest()`, `notFound()`, `status(HttpStatus.…)` jeweils mit `.build()`)
in `DashboardApplicationController`, `DashboardCategoryController` und
`StaffAuthController`: 10 vorher (3, 6, 1), 0 nachher, auf `origin/main`
weiterhin 0.

Korrekturen zu #76:

- Der Commit ist ein `feat`. Er ändert, was ein Client sieht.
- `ApiExceptionHandler` ist nicht neu. Er bestand vorher schon als
  `@RestControllerAdvice` und wird im Commit erweitert. Neu sind
  `ApiException`, `ApiProblem` und `ProblemAuthenticationEntryPoint`.
- Das Format folgt RFC 9457, nicht RFC 7807. RFC 9457 hat RFC 7807 im Juli 2023
  abgelöst. Der Code selbst nennt keine RFC-Nummer, `dashboard/API.md` und
  `frontend/API.md` verweisen beide auf RFC 9457.
- "Factory Method" im Sinne der GoF trifft nicht zu. Dort entscheidet eine
  Unterklasse, welches Objekt entsteht. Hier sind es statische Fabrikmethoden
  (Fowler: Replace Constructor with Factory Function). "Extract Class" passt nur
  teilweise: `ApiProblem` übernimmt den Aufbau, der vorher in
  `validationFailed` stand (Extract Function, dann Move Function). Der
  Übergang von Rückgabewerten zu Exceptions ist Fowlers Replace Error Code with
  Exception aus der ersten Auflage.

### `14ec1f0`: Geteilte Module in geteilte Schichten

Übersicht, Aussortiert und Kategorien importierten Liste, Drawer, Suche und
Filter direkt aus `features/applications`. Der Commit verschiebt 13 Module
nach `components/shared`, `utils`, `hooks` und `queries`, nur die Importpfade
ändern sich. `9231b34` und `fcea877` schreiben die Importrichtung danach mit
`eslint-plugin-boundaries` fest
([ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md)).

Gemessen mit `git grep` nach `from '@/features/applications` in den anderen
drei Features: 17 Importe auf `14ec1f0^` (14 aus `overview`, 2 aus
`discarded`, 1 aus `categories`), 0 auf `43c2a87`.

### `0764e9f` und `ea757c9`: Zod statt `as`

Das Formular las Server-Antworten mit `typeof`-Kaskaden und `as
Record<string, unknown>`, das Dashboard wandelte Werte aus `<select>` und URL
mit `as ApplicationStatus` um. Nachher prüft ein Zod-Schema jede Antwort, und
ein Type Guard aus `domain` prüft jeden Wert. `c281ef6` verbietet `as` danach
mit `consistent-type-assertions` und `assertionStyle: 'never'`.

Gemessen am Diff, Zeilen mit einer Typumwandlung ohne `as const` und ohne
Import-Alias: 7 entfernt in `0764e9f`, 17 in `ea757c9`, keine hinzu.

### `9c53480`, `c4d9484` und `07b46ec`: Gemeinsame Teile statt Kopien

`c3efba4` bringt `jscpd` mit Schwelle 0 ins Dashboard. Auf diesem Stand meldet
es 10 Klone ab 50 Tokens. Sechs davon beseitigen die drei Commits:

| Commit | Klone | Neues Teil | Zeilen entfernt |
|---|---|---|---|
| `9c53480` | 4, zwischen `ApplicationsScreen` und `OpenApplicationsPanel` | `DiscardSelectedButton`, `ApplicationActionOverlays` | 105 |
| `c4d9484` | 1, zwischen `CategoriesTable` und `CategoryCards` | `CategoryEditDelete`, `CategoryIconButton` | 113 |
| `07b46ec` | 1, zwischen `ApplicationDrawer` und `ApplicationPage` | `useCloseOnEscape` mit Test | 29 |

Die übrigen vier Klone in den Kopien aus Untitled UI und in `OverviewScreen`
beseitigen `00bfb60`, `39af75c`, `062c5c3` und `b5cc2fb`. Nachgezählt mit
`jscpd` auf jedem Commit ab `c3efba4`: 10, 9, 8, 7, 6, 2, 1, 0. Auf `43c2a87`
meldet `jscpd` im Dashboard 0 Klone.

## Kandidaten

Alle Stellen existieren auf `origin/main`. Die Metrik "vorher" ist gemessen,
der Zielwert ist eine Schätzung aus #76.

| # | Stelle | Problem | Vorschlag | Muster | Gemessen (vorher) | Ziel (Schätzung) | Status |
|---|---|---|---|---|---|---|---|
| C1 | `DashboardApplicationController.update()` | lange Methode, Controller greift direkt auf drei Repositories zu | `ApplicationStaffService` extrahieren | Service Layer | Komplexität 13, Methode 50 Zeilen, Klasse 182 Zeilen | Komplexität höchstens 4, Klasse ca. 100 Zeilen | umgesetzt (`506b239`), Controller 68 Zeilen, `update()` im Service Komplexität 4 |
| C2 | `DashboardCategoryController` | Antwort zweimal gleich aufgebaut, N+1 in `reorder()` | `CategoryDto.of`, `findMaxDisplayOrder`, `saveAll` | Repository, Mapper | 17 SQL-Anweisungen in `reorder()` bei 5 Kategorien, 2 Kopien des Antwortaufbaus, 162 Zeilen | 2 SQL-Anweisungen | umgesetzt (#89), nachher 2 Anweisungen |
| C3 | `application-table.tsx` | große Komponente, viele Hooks | `useTableSort`, `usePagination`, `useRowSelection`, `ApplicationRow` | Strategy, Container/Presenter | 557 Zeilen, 11 Hook-Aufrufe, `ApplicationTable` allein 374 Zeilen | unter 200 Zeilen | offen, auf `43c2a87` auf 629 Zeilen gewachsen, `ApplicationTable` 434 Zeilen |
| C4 | `ApplicationDrawer.tsx` | große Komponente, drei Effekte | `useDrawerA11y`, `useCopyToClipboard` | Custom Hook | 416 Zeilen, 3 `useEffect`, `ApplicationDrawer` allein 269 Zeilen | ca. 180 Zeilen | teilweise umgesetzt (`07b46ec` `useCloseOnEscape`, `61ce369` `useCopyFeedback`), 302 Zeilen, 1 `useEffect` |
| C5 | `frontend/src/features/application-form/api.ts` und `dashboard/src/api/transport.ts` | Decoder für Feldfehler aus `problem+json` und die Liste der `WeeklyTime`-Werte doppelt | gemeinsames Modul oder Contract-Test | Adapter | 2 Kopien des Decoders, 2 Kopien der `WeeklyTime`-Liste in TypeScript | 1 Kopie | offen |
| C6 | `DemoSeeder.java` | Daten und Logik in einer Datei | Daten nach `DemoSeeds` oder YAML auslagern | Builder | 395 Zeilen, davon 153 Zeilen Daten (13 Einträge) | ca. 130 Zeilen pro Datei | offen |
| C7 | Backend, Fehlercodes | Fehlercodes als String-Literale | `enum ErrorCode` | typsicheres Enum | 41 Literale für 31 verschiedene Codes, davon 5 in Controllern | 0 Literale außerhalb des Enums | offen |

### C1: `DashboardApplicationController.update()`

Die Methode steht in Zeile 74 bis 123 der Datei. Gezählt sind 7 `if`, 4
Ternäroperatoren und 1 `&&`. Das ergibt mit dem Grundwert 1 eine Komplexität
von 13, nicht ca. 14 wie in #76. Die Methode prüft unveränderliche Felder,
setzt Status, Owner, Notizen und Verworfen-Flag, schreibt für jede Änderung
einen `StateChange` und sendet das Ergebnis an den Event-Stream. Eine
Service-Schicht für das Dashboard gibt es nicht. `ApplicationService` existiert,
bedient aber nur das Formular.

### C2: `DashboardCategoryController`

`reorder()` ruft auf: einmal `count()`, für jede der n Kategorien
`findById()` und `save()`, am Ende einmal `findByOrderByDisplayOrderAsc()`. Das
sind 2n + 2 Repository-Aufrufe, aus dem Code gezählt. #76 und #84 sprechen von
2n. Hibernate macht daraus 3n + 2 SQL-Anweisungen, weil `save()` jede
Kategorie vor dem Update noch einmal liest.
Der Antwortaufbau (`new DashboardCategoriesResponse()`, Liste über `toDto`)
steht zweimal, in `list()` und `reorder()`. Außerdem lädt `create()` mit
`findAll()` alle Kategorien, nur um die höchste `displayOrder` zu finden.

Umgesetzt in #89: `reorder()` lädt alle Kategorien mit einem `findAll()` und
schreibt sie mit `saveAll()` zurück. Mit `hibernate.jdbc.batch_size` gehen die
Updates als ein JDBC-Batch an die Datenbank. Die Methode läuft jetzt in einer
Transaktion, ein Abbruch hinterlässt keine halbe Sortierung. Der Test
`CategoryReorderQueryCountTests` zählt die Anweisungen mit der
Hibernate-Statistik und schlägt fehl, wenn es mehr als 2 werden.

| Messung | vorher | nachher |
|---|---|---|
| SQL-Anweisungen in `reorder()` bei 5 Kategorien (Hibernate-Statistik) | 17 | 2 |
| Repository-Aufrufe in `reorder()` | 2n + 2 | 2 |
| Kopien des Antwortaufbaus | 2 | 1 |
| Zeilen `DashboardCategoryController.java` | 162 | 148 |

### C3: `application-table.tsx`

#76 nennt nur den Dateinamen. Die Datei liegt unter
`dashboard/src/components/application/application-table/application-table.tsx`
und hat 557 Zeilen, wie in #76 angegeben. Gezählt sind 11 Hook-Aufrufe (7
`useMemo`, 4 `useState`), nicht ca. 10. Sortierung, Seitenwechsel und
seitenübergreifende Auswahl liegen alle in der Funktion `ApplicationTable`
(Zeile 148 bis 521).

### C4: `ApplicationDrawer.tsx`

Pfad: `dashboard/src/components/shared/ApplicationDrawer.tsx`, 416 Zeilen.
Von den 3 `useEffect` gehören 2 zur Barrierefreiheit (Schließen mit Escape,
Fokus ins Panel) und 1 zum Kopieren der E-Mail-Adresse (Rückmeldung nach 1800
ms zurücksetzen). Die beiden vorgeschlagenen Hooks passen also zu den
vorhandenen Effekten.

### C5: Doppelter Decoder und doppelte `WeeklyTime`-Werte

`readFieldErrors` in `frontend/src/features/application-form/api.ts` und
`fieldProblemsIn` in `dashboard/src/api/transport.ts` tun dasselbe: das
`errors`-Array eines `problem+json`-Bodys in Paare aus `field` und `code`
übersetzen. Die vier `WeeklyTime`-Werte stehen in
`frontend/src/lib/routes.ts` und in
`dashboard/src/domain/application.ts`, ein drittes Mal als Java-Enum
`WeeklyTime` im Backend. Die deutschen Bezeichnungen stehen ebenfalls zweimal,
in `frontend/src/content/de.ts` und `dashboard/src/content/de.ts`.

Ein gemeinsames Modul ist teurer, als #76 annimmt: `frontend/` und
`dashboard/` sind zwei getrennte npm-Projekte, im Repository gibt es keine
`package.json` auf oberster Ebene und keine Workspaces. Ein Contract-Test, der
beide Listen gegen das Backend prüft, kommt ohne Umbau aus.

### C6: `DemoSeeder.java`

Die Datei hat 395 Zeilen. Die Liste `SEEDS` mit 13 Einträgen belegt Zeile 90
bis 242, also 153 Zeilen. Den Rest teilen sich Kopfkommentar, Logik
(`run`, `seed`, `backdate`, Hilfsfunktionen) und die Records `Seed` und `Step`.
Das Muster "Builder" ist fraglich: `Seed` ist ein Record, die Hilfsfunktionen
`status`, `owner` und `discarded` sind statische Fabrikmethoden.

### C7: Fehlercodes als Literale

Gezählt mit `grep` nach Zeichenketten in Großbuchstaben mit Unterstrich, dazu
`"UNAUTHENTICATED"`, ohne `ROLE_STAFF` und `SUPPORTING_MEMBER`: 41 Literale
für 31 verschiedene Codes in `backend/src/main/java`. Davon stehen 5 in
Controllern (3 in `DashboardApplicationController`, 2 in
`DashboardCategoryController`), 20 als `message` in Validierungsannotationen
der Request-Klassen, der Rest in `ApiException`, `ApiProblem`,
`ApiExceptionHandler`, `ApplicationService` und
`ProblemAuthenticationEntryPoint`. #76 schätzte ca. 8.

Die 20 Annotationen setzen eine Grenze: Ein Annotationsattribut braucht eine
Konstante zur Compile-Zeit, ein Enum-Wert lässt sich dort nicht als String
einsetzen. Für diese Stellen braucht ein `enum ErrorCode` zusätzlich
`String`-Konstanten, oder die Literale bleiben dort stehen.

## Bewertung der Methode

Alle Zahlen in diesem Dokument sind von Hand gezählt, mit `wc -l`, `grep` und
Abzählen von Verzweigungen. Das ist nachvollziehbar, aber nicht wiederholbar:
Ein anderes Suchmuster ergibt eine andere Zahl. Bei C1, C3 und C7 weichen die
Werte aus #76 von den hier gezählten ab, ohne dass #76 das Zählverfahren
nennt. Keine Zahl wird bei einem neuen Commit automatisch neu
erhoben, die Messwerte veralten also mit jedem Merge.

Die Commit-Historie gab am 10.11.2026 wenig her. Von 64 Commits auf
`origin/main` (ohne Merges) trugen 2 den Typ `refactor`. Am 25.11.2026 sind es
44 von 342, die meisten aus der Aufräumrunde vom 24.11.2026. Zwei der vier hier aufgeführten
Refactorings sind `feat`-Commits, die nebenbei Struktur verbessert und zugleich
Verhalten geändert haben. Ein reines Refactoring, das Verhalten nachweislich
gleich lässt und sich getrennt prüfen lässt, ist bisher die Ausnahme.

Die Zuordnung zu Fowler-Techniken und Entwurfsmustern in #76 war in mehreren
Fällen nachträglich und zu großzügig. Muster wie Command, DTO oder Factory
Method wurden vergeben, wo der Code sie nicht umsetzt. Das schwächt die
Aussage, dass die Änderungen methodisch geplant waren.

Automatisieren ließe sich die Messung so:

- Im Dashboard und im Formular die ESLint-Regeln `complexity` und `max-lines`
  in `eslint.config.js` aufnehmen. Beide Projekte haben `npm run lint`, aber
  keine der beiden Regeln ist gesetzt.
- `jscpd` läuft seit `7c321f5` und `c3efba4` in beiden Anwendungen mit
  Schwelle 0, in `npm run check` und in CI. Es prüft jede Anwendung für sich.
  Kopien über die Projektgrenze wie in C5 findet es so nicht, dafür müsste ein
  Lauf beide `src`-Ordner zusammen prüfen.
- Im Backend PMD mit den Regeln `CyclomaticComplexity` und `NcssCount` in die
  `pom.xml` aufnehmen. Bisher ist dort kein statisches Analysewerkzeug
  eingebunden.
- Die Ausgaben in der CI speichern, damit vorher und nachher pro Pull Request
  vergleichbar sind.

Für C2 zählt ein Test in #89 die SQL-Anweisungen mit der Hibernate-Statistik.
Das war die erste Metrik in diesem Dokument, die ein Werkzeug erhebt und nicht
ein Mensch. Seitdem halten drei weitere Werkzeuge einen Zielwert von 0 in CI:
`eslint-plugin-boundaries` für Importe von Feature zu Feature,
`consistent-type-assertions` für `as` und `jscpd` für Klone.
