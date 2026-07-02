# PulseDE - Übergabe 01.07.2026

## Sitzungsabschluss

Grund: verbleibendes 5-Stunden-Kontingent 9 %. Es wird heute keine neue Entwicklung mehr begonnen.

Der Projektstand liegt vollständig lokal unter `Song_Upgrade_V1C/`. Produktive Originaldateien, GitHub und Google Sites wurden nicht verändert. Es wurde kein Commit erstellt.

## Erste Priorität beim nächsten Arbeitsbeginn

Den vollständigen Praxistest für Song 12 `Das WIR gewinnt` gemeinsam erneut durchführen und erst danach abschließen.

Zu bestätigen:

1. Song 12 erscheint in der erzeugten Testkopie in allen bestätigten HM-Bereichen.
2. Song 12 ist auswählbar.
3. MP3 und Cover werden im Player geladen.
4. Der Song ist abspielbar.
5. Der passende Songtext wird angezeigt.
6. Playlist, Coverliste, Explorer und V1B-Katalog enthalten Nummer 12 korrekt.

## Aktueller technischer Stand

Beim ersten Praxistest lud `PulseDE_Home_A1_TESTRAHMEN_V4.html` noch die drei veröffentlichten GitHub-Seiten. Der bestehende Generatorpfad wurde daraufhin so korrigiert, dass Testkopien lokale Player-, Songtext- und Explorer-Dateien laden.

Die bereits erzeugte Testkopie `runs/song-12-das-wir-gewinnt/testkopie/` wurde ebenfalls angepasst. Technisch geprüft wurden drei lokale Iframe-Verknüpfungen, keine externe GitHub-Verknüpfung, vorhandene MP3/JPG/TXT-Dateien sowie Einträge in Player, Coverliste, Explorer und Katalog.

Wichtig: Diese Korrektur ist noch nicht durch Haralds erneuten vollständigen Praxistest bestätigt. Der Punkt bleibt daher offen und hat am nächsten Arbeitsbeginn Vorrang.

## Prüfstand

- Generator: 21 Prüfungen erfolgreich
- HM-/Kerntests: 22 von 22 erfolgreich
- Song 12 im lokalen Explorer technisch sichtbar und auswählbar
- vollständige menschliche Sicht- und Hörprüfung: offen

## Einstieg beim nächsten Termin

1. Verbleibendes Kontingent anhand des neuen Screens prüfen.
2. `START_EINPFLEGE.cmd` starten.
3. Vorhandene Testkopie von Song 12 mit `Strg+F5` neu laden.
4. Die sechs oben genannten Punkte nacheinander prüfen.
5. Bei einem Fehler ausschließlich den bestehenden Generatorpfad untersuchen; keine neue Nummern- oder HM-Logik entwickeln.
6. Erst nach erfolgreichem Sicht- und Hörtest den Praxistest als abgeschlossen dokumentieren.

## Sicherheitsstatus

- keine produktiven Originaldateien überschrieben
- keine GitHub-Änderung
- kein Commit
- keine Google-Sites-Änderung
- vorhandene Generator- und HM-Logik beibehalten
