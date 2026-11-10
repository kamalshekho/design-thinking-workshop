# Präsentation am 16.11.2026

Gemeinsame Präsentation von Kamal, Bohdan und Ilias: 15 Minuten Vortrag, danach
5 Minuten Fragen. Bewertet wird nach dem Bewertungsbogen der Handelskammer
(#80). Dieses Dokument hält die drei Entscheidungen fest, die bis Mittwoch,
11.11., stehen müssen. Inhalte und Folien folgen ab Donnerstag.

Stand des Codes: `main` am 10.11.2026.

## 1. Zielgruppe der Präsentation

Entwickler, die das Projekt übernehmen und weiterführen.

Daraus folgt, was auf die Folien kommt:

- Das Produkt bekommt zwei Minuten. Die Zuhörer müssen verstehen, wofür der
  Code da ist, aber nicht vom Problem überzeugt werden.
- Architektur, Entscheidungen und Refactoring tragen den Hauptteil. Zu jeder
  Entscheidung gehören die verworfene Alternative und der Grund dafür, weil ein
  Nachfolger genau das braucht, um sie nicht versehentlich rückgängig zu machen.
- Bekannte Schulden werden offen genannt, zum Beispiel die Befunde aus #79. Ein
  Nachfolger soll wissen, wo er anfängt.
- Zielgruppe und Wirtschaftlichkeit des Produkts bekommen nur eine Folie, wie
  die Aufgabe es verlangt.

## 2. MVP

Grundlage ist der Scope in [`DISNEY.md`](./DISNEY.md), Abschnitt "What
survives". Das MVP ist kleiner als dieser Scope. Die Abweichungen stehen unten
unter "Nicht dabei" und gehören auf die MVP-Folie, damit die Frage "was ist aus
dem Backlog-Modus geworden?" nicht erst in der Fragerunde kommt.

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

### Geplant bis zur Präsentation

- Refactoring C2 in `DashboardCategoryController`, Datenbankzugriffe von 2n auf
  2 (#76, #80).
- `docs/REFACTORING.md` mit den umgesetzten Refactorings und den Kandidaten C1
  bis C7 (#76, #80).
- Ist- und Soll-Prozess als UML-Aktivitätsdiagramm (#74).
- MVP-Kriterien und Geschäftsmodell in `docs/BUSINESS.md` (#75).

Die übrigen Punkte aus #77, #78 und #79 sind nicht Teil des MVP. Sie stehen auf
der Fazit-Folie als nächste Schritte für Nachfolger.

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

## 3. Gliederung und Zeitplan

Jeder spricht rund fünf Minuten. Die Zeiten summieren sich auf 14:15, die
übrigen 45 Sekunden sind für die Übergaben. Die Sprecher folgen den Rollen aus
dem Team Canvas in [`CASE.md`](./CASE.md): Kamal als Product Owner, Bohdan für
das Backend, Ilias für Frontend und DevOps.

| # | Teil | Folien | Zeit | Sprecher |
|---|---|---|---|---|
| 1 | Einstieg | Titel, Gliederung, Zielgruppe der Präsentation | 0:45 | Kamal |
| 2 | Produkt | Problem (`C2`, `A3`), Lösung, zwei Screenshots | 2:15 | Kamal |
| 3 | MVP | Fertig, geplant, nicht dabei | 1:45 | Kamal |
| 4 | Soll-Prozess | UML-Aktivitätsdiagramm von der Bewerbung bis zum Onboarding | 1:30 | Bohdan |
| 5 | Architektur | UML-Verteilungsdiagramm: Formular, Dashboard, nginx, Backend, PostgreSQL, REST, SSE | 1:45 | Bohdan |
| 6 | Lösungen verglichen | ADR-0002 und ADR-0004, jeweils Alternativen und Begründung | 1:30 | Bohdan |
| 7 | Refactoring | Umgesetzte Refactorings und Kandidaten mit Design Pattern | 1:15 | Ilias |
| 8 | Refactoring C2 | Code vorher und nachher, Datenbankzugriffe 2n auf 2 | 2:00 | Ilias |
| 9 | Zielgruppe und Wirtschaftlichkeit | Wer profitiert, mögliches Geschäftsmodell (#75) | 1:00 | Ilias |
| 10 | Fazit | Was steht, was offen ist, wo ein Nachfolger anfängt | 0:30 | Ilias |

Die Demo läuft nicht innerhalb der 15 Minuten. Eine Live-Demo frisst bei einer
Panne die Zeit eines ganzen Teils. Die Screenshots in Teil 2 zeigen das
Produkt; der Compose-Stack läuft trotzdem, damit wir in der Fragerunde live
zeigen können, wenn jemand fragt.
