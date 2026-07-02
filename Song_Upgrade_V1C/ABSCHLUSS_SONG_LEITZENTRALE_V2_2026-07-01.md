# Abschluss – Song-Leitzentrale V2

Datum: 01.07.2026  
Status: lokal funktionsfähig und getestet

## Neuer Bedienablauf

1. `START_EINPFLEGE.cmd` doppelklicken.
2. Einen Songordner auswählen.
3. MP3, JPG/JPEG, TXT und Titel werden automatisch erkannt.
4. Der TXT-Inhalt wird unmittelbar mit der vorhandenen HM-Logik analysiert.
5. Vorgeschlagene HM-Bereiche sind bereits markiert; der Benutzer prüft und bestätigt sie.
6. Sternstatus Ja/Nein bestätigen. Diese Angabe wird aus Sicherheitsgründen nicht geraten.
7. `Ausgabepakete erzeugen` anklicken.
8. Testkopie, GitHub-Paket, Upload-Paket und Dokumentation entstehen unter `runs/`.

## Technischer Aufbau

- `index.html`, `js/app.js`, `css/app.css`: vollständige V2-Arbeitsoberfläche
- `tools/v2-server.mjs`: nur lokal erreichbare Bedienbrücke
- `tools/song-upgrade.mjs`: unveränderte zentrale Generatorfunktion mit ergänzter maschinenlesbarer Schnittstelle
- `START_EINPFLEGE.cmd`: startet Server und Browser ohne Benutzereingaben

Die Oberfläche dupliziert keine Nummern-, Kollisions- oder HTML-Integrationslogik. Der bestehende Generator bleibt die einzige ausführende Instanz.

## Prüfung

- bestehende Generatorprüfungen: 14 erfolgreich
- Baseline: 54 Songs, nächste sichere Nummer 12
- unvollständiges API-Paket: sicher abgelehnt
- V2-Referenzlauf: `runs/song-12-song-leitzentrale-v2-referenztest/`
- Referenzkatalog: 55 von 55 Songs
- Referenzsong Nummer 12 sichtbar
- sechs HM-Cover vollständig geladen, keine defekten Bilder
- V2-Startseite: eine Ordnerauswahl, null einzelne Datei-Inputs
- Generator bleibt bis zur vollständigen Ampelprüfung gesperrt

## Ergänzung: transparente HM-Vorschläge

- Die vorhandene HM-Auswertung aus `hm-suggestion-service.js` und `hm-rules.json` bleibt die einzige HM-Logik.
- Jeder Vorschlag zeigt HM-Bereich, tatsächlich erkannte Trefferwörter, eine kurze Begründung und den Bestätigungsstatus.
- Nach Haralds Bestätigung wird der Status je Bereich sichtbar aktualisiert.
- Ohne bestätigte HM-Auswahl bleibt der Generator gesperrt.
- Kerntests einschließlich HM-Transparenz: 22 von 22 erfolgreich.

## Sicherheitsstatus

- Serverbindung ausschließlich `127.0.0.1`
- fremde Hosts und Browser-Ursprünge werden abgelehnt
- maximale lokale Übertragungsgröße 40 MiB
- temporäre Upload-Dateien werden nach dem Generatorlauf entfernt
- keine produktiven Änderungen
- keine GitHub- oder Google-Sites-Änderungen
- kein Commit

## Praxistest-Korrektur: vollständige Testkopie

Beim ersten V2-Praxistest war der neue Song zwar korrekt in Player, Coverliste, Explorer und Katalog eingetragen. Die Startseite der Testkopie lud jedoch weiterhin die drei veröffentlichten GitHub-Seiten. Dadurch zeigte sie den unveränderten öffentlichen Stand.

Korrektur:

- Der bestehende Generator ersetzt in jeder neuen Testkopie die drei externen Iframe-Adressen durch lokale Verknüpfungen.
- Der bereits erzeugte Lauf `runs/song-12-das-wir-gewinnt/` wurde entsprechend repariert und seine `DATEILISTE.json` aktualisiert.
- Song 12 ist im Explorer sichtbar und auswählbar.
- Player enthält MP3 und JPG von Song 12.
- Songtextdatei und Katalogeintrag verwenden ebenfalls Nummer 12.
- Generator-Regressionstest: 21 Prüfungen erfolgreich.
- Keine Produktivdatei, GitHub-Seite oder Google-Sites-Seite wurde verändert.

### Abnahmestatus

Die technische Korrektur ist umgesetzt, aber der vollständige Sicht- und Hörtest wurde noch nicht durch Harald bestätigt. Bis zu diesem erneuten Praxistest bleibt die vollständige Einpflege von Song 12 ein offener Punkt und die erste Priorität des nächsten Arbeitsbeginns. Siehe `UEBERGABE_2026-07-01.md`.
