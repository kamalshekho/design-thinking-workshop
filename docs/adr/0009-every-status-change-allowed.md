---
status: accepted
---

# Das Backend erlaubt jeden Statuswechsel

`PATCH /api/v1/staff/applications/{id}` nimmt jeden der sieben Status an, egal
in welchem Status die Application gerade steht. Das Backend prüft keine
Übergänge. Mitarbeitende können eine Application von _Neu_ direkt auf _Aktiv_
setzen oder eine abgelehnte wieder auf _In Prüfung_.

Der Statusablauf ist unser eigener Vorschlag (`A9`, Vertrauen niedrig). Wie der
Verein Bewerbungen wirklich bearbeitet, wissen wir nicht, denn er hat seit dem
ersten Gespräch nicht mehr geantwortet (`C1`). Eine Übergangstabelle im Backend
würde diesen Vorschlag als Regel festschreiben. Passt sie nicht zum echten
Ablauf, kommen Mitarbeitende an einer Application nicht weiter und brauchen
eine Codeänderung, um weiterzuarbeiten.

Freie Übergänge haben zwei weitere Gründe:

- Ein falsch gewählter Status lässt sich sofort zurücksetzen. Bei festen
  Übergängen wäre der Weg zurück oft gesperrt.
- Jeder Wechsel wird als State change mit Zeitpunkt gespeichert
  ([ADR-0005](./0005-state-history-without-authorship.md)). Ein
  ungewöhnlicher Sprung bleibt also im Nachhinein sichtbar.

## Folgen

- Jeder Wechsel löst eine E-Mail an den Bewerber aus (`A30`). Wer sich
  verklickt und den Status gleich zurücksetzt, verschickt zwei E-Mails. Welche
  Wechsel eine E-Mail auslösen sollen, muss der Verein entscheiden.
- Das Onboarding-Token entsteht beim ersten Wechsel auf _Angenommen_ und
  bleibt bei späteren Wechseln erhalten. Eine Application, die danach wieder
  auf _In Prüfung_ steht, behält ihren Onboarding-Link.
- Die Statusauswahl im Dashboard bietet immer alle sieben Status an. Dashboard
  und Backend müssen sich nicht über erlaubte Übergänge einig sein.

## Wann wir das neu entscheiden

Sobald der Verein seinen tatsächlichen Ablauf beschreibt, legen wir die
erlaubten Übergänge in einer Tabelle im Backend fest. Ein verbotener Wechsel
bekommt dann `409 Conflict` mit eigenem `code`, und das Dashboard bietet nur
die erlaubten Status an.
