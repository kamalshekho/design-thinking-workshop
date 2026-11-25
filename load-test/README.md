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

## Stress- und Spike-Tests (#198)

Drei weitere Skripte suchen die Grenzen der Anwendung. Die Ergebnisse stehen
in [`RESULTS.md`](./RESULTS.md).

| Skript | Was es misst |
| --- | --- |
| `form.js` | Kategorien laden, dann eine Bewerbung senden, jede mit neuer `submissionId` und neuer Adresse |
| `dashboard.js` | Bewerbungsliste, Kategorien und Änderungen, wie das Dashboard sie lädt |
| `events.js` | viele offene Live-Streams gleichzeitig, dazu eine Messung, ob lesende Anfragen schnell bleiben |

`TEST_TYPE` wählt die Form der Last für `form.js` und `dashboard.js`:
`smoke` (ein Nutzer, 30 s), `stress` (in vier Stufen bis `RATE` Iterationen
pro Sekunde) oder `spike` (in 10 s von `RATE / 20` auf `RATE`). `events.js`
nimmt stattdessen `STREAMS` (Zahl der Streams) und `HOLD` (wie lange jeder
offen bleibt). Load und Soak fehlen, bis es eine Annahme zur erwarteten Last
gibt.

### Eigener Stack

Diese Tests schreiben Zehntausende Bewerbungen. Sie laufen deshalb nie gegen
den Demo-Stack, sondern gegen einen eigenen Stack mit eigener Datenbank, ohne
Ports auf dem Rechner. Dafür eine eigene Env-Datei mit neuen Passwörtern
außerhalb des Repos anlegen, mit leerem `RESEND_API_KEY` und
`SPRING_PROFILES_ACTIVE=demo`, und dann:

```sh
docker compose -p dtw-load -f docker-compose.yml -f load-test/compose.load.yml \
  --env-file ../load.env up -d --build --wait
```

`compose.load.yml` braucht Docker Compose 2.24 oder neuer (`!reset`).

### Starten

k6 läuft als Container im Netz des Stacks, eine Installation ist nicht nötig:

```sh
docker run --rm --network dtw-load_default -v "$PWD/load-test":/scripts:ro \
  -e BASE_URL=http://backend:8080 -e TEST_TYPE=stress -e RATE=800 \
  grafana/k6 run /scripts/form.js
```

- `form.js` gegen `http://backend:8080` misst das Backend. Gegen
  `http://frontend:8080` greift die Grenze von nginx (zehn Bewerbungen pro
  Adresse sofort, dann eine pro Minute); dafür `EXPECT_LIMIT=1` setzen, damit
  429 als erwartete Antwort zählt.
- `dashboard.js` und `events.js` laufen gegen `http://dashboard:8080` und
  brauchen `STAFF_PASSWORD` (und optional `STAFF_EMAIL`) eines Teammitglieds
  aus der Env-Datei des Stacks.

Danach den Stack mit seinen Daten entfernen:

```sh
docker compose -p dtw-load -f docker-compose.yml -f load-test/compose.load.yml \
  --env-file ../load.env down -v
```
