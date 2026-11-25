# Ergebnisse der Lasttests

Lauf am 25.11.2026 gegen einen eigenen Compose-Stack (`dtw-load`, siehe
`README.md`) mit den Demo-Daten und leerem `RESEND_API_KEY`. k6 und der Stack
liefen auf demselben Rechner: 22 Kerne, 15 GB RAM, WSL 2, keine Grenzen für
CPU oder Speicher der Container. Die Zahlen gelten für diesen Rechner und
sagen nichts über einen Server im Internet.

Eine erwartete Last gibt es noch nicht, weil die Zahl der Anfragen unbekannt
ist (`A4`). Deshalb liefen nur Smoke, Stress und Spike. Load und Soak brauchen
diese Annahme (#198).

## Kurzfassung

| Szenario | Vorher | Nachher |
| --- | --- | --- |
| Formular direkt, Stress bis 800 Iterationen/s | ab etwa 155 Bewerbungen/s Stau, p95 4,14 s, 79.602 verworfene Iterationen | p95 8,88 ms, 381 Bewerbungen/s im Mittel, 14 verworfene Iterationen |
| Formular direkt, Spike auf 300 Iterationen/s | p95 839,68 ms, 482 verworfene Iterationen | p95 11,24 ms, keine verworfenen Iterationen |
| Dashboard, Stress bis 800 Iterationen/s (2.400 Anfragen/s) | 50,46 % Fehler (502), p95 1,15 s | 0 % Fehler, p95 4,03 ms |
| Live-Updates, 1.000 offene Streams | 1.244 JVM-Threads, 740 MB RSS | 76 JVM-Threads, 507 MB RSS |

Keiner der Läufe nach den Änderungen hat eine Grenze erreicht. Wo die neue
Grenze liegt, ist nicht gemessen.

## Überblick

Der Test lief über denselben Weg wie im Betrieb: von k6 über nginx zum Backend
und weiter zu PostgreSQL. An jeder der drei Stationen fand er einen Engpass.
Die gestrichelten Linien zeigen, wo er saß; die Kästen darunter nennen Symptom
und Lösung.

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 300, "nodeSpacing": 40, "rankSpacing": 55}}}%%
flowchart TB
    k6["<b>k6</b><br/>simulierte Bewerbungen und Dashboard-Aufrufe"]
    dash["<b>1.000 Dashboards</b><br/>mit offenem Live-Stream"]

    subgraph stack[" "]
        direction LR
        nginx["<b>nginx</b><br/>Proxy für /api/"]
        backend["<b>Backend</b><br/>Spring Boot"]
        db[("<b>PostgreSQL</b><br/>Tabelle applications")]
        nginx --> backend --> db
    end

    k6 --> nginx
    dash --> nginx

    e2["<b>nginx ohne Keepalive</b><br/>ab 600 Anfragen/s: 50 % Antworten 502<br/><i>Lösung:</i> upstream mit keepalive 32"]
    e3["<b>ein Thread pro Live-Stream</b><br/>1.000 Streams: 1.244 Threads<br/><i>Lösung:</i> ein Scheduler für alle Heartbeats"]
    e1["<b>Grenze pro Adresse ohne Index</b><br/>ab 155 Bewerbungen/s: p95 4,14 s<br/><i>Lösung:</i> Index auf upper(email), submitted_at"]

    nginx -.- e2
    backend -.- e3
    db -.- e1

    classDef part fill:#eef3fb,stroke:#3b6db3,color:#1b2f4d
    classDef finding fill:#fff4e5,stroke:#d4841f,color:#5a3a0e
    class k6,dash,nginx,backend,db part
    class e1,e2,e3 finding
    style stack fill:#fafbfc,stroke:#8a96a3,stroke-dasharray:4 3
    linkStyle 4,5,6 stroke:#d4841f,stroke-width:2px
```

## Engpässe und Änderungen

### Grenze pro Adresse ohne Index

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 260}}}%%
flowchart LR
    subgraph before["Vorher"]
        direction TB
        b1["POST /api/v1/applications"] --> b2["Grenze pro Adresse prüfen<br/>upper(email) = upper(?)"]
        b2 --> b3["<b>Seq Scan</b><br/>liest alle 74.899 Zeilen<br/>54,6 ms pro Bewerbung"]
        b3 --> b4["10 Verbindungen / 54 ms<br/>= höchstens 185 Bewerbungen/s<br/><b>p95 4,14 s</b>"]
    end
    subgraph after["Nachher"]
        direction TB
        a1["POST /api/v1/applications"] --> a2["Grenze pro Adresse prüfen<br/>upper(email) = upper(?)"]
        a2 --> a3["<b>Index Scan</b><br/>ix_applications_upper_email_submitted_at<br/>0,33 ms pro Bewerbung"]
        a3 --> a4["Grenze bei 800 Iterationen/s nicht erreicht<br/><b>p95 8,88 ms</b>"]
    end
    before ==>|"ApplicationEmailIndexMigration<br/>legt den Index beim Start an"| after

    classDef bad fill:#fdecea,stroke:#c0392b,color:#6e1f17
    classDef good fill:#e8f6ec,stroke:#1e8449,color:#14482a
    classDef plain fill:#f4f6f8,stroke:#8a96a3,color:#2b3540
    style before fill:#fffafa,stroke:#c0392b
    style after fill:#f8fdf9,stroke:#1e8449
    class b1,b2,a1,a2 plain
    class b3,b4 bad
    class a3,a4 good
```

Vor jeder Bewerbung zählt das Backend die Bewerbungen derselben Adresse aus
den letzten 24 Stunden (`A26`). Spring Data erzeugt dafür
`upper(email) = upper(?)`, und dafür gab es keinen Index. PostgreSQL las bei
jeder Bewerbung die ganze Tabelle:

- vorher: `Seq Scan`, 74.899 Zeilen verworfen, 54,6 ms pro Abfrage
- nachher: `Index Scan using ix_applications_upper_email_submitted_at`, 0,33 ms

Mit 10 Verbindungen im Hikari-Pool ergibt das höchstens 10 / 0,054 s ≈ 185
Bewerbungen pro Sekunde, und die Grenze sinkt mit jeder neuen Zeile. Gemessen
waren etwa 155 pro Sekunde. Die CPU des Backends lag dabei unter einem Kern.

Änderung: `ApplicationEmailIndexMigration` legt beim Start den Index
`(upper(email), submitted_at)` an, nach dem Schema-Update von Hibernate.
Hibernate kann keinen Index auf einen Ausdruck deklarieren. Auf H2 in den Tests
passiert nichts, wie bei `ApplicationStatusConstraintMigration`.

Beide Stress-Läufe begannen mit etwa 20.000 Bewerbungen in der Tabelle, beide
Spike-Läufe mit 13.

### nginx ohne Keepalive zum Backend

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 260}}}%%
flowchart LR
    subgraph before["Vorher"]
        direction TB
        b1["Anfrage an /api/"] --> b2["nginx öffnet<br/><b>neue TCP-Verbindung</b>"]
        b2 --> b3["Verbindung bleibt nach dem Schließen<br/>60 s in TIME_WAIT"]
        b3 --> b4["ab ca. 600 Anfragen/s<br/>keine lokalen Ports mehr frei"]
        b4 --> b5["<b>502 Bad Gateway</b><br/>50,46 % aller Antworten"]
    end
    subgraph after["Nachher"]
        direction TB
        a1["Anfrage an /api/"] --> a2["nginx nimmt eine<br/><b>offene Verbindung</b> aus dem Pool"]
        a2 --> a3["upstream backend_api<br/>keepalive 32"]
        a3 --> a4["<b>0 % Fehler</b><br/>2.400 Anfragen/s, p95 4,03 ms"]
    end
    before ==>|"upstream-Block und<br/>Connection &quot;&quot; in beiden nginx.conf"| after

    classDef bad fill:#fdecea,stroke:#c0392b,color:#6e1f17
    classDef good fill:#e8f6ec,stroke:#1e8449,color:#14482a
    classDef plain fill:#f4f6f8,stroke:#8a96a3,color:#2b3540
    style before fill:#fffafa,stroke:#c0392b
    style after fill:#f8fdf9,stroke:#1e8449
    class b1,a1 plain
    class b2,b3,b4,b5 bad
    class a2,a3,a4 good
```

nginx öffnete für jede Anfrage eine neue TCP-Verbindung zum Backend. Ab etwa
600 Anfragen pro Sekunde lagen so viele geschlossene Verbindungen in
`TIME_WAIT`, dass keine lokalen Ports mehr frei waren:

```
connect() to 172.26.0.3:8080 failed (99: Address not available) while connecting to upstream
```

163.720 von 324.421 Anfragen bekamen 502. Das Backend selbst war dabei nicht
ausgelastet.

Änderung: Beide `nginx.conf` leiten `/api/` über einen `upstream` mit
`keepalive 32` weiter und setzen `Connection ""`. Danach: 405.001 Anfragen,
alle mit 200.

### Ein Thread pro Live-Stream

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 260}}}%%
flowchart LR
    subgraph before["Vorher"]
        direction TB
        subgraph bstreams[" "]
            direction LR
            bs1["Stream 1"] ~~~ bs2["Stream 2"] ~~~ bs3["… Stream 1.000"]
        end
        subgraph bthreads[" "]
            direction LR
            bt1["Thread 1"] ~~~ bt2["Thread 2"] ~~~ bt3["… Thread 1.000"]
        end
        bstreams -->|"je Stream ein eigener Thread,<br/>der 20 s schläft und dann schreibt"| bthreads
        bthreads --> bsum["<b>1.244 JVM-Threads</b><br/>740 MB Speicher"]
    end
    subgraph after["Nachher"]
        direction TB
        sch["<b>ein Scheduler-Thread</b><br/>alle 20 s"]
        subgraph streams[" "]
            direction LR
            as1["Stream 1"] ~~~ as2["Stream 2"] ~~~ as3["… Stream 1.000"]
        end
        sch -->|"schreibt den Heartbeat<br/>an alle Streams"| streams
        streams --> asum["<b>76 JVM-Threads</b><br/>507 MB Speicher"]
    end
    before ==>|"ApplicationEventStream:<br/>ScheduledExecutorService statt<br/>Thread pro Verbindung"| after

    classDef bad fill:#fdecea,stroke:#c0392b,color:#6e1f17
    classDef good fill:#e8f6ec,stroke:#1e8449,color:#14482a
    classDef plain fill:#f4f6f8,stroke:#8a96a3,color:#2b3540
    style before fill:#fffafa,stroke:#c0392b
    style bstreams fill:none,stroke:none
    style bthreads fill:none,stroke:none
    style streams fill:none,stroke:none
    style after fill:#f8fdf9,stroke:#1e8449
    class bs1,bs2,bs3,as1,as2,as3 plain
    class bt1,bt2,bt3,bsum bad
    class sch,asum good
```

Jeder geöffnete Stream auf `/api/v1/staff/events` startete einen eigenen
Plattform-Thread, der alle 20 Sekunden den Heartbeat schrieb. 1.000 offene
Dashboards hielten 1.244 Threads im Backend. Eine Obergrenze für Streams gibt
es nicht.

Änderung: Ein einzelner Scheduler-Thread schreibt den Heartbeat an alle
offenen Streams. Der erste Heartbeat geht weiter sofort beim Öffnen raus, die
folgenden alle 20 Sekunden (ADR 0004). Lesende Anfragen blieben in beiden
Läufen schnell: p95 11,06 ms vorher, 9,46 ms nachher.

## Offen

- **Bewerbungsliste ohne Seiten.** `GET /api/v1/staff/applications` liefert
  alle Bewerbungen auf einmal. Bei 74.899 Zeilen dauerte die Antwort für einen
  einzelnen Nutzer im Mittel 831 ms. Mit den 13 Demo-Bewerbungen sind es 4 ms.
  Das ganze Postfach des Vereins hat etwa tausend E-Mails aller Art (`A3`),
  Bewerbungen sind nur ein Teil davon. Zehntausende Bewerbungen sind also weit
  weg, deshalb ist das hier nur notiert.
- **Load und Soak** warten auf eine Annahme zur erwarteten Last.
- **Mailversand.** Seit #195 schickt das Backend die Bestätigung bei jeder
  Bewerbung synchron per SMTP oder Resend, im selben Request. Der Lasttest
  schaltet den Versand ab (`compose.load.yml`), misst ihn also nicht. Mit
  echtem Versand hängt die Grenze für Bewerbungen vom Mailserver ab.
- **Grenze pro Adresse über nginx.** Durch das Formular kommen von einer
  Adresse zehn Bewerbungen sofort, danach eine pro Minute, alle weiteren
  bekommen 429. Ein Lasttest durch nginx misst deshalb nur diese Grenze; die
  Kapazität des Backends misst `form.js` direkt gegen `backend:8080`.

## Messartefakte

In jedem Lauf zeigt k6 ein negatives `min` und ein `max` von etwa 30 s bei
`http_req_duration`. Beides kommt von Zeitsprüngen der Uhr in WSL, nicht vom
Backend: Die Werte treten vor und nach den Änderungen gleich auf und betreffen
einzelne Anfragen. Die p95-Werte oben sind davon nicht betroffen.
