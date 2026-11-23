# Responsive-Bestandsaufnahme: Bewerbungsformular und Dashboard

Ticket: [Responsive-Bestandsaufnahme beider Anwendungen](https://github.com/kamalshekho/design-thinking-workshop/issues/102),
Karte [#100](https://github.com/kamalshekho/design-thinking-workshop/issues/100).

Aufgenommen am 23.11.2026 mit dem Compose-Stack: Bewerbungsformular auf
`:8081`, Dashboard auf `:8082`, Backend mit Profil `demo`. Die Images von
Bewerbungsformular und Dashboard sind am 20.11.2026 gebaut, nach dem letzten
Commit an `frontend/` und `dashboard/` (`082c2bd`). Seitdem hat sich nur das
Backend geändert (`506b239`).

Gemessen mit Chromium 1254 über `playwright-core` 1.65, in den Breiten 360,
768, 1024 und 1440 px. Unter 1024 px laufen die Seiten mit Touch-Emulation,
bei 360 px zusätzlich als Mobilgerät. Die Liste nennt nur, was kaputt ist
oder Inhalt unerreichbar macht. Ob ein Fund behoben wird, entscheidet
[Zielgeräte und Breakpoints](https://github.com/kamalshekho/design-thinking-workshop/issues/108).

## Datenschutz in den Screenshots

In der Demo-Datenbank liegt eine echte Bewerbung. Die Skripte ersetzen vor
jedem Screenshot Name und E-Mail-Adresse im DOM durch "Alex Beispiel" und
`alex.beispiel@example.org`. Das Absenden des Formulars ist gemockt, und die
Routenauswahl wird nicht an das Backend gemeldet. Der Lauf hat also nichts in
die Datenbank geschrieben.

## Bewerbungsformular

### Weg "Fördermitglied werden"

- **360 px: Das Panel läuft rechts aus der Karte.** Überschrift, Text und der
  Button "Zum Fördermitgliedsantrag" enden bei 367 px. Die Seite wird 7 px
  breiter als der Bildschirm und lässt sich seitlich verschieben.
  `frontend/DESIGN.md` (Route Panel) verlangt unter 640 px ein vertikales
  Panel, das in die Karte passt. Bei 768 px und breiter ist das Panel
  korrekt.
  [360](responsive-bestandsaufnahme/screenshots/form-06-supporting-member-360.png),
  [768](responsive-bestandsaufnahme/screenshots/form-06-supporting-member-768.png)

### Weg "Bei #ichbinhier mitmachen (Aktionsgruppe)"

- **360 px: Die Auswahl schneidet den gewählten Text ab.** Das Feld zeigt
  "Bei #ichbinhier mitmache", der Text läuft ohne Auslassungspunkte unter den
  Pfeil. Das Panel selbst passt.
  [360](responsive-bestandsaufnahme/screenshots/form-05-community-360.png)

### Alle Breiten

- **Einwilligung: Tippflächen unter 24 px.** Die Checkbox ist 22 × 22 px, der
  Link "Datenschutzerklärung" 15 px hoch. WCAG 2.2 (2.5.8) verlangt 24 × 24 px
  oder genug Abstand.
  [360](responsive-bestandsaufnahme/screenshots/form-02-category-360.png)

### Ohne Befund

Start, Kategorie gewählt, Fehlermeldungen, Danke-Seite und das geöffnete
Menü sind in allen vier Breiten in Ordnung. Bei 360 und 768 px bleibt die
Leiste "Bewerbung abschicken" am unteren Rand stehen und verdeckt kein
fokussiertes Feld.

Hinweis zu den ganzseitigen Screenshots: Der feste Header und die feste
Absenden-Leiste erscheinen dort mitten in der Seite. Das ist ein Effekt der
Aufnahme, kein Fehler. Die Dateien mit `-viewport` zeigen, was auf dem
Bildschirm steht.

## Dashboard

### Tabellen (Anfragen, Übersicht, Aussortiert, Kategorien)

- **Alle Breiten: Spalten liegen außerhalb des sichtbaren Bereichs.** Die
  Tabellen scrollen in ihrer Karte seitlich. Es gibt keinen Hinweis, dass
  rechts noch Spalten folgen. Sichtbar gegen Gesamtbreite der Anfragen-Tabelle:

  | Breite | sichtbar / gesamt | erste abgeschnittene Spalte |
  |---|---|---|
  | 360 | 300 / 1553 px | E-Mail (nur Name sichtbar) |
  | 768 | 708 / 1561 px | Kategorie |
  | 1024 | 654 / 1561 px | Kategorie |
  | 1440 | 1070 / 1561 px | Status |

  Auch bei 1440 px sind "Eingegangen" und "Zuständig" nur nach seitlichem
  Scrollen zu sehen.
  [360](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-360.png),
  [360 nach rechts gescrollt](responsive-bestandsaufnahme/screenshots/dashboard-10-table-scrolled-right-360-viewport.png),
  [768](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-768.png),
  [1024](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-1024.png),
  [1440](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-1440.png)
- **360 px, Übersicht: Namen brechen hart ab.** "Wayfinder Demo App" endet am
  Kartenrand ohne Auslassungspunkte, weil die Tabelle dort abgeschnitten ist.
  [360](responsive-bestandsaufnahme/screenshots/dashboard-02-overview-360.png)
- **360 px, Kategorien: Aktionen nur per seitlichem Scrollen.** Sichtbar sind
  300 von 631 px. "Im Formular", "Anfragen", Bearbeiten und Löschen liegen
  rechts außerhalb. Ab 768 px passt die Tabelle bis auf 11 px.
  [360](responsive-bestandsaufnahme/screenshots/dashboard-06-categories-360.png),
  [768](responsive-bestandsaufnahme/screenshots/dashboard-06-categories-768.png)
- **Alle Breiten: Tippflächen unter 24 px.** Die Checkboxen der Zeilen sind
  16 × 16 px, der Schalter "Im Formular anzeigen" in der Kategorien-Tabelle
  36 × 20 px, der Button "Passwort anzeigen oder verbergen" bei der Anmeldung
  16 × 16 px. `messwerte.json` nennt für die Checkboxen 13 × 13 px. Das ist
  das versteckte native Feld, nicht das sichtbare Kästchen.

### Anfragen

- **768 und 1024 px: Die Tabs überlappen das Suchfeld.** "Nicht zugewiesen"
  und "Älter als 7 Tage" brechen in zwei Zeilen um und liegen über dem
  Platzhalter "Suche". Bei 360 px stehen Tabs und Suche untereinander, bei
  1440 px nebeneinander, beides ohne Überlappung.
  [768](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-768.png),
  [1024](responsive-bestandsaufnahme/screenshots/dashboard-03-applications-1024.png)

### Dialog "Neue Kategorie"

- **360 px: Der Schalter verdeckt seine Beschriftung.** Der Schalter liegt
  über dem "I" von "Im Formular anzeigen". Ab 768 px stehen beide sauber
  nebeneinander. Die Buttons "Abbrechen" und "Anlegen" liegen bei 360 px unter
  dem Rand und sind erst nach Scrollen im Dialog erreichbar. Das funktioniert,
  der Dialog scrollt.
  [360](responsive-bestandsaufnahme/screenshots/dashboard-07-category-dialog-360-viewport.png),
  [768](responsive-bestandsaufnahme/screenshots/dashboard-07-category-dialog-768-viewport.png)

### Übersicht

- **1024 px: Die Filterzeile bricht in drei Zeilen um.** Suche und
  Kategorie stehen in der ersten Zeile, "Alle Zuständigen" allein in der
  zweiten, "Aussortieren" in der dritten. Bedienbar, aber ungeordnet.
  [1024](responsive-bestandsaufnahme/screenshots/dashboard-02-overview-1024.png)

### Ohne Befund

Anmeldung, Detailansicht einer Anfrage (bei 360 und 768 px als Panel über die
ganze Höhe), Filter-Popover, Aussortiert-Liste und das Menü sind bedienbar.
Unter 1024 px ersetzt ein Menü-Button die Seitenleiste. Ab 1024 px bleibt die
Seitenleiste beim Scrollen stehen. Sie ist 310 px breit und nimmt bei 1024 px
fast ein Drittel der Breite ein, was die Tabellen zusätzlich verengt.

## Dateien

- [`screenshots/`](responsive-bestandsaufnahme/screenshots/): 56 ganzseitige
  Aufnahmen (`<app>-<zustand>-<breite>.png`) und 16 Aufnahmen nur des
  Bildschirms (`…-viewport.png`).
- [`messwerte.json`](responsive-bestandsaufnahme/messwerte.json): je
  ganzseitiger Aufnahme Dokumentbreite, seitlich scrollende Container,
  abgeschnittene Texte und Bedienelemente unter 24 px.
- [`scripts/`](responsive-bestandsaufnahme/scripts/): `login.mjs` meldet sich
  an und speichert die Sitzung, `capture.mjs` macht die ganzseitigen
  Aufnahmen, `extra.mjs` die Bildschirm-Aufnahmen, `dialog.mjs`,
  `measure-details.mjs` und `checkbox-sizes.mjs` die Einzelmessungen. Sie
  brauchen `playwright-core` und erwarten den zu maskierenden Namen in
  `MASK_NAME`.
