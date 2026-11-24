---
status: accepted
---

# Eine Importrichtung nach bulletproof-react, geprüft mit eslint-plugin-boundaries

Bewerbungsformular und Dashboard folgen derselben Importrichtung wie
bulletproof-react: geteilter Code unten, darüber die Features, darüber `app`.
Jede Anwendung beschreibt ihre Schichten in der eigenen `eslint.config.js`, und
`eslint-plugin-boundaries` prüft sie im Editor, in lint-staged und in CI. Ein
gemeinsames Code-Paket gibt es nicht
([ADR-0002](./0002-dashboard-as-separate-application.md)). Barrel-Dateien gibt
es in keiner der beiden Anwendungen, importiert wird direkt aus der Datei.

Feature-Sliced Design hat das Team verworfen. Es verlangt eine `index.ts` als
Public API pro Slice, und das widerspricht dem Verbot von Barrel-Dateien im
Bewerbungsformular und der Empfehlung von Vite. Im Dashboard müssten
`domain/`, `api/` und `queries/` auf `entities` und `shared` verteilt werden,
und Steiger, der Linter von FSD, ist laut README noch Beta. Das
Bewerbungsformular hat ein einziges Feature und gewinnt durch sechs Schichten
nichts. `dependency-cruiser` hat das Team ebenfalls verworfen. Es braucht einen
eigenen Schritt in CI und im pre-commit-Hook und zeigt Fehler nicht im Editor.
Den Vergleich enthält die Recherche zu #103 auf dem Branch
`research/architekturmuster`.

## Folgen

- Features importieren einander nicht. Zwölf Module, die `overview`,
  `discarded` und `categories` aus `applications` holten, sind in geteilte
  Schichten umgezogen. `ApplicationDrawer`, `ApplicationsList`,
  `DiscardSelectedDialog`, `SearchField`, `OwnerSelect`, `controlStyles`,
  `ApplicationDetail`, `ApplicationDetailSections` und `ApplicationPage` liegen
  in `components/shared`, `filterApplications` in `utils/`, `useNotesDraft` und
  `useApplicationActions` in `hooks/` und `useApplicationWrites` in `queries/`.
  `ApplicationPage` zieht mit, weil `ApplicationDetail` es rendert. Bliebe es im
  Feature, würde `components/shared` aus einem Feature importieren.
- Die Schichten des Dashboards setzen
  [ADR-0006](./0006-one-cache-and-prop-driven-screens.md) fort. `domain`
  importiert nur sich selbst, `api` nur `domain`, `queries` nur `api`, `domain`
  und `hooks`. `api` importiert auch kein React: Ein Block mit
  `no-restricted-imports` in `dashboard/eslint.config.js` verbietet dort
  `react`, `react-dom` und `@tanstack/react-query`. Features erreichen den
  Server nur über `queries`. Innerhalb eines Features importieren nur
  `*Container.tsx` und `use*.ts` den Cache, ein Screen nie. Die Anmeldung
  bekommt deshalb ihren Fehler als fertigen Wert: `useSignInFailure` in
  `queries/session.ts` liest den Code aus dem Fehler der Anfrage, und
  `Credentials` liegt in `domain/signIn.ts`.
- Geteilter UI-Code darf `content` und `domain` importieren, aber nie
  `features`, `api`, `queries` oder `app`. Das gilt für die Kopien aus Untitled
  UI, für `components/shared` im Dashboard und für `components/ui` im
  Bewerbungsformular. Damit entfällt die Regel des Bewerbungsformulars, nach der
  eine UI-Komponente keine Texte importiert. Sie sollte die Komponenten im
  Dashboard wiederverwendbar halten, und ohne gemeinsames Paket gibt es diese
  Wiederverwendung nicht. Die Grenze der Figma-Komponenten aus
  `frontend/DESIGN.md` bleibt eine Konvention in der README.
- Das Bewerbungsformular behält seinen Server-State im Feature
  (`features/application-form/`) und bekommt kein TanStack Query. Die
  Fehlercodes und die Routen liegen in `lib/errorCodes.ts` und `lib/routes.ts`,
  weil `content` sie liest und geteilter Code das Feature nicht importiert.
- Die Kopien aus Untitled UI, auch die unter `hooks/` und `utils/`, sind in der
  Konfiguration eine Dateikategorie und kein Elementtyp.
  `eslint-plugin-boundaries` beschreibt Ordner als Elemente, und die Kopien
  liegen zwischen eigenen Dateien. Dasselbe gilt für `main.tsx` im Dashboard,
  `vite-env.d.ts` im Bewerbungsformular und die Testdateien.
- `test/`, `mocks/`, Testdateien und Stories sind ein Element nur für Tests.
  Produktionscode importiert es nicht, auch nicht per dynamischem Import. Die
  einzige Ausnahme ist der dynamische Import von `mocks/browser.ts` in
  `frontend/src/app/main.tsx`. Er startet in der Entwicklung Mock Service
  Worker, damit das Bewerbungsformular ohne Backend läuft. Die Ausnahme
  entfällt, wenn das Bewerbungsformular in der Entwicklung nicht mehr ohne
  Backend laufen muss.
- Re-Exporte sind in beiden Anwendungen verboten, auch `export type … from` und
  `export * from`. Der Re-Export von `Category` aus `domain/application.ts` ist
  entfallen, `Category` kommt aus `domain/category.ts`.
- `boundaries/no-unknown-files` ist eingeschaltet. Eine Datei außerhalb der
  beschriebenen Schichten lässt `npm run lint` scheitern.
- Die Ordnernamen bleiben je Anwendung, wie sie sind (`lib/` und `utils/`,
  `components/ui` und `components/shared`). Die Regel ist in beiden
  Anwendungen dieselbe, nur die Namen in der Konfiguration unterscheiden sich.
