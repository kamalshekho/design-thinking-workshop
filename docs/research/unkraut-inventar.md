# Unkraut-Inventar: Bewerbungsformular und Dashboard

Gemessen am 2026-11-23 auf `main` (Commit `506b239`) für das Ticket
"Unkraut-Inventar: Bewerbungsformular und Dashboard vermessen" (#101) der Karte
#100. Die Notiz hält Fakten fest. Was davon Unkraut ist, entscheidet "Festlegen,
was als Unkraut gilt" (#107).

Werkzeuge: `knip` 5.88.1 und `jscpd` 4.3.0 in Standardkonfiguration, ESLint,
Stylelint und `tsc` aus den Projekten, dazu eigene Skripte auf Basis des
TypeScript-Scanners und von PostCSS in
[`unkraut-inventar/`](./unkraut-inventar/). Die Handklassifikation der
Kommentare und die Befehle zum Nachrechnen stehen in
[`unkraut-inventar/classes.txt`](./unkraut-inventar/classes.txt).

## Umfang

Produktionscode heißt hier: alles unter `src/` außer `*.test.*`, `*.stories.*`,
`src/test/` und `src/mocks/`, CSS eingeschlossen.

| Messgröße | Bewerbungsformular | Dashboard |
| --- | --- | --- |
| Produktionscode: Dateien | 48 | 107 |
| Produktionscode: Zeilen | 3 672 | 13 838 |
| davon Kommentarzeilen | 367 (10 %) | 2 803 (20 %) |
| davon CSS-Zeilen | 1 443 | 385 |
| Tests `*.test.*`: Zeilen | 1 446 | 4 019 |
| Testhilfen `src/test`, `src/mocks`: Zeilen | 147 | 672 |
| Stories: Zeilen | 455 | keine |

Die Ausgangszahlen im Ticket (2 376 und 14 125 Zeilen) sind `.ts` und `.tsx`
ohne Tests und Stories, aber mit `src/test` und `src/mocks`. Für diesen Schnitt
zählt das Skript 308 und 2 802 Kommentarzeilen statt 380 und 3 280. Es zählt
jede Zeile, die ein Kommentar berührt, einmal. Wie die Ausgangszahlen gezählt
wurden, ist nicht überliefert.

Im Dashboard stammen 35 Dateien mit 5 593 Zeilen aus dem Untitled-UI-Klon oder
der shadcn/ui-Registry, das sind 40 % des Produktionscodes. Die Liste steht in
[`unkraut-inventar/copies.txt`](./unkraut-inventar/copies.txt). In den Kopien
sind 13 % der Zeilen Kommentare, im eigenen Code des Dashboards 25 % (2 079 von
8 245).

## Kommentare nach Art

Ein Block ist ein `/* */`-Kommentar oder eine Folge direkt untereinander
stehender `//`-Zeilen.

### Bewerbungsformular, alle 105 Blöcke

Gezählt sind Produktionscode und Testhilfen, zusammen 397 Kommentarzeilen.

| Art | Blöcke | Zeilen |
| --- | --- | --- |
| erklärt das Warum | 59 | 254 |
| nur Verweis oder Status, etwa "DESIGN.md section 17" | 18 | 28 |
| wiederholt eine Regel aus README oder API.md | 14 | 101 |
| wiederholt den Code | 13 | 13 |
| Direktive (`/// <reference>`) | 1 | 1 |
| auskommentierter Code | 0 | 0 |
| TODO, FIXME, HACK | 0 | 0 |

Neun der 14 Doku-Wiederholungen sind gleich gebaute Köpfe der Form "Domain-free
X matching the Figma Y component" in `components/ui/`. Sie wiederholen die
Komponentenregel aus `frontend/README.md`.

### Dashboard, 653 Blöcke

Exakt gezählt: 0 TODO, 0 auskommentierter Code, 2 Direktiven (10 Zeilen), 34
Herkunftsköpfe der Kopien mit 262 Zeilen. Die Art der übrigen Blöcke stammt aus
zwei Stichproben mit festem Seed. Die Spannen sind 95-%-Intervalle.

| Bereich | Blöcke | Zeilen | Stichprobe | erklärt das Warum | wiederholt den Code | Sonstiges |
| --- | --- | --- | --- | --- | --- | --- |
| eigener Code | 343 | 2 079 | 60 | 42 (70 %) | 15 (25 %, hochgerechnet 48 bis 123 Blöcke) | 2 Verweise, 1 Doku-Wiederholung |
| Kopien | 282 | 724 | 40 | 13 (33 %) | 23 (57 %, hochgerechnet 119 bis 206 Blöcke) | 4 Herkunftsköpfe |
| Testhilfen | 28 | 111 | nicht klassifiziert | | | |

Wiederholende Kommentare sind fast immer Einzeiler: 15 Blöcke mit 23 Zeilen im
eigenen Code, 23 Blöcke mit 34 Zeilen in den Kopien. In den Kopien sind es
überwiegend JSDoc-Zeilen zu Props wie "Content to display." über `children`.

Im eigenen Code des Dashboards sind 62 Blöcke zehn Zeilen oder länger. Die
einzige Doku-Wiederholung der Stichprobe ist zugleich der längste Block:
`app/AppShell.tsx:1` mit 33 Zeilen wiederholt den Abschnitt "The copied
components" aus `dashboard/README.md`.

### Einzelbefunde

- `frontend/src/components/ui/Field/Field.tsx:27` sagt, ein "English staff
  dashboard" werde `Field` wiederverwenden. Das Dashboard ist deutsch (`A6`)
  und hat eigene Komponenten (ADR-0002).
- `dashboard/src/api/staffMembers.ts:1` und
  `dashboard/src/domain/application.ts:52` begründen dieselbe Sache zweimal:
  warum ein Owner keine Adresse trägt.
- `dashboard/src/components/base/input/input.tsx:153` nennt ein "Payment icon",
  das es in der Datei nicht gibt. Der Fehler stammt aus dem Klon, die Datei ist
  laut Kopf unverändert.
- Im Bewerbungsformular stehen fünf offene Arbeiten ohne TODO-Marker:
  "Needs a copy review" in `content/de.ts:35`, `:69`, `:149` und `:193`, "needs
  the real privacy policy URL" in `content/links.ts:10`. Für das Dashboard war
  die Suche nach solchen Stellen zu ungenau, um eine Zahl zu nennen.

## Tote Exporte, Dateien und Abhängigkeiten

`knip` ohne Konfigurationsdatei. Testdateien gelten dabei als Einstiegspunkte,
ein Export, den nur ein Test nutzt, gilt also als genutzt. Die Spalte "nur in
Tests" kommt aus einem zweiten Lauf mit `--production`.

| Befund | Bewerbungsformular | Dashboard |
| --- | --- | --- |
| ungenutzte Dateien | 0 | 0 |
| ungenutzte Abhängigkeiten | 0 | 0 |
| ungenutzte Exporte | 7 | 15 |
| ungenutzte exportierte Typen | 14 | 22 |
| Exporte nur in Tests genutzt | 0 außerhalb von `src/mocks` | 3 |

`knip` meldet im Bewerbungsformular `public/mockServiceWorker.js` als ungenutzt.
MSW lädt die Datei zur Laufzeit, die Meldung ist falsch.

Ungenutzte Exporte, Bewerbungsformular: `errorText` (`content/de.ts:216`),
`buildApplicationRequest` (`api.ts:53`), `FIELD_ERROR_CODES` (`errors.ts:11`),
`NAME_MAX`, `EMAIL_MAX`, `ABOUT_MAX` (`schema.ts:21-23`), `DEFAULT_TIMEOUT_MS`
(`lib/http.ts:2`). Nur `errorText` kommt nirgends sonst vor, auch nicht in der
eigenen Datei. Die übrigen sechs nutzt ihre eigene Datei, nur der Export ist
überflüssig.

Ungenutzte Exporte, Dashboard: zehn liegen in Kopien (`styles` in `button.tsx`,
`CheckboxBase`, `InputBase`, `TextField`, `ToggleBase`, fünf `Select*` in
`ui/select.tsx`, drei Prüffunktionen in `is-react-component.ts`), dazu
`signInQuery` (`queries/session.ts:37`) und `testQueryClient`
(`test/renderApp.tsx:23`). Nur in Tests genutzt: `isApiProblem`
(`api/problem.ts:54`), `fieldErrorMessage` (`content/errorMessage.ts:26`) und
`setDiscarded` (`domain/application.ts:138`).

## Ungenutzte Teile der Untitled-UI-Kopien

`knip` sieht nur Exporte. Was innerhalb einer genutzten Datei ungenutzt bleibt,
zeigt erst der Blick auf die Aufrufe.

| Stelle | Befund | Zeilen |
| --- | --- | --- |
| `badges/badge-types.ts:26` | `FlagTypes`, eine Liste von Ländercodes, ohne Verwendung | 243 |
| `avatar/base-components/` | `avatar-online-indicator`, `verified-tick`, `avatar-count`: nur über die Props `status`, `verified` und `count` erreichbar, die keine der 5 Aufrufstellen setzt | 131 |
| `buttons/button.tsx` | Größen `xs`, `lg`, `xl` definiert, die 21 Aufrufe nutzen nur `sm` und `md` | 15 |
| `utils/is-react-component.ts` | 3 von 4 Exporten ungenutzt, enthält alle 9 `any` des Dashboards | 57 |

Die Farben des Buttons sind schon auf `primary`, `secondary` und `tertiary`
gekürzt und alle in Gebrauch. Die Paginierung wird vollständig genutzt.

Weitere Fakten zu den Kopien:

- `dashboard/eslint.config.js` schaltet für die Kopien 12 Regeln ab, darunter
  drei aus `jsx-a11y`.
- `dashboard/THIRD_PARTY_LICENSES` führt einen Abschnitt für das Avatar-Foto
  `src/images/ashton-blackwell.webp` und für `src/data/currentStaffMember.ts`.
  Beide Dateien gibt es nicht mehr.
- `mobile-header.tsx`, `nav-account-card.tsx` und `sidebar-simple.tsx` haben
  ihren Herkunftskopf nach den Importen. `dashboard/README.md` verlangt, dass
  eine Kopie mit diesem Kommentar beginnt.
- `application-table.tsx` (557 Zeilen) ist als Kopie von `table-example.tsx`
  gelistet, besteht aber großteils aus eigenem Code des Dashboards.

## Duplikate

`jscpd` mit Standardschwelle (50 Tokens).

| Bereich | Bewerbungsformular | Dashboard |
| --- | --- | --- |
| Produktionscode | 0 Klone | 3 Klone, 70 Zeilen |
| Tests | 11 Klone, 142 Zeilen (9,3 %) | 14 Klone, 142 Zeilen (4,3 %) |

Die drei Klone im Dashboard:

- `features/applications/ApplicationsScreen.tsx:199-227` und
  `features/overview/OpenApplicationsPanel.tsx:200-229`, 29 Zeilen, eigener
  Code;
- `base/checkbox/checkbox.tsx:140-165` und `base/toggle/toggle.tsx:148-173`, 26
  Zeilen, Kopien;
- `application/pagination/pagination-base.tsx:284-301` und `:392-409`, 18
  Zeilen, innerhalb einer Kopie.

## Verstöße gegen die README-Regeln

ESLint, Stylelint und `tsc` laufen in beiden Anwendungen ohne Fehler. Die
Tabellen zählen, was diese Werkzeuge nicht prüfen.

### Bewerbungsformular

| Regel aus `frontend/README.md` | Befund |
| --- | --- |
| Literale Größen nur in `tokens.css` | 11 Deklarationen mit `px` oder `em` außerhalb, Stylelint prüft keine Größen |
| dasselbe in `@media` | 5 Media Queries mit literaler Breite außerhalb (`640px` viermal, `900px` einmal), 2 weitere in `tokens.css` |
| Literale Zeiten | 14 Werte in `ms` oder `s` außerhalb von `tokens.css` |
| Prozent und Grad | 60 Prozentwerte und 17 Gradwerte, 56 davon in `HeroSection.module.css`, dort als Absicht begründet |
| Literale Farben und Schatten | 0 außerhalb von `tokens.css` |
| Jeder Token in `tokens.css` wird genutzt (nicht als Regel formuliert) | 9 von 126 Custom Properties ungenutzt: 5 WordPress-Schatten, laut `tokens.css:37` absichtlich behalten, dazu `--color-accent-soft`, `--color-focus-ring`, `--form-content-max`, `--transition-reveal` |
| `tokens.css` und `token.json` gleich | 3 Farben weichen ab: `#a255d3` nur in CSS, `#000000` und `#eceae6` nur in JSON; Größen nicht verglichen |
| Englische Bezeichner | 10 deutsche Bezeichner, alle in der Footer-Gruppe: `FooterKontakt`, `FooterRechtliches`, `kontakt`, `rechtliches`, `impressum`, `datenschutz` und ihre `Href`- und `Label`-Felder |
| Stylesheet neben der einzigen Komponente, die es nutzt | `components/ui/control.module.css` wird von `Input`, `Select` und `Textarea` genutzt, laut Kommentar in der Datei absichtlich |
| Nur benannte Exporte | 0 Default-Exporte, außer den 10 Stories, die Storybook so verlangt |
| Keine Barrel-Dateien | 0 |
| Kein `any`, keine Non-null-Assertion | 0 und 0 |
| Kein `style`-Prop | 0 |
| Deutscher Text nur in `content/de.ts` | 0 Treffer außerhalb |

Die 11 Größen: `Footer.module.css:78` (`0.5px`), `Header.module.css:149` und
`:157` (`7px`), `HeroSection.module.css:238` (`6px`),
`ApplicationForm.module.css:58`, `:59`, `:101`, `:102` (`1px` im
Visually-hidden-Muster), `base.css:68` (`320px`), `:86` (`0.14em`), `:101`
(`18px`).

### Dashboard

`dashboard/README.md` kennt keine Token-Regel. Die Styles stehen als
Tailwind-Klassen im Markup.

| Regel aus `dashboard/README.md` | Befund |
| --- | --- |
| Deutscher UI-Text in `src/content/` | 0 Treffer außerhalb |
| `src/api/` ohne React | 0 React-Importe |
| Jede Kopie beginnt mit einem Herkunftskopf | 3 Dateien mit Kopf erst nach den Importen |
| `THIRD_PARTY_LICENSES` listet jede Kopie | alle gelistet, 2 Einträge zeigen auf gelöschte Dateien |
| `any` (Regel aus `strictTypeChecked`) | 9, alle in `utils/is-react-component.ts`, per `eslint-disable` freigegeben |
| Non-null-Assertion | 0 im Produktionscode |

Ohne Regel, als Information für den Standard: 101 Tailwind-Klassen mit
willkürlichem Wert (`text-[11px]`, `w-[320px]`), 58 davon in 14 kopierten
Dateien, 43 in 13 eigenen. Von den 43 sind 23 Pixelwerte.

Typ-Assertions mit `as` sind in keiner der beiden READMEs geregelt: 8 im
Bewerbungsformular, 24 im Dashboard, jeweils ohne `as const`.
