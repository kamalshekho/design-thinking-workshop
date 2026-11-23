# E2E mit Playwright gegen den Compose-Stack in CI

Recherche zu #105, Teil der Karte #100. Stand 2026-11-23. Das Dokument sammelt
Fakten und Optionen. Es entscheidet nichts; die Entscheidung trifft ein
späteres HITL-Ticket. Den Stack habe ich für diese Recherche nicht gestartet,
alle Aussagen über das Verhalten stammen aus dem Code im Repo und aus den
verlinkten Quellen.

## Frage

Wie läuft ein E2E-Test mit Playwright gegen den `docker compose`-Stack in
GitHub Actions? Zu klären sind Start und Bereitschaft, Passwörter und Seeding,
ein Durchlauf vom Bewerbungsformular bis ins Dashboard, Laufzeit und Caching,
mehrere Viewports, axe im selben Lauf, der Ort des Projekts im Repo und die
Artefakte.

## Kurzfassung

- `docker compose up --wait` wartet, bis die Dienste laufen oder gesund sind
  ([Compose up](https://docs.docker.com/reference/cli/docker/compose/up/)).
  Alle vier Dienste haben schon einen Healthcheck.
- Der Backend-Healthcheck fragt `/actuator/health`. In Spring Boot 4.1.1 zählt
  der Readiness-Zustand dort mit, und der wird erst nach den Seedern `UP`.
  Ein gesundes Backend hat die Staff-Konten also schon geschrieben. Das ist aus
  dem Quellcode abgeleitet und im ersten CI-Lauf zu bestätigen.
- Das bekannte 401 `INVALID_CREDENTIALS` entsteht, wenn ein Test nur auf
  Formular oder Dashboard wartet. Beide nginx-Dienste hängen nur mit
  `service_started` am Backend und sind früher gesund.
- Die Passwörter lassen sich pro Lauf erzeugen und maskieren. Für Pull
  Requests aus Forks gibt es dann keine fehlenden Secrets.
- WebKit auf Linux schickt das `Secure`-Cookie nicht über `http://localhost`.
  Mobile Projekte mit dem Dashboard brauchen daher Chromium, HTTPS oder eine
  andere Lösung.
- axe läuft in Playwright im echten Browser, also auch `color-contrast`. Im
  Vitest-Setup des Formulars ist diese Regel abgeschaltet.
- Die Laufzeit ist nicht gemessen. Den größten Anteil haben vermutlich die drei
  Image-Builds; Caching über `type=gha` ist möglich, braucht aber Buildx-Setup.

## Was der Stack heute mitbringt

Aus [`docker-compose.yml`](../../docker-compose.yml):

| Dienst | Port auf dem Host | Healthcheck | Abhängigkeit |
| --- | --- | --- | --- |
| `db` | keiner | `pg_isready`, 10 s Intervall, 5 Versuche | keine |
| `backend` | keiner | `wget` auf `/actuator/health`, `start_period: 60s` | `db` mit `service_healthy` |
| `frontend` | 8081 | `wget` auf `/` | `backend`, Kurzform |
| `dashboard` | 8082 | `wget` auf `/` | `backend`, Kurzform |

Die Kurzform von `depends_on` wartet nur, bis der Container läuft. Compose
wartet laut Doku standardmäßig nicht auf "ready", nur auf "running"
([Startup order](https://docs.docker.com/compose/how-tos/startup-order/)).

Umgebungsvariablen, die der Stack liest:

- `DB_PASSWORD` ist Pflicht. Compose bricht mit `${DB_PASSWORD:?…}` ab, wenn
  sie fehlt oder leer ist
  ([Interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)).
- `STAFF_1_PASSWORD` bis `STAFF_5_PASSWORD` gehen leer durch. `StaffSeeder`
  verweigert den Start nur für ein Konto, das er noch anlegen muss
  ([`StaffSeeder.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/staff/config/StaffSeeder.java),
  [`application.properties`](../../backend/src/main/resources/application.properties)).
  Eine frische CI-Datenbank braucht also alle fünf.
- `RESEND_API_KEY` bleibt in CI leer. Ein fehlendes Property schaltet auf
  `NoopEmailSender`, so verschickt kein Testlauf echte Mails
  ([`application.properties`](../../backend/src/main/resources/application.properties)).
- `SPRING_PROFILES_ACTIVE=demo` schreibt die 13 Demo-Bewerbungen (`A21`). Der
  `DemoSeeder` läuft nur, wenn die Tabelle leer ist
  ([`DemoSeeder.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/demo/DemoSeeder.java)).

Shell-Variablen haben bei der Interpolation Vorrang vor der `.env`-Datei
([Interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)).
In CI reicht es daher, die Werte als Umgebung des Schritts zu setzen. Eine
`.env` muss nicht entstehen.

## Stack hochfahren und auf Bereitschaft warten

### Was `--wait` tut

Die Referenz beschreibt `--wait` als "Wait for services to be running|healthy,
streaming their logs unless --detach is set" und `--wait-timeout` als
Obergrenze in Sekunden
([Compose up](https://docs.docker.com/reference/cli/docker/compose/up/)).
Was `--wait` bei einem Dienst ohne Healthcheck tut, sagt die Seite nicht. Für
diesen Stack spielt das keine Rolle, weil alle vier Dienste einen haben.

Ein Aufruf in CI sähe so aus:

```bash
docker compose up --build --detach --wait --wait-timeout 300
```

### Healthcheck-Zeiten

Ein Healthcheck wird `healthy`, sobald eine Prüfung gelingt. Fehlschläge in der
Startphase zählen nicht gegen `retries`. `--start-interval` ist standardmäßig
5 s und gilt nur während der Startphase
([Dockerfile HEALTHCHECK](https://docs.docker.com/reference/dockerfile/)). Das
Backend ist mit `interval: 10s` und `start_period: 60s` konfiguriert. Nach der
Startphase kann zwischen "bereit" und "gesund" bis zu ein Intervall vergehen.
Ein kürzeres `start_interval` im Backend-Healthcheck würde diese Lücke beim
Start verkleinern, ist aber eine Änderung an `docker-compose.yml`.

### Warum ein gesundes Backend die Seeder hinter sich hat

Spring Boot startet den Webserver vor den `ApplicationRunner`s. Die Readiness
wechselt erst nach den Runnern auf `ACCEPTING_TRAFFIC`: "An application is
considered ready as soon as application and command-line runners have been
called"
([Application availability](https://docs.spring.io/spring-boot/reference/features/spring-application.html)).
Die Tabelle zu den Probe-Zuständen nennt den HTTP-Server in dieser Phase
"Refuses requests"
([Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)).
In diesem Repo antwortet Tomcat im selben Fenster aber schon. Daher kommt das
bekannte 401 `INVALID_CREDENTIALS`: `StaffSeeder` läuft als Runner und hat
seine Transaktion noch nicht abgeschlossen.

Ob `/actuator/health` dieses Fenster zeigt, hängt am Readiness-Indikator. In
Spring Boot 4.1.1, der Version aus
[`backend/pom.xml`](../../backend/pom.xml), gilt:

- `AvailabilityProbesAutoConfiguration` ist ohne Property aktiv
  (`matchIfMissing = true`) und legt `readinessStateHealthIndicator` an
  ([Quelle v4.1.1](https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-health/src/main/java/org/springframework/boot/health/autoconfigure/actuate/endpoint/AvailabilityProbesAutoConfiguration.java)).
- Der Indikator bildet `REFUSING_TRAFFIC` auf `OUT_OF_SERVICE` ab
  ([Quelle v4.1.1](https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-health/src/main/java/org/springframework/boot/health/application/ReadinessStateHealthIndicator.java)).
- Die Doku sagt, diese Indikatoren erscheinen auf dem globalen
  `/actuator/health`, und `OUT_OF_SERVICE` ergibt HTTP 503
  ([Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)).

Daraus folgt: Der `wget`-Healthcheck scheitert, bis die Seeder fertig sind, und
`docker compose up --wait` kehrt erst danach zurück. Das ist aus Doku und
Quellcode abgeleitet, nicht beobachtet. Der erste CI-Lauf sollte es prüfen,
zum Beispiel mit einem `curl` auf den Health-Endpunkt in der Startphase.

Die separaten Pfade `/actuator/health/readiness` und `/readyz` helfen hier
nicht direkt. `SecurityConfig` erlaubt nur `GET /actuator/health` und lehnt
jeden anderen Pfad ab
([`SecurityConfig.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/web/config/SecurityConfig.java)).

### Optionen für die Bereitschaft

- Option A. Nur `docker compose up --wait`. Das deckt alle vier Dienste ab,
  auch das Backend.
- Option B. `--wait` plus ein Setup-Projekt in Playwright, das die Anmeldung
  bis zum Erfolg wiederholt, etwa mit `expect.poll` oder `toPass`. Das fängt
  den Fall ab, dass die Ableitung oben in der Praxis nicht hält.
- Option C. Frontend und Dashboard im Compose-File mit `condition:
  service_healthy` an das Backend hängen. Dann ist ein gesundes Dashboard auch
  ein bereites Backend, auch für die lokale Demo. Das ist eine Änderung am
  Stack, nicht nur an CI.

## Passwörter, Seeding und Anmeldung

### Passwörter in CI

Secrets erreichen Läufe aus Forks nicht; nur `GITHUB_TOKEN` wird übergeben
([Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)).
Weil die CI-Datenbank bei jedem Lauf neu ist, braucht es keine festen Werte:

```bash
for name in DB_PASSWORD STAFF_1_PASSWORD STAFF_2_PASSWORD \
            STAFF_3_PASSWORD STAFF_4_PASSWORD STAFF_5_PASSWORD; do
  value="$(openssl rand -hex 24)"
  echo "::add-mask::$value"
  echo "$name=$value" >> "$GITHUB_ENV"
done
```

`::add-mask::` hält den Wert aus dem Log, und `GITHUB_ENV` macht ihn für alle
folgenden Schritte des Jobs sichtbar
([Workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)).
Die Passwörter sind 48 Zeichen lang und damit unter der bcrypt-Grenze von
72 Bytes aus [`dashboard/API.md`](../../dashboard/API.md). Playwright liest
`STAFF_1_PASSWORD` aus derselben Umgebung. Die Adressen der fünf Konten stehen
fest in `StaffSeeder`, zum Beispiel `ashton.blackwell@ichbinhier.online`.

### Demo-Daten an oder aus

- Ohne `demo`-Profil startet das Dashboard leer. Die Reise "absenden, im
  Dashboard sehen" braucht keine Demo-Daten, und der Test findet genau eine
  Bewerbung.
- Mit `demo`-Profil sieht das Dashboard aus wie bei der Präsentation. Der Test
  muss seine Bewerbung dann unter 13 anderen finden, etwa über die Suche nach
  Name oder E-Mail.

### Anmeldung einmal, Zustand wiederverwenden

Playwright empfiehlt ein Setup-Projekt, das sich einmal anmeldet und den
Zustand mit `storageState` in `playwright/.auth` speichert. Das Verzeichnis
gehört in `.gitignore`, weil die Datei Cookies enthält, mit denen man sich als
Testkonto ausgeben kann
([Authentication](https://playwright.dev/docs/auth)). Die Anmeldung geht auch
ohne UI über `APIRequestContext` per `POST /api/v1/staff/session`
([Authentication](https://playwright.dev/docs/auth)). Setup-Projekte über
`dependencies` erscheinen im HTML-Bericht und haben Traces, `globalSetup` hat
beides nicht
([Global setup](https://playwright.dev/docs/test-global-setup-teardown)).

Eigenheiten dieses Backends, die ein Test kennen muss:

- Sign-ins liegen im Speicher des Backends. Ein Neustart beendet alle
  ([`dashboard/API.md`](../../dashboard/API.md)). Ein gespeicherter Zustand
  gilt also nur für denselben Lauf.
- Fünf Fehlversuche von einer Adresse in 15 Minuten ergeben 429, auch für das
  richtige Passwort (`A20`). Alle Anfragen aus dem Runner kommen bei nginx mit
  derselben Adresse an. Ein Negativtest mit falschem Passwort kann damit die
  Anmeldung der übrigen Tests sperren.
- Das Cookie ist `Secure; SameSite=Strict`
  ([`SignInCookie.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/web/config/SignInCookie.java)).
  Über `http://localhost` funktioniert das in Chromium und Firefox, weil
  `localhost` als sicher gilt
  ([MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)).
  Für WebKit siehe den Abschnitt zu Viewports.

## Ein Durchlauf: Bewerbung absenden, im Dashboard sehen

Ein möglicher Ablauf, beschrieben mit den Begriffen aus
[`CONTEXT.md`](../../CONTEXT.md):

1. Auf `http://localhost:8081` eine Category wählen, die Felder über ihre
   Labels füllen, die Einwilligung setzen und absenden.
2. Die Bestätigungsseite prüfen.
3. Im Dashboard auf `http://localhost:8082` mit gespeichertem Zustand die
   Liste der Applications öffnen und die neue Application am Namen erkennen.

Was dabei aus dem Code folgt:

- Das Feld `website` ist ein Honeypot. Ist es nicht leer, antwortet das Backend
  mit 201 und speichert nichts
  ([`frontend/API.md`](../../frontend/API.md)). Ein Test, der alle Eingaben
  blind füllt, sieht dann einen Erfolg, aber keine Application im Dashboard.
  Locators über Rolle und Label, wie Playwright sie empfiehlt, treffen das
  versteckte Feld nicht
  ([Best practices](https://playwright.dev/docs/best-practices)).
- nginx lässt pro Client-Adresse 10 `POST /api/v1/applications` sofort durch
  und dann eine pro Minute (`A26`,
  [`frontend/nginx.conf`](../../frontend/nginx.conf)). Das Backend erlaubt drei
  Bewerbungen pro E-Mail-Adresse in 24 Stunden
  ([`application.properties`](../../backend/src/main/resources/application.properties)).
  Bei mehreren Projekten summieren sich die Absendungen. Jede braucht eine
  eigene Adresse, etwa unter `example.org` wie im `DemoSeeder`.
- Das Dashboard hält einen Server-Sent-Events-Stream offen (ADR-0004). Der
  Ladezustand `networkidle` tritt dann nie ein; Playwright rät von ihm ohnehin
  ab und empfiehlt Web-First-Assertions wie `toBeVisible()`
  ([page.goto](https://playwright.dev/docs/api/class-page),
  [Best practices](https://playwright.dev/docs/best-practices)).
- Die Application kann über den Stream oder über ein Neuladen erscheinen. Eine
  Assertion mit Wartezeit deckt beide Wege ab. Playwright-Assertions warten
  standardmäßig 5 s, ein Test darf 30 s dauern
  ([Timeouts](https://playwright.dev/docs/test-timeouts)).

Formular und Dashboard laufen auf zwei Origins. `baseURL` gilt pro Projekt
([Test use options](https://playwright.dev/docs/test-use-options)). Möglich
sind getrennte Projekte je Anwendung mit eigener `baseURL` oder volle URLs im
Test.

## Mehrere Viewports

Projekte übernehmen Geräteprofile wie `devices['Pixel 5']`,
`devices['iPhone 12']` oder `devices['Desktop Chrome']`. Mit `--project` läuft
ein einzelnes
([Projects](https://playwright.dev/docs/test-projects)). Ein eigenes
`viewport` muss nach dem Ausbreiten des Profils stehen, sonst überschreibt das
Profil es ([Emulation](https://playwright.dev/docs/emulation)).
[`frontend/DESIGN.md`](../../frontend/DESIGN.md) nennt 375 px als mobile
Referenzbreite und Desktop-Container bis 1280 px.

WebKit verträgt sich nicht mit dem Cookie. Unter Linux nutzt WebKit libsoup,
und Berichte beschreiben, dass ein `Secure`-Cookie über `http://localhost`
nicht gesendet wird
([Playwright #39380](https://github.com/microsoft/playwright/issues/39380),
[Beispiel aus einem anderen Projekt](https://github.com/daniro-san/LAPTracker/pull/648)).
Playwright hat am 2026-10-05 eine Änderung gemergt, die Loopback-Adressen für
Cookies als sicher behandelt. Sie betrifft laut Beschreibung
`APIRequestContext` und `browserContext.cookies()`, nicht die Cookie-Logik in
WebKit selbst
([Playwright #43136](https://github.com/microsoft/playwright/pull/43136)).
Die Anmeldung im Dashboard ist für WebKit-Projekte also unsicher.

Optionen für Viewports:

- Option A. Nur Chromium, mit Desktop- und Mobilprofilen wie `Pixel 5` und
  einer Breite von 375 px. Eine Browser-Installation, kein Cookie-Problem.
  Playwright rät, in CI nur die nötigen Browser zu installieren
  ([Best practices](https://playwright.dev/docs/best-practices)).
- Option B. WebKit nur für das Formular, das ohne Anmeldung auskommt.
  Dashboard-Projekte bleiben bei Chromium.
- Option C. TLS vor den Containern in CI, wie es das README für den Zugriff
  von anderen Geräten verlangt ([`README.md`](../../README.md)). Dann
  funktioniert WebKit auch im Dashboard, aber der Stack in CI weicht vom
  lokalen ab.
- Den `Secure`-Flag für Tests abzuschalten, widerspricht dem README und steht
  deshalb nicht in der Liste.

## Barrierefreiheit mit axe im selben Lauf

`@axe-core/playwright` wird mit `npm install @axe-core/playwright`
installiert. `new AxeBuilder({ page }).analyze()` prüft die Seite, und
`withTags`, `include`, `exclude`, `withRules` und `disableRules` grenzen die
Prüfung ein. Das Paket injiziert sich in alle Frames
([axe-core-npm README](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md)).

Die Playwright-Doku zeigt drei Muster
([Accessibility testing](https://playwright.dev/docs/accessibility-testing)):

- `expect(results.violations).toEqual([])` als Assertion im Test.
- Eine Fixture `makeAxeBuilder`, die Tags und Ausnahmen an einer Stelle
  festlegt.
- Das volle Ergebnis per `testInfo.attach` als JSON an den Bericht hängen.

Die Doku warnt, dass automatische Prüfungen nur einen Teil der Probleme finden
und manuelle Tests nicht ersetzen
([Accessibility testing](https://playwright.dev/docs/accessibility-testing)).

Für dieses Repo ist ein Punkt neu. Das Formular prüft heute mit `axe-core` in
jsdom und schaltet `color-contrast` ab, weil jsdom keine Farben berechnet
([`frontend/src/test/a11y.ts`](../../frontend/src/test/a11y.ts)). Im echten
Browser lässt sich diese Regel einschalten. Das Dashboard hat bisher nur
`eslint-plugin-jsx-a11y`.

Optionen für den Zuschnitt:

- Option A. Ein axe-Scan an jedem Haltepunkt der Reise, also Formular leer,
  Formular mit Fehlern, Bestätigung, Anmeldung, Liste, Detail. Das läuft in
  jedem Viewport-Projekt mit.
- Option B. Eine eigene Spec-Datei nur für axe, die jede Seite einmal
  aufruft. Die Reise bleibt kurz, und axe-Fehler sind im Bericht getrennt.
- Die Tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` aus der Playwright-Doku
  oder zusätzlich `wcag22aa` sind eine Frage für die Entscheidung.

Die Schrift Akhand Soft fehlt in CI, weil die Datei nicht im Repo liegt. Das
Formular fällt auf Nunito zurück
([`frontend/README.md`](../../frontend/README.md)). Der Kontrast ändert sich
dadurch nicht, Zeilenumbrüche schon.

## Laufzeit und Caching

### Runner

Ein `ubuntu-latest`-Runner hat in öffentlichen Repositories 4 CPUs, 16 GB RAM
und 14 GB SSD, in privaten 2 CPUs und 8 GB
([GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)).
Das Ubuntu-24.04-Image bringt Docker 28.0.4, Compose 2.38.2 und Buildx 0.39.0
mit ([Runner image](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)).
Playwright empfiehlt in CI `workers: 1` für stabile Läufe
([CI](https://playwright.dev/docs/ci)).

### Was Zeit kostet

Die Laufzeit ist nicht gemessen. Die Schritte sind:

1. Drei Image-Builds. Das Backend lädt mit `mvn dependency:go-offline` alle
   Abhängigkeiten und baut das JAR, Formular und Dashboard führen je `npm ci`
   und `vite build` aus
   ([`backend/Dockerfile`](../../backend/Dockerfile),
   [`frontend/Dockerfile`](../../frontend/Dockerfile),
   [`dashboard/Dockerfile`](../../dashboard/Dockerfile)).
2. Pull von `postgres:17-alpine` und den Basis-Images.
3. Start bis "gesund", beim Backend mit bis zu 60 s Startphase.
4. Installation von Node-Paketen und Browsern für das E2E-Projekt.
5. Die Tests selbst.

Ohne Messung lässt sich keine Zahl nennen. Wenn das Ticket zur Pipeline eine
Zeitgrenze setzen will, braucht sie zuerst eine ID in
[`docs/ASSUMPTIONS.md`](../ASSUMPTIONS.md).

### Browser

Browser-Binaries zu cachen, empfiehlt Playwright nicht. Das Wiederherstellen
dauert etwa so lange wie der Download, und die Systempakete lassen sich nicht
cachen ([CI](https://playwright.dev/docs/ci)). Alternativ läuft der Job im
Image `mcr.microsoft.com/playwright:v<version>-noble`, dessen Version zur
Playwright-Version passen muss
([Docker](https://playwright.dev/docs/docker)). In einem Container-Job ist
`localhost` aber der Job-Container, nicht der Host mit den Compose-Ports. Das
macht den Container-Weg für diesen Stack umständlicher als
`npx playwright install --with-deps chromium` auf dem Runner.

### Image-Layer

Die `gha`-Cache-Backends von BuildKit speichern Layer im Actions-Cache. Jedes
Image braucht einen eigenen `scope`, sonst überschreiben sich die Caches.
Außerhalb von `docker/build-push-action` muss ein Schritt wie
`crazy-max/ghaction-github-runtime` das Laufzeit-Token freigeben. Mit dem
Standard-Treiber `docker` geht der Export nur mit containerd-Image-Store
([GHA cache backend](https://docs.docker.com/build/cache/backends/gha/),
[ghaction-github-runtime](https://github.com/crazy-max/ghaction-github-runtime)).
BuildKit legt Cache-Mounts nicht im Actions-Cache ab
([Cache in GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/)).

Der Actions-Cache fasst 10 GB pro Repository, Einträge ohne Zugriff verfallen
nach 7 Tagen. Ein Pull Request liest Caches von seinem Branch und dem
Basis-Branch; was er selbst schreibt, sieht nur er
([Dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)).
Ein Cache, den `main` füllt, hilft also allen Pull Requests.

Optionen:

- Option A. Kein Layer-Cache. Einfach, jeder Lauf baut alles neu. Zuerst messen.
- Option B. Ein Override-File nur für CI mit `cache_from` und `cache_to` vom
  Typ `gha` je Dienst. Compose unterstützt beide Felder, unbekannte Typen
  ignoriert es
  ([Compose build](https://docs.docker.com/reference/compose-file/build/)).
  Dazu `docker/setup-buildx-action` und `crazy-max/ghaction-github-runtime`.
- Option C. `docker/bake-action` baut die Images aus einer Bake-Definition
  und lädt sie mit `load: true` in den lokalen Store; danach `docker compose
  up --no-build --wait`
  ([bake-action](https://github.com/docker/bake-action)). Bake liest
  Compose-Dateien und übernimmt `cache_from` und `cache_to`
  ([Bake mit Compose](https://docs.docker.com/build/bake/compose-file/)). Ob
  `bake-action` die `docker-compose.yml` direkt als `files` annimmt, sagt die
  Action-Seite nicht; das wäre zu prüfen.
- Option D. Images in einem eigenen Job bauen und in die GitHub Container
  Registry schieben. Compose zieht ein Image mit `image` und `build` zuerst aus
  der Registry und baut nur, wenn es fehlt
  ([Compose build](https://docs.docker.com/reference/compose-file/build/)).
  Das bringt Rechte, Aufräumen und Tags als neue Arbeit mit.

Das Formular-Dockerfile warnt, dass ein frischer Checkout nicht alles in
`public/` enthält
([`frontend/Dockerfile`](../../frontend/Dockerfile)). Gemeint ist die
Markenschrift; der Build läuft trotzdem.

## Wo das E2E-Projekt liegt

Der Rahmen der Karte #100 lautet: Beide Anwendungen bleiben unabhängig und
teilen kein Code-Paket. Die bestehenden Workflows sind nach Pfaden getrennt
([`.github/workflows/frontend.yml`](../../.github/workflows/frontend.yml),
[`.github/workflows/dashboard.yml`](../../.github/workflows/dashboard.yml)).
Die Reise berührt beide Anwendungen und das Backend.

- Option A. Ein eigenes Verzeichnis `e2e/` auf oberster Ebene mit eigenem
  `package.json`, Lockfile, `.nvmrc` und `playwright.config.ts`. Es gehört zu
  keiner Anwendung, und kein Code fließt zwischen den Projekten. Ein eigener
  Workflow `e2e.yml` reagiert auf Änderungen in `e2e/**`, `frontend/**`,
  `dashboard/**`, `backend/**` und `docker-compose.yml`.
- Option B. Je ein `e2e/` in `frontend/` und `dashboard/`. Jede Anwendung
  testet sich selbst, aber die Reise vom Formular ins Dashboard hat keinen
  natürlichen Ort, und Playwright stünde zweimal in den Abhängigkeiten.
- Option C. E2E im Dashboard, weil die Reise dort endet. Das Dashboard bekäme
  eine Abhängigkeit auf das Formular, die der Rahmen der Karte vermeiden will.

Unabhängig vom Ort braucht der Workflow die Wahl zwischen einem eigenen Job
und einem Schritt in einem bestehenden. Ein eigener Workflow mit breitem
Pfadfilter läuft bei fast jeder Änderung und ist der teuerste Job im Repo.

## Artefakte: Traces und Berichte

- Der HTML-Reporter schreibt nach `playwright-report`. Der `github`-Reporter
  setzt Annotationen an fehlgeschlagene Tests. Mehrere Reporter lassen sich
  kombinieren
  ([Reporters](https://playwright.dev/docs/test-reporters)).
- `trace` kennt unter anderem `on-first-retry` und `retain-on-failure`;
  `screenshot` und `video` lassen sich ebenso steuern
  ([Test use options](https://playwright.dev/docs/test-use-options)).
- Das Beispiel von Playwright lädt `playwright-report/` mit
  `if: ${{ !cancelled() }}` und `retention-days: 30` hoch. Der Bericht braucht
  zum Ansehen `npx playwright show-report <Ordner>`, weil er einen Webserver
  erwartet ([CI intro](https://playwright.dev/docs/ci-intro)).
- `actions/upload-artifact` ist bei v7; die Workflows im Repo nutzen v4.
  Artefakte sind seit v4 unveränderlich, Namen müssen pro Lauf eindeutig sein,
  und ohne `retention-days` gelten 90 Tage
  ([upload-artifact](https://github.com/actions/upload-artifact)).
- Zusätzlich sinnvoll sind die Container-Logs bei einem Fehlschlag, etwa
  `docker compose logs --no-color > compose.log`, als eigenes Artefakt.

Traces und Berichte enthalten Seiteninhalte und Netzwerkverkehr. Mit
synthetischen Daten und Passwörtern pro Lauf liegt darin nichts, was nach dem
Lauf noch gilt. `playwright/.auth` gehört trotzdem nicht in ein Artefakt.

## Skizze eines Jobs

Nur zur Anschauung, keine Entscheidung. Sie folgt Option A bei Ort und
Bereitschaft und Option A bei Viewports und Caching.

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - name: Generate passwords
        run: |
          for name in DB_PASSWORD STAFF_1_PASSWORD STAFF_2_PASSWORD \
                      STAFF_3_PASSWORD STAFF_4_PASSWORD STAFF_5_PASSWORD; do
            value="$(openssl rand -hex 24)"
            echo "::add-mask::$value"
            echo "$name=$value" >> "$GITHUB_ENV"
          done
      - name: Start the stack
        run: docker compose up --build --detach --wait --wait-timeout 300
      - uses: actions/setup-node@v4
        with:
          node-version-file: e2e/.nvmrc
          cache: npm
          cache-dependency-path: e2e/package-lock.json
      - run: npm ci
        working-directory: e2e
      - run: npx playwright install --with-deps chromium
        working-directory: e2e
      - run: npx playwright test
        working-directory: e2e
      - name: Collect container logs
        if: failure()
        run: docker compose logs --no-color > e2e/compose.log
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: |
            e2e/playwright-report/
            e2e/compose.log
          retention-days: 14
```

Die Playwright-Doku setzt selbst kein `timeout-minutes` und rät zu
`globalTimeout` in der Konfiguration, damit bei einem Abbruch noch ein Bericht
entsteht ([CI intro](https://playwright.dev/docs/ci-intro),
[Timeouts](https://playwright.dev/docs/test-timeouts)).

## Offene Punkte für die Entscheidung

1. Ort des Projekts: `e2e/` oben, je Anwendung oder im Dashboard.
2. Bereitschaft: nur `--wait`, zusätzlich eine wiederholte Anmeldung, oder
   `service_healthy` im Compose-File.
3. Demo-Profil an oder aus.
4. Browser und Viewports: nur Chromium, WebKit nur für das Formular, oder TLS
   in CI.
5. axe an jedem Haltepunkt oder in einer eigenen Datei, und welche Tags.
6. Layer-Cache: keiner, `gha` über Override-File, `bake-action` oder Registry.
7. Wann der Job läuft: bei jeder Änderung, nur auf `main` oder per Label.

## Quellen

Playwright:

- [Setting up CI](https://playwright.dev/docs/ci-intro)
- [Continuous Integration](https://playwright.dev/docs/ci)
- [Docker](https://playwright.dev/docs/docker)
- [Projects](https://playwright.dev/docs/test-projects)
- [Authentication](https://playwright.dev/docs/auth)
- [Global setup and teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Test use options](https://playwright.dev/docs/test-use-options)
- [Emulation](https://playwright.dev/docs/emulation)
- [Timeouts](https://playwright.dev/docs/test-timeouts)
- [Reporters](https://playwright.dev/docs/test-reporters)
- [Best practices](https://playwright.dev/docs/best-practices)
- [Page API](https://playwright.dev/docs/api/class-page)
- [Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [Issue #39380, WebKit und localhost-Cookies](https://github.com/microsoft/playwright/issues/39380)
- [PR #43136, Loopback als sicher für Cookies](https://github.com/microsoft/playwright/pull/43136)

axe:

- [@axe-core/playwright README](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md)

Docker:

- [docker compose up](https://docs.docker.com/reference/cli/docker/compose/up/)
- [Startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [Variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Compose build specification](https://docs.docker.com/reference/compose-file/build/)
- [Dockerfile reference, HEALTHCHECK](https://docs.docker.com/reference/dockerfile/)
- [GitHub Actions cache backend](https://docs.docker.com/build/cache/backends/gha/)
- [Cache management with GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/)
- [Bake und Compose](https://docs.docker.com/build/bake/compose-file/)
- [docker/bake-action](https://github.com/docker/bake-action)
- [crazy-max/ghaction-github-runtime](https://github.com/crazy-max/ghaction-github-runtime)

GitHub Actions:

- [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [Ubuntu 24.04 runner image](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)
- [Dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- [Workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
- [Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)

Spring Boot:

- [Application availability und Events](https://docs.spring.io/spring-boot/reference/features/spring-application.html)
- [Actuator endpoints, Health und Probes](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
- [AvailabilityProbesAutoConfiguration, v4.1.1](https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-health/src/main/java/org/springframework/boot/health/autoconfigure/actuate/endpoint/AvailabilityProbesAutoConfiguration.java)
- [ReadinessStateHealthIndicator, v4.1.1](https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-health/src/main/java/org/springframework/boot/health/application/ReadinessStateHealthIndicator.java)

Web:

- [MDN, Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

Repo: [`docker-compose.yml`](../../docker-compose.yml),
[`.env.example`](../../.env.example), [`README.md`](../../README.md),
[`StaffSeeder.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/staff/config/StaffSeeder.java),
[`DemoSeeder.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/demo/DemoSeeder.java),
[`application.properties`](../../backend/src/main/resources/application.properties),
[`SecurityConfig.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/web/config/SecurityConfig.java),
[`SignInCookie.java`](../../backend/src/main/java/de/ichbinhier/volunteerformservice/web/config/SignInCookie.java),
[`dashboard/API.md`](../../dashboard/API.md),
[`frontend/API.md`](../../frontend/API.md),
[`frontend/nginx.conf`](../../frontend/nginx.conf),
[`frontend/src/test/a11y.ts`](../../frontend/src/test/a11y.ts),
[`.github/workflows/`](../../.github/workflows/).
