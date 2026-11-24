# Coding-Standard

Dieser Standard gilt für das Applicant form in `frontend/` und das Dashboard in
`dashboard/`. Er fasst die Entscheidungen aus drei Issues zusammen: #111 (Code,
Styles und Typen), #107 (Unkraut) und #108 (Zielgeräte und Breakpoints). Die
Begriffe kommen aus [`CONTEXT.md`](../CONTEXT.md).

Jeder Abschnitt nennt eine Regel und dazu die Prüfung, die sie heute durchsetzt,
das offene Issue, das die Prüfung einschaltet, oder den Grund, warum keine
Maschine sie prüft. Wo die Anwendungen sich unterscheiden, steht das je
Anwendung da. Als eingeschaltet gilt eine Prüfung nur, wenn sie in der
Konfiguration im Repo steht und einen Verstoß als Fehler meldet. `npm run lint`
ruft `eslint .` ohne `--max-warnings 0` auf, eine Warnung lässt also weder den
Hook noch CI scheitern.

Die READMEs der beiden Anwendungen beschreiben nur, was eine Anwendung allein
betrifft, und verweisen für alles andere hierher.

## Wo die Prüfungen laufen

ESLint- und Stylelint-Regeln, die jede Datei für sich prüfen, laufen im
pre-commit-Hook und in CI. `tsc` und `scripts/check-config-parity.mjs` laufen
nur in CI. `knip`, `jscpd` und die Skripte für Tokens und `THIRD_PARTY_LICENSES`
gibt es noch nicht. Sobald #127, #128 und #132 sie einschalten, laufen sie
ebenfalls nur in CI. Der Grund: lint-staged sieht nur die gestagten Dateien, und
eine Prüfung über das ganze Projekt macht den Hook langsam.

Der Hook `.husky/pre-commit` ist für beide Anwendungen derselbe. Hat eine
Anwendung gestagte Dateien, ruft er ihr lint-staged mit `.lintstagedrc.json`
auf. Im Applicant form laufen Prettier und `eslint --fix` über `*.{ts,tsx}`,
Prettier und `stylelint --fix` über `*.css` und Prettier allein über
`*.{md,json,html}`. Im Dashboard laufen Prettier und `eslint --fix` über
`*.{ts,tsx}` und Prettier allein über `*.{css,js,mjs,md,json,html}`. Ein
Stylelint hat das Dashboard nicht. Ist lint-staged in einer Anwendung nicht
installiert, überspringt der Hook sie mit einer Warnung.

CI ist der Workflow `.github/workflows/ci.yml`. Der Job `frontend` ruft
`npm run typecheck`, `npm run lint` und `npm run stylelint` auf, der Job
`dashboard` `npm run typecheck` und `npm run lint`. Der Job `config` ruft
`scripts/check-config-parity.mjs` auf.

## Unkraut

### Was als Unkraut gilt

Unkraut ist Code und Text, den niemand benutzt oder der eine andere Quelle
wiederholt: überflüssige Kommentare, toter Code, ungenutzte Teile der Kopien,
Duplikate und Verweise auf etwas, das es nicht gibt. Die Regeln gelten auch für
den Bestand. Je Anwendung entfernt ein Issue das gefundene Unkraut und schaltet
die Prüfungen im selben Pull Request ein, sonst sind sie ab dem ersten Lauf rot:
#127 im Applicant form, #128 im Dashboard.

Stilfragen sind kein Unkraut. Größen außerhalb von `tokens.css`, `as`,
Tailwind-Klassen mit beliebigem Wert, deutsche Bezeichner und Abweichungen
zwischen `tokens.css` und `token.json` regeln die Abschnitte unter
[Typumwandlungen](#typumwandlungen-und-antworten-des-servers),
[Benennung](#benennung) und [Styles](#styles).

Der Begriff steht nicht in `CONTEXT.md`, weil er den Entwicklungsprozess
beschreibt und nicht die Domäne.

### Kommentare

Ein Kommentar bleibt, wenn er das Warum erklärt oder in einer Zeile auf den
Abschnitt der Spezifikation verweist, den der Code umsetzt. Ein Kommentar, der
den Code wiederholt, wird gelöscht. Ein Kommentar, der eine Regel aus einer
README oder `API.md` wiederholt, wird zu einem einzeiligen Verweis auf den
Abschnitt. Das gilt auch in den Kopien aus Untitled UI: JSDoc-Zeilen wie
"Content to display." über `children` werden gelöscht, der Herkunftskopf
bleibt.

Ob ein Kommentar den Code wiederholt oder veraltet ist, prüft keine Maschine.
Das bleibt Aufgabe des Reviews.

### Offene Arbeit

Offene Arbeit steht in einem Issue, nicht im Code. TODO, FIXME und HACK sind
verboten.

Prüfung: `no-warning-comments`, noch nicht eingeschaltet. #127 schaltet sie im
Applicant form ein, #128 im Dashboard.

### Auskommentierter Code

Auskommentierter Code wird gelöscht.

Prüfung: `sonarjs/no-commented-code`, noch nicht eingeschaltet. #127 schaltet
sie im Applicant form ein, #128 im Dashboard.

### `eslint-disable`

Jedes `eslint-disable` trägt eine Begründung. Ein `eslint-disable`, das keinen
Verstoß mehr abschaltet, wird gelöscht. Eine Ausnahme von einer Regel dieses
Standards ist nur ein `eslint-disable` mit Begründung.

Prüfung: `@eslint-community/eslint-comments/require-description` und
`linterOptions.reportUnusedDisableDirectives: 'error'`, beide noch nicht
eingeschaltet. #127 schaltet sie im Applicant form ein, #128 im Dashboard. Heute
meldet ESLint ein überflüssiges `eslint-disable` nur als Warnung.

### Kopien aus Untitled UI

Eine Kopie ist nach dem Kopieren eigener Code und behält nur, was eine
Aufrufstelle nutzt. Der Herkunftskopf nennt, was gekürzt wurde. Ein Re-Sync
mit dem Klon ist nicht vorgesehen. Wer eine Komponente aktualisiert, kopiert
sie neu ([ADR-0002](./adr/0002-dashboard-as-separate-application.md)).

Tote Exporte einer Kopie findet `knip`, siehe [Toter Code](#toter-code). Props
und Varianten, die keine Aufrufstelle setzt, prüft keine Maschine. Sie findet
nur das Review.

### Toter Code

Tot ist ein Export oder Typ, den kein Produktionscode importiert. Ein `export`,
den nur die eigene Datei nutzt, entfällt. Ein Export, den nur Tests nutzen,
ist ebenfalls Unkraut, denn der Test prüft das öffentliche Verhalten. Nur
`test/` und `mocks/` exportieren für Tests.

Prüfung: `knip` und `knip --production` in CI, noch nicht eingeschaltet. #127
schaltet sie im Applicant form ein, #128 im Dashboard. Die Konfiguration von
`knip` wird dann `public/mockServiceWorker.js` ignorieren.

### CSS

Ein ungenutzter Token und eine ungenutzte Klasse eines CSS-Moduls sind
Unkraut.

Prüfung: `eslint-plugin-css-modules` mit `no-unused-class` und `no-undef-class`,
dazu ein Skript in CI für ungenutzte Tokens. Beides ist noch nicht
eingeschaltet, #127 schaltet es im Applicant form ein.

### Duplikate

Produktionscode enthält keine Klone, die Kopien eingeschlossen. Tests sind
ausgenommen, weil ein wiederholter Arrange-Block im Test besser lesbar ist als
eine Hilfsfunktion.

Prüfung: `jscpd` in CI mit der Schwelle von 50 Tokens. Jeder Klon lässt den Lauf
scheitern. Noch nicht eingeschaltet, #127 schaltet es im Applicant form ein,
#128 im Dashboard.

### Verweise auf Nichtvorhandenes

Jeder Pfad in `dashboard/THIRD_PARTY_LICENSES` existiert, und jede gelistete
Kopie beginnt mit ihrem Herkunftskopf.

Prüfung: ein Skript in CI, noch nicht eingeschaltet. #128 schaltet es ein.

## TypeScript

### Compiler-Optionen

Beide `tsconfig.json` haben dieselben `compilerOptions`, abgesehen von
`paths`. Dazu gehören `strict`, `noUncheckedIndexedAccess`,
`erasableSyntaxOnly` und `noImplicitReturns`.

`exactOptionalPropertyTypes` bleibt aus. Es meldet in beiden Anwendungen
Fehler, im Dashboard meist an Props von react-aria in den Kopien.
`noPropertyAccessFromIndexSignature` bleibt aus. Es meldet Fehler, ohne dass
einer davon einen Bug zeigt.

Prüfung: `tsc --noEmit` über `npm run typecheck` in den CI-Jobs `frontend` und
`dashboard`, nicht im Hook. Dass beide Dateien dieselben `compilerOptions`
haben, prüft `scripts/check-config-parity.mjs` im CI-Job `config`.

## Typumwandlungen und Antworten des Servers

### Kein `as`

`as` ist verboten, `as const` bleibt erlaubt. Ein Wert aus einem `<select>`
geht durch einen Type Guard aus `domain`. Die Regel gilt auch in den Kopien.
Ausgenommen sind nur Tests und `mocks/`. Eine Ausnahme ist sonst nur ein
[`eslint-disable` mit Begründung](#eslint-disable).

Prüfung: `@typescript-eslint/consistent-type-assertions` mit
`assertionStyle: 'never'`, noch nicht eingeschaltet. #130 schaltet sie in
beiden Anwendungen ein.

### Antworten des Servers

Ein Zod-Schema prüft jede Antwort des Servers dort, wo sie ankommt: in
`features/application-form/api.ts` im Applicant form und in `src/api/` im
Dashboard. Heute prüft das Applicant form die Antworten in `api.ts` von Hand,
und das Dashboard reicht sie in `src/api/transport.ts` mit
`response.json() as T` ungeprüft durch.

Prüfung: noch keine. #130 bringt Zod ins Dashboard und zeigt mit einem Test,
dass eine Antwort mit falscher Form als Fehler ankommt und nicht als Daten.

## Fehler

### Vom Fehler zum Text

Ein Fehler wird zu einem Code, der Code zu einem deutschen Text aus `content`,
und dieser Text wird angezeigt. Die Zuordnung vom Code zum Text ist ein
`Record<ErrorCode, string>`, ein fehlender Text ist also ein Fehler von `tsc`.

Prüfung im Applicant form: `tsc` im CI-Job `frontend`, über den Typ
`errors: Record<ErrorCode, string>` in `src/content/types.ts`. Im Dashboard noch
nicht eingeschaltet, dort liest `src/content/errorMessage.ts` die Texte über
`Record<string, string>`. #130 stellt das Dashboard um.

### Nur die Transportschicht wirft

Nur die Transportschicht wirft, und zwar ein `ApiProblem`. Komponenten
schreiben kein `try`/`catch`.

Prüfung: `@typescript-eslint/only-throw-error` ist über `strictTypeChecked` in
`eslint.base.mjs` in beiden Anwendungen eingeschaltet, im Hook und in den
CI-Jobs `frontend` und `dashboard`. Sie verbietet, etwas anderes als ein
`Error`-Objekt zu werfen. `no-restricted-syntax` gegen `TryStatement` in
`features/**` und `components/**` ist noch nicht eingeschaltet, #130 schaltet es
in beiden Anwendungen ein. `only-throw-error` prüft, was geworfen wird, nicht
wo, und lässt jede Unterklasse von `Error` zu. Das Verbot von `TryStatement`
prüft, wo gefangen wird, nicht wo geworfen wird. Ob außerhalb der
Transportschicht geworfen wird und ob das Geworfene ein `ApiProblem` ist, prüft
das Review. Die Entscheidung nennt dafür kein Werkzeug.

## Benennung

### Dateinamen

Eine Datei mit einer Komponente heißt in PascalCase, jedes andere Modul in
camelCase. Die Kopien aus Untitled UI und shadcn behalten kebab-case, als
eigener Elementtyp wie in
[ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md).

Prüfung: `eslint-plugin-check-file` mit Glob-Mustern für den eigenen Code,
noch nicht eingeschaltet. #131 schaltet es in beiden Anwendungen ein.

### Bezeichner auf Englisch

Bezeichner sind englisch.

Die Entscheidung nennt dafür kein Werkzeug. Die Sprache eines Bezeichners prüft
das Review.

## Komponenten

### Nur benannte Exporte

Beide Anwendungen exportieren nur benannt, nie mit `export default`.

Prüfung im Applicant form: `no-restricted-exports` mit
`restrictDefaultExports: { direct: true }` in `frontend/eslint.config.js`,
eingeschaltet im Hook und im CI-Job `frontend`. Abgeschaltet ist sie für
Stories, `vite.config.ts` und `.storybook/`, die einen Default-Export brauchen.
Im Dashboard noch nicht eingeschaltet, #131 schaltet sie ein.

### Kein `style`-Attribut

Eine Komponente setzt kein `style`-Attribut. In den Kopien bleibt `style` für
CSS-Variablen erlaubt.

Prüfung im Applicant form: `no-restricted-syntax` mit dem Selektor
`JSXAttribute[name.name='style']` in `frontend/eslint.config.js`, eingeschaltet
im Hook und im CI-Job `frontend`. Im Dashboard noch nicht eingeschaltet, #131
schaltet es ein.

### Eine Komponente lädt keine Daten

Eine Komponente lädt keine Daten.

Prüfung: die Schichtregeln aus
[ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md), noch
nicht eingeschaltet. #126 schaltet sie in beiden Anwendungen ein, siehe
[Importrichtung](#importrichtung-und-barrel-dateien).

### Eine Komponente validiert nicht

Eine Komponente validiert nicht, die Regeln stehen einmal im Schema.

Das prüft keine Maschine, weil eine Längenprüfung im Code nicht von anderer
Logik zu unterscheiden ist.

### Ordner der Komponenten

Die Ordner bleiben je Anwendung, wie sie sind: im Applicant form ein Ordner je
Komponente. Im Dashboard liegen die eigenen Komponenten als flache Dateien im
Ordner ihres Features und in `components/shared/`. Die Kopien behalten die
Ordner des Klons.

Die Entscheidung nennt dafür kein Werkzeug. Die Ordner prüft das Review.

## Importrichtung und Barrel-Dateien

Beide Anwendungen folgen der Importrichtung aus
[ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md). Das
ADR beschreibt die Schichten und die erlaubten Importe. Barrel-Dateien gibt es
in keiner der beiden Anwendungen, importiert wird direkt aus der Datei.

Prüfung: `eslint-plugin-boundaries`, dazu eine Regel gegen Barrel-Dateien,
beides noch nicht eingeschaltet. #126 schaltet es in beiden Anwendungen ein.

Heute verbietet im Applicant form ein Block mit `no-restricted-imports` in
`frontend/eslint.config.js` den Dateien unter `src/components/` Importe aus
`content/` und `features/`. Er ist eingeschaltet im Hook und im CI-Job
`frontend`. Nach ADR-0008 darf geteilter UI-Code `content` importieren.

## Styles

Es bleiben zwei Systeme mit gemeinsamen Regeln: CSS Modules mit `tokens.css` im
Applicant form, Tailwind im Dashboard.

### Literale Werte nur in der Quelle der Tokens

Ein literaler Wert steht nur in der Quelle der Tokens: `src/styles/tokens.css`
im Applicant form, `@theme` in `dashboard/src/styles/` im Dashboard.

Prüfung im Applicant form: Stylelint mit `color-no-hex` und
`declaration-property-value-disallowed-list` gegen `rgb`, `rgba` und `hsl` in
`color`, `background*` und `border*`, in `frontend/.stylelintrc.json`.
Abgeschaltet sind beide für `src/styles/tokens.css`. Sie laufen im Hook und im
CI-Job `frontend`. Für Größen ist `unit-disallowed-list` gegen `px`, `em` und
`rem` außerhalb von `tokens.css` noch nicht eingeschaltet, #132 schaltet sie
ein. Ein `style`-Attribut umgeht die Tokens, siehe
[Kein `style`-Attribut](#kein-style-attribut).

Prüfung im Dashboard: `eslint-plugin-better-tailwindcss` mit
`no-restricted-classes`, noch nicht eingeschaltet. Die Regel verbietet jeden
beliebigen Wert, der eine Ziffer enthält, Muster `-\[[^\]]*\d`. Das trifft
Werte wie `w-[320px]` und `top-[calc(100%+8px)]` und Varianten wie
`min-[400px]:`. Erlaubt bleiben `data-[…]`, `transition-[<Eigenschaft>]`,
`var(--…)` und `inherit`, weil sie keine Zahl festlegen. #133 schaltet sie
ein.

### Breakpoints

Beide Anwendungen nutzen einen gemeinsamen Satz Breakpoints: die Werte von
Tailwind bis `xl`, also 640, 768, 1024 und 1280 px. Das Applicant form nutzt
davon 640 und 1024 px. Der Header bleibt bei 900 px. Das ist die einzige
Ausnahme, beschrieben in [`frontend/DESIGN.md`](../frontend/DESIGN.md).

Das Dashboard nutzt heute zusätzlich 1536 px, den Wert `2xl` von Tailwind. Ab
dieser Breite zeigt die Tabelle der Applications die Spalte Kategorie, über
`useBreakpoint('2xl')` in `application-table.tsx` unter
`dashboard/src/components/application/`. Der Satz enthält 1536 px nicht. Das
braucht eine neue Entscheidung, ein Issue dafür gibt es noch nicht.

Prüfung im Applicant form: Stylelint mit
`media-feature-name-value-allowed-list`, das für `width` nur 640, 900 und
1024 px erlaubt, noch nicht eingeschaltet. #132 schaltet es ein. Prüfung im
Dashboard: `no-restricted-classes` aus dem Abschnitt
[Literale Werte](#literale-werte-nur-in-der-quelle-der-tokens) trifft auch
Varianten wie `min-[400px]:`, noch nicht eingeschaltet. #133 schaltet es ein.

### `tokens.css` ist die Quelle für `token.json`

`tokens.css` ist die Quelle für `token.json`, weil ihre Werte von der Website
stammen. Weicht ein Primitiv in `token.json` ab, wird `token.json`
korrigiert.

Prüfung: ein Skript in CI vergleicht die Primitive beider Dateien und
scheitert bei einer Abweichung, noch nicht eingeschaltet. #132 schaltet es
ein.

## Ausnahmen der Kopien

Für die Kopien im Dashboard gelten dieselben ESLint-Regeln wie für den eigenen
Code. Nur bei `jsx-a11y/click-events-have-key-events` und
`jsx-a11y/no-static-element-interactions` bleibt ein `eslint-disable` mit
Begründung, wo react-aria die Tastatur schon bedient. Sonst wird die Stelle
behoben.

Heute schaltet ein Block in `dashboard/eslint.config.js` für die Kopien eine
Reihe von Regeln ab. Seine Begründung, die Kopien leicht neu abzugleichen,
entfällt mit [Kopien aus Untitled UI](#kopien-aus-untitled-ui).

Prüfung: die ESLint-Regeln selbst, sobald der Block sie nicht mehr abschaltet.
Noch nicht eingeschaltet, #134 baut den Block ab.

## Bildschirmbreiten und Bedienung

Applicants öffnen das Applicant form meist auf dem Smartphone (`A28`). Staff
members arbeiten am Laptop oder Desktop und auf dem Telefon nur an einer
Application (`A29`). Beide Annahmen stehen in
[`docs/ASSUMPTIONS.md`](./ASSUMPTIONS.md).

### Breiten ab 320 px

Beide Anwendungen gelten ab 320 px als unterstützt, nach oben ohne Grenze.
320 px entspricht WCAG 2.2, 1.4.10 (1280 px bei 400 % Zoom). Die Seite scrollt
in keiner Breite seitlich. Ausgenommen sind Datentabellen, die 1.4.10
ausdrücklich zulässt.

Prüfung: der E2E-Test mit Playwright bei 320 px, noch nicht eingeschaltet.
#137 schaltet ihn ein. Welche Breiten der E2E-Test abdeckt, hat #110
entschieden.

### Tippflächen

Jedes Bedienelement in beiden Anwendungen hat eine Tippfläche von mindestens
24 × 24 px (WCAG 2.2, 2.5.8). Die sichtbare Größe ändert sich nicht. Links im
Fließtext sind ausgenommen.

Prüfung: die axe-Regel `target-size` in der Spec mit `@axe-core/playwright`,
noch nicht eingeschaltet. #137 schaltet sie ein. axe in jsdom kann die Regel
nicht prüfen, weil jsdom kein Layout berechnet.
