# Deployment der Demo

Die _Platform_ läuft für die Vorführung auf zwei Servern: Staging zum Prüfen,
Production zum Zeigen. Ein Versions-Tag baut und prüft die Images, jeder
Deploy wird danach von Hand gestartet, erst nach Staging, dann nach Production.

| Umgebung | _Applicant form_ | _Dashboard_ |
|---|---|---|
| Staging | <https://staging-bewerbung.aegisdev.me> | <https://staging-dashboard.aegisdev.me> |
| Production | <https://bewerbung.aegisdev.me> | <https://dashboard.aegisdev.me> |

## Ablauf

1. **Lokal testen, dann nach `main`.** Wie bisher über einen Pull Request.
2. **Tag setzen.** Nach dem Merge setzt ein Mensch den Tag auf `main`:
   `git tag v1.0.0 && git push origin v1.0.0`.
3. **`release.yml` läuft.** Linter und Unit-Tests aus `ci.yml` und
   `backend.yml`, dann pro Anwendung: Image für `linux/arm64` bauen, mit Trivy
   scannen und als `sha-<Commit>` nach GitHub Container Registry pushen.
   Danach laufen die E2E-Tests gegen genau diese Images. Erst wenn alles grün
   ist, bekommen die Images den Tag `v1.0.0` und eine signierte
   Provenance-Attestation.
4. **Deploy nach Staging.** Unter Actions, Workflow `deploy`, "Run workflow":
   Version `v1.0.0`, Umgebung `staging`. Danach auf Staging von Hand prüfen.
5. **Deploy nach Production.** Derselbe Workflow mit Umgebung `production`.
   Der Job bricht ab, wenn diese Version noch nicht erfolgreich auf Staging
   lief.

Jeder Deploy prüft die Attestation aller drei Images, kopiert die
Compose-Dateien vom selben Tag nach `~/dtw/releases/<Version>/` auf dem Server
und startet dort `deploy/deploy.sh`. Das Skript zieht die Images, sichert die
Datenbank, startet den Stack und fragt _Applicant form_, API und _Dashboard_
über HTTPS ab. Scheitert das, startet es die vorher laufende Version mit deren
eigenen Dateien wieder.

Ein Rollback ist ein Deploy mit einer älteren Version. Flyway migriert nur
vorwärts; eine Migration rückgängig zu machen heißt, die Sicherung aus
`~/dtw/backups` einzuspielen.

## Die Server

Zwei gleiche Azure-VMs `Standard_B2pts_v2` (Arm, 2 vCPU, 1 GiB Speicher, 1 GiB
Swap) in Schweden, Ubuntu 24.04 mit Docker, beide in der Ressourcengruppe
`dtw-demo-rg`. Caddy nimmt auf Port 80 und 443 an, holt die Zertifikate von
Let's Encrypt und leitet an die beiden nginx-Container weiter. HTTPS ist
Pflicht, weil das Anmelde-Cookie des _Dashboard_ immer `Secure` ist.

Vor beiden Seiten fragt Caddy nach einer gemeinsamen Demo-Anmeldung
(HTTP Basic Auth), damit Fremde und Crawler draußen bleiben. Das _Dashboard_
verlangt danach wie gewohnt die Anmeldung als _Staff member_. Auch wer den
Link aus der Onboarding-E-Mail öffnet, braucht die Demo-Anmeldung.

Auf jedem Server liegt unter `~/dtw` des Benutzers `deploy`:

| Pfad | Inhalt |
|---|---|
| `.env` | Passwörter und Hostnamen dieses Servers, Rechte `600` |
| `releases/<Version>/` | Compose-Dateien und Skript eines Releases, die fünf neuesten |
| `.deployed-tag` | die laufende Version |
| `backups/` | Datenbank-Dumps vor jedem Deploy, die zehn neuesten |

Alle Releases laufen als Compose-Projekt `dtw`, deshalb bleibt das Volume der
Datenbank über Deploys und Rollbacks hinweg dasselbe.

Die Speichergrenzen in [`compose.prod.yml`](./compose.prod.yml) sind am
25.11.2026 gemessen: unter Demo-Last braucht der ganze Stack etwa 400 MiB.
Ein Stresstest mit 100 _Applications_ pro Sekunde und 50 offenen Live-Streams
bringt das Backend über 512 MiB, dann beendet der Kernel es. Für eine
Vorführung reichen die Server, für den echten Betrieb nicht.

Das _Applicant form_ zeigt die Schrift Nunito: die Markenschrift liegt nicht
im Repository, und die Images entstehen aus einem frischen Checkout.

## Einmalige Einrichtung

### Auf jedem Server

`~/dtw/.env`, Rechte `600`:

| Variable | Wert |
|---|---|
| `DB_PASSWORD` | zufällig, zum Beispiel `openssl rand -hex 24` |
| `STAFF_1_PASSWORD` bis `STAFF_5_PASSWORD` | zufällig; gelten nur beim ersten Start mit leerer Datenbank |
| `RESEND_API_KEY` | leer, dann verschickt das Backend keine E-Mails |
| `ONBOARDING_BASE_URL` | Adresse des _Applicant form_, zum Beispiel `https://bewerbung.aegisdev.me` |
| `SPRING_PROFILES_ACTIVE` | `demo` für die Demo-Woche an _Applications_ (`A21`) |
| `FORM_HOST` | Hostname des _Applicant form_ |
| `DASHBOARD_HOST` | Hostname des _Dashboard_ |
| `BASIC_AUTH_USER` | Benutzername der Demo-Anmeldung, zum Beispiel `demo` |
| `BASIC_AUTH_PASSWORD` | Passwort der Demo-Anmeldung, zufällig; nur für den Smoke-Test von `deploy.sh` |
| `BASIC_AUTH_HASH` | bcrypt-Hash desselben Passworts, **in einfachen Anführungszeichen** |

Den Hash erzeugt Caddy selbst:

```sh
docker run --rm caddy:2.11.9-alpine caddy hash-password --plaintext '<Passwort>'
```

Ohne die einfachen Anführungszeichen liest Docker Compose die `$` im Hash als
Variablen, und keine Anmeldung passt mehr.

Die Hostnamen zeigen als A-Record auf die IP ihres Servers. Die DNS-Zone von
`aegisdev.me` liegt bei DigitalOcean.

### In GitHub

Die Environments `staging` und `production` und ihre Werte kann nur ein Admin
des Repositorys anlegen (Settings, Environments). Jedes bekommt:

| Art | Name | Inhalt |
|---|---|---|
| Secret | `DEPLOY_SSH_KEY` | privater SSH-Schlüssel des Benutzers `deploy` |
| Secret | `DEPLOY_KNOWN_HOSTS` | Ausgabe von `ssh-keyscan -t ed25519 <Server>` |
| Variable | `DEPLOY_HOST` | DNS-Name des Servers |
| Variable | `FORM_URL` | Adresse des _Applicant form_ |

Mit "Required reviewers" an `production` wartet jeder Deploy dorthin auf eine
Freigabe.

## Lokal ausprobieren

Den Stack aus den Images eines Releases statt aus dem Quellcode starten:

```sh
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.yml \
  -f deploy/compose.images.yml up --detach --wait
```

Die Images sind für `linux/arm64` gebaut und laufen auf einem x86-Rechner nur
mit Emulation.
