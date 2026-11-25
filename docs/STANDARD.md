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
pre-commit-Hook und in CI. Nicht im Hook laufen `tsc`,
`scripts/check-config-parity.mjs`, in beiden Anwendungen `knip` und `jscpd`, im
Applicant form dazu die Skripte für ungenutzte Tokens und den Abgleich von
`token.json` mit `tokens.css` und im Dashboard das Skript für
`THIRD_PARTY_LICENSES`. Der Grund: lint-staged sieht nur die gestagten Dateien,
und eine Prüfung über das ganze Projekt macht den Hook langsam. Diese Prüfungen
laufen in CI und lokal in `npm run check`, das dazu die Tests mit Vitest und
Coverage ausführt. Welche Schritte `check` aufruft, steht in der `package.json`
der Anwendung. `vite build`, `size-limit` und die E2E-Tests laufen nur in CI.

Der Hook `.husky/pre-commit` ist für beide Anwendungen derselbe. Hat eine
Anwendung gestagte Dateien, ruft er ihr lint-staged mit `.lintstagedrc.json`
auf. Im Applicant form laufen Prettier und `eslint --fix` über `*.{ts,tsx}`,
Prettier und `stylelint --fix` über `*.css` und Prettier allein über
`*.{md,json,html}`. Im Dashboard laufen Prettier und `eslint --fix` über
`*.{ts,tsx}` und Prettier allein über `*.{css,js,mjs,md,json,html}`. Ein
Stylelint hat das Dashboard nicht. Ist lint-staged in einer Anwendung nicht
installiert, überspringt der Hook sie mit einer Warnung.

CI ist der Workflow `.github/workflows/ci.yml`. Der Job `frontend` ruft
`npm run typecheck`, `npm run lint`, `npm run stylelint`,
`npm run check:tokens`, `npm run check:token-json`, `npm run knip`,
`npm run knip:production` und `npm run jscpd` auf, der Job `dashboard`
`npm run typecheck`, `npm run lint`, `npm run check:licenses`, `npm run knip`,
`npm run knip:production` und `npm run jscpd`. Der Job `config` ruft
`scripts/check-config-parity.mjs` auf.

## Unkraut

### Was als Unkraut gilt

Unkraut ist Code und Text, den niemand benutzt oder der eine andere Quelle
wiederholt: überflüssige Kommentare, toter Code, ungenutzte Teile der Kopien,
Duplikate und Verweise auf etwas, das es nicht gibt. Die Regeln gelten auch für
den Bestand. Je Anwendung entfernt ein Issue das gefundene Unkraut und schaltet
die Prüfungen im selben Pull Request ein, sonst sind sie ab dem ersten Lauf rot.
Im Applicant form hat #127 das erledigt, im Dashboard #128.

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

Prüfung: `no-warning-comments` mit den Wörtern todo, fixme und hack, in beiden
Anwendungen eingeschaltet. Die Regel steht in `eslint.base.mjs`.

### Auskommentierter Code

Auskommentierter Code wird gelöscht.

Prüfung: `sonarjs/no-commented-code`, in beiden Anwendungen eingeschaltet. Die
Regel steht in `eslint.base.mjs`.

### `eslint-disable`

Jedes `eslint-disable` trägt eine Begründung. Ein `eslint-disable`, das keinen
Verstoß mehr abschaltet, wird gelöscht. Eine Ausnahme von einer Regel dieses
Standards ist nur ein `eslint-disable` mit Begründung.

Prüfung: `@eslint-community/eslint-comments/require-description` und
`linterOptions.reportUnusedDisableDirectives: 'error'`, beide in beiden
Anwendungen eingeschaltet. Sie stehen in `eslint.base.mjs` und gelten auch für
die Kopien aus Untitled UI.

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

Prüfung: `npm run knip` und `npm run knip:production` in CI, in beiden
Anwendungen eingeschaltet. Die Konfiguration steht in `frontend/knip.jsonc`,
die `public/mockServiceWorker.js` ignoriert, und in `dashboard/knip.jsonc`, die
auch die Importe in CSS-Dateien verfolgt. Im Produktionsmodus zählen Tests,
Stories, Skripte, `src/test` und `src/mocks` nicht mit, deshalb meldet
`knip --production` einen Export, den nur sie nutzen.

### CSS

Ein ungenutzter Token und eine ungenutzte Klasse eines CSS-Moduls sind
Unkraut.

Prüfung: `eslint-plugin-css-modules` mit `no-unused-class` und `no-undef-class`,
dazu `npm run check:tokens` in CI für ungenutzte Tokens. Beides ist im
Applicant form eingeschaltet. Das Skript zählt einen Token, den nur die
Definition eines anderen Tokens liest, nur dann als genutzt, wenn dieser
andere Token genutzt wird.

Das Plugin kann Media Queries in Bereichsschreibweise wie `(width <= 640px)`
nicht lesen und überspringt ein solches Modul ohne Meldung. Die Module von
Footer, Header, RoutePanel und ApplicationForm prüft deshalb nur das Review.

### Duplikate

Produktionscode enthält keine Klone, die Kopien eingeschlossen. Tests sind
ausgenommen, weil ein wiederholter Arrange-Block im Test besser lesbar ist als
eine Hilfsfunktion.

Prüfung: `npm run jscpd` in CI mit der Schwelle von 50 Tokens. Jeder Klon lässt
den Lauf scheitern. In beiden Anwendungen eingeschaltet, die Konfiguration
steht in `frontend/.jscpd.json` und `dashboard/.jscpd.json`.

### Verweise auf Nichtvorhandenes

Jeder Pfad in `dashboard/THIRD_PARTY_LICENSES` existiert, und jede gelistete
Kopie beginnt mit ihrem Herkunftskopf: einem Kommentar, der mit `Clone path:`
oder `Registry path:` und dem Pfad im Klon beginnt.

Prüfung: `npm run check:licenses` in CI, im Dashboard eingeschaltet. Das Skript
steht in `dashboard/scripts/check-third-party-licenses.mjs`.

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
`assertionStyle: 'never'` in `eslint.base.mjs`, in beiden Anwendungen
eingeschaltet, im Hook und in den CI-Jobs `frontend` und `dashboard`.

### Antworten des Servers

Ein Zod-Schema prüft jede Antwort des Servers dort, wo sie ankommt: in
`features/application-form/api.ts` im Applicant form und in `src/api/` im
Dashboard. Live-Stream-Ereignisse im Dashboard laufen in
`src/queries/applicationEvents.ts` durch dasselbe Schema wie die Liste der
Applications.

Prüfung: Zod-Schemas in beiden Anwendungen, eingeschaltet über die Tests in
`frontend/src/features/application-form/api.test.ts`,
`dashboard/src/api/transport.test.ts`, `dashboard/src/api/applications.test.ts`
und `dashboard/src/queries/applicationEvents.test.ts`. Die Tests zeigen, dass
eine Antwort mit falscher Form als Fehler ankommt und nicht als Daten.

## Anti-Slop-Regeln

Die Regeln dieses Abschnitts übernehmen den syntaktischen Teil von
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), einem Plugin für
Oxlint. Wir nutzen ESLint, deshalb laufen sie als Selektoren: jede Regel ist
eine eigene Kopie von `no-restricted-syntax` unter dem Namen
`anti-slop/<regel>`. Ein `eslint-disable` und ein `off` nennen diesen Namen.

Prüfung für den ganzen Abschnitt: `ANTI_SLOP_RULES` in `eslint.base.mjs`, in
beiden Anwendungen eingeschaltet, im Hook und in den CI-Jobs `frontend` und
`dashboard`. Die Selektoren prüfen die Syntax, nicht den aufgelösten Typ. Ein
Alias wie `type Raw = unknown` versteckt das `unknown` dahinter, deshalb ist
schon der Alias verboten.

### Typen an Parametern, Rückgaben und Wörterbüchern

Ein Parameter hat nicht den Typ `unknown` oder `object`, eine Funktion gibt
nicht `unknown`, `Promise<unknown>` oder `PromiseLike<unknown>` zurück, und
ein Typalias steht nicht für `unknown`. Ein Wörterbuch wie
`Record<string, unknown>` oder `{ [key: string]: object }` nennt den Typ
seiner Werte, `unknown`, `any`, `object` und `{}` gelten nicht.

Ausgenommen sind ein Type Guard, der `unknown` annimmt, ein Parameter namens
`cause` und eine generische Schranke wie `T extends Record<string, unknown>`.
`unknown` als Parameter und Rückgabe ist außerdem in der Transportschicht und
in Tests erlaubt, weil dort JSON vom Server ankommt, bevor ein Zod-Schema es
prüft. Die Transportschicht ist im Applicant form
`features/application-form/api.ts` und `lib/http.ts`, im Dashboard
`src/api/`.

Regeln: `anti-slop/no-unknown-parameters`, `anti-slop/no-object-parameters`,
`anti-slop/no-unknown-returns`, `anti-slop/no-unknown-type-aliases` und
`anti-slop/no-unsafe-dictionary-type`.

### Kein `typeof` außerhalb eines Type Guards

Ein Wert wird an der Grenze geparst oder in einem Type Guard eingeengt, nicht
mit einem `typeof` mitten im Code. Ein Vergleich mit `'undefined'` bleibt
erlaubt. Die Kopien aus Untitled UI und shadcn sind ausgenommen, weil die
Render-Props von react-aria einen Wert oder eine Funktion annehmen und sie mit
`typeof` unterscheiden.

Regel: `anti-slop/no-runtime-typeof`. Die Ausnahme der Kopien steht als
`runtimeTypeofIgnores` in `dashboard/eslint.config.js`.

### Kein Mocking von Modulen

Ein Test reicht eine Abhängigkeit als Parameter herein, statt ein Modul mit
`vi.mock` oder `vi.doMock` zu ersetzen.

Regel: `anti-slop/no-module-mocking`.

### Reflect

`Reflect.get` und `Reflect.apply` sind verboten. Eine Eigenschaft wird direkt
gelesen, eine Funktion direkt aufgerufen.

Regeln: `anti-slop/no-reflect-get` und `anti-slop/no-reflect-apply`.

### Leerzeilen

Eine Leerzeile steht zwischen mehrzeiligen Deklarationen, nach dem letzten
Import, vor `return`, `throw` und jeder Kontrollstruktur und nach einem Block.
Einzeilige Konstanten, Exporte und Typen und die Importe dürfen ohne
Leerzeile aufeinander folgen.

Prüfung: `@stylistic/padding-line-between-statements` in `eslint.base.mjs`,
in beiden Anwendungen eingeschaltet, im Hook und in den CI-Jobs `frontend` und
`dashboard`. `eslint --fix` setzt die fehlenden Leerzeilen, Prettier lässt sie
stehen.

### Was fehlt

`no-known-value-widening`, `no-reduce-accumulator-copy` und
`no-accumulating-spread` brauchen Typinformation oder den Vergleich zweier
Variablen. Das kann kein Selektor, deshalb prüft sie keine Maschine.
`no-array-filter-map`, `no-conditional-empty-object-spread` und
`no-shape-in-symbol-names` sind bewusst aus. Sie prüfen Geschmack, keinen
Fehler: zwei Durchläufe über ein kleines Array kosten nichts, und ein
Schlüssel mit `undefined` ist nicht dasselbe wie ein fehlender Schlüssel.
`no-chained-type-assertions`, `no-widen-then-assert` und
`require-safety-comment-for-type-assertion` entfallen, weil
[Kein `as`](#kein-as) jede Typumwandlung verbietet. In Tests ist `as` erlaubt,
dort gelten sie also nicht.

## Fehler

### Vom Fehler zum Text

Ein Fehler wird zu einem Code, der Code zu einem deutschen Text aus `content`,
und dieser Text wird angezeigt. Die Zuordnung vom Code zum Text ist ein
`Record<ErrorCode, string>`, ein fehlender Text ist also ein Fehler von `tsc`.

Prüfung: `tsc` in den CI-Jobs `frontend` und `dashboard`, eingeschaltet über
`errors: Record<ErrorCode, string>` in `frontend/src/content/types.ts` und über
`Record<TopLevelErrorCode, string>` in `dashboard/src/content/errorMessage.ts`
sowie `satisfies Record<TopLevelErrorCode, string>` in
`dashboard/src/content/de.ts`.

### Nur die Transportschicht wirft

Nur die Transportschicht wirft, und zwar ein `ApiProblem`. Komponenten
schreiben kein `try`/`catch`.

Prüfung: `@typescript-eslint/only-throw-error` ist über `strictTypeChecked` in
`eslint.base.mjs` in beiden Anwendungen eingeschaltet, im Hook und in den
CI-Jobs `frontend` und `dashboard`. Sie verbietet, etwas anderes als ein
`Error`-Objekt zu werfen. `no-restricted-syntax` gegen `TryStatement` in
`src/features/**` und `src/components/**` steht ebenfalls in `eslint.base.mjs`
und ist in beiden Anwendungen eingeschaltet, im Hook und in den CI-Jobs
`frontend` und `dashboard`. Einzige Ausnahme per `ignores` in
`frontend/eslint.config.js` ist `frontend/src/features/application-form/api.ts`,
weil die Transportschicht des Applicant form noch unter `features/` liegt; diese
Ausnahme entfällt, sobald sie aus `features/` herauszieht. `only-throw-error`
prüft, was geworfen wird, nicht wo, und lässt jede Unterklasse von `Error` zu.
Das Verbot von `TryStatement` prüft, wo gefangen wird, nicht wo geworfen wird.
Ob außerhalb der Transportschicht geworfen wird und ob das Geworfene ein
`ApiProblem` ist, prüft das Review. Die Entscheidung nennt dafür kein Werkzeug.

## Benennung

### Dateinamen

Eine Datei mit einer Komponente heißt in PascalCase, jedes andere Modul in
camelCase. Die Kopien aus Untitled UI und shadcn behalten kebab-case, als
eigener Elementtyp wie in
[ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md).

Prüfung: `eslint-plugin-check-file` mit `check-file/filename-naming-convention`
in `eslint.base.mjs`, in beiden Anwendungen eingeschaltet, im Hook und in den
CI-Jobs `frontend` und `dashboard`. Endungen wie `.test` und `.stories` zählen
nicht zum Namen. Im Dashboard sind die Kopien aus Untitled UI und shadcn über
die gemeinsame Liste in `dashboard/eslint.config.js` ausgenommen.

### Bezeichner auf Englisch

Bezeichner sind englisch.

Die Entscheidung nennt dafür kein Werkzeug. Die Sprache eines Bezeichners prüft
das Review.

## Komponenten

### Nur benannte Exporte

Beide Anwendungen exportieren nur benannt, nie mit `export default`.

Prüfung: `no-restricted-exports` mit `restrictDefaultExports: { direct: true }`
in `eslint.base.mjs`, in beiden Anwendungen eingeschaltet, im Hook und in den
CI-Jobs `frontend` und `dashboard`. Abgeschaltet ist sie für Konfigurations-
und Story-Dateien, die einen Default-Export brauchen (`vite.config.ts`,
Stories und `.storybook/`).

### Kein `style`-Attribut

Eine Komponente setzt kein `style`-Attribut. In den Kopien bleibt `style` für
CSS-Variablen erlaubt.

Prüfung: `no-restricted-syntax` mit dem Selektor
`JSXAttribute[name.name='style']` in `eslint.base.mjs`, in beiden Anwendungen
eingeschaltet, im Hook und in den CI-Jobs `frontend` und `dashboard`. Im
Dashboard sind die Kopien aus Untitled UI und shadcn über dieselbe Liste wie
bei `check-file` ausgenommen.

### Eine Komponente lädt keine Daten

Eine Komponente lädt keine Daten.

Prüfung: die Schichtregeln aus
[ADR-0008](./adr/0008-import-direction-checked-by-eslint-boundaries.md), siehe
[Importrichtung](#importrichtung-und-barrel-dateien), eingeschaltet im Hook und
in den CI-Jobs `frontend` und `dashboard`. Im Dashboard verbietet dazu ein
Block mit `no-restricted-imports` in `dashboard/eslint.config.js` jeder Datei
in `src/features/` außer `*Container.tsx`, `use*.ts` und Tests Importe aus
`@/queries` und `@tanstack/react-query`, eingeschaltet im Hook und im CI-Job
`dashboard`.

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

Prüfung der Importrichtung: `eslint-plugin-boundaries` mit den Schichten in
`frontend/eslint.config.js` und `dashboard/eslint.config.js`, eingeschaltet im
Hook und in den CI-Jobs `frontend` und `dashboard`.

Prüfung der Barrel-Dateien: `no-restricted-syntax` gegen jedes `export … from`
in `eslint.base.mjs`, auch `export type … from` und `export * from`,
eingeschaltet im Hook und in den CI-Jobs `frontend` und `dashboard`.

## Styles

Es bleiben zwei Systeme mit gemeinsamen Regeln: CSS Modules mit `tokens.css` im
Applicant form, Tailwind im Dashboard.

### Literale Werte nur in der Quelle der Tokens

Ein literaler Wert steht nur in der Quelle der Tokens: `src/styles/tokens.css`
im Applicant form, `@theme` in `dashboard/src/styles/` im Dashboard.

Prüfung im Applicant form: Stylelint mit `color-no-hex`,
`declaration-property-value-disallowed-list` gegen `rgb`, `rgba` und `hsl` in
`color`, `background*` und `border*` sowie `unit-disallowed-list` gegen `px`,
`em` und `rem` (mit Ausnahme von `px` für `width` in `@media`-Bedingungen), in
`frontend/.stylelintrc.json`. Alle drei Regeln sind für `src/styles/tokens.css`
abgeschaltet. Sie laufen im Hook und im CI-Job `frontend`. Ein `style`-Attribut
umgeht die Tokens, siehe [Kein `style`-Attribut](#kein-style-attribut).

Prüfung im Dashboard: `eslint-plugin-better-tailwindcss` mit
`no-restricted-classes`, eingeschaltet in `dashboard/eslint.config.js`, im Hook
und im CI-Job `dashboard`. Die Regel verbietet jeden beliebigen Wert, der eine
Ziffer enthält, Muster `-\[[^\]]*\d`, und gilt auch für die Kopien aus
Untitled UI und shadcn. Das trifft Werte wie `w-[320px]` und
`top-[calc(100%+8px)]` und Varianten wie `min-[400px]:`. Erlaubt bleiben
`data-[…]`, `transition-[<Eigenschaft>]`, `var(--…)` und `inherit`, weil sie
keine Zahl festlegen.

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
1024 px erlaubt, eingeschaltet in `frontend/.stylelintrc.json`, im Hook und im
CI-Job `frontend`. Prüfung im Dashboard: `no-restricted-classes` aus dem
Abschnitt [Literale Werte](#literale-werte-nur-in-der-quelle-der-tokens) trifft
auch Varianten wie `min-[400px]:`, eingeschaltet in
`dashboard/eslint.config.js`, im Hook und im CI-Job `dashboard`.

### `tokens.css` ist die Quelle für `token.json`

`tokens.css` ist die Quelle für `token.json`, weil ihre Werte von der Website
stammen. Weicht ein Primitiv in `token.json` ab, wird `token.json`
korrigiert.

Prüfung: `npm run check:token-json` (`frontend/scripts/check-token-json.mjs`),
eingeschaltet im CI-Job `frontend`. Das Skript vergleicht die bestätigten
Primitive beider Dateien und scheitert bei einer Abweichung oder einem
unbekannten `confirmed`-Eintrag.

## Ausnahmen der Kopien

Für die Kopien im Dashboard gelten dieselben ESLint-Regeln wie für den eigenen
Code. Nur bei `jsx-a11y/click-events-have-key-events` und
`jsx-a11y/no-static-element-interactions` bleibt ein `eslint-disable` mit
Begründung, wo react-aria die Tastatur schon bedient. Sonst wird die Stelle
behoben.

Der frühere Ausnahmeblock für die Untitled-UI-Kopien in
`dashboard/eslint.config.js` ist abgebaut; seine Begründung, die Kopien leicht
neu abzugleichen, entfiel mit
[Kopien aus Untitled UI](#kopien-aus-untitled-ui).

Prüfung: die ESLint-Regeln selbst, eingeschaltet in
`dashboard/eslint.config.js`, im Hook und im CI-Job `dashboard`.

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
