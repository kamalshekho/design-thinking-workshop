# Einfacher Lasttest mit k6

Der Test ruft die öffentliche Kategorienliste über das Formular auf (`A31`).
Dabei prüft er den Weg vom lokalen Webserver über das Backend bis zur
Datenbank. Er sendet keine Bewerbung, ändert keine Daten und verschickt keine
E-Mail.

## Starten

1. Die Anwendung im Projektverzeichnis starten: `docker compose up -d --build`.
2. Prüfen, dass das Formular unter <http://localhost:8081> erreichbar ist.
3. Im Projektverzeichnis `k6 run load-test/categories.js` ausführen.

k6 muss auf dem Rechner installiert sein. Die URL ist absichtlich auf
`localhost` festgelegt. Der Test ist für die lokale Umgebung gedacht.

## Was passiert?

Der Test steigert die Last innerhalb von fünf Sekunden auf zehn virtuelle
Nutzer. Diese senden ungefähr eine Anfrage pro Sekunde und warten anschließend
jeweils eine Sekunde. Nach 20 Sekunden wird die Last innerhalb von fünf
Sekunden wieder reduziert. Diese Größen sind Testannahmen und keine gemessenen
Nutzerzahlen (`A31`).

Der Test überprüft, ob jede Antwort den Status 200 und eine Kategorienliste
enthält. Er scheitert außerdem, wenn mindestens ein Prozent der HTTP-Anfragen
fehlschlägt oder wenn das 95. Perzentil der Antwortzeit eine Sekunde erreicht
oder überschreitet (`A31`). Das 95. Perzentil bedeutet: 95 Prozent der
Anfragen dauerten höchstens so lange wie der angezeigte Wert.

## Was beweist der Test?

Er zeigt das Ergebnis für diese Abfrage, diese Datenmenge, diesen Rechner und
diesen Zeitpunkt. Virtuelle Nutzer sind keine gleichzeitig aktiven Menschen;
die tatsächliche Anfragerate steht im Ergebnis unter `http_reqs`. Der Test
misst weder das Absenden einer Bewerbung noch den Mailversand, das Dashboard,
Browserdarstellung oder die Kapazität eines echten Servers im Internet.

## Beispielergebnis vom 25. November 2026

Beim lokalen Lauf mit k6 2.3.0 wurden 255 Anfragen ausgeführt (`A31`). Keine
HTTP-Anfrage schlug fehl, und alle 510 Prüfungen bestanden. Das 95. Perzentil
der Antwortzeit lag bei 15,94 Millisekunden. Die mittlere Anfragerate lag bei
etwa 8,4 Anfragen pro Sekunde. Dieses Ergebnis gehört zu genau diesem lokalen
Lauf und ist keine Zusage für einen produktiven Betrieb.
