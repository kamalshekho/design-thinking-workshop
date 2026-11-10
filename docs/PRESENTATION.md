# Präsentation am 16.11.2026

Gemeinsame Präsentation von Kamal, Bohdan und Ilias: 15 Minuten Vortrag, danach
5 Minuten Fragen. Bewertet wird nach dem Bewertungsbogen der Handelskammer
(#80). Die Präsentation ist eine Übung für die echte Prüfung. Dieses Dokument
hält fest, was das Team am 10.11. entschieden hat.

Stand des Codes: `main` am 10.11.2026.

## 1. Zielgruppe

Der Lehrer und die Klasse, als IT-Fachpublikum. Sie kennen die Aufgabe des
letzten Blocks: einen Verein finden, sein Problem verstehen und eine Lösung für
ihn entwickeln. Der Verein "Ich bin hier e.V." ist der Kunde in dieser
Geschichte, nicht das Publikum.

Die Zielgruppe steht auf der Folie "Gliederung", damit der Bewerter den Punkt
"Inhalt passt zur Zielgruppe" daran messen kann.

Daraus folgt:

- UML, Architektur, Lösungsvergleich und Refactoring kommen fachlich und ohne
  Umweg auf die Folien.
- Zahlen, die wir nicht vom Verein haben, stehen auf der Folie als Annahme, zum
  Beispiel `A3` (rund 1.000 Mails) und `A5` (vier von fünf wollen in die
  Community).

## 2. Roter Faden

Die Präsentation folgt den Phasen des Design Thinking, so wie die Aufgabe
aufgebaut war:

1. **Verstehen:** der Verein und sein Problem (`C2`). Der Ist-Prozess per Mail
   steht nur als ein Satz auf der Folie, das Diagramm liegt in `docs/` (#74).
2. **Definieren:** zwei Probleme in einem Satz, Auffindbarkeit und Kapazität.
   Daraus folgen die zwei Wege Community und Vereinsarbeit (`A5`).
3. **Ideen:** die Disney-Methode und was davon übrig blieb.
4. **Prototyp:** Soll-Prozess, MVP, Architektur, Lösungsvergleich, Refactoring.
5. **Testen:** der Verein hat sich gemeldet und bekommt einen Link zum MVP
   (`C1`). Dazu eine Zeile zu den automatischen Tests.

## 3. MVP

Grundlage ist der Scope in [`DISNEY.md`](./DISNEY.md), Abschnitt "What
survives". Das MVP ist kleiner. Auf der Folie zeigt ein
UML-Anwendungsfalldiagramm, was fertig ist. Daneben steht, was nicht dabei ist,
eine Zeile pro Punkt.

### Fertig

- **Formular auf Deutsch.** Das erste Feld trennt die Routes: _Community_ und
  _Supporting member_ enden in einem Hinweis mit externem Link, ohne dass eine
  Application entsteht. Für Vereinsarbeit wählt der Bewerber eine Category, die
  das Backend liefert (`A5`, `A7`).
- **Sofortige Bestätigungsmail** über Resend nach jeder Application (`A8`). Sie
  nennt die Category, aber noch keinen konkreten nächsten Schritt.
- **Dashboard** mit Sign-in, Übersicht mit Kennzahlen und Verlauf, Liste der
  Applications mit Suche und Filter, Status nach `A9`, Owner und internen
  Notizen.
- **Categories verwalten:** anlegen, umbenennen, sortieren.
- **Papierkorb:** Applications verwerfen, wiederherstellen und endgültig
  löschen.
- **Live-Aktualisierung** im Dashboard über Server-Sent Events
  ([ADR-0004](./adr/0004-server-sent-events-for-the-dashboard.md)).
- **Betrieb mit Docker Compose:** PostgreSQL, Spring-Boot-Backend, Formular und
  Dashboard. Formular und Dashboard liefert je ein nginx aus, das `/api` an das
  Backend weiterleitet.

### Nicht dabei

Aus dem Scope in `DISNEY.md`, aber nicht gebaut:

- E-Mail-Eingang: Abruf des Postfachs und Antwort mit Verweis auf das
  Formular.
- Backlog-Modus für die rund 1.000 alten Mails (`A3`).
- Buchung der Intro sessions über das Formular (`A10`).
- Konkreter nächster Schritt in der Bestätigungsmail (`A8`). Er fehlt, weil es
  für Intro sessions noch kein Datenmodell gibt.
- Tags an Applications.
- Peer onboarder als Rolle im Datenmodell (`A11`).

Bewusst ausgeschlossen, schon in `DISNEY.md`: WhatsApp und Direktnachrichten,
automatische Antworten auf Fragen, Empfehlungen und Anmeldung bei
Veranstaltungen, Zuordnung zu Mentoren, Produktivbetrieb und eine Freigabe nach
DSGVO.

## 4. Ablauf und Sprecher

Die Zeiten summieren sich auf 14:15, die übrigen 45 Sekunden sind für die zwei
Übergaben. Wer einen Teil vorträgt, bereitet auch dessen Folien und Material
vor.

| # | Teil | Inhalt | Zeit | Sprecher |
|---|---|---|---|---|
| 1 | Einstieg | Titel, Gliederung, Zielgruppe | 0:45 | Kamal |
| 2 | Verstehen | Verein, Problem `C2`, rund 1.000 Mails `A3` | 1:00 | Kamal |
| 3 | Definieren und Ideen | Auffindbarkeit und Kapazität, zwei Wege `A5`, Disney-Methode | 1:30 | Kamal |
| 4 | Soll-Prozess | UML-Aktivitätsdiagramm von der Bewerbung bis zum Onboarding | 1:30 | Kamal |
| 5 | Prototyp | Video, MVP als UML-Anwendungsfalldiagramm, daneben was nicht dabei ist | 1:45 | Ilias |
| 6 | Architektur | UML-Verteilungsdiagramm: Formular, Dashboard, nginx, Backend, PostgreSQL, REST, SSE | 1:30 | Ilias |
| 7 | Lösungen verglichen | ADR-0002 und ADR-0004, jeweils Alternativen und Begründung | 1:30 | Ilias |
| 8 | Refactoring | Umgesetzte Refactorings und Kandidaten mit Design Pattern | 1:15 | Bohdan |
| 9 | Refactoring C2 | Code vorher und nachher, Datenbankzugriffe 2n auf 2 | 1:30 | Bohdan |
| 10 | Testen | Verein bekommt den MVP-Link, automatische Tests | 0:45 | Bohdan |
| 11 | Wirtschaftlichkeit | Kosten und Nutzen für den Verein, Ausblick auf andere Vereine | 0:45 | Bohdan |
| 12 | Fazit | Was steht, was offen ist | 0:30 | Bohdan |

## 5. Demo

Keine Live-Demo. Ein Video von 20 bis 30 Sekunden ohne Ton zeigt eine Szene:
eine Application wird im Formular abgeschickt und erscheint ohne Neuladen im
Dashboard. Ilias erstellt es. Das Video ist in die Folien eingebettet und liegt
als MP4 auf dem USB-Stick. Am Montag braucht der Laptop nur die Folien und das
Video, keinen laufenden Compose-Stack.

## 6. Einzelne Folien

**Wirtschaftlichkeit.** Der Verein ist gemeinnützig, ein Geschäftsmodell für
ihn passt nicht. Die Folie stellt die Kosten für den Verein (Hosting pro Monat)
der eingesparten Arbeitszeit der Mitarbeitenden gegenüber. Als Ausblick folgt
dieselbe Lösung als Dienst für andere kleine Vereine (#75). Neue Zahlen kommen
zuerst als Annahme mit ID in [`ASSUMPTIONS.md`](./ASSUMPTIONS.md).

**Testen.** Neben dem Link für den Verein eine Zeile zu den automatischen Tests.
Im Code gezählt am 10.11.: 64 Testfälle im Backend, 76 im Formular und 181 im
Dashboard.
