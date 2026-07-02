# Übergabe – Song Upgrade V1C

## Tagesabschluss 30.06.2026

Arbeitsabschnitte 3 und 4 sind abgeschlossen. Song 59 `Das WIR gewinnt` wurde in einer isolierten Testkopie vollständig integriert. Harald hat Wiedergabe, Cover, Songtext, Explorer/HM und Sternkennzeichnung praktisch validiert.

## Morgen zuerst

1. Hauptstatus und diesen Übergabebericht lesen.
2. Testkopie und GoFullPage-Nachweis als Referenz beibehalten.
3. Umfang des finalen Einpflege-Moduls in kleine, prüfbare Dienste zerlegen.
4. mit dynamischer Baseline, Nummern-/Indexermittlung und Kollisionsprüfung beginnen.
5. erst danach Generatoren für Testkopie und Upload-Paket entwickeln.

## Verlässliche Referenzwerte

- produktiver Ausgangsbestand: 54 Songs
- Referenz-Testbestand: 55 Songs
- neuer Referenzsong: Nr. 59, Index 54, ID `song-55`
- bestätigte HM-Zuordnung des Referenzsongs: 01–05
- Stern: Ja
- historischer Stand vom 30.06.: Nummern 12, 14, 20 und 54 nicht nachträglich verwenden

Hinweis vom 01.07.2026: Diese frühere Regel wurde durch Harald ausdrücklich ersetzt. Ab Arbeitsabschnitt 5 werden vollständig geprüfte Lücken zuerst aufgefüllt; maßgeblich ist die aktuelle Abschlussdokumentation.

## Technische Stolperstellen

- Playlistposition und `data-song-index` sind nullbasiert und müssen synchron bleiben.
- Katalog-ID folgt der Playlistposition, nicht der sichtbaren Songnummer.
- Songtext aus dem TXT-Inhalt analysieren, Titel nicht als HM-Signal verwenden.
- URL-Pfade mit Leerzeichen genau einmal codieren.
- TXT-`fetch()` nicht über `file:///` testen; immer lokalen HTTP-Server verwenden.
- Autoplay kann browserseitig blockiert werden; manueller Playerstart bleibt ein eigener Prüfschritt.

## Abgrenzung

- Arbeitsabschnitt 5 ist noch nicht begonnen.
- keine GitHub-Übernahme erfolgt.
- keine Google-Sites-Änderung erfolgt.
- kein Commit erstellt.
- TTS bleibt ein späteres, getrenntes Projekt.

## Referenzdateien

- `SONG_UPGRADE_V1C_STATUS.md`
- `README.md`
- `test-integration-song-59/TESTINTEGRATION_BERICHT.md`
- `test-integration-song-59/START_LOKALTEST.cmd`
- `test-integration-song-59/nachweise/Arbeitsabschnitt_4_GoFullPage_Nachweis.pdf`

Fortsetzung: 01.07.2026 ab 10:00 Uhr.
