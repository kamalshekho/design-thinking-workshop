# Prozess der Bewerbungsannahme

## Ist-Prozess

Heute schreibt ein Interessent eine Mail an das allgemeine Postfach des Vereins.
Dort liegt sie zwischen rund 1.000 anderen Mails (`A3`) und ist für die
Mitarbeitenden kaum auffindbar (`C2`). Eine automatische Antwort gibt es nicht,
der Interessent hört oft wochenlang nichts (`A8`). Die Beschreibung in
nummerierten Schritten und als Diagramm steht noch aus (#74).

## Soll-Prozess

UML-Aktivitätsdiagramm von der Bewerbung bis zum Onboarding. Die Status folgen
`A9` und heißen so wie in der Oberfläche des Dashboards. Graue Schritte sind im
MVP noch nicht gebaut.

![Soll-Prozess](./diagrams/soll-process.svg)

- **Bewerber.** Das erste Feld des Formulars trennt drei Wege. Community und
  Fördermitglied enden bei einem externen Link und kosten die Mitarbeitenden
  keine Zeit. Wenn `A5` stimmt, sind das vier von fünf Interessenten. Nur
  Vereinsarbeit erzeugt eine Anfrage.
- **Plattform.** Die Anfrage wird mit dem Status "Neu" gespeichert. Gleichzeitig
  geht die Bestätigungsmail raus, und die Anfrage erscheint ohne Neuladen im
  Dashboard ([ADR-0004](./adr/0004-server-sent-events-for-the-dashboard.md)).
  Den Termin der nächsten Info-Runde nennt die Mail noch nicht, weil es für
  Info-Runden kein Datenmodell gibt.
- **Mitarbeitende.** Wer eine Anfrage übernimmt, setzt sich als zuständig und
  den Status auf "In Prüfung". Danach führt die Anfrage zu "Info-Runde gebucht"
  und "Aktiv", zu "Warteliste" oder zu "Abgelehnt". Die Info-Runde alle zwei
  Wochen ist unsere Annahme (`A10`). Sie findet außerhalb der Plattform statt.

Das Backend prüft die Statusübergänge heute nicht, jeder Übergang ist erlaubt
(#78). Das Diagramm zeigt den gedachten Weg, nicht eine Regel im Code.

Die Quelle ist [`diagrams/soll-process.puml`](./diagrams/soll-process.puml). Zum
Rendern wird die PNG-Datei wegen ihrer Breite mit
`-e PLANTUML_LIMIT_SIZE=8192` erzeugt.
