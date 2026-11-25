# Deployment der Demo

Die Plattform läuft für die Vorführung auf einem einzelnen Server. Ein
Versions-Tag baut und prüft die Images, ein Deploy wird danach von Hand
gestartet.

| Adresse | Inhalt |
|---|---|
| <https://bewerbung.aegisdev.me> | Bewerbungsformular |
| <https://dashboard.aegisdev.me> | Dashboard für die Mitarbeitenden |

## Ablauf

1. **Tag setzen.** Nach dem Merge auf `main` setzt ein Mensch den Tag:
   `git tag v1.0.0 && git push origin v1.0.0`.
2. **`release.yml` läuft.** Linter und Unit-Tests aus `ci.yml` und
   `backend.yml`, dann pro Anwendung: Image für `linux/arm64` bauen, mit Trivy
   scannen, als `sha-<Commit>` nach GitHub Container Registry pushen und mit
   einer Provenance-Attestation signieren. Danach laufen die E2E-Tests gegen
   genau diese Images. Erst wenn alles grün ist, bekommen die Images den Tag
   `v1.0.0`.
3. **Deploy starten.** Unter Actions, Workflow `deploy`, "Run workflow":
   Version und Umgebung wählen. Der Job prüft die Attestation jedes Images,
   kopiert die Compose-Dateien vom selben Tag auf den Server und startet dort
   `deploy/deploy.sh`.
4. **`deploy.sh` auf dem Server.** Images ziehen, Datenbank sichern
   (`~/dtw/backups`, die letzten zehn), Stack starten, Formular, API und
   Dashboard über HTTPS abfragen. Scheitert das, startet das Skript die zuvor
   laufende Version wieder.

Ein Rollback ist ein Deploy mit einer älteren Version. Flyway migriert nur
vorwärts; eine Migration rückgängig zu machen heißt, die Sicherung aus
`~/dtw/backups` einzuspielen.

## Der Server

Eine Azure-VM `Standard_B2pts_v2` (Arm, 2 vCPU, 1 GiB Speicher, 1 GiB Swap) in
Schweden, Ubuntu 24.04 mit Docker. Caddy nimmt auf Port 80 und 443 an, holt die
Zertifikate von Let's Encrypt und leitet an die beiden nginx-Container weiter.
HTTPS ist Pflicht, weil das Anmelde-Cookie des Dashboards immer `Secure` ist.

Die Speichergrenzen in [`compose.prod.yml`](./compose.prod.yml) sind am
25.11.2026 gemessen: unter Demo-Last braucht der ganze Stack etwa 400 MiB.
Ein Stresstest mit 100 Bewerbungen pro Sekunde und 50 offenen Live-Streams
bringt das Backend über 512 MiB, dann beendet der Kernel es. Für eine
Vorführung reicht der Server, für den echten Betrieb nicht.

Das Formular zeigt die Schrift Nunito: die Markenschrift liegt nicht im
Repository, und die Images entstehen aus einem frischen Checkout.

## Einmalige Einrichtung

### Auf dem Server

`~/dtw/.env` des Benutzers `deploy`, Rechte `600`:

| Variable | Wert |
|---|---|
| `DB_PASSWORD` | zufällig, zum Beispiel `openssl rand -hex 24` |
| `STAFF_1_PASSWORD` bis `STAFF_5_PASSWORD` | zufällig; gelten nur beim ersten Start mit leerer Datenbank |
| `RESEND_API_KEY` | leer, dann verschickt das Backend keine E-Mails |
| `ONBOARDING_BASE_URL` | `https://bewerbung.aegisdev.me` |
| `SPRING_PROFILES_ACTIVE` | `demo` für die Demo-Woche an Bewerbungen (`A21`) |
| `FORM_HOST` | `bewerbung.aegisdev.me` |
| `DASHBOARD_HOST` | `dashboard.aegisdev.me` |

Die DNS-Einträge beider Namen zeigen als A-Record auf die IP des Servers.

### In GitHub

Das Environment `production` und seine Werte kann nur ein Admin des
Repositorys anlegen (Settings, Environments):

| Art | Name | Inhalt |
|---|---|---|
| Secret | `DEPLOY_SSH_KEY` | privater SSH-Schlüssel des Benutzers `deploy` |
| Secret | `DEPLOY_KNOWN_HOSTS` | Ausgabe von `ssh-keyscan -t ed25519 <Server>` |
| Variable | `DEPLOY_HOST` | DNS-Name des Servers |
| Variable | `FORM_URL` | `https://bewerbung.aegisdev.me` |

Mit "Required reviewers" wartet jeder Deploy auf eine Freigabe.

## Lokal ausprobieren

Den Stack aus den Images eines Releases statt aus dem Quellcode starten:

```sh
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.yml \
  -f deploy/compose.images.yml up --detach --wait
```

Die Images sind für `linux/arm64` gebaut und laufen auf einem x86-Rechner nur
mit Emulation.
