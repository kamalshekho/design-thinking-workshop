# Architektur

UML-Verteilungsdiagramm der Plattform, so wie
[`docker-compose.yml`](../docker-compose.yml) sie startet.

![Verteilungsdiagramm](./diagrams/deployment.svg)

- Formular und Dashboard sind zwei getrennte React-Anwendungen
  ([ADR-0002](./adr/0002-dashboard-as-separate-application.md)). Jede liefert
  ein eigener nginx-Container aus, das Formular auf Port 8081, das Dashboard
  auf Port 8082.
- Jeder nginx leitet `/api` an das Backend weiter. Seite und API kommen so vom
  selben Origin, CORS entfällt.
- Neue Applications und State changes erreichen das Dashboard über
  Server-Sent Events
  ([ADR-0004](./adr/0004-server-sent-events-for-the-dashboard.md)). Der
  dashboard-nginx puffert `/api/v1/staff/events` nicht und hält die Verbindung
  bis zu einer Stunde offen.
- Backend und PostgreSQL sind nur im Compose-Netz erreichbar und haben keinen
  Port nach außen. Die Daten liegen im Volume `db-data`.
- Das Backend schickt die Bestätigungsmail über die HTTP-API von Resend. Ohne
  `RESEND_API_KEY` verschickt es nichts und schreibt nur Empfänger und Betreff
  ins Log.

Die Verbindungen zwischen Browser und nginx laufen im Prototyp über HTTP. TLS
käme erst mit einem Produktivbetrieb, der nicht zum MVP gehört.

## Diagramm neu erzeugen

Quelle ist [`diagrams/deployment.puml`](./diagrams/deployment.puml). Lokal ist
kein Java nötig, PlantUML läuft im Container:

```sh
cd docs/diagrams
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/data -w /data \
  plantuml/plantuml -tsvg deployment.puml
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/data -w /data \
  plantuml/plantuml -tpng -Sdpi=200 deployment.puml
```

Die PNG-Datei ist für die Folien gedacht, die SVG-Datei für dieses Dokument.
